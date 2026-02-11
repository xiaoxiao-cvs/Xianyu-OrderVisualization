from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.models.order import (
    BudgetRange,
    DifficultyLevel,
    OrderStatus,
    PriorityLevel,
    ProjectType,
)


class RequirementFeature(BaseModel):
    name: str
    description: Optional[str] = None


class RequirementPayload(BaseModel):
    summary: Optional[str] = None
    features: List[RequirementFeature] = Field(default_factory=list)
    references: List[str] = Field(default_factory=list)
    tech_preferences: List[str] = Field(default_factory=list)
    deliverables: List[str] = Field(default_factory=list)
    deadline: Optional[datetime] = None
    notes: Optional[str] = None


class OrderBase(BaseModel):
    client_name: str
    description: Optional[str] = None
    status: OrderStatus = OrderStatus.draft
    project_type: ProjectType = ProjectType.other
    difficulty: DifficultyLevel = DifficultyLevel.medium
    budget_range: BudgetRange = BudgetRange.standard
    priority: PriorityLevel = PriorityLevel.normal
    tags: List[str] = Field(default_factory=list)
    custom_tags: List[str] = Field(default_factory=list)
    requirements: RequirementPayload = Field(default_factory=RequirementPayload)
    github_repo_url: Optional[str] = None
    github_repo_name: Optional[str] = None
    xianyu_account: Optional[str] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    price: Optional[float] = None
    quoted_price: Optional[float] = None
    ai_conversation_id: Optional[str] = None
    ai_coding_task_id: Optional[str] = None
    ai_cost: Optional[float] = None
    expires_at: Optional[datetime] = None


class OrderCreate(OrderBase):
    access_key: Optional[str] = None
    xianyu_order_id: Optional[str] = None


class OrderUpdate(BaseModel):
    client_name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[OrderStatus] = None
    project_type: Optional[ProjectType] = None
    difficulty: Optional[DifficultyLevel] = None
    budget_range: Optional[BudgetRange] = None
    priority: Optional[PriorityLevel] = None
    tags: Optional[List[str]] = None
    custom_tags: Optional[List[str]] = None
    requirements: Optional[RequirementPayload] = None
    github_repo_url: Optional[str] = None
    github_repo_name: Optional[str] = None
    xianyu_account: Optional[str] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    price: Optional[float] = None
    quoted_price: Optional[float] = None
    ai_conversation_id: Optional[str] = None
    ai_coding_task_id: Optional[str] = None
    ai_cost: Optional[float] = None
    expires_at: Optional[datetime] = None
    xianyu_order_id: Optional[str] = None


class OrderResponse(OrderBase):
    id: int
    access_key: str
    xianyu_order_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    confirmed_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    total: int
    items: List[OrderResponse]


class OrderConvertRequest(BaseModel):
    access_key: str = Field(..., description="订单访问密钥 (Hash)")
    xianyu_order_id: str = Field(..., min_length=10, description="闲鱼订单号")
    selected_file_ids: List[int] = Field(default_factory=list, description="被选中保留的文件ID列表")
    delete_unselected: bool = Field(default=False, description="是否删除未选中的文件")
    notes: Optional[str] = Field(default=None, description="订单备注")


class OrderFullResponse(BaseModel):
    order: OrderResponse
    files: List[Dict[str, Any]] = Field(default_factory=list)
    timeline: List[Dict[str, Any]] = Field(default_factory=list)
