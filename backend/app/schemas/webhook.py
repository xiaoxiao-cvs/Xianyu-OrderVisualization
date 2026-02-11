from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field

from app.models.order import OrderStatus


class WebhookAck(BaseModel):
    status: str
    duplicate: bool = False
    message: Optional[str] = None
    order_id: Optional[int] = None


class WebhookBaseEvent(BaseModel):
    event_id: str = Field(..., min_length=4)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    payload: Dict[str, Any] = Field(default_factory=dict)


class XianyuMessageEvent(WebhookBaseEvent):
    xianyu_account: str
    client_name: str
    message: str
    access_key: Optional[str] = None
    order_id: Optional[int] = None


class AgentUpdateEvent(WebhookBaseEvent):
    order_id: int
    status: Optional[OrderStatus] = None
    requirements: Optional[Dict[str, Any]] = None
    note: Optional[str] = None


class CodexProgressEvent(WebhookBaseEvent):
    order_id: int
    progress: float = Field(default=0, ge=0, le=100)
    stage: Optional[str] = None


class CodexResultEvent(WebhookBaseEvent):
    order_id: int
    success: bool
    summary: Optional[str] = None
    artifacts: Dict[str, Any] = Field(default_factory=dict)
