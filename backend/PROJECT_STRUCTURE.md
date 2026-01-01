# 📊 项目结构总览

## 完整目录树

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI应用入口
│   ├── api/
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── api.py             # 路由聚合
│   │       └── endpoints/
│   │           ├── __init__.py
│   │           ├── auth.py        # 认证端点（登录）
│   │           ├── orders.py      # 订单管理（CRUD + 日志）
│   │           ├── client.py      # 客户访问端点
│   │           └── files.py       # 文件上传下载
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py              # 配置管理
│   │   ├── security.py            # JWT + 密码哈希
│   │   └── deps.py                # 依赖注入
│   ├── db/
│   │   ├── __init__.py
│   │   └── session.py             # 数据库会话
│   ├── models/
│   │   ├── __init__.py
│   │   ├── admin.py               # 管理员模型
│   │   ├── order.py               # 订单模型
│   │   ├── file.py                # 文件模型
│   │   └── log.py                 # 访问日志模型
│   └── schemas/
│       ├── __init__.py
│       ├── admin.py               # 管理员Schema
│       ├── order.py               # 订单Schema
│       ├── file.py                # 文件Schema
│       └── log.py                 # 日志Schema
├── upload_storage/                # 文件存储目录
│   └── .gitkeep
├── .env                           # 环境变量配置
├── .gitignore                     # Git忽略文件
├── requirements.txt               # Python依赖
├── Dockerfile                     # Docker镜像
├── docker-compose.yml             # Docker编排
├── create_admin.py                # 创建管理员脚本
├── README.md                      # 项目文档
└── QUICKSTART.md                  # 快速启动指南
```

## 核心功能模块

### 1. 认证系统 (Authentication)
- **文件**: `app/api/v1/endpoints/auth.py`, `app/core/security.py`
- **功能**: 
  - JWT token生成和验证
  - 密码bcrypt哈希
  - 管理员登录

### 2. 订单管理 (Order Management)
- **文件**: `app/api/v1/endpoints/orders.py`, `app/models/order.py`
- **功能**:
  - 创建订单（自动生成12位access_key）
  - 查询订单列表（分页 + 状态筛选）
  - 获取订单详情
  - 删除订单
  - **核心功能**：查询订单访问日志（用于证据）

### 3. 客户门户 (Client Portal)
- **文件**: `app/api/v1/endpoints/client.py`
- **功能**:
  - 通过access_key访问订单信息
  - 获取文件列表
  - 自动记录访问日志（IP + User-Agent）

### 4. 文件系统 (File Management)
- **文件**: `app/api/v1/endpoints/files.py`, `app/models/file.py`
- **功能**:
  - 上传文件（白名单验证 + UUID命名）
  - 下载文件（流式传输）
  - 自动记录下载日志
  - 删除文件

### 5. 访问日志 (Access Logging)
- **文件**: `app/models/log.py`
- **功能**:
  - 记录所有页面访问（VISIT_PAGE）
  - 记录所有文件下载（DOWNLOAD_SUCCESS）
  - 存储IP地址、User-Agent、时间戳
  - 为法律证据提供支持

## 数据库模型关系

```
Admin (管理员)
  - 独立表，用于登录认证

Order (订单) 1 : N File (文件)
  - 一个订单可以有多个文件
  - 删除订单时级联删除文件

Order (订单) 1 : N AccessLog (访问日志)
  - 一个订单可以有多条访问记录
  - 删除订单时级联删除日志
```

## API端点总览

| 方法 | 端点 | 说明 | 认证 |
|-----|------|------|------|
| POST | `/api/v1/auth/login` | 管理员登录 | ❌ |
| GET | `/api/v1/admin/orders` | 列出所有订单 | ✅ JWT |
| POST | `/api/v1/admin/orders` | 创建新订单 | ✅ JWT |
| GET | `/api/v1/admin/orders/{id}` | 获取订单详情 | ✅ JWT |
| GET | `/api/v1/admin/orders/{id}/logs` | 获取访问日志（证据） | ✅ JWT |
| DELETE | `/api/v1/admin/orders/{id}` | 删除订单 | ✅ JWT |
| GET | `/api/v1/client/{key}/info` | 客户查看订单 | ✅ Hash |
| GET | `/api/v1/client/{key}/files` | 客户查看文件列表 | ✅ Hash |
| POST | `/api/v1/files/upload` | 上传文件 | ✅ JWT |
| GET | `/api/v1/files/download/{id}` | 下载文件 | ✅ JWT/Hash |
| DELETE | `/api/v1/files/{id}` | 删除文件 | ✅ JWT |

## 配置说明

### 环境变量 (.env)
- `SQLITE_URL`: 数据库连接字符串
- `SECRET_KEY`: JWT签名密钥（必须修改）
- `ALGORITHM`: JWT算法（HS256）
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token过期时间（7天）
- `UPLOAD_DIR`: 文件存储目录
- `CORS_ORIGINS`: 允许的前端域名

### 依赖包 (requirements.txt)
- `fastapi`: Web框架
- `uvicorn`: ASGI服务器
- `sqlalchemy`: ORM
- `aiosqlite`: 异步SQLite驱动
- `pydantic-settings`: 配置管理
- `python-jose`: JWT处理
- `passlib`: 密码哈希
- `python-multipart`: 文件上传

## 安全特性

✅ **认证安全**
- JWT token认证
- Bcrypt密码哈希
- Token过期机制

✅ **访问控制**
- 管理员端点需要JWT
- 客户端点需要access_key
- 文件下载权限验证

✅ **文件安全**
- 文件类型白名单
- UUID重命名防止路径穿越
- 独立存储目录

✅ **审计日志**
- 完整的IP追踪
- User-Agent记录
- 时间戳记录

## 下一步开发建议

1. **前端开发** - React/Vue实现管理后台和客户门户
2. **邮件通知** - 订单创建后发送邮件给客户
3. **文件预览** - 在线预览PDF、图片等
4. **批量操作** - 批量上传文件、批量创建订单
5. **数据导出** - 导出访问日志为CSV/Excel
6. **统计分析** - 访问热力图、下载统计
