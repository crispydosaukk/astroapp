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
import { EXPAND_LAYOUT, Expandable } from '@/components/AnimatedBox';
import { AppBar, BoxBackButton } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { ElevatedButton } from '@/components/common';
import { BottomSheet, showSnackBar, useSheet } from '@/components/overlays';
import { lh, Text } from '@/components/Text';
import { VedicKundliChart } from '@/components/VedicKundliChart';
import { AppRoutes, push } from '@/navigation/routes';
import { fetchCalculatedKundli, KundliChartData } from '@/services/astrologyService';
import { useBirthProfileStore } from '@/services/birthProfileStore';
import { downloadOrShareReport } from '@/services/reportService';
import { useAuthStore } from '@/features/auth/authStore';
import { fillCmsTemplate, useAppScreensCmsStore } from '@/services/appScreensCmsStore';
import type { AppScreensCmsConfig } from '@/services/appScreensCmsDefaults';
import { withAlpha } from '@/theme/colors';
import { useThemeColors } from '@/theme/themeStore';

const ZODIAC_WHEEL = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

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

function DashaRow({ label, planet, period, isCurrent, activeBadge, colors }: { label: string; planet: string; period: string; isCurrent: boolean; activeBadge: string; colors: any }) {
  return (
    <View style={{ marginBottom: 8, padding: 12, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: isCurrent ? withAlpha(colors.goldAccent, colors.isLight ? 20 : 30) : colors.surfaceVariant, borderWidth: 1, borderColor: isCurrent ? colors.goldAccent : colors.cardBorder }}>
      <View>
        <Text style={{ color: colors.textMuted, fontSize: 11 }}>{label}</Text>
        <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>{planet}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        {isCurrent ? (
          <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: colors.goldAccent }}>
            <Text style={{ color: '#080D1A', fontSize: 10, fontWeight: '700' }}>{activeBadge}</Text>
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

function SectionContent({ index, chart, cms, colors }: { index: number; chart: KundliChartData | null; cms: AppScreensCmsConfig['myKundli']; colors: any }) {
  const sectionsList = cms.sections && cms.sections.length > 0 ? cms.sections : SECTIONS;
  switch (index) {
    case 0:
      return (
        <View>
          {[
            [cms.birthFieldLabels.name, chart?.name || cms.defaultDevoteeLabel],
            [cms.birthFieldLabels.dob, chart?.dob || cms.notSpecifiedLabel],
            [cms.birthFieldLabels.tob, chart?.tob || cms.notSpecifiedLabel],
            [cms.birthFieldLabels.pob, chart?.pob || cms.notSpecifiedLabel],
            [cms.birthFieldLabels.lagna, chart?.ascendant.sign || 'Scorpio'],
            [cms.birthFieldLabels.moonSign, chart?.moonSign || 'Cancer'],
            [cms.birthFieldLabels.nakshatra, `${chart?.nakshatra || 'Punarvasu'} (${cms.birthFieldLabels.padaLabel} ${chart?.nakshatraPada || 1})`],
          ].map(([k, v], idx) => (
            <View key={`${idx}-${k}`} style={{ paddingVertical: 4, flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>{k}</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>{v}</Text>
            </View>
          ))}
        </View>
      );
    case 1: {
      const sign = chart?.ascendant.sign || 'Scorpio';
      const lord = chart?.ascendant.lord || 'Mars';
      return (
        <View>
          <InfoChip label={cms.lagnaLabels.lagna} value={`${sign} (${chart?.ascendant.degree || "12°45'"})`} color={colors.goldAccent} />
          <View style={{ height: 8 }} />
          <InfoChip label={cms.lagnaLabels.lagnaLord} value={`${lord} ${cms.lagnaLabels.lordDescSuffix}`} color="#FF6B6B" />
          <Text style={{ marginTop: 10, color: colors.textSecondary, ...lh(13, 1.5) }}>
            {fillCmsTemplate(cms.lagnaLabels.ascendantDescTemplate, { sign, lord })}
          </Text>
        </View>
      );
    }
    case 2: {
      const moonSign = chart?.moonSign || 'Cancer';
      const nakshatra = chart?.nakshatra || 'Punarvasu';
      return (
        <View>
          <InfoChip label={cms.lagnaLabels.rashiLabel} value={moonSign} color={colors.goldAccent} />
          <View style={{ height: 8 }} />
          <InfoChip label={cms.lagnaLabels.nakshatraLabel} value={`${nakshatra} (${cms.birthFieldLabels.padaLabel} ${chart?.nakshatraPada || 1})`} color="#2D9E6B" />
          <Text style={{ marginTop: 10, color: colors.textSecondary, ...lh(13, 1.5) }}>
            {fillCmsTemplate(cms.lagnaLabels.rashiDescTemplate, { moonSign, nakshatra })}
          </Text>
        </View>
      );
    }
    case 3: {
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
    }
    case 4: {
      const lagnaSign = chart?.ascendant?.sign || 'Aries';
      const lagnaIdx = Math.max(0, ZODIAC_WHEEL.findIndex((z) => z.toLowerCase() === lagnaSign.toLowerCase()));
      const housesToShow = cms.houseSummaryItems && cms.houseSummaryItems.length > 0
        ? cms.houseSummaryItems
        : [
            { houseNumber: 1, label: '1st House', rules: 'Self, Vitality & Appearance' },
            { houseNumber: 2, label: '2nd House', rules: 'Wealth, Family & Speech' },
            { houseNumber: 4, label: '4th House', rules: 'Home, Mother & Happiness' },
            { houseNumber: 7, label: '7th House', rules: 'Marriage, Partnerships & Spousal Bliss' },
            { houseNumber: 10, label: '10th House', rules: 'Career, Profession & Social Status' },
          ];
      return (
        <View>
          {housesToShow.map((h) => {
            const houseNum = Number(h.houseNumber) || 1;
            const houseSign = ZODIAC_WHEEL[(lagnaIdx + (houseNum - 1)) % 12];
            return (
              <View key={`${h.houseNumber}-${h.label}`} style={{ paddingVertical: 4, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: withAlpha(colors.goldAccent, 20), alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: colors.goldAccent, fontSize: 10, fontWeight: '700' }}>{h.label.split(' ')[0]}</Text>
                </View>
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '600' }}>{h.rules}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11 }}>{houseSign}</Text>
                </View>
              </View>
            );
          })}
        </View>
      );
    }
    case 5: {
      const mahadasha = chart?.dasha.currentMahadasha || 'Jupiter';
      const antardasha = chart?.dasha.currentAntardasha || 'Saturn';
      return (
        <View>
          <DashaRow label={cms.dashaLabels.mahadasha} planet={mahadasha} period={cms.dashaLabels.majorDesc} isCurrent activeBadge={cms.dashaLabels.activeBadge} colors={colors} />
          <DashaRow label={cms.dashaLabels.antardasha} planet={antardasha} period={cms.dashaLabels.subDesc} isCurrent={false} activeBadge={cms.dashaLabels.activeBadge} colors={colors} />
          <Text style={{ marginTop: 10, color: colors.textSecondary, ...lh(13, 1.5) }}>
            {fillCmsTemplate(cms.dashaLabels.summaryTemplate, { mahadasha, antardasha })}
          </Text>
        </View>
      );
    }
    case 6:
      return (
        <View>
          {(cms.currentTransits || []).map((t, idx) => (
            <View key={`${idx}-${t.planet}`} style={{ marginBottom: 8, padding: 12, borderRadius: 12, backgroundColor: colors.surfaceVariant, borderWidth: 1, borderColor: colors.cardBorder, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>{`${t.planet} in ${t.sign}`}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>{t.house}</Text>
              </View>
              <Text style={{ color: colors.goldAccent, fontSize: 11, fontWeight: '700', textAlign: 'right' }}>{t.effect}</Text>
            </View>
          ))}
        </View>
      );
    case 7:
      return (
        <View>
          <StatusCard
            name={cms.doshaLabels.mangal}
            status={chart?.doshas.isManglik ? `${cms.doshaLabels.present} (${chart.doshas.manglikSeverity})` : cms.doshaLabels.notPresent}
            desc={chart?.doshas.isManglik ? cms.doshaLabels.mangalPresentDesc : cms.doshaLabels.mangalClearDesc}
            statusColor={chart?.doshas.isManglik ? '#D4821A' : '#2D9E6B'}
            borderColor={withAlpha(chart?.doshas.isManglik ? '#D4821A' : '#2D9E6B', 80)}
            colors={colors}
          />
          <StatusCard
            name={cms.doshaLabels.kaalSarp}
            status={chart?.doshas.kaalSarpPresent ? cms.doshaLabels.present : cms.doshaLabels.notPresent}
            desc={chart?.doshas.kaalSarpPresent ? cms.doshaLabels.kaalSarpPresentDesc : cms.doshaLabels.kaalSarpClearDesc}
            statusColor={chart?.doshas.kaalSarpPresent ? '#D4821A' : '#2D9E6B'}
            borderColor={withAlpha(chart?.doshas.kaalSarpPresent ? '#D4821A' : '#2D9E6B', 80)}
            colors={colors}
          />
          <StatusCard
            name={cms.doshaLabels.sadeSati}
            status={chart?.doshas.sadeSatiStatus ? cms.doshaLabels.monitored : cms.doshaLabels.clear}
            desc={chart?.doshas.sadeSatiStatus || cms.doshaLabels.sadeSatiDefaultDesc}
            statusColor={colors.goldAccent}
            borderColor={withAlpha(colors.goldAccent, 80)}
            colors={colors}
          />
        </View>
      );
    case 8: {
      const yogasList = chart?.yogas && chart.yogas.length > 0 ? chart.yogas : (cms.defaultYogas || []);
      return (
        <View>
          {yogasList.map((y) => (
            <StatusCard key={y.name} name={y.name} status={y.benefic ? cms.doshaLabels.beneficBadge : cms.doshaLabels.activeBadge} desc={y.description} statusColor={colors.goldAccent} borderColor={colors.cardBorder} colors={colors} />
          ))}
        </View>
      );
    }
    default: {
      const title = sectionsList[index]?.title || SECTIONS[index]?.title || 'Insight';
      const defaultKey = SECTIONS[index]?.title || title;
      const pred = cms.genericPredictions?.[title] ?? cms.genericPredictions?.[defaultKey] ?? GENERIC[defaultKey];
      return (
        <Text style={{ color: colors.textSecondary, ...lh(13, 1.5) }}>
          {pred ?? `Detailed analysis for ${title} based on your birth chart. Consult with an astrologer for personalized insights.`}
        </Text>
      );
    }
  }
}

/* -------------------------------------------------------------- sheets */
function SheetHandle({ colors }: { colors: any }) {
  return <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.textMuted }} />;
}

