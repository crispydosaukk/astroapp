/**
 * Port of lib/presentation/astrologer_detail_screen/astrologer_detail_screen.dart
 * - astrologerData from route extra (falls back to the source _defaultData)
 * - collapsing 280 px image header (SliverAppBar expandedHeight + pinned) → Animated scroll header
 * - bookmark toggle (local), share = SOURCE_INERT (plain Container in source, not tappable)
 * - TabBar/TabBarView (About / Reviews / Availability, fixed 500 px)
 * - sticky glass CTAs → consultation sheet → push(/consultation-screen, {type, astrologer})
 *   (source: Chat→voice, Call→voice, Book→video — preserved exactly)
 */
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import Animated, { interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/AppIcon';
import { AppImage } from '@/components/AppImage';
import { LinearProgress } from '@/components/common';
import { BottomSheet, useSheet } from '@/components/overlays';
import { TabBar, TabPager } from '@/components/Tabs';
import { lh, Text } from '@/components/Text';
import { AppRoutes, pop, push, useExtra } from '@/navigation/routes';
import { AstrologerData, LIVE_ASTROLOGERS } from '@/data/astrologers';
import { useAuthStore } from '@/features/auth/authStore';
import { getAstrologerReviews } from '@/services/reviewService';
import { getWalletBalance, rechargeWallet, subscribeWallet } from '@/services/walletService';
import { generateZegoRoomId } from '@/services/zegoService';
import { argb, withAlpha } from '@/theme/colors';
import { useThemeColors } from '@/theme/themeStore';

const DEFAULT_DATA: AstrologerData = LIVE_ASTROLOGERS[0];
const HEADER_H = 280;

const REVIEWS = [
  { name: 'Priya Sharma', rating: 5, date: '2 days ago', avatar: '🙏', text: "Swamiji's reading was extraordinarily accurate. He described my current Dasha period with such precision — it felt like he was reading my life story. His remedies have already started showing results." },
  { name: 'Rajesh Kumar', rating: 5, date: '1 week ago', avatar: '⭐', text: 'I was sceptical at first, but the consultation completely changed my perspective. His analysis of my career challenges was spot-on and the guidance he provided has been transformative.' },
  { name: 'Ananya Patel', rating: 5, date: '2 weeks ago', avatar: '💫', text: 'The Kundli Milan reading for my marriage was incredibly detailed. He explained every aspect of compatibility with such clarity and compassion. Highly recommend for anyone seeking genuine Vedic guidance.' },
  { name: 'Vikram Singh', rating: 4, date: '3 weeks ago', avatar: '🌟', text: 'Very knowledgeable and patient. Took time to explain complex astrological concepts in simple terms. The session ran a bit long but every minute was worth it.' },
];
const EXPERTISE = [
  'Parashara Jyotisha & Classical Vedic Astrology', 'Vimshottari Dasha & Antardasha Analysis', 'Kundli Milan & Compatibility Assessment',
  'Kaal Sarp, Manglik & Sade Sati Remedies', 'Career, Finance & Life Path Guidance', 'Spiritual Growth & Karmic Resolution',
];

function SectionCard({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  const colors = useThemeColors();
  return (
    <View style={{ padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 16 }}>{emoji}</Text>
        <Text style={{ marginLeft: 8, color: colors.goldAccent, fontSize: 14, fontWeight: '700' }}>{title}</Text>
      </View>
      {children}
    </View>
  );
}
function InfoChip({ label, icon, isGreen }: { label: string; icon: string; isGreen?: boolean }) {
  const colors = useThemeColors();
  return (
    <View style={{ marginRight: 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100, backgroundColor: isGreen ? argb('1A2D9E6B') : colors.surfaceVariant, borderWidth: 1, borderColor: isGreen ? argb('332D9E6B') : colors.cardBorder }}>
      <Text style={{ fontSize: 11 }}>{icon}</Text>
      <Text style={{ marginLeft: 4, color: isGreen ? '#2D9E6B' : colors.textSecondary, fontSize: 11, fontWeight: '500' }}>{label}</Text>
    </View>
  );
}
function StatItem({ value, label, icon, color }: { value: string; label: string; icon: string; color: string }) {
  const colors = useThemeColors();
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 16 }}>{icon}</Text>
      <Text style={{ marginTop: 4, color, fontSize: 13, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 10 }}>{label}</Text>
    </View>
  );
}
function StatDivider() {
  const colors = useThemeColors();
  return <View style={{ width: 1, height: 40, marginHorizontal: 8, backgroundColor: colors.divider }} />;
}

