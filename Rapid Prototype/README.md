#  ReSort Backend API (Color-Based)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-009688.svg?style=flat&logo=FastAPI)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.10-3776AB.svg?style=flat&logo=python)](https://www.python.org)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED.svg?style=flat&logo=docker)](https://www.docker.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-4.4-47A248.svg?style=flat&logo=mongodb)](https://www.mongodb.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Backend API für **farb-basierte Flaschenidentifikation** und Recycling-Informationen. Erkennt Flaschen anhand ihrer Farbe (grün, braun, transparent) und liefert detaillierte Recycling-Anweisungen inklusive Pfandbeträgen.

##  Features

-  **Farb-basierte Klassifizierung** - Keine ML-Modelle, nur OpenCV
-  **ROI (Region of Interest)** Support - Fokussiere auf relevante Bildbereiche
-  **Schnell** - Startup <5s, Analyse 50-150ms
-  **Leichtgewichtig** - Docker Image ~700MB (statt 1.2GB)
-  **RESTful API** - Vollständig dokumentiert mit OpenAPI/Swagger
-  **MongoDB** - Persistente Speicherung von Recycling-Daten
-  **CORS Support** - Frontend-Integration ready
-  **Docker Ready** - Ein Befehl zum Starten

##  Erkannte Flaschentypen

| Typ | Farberkennung | Pfand | Entsorgung |
|-----|---------------|-------|------------|
|  **Glasflasche Grün** | Hue 28-90°, Sättigung >20% | 0.08€ | Grüner Container |
|  **Glasflasche Braun** | Hue 5-35° oder >155°, dunkel | 0.08€ | Brauner Container |
|  **Glasflasche Weiß** | Niedrige Sättigung, mittel | 0.08€ | Weißer Container |
|  **PET-Flasche** | Sehr hell, transparent | 0.25€ | Gelber Sack |
|  **Aluminium-Dose** | Metallic, glänzend | 0.25€ | Gelber Sack |
|  **Mehrweg-Glas** | Mittlere Helligkeit | 0.15€ | Supermarkt |

##  Quick Start

### Mit Docker (Empfohlen)

```bash
# Repository klonen
git clone <repository-url>
cd reSort-backend

# Starten
docker-compose up -d

# API ist verfügbar unter:
# http://localhost:8000
```

### Ohne Docker

```bash
# Virtual Environment erstellen
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\Activate.ps1

# Dependencies installieren
pip install -r requirements.txt

# MongoDB starten (separat erforderlich)
mongod

# API starten
python -m app.main
```

##  API Endpoints

###  Health Check

```bash
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "analysis_ready": true,
  "database_connected": true
}
```

###  Bildanalyse

```bash
POST /api/v1/analyze
Content-Type: multipart/form-data

Parameters:
- image: File (required) - JPG, PNG, WEBP, max 10MB
- roi_x_percent: float (optional) - ROI X-Start (0.0-1.0)
- roi_y_percent: float (optional) - ROI Y-Start (0.0-1.0)
- roi_width_percent: float (optional) - ROI Breite (0.0-1.0)
- roi_height_percent: float (optional) - ROI Höhe (0.0-1.0)
```

**Response:**
```json
{
  "success": true,
  "detections": [
    {
      "class_name": "Glasflasche_Gruen",
      "confidence": 0.78,
      "bounding_box": {
        "x": 228,
        "y": 240,
        "width": 144,
        "height": 180
      }
    }
  ],
  "recycling_info": {
    "material": "Grünes Glas",
    "recycling_category": "Grüner Glascontainer",
    "instructions": "Deckel entfernen, in grünen Container werfen...",
    "pfand": 0.08,
    "environmental_impact": "Glas ist unendlich oft recyclebar..."
  },
  "message": "Flasche erkannt: Glasflasche_Gruen",
  "processing_time_ms": 22.5,
  "timestamp": "2025-12-21T15:30:00.123456"
}
```

###  Recycling-Informationen

```bash
GET /api/v1/recycling-info/{bottle_type}
```

Verfügbare Typen:
- `PET_Flasche`
- `Glasflasche_Gruen`
- `Glasflasche_Braun`
- `Glasflasche_Weiss`
- `Aluminium_Dose`
- `Mehrweg_Glas`

## 🎨 ROI (Region of Interest)

Die ROI ermöglicht es, nur einen bestimmten Bildbereich zu analysieren - ideal um Hintergründe auszublenden.

### Konfiguration

**In `.env` oder Environment Variables:**
```env
ROI_ENABLED=True
ROI_X_PERCENT=0.38      # Startet bei 38% der Bildbreite
ROI_Y_PERCENT=0.40      # Startet bei 40% der Bildhöhe
ROI_WIDTH_PERCENT=0.24  # 24% der Bildbreite
ROI_HEIGHT_PERCENT=0.30 # 30% der Bildhöhe
```

**Per API Request:**
```bash
POST /api/v1/analyze?roi_x_percent=0.38&roi_y_percent=0.40&roi_width_percent=0.24&roi_height_percent=0.30
```

### Visualisierung

