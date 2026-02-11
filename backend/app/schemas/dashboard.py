from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class StatusDistributionItem(BaseModel):
    status: str
    count: int


class RevenueTrendItem(BaseModel):
    date: str
    revenue: float


class DashboardMetricsResponse(BaseModel):
    total_orders: int
    in_progress_orders: int
    completed_this_month: int
    monthly_revenue: float
    ai_cost_total: float
    estimated_profit: float
    status_distribution: List[StatusDistributionItem]
    revenue_trend: List[RevenueTrendItem]


class BatchActionRequest(BaseModel):
    action: Literal["approve", "deliver", "close_expired"]
    order_ids: List[int] = Field(default_factory=list)
    note: Optional[str] = None


class BatchActionResponse(BaseModel):
    success_count: int
    failed_ids: List[int]


class XianyuAccountBase(BaseModel):
    account_name: str
    status: str = "offline"
    cookie_updated_at: Optional[datetime] = None
    message_count: int = 0
    linked_order_count: int = 0
    risk_flag: bool = False


class XianyuAccountCreate(XianyuAccountBase):
    pass


class XianyuAccountUpdate(BaseModel):
    status: Optional[str] = None
    cookie_updated_at: Optional[datetime] = None
    message_count: Optional[int] = None
    linked_order_count: Optional[int] = None
    risk_flag: Optional[bool] = None


class XianyuAccountResponse(XianyuAccountBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
