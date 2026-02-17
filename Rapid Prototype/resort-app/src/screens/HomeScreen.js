import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { colors } from '../constants/colors';
import InfoBox from '../components/InfoBox';
import TipsList from '../components/TipsList';
import GlassColorOverview from '../components/GlassColorCard';

export default function HomeScreen({ navigation }) {
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Berechtigung erforderlich', 'Bitte Medienzugriff erlauben.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.9,
    });

    if (!result.canceled && result.assets?.length) {
      const imageUri = result.assets[0].uri;
      navigation.navigate('Loading', { imageUri });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerContent}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="sync" size={24} color={colors.white} />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>ReSort</Text>
              <Text style={styles.headerSubtitle}>Glastrennungs-Assistent</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Content */}
      <LinearGradient
        colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Info Card */}
          <InfoBox title="So funktioniert ReSort" />

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Camera')}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={20} color={colors.white} style={styles.buttonIcon} />
              <Text style={styles.primaryButtonText}>Foto aufnehmen</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handlePickImage}
              activeOpacity={0.8}
            >
              <Ionicons name="cloud-upload" size={20} color={colors.primary} style={styles.buttonIcon} />
              <Text style={styles.secondaryButtonText}>Bild hochladen</Text>
            </TouchableOpacity>
          </View>

          {/* Tips Card */}
          <TipsList />

          {/* Glass Color Overview */}
          <GlassColorOverview />
        </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  buttonContainer: {
    gap: 12,
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
