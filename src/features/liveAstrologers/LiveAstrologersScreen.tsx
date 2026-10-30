/**
 * Port of lib/presentation/live_astrologers_screen/ (screen + card, filter sheet, search header, category chips).
 * - search by name OR specialty (case-insensitive), category filter, online-only filter
 * - filter sheet: only "Show Online Only" is applied by the source; sort/price/gender/language chips
 *   hold local sheet state but are NOT applied (parity — recorded in docs/source-inert-controls.md)
 * - card entrance: 400 ms fade + 5 % slide-up, delay index*60 ms (max 400)
 * - search field is uncontrolled in source, so "Clear Filters" resets the query but not the visible text
 */
import { BlurView } from 'expo-blur';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/components/AnimatedBox';
import { AppIcon } from '@/components/AppIcon';
import { AppImage } from '@/components/AppImage';
import { ElevatedButton, Switch } from '@/components/common';
import { BottomSheet } from '@/components/overlays';
import { Text, TextInput } from '@/components/Text';
import { AstrologerData } from '@/data/astrologers';
import { useAuthStore } from '@/features/auth/authStore';
import { fetchAiAstrologers, fetchRealAstrologers } from '@/services/homeDataService';
import { generateZegoRoomId } from '@/services/zegoService';
import { AppRoutes, push } from '@/navigation/routes';
import { argb, withAlpha } from '@/theme/colors';
import { useThemeColors } from '@/theme/themeStore';

/* ----------------------------------------------------- search header widget */
function SearchHeader({
  onlineCount,
  astrologerType,
  onSearchChanged,
  onFilterTap,
}: {
  onlineCount: number;
  astrologerType: 'real' | 'ai';
  onSearchChanged: (q: string) => void;
  onFilterTap: () => void;
}) {
  const colors = useThemeColors();
  const isReal = astrologerType === 'real';

  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '800' }}>
            {isReal ? 'Verified Real Astrologers' : '24/7 AI Astrologers'}
          </Text>
          <Text style={{ color: colors.isLight ? '#7C5205' : colors.goldAccent, fontSize: 11, fontWeight: '600', marginTop: 1 }}>
            {isReal ? 'Authentic Human Masters from Backend Onboarding' : 'Autonomous Astronomical Engine with AstroParihar AI'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 100, backgroundColor: colors.isLight ? '#DCFCE7' : argb('1A3DCB7A'), borderWidth: 1, borderColor: colors.isLight ? '#86EFAC' : argb('333DCB7A') }}>
          <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.isLight ? '#16A34A' : '#3DCB7A' }} />
          <Text style={{ marginLeft: 5, color: colors.isLight ? '#15803D' : '#3DCB7A', fontSize: 12, fontWeight: '700' }}>{`${onlineCount} Online`}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', marginTop: 12 }}>
        <View style={{ flex: 1, height: 46, borderRadius: 100, backgroundColor: colors.isLight ? '#FFFFFF' : argb('0FFFFFFF'), borderWidth: 1.5, borderColor: colors.isLight ? 'rgba(201,168,76,0.38)' : argb('1AC9A84C'), flexDirection: 'row', alignItems: 'center' }}>
          <AppIcon name="search_rounded" color={colors.isLight ? '#8E99A8' : '#6B7A99'} size={20} style={{ marginLeft: 14 }} />
          <TextInput
            testID="liveAstrologers.search"
            onChangeText={onSearchChanged}
            placeholder={isReal ? 'Search real astrologers by name or specialty...' : 'Search AI astrological guides...'}
            placeholderTextColor={colors.isLight ? '#8E99A8' : '#6B7A99'}
            style={{ flex: 1, marginLeft: 10, color: colors.textPrimary, fontSize: 14 }}
          />
        </View>
        <Pressable
          testID="liveAstrologers.filter"
          onPress={onFilterTap}
          style={{ marginLeft: 10, width: 46, height: 46, borderRadius: 14, backgroundColor: colors.isLight ? '#FFFFFF' : argb('0FFFFFFF'), borderWidth: 1.5, borderColor: colors.isLight ? 'rgba(201,168,76,0.38)' : argb('1AC9A84C'), alignItems: 'center', justifyContent: 'center' }}
        >
          <AppIcon name="tune_rounded" color={colors.goldAccent} size={22} />
        </Pressable>
      </View>
    </View>
  );
}

