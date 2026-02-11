# 一期 Mock 联调说明

## 目标
- 在闲鱼网关、OpenClaw、Codex 未接入前，验证订单平台全链路状态流转。
- 保持 Webhook 协议稳定，二期可替换为真实事件源。

## 前置条件
- 后端服务启动在 `http://127.0.0.1:8000`
- 已创建带 scope 的服务 Key:
  - `webhook:xianyu`
  - `webhook:agent`
  - `webhook:codex`

## 一键脚本
```bash
cd backend
python scripts/mock_webhook_flow.py --service-key YOUR_KEY
```

## 协议约定（供二期 XianyuAutoAgent 对接）
- `POST /api/v1/webhook/xianyu-message`
  - 关键字段: `event_id`, `xianyu_account`, `client_name`, `message`
- `POST /api/v1/webhook/agent-update`
  - 关键字段: `event_id`, `order_id`, `status`, `requirements`, `note`
- `POST /api/v1/webhook/codex-progress`
  - 关键字段: `event_id`, `order_id`, `progress`, `stage`
- `POST /api/v1/webhook/codex-result`
  - 关键字段: `event_id`, `order_id`, `success`, `summary`, `artifacts`

## 幂等规则
- 幂等键: `source + event_id`
- 重复事件返回 `duplicate=true`，不重复写入业务数据。