function PlanetDetailSheet({ planet, onClose, cms, colors }: { planet: Planet; onClose: () => void; cms: AppScreensCmsConfig['myKundli']; colors: any }) {
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
        {cms.planetInterpretations?.[planet.name] ?? PLANET_INTERP[planet.name] ?? "This planet's placement in your chart has significant influence on your life path and personality."}
      </Text>
      <ElevatedButton testID="myKundli.planetSheet.askAi" label={cms.planetSheetAskAi} onPress={onClose} radius={12} fontWeight="700" fontSize={14} paddingV={10} style={{ marginTop: 20 }} />
      <View style={{ height: insets.bottom + 8 }} />
    </View>
  );
}

function HouseDetailSheet({ house, onClose, cms, colors }: { house: number; onClose: () => void; cms: AppScreensCmsConfig['myKundli']; colors: any }) {
  const insets = useSafeAreaInsets();
  const info = cms.houseInfo?.[String(house)] ?? HOUSE_INFO[house] ?? { name: `House ${house}`, rules: 'Various life areas', desc: 'This house governs important areas of your life based on its position in your birth chart.' };
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
      <ElevatedButton testID="myKundli.houseSheet.close" label={cms.houseSheetClose} onPress={onClose} radius={12} fontWeight="600" fontSize={14} paddingV={10} style={{ marginTop: 20 }} />
      <View style={{ height: insets.bottom + 8 }} />
    </View>
  );
}

