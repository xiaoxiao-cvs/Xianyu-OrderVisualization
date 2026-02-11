from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: int
    order_id: Optional[int]
    type: str
    title: str
    content: str
    channel: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    total: int
    unread: int
    items: List[NotificationResponse]
