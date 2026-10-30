/**
 * Port of lib/widgets/custom_image_widget.dart (CustomImageWidget).
 * - network → expo-image with disk cache (CachedNetworkImage); on error shows errorWidget or no-image.jpg
 * - local assets (svg/png/jpg) → require()'d module numbers
 */
import { Image, ImageContentFit } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { DimensionValue, Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { resolveMediaUrl } from '@/config/api';

const NO_IMAGE = require('../../assets/images/no-image.jpg');

type Fit = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';

export interface AppImageProps {
  uri?: string | number | null;
  width?: DimensionValue;
  height?: DimensionValue;
  fit?: Fit;
  radius?: number;
  tintColor?: string;
  semanticLabel?: string;
  errorWidget?: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Alignment of the image content (Flutter `alignment`) e.g. 'top'. */
  contentPosition?: 'top' | 'center' | 'bottom';
}

export function AppImage({
  uri, width, height, fit, radius, tintColor, semanticLabel, errorWidget, onPress, style, contentPosition,
}: AppImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  if (uri == null || uri === '') {
    if (errorWidget) return <View style={[{ width, height }, style]}>{errorWidget}</View>;
    return <View style={[{ width, height }, style]} />;
  }

  const resolvedUri = typeof uri === 'string' ? resolveMediaUrl(uri) : uri;
  const isUriString =
    typeof resolvedUri === 'string' &&
    (resolvedUri.startsWith('http://') ||
      resolvedUri.startsWith('https://') ||
      resolvedUri.startsWith('data:') ||
      resolvedUri.startsWith('file://') ||
      resolvedUri.startsWith('blob:'));
  const contentFit: ImageContentFit = (fit ?? 'cover') as ImageContentFit;
  const box: StyleProp<ViewStyle> = [{ width, height, borderRadius: radius, overflow: 'hidden' }, style];

  let body: React.ReactNode;
  if (failed) {
    body = errorWidget ?? (
      <Image source={NO_IMAGE} style={{ width: '100%', height: '100%' }} contentFit="cover" accessibilityLabel={semanticLabel} />
    );
  } else {
    body = (
      <Image
        source={isUriString ? { uri: resolvedUri as string } : (resolvedUri as number)}
        style={{ width: '100%', height: '100%' }}
        contentFit={contentFit}
        contentPosition={contentPosition}
        tintColor={tintColor}
        cachePolicy="disk"
        transition={150}
        accessibilityLabel={semanticLabel}
        onError={() => setFailed(true)}
      />
    );
  }
  if (onPress) return <Pressable onPress={onPress} style={box}>{body}</Pressable>;
  return <View style={box}>{body}</View>;
}
