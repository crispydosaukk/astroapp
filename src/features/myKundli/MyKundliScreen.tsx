/**
 * Port of lib/presentation/my_kundli_screen/my_kundli_screen.dart
 * - chart: 1200 ms easeOutCubic opacity + scale(0.8→1.0)
 * - North-Indian chart painter → SVG; tap → house via 3×3 grid lookup (centre cell ignored) → house sheet
 * - planet chips → planet sheet; 14 ExpansionTile sections (multi-expand)
 * SOURCE_INERT: share, download, Edit, "Ask AI About My Kundli", "Get Detailed Report — ₹499".
 * Planet/House sheet primary buttons just close the sheet (Navigator.pop) — same as source.
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
import { BottomSheet, useSheet } from '@/components/overlays';
import { lh, Text } from '@/components/Text';
import { AppColors, withAlpha } from '@/theme/colors';
import { SOURCE_INERT } from '@/utils/sourceInert';

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
  Sun: 'Sun in Aries in the 1st house is a powerful placement. It gives you a strong, confident personality, natural leadership abilities, and a pioneering spirit. Your identity is closely tied to your sense of self-expression and individuality.',
  Moon: 'Moon in Cancer in the 4th house is in its own sign — an extremely powerful placement. It bestows emotional depth, strong intuition, a nurturing nature, and deep connection to home and family.',
  Mars: 'Mars in Scorpio in the 8th house is in its own sign. This placement gives tremendous willpower, investigative abilities, and interest in occult sciences. Transformation through challenges is a key theme.',
  Mercury: 'Mercury in Taurus in the 2nd house enhances financial intelligence and communication skills. You have a practical, methodical mind and may excel in finance, banking, or communication fields.',
  Jupiter: 'Jupiter in Sagittarius in the 9th house is in its own sign — a highly auspicious placement. It blesses you with wisdom, higher learning, spiritual inclination, and good fortune through dharmic living.',
  Venus: 'Venus in Pisces in the 12th house is exalted. This gives artistic talents, spiritual love, and a compassionate nature. Foreign connections and spiritual partnerships are indicated.',
  Saturn: 'Saturn in Capricorn in the 10th house is in its own sign. This is a powerful career placement indicating success through discipline, hard work, and perseverance. Authority and recognition come with time.',
  Rahu: 'Rahu in Gemini in the 3rd house amplifies communication skills, curiosity, and desire for knowledge. It can bring unconventional thinking and success through media, writing, or technology.',
  Ketu: 'Ketu in Sagittarius in the 9th house indicates past-life spiritual wisdom. It brings detachment from dogma and a quest for deeper spiritual truth beyond conventional religion.',
};

const HOUSE_INFO: Record<number, { name: string; rules: string; desc: string }> = {
  1: { name: 'First House (Lagna)', rules: 'Self, Personality, Physical Body', desc: 'The Ascendant house represents your outer personality, physical appearance, and how you present yourself to the world. It is the most important house in Vedic astrology.' },
  2: { name: 'Second House (Dhana)', rules: 'Wealth, Family, Speech', desc: 'The house of accumulated wealth, family values, speech, and early childhood. Mercury here enhances financial intelligence and communication abilities.' },
  3: { name: 'Third House (Sahaja)', rules: 'Siblings, Communication, Courage', desc: 'Governs siblings, short journeys, communication, and personal courage. Rahu here amplifies curiosity and unconventional communication styles.' },
  4: { name: 'Fourth House (Sukha)', rules: 'Home, Mother, Happiness', desc: 'The house of domestic happiness, mother, property, and emotional security. Moon here in Cancer is extremely powerful and auspicious.' },
  9: { name: 'Ninth House (Dharma)', rules: 'Luck, Higher Learning, Spirituality', desc: 'The most auspicious house governing fortune, dharma, higher education, and spiritual wisdom. Jupiter here in its own sign is highly beneficial.' },
  10: { name: 'Tenth House (Karma)', rules: 'Career, Status, Authority', desc: 'The house of career, public reputation, and life purpose. Saturn here in Capricorn indicates a disciplined, authoritative career path.' },
  11: { name: 'Eleventh House (Labha)', rules: 'Gains, Social Network, Aspirations', desc: 'The house of gains, income, social connections, and fulfillment of desires. Favorable planets here bring financial prosperity.' },
  12: { name: 'Twelfth House (Vyaya)', rules: 'Liberation, Foreign Lands, Spirituality', desc: 'The house of moksha, foreign connections, and hidden matters. Venus exalted here brings spiritual love and artistic gifts.' },
};

const GENERIC: Record<string, string> = {
  Career: "Saturn in 10th house with Jupiter's aspect indicates a successful career in management, law, or administration. The current Saturn Mahadasha supports career growth through disciplined effort.",
  Marriage: 'Venus in 12th house and 7th lord Venus suggests a spiritual and devoted partner. Marriage is indicated after age 28. Current period is favorable for relationship commitments.',
  Finance: 'Jupiter in 2nd house from Moon and 9th house placement indicates good financial prospects. Wealth accumulates through knowledge, teaching, or advisory roles.',
  Family: "Moon in 4th house brings strong family bonds and a nurturing home environment. Mother's influence is significant. Property gains are indicated in the current period.",
  Spirituality: 'Ketu in 9th house and Venus in 12th house indicate a deep spiritual inclination. Pilgrimage, meditation, and spiritual practices will bring peace and transformation.',
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

function VedicChart({ planets, selectedHouse, onHouseTap }: { planets: Planet[]; selectedHouse: number | null; onHouseTap: (h: number) => void }) {
  const stroke = AppColors.goldBorder;
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
        <Rect x={0} y={0} width={CHART} height={CHART} fill={AppColors.surfaceVariantDark} stroke={stroke} strokeWidth={1.5} />
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
          <SvgText key={`h${h}`} x={x} y={y - 8 + 4} fontSize={11} fontWeight="600" textAnchor="middle" fill={selectedHouse === Number(h) ? AppColors.goldAccent : AppColors.textMuted}>
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
        <SvgText x={T * 1.5} y={T * 0.5 - 18 + 9} fontSize={10} fontWeight="700" textAnchor="middle" fill={AppColors.goldAccent}>
          Lg
        </SvgText>
      </Svg>
    </Pressable>
  );
}

/* ----------------------------------------------------------- section body */
function InfoChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={{ color: AppColors.textMuted, fontSize: 13 }}>{`${label}: `}</Text>
      <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: withAlpha(color, 30), borderWidth: 1, borderColor: withAlpha(color, 80) }}>
        <Text style={{ color, fontSize: 12, fontWeight: '600' }}>{value}</Text>
      </View>
    </View>
  );
}
const Para = ({ children }: { children: string }) => <Text style={{ marginTop: 12, color: AppColors.textSecondary, ...lh(13, 1.5) }}>{children}</Text>;

