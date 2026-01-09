from pydantic import BaseModel


class LoginRequest(BaseModel):
    """管理员登录请求 - 仅需密钥"""
    password: str


class Token(BaseModel):
    """JWT Token 响应"""
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Token 数据"""
    subject: str | None = None
