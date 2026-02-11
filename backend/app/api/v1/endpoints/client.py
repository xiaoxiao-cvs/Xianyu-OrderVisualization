from fastapi import APIRouter, Depends, BackgroundTasks, Request, HTTPException, status, UploadFile, File as FastAPIFile
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import uuid
from pathlib import Path
from typing import Optional
from pydantic import BaseModel
from app.db.session import get_db
from app.core.config import settings
from app.core.deps import get_order_by_hash, get_client_ip, get_user_agent
from app.models.order import Order, OrderStatus
from app.models.file import File, FileType
from app.models.log import AccessLog
from app.models.timeline import OrderTimeline, TimelineActor, TimelineEventType
from app.core.status_machine import apply_status_transition
from app.schemas.order import OrderResponse
from app.schemas.timeline import TimelineListResponse
from app.schemas.file import (
    FileListResponse, FileResponse, 
    OSSSignatureResponse, OSSCallbackRequest,
    FileHashCheckRequest, FileHashCheckResponse
)
from app.utils.oss import oss_client
from app.utils.notification import create_notification

router = APIRouter()


class RequirementFeedbackRequest(BaseModel):
    content: str


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
    Only returns files that are uploaded and selected
    """
    result = await db.execute(
        select(File).where(
            File.order_id == order.id,
            File.is_selected == True  # 只返回被选中的文件
        ).order_by(File.uploaded_at.desc())
    )
    files = result.scalars().all()
    
    return {"files": files}


@router.get("/{access_key}/timeline", response_model=TimelineListResponse)
async def get_order_timeline(
    access_key: str,
    db: AsyncSession = Depends(get_db),
    order: Order = Depends(get_order_by_hash)
):
    result = await db.execute(
        select(OrderTimeline)
        .where(OrderTimeline.order_id == order.id)
        .order_by(OrderTimeline.created_at.desc())
    )
    items = result.scalars().all()
    return {"total": len(items), "items": items}


@router.post("/{access_key}/requirements/confirm")
async def confirm_requirements(
    access_key: str,
    db: AsyncSession = Depends(get_db),
    order: Order = Depends(get_order_by_hash)
):
    previous = order.status
    apply_status_transition(order, OrderStatus.confirmed, override=True)
    db.add(
        OrderTimeline(
            order_id=order.id,
            event_type=TimelineEventType.status_change,
            actor=TimelineActor.customer,
            event_data={"from": previous.value, "to": order.status.value, "action": "requirement_confirm"},
        )
    )
    await create_notification(
        db,
        order_id=order.id,
        type="requirement_confirmed",
        title="客户已确认需求",
        content=f"订单 #{order.id} 客户确认需求",
    )
    await db.commit()
    return {"status": "ok"}


@router.post("/{access_key}/requirements/feedback")
async def submit_requirement_feedback(
    access_key: str,
    payload: RequirementFeedbackRequest,
    db: AsyncSession = Depends(get_db),
    order: Order = Depends(get_order_by_hash)
):
    previous = order.status
    apply_status_transition(order, OrderStatus.collecting, override=True)
    db.add(
        OrderTimeline(
            order_id=order.id,
            event_type=TimelineEventType.note,
            actor=TimelineActor.customer,
            event_data={"feedback": payload.content, "from": previous.value, "to": order.status.value},
        )
    )
    await create_notification(
        db,
        order_id=order.id,
        type="requirement_feedback",
        title="客户提交需求反馈",
        content=payload.content[:120],
    )
    await db.commit()
    return {"status": "ok"}


@router.get("/{access_key}/conversation-summary")
async def get_conversation_summary(
    access_key: str,
    db: AsyncSession = Depends(get_db),
    order: Order = Depends(get_order_by_hash)
):
    events = (
        await db.execute(
            select(OrderTimeline)
            .where(OrderTimeline.order_id == order.id, OrderTimeline.event_type.in_([TimelineEventType.message, TimelineEventType.note]))
            .order_by(OrderTimeline.created_at.desc())
            .limit(20)
        )
    ).scalars().all()

    highlights = []
    for event in events:
        feedback = (event.event_data or {}).get("feedback")
        if isinstance(feedback, str) and feedback.strip():
            highlights.append(feedback.strip())
        message = (event.event_data or {}).get("message")
        if isinstance(message, str) and message.strip():
            highlights.append(message.strip())

    if not highlights:
        req_summary = (order.requirements or {}).get("summary") if isinstance(order.requirements, dict) else None
        if req_summary:
            highlights = [req_summary]

    summary = highlights[0] if highlights else "暂无可用沟通摘要"
    return {"summary": summary, "highlights": highlights[:5]}


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


# ==================== OSS 直传相关接口 ====================


@router.post("/{access_key}/check-hash", response_model=FileHashCheckResponse)
async def check_file_hash(
    access_key: str,
    request: FileHashCheckRequest,
    db: AsyncSession = Depends(get_db),
    order: Order = Depends(get_order_by_hash)
):
    """
    检查文件 Hash 是否已存在（用于秒传/查重）
    
    前端在上传前先计算文件 SHA256，调用此接口检查是否已存在
    """
    # 在当前订单下查找相同 Hash 的文件
    result = await db.execute(
        select(File).where(
            File.order_id == order.id,
            File.file_hash == request.file_hash,
            File.is_uploaded == True
        )
    )
    existing_file = result.scalars().first()
    
    if existing_file:
        return FileHashCheckResponse(
            exists=True,
            file_id=existing_file.id,
            message="文件已存在，无需重复上传"
        )
    
    return FileHashCheckResponse(
        exists=False,
        file_id=None,
        message="文件不存在，可以上传"
    )


@router.get("/{access_key}/oss-signature", response_model=OSSSignatureResponse)
async def get_oss_signature(
    access_key: str,
    file_hash: str,
    filename: str,
    content_type: str = "application/octet-stream",
    db: AsyncSession = Depends(get_db),
    order: Order = Depends(get_order_by_hash)
):
    """
    获取 OSS 前端直传签名
    
    前端使用此签名直接上传文件到 OSS，不消耗服务器带宽
    
    Args:
        access_key: 订单访问密钥
        file_hash: 文件 SHA256 哈希（前端计算）
        filename: 原始文件名
        content_type: 文件 MIME 类型
    """
    if not oss_client.enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OSS 服务未启用，请使用传统上传方式"
        )
    
    # 检查文件数量限制
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
            detail=f"最多上传 {settings.CLIENT_MAX_FILES_PER_ORDER} 个文件"
        )
    
    try:
        signature_data = oss_client.generate_upload_signature(
            access_key=access_key,
            file_hash=file_hash,
            filename=filename,
            content_type=content_type
        )
        
        return OSSSignatureResponse(
            access_id=signature_data["accessid"],
            policy=signature_data["policy"],
            signature=signature_data["signature"],
            dir=signature_data["dir"],
            host=signature_data["host"],
            expire=signature_data["expire"],
            callback=signature_data["callback"]
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e)
        )


@router.post("/upload-callback")
async def oss_upload_callback(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    OSS 上传成功后的回调接口
    
    OSS 会在文件上传成功后调用此接口，服务端在此记录文件信息到数据库
    
    安全措施：
    1. 调用 OSS head_object 验证文件确实存在
    2. 验证文件大小是否匹配
    3. 防止恶意用户伪造上传成功请求
    """
    # 解析回调参数（URL-encoded form）
    form_data = await request.form()
    
    # bucket = form_data.get("bucket", "")  # 暂未使用
    oss_key = form_data.get("object", "")  # OSS 存储路径
    claimed_size = int(form_data.get("size", 0))
    # etag = form_data.get("etag", "")  # 暂未使用
    # mime_type = form_data.get("mimeType", "")  # 暂未使用
    access_key = form_data.get("access_key", "")
    file_hash = form_data.get("file_hash", "")
    filename_original = form_data.get("filename_original", "")
    
    if not all([access_key, oss_key, filename_original]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required callback parameters"
        )
    
    # 【关键安全措施】验证文件确实存在于 OSS
    if oss_client.enabled:
        try:
            file_info = await oss_client.head_object(oss_key)
            
            if not file_info.exists:
                # 文件不存在 -> 这是伪造请求或上传失败
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="文件验证失败：OSS 中不存在该文件，可能是伪造请求"
                )
            
            # 验证文件大小是否匹配（允许小误差）
            if claimed_size > 0 and abs(file_info.size - claimed_size) > 1024:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"文件大小不匹配：声称 {claimed_size} 字节，实际 {file_info.size} 字节"
                )
            
            # 使用 OSS 返回的真实大小
            actual_size = file_info.size
            
        except RuntimeError as e:
            # OSS 请求失败，记录但不阻断（降级处理）
            import logging
            logging.warning(f"OSS head_object 失败: {e}，使用声称的文件大小")
            actual_size = claimed_size
    else:
        actual_size = claimed_size
    
    # 查找订单
    result = await db.execute(
        select(Order).where(Order.access_key == access_key)
    )
    order = result.scalars().first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order not found: {access_key}"
        )
    
    # 检查是否已存在相同文件
    existing_result = await db.execute(
        select(File).where(
            File.order_id == order.id,
            File.oss_key == oss_key
        )
    )
    if existing_result.scalars().first():
        # 文件已存在，返回成功（幂等性）
        return JSONResponse(content={"status": "ok", "message": "File already exists"})
    
    # 创建文件记录（使用验证后的真实大小）
    db_file = File(
        order_id=order.id,
        filename_original=filename_original,
        filename_saved=oss_key.split("/")[-1],  # 从 OSS key 提取文件名
        file_size=actual_size,  # 使用验证后的大小
        file_type=FileType.req,  # 客户上传的都是需求文件
        file_hash=file_hash,
        oss_key=oss_key,
        is_uploaded=True,  # 已通过 head_object 验证
        is_selected=True
    )
    
    db.add(db_file)
    await db.commit()
    
    # 返回 OSS 要求的格式
    return JSONResponse(content={
        "status": "ok",
        "file_id": db_file.id,
        "message": "Upload callback processed and verified successfully"
    })


@router.get("/{access_key}/oss-status")
async def get_oss_status(access_key: str):
    """
    获取 OSS 服务状态
    
    前端可通过此接口判断是否使用 OSS 直传
    """
    return {
        "oss_enabled": oss_client.enabled,
        "max_file_size_mb": settings.CLIENT_MAX_FILE_SIZE_MB,
        "max_files_per_order": settings.CLIENT_MAX_FILES_PER_ORDER
    }
