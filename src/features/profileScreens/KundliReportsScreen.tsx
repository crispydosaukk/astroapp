/**
 * Port of lib/presentation/profile_screens/kundli_reports_screen.dart
 * Tabs: My Reports / Get Reports. View/Download icons and "Buy" pills are plain Containers in source
 * (no gesture handlers) → rendered display-only.
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { AppBar } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { TabBar, TabPager } from '@/components/Tabs';
import { Text } from '@/components/Text';
import { pop } from '@/navigation/routes';
import { AppColors, withAlpha } from '@/theme/colors';

const REPORTS = [
  { title: 'Comprehensive Life Report', subtitle: 'Priya Sharma • 2024', pages: '48 pages', date: '12 Jan 2025', status: 'Ready', emoji: '📜', color: '#9370DB', size: '2.4 MB' },
  { title: 'Career & Finance Kundli', subtitle: 'Priya Sharma • 2024', pages: '32 pages', date: '05 Mar 2025', status: 'Ready', emoji: '💼', color: '#FFD700', size: '1.8 MB' },
  { title: 'Marriage & Relationship Report', subtitle: 'Priya Sharma • 2024', pages: '28 pages', date: '20 Apr 2025', status: 'Ready', emoji: '❤️', color: '#FF6B6B', size: '1.5 MB' },
  { title: 'Annual Dasha Prediction 2025', subtitle: 'Priya Sharma • 2025', pages: '20 pages', date: '01 Jan 2025', status: 'Processing', emoji: '🌟', color: '#4FC3F7', size: '—' },
];
const CATEGORIES = [
  { emoji: '📜', title: 'Comprehensive Life Report', desc: 'Complete birth chart analysis with predictions', price: '₹499', pages: '48 pages', color: '#9370DB' },
  { emoji: '💼', title: 'Career & Finance Report', desc: 'Career path, business timing & financial outlook', price: '₹349', pages: '32 pages', color: '#FFD700' },
  { emoji: '❤️', title: 'Marriage & Love Report', desc: 'Relationship timing, compatibility & marriage yoga', price: '₹349', pages: '28 pages', color: '#FF6B6B' },
  { emoji: '🌟', title: 'Annual Dasha Report', desc: 'Year-wise planetary period predictions', price: '₹249', pages: '20 pages', color: '#4FC3F7' },
  { emoji: '🏥', title: 'Health & Longevity Report', desc: 'Health patterns, remedies & wellness guidance', price: '₹299', pages: '24 pages', color: '#81C784' },
  { emoji: '🏠', title: 'Vastu & Property Report', desc: 'Home direction, property timing & Vastu remedies', price: '₹399', pages: '36 pages', color: '#FFB347' },
];

export function StatCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: withAlpha(color, 20), borderWidth: 1, borderColor: withAlpha(color, 60), alignItems: 'center' }}>
      <Text style={{ color, fontSize: 20, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: AppColors.textMuted, fontSize: 10 }}>{label}</Text>
    </View>
  );
}
export function MiniChip({ text, color }: { text: string; color: string }) {
  return (
    <View style={{ marginRight: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: withAlpha(color, 20) }}>
      <Text style={{ color, fontSize: 9, fontWeight: '600' }}>{text}</Text>
    </View>
  );
}
function IconBox({ icon, color }: { icon: string; color: string }) {
  return (
    <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: withAlpha(color, 20), alignItems: 'center', justifyContent: 'center' }}>
      <AppIcon name={icon} color={color} size={16} />
    </View>
  );
}

export default function KundliReportsScreen() {
  const [tab, setTab] = useState(0);
  return (
    <View style={{ flex: 1, backgroundColor: AppColors.backgroundDark }} testID="kundliReports.screen">
      <AppBar
        title="Kundli Reports"
        onBack={pop}
        testIDPrefix="kundliReports"
        bottom={<TabBar testIDPrefix="kundliReports.tab" tabs={['My Reports', 'Get Reports']} index={tab} onChange={setTab} indicatorStyle="underline" indicatorColor={AppColors.goldAccent} labelColor={AppColors.goldAccent} unselectedLabelColor={AppColors.textMuted} fontSize={13} fontWeight="600" />}
      />
      <TabPager index={tab} onChange={setTab}>
        {[
          <ScrollView key="mine" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <StatCard value="4" label="Total Reports" color="#9370DB" />
              <StatCard value="3" label="Ready" color={AppColors.success} />
              <StatCard value="1" label="Processing" color={AppColors.warning} />
            </View>
            <View style={{ height: 20 }} />
            {REPORTS.map((r) => {
              const ready = r.status === 'Ready';
              return (
                <View key={r.title} style={{ marginBottom: 14, padding: 16, borderRadius: 18, backgroundColor: AppColors.surfaceDark, borderWidth: 1, borderColor: AppColors.goldBorder, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: withAlpha(r.color, 25), alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 24 }}>{r.emoji}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={{ color: AppColors.textPrimary, fontSize: 14, fontWeight: '600' }}>{r.title}</Text>
                    <Text style={{ marginTop: 3, color: AppColors.textMuted, fontSize: 11 }}>{r.subtitle}</Text>
                    <View style={{ marginTop: 6, flexDirection: 'row' }}>
                      <MiniChip text={r.pages} color={AppColors.textMuted} />
                      <MiniChip text={r.date} color={AppColors.textMuted} />
                      <MiniChip text={r.status} color={ready ? AppColors.success : AppColors.warning} />
                    </View>
                  </View>
                  <View style={{ marginLeft: 8, alignItems: 'center' }}>
                    {ready ? (
                      <>
                        <IconBox icon="visibility_outlined" color={AppColors.goldAccent} />
                        <View style={{ height: 6 }} />
                        <IconBox icon="download_outlined" color={AppColors.textSecondary} />
                      </>
                    ) : (
                      <ActivityIndicator size="small" color={AppColors.warning} />
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>,
          <ScrollView key="get" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 }}>
            {CATEGORIES.map((c) => (
              <View key={c.title} style={{ marginBottom: 14, padding: 16, borderRadius: 18, backgroundColor: AppColors.surfaceDark, borderWidth: 1, borderColor: AppColors.goldBorder, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: withAlpha(c.color, 25), alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 24 }}>{c.emoji}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ color: AppColors.textPrimary, fontSize: 13, fontWeight: '600' }}>{c.title}</Text>
                  <Text style={{ marginTop: 3, color: AppColors.textMuted, fontSize: 11 }}>{c.desc}</Text>
                  <Text style={{ marginTop: 6, color: AppColors.textSecondary, fontSize: 10 }}>{c.pages}</Text>
                </View>
                <View style={{ marginLeft: 8, alignItems: 'flex-end' }}>
                  <Text style={{ color: AppColors.goldAccent, fontSize: 16, fontWeight: '700' }}>{c.price}</Text>
                  <LinearGradient colors={[AppColors.primary, AppColors.primaryLight]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ marginTop: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                    <Text style={{ color: AppColors.textPrimary, fontSize: 12, fontWeight: '600' }}>Buy</Text>
                  </LinearGradient>
                </View>
              </View>
            ))}
          </ScrollView>,
        ]}
      </TabPager>
    </View>
  );
}
