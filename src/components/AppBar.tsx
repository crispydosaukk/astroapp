/**
 * Material AppBar / SliverAppBar(pinned) equivalent used by most push screens.
 * Height 56 (kToolbarHeight), title left-aligned (appBarTheme.centerTitle = false),
 * leading slot 56 px, IconButton actions 48 px.
 */
import React from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColors } from '@/theme/colors';
import { AppIcon } from './AppIcon';
import { Text } from './Text';

export type AppBarAction = { icon: string; onPress: () => void; testID: string; color?: string; size?: number };

export function IconButton({ icon, onPress, testID, color = AppColors.textPrimary, size = 24 }: AppBarAction) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      hitSlop={4}
      android_ripple={{ color: 'rgba(255,255,255,0.12)', borderless: true, radius: 24 }}
      style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}
    >
      <AppIcon name={icon} color={color} size={size} />
    </Pressable>
  );
}

export function AppBar({
  title, titleNode, onBack, backIcon = 'arrow_back_ios_new_rounded', backColor = AppColors.textPrimary, backSize = 20,
  actions, backgroundColor = AppColors.backgroundDark, safeTop = true, style, testIDPrefix = 'appBar', titleSize = 18,
  centerTitle = false, bottom, leading,
}: {
  title?: string; titleNode?: React.ReactNode; onBack?: () => void; backIcon?: string; backColor?: string; backSize?: number;
  actions?: Array<AppBarAction | React.ReactElement>; backgroundColor?: string; safeTop?: boolean; style?: StyleProp<ViewStyle>;
  testIDPrefix?: string; titleSize?: number; centerTitle?: boolean; bottom?: React.ReactNode; leading?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[{ backgroundColor, paddingTop: safeTop ? insets.top : 0, zIndex: 10 }, style]}>
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center' }}>
        {leading ? (
          <View style={{ width: 56, height: 56 }}>{leading}</View>
        ) : onBack ? (
          <View style={{ width: 56, alignItems: 'center' }}>
            <IconButton testID={`${testIDPrefix}.back`} icon={backIcon} onPress={onBack} color={backColor} size={backSize} />
          </View>
        ) : (
          <View style={{ width: 16 }} />
        )}
        <View style={{ flex: 1, alignItems: centerTitle ? 'center' : 'flex-start', paddingRight: actions?.length ? 0 : 16 }}>
          {titleNode ?? (
            <Text numberOfLines={1} style={{ color: AppColors.textPrimary, fontSize: titleSize, fontWeight: '700' }}>
              {title}
            </Text>
          )}
        </View>
        {actions?.map((a, i) =>
          React.isValidElement(a) ? <React.Fragment key={i}>{a}</React.Fragment> : <IconButton key={i} {...(a as AppBarAction)} />,
        )}
        {actions?.length ? <View style={{ width: 4 }} /> : null}
      </View>
      {bottom}
    </View>
  );
}

/** Boxed back button used as SliverAppBar.leading in many screens (margin 8, surfaceVariant, radius 12, gold border). */
export function BoxBackButton({ onPress, testID, iconSize = 16 }: { onPress: () => void; testID: string; iconSize?: number }) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={{ flex: 1, margin: 8, borderRadius: 12, backgroundColor: AppColors.surfaceVariantDark, borderWidth: 1, borderColor: AppColors.goldBorder, alignItems: 'center', justifyContent: 'center' }}
    >
      <AppIcon name="arrow_back_ios_new_rounded" color={AppColors.textPrimary} size={iconSize} />
    </Pressable>
  );
}
