from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.models.timeline import TimelineActor, TimelineEventType


class TimelineBase(BaseModel):
    event_type: TimelineEventType
    event_data: Dict[str, Any] = Field(default_factory=dict)
    actor: TimelineActor = TimelineActor.system


class TimelineCreate(TimelineBase):
    pass


class TimelineResponse(TimelineBase):
    id: int
    order_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class TimelineListResponse(BaseModel):
    total: int
    items: List[TimelineResponse]


class TimelineAppendRequest(BaseModel):
    event_type: TimelineEventType
    event_data: Dict[str, Any] = Field(default_factory=dict)
    actor: Optional[TimelineActor] = TimelineActor.system
