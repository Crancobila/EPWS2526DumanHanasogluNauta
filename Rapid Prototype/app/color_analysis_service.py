import cv2
import numpy as np
from typing import Optional, Tuple, Dict
import logging
from app.config import settings
from app.models import BottleDetection

logger = logging.getLogger(__name__)


class ColorAnalysisService:
    """
    Service für farb-basierte Flaschenidentifikation ohne Machine Learning
    Analysiert Farbwerte in Bildern und klassifiziert Flaschentypen
    """

    def __init__(self):
        self.analysis_ready = True
        logger.info("✅ Color Analysis Service initialisiert")

    def is_ready(self) -> bool:
        """Prüft ob Service bereit ist"""
        return self.analysis_ready

    def extract_roi(self, image: np.ndarray, roi_config: Optional[Dict] = None) -> Tuple[np.ndarray, Dict]:
        """
        Extrahiert Region of Interest (ROI) aus dem Bild

        Args:
            image: Original Bild als NumPy Array
            roi_config: Optional custom ROI Konfiguration
                       Format: {'x_percent': 0.25, 'y_percent': 0.2, 'width_percent': 0.5, 'height_percent': 0.6}

        Returns:
            Tuple von (ROI Image, ROI Koordinaten Dict)
        """
        height, width = image.shape[:2]

        if not settings.roi_enabled and roi_config is None:
            # Verwende ganzes Bild
            logger.info("ROI deaktiviert - verwende ganzes Bild")
            return image, {'x': 0, 'y': 0, 'width': width, 'height': height}

        # ROI Konfiguration
        if roi_config:
            x_percent = roi_config.get('x_percent', settings.roi_x_percent)
            y_percent = roi_config.get('y_percent', settings.roi_y_percent)
            w_percent = roi_config.get('width_percent', settings.roi_width_percent)
            h_percent = roi_config.get('height_percent', settings.roi_height_percent)
        else:
            x_percent = settings.roi_x_percent
            y_percent = settings.roi_y_percent
            w_percent = settings.roi_width_percent
            h_percent = settings.roi_height_percent

        # Berechne absolute Koordinaten
        x = int(width * x_percent)
        y = int(height * y_percent)
        w = int(width * w_percent)
        h = int(height * h_percent)

        # Stelle sicher dass ROI innerhalb des Bildes liegt
        x = max(0, min(x, width - 1))
        y = max(0, min(y, height - 1))
        w = min(w, width - x)
        h = min(h, height - y)

        # Extrahiere ROI
        roi = image[y:y + h, x:x + w]

        roi_coords = {'x': x, 'y': y, 'width': w, 'height': h}

        logger.info(f"📐 ROI extrahiert: {roi_coords}")
        logger.info(f"   Original Bildgröße: {width}x{height}")
        logger.info(f"   ROI Größe: {w}x{h} ({(w * h) / (width * height) * 100:.1f}% des Bildes)")

        return roi, roi_coords

    def analyze_dominant_color(self, roi: np.ndarray) -> Dict:
        """
        Analysiert die dominante Farbe in der ROI

        Args:
            roi: Region of Interest als NumPy Array (BGR)

        Returns:
            Dictionary mit Farbanalyse-Ergebnissen
        """
        if roi.size == 0:
            logger.warning("ROI ist leer")
            return None

        # Konvertiere BGR zu RGB und HSV
        roi_rgb = cv2.cvtColor(roi, cv2.COLOR_BGR2RGB)
        roi_hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)

        # Berechne durchschnittliche Werte
        avg_rgb = np.mean(roi_rgb, axis=(0, 1))
        avg_hsv = np.mean(roi_hsv, axis=(0, 1))

        r, g, b = avg_rgb
        hue, saturation, value = avg_hsv

        # Berechne Helligkeit
        brightness = np.mean(avg_rgb)

        # Berechne Standardabweichung (Farbvarianz)
        std_rgb = np.std(roi_rgb, axis=(0, 1))
        color_variance = np.mean(std_rgb)

        # Finde dominante Farbe durch K-Means (Top 3 Farben)
        pixels = roi_rgb.reshape(-1, 3).astype(np.float32)

        # Reduziere auf max 1000 Pixel für Performance
        if len(pixels) > 1000:
            indices = np.random.choice(len(pixels), 1000, replace=False)
            pixels = pixels[indices]

        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
        _, labels, centers = cv2.kmeans(pixels, 3, None, criteria, 10, cv2.KMEANS_PP_CENTERS)

        # Sortiere Cluster nach Größe
        unique, counts = np.unique(labels, return_counts=True)
        dominant_cluster = unique[np.argmax(counts)]
        dominant_color = centers[dominant_cluster]

        result = {
            'avg_rgb': {'r': float(r), 'g': float(g), 'b': float(b)},
            'avg_hsv': {'h': float(hue), 's': float(saturation), 'v': float(value)},
            'brightness': float(brightness),
            'saturation': float(saturation),
            'hue': float(hue),
            'color_variance': float(color_variance),
            'dominant_rgb': {
                'r': float(dominant_color[0]),
                'g': float(dominant_color[1]),
                'b': float(dominant_color[2])
            }
        }

        logger.info(f"🎨 Farbanalyse:")
        logger.info(f"   RGB: ({r:.1f}, {g:.1f}, {b:.1f})")
        logger.info(f"   HSV: H={hue:.1f}°, S={saturation:.1f}%, V={value:.1f}%")
        logger.info(f"   Helligkeit: {brightness:.1f}, Varianz: {color_variance:.1f}")

        return result

    def classify_bottle_type(self, color_data: Dict) -> Tuple[str, float]:
        """
        Klassifiziert Flaschentyp basierend auf Farbdaten

        Args:
            color_data: Dictionary mit Farbanalyse-Daten

        Returns:
            Tuple von (bottle_type, confidence)
        """
        hue = color_data['hue']
        saturation = color_data['saturation']
        brightness = color_data['brightness']
        variance = color_data['color_variance']

        # Klassifizierungslogik mit Konfidenz-Berechnung

        # 1. Grünes Glas
        # Hue 28-90° (Grünbereich), mittlere bis hohe Sättigung
        if 28 <= hue <= 90 and saturation > 20:  # Erweitert für knapp-grüne Farben
            confidence = min(1.0, (saturation / 100) * 0.6 + 0.4)  # Höhere Base-Konfidenz
            logger.info(f"→ Klassifiziert als: Glasflasche_Gruen (Konfidenz: {confidence:.2%})")
            return 'Glasflasche_Gruen', confidence

        # 2. Braunes Glas
        # Hue 5-25° (Orange/Braun) ODER Hue > 160° (Rot/Braun), dunkel
        if ((5 <= hue <= 35) or (hue > 155)) and brightness < 180 and saturation > 12:  # Gesenkt
            # Höhere Konfidenz bei dunkleren, gesättigteren Farben
            dark_factor = (180 - brightness) / 180
            sat_factor = saturation / 100
            confidence = min(1.0, (dark_factor * 0.4 + sat_factor * 0.4 + 0.3))  # Höhere Base
            logger.info(f"→ Klassifiziert als: Glasflasche_Braun (Konfidenz: {confidence:.2%})")
            return 'Glasflasche_Braun', confidence

        # 3. Weißglas / Klarglas
        # Niedrige Sättigung, mittlere Helligkeit
        if saturation < 20 and 80 < brightness < 200:  # Gesenkt
            confidence = min(1.0, (100 - saturation) / 100 * 0.5 + 0.4)  # Höhere Base
            logger.info(f"→ Klassifiziert als: Glasflasche_Weiss (Konfidenz: {confidence:.2%})")
            return 'Glasflasche_Weiss', confidence


        # 4. Mehrweg-Glas (ähnlich wie Weißglas, aber etwas dunkler)
        if saturation < 25 and 60 < brightness < 150:  # Gesenkt
            confidence = 0.60  # Erhöht
            logger.info(f"→ Klassifiziert als: Mehrweg_Glas (Konfidenz: {confidence:.2%})")
            return 'Mehrweg_Glas', confidence

        # Fallback: Entscheide basierend auf Helligkeit und Hue
        if 28 <= hue <= 90:  # Wenn Hue grünlich ist (ab 28°)
            logger.info(f"→ Fallback: Glasflasche_Gruen (schwache Farbe, Konfidenz: 0.55)")
            return 'Glasflasche_Gruen', 0.55
        elif brightness > 160:
            logger.info(f"→ Fallback: PET_Flasche (hell, Konfidenz: 0.50)")
            return 'PET_Flasche', 0.50
        elif brightness < 100:
            logger.info(f"→ Fallback: Glasflasche_Braun (dunkel, Konfidenz: 0.50)")
            return 'Glasflasche_Braun', 0.50
        else:
            logger.info(f"→ Fallback: Glasflasche_Weiss (mittel, Konfidenz: 0.48)")
            return 'Glasflasche_Weiss', 0.48

    async def analyze_image(self, image_bytes: bytes, roi_config: Optional[Dict] = None) -> Optional[BottleDetection]:
        """
        Analysiert ein Bild und klassifiziert die Flasche

        Args:
            image_bytes: Bilddaten als Bytes
            roi_config: Optional custom ROI Konfiguration

        Returns:
            BottleDetection oder None bei Fehler
        """
        try:
            # Dekodiere Bild
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if image is None:
                logger.error("Bild konnte nicht dekodiert werden")
                return None

            logger.info(f"📸 Bild geladen: {image.shape[1]}x{image.shape[0]} pixels")

            # Extrahiere ROI
            roi, roi_coords = self.extract_roi(image, roi_config)

            if roi.size == 0:
                logger.error("ROI ist leer")
                return None

            # Analysiere Farbe
            color_data = self.analyze_dominant_color(roi)

            if not color_data:
                logger.error("Farbanalyse fehlgeschlagen")
                return None

            # Klassifiziere Flaschentyp
            bottle_type, confidence = self.classify_bottle_type(color_data)

            # Prüfe Mindest-Konfidenz
            if confidence < settings.min_confidence:
                logger.warning(f"⚠️  Konfidenz zu niedrig: {confidence:.2%} < {settings.min_confidence:.2%}")
                return None

            # Erstelle Detection
            detection = BottleDetection(
                class_name=bottle_type,
                confidence=confidence,
                bounding_box=roi_coords
            )

            logger.info(f"✅ Flasche erkannt: {bottle_type} mit {confidence:.2%} Konfidenz")

            return detection

        except Exception as e:
            logger.error(f"❌ Fehler bei der Bildanalyse: {e}", exc_info=True)
            return None

    def visualize_roi(self, image_bytes: bytes, roi_config: Optional[Dict] = None) -> Optional[bytes]:
        """
        BONUS: Visualisiert die ROI im Bild (für Debugging)

        Args:
            image_bytes: Bilddaten als Bytes
            roi_config: Optional custom ROI Konfiguration

        Returns:
            Bild mit ROI-Rechteck als Bytes oder None
        """
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if image is None:
                return None

            _, roi_coords = self.extract_roi(image, roi_config)

            # Zeichne ROI-Rechteck
            x, y, w, h = roi_coords['x'], roi_coords['y'], roi_coords['width'], roi_coords['height']
            cv2.rectangle(image, (x, y), (x + w, y + h), (0, 255, 0), 3)

            # Füge Text hinzu
            cv2.putText(image, "ROI", (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX,
                        1, (0, 255, 0), 2)

            # Konvertiere zurück zu Bytes
            _, buffer = cv2.imencode('.jpg', image)
            return buffer.tobytes()

        except Exception as e:
            logger.error(f"Fehler beim Visualisieren: {e}")
            return None


# Globale Instanz
color_service = ColorAnalysisService()