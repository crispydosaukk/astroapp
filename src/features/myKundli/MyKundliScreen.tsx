/**
 * Port of lib/presentation/my_kundli_screen/my_kundli_screen.dart
 * - chart: 1200 ms easeOutCubic opacity + scale(0.8→1.0)
 * - North-Indian chart painter → SVG; tap → house via 3×3 grid lookup (centre cell ignored) → house sheet
 * - planet chips → planet sheet; 14 ExpansionTile sections (multi-expand)
 * - Dynamic Light Vedic & Dark Cosmic theme adaptation
 * - Interactive share & download
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { EXPAND_LAYOUT, Expandable } from '@/components/AnimatedBox';
import { AppBar, BoxBackButton } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { ElevatedButton } from '@/components/common';
import { BottomSheet, showSnackBar, useSheet } from '@/components/overlays';
import { lh, Text } from '@/components/Text';
import { AppRoutes, push } from '@/navigation/routes';
import { fetchCalculatedKundli, KundliChartData } from '@/services/astrologyService';
import { withAlpha } from '@/theme/colors';
import { useThemeColors } from '@/theme/themeStore';

type Planet = { name: string; symbol: string; sign: string; house: number; degree: string; color: string };

export const KUNDLI_PLANETS: Planet[] = [
  { name: 'Sun', symbol: '☉', sign: 'Aries', house: 1, degree: "12°34'", color: '#FFB347' },
  { name: 'Moon', symbol: '☽', sign: 'Cancer', house: 4, degree: "8°22'", color: '#E0E0E0' },
  { name: 'Mars', symbol: '♂', sign: 'Scorpio', house: 8, degree: "24°11'", color: '#FF6B6B' },
  { name: 'Mercury', symbol: '☿', sign: 'Taurus', house: 2, degree: "3°45'", color: '#90EE90' },
  { name: 'Jupiter', symbol: '♃', sign: 'Sagittarius', house: 9, degree: "17°58'", color: '#FFD700' },
  { name: 'Venus', symbol: '♀', sign: 'Pisces', house: 12, degree: "29°03'", color: '#FFB6C1' },
  { name: 'Saturn', symbol: '♄', sign: 'Capricorn', house: 10, degree: "6°17'", color: '#9370DB' },
  { name: 'Rahu', symbol: '☊', sign: 'Gemini', house: 3, degree: "14°29'", color: '#708090' },
  { name: 'Ketu', symbol: '☋', sign: 'Sagittarius', house: 9, degree: "14°29'", color: '#CD853F' },
];

const SECTIONS = [
  { title: 'Birth Details', icon: 'person_outline_rounded' },
  { title: 'Lagna / Ascendant', icon: 'star_outline' },
  { title: 'Rashi & Nakshatra', icon: 'nights_stay_outlined' },
  { title: 'Planetary Positions', icon: 'public' },
  { title: 'Houses', icon: 'home_outlined' },
  { title: 'Mahadasha & Antardasha', icon: 'timeline' },
  { title: 'Current Transits', icon: 'swap_horiz' },
  { title: 'Doshas', icon: 'warning_amber_rounded' },
  { title: 'Yogas', icon: 'self_improvement' },
  { title: 'Career', icon: 'work_outline' },
  { title: 'Marriage', icon: 'favorite_border' },
  { title: 'Finance', icon: 'account_balance_outlined' },
  { title: 'Family', icon: 'people_outline' },
  { title: 'Spirituality', icon: 'spa_outlined' },
];

const PLANET_INTERP: Record<string, string> = {
  Sun: 'Sun in Aries in the 1st house is a powerful placement. It gives you a strong, confident personality, natural leadership abilities, and a pioneering spirit.',
  Moon: 'Moon in Cancer in the 4th house is in its own sign — an extremely powerful placement bestowing emotional depth, strong intuition, and a nurturing nature.',
  Mars: 'Mars in Scorpio in the 8th house gives tremendous willpower, strategic depth, and interest in transformative knowledge.',
  Mercury: 'Mercury in Taurus in the 2nd house enhances financial intelligence, eloquence, and practical wisdom.',
  Jupiter: 'Jupiter in Sagittarius in the 9th house is in its own sign — a highly auspicious placement blessing you with dharmic fortune and higher learning.',
  Venus: 'Venus in Pisces in the 12th house is exalted, providing artistic gifts, compassion, and divine spiritual partnerships.',
  Saturn: 'Saturn in Capricorn in the 10th house is in its own sign, indicating enduring career success through discipline, hard work, and persistence.',
  Rahu: 'Rahu in Gemini in the 3rd house amplifies communication skills, technical curiosity, and innovative thinking.',
  Ketu: 'Ketu in Sagittarius in the 9th house indicates past-life spiritual wisdom, detachment from dogma, and a quest for ultimate truth.',
};

const HOUSE_INFO: Record<number, { name: string; rules: string; desc: string }> = {
  1: { name: 'First House (Lagna)', rules: 'Self, Personality, Physical Body', desc: 'The Ascendant house represents your outer personality, vitality, and life direction.' },
  2: { name: 'Second House (Dhana)', rules: 'Wealth, Family, Speech', desc: 'The house of accumulated assets, family values, and early foundation.' },
  3: { name: 'Third House (Sahaja)', rules: 'Siblings, Communication, Courage', desc: 'Governs initiative, short journeys, communication, and personal courage.' },
  4: { name: 'Fourth House (Sukha)', rules: 'Home, Mother, Happiness', desc: 'The house of domestic harmony, mother, property, and inner peace.' },
  9: { name: 'Ninth House (Dharma)', rules: 'Luck, Higher Learning, Spirituality', desc: 'The house of fortune, spiritual teachers, pilgrimage, and divine grace.' },
  10: { name: 'Tenth House (Karma)', rules: 'Career, Status, Authority', desc: 'The house of profession, social stature, and public achievements.' },
  11: { name: 'Eleventh House (Labha)', rules: 'Gains, Social Network, Aspirations', desc: 'The house of profits, income flow, and fulfillment of high ambitions.' },
  12: { name: 'Twelfth House (Vyaya)', rules: 'Liberation, Foreign Lands, Spirituality', desc: 'The house of moksha, meditation, and spiritual elevation.' },
};

const GENERIC: Record<string, string> = {
  Career: "Saturn in 10th house with Jupiter's aspect indicates a successful career path in leadership, technology, or management.",
  Marriage: 'Venus placement indicates a devoted, spiritual partner. Favorable planetary aspects support relationship longevity.',
  Finance: 'Jupiter in 9th house and favorable 2nd lord placement indicate steady financial accumulation through wisdom and ethical enterprise.',
  Family: 'Moon in 4th house brings warm family ties and domestic harmony.',
  Spirituality: 'Ketu in 9th house and Venus in 12th house indicate deep spiritual inclination and divine protection.',
};

/* ------------------------------------------------------------ chart (SVG) */
const CHART = 280;
const T = CHART / 3;
const HOUSE_POS: Record<number, [number, number]> = {
  1: [T * 1.5, T * 0.5], 2: [T * 2.5, T * 0.5], 3: [T * 2.5, T * 1.5], 4: [T * 2.5, T * 2.5],
  9: [T * 1.5, T * 2.5], 10: [T * 0.5, T * 2.5], 11: [T * 0.5, T * 1.5], 12: [T * 0.5, T * 0.5],
};
const HOUSE_MAP: Record<string, number> = { '0,0': 12, '1,0': 1, '2,0': 2, '0,1': 11, '2,1': 3, '0,2': 10, '1,2': 9, '2,2': 4 };

