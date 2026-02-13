from datetime import datetime, timedelta
from typing import Dict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_admin
from app.core.status_machine import apply_status_transition
from app.db.session import get_db
from app.models.order import Order, OrderStatus
from app.models.timeline import OrderTimeline, TimelineActor, TimelineEventType
from app.models.xianyu_account import XianyuAccount
from app.schemas.dashboard import (
    BatchActionRequest,
    BatchActionResponse,
    DashboardMetricsResponse,
    XianyuAccountCreate,
    XianyuAccountResponse,
    XianyuAccountUpdate,
)

router = APIRouter()


IN_PROGRESS_STATUSES = {
    OrderStatus.collecting,
    OrderStatus.collected,
    OrderStatus.quoted,
    OrderStatus.confirmed,
    OrderStatus.repo_created,
    OrderStatus.coding,
    OrderStatus.testing,
    OrderStatus.code_review,
    OrderStatus.revision,
    OrderStatus.ready,
}


@router.get("/metrics", response_model=DashboardMetricsResponse)
async def get_dashboard_metrics(
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin),
):
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    thirty_days_ago = now - timedelta(days=30)

    total_orders = (await db.execute(select(func.count(Order.id)))).scalar() or 0
    in_progress_orders = (
        await db.execute(select(func.count(Order.id)).where(Order.status.in_(IN_PROGRESS_STATUSES)))
    ).scalar() or 0
    completed_this_month = (
        await db.execute(
            select(func.count(Order.id)).where(
                Order.status.in_([OrderStatus.delivered, OrderStatus.accepted]),
                Order.updated_at >= month_start,
            )
        )
    ).scalar() or 0
    monthly_revenue = (
        await db.execute(
            select(func.coalesce(func.sum(Order.price), 0.0)).where(
                Order.updated_at >= month_start,
                Order.status.in_([OrderStatus.delivered, OrderStatus.accepted]),
            )
        )
    ).scalar() or 0.0
    ai_cost_total = (await db.execute(select(func.coalesce(func.sum(Order.ai_cost), 0.0)))).scalar() or 0.0
    estimated_profit = float(monthly_revenue) - float(ai_cost_total)

    status_rows = (await db.execute(select(Order.status, func.count(Order.id)).group_by(Order.status))).all()
    status_distribution = [{"status": row[0].value, "count": row[1]} for row in status_rows]

    trend_rows = (
        await db.execute(
            select(
                func.strftime("%Y-%m-%d", Order.updated_at).label("day"),
                func.coalesce(func.sum(Order.price), 0.0).label("revenue"),
            )
            .where(
                Order.updated_at >= thirty_days_ago,
                Order.status.in_([OrderStatus.delivered, OrderStatus.accepted]),
            )
            .group_by("day")
            .order_by("day")
        )
    ).all()
    trend_map: Dict[str, float] = {row[0]: float(row[1] or 0.0) for row in trend_rows}
    revenue_trend = []
    for offset in range(30):
        day = (thirty_days_ago + timedelta(days=offset)).strftime("%Y-%m-%d")
        revenue_trend.append({"date": day, "revenue": trend_map.get(day, 0.0)})

    return {
        "total_orders": total_orders,
        "in_progress_orders": in_progress_orders,
        "completed_this_month": completed_this_month,
        "monthly_revenue": float(monthly_revenue),
        "ai_cost_total": float(ai_cost_total),
        "estimated_profit": estimated_profit,
        "status_distribution": status_distribution,
        "revenue_trend": revenue_trend,
    }


@router.post("/batch", response_model=BatchActionResponse)
async def batch_action(
    payload: BatchActionRequest,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin),
):
    success_count = 0
    failed_ids = []

    for order_id in payload.order_ids:
        order = (await db.execute(select(Order).where(Order.id == order_id))).scalar_one_or_none()
        if order is None:
            failed_ids.append(order_id)
            continue

        try:
            if payload.action == "approve":
                apply_status_transition(order, OrderStatus.ready, override=True)
            elif payload.action == "deliver":
                apply_status_transition(order, OrderStatus.delivered, override=True)
            elif payload.action == "close_expired":
                apply_status_transition(order, OrderStatus.expired, override=True)
            else:
                failed_ids.append(order_id)
                continue

            db.add(
                OrderTimeline(
                    order_id=order.id,
                    event_type=TimelineEventType.status_change,
                    actor=TimelineActor.admin,
                    event_data={"action": payload.action, "note": payload.note},
                )
            )
            success_count += 1
        except Exception:
            failed_ids.append(order_id)

    await db.commit()
    return {"success_count": success_count, "failed_ids": failed_ids}


@router.get("/recent-activity")
async def get_recent_activity(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin),
):
    """获取全局最近的时间线事件（系统日志），用于右侧活动面板"""
    rows = (
        await db.execute(
            select(OrderTimeline)
            .order_by(OrderTimeline.created_at.desc())
            .limit(limit)
        )
    ).scalars().all()

    items = []
    for row in rows:
        # fetch order client_name for context
        order = (await db.execute(select(Order.client_name, Order.id).where(Order.id == row.order_id))).first()
        items.append({
            "id": row.id,
            "order_id": row.order_id,
            "order_name": order[0] if order else f"#{row.order_id}",
            "event_type": row.event_type.value if hasattr(row.event_type, 'value') else str(row.event_type),
            "event_data": row.event_data,
            "actor": row.actor.value if hasattr(row.actor, 'value') else str(row.actor),
            "created_at": row.created_at.isoformat() if row.created_at else None,
        })
    return {"items": items}


@router.get("/xianyu-accounts", response_model=list[XianyuAccountResponse])
async def list_xianyu_accounts(
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin),
):
    accounts = (await db.execute(select(XianyuAccount).order_by(XianyuAccount.created_at.desc()))).scalars().all()
    return accounts


@router.post("/xianyu-accounts", response_model=XianyuAccountResponse, status_code=status.HTTP_201_CREATED)
async def create_xianyu_account(
    payload: XianyuAccountCreate,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin),
):
    exists = await db.execute(select(XianyuAccount.id).where(XianyuAccount.account_name == payload.account_name))
    if exists.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account already exists")
    account = XianyuAccount(**payload.model_dump())
    db.add(account)
    await db.commit()
    await db.refresh(account)
    return account


@router.patch("/xianyu-accounts/{account_id}", response_model=XianyuAccountResponse)
async def update_xianyu_account(
    account_id: int,
    payload: XianyuAccountUpdate,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin),
):
    account = (await db.execute(select(XianyuAccount).where(XianyuAccount.id == account_id))).scalar_one_or_none()
    if account is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(account, key, value)
    await db.commit()
    await db.refresh(account)
    return account
