from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.models.file import FileType
from app.schemas.order import OrderCreate, OrderUpdate
from app.schemas.timeline import TimelineAppendRequest


class AgentOrderCreateRequest(OrderCreate):
    initial_timeline_note: Optional[str] = None


class AgentOrderUpdateRequest(OrderUpdate):
    timeline_note: Optional[str] = None


class AgentFileCreateRequest(BaseModel):
    filename_original: str
    filename_saved: Optional[str] = None
    file_size: int = 0
    file_type: FileType = FileType.delivery
    file_hash: Optional[str] = None
    oss_key: Optional[str] = None
    is_uploaded: bool = True
    is_selected: bool = True
    extra: Dict[str, Any] = Field(default_factory=dict)


class AgentFullOrderResponse(BaseModel):
    order: Dict[str, Any]
    files: List[Dict[str, Any]]
    timeline: List[Dict[str, Any]]


class AgentTimelineRequest(TimelineAppendRequest):
    pass
