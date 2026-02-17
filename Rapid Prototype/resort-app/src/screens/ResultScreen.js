import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../constants/colors';

const containerInfo = {
  Glasflasche_Gruen: {
    name: 'Grünglas',
    container: 'Grünglas-Container',
    color1: colors.greenGlass,
    color2: colors.greenGlassDark,
    icon: 'leaf',
  },
  Glasflasche_Braun: {
    name: 'Braunglas',
    container: 'Braunglas-Container',
    color1: colors.brownGlass,
    color2: colors.brownGlassDark,
    icon: 'cafe',
  },
  Glasflasche_Weiss: {
    name: 'Weißglas',
    container: 'Weißglas-Container',
    color1: colors.whiteGlass,
    color2: colors.whiteGlassDark,
    icon: 'water',
    hasBorder: true,
  },
};

function StripedCircle({ color1, color2, hasBorder, icon }) {
  return (
    <View style={[styles.iconCircle, hasBorder && styles.iconCircleBorder]}>
      <View style={styles.stripeContainer}>
        {[...Array(12)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.stripe,
              { backgroundColor: i % 2 === 0 ? color1 : color2 }
            ]}
          />
        ))}
      </View>
      <View style={styles.iconOverlay}>
        <Ionicons name={icon} size={40} color={colors.white} />
      </View>
    </View>
  );
}

export default function ResultScreen({ navigation, route }) {
  const { result, errorType } = route.params || {};
  const detection = result?.detections?.[0];
  const className = detection?.class_name;
  const confidence = detection?.confidence ?? 0;
  const confidencePercent = Math.round(confidence * 100);

  const info = containerInfo[className] || {
    name: 'Unbekannt',
    container: 'Bitte erneut versuchen',
    color1: colors.gray,
    color2: colors.grayLight,
    icon: 'help-circle',
  };

  const getConfidenceColor = () => {
    if (confidence >= 0.8) return colors.primary;
    if (confidence >= 0.6) return colors.warning;
    return colors.danger;
  };

  const showNoDetection = errorType === 'no-detection';
  const showNetworkError = errorType === 'network';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Ergebnis</Text>
          </View>
        </SafeAreaView>
      </View>

      <LinearGradient
        colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <StripedCircle
            color1={info.color1}
            color2={info.color2}
            hasBorder={info.hasBorder}
            icon={info.icon}
          />

          {showNetworkError ? (
            <Text style={styles.title}>Verbindung fehlgeschlagen</Text>
          ) : showNoDetection ? (
            <Text style={styles.title}>Keine Flasche erkannt</Text>
          ) : (
            <Text style={styles.title}>{info.name}</Text>
          )}

          {!showNetworkError && !showNoDetection && (
            <View style={styles.confidenceContainer}>
              <Text style={styles.confidenceLabel}>Konfidenz: </Text>
              <Text style={[styles.confidenceValue, { color: getConfidenceColor() }]}>
                {confidencePercent}%
              </Text>
            </View>
          )}

          {!showNetworkError && !showNoDetection && (
            <View style={styles.containerBox}>
              <Text style={styles.containerLabel}>→ {info.container}</Text>
            </View>
          )}

          {confidence < 0.6 && !showNetworkError && !showNoDetection && (
            <View style={styles.warningBox}>
              <Ionicons name="warning" size={16} color={colors.danger} />
              <Text style={styles.warningText}>
                Niedrige Konfidenz. Bitte überprüfen Sie das Ergebnis.
              </Text>
            </View>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.replace('Camera')}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={20} color={colors.white} style={styles.buttonIcon} />
              <Text style={styles.primaryButtonText}>Neues Foto</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.replace('Home')}
              activeOpacity={0.8}
            >
              <Ionicons name="home" size={20} color={colors.primary} style={styles.buttonIcon} />
              <Text style={styles.secondaryButtonText}>Zur Startseite</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  header: {
    backgroundColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerSafeArea: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 16,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 8,
  },
  iconCircleBorder: {
    borderWidth: 2,
    borderColor: colors.border,
  },
  stripeContainer: {
    position: 'absolute',
    width: '200%',
    height: '200%',
    flexDirection: 'row',
    transform: [{ rotate: '45deg' }, { translateX: -25 }, { translateY: -25 }],
  },
  stripe: {
    width: 16,
    height: '100%',
  },
  iconOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  confidenceValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  containerBox: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  containerLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  warningText: {
    fontSize: 14,
    color: colors.danger,
    flex: 1,
  },
  buttonRow: {
    width: '100%',
    gap: 12,
    marginTop: 16,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: '500',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    paddingVertical: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontWeight: '500',
    fontSize: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
});
