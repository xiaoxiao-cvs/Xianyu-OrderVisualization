from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func
from typing import Optional
import secrets
import string
from app.db.session import get_db
from app.core.deps import get_current_admin
from app.models.admin import Admin
from app.models.order import Order, OrderStatus
from app.models.log import AccessLog
from app.schemas.order import OrderCreate, OrderResponse, OrderListResponse
from app.schemas.log import AccessLogResponse, AccessLogListResponse

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
    current_admin: Admin = Depends(get_current_admin)
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
    current_admin: Admin = Depends(get_current_admin)
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
    current_admin: Admin = Depends(get_current_admin)
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
    current_admin: Admin = Depends(get_current_admin)
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
    current_admin: Admin = Depends(get_current_admin)
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
