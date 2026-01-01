# Xianyu Order Visualization - Backend

FastAPI backend for order management and file delivery tracking.

## Features

- ✅ **Admin Authentication**: JWT-based authentication for administrators
- ✅ **Order Management**: Create, read, update, delete orders with unique access keys
- ✅ **File Upload/Download**: Secure file handling with UUID-based storage
- ✅ **Access Logging**: Track all client visits and downloads for evidence
- ✅ **Client Portal**: Hash-based URLs for clients to view orders and download files
- ✅ **SQLite Database**: Lightweight async database with SQLAlchemy

## Tech Stack

- **FastAPI** - Modern async web framework
- **SQLAlchemy 2.0** - Async ORM
- **SQLite + aiosqlite** - Async database
- **Pydantic** - Data validation
- **JWT** - Authentication tokens
- **Uvicorn** - ASGI server

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

Edit `.env` file:
```env
SECRET_KEY=your-secret-key-here
UPLOAD_DIR=/absolute/path/to/upload_storage
```

### 3. Run the Server

```bash
python main.py
```

API will be available at: http://localhost:8000

Documentation: http://localhost:8000/docs

### 4. Create First Admin User

Run a Python script to create admin:

```python
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.models.admin import Admin
from app.core.security import get_password_hash

async def create_admin():
    async with AsyncSessionLocal() as db:
        admin = Admin(
            username="admin",
            hashed_password=get_password_hash("admin123")
        )
        db.add(admin)
        await db.commit()
        print("Admin created successfully!")

asyncio.run(create_admin())
```

## Docker Deployment

### Build and Run

```bash
docker-compose up -d
```

### View Logs

```bash
docker-compose logs -f
```

### Stop

```bash
docker-compose down
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Admin login

### Admin - Orders
- `GET /api/v1/admin/orders` - List all orders
- `POST /api/v1/admin/orders` - Create new order
- `GET /api/v1/admin/orders/{order_id}` - Get order details
- `GET /api/v1/admin/orders/{order_id}/logs` - Get access logs (evidence)
- `DELETE /api/v1/admin/orders/{order_id}` - Delete order

### Client
- `GET /api/v1/client/{access_key}/info` - Get order info
- `GET /api/v1/client/{access_key}/files` - List files

### Files
- `POST /api/v1/files/upload` - Upload file (admin)
- `GET /api/v1/files/download/{file_id}` - Download file
- `DELETE /api/v1/files/{file_id}` - Delete file (admin)

## Database Schema

### Tables
- **admins** - Admin users
- **orders** - Client orders with access keys
- **files** - Uploaded files metadata
- **access_logs** - IP/download tracking for evidence

## Security Features

- JWT token authentication for admins
- Hash-based access keys for clients (12 characters)
- Password hashing with bcrypt
- File type validation
- UUID-based file storage
- IP address logging
- User agent tracking

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/     # API routes
│   │       └── api.py         # Route aggregation
│   ├── core/                  # Config & security
│   ├── db/                    # Database session
│   ├── models/                # SQLAlchemy models
│   ├── schemas/               # Pydantic schemas
│   └── main.py                # FastAPI app
├── upload_storage/            # File storage
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

## License

MIT
