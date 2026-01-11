"""
数据库迁移脚本
用于将现有数据库升级到新版本结构

运行方式：
cd backend
python -m migrations.migrate_v2

注意：此脚本会修改数据库结构，请先备份数据库！
"""
import asyncio
import sqlite3
from pathlib import Path

# 数据库路径
DB_PATH = Path(__file__).parent.parent / "data" / "database" / "app.db"


def migrate():
    """执行数据库迁移"""
    if not DB_PATH.exists():
        print(f"数据库文件不存在: {DB_PATH}")
        print("首次运行时会自动创建新结构，无需迁移")
        return
    
    print(f"开始迁移数据库: {DB_PATH}")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # 检查 orders 表是否需要迁移
        cursor.execute("PRAGMA table_info(orders)")
        order_columns = {row[1] for row in cursor.fetchall()}
        
        if "xianyu_order_id" not in order_columns:
            print("添加 orders.xianyu_order_id 字段...")
            cursor.execute("ALTER TABLE orders ADD COLUMN xianyu_order_id VARCHAR(50)")
        
        # 更新 status 枚举（SQLite 不支持直接修改枚举，但字符串列可存储新值）
        # 将现有 pending 状态的订单保持不变
        
        # 检查 files 表是否需要迁移
        cursor.execute("PRAGMA table_info(files)")
        file_columns = {row[1] for row in cursor.fetchall()}
        
        if "file_hash" not in file_columns:
            print("添加 files.file_hash 字段...")
            cursor.execute("ALTER TABLE files ADD COLUMN file_hash VARCHAR(64)")
        
        if "oss_key" not in file_columns:
            print("添加 files.oss_key 字段...")
            cursor.execute("ALTER TABLE files ADD COLUMN oss_key VARCHAR(500)")
        
        if "is_uploaded" not in file_columns:
            print("添加 files.is_uploaded 字段...")
            cursor.execute("ALTER TABLE files ADD COLUMN is_uploaded BOOLEAN DEFAULT 0")
            # 将现有文件标记为本地已上传
            cursor.execute("UPDATE files SET is_uploaded = 1")
        
        if "is_selected" not in file_columns:
            print("添加 files.is_selected 字段...")
            cursor.execute("ALTER TABLE files ADD COLUMN is_selected BOOLEAN DEFAULT 1")
            # 将现有文件默认设为已选中
            cursor.execute("UPDATE files SET is_selected = 1")
        
        conn.commit()
        print("数据库迁移完成！")
        
    except Exception as e:
        conn.rollback()
        print(f"迁移失败: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