function Row2({ left, right, leftColor }: { left: string; right: string; leftColor?: string }) {
  const colors = useThemeColors();
  return (
    <View style={{ marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ color: leftColor ?? colors.textSecondary, fontSize: 12 }}>{left}</Text>
      <Text style={{ color: colors.goldAccent, fontSize: 12, fontWeight: '600' }}>{right}</Text>
    </View>
  );
}

export default function AstrologerDetailScreen() {
  const colors = useThemeColors();
  const extra = useExtra<AstrologerData>();
  const data = extra ?? DEFAULT_DATA;
  const insets = useSafeAreaInsets();
  const [bookmarked, setBookmarked] = useState(false);
  const [tab, setTab] = useState(0);
  const sheet = useSheet<'Chat' | 'Call' | 'Book'>();
  const price = Number(data.price);
  const isOnline = !!data.isOnline;

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => { scrollY.value = e.contentOffset.y; });
  const toolbarH = insets.top + 56;
  const toolbarBg = useAnimatedStyle(() => ({ opacity: interpolate(scrollY.value, [HEADER_H - toolbarH - 40, HEADER_H - toolbarH], [0, 1], 'clamp') }));
  const imgStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scrollY.value, [-HEADER_H, 0, HEADER_H], [-HEADER_H / 2, 0, HEADER_H * 0.25]) }, { scale: interpolate(scrollY.value, [-HEADER_H, 0], [2, 1], 'clamp') }],
  }));

  const [walletBalance, setWalletBalance] = useState(0);
  const [isRecharging, setIsRecharging] = useState(false);
  const [rechargeMsg, setRechargeMsg] = useState('');
  const [reviewsList, setReviewsList] = useState(REVIEWS);

  useEffect(() => {
    let isMounted = true;
    getWalletBalance().then((b) => {
      if (isMounted) setWalletBalance(b);
    });
    const unsub = subscribeWallet((b) => {
      if (isMounted) setWalletBalance(b);
    });
    getAstrologerReviews(String(data.id || data.name)).then((live) => {
      if (isMounted && live && live.length > 0) {
        const mapped = live.map((r) => ({
          name: r.customerName,
          rating: r.rating,
          date: r.date,
          avatar: r.rating === 5 ? '🙏' : '⭐',
          text: r.reviewText,
          tags: r.tags,
        }));
        setReviewsList(mapped);
      }
    });
    return () => {
      isMounted = false;
      unsub();
    };
  }, [data.id, data.name]);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authUser = useAuthStore((s) => s.user);
  const isAuth = Boolean(isAuthenticated && authUser && (authUser.uid || authUser.phone));

  const minBalance = price * 5;
  const isSufficient = walletBalance >= minBalance;

  const handleQuickRecharge = async (amt: number) => {
    setIsRecharging(true);
    setRechargeMsg('');
    try {
      const res = await rechargeWallet(amt, 'UPI (Razorpay)');
      if (res.success) {
        setWalletBalance(res.newBalance);
        setRechargeMsg(`₹${amt} added successfully! Balance: ₹${res.newBalance}`);
      }
    } catch {
      setRechargeMsg('Payment failed. Please try again.');
    } finally {
      setIsRecharging(false);
    }
  };

  const proceed = (type: 'Chat' | 'Call' | 'Book') => {
    if (!isAuth) {
      sheet.close();
      push(AppRoutes.signInScreen);
      return;
    }
    if (!isSufficient) {
      setRechargeMsg(`Minimum ₹${minBalance} (5 mins) required. Please top up your wallet.`);
      return;
    }
    sheet.close();
    const roomID = generateZegoRoomId();
    push(AppRoutes.consultationScreen, {
      type: type === 'Book' ? 'video' : 'voice',
      astrologer: data,
      roomID,
    });
  };

  const consultTypes = [
    { icon: '💬', type: 'Chat', duration: '30 min', price: `₹${price * 30}` },
    { icon: '📞', type: 'Voice Call', duration: '30 min', price: `₹${price * 30}` },
    { icon: '📹', type: 'Video Call', duration: '30 min', price: `₹${Math.round(price * 30 * 1.2)}` },
    { icon: '📋', type: 'Detailed Report', duration: '48 hrs', price: '₹1,499' },
  ];

  const glassBtn = { margin: 8, borderRadius: 12, backgroundColor: colors.surfaceVariant, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center' as const, justifyContent: 'center' as const };

  const { height: screenH } = useWindowDimensions();
  const tabPagerHeight = tab === 0 ? 800 : tab === 1 ? Math.max(840, reviewsList.length * 170 + 220) : 660;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="astrologerDetail.screen">
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false}>
        <View style={{ height: HEADER_H, overflow: 'hidden' }}>
          <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, height: HEADER_H }, imgStyle]}>
            <AppImage
              uri={data.imageUrl}
              width="100%"
              height={HEADER_H}
              fit="cover"
              semanticLabel={data.semanticLabel}
              errorWidget={<View style={{ flex: 1, backgroundColor: colors.surfaceVariant, alignItems: 'center', justifyContent: 'center' }}><AppIcon name="person" color={colors.textMuted} size={80} /></View>}
            />
          </Animated.View>
          <LinearGradient colors={['transparent', colors.isLight ? 'rgba(250,249,246,0.6)' : argb('66080D1A'), colors.background]} locations={[0.4, 0.75, 1]} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
          <View style={{ position: 'absolute', bottom: 16, left: 20, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: colors.background, backgroundColor: isOnline ? '#3DCB7A' : colors.textMuted }} />
            <Text style={{ marginLeft: 6, color: isOnline ? '#3DCB7A' : colors.textMuted, fontSize: 12, fontWeight: '600' }}>{isOnline ? 'Online Now' : 'Offline'}</Text>
          </View>
          {data.isFeatured ? (
            <View style={{ position: 'absolute', bottom: 16, right: 20, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100, backgroundColor: colors.goldAccent }}>
              <Text style={{ color: colors.isLight ? '#FFFFFF' : '#080D1A', fontSize: 10, fontWeight: '800' }}>⭐ TOP RATED</Text>
            </View>
          ) : null}
        </View>

        {/* profile info */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ flex: 1, color: colors.textPrimary, fontSize: 20, fontWeight: '700' }}>{data.name}</Text>
            <AppIcon name="verified_rounded" color={colors.goldAccent} size={20} />
          </View>
          <Text style={{ marginTop: 4, color: colors.textMuted, ...lh(12, 1.4) }}>{data.title ?? ''}</Text>
          <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center' }}>
            <AppIcon name="language_rounded" color={colors.textMuted} size={14} />
            <Text style={{ marginLeft: 6, color: colors.textSecondary, fontSize: 12 }}>{data.languages}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            <InfoChip label={data.experience} icon="⏳" />
            {data.category ? <InfoChip label={data.category} icon="🔮" /> : null}
            {data.discount ? <InfoChip label={data.discount} icon="🎁" isGreen /> : null}
          </ScrollView>
        </View>

        {/* stats */}
        <View style={{ marginHorizontal: 20, marginTop: 16, padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder }}>
          <StatItem value={String(data.rating)} label="Rating" icon="⭐" color={colors.goldAccent} />
          <StatDivider />
          <StatItem value={data.reviews} label="Reviews" icon="💬" color="#4FC3F7" />
          <StatDivider />
          <StatItem value={data.consultations ?? ''} label="Sessions" icon="🎯" color="#2D9E6B" />
          <StatDivider />
          <StatItem value={`₹${price}/min`} label="Rate" icon="💎" color="#FFB347" />
        </View>

        {/* specialisations */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700' }}>Specialisations</Text>
          <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {(data.specialty || '').split(', ').map((s: string) => (
              <View key={s} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, backgroundColor: withAlpha('#713B32', colors.isLight ? 20 : 25), borderWidth: 1, borderColor: withAlpha('#713B32', colors.isLight ? 40 : 50) }}>
                <Text style={{ color: colors.isLight ? '#713B32' : '#E07070', fontSize: 12, fontWeight: '500' }}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* tabs */}
        <View style={{ marginTop: 20, marginHorizontal: 20, borderRadius: 12, backgroundColor: colors.surfaceVariant, borderWidth: 1, borderColor: colors.cardBorder }}>
          <TabBar testIDPrefix="astrologerDetail.tab" tabs={['About', 'Reviews', 'Availability']} index={tab} onChange={setTab} indicatorColor={colors.goldAccent} labelColor={colors.goldAccent} unselectedLabelColor={colors.textMuted} />
        </View>
        <View style={{ height: 16 }} />
        <TabPager index={tab} onChange={setTab} height={tabPagerHeight}>
          {[
            <View key="about" style={{ paddingHorizontal: 20, gap: 12 }}>
              <SectionCard title="About" emoji="📖">
                <Text style={{ color: colors.textSecondary, ...lh(13, 1.6) }}>
                  {`A revered Himalayan sage with over three decades of deep immersion in Parashara Jyotisha, ${data.name} has guided thousands of seekers through life's most pivotal transitions. Trained in the ancient gurukul tradition, he brings unparalleled depth to Dasha analysis, Kundli interpretation, and karmic chart reading. His consultations blend classical Vedic wisdom with compassionate, practical guidance.`}
                </Text>
              </SectionCard>
              <SectionCard title="Expertise" emoji="🎓">
                {EXPERTISE.map((e) => (
                  <View key={e} style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ color: colors.goldAccent, fontSize: 10 }}>✦</Text>
                    <Text style={{ marginLeft: 10, flex: 1, color: colors.textSecondary, fontSize: 13 }}>{e}</Text>
                  </View>
                ))}
              </SectionCard>
              <SectionCard title="Education & Credentials" emoji="🏛️">
                {[
                  ['Jyotisha Acharya', 'Kashi Sanskrit Vishwavidyalaya'],
                  ['Vedic Astrology Gold Medalist', 'All India Jyotish Parishad, 1998'],
                  ['Gurukul Training', '12 years under Swami Brahmananda Saraswati'],
                ].map(([t, s]) => (
                  <View key={t} style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.goldAccent }} />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>{t}</Text>
                      <Text style={{ color: colors.textMuted, fontSize: 11 }}>{s}</Text>
                    </View>
                  </View>
                ))}
              </SectionCard>
            </View>,
            <View key="reviews" style={{ paddingHorizontal: 20 }}>
              <View style={{ padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: colors.goldAccent, fontSize: 40, fontWeight: '800' }}>{String(data.rating)}</Text>
                  <View style={{ flexDirection: 'row' }}>{[0, 1, 2, 3, 4].map((i) => <AppIcon key={i} name="star_rounded" color={colors.goldAccent} size={14} />)}</View>
                  <Text style={{ marginTop: 4, color: colors.textMuted, fontSize: 11 }}>{`${data.reviews} reviews`}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 20 }}>
                  {([[5, 0.92], [4, 0.06], [3, 0.01], [2, 0.005], [1, 0.005]] as const).map(([s, p]) => (
                    <View key={s} style={{ marginBottom: 4, flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ color: colors.textMuted, fontSize: 10 }}>{String(s)}</Text>
                      <AppIcon name="star_rounded" color={colors.goldAccent} size={10} style={{ marginLeft: 4 }} />
                      <View style={{ flex: 1, marginHorizontal: 6 }}><LinearProgress value={p} height={5} radius={4} color={colors.goldAccent} backgroundColor={colors.surfaceVariant} /></View>
                      <Text style={{ color: colors.textMuted, fontSize: 10 }}>{`${Math.round(p * 100)}%`}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={{ height: 12 }} />
              {reviewsList.map((r, idx) => (
                <View key={`${r.name}_${idx}`} style={{ marginBottom: 10, padding: 14, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: withAlpha(colors.goldAccent, 25), borderWidth: 1, borderColor: withAlpha(colors.goldAccent, 50), alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 16 }}>{r.avatar || '🙏'}</Text>
                    </View>
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>{r.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {Array.from({ length: r.rating }).map((_, i) => <AppIcon key={i} name="star_rounded" color={colors.goldAccent} size={12} />)}
                        <Text style={{ marginLeft: 6, color: colors.textMuted, fontSize: 10 }}>{r.date}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={{ marginTop: 10, color: colors.textSecondary, ...lh(12, 1.5) }}>{r.text}</Text>
                  {(r as any).tags && (r as any).tags.length > 0 ? (
                    <View style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {(r as any).tags.map((t: string, tIdx: number) => (
                        <View key={tIdx} style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: withAlpha(colors.goldAccent, 20), borderWidth: 1, borderColor: withAlpha(colors.goldAccent, 50) }}>
                          <Text style={{ color: colors.goldAccent, fontSize: 10, fontWeight: '600' }}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              ))}
            </View>,
            <View key="availability" style={{ paddingHorizontal: 20, gap: 12 }}>
              <SectionCard title="Today's Available Slots" emoji="📅">
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {['10:00 AM', '11:30 AM', '2:00 PM', '3:30 PM', '5:00 PM', '7:00 PM'].map((s, i) => {
                    const avail = i % 3 !== 1;
                    return (
                      <View key={s} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: avail ? argb('1A2D9E6B') : colors.surfaceVariant, borderWidth: 1, borderColor: avail ? argb('332D9E6B') : colors.cardBorder }}>
                        <Text style={{ color: avail ? '#2D9E6B' : colors.textMuted, fontSize: 12, fontWeight: '600' }}>{s}</Text>
                      </View>
                    );
                  })}
                </View>
              </SectionCard>
              <SectionCard title="Consultation Types" emoji="💬">
                {consultTypes.map((c) => (
                  <View key={c.type} style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 18 }}>{c.icon}</Text>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>{c.type}</Text>
                      <Text style={{ color: colors.textMuted, fontSize: 11 }}>{c.duration}</Text>
                    </View>
                    <Text style={{ color: colors.goldAccent, fontSize: 13, fontWeight: '700' }}>{c.price}</Text>
                  </View>
                ))}
              </SectionCard>
              <SectionCard title="Working Hours" emoji="⏰">
                <Row2 left="Monday – Friday" right="9:00 AM – 9:00 PM" />
                <Row2 left="Saturday" right="10:00 AM – 7:00 PM" />
                <Row2 left="Sunday" right="11:00 AM – 5:00 PM" />
              </SectionCard>
            </View>,
          ]}
        </TabPager>
        <View style={{ height: 180 + insets.bottom }} />
      </Animated.ScrollView>

      {/* pinned toolbar */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: toolbarH, paddingTop: insets.top, flexDirection: 'row' }} pointerEvents="box-none">
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.background }, toolbarBg]} />
        <Pressable testID="astrologerDetail.back" onPress={pop} style={[{ width: 40, height: 40 }, glassBtn]}>
          <AppIcon name="arrow_back_ios_new_rounded" color={colors.textPrimary} size={18} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable testID="astrologerDetail.bookmark" onPress={() => setBookmarked((b) => !b)} style={[{ padding: 8 }, glassBtn]}>
          <AppIcon name={bookmarked ? 'bookmark_rounded' : 'bookmark_border_rounded'} color={bookmarked ? colors.goldAccent : colors.textPrimary} size={20} />
        </Pressable>
        {/* Share is a plain Container in source (no gesture) — display only. */}
        <View testID="astrologerDetail.share" style={[{ padding: 8, marginLeft: 0 }, glassBtn]}>
          <AppIcon name="share_rounded" color={colors.textPrimary} size={20} />
        </View>
      </View>

      {/* sticky CTAs */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, overflow: 'hidden', borderTopWidth: 1, borderTopColor: colors.cardBorder }}>
        <BlurView intensity={60} tint={colors.isLight ? 'light' : 'dark'} experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        <View style={{ backgroundColor: colors.isLight ? 'rgba(250,249,246,0.92)' : argb('CC080D1A'), paddingHorizontal: 20, paddingTop: 12, paddingBottom: Math.max(28, insets.bottom + 12) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.goldAccent, fontSize: 18, fontWeight: '800' }}>{`₹${price}/min`}</Text>
              <Text style={{ color: isOnline ? '#3DCB7A' : colors.textMuted, fontSize: 11 }}>{isOnline ? '🟢 Available now' : '🔴 Currently offline'}</Text>
            </View>
            {([['Chat', 'Chat Now', 'chat_bubble_outline_rounded', true], ['Call', 'Call Now', 'call_rounded', false]] as const).map(([t, label, icon, primary], i) => (
              <Pressable
                key={t}
                testID={`astrologerDetail.${t.toLowerCase()}`}
                onPress={() => sheet.open(t)}
                style={{ marginLeft: i ? 8 : 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: primary ? '#713B32' : colors.surfaceVariant, borderWidth: 1, borderColor: primary ? '#713B32' : colors.cardBorder }}
              >
                <AppIcon name={icon} color={primary ? '#FFFFFF' : colors.goldAccent} size={16} />
                <Text style={{ marginLeft: 6, color: primary ? '#FFFFFF' : colors.textPrimary, fontSize: 13, fontWeight: '700' }}>{label}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable testID="astrologerDetail.book" onPress={() => sheet.open('Book')} style={{ marginTop: 10, borderRadius: 14, overflow: 'hidden' }}>
            <LinearGradient colors={['#713B32', '#8E4C41']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ paddingVertical: 14, alignItems: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>📅  Book Consultation</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>

      <BottomSheet visible={sheet.visible} onClose={sheet.close} testID="astrologerDetail.sheet">
        {sheet.value ? (
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderTopColor: colors.cardBorder, maxHeight: screenH * 0.85, overflow: 'hidden' }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: Math.max(36, insets.bottom + 24), alignItems: 'center' }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.divider }} />
              <Text style={{ marginTop: 16, color: colors.textPrimary, fontSize: 18, fontWeight: '700' }}>
                {sheet.value === 'Book' ? '📅 Book Consultation' : sheet.value === 'Chat' ? '💬 Start Chat' : '📞 Start Call'}
              </Text>
              <Text style={{ marginTop: 6, color: colors.textMuted, fontSize: 13 }}>{`with ${data.name}`}</Text>

            {/* Rates & Balance Summary */}
            <View style={{ marginTop: 16, alignSelf: 'stretch', padding: 14, borderRadius: 14, flexDirection: 'row', justifyContent: 'space-around', backgroundColor: colors.surfaceVariant, borderWidth: 1, borderColor: colors.cardBorder }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: colors.goldAccent, fontSize: 14, fontWeight: '700' }}>{`₹${price}/min`}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>Rate</Text>
              </View>
              <View style={{ width: 1, height: 28, backgroundColor: colors.divider }} />
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: '#FFB347', fontSize: 14, fontWeight: '700' }}>{`₹${minBalance}`}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>Min 5 min</Text>
              </View>
              <View style={{ width: 1, height: 28, backgroundColor: colors.divider }} />
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: isSufficient ? '#3DCB7A' : '#CF4444', fontSize: 14, fontWeight: '700' }}>{`₹${walletBalance}`}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>Your Wallet</Text>
              </View>
            </View>

            {/* Status & Feedback message */}
            {rechargeMsg ? (
              <View style={{ marginTop: 12, alignSelf: 'stretch', padding: 10, borderRadius: 10, backgroundColor: withAlpha(colors.goldAccent, 25), borderWidth: 1, borderColor: colors.goldAccent }}>
                <Text style={{ color: colors.textPrimary, fontSize: 12, textAlign: 'center' }}>{rechargeMsg}</Text>
              </View>
            ) : null}

            {isSufficient ? (
              <View style={{ marginTop: 14, alignSelf: 'stretch', padding: 10, borderRadius: 10, backgroundColor: argb('1A2D9E6B'), borderWidth: 1, borderColor: argb('332D9E6B'), flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#3DCB7A', fontSize: 12, fontWeight: '600' }}>
                  {`✓ Sufficient balance for ~${Math.floor(walletBalance / price)} minutes of consultation.`}
                </Text>
              </View>
            ) : (
              <View style={{ marginTop: 14, alignSelf: 'stretch', padding: 12, borderRadius: 12, backgroundColor: withAlpha('#CF4444', colors.isLight ? 20 : 25), borderWidth: 1, borderColor: withAlpha('#CF4444', 60) }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14 }}>⚠️</Text>
                  <Text style={{ marginLeft: 6, color: '#CF4444', fontSize: 12, fontWeight: '700' }}>Low Wallet Balance</Text>
                </View>
                <Text style={{ marginTop: 4, color: colors.textSecondary, fontSize: 11 }}>
                  {`Minimum 5-minute balance (₹${minBalance}) required to connect. Please add ₹${minBalance - walletBalance} or more.`}
                </Text>

                {/* Quick Add Buttons */}
                <View style={{ marginTop: 10, flexDirection: 'row', gap: 8 }}>
                  {[100, 250, 500].map((amt) => (
                    <Pressable
                      key={amt}
                      onPress={() => handleQuickRecharge(amt)}
                      disabled={isRecharging}
                      style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: withAlpha(colors.goldAccent, 25), borderWidth: 1, borderColor: withAlpha(colors.goldAccent, 60), alignItems: 'center' }}
                    >
                      <Text style={{ color: colors.goldAccent, fontSize: 12, fontWeight: '700' }}>{`+₹${amt}`}</Text>
                    </Pressable>
                  ))}
                </View>

                {/* Instant Recharge Action */}
                <Pressable
                  onPress={() => handleQuickRecharge(Math.max(100, Math.ceil(minBalance - walletBalance)))}
                  disabled={isRecharging}
                  style={{ marginTop: 10, borderRadius: 10, overflow: 'hidden' }}
                >
                  <LinearGradient colors={['#C9A84C', '#E2C26A']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ paddingVertical: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
                    {isRecharging ? (
                      <ActivityIndicator size="small" color={colors.isLight ? '#FFFFFF' : '#080D1A'} style={{ marginRight: 8 }} />
                    ) : null}
                    <Text style={{ color: colors.isLight ? '#FFFFFF' : '#080D1A', fontSize: 13, fontWeight: '800' }}>
                      {isRecharging ? 'Processing Recharge...' : `⚡ Quick Recharge ₹${Math.max(100, Math.ceil(minBalance - walletBalance))} (UPI/Cards)`}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </View>
            )}

            {/* Main Action Buttons */}
            <View style={{ marginTop: 16, alignSelf: 'stretch', gap: 10 }}>
              {!isAuth ? (
                <Pressable
                  testID="astrologerDetail.sheet.signIn"
                  onPress={() => {
                    sheet.close();
                    push(AppRoutes.signInScreen);
                  }}
                  style={{ borderRadius: 14, overflow: 'hidden' }}
                >
                  <LinearGradient colors={['#713B32', '#8E4C41']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ paddingVertical: 16, alignItems: 'center' }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>
                      🔐 Sign In to Consult Astrologer ↗
                    </Text>
                  </LinearGradient>
                </Pressable>
              ) : isSufficient ? (
                <Pressable testID="astrologerDetail.sheet.proceed" onPress={() => proceed(sheet.value!)} style={{ borderRadius: 14, overflow: 'hidden' }}>
                  <LinearGradient colors={['#713B32', '#8E4C41']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ paddingVertical: 16, alignItems: 'center' }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>
                      {sheet.value === 'Book' ? 'Confirm Booking' : `Proceed to ${sheet.value}`}
                    </Text>
                  </LinearGradient>
                </Pressable>
              ) : null}

              <Pressable
                onPress={() => {
                  sheet.close();
                  push(AppRoutes.walletScreen);
                }}
                style={{ paddingVertical: 10, alignItems: 'center' }}
              >
                <Text style={{ color: colors.textSecondary, fontSize: 12, textDecorationLine: 'underline' }}>
                  Go to Wallet & Transaction History →
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      ) : null}
      </BottomSheet>
    </View>
  );
}
