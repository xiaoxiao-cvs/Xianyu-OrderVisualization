from sqlalchemy import Column, Integer, String, Text, DateTime, Enum as SQLEnum
from datetime import datetime
import enum
from app.db.session import Base


class OrderStatus(str, enum.Enum):
    pending = "pending"
    dev = "dev"
    delivered = "delivered"


class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    access_key = Column(String(12), unique=True, nullable=False, index=True)
    client_name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.pending, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=True)
