from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True

    # MongoDB
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "bottle_recycling"

    # Image Analysis
    min_confidence: float = 0.6  # Mindest-Konfidenz für Farberkennung
    roi_enabled: bool = True  # ROI (Region of Interest) aktiviert
    roi_x_percent: float = 0.25  # ROI startet bei 25% der Bildbreite
    roi_y_percent: float = 0.20  # ROI startet bei 20% der Bildhöhe
    roi_width_percent: float = 0.50  # ROI ist 50% der Bildbreite breit
    roi_height_percent: float = 0.60  # ROI ist 60% der Bildhöhe hoch

    # Upload
    max_upload_size: int = 10485760  # 10MB
    allowed_extensions: str = "jpg,jpeg,png,webp"

    # CORS
    cors_origins: str = "http://localhost:3000,http://localhost:19006,http://localhost:8081"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra='ignore'  # Ignoriert unbekannte Felder statt Fehler
    )

    def get_allowed_extensions(self) -> List[str]:
        """Gibt allowed_extensions als Liste zurück"""
        return [ext.strip() for ext in self.allowed_extensions.split(',')]

    def get_cors_origins(self) -> List[str]:
        """Gibt CORS origins als Liste zurück"""
        return [origin.strip() for origin in self.cors_origins.split(',')]


settings = Settings()