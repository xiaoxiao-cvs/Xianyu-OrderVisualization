import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_service_scope
from app.core.status_machine import apply_status_transition
from app.db.session import get_db
from app.models.file import File
from app.models.order import Order, OrderStatus
from app.models.timeline import OrderTimeline, TimelineActor, TimelineEventType
from app.schemas.agent import (
    AgentFileCreateRequest,
    AgentFullOrderResponse,
    AgentOrderCreateRequest,
    AgentOrderUpdateRequest,
    AgentTimelineRequest,
)
from app.schemas.order import OrderResponse
from app.schemas.timeline import TimelineResponse

router = APIRouter()


def _timeline(order_id: int, event_type: TimelineEventType, event_data: dict) -> OrderTimeline:
    return OrderTimeline(
        order_id=order_id,
        event_type=event_type,
        actor=TimelineActor.ai_agent,
        event_data=event_data,
    )


async def _get_order(db: AsyncSession, order_id: int) -> Order:
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def agent_create_order(
    payload: AgentOrderCreateRequest,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_service_scope("agent:orders")),
):
    data = payload.model_dump(exclude_unset=True)
    note = data.pop("initial_timeline_note", None)
    order = Order(**data)
    if order.status is None:
        order.status = OrderStatus.draft
    db.add(order)
    await db.flush()

    db.add(
        _timeline(
            order.id,
            TimelineEventType.ai_action,
            {"action": "agent_create_order", "note": note},
        )
    )

    await db.commit()
    await db.refresh(order)
    return order


@router.patch("/orders/{order_id}", response_model=OrderResponse)
async def agent_update_order(
    order_id: int,
    payload: AgentOrderUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_service_scope("agent:orders")),
):
    order = await _get_order(db, order_id)
    data = payload.model_dump(exclude_unset=True)
    note = data.pop("timeline_note", None)

    target_status = data.pop("status", None)
    if target_status:
        apply_status_transition(order, target_status, override=True)
        db.add(
            _timeline(
                order.id,
                TimelineEventType.status_change,
                {"to": target_status.value, "override": True, "note": note},
            )
        )

    for key, value in data.items():
        setattr(order, key, value)

    if note and not target_status:
        db.add(_timeline(order.id, TimelineEventType.note, {"note": note}))

    await db.commit()
    await db.refresh(order)
    return order


@router.post("/orders/{order_id}/files", status_code=status.HTTP_201_CREATED)
async def agent_create_file(
    order_id: int,
    payload: AgentFileCreateRequest,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_service_scope("agent:orders")),
):
    order = await _get_order(db, order_id)
    filename_saved = payload.filename_saved or f"{uuid.uuid4()}-{payload.filename_original}"

    db_file = File(
        order_id=order.id,
        filename_original=payload.filename_original,
        filename_saved=filename_saved,
        file_size=payload.file_size,
        file_type=payload.file_type,
        file_hash=payload.file_hash,
        oss_key=payload.oss_key,
        is_uploaded=payload.is_uploaded,
        is_selected=payload.is_selected,
    )
    db.add(db_file)
    await db.flush()

    db.add(
        _timeline(
            order.id,
            TimelineEventType.file_upload,
            {
                "file_id": db_file.id,
                "filename": db_file.filename_original,
                "file_type": db_file.file_type.value,
                "extra": payload.extra,
            },
        )
    )
    await db.commit()
    return {"file_id": db_file.id}


@router.post("/orders/{order_id}/timeline", response_model=TimelineResponse, status_code=status.HTTP_201_CREATED)
async def agent_append_timeline(
    order_id: int,
    payload: AgentTimelineRequest,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_service_scope("agent:orders")),
):
    await _get_order(db, order_id)
    event = OrderTimeline(
        order_id=order_id,
        event_type=payload.event_type,
        actor=payload.actor or TimelineActor.ai_agent,
        event_data=payload.event_data,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


@router.get("/orders/{order_id}/full", response_model=AgentFullOrderResponse)
async def agent_get_order_full(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_service_scope("agent:orders")),
):
    order = await _get_order(db, order_id)
    files = (await db.execute(select(File).where(File.order_id == order_id))).scalars().all()
    timeline = (
        await db.execute(
            select(OrderTimeline)
            .where(OrderTimeline.order_id == order_id)
            .order_by(OrderTimeline.created_at.desc())
        )
    ).scalars().all()

    return {
        "order": {
            "id": order.id,
            "status": order.status.value,
            "client_name": order.client_name,
            "requirements": order.requirements,
        },
        "files": [
            {
                "id": item.id,
                "filename_original": item.filename_original,
                "file_type": item.file_type.value,
                "oss_key": item.oss_key,
            }
            for item in files
        ],
        "timeline": [
            {
                "id": item.id,
                "event_type": item.event_type.value,
                "actor": item.actor.value,
                "event_data": item.event_data,
                "created_at": item.created_at,
            }
            for item in timeline
        ],
    }