```
Bild (600x600):
┌────────────────────────────┐
│  Hintergrund               │
│         ┌──────┐           │
│         │      │           │  ← ROI fokussiert
│         │      │           │     auf Flasche
│         │      │           │
│         └──────┘           │
│  Hintergrund               │
└────────────────────────────┘
```

**Siehe [ROI_DOCUMENTATION.md](ROI_DOCUMENTATION.md) für Details.**

##  Testen

### Mit Test-Script

```bash
# Health Check
python test_api.py

# Bildanalyse mit Default ROI
python test_api.py image.jpg

# Bildanalyse mit Custom ROI
python test_api.py image.jpg --roi-x 0.38 --roi-y 0.40 --roi-width 0.24 --roi-height 0.30
```

### Mit curl

```bash
# Health Check
curl http://localhost:8000/health

# Bildanalyse
curl -X POST -F "image=@bottle.jpg" http://localhost:8000/api/v1/analyze

# Mit ROI
curl -X POST -F "image=@bottle.jpg" \
  "http://localhost:8000/api/v1/analyze?roi_x_percent=0.38&roi_y_percent=0.40&roi_width_percent=0.24&roi_height_percent=0.30"
```

### Mit Postman

1. Öffne http://localhost:8000/docs (Swagger UI)
2. Teste Endpoints interaktiv
3. Oder importiere Collection und teste manuell

##  Konfiguration

### Environment Variables

```env
# Server
HOST=0.0.0.0
PORT=8000
DEBUG=True

# MongoDB
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=reSort

# Color Analysis
MIN_CONFIDENCE=0.5       # Mindest-Konfidenz (0.0-1.0)
ROI_ENABLED=True         # ROI aktivieren
ROI_X_PERCENT=0.38       # ROI Position und Größe
ROI_Y_PERCENT=0.40
ROI_WIDTH_PERCENT=0.24
ROI_HEIGHT_PERCENT=0.30

# Upload
MAX_UPLOAD_SIZE=10485760     # 10MB
ALLOWED_EXTENSIONS=jpg,jpeg,png,webp

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:19006
```

### Docker Compose

```yaml
services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - MONGODB_URL=mongodb://mongo:27017
      - MIN_CONFIDENCE=0.5
      # ... weitere Variablen
    depends_on:
      - mongo
  
  mongo:
    image: mongo:4.4
    ports:
      - "27017:27017"
```

##  Performance

| Metrik | Wert |
|--------|------|
| **Startup Zeit** | <5 Sekunden |
| **Verarbeitungszeit** | 50-150ms |
| **Docker Image** | ~700MB |
| **Genauigkeit** | 70-80% |
| **RAM Verbrauch** | ~200MB |

##  Architektur

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTP
       ▼
┌─────────────────────────────────┐
│       FastAPI (main.py)         │
│  ┌───────────────────────────┐  │
│  │   Routes (analysis.py)    │  │
│  └───────────┬───────────────┘  │
│              │                   │
│  ┌───────────▼───────────────┐  │
│  │ Color Analysis Service    │  │
│  │  - ROI Extraction         │  │
│  │  - HSV Analysis           │  │
│  │  - K-Means Clustering     │  │
│  │  - Classification Logic   │  │
│  └───────────┬───────────────┘  │
│              │                   │
│  ┌───────────▼───────────────┐  │
│  │  Database Service         │  │
│  │  - MongoDB Connection     │  │
│  │  - Recycling Info         │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
                │
                ▼
        ┌──────────────┐
        │   MongoDB    │
        └──────────────┘
```

##  Entwicklung

### Projekt-Struktur

```
reSort-backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI App
│   ├── config.py                  # Settings
│   ├── models.py                  # Pydantic Models
│   ├── color_analysis_service.py  # Farb-Analyse
│   ├── database.py                # MongoDB Service
│   └── routes/
│       ├── __init__.py
│       ├── health.py              # Health Check
│       └── analysis.py            # Bildanalyse
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── test_api.py                    # Test Script
├── .env.example
├── README.md
├── ROI_DOCUMENTATION.md
└── MIGRATION_GUIDE.md
```

### Dependencies

```txt
fastapi==0.109.0          # Web Framework
uvicorn==0.27.0           # ASGI Server
opencv-python==4.9.0.80   # Computer Vision
numpy==1.26.3             # Numerik
motor==3.3.2              # Async MongoDB
pydantic==2.5.3           # Validation
scikit-image==0.22.0      # Image Processing
```

### Lokale Entwicklung

```bash
# Virtual Environment
python -m venv venv
source venv/bin/activate

# Dependencies
pip install -r requirements.txt

# MongoDB (separat)
docker run -d -p 27017:27017 mongo:4.4

# Run mit Hot Reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

##  Klassifizierungs-Algorithmus

### Farbraum-Analyse

1. **RGB  HSV Konvertierung**
   - Hue (Farbton): 0-360°
   - Saturation (Sättigung): 0-100%
   - Value (Helligkeit): 0-255

2. **K-Means Clustering**
   - Findet dominante Farben
   - Reduziert Rauschen

3. **Regel-basierte Klassifizierung**

