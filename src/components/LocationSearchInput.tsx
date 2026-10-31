import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { AppIcon } from './AppIcon';
import { Text, TextInput } from './Text';
import { BASE_URL } from '@/config/api';
import { withAlpha } from '@/theme/colors';
import { useThemeColors } from '@/theme/themeStore';

export interface LocationPrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  source: 'google' | 'curated';
}

const POPULAR_VEDIC_CITIES = [
  'New Delhi, India',
  'Varanasi, India',
  'Hyderabad, India',
  'Bengaluru, India',
  'Mumbai, India',
  'Chennai, India',
  'Tirupati, India',
  'Pune, India',
  'Ujjain, India',
  'Kolkata, India',
];

interface LocationSearchInputProps {
  value: string;
  onChangeText: (value: string) => void;
  onSelectPlace?: (place: LocationPrediction) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  style?: StyleProp<ViewStyle>;
  showPopularChips?: boolean;
}

export function LocationSearchInput({
  value,
  onChangeText,
  onSelectPlace,
  label = 'Birth Place (City, State, Country)',
  placeholder = 'Search city or Google Maps location...',
  required = false,
  style,
  showPopularChips = true,
}: LocationSearchInputProps) {
  const colors = useThemeColors();
  const [query, setQuery] = useState(value || '');
  const [predictions, setPredictions] = useState<LocationPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const debounceTimer = useRef<any>(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  const searchLocations = (text: string) => {
    setQuery(text);
    onChangeText(text);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!text || text.trim().length < 2) {
      setPredictions([]);
      setShowDropdown(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setShowDropdown(true);

    debounceTimer.current = setTimeout(async () => {
      try {
        const cleanQuery = text.trim();
        const url = `${BASE_URL}/api/discovery/location-autocomplete?query=${encodeURIComponent(cleanQuery)}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.predictions)) {
            setPredictions(data.predictions);
            setShowDropdown(data.predictions.length > 0);
          } else {
            setPredictions([]);
          }
        }
      } catch (err) {
        // Fallback: don't break UI if offline
        setPredictions([]);
      } finally {
        setLoading(false);
      }
    }, 280);
  };

  const handleSelect = (item: LocationPrediction) => {
    const chosen = item.description || `${item.mainText}, ${item.secondaryText}`;
    setQuery(chosen);
    onChangeText(chosen);
    setShowDropdown(false);
    setPredictions([]);
    Keyboard.dismiss();
    if (onSelectPlace) {
      onSelectPlace(item);
    }
  };

  const handleSelectPopular = (city: string) => {
    setQuery(city);
    onChangeText(city);
    setShowDropdown(false);
    setPredictions([]);
    Keyboard.dismiss();
  };

  const clearInput = () => {
    setQuery('');
    onChangeText('');
    setPredictions([]);
    setShowDropdown(false);
  };

  return (
    <View style={[{ marginBottom: 12 }, style]}>
      {/* Label with Google Maps badge */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600' }}>
          {label} {required ? <Text style={{ color: colors.goldAccent }}>*</Text> : null}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: withAlpha(colors.goldAccent, 18), paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
          <AppIcon name="place" size={11} color={colors.goldAccent} />
          <Text style={{ fontSize: 10, color: colors.goldAccent, fontWeight: '700', marginLeft: 3 }}>
            Google Maps
          </Text>
        </View>
      </View>

      {/* Input Box */}
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
          value={query}
          onChangeText={searchLocations}
          onFocus={() => {
            setIsFocused(true);
            if (predictions.length > 0) setShowDropdown(true);
          }}
          onBlur={() => {
            setIsFocused(false);
            // Delay closing dropdown slightly so press event on suggestion triggers
            setTimeout(() => setShowDropdown(false), 200);
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
        />

        {loading ? (
          <ActivityIndicator size="small" color={colors.goldAccent} style={{ marginLeft: 6 }} />
        ) : query.length > 0 ? (
          <Pressable onPress={clearInput} hitSlop={8} style={{ padding: 4, marginLeft: 4 }}>
            <AppIcon name="close" size={16} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Google Places Dropdown Predictions */}
      {showDropdown && predictions.length > 0 && (
        <View
          style={{
            marginTop: 6,
            borderRadius: 14,
            backgroundColor: colors.surface,
            borderWidth: 1.5,
            borderColor: colors.goldAccent,
            overflow: 'hidden',
            maxHeight: 220,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 5,
            zIndex: 999,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingVertical: 6,
              backgroundColor: withAlpha(colors.goldAccent, 15),
              borderBottomWidth: 1,
              borderBottomColor: colors.cardBorder,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.goldAccent }}>
              GOOGLE PLACES SUGGESTIONS
            </Text>
            <Text style={{ fontSize: 10, color: colors.textMuted }}>
              Select to auto-fill
            </Text>
          </View>

          <FlatList
            data={predictions}
            keyExtractor={(item) => item.placeId || item.description}
            keyboardShouldPersistTaps="always"
            renderItem={({ item, index }) => (
              <Pressable
                onPress={() => handleSelect(item)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 10,
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

                <View style={{ flex: 1 }}>
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

                {item.source === 'google' && (
                  <View
                    style={{
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 4,
                      backgroundColor: withAlpha(colors.goldAccent, 25),
                      marginLeft: 6,
                    }}
                  >
                    <Text style={{ fontSize: 9, fontWeight: '700', color: colors.goldAccent }}>
                      MAPS
                    </Text>
                  </View>
                )}
              </Pressable>
            )}
          />
        </View>
      )}

      {/* Popular Spiritual & Metropolitan Cities Chips */}
      {showPopularChips && !showDropdown && (
        <View style={{ marginTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <AppIcon name="stars" size={12} color={colors.goldAccent} />
            <Text style={{ fontSize: 11, color: colors.textMuted, marginLeft: 4, fontWeight: '600' }}>
              Popular Sacred & Metro Cities:
            </Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {POPULAR_VEDIC_CITIES.slice(0, 6).map((city) => {
              const cityName = city.split(',')[0];
              const isSelected = query.toLowerCase().includes(cityName.toLowerCase());
              return (
                <Pressable
                  key={city}
                  onPress={() => handleSelectPopular(city)}
                  style={{
                    paddingHorizontal: 9,
                    paddingVertical: 4,
                    borderRadius: 8,
                    backgroundColor: isSelected ? withAlpha(colors.goldAccent, 25) : colors.surfaceVariant,
                    borderWidth: 1,
                    borderColor: isSelected ? colors.goldAccent : colors.cardBorder,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: isSelected ? '700' : '500',
                      color: isSelected ? colors.goldAccent : colors.textSecondary,
                    }}
                  >
                    {cityName}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}