function houseFromPoint(x: number, y: number): number | null {
  const col = Math.min(2, Math.max(0, Math.floor(x / T)));
  const row = Math.min(2, Math.max(0, Math.floor(y / T)));
  if (col === 1 && row === 1) return null;
  return HOUSE_MAP[`${col},${row}`] ?? null;
}

function VedicChart({ planets, selectedHouse, onHouseTap, colors }: { planets: Planet[]; selectedHouse: number | null; onHouseTap: (h: number) => void; colors: any }) {
  const stroke = colors.cardBorder;
  return (
    <Pressable
      testID="myKundli.chart"
      onPressIn={(e) => {
        const h = houseFromPoint(e.nativeEvent.locationX, e.nativeEvent.locationY);
        if (h != null) onHouseTap(h);
      }}
      style={{ width: CHART, height: CHART }}
    >
      <Svg width={CHART} height={CHART} pointerEvents="none">
        <Rect x={0} y={0} width={CHART} height={CHART} fill={colors.surfaceVariant} stroke={stroke} strokeWidth={1.5} />
        {[1, 2].map((i) => (
          <React.Fragment key={i}>
            <Line x1={i * T} y1={0} x2={i * T} y2={CHART} stroke={stroke} strokeWidth={1.5} />
            <Line x1={0} y1={i * T} x2={CHART} y2={i * T} stroke={stroke} strokeWidth={1.5} />
          </React.Fragment>
        ))}
        <Line x1={0} y1={0} x2={T} y2={T} stroke={stroke} strokeWidth={1.5} />
        <Line x1={2 * T} y1={0} x2={T} y2={T} stroke={stroke} strokeWidth={1.5} />
        <Line x1={0} y1={CHART} x2={T} y2={2 * T} stroke={stroke} strokeWidth={1.5} />
        <Line x1={CHART} y1={CHART} x2={2 * T} y2={2 * T} stroke={stroke} strokeWidth={1.5} />
        {Object.entries(HOUSE_POS).map(([h, [x, y]]) => (
          <SvgText key={`h${h}`} x={x} y={y - 8 + 4} fontSize={11} fontWeight="700" textAnchor="middle" fill={selectedHouse === Number(h) ? colors.goldAccent : colors.textMuted}>
            {h}
          </SvgText>
        ))}
        {planets.map((p) => {
          const pos = HOUSE_POS[p.house];
          if (!pos) return null;
          return (
            <SvgText key={p.name} x={pos[0]} y={pos[1] + 6 + 5} fontSize={14} textAnchor="middle" fill={p.color}>
              {p.symbol}
            </SvgText>
          );
        })}
        <SvgText x={T * 1.5} y={T * 0.5 - 18 + 9} fontSize={10} fontWeight="800" textAnchor="middle" fill={colors.goldAccent}>
          Lg
        </SvgText>
      </Svg>
    </Pressable>
  );
}

function InfoChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={{ fontSize: 13 }}>{`${label}: `}</Text>
      <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: withAlpha(color, 25), borderWidth: 1, borderColor: withAlpha(color, 80) }}>
        <Text style={{ color, fontSize: 12, fontWeight: '700' }}>{value}</Text>
      </View>
    </View>
  );
}

function DashaRow({ label, planet, period, isCurrent, colors }: { label: string; planet: string; period: string; isCurrent: boolean; colors: any }) {
  return (
    <View style={{ marginBottom: 8, padding: 12, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: isCurrent ? withAlpha(colors.goldAccent, colors.isLight ? 20 : 30) : colors.surfaceVariant, borderWidth: 1, borderColor: isCurrent ? colors.goldAccent : colors.cardBorder }}>
      <View>
        <Text style={{ color: colors.textMuted, fontSize: 11 }}>{label}</Text>
        <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>{planet}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        {isCurrent ? (
          <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: colors.goldAccent }}>
            <Text style={{ color: '#080D1A', fontSize: 10, fontWeight: '700' }}>Active</Text>
          </View>
        ) : null}
        <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: isCurrent ? 4 : 0 }}>{period}</Text>
      </View>
    </View>
  );
}

function StatusCard({ name, status, desc, borderColor, statusColor, colors }: { name: string; status: string; desc: string; borderColor: string; statusColor: string; colors: any }) {
  return (
    <View style={{ marginBottom: 8, padding: 12, borderRadius: 12, backgroundColor: colors.surfaceVariant, borderWidth: 1, borderColor }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>{name}</Text>
        <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: withAlpha(statusColor, 30) }}>
          <Text style={{ color: statusColor, fontSize: 11, fontWeight: '700' }}>{status}</Text>
        </View>
      </View>
      <Text style={{ marginTop: 6, color: colors.textSecondary, ...lh(12, 1.4) }}>{desc}</Text>
    </View>
  );
}

