# Region of Interest (ROI) - Dokumentation

## Was ist eine ROI?

Eine **Region of Interest (ROI)** ist ein definierter Bereich innerhalb eines Bildes, der für die Analyse verwendet wird. Statt das gesamte Bild zu analysieren, konzentriert sich die Farbanalyse nur auf diesen ausgewählten Bereich.

## Warum ROI verwenden?

### Vorteile:
1. **Höhere Genauigkeit**: Reduziert Störungen durch Hintergrund
2. **Schnellere Verarbeitung**: Weniger Pixel müssen analysiert werden
3. **Bessere Klassifizierung**: Fokus auf relevanten Bildbereich (die Flasche)
4. **Flexibilität**: Benutzer kann ROI anpassen für verschiedene Szenarien

### Use Cases:
- **Handy-App**: Benutzer zentriert Flasche in der Mitte → ROI um Zentrum
- **Fließband-Analyse**: Flaschen kommen immer an gleicher Position → Feste ROI
- **Webcam-Erkennung**: ROI auf bestimmten Bereich vor Kamera

## ROI-Konfiguration

### Parameter (als Prozent der Bildgröße):

```python
roi_x_percent = 0.25       # ROI startet bei 25% der Bildbreite
roi_y_percent = 0.20       # ROI startet bei 20% der Bildhöhe  
roi_width_percent = 0.50   # ROI ist 50% der Bildbreite breit
roi_height_percent = 0.60  # ROI ist 60% der Bildhöhe hoch
```

### Visualisierung:

```
Bild (800x600 pixels):
┌────────────────────────────────────┐
│                                    │  ← y_start = 20% = 120px
│    ┌──────────────────┐           │
│    │                  │           │
│    │   ROI (400x360)  │           │  ← height = 60% = 360px
│    │                  │           │
│    │                  │           │
│    └──────────────────┘           │
│                                    │
└────────────────────────────────────┘
     ↑                  ↑
   x_start          width
   25% = 200px     50% = 400px
```

## Beispiele

### 1. Zentrierte ROI (Standard)

```python
roi_config = {
    'x_percent': 0.25,      # Startet bei 25%
    'y_percent': 0.20,      # Startet bei 20%
    'width_percent': 0.50,  # 50% breit
    'height_percent': 0.60  # 60% hoch
}
```
**Verwendung**: Flasche ist zentral im Bild

### 2. Gesamtes Bild

```python
roi_config = {
    'x_percent': 0.0,
    'y_percent': 0.0,
    'width_percent': 1.0,
    'height_percent': 1.0
}
```
**Oder in .env**: `ROI_ENABLED=False`

### 3. Obere Hälfte (für Flaschenhals-Erkennung)

```python
roi_config = {
    'x_percent': 0.2,
    'y_percent': 0.0,       # Ganz oben
    'width_percent': 0.6,
    'height_percent': 0.4   # Nur obere 40%
}
```

### 4. Linke Seite (Fließband von links)

```python
roi_config = {
    'x_percent': 0.0,       # Ganz links
    'y_percent': 0.2,
    'width_percent': 0.4,   # Linke 40%
    'height_percent': 0.6
}
```

### 5. Kleiner zentraler Punkt (nur Etikett)

```python
roi_config = {
    'x_percent': 0.4,       # Fast in der Mitte
    'y_percent': 0.4,
    'width_percent': 0.2,   # Nur 20% breit
    'height_percent': 0.2   # Nur 20% hoch
}
```

## Verwendung in der API

### Standard ROI (aus Config)

```python
POST /api/v1/analyze
Content-Type: multipart/form-data

{
    "image": <file>
}
```
Verwendet ROI-Einstellungen aus `.env` oder Defaults.

### Custom ROI per Request

```python
POST /api/v1/analyze?roi_x_percent=0.3&roi_y_percent=0.25&roi_width_percent=0.4&roi_height_percent=0.5
Content-Type: multipart/form-data

{
    "image": <file>
}
```

### Postman Beispiel