function DashaRow({ label, planet, period, isCurrent }: { label: string; planet: string; period: string; isCurrent: boolean }) {
  return (
    <View style={{ marginBottom: 8, padding: 12, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: isCurrent ? withAlpha(AppColors.primary, 30) : AppColors.surfaceVariantDark, borderWidth: 1, borderColor: isCurrent ? withAlpha(AppColors.primary, 80) : AppColors.goldBorder }}>
      <View>
        <Text style={{ color: AppColors.textMuted, fontSize: 11 }}>{label}</Text>
        <Text style={{ color: AppColors.textPrimary, fontSize: 14, fontWeight: '700' }}>{planet}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        {isCurrent ? (
          <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: AppColors.primary }}>
            <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }}>Active</Text>
          </View>
        ) : null}
        <Text style={{ color: AppColors.textSecondary, fontSize: 11 }}>{period}</Text>
      </View>
    </View>
  );
}

function StatusCard({ name, status, desc, borderColor, statusColor, nameColor = AppColors.textPrimary }: { name: string; status: string; desc: string; borderColor: string; statusColor: string; nameColor?: string }) {
  return (
    <View style={{ marginBottom: 8, padding: 12, borderRadius: 12, backgroundColor: AppColors.surfaceVariantDark, borderWidth: 1, borderColor }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: nameColor, fontSize: 13, fontWeight: '600' }}>{name}</Text>
        <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: withAlpha(statusColor, 30) }}>
          <Text style={{ color: statusColor, fontSize: 11, fontWeight: '600' }}>{status}</Text>
        </View>
      </View>
      <Text style={{ marginTop: 6, color: AppColors.textSecondary, ...lh(12, 1.4) }}>{desc}</Text>
    </View>
  );
}

