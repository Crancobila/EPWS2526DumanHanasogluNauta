# Bottle Recycling Backend API

Backend-System zur Flaschenidentifikation und Bereitstellung von Recycling-Informationen mittels Computer Vision und Machine Learning.

## 🚀 Features

- **Bildanalyse**: Automatische Erkennung von Flaschen in hochgeladenen Bildern
- **Multi-Klassen-Erkennung**: Unterstützt PET, Glas (verschiedene Farben), Aluminium, Mehrweg
- **Recycling-Informationen**: Detaillierte Anweisungen für korrekte Entsorgung
- **Pfand-Information**: Automatische Erkennung von Pfandbeträgen
- **RESTful API**: Vollständig dokumentierte API mit OpenAPI/Swagger
- **MongoDB Integration**: Speicherung von Recycling-Daten und Analysen
- **CORS-Support**: Vorbereitet für Frontend-Integration
- **Health Checks**: Monitoring-Endpoints für Produktionsumgebungen

## 📋 Voraussetzungen

- Python 3.10+
- MongoDB (lokal oder Atlas)
- Mindestens 2GB RAM (für ML-Modell)

## 🛠️ Installation

### 1. Repository klonen und Setup

```bash
cd bottle-recycling-backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Umgebungsvariablen konfigurieren

```bash
cp .env.example .env
```

Anpassen der `.env` Datei:
```env
MONGODB_URL=mongodb://localhost:27017
# oder MongoDB Atlas:
# MONGODB_URL=mongodb+srv://user:password@cluster.mongodb.net/

DEBUG=True
PORT=8000
```

### 3. MongoDB starten (lokal)

```bash
# Mit Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Oder lokal installiert
mongod --dbpath /pfad/zu/datenbank
```

### 4. Backend starten

```bash
python -m app.main
```

Die API ist nun verfügbar unter:
- **API**: http://localhost:8000
- **Swagger Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📚 API Endpoints

### Health Check
```http
GET /health
```
Prüft Status von ML-Modell und Datenbank.

### Bildanalyse
```http
POST /api/v1/analyze
Content-Type: multipart/form-data

Body:
  image: [Bilddatei]
```

**Response:**
```json
{
  "success": true,
  "detections": [
    {
      "class_name": "PET_Flasche",
      "confidence": 0.95,
      "bounding_box": {
        "x": 100,
        "y": 150,
        "width": 200,
        "height": 400
      }
    }
  ],
  "recycling_info": {
    "material": "PET (Polyethylenterephthalat)",
    "recycling_category": "Gelber Sack / Gelbe Tonne",
    "instructions": "Deckel abschrauben, Flasche zusammendrücken...",
    "pfand": 0.25,
    "environmental_impact": "PET-Flaschen sind gut recyclebar..."
  },
  "message": "1 Flasche(n) erkannt",
  "processing_time_ms": 245.3,
  "timestamp": "2024-12-16T10:30:00Z"
}
```

### Recycling-Informationen abrufen
```http
GET /api/v1/recycling-info/{bottle_type}
```

Beispiel:
```http
GET /api/v1/recycling-info/PET_Flasche
```

## 🧪 Testen mit cURL

### Bildanalyse testen
```bash
curl -X POST "http://localhost:8000/api/v1/analyze" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "image=@/pfad/zu/bild.jpg"
```

### Mit Python testen
```python
import requests

url = "http://localhost:8000/api/v1/analyze"
files = {"image": open("flasche.jpg", "rb")}

response = requests.post(url, files=files)
print(response.json())
```

## 🎯 ML-Modell

### Standard-Modell (YOLOv8n)
Beim ersten Start wird automatisch YOLOv8n heruntergeladen. Dieses Modell erkennt generische "bottle" Objekte.

### Custom-Modell trainieren

Für bessere Ergebnisse solltest du ein eigenes Modell trainieren:

1. **Dataset erstellen**: Sammle Bilder von verschiedenen Flaschentypen
2. **Annotieren**: Nutze Tools wie [Roboflow](https://roboflow.com) oder LabelImg
3. **Training**:

```python
from ultralytics import YOLO

# Modell initialisieren
model = YOLO('yolov8n.pt')

# Training starten
results = model.train(
    data='dataset.yaml',  # Pfad zu deinem Dataset
    epochs=100,
    imgsz=640,
    batch=16,
    name='bottle_classifier'
)

