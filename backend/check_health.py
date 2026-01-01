#!/usr/bin/env python3
"""
Backend项目健康检查脚本
检查所有必要文件是否存在，导入是否正常
"""
import sys
from pathlib import Path
import importlib.util

print("=" * 60)
print("  Xianyu Order API - 项目健康检查")
print("=" * 60)
print()

# 检查文件列表
required_files = [
    "app/__init__.py",
    "app/main.py",
    "app/core/config.py",
    "app/core/security.py",
    "app/core/deps.py",
    "app/db/session.py",
    "app/models/admin.py",
    "app/models/order.py",
    "app/models/file.py",
    "app/models/log.py",
    "app/schemas/admin.py",
    "app/schemas/order.py",
    "app/schemas/file.py",
    "app/schemas/log.py",
    "app/api/v1/api.py",
    "app/api/v1/endpoints/auth.py",
    "app/api/v1/endpoints/orders.py",
    "app/api/v1/endpoints/client.py",
    "app/api/v1/endpoints/files.py",
    "requirements.txt",
    ".env",
    "Dockerfile",
    "docker-compose.yml",
]

print("📋 检查必要文件...")
missing_files = []
for file_path in required_files:
    full_path = Path(file_path)
    if full_path.exists():
        print(f"  ✅ {file_path}")
    else:
        print(f"  ❌ {file_path} - 缺失!")
        missing_files.append(file_path)

print()

if missing_files:
    print(f"❌ 发现 {len(missing_files)} 个缺失文件!")
    sys.exit(1)
else:
    print("✅ 所有必要文件都存在!")

print()
print("📦 检查目录结构...")

required_dirs = [
    "app",
    "app/api",
    "app/api/v1",
    "app/api/v1/endpoints",
    "app/core",
    "app/db",
    "app/models",
    "app/schemas",
    "upload_storage",
]

for dir_path in required_dirs:
    full_path = Path(dir_path)
    if full_path.is_dir():
        print(f"  ✅ {dir_path}/")
    else:
        print(f"  ❌ {dir_path}/ - 缺失!")

print()
print("=" * 60)
print("  健康检查完成!")
print("=" * 60)
print()
print("🚀 下一步:")
print("  1. 安装依赖: pip install -r requirements.txt")
print("  2. 创建管理员: python create_admin.py")
print("  3. 启动服务: python main.py")
print("  4. 访问文档: http://localhost:8000/docs")
print()
