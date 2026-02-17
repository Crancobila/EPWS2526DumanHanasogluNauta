import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { analyzeBottle } from '../services/api';
import { colors } from '../constants/colors';

export default function LoadingScreen({ navigation, route }) {
  const { imageUri } = route.params || {};

  useEffect(() => {
    const runAnalysis = async () => {
      if (!imageUri) {
        Alert.alert('Fehler', 'Kein Bild gefunden.');
        navigation.replace('Home');
        return;
      }

      try {
        const result = await analyzeBottle(imageUri);
        const detection = result?.detections?.[0];

        if (!result?.success || !detection) {
          navigation.replace('Result', {
            errorType: 'no-detection',
            result,
          });
          return;
        }

        navigation.replace('Result', { result });
      } catch (error) {
        navigation.replace('Result', { errorType: 'network' });
      }
    };

    runAnalysis();
  }, [imageUri, navigation]);

  return (
    <LinearGradient
      colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
      style={styles.container}
    >
      <View style={styles.content}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.text}>Analysiere Flasche...</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  text: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
});
