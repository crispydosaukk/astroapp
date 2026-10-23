/**
 * Port of lib/presentation/profile_screens/consultation_history_screen.dart
 * Dynamic consultation history with interactive "Book Again" re-booking.
 * Adapts to Light Vedic & Dark Cosmic themes.
 */
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { LinearProgress } from '@/components/common';
import { TabBar, TabPager } from '@/components/Tabs';
import { Text } from '@/components/Text';
import { AppRoutes, pop, push } from '@/navigation/routes';
import { withAlpha } from '@/theme/colors';
import { useTranslation } from '@/theme/languageStore';
import { useThemeColors } from '@/theme/themeStore';

const CONSULTATIONS = [
  { id: 'c1', astrologer: 'Swami Shankarananda Giri', type: 'Chat', topic: 'Career & Job Change', duration: '18 min', amount: '₹270', date: 'Today, 10:30 AM', rating: 5, status: 'Completed', emoji: '🧘', color: '#9370DB' },
  { id: 'c2', astrologer: 'Pandit Radhey Shyam Chaturvedi', type: 'Voice Call', topic: 'Marriage Timing', duration: '25 min', amount: '₹300', date: '08 Jan 2026', rating: 5, status: 'Completed', emoji: '🔮', color: '#FFD700' },
  { id: 'c3', astrologer: 'Dr. Meenakshi Devi', type: 'Chat', topic: 'Health & Remedies', duration: '12 min', amount: '₹216', date: '02 Jan 2026', rating: 4, status: 'Completed', emoji: '🌸', color: '#FF6B6B' },
  { id: 'c4', astrologer: 'Jyotish Acharya Suresh', type: 'Voice Call', topic: 'Business Astrology', duration: '30 min', amount: '₹450', date: '28 Dec 2025', rating: 4, status: 'Completed', emoji: '🌙', color: '#4FC3F7' },
  { id: 'c5', astrologer: 'Swami Shankarananda Giri', type: 'AI Chat', topic: 'Saturn Transit Effects', duration: '15 min', amount: 'Free', date: '20 Dec 2025', rating: 5, status: 'Completed', emoji: '🤖', color: '#81C784' },
];

function SummaryCard({ value, label, color, colors }: { value: string; label: string; color: string; colors: any }) {
  return (
    <View
      style={{
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: withAlpha(color, colors.isLight ? 20 : 25),
        borderWidth: 1,
        borderColor: withAlpha(color, 60),
        alignItems: 'center',
      }}
    >
      <Text style={{ color, fontSize: 17, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 10 }}>{label}</Text>
    </View>
  );
}

function StatSection({ title, items, colors }: { title: string; items: Array<{ label: string; count: number; color: string }>; colors: any }) {
  const total = items.reduce((s, i) => s + i.count, 0);
  return (
    <View>
      <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>{title}</Text>
      <View style={{ padding: 16, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder }}>
        {items.map((it) => (
          <View key={it.label} style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ width: 80, color: colors.textSecondary, fontSize: 12 }}>{it.label}</Text>
            <View style={{ flex: 1 }}>
              <LinearProgress value={it.count / total} height={8} radius={4} color={it.color} backgroundColor={colors.surfaceVariant} />
            </View>
            <Text style={{ marginLeft: 10, color: it.color, fontSize: 12, fontWeight: '700' }}>{String(it.count)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ConsultationHistoryScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [tab, setTab] = useState(0);

  const handleBookAgain = (c: typeof CONSULTATIONS[0]) => {
    push(AppRoutes.consultationScreen, {
      name: c.astrologer,
      type: c.type === 'Voice Call' ? 'call' : 'chat',
      price: c.amount,
      rate: 15,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="consultationHistory.screen">
      <AppBar
        title={t('profile.consultationHistory', 'Consultation History')}
        onBack={pop}
        testIDPrefix="consultationHistory"
        backgroundColor={colors.background}
        backColor={colors.textPrimary}
        bottom={
          <TabBar
            testIDPrefix="consultationHistory.tab"
            tabs={['All Sessions', 'Analytics']}
            index={tab}
            onChange={setTab}
            indicatorStyle="underline"
            indicatorColor={colors.goldAccent}
            labelColor={colors.goldAccent}
            unselectedLabelColor={colors.textMuted}
            fontSize={13}
            fontWeight="700"
          />
        }
      />

      <TabPager index={tab} onChange={setTab}>
        {[
          /* Tab 0: All */
          <ScrollView key="all" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: Math.max(150, insets.bottom + 90) }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <SummaryCard value="12" label="Sessions" color={colors.goldAccent} colors={colors} />
              <SummaryCard value="8h 45m" label="Talk Time" color="#4FC3F7" colors={colors} />
              <SummaryCard value="₹1,236" label="Total Spent" color="#CF4444" colors={colors} />
            </View>

            <View style={{ height: 18 }} />

            {CONSULTATIONS.map((c, idx) => (
              <View
                key={c.id || idx}
                testID={`consultationHistory.card.${idx}`}
                style={{
                  marginBottom: 14,
                  padding: 16,
                  borderRadius: 20,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  shadowColor: '#000',
                  shadowOpacity: colors.isLight ? 0.04 : 0.2,
                  shadowRadius: 8,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: withAlpha(c.color, colors.isLight ? 25 : 30),
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>{c.emoji}</Text>
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text numberOfLines={1} style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>
                      {c.astrologer}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                      <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: withAlpha(c.color, 25) }}>
                        <Text style={{ color: c.color, fontSize: 10, fontWeight: '700' }}>{c.type}</Text>
                      </View>
                      <Text style={{ marginLeft: 6, color: colors.textMuted, fontSize: 10 }}>{c.date}</Text>
                    </View>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: colors.goldAccent, fontSize: 15, fontWeight: '800' }}>{c.amount}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11 }}>{c.duration}</Text>
                  </View>
                </View>

                <View style={{ marginTop: 10, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.surfaceVariant }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{`Topic: ${c.topic}`}</Text>
                </View>

                <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <AppIcon key={i} name={i < c.rating ? 'star_rounded' : 'star_outline_rounded'} color={colors.goldAccent} size={16} />
                  ))}
                  <Text style={{ marginLeft: 8, flex: 1, color: colors.textMuted, fontSize: 11 }}>Completed</Text>
                  <Pressable
                    testID={`consultationHistory.card.${idx}.bookAgain`}
                    onPress={() => handleBookAgain(c)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 5,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: colors.goldAccent,
                      backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 15 : 20),
                    }}
                  >
                    <Text style={{ color: colors.goldAccent, fontSize: 11, fontWeight: '700' }}>
                      {t('common.bookAgain', 'Book Again')}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>,

          /* Tab 1: Stats */
          <ScrollView key="stats" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: Math.max(150, insets.bottom + 90), gap: 20 }}>
            <StatSection
              title="Consultation Modes"
              items={[{ label: 'Chat', count: 7, color: '#9370DB' }, { label: 'Voice Call', count: 4, color: '#4FC3F7' }, { label: 'AI Chat', count: 1, color: '#81C784' }]}
              colors={colors}
            />
            <StatSection
              title="Key Life Inquiries"
              items={[{ label: 'Career', count: 4, color: colors.goldAccent }, { label: 'Marriage', count: 3, color: '#FF6B6B' }, { label: 'Finance', count: 2, color: '#81C784' }, { label: 'Health', count: 2, color: '#FFB347' }, { label: 'Other', count: 1, color: colors.textMuted }]}
              colors={colors}
            />
          </ScrollView>,
        ]}
      </TabPager>
    </View>
  );
}
