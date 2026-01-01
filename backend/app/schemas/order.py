from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.order import OrderStatus


class OrderBase(BaseModel):
    client_name: str
    description: Optional[str] = None
    status: OrderStatus = OrderStatus.pending
    expires_at: Optional[datetime] = None


class OrderCreate(OrderBase):
    pass


class OrderUpdate(BaseModel):
    client_name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[OrderStatus] = None
    expires_at: Optional[datetime] = None


class OrderResponse(OrderBase):
    id: int
    access_key: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    total: int
    items: list[OrderResponse]
