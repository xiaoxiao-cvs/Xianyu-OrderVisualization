from sqlalchemy import Column, Integer, String, Text, DateTime, Enum as SQLEnum
from datetime import datetime
import enum
from app.db.session import Base


class OrderStatus(str, enum.Enum):
    """订单状态枚举"""
    temp = "temp"          # 临时订单（客户上传文件但未绑定闲鱼订单）
    pending = "pending"    # 待开发
    dev = "dev"            # 开发中
    delivered = "delivered"  # 已交付
    expired = "expired"    # 已过期


class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    access_key = Column(String(12), unique=True, nullable=False, index=True)
    xianyu_order_id = Column(String(50), nullable=True, index=True)  # 闲鱼订单号，转正后填入
    client_name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.temp, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=True)