function SectionContent({ index }: { index: number }) {
  switch (index) {
    case 0:
      return (
        <View>
          {[
            ['Name', 'Priya Sharma'], ['Date of Birth', '15 March 1992'], ['Time of Birth', '10:30 AM IST'], ['Birth Place', 'New Delhi, India'],
            ['Latitude', '28.6139° N'], ['Longitude', '77.2090° E'], ['Timezone', 'IST (UTC+5:30)'],
          ].map(([k, v]) => (
            <View key={k} style={{ paddingVertical: 4, flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: AppColors.textMuted, fontSize: 13 }}>{k}</Text>
              <Text style={{ color: AppColors.textPrimary, fontSize: 13, fontWeight: '600' }}>{v}</Text>
            </View>
          ))}
        </View>
      );
    case 1:
      return (
        <View>
          <InfoChip label="Lagna" value="Aries (Mesha)" color={AppColors.goldAccent} />
          <View style={{ height: 8 }} />
          <InfoChip label="Lagna Lord" value="Mars in 8th House" color="#FF6B6B" />
          <Para>Aries ascendant gives you a dynamic, pioneering spirit. You are naturally courageous, independent, and action-oriented. Mars as your lagna lord in the 8th house brings transformative experiences and deep occult interests.</Para>
        </View>
      );
    case 2:
      return (
        <View>
          <InfoChip label="Moon Sign (Rashi)" value="Cancer (Karka)" color="#E0E0E0" />
          <View style={{ height: 8 }} />
          <InfoChip label="Nakshatra" value="Pushya (3rd Pada)" color="#90EE90" />
          <View style={{ height: 8 }} />
          <InfoChip label="Nakshatra Lord" value="Saturn" color="#9370DB" />
          <Para>Cancer Moon makes you emotionally intuitive and nurturing. Pushya nakshatra, ruled by Saturn, bestows discipline, wisdom, and a deep connection to family and tradition.</Para>
        </View>
      );
    case 3:
      return (
        <View>
          {KUNDLI_PLANETS.map((p) => (
            <View key={p.name} style={{ paddingVertical: 5, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: p.color, fontSize: 16 }}>{p.symbol}</Text>
              <Text style={{ marginLeft: 8, flex: 1, color: AppColors.textPrimary, fontSize: 13, fontWeight: '600' }}>{p.name}</Text>
              <Text style={{ color: AppColors.textSecondary, fontSize: 12 }}>{p.sign}</Text>
              <Text style={{ marginLeft: 8, color: AppColors.goldAccent, fontSize: 12, fontWeight: '600' }}>{`H${p.house}`}</Text>
              <Text style={{ marginLeft: 8, color: AppColors.textMuted, fontSize: 11 }}>{p.degree}</Text>
            </View>
          ))}
        </View>
      );
    case 4:
      return (
        <View>
          {[
            ['1st House', 'Self, Personality', 'Aries'], ['2nd House', 'Wealth, Family', 'Taurus'], ['4th House', 'Home, Mother', 'Cancer'],
            ['7th House', 'Marriage, Partners', 'Libra'], ['10th House', 'Career, Status', 'Capricorn'],
          ].map((h) => (
            <View key={h[0]} style={{ paddingVertical: 4, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: withAlpha(AppColors.goldAccent, 20), alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: AppColors.goldAccent, fontSize: 10, fontWeight: '700' }}>{h[0].split(' ')[0]}</Text>
              </View>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={{ color: AppColors.textPrimary, fontSize: 12, fontWeight: '600' }}>{h[1]}</Text>
                <Text style={{ color: AppColors.textMuted, fontSize: 11 }}>{h[2]}</Text>
              </View>
            </View>
          ))}
        </View>
      );
    case 5:
      return (
        <View>
          <DashaRow label="Current Mahadasha" planet="Saturn" period="2019 – 2038" isCurrent />
          <DashaRow label="Current Antardasha" planet="Mercury" period="Jan 2024 – Jun 2026" isCurrent={false} />
          <DashaRow label="Next Antardasha" planet="Ketu" period="Jun 2026 – Jul 2027" isCurrent={false} />
          <Para>Saturn Mahadasha is a period of discipline, hard work, and karmic lessons. This 19-year period tests your patience and rewards sincere effort. Mercury sub-period brings intellectual growth and communication opportunities.</Para>
        </View>
      );
    case 6:
      return (
        <View>
          {[
            ['Saturn', 'Aquarius', 'Transiting 11th House', 'Gains & Social Network'],
            ['Jupiter', 'Taurus', 'Transiting 2nd House', 'Wealth & Family Blessings'],
            ['Rahu', 'Pisces', 'Transiting 12th House', 'Spiritual Transformation'],
          ].map(([pl, sign, house, effect]) => (
            <View key={pl} style={{ marginBottom: 8, padding: 12, borderRadius: 12, backgroundColor: AppColors.surfaceVariantDark, borderWidth: 1, borderColor: AppColors.goldBorder, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: AppColors.textPrimary, fontSize: 13, fontWeight: '600' }}>{`${pl} in ${sign}`}</Text>
                <Text style={{ color: AppColors.textMuted, fontSize: 11 }}>{house}</Text>
              </View>
              <Text style={{ color: AppColors.goldAccent, fontSize: 11, fontWeight: '600', textAlign: 'right' }}>{effect}</Text>
            </View>
          ))}
        </View>
      );
    case 7:
      return (
        <View>
          {([
            ['Mangal Dosha', 'Mild', 'Mars in 8th house creates mild Mangal Dosha. Suitable remedies recommended.', false],
            ['Kaal Sarp Dosha', 'Not Present', 'All planets are not between Rahu and Ketu. No Kaal Sarp Dosha.', true],
            ['Pitra Dosha', 'Mild', 'Sun-Rahu conjunction in natal chart suggests mild ancestral karma.', false],
          ] as const).map(([n, s, d, good]) => (
            <StatusCard key={n} name={n} status={s} desc={d} statusColor={good ? AppColors.success : AppColors.warning} borderColor={withAlpha(good ? AppColors.success : AppColors.warning, 80)} />
          ))}
        </View>
      );
    case 8:
      return (
        <View>
          {[
            ['Gaja Kesari Yoga', 'Powerful', 'Jupiter in Kendra from Moon. Brings wisdom, fame, and prosperity.'],
            ['Budhaditya Yoga', 'Present', 'Sun and Mercury conjunction. Enhances intelligence and communication.'],
            ['Chandra Mangal Yoga', 'Present', 'Moon and Mars combination. Brings financial acumen and courage.'],
          ].map(([n, s, d]) => (
            <StatusCard key={n} name={n} status={s} desc={d} statusColor={AppColors.goldAccent} borderColor={AppColors.goldBorder} nameColor={AppColors.goldAccent} />
          ))}
        </View>
      );
    default: {
      const title = SECTIONS[index].title;
      return (
        <Text style={{ color: AppColors.textSecondary, ...lh(13, 1.5) }}>
          {GENERIC[title] ?? `Detailed analysis for ${title} based on your birth chart. Consult with an astrologer for personalized insights.`}
        </Text>
      );
    }
  }
}

