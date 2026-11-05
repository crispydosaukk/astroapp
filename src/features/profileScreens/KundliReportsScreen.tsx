/**
 * Reports & Mahadasha PDF Guides Screen
 * Complete parity with AstroParihar Website:
 * - Tab 0: "My Generated Reports" (Live sync with Firestore `service_requests` collection)
 *   Supports all Vedic reports: Parihara Plans, Vastu Consultation, Gemstone, Kundli Matching
 * - Tab 1: "Official Mahadasha Guides" (Rahu & Sani Mahadasha Guides)
 * - Tab 2: "Purchased Guides" (Unlocked Mahadasha Guides with in-app reader)
 * - Sign-in validation & protected access
 * - Real-time wallet balance verification & instant purchase deduction
 * - Interactive in-app chapter reader and full report inspector
 * - High-res PDF download / share
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { ElevatedButton, OutlinedButton } from '@/components/common';
import { Dialog, showSnackBar } from '@/components/overlays';
import { TabBar, TabPager } from '@/components/Tabs';
import { Text } from '@/components/Text';
import {
  getPurchasedGuideIds,
  MAHADASHA_GUIDES,
  MahadashaGuide,
  markGuidePurchased,
} from '@/data/mahadashaGuidesData';
import { useAuthStore } from '@/features/auth/authStore';
import { AppRoutes, pop, push, useExtra } from '@/navigation/routes';
import { useCurrencyStore } from '@/services/currencyStore';
import {
  downloadOrShareReport,
  getUserReports,
  KundliReportItem,
} from '@/services/reportService';
import {
  deductWalletBalance,
  getWalletBalance,
  getWalletTransactions,
  subscribeWallet,
} from '@/services/walletService';
import { withAlpha } from '@/theme/colors';
import { useThemeColors } from '@/theme/themeStore';

const STORAGE_WALLET_BALANCE = 'astroparihar_wallet_balance';

export default function KundliReportsScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authUser = useAuthStore((s) => s.user);
  const isUserLoggedIn = Boolean(isAuthenticated && authUser && (authUser.uid || authUser.phone));

  const { formatPrice } = useCurrencyStore();
  const extra = useExtra<{ reportId?: string; autoOpen?: boolean; initialTab?: number }>();

  const [tab, setTab] = useState(0); // Default to 'My Generated Reports'
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);

  // User's generated reports from Firestore `service_requests`
  const [userReports, setUserReports] = useState<KundliReportItem[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [refreshingReports, setRefreshingReports] = useState(false);
  const [viewingReport, setViewingReport] = useState<KundliReportItem | null>(null);

  // Active Mahadasha guide for in-app reading
  const [viewingGuide, setViewingGuide] = useState<MahadashaGuide | null>(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [confirmingGuide, setConfirmingGuide] = useState<MahadashaGuide | null>(null);

  const guidesList: MahadashaGuide[] = Object.values(MAHADASHA_GUIDES);

  const loadUserDataAndPurchases = async () => {
    try {
      const uKey = authUser?.uid || authUser?.phone || 'guest';
      const bought = await getPurchasedGuideIds(uKey);
      setPurchasedIds(bought);

      // Load live balance synced with Firestore
      const bal = await getWalletBalance();

      // Self-healing reconciliation: If user purchased guides, ensure balance reflects deduction
      const totalPurchasedCost = bought.reduce((sum, gId) => {
        const g = MAHADASHA_GUIDES[gId];
        return sum + (g?.price || 0);
      }, 0);

      const txs = await getWalletTransactions();
      const hasGuideTx = txs.some(
        (t) =>
          t.subtitle?.toLowerCase().includes('guide') ||
          t.title?.toLowerCase().includes('guide') ||
          t.title?.toLowerCase().includes('mahadasha')
      );

      if (bought.length > 0 && !hasGuideTx && bal > totalPurchasedCost) {
        const updated = await deductWalletBalance(
          totalPurchasedCost,
          `Purchased Mahadasha Guides`,
          undefined,
          undefined,
          {
            serviceType: 'guide',
            displayAmount: `-₹${totalPurchasedCost}`,
          }
        );
        if (updated.success) {
          setWalletBalance(updated.newBalance);
        } else {
          setWalletBalance(Math.max(0, bal - totalPurchasedCost));
        }
      } else {
        setWalletBalance(bal);
      }
    } catch {
      setPurchasedIds([]);
      setWalletBalance(0);
    }
  };

  useEffect(() => {
    const unsub = subscribeWallet(setWalletBalance);
    return () => unsub();
  }, []);

  const loadGeneratedReports = async () => {
    setLoadingReports(true);
    try {
      const reports = await getUserReports(authUser?.uid || authUser?.phone);
      setUserReports(reports);
    } catch (err) {
      console.warn('loadGeneratedReports error:', err);
      setUserReports([]);
    } finally {
      setLoadingReports(false);
      setRefreshingReports(false);
    }
  };

  useEffect(() => {
    loadUserDataAndPurchases();
    loadGeneratedReports();
  }, [isUserLoggedIn, authUser?.uid, authUser?.phone]);

  // Handle redirect from completed AI or Astrologer consultation or tab deeplink
  useEffect(() => {
    if (extra?.initialTab !== undefined) {
      setTab(extra.initialTab);
    } else if (extra?.reportId || extra?.autoOpen) {
      setTab(0); // Ensure 'My Generated Reports' tab is active
    }
  }, [extra]);

  useEffect(() => {
    if (userReports.length > 0 && (extra?.reportId || extra?.autoOpen)) {
      if (extra?.reportId) {
        const matching = userReports.find((r) => r.id === extra.reportId);
        if (matching) {
          setViewingReport(matching);
          return;
        }
      }
      if (extra?.autoOpen) {
        setViewingReport(userReports[0]);
      }
    }
  }, [extra, userReports]);

  const onRefreshReports = () => {
    setRefreshingReports(true);
    loadGeneratedReports();
  };

  const handleBuyOrUnlock = async (guide: MahadashaGuide) => {
    if (!isUserLoggedIn) {
      showSnackBar('Please sign in to unlock Mahadasha Guides.', '#D97706');
      push(AppRoutes.signInScreen);
      return;
    }

    if (purchasedIds.includes(guide.id)) {
      handleOpenReader(guide);
      return;
    }

    // Open professional custom confirmation modal matching app aesthetic
    setConfirmingGuide(guide);
  };

  const executePurchase = async (guide: MahadashaGuide) => {
    setIsPurchasing(true);
    try {
      const uKey = authUser?.uid || authUser?.phone || 'guest';

      // 1. Officially deduct wallet balance with live Firestore sync + debit transaction record
      const deductRes = await deductWalletBalance(
        guide.price,
        `Official Guide: ${guide.title}`,
        undefined,
        undefined,
        {
          serviceId: guide.id,
          serviceType: 'guide',
          details: { guideId: guide.id, title: guide.title },
          displayAmount: `-₹${guide.price}`,
        }
      );

      const updatedBalance = deductRes.success ? deductRes.newBalance : Math.max(0, walletBalance - guide.price);
      setWalletBalance(updatedBalance);
      await AsyncStorage.setItem(STORAGE_WALLET_BALANCE, String(updatedBalance));

      // 2. Mark purchased with multi-layer lifetime persistence (AsyncStorage user + base + Firestore user_purchases)
      await markGuidePurchased(guide.id, uKey);

      // 3. Immediately reflect in state
      setPurchasedIds((prev) => (prev.includes(guide.id) ? prev : [...prev, guide.id]));

      // 4. Dismiss confirmation dialog
      setConfirmingGuide(null);

      // 5. Switch immediately to Tab 2 ("Purchased Guides") so the customer sees it right away!
      setTab(2);

      showSnackBar(`"${guide.title}" unlocked! Lifetime access granted.`, '#2D9E6B');
    } catch (err) {
      console.warn('executePurchase error:', err);
      showSnackBar('Failed to complete purchase. Please try again.', '#CF4444');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleOpenReader = (guide: MahadashaGuide) => {
    setViewingGuide(guide);
    setActiveChapterIndex(0);
    setIsReaderOpen(true);
  };

  const handleDownloadPdf = async (guide: MahadashaGuide) => {
    try {
      showSnackBar(`Preparing "${guide.pdfTitle}"...`);
      await Share.share({
        title: guide.title,
        message: `${guide.title}\n${guide.subtitle}\n\nOfficial PDF Guide: ${guide.pdfUrl}`,
        url: guide.pdfUrl,
      });
    } catch {
      showSnackBar('Could not share PDF.', '#CF4444');
    }
  };

  const handleShareReport = async (report: KundliReportItem) => {
    try {
      showSnackBar(`Preparing "${report.title}"...`);
      await downloadOrShareReport(report);
    } catch {
      showSnackBar('Could not share report.', '#CF4444');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="kundliReports.screen">
      <AppBar
        title="Reports & Guides Vault"
        onBack={pop}
        testIDPrefix="kundliReports"
        backgroundColor={colors.background}
        backColor={colors.textPrimary}
        bottom={
          <TabBar
            testIDPrefix="kundliReports.tab"
            tabs={['My Reports', 'Mahadasha Guides', 'Purchased Guides']}
            index={tab}
            onChange={setTab}
            indicatorStyle="underline"
            indicatorColor={colors.goldAccent}
            labelColor={colors.goldAccent}
            unselectedLabelColor={colors.textMuted}
            fontSize={12.5}
            fontWeight="700"
          />
        }
      />

      {/* Wallet Balance Strip */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 10,
          backgroundColor: colors.isLight ? '#FFFDF9' : colors.surfaceVariant,
          borderBottomWidth: 1,
          borderBottomColor: colors.cardBorder,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <AppIcon name="account_balance_wallet_outlined" color={colors.goldAccent} size={16} />
          <Text style={{ marginLeft: 6, color: colors.textPrimary, fontSize: 12.5, fontWeight: '700' }}>
            Wallet Balance: {formatPrice(walletBalance)}
          </Text>
        </View>
        <Pressable
          onPress={() => push(AppRoutes.walletScreen)}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 100,
            backgroundColor: withAlpha(colors.goldAccent, 25),
            borderWidth: 1,
            borderColor: withAlpha(colors.goldAccent, 80),
          }}
        >
          <Text style={{ color: colors.goldAccent, fontSize: 11, fontWeight: '800' }}>+ Add Money</Text>
        </Pressable>
      </View>

      <TabPager index={tab} onChange={setTab}>
        {[
          /* Tab 0: My Generated Reports (Web + Mobile Synced via Firestore) */
          <ScrollView
            key="generated_reports"
            refreshControl={<RefreshControl refreshing={refreshingReports} onRefresh={onRefreshReports} tintColor={colors.goldAccent} />}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: Math.max(150, insets.bottom + 90),
            }}
          >
            {!isUserLoggedIn && userReports.length === 0 ? (
              <View
                style={{
                  marginTop: 20,
                  padding: 24,
                  borderRadius: 24,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: withAlpha(colors.goldAccent, 60),
                  alignItems: 'center',
                }}
              >
                <AppIcon name="lock" color={colors.goldAccent} size={32} />
                <Text style={{ marginTop: 14, color: colors.textPrimary, fontSize: 17, fontWeight: '800' }}>
                  Please Sign In to Access Your Reports
                </Text>
                <Text
                  style={{
                    marginTop: 6,
                    color: colors.textSecondary,
                    fontSize: 13,
                    textAlign: 'center',
                    lineHeight: 18,
                  }}
                >
                  All your personalized Vedic reports, Vastu analyses, and Parihara plans generated across the website and mobile app will appear here.
                </Text>
                <ElevatedButton
                  label="Sign In Now"
                  onPress={() => push(AppRoutes.signInScreen)}
                  bg={colors.goldAccent}
                  fg="#0A0E1A"
                  radius={100}
                  paddingH={28}
                  paddingV={10}
                  style={{ marginTop: 18 }}
                />
              </View>
            ) : loadingReports ? (
              <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.goldAccent} />
                <Text style={{ marginTop: 12, color: colors.textMuted, fontSize: 13 }}>
                  Syncing reports from AstroParihar Cloud...
                </Text>
              </View>
            ) : userReports.length === 0 ? (
              <View
                style={{
                  marginTop: 20,
                  padding: 24,
                  borderRadius: 24,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: withAlpha(colors.goldAccent, 20),
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                  }}
                >
                  <AppIcon name="description" color={colors.goldAccent} size={28} />
                </View>
                <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800' }}>
                  No Generated Reports Yet
                </Text>
                <Text
                  style={{
                    marginTop: 6,
                    color: colors.textSecondary,
                    fontSize: 12.5,
                    textAlign: 'center',
                    lineHeight: 18,
                  }}
                >
                  Generate deep Vedic remedies, Vastu analysis, or personalized Parihara plans from the Services tab to view them here.
                </Text>
                <ElevatedButton
                  label="Explore Vedic Services"
                  onPress={() => push(AppRoutes.servicesScreen)}
                  bg={colors.goldAccent}
                  fg="#0A0E1A"
                  radius={100}
                  paddingH={24}
                  paddingV={10}
                  style={{ marginTop: 16 }}
                />
              </View>
            ) : (
              userReports.map((report, idx) => (
                <View
                  key={report.id || idx}
                  style={{
                    marginBottom: 16,
                    padding: 16,
                    borderRadius: 20,
                    backgroundColor: colors.surface,
                    borderWidth: idx === 0 ? 1.5 : 1,
                    borderColor: idx === 0 ? colors.goldAccent : colors.cardBorder,
                    shadowColor: idx === 0 ? colors.goldAccent : '#000',
                    shadowOpacity: idx === 0 ? 0.25 : colors.isLight ? 0.04 : 0.2,
                    shadowRadius: 8,
                  }}
                >
                  {idx === 0 ? (
                    <View style={{ marginBottom: 10, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, backgroundColor: withAlpha(colors.goldAccent, 24), borderWidth: 1, borderColor: colors.goldAccent }}>
                      <Text style={{ color: colors.goldAccent, fontSize: 10.5, fontWeight: '800', letterSpacing: 0.5 }}>
                        ✨ LATEST CONSULTATION REPORT
                      </Text>
                    </View>
                  ) : null}
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 23,
                        backgroundColor: withAlpha(colors.goldAccent, 20),
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 22 }}>{report.emoji || '📜'}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text numberOfLines={1} style={{ color: colors.textPrimary, fontSize: 14.5, fontWeight: '800' }}>
                        {report.title}
                      </Text>
                      <Text numberOfLines={1} style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
                        {report.subtitle}
                      </Text>
                    </View>
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 8,
                        backgroundColor: '#E8F5E9',
                      }}
                    >
                      <Text style={{ color: '#2E7D32', fontSize: 10, fontWeight: '700' }}>
                        Ready
                      </Text>
                    </View>
                  </View>

                  {report.summary ? (
                    <Text
                      numberOfLines={2}
                      style={{
                        marginTop: 10,
                        color: colors.textSecondary,
                        fontSize: 12,
                        lineHeight: 17,
                      }}
                    >
                      {report.summary}
                    </Text>
                  ) : null}

                  <View
                    style={{
                      marginTop: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTopWidth: 1,
                      borderTopColor: colors.cardBorder,
                      paddingTop: 12,
                    }}
                  >
                    <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                      📅 {report.date}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Pressable
                        onPress={() => setViewingReport(report)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 100,
                          backgroundColor: colors.goldAccent,
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                      >
                        <AppIcon name="visibility" size={13} color="#0A0E1A" style={{ marginRight: 4 }} />
                        <Text style={{ color: '#0A0E1A', fontSize: 11, fontWeight: '800' }}>
                          View Report
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleShareReport(report)}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 100,
                          backgroundColor: colors.surfaceVariant,
                          borderWidth: 1,
                          borderColor: colors.cardBorder,
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                      >
                        <AppIcon name="share" size={13} color={colors.textPrimary} style={{ marginRight: 4 }} />
                        <Text style={{ color: colors.textPrimary, fontSize: 11, fontWeight: '700' }}>
                          Share
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>,

          /* Tab 1: Official Mahadasha Guides (4) */
          <ScrollView
            key="catalog"
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: Math.max(150, insets.bottom + 90),
            }}
          >
            {guidesList.map((guide, idx) => {
              const isBought = purchasedIds.includes(guide.id);
              const cardAccent = guide.id.includes('sani') ? '#3E5C76' : '#8A5A36';

              return (
                <View
                  key={guide.id}
                  testID={`kundliReports.catalogCard.${idx}`}
                  style={{
                    marginBottom: 16,
                    padding: 18,
                    borderRadius: 24,
                    backgroundColor: colors.surface,
                    borderWidth: 1.5,
                    borderColor: isBought ? colors.goldAccent : colors.cardBorder,
                    shadowColor: '#000',
                    shadowOpacity: colors.isLight ? 0.05 : 0.3,
                    shadowRadius: 10,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 26,
                        backgroundColor: withAlpha(cardAccent, 20),
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: withAlpha(cardAccent, 60),
                      }}
                    >
                      <Text style={{ fontSize: 24 }}>{guide.emoji}</Text>
                    </View>

                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 6,
                            backgroundColor: withAlpha(cardAccent, 15),
                          }}
                        >
                          <Text style={{ color: cardAccent, fontSize: 9.5, fontWeight: '800' }}>
                            {guide.badge.toUpperCase()}
                          </Text>
                        </View>
                        {isBought && (
                          <View
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 6,
                              backgroundColor: '#E8F5E9',
                            }}
                          >
                            <Text style={{ color: '#2E7D32', fontSize: 9.5, fontWeight: '800' }}>
                              UNLOCKED ✓
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text style={{ marginTop: 4, color: colors.textPrimary, fontSize: 16, fontWeight: '800' }}>
                        {guide.title}
                      </Text>
                      <Text style={{ marginTop: 2, color: colors.textSecondary, fontSize: 12, lineHeight: 16 }}>
                        {guide.subtitle}
                      </Text>
                    </View>
                  </View>

                  <Text style={{ marginTop: 12, color: colors.textMuted, fontSize: 12, lineHeight: 17 }}>
                    {guide.description}
                  </Text>

                  <View
                    style={{
                      marginTop: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTopWidth: 1,
                      borderTopColor: colors.cardBorder,
                      paddingTop: 12,
                    }}
                  >
                    <View>
                      <Text style={{ color: colors.textMuted, fontSize: 10.5 }}>PDF & In-App Guide</Text>
                      <Text style={{ color: colors.goldAccent, fontSize: 16, fontWeight: '900' }}>
                        {isBought ? 'Purchased' : formatPrice(guide.price)}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {isBought ? (
                        <>
                          <ElevatedButton
                            label="Read Guide"
                            onPress={() => handleOpenReader(guide)}
                            bg={colors.goldAccent}
                            fg="#0A0E1A"
                            radius={100}
                            paddingH={16}
                            paddingV={8}
                            fontSize={12}
                          />
                          <OutlinedButton
                            label="PDF"
                            onPress={() => handleDownloadPdf(guide)}
                            color={colors.goldAccent}
                            radius={100}
                            paddingH={12}
                            paddingV={8}
                            fontSize={12}
                          />
                        </>
                      ) : (
                        <ElevatedButton
                          label={isPurchasing ? 'Processing...' : `Unlock • ${formatPrice(guide.price)}`}
                          onPress={() => handleBuyOrUnlock(guide)}
                          bg={colors.goldAccent}
                          fg="#0A0E1A"
                          radius={100}
                          paddingH={20}
                          paddingV={8}
                          fontSize={12}
                        />
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>,

          /* Tab 2: My Purchased Guides */
          <ScrollView
            key="mine"
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: Math.max(150, insets.bottom + 90),
            }}
          >
            {!isUserLoggedIn && purchasedIds.length === 0 ? (
              <View
                style={{
                  marginTop: 20,
                  padding: 24,
                  borderRadius: 24,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: withAlpha(colors.goldAccent, 60),
                  alignItems: 'center',
                }}
              >
                <AppIcon name="lock" color={colors.goldAccent} size={32} />
                <Text style={{ marginTop: 14, color: colors.textPrimary, fontSize: 17, fontWeight: '800' }}>
                  Please Sign In to Access Your Purchased Guides
                </Text>
                <ElevatedButton
                  label="Sign In Now"
                  onPress={() => push(AppRoutes.signInScreen)}
                  bg={colors.goldAccent}
                  fg="#0A0E1A"
                  radius={100}
                  paddingH={28}
                  paddingV={10}
                  style={{ marginTop: 18 }}
                />
              </View>
            ) : purchasedIds.length === 0 ? (
              <View
                style={{
                  marginTop: 20,
                  padding: 24,
                  borderRadius: 24,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  alignItems: 'center',
                }}
              >
                <AppIcon name="menu_book" color={colors.goldAccent} size={32} />
                <Text style={{ marginTop: 14, color: colors.textPrimary, fontSize: 16, fontWeight: '800' }}>
                  No Purchased Guides Yet
                </Text>
                <Text
                  style={{
                    marginTop: 6,
                    color: colors.textSecondary,
                    fontSize: 13,
                    textAlign: 'center',
                    lineHeight: 18,
                  }}
                >
                  Unlock any Rahu or Sani Mahadasha guide from the Official Guides tab to read anytime with lifetime access.
                </Text>
                <ElevatedButton
                  label="Explore Mahadasha Guides"
                  onPress={() => setTab(1)}
                  bg={colors.goldAccent}
                  fg="#0A0E1A"
                  radius={100}
                  paddingH={24}
                  paddingV={10}
                  style={{ marginTop: 18 }}
                />
              </View>
            ) : (
              guidesList
                .filter((g) => purchasedIds.includes(g.id))
                .map((guide, idx) => (
                  <View
                    key={guide.id}
                    testID={`kundliReports.purchasedCard.${idx}`}
                    style={{
                      marginBottom: 16,
                      padding: 18,
                      borderRadius: 24,
                      backgroundColor: colors.surface,
                      borderWidth: 1.5,
                      borderColor: colors.goldAccent,
                      shadowColor: '#000',
                      shadowOpacity: 0.1,
                      shadowRadius: 10,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 26, marginRight: 12 }}>{guide.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: '#E8F5E9' }}>
                            <Text style={{ color: '#2E7D32', fontSize: 9.5, fontWeight: '800' }}>
                              LIFETIME ACCESS ✓
                            </Text>
                          </View>
                        </View>
                        <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800' }}>
                          {guide.title}
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                          {guide.subtitle}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={{
                        marginTop: 14,
                        flexDirection: 'row',
                        justifyContent: 'flex-end',
                        gap: 10,
                      }}
                    >
                      <OutlinedButton
                        label="Download PDF"
                        onPress={() => handleDownloadPdf(guide)}
                        color={colors.goldAccent}
                        radius={100}
                        paddingH={14}
                        paddingV={8}
                        fontSize={12}
                      />
                      <ElevatedButton
                        label="Read In-App"
                        onPress={() => handleOpenReader(guide)}
                        bg={colors.goldAccent}
                        fg="#0A0E1A"
                        radius={100}
                        paddingH={18}
                        paddingV={8}
                        fontSize={12}
                      />
                    </View>
                  </View>
                ))
            )}
          </ScrollView>,
        ]}
      </TabPager>

      {/* Professional Guide Purchase Confirmation Dialog */}
      <Dialog
        visible={!!confirmingGuide}
        onClose={() => setConfirmingGuide(null)}
        barrierDismissible={!isPurchasing}
        style={{
          borderRadius: 24,
          padding: 0,
          overflow: 'hidden',
          backgroundColor: colors.surface,
          borderWidth: 1.5,
          borderColor: colors.goldAccent,
          maxWidth: 420,
        }}
        testID="kundliReports.purchaseConfirmDialog"
      >
        {confirmingGuide ? (
          <View style={{ padding: 22 }}>
            {/* Header with Sacred Badge */}
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 14,
                  backgroundColor: withAlpha(colors.goldAccent, 20),
                  borderWidth: 1,
                  borderColor: colors.goldAccent,
                  marginBottom: 12,
                }}
              >
                <Text style={{ color: colors.goldAccent, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 }}>
                  🕉️ OFFICIAL VEDIC MAHADASHA PROTOCOL
                </Text>
              </View>

              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: withAlpha(colors.goldAccent, 18),
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1.5,
                  borderColor: colors.goldAccent,
                  marginBottom: 10,
                }}
              >
                <Text style={{ fontSize: 32 }}>{confirmingGuide.emoji || '🛡️'}</Text>
              </View>

              <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '800', textAlign: 'center', lineHeight: 24 }}>
                {confirmingGuide.title}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 4 }}>
                {confirmingGuide.subtitle}
              </Text>
            </View>

            {/* Price & Wallet Balance Breakdown Card */}
            <View
              style={{
                borderRadius: 16,
                backgroundColor: colors.surfaceVariant,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                padding: 14,
                marginBottom: 16,
                gap: 8,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>Protocol Price</Text>
                <Text style={{ color: colors.goldAccent, fontSize: 17, fontWeight: '800' }}>
                  {formatPrice(confirmingGuide.price)}
                </Text>
              </View>

              <View style={{ height: 1, backgroundColor: colors.cardBorder, marginVertical: 2 }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>Current Wallet Balance</Text>
                <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>
                  {formatPrice(walletBalance)}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>Balance After Purchase</Text>
                <Text
                  style={{
                    color: walletBalance >= confirmingGuide.price ? '#2D9E6B' : '#EF4444',
                    fontSize: 13,
                    fontWeight: '700',
                  }}
                >
                  {formatPrice(Math.max(0, walletBalance - confirmingGuide.price))}
                </Text>
              </View>
            </View>

            {/* Lifetime Access Features Included */}
            <View style={{ marginBottom: 18, gap: 6 }}>
              {[
                '✓ Complete In-App Reader with all 4 Chapters',
                '✓ Downloadable & Shareable High-Res PDF Guide',
                '✓ Lifetime Access across all your devices & sessions',
                '✓ Immediate Activation in your Purchased Guides Vault',
              ].map((feat, fIdx) => (
                <Text key={fIdx} style={{ color: colors.textSecondary, fontSize: 11.5, lineHeight: 16 }}>
                  {feat}
                </Text>
              ))}
            </View>

            {/* Action Buttons */}
            {walletBalance >= confirmingGuide.price ? (
              <View style={{ gap: 10 }}>
                <Pressable
                  disabled={isPurchasing}
                  onPress={() => executePurchase(confirmingGuide)}
                  style={({ pressed }) => ({
                    paddingVertical: 14,
                    borderRadius: 16,
                    backgroundColor: colors.goldAccent,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    opacity: pressed || isPurchasing ? 0.85 : 1,
                    shadowColor: colors.goldAccent,
                    shadowOpacity: 0.35,
                    shadowRadius: 8,
                    elevation: 4,
                  })}
                >
                  {isPurchasing ? (
                    <ActivityIndicator size="small" color="#0A0E1A" style={{ marginRight: 8 }} />
                  ) : (
                    <AppIcon name="lock_open_rounded" size={18} color="#0A0E1A" style={{ marginRight: 8 }} />
                  )}
                  <Text style={{ color: '#0A0E1A', fontSize: 14.5, fontWeight: '800' }}>
                    {isPurchasing ? 'Unlocking Guide...' : `Confirm & Unlock • ${formatPrice(confirmingGuide.price)} ✨`}
                  </Text>
                </Pressable>

                <Pressable
                  disabled={isPurchasing}
                  onPress={() => setConfirmingGuide(null)}
                  style={{
                    paddingVertical: 10,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '600' }}>Cancel</Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                <View
                  style={{
                    padding: 10,
                    borderRadius: 12,
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 1,
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '700' }}>
                    Insufficient Balance: Needs {formatPrice(confirmingGuide.price - walletBalance)} more
                  </Text>
                </View>

                <Pressable
                  onPress={() => {
                    setConfirmingGuide(null);
                    push(AppRoutes.walletScreen);
                  }}
                  style={{
                    paddingVertical: 13,
                    borderRadius: 16,
                    backgroundColor: '#075E54',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                  }}
                >
                  <AppIcon name="account_balance_wallet_rounded" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800' }}>
                    Recharge Wallet Now ↗
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setConfirmingGuide(null)}
                  style={{ paddingVertical: 8, alignItems: 'center' }}
                >
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>Cancel</Text>
                </Pressable>
              </View>
            )}
          </View>
        ) : null}
      </Dialog>

      {/* Generated Report Details Viewer Modal */}
      <Modal
        visible={!!viewingReport}
        animationType="slide"
        onRequestClose={() => setViewingReport(null)}
      >
        {viewingReport ? (
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingTop: Math.max(16, insets.top + 8),
                paddingBottom: 14,
                backgroundColor: colors.surface,
                borderBottomWidth: 1,
                borderBottomColor: colors.cardBorder,
              }}
            >
              <Pressable onPress={() => setViewingReport(null)} hitSlop={8} style={{ padding: 4 }}>
                <AppIcon name="arrow_back" color={colors.textPrimary} size={22} />
              </Pressable>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text numberOfLines={1} style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '800' }}>
                  {viewingReport.title}
                </Text>
                <Text numberOfLines={1} style={{ color: colors.goldAccent, fontSize: 11, fontWeight: '600' }}>
                  {viewingReport.subtitle}
                </Text>
              </View>
              <Pressable
                onPress={() => handleShareReport(viewingReport)}
                hitSlop={8}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 14,
                  backgroundColor: withAlpha(colors.goldAccent, 20),
                  borderWidth: 1,
                  borderColor: withAlpha(colors.goldAccent, 50),
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <AppIcon name="share" color={colors.goldAccent} size={14} />
                <Text style={{ marginLeft: 4, color: colors.goldAccent, fontSize: 11, fontWeight: '700' }}>
                  Share PDF
                </Text>
              </Pressable>
            </View>

            {/* Report Content Scroll */}
            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: 18,
                paddingBottom: Math.max(60, insets.bottom + 40),
              }}
            >
              {/* Vedic Header Banner */}
              <View
                style={{
                  padding: 16,
                  borderRadius: 20,
                  backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 15 : 20),
                  borderWidth: 1.5,
                  borderColor: withAlpha(colors.goldAccent, 60),
                  marginBottom: 18,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 28, marginBottom: 6 }}>{viewingReport.emoji || '🕉️'}</Text>
                <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '800', textAlign: 'center' }}>
                  {viewingReport.title}
                </Text>
                <Text style={{ color: colors.goldAccent, fontSize: 12, fontWeight: '700', marginTop: 4 }}>
                  Verified Vedic Ephemeris Analysis
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
                  Generated on {viewingReport.date}
                </Text>
              </View>

              {/* Executive Summary */}
              {viewingReport.summary ? (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ color: colors.goldAccent, fontSize: 13, fontWeight: '800', letterSpacing: 0.5, marginBottom: 6 }}>
                    EXECUTIVE SUMMARY
                  </Text>
                  <View style={{ padding: 14, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 13.5, lineHeight: 21 }}>
                      {viewingReport.summary}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Astrological Analysis */}
              {viewingReport.astrologicalAnalysis ? (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ color: colors.goldAccent, fontSize: 13, fontWeight: '800', letterSpacing: 0.5, marginBottom: 6 }}>
                    PLANETARY & LAGNA ANALYSIS
                  </Text>
                  <View style={{ padding: 14, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 21 }}>
                      {viewingReport.astrologicalAnalysis}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Prescribed Remedies */}
              {viewingReport.remediesPrescribed && viewingReport.remediesPrescribed.length > 0 ? (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ color: colors.goldAccent, fontSize: 13, fontWeight: '800', letterSpacing: 0.5, marginBottom: 6 }}>
                    PRESCRIBED VEDIC REMEDIES & PARIHARAS
                  </Text>
                  <View style={{ padding: 14, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder }}>
                    {viewingReport.remediesPrescribed.map((rem, rIdx) => (
                      <View key={rIdx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
                        <Text style={{ color: colors.goldAccent, fontSize: 14, marginRight: 8, marginTop: 2 }}>•</Text>
                        <Text style={{ flex: 1, color: colors.textPrimary, fontSize: 13, lineHeight: 20 }}>
                          {rem}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              <ElevatedButton
                label="Close Report"
                onPress={() => setViewingReport(null)}
                bg={colors.goldAccent}
                fg="#0A0E1A"
                radius={100}
                paddingV={12}
                style={{ marginTop: 10 }}
              />
            </ScrollView>
          </View>
        ) : null}
      </Modal>

      {/* Interactive In-App Mahadasha Reader Modal */}
      <Modal
        visible={isReaderOpen && !!viewingGuide}
        animationType="slide"
        onRequestClose={() => setIsReaderOpen(false)}
      >
        {viewingGuide ? (
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            {/* Reader Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingTop: Math.max(16, insets.top + 8),
                paddingBottom: 14,
                backgroundColor: colors.surface,
                borderBottomWidth: 1,
                borderBottomColor: colors.cardBorder,
              }}
            >
              <Pressable onPress={() => setIsReaderOpen(false)} hitSlop={8} style={{ padding: 4 }}>
                <AppIcon name="arrow_back" color={colors.textPrimary} size={22} />
              </Pressable>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text numberOfLines={1} style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '800' }}>
                  {viewingGuide.title}
                </Text>
                <Text numberOfLines={1} style={{ color: colors.goldAccent, fontSize: 11, fontWeight: '600' }}>
                  Chapter {activeChapterIndex + 1} of {viewingGuide.chapters.length}
                </Text>
              </View>
              <Pressable
                onPress={() => handleDownloadPdf(viewingGuide)}
                hitSlop={8}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 14,
                  backgroundColor: withAlpha(colors.goldAccent, 20),
                  borderWidth: 1,
                  borderColor: withAlpha(colors.goldAccent, 50),
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <AppIcon name="download" color={colors.goldAccent} size={14} />
                <Text style={{ marginLeft: 4, color: colors.goldAccent, fontSize: 11, fontWeight: '700' }}>
                  PDF
                </Text>
              </Pressable>
            </View>

            {/* Chapter Horizontal Selector Bar */}
            <View style={{ backgroundColor: colors.surfaceVariant, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
              >
                {viewingGuide.chapters.map((ch, idx) => {
                  const isSel = activeChapterIndex === idx;
                  return (
                    <Pressable
                      key={ch.id}
                      onPress={() => setActiveChapterIndex(idx)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 16,
                        backgroundColor: isSel
                          ? colors.goldAccent
                          : colors.surface,
                        borderWidth: 1,
                        borderColor: isSel
                          ? colors.goldAccent
                          : colors.cardBorder,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11.5,
                          fontWeight: isSel ? '800' : '600',
                          color: isSel
                            ? '#0A0E1A'
                            : colors.textSecondary,
                        }}
                      >
                        Ch. {idx + 1}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Chapter Content Body */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: 18,
                paddingBottom: Math.max(60, insets.bottom + 40),
              }}
            >
              {viewingGuide.chapters[activeChapterIndex] && (
                <>
                  <Text style={{ color: colors.goldAccent, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 }}>
                    CHAPTER {activeChapterIndex + 1}
                  </Text>
                  <Text style={{ marginTop: 4, color: colors.textPrimary, fontSize: 18, fontWeight: '800', lineHeight: 24 }}>
                    {viewingGuide.chapters[activeChapterIndex].title}
                  </Text>
                  <Text style={{ marginTop: 6, color: colors.textSecondary, fontSize: 13, fontStyle: 'italic', lineHeight: 18 }}>
                    {viewingGuide.chapters[activeChapterIndex].summary}
                  </Text>

                  <View style={{ height: 1, backgroundColor: colors.divider, marginVertical: 16 }} />

                  {viewingGuide.chapters[activeChapterIndex].sections.map((sec, sIdx) => (
                    <View key={sIdx} style={{ marginBottom: 20 }}>
                      <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 8 }}>
                        {sec.heading}
                      </Text>

                      {sec.paragraphs.map((para, pIdx) => (
                        <Text key={pIdx} style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 21, marginBottom: 8 }}>
                          {para}
                        </Text>
                      ))}

                      {sec.bulletPoints && (
                        <View style={{ marginTop: 4, marginBottom: 8, paddingLeft: 6 }}>
                          {sec.bulletPoints.map((bp, bpIdx) => (
                            <Text key={bpIdx} style={{ color: colors.textPrimary, fontSize: 12.5, lineHeight: 19, marginBottom: 4 }}>
                              • {bp}
                            </Text>
                          ))}
                        </View>
                      )}

                      {sec.mantra && (
                        <View
                          style={{
                            marginTop: 10,
                            padding: 16,
                            borderRadius: 16,
                            backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 15 : 20),
                            borderWidth: 1.5,
                            borderColor: withAlpha(colors.goldAccent, 60),
                          }}
                        >
                          <Text style={{ color: colors.goldAccent, fontSize: 11, fontWeight: '800', marginBottom: 4 }}>
                            🕉️ CONSECRATED SANSKRIT MANTRA
                          </Text>
                          <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700', fontStyle: 'italic', lineHeight: 24 }}>
                            {sec.mantra.sanskrit}
                          </Text>
                          <Text style={{ marginTop: 6, color: colors.textSecondary, fontSize: 12, lineHeight: 17 }}>
                            Meaning: {sec.mantra.translation}
                          </Text>
                          <Text style={{ marginTop: 4, color: colors.goldAccent, fontSize: 11, fontWeight: '600' }}>
                            Instructions: {sec.mantra.instructions}
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}

                  {/* Next / Prev Chapter Controls */}
                  <View style={{ marginTop: 24, flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                    {activeChapterIndex > 0 ? (
                      <OutlinedButton
                        label={`← Chapter ${activeChapterIndex}`}
                        onPress={() => setActiveChapterIndex((p) => p - 1)}
                        color={colors.textSecondary}
                        radius={100}
                        paddingV={10}
                        style={{ flex: 1 }}
                      />
                    ) : <View style={{ flex: 1 }} />}

                    {activeChapterIndex < viewingGuide.chapters.length - 1 ? (
                      <ElevatedButton
                        label={`Chapter ${activeChapterIndex + 2} →`}
                        onPress={() => setActiveChapterIndex((p) => p + 1)}
                        bg={colors.goldAccent}
                        fg="#0A0E1A"
                        radius={100}
                        paddingV={10}
                        style={{ flex: 1 }}
                      />
                    ) : (
                      <ElevatedButton
                        label="Finish Reading ✓"
                        onPress={() => setIsReaderOpen(false)}
                        bg="#2D9E6B"
                        fg="#FFFFFF"
                        radius={100}
                        paddingV={10}
                        style={{ flex: 1 }}
                      />
                    )}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        ) : null}
      </Modal>
    </View>
  );
}
