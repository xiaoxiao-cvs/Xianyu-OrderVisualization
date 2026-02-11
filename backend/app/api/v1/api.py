from fastapi import APIRouter
from app.api.v1.endpoints import agent, auth, client, files, orders, webhook

api_router = APIRouter()

# Auth routes
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Admin routes - orders API
api_router.include_router(orders.router, prefix="/orders", tags=["Admin - Orders"])

# Client routes
api_router.include_router(client.router, prefix="/client", tags=["Client"])

# File routes
api_router.include_router(files.router, prefix="/files", tags=["Files"])

# Service routes
api_router.include_router(webhook.router, prefix="/webhook", tags=["Webhook"])
api_router.include_router(agent.router, prefix="/agent", tags=["Agent"])