```python
if 28 <= hue <= 90 and saturation > 20:
    return "Glasflasche_Gruen"
elif ((5 <= hue <= 35) or (hue > 155)) and brightness < 180:
    return "Glasflasche_Braun"
elif brightness > 180 and saturation < 25:
    return "PET_Flasche"
# ... weitere Regeln
```

### Konfidenz-Berechnung

```python
confidence = min(1.0, (saturation / 100) * 0.6 + 0.4)
```

Faktoren:
- Farbsättigung
- Helligkeit
- Farbvarianz
- Hue-Übereinstimmung

##  Vergleich: Color-Based vs ML-Based

| Feature | Color-Based (v2.0) | ML-Based (v1.0) |
|---------|-------------------|-----------------|
| **Modell-Größe** | 0MB | ~50MB YOLOv8 |
| **Docker Image** | ~700MB | ~1.2GB |
| **Startup** | <5s | 30-60s |
| **Inferenz** | 50-150ms | 200-400ms |
| **Genauigkeit** | 70-80% | 85%+ |
| **GPU nötig** | ❌ | Optional |
| **Trainierbar** | ❌ | ✅ |
| **ROI Support** | ✅ | ❌ |
| **Einfachheit** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

**Siehe [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) für Details.**

##  Troubleshooting

### Flasche wird nicht erkannt

**Problem:** `"success": false, "detections": []`

**Lösungen:**
1. Senke `MIN_CONFIDENCE` auf 0.4-0.5
2. Optimiere ROI - fokussiere auf Flaschenkörper
3. Bessere Beleuchtung
4. Sauberer Hintergrund

### Falsche Farbe erkannt

**Problem:** Grüne Flasche als PET erkannt

**Lösungen:**
1. ROI zu groß - zu viel Hintergrund
2. Verwende optimierte ROI: `roi_x=0.38, roi_y=0.40, roi_width=0.24, roi_height=0.30`
3. Prüfe Logs für HSV-Werte

### Container startet nicht

```bash
# Logs prüfen
docker-compose logs -f api

# Container neu bauen
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

##  Best Practices

### Für beste Ergebnisse

 **Gute Beleuchtung** - Tageslicht oder gleichmäßig
 **Sauberer Hintergrund** - Einfarbig, weiß/grau
 **ROI nutzen** - Fokus auf Flasche
 **Zentrieren** - Flasche in Bildmitte
 **Scharf** - Keine Bewegungsunschärfe

### ROI Konfiguration

**Mobile App (User hält Handy):**
```env
ROI_X_PERCENT=0.2
ROI_Y_PERCENT=0.25
ROI_WIDTH_PERCENT=0.6
ROI_HEIGHT_PERCENT=0.5
```

**Fließband (fixe Position):**
```env
ROI_X_PERCENT=0.35
ROI_Y_PERCENT=0.3
ROI_WIDTH_PERCENT=0.3
ROI_HEIGHT_PERCENT=0.4
```

##  Dokumentation

- **[README.md](README.md)** - Hauptdokumentation (diese Datei)
- **[ROI_DOCUMENTATION.md](ROI_DOCUMENTATION.md)** - ROI im Detail
- **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** - Von ML zu Color-Based
- **[API Docs](http://localhost:8000/docs)** - Swagger UI (wenn Server läuft)

##  Deployment

### Heroku

```bash
heroku create reSort-api
heroku addons:create mongolab
git push heroku main
```

### AWS ECS

```bash
# ECR Login
aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com

# Build & Push
docker build -t reSort-api .
docker tag reSort-api:latest <account>.dkr.ecr.<region>.amazonaws.com/reSort-api:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/reSort-api:latest
```

### Docker Swarm

```bash
docker stack deploy -c docker-compose.yml reSort
```

##  Security

-  CORS konfiguriert
-  File Size Limits (10MB)
-  Input Validation (Pydantic)
-  Keine Secrets im Code
-  Environment Variables für Config

##  Roadmap

- [ ] Custom Klassifizierungs-Regeln per API
- [ ] Batch Processing für mehrere Bilder
- [ ] Barcode-Scanning Integration
- [ ] Standortsuche für Container
- [ ] Multi-Object Detection
- [ ] WebSocket Support für Live-Feed
- [ ] Prometheus Metrics
- [ ] Rate Limiting

##  Contributing

Contributions sind willkommen! Bitte:

1. Fork das Repository
2. Erstelle einen Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit deine Änderungen (`git commit -m 'Add AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

##  License

Dieses Projekt ist lizenziert unter der MIT License - siehe [LICENSE](LICENSE) für Details.

##  Authors

- **R.Hanasoglu, H.Duman & K.Nauta** - Initial work

##  Acknowledgments

- FastAPI für das großartige Framework
- OpenCV für Computer Vision Tools
- MongoDB für die Datenbank
- Docker für Containerisierung

##  Support

Bei Fragen oder Problemen:

1.  Prüfe die [Dokumentation](README.md)
2.  Öffne ein [Issue](https://github.com/.../issues)
3.  Diskutiere in [Discussions](https://github.com/.../discussions)


