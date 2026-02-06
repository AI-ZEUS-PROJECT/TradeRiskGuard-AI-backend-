"""
Database setup with AsyncIO support
"""
from sqlalchemy import create_engine, inspect
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
import os
import sys

# DATABASE CONFIG
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./tradeguard.db")
# Create Async URL (sqlite:///... -> sqlite+aiosqlite:///...)
search_string = "sqlite" if "sqlite" in DATABASE_URL else "postgresql"
replace_string = "sqlite+aiosqlite" if "sqlite" in DATABASE_URL else "postgresql+asyncpg"

# If it's already async, don't replace
if "+aiosqlite" in DATABASE_URL or "+asyncpg" in DATABASE_URL:
    ASYNC_DATABASE_URL = DATABASE_URL
else:
    ASYNC_DATABASE_URL = DATABASE_URL.replace(search_string, replace_string, 1)

# =====================================================
# SYNCHRONOUS SETUP (LEGACY)
# =====================================================
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    echo=False
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# =====================================================
# ASYNCHRONOUS SETUP (NEW)
# =====================================================
async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    echo=False
)

AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

# Base class
Base = declarative_base()

# =====================================================
# UTILITIES
# =====================================================

def init_db():
    """Initialize database by creating all tables (Sync)"""
    try:
        from api import models  # Import models here to avoid circular imports
        
        print("🔧 Creating database tables...")
        Base.metadata.create_all(bind=engine)
        
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        print(f"✅ Database initialized successfully!")
        print(f"📋 Tables created: {tables}")
        return True
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        import traceback
        traceback.print_exc()
        return False

async def init_async_db():
    """Initialize database asynchronously"""
    try:
        from api import models
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        return True
    except Exception as e:
        print(f"❌ Error initializing async database: {e}")
        return False

# Dependency for Sync routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Dependency for Async routes
async def get_async_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

def check_tables():
    """Check which tables exist"""
    inspector = inspect(engine)
    return inspector.get_table_names()