/* -------------------------------------------------------------- sheets */
function SheetHandle() {
  return <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: AppColors.textMuted }} />;
}

function PlanetDetailSheet({ planet, onClose }: { planet: Planet; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ padding: 24, backgroundColor: AppColors.surfaceDark, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
      <SheetHandle />
      <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ color: planet.color, fontSize: 32 }}>{planet.symbol}</Text>
        <View style={{ marginLeft: 12 }}>
          <Text style={{ color: AppColors.textPrimary, fontSize: 20, fontWeight: '700' }}>{planet.name}</Text>
          <Text style={{ color: AppColors.textSecondary, fontSize: 13 }}>{`${planet.sign} • House ${planet.house} • ${planet.degree}`}</Text>
        </View>
      </View>
      <View style={{ marginTop: 16, marginBottom: 12, height: 1, backgroundColor: AppColors.goldBorder }} />
      <Text style={{ color: AppColors.textSecondary, ...lh(14, 1.6) }}>
        {PLANET_INTERP[planet.name] ?? "This planet's placement in your chart has significant influence on your life path and personality."}
      </Text>
      <ElevatedButton testID="myKundli.planetSheet.askAi" label="Ask AI About This Planet" onPress={onClose} radius={12} fontWeight="500" fontSize={14} paddingV={10} style={{ marginTop: 20 }} />
      <View style={{ height: insets.bottom + 8 }} />
    </View>
  );
}

