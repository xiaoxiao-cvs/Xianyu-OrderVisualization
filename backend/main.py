#!/usr/bin/env python3
"""
Xianyu Order Visualization API - 启动脚本
直接运行: python main.py
"""
import uvicorn
from app.main import app

if __name__ == "__main__":
    print("Starting Xianyu Order API...")
    print("API Docs: http://localhost:8001/docs")
    print("Health Check: http://localhost:8001/health")
    print()
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
