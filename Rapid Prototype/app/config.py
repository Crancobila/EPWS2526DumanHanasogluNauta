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

    # Model - umbenannt um Namespace-Konflikt zu vermeiden
    ml_model_path: str = "models/bottle_classifier.pt"
    confidence_threshold: float = 0.5

    # Upload
    max_upload_size: int = 10485760  # 10MB
    allowed_extensions: str = "jpg,jpeg,png,webp"  # Als String, wird gesplittet

    # CORS
    cors_origins: str = "http://localhost:3000,http://localhost:19006,http://localhost:8081"  # Als String

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        protected_namespaces=('settings_',)  # Erlaubt model_ prefix
    )

    def get_allowed_extensions(self) -> List[str]:
        """Gibt allowed_extensions als Liste zurück"""
        return [ext.strip() for ext in self.allowed_extensions.split(',')]

    def get_cors_origins(self) -> List[str]:
        """Gibt CORS origins als Liste zurück"""
        return [origin.strip() for origin in self.cors_origins.split(',')]


settings = Settings()