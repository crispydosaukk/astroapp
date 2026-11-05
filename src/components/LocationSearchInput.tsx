import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleProp,
  TextInput as RNTextInput,
  View,
  ViewStyle,
} from 'react-native';
import { AppIcon } from './AppIcon';
import { Text, TextInput } from './Text';
import { BASE_URL } from '@/config/api';
import { GOOGLE_MAPS_API_KEY } from '@/services/locationService';
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
 * Google Maps powered location search input.
 * Directly controlled via `value` and `onChangeText`.
 * Queries Google Maps Places API in real-time as user types
 * (e.g. Hyderabad, Guntur, Cherukupalli) without recommendations chips.
 */
export function LocationSearchInput({
  value,
  onChangeText,
  onSelectPlace,
  label = 'Place of Birth (City, State, Country)',
  placeholder = 'Enter birth place (e.g. Hyderabad, Guntur)',
  required = false,
  style,
  onFocus,
}: LocationSearchInputProps) {
  const colors = useThemeColors();
  const [predictions, setPredictions] = useState<LocationPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<RNTextInput>(null);
  const debounceTimer = useRef<any>(null);

  const searchGooglePlaces = (text: string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    const clean = text.trim();
    if (clean.length < 2) {
      setPredictions([]);
      setShowDropdown(false);
      setLoading(false);
      return;
    }

    // Debounce network call; do not set loading synchronously on every keystroke
    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        let fetchedPredictions: LocationPrediction[] = [];

        // 1. Try website backend Google Maps autocomplete endpoint first
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 3500);
          const res = await fetch(
            `${BASE_URL}/api/discovery/location-autocomplete?query=${encodeURIComponent(clean)}`,
            { signal: controller.signal }
          );
          clearTimeout(timer);
          if (res.ok) {
            const data = await res.json();
            if (data?.success && Array.isArray(data.predictions) && data.predictions.length > 0) {
              fetchedPredictions = data.predictions.map((p: any) => ({
                placeId: p.placeId || p.place_id || '',
                description: p.description || '',
                mainText: p.mainText || p.structured_formatting?.main_text || p.description || '',
                secondaryText: p.secondaryText || p.structured_formatting?.secondary_text || '',
                source: 'google' as const,
              }));
            }
          }
        } catch {
          // Backend fetch failed, proceed to direct Google Places API
        }

        // 2. Fallback directly to Google Places API
        if (fetchedPredictions.length === 0) {
          const directUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
            clean
          )}&key=${GOOGLE_MAPS_API_KEY}`;
          const directRes = await fetch(directUrl);
          if (directRes.ok) {
            const directData = await directRes.json();
            if (directData?.status === 'OK' && Array.isArray(directData.predictions)) {
              fetchedPredictions = directData.predictions.map((p: any) => ({
                placeId: p.place_id || '',
                description: p.description || '',
                mainText: p.structured_formatting?.main_text || p.description || '',
                secondaryText: p.structured_formatting?.secondary_text || '',
                source: 'google' as const,
              }));
            }
          }
        }

        if (fetchedPredictions.length > 0) {
          setPredictions(fetchedPredictions.slice(0, 6));
          setShowDropdown(true);
        } else {
          setPredictions([]);
          setShowDropdown(false);
        }
      } catch (err) {
        setPredictions([]);
        setShowDropdown(false);
      } finally {
        setLoading(false);
      }
    }, 200);
  };

  const handleChangeText = (text: string) => {
    onChangeText(text);
    searchGooglePlaces(text);
  };

  const handleSelect = (item: LocationPrediction) => {
    const chosen = item.description || item.mainText;
    onChangeText(chosen);
    setShowDropdown(false);
    setPredictions([]);
    Keyboard.dismiss();
    if (onSelectPlace) {
      onSelectPlace(item);
    }
  };

  const handleClear = () => {
    onChangeText('');
    setPredictions([]);
    setShowDropdown(false);
    inputRef.current?.focus();
    if (onSelectPlace) {
      onSelectPlace({
        placeId: '',
        description: '',
        mainText: '',
        secondaryText: '',
        source: 'google',
      });
    }
  };

  return (
    <View style={[{ marginBottom: 12 }, style]}>
      {/* Label and Google Maps badge */}
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
            Google Maps
          </Text>
        </View>
      </View>

      {/* Input Box - Pressable container ensures tapping anywhere instantly focuses input */}
      <Pressable
        onPress={() => inputRef.current?.focus()}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surfaceVariant,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: isFocused ? colors.goldAccent : colors.cardBorder,
          paddingHorizontal: 12,
          minHeight: 50,
          shadowColor: isFocused ? colors.goldAccent : 'transparent',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          elevation: isFocused ? 2 : 0,
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
          value={value || ''}
          onChangeText={handleChangeText}
          onFocus={() => {
            setIsFocused(true);
            if (predictions.length > 0) setShowDropdown(true);
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
        />

        {loading ? (
          <ActivityIndicator size="small" color={colors.goldAccent} style={{ marginLeft: 6 }} />
        ) : value && value.length > 0 ? (
          <Pressable onPress={handleClear} hitSlop={10} style={{ padding: 6, marginLeft: 4 }}>
            <AppIcon name="close" size={16} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </Pressable>

      {/* Google Maps Dropdown Predictions */}
      {showDropdown && predictions.length > 0 && (
        <View
          style={{
            marginTop: 6,
            borderRadius: 14,
            backgroundColor: colors.surface,
            borderWidth: 1.5,
            borderColor: colors.goldAccent,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.18,
            shadowRadius: 8,
            elevation: 6,
            zIndex: 999,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: withAlpha(colors.goldAccent, 14),
              borderBottomWidth: 1,
              borderBottomColor: colors.cardBorder,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AppIcon name="my_location" size={13} color={colors.goldAccent} style={{ marginRight: 5 }} />
              <Text style={{ fontSize: 10.5, fontWeight: '800', color: colors.goldAccent, letterSpacing: 0.3 }}>
                GOOGLE MAPS LOCATIONS
              </Text>
            </View>
            <Pressable onPress={() => setShowDropdown(false)} hitSlop={8} style={{ padding: 2 }}>
              <AppIcon name="close" size={14} color={colors.textMuted} />
            </Pressable>
          </View>

          {predictions.map((item, index) => (
            <Pressable
              key={item.placeId || `${item.description}-${index}`}
              onPress={() => handleSelect(item)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 11,
                backgroundColor: pressed ? withAlpha(colors.goldAccent, 20) : 'transparent',
                borderBottomWidth: index < predictions.length - 1 ? 1 : 0,
                borderBottomColor: colors.cardBorder,
              })}
            >
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: withAlpha(colors.goldAccent, 20),
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <AppIcon name="place" size={16} color={colors.goldAccent} />
              </View>

              <View style={{ flex: 1, marginRight: 8 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: colors.textPrimary,
                  }}
                >
                  {item.mainText || item.description}
                </Text>
                {item.secondaryText ? (
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 11,
                      color: colors.textMuted,
                      marginTop: 2,
                    }}
                  >
                    {item.secondaryText}
                  </Text>
                ) : null}
              </View>

              <View
                style={{
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 5,
                  backgroundColor: withAlpha(colors.goldAccent, 24),
                }}
              >
                <Text style={{ fontSize: 9, fontWeight: '800', color: colors.goldAccent }}>
                  MAPS
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
