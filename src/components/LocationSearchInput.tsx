import React, { useRef, useState } from 'react';
import {
  Pressable,
  StyleProp,
  TextInput as RNTextInput,
  View,
  ViewStyle,
} from 'react-native';
import { AppIcon } from './AppIcon';
import { Text, TextInput } from './Text';
import { withAlpha } from '@/theme/colors';
import { useThemeColors } from '@/theme/themeStore';

export interface LocationPrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  source: 'google' | 'curated';
}

interface LocationSearchInputProps {
  value: string;
  onChangeText: (value: string) => void;
  onSelectPlace?: (place: LocationPrediction) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  style?: StyleProp<ViewStyle>;
  showPopularChips?: boolean;
  onFocus?: () => void;
}

/**
 * Dedicated manual location input component.
 * Allows users to type full custom city/state/country freely
 * without suggestion popups or chip overlays interfering.
 * Entire container is pressable to guarantee immediate focus.
 */
export function LocationSearchInput({
  value,
  onChangeText,
  onSelectPlace,
  label = 'Place of Birth (City, State, Country)',
  placeholder = 'Enter birth place (e.g. Mumbai)',
  required = false,
  style,
  onFocus,
}: LocationSearchInputProps) {
  const colors = useThemeColors();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<RNTextInput>(null);

  const handleChange = (text: string) => {
    onChangeText(text);
    if (onSelectPlace) {
      onSelectPlace({
        placeId: '',
        description: text,
        mainText: text,
        secondaryText: '',
        source: 'curated',
      });
    }
  };

  const handleClear = () => {
    onChangeText('');
    inputRef.current?.focus();
    if (onSelectPlace) {
      onSelectPlace({
        placeId: '',
        description: '',
        mainText: '',
        secondaryText: '',
        source: 'curated',
      });
    }
  };

  return (
    <View style={[{ marginBottom: 12 }, style]}>
      {/* Label and Location badge */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600' }}>
          {label} {required ? <Text style={{ color: colors.goldAccent }}>*</Text> : null}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: withAlpha(colors.goldAccent, 18),
            paddingHorizontal: 7,
            paddingVertical: 2,
            borderRadius: 6,
          }}
        >
          <AppIcon name="place" size={11} color={colors.goldAccent} />
          <Text
            style={{
              fontSize: 10,
              color: colors.goldAccent,
              fontWeight: '700',
              marginLeft: 3,
            }}
          >
            City / Location
          </Text>
        </View>
      </View>

      {/* Manual Input Box */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surfaceVariant,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: isFocused ? colors.goldAccent : colors.cardBorder,
          paddingHorizontal: 12,
          minHeight: 50,
        }}
      >
        <AppIcon
          name="location_on"
          size={20}
          color={isFocused ? colors.goldAccent : colors.textMuted}
          style={{ marginRight: 8 }}
        />

        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={handleChange}
          onFocus={() => {
            setIsFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setIsFocused(false);
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          style={{
            flex: 1,
            color: colors.textPrimary,
            fontSize: 14,
            fontWeight: '600',
            paddingVertical: 12,
          }}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="done"
          blurOnSubmit={true}
        />

        {value && value.length > 0 ? (
          <Pressable onPress={handleClear} hitSlop={10} style={{ padding: 6, marginLeft: 4 }}>
            <AppIcon name="close" size={16} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
