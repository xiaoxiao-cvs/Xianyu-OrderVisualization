from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from app.models.file import FileType


class FileBase(BaseModel):
    filename_original: str
    file_type: FileType


class FileCreate(FileBase):
    order_id: int
    filename_saved: str
    file_size: int
    file_hash: Optional[str] = None
    oss_key: Optional[str] = None
    is_uploaded: bool = False


class FileResponse(FileBase):
    id: int
    order_id: int
    filename_saved: str
    file_size: int
    uploaded_at: datetime
    file_hash: Optional[str] = None
    oss_key: Optional[str] = None
    is_uploaded: bool = False
    is_selected: bool = True
    
    class Config:
        from_attributes = True


class FileListResponse(BaseModel):
    files: list[FileResponse]


# OSS 直传签名响应
class OSSSignatureResponse(BaseModel):
    """OSS 前端直传签名"""
    access_id: str = Field(..., description="OSS AccessKeyId")
    policy: str = Field(..., description="Base64 编码的策略")
    signature: str = Field(..., description="策略签名")
    dir: str = Field(..., description="上传目录")
    host: str = Field(..., description="OSS Bucket 地址")
    expire: int = Field(..., description="签名过期时间戳")
    callback: str = Field(..., description="Base64 编码的回调配置")


# OSS 回调请求
class OSSCallbackRequest(BaseModel):
    """OSS 上传成功后的回调请求"""
    bucket: str
    object: str  # OSS key
    size: int
    etag: str
    mimeType: Optional[str] = None
    # 自定义变量
    access_key: str
    file_hash: str
    filename_original: str


# 文件查重请求
class FileHashCheckRequest(BaseModel):
    file_hash: str = Field(..., description="文件 SHA256 哈希")
    access_key: str = Field(..., description="订单访问密钥")


class FileHashCheckResponse(BaseModel):
    exists: bool = Field(..., description="文件是否已存在")
    file_id: Optional[int] = Field(default=None, description="已存在文件的ID")
    message: str = Field(..., description="描述信息")
