import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { colors } from '../constants/colors';

export default function CameraScreen({ navigation }) {
  const cameraRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      navigation.navigate('Loading', { imageUri: photo.uri });
    } catch (error) {
      Alert.alert('Fehler', 'Konnte Foto nicht aufnehmen.');
    } finally {
      setIsCapturing(false);
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Kamera wird vorbereitet...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Kamera-Berechtigung erforderlich
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={requestPermission}
        >
          <Text style={styles.primaryButtonText}>Berechtigung erteilen</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: colors.gray, marginTop: 8 }}>Zurueck</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef} />

      <View style={styles.uiOverlay}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelText}>Abbrechen</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.overlay}>
          <View style={styles.roiBox}>
            <Text style={styles.roiText}>Flasche hier positionieren</Text>
          </View>
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
            onPress={handleCapture}
            disabled={isCapturing}
          >
            <Text style={styles.captureText}>Foto aufnehmen</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  uiOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  topBar: {
    paddingTop: 40,
    paddingHorizontal: 16,
  },
  cancelButton: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  cancelText: {
    color: colors.white,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roiBox: {
    width: '50%',
    height: '50%',
    borderWidth: 3,
    borderColor: colors.primary,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 200, 83, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roiText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  bottomBar: {
    paddingBottom: 36,
    paddingHorizontal: 16,
  },
  captureButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: colors.secondary,
    gap: 12,
  },
  permissionText: {
    fontSize: 16,
    color: colors.text,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: '700',
  },
});
