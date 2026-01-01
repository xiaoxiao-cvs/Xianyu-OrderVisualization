# Backend Development Todolist (FastAPI + SQLite)

## 1. Project Configuration & Structure
遵循 FastAPI 的 CoC (约定优于配置) 目录结构。

- [ ] **初始化目录结构**
  ```text
  backend/
  ├── app/
  │   ├── api/
  │   │   └── v1/
  │   │       ├── endpoints/  # 路由实现 (orders, auth, files)
  │   │       └── api.py      # 路由聚合
  │   ├── core/               # 核心配置 (config.py, security.py)
  │   ├── db/                 # 数据库会话与Base (session.py)
  │   ├── models/             # SQLAlchemy ORM 模型
  │   ├── schemas/            # Pydantic 数据交互模型
  │   └── main.py             # App 入口
  ├── upload_storage/         # 文件存储根目录 (gitkeep)
  ├── requirements.txt
  └── .env                    # 环境变量
  ```

- [ ] **环境配置** (app/core/config.py)
  - 使用 pydantic-settings 读取 .env
  - 配置 SQLITE_URL: `sqlite+aiosqlite:///./app.db` (使用异步驱动)
  - 配置 SECRET_KEY, ALGORITHM (HS256), ACCESS_TOKEN_EXPIRE_MINUTES
  - 配置 UPLOAD_DIR (绝对路径)

## 2. Database & Models (SQLite Optimized)
使用 SQLAlchemy 2.0 语法。

- [ ] **数据库连接** (app/db/session.py)
  - 配置 `create_async_engine` (注意 SQLite 需要设置 `connect_args={"check_same_thread": False}`)
  - 创建 AsyncSession 依赖项 `get_db`

- [ ] **管理员模型** (app/models/admin.py)
  - 字段: id (int, pk), username (unique), hashed_password

- [ ] **订单模型** (app/models/order.py)
  - 字段: id (int, pk), access_key (String(12), unique, indexed), client_name, description, status (Enum: pending, dev, delivered), created_at, expires_at

- [ ] **文件模型** (app/models/file.py)
  - 字段: id (int, pk), order_id (FK), filename_original, filename_saved (UUID), file_size, file_type (Enum: req, source), uploaded_at

- [ ] **访问日志模型** (app/models/log.py)
  - 字段: id (int, pk), order_id (FK), ip_address, user_agent, action_type (download/view), target_file, timestamp

## 3. Authentication & Dependencies
区分管理员（JWT）和客户（Hash URL）。

- [ ] **安全工具类** (app/core/security.py)
  - 实现 `verify_password`, `get_password_hash`
  - 实现 `create_access_token`

- [ ] **依赖注入: 管理员校验** (deps.py)
  - `get_current_admin`: 验证 Header 中的 `Authorization: Bearer <token>`

- [ ] **依赖注入: 订单访问校验** (deps.py)
  - `get_order_by_hash`: 从 URL 路径获取 `access_key`，查询 SQLite，若不存在或过期抛出 404

## 4. 📡 API Endpoints (v1 Prefix)

### 4.1 鉴权模块 (/api/v1/auth)
- [ ] **POST /login**: 接收表单数据，返回 JWT Token

### 4.2 订单管理 (管理员视角) (/api/v1/admin/orders)
- [ ] **GET /**: 列出所有订单 (分页 + 状态筛选)
- [ ] **POST /**: 创建新订单 (自动生成 12位 Hash)
- [ ] **GET /{order_id}/logs**: 核心功能，查询该订单的所有 IP 访问/下载记录 (用于生成证据)
- [ ] **DELETE /{order_id}**: 删除订单及关联文件

### 4.3 客户/交付交互 (/api/v1/client/{access_key})
所有接口需依赖 `get_order_by_hash`

- [ ] **GET /info**: 获取订单基本信息 (状态、标题) 和文件列表
  - Hook: 触发后台任务，记录 "VISIT_PAGE" 日志 (IP + UA)

### 4.4 文件传输核心 (/api/v1/files)
- [ ] **POST /upload**:
  - Params: `access_key`, `file`
  - Logic:
    - 校验后缀白名单
    - 使用 python-magic 读取字节头校验真实类型
    - 重命名为 UUID 存储
    - 写入 SQLite File 表

- [ ] **GET /download/{file_id}**:
  - Params: `token` (Query param) 或 `access_key`
  - Logic:
    - 鉴权：确认文件属于该 Order
    - Hook: 触发 BackgroundTasks 写入 AccessLog (记录 "DOWNLOAD_SUCCESS", IP, 时间)
    - 响应: StreamingResponse (流式传输，内存友好)

## 5. Security & Reliability
- [ ] **CORS 设置**: 允许 React 前端 `http://localhost:3000` 及生产域名
- [ ] **Global Exception Handler**: 统一捕获异常，返回标准 JSON 错误格式 `{ "detail": "..." }`
- [ ] **Startup Event**: 应用启动时检查 UPLOAD_DIR 是否存在，不存在则创建

## 6. Deployment (Simple)
- [ ] **Dockerfile**: 基于 `python:3.10-slim`
- [ ] **Docker Compose**:
  - 包含 backend 服务
  - 挂载 app.db 和 upload_storage/ 到宿主机，防止重启数据丢失

---

## SQLite 特别注意事项

在使用 SQLite + FastAPI (Async) 时，只需注意 `connect_args` 的配置，其他逻辑与 MySQL 无异。

在 `app/db/session.py` 中，请使用如下配置以避免线程错误：

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# 使用 aiosqlite 驱动
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///./app.db"

engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}, # SQLite 必须配置这个
    echo=True,
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)