function SectionContent({ index, chart, colors }: { index: number; chart: KundliChartData | null; colors: any }) {
  switch (index) {
    case 0:
      return (
        <View>
          {[
            ['Name', chart?.name || 'Devotee'],
            ['Date of Birth', chart?.dob || '15 March 1995'],
            ['Time of Birth', chart?.tob || '12:00 PM'],
            ['Birth Place', chart?.pob || 'New Delhi, India'],
            ['Ascendant (Lagna)', chart?.ascendant.sign || 'Scorpio'],
            ['Moon Sign (Rashi)', chart?.moonSign || 'Cancer'],
            ['Nakshatra', `${chart?.nakshatra || 'Punarvasu'} (Pada ${chart?.nakshatraPada || 1})`],
          ].map(([k, v]) => (
            <View key={k} style={{ paddingVertical: 4, flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>{k}</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>{v}</Text>
            </View>
          ))}
        </View>
      );
    case 1:
      return (
        <View>
          <InfoChip label="Lagna" value={`${chart?.ascendant.sign || 'Scorpio'} (${chart?.ascendant.degree || "12°45'"})`} color={colors.goldAccent} />
          <View style={{ height: 8 }} />
          <InfoChip label="Lagna Lord" value={`${chart?.ascendant.lord || 'Mars'} (Governs vitality & life path)`} color="#FF6B6B" />
          <Text style={{ marginTop: 10, color: colors.textSecondary, ...lh(13, 1.5) }}>
            {`${chart?.ascendant.sign || 'Scorpio'} ascendant endows you with deep determination, strategic acumen, and keen intuition. Governed by ${chart?.ascendant.lord || 'Mars'}, you possess transformative resilience.`}
          </Text>
        </View>
      );
    case 2:
      return (
        <View>
          <InfoChip label="Moon Sign (Rashi)" value={`${chart?.moonSign || 'Cancer'}`} color={colors.goldAccent} />
          <View style={{ height: 8 }} />
          <InfoChip label="Nakshatra" value={`${chart?.nakshatra || 'Punarvasu'} (Pada ${chart?.nakshatraPada || 1})`} color="#2D9E6B" />
          <Text style={{ marginTop: 10, color: colors.textSecondary, ...lh(13, 1.5) }}>
            {`Your Moon in ${chart?.moonSign || 'Cancer'} grants profound emotional sensitivity and intuitive wisdom. The ${chart?.nakshatra || 'Punarvasu'} nakshatra inspires continuous renewal, spiritual protection, and enduring fortune.`}
          </Text>
        </View>
      );
    case 3:
      const planetsList = chart?.planets && chart.planets.length > 0 ? chart.planets : KUNDLI_PLANETS;
      return (
        <View>
          {planetsList.map((p) => (
            <View key={p.name} style={{ paddingVertical: 5, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: p.color, fontSize: 16 }}>{p.symbol}</Text>
              <Text style={{ marginLeft: 8, flex: 1, color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>{p.name}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{p.sign}</Text>
              <Text style={{ marginLeft: 8, color: colors.goldAccent, fontSize: 12, fontWeight: '700' }}>{`H${p.house}`}</Text>
              <Text style={{ marginLeft: 8, color: colors.textMuted, fontSize: 11 }}>{p.degree}</Text>
            </View>
          ))}
        </View>
      );
    case 4:
      return (
        <View>
          {[
            ['1st House', 'Self, Vitality & Appearance', chart?.ascendant.sign || 'Scorpio'],
            ['2nd House', 'Wealth, Family & Speech', 'Sagittarius'],
            ['4th House', 'Home, Mother & Happiness', 'Aquarius'],
            ['7th House', 'Marriage, Partnerships & Spousal Bliss', 'Taurus'],
            ['10th House', 'Career, Profession & Social Status', 'Leo'],
          ].map((h) => (
            <View key={h[0]} style={{ paddingVertical: 4, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: withAlpha(colors.goldAccent, 20), alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: colors.goldAccent, fontSize: 10, fontWeight: '700' }}>{h[0].split(' ')[0]}</Text>
              </View>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '600' }}>{h[1]}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>{h[2]}</Text>
              </View>
            </View>
          ))}
        </View>
      );
    case 5:
      return (
        <View>
          <DashaRow label="Current Mahadasha" planet={chart?.dasha.currentMahadasha || 'Jupiter'} period="Active Major Planetary Period" isCurrent colors={colors} />
          <DashaRow label="Current Antardasha" planet={chart?.dasha.currentAntardasha || 'Saturn'} period="Sub-Period Alignment" isCurrent={false} colors={colors} />
          <Text style={{ marginTop: 10, color: colors.textSecondary, ...lh(13, 1.5) }}>
            {`You are currently navigating the ${chart?.dasha.currentMahadasha || 'Jupiter'} Mahadasha and ${chart?.dasha.currentAntardasha || 'Saturn'} Antardasha. This period emphasizes karmic expansion, professional milestones, and spiritual discipline.`}
          </Text>
        </View>
      );
    case 6:
      return (
        <View>
          {[
            ['Saturn', 'Aquarius', 'Transiting 4th House (Kantaka Shani)', 'Discipline in domestic life'],
            ['Jupiter', 'Taurus', 'Aspecting 1st & 9th Houses', 'Spiritual clarity & career expansion'],
            ['Rahu-Ketu', 'Pisces-Virgo', '5th & 11th House Axis', 'Creative innovation & sudden gains'],
          ].map(([pl, sign, house, effect]) => (
            <View key={pl} style={{ marginBottom: 8, padding: 12, borderRadius: 12, backgroundColor: colors.surfaceVariant, borderWidth: 1, borderColor: colors.cardBorder, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>{`${pl} in ${sign}`}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>{house}</Text>
              </View>
              <Text style={{ color: colors.goldAccent, fontSize: 11, fontWeight: '700', textAlign: 'right' }}>{effect}</Text>
            </View>
          ))}
        </View>
      );
    case 7:
      return (
        <View>
          <StatusCard
            name="Mangal Dosha"
            status={chart?.doshas.isManglik ? `Present (${chart.doshas.manglikSeverity})` : 'Not Present'}
            desc={chart?.doshas.isManglik ? 'Mars influence observed in relationship houses. Vedic Parihar remedies pacify energy.' : 'Mars is favorably placed in your chart without adverse dosha affliction.'}
            statusColor={chart?.doshas.isManglik ? '#D4821A' : '#2D9E6B'}
            borderColor={withAlpha(chart?.doshas.isManglik ? '#D4821A' : '#2D9E6B', 80)}
            colors={colors}
          />
          <StatusCard
            name="Kaal Sarp Dosha"
            status={chart?.doshas.kaalSarpPresent ? 'Present' : 'Not Present'}
            desc={chart?.doshas.kaalSarpPresent ? 'Planetary axis enclosed between Rahu and Ketu. Mahamrityunjaya Japa pacifies this configuration.' : 'All planets are free from Rahu-Ketu enclosure; no Kaal Sarp Dosha.'}
            statusColor={chart?.doshas.kaalSarpPresent ? '#D4821A' : '#2D9E6B'}
            borderColor={withAlpha(chart?.doshas.kaalSarpPresent ? '#D4821A' : '#2D9E6B', 80)}
            colors={colors}
          />
          <StatusCard
            name="Shani Sade Sati"
            status={chart?.doshas.sadeSatiStatus ? 'Monitored' : 'Clear'}
            desc={chart?.doshas.sadeSatiStatus || 'Active Saturn transit observed relative to natal Moon.'}
            statusColor={colors.goldAccent}
            borderColor={withAlpha(colors.goldAccent, 80)}
            colors={colors}
          />
        </View>
      );
    case 8:
      const yogasList = chart?.yogas && chart.yogas.length > 0 ? chart.yogas : [
        { name: 'Gaja Kesari Yoga', description: 'Jupiter and Moon in Kendra quadrants bestow wisdom, high reputation, and steady prosperity.', benefic: true },
        { name: 'Budhaditya Yoga', description: 'Sun and Mercury conjunction sharpens intellect, communications, and administrative skills.', benefic: true },
      ];
      return (
        <View>
          {yogasList.map((y) => (
            <StatusCard key={y.name} name={y.name} status={y.benefic ? 'Benefic' : 'Active'} desc={y.description} statusColor={colors.goldAccent} borderColor={colors.cardBorder} colors={colors} />
          ))}
        </View>
      );
    default: {
      const title = SECTIONS[index].title;
      return (
        <Text style={{ color: colors.textSecondary, ...lh(13, 1.5) }}>
          {GENERIC[title] ?? `Detailed analysis for ${title} based on your birth chart. Consult with an astrologer for personalized insights.`}
        </Text>
      );
    }
  }
}

/* -------------------------------------------------------------- sheets */
function SheetHandle({ colors }: { colors: any }) {
  return <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.textMuted }} />;
}

function PlanetDetailSheet({ planet, onClose, colors }: { planet: Planet; onClose: () => void; colors: any }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ padding: 24, backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: colors.cardBorder }}>
      <SheetHandle colors={colors} />
      <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ color: planet.color, fontSize: 32 }}>{planet.symbol}</Text>
        <View style={{ marginLeft: 12 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '700' }}>{planet.name}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{`${planet.sign} • House ${planet.house} • ${planet.degree}`}</Text>
        </View>
      </View>
      <View style={{ marginTop: 16, marginBottom: 12, height: 1, backgroundColor: colors.divider }} />
      <Text style={{ color: colors.textSecondary, ...lh(14, 1.6) }}>
        {PLANET_INTERP[planet.name] ?? "This planet's placement in your chart has significant influence on your life path and personality."}
      </Text>
      <ElevatedButton testID="myKundli.planetSheet.askAi" label="Ask AI About This Planet" onPress={onClose} radius={12} fontWeight="700" fontSize={14} paddingV={10} style={{ marginTop: 20 }} />
      <View style={{ height: insets.bottom + 8 }} />
    </View>
  );
}

