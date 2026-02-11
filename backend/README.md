# Order Platform Backend (Phase 1)

FastAPI 后端，负责订单管理平台一期核心能力：
- 订单全生命周期状态管理（严格状态机 + 管理员 override）
- 时间线事件记录
- 服务端 Webhook / Agent API（`X-Service-Key`）
- 管理看板、批量操作、通知中心
- 客户端可视化接口（时间线、需求确认、反馈、沟通摘要）

## 运行
```bash
cd backend
pip install -r requirements.txt
python main.py
```

## 数据库
- 默认数据库：`backend/data/database/app.db`
- 重建基线：
```bash
python -m migrations.reset_sqlite
```

## 主要接口

### 管理端
- `GET /api/v1/orders`
- `POST /api/v1/orders`
- `PATCH /api/v1/orders/{id}`
- `POST /api/v1/orders/{id}/status`
- `POST /api/v1/orders/{id}/status/override`
- `GET /api/v1/orders/{id}/timeline`
- `GET /api/v1/orders/{id}/full`
- `GET /api/v1/dashboard/metrics`
- `POST /api/v1/dashboard/batch`
- `GET /api/v1/notifications`

### 服务端（需 `X-Service-Key`）
- `POST /api/v1/webhook/xianyu-message`
- `POST /api/v1/webhook/agent-update`
- `POST /api/v1/webhook/codex-progress`
- `POST /api/v1/webhook/codex-result`
- `POST /api/v1/agent/orders`
- `PATCH /api/v1/agent/orders/{id}`
- `POST /api/v1/agent/orders/{id}/files`
- `POST /api/v1/agent/orders/{id}/timeline`

### 客户端
- `GET /api/v1/client/{access_key}/info`
- `GET /api/v1/client/{access_key}/files`
- `GET /api/v1/client/{access_key}/timeline`
- `POST /api/v1/client/{access_key}/requirements/confirm`
- `POST /api/v1/client/{access_key}/requirements/feedback`
- `GET /api/v1/client/{access_key}/conversation-summary`

## Mock 联调
- 文档：`backend/MOCK_INTEGRATION.md`
- 脚本：`backend/scripts/mock_webhook_flow.py`
