import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

const tips = [
  { text: 'Fotografieren Sie den ', highlight: 'Flaschenboden', suffix: ' von unten' },
  { text: 'Vermeiden Sie Etiketten oder Aufkleber im Bild' },
  { text: 'Achten Sie auf gute Beleuchtung (natürliches Licht ist ideal)' },
  { text: 'Positionieren Sie die Flasche mittig im Bild' },
  { text: 'Stellen Sie sicher, dass ', highlight: 'nur die Flasche', suffix: ' fotografiert wird – Sie sind für die korrekte Bildaufnahme verantwortlich' },
  { text: 'Der fotografierte Gegenstand muss aus ', highlight: 'Glas', suffix: ' bestehen – Sie sind dafür verantwortlich, dass es sich um Glas handelt' },
];

export default function TipsList() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="bulb" size={20} color={colors.amberIcon} />
        <Text style={styles.title}>Tipps für beste Ergebnisse</Text>
      </View>
      <View style={styles.list}>
        {tips.map((tip, index) => (
          <View key={index} style={styles.row}>
            <Ionicons name="checkmark-circle" size={16} color={colors.amberIcon} style={styles.checkIcon} />
            <Text style={styles.tipText}>
              {tip.text}
              {tip.highlight && <Text style={styles.highlight}>{tip.highlight}</Text>}
              {tip.suffix && tip.suffix}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.amberLight,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.amberBorder,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.amberText,
  },
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  checkIcon: {
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    color: colors.amberText,
    fontSize: 14,
    lineHeight: 20,
  },
  highlight: {
    fontWeight: '600',
  },
});