function HouseDetailSheet({ house, onClose, colors }: { house: number; onClose: () => void; colors: any }) {
  const insets = useSafeAreaInsets();
  const info = HOUSE_INFO[house] ?? { name: `House ${house}`, rules: 'Various life areas', desc: 'This house governs important areas of your life based on its position in your birth chart.' };
  return (
    <View style={{ padding: 24, backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: colors.cardBorder }}>
      <SheetHandle colors={colors} />
      <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: withAlpha(colors.goldAccent, 25), borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.goldAccent, fontSize: 20, fontWeight: '700' }}>{String(house)}</Text>
        </View>
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>{info.name}</Text>
          <Text style={{ color: colors.goldAccent, fontSize: 12 }}>{info.rules}</Text>
        </View>
      </View>
      <View style={{ marginTop: 16, marginBottom: 12, height: 1, backgroundColor: colors.divider }} />
      <Text style={{ color: colors.textSecondary, ...lh(14, 1.6) }}>{info.desc}</Text>
      <ElevatedButton testID="myKundli.houseSheet.close" label="Close" onPress={onClose} radius={12} fontWeight="600" fontSize={14} paddingV={10} style={{ marginTop: 20 }} />
      <View style={{ height: insets.bottom + 8 }} />
    </View>
  );
}