const CATEGORIES = [
  { label: 'All', emoji: '✦' },
  { label: 'Remedies', emoji: '🪔' },
  { label: 'Love', emoji: '❤️' },
  { label: 'Marriage', emoji: '💍' },
  { label: 'Career', emoji: '💼' },
  { label: 'Vedic', emoji: '🕉️' },
  { label: 'Finance', emoji: '💰' },
  { label: 'Numerology', emoji: '🔢' },
  { label: 'Vastu', emoji: '🏛️' },
  { label: 'Spirituality', emoji: '🧘' },
  { label: 'Tarot', emoji: '🃏' },
  { label: 'KP', emoji: '📐' },
  { label: 'Nadi', emoji: '📜' },
  { label: 'Gemstones', emoji: '💎' },
  { label: 'Rudraksha', emoji: '📿' },
  { label: 'Yantra', emoji: '🔯' },
  { label: 'Mantra', emoji: '🔔' },
  { label: 'Homa', emoji: '🔥' },
  { label: 'Devata', emoji: '🪔' },
  { label: 'Dāna & Seva', emoji: '🤲' },
];
function CategoryChips({ selected, onSelect }: { selected: string; onSelect: (c: string) => void }) {
  const colors = useThemeColors();
  return (
    <View style={{ height: 48 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 6, alignItems: 'center' }}>
        {CATEGORIES.map((c) => {
          const sel = selected === c.label;
          return (
            <AnimatedPressable
              key={c.label}
              testID={`liveAstrologers.category.${c.label}`}
              onPress={() => onSelect(c.label)}
              duration={200}
              style={{
                marginRight: 8,
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 100,
                borderWidth: 1,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: sel ? '#713B32' : (colors.isLight ? '#FFFFFF' : argb('0FFFFFFF')),
                borderColor: sel ? '#713B32' : (colors.isLight ? 'rgba(201,168,76,0.38)' : argb('1AC9A84C')),
              }}
            >
              <Text style={{ fontSize: 12 }}>{c.emoji}</Text>
              <Text style={{ marginLeft: 5, color: sel ? '#FFFFFF' : (colors.isLight ? '#4A5568' : '#7E8BA8'), fontSize: 12, fontWeight: sel ? '700' : '600' }}>{c.label}</Text>
            </AnimatedPressable>
          );
        })}
      </ScrollView>
    </View>
  );
}


export const AI_ASTROLOGERS_DATA: AstrologerData[] = [
  {
    id: 'acharya-devavrat',
    name: 'Acharya Devavrat (AI)',
    specialty: 'Parashara Vedic Astrology, Dasha Analysis & Remedies',
    title: 'Autonomous Vedic Ephemeris Grandmaster',
    experience: '1,20,000+ charts',
    rating: 4.99,
    reviews: '38,420',
    consultations: '38k+',
    price: 10,
    isOnline: true,
    languages: 'English, Hindi, Telugu, Tamil, Kannada',
    imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&fit=crop',
    semanticLabel: 'Revered Vedic Acharya with sacred saffron robes',
    category: 'Vedic',
    isAi: true,
    isFeatured: true,
    discount: 'Free 3 min trial',
  },
  {
    id: 'vedika',
    name: 'AstroParihar AI',
    specialty: 'Sub-Second Planetary Math, Gochara & KP Astrology',
    title: 'Precision Astronomical Vedic Engine',
    experience: '2,50,000+ calculations',
    rating: 4.98,
    reviews: '42,100',
    consultations: '42k+',
    price: 5,
    isOnline: true,
    languages: 'English, Hindi, Telugu, Tamil',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&fit=crop',
    semanticLabel: 'Celestial luminous AI seer with planetary rings',
    category: 'KP',
    isAi: true,
    isFeatured: true,
    discount: 'Instant <1s reply',
  },
  {
    id: 'ai-guru-brihaspati',
    name: 'Guru Brihaspati (AI)',
    specialty: 'Higher Dharma, Dasha Transits & Spiritual Sadhana',
    title: 'Autonomous Celestial AI Mentor • Instant Voice',
    experience: '95,000+ charts',
    rating: 4.99,
    reviews: '29,800',
    consultations: '29k+',
    price: 15,
    isOnline: true,
    languages: 'Hindi, English, Sanskrit',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&fit=crop',
    semanticLabel: 'Autonomous celestial AI sage',
    category: 'Spirituality',
    isAi: true,
    isFeatured: false,
    discount: 'Top Spiritual AI Seer',
  },
  {
    id: 'astro-ananya',
    name: 'Astro Ananya (AI)',
    specialty: 'Love, Marriage Compatibility & Nadi Dosha Parihars',
    title: 'Nadi & Kundli Seer • Relationship Expert',
    experience: '80,000+ matchings',
    rating: 4.97,
    reviews: '24,600',
    consultations: '24k+',
    price: 10,
    isOnline: true,
    languages: 'English, Hindi, Telugu, Tamil',
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&fit=crop',
    semanticLabel: 'Warm compassionate female Vedic astrologer',
    category: 'Marriage',
    isAi: true,
    isFeatured: false,
    discount: '98% Compatibility Accuracy',
  },
  {
    id: 'arjun-pandit',
    name: 'Arjun Pandit (AI)',
    specialty: 'Career Growth, Business Timing & Wealth Astrology',
    title: 'Vedic Kundli Prodigy & Financial Strategist',
    experience: '65,000+ career charts',
    rating: 4.96,
    reviews: '18,900',
    consultations: '18k+',
    price: 12,
    isOnline: true,
    languages: 'English, Hindi, Gujarati, Marathi',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&fit=crop',
    semanticLabel: 'Sharp modern Vedic astrologer in traditional attire',
    category: 'Career',
    isAi: true,
    isFeatured: false,
    discount: 'Promotion & Job Timing',
  },
  {
    id: 'pandit-raghav',
    name: 'Pandit Raghavendra (AI)',
    specialty: 'Lal Kitab Upaay, Gemstones, Rudraksha & Homa Parihar',
    title: 'Lal Kitab Master & Vedic Remedies Authority',
    experience: '75,000+ remedies prescribed',
    rating: 4.98,
    reviews: '22,300',
    consultations: '22k+',
    price: 10,
    isOnline: true,
    languages: 'Hindi, Telugu, Kannada, English',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&fit=crop',
    semanticLabel: 'Elderly priest with sacred tilak and yellow scarf',
    category: 'Remedies',
    isAi: true,
    isFeatured: false,
    discount: 'Custom 48-day Upaay',
  },
];

