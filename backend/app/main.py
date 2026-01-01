from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from app.core.config import settings
from app.db.session import init_db
from app.api.v1.api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan events for the application
    - Startup: Initialize database and ensure upload directory exists
    - Shutdown: Cleanup tasks
    """
    # Startup
    print("🚀 Starting up application...")
    
    # Ensure upload directory exists
    settings.ensure_upload_dir()
    print(f"✅ Upload directory ready: {settings.UPLOAD_DIR}")
    
    # Initialize database tables
    await init_db()
    print("✅ Database initialized")
    
    yield
    
    # Shutdown
    print("👋 Shutting down application...")


# Create FastAPI application
app = FastAPI(
    title="Xianyu Order Visualization API",
    description="Backend API for order management and file delivery tracking",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler to catch all unhandled exceptions
    Returns a standard JSON error format
    """
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": f"Internal server error: {str(exc)}"
        }
    )


# Include API router
app.include_router(api_router, prefix="/api/v1")


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "xianyu-order-api"
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Xianyu Order Visualization API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }
