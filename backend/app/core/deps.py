from datetime import datetime
from typing import Callable

from fastapi import Depends, Header, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.core.security import decode_access_token, hash_service_key
from app.models.order import Order
from app.models.service_api_key import ServiceApiKey

security = HTTPBearer()


async def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> bool:
    """
    Verify JWT token for admin authentication
    Returns True if token is valid (admin authenticated)
    """
    token = credentials.credentials
    subject = decode_access_token(token)
    
    if subject is None or subject != "admin":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return True


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


async def get_current_service(
    x_service_key: str = Header(default="", alias="X-Service-Key"),
    db: AsyncSession = Depends(get_db),
) -> ServiceApiKey:
    """Authenticate service-to-service requests via X-Service-Key."""
    if not x_service_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing X-Service-Key")

    key_hash = hash_service_key(x_service_key)
    result = await db.execute(
        select(ServiceApiKey).where(
            ServiceApiKey.key_hash == key_hash,
            ServiceApiKey.is_active.is_(True),
        )
    )
    service = result.scalar_one_or_none()
    if service is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid service key")

    service.last_used_at = datetime.utcnow()
    await db.commit()
    return service


def require_service_scope(scope: str) -> Callable:
    async def _checker(service: ServiceApiKey = Depends(get_current_service)) -> ServiceApiKey:
        if scope not in (service.scopes or []):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Service scope missing: {scope}",
            )
        return service

    return _checker