/* -------------------------------------------------------------- screen */
export default function MyKundliScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [selectedHouse, setSelectedHouse] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0, 1, 2]));
  const [chartData, setChartData] = useState<KundliChartData | null>(null);
  const planetSheet = useSheet<Planet>();
  const houseSheet = useSheet<number>();

  useEffect(() => {
    fetchCalculatedKundli().then((data) => {
      if (data) setChartData(data);
    });
  }, []);

  const chart = useSharedValue(0);
  useEffect(() => { chart.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) }); }, [chart]);
  const chartStyle = useAnimatedStyle(() => ({ opacity: chart.value, transform: [{ scale: 0.8 + 0.2 * chart.value }] }));

  const toggle = (i: number) =>
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i); else n.add(i);
      return n;
    });

  const activePlanets = (chartData?.planets && chartData.planets.length > 0) ? chartData.planets : KUNDLI_PLANETS;

  const handleAskAiAboutKundli = () => {
    push(AppRoutes.aiChatScreen, {
      initialPrompt: `Namaste 🙏 Please analyze my Kundli for ${chartData?.name || 'Devotee'} (Born: ${chartData?.dob || ''} at ${chartData?.tob || ''}, ${chartData?.pob || ''}). My Ascendant is ${chartData?.ascendant.sign || 'Scorpio'}, Moon in ${chartData?.moonSign || 'Cancer'} (${chartData?.nakshatra || 'Punarvasu'}). Active Mahadasha is ${chartData?.dasha.currentMahadasha || 'Jupiter'}. What are my key career & life predictions?`,
    });
  };

  const handleGetDetailedReport = () => {
    push(AppRoutes.kundliReportsScreen);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="myKundli.screen">
      <AppBar
        title="My Kundli"
        backgroundColor={colors.background}
        backColor={colors.textPrimary}
        leading={<BoxBackButton testID="myKundli.back" onPress={() => router.back()} />}
        actions={[
          {
            icon: 'share_outlined',
            color: colors.goldAccent,
            onPress: () => showSnackBar('Kundli chart link copied to clipboard', colors.surfaceVariant),
            testID: 'myKundli.share',
          },
          {
            icon: 'download_outlined',
            color: colors.goldAccent,
            onPress: () => showSnackBar('Vedic birth chart PDF saved to device!', colors.surfaceVariant),
            testID: 'myKundli.download',
          },
        ]}
      />
      <ScrollView>
        {/* profile card */}
        <LinearGradient
          colors={
            colors.isLight
              ? ['#FFF9F0', '#F2E9DE']
              : [withAlpha(colors.goldAccent, 25), colors.surfaceVariant]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            marginHorizontal: 20,
            marginTop: 8,
            marginBottom: 16,
            padding: 20,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: colors.goldAccent, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }}>
            <Text style={{ fontSize: 28 }}>🔮</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 4 }}>
              {chartData?.name || 'Devotee'}
            </Text>
            {[
              ['📅', chartData?.dob || '15 March 1995'],
              ['⏰', chartData?.tob || '12:00 PM'],
              ['📍', chartData?.pob || 'New Delhi, India'],
            ].map(([e, tText]) => (
              <View key={tText} style={{ marginTop: 2, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 11 }}>{e}</Text>
                <Text style={{ marginLeft: 4, color: colors.textSecondary, fontSize: 12 }}>{tText}</Text>
              </View>
            ))}
          </View>
          <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: withAlpha(colors.goldAccent, 25), borderWidth: 1, borderColor: colors.cardBorder }}>
            <Text style={{ color: colors.goldAccent, fontSize: 11, fontWeight: '700' }}>Vedic Verified</Text>
          </View>
        </LinearGradient>

        {/* chart card */}
        <View style={{ marginHorizontal: 20, marginVertical: 8, padding: 16, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>Vedic Birth Chart</Text>
            <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: withAlpha(colors.goldAccent, 25), borderWidth: 1, borderColor: colors.cardBorder }}>
              <Text style={{ color: colors.goldAccent, fontSize: 11, fontWeight: '600' }}>North Indian • Sidereal</Text>
            </View>
          </View>
          <Animated.View style={[{ marginTop: 16, alignItems: 'center' }, chartStyle]}>
            <VedicChart planets={activePlanets} selectedHouse={selectedHouse} onHouseTap={(h) => { setSelectedHouse(h); houseSheet.open(h); }} colors={colors} />
          </Animated.View>
          <Text style={{ marginTop: 16, color: colors.textMuted, fontSize: 11, textAlign: 'center' }}>Tap any house or planet for detailed interpretation</Text>
          <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {activePlanets.map((p) => (
              <Pressable
                key={p.name}
                testID={`myKundli.planet.${p.name.toLowerCase()}`}
                onPress={() => planetSheet.open(p)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 20,
                  backgroundColor: withAlpha(p.color, colors.isLight ? 20 : 30),
                  borderWidth: 1,
                  borderColor: withAlpha(p.color, 80),
                }}
              >
                <Text style={{ color: p.color, fontSize: 13 }}>{p.symbol}</Text>
                <Text style={{ marginLeft: 4, color: colors.textSecondary, fontSize: 11 }}>{p.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* AI card */}
        <LinearGradient
          colors={
            colors.isLight
              ? ['#FFF9F0', '#F2E9DE']
              : [withAlpha(colors.goldAccent, 25), colors.surfaceVariant]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ marginHorizontal: 20, marginVertical: 8, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: colors.cardBorder }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 20 }}>🤖</Text>
            <Text style={{ marginLeft: 8, color: colors.textPrimary, fontSize: 15, fontWeight: '700' }}>Ask AstroParihar AI</Text>
          </View>
          <Text style={{ marginTop: 8, color: colors.textSecondary, fontSize: 13, fontStyle: 'italic' }}>
            {`"How does my ${chartData?.dasha.currentMahadasha || 'Jupiter'} Mahadasha affect my career in 2027?"`}
          </Text>
          <ElevatedButton testID="myKundli.askAi" label="Ask AI About My Kundli" onPress={handleAskAiAboutKundli} radius={12} paddingV={12} fontSize={14} style={{ marginTop: 12 }} />
        </LinearGradient>

        {/* sections */}
        {SECTIONS.map((s, i) => {
          const isExp = expanded.has(i);
          return (
            <Animated.View key={s.title} layout={EXPAND_LAYOUT} style={{ marginHorizontal: 20, marginVertical: 4, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' }}>
              <Pressable testID={`myKundli.section.${i}`} onPress={() => toggle(i)} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, minHeight: 56 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: withAlpha(colors.goldAccent, 20), alignItems: 'center', justifyContent: 'center' }}>
                  <AppIcon name={s.icon} color={colors.goldAccent} size={18} />
                </View>
                <Text style={{ marginLeft: 16, flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>{s.title}</Text>
                <AppIcon name={isExp ? 'keyboard_arrow_up_rounded' : 'keyboard_arrow_down_rounded'} color={colors.textMuted} />
              </Pressable>
              <Expandable expanded={isExp} style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                <SectionContent index={i} chart={chartData} colors={colors} />
              </Expandable>
            </Animated.View>
          );
        })}

        {/* detailed report CTA */}
        <LinearGradient
          colors={
            colors.isLight
              ? ['#FFF9F0', '#F2E9DE']
              : [withAlpha(colors.goldAccent, 25), colors.surfaceVariant]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ marginHorizontal: 20, marginTop: 16, marginBottom: 8, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center' }}
        >
          <Text style={{ fontSize: 32 }}>📜</Text>
          <Text style={{ marginTop: 8, color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>Get Detailed Kundli Report</Text>
          <Text style={{ marginTop: 4, color: colors.textSecondary, fontSize: 13 }}>40+ pages of personalised Vedic analysis & pariharam</Text>
          <ElevatedButton testID="myKundli.detailedReport" label="Get Detailed Report — ₹499" onPress={handleGetDetailedReport} bg={colors.goldAccent} fg="#080D1A" radius={12} paddingV={14} fontSize={14} fontWeight="700" style={{ marginTop: 16, alignSelf: 'stretch' }} />
        </LinearGradient>
        <View style={{ height: Math.max(140, insets.bottom + 80) }} />
      </ScrollView>

      <BottomSheet visible={planetSheet.visible} onClose={planetSheet.close} testID="myKundli.planetSheet">
        {planetSheet.value ? <PlanetDetailSheet planet={planetSheet.value} onClose={planetSheet.close} colors={colors} /> : null}
      </BottomSheet>
      <BottomSheet visible={houseSheet.visible} onClose={houseSheet.close} testID="myKundli.houseSheet">
        {houseSheet.value != null ? <HouseDetailSheet house={houseSheet.value} onClose={houseSheet.close} colors={colors} /> : null}
      </BottomSheet>
    </View>
  );
}
