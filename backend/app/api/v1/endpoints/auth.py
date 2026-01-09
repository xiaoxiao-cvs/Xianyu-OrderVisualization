from fastapi import APIRouter, HTTPException, status
from datetime import timedelta
from passlib.context import CryptContext
from app.core.security import create_access_token
from app.core.config import settings
from app.schemas.admin import Token, LoginRequest

router = APIRouter()

# 密码验证上下文
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/login", response_model=Token)
async def login(login_data: LoginRequest):
    """
    Admin login endpoint
    Validates password against stored hash and returns JWT token
    Supports multiple concurrent sessions
    """
    # Verify password against stored hash
    if not pwd_context.verify(login_data.password, settings.ADMIN_KEY_HASH):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin key",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token with "admin" as subject
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": "admin"}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}