export function AstrologerCard({ data, index }: { data: AstrologerData; index: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(Math.min(300, index * 40), withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) }));
  }, [index, p]);
  const anim = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: (1 - p.value) * 16 }],
  }));
  const featured = !!data.isFeatured;
  const isAi = !!data.isAi;

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authUser = useAuthStore((s) => s.user);
  const isAuth = Boolean(isAuthenticated && authUser && (authUser.uid || authUser.phone));

  const open = () => {
    if (isAi) {
      if (!isAuth) {
        push(AppRoutes.signInScreen);
        return;
      }
      push(AppRoutes.aiChatScreen, {
        astrologerId: data.id as string,
        astrologerName: data.name,
        avatarUrl: data.imageUrl,
      });
    } else {
      push(AppRoutes.astrologerDetailScreen, data);
    }
  };

  const callAction = () => {
    if (!isAuth) {
      push(AppRoutes.signInScreen);
      return;
    }
    if (isAi) {
      const roomID = generateZegoRoomId('ai_call');
      push(AppRoutes.consultationScreen, {
        type: 'voice',
        astrologer: data,
        roomID,
      });
    } else {
      push(AppRoutes.astrologerDetailScreen, data);
    }
  };

  const id = `liveAstrologers.card.${index}`;
  const colors = useThemeColors();

  return (
    <Animated.View style={[{ marginBottom: 12 }, anim]}>
      <Pressable testID={id} onPress={open}>
        <View
          style={{
            flexDirection: 'row',
            borderRadius: 18,
            padding: 12,
            backgroundColor: colors.surface,
            borderWidth: featured || isAi ? 1.5 : 1,
            borderColor: isAi ? '#713B32' : featured ? colors.goldAccent : colors.cardBorder,
            shadowColor: '#000',
            shadowOpacity: colors.isLight ? 0.05 : 0.2,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          {/* Left Column: Compact Avatar & Online Indicator */}
          <View style={{ alignItems: 'center', width: 72, marginRight: 12 }}>
            <View style={{ width: 68, height: 68, borderRadius: 16, overflow: 'hidden', borderWidth: 1.5, borderColor: colors.goldAccent }}>
              <AppImage
                uri={data.imageUrl}
                width="100%"
                height="100%"
                fit="cover"
                semanticLabel={data.semanticLabel}
                errorWidget={
                  <View style={{ width: '100%', height: '100%', backgroundColor: '#1A2A3D', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#C9A84C', fontSize: 20, fontWeight: '800' }}>
                      {(data.name || 'A').replace(/^(Acharya|Swami|Pt\.|Pandit|Guru|Dr\.)\s+/i, '')[0] || 'A'}
                    </Text>
                  </View>
                }
              />
              {/* Online Indicator */}
              <View
                style={{
                  position: 'absolute',
                  top: 3,
                  right: 3,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  borderWidth: 1.5,
                  borderColor: colors.surface,
                  backgroundColor: data.isOnline ? '#3DCB7A' : '#6B7A99',
                }}
              />
            </View>

            {/* AI or Live Online/Offline Status Pill Badge */}
            {isAi ? (
              <View style={{ marginTop: 5, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: '#713B32', borderWidth: 0.5, borderColor: '#C9A84C' }}>
                <Text style={{ textAlign: 'center', color: '#F0EAD6', fontSize: 8, fontWeight: '800' }}>🔮 AI GURU</Text>
              </View>
            ) : (
              <View
                style={{
                  marginTop: 5,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 6,
                  backgroundColor: data.isOnline
                    ? colors.isLight
                      ? '#DCFCE7'
                      : argb('263DCB7A')
                    : colors.surfaceVariant,
                  borderWidth: 0.5,
                  borderColor: data.isOnline ? '#3DCB7A' : colors.cardBorder,
                }}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    color: data.isOnline ? (colors.isLight ? '#15803D' : '#3DCB7A') : colors.textMuted,
                    fontSize: 8,
                    fontWeight: '800',
                  }}
                >
                  {data.isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}
                </Text>
              </View>
            )}
          </View>

          {/* Right Column: Detailed Info & Compact Actions */}
          <View style={{ flex: 1, justifyContent: 'space-between' }}>
            {/* Header: Name & Price */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: 6 }}>
                <Text numberOfLines={1} style={{ color: colors.textPrimary, fontSize: 14.5, fontWeight: '700' }}>
                  {data.name}
                </Text>
                <AppIcon name={isAi ? 'auto_awesome_rounded' : 'verified_rounded'} color={colors.goldAccent} size={14} style={{ marginLeft: 4 }} />
              </View>
              <Text style={{ color: colors.goldAccent, fontSize: 13.5, fontWeight: '800' }}>
                {`₹${data.price}/min`}
              </Text>
            </View>

            {/* Specialty / Title */}
            <Text numberOfLines={1} style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
              {data.title || data.specialty}
            </Text>

            {/* Rating, Reviews & Experience */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <AppIcon name="star_rounded" color={colors.goldAccent} size={13} />
              <Text style={{ marginLeft: 2, color: colors.goldAccent, fontSize: 11.5, fontWeight: '700' }}>
                {String(data.rating || 'New')}
              </Text>
              {data.reviews && data.reviews !== '0' ? (
                <Text style={{ marginLeft: 3, color: colors.textMuted, fontSize: 10.5 }}>
                  {`(${data.reviews})`}
                </Text>
              ) : null}
              {data.experience ? (
                <>
                  <Text style={{ marginHorizontal: 4, color: colors.textMuted, fontSize: 10 }}>•</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 10.5, fontWeight: '600' }}>
                    {data.experience}
                  </Text>
                </>
              ) : null}
            </View>

            {/* Languages */}
            {data.languages ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                <AppIcon name="language_rounded" color={colors.textMuted} size={11} />
                <Text numberOfLines={1} style={{ marginLeft: 3, flex: 1, color: colors.textMuted, fontSize: 10.5 }}>
                  {data.languages}
                </Text>
              </View>
            ) : null}

            {/* Bottom Row: Sessions Count + Chat & Call CTAs (Disabled when Offline) */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={{ color: colors.textMuted, fontSize: 10 }}>
                {data.consultations && data.consultations !== '0'
                  ? `${data.consultations} sessions`
                  : data.isOnline
                  ? 'Available Now'
                  : 'Currently Offline'}
              </Text>
              {!isAi && !data.isOnline ? (
                <Pressable
                  testID={`${id}.offlineProfile`}
                  onPress={open}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 11,
                    paddingVertical: 5.5,
                    borderRadius: 100,
                    backgroundColor: colors.surfaceVariant,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                  }}
                >
                  <Text style={{ color: colors.textMuted, fontSize: 10.5, fontWeight: '700' }}>
                    Offline • View Profile →
                  </Text>
                </Pressable>
              ) : (
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <Pressable
                    testID={`${id}.chat`}
                    onPress={open}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 11,
                      paddingVertical: 5.5,
                      borderRadius: 100,
                      backgroundColor: '#713B32',
                    }}
                  >
                    <AppIcon name={isAi ? 'auto_awesome_rounded' : 'chat_bubble_outline_rounded'} color="#FFFFFF" size={11} />
                    <Text style={{ marginLeft: 3, color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>
                      {isAi ? 'Chat AI' : 'Chat'}
                    </Text>
                  </Pressable>

                  <Pressable
                    testID={`${id}.call`}
                    onPress={callAction}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 11,
                      paddingVertical: 5.5,
                      borderRadius: 100,
                      backgroundColor: colors.isLight ? 'rgba(201,168,76,0.18)' : 'rgba(255,255,255,0.08)',
                      borderWidth: 1,
                      borderColor: colors.goldAccent,
                    }}
                  >
                    <AppIcon name={isAi ? 'headset_mic_rounded' : 'call_rounded'} color={colors.goldAccent} size={11} />
                    <Text style={{ marginLeft: 3, color: colors.goldAccent, fontSize: 11, fontWeight: '700' }}>
                      {isAi ? 'Voice AI' : 'Call'}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/* ----------------------------------------------------- filter sheet widget */
