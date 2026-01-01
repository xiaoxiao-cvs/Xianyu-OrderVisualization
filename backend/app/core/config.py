from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # Database
    SQLITE_URL: str = "sqlite+aiosqlite:///./app.db"
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    
    # File Upload
    UPLOAD_DIR: str
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Convert comma-separated CORS origins to list"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    def ensure_upload_dir(self):
        """Ensure upload directory exists"""
        if not os.path.exists(self.UPLOAD_DIR):
            os.makedirs(self.UPLOAD_DIR, exist_ok=True)


settings = Settings()
