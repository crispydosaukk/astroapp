/**
 * Port of lib/presentation/panchang_screen/panchang_screen.dart
 * Date chevrons shift ±1 day; centre opens date picker (2020–2030).
 * Generates verified Vedic Panchang & Shubh Muhurat reports.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, Pressable, ScrollView, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppBar, BoxBackButton } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { ElevatedButton, OutlinedButton } from '@/components/common';
import { showSnackBar } from '@/components/overlays';
import { pickDate } from '@/components/pickers';
import { Text } from '@/components/Text';
import { AppColors, withAlpha } from '@/theme/colors';
import { useThemeColors } from '@/theme/themeStore';
import { fetchLivePanchang, PanchangLiveResult } from '@/services/astrologyService';
import { generatePanchangReport } from '@/services/reportService';
import { AppRoutes, push } from '@/navigation/routes';
import { useAuthStore } from '@/features/auth/authStore';
import { useAppScreensCmsStore } from '@/services/appScreensCmsStore';

const PANCHANG = [
  { label: 'Tithi', value: 'Chaturdashi (14th)', sub: 'Krishna Paksha', icon: 'nights_stay_outlined', color: '#9370DB' },
  { label: 'Nakshatra', value: 'Uttara Phalguni', sub: 'Until 3:42 PM', icon: 'star_outline', color: '#FFD700' },
  { label: 'Yoga', value: 'Siddha', sub: 'Auspicious', icon: 'self_improvement', color: '#81C784' },
  { label: 'Karana', value: 'Vishti (Bhadra)', sub: 'Until 12:15 PM', icon: 'schedule', color: '#FF8A65' },
];
const SUN_MOON = [
  { label: 'Sunrise', value: '6:18 AM', icon: 'wb_sunny_outlined', color: '#FFB347' },
  { label: 'Sunset', value: '6:42 PM', icon: 'wb_twilight', color: '#FF6B6B' },
  { label: 'Moonrise', value: '5:24 PM', icon: 'nights_stay_outlined', color: '#E0E0E0' },
  { label: 'Moonset', value: '4:51 AM', icon: 'bedtime_outlined', color: '#9370DB' },
];
const TIMES = [
  { label: 'Rahu Kaal', value: '10:30 AM – 12:00 PM', icon: 'block', color: '#CF4444' },
  { label: 'Yamaganda', value: '3:00 PM – 4:30 PM', icon: 'warning_amber_rounded', color: '#D4821A' },
  { label: 'Gulika Kaal', value: '7:30 AM – 9:00 AM', icon: 'remove_circle_outline', color: '#FF8A65' },
  { label: 'Abhijit Muhurat', value: '11:48 AM – 12:36 PM', icon: 'star_outline', color: '#81C784' },
];
const CHOGHADIYA = [
  { period: '6:18 – 7:48 AM', name: 'Udveg', type: 'Inauspicious', ruler: 'Sun', good: false },
  { period: '7:48 – 9:18 AM', name: 'Char', type: 'Auspicious', ruler: 'Venus', good: true },
  { period: '9:18 – 10:48 AM', name: 'Labh', type: 'Auspicious', ruler: 'Mercury', good: true },
  { period: '10:48 AM – 12:18 PM', name: 'Amrit', type: 'Very Auspicious', ruler: 'Moon', good: true },
  { period: '12:18 – 1:48 PM', name: 'Kaal', type: 'Inauspicious', ruler: 'Saturn', good: false },
  { period: '1:48 – 3:18 PM', name: 'Shubh', type: 'Auspicious', ruler: 'Jupiter', good: true },
  { period: '3:18 – 4:48 PM', name: 'Rog', type: 'Inauspicious', ruler: 'Mars', good: false },
  { period: '4:48 – 6:18 PM', name: 'Udveg', type: 'Inauspicious', ruler: 'Sun', good: false },
];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const SectionTitle = ({ children, color }: { children: string; color: string }) => (
  <Text style={{ color, fontSize: 16, fontWeight: '700' }}>{children}</Text>
);

export default function PanchangScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const cms = useAppScreensCmsStore((s) => s.config.panchang);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateOffset, setDateOffset] = useState(0);
  const [w, setW] = useState(Dimensions.get('window').width - 40);
  const [panchangData, setPanchangData] = useState<PanchangLiveResult | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const authUser = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setPostLoginRedirect = useAuthStore((s) => s.setPostLoginRedirect);
  const isUserLoggedIn = Boolean(isAuthenticated && authUser && (authUser.uid || authUser.phone));
  const [locationName, setLocationName] = useState(authUser?.pob || cms.defaultLocation);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const loc = await AsyncStorage.getItem('astroparihar_user_location');
        const effectiveLoc = loc || authUser?.pob || cms.defaultLocation;
        if (isMounted) setLocationName(effectiveLoc);
        const yyyy = selectedDate.getFullYear();
        const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const dd = String(selectedDate.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const data = await fetchLivePanchang(dateStr, effectiveLoc);
        if (isMounted) setPanchangData(data);
      } catch (err) {
        console.warn('Failed to load panchang:', err);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [selectedDate, authUser?.pob, cms.defaultLocation]);

  const dateLabel =
    dateOffset === 0 ? cms.dateLabels.today : dateOffset === -1 ? cms.dateLabels.yesterday : dateOffset === 1 ? cms.dateLabels.tomorrow
      : `${selectedDate.getDate()}/${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`;
  const formattedDate = `${DAYS[selectedDate.getDay()]}, ${selectedDate.getDate()} ${MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
  const vikramYear = cms.vikramSamvatOverrideYear?.trim() || String(selectedDate.getFullYear() + 57);

  const changeDate = (delta: number) => {
    const off = dateOffset + delta;
    const d = new Date();
    d.setDate(d.getDate() + off);
    setDateOffset(off);
    setSelectedDate(d);
  };
  const openPicker = async () => {
    const picked = await pickDate({ value: selectedDate, minimumDate: new Date(2020, 0, 1), maximumDate: new Date(2030, 0, 1) });
    if (picked) {
      setSelectedDate(picked);
      setDateOffset(Math.trunc((picked.getTime() - Date.now()) / 86400000));
    }
  };
  const cellW = Math.max(140, (w - 12) / 2);

  const dynamicPanchang = panchangData ? [
    { key: 'tithi', label: cms.cardLabels.tithi, value: panchangData.tithi, sub: panchangData.tithiSub || 'Vedic Lunar Day', icon: 'nights_stay_outlined', color: '#9370DB' },
    { key: 'nakshatra', label: cms.cardLabels.nakshatra, value: panchangData.nakshatra, sub: panchangData.nakshatraSub || 'Lunar Mansion', icon: 'star_outline', color: '#FFD700' },
    { key: 'yoga', label: cms.cardLabels.yoga, value: panchangData.yoga, sub: panchangData.yogaSub || 'Auspicious Period', icon: 'self_improvement', color: '#81C784' },
    { key: 'karana', label: cms.cardLabels.karana, value: panchangData.karana, sub: panchangData.karanaSub || 'Half-Tithi Cycle', icon: 'schedule', color: '#FF8A65' },
  ] : [
    { key: 'tithi', ...PANCHANG[0], label: cms.cardLabels.tithi },
    { key: 'nakshatra', ...PANCHANG[1], label: cms.cardLabels.nakshatra },
    { key: 'yoga', ...PANCHANG[2], label: cms.cardLabels.yoga },
    { key: 'karana', ...PANCHANG[3], label: cms.cardLabels.karana },
  ];

  const dynamicSunMoon = panchangData ? [
    { key: 'sunrise', label: cms.cardLabels.sunrise, value: panchangData.sunrise, icon: 'wb_sunny_outlined', color: '#FFB347' },
    { key: 'sunset', label: cms.cardLabels.sunset, value: panchangData.sunset, icon: 'wb_twilight', color: '#FF6B6B' },
    { key: 'moonrise', label: cms.cardLabels.moonrise, value: panchangData.moonrise, icon: 'nights_stay_outlined', color: '#E0E0E0' },
    { key: 'moonset', label: cms.cardLabels.moonset, value: panchangData.moonset, icon: 'bedtime_outlined', color: '#9370DB' },
  ] : [
    { key: 'sunrise', ...SUN_MOON[0], label: cms.cardLabels.sunrise },
    { key: 'sunset', ...SUN_MOON[1], label: cms.cardLabels.sunset },
    { key: 'moonrise', ...SUN_MOON[2], label: cms.cardLabels.moonrise },
    { key: 'moonset', ...SUN_MOON[3], label: cms.cardLabels.moonset },
  ];

  const dynamicTimes = panchangData ? [
    { key: 'rahu', label: cms.cardLabels.rahuKaal, value: panchangData.rahuKaal, icon: 'block', color: '#CF4444', isGood: false },
    { key: 'yamaganda', label: cms.cardLabels.yamaganda, value: panchangData.yamaganda, icon: 'warning_amber_rounded', color: '#D4821A', isGood: false },
    { key: 'gulika', label: cms.cardLabels.gulikaKaal, value: panchangData.gulikaKaal, icon: 'remove_circle_outline', color: '#FF8A65', isGood: false },
    { key: 'abhijit', label: cms.cardLabels.abhijitMuhurat, value: panchangData.abhijitMuhurat, icon: 'star_outline', color: '#81C784', isGood: true },
  ] : [
    { key: 'rahu', ...TIMES[0], label: cms.cardLabels.rahuKaal, isGood: false },
    { key: 'yamaganda', ...TIMES[1], label: cms.cardLabels.yamaganda, isGood: false },
    { key: 'gulika', ...TIMES[2], label: cms.cardLabels.gulikaKaal, isGood: false },
    { key: 'abhijit', ...TIMES[3], label: cms.cardLabels.abhijitMuhurat, isGood: true },
  ];

  const dynamicChoghadiya = (panchangData?.choghadiya && panchangData.choghadiya.length > 0) ? panchangData.choghadiya : CHOGHADIYA;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🕉️ Vedic Panchang (${formattedDate}) - ${locationName}\n• ${cms.cardLabels.tithi}: ${dynamicPanchang[0].value}\n• ${cms.cardLabels.nakshatra}: ${dynamicPanchang[1].value}\n• ${cms.cardLabels.abhijitMuhurat}: ${dynamicTimes[3].value}\n• ${cms.cardLabels.rahuKaal}: ${dynamicTimes[0].value}\n\nShared via AstroParihar App ✨`,
      });
    } catch {}
  };

  const handleGenerateReport = async () => {
    if (!isUserLoggedIn) {
      setPostLoginRedirect({ route: '', popOnSuccess: true });
      showSnackBar(cms.signInToast, '#713B32');
      push(AppRoutes.signInScreen);
      return;
    }

    try {
      setIsGeneratingReport(true);
      showSnackBar(`Generating Panchang Almanac for ${formattedDate}...`, colors.surfaceVariant);
      await generatePanchangReport({
        dateStr: formattedDate,
        locationStr: locationName,
        panchangData: panchangData || {},
      });
      showSnackBar('Panchang & Muhurat Report generated successfully!', colors.surfaceVariant);
      push(AppRoutes.kundliReportsScreen);
    } catch (err: any) {
      showSnackBar(err.message || 'Failed to generate report', '#CF4444');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="panchang.screen">
      <AppBar
        title={cms.headerTitle}
        backgroundColor={colors.background}
        backColor={colors.textPrimary}
        leading={<BoxBackButton testID="panchang.back" onPress={() => router.back()} />}
        actions={[
          { icon: 'location_on_outlined', color: colors.goldAccent, onPress: () => {}, testID: 'panchang.location' },
          { icon: 'share_outlined', color: colors.goldAccent, onPress: handleShare, testID: 'panchang.shareAppBar' },
        ]}
      />
      <ScrollView>
        <View style={{ marginHorizontal: 20, marginTop: 8, marginBottom: 12, padding: 4, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder, flexDirection: 'row', alignItems: 'center' }}>
          <Pressable testID="panchang.prevDay" onPress={() => changeDate(-1)} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surfaceVariant, alignItems: 'center', justifyContent: 'center' }}>
            <AppIcon name="chevron_left_rounded" color={colors.textPrimary} size={20} />
          </Pressable>
          <Pressable testID="panchang.pickDate" onPress={openPicker} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: colors.accent, fontSize: 14, fontWeight: '700' }}>{dateLabel}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 11 }}>{formattedDate}</Text>
          </Pressable>
          <Pressable testID="panchang.nextDay" onPress={() => changeDate(1)} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surfaceVariant, alignItems: 'center', justifyContent: 'center' }}>
            <AppIcon name="chevron_right_rounded" color={colors.textPrimary} size={20} />
          </Pressable>
        </View>

        <LinearGradient
          colors={
            colors.isLight
              ? ['#FFF9F0', colors.surfaceVariant]
              : [withAlpha(colors.accent, 40), colors.surfaceVariant]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ marginHorizontal: 20, marginVertical: 4, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder, flexDirection: 'row', alignItems: 'center' }}
        >
          <Text style={{ fontSize: 28 }}>🕉️</Text>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: colors.goldAccent, fontSize: 13, fontWeight: '600' }}>{`${cms.vikramSamvatPrefix} ${vikramYear} • ${cms.calendarSubtitle}`}</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>{dynamicPanchang[0]?.value || 'Shukla Paksha'}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 11 }}>{`${locationName} • ${cms.timezoneLabel}`}</Text>
          </View>
        </LinearGradient>

        <View style={{ marginHorizontal: 20, marginTop: 12, marginBottom: 8 }}>
          <SectionTitle color={colors.textPrimary}>{cms.sections.detailsTitle}</SectionTitle>
          <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
            {dynamicPanchang.map((p) => (
              <View
                key={p.key}
                style={{
                  width: cellW,
                  minHeight: 110,
                  padding: 14,
                  borderRadius: 16,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: withAlpha(p.color, colors.isLight ? 50 : 60),
                  justifyContent: 'space-between',
                  shadowColor: colors.isLight ? '#000000' : colors.goldAccent,
                  shadowOpacity: colors.isLight ? 0.04 : 0.15,
                  shadowRadius: 6,
                  elevation: 2,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <AppIcon name={p.icon} color={p.color} size={16} />
                  <Text style={{ marginLeft: 6, color: p.color, fontSize: 11, fontWeight: '600' }}>{p.label}</Text>
                </View>
                <Text numberOfLines={2} style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>{p.value}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 10 }}>{p.sub}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ marginHorizontal: 20, marginVertical: 8 }}>
          <SectionTitle color={colors.textPrimary}>{cms.sections.sunMoonTitle}</SectionTitle>
          <View style={{ marginTop: 12, flexDirection: 'row' }}>
            {dynamicSunMoon.map((s) => (
              <View
                key={s.key}
                style={{
                  flex: 1,
                  marginRight: 8,
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: withAlpha(s.color, colors.isLight ? 50 : 60),
                  alignItems: 'center',
                }}
              >
                <AppIcon name={s.icon} color={s.color} size={22} />
                <Text style={{ marginTop: 6, color: colors.textPrimary, fontSize: 12, fontWeight: '700' }}>{s.value}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 10 }}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ marginHorizontal: 20, marginVertical: 8 }}>
          <SectionTitle color={colors.textPrimary}>{cms.sections.timesTitle}</SectionTitle>
          <View style={{ height: 12 }} />
          {dynamicTimes.map((t) => {
            const isGood = t.isGood;
            return (
              <View
                key={t.key}
                style={{
                  marginBottom: 8,
                  padding: 14,
                  borderRadius: 14,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: withAlpha(t.color, colors.isLight ? 50 : 60),
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: withAlpha(t.color, colors.isLight ? 20 : 30), alignItems: 'center', justifyContent: 'center' }}>
                  <AppIcon name={t.icon} color={t.color} size={20} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>{t.label}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{t.value}</Text>
                </View>
                <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: withAlpha(t.color, colors.isLight ? 20 : 30) }}>
                  <Text style={{ color: t.color, fontSize: 10, fontWeight: '600' }}>{isGood ? cms.badges.auspicious : cms.badges.avoid}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ marginHorizontal: 20, marginVertical: 8 }}>
          <SectionTitle color={colors.textPrimary}>{cms.sections.choghadiyaTitle}</SectionTitle>
          <Text style={{ marginTop: 4, color: colors.textMuted, fontSize: 12 }}>{cms.sections.choghadiyaSubtitle}</Text>
          <View style={{ height: 12 }} />
          {dynamicChoghadiya.map((c, i) => {
            const color = c.type === 'Very Auspicious' ? colors.goldAccent : c.good ? AppColors.success : AppColors.error;
            return (
              <View
                key={i}
                style={{
                  marginBottom: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: withAlpha(color, colors.isLight ? 20 : 15),
                  borderWidth: 1,
                  borderColor: withAlpha(color, colors.isLight ? 40 : 50),
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
                <View style={{ flex: 1, marginLeft: 10, flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color, fontSize: 13, fontWeight: '700' }}>{c.name}</Text>
                  <Text style={{ marginLeft: 8, color: colors.textMuted, fontSize: 11 }}>{`(${c.ruler})`}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{c.period}</Text>
                  <Text style={{ color, fontSize: 10, fontWeight: '600' }}>{c.type}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, gap: 10 }}>
          <ElevatedButton
            testID="panchang.generateReport"
            label={
              isGeneratingReport
                ? cms.buttons.generating
                : !isUserLoggedIn
                ? cms.buttons.signInToGenerate
                : cms.buttons.generateReport
            }
            icon={isGeneratingReport ? undefined : 'description_outlined'}
            disabled={isGeneratingReport}
            onPress={handleGenerateReport}
            bg="#713B32"
            fg="#FFFFFF"
            radius={100}
            paddingV={14}
            fontSize={14}
            fontWeight="700"
          />
          <OutlinedButton
            testID="panchang.share"
            label={cms.buttons.sharePanchang}
            icon="share_outlined"
            color={colors.accent}
            borderColor={colors.accent}
            onPress={handleShare}
          />
        </View>
        <View style={{ height: Math.max(140, insets.bottom + 80) }} />
      </ScrollView>
    </View>
  );
}
