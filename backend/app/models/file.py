from sqlalchemy import Column, Integer, String, BigInteger, ForeignKey, DateTime, Enum as SQLEnum
from datetime import datetime
import enum
from app.db.session import Base


class FileType(str, enum.Enum):
    req = "req"  # Requirement file
    source = "source"  # Source code file


class File(Base):
    __tablename__ = "files"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    filename_original = Column(String(255), nullable=False)
    filename_saved = Column(String(255), nullable=False)  # UUID-based filename
    file_size = Column(BigInteger, nullable=False)
    file_type = Column(SQLEnum(FileType), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
