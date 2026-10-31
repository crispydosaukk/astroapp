/**
 * Mahadasha Paid PDF Reports & Guides Screen
 * Complete parity with AstroParihar Website:
 * - Only the 4 official website Mahadasha Guides:
 *   1. Rahu Mahadasha Stabilisation Guide (₹499 / $9.99)
 *   2. Rahu Mahadasha Survival Guide (₹999 / $19.99)
 *   3. Sani Mahadasha Stabilisation Guide (₹499 / $9.99)
 *   4. Sani Mahadasha Survival Guide (₹999 / $19.99)
 * - Sign-in validation & protected access
 * - Real-time wallet balance verification & instant purchase deduction
 * - Full interactive in-app chapter reader with classical mantras & instructions
 * - High-res PDF download / share
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Share,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { ElevatedButton, OutlinedButton } from '@/components/common';
import { showSnackBar } from '@/components/overlays';
import { TabBar, TabPager } from '@/components/Tabs';
import { Text } from '@/components/Text';
import {
  getPurchasedGuideIds,
  MAHADASHA_GUIDES,
  MahadashaGuide,
  markGuidePurchased,
} from '@/data/mahadashaGuidesData';
import { useAuthStore } from '@/features/auth/authStore';
import { AppRoutes, pop, push } from '@/navigation/routes';
import { useCurrencyStore } from '@/services/currencyStore';
import { withAlpha } from '@/theme/colors';
import { useThemeColors } from '@/theme/themeStore';

const STORAGE_WALLET_BALANCE = 'astroparihar_wallet_balance';

export default function KundliReportsScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authUser = useAuthStore((s) => s.user);
  const isUserLoggedIn = Boolean(isAuthenticated && authUser && (authUser.uid || authUser.phone));

  const { currencyCode, formatPrice, convertPrice } = useCurrencyStore();

  const [tab, setTab] = useState(1); // Default to 'Mahadasha Guides' tab
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);

  // Active guide for preview or in-app reading
  const [viewingGuide, setViewingGuide] = useState<MahadashaGuide | null>(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const guidesList: MahadashaGuide[] = Object.values(MAHADASHA_GUIDES);

  const loadUserDataAndPurchases = async () => {
    setLoading(true);
    try {
      const uKey = authUser?.uid || authUser?.phone || 'guest';
      const bought = await getPurchasedGuideIds(uKey);
      setPurchasedIds(bought);

      // Load wallet balance from local storage / user
      const rawBal = await AsyncStorage.getItem(STORAGE_WALLET_BALANCE);
      if (rawBal) {
        setWalletBalance(parseFloat(rawBal) || 0);
      } else if ((authUser as any)?.walletBalance !== undefined) {
        setWalletBalance(Number((authUser as any).walletBalance) || 0);
      } else {
        setWalletBalance(0);
      }
    } catch {
      setPurchasedIds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserDataAndPurchases();
  }, [isUserLoggedIn, authUser?.uid, authUser?.phone]);

  const handleBuyOrUnlock = async (guide: MahadashaGuide) => {
    if (!isUserLoggedIn) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to your AstroParihar account to purchase and access this Mahadasha Guide.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign In',
            onPress: () => {
              useAuthStore.getState().setPostLoginRedirect({ route: '', popOnSuccess: true });
              push(AppRoutes.signInScreen);
            },
          },
        ]
      );
      return;
    }

    const priceRequired = currencyCode === 'USD' ? guide.priceUSD : guide.price;
    const currentBal = walletBalance;

    if (currentBal < priceRequired) {
      const needed = Math.max(0, priceRequired - currentBal);
      Alert.alert(
        'Insufficient Wallet Balance',
        `Available balance: ${formatPrice(currentBal)}\nRequired: ${formatPrice(priceRequired)}\n\nYou need ${formatPrice(needed)} more to unlock this guide. Would you like to recharge your wallet now?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Recharge Wallet',
            onPress: () => push(AppRoutes.walletScreen),
          },
        ]
      );
      return;
    }

    // Process Purchase
    setIsPurchasing(true);
    try {
      const newBal = Math.max(0, currentBal - priceRequired);
      setWalletBalance(newBal);
      await AsyncStorage.setItem(STORAGE_WALLET_BALANCE, String(newBal));

      const uKey = authUser?.uid || authUser?.phone || 'user';
      await markGuidePurchased(guide.id, uKey);

      setPurchasedIds((prev) => [...prev, guide.id]);
      showSnackBar(`Successfully unlocked "${guide.title}"!`, '#2D9E6B');

      // Open in-app reader immediately
      setViewingGuide(guide);
      setActiveChapterIndex(0);
      setIsReaderOpen(true);
    } catch {
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="kundliReports.screen">
      <AppBar
        title="Mahadasha PDF Guides"
        onBack={pop}
        testIDPrefix="kundliReports"
        backgroundColor={colors.background}
        backColor={colors.textPrimary}
        bottom={
          <TabBar
            testIDPrefix="kundliReports.tab"
            tabs={['My Purchased Guides', 'Official Guides (4)']}
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
          /* Tab 0: My Purchased Guides */
          <ScrollView
            key="mine"
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: Math.max(150, insets.bottom + 90),
            }}
          >
            {!isUserLoggedIn ? (
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
                <Text style={{ marginTop: 6, color: colors.textSecondary, fontSize: 12, textAlign: 'center' }}>
                  Sign in to view and download your unlocked Rahu and Sani Mahadasha survival guides.
                </Text>
                <ElevatedButton
                  label="Sign In"
                  icon="login"
                  onPress={() => push(AppRoutes.signInScreen)}
                  bg="#713B32"
                  fg="#FFFFFF"
                  radius={100}
                  paddingV={12}
                  paddingH={28}
                  fontSize={13}
                  style={{ marginTop: 16 }}
                />
              </View>
            ) : purchasedIds.length === 0 ? (
              <View
                style={{
                  marginTop: 20,
                  padding: 28,
                  borderRadius: 20,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  alignItems: 'center',
                }}
              >
                <AppIcon name="menu_book" color={colors.textMuted} size={44} />
                <Text style={{ marginTop: 12, color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>
                  No Unlocked Guides Yet
                </Text>
                <Text style={{ marginTop: 6, color: colors.textSecondary, fontSize: 12, textAlign: 'center', lineHeight: 17 }}>
                  You have not purchased any Mahadasha PDF guides yet. Explore our 4 official guides below to master Rahu and Sani cycles.
                </Text>
                <ElevatedButton
                  label="View Official Guides"
                  onPress={() => setTab(1)}
                  bg="#713B32"
                  fg="#FFFFFF"
                  radius={100}
                  paddingV={10}
                  paddingH={20}
                  fontSize={13}
                  style={{ marginTop: 16 }}
                />
              </View>
            ) : (
              guidesList
                .filter((g) => purchasedIds.includes(g.id))
                .map((guide) => (
                  <View
                    key={guide.id}
                    style={{
                      marginBottom: 16,
                      padding: 18,
                      borderRadius: 20,
                      backgroundColor: colors.surface,
                      borderWidth: 1.5,
                      borderColor: withAlpha(guide.color, 80),
                      shadowColor: '#000',
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      elevation: 2,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 28 }}>{guide.emoji}</Text>
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text numberOfLines={1} style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '800', flex: 1 }}>
                            {guide.title}
                          </Text>
                          <View
                            style={{
                              paddingHorizontal: 7,
                              paddingVertical: 2,
                              borderRadius: 6,
                              backgroundColor: withAlpha('#2D9E6B', 20),
                              borderWidth: 1,
                              borderColor: '#2D9E6B',
                            }}
                          >
                            <Text style={{ color: '#2D9E6B', fontSize: 10, fontWeight: '800' }}>UNLOCKED</Text>
                          </View>
                        </View>
                        <Text numberOfLines={2} style={{ marginTop: 4, color: colors.textSecondary, fontSize: 11.5, lineHeight: 16 }}>
                          {guide.subtitle}
                        </Text>
                      </View>
                    </View>

                    <View style={{ marginTop: 14, flexDirection: 'row', gap: 10 }}>
                      <Pressable
                        onPress={() => handleOpenReader(guide)}
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingVertical: 9,
                          borderRadius: 100,
                          backgroundColor: '#713B32',
                        }}
                      >
                        <AppIcon name="menu_book" color="#FFFFFF" size={14} />
                        <Text style={{ marginLeft: 6, color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>
                          Read Online
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleDownloadPdf(guide)}
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingVertical: 9,
                          borderRadius: 100,
                          backgroundColor: colors.surfaceVariant,
                          borderWidth: 1,
                          borderColor: colors.cardBorder,
                        }}
                      >
                        <AppIcon name="download" color={colors.goldAccent} size={14} />
                        <Text style={{ marginLeft: 6, color: colors.goldAccent, fontSize: 12, fontWeight: '700' }}>
                          Download PDF
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))
            )}
          </ScrollView>,

          /* Tab 1: The 4 Official Website Mahadasha Guides */
          <ScrollView
            key="catalog"
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: Math.max(150, insets.bottom + 90),
            }}
          >
            {/* Header Banner */}
            <View
              style={{
                marginBottom: 16,
                padding: 16,
                borderRadius: 18,
                backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 15 : 22),
                borderWidth: 1,
                borderColor: withAlpha(colors.goldAccent, 60),
              }}
            >
              <Text style={{ color: colors.goldAccent, fontSize: 13, fontWeight: '800' }}>
                ✦ SACRED MAHADASHA REMEDIAL BLUEPRINTS
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11.5, marginTop: 4, lineHeight: 16 }}>
                Exhaustive PDF dossiers with authentic Sanskrit Beej Mantras, 48-day rituals, dietary Vata protocols & protective talismans.
              </Text>
            </View>

            {guidesList.map((guide) => {
              const isUnlocked = purchasedIds.includes(guide.id);
              const displayPrice =
                currencyCode === 'USD' ? `$${guide.priceUSD}` : `₹${guide.price}`;

              return (
                <View
                  key={guide.id}
                  style={{
                    marginBottom: 18,
                    borderRadius: 22,
                    backgroundColor: colors.surface,
                    borderWidth: 1.5,
                    borderColor: isUnlocked ? '#2D9E6B' : colors.cardBorder,
                    overflow: 'hidden',
                    shadowColor: '#000',
                    shadowOpacity: colors.isLight ? 0.05 : 0.25,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  <View style={{ padding: 18 }}>
                    {/* Badge & Price Header */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 8,
                          backgroundColor: withAlpha(guide.color, 25),
                          borderWidth: 1,
                          borderColor: withAlpha(guide.color, 70),
                        }}
                      >
                        <Text style={{ color: guide.color, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>
                          {guide.badge.toUpperCase()}
                        </Text>
                      </View>

                      {isUnlocked ? (
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 100,
                            backgroundColor: withAlpha('#2D9E6B', 20),
                            borderWidth: 1,
                            borderColor: '#2D9E6B',
                          }}
                        >
                          <Text style={{ color: '#2D9E6B', fontSize: 11, fontWeight: '800' }}>UNLOCKED ✓</Text>
                        </View>
                      ) : (
                        <Text style={{ color: colors.goldAccent, fontSize: 17, fontWeight: '800' }}>
                          {displayPrice}
                        </Text>
                      )}
                    </View>

                    {/* Title & Subtitle */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      <Text style={{ fontSize: 26, marginRight: 10 }}>{guide.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800' }}>
                          {guide.title}
                        </Text>
                        <Text style={{ marginTop: 4, color: colors.textSecondary, fontSize: 12, lineHeight: 17 }}>
                          {guide.subtitle}
                        </Text>
                      </View>
                    </View>

                    {/* Preview Topics */}
                    <View
                      style={{
                        marginTop: 14,
                        padding: 12,
                        borderRadius: 14,
                        backgroundColor: colors.surfaceVariant,
                        borderWidth: 1,
                        borderColor: colors.cardBorder,
                      }}
                    >
                      <Text style={{ color: colors.textPrimary, fontSize: 11.5, fontWeight: '700', marginBottom: 6 }}>
                        📖 Included in this Guide:
                      </Text>
                      {guide.previewTopics.map((topic, tIdx) => (
                        <Text key={tIdx} style={{ color: colors.textSecondary, fontSize: 11, lineHeight: 16, marginBottom: 2 }}>
                          • {topic}
                        </Text>
                      ))}
                    </View>

                    {/* Action Button */}
                    <View style={{ marginTop: 16, flexDirection: 'row', gap: 10 }}>
                      {isUnlocked ? (
                        <>
                          <Pressable
                            onPress={() => handleOpenReader(guide)}
                            style={{
                              flex: 1,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              paddingVertical: 11,
                              borderRadius: 100,
                              backgroundColor: '#713B32',
                            }}
                          >
                            <AppIcon name="menu_book" color="#FFFFFF" size={15} />
                            <Text style={{ marginLeft: 6, color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>
                              Read Chapters Online
                            </Text>
                          </Pressable>

                          <Pressable
                            onPress={() => handleDownloadPdf(guide)}
                            style={{
                              width: 44,
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 22,
                              backgroundColor: colors.surfaceVariant,
                              borderWidth: 1,
                              borderColor: colors.cardBorder,
                            }}
                          >
                            <AppIcon name="download" color={colors.goldAccent} size={18} />
                          </Pressable>
                        </>
                      ) : (
                        <Pressable
                          onPress={() => handleBuyOrUnlock(guide)}
                          disabled={isPurchasing}
                          style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingVertical: 12,
                            borderRadius: 100,
                            backgroundColor: colors.isLight ? '#713B32' : colors.goldAccent,
                          }}
                        >
                          {isPurchasing ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <>
                              <AppIcon
                                name="lock_open"
                                color={colors.isLight ? '#FFFFFF' : '#000000'}
                                size={15}
                              />
                              <Text
                                style={{
                                  marginLeft: 6,
                                  color: colors.isLight ? '#FFFFFF' : '#000000',
                                  fontSize: 13,
                                  fontWeight: '800',
                                }}
                              >
                                Unlock Full Guide ({displayPrice})
                              </Text>
                            </>
                          )}
                        </Pressable>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>,
        ]}
      </TabPager>

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
                          ? colors.isLight
                            ? '#713B32'
                            : colors.goldAccent
                          : colors.surface,
                        borderWidth: 1,
                        borderColor: isSel
                          ? colors.isLight
                            ? '#713B32'
                            : colors.goldAccent
                          : colors.cardBorder,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11.5,
                          fontWeight: isSel ? '800' : '600',
                          color: isSel
                            ? colors.isLight
                              ? '#FFFFFF'
                              : '#000000'
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
                        bg="#713B32"
                        fg="#FFFFFF"
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
