from pydantic import BaseModel


class AdminBase(BaseModel):
    username: str


class AdminCreate(AdminBase):
    password: str


class AdminResponse(AdminBase):
    id: int
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: str | None = None
