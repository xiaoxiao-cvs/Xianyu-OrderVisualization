from sqlalchemy import Column, Integer, String, BigInteger, ForeignKey, DateTime, Enum as SQLEnum, Boolean
from datetime import datetime
import enum
from app.db.session import Base


class FileType(str, enum.Enum):
    req = "req"        # Requirement file (客户上传的需求文件)
    source = "source"  # Source code file (管理员上传的源码文件)


class File(Base):
    __tablename__ = "files"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    filename_original = Column(String(255), nullable=False)
    filename_saved = Column(String(255), nullable=False)  # UUID-based filename
    file_size = Column(BigInteger, nullable=False)
    file_type = Column(SQLEnum(FileType), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # OSS 相关字段
    file_hash = Column(String(64), nullable=True, index=True)  # SHA256 哈希，用于查重
    oss_key = Column(String(500), nullable=True)  # OSS 存储路径: temp_uploads/{hash}/{filename}
    is_uploaded = Column(Boolean, default=False, nullable=False)  # OSS 上传状态
    
    # 管理员选择标记
    is_selected = Column(Boolean, default=True, nullable=False)  # 转正时是否被选中保留