```
URL: http://localhost:8000/api/v1/analyze?roi_x_percent=0.25&roi_y_percent=0.20&roi_width_percent=0.50&roi_height_percent=0.60
Method: POST
Body: form-data
    - key: image, type: File
```

## Praktische Tipps

### Wie finde ich die beste ROI?

1. **Teste mit ganzen Bild**: `ROI_ENABLED=False`
2. **Analysiere wo Flasche typischerweise ist**
3. **Passe ROI schrittweise an**:
   - Zuerst grob (z.B. Mitte 50%)
   - Dann verfeinern basierend auf Tests
4. **Nutze Debug-Endpoint** (wenn verfügbar):
   ```python
   GET /api/v1/visualize-roi
   ```
   Zeigt ROI-Rechteck im Bild

### Häufige Szenarien

**Mobile App (Benutzer hält Handy)**
```python
# Zentriert mit etwas Rand
ROI_X_PERCENT=0.2
ROI_Y_PERCENT=0.25
ROI_WIDTH_PERCENT=0.6
ROI_HEIGHT_PERCENT=0.5
```

**Fixer Kamera-Aufbau**
```python
# Genau wo Flasche platziert wird
ROI_X_PERCENT=0.35
ROI_Y_PERCENT=0.3
ROI_WIDTH_PERCENT=0.3
ROI_HEIGHT_PERCENT=0.4
```

**Unbekannte Position**
```python
# Ganzes Bild oder sehr große ROI
ROI_ENABLED=False
# ODER
ROI_WIDTH_PERCENT=0.8
ROI_HEIGHT_PERCENT=0.8
```

## Best Practices

✅ **DO:**
- ROI größer als Flasche machen (Sicherheitsrand)
- ROI auf Flaschenkörper fokussieren, nicht Deckel
- Bei Farbanalyse: ROI auf den farbigen Teil der Flasche
- ROI-Parameter in Config speichern für Konsistenz

❌ **DON'T:**
- ROI zu klein → Könnte Flasche verfehlen
- ROI mit viel Hintergrund → Verfälscht Farbanalyse
- ROI außerhalb Bildgrenzen → Wird automatisch korrigiert aber nicht optimal

## Fehlerbehandlung

Das System korrigiert automatisch:
- ROI außerhalb Bildgrenzen → Clipt auf valide Werte
- Negative Werte → Setzt auf 0
- Werte > 1.0 → Setzt auf 1.0
- Zu kleine ROI → Minimum 1x1 Pixel

## Beispiel Code

### Python Client

```python
import requests

# Mit Standard ROI
files = {'image': open('flasche.jpg', 'rb')}
response = requests.post('http://localhost:8000/api/v1/analyze', files=files)

# Mit Custom ROI
params = {
    'roi_x_percent': 0.3,
    'roi_y_percent': 0.25,
    'roi_width_percent': 0.4,
    'roi_height_percent': 0.5
}
response = requests.post('http://localhost:8000/api/v1/analyze', files=files, params=params)
```

### JavaScript/React Native

```javascript
const formData = new FormData();
formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'bottle.jpg'
});

// Mit Custom ROI
const params = new URLSearchParams({
    roi_x_percent: '0.25',
    roi_y_percent: '0.20',
    roi_width_percent: '0.50',
    roi_height_percent: '0.60'
});

const response = await fetch(
    `http://localhost:8000/api/v1/analyze?${params}`,
    {
        method: 'POST',
        body: formData
    }
);
```

## Performance Impact

**Mit ROI (50% des Bildes):**
- Verarbeitungszeit: ~50-100ms schneller
- Speicher: ~50% weniger

**Ganzes Bild:**
- Verarbeitungszeit: ~200-300ms
- Speicher: Volle Bildgröße

→ ROI lohnt sich besonders bei hochauflösenden Bildern (>2MP)

---

**Zusammenfassung:**
ROI erlaubt es, nur einen bestimmten Bereich des Bildes zu analysieren. Dies verbessert Genauigkeit und Performance. Die Parameter werden als Prozent-Werte angegeben (0.0-1.0) und können global in Config oder pro Request gesetzt werden.
