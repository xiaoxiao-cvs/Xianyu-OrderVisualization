from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from app.models.order import OrderStatus


class OrderBase(BaseModel):
    client_name: str
    description: Optional[str] = None
    status: OrderStatus = OrderStatus.temp
    expires_at: Optional[datetime] = None


class OrderCreate(OrderBase):
    pass


class OrderUpdate(BaseModel):
    client_name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[OrderStatus] = None
    expires_at: Optional[datetime] = None
    xianyu_order_id: Optional[str] = None


class OrderResponse(OrderBase):
    id: int
    access_key: str
    xianyu_order_id: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    total: int
    items: list[OrderResponse]


# 订单转正请求
class OrderConvertRequest(BaseModel):
    """POST /api/v1/orders/convert 请求体"""
    access_key: str = Field(..., description="订单访问密钥 (Hash)")
    xianyu_order_id: str = Field(..., min_length=10, description="闲鱼订单号")
    selected_file_ids: List[int] = Field(default=[], description="被选中保留的文件ID列表")
    delete_unselected: bool = Field(default=False, description="是否删除未选中的文件")
    notes: Optional[str] = Field(default=None, description="订单备注")
