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

const COMPREHENSIVE_VEDIC_CITIES = [
  { main: 'Hyderabad', sub: 'Telangana, India', full: 'Hyderabad, Telangana, India' },
  { main: 'Bengaluru', sub: 'Karnataka, India', full: 'Bengaluru, Karnataka, India' },
  { main: 'New Delhi', sub: 'Delhi, India', full: 'New Delhi, Delhi, India' },
  { main: 'Mumbai', sub: 'Maharashtra, India', full: 'Mumbai, Maharashtra, India' },
  { main: 'Chennai', sub: 'Tamil Nadu, India', full: 'Chennai, Tamil Nadu, India' },
  { main: 'Kolkata', sub: 'West Bengal, India', full: 'Kolkata, West Bengal, India' },
  { main: 'Pune', sub: 'Maharashtra, India', full: 'Pune, Maharashtra, India' },
  { main: 'Ahmedabad', sub: 'Gujarat, India', full: 'Ahmedabad, Gujarat, India' },
  { main: 'Jaipur', sub: 'Rajasthan, India', full: 'Jaipur, Rajasthan, India' },
  { main: 'Varanasi', sub: 'Uttar Pradesh, India', full: 'Varanasi, Uttar Pradesh, India' },
  { main: 'Tirupati', sub: 'Andhra Pradesh, India', full: 'Tirupati, Andhra Pradesh, India' },
  { main: 'Vijayawada', sub: 'Andhra Pradesh, India', full: 'Vijayawada, Andhra Pradesh, India' },
  { main: 'Visakhapatnam', sub: 'Andhra Pradesh, India', full: 'Visakhapatnam, Andhra Pradesh, India' },
  { main: 'Warangal', sub: 'Telangana, India', full: 'Warangal, Telangana, India' },
  { main: 'Guntur', sub: 'Andhra Pradesh, India', full: 'Guntur, Andhra Pradesh, India' },
  { main: 'Nellore', sub: 'Andhra Pradesh, India', full: 'Nellore, Andhra Pradesh, India' },
  { main: 'Kurnool', sub: 'Andhra Pradesh, India', full: 'Kurnool, Andhra Pradesh, India' },
  { main: 'Rajahmundry', sub: 'Andhra Pradesh, India', full: 'Rajahmundry, Andhra Pradesh, India' },
  { main: 'Kadapa', sub: 'Andhra Pradesh, India', full: 'Kadapa, Andhra Pradesh, India' },
  { main: 'Anantapur', sub: 'Andhra Pradesh, India', full: 'Anantapur, Andhra Pradesh, India' },
  { main: 'Karimnagar', sub: 'Telangana, India', full: 'Karimnagar, Telangana, India' },
  { main: 'Nizamabad', sub: 'Telangana, India', full: 'Nizamabad, Telangana, India' },
  { main: 'Khammam', sub: 'Telangana, India', full: 'Khammam, Telangana, India' },
  { main: 'Lucknow', sub: 'Uttar Pradesh, India', full: 'Lucknow, Uttar Pradesh, India' },
  { main: 'Indore', sub: 'Madhya Pradesh, India', full: 'Indore, Madhya Pradesh, India' },
  { main: 'Bhopal', sub: 'Madhya Pradesh, India', full: 'Bhopal, Madhya Pradesh, India' },
  { main: 'Patna', sub: 'Bihar, India', full: 'Patna, Bihar, India' },
  { main: 'Chandigarh', sub: 'Punjab, India', full: 'Chandigarh, Punjab, India' },
  { main: 'Nagpur', sub: 'Maharashtra, India', full: 'Nagpur, Maharashtra, India' },
  { main: 'Coimbatore', sub: 'Tamil Nadu, India', full: 'Coimbatore, Tamil Nadu, India' },
  { main: 'Madurai', sub: 'Tamil Nadu, India', full: 'Madurai, Tamil Nadu, India' },
  { main: 'Kochi', sub: 'Kerala, India', full: 'Kochi, Kerala, India' },
  { main: 'Thiruvananthapuram', sub: 'Kerala, India', full: 'Thiruvananthapuram, Kerala, India' },
  { main: 'Ujjain', sub: 'Madhya Pradesh, India', full: 'Ujjain, Madhya Pradesh, India' },
  { main: 'Haridwar', sub: 'Uttarakhand, India', full: 'Haridwar, Uttarakhand, India' },
  { main: 'Rishikesh', sub: 'Uttarakhand, India', full: 'Rishikesh, Uttarakhand, India' },
  { main: 'Ayodhya', sub: 'Uttar Pradesh, India', full: 'Ayodhya, Uttar Pradesh, India' },
  { main: 'Mathura', sub: 'Uttar Pradesh, India', full: 'Mathura, Uttar Pradesh, India' },
  { main: 'Puri', sub: 'Odisha, India', full: 'Puri, Odisha, India' },
  { main: 'Bhubaneswar', sub: 'Odisha, India', full: 'Bhubaneswar, Odisha, India' },
  { main: 'London', sub: 'United Kingdom', full: 'London, United Kingdom' },
  { main: 'New York', sub: 'NY, United States', full: 'New York, NY, United States' },
  { main: 'San Francisco', sub: 'CA, United States', full: 'San Francisco, CA, United States' },
  { main: 'Dubai', sub: 'United Arab Emirates', full: 'Dubai, United Arab Emirates' },
  { main: 'Singapore', sub: 'Singapore', full: 'Singapore' },
  { main: 'Toronto', sub: 'Ontario, Canada', full: 'Toronto, Ontario, Canada' },
  { main: 'Sydney', sub: 'NSW, Australia', full: 'Sydney, NSW, Australia' },
];

