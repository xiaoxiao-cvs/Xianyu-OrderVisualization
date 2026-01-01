from pydantic import BaseModel
from datetime import datetime
from app.models.file import FileType


class FileBase(BaseModel):
    filename_original: str
    file_type: FileType


class FileCreate(FileBase):
    order_id: int
    filename_saved: str
    file_size: int


class FileResponse(FileBase):
    id: int
    order_id: int
    filename_saved: str
    file_size: int
    uploaded_at: datetime
    
    class Config:
        from_attributes = True


class FileListResponse(BaseModel):
    files: list[FileResponse]
