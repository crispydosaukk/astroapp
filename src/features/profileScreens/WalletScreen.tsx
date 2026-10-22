/**
 * Port of lib/presentation/profile_screens/wallet_screen.dart
 * - amount selection (default ₹500) → "Add ₹X to Wallet" → payment sheet
 * - payment sheet rows close sheet and show SnackBar "Payment gateway integration required" (source behaviour;
 *   no gateway is invented)
 * - Payment method list tiles have no onTap in source → display only
 * SOURCE_INERT: coupon "Apply".
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { AppBar } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { ElevatedButton } from '@/components/common';
import { BottomSheet, showSnackBar } from '@/components/overlays';
import { TabBar, TabPager } from '@/components/Tabs';
import { Text } from '@/components/Text';
import { pop } from '@/navigation/routes';
import { AppColors, withAlpha } from '@/theme/colors';
import { SOURCE_INERT } from '@/utils/sourceInert';

const TRANSACTIONS = [
  { type: 'debit', title: 'Chat with Pandit Radhey Shyam', subtitle: 'Consultation • 18 min', amount: '-₹270', date: 'Today, 10:30 AM', icon: '💬' },
  { type: 'credit', title: 'Wallet Recharge', subtitle: 'UPI Payment', amount: '+₹500', date: 'Yesterday, 3:15 PM', icon: '💳' },
  { type: 'debit', title: 'Comprehensive Life Report', subtitle: 'Report Purchase', amount: '-₹499', date: '12 Jan 2025', icon: '📜' },
  { type: 'credit', title: 'Referral Bonus', subtitle: 'Friend joined AstroParihar', amount: '+₹50', date: '10 Jan 2025', icon: '🎁' },
  { type: 'debit', title: 'Call with Swami Shankarananda', subtitle: 'Voice Consultation • 25 min', amount: '-₹375', date: '08 Jan 2025', icon: '📞' },
  { type: 'credit', title: 'Wallet Recharge', subtitle: 'Credit Card', amount: '+₹1000', date: '05 Jan 2025', icon: '💳' },
  { type: 'debit', title: 'Career & Finance Report', subtitle: 'Report Purchase', amount: '-₹349', date: '03 Jan 2025', icon: '📜' },
];
const ADD_OPTIONS = [
  { amount: '₹100', value: 100, bonus: null },
  { amount: '₹200', value: 200, bonus: null },
  { amount: '₹500', value: 500, bonus: '₹25 bonus' },
  { amount: '₹1000', value: 1000, bonus: '₹75 bonus' },
  { amount: '₹2000', value: 2000, bonus: '₹200 bonus' },
  { amount: '₹5000', value: 5000, bonus: '₹600 bonus' },
];

function WalletStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: AppColors.textPrimary, fontSize: 14, fontWeight: '700' }}>{value}</Text>
      <Text style={{ color: AppColors.textMuted, fontSize: 10 }}>{label}</Text>
    </View>
  );
}

export default function WalletScreen() {
  const [tab, setTab] = useState(0);
  const [selected, setSelected] = useState(500);
  const [sheet, setSheet] = useState(false);
  const [gridW, setGridW] = useState(0);
  const cell = gridW > 0 ? (gridW - 20) / 3 : 0;

  return (
    <View style={{ flex: 1, backgroundColor: AppColors.backgroundDark }} testID="wallet.screen">
      <AppBar
        title="Wallet"
        onBack={pop}
        testIDPrefix="wallet"
        bottom={<TabBar testIDPrefix="wallet.tab" tabs={['Wallet', 'Transactions']} index={tab} onChange={setTab} indicatorStyle="underline" indicatorColor={AppColors.goldAccent} labelColor={AppColors.goldAccent} unselectedLabelColor={AppColors.textMuted} fontSize={13} fontWeight="600" />}
      />
      <TabPager index={tab} onChange={setTab}>
        {[
          <ScrollView key="wallet" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 }}>
            <LinearGradient colors={[withAlpha(AppColors.primary, 180), AppColors.surfaceVariantDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 24, borderRadius: 24, borderWidth: 1, borderColor: AppColors.goldBorder, alignItems: 'center' }}>
              <Text style={{ color: AppColors.textSecondary, fontSize: 13 }}>Available Balance</Text>
              <Text testID="wallet.balance" style={{ marginTop: 8, color: AppColors.goldAccent, fontSize: 42, fontWeight: '800' }}>₹450</Text>
              <View style={{ marginTop: 16, alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center' }}>
                <WalletStat value="₹1,493" label="Total Added" />
                <View style={{ width: 1, height: 30, backgroundColor: AppColors.goldBorder }} />
                <WalletStat value="₹1,043" label="Total Spent" />
                <View style={{ width: 1, height: 30, backgroundColor: AppColors.goldBorder }} />
                <WalletStat value="₹125" label="Bonus Earned" />
              </View>
            </LinearGradient>

            <Text style={{ marginTop: 20, color: AppColors.textPrimary, fontSize: 16, fontWeight: '700' }}>Add Money</Text>
            <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }} onLayout={(e) => setGridW(e.nativeEvent.layout.width)}>
              {cell > 0 && ADD_OPTIONS.map((o) => {
                const sel = selected === o.value;
                return (
                  <Pressable key={o.value} testID={`wallet.amount.${o.value}`} onPress={() => setSelected(o.value)} style={{ width: cell, height: cell / 1.8, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: sel ? withAlpha(AppColors.primary, 80) : AppColors.surfaceDark, borderWidth: 1, borderColor: sel ? AppColors.goldAccent : AppColors.goldBorder }}>
                    <Text style={{ color: sel ? AppColors.goldAccent : AppColors.textPrimary, fontSize: 14, fontWeight: '700' }}>{o.amount}</Text>
                    {o.bonus ? <Text style={{ color: AppColors.success, fontSize: 9 }}>{o.bonus}</Text> : null}
                  </Pressable>
                );
              })}
            </View>
            <ElevatedButton testID="wallet.addMoney" label={`Add ₹${selected} to Wallet`} onPress={() => setSheet(true)} radius={14} style={{ marginTop: 16 }} />

            <Text style={{ marginTop: 20, color: AppColors.textPrimary, fontSize: 16, fontWeight: '700' }}>Payment Methods</Text>
            <View style={{ marginTop: 12, borderRadius: 18, backgroundColor: AppColors.surfaceDark, borderWidth: 1, borderColor: AppColors.goldBorder }}>
              {[['💳', 'Credit / Debit Card', 'Visa, Mastercard, RuPay'], ['📱', 'UPI', 'GPay, PhonePe, Paytm'], ['🏦', 'Net Banking', 'All major banks']].map(([e, t, s], i) => (
                <View key={t}>
                  {i > 0 ? <View style={{ height: 1, marginLeft: 60, backgroundColor: '#1E2A40' }} /> : null}
                  <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, minHeight: 64 }}>
                    <Text style={{ fontSize: 22 }}>{e}</Text>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                      <Text style={{ color: AppColors.textPrimary, fontSize: 13, fontWeight: '600' }}>{t}</Text>
                      <Text style={{ color: AppColors.textMuted, fontSize: 11 }}>{s}</Text>
                    </View>
                    <AppIcon name="chevron_right_rounded" color={AppColors.textMuted} size={18} />
                  </View>
                </View>
              ))}
            </View>

            <View style={{ marginTop: 20, padding: 16, borderRadius: 18, backgroundColor: withAlpha(AppColors.goldAccent, 15), borderWidth: 1, borderColor: AppColors.goldBorder, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 28 }}>🎟️</Text>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={{ color: AppColors.textPrimary, fontSize: 14, fontWeight: '600' }}>Have a Coupon?</Text>
                <Text style={{ color: AppColors.textMuted, fontSize: 11 }}>Apply coupon code for extra bonus</Text>
              </View>
              <Pressable testID="wallet.coupon.apply" onPress={SOURCE_INERT('wallet.coupon.apply')} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
                <Text style={{ color: AppColors.goldAccent, fontWeight: '600', fontSize: 14 }}>Apply</Text>
              </Pressable>
            </View>
          </ScrollView>,
          <ScrollView key="tx" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {[['Total Added', '₹1,493', AppColors.success], ['Total Spent', '₹1,043', AppColors.error]].map(([l, v, c]) => (
                <View key={l} style={{ flex: 1, padding: 16, borderRadius: 14, backgroundColor: withAlpha(c, 20), borderWidth: 1, borderColor: withAlpha(c, 60) }}>
                  <Text style={{ color: AppColors.textMuted, fontSize: 11 }}>{l}</Text>
                  <Text style={{ marginTop: 4, color: c, fontSize: 18, fontWeight: '700' }}>{v}</Text>
                </View>
              ))}
            </View>
            <Text style={{ marginTop: 20, marginBottom: 12, color: AppColors.textPrimary, fontSize: 16, fontWeight: '700' }}>Recent Transactions</Text>
            {TRANSACTIONS.map((t, i) => {
              const credit = t.type === 'credit';
              const c = credit ? AppColors.success : AppColors.error;
              return (
                <View key={i} style={{ marginBottom: 10, padding: 14, borderRadius: 14, backgroundColor: AppColors.surfaceDark, borderWidth: 1, borderColor: AppColors.goldBorder, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: withAlpha(c, 20), alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 20 }}>{t.icon}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: AppColors.textPrimary, fontSize: 13, fontWeight: '600' }}>{t.title}</Text>
                    <Text style={{ color: AppColors.textMuted, fontSize: 11 }}>{t.subtitle}</Text>
                    <Text style={{ color: AppColors.textMuted, fontSize: 10 }}>{t.date}</Text>
                  </View>
                  <Text style={{ color: c, fontSize: 15, fontWeight: '700' }}>{t.amount}</Text>
                </View>
              );
            })}
          </ScrollView>,
        ]}
      </TabPager>

      <BottomSheet visible={sheet} onClose={() => setSheet(false)} testID="wallet.paymentSheet">
        <View style={{ padding: 24, backgroundColor: AppColors.surfaceDark, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
          <Text style={{ color: AppColors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 20 }}>{`Add ₹${selected}`}</Text>
          {['💳  Credit / Debit Card', '📱  UPI (GPay, PhonePe, Paytm)', '🏦  Net Banking'].map((m, i) => (
            <Pressable
              key={m}
              testID={`wallet.paymentSheet.method.${i}`}
              onPress={() => { setSheet(false); showSnackBar('Payment gateway integration required', AppColors.surfaceVariantDark); }}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, minHeight: 56 }}
            >
              <Text style={{ flex: 1, color: AppColors.textPrimary, fontSize: 16 }}>{m}</Text>
              <AppIcon name="chevron_right_rounded" color={AppColors.textMuted} />
            </Pressable>
          ))}
          <View style={{ height: 16 }} />
        </View>
      </BottomSheet>
    </View>
  );
}
