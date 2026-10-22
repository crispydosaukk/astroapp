/**
 * Material OutlineInputBorder TextField with floating labelText + prefixIcon (InputDecoration equivalent).
 */
import React, { useState } from 'react';
import { TextInputProps, View } from 'react-native';
import { AppColors } from '@/theme/colors';
import { AppIcon } from './AppIcon';
import { Text, TextInput } from './Text';

export function OutlinedField({
  label, icon, value, onChangeText, testID, fill = AppColors.surfaceVariantDark, radius = 12, hint, multiline, minHeight, keyboardType, maxLength,
}: {
  label?: string; icon?: string; value: string; onChangeText: (s: string) => void; testID?: string; fill?: string; radius?: number;
  hint?: string; multiline?: boolean; minHeight?: number; keyboardType?: TextInputProps['keyboardType']; maxLength?: number;
}) {
  const [focused, setFocused] = useState(false);
  const floating = focused || value.length > 0;
  return (
    <View
      style={{
        backgroundColor: fill, borderRadius: radius, borderWidth: focused ? 1.5 : 1,
        borderColor: focused ? AppColors.goldAccent : AppColors.goldBorder, flexDirection: 'row',
        alignItems: multiline ? 'flex-start' : 'center', minHeight: minHeight ?? 48, paddingHorizontal: icon ? 0 : 16,
      }}
    >
      {icon ? <AppIcon name={icon} color={AppColors.textMuted} size={18} style={{ marginHorizontal: 14, marginTop: multiline ? 14 : 0 }} /> : null}
      <View style={{ flex: 1, paddingVertical: floating && label ? 6 : 12, paddingRight: 12 }}>
        {label && floating ? <Text style={{ color: focused ? AppColors.goldAccent : AppColors.textMuted, fontSize: 11 }}>{label}</Text> : null}
        <TextInput
          testID={testID}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={floating ? hint : label ?? hint}
          multiline={multiline}
          keyboardType={keyboardType}
          maxLength={maxLength}
          textAlignVertical={multiline ? 'top' : 'center'}
          style={{ color: AppColors.textPrimary, fontSize: 14, minHeight: multiline ? (minHeight ?? 48) - 24 : undefined }}
        />
      </View>
    </View>
  );
}
