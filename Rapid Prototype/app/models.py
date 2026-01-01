from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime


class BottleDetection(BaseModel):
    """Einzelne Flaschenerkennung"""
    class_name: str = Field(..., description="Typ der Flasche (z.B. PET, Glas, Aluminium)")
    confidence: float = Field(..., ge=0, le=1, description="Konfidenzwert der Erkennung")
    bounding_box: Optional[dict] = Field(None, description="Koordinaten der Bounding Box")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "class_name": "PET_Flasche",
                "confidence": 0.95,
                "bounding_box": {"x": 100, "y": 150, "width": 200, "height": 400}
            }
        }
    )


class RecyclingInfo(BaseModel):
    """Recycling-Informationen für einen Flaschentyp"""
    material: str = Field(..., description="Material der Flasche")
    recycling_category: str = Field(..., description="Recycling-Kategorie (Gelber Sack, Glascontainer, etc.)")
    instructions: str = Field(..., description="Detaillierte Recycling-Anleitung")
    pfand: Optional[float] = Field(None, description="Pfandbetrag in Euro")
    environmental_impact: Optional[str] = Field(None, description="Umweltauswirkungen")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "material": "PET (Polyethylenterephthalat)",
                "recycling_category": "Gelber Sack / Gelbe Tonne",
                "instructions": "Deckel abschrauben, Flasche zusammendrücken und in den Gelben Sack werfen.",
                "pfand": 0.25,
                "environmental_impact": "PET-Flaschen sind gut recyclebar und sollten im Kreislauf bleiben."
            }
        }
    )


class AnalysisResponse(BaseModel):
    """Response für Bildanalyse"""
    success: bool = Field(..., description="Ob die Analyse erfolgreich war")
    detections: List[BottleDetection] = Field(default_factory=list, description="Liste erkannter Flaschen")
    recycling_info: Optional[RecyclingInfo] = Field(None, description="Recycling-Informationen")
    message: Optional[str] = Field(None, description="Zusätzliche Nachricht oder Fehler")
    processing_time_ms: Optional[float] = Field(None, description="Verarbeitungszeit in Millisekunden")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Zeitstempel der Analyse")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "success": True,
                "detections": [
                    {
                        "class_name": "PET_Flasche",
                        "confidence": 0.95,
                        "bounding_box": {"x": 100, "y": 150, "width": 200, "height": 400}
                    }
                ],
                "recycling_info": {
                    "material": "PET",
                    "recycling_category": "Gelber Sack",
                    "instructions": "Deckel abschrauben und zusammendrücken",
                    "pfand": 0.25
                },
                "message": "1 Flasche erkannt",
                "processing_time_ms": 245.3,
                "timestamp": "2024-12-16T10:30:00Z"
            }
        }
    )


class HealthResponse(BaseModel):
    """Health Check Response"""
    status: str
    version: str
    ml_model_loaded: bool  # Umbenannt um Konflikt zu vermeiden
    database_connected: bool

    model_config = ConfigDict(
        protected_namespaces=()  # Erlaubt alle Feldnamen
    )