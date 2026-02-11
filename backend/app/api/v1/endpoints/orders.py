from datetime import datetime
import secrets
import string
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import String, and_, cast, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_admin
from app.core.status_machine import InvalidStatusTransition, apply_status_transition
from app.db.session import get_db
from app.models.file import File
from app.models.order import Order, OrderStatus, PriorityLevel, ProjectType
from app.models.timeline import OrderTimeline, TimelineActor, TimelineEventType
from app.schemas.file import FileListResponse
from app.schemas.order import (
    OrderCreate,
    OrderFullResponse,
    OrderListResponse,
    OrderResponse,
    OrderUpdate,
    StatusOverrideRequest,
    StatusUpdateRequest,
)
from app.schemas.timeline import TimelineAppendRequest, TimelineListResponse, TimelineResponse
from app.utils.notification import create_notification

router = APIRouter()


def generate_access_key(length: int = 16) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


async def _get_order_or_404(db: AsyncSession, order_id: int) -> Order:
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


async def _add_timeline(
    db: AsyncSession,
    order_id: int,
    event_type: TimelineEventType,
    actor: TimelineActor,
    event_data: dict,
) -> OrderTimeline:
    event = OrderTimeline(
        order_id=order_id,
        event_type=event_type,
        actor=actor,
        event_data=event_data,
    )
    db.add(event)
    await db.flush()
    return event


@router.get("/", response_model=OrderListResponse)
async def list_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status_filter: Optional[OrderStatus] = None,
    project_type: Optional[ProjectType] = None,
    priority: Optional[PriorityLevel] = None,
    xianyu_account: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    created_from: Optional[datetime] = None,
    created_to: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin),
):
    filters = []
    if status_filter:
        filters.append(Order.status == status_filter)
    if project_type:
        filters.append(Order.project_type == project_type)
    if priority:
        filters.append(Order.priority == priority)
    if xianyu_account:
        filters.append(Order.xianyu_account == xianyu_account)
    if created_from:
        filters.append(Order.created_at >= created_from)
    if created_to:
        filters.append(Order.created_at <= created_to)
    if tag:
        filters.append(
            or_(
                cast(Order.tags, String).like(f'%"{tag}"%'),
                cast(Order.custom_tags, String).like(f'%"{tag}"%'),
            )
        )
    if search:
        keyword = f"%{search}%"
        filters.append(
            or_(
                Order.client_name.like(keyword),
                Order.description.like(keyword),
                cast(Order.requirements, String).like(keyword),
                Order.github_repo_name.like(keyword),
                Order.xianyu_order_id.like(keyword),
            )
        )

    where_clause = and_(*filters) if filters else None

    query = select(Order)
    count_query = select(func.count(Order.id))
    if where_clause is not None:
        query = query.where(where_clause)
        count_query = count_query.where(where_clause)

    query = query.order_by(Order.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    items = result.scalars().all()

    total = (await db.execute(count_query)).scalar() or 0
    return {"total": total, "items": items}


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: OrderCreate,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin),
):
    access_key = payload.access_key
    if not access_key:
        while True:
            candidate = generate_access_key()
            exists = await db.execute(select(Order.id).where(Order.access_key == candidate))
            if exists.scalar_one_or_none() is None:
                access_key = candidate
                break

    data = payload.model_dump(exclude_unset=True)
    data.pop("access_key", None)
    order = Order(access_key=access_key, **data)
    db.add(order)
    await db.flush()

    await _add_timeline(
        db,
        order.id,
        TimelineEventType.status_change,
        TimelineActor.admin,
        {"from": None, "to": order.status.value, "note": "订单创建"},
    )
    await create_notification(
        db,
        order_id=order.id,
        type="order_created",
        title="新订单已创建",
        content=f"订单 #{order.id} 已创建，客户：{order.client_name}",
    )

    await db.commit()
    await db.refresh(order)
    return order


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin),
):
    return await _get_order_or_404(db, order_id)


@router.patch("/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: int,
    payload: OrderUpdate,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin),
):
    order = await _get_order_or_404(db, order_id)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(order, field, value)

    await _add_timeline(
        db,
        order.id,
        TimelineEventType.note,
        TimelineActor.admin,
        {"message": "管理员更新订单信息"},
    )
    await db.commit()
    await db.refresh(order)
    return order


@router.post("/{order_id}/status", response_model=OrderResponse)
async def update_status(
    order_id: int,
    payload: StatusUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin),
):
    order = await _get_order_or_404(db, order_id)
    previous_status = order.status
    try:
        apply_status_transition(order, payload.status, override=False)
    except InvalidStatusTransition as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    await _add_timeline(
        db,
        order.id,
        TimelineEventType.status_change,
        TimelineActor.admin,
        {"from": previous_status.value, "to": order.status.value, "note": payload.note},
    )
    await create_notification(
        db,
        order_id=order.id,
        type="status_change",
        title="订单状态已更新",
        content=f"订单 #{order.id}: {previous_status.value} -> {order.status.value}",
    )
    await db.commit()
    await db.refresh(order)
    return order


