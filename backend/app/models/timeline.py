from datetime import datetime
import enum

from sqlalchemy import Column, DateTime, Enum as SQLEnum, ForeignKey, Integer, JSON, String

from app.db.session import Base


class TimelineEventType(str, enum.Enum):
    status_change = "status_change"
    message = "message"
    file_upload = "file_upload"
    screenshot = "screenshot"
    note = "note"
    ai_action = "ai_action"


class TimelineActor(str, enum.Enum):
    admin = "admin"
    ai_agent = "ai_agent"
    customer = "customer"
    system = "system"


class OrderTimeline(Base):
    __tablename__ = "order_timelines"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(SQLEnum(TimelineEventType), nullable=False, index=True)
    event_data = Column(JSON, nullable=False, default=dict)
    actor = Column(SQLEnum(TimelineActor), nullable=False, default=TimelineActor.system)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
