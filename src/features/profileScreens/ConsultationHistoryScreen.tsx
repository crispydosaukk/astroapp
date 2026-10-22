/**
 * Port of lib/presentation/profile_screens/consultation_history_screen.dart
 * Tabs: All / Stats. SOURCE_INERT: "Book Again".
 */
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { AppBar } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { LinearProgress } from '@/components/common';
import { TabBar, TabPager } from '@/components/Tabs';
import { Text } from '@/components/Text';
import { pop } from '@/navigation/routes';
import { AppColors, withAlpha } from '@/theme/colors';
import { SOURCE_INERT } from '@/utils/sourceInert';

const CONSULTATIONS = [
  { astrologer: 'Swami Shankarananda Giri', type: 'Chat', topic: 'Career & Job Change', duration: '18 min', amount: '₹270', date: 'Today, 10:30 AM', rating: 5, status: 'Completed', emoji: '🧘', color: '#9370DB' },
  { astrologer: 'Pandit Radhey Shyam Chaturvedi', type: 'Voice Call', topic: 'Marriage Timing', duration: '25 min', amount: '₹300', date: '08 Jan 2025', rating: 5, status: 'Completed', emoji: '🔮', color: '#FFD700' },
  { astrologer: 'Dr. Meenakshi Devi', type: 'Chat', topic: 'Health & Remedies', duration: '12 min', amount: '₹216', date: '02 Jan 2025', rating: 4, status: 'Completed', emoji: '🌸', color: '#FF6B6B' },
  { astrologer: 'Jyotish Acharya Suresh', type: 'Voice Call', topic: 'Business Astrology', duration: '30 min', amount: '₹450', date: '28 Dec 2024', rating: 4, status: 'Completed', emoji: '🌙', color: '#4FC3F7' },
  { astrologer: 'Swami Shankarananda Giri', type: 'AI Chat', topic: 'Saturn Transit Effects', duration: '—', amount: 'Free', date: '20 Dec 2024', rating: 0, status: 'Completed', emoji: '🤖', color: '#81C784' },
];

function SummaryCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: withAlpha(color, 20), borderWidth: 1, borderColor: withAlpha(color, 60), alignItems: 'center' }}>
      <Text style={{ color, fontSize: 16, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: AppColors.textMuted, fontSize: 10 }}>{label}</Text>
    </View>
  );
}

