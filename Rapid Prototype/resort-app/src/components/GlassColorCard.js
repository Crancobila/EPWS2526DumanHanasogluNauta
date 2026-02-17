import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

const glassTypes = [
  {
    label: 'Grünglas',
    container: 'Grünglas-Container',
    color1: colors.greenGlass,
    color2: colors.greenGlassDark
  },
  {
    label: 'Braunglas',
    container: 'Braunglas-Container',
    color1: colors.brownGlass,
    color2: colors.brownGlassDark
  },
  {
    label: 'Weißglas',
    container: 'Weißglas-Container',
    color1: colors.whiteGlass,
    color2: colors.whiteGlassDark,
    hasBorder: true
  },
  {
    label: 'Andere Farben',
    container: 'Grünglas-Container',
    color1: colors.otherGlass,
    color2: colors.otherGlassDark
  },
];

function StripedBox({ color1, color2, hasBorder }) {
  return (
    <View style={[styles.colorBox, hasBorder && styles.colorBoxBorder]}>
      <View style={styles.stripeContainer}>
        {[...Array(10)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.stripe,
              { backgroundColor: i % 2 === 0 ? color1 : color2 }
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function GlassColorRow({ label, container, color1, color2, hasBorder }) {
  return (
    <View style={styles.row}>
      <StripedBox color1={color1} color2={color2} hasBorder={hasBorder} />
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.containerText}>→ {container}</Text>
      </View>
    </View>
  );
}

export default function GlassColorOverview() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Glasfarben-Übersicht</Text>
      <View style={styles.list}>
        {glassTypes.map((glass, index) => (
          <GlassColorRow key={index} {...glass} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  list: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorBox: {
    width: 40,
    height: 40,
    borderRadius: 6,
    overflow: 'hidden',
  },
  colorBoxBorder: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  stripeContainer: {
    flex: 1,
    flexDirection: 'row',
    transform: [{ rotate: '45deg' }, { scale: 1.5 }],
  },
  stripe: {
    width: 8,
    height: '200%',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  containerText: {
    fontSize: 14,
    color: colors.gray,
  },
});