/* -------------------------------------------------------------- screen */
export default function MyKundliScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const cms = useAppScreensCmsStore((s) => s.config.myKundli);
  const authUser = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const activeProfile = useBirthProfileStore((s) => s.activeProfile);
  const setPostLoginRedirect = useAuthStore((s) => s.setPostLoginRedirect);
  const isUserLoggedIn = Boolean(isAuthenticated && authUser && (authUser.uid || authUser.phone));
  const [selectedHouse, setSelectedHouse] = useState<number | null>(null);
  const [chartFormat, setChartFormat] = useState<'north' | 'south'>('south');
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0, 1, 2]));
  const [chartData, setChartData] = useState<KundliChartData | null>(null);
  const planetSheet = useSheet<Planet>();
  const houseSheet = useSheet<number>();
  const sectionsList = cms.sections && cms.sections.length > 0 ? cms.sections : SECTIONS;

  useEffect(() => {
    if (!isUserLoggedIn) {
      setChartData(null);
      return;
    }
    const profileParams = activeProfile?.dob
      ? {
          name: activeProfile.name,
          dob: activeProfile.dob,
          tob: activeProfile.time,
          pob: activeProfile.place,
          gender: activeProfile.gender,
        }
      : undefined;

    fetchCalculatedKundli(profileParams).then((data) => {
      if (data) setChartData(data);
    });
  }, [isUserLoggedIn, authUser, activeProfile]);

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
      initialPrompt: `Namaste 🙏 Please analyze my Kundli for ${chartData?.name || cms.guestLabel} (Born: ${chartData?.dob || ''} at ${chartData?.tob || ''}, ${chartData?.pob || ''}). My Ascendant is ${chartData?.ascendant.sign || 'Scorpio'}, Moon in ${chartData?.moonSign || 'Cancer'} (${chartData?.nakshatra || 'Punarvasu'}). Active Mahadasha is ${chartData?.dasha.currentMahadasha || 'Jupiter'}. What are my key career & life predictions?`,
    });
  };

  const handleExportChartSummary = async () => {
    if (!isUserLoggedIn) {
      setPostLoginRedirect({ route: '', popOnSuccess: true });
      showSnackBar(cms.signInExportToast, '#713B32');
      push(AppRoutes.signInScreen);
      return;
    }
    await downloadOrShareReport({
      id: `kundli_export_${Date.now()}`,
      title: `Janam Kundli Birth Chart — ${chartData?.name || authUser?.name || cms.defaultDevoteeLabel}`,
      subtitle: `${chartData?.dob || authUser?.dob || ''} • ${chartData?.pob || authUser?.pob || ''}`,
      pages: `${sectionsList.length} sections`,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'Ready',
      emoji: '🔮',
      color: '#9370DB',
      size: '1.8 MB',
      category: 'services',
      summary: `Ascendant (Lagna): ${chartData?.ascendant.sign || 'Scorpio'} (${chartData?.ascendant.degree || "12°45'"}) | Moon Sign (Rashi): ${chartData?.moonSign || 'Cancer'} | Nakshatra: ${chartData?.nakshatra || 'Punarvasu'} (${cms.birthFieldLabels.padaLabel} ${chartData?.nakshatraPada || 1}) | Active Mahadasha: ${chartData?.dasha.currentMahadasha || 'Jupiter'}-${chartData?.dasha.currentAntardasha || 'Saturn'}.`,
      astrologicalAnalysis: activePlanets
        .map((p) => `• ${p.symbol} ${p.name}: ${p.sign} (House ${p.house}, ${p.degree})`)
        .join('\n'),
      remediesPrescribed: [
        'Chant Gayatri Mantra 108 times daily during sunrise',
        'Offer Surya Arghya in a copper vessel facing East',
        'Perform directional Ashta Parihar remedies aligned with your Lagna',
      ],
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="myKundli.screen">
      <AppBar
        title={cms.headerTitle}
        backgroundColor={colors.background}
        backColor={colors.textPrimary}
        leading={<BoxBackButton testID="myKundli.back" onPress={() => router.back()} />}
        actions={[
          {
            icon: 'share_outlined',
            color: colors.goldAccent,
            onPress: handleExportChartSummary,
            testID: 'myKundli.share',
          },
          {
            icon: 'download_outlined',
            color: colors.goldAccent,
            onPress: handleExportChartSummary,
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
              {isUserLoggedIn ? (chartData?.name || activeProfile?.name || authUser?.name || cms.defaultDevoteeLabel) : cms.guestLabel}
            </Text>
            {[
              ['📅', isUserLoggedIn ? (chartData?.dob || activeProfile?.dob || authUser?.dob || cms.notSpecifiedLabel) : cms.signInToViewLabel],
              ['⏰', isUserLoggedIn ? (chartData?.tob || activeProfile?.time || authUser?.tob || cms.notSpecifiedLabel) : cms.signInToViewLabel],
              ['📍', isUserLoggedIn ? (chartData?.pob || activeProfile?.place || authUser?.pob || cms.notSpecifiedLabel) : cms.signInToViewLabel],
            ].map(([e, tText]) => (
              <View key={e} style={{ marginTop: 2, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 11 }}>{e}</Text>
                <Text style={{ marginLeft: 4, color: colors.textSecondary, fontSize: 12 }}>{tText}</Text>
              </View>
            ))}
          </View>
          <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: withAlpha(colors.goldAccent, 25), borderWidth: 1, borderColor: colors.cardBorder }}>
            <Text style={{ color: colors.goldAccent, fontSize: 11, fontWeight: '700' }}>{cms.verifiedBadge}</Text>
          </View>
        </LinearGradient>

        {/* Vedic Kundli Birth Chart (Matching Reference Image 2) */}
        <Animated.View style={[{ marginHorizontal: 16, marginVertical: 8, alignItems: 'center' }, chartStyle]}>
          <VedicKundliChart
            chartData={chartData}
            devoteeName={isUserLoggedIn ? (chartData?.name || activeProfile?.name || authUser?.name || cms.defaultDevoteeLabel) : cms.guestLabel}
            dob={isUserLoggedIn ? (chartData?.dob || activeProfile?.dob || authUser?.dob || '1995-10-15') : '1995-10-15'}
            tob={isUserLoggedIn ? (chartData?.tob || activeProfile?.time || authUser?.tob || '12:00 PM') : '12:00 PM'}
            pob={isUserLoggedIn ? (chartData?.pob || activeProfile?.place || authUser?.pob || 'New Delhi, India') : 'New Delhi, India'}
            ascendantSign={chartData?.ascendant?.sign || 'Scorpio'}
            moonSign={chartData?.moonSign || 'Cancer'}
            nakshatra={chartData?.nakshatra || 'Punarvasu'}
            nakshatraPada={chartData?.nakshatraPada || 1}
            planets={activePlanets}
            chartStyle={chartFormat === 'north' ? 'north-indian' : 'south-indian'}
            onChartStyleChange={(s) => setChartFormat(s === 'north-indian' ? 'north' : 'south')}
            selectedHouse={selectedHouse}
            onHouseTap={(h) => {
              setSelectedHouse(h);
              houseSheet.open(h);
            }}
            onPlanetTap={(p) => {
              planetSheet.open({
                name: p.name || p.cleanName,
                symbol: p.symbol || p.style?.symbol || '✦',
                sign: p.sign || p.signName || 'Aries',
                house: Number(p.houseNum || p.house || 1),
                degree: p.degree || "10°00'",
                color: p.color || p.style?.text || '#FFD700',
              });
            }}
            showFormatSwitcher={true}
            showPlanetaryList={true}
            compact={false}
          />
        </Animated.View>

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
            <Text style={{ marginLeft: 8, color: colors.textPrimary, fontSize: 15, fontWeight: '700' }}>{cms.aiCardTitle}</Text>
          </View>
          <Text style={{ marginTop: 8, color: colors.textSecondary, fontSize: 13, fontStyle: 'italic' }}>
            {fillCmsTemplate(cms.aiCardPromptTemplate, { mahadasha: chartData?.dasha.currentMahadasha || 'Jupiter' })}
          </Text>
          <ElevatedButton testID="myKundli.askAi" label={cms.aiCardButton} onPress={handleAskAiAboutKundli} radius={12} paddingV={12} fontSize={14} style={{ marginTop: 12 }} />
        </LinearGradient>

        {/* sections */}
        {sectionsList.map((s, i) => {
          const isExp = expanded.has(i);
          return (
            <Animated.View key={`${i}-${s.title}`} layout={EXPAND_LAYOUT} style={{ marginHorizontal: 20, marginVertical: 4, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' }}>
              <Pressable testID={`myKundli.section.${i}`} onPress={() => toggle(i)} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, minHeight: 56 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: withAlpha(colors.goldAccent, 20), alignItems: 'center', justifyContent: 'center' }}>
                  <AppIcon name={s.icon} color={colors.goldAccent} size={18} />
                </View>
                <Text style={{ marginLeft: 16, flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>{s.title}</Text>
                <AppIcon name={isExp ? 'keyboard_arrow_up_rounded' : 'keyboard_arrow_down_rounded'} color={colors.textMuted} />
              </Pressable>
              <Expandable expanded={isExp} style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                <SectionContent index={i} chart={chartData} cms={cms} colors={colors} />
              </Expandable>
            </Animated.View>
          );
        })}

        <View style={{ height: Math.max(140, insets.bottom + 80) }} />
      </ScrollView>

      <BottomSheet visible={planetSheet.visible} onClose={planetSheet.close} testID="myKundli.planetSheet">
        {planetSheet.value ? <PlanetDetailSheet planet={planetSheet.value} onClose={planetSheet.close} cms={cms} colors={colors} /> : null}
      </BottomSheet>
      <BottomSheet visible={houseSheet.visible} onClose={houseSheet.close} testID="myKundli.houseSheet">
        {houseSheet.value != null ? <HouseDetailSheet house={houseSheet.value} onClose={houseSheet.close} cms={cms} colors={colors} /> : null}
      </BottomSheet>
    </View>
  );
}
