from fastapi import APIRouter
from app.models import HealthResponse
from app.ml_service import ml_service
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
    ml_loaded = ml_service.is_loaded()

    return HealthResponse(
        status="healthy" if (ml_loaded and db_connected) else "degraded",
        version="1.0.0",
        ml_model_loaded=ml_loaded,
        database_connected=db_connected
    )


@router.get("/")
async def root():
    """
    Root Endpoint
    """
    return {
        "message": "Bottle Recycling API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }