from fastapi import APIRouter, Depends, BackgroundTasks, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.core.deps import get_order_by_hash, get_client_ip, get_user_agent
from app.models.order import Order
from app.models.file import File
from app.models.log import AccessLog
from app.schemas.order import OrderResponse
from app.schemas.file import FileListResponse

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
