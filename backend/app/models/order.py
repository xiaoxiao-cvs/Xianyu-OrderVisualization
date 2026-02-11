from datetime import datetime
import enum

from sqlalchemy import (
    Column,
    DateTime,
    Enum as SQLEnum,
    Float,
    Integer,
    JSON,
    String,
    Text,
)

from app.db.session import Base


class OrderStatus(str, enum.Enum):
    draft = "draft"
    collecting = "collecting"
    collected = "collected"
    quoted = "quoted"
    confirmed = "confirmed"
    repo_created = "repo_created"
    coding = "coding"
    testing = "testing"
    code_review = "code_review"
    revision = "revision"
    ready = "ready"
    delivered = "delivered"
    accepted = "accepted"
    disputed = "disputed"
    cancelled = "cancelled"
    expired = "expired"


class ProjectType(str, enum.Enum):
    website = "website"
    miniapp = "miniapp"
    script = "script"
    crawler = "crawler"
    data_analysis = "data_analysis"
    automation = "automation"
    api_service = "api_service"
    mobile_app = "mobile_app"
    desktop_app = "desktop_app"
    other = "other"


class DifficultyLevel(str, enum.Enum):
    trivial = "trivial"
    easy = "easy"
    medium = "medium"
    hard = "hard"
    complex = "complex"


class BudgetRange(str, enum.Enum):
    budget = "budget"
    standard = "standard"
    premium = "premium"
    enterprise = "enterprise"


class PriorityLevel(str, enum.Enum):
    urgent = "urgent"
    high = "high"
    normal = "normal"
    low = "low"


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    access_key = Column(String(32), unique=True, nullable=False, index=True)
    xianyu_order_id = Column(String(64), nullable=True, index=True)
    client_name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)

    status = Column(SQLEnum(OrderStatus), default=OrderStatus.draft, nullable=False, index=True)
    project_type = Column(SQLEnum(ProjectType), default=ProjectType.other, nullable=False, index=True)
    difficulty = Column(SQLEnum(DifficultyLevel), default=DifficultyLevel.medium, nullable=False)
    budget_range = Column(SQLEnum(BudgetRange), default=BudgetRange.standard, nullable=False, index=True)
    priority = Column(SQLEnum(PriorityLevel), default=PriorityLevel.normal, nullable=False, index=True)

    tags = Column(JSON, nullable=False, default=list)
    custom_tags = Column(JSON, nullable=False, default=list)
    requirements = Column(JSON, nullable=False, default=dict)

    github_repo_url = Column(String(500), nullable=True)
    github_repo_name = Column(String(200), nullable=True, index=True)
    xianyu_account = Column(String(100), nullable=True, index=True)

    estimated_hours = Column(Float, nullable=True)
    actual_hours = Column(Float, nullable=True)
    price = Column(Float, nullable=True)
    quoted_price = Column(Float, nullable=True)

    ai_conversation_id = Column(String(128), nullable=True, index=True)
    ai_coding_task_id = Column(String(128), nullable=True, index=True)
    ai_cost = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    confirmed_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    accepted_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
