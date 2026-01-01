from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AccessLogBase(BaseModel):
    order_id: int
    ip_address: str
    user_agent: Optional[str] = None
    action_type: str
    target_file: Optional[str] = None


class AccessLogCreate(AccessLogBase):
    pass


class AccessLogResponse(AccessLogBase):
    id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True


class AccessLogListResponse(BaseModel):
    total: int
    logs: list[AccessLogResponse]
