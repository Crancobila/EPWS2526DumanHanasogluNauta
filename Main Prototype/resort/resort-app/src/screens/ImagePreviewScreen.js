import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TOP_BAR_HEIGHT = 90;
const BOTTOM_BAR_HEIGHT = 100;
const IMAGE_AREA_HEIGHT = SCREEN_HEIGHT - TOP_BAR_HEIGHT - BOTTOM_BAR_HEIGHT;

export default function ImagePreviewScreen({ navigation, route }) {
  const { imageUri } = route.params;

  const [imageLayout, setImageLayout] = useState(null);

  const initialDiameter = SCREEN_WIDTH * 0.55;
  const [roiCenter, setRoiCenter] = useState({
    x: SCREEN_WIDTH / 2,
    y: IMAGE_AREA_HEIGHT / 2,
  });
  const [roiDiameter, setRoiDiameter] = useState(initialDiameter);

  // Refs to avoid stale closures in PanResponder
  const roiCenterRef = useRef(roiCenter);
  const roiDiameterRef = useRef(roiDiameter);
  const imageLayoutRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef(0);

  useEffect(() => { roiCenterRef.current = roiCenter; }, [roiCenter]);
  useEffect(() => { roiDiameterRef.current = roiDiameter; }, [roiDiameter]);
  useEffect(() => { imageLayoutRef.current = imageLayout; }, [imageLayout]);

  // Load image dimensions and compute contained layout
  useEffect(() => {
    Image.getSize(
      imageUri,
      (imgWidth, imgHeight) => {
        const areaWidth = SCREEN_WIDTH;
        const areaHeight = IMAGE_AREA_HEIGHT;
        const imageAspect = imgWidth / imgHeight;
        const areaAspect = areaWidth / areaHeight;

        let displayWidth, displayHeight;
        if (imageAspect > areaAspect) {
          displayWidth = areaWidth;
          displayHeight = areaWidth / imageAspect;
        } else {
          displayHeight = areaHeight;
          displayWidth = areaHeight * imageAspect;
        }

        const offsetX = (areaWidth - displayWidth) / 2;
        const offsetY = (areaHeight - displayHeight) / 2;

        const layout = { displayWidth, displayHeight, offsetX, offsetY };
        setImageLayout(layout);

        // Center ROI on the image
        const diameter = Math.min(displayWidth, displayHeight) * 0.65;
        setRoiCenter({
          x: offsetX + displayWidth / 2,
          y: offsetY + displayHeight / 2,
        });
        setRoiDiameter(diameter);
      },
      () => {},
    );
  }, [imageUri]);

  // Clamp ROI center so the circle stays within image bounds
  const clampCenter = useCallback((x, y, diameter) => {
    const layout = imageLayoutRef.current;
    if (!layout) return { x, y };
    const r = diameter / 2;
    return {
      x: Math.max(layout.offsetX + r, Math.min(layout.offsetX + layout.displayWidth - r, x)),
      y: Math.max(layout.offsetY + r, Math.min(layout.offsetY + layout.displayHeight - r, y)),
    };
  }, []);

  // PanResponder for dragging the ROI circle
  const movePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 2 || Math.abs(gs.dy) > 2,
      onPanResponderGrant: () => {
        dragStartRef.current = { ...roiCenterRef.current };
      },
      onPanResponderMove: (_, gs) => {
        const newX = dragStartRef.current.x + gs.dx;
        const newY = dragStartRef.current.y + gs.dy;
        const layout = imageLayoutRef.current;
        if (layout) {
          const r = roiDiameterRef.current / 2;
          setRoiCenter({
            x: Math.max(layout.offsetX + r, Math.min(layout.offsetX + layout.displayWidth - r, newX)),
            y: Math.max(layout.offsetY + r, Math.min(layout.offsetY + layout.displayHeight - r, newY)),
          });
        } else {
          setRoiCenter({ x: newX, y: newY });
        }
      },
    }),
  ).current;

  // PanResponder for resizing via handle
  const resizePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        resizeStartRef.current = roiDiameterRef.current;
      },
      onPanResponderMove: (_, gs) => {
        const delta = (gs.dx + gs.dy) * 0.8;
        const layout = imageLayoutRef.current;
        const maxSize = layout
          ? Math.min(layout.displayWidth, layout.displayHeight) * 0.95
          : SCREEN_WIDTH * 0.9;
        const newDiameter = Math.max(80, Math.min(maxSize, resizeStartRef.current + delta));
        setRoiDiameter(newDiameter);

        // Re-clamp center after resize
        const center = roiCenterRef.current;
        if (layout) {
          const r = newDiameter / 2;
          setRoiCenter({
            x: Math.max(layout.offsetX + r, Math.min(layout.offsetX + layout.displayWidth - r, center.x)),
            y: Math.max(layout.offsetY + r, Math.min(layout.offsetY + layout.displayHeight - r, center.y)),
          });
        }
      },
    }),
  ).current;

  // Convert screen ROI to image-percentage params
  const computeRoiParams = useCallback(() => {
    if (!imageLayout) return null;
    const { offsetX, offsetY, displayWidth, displayHeight } = imageLayout;

    const roiLeft = roiCenter.x - roiDiameter / 2;
    const roiTop = roiCenter.y - roiDiameter / 2;

    const relativeLeft = roiLeft - offsetX;
    const relativeTop = roiTop - offsetY;

    const roi_x_percent = Math.max(0, Math.min(1, relativeLeft / displayWidth));
    const roi_y_percent = Math.max(0, Math.min(1, relativeTop / displayHeight));
    const roi_width_percent = Math.max(0.05, Math.min(1, roiDiameter / displayWidth));
    const roi_height_percent = Math.max(0.05, Math.min(1, roiDiameter / displayHeight));

    return {
      roi_x_percent: parseFloat(roi_x_percent.toFixed(4)),
      roi_y_percent: parseFloat(roi_y_percent.toFixed(4)),
      roi_width_percent: parseFloat(roi_width_percent.toFixed(4)),
      roi_height_percent: parseFloat(roi_height_percent.toFixed(4)),
    };
  }, [roiCenter, roiDiameter, imageLayout]);

  const handleContinue = () => {
    const roiParams = computeRoiParams();
    navigation.navigate('Loading', { imageUri, roiParams });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Top bar */}
      <SafeAreaView style={styles.topBar}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelText}>Abbrechen</Text>
        </TouchableOpacity>
        <Text style={styles.titleText}>Bereich anpassen</Text>
        <View style={{ width: 80 }} />
      </SafeAreaView>

      {/* Image area with ROI overlay */}
      <View style={styles.imageArea}>
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="contain"
        />

        {/* Draggable ROI circle */}
        <View
          style={[
            styles.roiCircle,
            {
              width: roiDiameter,
              height: roiDiameter,
              borderRadius: roiDiameter / 2,
              left: roiCenter.x - roiDiameter / 2,
              top: roiCenter.y - roiDiameter / 2,
            },
          ]}
          {...movePanResponder.panHandlers}
        >
          <Text style={styles.roiText}>Bereich verschieben</Text>

          {/* Resize handle */}
          <View
            style={styles.resizeHandle}
            {...resizePanResponder.panHandlers}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="resize" size={14} color={colors.white} />
          </View>
        </View>
      </View>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={colors.white}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.continueText}>Analysieren</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topBar: {
    height: TOP_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    width: 80,
  },
  cancelText: {
    color: colors.white,
    fontWeight: '600',
    textAlign: 'center',
  },
  titleText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  imageArea: {
    width: SCREEN_WIDTH,
    height: IMAGE_AREA_HEIGHT,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  roiCircle: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(0, 200, 83, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roiText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    textAlign: 'center',
  },
  resizeHandle: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  bottomBar: {
    height: BOTTOM_BAR_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
});
