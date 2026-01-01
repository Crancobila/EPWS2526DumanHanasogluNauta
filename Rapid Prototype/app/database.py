from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional, Dict
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class DatabaseService:
    """Service für MongoDB-Operationen"""

    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db = None

    async def connect(self):
        """Verbindung zur Datenbank herstellen"""
        try:
            self.client = AsyncIOMotorClient(settings.mongodb_url)
            self.db = self.client[settings.mongodb_db_name]

            # Test der Verbindung
            await self.client.admin.command('ping')
            logger.info("MongoDB Verbindung erfolgreich hergestellt")
            return True
        except Exception as e:
            logger.error(f"MongoDB Verbindungsfehler: {e}")
            return False

    async def disconnect(self):
        """Verbindung zur Datenbank trennen"""
        if self.client:
            self.client.close()
            logger.info("MongoDB Verbindung geschlossen")

    async def is_connected(self) -> bool:
        """Prüft ob Datenbankverbindung besteht"""
        try:
            if self.client:
                await self.client.admin.command('ping')
                return True
        except Exception:
            pass
        return False

    async def get_recycling_info(self, bottle_type: str) -> Optional[Dict]:
        """
        Holt Recycling-Informationen für einen Flaschentyp

        Args:
            bottle_type: Typ der Flasche (z.B. "PET_Flasche", "Glasflasche")

        Returns:
            Dictionary mit Recycling-Informationen oder None
        """
        try:
            collection = self.db["recycling_info"]
            info = await collection.find_one({"bottle_type": bottle_type})
            return info
        except Exception as e:
            logger.error(f"Fehler beim Abrufen der Recycling-Info: {e}")
            return None

    async def save_analysis(self, analysis_data: Dict) -> Optional[str]:
        """
        Speichert eine Analyse in der Datenbank (für Statistiken/Logging)

        Args:
            analysis_data: Dictionary mit Analysedaten

        Returns:
            ID des gespeicherten Dokuments oder None
        """
        try:
            collection = self.db["analyses"]
            result = await collection.insert_one(analysis_data)
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"Fehler beim Speichern der Analyse: {e}")
            return None

    async def init_sample_data(self):
        """Initialisiert Beispieldaten für Recycling-Informationen"""
        collection = self.db["recycling_info"]

        # Prüfen ob schon Daten vorhanden sind
        count = await collection.count_documents({})
        if count > 0:
            logger.info("Recycling-Daten bereits vorhanden")
            return

        sample_data = [
            {
                "bottle_type": "PET_Flasche",
                "material": "PET (Polyethylenterephthalat)",
                "recycling_category": "Gelber Sack / Gelbe Tonne",
                "instructions": "Deckel abschrauben, Flasche zusammendrücken und in den Gelben Sack werfen. Pfandflaschen zum Automaten bringen.",
                "pfand": 0.25,
                "environmental_impact": "PET-Flaschen sind gut recyclebar. Durch Pfandsystem hohe Rücklaufquote in Deutschland."
            },
            {
                "bottle_type": "Glasflasche_Gruen",
                "material": "Grünes Glas",
                "recycling_category": "Grüner Glascontainer",
                "instructions": "Deckel entfernen und in den grünen Glascontainer werfen. Pfandflaschen zum Automaten bringen.",
                "pfand": 0.08,
                "environmental_impact": "Glas ist unendlich oft recyclebar ohne Qualitätsverlust."
            },
            {
                "bottle_type": "Glasflasche_Weiss",
                "material": "Weißes/klares Glas",
                "recycling_category": "Weißer Glascontainer",
                "instructions": "Deckel entfernen und in den weißen Glascontainer werfen. Pfandflaschen zum Automaten bringen.",
                "pfand": 0.08,
                "environmental_impact": "Weißglas ist besonders wertvoll für Recycling und sollte sortenrein entsorgt werden."
            },
            {
                "bottle_type": "Glasflasche_Braun",
                "material": "Braunes Glas",
                "recycling_category": "Brauner Glascontainer",
                "instructions": "Deckel entfernen und in den braunen Glascontainer werfen. Pfandflaschen zum Automaten bringen.",
                "pfand": 0.08,
                "environmental_impact": "Braunglas schützt den Inhalt vor Lichteinfluss und ist gut recyclebar."
            },
            {
                "bottle_type": "Aluminium_Dose",
                "material": "Aluminium",
                "recycling_category": "Gelber Sack / Gelbe Tonne",
                "instructions": "Dose entleeren und in den Gelben Sack werfen. Pfanddosen zum Automaten bringen.",
                "pfand": 0.25,
                "environmental_impact": "Aluminium-Recycling spart bis zu 95% Energie im Vergleich zur Neuproduktion."
            },
            {
                "bottle_type": "Mehrweg_Glas",
                "material": "Mehrweg-Glas",
                "recycling_category": "Rückgabe im Supermarkt",
                "instructions": "Flasche zum Pfandautomaten oder zur Rückgabestelle im Supermarkt bringen.",
                "pfand": 0.15,
                "environmental_impact": "Mehrwegflaschen können bis zu 50 Mal wiederverwendet werden - beste Ökobilanz!"
            }
        ]

        await collection.insert_many(sample_data)
        logger.info("Beispiel-Recycling-Daten eingefügt")


# Globale Instanz
db_service = DatabaseService()