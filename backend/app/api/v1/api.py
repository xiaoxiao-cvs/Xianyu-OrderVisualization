from fastapi import APIRouter
from app.api.v1.endpoints import auth, orders, client, files

api_router = APIRouter()

# Auth routes
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Admin routes
api_router.include_router(orders.router, prefix="/admin/orders", tags=["Admin - Orders"])

# Client routes
api_router.include_router(client.router, prefix="/client", tags=["Client"])

# File routes
api_router.include_router(files.router, prefix="/files", tags=["Files"])
