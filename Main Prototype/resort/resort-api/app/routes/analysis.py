from fastapi import APIRouter, UploadFile, File, HTTPException, status, Body
from typing import Optional
from app.models import AnalysisResponse, RecyclingInfo
from app.color_analysis_service import color_service
from app.database import db_service
from app.config import settings
import time
import logging
from datetime import datetime

router = APIRouter(prefix="/api/v1", tags=["Analysis"])
logger = logging.getLogger(__name__)


@router.post("/analyze", response_model=AnalysisResponse, status_code=status.HTTP_200_OK)
async def analyze_bottle(
        image: UploadFile = File(..., description="Bild der zu analysierenden Flasche"),
        roi_x_percent: Optional[float] = None,
        roi_y_percent: Optional[float] = None,
        roi_width_percent: Optional[float] = None,
        roi_height_percent: Optional[float] = None
):
    """
    Analysiert ein hochgeladenes Bild und klassifiziert die Flasche anhand von Farbwerten

    - **image**: Bilddatei (JPG, PNG, WEBP) - max 10MB
    - **roi_x_percent**: Optional - ROI X-Start als Prozent der Bildbreite (0.0-1.0)
    - **roi_y_percent**: Optional - ROI Y-Start als Prozent der Bildhöhe (0.0-1.0)
    - **roi_width_percent**: Optional - ROI Breite als Prozent (0.0-1.0)
    - **roi_height_percent**: Optional - ROI Höhe als Prozent (0.0-1.0)

    Returns:
        AnalysisResponse mit erkannter Flasche und Recycling-Informationen
    """
    start_time = time.time()

    # Dateivalidierung
    if not image.content_type or not image.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hochgeladene Datei muss ein Bild sein"
        )

    # Dateigröße prüfen
    contents = await image.read()
    if len(contents) > settings.max_upload_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Bild ist zu groß. Maximum: {settings.max_upload_size / 1024 / 1024}MB"
        )

    # Dateiendung prüfen
    file_extension = image.filename.split('.')[-1].lower() if image.filename else ''
    if file_extension not in settings.get_allowed_extensions():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Dateiformat nicht unterstützt. Erlaubt: {settings.allowed_extensions}"
        )

    try:
        # Optional: Custom ROI Konfiguration
        roi_config = None
        if any([roi_x_percent, roi_y_percent, roi_width_percent, roi_height_percent]):
            roi_config = {}
            if roi_x_percent is not None:
                roi_config['x_percent'] = max(0.0, min(1.0, roi_x_percent))
            if roi_y_percent is not None:
                roi_config['y_percent'] = max(0.0, min(1.0, roi_y_percent))
            if roi_width_percent is not None:
                roi_config['width_percent'] = max(0.0, min(1.0, roi_width_percent))
            if roi_height_percent is not None:
                roi_config['height_percent'] = max(0.0, min(1.0, roi_height_percent))

            logger.info(f"Verwende custom ROI: {roi_config}")

        # Bildanalyse durchführen
        detection = await color_service.analyze_image(contents, roi_config)

        # Recycling-Informationen abrufen wenn Flasche erkannt wurde
        recycling_info = None
        if detection:
            # Hole Recycling-Info aus Datenbank
            info_data = await db_service.get_recycling_info(detection.class_name)

            if info_data:
                recycling_info = RecyclingInfo(
                    material=info_data.get("material", ""),
                    recycling_category=info_data.get("recycling_category", ""),
                    instructions=info_data.get("instructions", ""),
                    pfand=info_data.get("pfand"),
                    environmental_impact=info_data.get("environmental_impact")
                )

        # Verarbeitungszeit berechnen
        processing_time = (time.time() - start_time) * 1000

        # Nachricht generieren
        success = detection is not None
        message = f"Flasche erkannt: {detection.class_name}" if success else "Keine Flasche erkannt (Konfidenz zu niedrig)"

        # Optional: Analyse in Datenbank speichern (für Statistiken)
        if detection:
            analysis_data = {
                "timestamp": datetime.utcnow(),
                "detection": detection.model_dump(),
                "processing_time_ms": processing_time,
                "file_size_bytes": len(contents),
                "roi_used": roi_config is not None
            }
            await db_service.save_analysis(analysis_data)

        return AnalysisResponse(
            success=success,
            detections=[detection] if detection else [],
            recycling_info=recycling_info,
            message=message,
            processing_time_ms=round(processing_time, 2),
            timestamp=datetime.utcnow()
        )

    except Exception as e:
        logger.error(f"Fehler bei der Analyse: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fehler bei der Bildanalyse: {str(e)}"
        )


@router.get("/recycling-info/{bottle_type}", response_model=RecyclingInfo)
async def get_recycling_info(bottle_type: str):
    """
    Holt Recycling-Informationen für einen spezifischen Flaschentyp

    - **bottle_type**: Typ der Flasche (z.B. "PET_Flasche", "Glasflasche_Gruen")

    Returns:
        RecyclingInfo mit detaillierten Recycling-Anweisungen
    """
    try:
        info_data = await db_service.get_recycling_info(bottle_type)

        if not info_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Keine Recycling-Informationen für '{bottle_type}' gefunden"
            )

        return RecyclingInfo(
            material=info_data.get("material", ""),
            recycling_category=info_data.get("recycling_category", ""),
            instructions=info_data.get("instructions", ""),
            pfand=info_data.get("pfand"),
            environmental_impact=info_data.get("environmental_impact")
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Fehler beim Abrufen der Recycling-Info: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fehler beim Abrufen der Informationen: {str(e)}"
        )