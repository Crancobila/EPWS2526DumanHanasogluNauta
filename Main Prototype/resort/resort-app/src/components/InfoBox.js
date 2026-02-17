import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

export default function InfoBox({ title, description, highlightText }) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="information-circle" size={20} color={colors.blueIcon} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>
            Fotografieren Sie den <Text style={styles.highlight}>Flaschenboden</Text> Ihrer Glasflasche oder laden Sie ein Bild hoch. Die App analysiert die Glasfarbe anhand des Bodens und zeigt Ihnen, in welchen Container die Flasche gehört.
          </Text>
          <Text style={styles.subDescription}>
            Perfekt für Menschen mit Farbsehschwäche – die Erkennung erfolgt automatisch und zuverlässig.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.blueLight,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.blueBorder,
  },
  content: {
    flexDirection: 'row',
    gap: 12,
  },
  iconContainer: {
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.blueText,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.blueTextLight,
    lineHeight: 20,
    marginBottom: 8,
  },
  highlight: {
    fontWeight: '600',
  },
  subDescription: {
    fontSize: 14,
    color: colors.blueTextLight,
    lineHeight: 20,
  },
});