# Modell exportieren
model.export(format='torchscript')
```

4. **Modell einbinden**:
```bash
mkdir models
cp runs/detect/bottle_classifier/weights/best.pt models/bottle_classifier.pt
```

### Unterstützte Klassen
- `PET_Flasche`: PET-Einwegflaschen
- `Glasflasche_Gruen`: Grünes Glas
- `Glasflasche_Weiss`: Weißglas/Klarglas
- `Glasflasche_Braun`: Braunes Glas
- `Aluminium_Dose`: Getränkedosen
- `Mehrweg_Glas`: Mehrweg-Glasflaschen

## 🔧 Konfiguration

### Settings in `app/config.py`

```python
# Model
model_path: str = "models/bottle_classifier.pt"
confidence_threshold: float = 0.5  # Mindest-Konfidenz für Erkennungen

# Upload
max_upload_size: int = 10485760  # 10MB
allowed_extensions: List[str] = ["jpg", "jpeg", "png", "webp"]

# CORS - Frontend URLs hinzufügen
cors_origins: List[str] = [
    "http://localhost:3000",      # React/Next.js
    "http://localhost:19006",     # Expo Web
    "http://localhost:8081"       # Expo Mobile
]
```

## 📊 Datenbank-Schema

### Collection: `recycling_info`
```json
{
  "bottle_type": "PET_Flasche",
  "material": "PET (Polyethylenterephthalat)",
  "recycling_category": "Gelber Sack / Gelbe Tonne",
  "instructions": "Detaillierte Anleitung...",
  "pfand": 0.25,
  "environmental_impact": "Umweltinfo..."
}
```

### Collection: `analyses` (Optional - für Statistiken)
```json
{
  "timestamp": "2024-12-16T10:30:00Z",
  "detections_count": 1,
  "detections": [...],
  "processing_time_ms": 245.3,
  "file_size_bytes": 1048576
}
```

## 🚀 Produktions-Deployment

### Mit Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "-m", "app.main"]
```

Build und Run:
```bash
docker build -t bottle-recycling-api .
docker run -p 8000:8000 -e MONGODB_URL=your_mongo_url bottle-recycling-api
```

### Mit Docker Compose

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - MONGODB_URL=mongodb://mongo:27017
    depends_on:
      - mongo
    volumes:
      - ./models:/app/models

  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

## 🔐 Sicherheit

Für Produktion:
- [ ] API Keys für Authentifizierung hinzufügen
- [ ] Rate Limiting implementieren
- [ ] HTTPS verwenden
- [ ] Input Validation verschärfen
- [ ] Secrets in Umgebungsvariablen/Vault
- [ ] Logging und Monitoring

## 📝 Frontend Integration

### React Native / Expo Beispiel

```typescript
import * as ImagePicker from 'expo-image-picker';

const analyzeBottle = async (uri: string) => {
  const formData = new FormData();
  formData.append('image', {
    uri,
    type: 'image/jpeg',
    name: 'bottle.jpg',
  } as any);

  const response = await fetch('http://localhost:8000/api/v1/analyze', {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return await response.json();
};

// Kamera verwenden
const takePicture = async () => {
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
  });

  if (!result.canceled) {
    const analysis = await analyzeBottle(result.assets[0].uri);
    console.log(analysis);
  }
};
```

### React / Next.js Beispiel

```typescript
const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('http://localhost:8000/api/v1/analyze', {
    method: 'POST',
    body: formData,
  });

  return await response.json();
};
```

## 🐛 Troubleshooting

### Modell lädt nicht
```bash
# Modell manuell herunterladen
python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
```

### MongoDB Verbindungsprobleme
```bash
# Connection String überprüfen
mongodb://localhost:27017  # Lokal
mongodb+srv://user:pass@cluster.mongodb.net/  # Atlas
```

### CORS Fehler
Stelle sicher, dass deine Frontend-URL in `settings.cors_origins` eingetragen ist.

## 📈 Performance-Optimierung

- Bildgröße vor Upload reduzieren (Client-seitig)
- Caching für Recycling-Infos implementieren
- Load Balancing bei hoher Last
- GPU-Beschleunigung für ML-Inferenz

## 🤝 Contributing

Erweiterungsideen:
- [ ] Barcode/QR-Code Scanning für Produkt-IDs
- [ ] Multi-Language Support
- [ ] Standortsuche für Recycling-Container
- [ ] User Analytics Dashboard
- [ ] Mobile App mit Offline-Modus

## 📄 Lizenz

MIT License - Siehe LICENSE Datei

## 💬 Support

Bei Fragen oder Problemen erstelle ein Issue oder kontaktiere das Team.