function HouseDetailSheet({ house, onClose }: { house: number; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const info = HOUSE_INFO[house] ?? { name: `House ${house}`, rules: 'Various life areas', desc: 'This house governs important areas of your life based on its position in your birth chart.' };
  return (
    <View style={{ padding: 24, backgroundColor: AppColors.surfaceDark, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
      <SheetHandle />
      <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: withAlpha(AppColors.goldAccent, 30), borderWidth: 1, borderColor: AppColors.goldBorder, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: AppColors.goldAccent, fontSize: 20, fontWeight: '700' }}>{String(house)}</Text>
        </View>
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={{ color: AppColors.textPrimary, fontSize: 16, fontWeight: '700' }}>{info.name}</Text>
          <Text style={{ color: AppColors.goldAccent, fontSize: 12 }}>{info.rules}</Text>
        </View>
      </View>
      <View style={{ marginTop: 16, marginBottom: 12, height: 1, backgroundColor: AppColors.goldBorder }} />
      <Text style={{ color: AppColors.textSecondary, ...lh(14, 1.6) }}>{info.desc}</Text>
      <ElevatedButton testID="myKundli.houseSheet.close" label="Close" onPress={onClose} radius={12} fontWeight="500" fontSize={14} paddingV={10} style={{ marginTop: 20 }} />
      <View style={{ height: insets.bottom + 8 }} />
    </View>
  );
}

/* -------------------------------------------------------------- screen */
export default function MyKundliScreen() {
  const [selectedHouse, setSelectedHouse] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const planetSheet = useSheet<Planet>();
  const houseSheet = useSheet<number>();

  const chart = useSharedValue(0);
  useEffect(() => { chart.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) }); }, [chart]);
  const chartStyle = useAnimatedStyle(() => ({ opacity: chart.value, transform: [{ scale: 0.8 + 0.2 * chart.value }] }));

  const toggle = (i: number) =>
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i); else n.add(i);
      return n;
    });

  return (
    <View style={{ flex: 1, backgroundColor: AppColors.backgroundDark }} testID="myKundli.screen">
      <AppBar
        title="My Kundli"
        leading={<BoxBackButton testID="myKundli.back" onPress={() => router.back()} />}
        actions={[
          { icon: 'share_outlined', color: AppColors.goldAccent, onPress: SOURCE_INERT('myKundli.share'), testID: 'myKundli.share' },
          { icon: 'download_outlined', color: AppColors.goldAccent, onPress: SOURCE_INERT('myKundli.download'), testID: 'myKundli.download' },
        ]}
      />
      <ScrollView>
        {/* profile card */}
        <LinearGradient colors={['#1A0A0A', '#0D1B2A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ marginHorizontal: 20, marginTop: 8, marginBottom: 16, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: AppColors.goldBorder, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: AppColors.goldAccent, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
            <LinearGradient colors={[AppColors.primary, AppColors.primaryLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
            <Text style={{ fontSize: 28 }}>🔮</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={{ color: AppColors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 4 }}>Priya Sharma</Text>
            {[['📅', '15 March 1992'], ['⏰', '10:30 AM'], ['📍', 'New Delhi, India']].map(([e, t]) => (
              <View key={t} style={{ marginTop: 2, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 11 }}>{e}</Text>
                <Text style={{ marginLeft: 4, color: AppColors.textSecondary, fontSize: 12 }}>{t}</Text>
              </View>
            ))}
          </View>
          <Pressable testID="myKundli.edit" onPress={SOURCE_INERT('myKundli.edit')} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: withAlpha(AppColors.goldAccent, 30), borderWidth: 1, borderColor: AppColors.goldBorder }}>
            <Text style={{ color: AppColors.goldAccent, fontSize: 12, fontWeight: '600' }}>Edit</Text>
          </Pressable>
        </LinearGradient>

        {/* chart card */}
        <View style={{ marginHorizontal: 20, marginVertical: 8, padding: 16, borderRadius: 20, backgroundColor: AppColors.surfaceDark, borderWidth: 1, borderColor: AppColors.goldBorder }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: AppColors.textPrimary, fontSize: 16, fontWeight: '700' }}>Vedic Birth Chart</Text>
            <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: withAlpha(AppColors.goldAccent, 30), borderWidth: 1, borderColor: AppColors.goldBorder }}>
              <Text style={{ color: AppColors.goldAccent, fontSize: 11, fontWeight: '600' }}>North Indian</Text>
            </View>
          </View>
          <Animated.View style={[{ marginTop: 16, alignItems: 'center' }, chartStyle]}>
            <VedicChart planets={KUNDLI_PLANETS} selectedHouse={selectedHouse} onHouseTap={(h) => { setSelectedHouse(h); houseSheet.open(h); }} />
          </Animated.View>
          <Text style={{ marginTop: 16, color: AppColors.textMuted, fontSize: 11, textAlign: 'center' }}>Tap any house or planet for detailed interpretation</Text>
          <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {KUNDLI_PLANETS.map((p) => (
              <Pressable key={p.name} testID={`myKundli.planet.${p.name.toLowerCase()}`} onPress={() => planetSheet.open(p)} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: withAlpha(p.color, 30), borderWidth: 1, borderColor: withAlpha(p.color, 80) }}>
                <Text style={{ color: p.color, fontSize: 13 }}>{p.symbol}</Text>
                <Text style={{ marginLeft: 4, color: AppColors.textSecondary, fontSize: 11 }}>{p.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* AI card */}
        <LinearGradient colors={[withAlpha(AppColors.primary, 80), AppColors.surfaceVariantDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ marginHorizontal: 20, marginVertical: 8, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: withAlpha(AppColors.primary, 100) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 20 }}>🤖</Text>
            <Text style={{ marginLeft: 8, color: AppColors.textPrimary, fontSize: 15, fontWeight: '700' }}>Ask AstroParihar AI</Text>
          </View>
          <Text style={{ marginTop: 8, color: AppColors.textSecondary, fontSize: 13, fontStyle: 'italic' }}>&quot;Why is Saturn important in my current period?&quot;</Text>
          <ElevatedButton testID="myKundli.askAi" label="Ask AI About My Kundli" onPress={SOURCE_INERT('myKundli.askAi')} radius={12} paddingV={12} fontSize={14} style={{ marginTop: 12 }} />
        </LinearGradient>

        {/* sections */}
        {SECTIONS.map((s, i) => {
          const isExp = expanded.has(i);
          return (
            <Animated.View key={s.title} layout={EXPAND_LAYOUT} style={{ marginHorizontal: 20, marginVertical: 4, borderRadius: 16, backgroundColor: AppColors.surfaceDark, borderWidth: 1, borderColor: AppColors.goldBorder, overflow: 'hidden' }}>
              <Pressable testID={`myKundli.section.${i}`} onPress={() => toggle(i)} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, minHeight: 56 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: withAlpha(AppColors.goldAccent, 20), alignItems: 'center', justifyContent: 'center' }}>
                  <AppIcon name={s.icon} color={AppColors.goldAccent} size={18} />
                </View>
                <Text style={{ marginLeft: 16, flex: 1, color: AppColors.textPrimary, fontSize: 14, fontWeight: '600' }}>{s.title}</Text>
                <AppIcon name={isExp ? 'keyboard_arrow_up_rounded' : 'keyboard_arrow_down_rounded'} color={AppColors.textMuted} />
              </Pressable>
              <Expandable expanded={isExp} style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                <SectionContent index={i} />
              </Expandable>
            </Animated.View>
          );
        })}

        {/* detailed report CTA */}
        <LinearGradient colors={[withAlpha(AppColors.goldAccent, 40), AppColors.surfaceVariantDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ marginHorizontal: 20, marginTop: 16, marginBottom: 8, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: AppColors.goldBorder, alignItems: 'center' }}>
          <Text style={{ fontSize: 32 }}>📜</Text>
          <Text style={{ marginTop: 8, color: AppColors.textPrimary, fontSize: 16, fontWeight: '700' }}>Get Detailed Kundli Report</Text>
          <Text style={{ marginTop: 4, color: AppColors.textSecondary, fontSize: 13 }}>40+ pages of personalised Vedic analysis</Text>
          <ElevatedButton testID="myKundli.detailedReport" label="Get Detailed Report — ₹499" onPress={SOURCE_INERT('myKundli.detailedReport')} bg={AppColors.goldAccent} fg={AppColors.backgroundDark} radius={12} paddingV={14} fontSize={14} fontWeight="700" style={{ marginTop: 16, alignSelf: 'stretch' }} />
        </LinearGradient>
        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomSheet visible={planetSheet.visible} onClose={planetSheet.close} testID="myKundli.planetSheet">
        {planetSheet.value ? <PlanetDetailSheet planet={planetSheet.value} onClose={planetSheet.close} /> : null}
      </BottomSheet>
      <BottomSheet visible={houseSheet.visible} onClose={houseSheet.close} testID="myKundli.houseSheet">
        {houseSheet.value != null ? <HouseDetailSheet house={houseSheet.value} onClose={houseSheet.close} /> : null}
      </BottomSheet>
    </View>
  );
}
