/**
 * Port of lib/presentation/panchang_screen/panchang_screen.dart
 * Date chevrons shift ±1 day; centre opens date picker (2020–2030). Panchang values are static (parity).
 * SOURCE_INERT: app-bar location, app-bar share, "Share Today's Panchang".
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, Pressable, ScrollView, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppBar, BoxBackButton } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { OutlinedButton } from '@/components/common';
import { pickDate } from '@/components/pickers';
import { Text } from '@/components/Text';
import { AppColors, withAlpha } from '@/theme/colors';
import { useThemeColors } from '@/theme/themeStore';
import { fetchLivePanchang, PanchangLiveResult } from '@/services/astrologyService';
import { useAuthStore } from '@/features/auth/authStore';

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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateOffset, setDateOffset] = useState(0);
  const [w, setW] = useState(Dimensions.get('window').width - 40);
  const [panchangData, setPanchangData] = useState<PanchangLiveResult | null>(null);
  const authUser = useAuthStore((s) => s.user);
  const [locationName, setLocationName] = useState(authUser?.pob || 'New Delhi, India');

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const loc = await AsyncStorage.getItem('astroparihar_user_location');
        const effectiveLoc = loc || authUser?.pob || 'New Delhi, India';
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
  }, [selectedDate, authUser?.pob]);

  const dateLabel =
    dateOffset === 0 ? 'Today' : dateOffset === -1 ? 'Yesterday' : dateOffset === 1 ? 'Tomorrow'
      : `${selectedDate.getDate()}/${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`;
  const formattedDate = `${DAYS[selectedDate.getDay()]}, ${selectedDate.getDate()} ${MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;

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
    { label: 'Tithi', value: panchangData.tithi, sub: panchangData.tithiSub || 'Vedic Lunar Day', icon: 'nights_stay_outlined', color: '#9370DB' },
    { label: 'Nakshatra', value: panchangData.nakshatra, sub: panchangData.nakshatraSub || 'Lunar Mansion', icon: 'star_outline', color: '#FFD700' },
    { label: 'Yoga', value: panchangData.yoga, sub: panchangData.yogaSub || 'Auspicious Period', icon: 'self_improvement', color: '#81C784' },
    { label: 'Karana', value: panchangData.karana, sub: panchangData.karanaSub || 'Half-Tithi Cycle', icon: 'schedule', color: '#FF8A65' },
  ] : PANCHANG;

  const dynamicSunMoon = panchangData ? [
    { label: 'Sunrise', value: panchangData.sunrise, icon: 'wb_sunny_outlined', color: '#FFB347' },
    { label: 'Sunset', value: panchangData.sunset, icon: 'wb_twilight', color: '#FF6B6B' },
    { label: 'Moonrise', value: panchangData.moonrise, icon: 'nights_stay_outlined', color: '#E0E0E0' },
    { label: 'Moonset', value: panchangData.moonset, icon: 'bedtime_outlined', color: '#9370DB' },
  ] : SUN_MOON;

  const dynamicTimes = panchangData ? [
    { label: 'Rahu Kaal', value: panchangData.rahuKaal, icon: 'block', color: '#CF4444' },
    { label: 'Yamaganda', value: panchangData.yamaganda, icon: 'warning_amber_rounded', color: '#D4821A' },
    { label: 'Gulika Kaal', value: panchangData.gulikaKaal, icon: 'remove_circle_outline', color: '#FF8A65' },
    { label: 'Abhijit Muhurat', value: panchangData.abhijitMuhurat, icon: 'star_outline', color: '#81C784' },
  ] : TIMES;

  const dynamicChoghadiya = (panchangData?.choghadiya && panchangData.choghadiya.length > 0) ? panchangData.choghadiya : CHOGHADIYA;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🕉️ Vedic Panchang (${formattedDate}) - ${locationName}\n• Tithi: ${dynamicPanchang[0].value}\n• Nakshatra: ${dynamicPanchang[1].value}\n• Abhijit Muhurat: ${dynamicTimes[3].value}\n• Rahu Kaal: ${dynamicTimes[0].value}\n\nShared via AstroParihar App ✨`,
      });
    } catch {}
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="panchang.screen">
      <AppBar
        title="Panchang"
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
            <Text style={{ color: colors.goldAccent, fontSize: 13, fontWeight: '600' }}>Vikram Samvat 2081 • Vedic Calendar</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>{dynamicPanchang[0]?.value || 'Shukla Paksha'}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 11 }}>{locationName} • IST (UTC+5:30)</Text>
          </View>
        </LinearGradient>

        <View style={{ marginHorizontal: 20, marginTop: 12, marginBottom: 8 }}>
          <SectionTitle color={colors.textPrimary}>Panchang Details</SectionTitle>
          <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
            {dynamicPanchang.map((p) => (
              <View
                key={p.label}
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
          <SectionTitle color={colors.textPrimary}>Sun &amp; Moon Timings</SectionTitle>
          <View style={{ marginTop: 12, flexDirection: 'row' }}>
            {dynamicSunMoon.map((s) => (
              <View
                key={s.label}
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
          <SectionTitle color={colors.textPrimary}>Auspicious &amp; Inauspicious Times</SectionTitle>
          <View style={{ height: 12 }} />
          {dynamicTimes.map((t) => {
            const isGood = t.label === 'Abhijit Muhurat';
            return (
              <View
                key={t.label}
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
                  <Text style={{ color: t.color, fontSize: 10, fontWeight: '600' }}>{isGood ? 'Auspicious' : 'Avoid'}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ marginHorizontal: 20, marginVertical: 8 }}>
          <SectionTitle color={colors.textPrimary}>Today&apos;s Choghadiya</SectionTitle>
          <Text style={{ marginTop: 4, color: colors.textMuted, fontSize: 12 }}>Day Choghadiya (Sunrise to Sunset)</Text>
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

        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <OutlinedButton
            testID="panchang.share"
            label="Share Today's Panchang"
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
