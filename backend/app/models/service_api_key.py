from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, JSON, String

from app.db.session import Base


class ServiceApiKey(Base):
    __tablename__ = "service_api_keys"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    key_hash = Column(String(128), nullable=False, unique=True, index=True)
    scopes = Column(JSON, nullable=False, default=list)
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    last_used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
