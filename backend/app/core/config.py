"""
配置管理模块
使用 TOML 配置文件，首次启动自动生成
"""
import os
import secrets
import string
from pathlib import Path
from typing import List
from dataclasses import dataclass, field
from passlib.context import CryptContext

# 密码哈希上下文
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 获取后端根目录（backend/）
BACKEND_DIR = Path(__file__).parent.parent.parent
CONFIG_DIR = BACKEND_DIR / "config"
CONFIG_FILE = CONFIG_DIR / "settings.toml"
DATA_DIR = BACKEND_DIR / "data"
DATABASE_DIR = DATA_DIR / "database"
ORDER_FILE_DIR = DATA_DIR / "Order File"


def generate_secret_key(length: int = 32) -> str:
    """生成随机密钥用于JWT签名"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def generate_admin_key(length: int = 16) -> str:
    """生成16位管理员密钥"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def create_default_config() -> dict:
    """创建默认配置"""
    admin_key = generate_admin_key(16)
    admin_key_hash = pwd_context.hash(admin_key)
    
    config = {
        "server": {
            "cors_origins": ["http://localhost:3000", "http://localhost:5173"],
        },
        "security": {
            "secret_key": generate_secret_key(32),
            "algorithm": "HS256",
            "access_token_expire_minutes": 10080,  # 7 days
            "admin_key_hash": admin_key_hash,
        },
        "upload": {
            "client_max_file_size_mb": 300,
            "client_max_files_per_order": 5,
        },
    }
    
    return config, admin_key


def load_config() -> dict:
    """加载或创建配置文件"""
    try:
        import tomli
    except ImportError:
        # Python 3.11+ 内置 tomllib
        import tomllib as tomli
    
    import tomli_w
    
    # 确保配置目录存在
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    
    if not CONFIG_FILE.exists():
        # 首次启动：生成配置文件
        config, admin_key = create_default_config()
        
        # 写入 TOML 文件
        with open(CONFIG_FILE, "wb") as f:
            tomli_w.dump(config, f)
        
        print("=" * 60)
        print("🔐 首次启动 - 已生成配置文件")
        print(f"   配置文件位置: {CONFIG_FILE}")
        print()
        print("⚠️  请妥善保管以下管理员密钥（仅显示一次）:")
        print(f"   管理员密钥: {admin_key}")
        print("=" * 60)
        print()
        
        return config
    
    # 读取现有配置
    with open(CONFIG_FILE, "rb") as f:
        config = tomli.load(f)
    
    return config


# 加载配置
_config = load_config()


@dataclass
class Settings:
    """应用配置类"""
    
    # Server
    cors_origins: List[str] = field(default_factory=lambda: _config.get("server", {}).get("cors_origins", []))
    
    # Security
    SECRET_KEY: str = _config.get("security", {}).get("secret_key", "")
    ALGORITHM: str = _config.get("security", {}).get("algorithm", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = _config.get("security", {}).get("access_token_expire_minutes", 10080)
    ADMIN_KEY_HASH: str = _config.get("security", {}).get("admin_key_hash", "")
    
    # Upload limits
    CLIENT_MAX_FILE_SIZE_MB: int = _config.get("upload", {}).get("client_max_file_size_mb", 300)
    CLIENT_MAX_FILES_PER_ORDER: int = _config.get("upload", {}).get("client_max_files_per_order", 5)
    
    # Paths
    DATABASE_URL: str = f"sqlite+aiosqlite:///{DATABASE_DIR}/app.db"
    ORDER_FILE_DIR: Path = ORDER_FILE_DIR
    
    @property
    def cors_origins_list(self) -> List[str]:
        """获取 CORS 源列表"""
        return self.cors_origins
    
    @property
    def client_max_file_size_bytes(self) -> int:
        """获取客户端最大文件大小（字节）"""
        return self.CLIENT_MAX_FILE_SIZE_MB * 1024 * 1024
    
    def ensure_data_dirs(self):
        """确保数据目录存在"""
        DATABASE_DIR.mkdir(parents=True, exist_ok=True)
        ORDER_FILE_DIR.mkdir(parents=True, exist_ok=True)
    
    def get_order_file_path(self, access_key: str) -> Path:
        """获取订单文件目录路径"""
        order_dir = ORDER_FILE_DIR / access_key
        order_dir.mkdir(parents=True, exist_ok=True)
        return order_dir


# 全局配置实例
settings = Settings()
