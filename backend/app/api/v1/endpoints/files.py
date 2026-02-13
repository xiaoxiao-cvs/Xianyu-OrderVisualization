from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File as FastAPIFile, BackgroundTasks, Request, Query
from fastapi.responses import StreamingResponse, RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
import os
from pathlib import Path
from typing import Optional
from app.db.session import get_db, AsyncSessionLocal
from app.core.config import settings
from app.core.deps import get_current_admin, get_order_by_hash, get_client_ip, get_user_agent
from app.models.order import Order
from app.models.file import File, FileType
from app.models.log import AccessLog
from app.schemas.file import FileResponse
from app.utils.oss import oss_client

router = APIRouter()


async def log_download(
    order_id: int,
    ip_address: str,
    user_agent: str,
    filename: str
):
    """Background task to log file download — uses its own session."""
    async with AsyncSessionLocal() as db:
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
    _: bool = Depends(get_current_admin)
):
    """
    Upload a file for an order (Admin only)
    - Renames to UUID for security
    - Stores in order-specific directory
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
    
    # Generate UUID filename with original extension
    original_ext = Path(file.filename).suffix
    uuid_filename = f"{uuid.uuid4()}{original_ext}"
    
    # Get order-specific directory
    order_dir = settings.get_order_file_path(access_key)
    file_path = order_dir / uuid_filename
    
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
    
    # Create file record in database with relative path
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
    下载文件 - 安全下载与防扯皮日志
    
    核心逻辑：
    1. 验证访问权限（管理员JWT或客户端access_key）
    2. 记录访问日志（IP、时间戳、文件名）
    3. 如果文件在OSS上，生成签名URL并302重定向
    4. 如果文件在本地，直接流式返回
    
    重要：OSS Bucket必须设置为"私有(Private)"，否则日志无意义
    """
    # Get file from database
    result = await db.execute(select(File).where(File.id == file_id))
    db_file = result.scalar_one_or_none()
    
    if not db_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Get order to find access_key for file path
    order_result = await db.execute(select(Order).where(Order.id == db_file.order_id))
    order = order_result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Verify access
    if access_key:
        # Client access - verify access_key matches file's order
        if order.access_key != access_key:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # 【关键】记录下载日志 - 防扯皮证据
        ip = get_client_ip(request)
        ua = get_user_agent(request)
        background_tasks.add_task(
            log_download,
            order_id=order.id,
            ip_address=ip,
            user_agent=ua,
            filename=db_file.filename_original
        )
    
    # 检查文件是否存储在 OSS 上
    if db_file.oss_key and db_file.is_uploaded and oss_client.enabled:
        # OSS 模式：生成签名URL并302重定向
        # 这是最优雅的方式，浏览器自动处理，用户无感知
        try:
            signed_url = oss_client.generate_download_url(
                oss_key=db_file.oss_key,
                expires=3600,  # 1小时有效期
                filename=db_file.filename_original
            )
            return RedirectResponse(url=signed_url, status_code=302)
        except RuntimeError as e:
            # OSS 签名失败，尝试本地文件
            pass
    
    # 本地文件模式：流式返回
    order_dir = settings.get_order_file_path(order.access_key)
    file_path = order_dir / db_file.filename_saved
    
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
    _: bool = Depends(get_current_admin)
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
    
    # Get order to find file path
    order_result = await db.execute(select(Order).where(Order.id == db_file.order_id))
    order = order_result.scalar_one_or_none()
    
    if order:
        # Delete file from disk (in order-specific directory)
        order_dir = settings.get_order_file_path(order.access_key)
        file_path = order_dir / db_file.filename_saved
        if file_path.exists():
            os.remove(file_path)
        
        # 如果文件在 OSS 上，也删除 OSS 文件
        if db_file.oss_key and oss_client.enabled:
            oss_client.delete_file(db_file.oss_key)
    
    # Delete from database
    await db.delete(db_file)
    await db.commit()
    
    return None
