from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from app.db.session import get_db
from app.core.security import decode_access_token
from app.models.admin import Admin
from app.models.order import Order

security = HTTPBearer()


async def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Admin:
    """
    Verify JWT token and return current admin user
    """
    token = credentials.credentials
    username = decode_access_token(token)
    
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    result = await db.execute(select(Admin).where(Admin.username == username))
    admin = result.scalar_one_or_none()
    
    if admin is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return admin


async def get_order_by_hash(
    access_key: str,
    db: AsyncSession = Depends(get_db)
) -> Order:
    """
    Verify access_key and return order
    Checks if order exists and is not expired
    """
    result = await db.execute(select(Order).where(Order.access_key == access_key))
    order = result.scalar_one_or_none()
    
    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found or invalid access key"
        )
    
    # Check if order is expired
    if order.expires_at and order.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Order has expired"
        )
    
    return order


def get_client_ip(request: Request) -> str:
    """
    Extract client IP address from request
    Checks X-Forwarded-For header first (for proxies)
    """
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def get_user_agent(request: Request) -> str:
    """Extract User-Agent from request headers"""
    return request.headers.get("User-Agent", "unknown")
