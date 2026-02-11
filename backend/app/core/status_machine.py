from dataclasses import dataclass
from datetime import datetime
from typing import Dict, Set

from app.models.order import Order, OrderStatus


ALLOWED_TRANSITIONS: Dict[OrderStatus, Set[OrderStatus]] = {
    OrderStatus.draft: {OrderStatus.collecting, OrderStatus.cancelled, OrderStatus.expired},
    OrderStatus.collecting: {OrderStatus.collected, OrderStatus.cancelled, OrderStatus.expired},
    OrderStatus.collected: {OrderStatus.quoted, OrderStatus.collecting, OrderStatus.cancelled, OrderStatus.expired},
    OrderStatus.quoted: {OrderStatus.confirmed, OrderStatus.collecting, OrderStatus.cancelled, OrderStatus.expired},
    OrderStatus.confirmed: {OrderStatus.repo_created, OrderStatus.cancelled, OrderStatus.expired},
    OrderStatus.repo_created: {OrderStatus.coding, OrderStatus.cancelled, OrderStatus.expired},
    OrderStatus.coding: {OrderStatus.testing, OrderStatus.cancelled, OrderStatus.expired},
    OrderStatus.testing: {OrderStatus.code_review, OrderStatus.revision, OrderStatus.cancelled, OrderStatus.expired},
    OrderStatus.code_review: {OrderStatus.revision, OrderStatus.ready, OrderStatus.cancelled, OrderStatus.expired},
    OrderStatus.revision: {OrderStatus.testing, OrderStatus.code_review, OrderStatus.cancelled, OrderStatus.expired},
    OrderStatus.ready: {OrderStatus.delivered, OrderStatus.cancelled, OrderStatus.expired},
    OrderStatus.delivered: {OrderStatus.accepted, OrderStatus.disputed, OrderStatus.expired},
    OrderStatus.accepted: set(),
    OrderStatus.disputed: {OrderStatus.revision, OrderStatus.ready, OrderStatus.cancelled, OrderStatus.accepted},
    OrderStatus.cancelled: set(),
    OrderStatus.expired: set(),
}


@dataclass
class TransitionDecision:
    allowed: bool
    reason: str


class InvalidStatusTransition(ValueError):
    pass


def can_transition(current: OrderStatus, target: OrderStatus) -> TransitionDecision:
    if current == target:
        return TransitionDecision(allowed=True, reason="状态未变化")

    allowed_set = ALLOWED_TRANSITIONS.get(current, set())
    if target in allowed_set:
        return TransitionDecision(allowed=True, reason="合法状态流转")
    return TransitionDecision(allowed=False, reason=f"不允许从 {current.value} 跳转到 {target.value}")


def apply_status_transition(
    order: Order,
    target: OrderStatus,
    *,
    override: bool = False,
) -> None:
    decision = can_transition(order.status, target)
    if not decision.allowed and not override:
        raise InvalidStatusTransition(decision.reason)

    now = datetime.utcnow()
    order.status = target
    if target == OrderStatus.confirmed:
        order.confirmed_at = now
    elif target == OrderStatus.delivered:
        order.delivered_at = now
    elif target == OrderStatus.accepted:
        order.accepted_at = now
    elif target == OrderStatus.cancelled:
        order.cancelled_at = now
