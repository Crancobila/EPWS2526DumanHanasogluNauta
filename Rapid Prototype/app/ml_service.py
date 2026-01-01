from ultralytics import YOLO
import cv2
import numpy as np
from typing import List, Tuple, Optional
import logging
from pathlib import Path
from app.config import settings
from app.models import BottleDetection

logger = logging.getLogger(__name__)


class MLService:
    """Service für Machine Learning Inferenz"""

    def __init__(self):
        self.model: Optional[YOLO] = None
        self.model_loaded = False

    def load_model(self):
        """
        Lädt das YOLO-Modell
        Verwendet vortrainiertes YOLOv8 oder custom model wenn vorhanden
        """
        try:
            model_path = Path(settings.ml_model_path)

            if model_path.exists():
                # Custom trainiertes Modell laden
                logger.info(f"Lade custom Modell von {model_path}")
                self.model = YOLO(str(model_path))
            else:
                # Fallback: Standard YOLOv8 für Objekterkennung
                logger.warning(f"Custom Modell nicht gefunden bei {model_path}")
                logger.info("Lade YOLOv8m Modell (bessere Genauigkeit)...")

                # Versuche zuerst yolov8m.pt im aktuellen Verzeichnis
                if Path('yolov8m.pt').exists():
                    logger.info("Verwende bereits heruntergeladenes yolov8m.pt")
                    self.model = YOLO('yolov8m.pt')
                else:
                    # Download wird automatisch durchgeführt
                    logger.info("Lade YOLOv8m herunter (einmalig, ca. 50MB)...")
                    self.model = YOLO('yolov8m.pt')
                    logger.info("YOLOv8m erfolgreich heruntergeladen")

            # Test-Inferenz um sicherzustellen dass Model funktioniert
            logger.info("Teste Model mit Dummy-Bild...")
            import numpy as np
            dummy_img = np.zeros((640, 640, 3), dtype=np.uint8)
            self.model(dummy_img, verbose=False)

            self.model_loaded = True
            logger.info("✅ Modell erfolgreich geladen und getestet")
            return True

        except Exception as e:
            logger.error(f"❌ Fehler beim Laden des Modells: {e}")
            logger.error(f"Traceback: {e}", exc_info=True)
            self.model_loaded = False
            return False

    def is_loaded(self) -> bool:
        """Prüft ob Modell geladen ist"""
        return self.model_loaded and self.model is not None

    async def analyze_image(self, image_bytes: bytes) -> List[BottleDetection]:
        """
        Analysiert ein Bild und erkennt Flaschen

        Args:
            image_bytes: Bilddaten als Bytes

        Returns:
            Liste von BottleDetection Objekten
        """
        if not self.is_loaded():
            logger.error("Modell nicht geladen")
            return []

        try:
            # Bytes zu NumPy Array konvertieren
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if image is None:
                logger.error("Bild konnte nicht dekodiert werden")
                return []

            # YOLO Inferenz durchführen
            logger.info(f"Starte YOLO-Inferenz mit Konfidenz-Schwelle: {settings.confidence_threshold}")
            results = self.model(image, conf=0.1, verbose=True)  # Sehr niedrig für Debug

            detections = []

            # Debug: Alle erkannten Objekte loggen
            logger.info(f"YOLO hat {len(results)} Ergebnis(se) zurückgegeben")

            # Ergebnisse verarbeiten
            for result in results:
                boxes = result.boxes
                logger.info(f"Anzahl erkannter Boxen: {len(boxes)}")

                for box in boxes:
                    # Klassennamen und Konfidenz extrahieren
                    class_id = int(box.cls[0])
                    confidence = float(box.conf[0])
                    class_name = self.model.names[class_id]

                    logger.info(f"🔍 Erkannt: '{class_name}' (ID: {class_id}) mit Konfidenz {confidence:.2%}")

                    # Bounding Box Koordinaten
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    bbox_dict = {
                        "x": int(x1),
                        "y": int(y1),
                        "width": int(x2 - x1),
                        "height": int(y2 - y1)
                    }

                    # Flaschen-relevante Klassen filtern
                    # Bei Standard YOLO: 'bottle' (Klasse 39)
                    # Bei custom model: alle erkannten Klassen
                    bottle_classes = ['bottle', 'PET_Flasche', 'Glasflasche',
                                      'Glasflasche_Gruen', 'Glasflasche_Weiss',
                                      'Glasflasche_Braun', 'Aluminium_Dose', 'Mehrweg_Glas']

                    # Prüfe ob es eine Flasche ist UND ob Konfidenz hoch genug
                    is_bottle = class_name in bottle_classes or 'bottle' in class_name.lower()
                    meets_threshold = confidence >= settings.confidence_threshold

                    if is_bottle:
                        if meets_threshold:
                            # Farb-basierte Klassifizierung für generische "bottle" Klasse
                            if class_name == 'bottle':
                                logger.info("🎨 Starte Farb-basierte Klassifizierung...")
                                classified_type = self._classify_bottle_by_color(image, bbox_dict)
                            else:
                                # Verwende bereits spezifischen Klassenname
                                classified_type = class_name

                            detection = BottleDetection(
                                class_name=classified_type,
                                confidence=confidence,
                                bounding_box=bbox_dict
                            )
                            detections.append(detection)
                            logger.info(
                                f"✅ Als Flasche akzeptiert: {detection.class_name} (Konfidenz: {confidence:.2%})")
                        else:
                            logger.info(
                                f"⚠️  Flasche erkannt aber Konfidenz zu niedrig: {confidence:.2%} < {settings.confidence_threshold}")
                    else:
                        logger.info(f"⏭️  '{class_name}' ist keine Flasche, übersprungen")

            logger.info(
                f"🍾 Gesamt: {len(detections)} Flasche(n) erkannt (über Schwelle {settings.confidence_threshold})")
            return detections

        except Exception as e:
            logger.error(f"Fehler bei der Bildanalyse: {e}")
            return []

    def _map_class_name(self, yolo_class: str) -> str:
        """
        Mappt YOLO Klassennamen zu unseren Flaschentypen

        Args:
            yolo_class: YOLO Klassenname

        Returns:
            Gemappter Flaschentyp
        """
        # Mapping für Standard YOLO bottle class
        if yolo_class == 'bottle':
            return 'PET_Flasche'  # Default für generische Flaschenerkennung

        # Ansonsten original Namen verwenden (für custom model)
        return yolo_class

    def _classify_bottle_by_color(self, image: np.ndarray, bbox: dict) -> str:
        """
        Klassifiziert Flaschentyp basierend auf Farbe im Bounding Box

        Args:
            image: Original Bild (NumPy Array)
            bbox: Bounding Box Dictionary mit x, y, width, height

        Returns:
            Flaschentyp basierend auf Farbe
        """
        try:
            # Bounding Box extrahieren
            x, y, w, h = bbox['x'], bbox['y'], bbox['width'], bbox['height']

            # Stelle sicher dass Koordinaten im Bild sind
            height, width = image.shape[:2]
            x = max(0, min(x, width))
            y = max(0, min(y, height))
            w = min(w, width - x)
            h = min(h, height - y)

            # Region of Interest (ROI) extrahieren
            roi = image[y:y + h, x:x + w]

            if roi.size == 0:
                logger.warning("ROI ist leer, verwende Standard-Klassifizierung")
                return 'PET_Flasche'

            # Konvertiere zu RGB (OpenCV lädt als BGR)
            roi_rgb = cv2.cvtColor(roi, cv2.COLOR_BGR2RGB)

            # Berechne durchschnittliche Farbe
            avg_color = np.mean(roi_rgb, axis=(0, 1))
            r, g, b = avg_color

            # Berechne Helligkeit und Sättigung
            brightness = np.mean(avg_color)

            # RGB zu HSV für bessere Farbanalyse
            roi_hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
            avg_hsv = np.mean(roi_hsv, axis=(0, 1))
            hue, saturation, value = avg_hsv

            logger.info(f"Farbanalyse - RGB: ({r:.1f}, {g:.1f}, {b:.1f}), "
                        f"HSV: ({hue:.1f}, {saturation:.1f}, {value:.1f}), "
                        f"Helligkeit: {brightness:.1f}")

            # Klassifizierungs-Logik

            # 1. Sehr hell/transparent → PET oder Weißglas
            if brightness > 200 and saturation < 50:
                # Prüfe Form-Charakteristiken oder bleibe bei PET
                logger.info("→ Klassifiziert als: PET_Flasche (transparent/hell)")
                return 'PET_Flasche'

            # 2. Grüne Farbe → Grünes Glas
            if 35 < hue < 85 and saturation > 30:  # Grün-Bereich in HSV
                logger.info("→ Klassifiziert als: Glasflasche_Gruen")
                return 'Glasflasche_Gruen'

            # 3. Braune/Orange Farbe → Braunes Glas
            if (5 < hue < 25 or hue > 160) and saturation > 20 and brightness < 180:
                # Braun ist oft niedriger Hue mit mittlerer Sättigung
                logger.info("→ Klassifiziert als: Glasflasche_Braun")
                return 'Glasflasche_Braun'

            # 4. Sehr niedrige Sättigung und mittlere Helligkeit → Weißglas/Klarglas
            if saturation < 30 and 100 < brightness < 200:
                logger.info("→ Klassifiziert als: Glasflasche_Weiss")
                return 'Glasflasche_Weiss'

            # 5. Metallic/Silber (hohe Helligkeit, niedrige Sättigung, blaulich) → Aluminium
            if brightness > 150 and saturation < 40 and 80 < hue < 130:
                logger.info("→ Klassifiziert als: Aluminium_Dose")
                return 'Aluminium_Dose'

            # Default: Basierend auf Helligkeit entscheiden
            if brightness > 180:
                logger.info("→ Klassifiziert als: PET_Flasche (Standard hell)")
                return 'PET_Flasche'
            else:
                logger.info("→ Klassifiziert als: Glasflasche_Braun (Standard dunkel)")
                return 'Glasflasche_Braun'

        except Exception as e:
            logger.error(f"Fehler bei Farbanalyse: {e}")
            return 'PET_Flasche'  # Fallback

    async def preprocess_image(self, image_bytes: bytes) -> Optional[bytes]:
        """
        Preprocessing für bessere Erkennung (optional)

        Args:
            image_bytes: Original Bilddaten

        Returns:
            Vorverarbeitete Bilddaten oder None bei Fehler
        """
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if image is None:
                return None

            # Bildoptimierungen
            # 1. Resize wenn zu groß (für Performance)
            max_dimension = 1280
            height, width = image.shape[:2]
            if max(height, width) > max_dimension:
                scale = max_dimension / max(height, width)
                new_width = int(width * scale)
                new_height = int(height * scale)
                image = cv2.resize(image, (new_width, new_height))

            # 2. Kontrast verbessern (optional)
            # lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
            # l, a, b = cv2.split(lab)
            # clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
            # l = clahe.apply(l)
            # image = cv2.merge([l,a,b])
            # image = cv2.cvtColor(image, cv2.COLOR_LAB2BGR)

            # Zurück zu Bytes konvertieren
            _, buffer = cv2.imencode('.jpg', image)
            return buffer.tobytes()

        except Exception as e:
            logger.error(f"Fehler beim Preprocessing: {e}")
            return None


# Globale Instanz
ml_service = MLService()