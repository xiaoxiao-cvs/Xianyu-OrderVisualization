from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String

from app.db.session import Base


class XianyuAccount(Base):
    __tablename__ = "xianyu_accounts"

    id = Column(Integer, primary_key=True, index=True)
    account_name = Column(String(100), nullable=False, unique=True, index=True)
    status = Column(String(20), nullable=False, default="offline", index=True)
    cookie_updated_at = Column(DateTime, nullable=True)
    message_count = Column(Integer, nullable=False, default=0)
    linked_order_count = Column(Integer, nullable=False, default=0)
    risk_flag = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
