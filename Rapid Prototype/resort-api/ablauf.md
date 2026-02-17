# Ablauf / Dateiübersicht

## Wurzelverzeichnis
- **README.md** – derzeit leer; vorgesehen für allgemeine Projektbeschreibung.
- **ROI_DOCUMENTATION.md** – ausführliche (deutschsprachige) Erklärung, warum und wie eine Region of Interest (ROI) für die Farbanalyse genutzt wird, inkl. Beispiel-Parameter, Visualisierung, API-Beispiele und Best Practices.
- **.env / .env.example** – Umgebungsvariablen für Server (Host, Port, Debug), MongoDB-Zugang, Farbanalyse-Grenzen (Konfidenz, ROI-Parameter), Upload-Limits und CORS-Ursprünge.
- **.gitignore** – blendet Artefakte aus (Python-Builds, virtuelle Umgebungen, IDE-Dateien, Modelle, Logs, Datenbanken, temporäre Uploads).
- **requirements.txt** – listet alle Python-Abhängigkeiten (FastAPI, Uvicorn, OpenCV, NumPy, Motor, Pydantic, usw.).
- **Dockerfile** – baut ein Python-3.10-Image, installiert OpenCV-Systemlibs, lädt Requirements, kopiert Code, erstellt `models/`, setzt Healthcheck und startet `python -m app.main`.
- **docker-compose.yml** – definiert Services `api`, `mongo`, optional `mongo-express`; verdrahtet Env-Variablen, Volumes (inkl. Hot-Reload `./app`), Ports (8000/27017/8081) und gemeinsames Bridge-Netz.
- **test_api.py** – CLI-Skript zum lokalen Test: Health-Check, optionaler Analyse-Call (inkl. ROI-Parametern), sowie Abruf einzelner Recycling-Infos; nutzt `requests` und liefert gut lesbare Konsolenausgabe.
- **models/** – leerer Ordner als Platzhalter für ML-Modelle (wird auch in Docker gebaut).
- **app/** – Hauptanwendung (siehe unten).

## Paket `app`
- **app/__init__.py** – markiert Paket und speichert Versionsstring `1.0.0`.
- **app/config.py** – Pydantic Settings-Klasse, liest `.env`, kapselt Host/Port/Debug, Mongo-URL/DB, Analysegrenzen (Konfidenz, ROI-Prozente), Upload-Limits, erlaubte Dateiendungen und CORS-Ursprünge; bietet Helfer `get_allowed_extensions()` und `get_cors_origins()`.
- **app/main.py** – erstellt FastAPI-App: konfiguriert Logging, Lifespan-Events (startet Color-Service, verbindet Mongo, initialisiert Beispiel-Daten, trennt Verbindung beim Shutdown), setzt CORS, registriert Router (`health`, `analysis`) und erlaubt lokalen Start via `uvicorn`.
- **app/color_analysis_service.py** – zentraler Farbanalyse-Service:
  - `extract_roi` liest ROI aus globaler oder Request-spezifischer Config, beschneidet Bildgrenzen und liefert ROI samt Koordinaten.
  - `analyze_dominant_color` konvertiert BGR→RGB/HSV, filtert braun/beige Hintergrundpixel, wendet Foreground-Masken an, berechnet Durchschnittswerte, Helligkeit, Varianz, führt K-Means (k=3) auf bis zu 1000 Pixeln aus und protokolliert Ergebnisse.
  - `classify_bottle_type` nutzt Hue/Sättigung/Helligkeit zur Zuordnung `Glasflasche_Gruen/Weiss/Braun` samt Konfidenz und Fallbacks.
  - `analyze_image` validiert & dekodiert Bildbytes, extrahiert ROI, ruft Farbanalyse+Klassifikation auf, prüft Konfidenz, baut `BottleDetection` und liefert sie zurück.
  - `visualize_roi` zeichnet ROI-Rechteck (grün) ins Bild und gibt JPEG-Bytes aus; globale Instanz `color_service` am Dateiende.
- **app/database.py** – asynchroner MongoDB-Service mit Motor:
  - `connect`/`disconnect`/`is_connected` verwalten Verbindung.
  - `get_recycling_info` holt Informationen aus Collection `recycling_info`.
  - `save_analysis` persistiert Analyse-Metadaten in Sammlung `analyses`.
  - `init_sample_data` füllt `recycling_info` einmalig mit Glas- und Mehrweg-Beispielen.
- **app/models.py** – Pydantic-Schemas für API:
  - `BottleDetection` (Klasse, Konfidenz, Bounding Box).
  - `RecyclingInfo` (Material, Kategorie, Anleitung, Wirkung).
  - `AnalysisResponse` (Status, Liste von Detections, Recycling-Info, Nachricht, Laufzeit, Timestamp).
  - `HealthResponse` (Status, Version, Flags für Analyse- und DB-Bereitschaft).
- **app/routes/health.py** – `GET /health` kombiniert Status von Color-Service und DB in `HealthResponse`; `GET /` liefert Basisinfo (Message, Version, Links).
- **app/routes/analysis.py** – Kern-Endpunkte:
  - `POST /api/v1/analyze` akzeptiert UploadFile + optionale ROI-Parameter, prüft Content-Type/Größe/Endung, baut ROI-Config, ruft `color_service`, ergänzt Recycling-Infos aus DB (via `RecyclingInfo`), rechnet Verarbeitungszeit, speichert ggf. Analyse-Log und verpackt Antwort in `AnalysisResponse`.
  - `GET /api/v1/recycling-info/{bottle_type}` – liefert Recycling-Datensatz oder 404.

## Virtuelle Umgebungen & IDE
- **.venv/**, **venv/** – lokale Python-Umgebungen.
- **.idea/** – JetBrains/IntelliJ-Projektkonfiguration (nicht einzeln beschrieben, dient nur IDE).

> Mit dieser Übersicht lässt sich der End-to-End-Fluss nachvollziehen: Konfiguration → API-Start → Bild-Upload → ROI-Extraktion → Farbklassifikation → Datenbank-Recherche → Antwort inkl. Recycling-Empfehlung. Die Zusatzdokumentation zur ROI unterstützt dabei, passende Parameter zu wählen.***
