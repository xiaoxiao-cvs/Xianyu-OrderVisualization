from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_service_scope
from app.core.status_machine import apply_status_transition
from app.db.session import get_db
from app.models.order import Order, OrderStatus
from app.models.timeline import OrderTimeline, TimelineActor, TimelineEventType
from app.models.webhook_event import WebhookEvent
from app.schemas.webhook import (
    AgentUpdateEvent,
    CodexProgressEvent,
    CodexResultEvent,
    WebhookAck,
    XianyuMessageEvent,
)

router = APIRouter()


async def _try_record_event(db: AsyncSession, source: str, event_id: str, payload: dict) -> bool:
    existing = await db.execute(
        select(WebhookEvent).where(
            WebhookEvent.source == source,
            WebhookEvent.event_id == event_id,
        )
    )
    if existing.scalar_one_or_none() is not None:
        return False
    db.add(WebhookEvent(source=source, event_id=event_id, payload=payload))
    await db.flush()
    return True


def _timeline(order_id: int, event_type: TimelineEventType, actor: TimelineActor, event_data: dict) -> OrderTimeline:
    return OrderTimeline(
        order_id=order_id,
        event_type=event_type,
        actor=actor,
        event_data=event_data,
    )


@router.post("/xianyu-message", response_model=WebhookAck)
async def webhook_xianyu_message(
    event: XianyuMessageEvent,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_service_scope("webhook:xianyu")),
):
    created = await _try_record_event(db, "xianyu-message", event.event_id, event.model_dump())
    if not created:
        await db.commit()
        return {"status": "ok", "duplicate": True, "message": "duplicate event"}

    order = None
    if event.order_id:
        order = (await db.execute(select(Order).where(Order.id == event.order_id))).scalar_one_or_none()
    elif event.access_key:
        order = (await db.execute(select(Order).where(Order.access_key == event.access_key))).scalar_one_or_none()

    if order is None:
        order = Order(
            access_key=event.access_key or f"draft-{event.event_id[:10]}",
            client_name=event.client_name,
            description=event.message,
            status=OrderStatus.draft,
            xianyu_account=event.xianyu_account,
        )
        db.add(order)
        await db.flush()

    db.add(
        _timeline(
            order.id,
            TimelineEventType.message,
            TimelineActor.customer,
            {"message": event.message, "xianyu_account": event.xianyu_account},
        )
    )

    await db.commit()
    return {"status": "ok", "order_id": order.id}


@router.post("/agent-update", response_model=WebhookAck)
async def webhook_agent_update(
    event: AgentUpdateEvent,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_service_scope("webhook:agent")),
):
    created = await _try_record_event(db, "agent-update", event.event_id, event.model_dump())
    if not created:
        await db.commit()
        return {"status": "ok", "duplicate": True, "message": "duplicate event"}

    order = (await db.execute(select(Order).where(Order.id == event.order_id))).scalar_one_or_none()
    if order is None:
        await db.commit()
        return {"status": "ignored", "message": "order not found", "order_id": event.order_id}

    if event.status:
        previous = order.status
        apply_status_transition(order, event.status, override=True)
        db.add(
            _timeline(
                order.id,
                TimelineEventType.status_change,
                TimelineActor.ai_agent,
                {"from": previous.value, "to": order.status.value, "note": event.note},
            )
        )

    if event.requirements:
        order.requirements = event.requirements
        db.add(
            _timeline(
                order.id,
                TimelineEventType.ai_action,
                TimelineActor.ai_agent,
                {"action": "requirements_update"},
            )
        )

    await db.commit()
    return {"status": "ok", "order_id": order.id}


@router.post("/codex-progress", response_model=WebhookAck)
async def webhook_codex_progress(
    event: CodexProgressEvent,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_service_scope("webhook:codex")),
):
    created = await _try_record_event(db, "codex-progress", event.event_id, event.model_dump())
    if not created:
        await db.commit()
        return {"status": "ok", "duplicate": True, "message": "duplicate event"}

    order = (await db.execute(select(Order).where(Order.id == event.order_id))).scalar_one_or_none()
    if order is None:
        await db.commit()
        return {"status": "ignored", "message": "order not found", "order_id": event.order_id}

    db.add(
        _timeline(
            order.id,
            TimelineEventType.ai_action,
            TimelineActor.ai_agent,
            {"progress": event.progress, "stage": event.stage},
        )
    )
    await db.commit()
    return {"status": "ok", "order_id": order.id}


@router.post("/codex-result", response_model=WebhookAck)
async def webhook_codex_result(
    event: CodexResultEvent,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_service_scope("webhook:codex")),
):
    created = await _try_record_event(db, "codex-result", event.event_id, event.model_dump())
    if not created:
        await db.commit()
        return {"status": "ok", "duplicate": True, "message": "duplicate event"}

    order = (await db.execute(select(Order).where(Order.id == event.order_id))).scalar_one_or_none()
    if order is None:
        await db.commit()
        return {"status": "ignored", "message": "order not found", "order_id": event.order_id}

    previous = order.status
    target_status = OrderStatus.code_review if event.success else OrderStatus.revision
    apply_status_transition(order, target_status, override=True)
    db.add(
        _timeline(
            order.id,
            TimelineEventType.status_change,
            TimelineActor.ai_agent,
            {
                "from": previous.value,
                "to": target_status.value,
                "summary": event.summary,
                "artifacts": event.artifacts,
            },
        )
    )

    await db.commit()
    return {"status": "ok", "order_id": order.id}
