from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from datetime import datetime
from app.db.session import Base


class AccessLog(Base):
    __tablename__ = "access_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    ip_address = Column(String(45), nullable=False)  # IPv6 support
    user_agent = Column(String(500), nullable=True)
    action_type = Column(String(50), nullable=False)  # e.g., "VISIT_PAGE", "DOWNLOAD_SUCCESS"
    target_file = Column(String(255), nullable=True)  # Filename if action is download
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
