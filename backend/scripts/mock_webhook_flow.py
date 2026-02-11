"""
一期联调 Mock 脚本

用途:
1. 模拟 xianyu/agent/codex webhook 推送
2. 验证幂等与状态流转

使用方式:
    python scripts/mock_webhook_flow.py --base-url http://127.0.0.1:8000 --service-key YOUR_KEY
"""
import argparse
import asyncio
from datetime import datetime
from typing import Any, Dict

import httpx


def _event_id(prefix: str) -> str:
    return f"{prefix}-{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}"


async def post_event(client: httpx.AsyncClient, url: str, payload: Dict[str, Any]):
    response = await client.post(url, json=payload)
    print(f"{url} -> {response.status_code}")
    print(response.text)


async def main(base_url: str, service_key: str):
    headers = {"X-Service-Key": service_key}
    async with httpx.AsyncClient(base_url=base_url, headers=headers, timeout=20.0) as client:
        # 1) 模拟闲鱼消息，自动创建 draft 订单
        await post_event(
            client,
            "/api/v1/webhook/xianyu-message",
            {
                "event_id": _event_id("xianyu"),
                "xianyu_account": "test_account_a",
                "client_name": "mock-client",
                "message": "我需要一个爬虫+数据看板项目",
                "payload": {"source": "mock"},
            },
        )

        # 2) 假设订单ID为1，模拟 Agent 更新
        await post_event(
            client,
            "/api/v1/webhook/agent-update",
            {
                "event_id": _event_id("agent"),
                "order_id": 1,
                "status": "collected",
                "requirements": {"summary": "爬虫与可视化看板"},
                "note": "需求收集完成",
                "payload": {"source": "mock"},
            },
        )

        # 3) 模拟 Codex 进度
        await post_event(
            client,
            "/api/v1/webhook/codex-progress",
            {
                "event_id": _event_id("progress"),
                "order_id": 1,
                "progress": 50,
                "stage": "coding",
                "payload": {"source": "mock"},
            },
        )

        # 4) 模拟 Codex 结果
        await post_event(
            client,
            "/api/v1/webhook/codex-result",
            {
                "event_id": _event_id("result"),
                "order_id": 1,
                "success": True,
                "summary": "编码完成，进入审核",
                "artifacts": {"files": ["README.md", "main.py"]},
                "payload": {"source": "mock"},
            },
        )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://127.0.0.1:8000")
    parser.add_argument("--service-key", required=True)
    args = parser.parse_args()
    asyncio.run(main(args.base_url, args.service_key))
