"""
Main FastAPI application for TradeGuard AI API
"""
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
from typing import Optional
import os

from api.routers import analyze, risk, reports, users, dashboard
from api.config import settings
from api.database import engine, Base
from api.middleware import LoggingMiddleware

# Create tables on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create database tables
    print("Starting up... Creating database tables")
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown: Cleanup
    print("Shutting down...")

# Initialize FastAPI app
app = FastAPI(
    title="TradeGuard AI API",
    description="API for trading risk analysis and educational insights",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan
)

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add custom middleware
app.add_middleware(LoggingMiddleware)

# Include routers
app.include_router(analyze.router, prefix="/api/analyze", tags=["Analysis"])
app.include_router(risk.router, prefix="/api/risk", tags=["Risk Assessment"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])

# Health check endpoint
@app.get("/")
async def root():
    return {
        "message": "TradeGuard AI API",
        "version": "1.0.0",
        "docs": "/api/docs",
        "status": "operational"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Run the app
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )