from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func, update
from typing import Optional, List
from datetime import datetime
import secrets
import string
from app.db.session import get_db
from app.core.deps import get_current_admin
from app.models.order import Order, OrderStatus
from app.models.file import File
from app.models.log import AccessLog
from app.schemas.order import OrderCreate, OrderResponse, OrderListResponse, OrderConvertRequest, OrderUpdate
from app.schemas.log import AccessLogResponse, AccessLogListResponse
from app.schemas.file import FileListResponse
from app.utils.oss import oss_client

router = APIRouter()


def generate_access_key(length: int = 12) -> str:
    """Generate a random access key"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


@router.get("/", response_model=OrderListResponse)
async def list_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status_filter: Optional[OrderStatus] = None,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin)
):
    """
    List all orders with pagination and optional status filter
    """
    query = select(Order)
    
    if status_filter:
        query = query.where(Order.status == status_filter)
    
    query = query.offset(skip).limit(limit).order_by(Order.created_at.desc())
    
    result = await db.execute(query)
    orders = result.scalars().all()
    
    # Get total count
    count_query = select(func.count(Order.id))
    if status_filter:
        count_query = count_query.where(Order.status == status_filter)
    
    count_result = await db.execute(count_query)
    total = count_result.scalar()
    
    return {"total": total, "items": orders}


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_in: OrderCreate,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin)
):
    """
    Create a new order with auto-generated access key
    """
    # Generate unique access key
    while True:
        access_key = generate_access_key()
        result = await db.execute(select(Order).where(Order.access_key == access_key))
        if result.scalar_one_or_none() is None:
            break
    
    # Create order
    order = Order(
        access_key=access_key,
        client_name=order_in.client_name,
        description=order_in.description,
        status=order_in.status,
        expires_at=order_in.expires_at
    )
    
    db.add(order)
    await db.commit()
    await db.refresh(order)
    
    return order


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin)
):
    """
    Get order details by ID
    """
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    return order


@router.get("/{order_id}/logs", response_model=AccessLogListResponse)
async def get_order_logs(
    order_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin)
):
    """
    Get all access logs for a specific order
    This is a core feature for generating evidence of client access
    """
    # Verify order exists
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Get logs
    query = select(AccessLog).where(AccessLog.order_id == order_id)\
        .order_by(AccessLog.timestamp.desc())\
        .offset(skip).limit(limit)
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    # Get total count
    count_query = select(func.count(AccessLog.id)).where(AccessLog.order_id == order_id)
    count_result = await db.execute(count_query)
    total = count_result.scalar()
    
    return {"total": total, "logs": logs}


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin)
):
    """
    Delete an order and all associated files and logs
    """
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    await db.delete(order)
    await db.commit()
    
    return None


# ==================== 订单转正相关接口 ====================


@router.get("/by-hash/{access_key}", response_model=OrderResponse)
async def get_order_by_hash(
    access_key: str,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin)
):
    """
    通过 access_key (Hash) 获取订单详情
    管理员用于查看临时订单
    """
    result = await db.execute(select(Order).where(Order.access_key == access_key))
    order = result.scalars().first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order not found: {access_key}"
        )
    
    return order


@router.get("/by-hash/{access_key}/files", response_model=FileListResponse)
async def get_order_files_by_hash(
    access_key: str,
    include_unselected: bool = True,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin)
):
    """
    通过 access_key 获取订单所有文件
    管理员用于查看待转正订单的文件列表
    
    Args:
        include_unselected: 是否包含未选中的文件，默认 True（管理员可看全部）
    """
    result = await db.execute(select(Order).where(Order.access_key == access_key))
    order = result.scalars().first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order not found: {access_key}"
        )
    
    query = select(File).where(File.order_id == order.id)
    if not include_unselected:
        query = query.where(File.is_selected == True)
    
    query = query.order_by(File.uploaded_at.desc())
    
    files_result = await db.execute(query)
    files = files_result.scalars().all()
    
    return {"files": files}


@router.post("/convert", response_model=OrderResponse)
async def convert_order(
    request: OrderConvertRequest,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin)
):
    """
    转正订单：将临时订单与闲鱼订单号绑定
    
    操作步骤：
    1. 验证 access_key 是否存在
    2. 更新订单状态为 pending，绑定闲鱼订单号
    3. 标记选中的文件（is_selected=True），其余设为 False
    4. 可选：删除未选中的文件
    """
    # 1. 查找订单
    result = await db.execute(
        select(Order).where(Order.access_key == request.access_key)
    )
    order = result.scalars().first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"订单不存在: {request.access_key}"
        )
    
    # 检查是否已绑定闲鱼订单号
    if order.xianyu_order_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"订单已绑定闲鱼订单号: {order.xianyu_order_id}"
        )
    
    # 2. 更新订单信息
    order.xianyu_order_id = request.xianyu_order_id
    order.status = OrderStatus.pending  # 转正后状态改为待开发
    order.created_at = datetime.utcnow()  # 更新创建时间为转正时间
    
    if request.notes:
        # 追加备注到描述
        if order.description:
            order.description += f"\n\n[转正备注] {request.notes}"
        else:
            order.description = f"[转正备注] {request.notes}"
    
    # 3. 处理文件选择
    if request.selected_file_ids:
        # 获取订单下所有文件
        files_result = await db.execute(
            select(File).where(File.order_id == order.id)
        )
        all_files = files_result.scalars().all()
        
        selected_ids_set = set(request.selected_file_ids)
        
        for file in all_files:
            if file.id in selected_ids_set:
                file.is_selected = True
            else:
                file.is_selected = False
                
                # 4. 删除未选中的文件
                if request.delete_unselected:
                    # 如果文件在 OSS 上，删除 OSS 文件
                    if file.oss_key and oss_client.enabled:
                        oss_client.delete_file(file.oss_key)
                    await db.delete(file)
    
    await db.commit()
    await db.refresh(order)
    
    return order


@router.patch("/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: int,
    order_update: OrderUpdate,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin)
):
    """
    更新订单信息（包括闲鱼订单号、状态、备注等）
    """
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalars().first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # 更新非空字段
    update_data = order_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(order, field, value)
    
    await db.commit()
    await db.refresh(order)
    
    return order


@router.get("/{order_id}/files", response_model=FileListResponse)
async def get_order_files(
    order_id: int,
    include_unselected: bool = True,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin)
):
    """
    获取订单文件列表（管理员）
    """
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalars().first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    query = select(File).where(File.order_id == order.id)
    if not include_unselected:
        query = query.where(File.is_selected == True)
    
    query = query.order_by(File.uploaded_at.desc())
    
    files_result = await db.execute(query)
    files = files_result.scalars().all()
    
    return {"files": files}
