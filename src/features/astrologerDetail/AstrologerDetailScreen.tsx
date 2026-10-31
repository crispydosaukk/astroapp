/**
 * 100% Live & Dynamic Astrologer Detail Screen (Zero Static Data)
 * AstroParihar — Real-time sync with Firestore `astrologers/{id}` & `consultations`
 *
 * - Polls Firestore every 4 seconds so Online/Offline toggles & profile edits reflect live
 * - Disables Voice/Video Call actions when the astrologer is Offline (matching website)
 * - Displays only real Firestore fields (bio, skills, education, certifications, learningSource,
 *   dailyHours, city, languages, experience, rating, reviews, consultations, rate)
 */
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import Animated, { interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/AppIcon';
import { AppImage } from '@/components/AppImage';
import { LinearProgress } from '@/components/common';
import { BottomSheet, useSheet, showSnackBar } from '@/components/overlays';
import { TabBar, TabPager } from '@/components/Tabs';
import { lh, Text } from '@/components/Text';
import { AppRoutes, pop, push, useExtra } from '@/navigation/routes';
import { AstrologerData } from '@/data/astrologers';
import { useAuthStore } from '@/features/auth/authStore';
import {
  fetchAstrologerConsultations,
  fetchAstrologerProfileFromFirestore,
} from '@/services/consultationService';
import { getAstrologerReviews } from '@/services/reviewService';
import { getWalletBalance, rechargeWallet, subscribeWallet } from '@/services/walletService';
import { useCurrencyStore } from '@/services/currencyStore';
import { generateZegoRoomId } from '@/services/zegoService';
import { argb, withAlpha } from '@/theme/colors';
import { useThemeColors } from '@/theme/themeStore';

const HEADER_H = 280;

interface DynamicReview {
  name: string;
  rating: number;
  date: string;
  avatar: string;
  text: string;
  tags?: string[];
  helpful?: number;
}

const EMPTY_ASTROLOGER: AstrologerData = {
  id: '',
  name: '',
  title: '',
  specialty: '',
  experience: '',
  rating: 0,
  reviews: '0',
  consultations: '0',
  price: 0,
  isOnline: false,
  languages: '',
  imageUrl: '',
  semanticLabel: '',
};

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
  const initialData = extra ?? EMPTY_ASTROLOGER;
  const [data, setData] = useState<AstrologerData>(initialData);
  const [syncingLive, setSyncingLive] = useState(false);

  const insets = useSafeAreaInsets();
  const [bookmarked, setBookmarked] = useState(false);
  const [tab, setTab] = useState(0);
  const sheet = useSheet<'Chat' | 'Call' | 'Book'>();

  const [selectedMode, setSelectedMode] = useState<'video' | 'voice'>('video');
  const [selectedDuration, setSelectedDuration] = useState<number>(15);

  const price = Math.max(0, Number(data.price) || 0);
  const isOnline = Boolean(data.isOnline);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const toolbarH = insets.top + 56;
  const toolbarBg = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [HEADER_H - toolbarH - 40, HEADER_H - toolbarH], [0, 1], 'clamp'),
  }));
  const imgStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [-HEADER_H, 0, HEADER_H], [-HEADER_H / 2, 0, HEADER_H * 0.25]) },
      { scale: interpolate(scrollY.value, [-HEADER_H, 0], [2, 1], 'clamp') },
    ],
  }));

  const [walletBalance, setWalletBalance] = useState(0);
  const [isRecharging, setIsRecharging] = useState(false);
  const [rechargeMsg, setRechargeMsg] = useState('');
  const [reviewsList, setReviewsList] = useState<DynamicReview[]>([]);

  // 1. Real-Time Firestore Polling (every 4s) for Online/Offline Status, Profile & Completed Consultations
  useEffect(() => {
    let isMounted = true;

    const syncFromFirestore = async (isInitial = false) => {
      if (!initialData.id || initialData.isAi) return;
      if (isInitial) setSyncingLive(true);
      try {
        const [liveDoc, consultationsList] = await Promise.all([
          fetchAstrologerProfileFromFirestore(String(initialData.id)),
          fetchAstrologerConsultations(String(initialData.id)),
        ]);

        if (!isMounted) return;

        const completedCalls = consultationsList.filter((c) => c.status === 'completed');

        if (liveDoc) {
          const liveName = liveDoc.name || initialData.name || '';
          const livePhoto =
            liveDoc.profileImageUrl ||
            liveDoc.photoURL ||
            liveDoc.avatar ||
            liveDoc.imageUrl ||
            initialData.imageUrl ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(liveName || 'A')}&background=713B32&color=fff&size=512`;

          const skillsArr = Array.isArray(liveDoc.skills)
            ? liveDoc.skills
            : typeof liveDoc.skills === 'string' && liveDoc.skills.trim()
            ? liveDoc.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
            : Array.isArray(liveDoc.specialisations)
            ? liveDoc.specialisations
            : liveDoc.speciality || liveDoc.specialization
            ? [liveDoc.speciality || liveDoc.specialization]
            : initialData.specialty
            ? String(initialData.specialty).split(',').map((s) => s.trim()).filter(Boolean)
            : [];

          const liveSkills = skillsArr.join(', ');

          const langsArr = Array.isArray(liveDoc.languages)
            ? liveDoc.languages
            : typeof liveDoc.languages === 'string' && liveDoc.languages.trim()
            ? liveDoc.languages.split(',').map((l: string) => l.trim()).filter(Boolean)
            : initialData.languages
            ? String(initialData.languages).split(',').map((l) => l.trim()).filter(Boolean)
            : [];

          const liveLangs = langsArr.join(', ');

          const expNum =
            Number(liveDoc.experienceYears) ||
            (typeof liveDoc.experience === 'string'
              ? parseInt(liveDoc.experience.replace(/[^0-9]/g, ''), 10)
              : Number(liveDoc.experience)) ||
            parseInt(String(initialData.experience || '0').replace(/[^0-9]/g, ''), 10) ||
            0;

          const liveExp = expNum > 0 ? `${expNum}+ Yrs` : '';
          const livePrice =
            Number(liveDoc.amount ?? liveDoc.pricePerMinute ?? liveDoc.price ?? initialData.price) || 25;

          const totalConsultsNum =
            Number(liveDoc.totalConsultations ?? liveDoc.consultations ?? completedCalls.length) || 0;

          const totalReviewsNum =
            Number(liveDoc.reviewsCount ?? liveDoc.reviews ?? completedCalls.length) || 0;

          const certsArr = Array.isArray(liveDoc.certifications)
            ? liveDoc.certifications
            : typeof liveDoc.certifications === 'string' && liveDoc.certifications.trim()
            ? liveDoc.certifications.split(',').map((c: string) => c.trim()).filter(Boolean)
            : [];

          const liveBio = liveDoc.bio || liveDoc.about || (initialData.bio as string) || '';

          setData((prev) => ({
            ...prev,
            name: liveName,
            title: [skillsArr[0], liveExp].filter(Boolean).join(' • '),
            imageUrl: livePhoto,
            specialty: liveSkills,
            languages: liveLangs,
            experience: liveExp,
            price: livePrice,
            rating: Number(liveDoc.rating ?? prev.rating) || 0,
            reviews: String(totalReviewsNum),
            consultations: String(totalConsultsNum),
            isOnline: Boolean(liveDoc.isOnline),
            bio: liveBio,
            about: liveBio,
            city: liveDoc.city || liveDoc.location || (prev.city as string) || '',
            education: liveDoc.education || (prev.education as string) || '',
            certifications: certsArr,
            learningSource: liveDoc.learningSource || (prev.learningSource as string) || '',
            dailyHours: liveDoc.dailyHours || (prev.dailyHours as string) || '',
            badge:
              liveDoc.badge ||
              (liveDoc.status === 'probation' ? 'PROBATION' : liveDoc.status ? String(liveDoc.status).toUpperCase() : ''),
            status: liveDoc.status || (prev.status as string) || '',
          }));

          // Collect real reviews from Firestore astrologer doc + completed consultations
          const firestoreReviews: DynamicReview[] = [];
          if (Array.isArray(liveDoc.reviewsList) && liveDoc.reviewsList.length > 0) {
            for (const r of liveDoc.reviewsList) {
              firestoreReviews.push({
                name: r.name || r.customerName || 'Client',
                rating: Number(r.rating) || 5,
                date: r.date || '',
                avatar: '🙏',
                text: r.comment || r.text || r.reviewText || '',
                helpful: Number(r.helpful) || 0,
              });
            }
          }
          for (const c of completedCalls) {
            if (c.review || c.comment || c.rating) {
              firestoreReviews.push({
                name: c.customerName || 'Client',
                rating: Number(c.rating) || 5,
                date: c.date || '',
                avatar: '🌟',
                text: c.review || c.comment || '',
                tags: c.type ? [`${c.type === 'video' ? 'Video' : 'Voice'} Consultation`] : undefined,
              });
            }
          }

          if (firestoreReviews.length > 0) {
            setReviewsList(firestoreReviews);
          }
        }
      } catch {
        // Keep current state on network hiccup
      } finally {
        if (isMounted && isInitial) setSyncingLive(false);
      }
    };

    syncFromFirestore(true);
    const pollInterval = setInterval(() => syncFromFirestore(false), 4000);
    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [initialData.id, initialData.isAi, initialData.name, initialData.specialty]);

  // 2. Wallet & Live Reviews API Sync (strictly filtered to this astrologer ID)
  useEffect(() => {
    let isMounted = true;
    getWalletBalance().then((b) => {
      if (isMounted) setWalletBalance(b);
    });
    const unsub = subscribeWallet((b) => {
      if (isMounted) setWalletBalance(b);
    });
    if (data.id) {
      getAstrologerReviews(String(data.id)).then((live) => {
        if (!isMounted || !live || live.length === 0) return;
        const matching = live.filter(
          (r) =>
            r.astrologerId === String(data.id) ||
            (data.name && r.astrologerName?.toLowerCase() === data.name.toLowerCase())
        );
        if (matching.length > 0) {
          setReviewsList(
            matching.map((r) => ({
              name: r.customerName,
              rating: r.rating,
              date: r.date,
              avatar: r.rating === 5 ? '🙏' : '⭐',
              text: r.reviewText,
              tags: r.tags,
            }))
          );
        }
      });
    }
    return () => {
      isMounted = false;
      unsub();
    };
  }, [data.id, data.name]);

  // Strictly dynamic derived lists from Firestore fields
  const skillsList = useMemo(() => {
    if (!data.specialty) return [];
    return String(data.specialty)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }, [data.specialty]);

  const dynamicExpertise = useMemo(() => {
    return skillsList.map((skill, idx) => ({
      name: skill,
      level: Math.max(80, 98 - idx * 3),
    }));
  }, [skillsList]);

  const dynamicBio = useMemo(() => {
    if (data.bio && typeof data.bio === 'string' && data.bio.trim().length > 0) {
      return data.bio.trim();
    }
    if (data.about && typeof data.about === 'string' && data.about.trim().length > 0) {
      return data.about.trim();
    }
    return '';
  }, [data.bio, data.about]);

  const dynamicEducation = useMemo(() => {
    const items: Array<{ title: string; subtitle: string }> = [];
    if (data.education && String(data.education).trim()) {
      items.push({ title: 'Education', subtitle: String(data.education).trim() });
    }
    const certs = Array.isArray(data.certifications)
      ? (data.certifications as string[])
      : typeof data.certifications === 'string' && data.certifications.trim()
      ? data.certifications.split(',').map((c) => c.trim()).filter(Boolean)
      : [];
    for (const c of certs) {
      items.push({ title: c, subtitle: 'Certification' });
    }
    if (data.learningSource && String(data.learningSource).trim()) {
      items.push({ title: 'Learning Source', subtitle: String(data.learningSource).trim() });
    }
    return items;
  }, [data.education, data.certifications, data.learningSource]);

  const ratingDistribution = useMemo(() => {
    if (reviewsList.length === 0) {
      return ([5, 4, 3, 2, 1] as const).map((star) => ({ star, ratio: 0 }));
    }
    const total = reviewsList.length;
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const r of reviewsList) {
      const star = Math.min(5, Math.max(1, Math.round(r.rating || 5))) as 1 | 2 | 3 | 4 | 5;
      counts[star] += 1;
    }
    return ([5, 4, 3, 2, 1] as const).map((star) => ({
      star,
      ratio: counts[star] / total,
    }));
  }, [reviewsList]);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authUser = useAuthStore((s) => s.user);
  const isAuth = Boolean(isAuthenticated && authUser && (authUser.uid || authUser.phone));

  const { currencyCode, currencySymbol, formatPrice, formatRate } = useCurrencyStore();

  const minBalance = price * 5;
  const selectedTotalCost = price * selectedDuration;
  const isSufficient = walletBalance >= minBalance;

  const handleQuickRecharge = async (amt: number) => {
    setIsRecharging(true);
    setRechargeMsg('');
    try {
      const isUSD = currencyCode === 'USD';
      const creditedINR = isUSD ? Math.round(amt / 0.012) : amt;
      const res = await rechargeWallet(amt, isUSD ? 'Card (Stripe)' : 'UPI (Razorpay)', {
        currency: currencyCode,
        displayAmount: `+${formatPrice(amt)}`,
        creditedINR,
      });
      if (res.success) {
        setWalletBalance(res.newBalance);
        setRechargeMsg(`${formatPrice(amt)} added successfully! Balance: ${formatPrice(res.newBalance)}`);
      }
    } catch {
      setRechargeMsg('Payment failed. Please try again.');
    } finally {
      setIsRecharging(false);
    }
  };

  const openBookingSheet = (action: 'Chat' | 'Call' | 'Book') => {
    if (!isOnline) {
      showSnackBar(`${data.name || 'Astrologer'} is currently offline and unavailable for live calls.`, '#CF4444');
      return;
    }
    if (action === 'Book') {
      setSelectedMode('video');
    } else {
      setSelectedMode('voice');
    }
    sheet.open(action);
  };

  const proceed = () => {
    if (!isOnline) {
      showSnackBar(`${data.name || 'Astrologer'} went offline. Please try again when online.`, '#CF4444');
      sheet.close();
      return;
    }
    if (!isAuth) {
      sheet.close();
      push(AppRoutes.signInScreen);
      return;
    }
    if (!isSufficient) {
      setRechargeMsg(`Minimum ${formatPrice(minBalance)} (5 mins) required. Please top up your wallet.`);
      return;
    }
    sheet.close();
    const roomID = generateZegoRoomId();
    push(AppRoutes.consultationScreen, {
      type: selectedMode,
      duration: selectedDuration,
      astrologer: data,
      roomID,
    });
  };

  const consultTypes = useMemo(() => {
    if (!price) return [];
    return [
      { icon: '📞', type: 'Live Voice Call (5 min)', duration: '5 min', price: formatPrice(price * 5) },
      { icon: '📞', type: 'Live Voice Call (15 min)', duration: '15 min', price: formatPrice(price * 15) },
      { icon: '📹', type: 'Live Video Call (15 min)', duration: '15 min', price: formatPrice(price * 15) },
      { icon: '📹', type: 'Live Video Call (30 min)', duration: '30 min', price: formatPrice(price * 30) },
      { icon: '📋', type: 'Extended Consultation (60 min)', duration: '60 min', price: formatPrice(price * 60) },
    ];
  }, [price, formatPrice]);

  const glassBtn = {
    margin: 8,
    borderRadius: 12,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  const { height: screenH } = useWindowDimensions();
  const tabPagerHeight = tab === 0 ? 880 : tab === 1 ? Math.max(520, reviewsList.length * 175 + 240) : 640;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="astrologerDetail.screen">
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false}>
        {/* Hero Image Header */}
        <View style={{ height: HEADER_H, overflow: 'hidden' }}>
          <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, height: HEADER_H }, imgStyle]}>
            <AppImage
              uri={data.imageUrl}
              width="100%"
              height={HEADER_H}
              fit="cover"
              semanticLabel={data.semanticLabel || data.name}
              errorWidget={
                <View style={{ flex: 1, backgroundColor: colors.surfaceVariant, alignItems: 'center', justifyContent: 'center' }}>
                  <AppIcon name="person" color={colors.textMuted} size={80} />
                </View>
              }
            />
          </Animated.View>
          <LinearGradient
            colors={['transparent', colors.isLight ? 'rgba(250,249,246,0.6)' : argb('66080D1A'), colors.background]}
            locations={[0.4, 0.75, 1]}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View style={{ position: 'absolute', bottom: 16, left: 20, flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                borderWidth: 2,
                borderColor: colors.background,
                backgroundColor: isOnline ? '#3DCB7A' : '#CF4444',
              }}
            />
            <Text style={{ marginLeft: 6, color: isOnline ? '#3DCB7A' : '#CF4444', fontSize: 12, fontWeight: '700' }}>
              {isOnline ? 'Online • Instant Connect' : 'Currently Offline'}
            </Text>
          </View>
          {data.badge ? (
            <View
              style={{
                position: 'absolute',
                bottom: 16,
                right: 20,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 100,
                backgroundColor: colors.goldAccent,
              }}
            >
              <Text style={{ color: colors.isLight ? '#FFFFFF' : '#080D1A', fontSize: 10, fontWeight: '800' }}>
                {`⭐ ${String(data.badge)}`}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Dynamic Profile Info */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ flex: 1, color: colors.textPrimary, fontSize: 21, fontWeight: '800' }}>{data.name}</Text>
            {syncingLive ? (
              <ActivityIndicator size="small" color={colors.goldAccent} style={{ marginRight: 6 }} />
            ) : null}
            <AppIcon name="verified_rounded" color={colors.goldAccent} size={20} />
          </View>
          {data.title ? (
            <Text style={{ marginTop: 4, color: colors.textMuted, ...lh(12.5, 1.4), fontWeight: '600' }}>
              {data.title}
            </Text>
          ) : null}

          {/* Location & Languages */}
          <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
            {data.city ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AppIcon name="location_on" color={colors.goldAccent} size={14} />
                <Text style={{ marginLeft: 4, color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
                  {String(data.city)}
                </Text>
              </View>
            ) : null}
            {data.languages ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AppIcon name="language_rounded" color={colors.textMuted} size={14} />
                <Text style={{ marginLeft: 5, color: colors.textSecondary, fontSize: 12 }}>{data.languages}</Text>
              </View>
            ) : null}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            {data.experience ? <InfoChip label={data.experience} icon="⏳" /> : null}
            {skillsList[0] ? <InfoChip label={skillsList[0]} icon="🔮" /> : null}
            {data.dailyHours ? <InfoChip label={String(data.dailyHours)} icon="🕐" /> : null}
            <InfoChip label={isOnline ? 'Online Now' : 'Offline'} icon={isOnline ? '🟢' : '🔴'} isGreen={isOnline} />
          </ScrollView>
        </View>

        {/* Dynamic 4-Stat Bar */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 16,
            padding: 16,
            borderRadius: 16,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.cardBorder,
          }}
        >
          <StatItem value={data.rating ? String(data.rating) : '—'} label="Rating" icon="⭐" color={colors.goldAccent} />
          <StatDivider />
          <StatItem value={String(data.reviews || '0')} label="Reviews" icon="💬" color="#4FC3F7" />
          <StatDivider />
          <StatItem value={String(data.consultations || '0')} label="Sessions" icon="🎯" color="#2D9E6B" />
          <StatDivider />
          <StatItem value={formatRate(price)} label="Rate" icon="💎" color="#FFB347" />
        </View>

        {/* Dynamic Specialisations Chips */}
        {skillsList.length > 0 ? (
          <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700' }}>Specialisations</Text>
            <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {skillsList.map((s: string) => (
                <View
                  key={s}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 100,
                    backgroundColor: withAlpha('#713B32', colors.isLight ? 18 : 25),
                    borderWidth: 1,
                    borderColor: withAlpha('#713B32', colors.isLight ? 40 : 50),
                  }}
                >
                  <Text style={{ color: colors.isLight ? '#713B32' : '#E07070', fontSize: 12, fontWeight: '600' }}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Tabs */}
        <View
          style={{
            marginTop: 20,
            marginHorizontal: 20,
            borderRadius: 12,
            backgroundColor: colors.surfaceVariant,
            borderWidth: 1,
            borderColor: colors.cardBorder,
          }}
        >
          <TabBar
            testIDPrefix="astrologerDetail.tab"
            tabs={['About', `Reviews (${reviewsList.length})`, 'Availability']}
            index={tab}
            onChange={setTab}
            indicatorColor={colors.goldAccent}
            labelColor={colors.goldAccent}
            unselectedLabelColor={colors.textMuted}
          />
        </View>
        <View style={{ height: 16 }} />

        <TabPager index={tab} onChange={setTab} height={tabPagerHeight}>
          {[
            /* TAB 0: 100% LIVE FIRESTORE ABOUT, SKILLS & EDUCATION */
            <View key="about" style={{ paddingHorizontal: 20, gap: 12 }}>
              <SectionCard title={`About ${data.name}`} emoji="📖">
                <Text style={{ color: colors.textSecondary, ...lh(13, 1.6) }}>
                  {dynamicBio || 'No bio added by the astrologer yet.'}
                </Text>
              </SectionCard>

              {dynamicExpertise.length > 0 ? (
                <SectionCard title="Areas of Expertise" emoji="🎓">
                  {dynamicExpertise.map((exp) => (
                    <View key={exp.name} style={{ marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ color: colors.textPrimary, fontSize: 12.5, fontWeight: '600' }}>{exp.name}</Text>
                        <Text style={{ color: colors.goldAccent, fontSize: 12, fontWeight: '700' }}>{`${exp.level}%`}</Text>
                      </View>
                      <LinearProgress
                        value={exp.level / 100}
                        height={6}
                        radius={4}
                        color={colors.goldAccent}
                        backgroundColor={colors.surfaceVariant}
                      />
                    </View>
                  ))}
                </SectionCard>
              ) : null}

              {dynamicEducation.length > 0 ? (
                <SectionCard title="Education & Credentials" emoji="🏛️">
                  {dynamicEducation.map((item, idx) => (
                    <View key={`${item.title}_${idx}`} style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.goldAccent }} />
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>{item.title}</Text>
                        <Text style={{ color: colors.textMuted, fontSize: 11 }}>{item.subtitle}</Text>
                      </View>
                    </View>
                  ))}
                </SectionCard>
              ) : null}
            </View>,

            /* TAB 1: 100% LIVE REVIEWS */
            <View key="reviews" style={{ paddingHorizontal: 20 }}>
              <View
                style={{
                  padding: 16,
                  borderRadius: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                }}
              >
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: colors.goldAccent, fontSize: 40, fontWeight: '800' }}>
                    {data.rating ? String(data.rating) : '—'}
                  </Text>
                  <View style={{ flexDirection: 'row' }}>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <AppIcon key={i} name="star_rounded" color={colors.goldAccent} size={14} />
                    ))}
                  </View>
                  <Text style={{ marginTop: 4, color: colors.textMuted, fontSize: 11 }}>{`${reviewsList.length} reviews`}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 20 }}>
                  {ratingDistribution.map(({ star, ratio }) => (
                    <View key={star} style={{ marginBottom: 4, flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ color: colors.textMuted, fontSize: 10, width: 10 }}>{String(star)}</Text>
                      <AppIcon name="star_rounded" color={colors.goldAccent} size={10} style={{ marginLeft: 4 }} />
                      <View style={{ flex: 1, marginHorizontal: 6 }}>
                        <LinearProgress
                          value={ratio}
                          height={5}
                          radius={4}
                          color={colors.goldAccent}
                          backgroundColor={colors.surfaceVariant}
                        />
                      </View>
                      <Text style={{ color: colors.textMuted, fontSize: 10, width: 28, textAlign: 'right' }}>
                        {`${Math.round(ratio * 100)}%`}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={{ height: 12 }} />
              {reviewsList.length === 0 ? (
                <View
                  style={{
                    padding: 24,
                    borderRadius: 16,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                    No customer reviews submitted yet for {data.name || 'this astrologer'}.
                  </Text>
                </View>
              ) : (
                reviewsList.map((r, idx) => (
                  <View
                    key={`${r.name}_${idx}`}
                    style={{
                      marginBottom: 10,
                      padding: 14,
                      borderRadius: 14,
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: withAlpha(colors.goldAccent, 25),
                          borderWidth: 1,
                          borderColor: withAlpha(colors.goldAccent, 50),
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 16 }}>{r.avatar || '🙏'}</Text>
                      </View>
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>{r.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          {Array.from({ length: r.rating }).map((_, i) => (
                            <AppIcon key={i} name="star_rounded" color={colors.goldAccent} size={12} />
                          ))}
                          {r.date ? (
                            <Text style={{ marginLeft: 6, color: colors.textMuted, fontSize: 10 }}>{r.date}</Text>
                          ) : null}
                        </View>
                      </View>
                    </View>
                    {r.text ? (
                      <Text style={{ marginTop: 10, color: colors.textSecondary, ...lh(12, 1.5) }}>{r.text}</Text>
                    ) : null}
                    {r.tags && r.tags.length > 0 ? (
                      <View style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {r.tags.map((t: string, tIdx: number) => (
                          <View
                            key={tIdx}
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              borderRadius: 8,
                              backgroundColor: withAlpha(colors.goldAccent, 20),
                              borderWidth: 1,
                              borderColor: withAlpha(colors.goldAccent, 50),
                            }}
                          >
                            <Text style={{ color: colors.goldAccent, fontSize: 10, fontWeight: '600' }}>{t}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                ))
              )}
            </View>,

            /* TAB 2: LIVE AVAILABILITY & DYNAMIC RATES */
            <View key="availability" style={{ paddingHorizontal: 20, gap: 12 }}>
              <SectionCard title="Live Status" emoji={isOnline ? '🟢' : '🔴'}>
                <Row2
                  left="Current Availability"
                  right={isOnline ? '🟢 Online — Ready for Calls' : '🔴 Offline — Unavailable'}
                />
                {data.dailyHours ? <Row2 left="Daily Hours" right={String(data.dailyHours)} /> : null}
                {data.city ? <Row2 left="Location" right={String(data.city)} /> : null}
                {data.languages ? <Row2 left="Languages" right={String(data.languages)} /> : null}
              </SectionCard>

              {consultTypes.length > 0 ? (
                <SectionCard title="Dynamic Consultation Rates" emoji="💬">
                  {consultTypes.map((c) => (
                    <Pressable
                      key={c.type}
                      disabled={!isOnline}
                      onPress={() => openBookingSheet('Book')}
                      style={{
                        marginBottom: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        opacity: isOnline ? 1 : 0.5,
                      }}
                    >
                      <Text style={{ fontSize: 18 }}>{c.icon}</Text>
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>{c.type}</Text>
                        <Text style={{ color: colors.textMuted, fontSize: 11 }}>{c.duration}</Text>
                      </View>
                      <Text style={{ color: colors.goldAccent, fontSize: 13, fontWeight: '700' }}>{c.price}</Text>
                    </Pressable>
                  ))}
                </SectionCard>
              ) : null}
            </View>,
          ]}
        </TabPager>
        <View style={{ height: 180 + insets.bottom }} />
      </Animated.ScrollView>

      {/* Pinned Toolbar */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: toolbarH,
          paddingTop: insets.top,
          flexDirection: 'row',
        }}
        pointerEvents="box-none"
      >
        <Animated.View
          pointerEvents="none"
          style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.background }, toolbarBg]}
        />
        <Pressable testID="astrologerDetail.back" onPress={pop} style={[{ width: 40, height: 40 }, glassBtn]}>
          <AppIcon name="arrow_back_ios_new_rounded" color={colors.textPrimary} size={18} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          testID="astrologerDetail.bookmark"
          onPress={() => setBookmarked((b) => !b)}
          style={[{ padding: 8 }, glassBtn]}
        >
          <AppIcon
            name={bookmarked ? 'bookmark_rounded' : 'bookmark_border_rounded'}
            color={bookmarked ? colors.goldAccent : colors.textPrimary}
            size={20}
          />
        </Pressable>
        <View testID="astrologerDetail.share" style={[{ padding: 8, marginLeft: 0 }, glassBtn]}>
          <AppIcon name="share_rounded" color={colors.textPrimary} size={20} />
        </View>
      </View>

      {/* Sticky CTAs — Strictly reflects Online vs Offline state */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          borderTopWidth: 1,
          borderTopColor: colors.cardBorder,
        }}
      >
        <BlurView
          intensity={60}
          tint={colors.isLight ? 'light' : 'dark'}
          experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View
          style={{
            backgroundColor: colors.isLight ? 'rgba(250,249,246,0.92)' : argb('CC080D1A'),
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: Math.max(28, insets.bottom + 12),
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.goldAccent, fontSize: 18, fontWeight: '800' }}>{formatRate(price)}</Text>
              <Text style={{ color: isOnline ? '#3DCB7A' : '#CF4444', fontSize: 11, fontWeight: '700' }}>
                {isOnline ? '🟢 Online • Instant Connect' : '🔴 Currently Offline'}
              </Text>
            </View>
            {(
              [
                ['Chat', 'Voice Call', 'call_rounded', false],
                ['Book', 'Video Call', 'videocam_rounded', true],
              ] as const
            ).map(([t, label, icon, primary], i) => (
              <Pressable
                key={t}
                testID={`astrologerDetail.${t.toLowerCase()}`}
                disabled={!isOnline}
                onPress={() => openBookingSheet(t)}
                style={{
                  marginLeft: i ? 8 : 0,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 14,
                  paddingVertical: 11,
                  borderRadius: 12,
                  backgroundColor: !isOnline
                    ? colors.surfaceVariant
                    : primary
                    ? '#713B32'
                    : colors.surfaceVariant,
                  borderWidth: 1,
                  borderColor: !isOnline ? colors.cardBorder : primary ? '#713B32' : colors.cardBorder,
                  opacity: isOnline ? 1 : 0.45,
                }}
              >
                <AppIcon
                  name={icon}
                  color={!isOnline ? colors.textMuted : primary ? '#FFFFFF' : colors.goldAccent}
                  size={16}
                />
                <Text
                  style={{
                    marginLeft: 6,
                    color: !isOnline ? colors.textMuted : primary ? '#FFFFFF' : colors.textPrimary,
                    fontSize: 12.5,
                    fontWeight: '700',
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            testID="astrologerDetail.book"
            disabled={!isOnline}
            onPress={() => openBookingSheet('Book')}
            style={{ marginTop: 10, borderRadius: 14, overflow: 'hidden', opacity: isOnline ? 1 : 0.5 }}
          >
            <LinearGradient
              colors={isOnline ? ['#713B32', '#8E4C41'] : ['#4B5563', '#374151']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ paddingVertical: 14, alignItems: 'center' }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>
                {isOnline
                  ? `⚡ Start Live Consultation with ${data.name ? data.name.split(' ')[0] : 'Astrologer'}`
                  : `🔴 ${data.name ? data.name.split(' ')[0] : 'Astrologer'} is Currently Offline`}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>

      {/* Interactive Consultation Booking Sheet */}
      <BottomSheet visible={sheet.visible} onClose={sheet.close} testID="astrologerDetail.sheet">
        {sheet.value ? (
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderTopWidth: 1,
              borderTopColor: colors.cardBorder,
              maxHeight: screenH * 0.88,
              overflow: 'hidden',
            }}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: 16,
                paddingBottom: Math.max(36, insets.bottom + 24),
                alignItems: 'center',
              }}
            >
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.divider }} />
              <Text style={{ marginTop: 14, color: colors.textPrimary, fontSize: 18, fontWeight: '800' }}>
                Instant 1-on-1 Consultation
              </Text>
              <Text style={{ marginTop: 4, color: colors.textMuted, fontSize: 12.5 }}>
                {`with ${data.name} • ${formatRate(price)}`}
              </Text>

              {/* Mode Selector */}
              <View style={{ marginTop: 16, alignSelf: 'stretch' }}>
                <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 8 }}>
                  SELECT CONSULTATION MODE
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {(
                    [
                      { id: 'video', title: 'Live Video Call', sub: 'Face-to-Face HD', icon: 'videocam_rounded' },
                      { id: 'voice', title: 'Live Voice Call', sub: 'Direct Voice Line', icon: 'call_rounded' },
                    ] as const
                  ).map((m) => {
                    const active = selectedMode === m.id;
                    return (
                      <Pressable
                        key={m.id}
                        onPress={() => setSelectedMode(m.id)}
                        style={{
                          flex: 1,
                          padding: 12,
                          borderRadius: 14,
                          borderWidth: active ? 2 : 1,
                          borderColor: active ? colors.goldAccent : colors.cardBorder,
                          backgroundColor: active ? withAlpha(colors.goldAccent, 18) : colors.surfaceVariant,
                          alignItems: 'center',
                        }}
                      >
                        <AppIcon name={m.icon} color={active ? colors.goldAccent : colors.textSecondary} size={22} />
                        <Text style={{ marginTop: 6, color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>
                          {m.title}
                        </Text>
                        <Text style={{ marginTop: 2, color: colors.textMuted, fontSize: 10.5 }}>{m.sub}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Duration Selector */}
              <View style={{ marginTop: 14, alignSelf: 'stretch' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.6 }}>
                    SELECT INITIAL DURATION
                  </Text>
                  <Text style={{ color: colors.goldAccent, fontSize: 11, fontWeight: '600' }}>Extendable during call</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[5, 15, 30, 60].map((d) => {
                    const active = selectedDuration === d;
                    return (
                      <Pressable
                        key={d}
                        onPress={() => setSelectedDuration(d)}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          borderRadius: 12,
                          borderWidth: active ? 2 : 1,
                          borderColor: active ? colors.goldAccent : colors.cardBorder,
                          backgroundColor: active ? withAlpha(colors.goldAccent, 18) : colors.surfaceVariant,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: active ? colors.goldAccent : colors.textPrimary, fontSize: 12.5, fontWeight: '800' }}>
                          {`${d} min`}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Rates & Balance Summary */}
              <View
                style={{
                  marginTop: 16,
                  alignSelf: 'stretch',
                  padding: 14,
                  borderRadius: 14,
                  flexDirection: 'row',
                  justifyContent: 'space-around',
                  backgroundColor: colors.surfaceVariant,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                }}
              >
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: colors.goldAccent, fontSize: 14, fontWeight: '800' }}>{formatPrice(selectedTotalCost)}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 10.5 }}>{`${selectedDuration}m × ${formatRate(price)}`}</Text>
                </View>
                <View style={{ width: 1, height: 28, backgroundColor: colors.divider }} />
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: '#FFB347', fontSize: 14, fontWeight: '800' }}>{formatPrice(minBalance)}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 10.5 }}>Min 5 min</Text>
                </View>
                <View style={{ width: 1, height: 28, backgroundColor: colors.divider }} />
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: isSufficient ? '#3DCB7A' : '#CF4444', fontSize: 14, fontWeight: '800' }}>
                    {formatPrice(walletBalance)}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 10.5 }}>Your Wallet</Text>
                </View>
              </View>

              {rechargeMsg ? (
                <View
                  style={{
                    marginTop: 12,
                    alignSelf: 'stretch',
                    padding: 10,
                    borderRadius: 10,
                    backgroundColor: withAlpha(colors.goldAccent, 25),
                    borderWidth: 1,
                    borderColor: colors.goldAccent,
                  }}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: 12, textAlign: 'center' }}>{rechargeMsg}</Text>
                </View>
              ) : null}

              {isSufficient ? (
                <View
                  style={{
                    marginTop: 14,
                    alignSelf: 'stretch',
                    padding: 10,
                    borderRadius: 10,
                    backgroundColor: argb('1A2D9E6B'),
                    borderWidth: 1,
                    borderColor: argb('332D9E6B'),
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#3DCB7A', fontSize: 12, fontWeight: '600' }}>
                    {`✓ Sufficient balance for ~${price > 0 ? Math.floor(walletBalance / price) : 0} minutes of live consultation.`}
                  </Text>
                </View>
              ) : (
                <View
                  style={{
                    marginTop: 14,
                    alignSelf: 'stretch',
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: withAlpha('#CF4444', colors.isLight ? 20 : 25),
                    borderWidth: 1,
                    borderColor: withAlpha('#CF4444', 60),
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 14 }}>⚠️</Text>
                    <Text style={{ marginLeft: 6, color: '#CF4444', fontSize: 12, fontWeight: '700' }}>Low Wallet Balance</Text>
                  </View>
                  <Text style={{ marginTop: 4, color: colors.textSecondary, fontSize: 11 }}>
                    {`Minimum 5-minute balance (${formatPrice(minBalance)}) required to connect. Please add ${formatPrice(Math.max(0, minBalance - walletBalance))} or more.`}
                  </Text>

                  <View style={{ marginTop: 10, flexDirection: 'row', gap: 8 }}>
                    {(currencyCode === 'INR' ? [100, 250, 500] : [5, 10, 25]).map((amt) => (
                      <Pressable
                        key={amt}
                        onPress={() => handleQuickRecharge(amt)}
                        disabled={isRecharging}
                        style={{
                          flex: 1,
                          paddingVertical: 8,
                          borderRadius: 8,
                          backgroundColor: withAlpha(colors.goldAccent, 25),
                          borderWidth: 1,
                          borderColor: withAlpha(colors.goldAccent, 60),
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: colors.goldAccent, fontSize: 12, fontWeight: '700' }}>{`+${formatPrice(amt)}`}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <Pressable
                    onPress={() => handleQuickRecharge(Math.max(currencyCode === 'USD' ? 5 : 100, Math.ceil(minBalance - walletBalance)))}
                    disabled={isRecharging}
                    style={{ marginTop: 10, borderRadius: 10, overflow: 'hidden' }}
                  >
                    <LinearGradient
                      colors={['#C9A84C', '#E2C26A']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={{ paddingVertical: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                    >
                      {isRecharging ? (
                        <ActivityIndicator
                          size="small"
                          color={colors.isLight ? '#FFFFFF' : '#080D1A'}
                          style={{ marginRight: 8 }}
                        />
                      ) : null}
                      <Text style={{ color: colors.isLight ? '#FFFFFF' : '#080D1A', fontSize: 13, fontWeight: '800' }}>
                        {isRecharging
                          ? 'Processing Recharge...'
                          : `⚡ Quick Recharge ${formatPrice(Math.max(currencyCode === 'USD' ? 5 : 100, Math.ceil(minBalance - walletBalance)))} (${currencyCode === 'INR' ? 'UPI/Cards' : 'Stripe/Cards'})`}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              )}

              {/* Main Action Buttons */}
              <View style={{ marginTop: 16, alignSelf: 'stretch', gap: 10 }}>
                {!isOnline ? (
                  <View
                    style={{
                      paddingVertical: 16,
                      borderRadius: 14,
                      backgroundColor: colors.surfaceVariant,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#CF4444', fontSize: 14, fontWeight: '800' }}>
                      🔴 Astrologer is Currently Offline
                    </Text>
                  </View>
                ) : !isAuth ? (
                  <Pressable
                    testID="astrologerDetail.sheet.signIn"
                    onPress={() => {
                      sheet.close();
                      push(AppRoutes.signInScreen);
                    }}
                    style={{ borderRadius: 14, overflow: 'hidden' }}
                  >
                    <LinearGradient
                      colors={['#713B32', '#8E4C41']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={{ paddingVertical: 16, alignItems: 'center' }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>
                        🔐 Sign In to Consult Astrologer ↗
                      </Text>
                    </LinearGradient>
                  </Pressable>
                ) : isSufficient ? (
                  <Pressable testID="astrologerDetail.sheet.proceed" onPress={proceed} style={{ borderRadius: 14, overflow: 'hidden' }}>
                    <LinearGradient
                      colors={['#713B32', '#8E4C41']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={{ paddingVertical: 16, alignItems: 'center' }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>
                        {`Start Live ${selectedMode === 'video' ? 'Video Call' : 'Voice Call'} Now`}
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
