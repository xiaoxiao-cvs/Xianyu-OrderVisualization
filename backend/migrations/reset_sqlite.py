"""
重建 SQLite 数据库基线。

运行方式:
    cd backend
    python -m migrations.reset_sqlite
"""
from pathlib import Path
import asyncio

from app.core.config import settings
from app.db.session import reset_db


def _db_file_from_url(database_url: str) -> Path:
    prefix = "sqlite+aiosqlite:///"
    if not database_url.startswith(prefix):
        raise RuntimeError(f"仅支持 SQLite URL，当前: {database_url}")
    return Path(database_url[len(prefix):])


async def main():
    settings.ensure_data_dirs()
    db_file = _db_file_from_url(settings.DATABASE_URL)

    if db_file.exists():
        db_file.unlink()
        print(f"已删除旧数据库: {db_file}")
    else:
        print(f"数据库不存在，将创建新库: {db_file}")

    await reset_db()
    print("SQLite 基线已重建。")


if __name__ == "__main__":
    asyncio.run(main())
