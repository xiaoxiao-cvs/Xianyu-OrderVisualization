"""
兼容占位脚本。

本项目已切换为「重建 SQLite 基线」策略，旧增量迁移不再维护。
请改用:
    python -m migrations.reset_sqlite
"""
from migrations.reset_sqlite import main
import asyncio


if __name__ == "__main__":
    asyncio.run(main())
