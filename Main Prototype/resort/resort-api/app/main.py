from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from app.config import settings
from app.color_analysis_service import color_service  # ✅ Korrekt!
from app.database import db_service
from app.routes import analysis, health

# Logging konfigurieren
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifecycle Management - Startup und Shutdown Events
    """
    # Startup
    logger.info("Starte Bottle Recycling API...")

    # Color Analysis Service ist sofort bereit (kein Model laden nötig)
    logger.info("Color Analysis Service bereit")

    # Datenbank verbinden
    logger.info("Verbinde mit MongoDB...")
    await db_service.connect()

    # Beispieldaten initialisieren
    await db_service.init_sample_data()

    logger.info("API erfolgreich gestartet!")

    yield

    # Shutdown
    logger.info("Fahre API herunter...")
    await db_service.disconnect()
    logger.info("API beendet")


# FastAPI App initialisieren
app = FastAPI(
    title="Bottle Recycling API",
    description="Backend API für Flaschenidentifikation und Recycling-Anweisungen (Color-Based)",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware konfigurieren
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router einbinden
app.include_router(health.router)
app.include_router(analysis.router)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )