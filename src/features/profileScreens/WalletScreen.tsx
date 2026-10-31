import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { ElevatedButton } from '@/components/common';
import { BottomSheet, showSnackBar } from '@/components/overlays';
import { TabBar, TabPager } from '@/components/Tabs';
import { Text } from '@/components/Text';
import { AppRoutes, go, pop } from '@/navigation/routes';
import { withAlpha } from '@/theme/colors';
import { useTranslation } from '@/theme/languageStore';
import { useThemeColors } from '@/theme/themeStore';
import { useAuthStore } from '@/features/auth/authStore';
import { useCurrencyStore } from '@/services/currencyStore';
import {
  getWalletBalance,
  getWalletTransactions,
  rechargeWallet,
  subscribeWallet,
  WalletTransaction,
} from '@/services/walletService';

function WalletStat({ value, label, colors }: { value: string; label: string; colors: any }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>{value}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 10 }}>{label}</Text>
    </View>
  );
}

export default function WalletScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authUser = useAuthStore((s) => s.user);
  const isAuth = Boolean(isAuthenticated && authUser && (authUser.uid || authUser.phone));

  const {
    currencyCode,
    currencySymbol,
    formatPrice,
    setCurrencyCode,
    getRechargeOptions,
  } = useCurrencyStore();

  const rechargeOptions = getRechargeOptions();

  const [tab, setTab] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(2); // default to 3rd package
  const [sheet, setSheet] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [gridW, setGridW] = useState(0);

  const activeOption = rechargeOptions[selectedIdx] || rechargeOptions[0];

  useEffect(() => {
    let isMounted = true;
    if (isAuth) {
      getWalletBalance().then((b) => {
        if (isMounted) setBalance(b);
      });
      getWalletTransactions().then((txs) => {
        if (isMounted) setTransactions(txs);
      });
    } else {
      setBalance(0);
      setTransactions([]);
    }

    const unsub = subscribeWallet((b) => {
      if (isMounted) {
        setBalance(isAuth ? b : 0);
        if (isAuth) {
          getWalletTransactions().then((txs) => {
            if (isMounted) setTransactions(txs);
          });
        }
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, [isAuth]);

  const handleRecharge = async (method: string) => {
    if (!isAuth) {
      setSheet(false);
      showSnackBar('Please sign in to recharge your wallet', '#CF4444');
      go(AppRoutes.signInScreen);
      return;
    }
    setIsProcessing(true);
    try {
      const res = await rechargeWallet(activeOption.value, method, {
        currency: currencyCode,
        displayAmount: `+${activeOption.amount}`,
        creditedINR: activeOption.valueINR,
      });
      setSheet(false);
      if (res.success) {
        setBalance(res.newBalance);
        showSnackBar(`${activeOption.amount} added via ${method}! New balance: ${formatPrice(res.newBalance)}`, colors.surfaceVariant);
        getWalletTransactions().then(setTransactions);
      } else {
        showSnackBar('Recharge failed. Please try again.', '#CF4444');
      }
    } catch {
      showSnackBar('Payment failed. Please try again.', '#CF4444');
    } finally {
      setIsProcessing(false);
    }
  };

  const cell = gridW > 0 ? (gridW - 20) / 3 : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="wallet.screen">
      <AppBar
        title={t('profile.wallet', 'Wallet')}
        onBack={pop}
        testIDPrefix="wallet"
        backgroundColor={colors.background}
        backColor={colors.textPrimary}
        bottom={
          <TabBar
            testIDPrefix="wallet.tab"
            tabs={['Wallet', 'Transactions']}
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
          <ScrollView key="wallet" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: Math.max(150, insets.bottom + 90) }}>
            <LinearGradient
              colors={
                colors.isLight
                  ? ['#FFF9F0', '#F2E9DE']
                  : [withAlpha(colors.goldAccent, 25), colors.surfaceVariant]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                padding: 24,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                alignItems: 'center',
                shadowColor: colors.goldAccent,
                shadowOpacity: colors.isLight ? 0.08 : 0.2,
                shadowRadius: 10,
              }}
            >
              {/* Currency Selector Pill */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.surface,
                  padding: 3,
                  borderRadius: 100,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  marginBottom: 12,
                }}
              >
                <Pressable
                  onPress={() => setCurrencyCode('INR')}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderRadius: 100,
                    backgroundColor: currencyCode === 'INR' ? colors.goldAccent : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11.5,
                      fontWeight: '800',
                      color: currencyCode === 'INR' ? '#080D1A' : colors.textMuted,
                    }}
                  >
                    ₹ INR (India)
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setCurrencyCode('USD')}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderRadius: 100,
                    backgroundColor: currencyCode === 'USD' ? colors.goldAccent : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11.5,
                      fontWeight: '800',
                      color: currencyCode === 'USD' ? '#080D1A' : colors.textMuted,
                    }}
                  >
                    $ USD (Abroad)
                  </Text>
                </Pressable>
              </View>

              <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>Available Balance</Text>
              <Text testID="wallet.balance" style={{ marginTop: 8, color: colors.goldAccent, fontSize: 44, fontWeight: '800' }}>
                {formatPrice(balance)}
              </Text>
              <View style={{ marginTop: 16, alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center' }}>
                <WalletStat value={isAuth ? formatPrice(balance) : formatPrice(0)} label="Total Added" colors={colors} />
                <View style={{ width: 1, height: 30, backgroundColor: colors.divider }} />
                <WalletStat value={formatPrice(0)} label="Total Spent" colors={colors} />
                <View style={{ width: 1, height: 30, backgroundColor: colors.divider }} />
                <WalletStat value={formatPrice(0)} label="Bonus Earned" colors={colors} />
              </View>
            </LinearGradient>

            <Text style={{ marginTop: 22, color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>Add Money</Text>
            <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }} onLayout={(e) => setGridW(e.nativeEvent.layout.width)}>
              {cell > 0 && rechargeOptions.map((o, idx) => {
                const sel = selectedIdx === idx;
                return (
                  <Pressable
                    key={o.amount}
                    testID={`wallet.amount.${o.value}`}
                    onPress={() => setSelectedIdx(idx)}
                    style={{
                      width: cell,
                      height: cell / 1.7,
                      borderRadius: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: sel ? withAlpha(colors.goldAccent, colors.isLight ? 25 : 30) : colors.surface,
                      borderWidth: sel ? 2 : 1,
                      borderColor: sel ? colors.goldAccent : colors.cardBorder,
                    }}
                  >
                    <Text style={{ color: sel ? colors.goldAccent : colors.textPrimary, fontSize: 15, fontWeight: '700' }}>{o.amount}</Text>
                    {o.bonus ? <Text style={{ color: '#2D9E6B', fontSize: 10, fontWeight: '600', marginTop: 2 }}>{o.bonus}</Text> : null}
                  </Pressable>
                );
              })}
            </View>
            <ElevatedButton
              testID="wallet.addMoney"
              label={isProcessing ? 'Processing Payment...' : `Add ${activeOption.amount} to Wallet`}
              onPress={() => setSheet(true)}
              radius={14}
              style={{ marginTop: 16 }}
            />

            <Text style={{ marginTop: 22, color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>Payment Methods</Text>
            <View style={{ marginTop: 12, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder }}>
              {(currencyCode === 'INR'
                ? [
                    ['📱', 'UPI (Google Pay, PhonePe, Paytm)', 'Instant recharge via any UPI app', 'UPI'],
                    ['💳', 'Credit / Debit Card', 'Visa, Mastercard, RuPay', 'Card'],
                    ['🏦', 'Net Banking', 'All major Indian banks supported', 'Net Banking'],
                  ]
                : [
                    ['💳', 'Credit / Debit Card (Stripe)', 'Visa, Mastercard, American Express', 'Card'],
                    ['🌐', 'PayPal / Apple Pay / Google Pay', 'Instant global checkout', 'Digital Wallet'],
                    ['🏦', 'International Bank Transfer', 'Direct international wire', 'Wire'],
                  ]
              ).map(([e, titleText, s, method], i) => (
                <Pressable key={titleText} onPress={() => setSheet(true)}>
                  {i > 0 ? <View style={{ height: 1, marginLeft: 60, backgroundColor: colors.divider }} /> : null}
                  <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, minHeight: 64 }}>
                    <Text style={{ fontSize: 22 }}>{e}</Text>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                      <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>{titleText}</Text>
                      <Text style={{ color: colors.textMuted, fontSize: 11 }}>{s}</Text>
                    </View>
                    <AppIcon name="chevron_right_rounded" color={colors.textMuted} size={18} />
                  </View>
                </Pressable>
              ))}
            </View>

            <View style={{ marginTop: 20, padding: 16, borderRadius: 18, backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 20 : 15), borderWidth: 1, borderColor: colors.cardBorder, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 28 }}>🎟️</Text>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>Have a Coupon?</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>Use code ASTRO50 for extra bonus</Text>
              </View>
              <Pressable
                testID="wallet.coupon.apply"
                onPress={() => showSnackBar(`Coupon ASTRO50 applied! ${formatPrice(50)} extra bonus on next recharge`, colors.surfaceVariant)}
                style={{ paddingHorizontal: 12, paddingVertical: 8 }}
              >
                <Text style={{ color: colors.goldAccent, fontWeight: '700', fontSize: 14 }}>Apply</Text>
              </Pressable>
            </View>
          </ScrollView>,

          <ScrollView key="tx" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: Math.max(150, insets.bottom + 90) }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {[['Total Added', isAuth ? formatPrice(balance) : formatPrice(0), '#2D9E6B'], ['Total Spent', formatPrice(0), '#CF4444']].map(([l, v, c]) => (
                <View key={l} style={{ flex: 1, padding: 16, borderRadius: 16, backgroundColor: withAlpha(c, colors.isLight ? 15 : 20), borderWidth: 1, borderColor: withAlpha(c, 60) }}>
                  <Text style={{ color: colors.textMuted, fontSize: 11 }}>{l}</Text>
                  <Text style={{ marginTop: 4, color: c, fontSize: 19, fontWeight: '800' }}>{v}</Text>
                </View>
              ))}
            </View>
            <Text style={{ marginTop: 20, marginBottom: 12, color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>Recent Transactions</Text>
            {transactions.length === 0 ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 36, paddingHorizontal: 20, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder }}>
                <Text style={{ fontSize: 32, marginBottom: 10 }}>📜</Text>
                <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700' }}>No Transactions Yet</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                  {isAuth ? 'Your recharge and consultation billing records will show here.' : 'Sign in to access your wallet transactions and history.'}
                </Text>
              </View>
            ) : (
              transactions.map((tItem, i) => {
                const credit = tItem.type === 'credit';
                const c = credit ? '#2D9E6B' : '#CF4444';
                return (
                  <View key={tItem.id || i} style={{ marginBottom: 10, padding: 14, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: withAlpha(c, 20), alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 20 }}>{tItem.icon || (credit ? '💳' : '📞')}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>{tItem.title}</Text>
                      <Text style={{ color: colors.textMuted, fontSize: 11 }}>{tItem.subtitle}</Text>
                      <Text style={{ color: colors.textMuted, fontSize: 10 }}>{tItem.date}</Text>
                    </View>
                    <Text style={{ color: c, fontSize: 15, fontWeight: '800' }}>{String(tItem.amount)}</Text>
                  </View>
                );
              })
            )}
          </ScrollView>,
        ]}
      </TabPager>

      <BottomSheet visible={sheet} onClose={() => setSheet(false)} testID="wallet.paymentSheet">
        <View style={{ padding: 24, backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: colors.cardBorder }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                {currencyCode === 'INR' ? 'Razorpay Secure Checkout' : 'Stripe Global Checkout'}
              </Text>
              <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '800' }}>
                {`Add ${activeOption.amount} to Wallet`}
              </Text>
            </View>
            <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(57,181,74,0.15)', borderWidth: 1, borderColor: '#39B54A' }}>
              <Text style={{ color: '#39B54A', fontSize: 11, fontWeight: '700' }}>🔒 256-Bit SSL</Text>
            </View>
          </View>

          {(currencyCode === 'INR'
            ? [
                { label: '📱 Google Pay / PhonePe / Paytm (UPI)', method: 'UPI' },
                { label: '💳 Credit / Debit Card (Visa, RuPay)', method: 'Card' },
                { label: '🏦 Net Banking (SBI, HDFC, ICICI, Axis)', method: 'Net Banking' },
              ]
            : [
                { label: '💳 Credit / Debit Card (Visa, Master, Amex)', method: 'Card' },
                { label: '🌐 PayPal / Apple Pay / Google Pay', method: 'Digital Wallet' },
                { label: '🏦 International Wire Transfer', method: 'Wire' },
              ]
          ).map((m, i) => (
            <Pressable
              key={m.method}
              testID={`wallet.paymentSheet.method.${i}`}
              onPress={() => handleRecharge(m.method)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderRadius: 14,
                backgroundColor: colors.surfaceVariant,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                marginBottom: 10,
              }}
            >
              <Text style={{ flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>{m.label}</Text>
              <AppIcon name="chevron_right_rounded" color={colors.goldAccent} size={18} />
            </Pressable>
          ))}
          <View style={{ height: 16 }} />
        </View>
      </BottomSheet>
    </View>
  );
}
