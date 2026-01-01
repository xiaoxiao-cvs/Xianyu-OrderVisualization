from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File as FastAPIFile, BackgroundTasks, Request, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
import os
from pathlib import Path
from typing import Optional
from app.db.session import get_db
from app.core.config import settings
from app.core.deps import get_current_admin, get_order_by_hash, get_client_ip, get_user_agent
from app.models.admin import Admin
from app.models.order import Order
from app.models.file import File, FileType
from app.models.log import AccessLog
from app.schemas.file import FileResponse

router = APIRouter()

# Allowed file extensions
ALLOWED_EXTENSIONS = {
    '.pdf', '.doc', '.docx', '.txt', '.md',
    '.zip', '.rar', '.7z',
    '.jpg', '.jpeg', '.png', '.gif',
    '.py', '.js', '.html', '.css', '.json',
    '.mp4', '.avi', '.mov'
}


def is_allowed_file(filename: str) -> bool:
    """Check if file extension is allowed"""
    ext = Path(filename).suffix.lower()
    return ext in ALLOWED_EXTENSIONS


async def log_download(
    db: AsyncSession,
    order_id: int,
    ip_address: str,
    user_agent: str,
    filename: str
):
    """Background task to log file download"""
    log = AccessLog(
        order_id=order_id,
        ip_address=ip_address,
        user_agent=user_agent,
        action_type="DOWNLOAD_SUCCESS",
        target_file=filename
    )
    db.add(log)
    await db.commit()


@router.post("/upload", response_model=FileResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    access_key: str,
    file_type: FileType,
    file: UploadFile = FastAPIFile(...),
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Upload a file for an order
    - Validates file extension
    - Renames to UUID for security
    - Stores metadata in database
    """
    # Get order by access_key
    result = await db.execute(select(Order).where(Order.access_key == access_key))
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Validate file extension
    if not is_allowed_file(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed extensions: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Generate UUID filename with original extension
    original_ext = Path(file.filename).suffix
    uuid_filename = f"{uuid.uuid4()}{original_ext}"
    
    # Save file to disk
    file_path = Path(settings.UPLOAD_DIR) / uuid_filename
    
    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        file_size = len(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
    
    # Create file record in database
    db_file = File(
        order_id=order.id,
        filename_original=file.filename,
        filename_saved=uuid_filename,
        file_size=file_size,
        file_type=file_type
    )
    
    db.add(db_file)
    await db.commit()
    await db.refresh(db_file)
    
    return db_file


@router.get("/download/{file_id}")
async def download_file(
    file_id: int,
    request: Request,
    background_tasks: BackgroundTasks,
    access_key: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Download a file
    - Can be accessed by admin (with JWT) or client (with access_key)
    - Logs download in background
    - Returns file as streaming response
    """
    # Get file from database
    result = await db.execute(select(File).where(File.id == file_id))
    db_file = result.scalar_one_or_none()
    
    if not db_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Verify access
    if access_key:
        # Client access - verify access_key matches file's order
        order_result = await db.execute(select(Order).where(Order.id == db_file.order_id))
        order = order_result.scalar_one_or_none()
        
        if not order or order.access_key != access_key:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Log download in background
        ip = get_client_ip(request)
        ua = get_user_agent(request)
        background_tasks.add_task(
            log_download,
            db=db,
            order_id=order.id,
            ip_address=ip,
            user_agent=ua,
            filename=db_file.filename_original
        )
    
    # Check if file exists on disk
    file_path = Path(settings.UPLOAD_DIR) / db_file.filename_saved
    
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on server"
        )
    
    # Stream file to client
    def iterfile():
        with open(file_path, "rb") as f:
            yield from f
    
    return StreamingResponse(
        iterfile(),
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f'attachment; filename="{db_file.filename_original}"'
        }
    )


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    file_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Delete a file (admin only)
    """
    result = await db.execute(select(File).where(File.id == file_id))
    db_file = result.scalar_one_or_none()
    
    if not db_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Delete file from disk
    file_path = Path(settings.UPLOAD_DIR) / db_file.filename_saved
    if file_path.exists():
        os.remove(file_path)
    
    # Delete from database
    await db.delete(db_file)
    await db.commit()
    
    return None
