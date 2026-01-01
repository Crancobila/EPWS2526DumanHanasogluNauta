#!/usr/bin/env python3
"""
Test-Script für die Bottle Recycling API (Color-Based v2.0)

Verwendung:
    python test_api.py [image_path] [--roi-x X] [--roi-y Y] [--roi-width W] [--roi-height H]

Beispiele:
    python test_api.py test_images/bottle.jpg
    python test_api.py bottle.jpg --roi-x 0.38 --roi-y 0.40 --roi-width 0.24 --roi-height 0.30
"""

import requests
import sys
import json
from pathlib import Path
import argparse

API_BASE_URL = "http://localhost:8000"


def test_health():
    """Teste Health-Check Endpoint"""
    print("🏥 Teste Health-Check...")
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        response.raise_for_status()
        data = response.json()

        print(f"✅ Status: {data['status']}")
        print(f"   Version: {data['version']}")
        print(f"   Analysis bereit: {data['analysis_ready']}")
        print(f"   Datenbank verbunden: {data['database_connected']}")
        return True
    except Exception as e:
        print(f"❌ Health-Check fehlgeschlagen: {e}")
        return False


def test_analyze_image(image_path: str, roi_params: dict = None):
    """Teste Bildanalyse Endpoint"""
    print(f"\n🔍 Teste Bildanalyse mit: {image_path}")

    image_file = Path(image_path)
    if not image_file.exists():
        print(f"❌ Bild nicht gefunden: {image_path}")
        return False

    # Build URL mit ROI-Parametern
    url = f"{API_BASE_URL}/api/v1/analyze"
    if roi_params:
        params = {k: v for k, v in roi_params.items() if v is not None}
        if params:
            print(f"🎯 Verwende ROI: {params}")
    else:
        params = {}

    try:
        with open(image_file, 'rb') as f:
            files = {'image': (image_file.name, f, 'image/jpeg')}
            response = requests.post(url, files=files, params=params)
            response.raise_for_status()
            data = response.json()

        print("✅ Analyse erfolgreich!")
        print(f"\n📊 Ergebnisse:")
        print(f"   Success: {data['success']}")
        print(f"   Nachricht: {data['message']}")
        print(f"   Verarbeitungszeit: {data['processing_time_ms']}ms")
        print(f"   Anzahl Erkennungen: {len(data['detections'])}")

        if data['detections']:
            print(f"\n🍾 Erkannte Flaschen:")
            for i, detection in enumerate(data['detections'], 1):
                print(f"   {i}. {detection['class_name']}")
                print(f"      Konfidenz: {detection['confidence']:.2%}")
                if detection.get('bounding_box'):
                    bbox = detection['bounding_box']
                    print(f"      ROI: x={bbox['x']}, y={bbox['y']}, "
                          f"w={bbox['width']}, h={bbox['height']}")

        if data.get('recycling_info'):
            info = data['recycling_info']
            print(f"\n♻️  Recycling-Informationen:")
            print(f"   Material: {info['material']}")
            print(f"   Kategorie: {info['recycling_category']}")
            print(f"   Anleitung: {info['instructions'][:80]}...")
            if info.get('pfand'):
                print(f"   Pfand: {info['pfand']}€")

        return True

    except requests.exceptions.RequestException as e:
        print(f"❌ API-Fehler: {e}")
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_data = e.response.json()
                print(f"   Detail: {error_data.get('detail', 'Keine Details')}")
            except:
                pass
        return False
    except Exception as e:
        print(f"❌ Unerwarteter Fehler: {e}")
        return False


def test_recycling_info(bottle_type: str = "Glasflasche_Gruen"):
    """Teste Recycling-Info Endpoint"""
    print(f"\n📖 Teste Recycling-Info für: {bottle_type}")

    try:
        response = requests.get(f"{API_BASE_URL}/api/v1/recycling-info/{bottle_type}")
        response.raise_for_status()
        data = response.json()

        print("✅ Info erfolgreich abgerufen!")
        print(f"\n♻️  Details:")
        print(f"   Material: {data['material']}")
        print(f"   Kategorie: {data['recycling_category']}")
        if data.get('pfand'):
            print(f"   Pfand: {data['pfand']}€")

        return True

    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            print(f"⚠️  Keine Informationen für '{bottle_type}' gefunden")
        else:
            print(f"❌ HTTP-Fehler: {e}")
        return False
    except Exception as e:
        print(f"❌ Fehler: {e}")
        return False


def main():
    """Hauptfunktion"""
    parser = argparse.ArgumentParser(description='Test Bottle Recycling API')
    parser.add_argument('image', nargs='?', help='Pfad zum Bild')
    parser.add_argument('--roi-x', type=float, help='ROI X-Start (0.0-1.0)')
    parser.add_argument('--roi-y', type=float, help='ROI Y-Start (0.0-1.0)')
    parser.add_argument('--roi-width', type=float, help='ROI Breite (0.0-1.0)')
    parser.add_argument('--roi-height', type=float, help='ROI Höhe (0.0-1.0)')
    args = parser.parse_args()

    print("=" * 60)
    print("🧪 Bottle Recycling API Test Suite v2.0 (Color-Based)")
    print("=" * 60)

    # Health Check
    if not test_health():
        print("\n⚠️  API scheint nicht erreichbar zu sein.")
        print("   Stelle sicher, dass die API läuft:")
        print("   docker-compose up -d")
        return

    # Recycling Info Test
    test_recycling_info("Glasflasche_Gruen")

    # Bildanalyse Test
    if args.image:
        roi_params = {
            'roi_x_percent': args.roi_x,
            'roi_y_percent': args.roi_y,
            'roi_width_percent': args.roi_width,
            'roi_height_percent': args.roi_height
        }
        test_analyze_image(args.image, roi_params)
    else:
        print("\n💡 Tipp: Um Bildanalyse zu testen:")
        print("   python test_api.py /pfad/zum/bild.jpg")
        print("\n   Mit custom ROI:")
        print("   python test_api.py bild.jpg --roi-x 0.38 --roi-y 0.40 --roi-width 0.24 --roi-height 0.30")

    print("\n" + "=" * 60)
    print("✅ Tests abgeschlossen!")
    print("=" * 60)


if __name__ == "__main__":
    main()