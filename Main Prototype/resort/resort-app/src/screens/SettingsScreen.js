import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../constants/colors';
import { getApiUrl, setApiUrl, getDefaultUrl } from '../services/api';

export default function SettingsScreen({ navigation }) {
  const [url, setUrl] = useState('');
  const [savedUrl, setSavedUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    (async () => {
      const current = await getApiUrl();
      setUrl(current);
      setSavedUrl(current);
      setLoading(false);
    })();
  }, []);

  const isValidHttps = (value) =>
    /^https:\/\/.+/.test(value.trim());

  const urlChanged = url.trim() !== savedUrl;

  const handleSave = async () => {
    const trimmed = url.trim();
    if (!isValidHttps(trimmed)) {
      Alert.alert('Ungueltige URL', 'Die URL muss mit https:// beginnen.');
      return;
    }
    // Remove trailing slash
    const cleaned = trimmed.replace(/\/+$/, '');
    await setApiUrl(cleaned);
    setSavedUrl(cleaned);
    setUrl(cleaned);
    Alert.alert('Gespeichert', 'Backend-URL wurde aktualisiert.');
  };

  const handleTest = async () => {
    const trimmed = url.trim().replace(/\/+$/, '');
    if (!isValidHttps(trimmed)) {
      Alert.alert('Ungueltige URL', 'Die URL muss mit https:// beginnen.');
      return;
    }
    setTesting(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(`${trimmed}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        Alert.alert('Verbindung erfolgreich', 'Das Backend ist erreichbar.');
      } else {
        Alert.alert('Fehler', `Server antwortete mit Status ${response.status}.`);
      }
    } catch (e) {
      Alert.alert(
        'Verbindung fehlgeschlagen',
        'Das Backend ist nicht erreichbar. Bitte URL pruefen.'
      );
    } finally {
      setTesting(false);
    }
  };

  const handleReset = () => {
    const defaultUrl = getDefaultUrl();
    setUrl(defaultUrl);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Einstellungen</Text>
          </View>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* URL Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="server-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Backend-URL</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Gib die URL des Backends ein. Die URL muss mit https:// beginnen.
          </Text>

          <TextInput
            style={[
              styles.input,
              !isValidHttps(url) && url.length > 0 && styles.inputError,
            ]}
            value={url}
            onChangeText={setUrl}
            placeholder="https://example.com"
            placeholderTextColor={colors.gray}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          {!isValidHttps(url) && url.length > 0 && (
            <View style={styles.errorRow}>
              <Ionicons name="warning" size={14} color={colors.danger} />
              <Text style={styles.errorText}>
                URL muss mit https:// beginnen
              </Text>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.testButton,
                testing && styles.buttonDisabled,
              ]}
              onPress={handleTest}
              disabled={testing || !isValidHttps(url)}
              activeOpacity={0.8}
            >
              {testing ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="pulse" size={18} color={colors.primary} />
              )}
              <Text style={styles.testButtonText}>Testen</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.saveButton,
                (!urlChanged || !isValidHttps(url)) && styles.buttonDisabled,
              ]}
              onPress={handleSave}
              disabled={!urlChanged || !isValidHttps(url)}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark" size={18} color={colors.white} />
              <Text style={styles.saveButtonText}>Speichern</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleReset}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={16} color={colors.gray} />
            <Text style={styles.resetText}>Standard wiederherstellen</Text>
          </TouchableOpacity>
        </View>

        {/* Current Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Ionicons name="link" size={16} color={colors.textSecondary} />
            <Text style={styles.statusLabel}>Aktuelle URL:</Text>
          </View>
          <Text style={styles.statusValue} numberOfLines={2}>
            {savedUrl}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
  },
  content: {
    flex: 1,
    backgroundColor: colors.backgroundGradientStart,
    padding: 16,
    gap: 16,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.grayLight,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  testButton: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  testButtonText: {
    color: colors.primary,
    fontWeight: '500',
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    color: colors.white,
    fontWeight: '500',
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  resetText: {
    fontSize: 13,
    color: colors.gray,
  },
  statusCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
