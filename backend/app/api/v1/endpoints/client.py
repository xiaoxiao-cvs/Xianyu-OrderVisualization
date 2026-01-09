from fastapi import APIRouter, Depends, BackgroundTasks, Request, HTTPException, status, UploadFile, File as FastAPIFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import uuid
from pathlib import Path
from app.db.session import get_db
from app.core.config import settings
from app.core.deps import get_order_by_hash, get_client_ip, get_user_agent
from app.models.order import Order
from app.models.file import File, FileType
from app.models.log import AccessLog
from app.schemas.order import OrderResponse
from app.schemas.file import FileListResponse, FileResponse

router = APIRouter()


async def log_access(
    db: AsyncSession,
    order_id: int,
    ip_address: str,
    user_agent: str,
    action_type: str,
    target_file: str = None
):
    """Background task to log access"""
    log = AccessLog(
        order_id=order_id,
        ip_address=ip_address,
        user_agent=user_agent,
        action_type=action_type,
        target_file=target_file
    )
    db.add(log)
    await db.commit()


@router.get("/{access_key}/info", response_model=OrderResponse)
async def get_order_info(
    access_key: str,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    order: Order = Depends(get_order_by_hash)
):
    """
    Get order basic information for client
    Logs the visit in background
    """
    # Log the page visit in background
    ip = get_client_ip(request)
    ua = get_user_agent(request)
    
    background_tasks.add_task(
        log_access,
        db=db,
        order_id=order.id,
        ip_address=ip,
        user_agent=ua,
        action_type="VISIT_PAGE"
    )
    
    return order


@router.get("/{access_key}/files", response_model=FileListResponse)
async def get_order_files(
    access_key: str,
    db: AsyncSession = Depends(get_db),
    order: Order = Depends(get_order_by_hash)
):
    """
    Get list of files associated with the order
    """
    result = await db.execute(
        select(File).where(File.order_id == order.id).order_by(File.uploaded_at.desc())
    )
    files = result.scalars().all()
    
    return {"files": files}


@router.post("/{access_key}/upload", response_model=FileResponse, status_code=status.HTTP_201_CREATED)
async def client_upload_file(
    access_key: str,
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = FastAPIFile(...),
    db: AsyncSession = Depends(get_db),
    order: Order = Depends(get_order_by_hash)
):
    """
    Client upload file for an order
    - Validates file size (configurable, default 300MB)
    - Validates file count per order (configurable, default 5)
    - Stores in order-specific directory
    - Logs upload action
    """
    # Check file count limit for this order (client uploads only, file_type = "req")
    count_result = await db.execute(
        select(func.count(File.id)).where(
            File.order_id == order.id,
            File.file_type == FileType.req
        )
    )
    current_count = count_result.scalar() or 0
    
    if current_count >= settings.CLIENT_MAX_FILES_PER_ORDER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {settings.CLIENT_MAX_FILES_PER_ORDER} files per order reached"
        )
    
    # Read file content and check size
    content = await file.read()
    file_size = len(content)
    
    if file_size > settings.client_max_file_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum allowed ({settings.CLIENT_MAX_FILE_SIZE_MB}MB)"
        )
    
    # Generate UUID filename with original extension
    original_ext = Path(file.filename).suffix
    uuid_filename = f"{uuid.uuid4()}{original_ext}"
    
    # Get order-specific directory
    order_dir = settings.get_order_file_path(access_key)
    file_path = order_dir / uuid_filename
    
    try:
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
    
    # Create file record in database (client uploads are type "req")
    db_file = File(
        order_id=order.id,
        filename_original=file.filename,
        filename_saved=uuid_filename,
        file_size=file_size,
        file_type=FileType.req
    )
    
    db.add(db_file)
    await db.commit()
    await db.refresh(db_file)
    
    # Log the upload in background
    ip = get_client_ip(request)
    ua = get_user_agent(request)
    background_tasks.add_task(
        log_access,
        db=db,
        order_id=order.id,
        ip_address=ip,
        user_agent=ua,
        action_type="UPLOAD_FILE",
        target_file=file.filename
    )
    
    return db_file
