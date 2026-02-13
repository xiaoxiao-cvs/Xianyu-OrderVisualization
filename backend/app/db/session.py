import logging

from sqlalchemy import inspect as sa_inspect, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

logger = logging.getLogger(__name__)

# Create async engine with SQLite-specific configuration
engine = create_async_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},  # Required for SQLite
    echo=False,  # Set to True for debugging SQL queries
)

# Create async session factory
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Create declarative base
Base = declarative_base()


# Dependency to get database session
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


def _auto_migrate_columns(connection):
    """
    检测并自动添加 SQLAlchemy 模型中定义但 SQLite 表中缺失的列。

    SQLite 的 CREATE TABLE IF NOT EXISTS 不会修改已存在的表，
    所以当模型新增列后旧库不会自动补齐。此函数通过
    PRAGMA table_info + ALTER TABLE ADD COLUMN 弥补差距。
    """
    inspector = sa_inspect(connection)
    existing_tables = inspector.get_table_names()

    for table in Base.metadata.sorted_tables:
        if table.name not in existing_tables:
            continue  # create_all 会处理全新表

        existing_cols = {col["name"] for col in inspector.get_columns(table.name)}
        for column in table.columns:
            if column.name in existing_cols:
                continue

            # 构建 ALTER TABLE ADD COLUMN 语句
            col_type = column.type.compile(dialect=connection.dialect)
            parts = [f"ALTER TABLE {table.name} ADD COLUMN {column.name} {col_type}"]

            if column.default is not None:
                # 对 callable 默认值(如 list/dict)，SQLite 只能用 NULL
                default_arg = column.default.arg
                if callable(default_arg):
                    # JSON 列的 list/dict 工厂 -> 存 NULL，应用层负责
                    pass
                elif isinstance(default_arg, bool):
                    parts.append(f"DEFAULT {int(default_arg)}")
                elif isinstance(default_arg, (int, float)):
                    parts.append(f"DEFAULT {default_arg}")
                elif isinstance(default_arg, str):
                    parts.append(f"DEFAULT '{default_arg}'")

            sql = " ".join(parts)
            logger.info("Auto-migrate: %s", sql)
            connection.execute(text(sql))

    logger.info("Auto-migrate: column check completed")


# Database initialization
async def init_db():
    """Initialize database tables, then auto-add any missing columns."""
    # Import models before create_all so metadata is fully registered.
    from app import models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(_auto_migrate_columns)


async def reset_db():
    """Drop and recreate all tables."""
    from app import models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