@router.post("/{order_id}/status/override", response_model=OrderResponse)
async def override_status(
    order_id: int,
    payload: StatusOverrideRequest,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin),
):
    order = await _get_order_or_404(db, order_id)
    previous_status = order.status
    apply_status_transition(order, payload.status, override=True)

    await _add_timeline(
        db,
        order.id,
        TimelineEventType.status_change,
        TimelineActor.admin,
        {
            "from": previous_status.value,
            "to": order.status.value,
            "override": True,
            "reason": payload.reason,
        },
    )
    await create_notification(
        db,
        order_id=order.id,
        type="status_override",
        title="订单状态被强制更新",
        content=f"订单 #{order.id} 强制更新为 {order.status.value}",
        channel="xianyu_stub",
    )
    await db.commit()
    await db.refresh(order)
    return order


@router.get("/{order_id}/timeline", response_model=TimelineListResponse)
async def get_timeline(
    order_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin),
):
    await _get_order_or_404(db, order_id)
    query = (
        select(OrderTimeline)
        .where(OrderTimeline.order_id == order_id)
        .order_by(OrderTimeline.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    items = (await db.execute(query)).scalars().all()
    total = (
        await db.execute(select(func.count(OrderTimeline.id)).where(OrderTimeline.order_id == order_id))
    ).scalar() or 0
    return {"total": total, "items": items}


@router.post("/{order_id}/timeline", response_model=TimelineResponse, status_code=status.HTTP_201_CREATED)
async def append_timeline(
    order_id: int,
    payload: TimelineAppendRequest,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin),
):
    await _get_order_or_404(db, order_id)
    event = await _add_timeline(
        db,
        order_id,
        payload.event_type,
        payload.actor or TimelineActor.system,
        payload.event_data,
    )
    await db.commit()
    await db.refresh(event)
    return event


@router.get("/{order_id}/full", response_model=OrderFullResponse)
async def get_order_full(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin),
):
    order = await _get_order_or_404(db, order_id)
    files = (await db.execute(select(File).where(File.order_id == order_id))).scalars().all()
    timeline = (
        await db.execute(
            select(OrderTimeline)
            .where(OrderTimeline.order_id == order_id)
            .order_by(OrderTimeline.created_at.desc())
        )
    ).scalars().all()
    return {
        "order": order,
        "files": [
            {
                "id": f.id,
                "order_id": f.order_id,
                "filename_original": f.filename_original,
                "filename_saved": f.filename_saved,
                "file_size": f.file_size,
                "file_type": f.file_type.value,
                "uploaded_at": f.uploaded_at,
                "file_hash": f.file_hash,
                "oss_key": f.oss_key,
                "is_uploaded": f.is_uploaded,
                "is_selected": f.is_selected,
            }
            for f in files
        ],
        "timeline": [
            {
                "id": t.id,
                "order_id": t.order_id,
                "event_type": t.event_type.value,
                "actor": t.actor.value,
                "event_data": t.event_data,
                "created_at": t.created_at,
            }
            for t in timeline
        ],
    }


@router.get("/by-hash/{access_key}", response_model=OrderResponse)
async def get_order_by_hash(
    access_key: str,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin),
):
    order = (await db.execute(select(Order).where(Order.access_key == access_key))).scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


@router.get("/{order_id}/files", response_model=FileListResponse)
async def get_order_files(
    order_id: int,
    include_unselected: bool = True,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin),
):
    await _get_order_or_404(db, order_id)
    query = select(File).where(File.order_id == order_id)
    if not include_unselected:
        query = query.where(File.is_selected.is_(True))
    query = query.order_by(File.uploaded_at.desc())
    files = (await db.execute(query)).scalars().all()
    return {"files": files}


@router.get("/by-hash/{access_key}/files", response_model=FileListResponse)
async def get_order_files_by_hash(
    access_key: str,
    include_unselected: bool = True,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin),
):
    order = (await db.execute(select(Order).where(Order.access_key == access_key))).scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    query = select(File).where(File.order_id == order.id)
    if not include_unselected:
        query = query.where(File.is_selected.is_(True))
    query = query.order_by(File.uploaded_at.desc())
    files = (await db.execute(query)).scalars().all()
    return {"files": files}


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin),
):
    order = await _get_order_or_404(db, order_id)
    await db.delete(order)
    await db.commit()