function SectionLabel({ label }: { label: string }) {
  return <Text style={{ color: '#6B7A99', fontSize: 11, fontWeight: '700', letterSpacing: 1.2 }}>{label.toUpperCase()}</Text>;
}
function ChipGroup({ options, selected, onSelected, idPrefix }: { options: string[]; selected: string; onSelected: (v: string) => void; idPrefix: string }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
      {options.map((o) => {
        const sel = selected === o;
        return (
          <AnimatedPressable
            key={o}
            testID={`${idPrefix}.${o}`}
            onPress={() => onSelected(o)}
            duration={180}
            style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, borderWidth: 1, backgroundColor: sel ? '#713B32' : argb('0FFFFFFF'), borderColor: sel ? '#713B32' : argb('1AC9A84C') }}
          >
            <Text style={{ color: sel ? '#F0EAD6' : '#6B7A99', fontSize: 13, fontWeight: sel ? '700' : '400' }}>{o}</Text>
          </AnimatedPressable>
        );
      })}
    </View>
  );
}

function FilterSheet({ onlineOnly, onOnlineChanged, onClose }: { onlineOnly: boolean; onOnlineChanged: (v: boolean) => void; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [online, setOnline] = useState(onlineOnly);
  const [sort, setSort] = useState('Top Rated');
  const [price, setPrice] = useState('All');
  const [gender, setGender] = useState('All');
  const [language, setLanguage] = useState('All');
  return (
    <View style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', borderTopWidth: 1, borderTopColor: argb('33C9A84C') }}>
      <BlurView intensity={60} tint="dark" experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <ScrollView style={{ backgroundColor: withAlpha('#0D1B2A', 242) }} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: insets.bottom + 24 }}>
        <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 100, backgroundColor: '#2A3550' }} />
        <Text style={{ marginTop: 20, color: '#F0EAD6', fontSize: 18, fontWeight: '700' }}>Filter Astrologers</Text>
        <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, backgroundColor: argb('0FFFFFFF'), borderWidth: 1, borderColor: argb('1AC9A84C') }}>
          <Text style={{ flex: 1, color: '#F0EAD6', fontSize: 14, fontWeight: '500' }}>Show Online Only</Text>
          <Switch testID="liveAstrologers.filter.onlineOnly" value={online} onValueChange={setOnline} />
        </View>
        <View style={{ height: 16 }} />
        <SectionLabel label="Sort By" />
        <ChipGroup idPrefix="liveAstrologers.filter.sort" options={['Top Rated', 'Price: Low', 'Price: High', 'Most Consulted', 'Experience']} selected={sort} onSelected={setSort} />
        <View style={{ height: 16 }} />
        <SectionLabel label="Price Range" />
        <ChipGroup idPrefix="liveAstrologers.filter.price" options={['All', 'Under ₹20', '₹20–₹40', '₹40–₹60', '₹60+']} selected={price} onSelected={setPrice} />
        <View style={{ height: 16 }} />
        <SectionLabel label="Gender" />
        <ChipGroup idPrefix="liveAstrologers.filter.gender" options={['All', 'Male', 'Female']} selected={gender} onSelected={setGender} />
        <View style={{ height: 16 }} />
        <SectionLabel label="Language" />
        <ChipGroup
          idPrefix="liveAstrologers.filter.language"
          options={['All', 'Hindi', 'English', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Bengali', 'Marathi', 'Gujarati', 'Punjabi', 'Odia']}
          selected={language}
          onSelected={setLanguage}
        />
        <ElevatedButton
          testID="liveAstrologers.filter.apply"
          label="Apply Filters"
          onPress={() => { onOnlineChanged(online); onClose(); }}
          style={{ marginTop: 24 }}
          fontWeight="700"
        />
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------------------------ helpers */
function getCategoryForAstrologer(specialty: string = '', fallbackCat: string = 'Vedic'): string {
  const s = specialty.toLowerCase();
  if (s.includes('love')) return 'Love';
  if (s.includes('marriage') || s.includes('milan')) return 'Marriage';
  if (s.includes('career') || s.includes('business') || s.includes('job')) return 'Career';
  if (s.includes('finance') || s.includes('wealth') || s.includes('money')) return 'Finance';
  if (s.includes('tarot') || s.includes('oracle')) return 'Tarot';
  if (s.includes('numerology') || s.includes('ank')) return 'Numerology';
  if (s.includes('vastu')) return 'Vastu';
  if (s.includes('kp')) return 'KP';
  if (s.includes('nadi')) return 'Nadi';
  if (s.includes('remed') || s.includes('lal kitab') || s.includes('gemstone') || s.includes('rudraksha') || s.includes('parihar')) return 'Remedies';
  if (s.includes('spiritual') || s.includes('sadhana') || s.includes('karmic')) return 'Spirituality';
  if (s.includes('homa') || s.includes('puja') || s.includes('yantra')) return 'Homa';
  return fallbackCat || 'Vedic';
}

function matchesCategoryFilter(a: AstrologerData, selectedCategory: string): boolean {
  if (selectedCategory === 'All') return true;
  const cat = selectedCategory.toLowerCase();
  const aCat = (a.category || '').toLowerCase();
  const aSpec = (a.specialty || '').toLowerCase();
  const aTitle = (a.title || '').toLowerCase();
  const aBio = ((a as any).bio || (a as any).about || '').toLowerCase();

  if (aCat === cat) return true;
  if (aSpec.includes(cat) || aTitle.includes(cat) || aBio.includes(cat)) return true;

  if (cat === 'remedies' || cat === 'gemstones' || cat === 'rudraksha' || cat === 'yantra' || cat === 'homa' || cat === 'mantra') {
    return (
      aSpec.includes('remed') ||
      aTitle.includes('remed') ||
      aBio.includes('remed') ||
      aSpec.includes('parihar') ||
      aTitle.includes('parihar') ||
      aBio.includes('parihar') ||
      aSpec.includes('lal kitab') ||
      aSpec.includes('gemstone') ||
      aSpec.includes('rudraksha') ||
      aSpec.includes('yantra') ||
      aSpec.includes('mantra') ||
      aSpec.includes('homa') ||
      aSpec.includes('puja') ||
      aSpec.includes('dosh') ||
      aSpec.includes('vastu') ||
      aCat === 'remedies'
    );
  }

  if (cat === 'love') {
    return aSpec.includes('love') || aSpec.includes('relationship') || aSpec.includes('harmony') || aCat === 'love';
  }
  if (cat === 'marriage') {
    return aSpec.includes('marriage') || aSpec.includes('milan') || aSpec.includes('vivah') || aSpec.includes('marital') || aCat === 'marriage';
  }
  if (cat === 'career') {
    return aSpec.includes('career') || aSpec.includes('business') || aSpec.includes('job') || aSpec.includes('work') || aCat === 'career';
  }
  if (cat === 'finance') {
    return aSpec.includes('finance') || aSpec.includes('wealth') || aSpec.includes('dhana') || aSpec.includes('money') || aCat === 'finance';
  }
  if (cat === 'vedic') {
    return aSpec.includes('vedic') || aSpec.includes('jyotish') || aSpec.includes('parashara') || aSpec.includes('dasha') || aCat === 'vedic';
  }
  if (cat === 'spirituality') {
    return aSpec.includes('spirit') || aSpec.includes('sadhana') || aSpec.includes('karmic') || aCat === 'spirituality';
  }
  if (cat === 'tarot') {
    return aSpec.includes('tarot') || aSpec.includes('oracle') || aCat === 'tarot';
  }
  if (cat === 'numerology') {
    return aSpec.includes('numerol') || aSpec.includes('ank') || aCat === 'numerology';
  }
  if (cat === 'vastu') {
    return aSpec.includes('vastu') || aCat === 'vastu';
  }
  if (cat === 'kp') {
    return aSpec.includes('kp') || aCat === 'kp';
  }
  if (cat === 'nadi') {
    return aSpec.includes('nadi') || aCat === 'nadi';
  }

  return false;
}

/* ------------------------------------------------------------------ screen */
export default function LiveAstrologersScreen() {
  const [astrologerType, setAstrologerType] = useState<'real' | 'ai'>('real');
  const [realAstrologers, setRealAstrologers] = useState<AstrologerData[]>([]);
  const [aiAstrologers, setAiAstrologers] = useState<AstrologerData[]>(() =>
    AI_ASTROLOGERS_DATA.map((a) => ({ ...a, isAi: true, category: getCategoryForAstrologer(a.specialty, a.category) }))
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAstrologers = async () => {
    try {
      const [realList, aiList] = await Promise.all([
        fetchRealAstrologers(),
        fetchAiAstrologers(),
      ]);

      if (realList) {
        const liveMapped: AstrologerData[] = realList.map((a) => ({
          id: a.id,
          name: a.name,
          specialty: a.specialty,
          title: [a.specialty, a.experience].filter(Boolean).join(' • '),
          experience: a.experience,
          rating: a.rating,
          reviews: a.reviews,
          consultations: a.consultations || a.reviews,
          price: a.price,
          isOnline: Boolean(a.isOnline),
          languages: a.languages,
          imageUrl: a.imageUrl,
          semanticLabel: a.semanticLabel || a.name,
          category: getCategoryForAstrologer(a.specialty),
          isAi: false,
          bio: a.bio || a.about,
          education: a.education,
          certifications: a.certifications,
          learningSource: a.learningSource,
          dailyHours: a.dailyHours,
          city: a.city,
          badge: a.badge,
          status: a.status,
        }));

        setRealAstrologers(liveMapped);
      }

      if (aiList && aiList.length > 0) {
        const liveMappedAi: AstrologerData[] = aiList.map((a) => ({
          id: a.id,
          name: a.name,
          specialty: a.specialty,
          title: a.semanticLabel || `${a.specialty} • ${a.experience}`,
          experience: a.experience,
          rating: a.rating,
          reviews: a.reviews,
          consultations: `${a.reviews}+`,
          price: a.price,
          isOnline: a.isOnline,
          languages: a.languages,
          imageUrl: a.imageUrl,
          semanticLabel: a.semanticLabel || a.name,
          category: getCategoryForAstrologer(a.specialty),
          isAi: true,
        }));

        setAiAstrologers(liveMappedAi);
      }
    } catch (err) {
      console.warn('Failed to fetch separated astrologers list:', err);
    }
  };

  useEffect(() => {
    fetchAstrologers();
    const pollInterval = setInterval(fetchAstrologers, 4000);
    return () => clearInterval(pollInterval);
  }, []);

  const activePool = astrologerType === 'ai' ? aiAstrologers : realAstrologers;

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return activePool.filter((a) => {
      const matchesSearch =
        q.length === 0 ||
        a.name.toLowerCase().includes(q) ||
        a.specialty.toLowerCase().includes(q) ||
        (a.title && a.title.toLowerCase().includes(q)) ||
        (a.languages && a.languages.toLowerCase().includes(q));
      const matchesCategory = matchesCategoryFilter(a, selectedCategory);
      const matchesOnline = !onlineOnly || a.isOnline;
      return matchesSearch && matchesCategory && matchesOnline;
    });
  }, [activePool, searchQuery, selectedCategory, onlineOnly]);

  const onlineCount = activePool.filter((a) => a.isOnline).length;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchAstrologers(), new Promise((r) => setTimeout(r, 600))]);
    setRefreshing(false);
  };

  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }} testID="liveAstrologers.screen">
      <SearchHeader
        onlineCount={onlineCount}
        astrologerType={astrologerType}
        onSearchChanged={setSearchQuery}
        onFilterTap={() => setSheetOpen(true)}
      />

      {/* Two Prominent Top Tabs: Real Astrologers vs AI Astrologers */}
      <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4 }}>
        <View
          style={{
            flexDirection: 'row',
            padding: 4,
            borderRadius: 16,
            backgroundColor: colors.isLight ? '#FFFFFF' : argb('14FFFFFF'),
            borderWidth: 1.5,
            borderColor: colors.isLight ? 'rgba(201,168,76,0.38)' : argb('26C9A84C'),
            shadowColor: colors.isLight ? '#C9A84C' : '#000',
            shadowOpacity: colors.isLight ? 0.08 : 0,
            shadowRadius: 6,
            elevation: colors.isLight ? 2 : 0,
          }}
        >
          <Pressable
            testID="liveAstrologers.tab.real"
            onPress={() => setAstrologerType('real')}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: astrologerType === 'real' ? '#713B32' : 'transparent',
              borderWidth: astrologerType === 'real' ? 1 : 0,
              borderColor: '#C9A84C',
            }}
          >
            <Text style={{ fontSize: 14 }}>🕉️</Text>
            <Text style={{ marginLeft: 6, color: astrologerType === 'real' ? '#FFFFFF' : (colors.isLight ? '#5A6A85' : '#A0A8C0'), fontSize: 13, fontWeight: '700' }}>
              Real Astrologers
            </Text>
            <View style={{ marginLeft: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, backgroundColor: astrologerType === 'real' ? '#C9A84C' : (colors.isLight ? '#F0EBE0' : argb('26A0A8C0')) }}>
              <Text style={{ color: astrologerType === 'real' ? '#080D1A' : (colors.isLight ? '#5A6A85' : '#A0A8C0'), fontSize: 10, fontWeight: '800' }}>
                {realAstrologers.length}
              </Text>
            </View>
          </Pressable>

          <Pressable
            testID="liveAstrologers.tab.ai"
            onPress={() => setAstrologerType('ai')}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: astrologerType === 'ai' ? '#713B32' : 'transparent',
              borderWidth: astrologerType === 'ai' ? 1 : 0,
              borderColor: '#C9A84C',
            }}
          >
            <Text style={{ fontSize: 14 }}>🔮</Text>
            <Text style={{ marginLeft: 6, color: astrologerType === 'ai' ? '#FFFFFF' : (colors.isLight ? '#5A6A85' : '#A0A8C0'), fontSize: 13, fontWeight: '700' }}>
              AI Astrologers
            </Text>
            <View style={{ marginLeft: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, backgroundColor: astrologerType === 'ai' ? '#C9A84C' : (colors.isLight ? '#F0EBE0' : argb('26A0A8C0')) }}>
              <Text style={{ color: astrologerType === 'ai' ? '#080D1A' : (colors.isLight ? '#5A6A85' : '#A0A8C0'), fontSize: 10, fontWeight: '800' }}>
                {aiAstrologers.length}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>

      <CategoryChips selected={selectedCategory} onSelect={setSelectedCategory} />
      <View style={{ flex: 1 }}>
        {filtered.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} testID="liveAstrologers.empty">
            <Text style={{ fontSize: 48 }}>🔍</Text>
            <Text style={{ marginTop: 16, color: colors.textPrimary, fontSize: 18, fontWeight: '700' }}>No astrologers found</Text>
            <Text style={{ marginTop: 8, color: colors.textMuted, fontSize: 14 }}>Try adjusting your search or filters</Text>
            <Pressable
              testID="liveAstrologers.clearFilters"
              onPress={() => { setSearchQuery(''); setSelectedCategory('All'); setOnlineOnly(false); }}
              style={{ marginTop: 24, paddingHorizontal: 12, paddingVertical: 8 }}
            >
              <Text style={{ color: colors.isLight ? '#713B32' : '#C9A84C', fontWeight: '700', fontSize: 14 }}>Clear Filters</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(a) => String(a.id || a.name)}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: Math.max(150, insets.bottom + 100) }}
            renderItem={({ item, index }) => <AstrologerCard data={item} index={index} />}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A84C" colors={['#C9A84C']} progressBackgroundColor="#0D1B2A" />}
          />
        )}
      </View>
      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} testID="liveAstrologers.filterSheet">
        <FilterSheet onlineOnly={onlineOnly} onOnlineChanged={setOnlineOnly} onClose={() => setSheetOpen(false)} />
      </BottomSheet>
    </SafeAreaView>
  );
}