function StatSection({ title, items }: { title: string; items: Array<{ label: string; count: number; color: string }> }) {
  const total = items.reduce((s, i) => s + i.count, 0);
  return (
    <View>
      <Text style={{ color: AppColors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>{title}</Text>
      <View style={{ padding: 16, borderRadius: 18, backgroundColor: AppColors.surfaceDark, borderWidth: 1, borderColor: AppColors.goldBorder }}>
        {items.map((it) => (
          <View key={it.label} style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ width: 80, color: AppColors.textSecondary, fontSize: 12 }}>{it.label}</Text>
            <View style={{ flex: 1 }}><LinearProgress value={it.count / total} height={8} radius={4} color={it.color} backgroundColor={AppColors.surfaceVariantDark} /></View>
            <Text style={{ marginLeft: 10, color: it.color, fontSize: 12, fontWeight: '700' }}>{String(it.count)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ConsultationHistoryScreen() {
  const [tab, setTab] = useState(0);
  return (
    <View style={{ flex: 1, backgroundColor: AppColors.backgroundDark }} testID="consultationHistory.screen">
      <AppBar
        title="Consultation History"
        onBack={pop}
        testIDPrefix="consultationHistory"
        bottom={<TabBar testIDPrefix="consultationHistory.tab" tabs={['All', 'Stats']} index={tab} onChange={setTab} indicatorStyle="underline" indicatorColor={AppColors.goldAccent} labelColor={AppColors.goldAccent} unselectedLabelColor={AppColors.textMuted} fontSize={13} fontWeight="600" />}
      />
      <TabPager index={tab} onChange={setTab}>
        {[
          <ScrollView key="all" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <SummaryCard value="12" label="Total" color={AppColors.goldAccent} />
              <SummaryCard value="8h 45m" label="Time" color="#4FC3F7" />
              <SummaryCard value="₹1,236" label="Spent" color={AppColors.error} />
            </View>
            <View style={{ height: 20 }} />
            {CONSULTATIONS.map((c, idx) => (
              <View key={idx} testID={`consultationHistory.card.${idx}`} style={{ marginBottom: 12, padding: 14, borderRadius: 18, backgroundColor: AppColors.surfaceDark, borderWidth: 1, borderColor: AppColors.goldBorder }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: withAlpha(c.color, 25), alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 20 }}>{c.emoji}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text numberOfLines={1} style={{ color: AppColors.textPrimary, fontSize: 13, fontWeight: '600' }}>{c.astrologer}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: withAlpha(c.color, 25) }}>
                        <Text style={{ color: c.color, fontSize: 9, fontWeight: '600' }}>{c.type}</Text>
                      </View>
                      <Text style={{ marginLeft: 6, color: AppColors.textMuted, fontSize: 10 }}>{c.date}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: AppColors.goldAccent, fontSize: 14, fontWeight: '700' }}>{c.amount}</Text>
                    <Text style={{ color: AppColors.textMuted, fontSize: 11 }}>{c.duration}</Text>
                  </View>
                </View>
                <View style={{ marginTop: 10, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: AppColors.surfaceVariantDark }}>
                  <Text style={{ color: AppColors.textSecondary, fontSize: 11 }}>{`Topic: ${c.topic}`}</Text>
                </View>
                {c.rating > 0 ? (
                  <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
                    {[0, 1, 2, 3, 4].map((i) => <AppIcon key={i} name={i < c.rating ? 'star_rounded' : 'star_outline_rounded'} color={AppColors.goldAccent} size={16} />)}
                    <Text style={{ marginLeft: 8, flex: 1, color: AppColors.textMuted, fontSize: 11 }}>Your rating</Text>
                    <Pressable testID={`consultationHistory.card.${idx}.bookAgain`} onPress={SOURCE_INERT('consultationHistory.bookAgain')} style={{ paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ color: AppColors.goldAccent, fontSize: 11, fontWeight: '600' }}>Book Again</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ))}
          </ScrollView>,
          <ScrollView key="stats" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100, gap: 20 }}>
            <StatSection title="Consultation Types" items={[{ label: 'Chat', count: 7, color: '#9370DB' }, { label: 'Voice Call', count: 4, color: '#4FC3F7' }, { label: 'AI Chat', count: 1, color: '#81C784' }]} />
            <StatSection title="Top Topics" items={[{ label: 'Career', count: 4, color: AppColors.goldAccent }, { label: 'Marriage', count: 3, color: '#FF6B6B' }, { label: 'Finance', count: 2, color: '#81C784' }, { label: 'Health', count: 2, color: '#FFB347' }, { label: 'Other', count: 1, color: AppColors.textMuted }]} />
            <View>
              <Text style={{ color: AppColors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>Most Consulted</Text>
              <View style={{ borderRadius: 18, backgroundColor: AppColors.surfaceDark, borderWidth: 1, borderColor: AppColors.goldBorder }}>
                {[['🧘', 'Swami Shankarananda Giri', '5 sessions', '#9370DB'], ['🔮', 'Pandit Radhey Shyam', '4 sessions', '#FFD700'], ['🌸', 'Dr. Meenakshi Devi', '3 sessions', '#FF6B6B']].map(([e, n, s, c], i) => (
                  <View key={n}>
                    {i > 0 ? <View style={{ height: 1, marginLeft: 60, backgroundColor: '#1E2A40' }} /> : null}
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, minHeight: 56 }}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: withAlpha(c, 25), alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 18 }}>{e}</Text>
                      </View>
                      <Text style={{ marginLeft: 16, flex: 1, color: AppColors.textPrimary, fontSize: 13, fontWeight: '600' }}>{n}</Text>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, backgroundColor: withAlpha(c, 25) }}>
                        <Text style={{ color: c, fontSize: 11, fontWeight: '600' }}>{s}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>,
        ]}
      </TabPager>
    </View>
  );
}