const POPULAR_VEDIC_CITIES = [
  'New Delhi, India',
  'Varanasi, India',
  'Hyderabad, India',
  'Bengaluru, India',
  'Mumbai, India',
  'Chennai, India',
  'Tirupati, India',
  'Vijayawada, India',
  'Visakhapatnam, India',
  'Pune, India',
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
  placeholder = 'Type city name e.g. Hyderabad, India',
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

  // Only synchronize from outside if the input is not currently actively focused
  useEffect(() => {
    if (!isFocused && value !== query) {
      setQuery(value || '');
    }
  }, [value, isFocused]);

  const searchLocations = (text: string) => {
    setQuery(text);
    onChangeText(text);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    const clean = text.trim().toLowerCase();

    if (!text || clean.length < 1) {
      setPredictions([]);
      setShowDropdown(false);
      setLoading(false);
      return;
    }

    // 1. Instant local match for zero latency
    const localMatches: LocationPrediction[] = COMPREHENSIVE_VEDIC_CITIES
      .filter((c) => c.main.toLowerCase().includes(clean) || c.full.toLowerCase().includes(clean))
      .slice(0, 6)
      .map((c, i) => ({
        placeId: `local-${i}-${c.main}`,
        description: c.full,
        mainText: c.main,
        secondaryText: c.sub,
        source: 'curated',
      }));

    if (localMatches.length > 0) {
      setPredictions(localMatches);
      setShowDropdown(true);
    }

    if (clean.length < 2) return;

    setLoading(true);

    // 2. Fetch live Google Places autocomplete from backend
    debounceTimer.current = setTimeout(async () => {
      try {
        const url = `${BASE_URL}/api/discovery/location-autocomplete?query=${encodeURIComponent(text.trim())}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.predictions) && data.predictions.length > 0) {
            // Merge with local matches avoiding duplicates
            const seen = new Set(data.predictions.map((p: any) => (p.description || '').toLowerCase()));
            const filteredLocal = localMatches.filter(
              (l) => !seen.has(l.description.toLowerCase())
            );
            const combined = [...data.predictions, ...filteredLocal].slice(0, 8);
            setPredictions(combined);
            setShowDropdown(true);
          }
        }
      } catch (err) {
        // Fallback to local curated predictions without breaking
      } finally {
        setLoading(false);
      }
    }, 250);
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
      {/* Label with Google Maps / City badge */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600' }}>
          {label} {required ? <Text style={{ color: colors.goldAccent }}>*</Text> : null}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: withAlpha(colors.goldAccent, 18), paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
          <AppIcon name="place" size={11} color={colors.goldAccent} />
          <Text style={{ fontSize: 10, color: colors.goldAccent, fontWeight: '700', marginLeft: 3 }}>
            City / Location
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
            setTimeout(() => setShowDropdown(false), 250);
            if (query.trim()) {
              onChangeText(query.trim());
            }
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
        ) : query.length > 0 ? (
          <Pressable onPress={clearInput} hitSlop={8} style={{ padding: 4, marginLeft: 4 }}>
            <AppIcon name="close" size={16} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Dropdown Predictions */}
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
            shadowOpacity: 0.15,
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
              paddingVertical: 7,
              backgroundColor: withAlpha(colors.goldAccent, 15),
              borderBottomWidth: 1,
              borderBottomColor: colors.cardBorder,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.goldAccent }}>
              SELECT CITY
            </Text>
            <Pressable
              onPress={() => setShowDropdown(false)}
              hitSlop={8}
              style={{ padding: 2 }}
            >
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
                  {item.source === 'google' ? 'MAPS' : 'CITY'}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {/* Popular Spiritual & Metropolitan Cities Chips */}
      {showPopularChips && !showDropdown && (
        <View style={{ marginTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <AppIcon name="stars" size={12} color={colors.goldAccent} />
            <Text style={{ fontSize: 11, color: colors.textMuted, marginLeft: 4, fontWeight: '600' }}>
              Quick Select Cities:
            </Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {POPULAR_VEDIC_CITIES.map((city) => (
              <Pressable
                key={city}
                onPress={() => handleSelectPopular(city)}
                style={({ pressed }) => ({
                  paddingHorizontal: 9,
                  paddingVertical: 4,
                  borderRadius: 8,
                  backgroundColor: pressed
                    ? withAlpha(colors.goldAccent, 35)
                    : colors.surfaceVariant,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                })}
              >
                <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '600' }}>
                  {city.split(',')[0]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
