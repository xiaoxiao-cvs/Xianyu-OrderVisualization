"""
Script to create an admin user
Usage: python create_admin.py
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent))

from app.db.session import AsyncSessionLocal, init_db
from app.models.admin import Admin
from app.core.security import get_password_hash


async def create_admin(username: str, password: str):
    """Create an admin user"""
    # Initialize database first
    await init_db()
    
    async with AsyncSessionLocal() as db:
        # Check if admin already exists
        from sqlalchemy import select
        result = await db.execute(select(Admin).where(Admin.username == username))
        existing_admin = result.scalar_one_or_none()
        
        if existing_admin:
            print(f"❌ Admin '{username}' already exists!")
            return False
        
        # Create new admin
        admin = Admin(
            username=username,
            hashed_password=get_password_hash(password)
        )
        
        db.add(admin)
        await db.commit()
        
        print(f"✅ Admin '{username}' created successfully!")
        print(f"   Username: {username}")
        print(f"   Password: {password}")
        print("\n⚠️  Please change the password after first login in production!")
        return True


async def main():
    """Main function"""
    print("=" * 50)
    print("  Xianyu Order API - Create Admin User")
    print("=" * 50)
    print()
    
    # Get input from user
    username = input("Enter admin username [admin]: ").strip() or "admin"
    password = input("Enter admin password [admin123]: ").strip() or "admin123"
    
    print()
    await create_admin(username, password)


if __name__ == "__main__":
    asyncio.run(main())
