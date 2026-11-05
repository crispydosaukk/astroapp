import React, { useState } from 'react';
import { DimensionValue, Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Line, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { AppIcon } from '@/components/AppIcon';
import { Text } from '@/components/Text';
import { KundliChartData } from '@/services/astrologyService';
import { withAlpha } from '@/theme/colors';
import { useThemeColors } from '@/theme/themeStore';

export interface VedicKundliChartProps {
  chartData?: KundliChartData | null;
  devoteeName?: string;
  dob?: string;
  tob?: string;
  pob?: string;
  ascendantSign?: string;
  moonSign?: string;
  nakshatra?: string;
  nakshatraPada?: number | string;
  planets?: Array<{
    name: string;
    symbol?: string;
    sign?: string;
    house: number | string;
    degree?: string;
    color?: string;
    retrograde?: boolean;
    status?: string;
    nakshatra?: string;
  }>;
  chartStyle?: 'south-indian' | 'north-indian';
  onChartStyleChange?: (style: 'south-indian' | 'north-indian') => void;
  selectedHouse?: number | null;
  onHouseTap?: (houseNumber: number, signName?: string) => void;
  onPlanetTap?: (planet: any) => void;
  showFormatSwitcher?: boolean;
  showPlanetaryList?: boolean;
  compact?: boolean;
}

export const RASHIS = [
  { signNumber: 1, name: 'Aries', vedicName: 'Mesha', sanskrit: 'मेष', short: 'Ari', lord: 'Mars' },
  { signNumber: 2, name: 'Taurus', vedicName: 'Vrishabha', sanskrit: 'वृषभ', short: 'Tau', lord: 'Venus' },
  { signNumber: 3, name: 'Gemini', vedicName: 'Mithuna', sanskrit: 'मिथुन', short: 'Gem', lord: 'Mercury' },
  { signNumber: 4, name: 'Cancer', vedicName: 'Karka', sanskrit: 'कर्क', short: 'Can', lord: 'Moon' },
  { signNumber: 5, name: 'Leo', vedicName: 'Simha', sanskrit: 'सिंह', short: 'Leo', lord: 'Sun' },
  { signNumber: 6, name: 'Virgo', vedicName: 'Kanya', sanskrit: 'कन्या', short: 'Vir', lord: 'Mercury' },
  { signNumber: 7, name: 'Libra', vedicName: 'Tula', sanskrit: 'तुला', short: 'Lib', lord: 'Venus' },
  { signNumber: 8, name: 'Scorpio', vedicName: 'Vrishchika', sanskrit: 'वृश्चिक', short: 'Sco', lord: 'Mars' },
  { signNumber: 9, name: 'Sagittarius', vedicName: 'Dhanu', sanskrit: 'धनु', short: 'Sag', lord: 'Jupiter' },
  { signNumber: 10, name: 'Capricorn', vedicName: 'Makara', sanskrit: 'मकर', short: 'Cap', lord: 'Saturn' },
  { signNumber: 11, name: 'Aquarius', vedicName: 'Kumbha', sanskrit: 'कुम्भ', short: 'Aqu', lord: 'Saturn' },
  { signNumber: 12, name: 'Pisces', vedicName: 'Meena', sanskrit: 'मीन', short: 'Pis', lord: 'Jupiter' },
];

// 12 Signs in South Indian Clockwise Perimeter Order (Row, Col in 4x4 Grid)
const SOUTH_INDIAN_BOXES = [
  // Row 0
  { row: 0, col: 0, signIdx: 11, signName: 'Pisces', sanskrit: 'मीन', signNumber: 12, short: 'Pis' },
  { row: 0, col: 1, signIdx: 0, signName: 'Aries', sanskrit: 'मेष', signNumber: 1, short: 'Ari' },
  { row: 0, col: 2, signIdx: 1, signName: 'Taurus', sanskrit: 'वृषभ', signNumber: 2, short: 'Tau' },
  { row: 0, col: 3, signIdx: 2, signName: 'Gemini', sanskrit: 'मिथुन', signNumber: 3, short: 'Gem' },
  // Right Column (going down)
  { row: 1, col: 3, signIdx: 3, signName: 'Cancer', sanskrit: 'कर्क', signNumber: 4, short: 'Can' },
  { row: 2, col: 3, signIdx: 4, signName: 'Leo', sanskrit: 'सिंह', signNumber: 5, short: 'Leo' },
  // Row 3 (bottom row, right to left)
  { row: 3, col: 3, signIdx: 5, signName: 'Virgo', sanskrit: 'कन्या', signNumber: 6, short: 'Vir' },
  { row: 3, col: 2, signIdx: 6, signName: 'Libra', sanskrit: 'तुला', signNumber: 7, short: 'Lib' },
  { row: 3, col: 1, signIdx: 7, signName: 'Scorpio', sanskrit: 'वृश्चिक', signNumber: 8, short: 'Sco' },
  { row: 3, col: 0, signIdx: 8, signName: 'Sagittarius', sanskrit: 'धनु', signNumber: 9, short: 'Sag' },
  // Left Column (going up)
  { row: 2, col: 0, signIdx: 9, signName: 'Capricorn', sanskrit: 'मकर', signNumber: 10, short: 'Cap' },
  { row: 1, col: 0, signIdx: 10, signName: 'Aquarius', sanskrit: 'कुम्भ', signNumber: 11, short: 'Aqu' },
];

export const PLANET_BADGE_STYLES: Record<
  string,
  { bg: string; border: string; text: string; symbol: string; sanskrit: string }
> = {
  Sun: { bg: 'rgba(245, 158, 11, 0.22)', border: 'rgba(245, 158, 11, 0.55)', text: '#FCD34D', symbol: '☉', sanskrit: 'Surya' },
  Surya: { bg: 'rgba(245, 158, 11, 0.22)', border: 'rgba(245, 158, 11, 0.55)', text: '#FCD34D', symbol: '☉', sanskrit: 'Surya' },
  Moon: { bg: 'rgba(255, 255, 255, 0.22)', border: 'rgba(255, 255, 255, 0.55)', text: '#FFFFFF', symbol: '☽', sanskrit: 'Chandra' },
  Chandra: { bg: 'rgba(255, 255, 255, 0.22)', border: 'rgba(255, 255, 255, 0.55)', text: '#FFFFFF', symbol: '☽', sanskrit: 'Chandra' },
  Mars: { bg: 'rgba(239, 68, 68, 0.22)', border: 'rgba(239, 68, 68, 0.55)', text: '#FCA5A5', symbol: '♂', sanskrit: 'Mangal' },
  Mangal: { bg: 'rgba(239, 68, 68, 0.22)', border: 'rgba(239, 68, 68, 0.55)', text: '#FCA5A5', symbol: '♂', sanskrit: 'Mangal' },
  Mercury: { bg: 'rgba(16, 185, 129, 0.22)', border: 'rgba(16, 185, 129, 0.55)', text: '#6EE7B7', symbol: '☿', sanskrit: 'Budha' },
  Budh: { bg: 'rgba(16, 185, 129, 0.22)', border: 'rgba(16, 185, 129, 0.55)', text: '#6EE7B7', symbol: '☿', sanskrit: 'Budha' },
  Budha: { bg: 'rgba(16, 185, 129, 0.22)', border: 'rgba(16, 185, 129, 0.55)', text: '#6EE7B7', symbol: '☿', sanskrit: 'Budha' },
  Jupiter: { bg: 'rgba(234, 179, 8, 0.22)', border: 'rgba(234, 179, 8, 0.55)', text: '#FDE047', symbol: '♃', sanskrit: 'Guru' },
  Guru: { bg: 'rgba(234, 179, 8, 0.22)', border: 'rgba(234, 179, 8, 0.55)', text: '#FDE047', symbol: '♃', sanskrit: 'Guru' },
  Brihaspati: { bg: 'rgba(234, 179, 8, 0.22)', border: 'rgba(234, 179, 8, 0.55)', text: '#FDE047', symbol: '♃', sanskrit: 'Guru' },
  Venus: { bg: 'rgba(236, 72, 153, 0.22)', border: 'rgba(236, 72, 153, 0.55)', text: '#F472B6', symbol: '♀', sanskrit: 'Shukra' },
  Shukra: { bg: 'rgba(236, 72, 153, 0.22)', border: 'rgba(236, 72, 153, 0.55)', text: '#F472B6', symbol: '♀', sanskrit: 'Shukra' },
  Saturn: { bg: 'rgba(59, 130, 246, 0.22)', border: 'rgba(59, 130, 246, 0.55)', text: '#93C5FD', symbol: '♄', sanskrit: 'Shani' },
  Shani: { bg: 'rgba(59, 130, 246, 0.22)', border: 'rgba(59, 130, 246, 0.55)', text: '#93C5FD', symbol: '♄', sanskrit: 'Shani' },
  Rahu: { bg: 'rgba(139, 92, 246, 0.22)', border: 'rgba(139, 92, 246, 0.55)', text: '#C4B5FD', symbol: '☊', sanskrit: 'Rahu' },
  Ketu: { bg: 'rgba(99, 102, 241, 0.22)', border: 'rgba(99, 102, 241, 0.55)', text: '#A5B4FC', symbol: '☋', sanskrit: 'Ketu' },
  Asc: { bg: 'rgba(201, 149, 43, 0.3)', border: '#C9952B', text: '#FFD700', symbol: 'ASC', sanskrit: 'Lagna' },
  Lagna: { bg: 'rgba(201, 149, 43, 0.3)', border: '#C9952B', text: '#FFD700', symbol: 'ASC', sanskrit: 'Lagna' },
};

export function getCleanPlanetName(rawName: string): string {
  if (!rawName) return 'Planet';
  const clean = rawName.split('(')[0].trim().split(' ')[0].trim();
  return clean || rawName;
}

export function getCleanPlanetStyle(rawName: string) {
  const clean = getCleanPlanetName(rawName);
  return (
    PLANET_BADGE_STYLES[clean] || {
      bg: 'rgba(201, 149, 43, 0.2)',
      border: 'rgba(201, 149, 43, 0.5)',
      text: '#FFD700',
      symbol: '✦',
      sanskrit: clean,
    }
  );
}

export function getSignIndex(rawSign?: string): number {
  if (!rawSign) return 0;
  const clean = rawSign.toLowerCase();
  const idx = RASHIS.findIndex(
    (r) =>
      clean.includes(r.name.toLowerCase()) ||
      clean.includes(r.sanskrit.toLowerCase()) ||
      clean.includes(r.short.toLowerCase())
  );
  return idx >= 0 ? idx : 0;
}

export function parseHouseNumber(house: any): number {
  if (typeof house === 'number' && !isNaN(house) && house >= 1 && house <= 12) {
    return house;
  }
  if (typeof house === 'string') {
    const m = house.match(/\d+/);
    if (m) {
      const n = parseInt(m[0], 10);
      if (n >= 1 && n <= 12) return n;
    }
  }
  return 1;
}

export function VedicKundliChart({
  chartData,
  devoteeName: propName,
  dob: propDob,
  tob: propTob,
  pob: propPob,
  ascendantSign: propAsc,
  moonSign: propMoon,
  nakshatra: propNak,
  nakshatraPada: propPada,
  planets: propPlanets,
  chartStyle: propStyle,
  onChartStyleChange,
  selectedHouse = null,
  onHouseTap,
  onPlanetTap,
  showFormatSwitcher = true,
  showPlanetaryList = true,
  compact = false,
}: VedicKundliChartProps) {
  const colors = useThemeColors();
  const [internalStyle, setInternalStyle] = useState<'south-indian' | 'north-indian'>('south-indian');
  const currentStyle = propStyle || internalStyle;

  const handleStyleChange = (style: 'south-indian' | 'north-indian') => {
    setInternalStyle(style);
    onChartStyleChange?.(style);
  };

  // 1. Resolve dynamic data from props or chartData fallback
  const devoteeName = propName || chartData?.name || 'Devotee';
  const dob = propDob || chartData?.dob || '1995-10-15';
  const tob = propTob || chartData?.tob || '12:00 PM';
  const pob = propPob || chartData?.pob || 'New Delhi, India';

  const rawAsc = propAsc || chartData?.ascendant?.sign || 'Scorpio';
  const lagnaSignIdx = getSignIndex(rawAsc);
  const ascendantSign = RASHIS[lagnaSignIdx]?.name || 'Scorpio';
  const moonSign = propMoon || chartData?.moonSign || 'Cancer';
  const nakshatra = propNak || chartData?.nakshatra || 'Punarvasu';
  const pada = propPada || chartData?.nakshatraPada || 1;

  // 2. Resolve planet list dynamically
  const activePlanets = (propPlanets && propPlanets.length > 0
    ? propPlanets
    : chartData?.planets && chartData.planets.length > 0
    ? chartData.planets
    : []
  ).map((p) => {
    const cleanName = getCleanPlanetName(p.name);
    const houseNum = parseHouseNumber(p.house);
    const signIdx = p.sign ? getSignIndex(p.sign) : (lagnaSignIdx + houseNum - 1) % 12;
    const signName = RASHIS[signIdx]?.name || 'Aries';
    return {
      ...p,
      cleanName,
      houseNum,
      signIdx,
      signName,
      style: getCleanPlanetStyle(cleanName),
    };
  });

  // Group planets by sign index (0..11) for South Indian Chart
  const planetsBySign: Record<number, typeof activePlanets> = {};
  for (let i = 0; i < 12; i++) {
    planetsBySign[i] = [];
  }
  activePlanets.forEach((p) => {
    if (planetsBySign[p.signIdx]) {
      planetsBySign[p.signIdx].push(p);
    }
  });

  // Group planets by house number (1..12) for North Indian Chart
  const planetsByHouse: Record<number, typeof activePlanets> = {};
  for (let i = 1; i <= 12; i++) {
    planetsByHouse[i] = [];
  }
  activePlanets.forEach((p) => {
    if (planetsByHouse[p.houseNum]) {
      planetsByHouse[p.houseNum].push(p);
    }
  });

  // Screen sizing
  const windowWidth = Dimensions.get('window').width;
  const chartOuterSize = Math.min(windowWidth - (compact ? 24 : 32), 360);
  const gap = 5;
  const cellSize = Math.floor((chartOuterSize - gap * 5) / 4);
  const centerBoxSize = cellSize * 2 + gap;

  return (
    <View style={{ width: '100%', alignItems: 'center' }}>
      {/* Format Switcher: South Indian (Square) vs North Indian (Diamond) */}
      {showFormatSwitcher && (
        <View
          style={{
            flexDirection: 'row',
            marginHorizontal: 16,
            marginBottom: 12,
            padding: 3,
            borderRadius: 14,
            backgroundColor: 'rgba(13, 21, 39, 0.92)',
            borderWidth: 1.2,
            borderColor: 'rgba(201, 149, 43, 0.35)',
            width: chartOuterSize,
          }}
        >
          <Pressable
            onPress={() => handleStyleChange('south-indian')}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 7,
              borderRadius: 11,
              backgroundColor: currentStyle === 'south-indian' ? '#C9952B' : 'transparent',
              borderWidth: currentStyle === 'south-indian' ? 1 : 0,
              borderColor: currentStyle === 'south-indian' ? '#C9952B' : 'transparent',
            }}
          >
            <AppIcon
              name="crop_square"
              size={13}
              color={currentStyle === 'south-indian' ? '#0A0E1A' : '#94A3B8'}
              style={{ marginRight: 5 }}
            />
            <Text
              style={{
                fontSize: 11.5,
                fontWeight: '800',
                color: currentStyle === 'south-indian' ? '#0A0E1A' : '#94A3B8',
              }}
            >
              South Indian (Square)
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleStyleChange('north-indian')}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 7,
              borderRadius: 11,
              backgroundColor: currentStyle === 'north-indian' ? '#C9952B' : 'transparent',
              borderWidth: currentStyle === 'north-indian' ? 1 : 0,
              borderColor: currentStyle === 'north-indian' ? '#C9952B' : 'transparent',
            }}
          >
            <AppIcon
              name="diamond"
              size={13}
              color={currentStyle === 'north-indian' ? '#0A0E1A' : '#94A3B8'}
              style={{ marginRight: 5 }}
            />
            <Text
              style={{
                fontSize: 11.5,
                fontWeight: '800',
                color: currentStyle === 'north-indian' ? '#0A0E1A' : '#94A3B8',
              }}
            >
              North Indian (Diamond)
            </Text>
          </Pressable>
        </View>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* 1. SOUTH INDIAN 4x4 SQUARE CHART (Matching User Reference Image 2) */}
      {/* ---------------------------------------------------------------- */}
      {currentStyle === 'south-indian' ? (
        <View
          style={{
            width: chartOuterSize,
            height: chartOuterSize,
            backgroundColor: '#0A0E1A',
            borderRadius: 22,
            borderWidth: 1.5,
            borderColor: '#C9952B',
            padding: gap,
            position: 'relative',
            shadowColor: '#C9952B',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 10,
            elevation: 5,
          }}
        >
          {/* The 12 Perimeter Sign Cells */}
          {SOUTH_INDIAN_BOXES.map((box) => {
            const isLagnaBox = box.signIdx === lagnaSignIdx;
            const houseNum = ((box.signIdx - lagnaSignIdx + 12) % 12) + 1;
            const isSelected = selectedHouse === houseNum;
            const planetsInSign = planetsBySign[box.signIdx] || [];
            const left = box.col * (cellSize + gap) + gap;
            const top = box.row * (cellSize + gap) + gap;

            return (
              <Pressable
                key={box.signName}
                onPress={() => onHouseTap?.(houseNum, box.signName)}
                style={{
                  position: 'absolute',
                  left,
                  top,
                  width: cellSize,
                  height: cellSize,
                  borderRadius: 12,
                  padding: 4,
                  backgroundColor: isSelected
                    ? 'rgba(201, 149, 43, 0.35)'
                    : isLagnaBox
                    ? 'rgba(201, 149, 43, 0.18)'
                    : 'rgba(255, 255, 255, 0.04)',
                  borderWidth: isSelected ? 2 : 1.2,
                  borderColor: isSelected
                    ? '#FFD700'
                    : isLagnaBox
                    ? '#C9952B'
                    : 'rgba(255, 255, 255, 0.1)',
                  justifyContent: 'space-between',
                }}
              >
                {/* Sign Header & ASC Indicator */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, marginRight: 2 }}>
                    <Text
                      numberOfLines={2}
                      style={{
                        fontSize: 9,
                        fontWeight: '800',
                        color: isSelected ? '#FFD700' : isLagnaBox ? '#FFD700' : '#E2E8F0',
                        lineHeight: 11.5,
                      }}
                    >
                      {box.signName}{' '}
                      <Text style={{ color: isSelected ? '#FDE047' : isLagnaBox ? '#FDE047' : '#94A3B8', fontSize: 8 }}>({box.signNumber})</Text>
                    </Text>
                  </View>
                  {isLagnaBox && (
                    <View
                      style={{
                        paddingHorizontal: 4,
                        paddingVertical: 1,
                        borderRadius: 4,
                        backgroundColor: '#C9952B',
                        marginLeft: 2,
                      }}
                    >
                      <Text style={{ fontSize: 8, fontWeight: '900', color: '#000000' }}>ASC</Text>
                    </View>
                  )}
                </View>

                {/* Planets Badges inside this sign */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginTop: 2, alignContent: 'flex-start' }}>
                  {isLagnaBox && (
                    <View
                      style={{
                        paddingHorizontal: 4,
                        paddingVertical: 1.5,
                        borderRadius: 5,
                        backgroundColor: 'rgba(201, 149, 43, 0.3)',
                        borderWidth: 1,
                        borderColor: '#C9952B',
                      }}
                    >
                      <Text style={{ fontSize: 9, fontWeight: '800', color: '#FFD700' }}>Lagna</Text>
                    </View>
                  )}

                  {planetsInSign.map((p, idx) => (
                    <Pressable
                      key={`${p.cleanName}-${idx}`}
                      onPress={(e) => {
                        e.stopPropagation();
                        onPlanetTap?.(p);
                      }}
                      style={{
                        paddingHorizontal: 4,
                        paddingVertical: 1.5,
                        borderRadius: 5,
                        backgroundColor: p.style.bg,
                        borderWidth: 1,
                        borderColor: p.style.border,
                      }}
                    >
                      <Text style={{ fontSize: 9, fontWeight: '800', color: p.style.text }}>
                        {p.cleanName}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Pressable>
            );
          })}

          {/* Center 2x2 Chamber (Devotee Vedic Info) */}
          <View
            style={{
              position: 'absolute',
              left: 1 * (cellSize + gap) + gap,
              top: 1 * (cellSize + gap) + gap,
              width: centerBoxSize,
              height: centerBoxSize,
              borderRadius: 16,
              backgroundColor: 'rgba(13, 21, 39, 0.96)',
              borderWidth: 1.5,
              borderColor: 'rgba(201, 149, 43, 0.45)',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 6,
              paddingVertical: 4,
              shadowColor: '#C9952B',
              shadowOpacity: 0.15,
              shadowRadius: 6,
            }}
          >
            {/* Sacred ॐ Emblem */}
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: 'rgba(201, 149, 43, 0.22)',
                borderWidth: 1,
                borderColor: '#C9952B',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 3,
              }}
            >
              <Text style={{ color: '#FFD700', fontSize: 13, fontWeight: '800' }}>ॐ</Text>
            </View>

            {/* Devotee Name */}
            <Text
              numberOfLines={1}
              style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800', textAlign: 'center', letterSpacing: 0.2 }}
            >
              {devoteeName}
            </Text>

            {/* D1 Rashi Chakra Subtitle */}
            <Text style={{ color: '#FFD700', fontSize: 10.5, fontWeight: '700', marginTop: 1 }}>
              D1 Rashi Chakra
            </Text>

            {/* DOB & TOB */}
            <Text numberOfLines={1} style={{ color: '#E2E8F0', fontSize: 9.5, fontWeight: '600', marginTop: 3 }}>
              {dob} {tob ? `• ${tob}` : ''}
            </Text>

            {/* POB */}
            <Text numberOfLines={1} style={{ color: '#94A3B8', fontSize: 9, marginTop: 1, textAlign: 'center' }}>
              {pob}
            </Text>

            {/* Lagna & Moon Sign Badges */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4, marginTop: 4 }}>
              <View
                style={{
                  paddingHorizontal: 6,
                  paddingVertical: 1.5,
                  borderRadius: 8,
                  backgroundColor: 'rgba(201, 149, 43, 0.25)',
                  borderWidth: 1,
                  borderColor: '#C9952B',
                }}
              >
                <Text style={{ color: '#FFD700', fontSize: 9, fontWeight: '800' }}>
                  {ascendantSign} {RASHIS[lagnaSignIdx]?.vedicName ? `(${RASHIS[lagnaSignIdx].vedicName})` : ''}
                </Text>
              </View>

              <View
                style={{
                  paddingHorizontal: 6,
                  paddingVertical: 1.5,
                  borderRadius: 8,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.25)',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '700' }}>
                  Moon: {moonSign}
                </Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        /* ---------------------------------------------------------------- */
        /* 2. NORTH INDIAN DIAMOND CHART (Traditional Sacred Geometry)       */
        /* ---------------------------------------------------------------- */
        <View
          style={{
            width: chartOuterSize,
            height: chartOuterSize,
            backgroundColor: '#0A0E1A',
            borderRadius: 22,
            borderWidth: 1.5,
            borderColor: '#C9952B',
            alignSelf: 'center',
            position: 'relative',
            overflow: 'hidden',
            shadowColor: '#C9952B',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 10,
            elevation: 5,
          }}
        >
          {/* Sacred SVG Lines */}
          <Svg width={chartOuterSize} height={chartOuterSize} style={StyleSheet.absoluteFillObject}>
            <Rect x={1} y={1} width={chartOuterSize - 2} height={chartOuterSize - 2} stroke="#C9952B" strokeWidth={1.5} fill="none" rx={22} />
            <Line x1={0} y1={0} x2={chartOuterSize} y2={chartOuterSize} stroke="#C9952B" strokeWidth={1.2} />
            <Line x1={0} y1={chartOuterSize} x2={chartOuterSize} y2={0} stroke="#C9952B" strokeWidth={1.2} />
            <Polygon
              points={`${chartOuterSize / 2},0 ${chartOuterSize},${chartOuterSize / 2} ${chartOuterSize / 2},${chartOuterSize} 0,${chartOuterSize / 2}`}
              stroke="#C9952B"
              strokeWidth={1.5}
              fill="rgba(201, 149, 43, 0.04)"
            />
          </Svg>

          {/* 12 North Indian House Coordinates & Dynamic Overlays */}
          {([
            { houseNum: 1, top: '20%', left: '50%', signIdx: lagnaSignIdx },
            { houseNum: 2, top: '9%', left: '26%', signIdx: (lagnaSignIdx + 1) % 12 },
            { houseNum: 3, top: '26%', left: '10%', signIdx: (lagnaSignIdx + 2) % 12 },
            { houseNum: 4, top: '50%', left: '20%', signIdx: (lagnaSignIdx + 3) % 12 },
            { houseNum: 5, top: '74%', left: '10%', signIdx: (lagnaSignIdx + 4) % 12 },
            { houseNum: 6, top: '91%', left: '26%', signIdx: (lagnaSignIdx + 5) % 12 },
            { houseNum: 7, top: '80%', left: '50%', signIdx: (lagnaSignIdx + 6) % 12 },
            { houseNum: 8, top: '91%', left: '74%', signIdx: (lagnaSignIdx + 7) % 12 },
            { houseNum: 9, top: '74%', left: '90%', signIdx: (lagnaSignIdx + 8) % 12 },
            { houseNum: 10, top: '50%', left: '80%', signIdx: (lagnaSignIdx + 9) % 12 },
            { houseNum: 11, top: '26%', left: '90%', signIdx: (lagnaSignIdx + 10) % 12 },
            { houseNum: 12, top: '9%', left: '74%', signIdx: (lagnaSignIdx + 11) % 12 },
          ] as Array<{ houseNum: number; top: DimensionValue; left: DimensionValue; signIdx: number }>).map(({ houseNum, top, left, signIdx }) => {
            const planetsInHouse = planetsByHouse[houseNum] || [];
            const signNumber = RASHIS[signIdx]?.signNumber || 1;
            const isSelected = selectedHouse === houseNum;

            return (
              <Pressable
                key={`nih_${houseNum}`}
                onPress={() => onHouseTap?.(houseNum, RASHIS[signIdx]?.name)}
                style={{
                  position: 'absolute',
                  top,
                  left,
                  transform: [{ translateX: -35 }, { translateY: -22 }],
                  width: 70,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 2,
                  borderRadius: 8,
                  backgroundColor: isSelected ? 'rgba(201, 149, 43, 0.35)' : 'transparent',
                  borderWidth: isSelected ? 1.5 : 0,
                  borderColor: isSelected ? '#FFD700' : 'transparent',
                }}
              >
                {/* Sign Number & House Indicator */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: isSelected ? '#FFD700' : '#FFD700' }}>
                    {signNumber}
                  </Text>
                  <Text style={{ fontSize: 7.5, fontWeight: '700', color: isSelected ? '#FFD700' : '#94A3B8' }}>
                    H{houseNum}
                  </Text>
                  {houseNum === 1 && (
                    <View style={{ paddingHorizontal: 3, paddingVertical: 0.5, borderRadius: 3, backgroundColor: '#C9952B' }}>
                      <Text style={{ fontSize: 6.5, fontWeight: '900', color: '#000000' }}>ASC</Text>
                    </View>
                  )}
                </View>

                {/* Planets Chips */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 2, marginTop: 1 }}>
                  {planetsInHouse.map((p, idx) => (
                    <Pressable
                      key={`${p.cleanName}-${idx}`}
                      onPress={(e) => {
                        e.stopPropagation();
                        onPlanetTap?.(p);
                      }}
                      style={{
                        paddingHorizontal: 3,
                        paddingVertical: 1,
                        borderRadius: 4,
                        backgroundColor: p.style.bg,
                        borderWidth: 0.8,
                        borderColor: p.style.border,
                      }}
                    >
                      <Text style={{ fontSize: 8, fontWeight: '800', color: p.style.text }}>
                        {p.cleanName.substring(0, 2)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* 3. PLANETARY POSITIONS (GRAHA STHITI) - HIGH CONTRAST & READABLE   */}
      {/* ---------------------------------------------------------------- */}
      {showPlanetaryList && activePlanets.length > 0 && (
        <View style={{ width: chartOuterSize, marginTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AppIcon name="stars" size={13} color="#FFD700" style={{ marginRight: 5 }} />
              <Text style={{ color: '#FFD700', fontSize: 11.5, fontWeight: '800', letterSpacing: 0.4 }}>
                PLANETARY POSITIONS (GRAHA STHITI)
              </Text>
            </View>
            <Text style={{ color: '#94A3B8', fontSize: 10, fontWeight: '600' }}>
              {activePlanets.length} Celestial Bodies
            </Text>
          </View>

          {/* Grid of Clean High-Contrast Cards */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {activePlanets.map((p, idx) => (
              <Pressable
                key={`${p.cleanName}-${idx}`}
                onPress={() => {
                  onPlanetTap?.(p);
                  onHouseTap?.(p.houseNum, p.signName);
                }}
                style={{
                  width: (chartOuterSize - 6) / 2,
                  paddingHorizontal: 10,
                  paddingVertical: 7,
                  borderRadius: 12,
                  backgroundColor: 'rgba(19, 29, 49, 0.95)',
                  borderWidth: 1,
                  borderColor: selectedHouse === p.houseNum ? '#FFD700' : 'rgba(201, 149, 43, 0.35)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 4 }}>
                  {/* Planet Pill Symbol */}
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: p.style.bg,
                      borderWidth: 1,
                      borderColor: p.style.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 6,
                    }}
                  >
                    <Text style={{ color: p.style.text, fontSize: 11, fontWeight: '900' }}>
                      {p.style.symbol}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ color: '#FFFFFF', fontSize: 11.5, fontWeight: '800' }}>
                      {p.cleanName}
                      {p.retrograde ? <Text style={{ color: '#EF4444', fontSize: 9.5 }}> (R)</Text> : null}
                    </Text>
                    <Text numberOfLines={1} style={{ color: '#CBD5E1', fontSize: 9.5, fontWeight: '600', marginTop: 1 }}>
                      H{p.houseNum} • {p.signName}
                    </Text>
                  </View>
                </View>

                {p.degree && (
                  <View
                    style={{
                      paddingHorizontal: 5,
                      paddingVertical: 2,
                      borderRadius: 6,
                      backgroundColor: 'rgba(201, 149, 43, 0.15)',
                      borderWidth: 0.8,
                      borderColor: 'rgba(201, 149, 43, 0.3)',
                    }}
                  >
                    <Text style={{ color: '#FFD700', fontSize: 9, fontWeight: '700' }}>
                      {p.degree.split(' ')[0]}
                    </Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
