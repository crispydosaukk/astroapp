/** Material ListTile / SwitchListTile equivalents and the bordered "settings card" container. */
import React from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { withAlpha } from '@/theme/colors';
import { useThemeColors } from '@/theme/themeStore';
import { AppIcon } from './AppIcon';
import { Switch } from './common';
import { Text } from './Text';

export function SettingsCard({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const colors = useThemeColors();
  return (
    <View
      style={[
        {
          borderRadius: 18,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function TileDivider({ indent = 60, endIndent = 0 }: { indent?: number; endIndent?: number }) {
  const colors = useThemeColors();
  return <View style={{ height: 1, marginLeft: indent, marginRight: endIndent, backgroundColor: colors.divider }} />;
}

export function IconBadge({ icon, color, size = 20, box = 40 }: { icon: string; color: string; size?: number; box?: number }) {
  const colors = useThemeColors();
  return (
    <View style={{ width: box, height: box, borderRadius: 10, backgroundColor: withAlpha(color, colors.isLight ? 20 : 25), alignItems: 'center', justifyContent: 'center' }}>
      <AppIcon name={icon} color={color} size={size} />
    </View>
  );
}

export function ListTile({
  leading, title, titleColor, titleWeight = '500', titleSize = 14, subtitle, trailing, onPress, testID, titleNode,
}: {
  leading?: React.ReactNode; title?: string; titleColor?: string; titleWeight?: '500' | '600' | '700'; titleSize?: number;
  subtitle?: string; trailing?: React.ReactNode | 'chevron'; onPress?: () => void; testID?: string; titleNode?: React.ReactNode;
}) {
  const colors = useThemeColors();
  const tc = titleColor ?? colors.textPrimary;

  const body = (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: subtitle ? 10 : 8, minHeight: subtitle ? 64 : 56 }}>
      {leading ? <View style={{ marginRight: 16 }}>{leading}</View> : null}
      <View style={{ flex: 1 }}>
        {titleNode ?? <Text style={{ color: tc, fontSize: titleSize, fontWeight: titleWeight }}>{title}</Text>}
        {subtitle ? <Text style={{ color: colors.textMuted, fontSize: 11 }}>{subtitle}</Text> : null}
      </View>
      {trailing === 'chevron' ? <AppIcon name="chevron_right_rounded" color={colors.textMuted} size={18} /> : trailing}
    </View>
  );
  if (!onPress) return <View testID={testID}>{body}</View>;
  return <Pressable testID={testID} onPress={onPress} android_ripple={{ color: 'rgba(255,255,255,0.06)' }}>{body}</Pressable>;
}

export function SwitchTile({
  title, subtitle, value, onChange, secondary, testID,
}: { title: string; subtitle?: string; value: boolean; onChange: (v: boolean) => void; secondary?: React.ReactNode; testID: string }) {
  return (
    <ListTile
      testID={`${testID}.row`}
      leading={secondary}
      title={title}
      subtitle={subtitle}
      onPress={() => onChange(!value)}
      trailing={<Switch testID={testID} value={value} onValueChange={onChange} />}
    />
  );
}
