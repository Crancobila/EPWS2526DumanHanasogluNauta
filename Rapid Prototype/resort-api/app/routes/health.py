from fastapi import APIRouter
from app.models import HealthResponse
from app.color_analysis_service import color_service
from app.database import db_service

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health Check Endpoint - prüft Status aller Services

    Returns:
        HealthResponse mit Status-Informationen
    """
    db_connected = await db_service.is_connected()
    color_ready = color_service.is_ready()

    return HealthResponse(
        status="healthy" if (color_ready and db_connected) else "degraded",
        version="2.0.0",
        analysis_ready=color_ready,
        database_connected=db_connected
    )


@router.get("/")
async def root():
    """
    Root Endpoint
    """
    return {
        "message": "Bottle Recycling API (Color-Based Analysis)",
        "version": "2.0.0",
        "docs": "/docs",
        "health": "/health",
        "analysis_method": "color-based (no ML model required)"
    }