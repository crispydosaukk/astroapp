/**
 * Port of lib/presentation/services_screen/services_screen.dart
 * 2-col grid with exact route mapping, fully theme-adaptive for Light Vedic & Dark Cosmic.
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Dimensions, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { Text } from '@/components/Text';
import { AppRoutes, push } from '@/navigation/routes';
import { withAlpha } from '@/theme/colors';
import { useTranslation } from '@/theme/languageStore';
import { useThemeColors } from '@/theme/themeStore';
import { SOURCE_INERT } from '@/utils/sourceInert';

export const SERVICES = [
  { icon: 'auto_stories', name: 'My Kundli', desc: 'Your complete birth chart', route: AppRoutes.myKundliScreen, color: '#9370DB' },
  { icon: 'favorite_border', name: 'Match Kundli', desc: 'Vedic compatibility', route: AppRoutes.matchKundliScreen, color: '#FF6B6B' },
  { icon: 'wb_sunny_outlined', name: 'Daily Horoscope', desc: "Today's cosmic guidance", route: AppRoutes.horoscopeScreen, color: '#FFB347' },
  { icon: 'calendar_today_outlined', name: 'Panchang', desc: 'Vedic almanac', route: AppRoutes.panchangScreen, color: '#4FC3F7' },
  { icon: 'auto_awesome', name: 'AI Astrologer', desc: '24/7 AI guidance', route: AppRoutes.aiChatScreen, color: '#8B1A1A' },
  { icon: 'people_outline', name: 'Talk to Astrologer', desc: 'Live consultations', route: AppRoutes.liveAstrologersScreen, color: '#81C784' },
  { icon: 'work_outline', name: 'Career Astrology', desc: 'Career path guidance', route: AppRoutes.careerAstrologyScreen, color: '#FFD700' },
  { icon: 'ring_volume_outlined', name: 'Marriage Astrology', desc: 'Marriage timing & match', route: AppRoutes.marriageAstrologyScreen, color: '#FF6B6B' },
  { icon: 'business_center_outlined', name: 'Business Astrology', desc: 'Business success timing', route: AppRoutes.businessAstrologyScreen, color: '#4FC3F7' },
  { icon: 'account_balance_outlined', name: 'Finance Astrology', desc: 'Wealth & investment', route: AppRoutes.financeAstrologyScreen, color: '#81C784' },
  { icon: 'style_outlined', name: 'Tarot', desc: 'Tarot card readings', route: AppRoutes.tarotScreen, color: '#9370DB' },
  { icon: 'tag_outlined', name: 'Numerology', desc: 'Numbers & destiny', route: AppRoutes.numerologyScreen, color: '#FFB347' },
  { icon: 'home_outlined', name: 'Vastu', desc: 'Sacred architecture', route: AppRoutes.remediesScreen, color: '#81C784' },
  { icon: 'diamond_outlined', name: 'Gemstones', desc: 'Planetary gemstones', route: AppRoutes.remediesScreen, color: '#4FC3F7' },
  { icon: 'spa_outlined', name: 'Rudraksha', desc: 'Sacred Shiva seeds', route: AppRoutes.remediesScreen, color: '#8B4513' },
  { icon: 'music_note_outlined', name: 'Mantra', desc: 'Sacred sound healing', route: AppRoutes.remediesScreen, color: '#9370DB' },
  { icon: 'hexagon_outlined', name: 'Yantra', desc: 'Sacred geometry', route: AppRoutes.remediesScreen, color: '#FFD700' },
  { icon: 'local_fire_department_outlined', name: 'Homa & Puja', desc: 'Sacred fire rituals', route: AppRoutes.remediesScreen, color: '#FF6B35' },
  { icon: 'self_improvement', name: 'Ishta Devata', desc: 'Personal deity finder', route: AppRoutes.remediesScreen, color: '#FFB347' },
  { icon: 'volunteer_activism_outlined', name: 'Dāna & Seva', desc: 'Vedic charity planner', route: AppRoutes.remediesScreen, color: '#FF6B6B' },
  { icon: 'event_available_outlined', name: 'Muhurat', desc: 'Auspicious timings', route: AppRoutes.muhuratScreen, color: '#FFD700' },
  { icon: 'psychology_outlined', name: 'Spiritual Guidance', desc: 'Soul path guidance', route: AppRoutes.spiritualGuidanceScreen, color: '#9370DB' },
  { icon: 'description_outlined', name: 'Astrology Reports', desc: 'Detailed PDF reports', route: AppRoutes.astrologyReportsScreen, color: '#4FC3F7' },
];

function StatChip({ value, label, colors }: { value: string; label: string; colors: any }) {
  return (
    <View
      style={{
        marginRight: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignItems: 'center',
        backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 20 : 25),
        borderWidth: 1,
        borderColor: colors.cardBorder,
      }}
    >
      <Text style={{ color: colors.goldAccent, fontSize: 13, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 10 }}>{label}</Text>
    </View>
  );
}

export default function ServicesScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [w, setW] = useState(Dimensions.get('window').width - 40);
  const cellW = Math.max(140, (w - 12) / 2);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="services.screen">
      <AppBar
        title={t('nav.services', 'Services')}
        backgroundColor={colors.background}
        backColor={colors.textPrimary}
        actions={[{ icon: 'search_rounded', color: colors.goldAccent, onPress: SOURCE_INERT('services.search'), testID: 'services.search' }]}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={
            colors.isLight
              ? ['#FFFDF9', '#F5EFE6']
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
          }}
        >
          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '800' }}>AstroParihar Services</Text>
          <Text style={{ marginTop: 6, color: colors.textSecondary, fontSize: 13 }}>Everything you need for your personal astrology journey.</Text>
          <View style={{ marginTop: 12, flexDirection: 'row' }}>
            <StatChip value="23+" label="Services" colors={colors} />
            <StatChip value="50K+" label="Consultations" colors={colors} />
            <StatChip value="4.9★" label="Rating" colors={colors} />
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: Math.max(160, insets.bottom + 110) }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
            {SERVICES.map((s) => (
              <Pressable
                key={s.name}
                testID={`services.card.${s.name.replace(/[^A-Za-z]/g, '')}`}
                onPress={() => push(s.route)}
                style={{
                  width: cellW,
                  minHeight: 114,
                    padding: 14,
                    borderRadius: 18,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: withAlpha(s.color, 70),
                    justifyContent: 'space-between',
                    shadowColor: '#000',
                    shadowOpacity: colors.isLight ? 0.03 : 0.2,
                    shadowRadius: 6,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: withAlpha(s.color, colors.isLight ? 20 : 30), alignItems: 'center', justifyContent: 'center' }}>
                      <AppIcon name={s.icon} color={s.color} size={18} />
                    </View>
                    <AppIcon name="arrow_forward_ios_rounded" color={withAlpha(s.color, 150)} size={12} />
                  </View>
                  <View>
                    <Text numberOfLines={1} style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>{s.name}</Text>
                    <Text numberOfLines={1} style={{ color: colors.textMuted, fontSize: 11 }}>{s.desc}</Text>
                  </View>
                </Pressable>
              ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
