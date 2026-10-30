/**
 * Port of lib/presentation/home_dashboard_screen/ (screen + 7 widgets).
 * RefreshIndicator → RefreshControl (800 ms no-op refresh, same as source).
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable, switcherEntering } from '@/components/AnimatedBox';
import { AppIcon } from '@/components/AppIcon';
import { AppImage } from '@/components/AppImage';
import { ProgressRing } from '@/components/common';
import { lh, Text, TextInput } from '@/components/Text';
import { useAuthStore } from '@/features/auth/authStore';
import { AppRoutes, push } from '@/navigation/routes';
import { AppLanguage, useLanguageStore } from '@/theme/languageStore';
import {
  CosmicInsight,
  DEFAULT_AI_ASTROLOGERS,
  DynamicPromotion,
  fetchAiAstrologers,
  fetchRealAstrologers,
  getDynamicCosmicInsights,
  getDynamicPromotions,
  LiveAstrologer,
} from '@/services/homeDataService';
import { useLocationStore } from '@/services/locationService';
import { argb, withAlpha } from '@/theme/colors';
import { useThemeColors } from '@/theme/themeStore';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/* --------------------------------------------------------- HomeHeaderWidget */
const APP_HEADER_LANGUAGES: Array<{
  code: AppLanguage;
  nativeName: string;
  englishLabel: string;
  greetingSample: string;
  flagEmoji: string;
}> = [
    { code: 'Telugu', nativeName: 'తెలుగు', englishLabel: 'Telugu', greetingSample: 'నమస్కారం', flagEmoji: '☀️' },
    { code: 'Hindi', nativeName: 'हिन्दी', englishLabel: 'Hindi', greetingSample: 'नमस्ते', flagEmoji: '🕉️' },
    { code: 'English', nativeName: 'English', englishLabel: 'English', greetingSample: 'Namaste', flagEmoji: '✨' },
    { code: 'Tamil', nativeName: 'தமிழ்', englishLabel: 'Tamil', greetingSample: 'வணக்கம்', flagEmoji: '🪷' },
    { code: 'Kannada', nativeName: 'ಕನ್ನಡ', englishLabel: 'Kannada', greetingSample: 'ನಮಸ್ಕಾರ', flagEmoji: '🌿' },
    { code: 'Malayalam', nativeName: 'മലയാളം', englishLabel: 'Malayalam', greetingSample: 'നമസ്കാരം', flagEmoji: '🌙' },
  ];

function HomeHeader() {
  const colors = useThemeColors();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userName = (isAuthenticated && user?.name?.trim()) ? user.name.trim() : 'Guest';
  const initial = (userName[0] || 'G').toUpperCase();
  const greeting = getGreeting();

  const selectedLanguage = useLanguageStore((s) => s.selectedLanguage);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const currentLang = APP_HEADER_LANGUAGES.find((l) => l.code === selectedLanguage) || APP_HEADER_LANGUAGES[0];

  const { location, isLoading, loadCached, detectLocation } = useLocationStore();

  useEffect(() => {
    loadCached().then(() => {
      detectLocation();
    });
  }, [loadCached, detectLocation]);

  const displayCity = location?.city || user?.pob?.split(',')[0].trim() || 'Mumbai';

  const handleLocationPress = () => {
    Alert.alert(
      'Current Location',
      location.formattedAddress
        ? `${location.formattedAddress}\n\n(Detected via Google Maps)`
        : `${displayCity}\n\n(Detected via Google Maps)`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Refresh GPS', onPress: () => detectLocation(true) },
      ]
    );
  };

  return (
    <>
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 4,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* User profile (Avatar + Name & Greeting) */}
        <Pressable
          testID="home.profile"
          onPress={() => push(AppRoutes.profileScreen)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
            marginRight: 6,
          }}
          accessibilityRole="button"
          accessibilityLabel={`Profile of ${userName}`}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              borderWidth: 1.5,
              borderColor: colors.goldAccent,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 8,
            }}
          >
            <LinearGradient
              colors={['#713B32', '#552B24']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>{initial}</Text>
          </View>

          <View style={{ flex: 1, justifyContent: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AppIcon name="wb_sunny_rounded" color={colors.goldAccent} size={12} />
              <Text numberOfLines={1} ellipsizeMode="tail" style={{ marginLeft: 4, color: colors.isLight ? '#5A6A85' : '#8F9CAE', fontSize: 11, fontWeight: '600' }}>
                {greeting}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginTop: 1 }}
            >
              {userName}
            </Text>
          </View>
        </Pressable>

        {/* Right Header Cluster: Language Selector + Location Badge + Notifications */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Professional Language Selection Icon */}
          <Pressable
            testID="home.languagePill"
            onPress={() => setShowLanguageModal(true)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.isLight ? '#FFFFFF' : argb('0FFFFFFF'),
              borderWidth: 1,
              borderColor: colors.isLight ? 'rgba(201,168,76,0.32)' : argb('1AC9A84C'),
              marginRight: 6,
            }}
            accessibilityRole="button"
            accessibilityLabel={`Language: ${currentLang.nativeName}`}
          >
            <AppIcon name="translate" color={colors.goldAccent} size={18} />
          </Pressable>

          {/* Location Badge */}
          <Pressable
            testID="home.location"
            onPress={handleLocationPress}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              height: 36,
              paddingHorizontal: 8,
              borderRadius: 18,
              backgroundColor: colors.isLight ? '#FFFFFF' : argb('0FFFFFFF'),
              borderWidth: 1,
              borderColor: colors.isLight ? 'rgba(201,168,76,0.32)' : argb('1AC9A84C'),
              marginRight: 6,
            }}
            accessibilityRole="button"
            accessibilityLabel={`Current Location: ${displayCity}`}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.goldAccent} style={{ width: 12, height: 12 }} />
            ) : (
              <AppIcon name="location_on_rounded" color={colors.goldAccent} size={13} />
            )}
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{ marginLeft: 3, color: colors.textPrimary, fontSize: 11, fontWeight: '600', maxWidth: 60 }}
            >
              {displayCity}
            </Text>
          </Pressable>

          {/* Notifications */}
          <Pressable
            testID="home.notifications"
            onPress={() => push(AppRoutes.notificationsScreen)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: colors.isLight ? '#FFFFFF' : argb('0FFFFFFF'),
              borderWidth: 1,
              borderColor: colors.isLight ? 'rgba(201,168,76,0.32)' : argb('1AC9A84C'),
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <AppIcon name="notifications_outlined" color={colors.textPrimary} size={18} />
          </Pressable>
        </View>
      </View>

      {/* Professional Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <Pressable
          onPress={() => setShowLanguageModal(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 360,
              borderRadius: 24,
              backgroundColor: colors.isLight ? '#FFFDF9' : '#0D1B2A',
              borderWidth: 1.5,
              borderColor: colors.goldAccent,
              padding: 20,
              shadowColor: colors.goldAccent,
              shadowOpacity: 0.25,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: colors.isLight ? '#FFF3E0' : 'rgba(201,168,76,0.18)',
                    borderWidth: 1,
                    borderColor: colors.goldAccent,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 9,
                  }}
                >
                  <AppIcon name="translate" color={colors.goldAccent} size={17} />
                </View>
                <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '800' }}>
                  Select Language
                </Text>
              </View>

              <Pressable
                testID="home.languageModal.close"
                onPress={() => setShowLanguageModal(false)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: colors.isLight ? '#F0EAD6' : 'rgba(255,255,255,0.08)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppIcon name="close" color={colors.textSecondary} size={16} />
              </Pressable>
            </View>

            <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 16, lineHeight: 17 }}>
              Choose your preferred language for horoscope readings, panchang & AI consultations.
            </Text>

            {/* Language Options List */}
            <View style={{ gap: 8 }}>
              {APP_HEADER_LANGUAGES.map((lang) => {
                const isSelected = selectedLanguage === lang.code;
                return (
                  <Pressable
                    key={lang.code}
                    testID={`home.langOption.${lang.code.toLowerCase()}`}
                    onPress={() => {
                      setLanguage(lang.code);
                      setShowLanguageModal(false);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      borderRadius: 16,
                      backgroundColor: isSelected
                        ? (colors.isLight ? '#FFF7E6' : 'rgba(201,168,76,0.18)')
                        : (colors.isLight ? '#FFFFFF' : 'rgba(255,255,255,0.04)'),
                      borderWidth: isSelected ? 1.5 : 1,
                      borderColor: isSelected
                        ? colors.goldAccent
                        : (colors.isLight ? 'rgba(201,168,76,0.22)' : 'rgba(255,255,255,0.08)'),
                      shadowColor: isSelected ? colors.goldAccent : '#000',
                      shadowOpacity: isSelected ? 0.08 : 0,
                      shadowRadius: 4,
                      elevation: isSelected ? 1 : 0,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 16, marginRight: 10 }}>{lang.flagEmoji}</Text>
                      <View>
                        <Text
                          style={{
                            color: isSelected ? (colors.isLight ? '#713B32' : '#FFD700') : colors.textPrimary,
                            fontSize: 15,
                            fontWeight: isSelected ? '800' : '600',
                          }}
                        >
                          {lang.nativeName}
                        </Text>
                        <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 1 }}>
                          {`${lang.englishLabel} • ${lang.greetingSample}`}
                        </Text>
                      </View>
                    </View>

                    {isSelected ? (
                      <AppIcon name="check_circle_rounded" color={colors.goldAccent} size={20} />
                    ) : (
                      <View
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          borderWidth: 1.5,
                          borderColor: colors.isLight ? '#D1C7B7' : '#4A5568',
                        }}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Micro reassurance badge */}
            <View
              style={{
                marginTop: 14,
                paddingVertical: 8,
                paddingHorizontal: 10,
                borderRadius: 10,
                backgroundColor: colors.isLight ? '#FAF5E8' : 'rgba(0,0,0,0.25)',
                borderWidth: 1,
                borderColor: colors.isLight ? 'rgba(201,168,76,0.25)' : 'rgba(201,168,76,0.15)',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 10.5, color: colors.goldAccent, fontWeight: '600', textAlign: 'center' }}>
                ✦ Entire app and AI Chat will update to your selected language instantly.
              </Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

/* ------------------------------------------------ CosmicInsightsCarousel */
function PlanetTag({ label, isLight }: { label: string; isLight: boolean }) {
  return (
    <View
      style={{
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 100,
        backgroundColor: isLight ? '#FFF8EE' : 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: isLight ? 'rgba(201,168,76,0.55)' : 'rgba(201,168,76,0.3)',
      }}
    >
      <Text style={{ color: isLight ? '#7C5205' : '#FFD700', fontSize: 10, fontWeight: '700' }}>
        {label}
      </Text>
    </View>
  );
}

function CosmicInsightsCarousel({ refreshKey }: { refreshKey?: number }) {
  const colors = useThemeColors();
  const [insights, setInsights] = useState<CosmicInsight[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    getDynamicCosmicInsights().then((data) => {
      setInsights(Array.isArray(data) ? data : []);
    });
  }, [refreshKey]);

  if (insights.length === 0) return null;

  return (
    <View style={{ marginBottom: 20 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        onScroll={(e) => {
          const x = e.nativeEvent.contentOffset.x;
          const idx = Math.round(x / 324);
          if (idx !== activeIndex && idx >= 0 && idx < insights.length) {
            setActiveIndex(idx);
          }
        }}
        scrollEventThrottle={16}
      >
        {insights.map((card, i) => (
          <View
            key={card.id || i}
            style={{
              width: 320,
              height: 205,
              borderRadius: 24,
              borderWidth: 1.5,
              borderColor: colors.isLight ? 'rgba(201,168,76,0.38)' : 'rgba(201,168,76,0.25)',
              backgroundColor: colors.isLight ? '#FFFFFF' : '#0D1B2A',
              overflow: 'hidden',
              marginRight: 14,
              shadowColor: colors.isLight ? '#C9A84C' : '#000',
              shadowOpacity: colors.isLight ? 0.08 : 0.25,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <AppImage
              uri={card.imageUrl}
              width={190}
              height={205}
              fit="cover"
              semanticLabel={card.title}
              style={{ position: 'absolute', right: -15, top: 0 }}
            />
            <LinearGradient
              colors={
                colors.isLight
                  ? ['#FFFFFF', '#FFFFFF', 'rgba(255,255,255,0.96)', 'rgba(255,255,255,0.35)']
                  : ['#0D1B2A', '#0D1B2A', 'rgba(13,27,42,0.96)', 'rgba(13,27,42,0.35)']
              }
              locations={[0, 0.60, 0.82, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <View style={{ flex: 1, padding: 18, justifyContent: 'space-between' }}>
              <View style={{ maxWidth: 215 }}>
                <View
                  style={{
                    alignSelf: 'flex-start',
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 9,
                    paddingVertical: 3.5,
                    borderRadius: 100,
                    backgroundColor: colors.isLight ? '#FFF8EE' : 'rgba(201,168,76,0.18)',
                    borderWidth: 1,
                    borderColor: colors.goldAccent,
                  }}
                >
                  <Text style={{ fontSize: 10, color: colors.isLight ? '#713B32' : '#FFD700' }}>✦ </Text>
                  <Text style={{ color: colors.isLight ? '#713B32' : '#FFD700', fontSize: 11, fontWeight: '800' }}>
                    {card.tag.replace(/^✦\s*/, '')}
                  </Text>
                </View>
                <Text
                  numberOfLines={2}
                  style={{
                    marginTop: 8,
                    color: colors.isLight ? '#1A1A2E' : '#FFFFFF',
                    fontWeight: '800',
                    fontSize: 16,
                    lineHeight: 22,
                  }}
                >
                  {card.title}
                </Text>
                <Text
                  numberOfLines={2}
                  style={{
                    marginTop: 5,
                    color: colors.isLight ? '#383852' : '#DCE5F2',
                    fontWeight: '600',
                    fontSize: 12,
                    lineHeight: 17,
                  }}
                >
                  {card.description}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <Pressable
                  testID={`home.dailyInsight.guidance.${i}`}
                  onPress={() => push(card.ctaAction?.startsWith('/') ? card.ctaAction : AppRoutes.aiChatScreen)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 100,
                    backgroundColor: '#713B32',
                    shadowColor: '#713B32',
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <AppIcon name="auto_awesome_rounded" color="#FFFFFF" size={13} />
                  <Text style={{ marginLeft: 5, color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>
                    {card.ctaText || "View Guidance"}
                  </Text>
                </Pressable>

                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 4 }}>
                  {(card.planetTags || ['♃ Jupiter', '♏ Scorpio']).slice(0, 2).map((tag, tIdx) => (
                    <PlanetTag key={tIdx} label={tag} isLight={colors.isLight} />
                  ))}
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Pagination indicators */}
      {insights.length > 1 && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10, gap: 5 }}>
          {insights.map((_, dotIdx) => (
            <View
              key={dotIdx}
              style={{
                height: 4,
                borderRadius: 2,
                width: activeIndex === dotIdx ? 18 : 6,
                backgroundColor: activeIndex === dotIdx ? colors.goldAccent : (colors.isLight ? '#D0C8B8' : '#2A3550'),
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}

/* ---------------------------------------------------- QuickActionsGridWidget */
const QUICK_ACTIONS = [
  { emoji: '🔮', label: 'AI Astrologer', route: AppRoutes.aiChatScreen, color: '#713B32', id: 'aiAstrologer', badge: 'AI Guru' },
  { emoji: '👨‍🔮', label: 'Live Astrologers', route: AppRoutes.liveAstrologersScreen, color: '#1A3D5C', id: 'liveAstrologers', badge: 'Live' },
  { emoji: '📜', label: 'My Kundli', route: AppRoutes.myKundliScreen, color: '#1A3D1A', id: 'myKundli' },
  { emoji: '💫', label: 'Kundli Match', route: AppRoutes.matchKundliScreen, color: '#3D1A2A', id: 'matchKundli' },
  { emoji: '✨', label: 'Remedies', route: AppRoutes.remediesScreen, color: '#1A2A3D', id: 'remedies' },
  { emoji: '📅', label: 'Panchang', route: AppRoutes.panchangScreen, color: '#2A2A1A', id: 'panchang' },
];

function QuickActionsGrid() {
  const colors = useThemeColors();
  const [w, setW] = useState(0);
  const cell = w > 0 ? (w - 24) / 3 : 0;
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 }}>
        <Text style={{ flex: 1, color: colors.textPrimary, fontSize: 18, fontWeight: '700' }}>Quick Actions</Text>
        <Text style={{ color: colors.goldAccent, fontSize: 11, fontWeight: '700' }}>Vedic & AI Tools</Text>
      </View>
      <View style={{ marginTop: 14, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
          {cell > 0 &&
            QUICK_ACTIONS.map((a) => (
              <Pressable
                key={a.id}
                testID={`home.quickAction.${a.id}`}
                onPress={() => push(a.route)}
                style={{
                  width: cell,
                  height: cell / 1.1,
                  borderRadius: 20,
                  borderWidth: 1.5,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.isLight ? '#FFFFFF' : withAlpha(a.color, 77),
                  borderColor: colors.isLight ? 'rgba(201,168,76,0.35)' : withAlpha(a.color, 128),
                  shadowColor: colors.isLight ? '#C9A84C' : '#000',
                  shadowOpacity: colors.isLight ? 0.08 : 0.2,
                  shadowRadius: 6,
                  elevation: 2,
                }}
              >
                {a.badge ? (
                  <View
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      paddingHorizontal: 5,
                      paddingVertical: 1.5,
                      borderRadius: 6,
                      backgroundColor:
                        a.badge === 'AI Guru'
                          ? colors.isLight ? '#FEE2E2' : '#713B32'
                          : colors.isLight ? '#DCFCE7' : '#1A3D2A',
                      borderWidth: 0.5,
                      borderColor:
                        a.badge === 'AI Guru'
                          ? colors.isLight ? '#EF4444' : '#C9A84C'
                          : colors.isLight ? '#22C55E' : '#3DCB7A',
                    }}
                  >
                    <Text
                      style={{
                        color:
                          a.badge === 'AI Guru'
                            ? colors.isLight ? '#991B1B' : '#C9A84C'
                            : colors.isLight ? '#166534' : '#3DCB7A',
                        fontSize: 8,
                        fontWeight: '700',
                      }}
                    >
                      {a.badge}
                    </Text>
                  </View>
                ) : null}
                <Text style={{ fontSize: 28 }}>{a.emoji}</Text>
                <Text numberOfLines={2} style={{ marginTop: 6, textAlign: 'center', color: colors.isLight ? '#1A1A2E' : '#F0EAD6', fontWeight: '700', ...lh(11, 1.3) }}>
                  {a.label}
                </Text>
              </Pressable>
            ))}
        </View>
      </View>
    </View>
  );
}

/* ------------------------------------------------------ HoroscopeCardsWidget */
const HOROSCOPE_CATEGORIES = [
  { emoji: '❤️', label: 'Love', score: 82, color: '#713B32', insight: 'Venus favours romantic connections today. Express your feelings openly — the stars support heartfelt conversations.', tip: 'Wear rose quartz for enhanced love energy' },
  { emoji: '💼', label: 'Career', score: 74, color: '#1A3D5C', insight: "Jupiter's transit through your 10th house brings career advancement. A senior may recognise your contributions.", tip: 'Tuesday is auspicious for new proposals' },
  { emoji: '💰', label: 'Money', score: 68, color: '#2A2A1A', insight: 'Avoid major financial decisions today. Saturn casts a cautionary aspect — wait until Thursday for investments.', tip: 'Recite Lakshmi Stotra in the morning' },
  { emoji: '🏥', label: 'Health', score: 88, color: '#1A3D1A', insight: 'Your vitality is strong. The Sun in your 6th house supports physical health. Morning exercise will be especially beneficial.', tip: 'Drink saffron milk at night for better sleep' },
  { emoji: '👨‍👩‍👧', label: 'Family', score: 77, color: '#2A1A3D', insight: "Mercury's influence brings harmonious family communication. A family gathering will bring joy and resolution.", tip: 'Light a ghee lamp at the family altar' },
];

function HoroscopeCards() {
  const colors = useThemeColors();
  const [selected, setSelected] = useState(0);
  const cat = HOROSCOPE_CATEGORIES[selected];

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authUser = useAuthStore((s) => s.user);
  const isAuth = Boolean(isAuthenticated && authUser && (authUser.uid || authUser.phone));

  const handleAskAIAboutHoroscope = () => {
    if (!isAuth) {
      push(AppRoutes.signInScreen);
      return;
    }
    const userDetailTag = [
      authUser?.name ? `for ${authUser.name}` : '',
      authUser?.dob ? `(Born: ${authUser.dob}${authUser.tob ? ` at ${authUser.tob}` : ''}${authUser.pob ? ` in ${authUser.pob}` : ''})` : '',
      authUser?.zodiac ? `[Sign: ${authUser.zodiac}]` : '',
    ].filter(Boolean).join(' ');

    push(AppRoutes.aiChatScreen, {
      initialPrompt: `Namaste 🙏 Please analyze my ${cat.label} horoscope for today ${userDetailTag} based on my birth chart and current planetary transits. What guidance and parihar do you recommend?`,
    });
  };

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 }}>
        <Text style={{ flex: 1, color: colors.textPrimary, fontSize: 18, fontWeight: '700' }}>Today&apos;s Horoscope</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, backgroundColor: colors.isLight ? 'rgba(201,168,76,0.15)' : argb('1AC9A84C'), borderWidth: colors.isLight ? 1 : 0, borderColor: colors.goldAccent }}>
          <Text style={{ color: colors.isLight ? '#7C5205' : '#C9A84C', fontSize: 10, fontWeight: '700' }}>✦ AstroParihar AI</Text>
        </View>
      </View>
      <FlatList
        style={{ marginTop: 14, height: 36, flexGrow: 0 }}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        data={HOROSCOPE_CATEGORIES}
        keyExtractor={(c) => c.label}
        renderItem={({ item, index }) => {
          const sel = selected === index;
          return (
            <AnimatedPressable
              testID={`home.horoscope.category.${item.label.toLowerCase()}`}
              onPress={() => setSelected(index)}
              duration={200}
              style={{
                marginRight: 8,
                height: 36,
                paddingHorizontal: 16,
                borderRadius: 100,
                borderWidth: 1,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: sel ? '#713B32' : (colors.isLight ? '#FFFFFF' : argb('0FFFFFFF')),
                borderColor: sel ? '#713B32' : (colors.isLight ? 'rgba(201,168,76,0.35)' : argb('1AC9A84C')),
              }}
            >
              <Text style={{ fontSize: 13 }}>{item.emoji}</Text>
              <Text style={{ marginLeft: 6, color: sel ? '#FFFFFF' : (colors.isLight ? '#4A5568' : '#7E8BA8'), fontSize: 13, fontWeight: sel ? '700' : '600' }}>{item.label}</Text>
            </AnimatedPressable>
          );
        }}
      />
      <View style={{ marginTop: 14, paddingHorizontal: 20 }}>
        <Animated.View key={selected} entering={switcherEntering(10, 300)}>
          <View
            style={{
              padding: 20,
              borderRadius: 20,
              backgroundColor: colors.isLight ? '#FFFFFF' : withAlpha(cat.color, 51),
              borderWidth: 1.5,
              borderColor: colors.isLight ? withAlpha(cat.color, 90) : withAlpha(cat.color, 102),
              shadowColor: colors.isLight ? cat.color : '#000',
              shadowOpacity: colors.isLight ? 0.08 : 0.2,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 24 }}>{cat.emoji}</Text>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={{ color: colors.isLight ? '#1A1A2E' : '#F0EAD6', fontSize: 16, fontWeight: '700' }}>{`${cat.label} Horoscope`}</Text>
                <Text style={{ color: colors.isLight ? '#5A6A85' : '#7E8BA8', fontSize: 12 }}>Scorpio • Live Vedic Transit</Text>
              </View>
              <View style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }}>
                <ProgressRing value={cat.score / 100} size={36} strokeWidth={4} color={cat.color} backgroundColor={withAlpha(cat.color, 51)} />
                <Text style={{ position: 'absolute', color: colors.isLight ? '#1A1A2E' : '#F0EAD6', fontSize: 13, fontWeight: '700' }}>{String(cat.score)}</Text>
              </View>
            </View>
            <Text style={{ marginTop: 14, color: colors.isLight ? '#2D3748' : '#DCE5F2', ...lh(14, 1.6) }}>{cat.insight}</Text>
            <View
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 12,
                backgroundColor: colors.isLight ? '#FFF9ED' : argb('0FC9A84C'),
                borderWidth: 1,
                borderColor: colors.isLight ? '#E2C26A' : argb('1AC9A84C'),
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 14 }}>🕯️</Text>
              <Text style={{ marginLeft: 8, flex: 1, color: colors.isLight ? '#7C5205' : '#C9A84C', fontSize: 12, fontStyle: 'italic', fontWeight: '500' }}>{cat.tip}</Text>
            </View>

            {/* AI Astrologer Consultation Button for this Category */}
            <Pressable
              onPress={handleAskAIAboutHoroscope}
              style={{
                marginTop: 12,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 12,
                backgroundColor: '#713B32',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppIcon name="auto_awesome_rounded" color="#FFFFFF" size={13} />
              <Text style={{ marginLeft: 6, color: '#FFFFFF', fontSize: 11.5, fontWeight: '700' }}>
                {`Ask AI Astrologer about your ${cat.label}`}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
      <Pressable
        testID="home.horoscope.viewFull"
        onPress={() => push(AppRoutes.horoscopeScreen)}
        style={{
          marginTop: 12,
          marginHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 14,
          backgroundColor: colors.isLight ? '#FFFFFF' : argb('0FFFFFFF'),
          borderWidth: 1.5,
          borderColor: colors.goldAccent,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 14 }}>🔮</Text>
        <Text style={{ marginLeft: 8, color: colors.isLight ? '#713B32' : '#C9A84C', fontSize: 13, fontWeight: '700' }}>View Full 12 Signs Horoscope</Text>
        <AppIcon name="arrow_forward_ios_rounded" color={colors.isLight ? '#713B32' : '#C9A84C'} size={12} style={{ marginLeft: 6 }} />
      </Pressable>
    </View>
  );
}

/* -------------------------------------------------------- AiPromptCardWidget */
function AiPromptCard() {
  const colors = useThemeColors();
  const [text, setText] = useState('');
  const handleAsk = (promptText?: string) => {
    const q = (promptText || text).trim();
    if (q) {
      push(AppRoutes.aiChatScreen, { initialPrompt: q });
      setText('');
    } else {
      push(AppRoutes.aiChatScreen);
    }
  };

  return (
    <View
      style={{
        marginHorizontal: 20,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: colors.isLight ? 'rgba(201,168,76,0.38)' : 'rgba(201,168,76,0.25)',
        backgroundColor: colors.isLight ? '#FFFFFF' : '#0D1B2A',
        overflow: 'hidden',
        shadowColor: colors.isLight ? '#C9A84C' : '#000',
        shadowOpacity: colors.isLight ? 0.08 : 0.25,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <LinearGradient
        colors={
          colors.isLight
            ? ['#FFFDF9', '#F9F5EC']
            : [withAlpha('#713B32', 38), withAlpha('#0D1B2A', 204)]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 20 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              padding: 9,
              borderRadius: 14,
              backgroundColor: colors.isLight ? '#FFF3E0' : argb('1A713B32'),
              borderWidth: 1,
              borderColor: colors.isLight ? 'rgba(201,168,76,0.45)' : argb('33713B32'),
            }}
          >
            <Text style={{ fontSize: 22 }}>🔮</Text>
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: colors.isLight ? '#1A1A2E' : '#F0EAD6', fontSize: 17, fontWeight: '800' }}>
                Ask AstroParihar AI
              </Text>
              <View
                style={{
                  marginLeft: 8,
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: 100,
                  backgroundColor: colors.isLight ? '#FEE2E2' : '#713B32',
                  borderWidth: 0.5,
                  borderColor: colors.isLight ? '#EF4444' : '#C9A84C',
                }}
              >
                <Text style={{ color: colors.isLight ? '#991B1B' : '#C9A84C', fontSize: 9, fontWeight: '800' }}>
                  AI 2.0
                </Text>
              </View>
            </View>
            <Text style={{ color: colors.isLight ? '#5A6A85' : '#8A99AD', fontSize: 12, marginTop: 2 }}>
              Powered by Sacred Vedic Ephemeris & AI
            </Text>
          </View>
        </View>

        <Text style={{ marginTop: 14, color: colors.isLight ? '#2D3748' : '#DCE5F2', fontSize: 13.5, fontWeight: '600' }}>
          Have a question about your life or future?
        </Text>

        <View
          style={{
            marginTop: 10,
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 100,
            backgroundColor: colors.isLight ? '#FFFFFF' : argb('0FFFFFFF'),
            borderWidth: 1.5,
            borderColor: colors.isLight ? 'rgba(201,168,76,0.45)' : argb('1AC9A84C'),
            shadowColor: colors.isLight ? 'rgba(201,168,76,0.15)' : '#000',
            shadowOpacity: colors.isLight ? 0.08 : 0,
            shadowRadius: 4,
            elevation: 1,
          }}
        >
          <TextInput
            testID="home.aiPrompt.input"
            value={text}
            onChangeText={setText}
            onSubmitEditing={() => handleAsk()}
            placeholder="Ask about career, love, marriage, remedies..."
            placeholderTextColor={colors.isLight ? '#8E99A8' : '#6B7A99'}
            style={{ flex: 1, marginLeft: 16, paddingVertical: 12, fontSize: 13, color: colors.isLight ? '#1A1A2E' : '#F0EAD6' }}
          />
          <Pressable
            testID="home.aiPrompt.mic"
            onPress={() => handleAsk()}
            style={{
              width: 38,
              height: 38,
              marginRight: 4,
              borderRadius: 19,
              backgroundColor: '#713B32',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppIcon name="arrow_forward_rounded" color="#FFFFFF" size={16} />
          </Pressable>
        </View>

        {/* Quick Question Pills */}
        <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {[
            '💼 Job Promotion in 2027?',
            '💍 Marriage Timing?',
            '🪐 Shani Sade Sati Remedy',
          ].map((pill, pIdx) => (
            <Pressable
              key={pIdx}
              onPress={() => handleAsk(pill)}
              style={{
                paddingHorizontal: 11,
                paddingVertical: 5,
                borderRadius: 100,
                backgroundColor: colors.isLight ? '#FFF8EE' : argb('1AC9A84C'),
                borderWidth: 1,
                borderColor: colors.isLight ? 'rgba(201,168,76,0.45)' : argb('33C9A84C'),
              }}
            >
              <Text style={{ color: colors.isLight ? '#7C5205' : '#C9A84C', fontSize: 11, fontWeight: '700' }}>
                {pill}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          testID="home.aiPrompt.ask"
          onPress={() => handleAsk()}
          style={{
            marginTop: 14,
            paddingVertical: 12,
            borderRadius: 14,
            backgroundColor: '#713B32',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#713B32',
            shadowOpacity: 0.25,
            shadowRadius: 5,
            elevation: 2,
          }}
        >
          <AppIcon name="auto_awesome_rounded" color="#FFFFFF" size={16} />
          <Text style={{ marginLeft: 6, color: '#FFFFFF', fontSize: 13.5, fontWeight: '700' }}>
            Ask AI Astrologer
          </Text>
        </Pressable>
      </LinearGradient>
    </View>
  );
}

/* --------------------------------------------------- PersonalisedRecsWidget */
function PersonalisedRecs({
  realAstrologers = [],
  aiAstrologers = [],
}: {
  realAstrologers?: LiveAstrologer[];
  aiAstrologers?: LiveAstrologer[];
}) {
  const colors = useThemeColors();
  const topAi = aiAstrologers[0] || DEFAULT_AI_ASTROLOGERS[0];
  const topReal = realAstrologers[0];

  const dynamicRecs = [
    {
      emoji: '🔮',
      title: `Talk to AI Astrologer: ${topAi.name}`,
      subtitle: `${topAi.specialty} • Instant Answers with AstroParihar AI`,
      tag: 'AI Guru',
      tagColor: '#C9A84C',
      tagBgLight: '#FFF8EE',
      tagBorderLight: 'rgba(201,168,76,0.5)',
      tagTextLight: '#7C5205',
      onPress: () => push(AppRoutes.aiChatScreen, { astrologerId: topAi.id, astrologerName: topAi.name, avatarUrl: topAi.imageUrl }),
    },
    ...(topReal
      ? [
          {
            emoji: '👨‍🔮',
            title: `Live Consultation: ${topReal.name}`,
            subtitle: `${topReal.specialty} • ${topReal.experience} • ₹${topReal.price}/min`,
            tag: topReal.isOnline ? 'Live Now' : 'Verified Guru',
            tagColor: '#2D9E6B',
            tagBgLight: '#ECFDF5',
            tagBorderLight: '#A7F3D0',
            tagTextLight: '#047857',
            onPress: () => push(AppRoutes.astrologerDetailScreen, topReal),
          },
        ]
      : []),
    {
      emoji: '🪐',
      title: 'Your Saturn Period is Approaching',
      subtitle: 'Sade Sati begins in 8 months — prepare with remedies',
      tag: 'Dasha Alert',
      tagColor: '#CF4444',
      tagBgLight: '#FEF2F2',
      tagBorderLight: '#FECACA',
      tagTextLight: '#B91C1C',
      onPress: () => push(AppRoutes.remediesScreen),
    },
    {
      emoji: '❤️',
      title: '36 Guna Kundli Milan & Compatibility',
      subtitle: 'Check Ashtakoot planetary harmony for marriage',
      tag: 'Recommended',
      tagColor: '#1A3D5C',
      tagBgLight: '#EFF6FF',
      tagBorderLight: '#BFDBFE',
      tagTextLight: '#1D4ED8',
      onPress: () => push(AppRoutes.matchKundliScreen),
    },
  ];

  return (
    <View>
      <View style={{ paddingHorizontal: 20 }}>
        <Text numberOfLines={1} style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700' }}>
          Recommended For You
        </Text>
      </View>
      <View style={{ height: 14 }} />
      {dynamicRecs.map((r) => (
        <Pressable
          key={r.title}
          onPress={r.onPress}
          style={{
            marginHorizontal: 20,
            marginBottom: 10,
            padding: 16,
            borderRadius: 18,
            backgroundColor: colors.isLight ? '#FFFFFF' : argb('0FFFFFFF'),
            borderWidth: 1.5,
            borderColor: colors.isLight ? 'rgba(201,168,76,0.32)' : argb('1AC9A84C'),
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: colors.isLight ? '#C9A84C' : '#000',
            shadowOpacity: colors.isLight ? 0.06 : 0.2,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: colors.isLight ? r.tagBgLight : withAlpha(r.tagColor, 38),
              borderWidth: colors.isLight ? 1 : 0,
              borderColor: colors.isLight ? r.tagBorderLight : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 22 }}>{r.emoji}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <View
              style={{
                alignSelf: 'flex-start',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 100,
                backgroundColor: colors.isLight ? r.tagBgLight : withAlpha(r.tagColor, 38),
                borderWidth: colors.isLight ? 1 : 0,
                borderColor: colors.isLight ? r.tagBorderLight : 'transparent',
              }}
            >
              <Text
                style={{
                  color: colors.isLight ? r.tagTextLight : r.tagColor,
                  fontSize: 10,
                  fontWeight: '700',
                }}
              >
                {r.tag}
              </Text>
            </View>
            <Text numberOfLines={1} style={{ marginTop: 4, color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>
              {r.title}
            </Text>
            <Text numberOfLines={1} style={{ marginTop: 2, color: colors.isLight ? '#5A6A85' : '#8A99AD', fontSize: 12 }}>
              {r.subtitle}
            </Text>
          </View>
          <AppIcon name="chevron_right_rounded" color={colors.isLight ? '#713B32' : '#C9A84C'} size={20} style={{ marginLeft: 8 }} />
        </Pressable>
      ))}
    </View>
  );
}

/* -------------------------------------------- RealAstrologersCarouselWidget */
function RealAstrologersCarousel({ realAstrologers = [] }: { realAstrologers?: LiveAstrologer[] }) {
  const colors = useThemeColors();
  const displayList = realAstrologers || [];
  const onlineCount = displayList.filter((a) => a.isOnline).length;

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '800' }}>Talk to Astrologers</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 100, backgroundColor: colors.isLight ? '#DCFCE7' : argb('1A3DCB7A'), borderWidth: colors.isLight ? 1 : 0, borderColor: '#86EFAC' }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.isLight ? '#16A34A' : '#3DCB7A' }} />
              <Text style={{ marginLeft: 4, color: colors.isLight ? '#15803D' : '#3DCB7A', fontSize: 11, fontWeight: '700' }}>
                {`${onlineCount} Online`}
              </Text>
            </View>
          </View>
          <Text style={{ color: colors.isLight ? '#7C5205' : colors.goldAccent, fontSize: 11, fontWeight: '600', marginTop: 2 }}>
            Authentic Human Gurus from Backend Onboarding
          </Text>
        </View>
        <Pressable
          testID="home.astrologers.viewAll"
          onPress={() => push(AppRoutes.liveAstrologersScreen)}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 10,
            backgroundColor: colors.isLight ? '#FAF5E8' : 'rgba(201,168,76,0.12)',
            borderWidth: 1,
            borderColor: colors.isLight ? 'rgba(201,168,76,0.35)' : 'rgba(201,168,76,0.25)',
          }}
        >
          <Text style={{ color: colors.isLight ? '#713B32' : '#C9A84C', fontSize: 12, fontWeight: '700' }}>View All ›</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 14 }}
        contentContainerStyle={{ paddingHorizontal: 20 }}
      >
        {displayList.map((a) => {
          const formattedName = (a.name || 'Astrologer')
            .split(' ')
            .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ''))
            .join(' ');

          return (
            <Pressable
              key={a.id || a.name}
              testID={`home.realAstrologer.${a.id || a.name}`}
              onPress={() => push(AppRoutes.astrologerDetailScreen, a)}
              style={{
                width: 300,
                height: 124,
                marginRight: 14,
                borderRadius: 20,
                backgroundColor: colors.isLight ? '#FFFFFF' : argb('0FFFFFFF'),
                borderWidth: 1.5,
                borderColor: colors.isLight ? 'rgba(201,168,76,0.35)' : argb('1AC9A84C'),
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: colors.isLight ? '#C9A84C' : '#000',
                shadowOpacity: colors.isLight ? 0.08 : 0.2,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              {/* Left Side: Circular Image with Online & Verified Indicators */}
              <View style={{ width: 66, height: 66, alignItems: 'center', justifyContent: 'center' }}>
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    borderWidth: 2,
                    borderColor: colors.goldAccent,
                    overflow: 'hidden',
                    backgroundColor: colors.isLight ? '#FAF5E8' : '#0D1B2A',
                  }}
                >
                  <AppImage
                    uri={a.imageUrl}
                    width={60}
                    height={60}
                    fit="cover"
                    semanticLabel={a.semanticLabel || a.name}
                    errorWidget={
                      <View style={{ width: 60, height: 60, backgroundColor: colors.isLight ? '#F0E8D5' : '#1A2A3D', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: colors.isLight ? '#7C5205' : '#C9A84C', fontSize: 18, fontWeight: '800' }}>
                          {(a.name || 'A').replace(/^(Acharya|Swami|Pt\.|Pandit|Guru|Dr\.)\s+/i, '')[0] || 'A'}
                        </Text>
                      </View>
                    }
                  />
                </View>

                {/* Online indicator */}
                <View
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: colors.isLight ? '#FFFFFF' : '#080D1A',
                    backgroundColor: a.isOnline ? '#3DCB7A' : '#6B7A99',
                  }}
                />

                {/* Verified Real Astrologer badge */}
                <View
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    paddingHorizontal: 6,
                    paddingVertical: 1.5,
                    borderRadius: 100,
                    backgroundColor: colors.isLight ? '#FEF3C7' : '#0D1B2A',
                    borderWidth: 1,
                    borderColor: colors.goldAccent,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <AppIcon name="verified_rounded" color={colors.isLight ? '#B45309' : '#C9A84C'} size={8} />
                  <Text style={{ marginLeft: 2, color: colors.isLight ? '#B45309' : '#F0EAD6', fontSize: 8, fontWeight: '700' }}>
                    Verified
                  </Text>
                </View>
              </View>

              {/* Right Side: Related Content */}
              <View style={{ flex: 1, marginLeft: 12, justifyContent: 'center' }}>
                <Text numberOfLines={1} style={{ color: colors.textPrimary, fontSize: 13.5, fontWeight: '700' }}>
                  {formattedName}
                </Text>
                <Text numberOfLines={1} style={{ marginTop: 2, color: colors.isLight ? '#7C5205' : '#C9A84C', fontSize: 11, fontWeight: '600' }}>
                  {a.specialty}
                </Text>

                <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center' }}>
                  <AppIcon name="star_rounded" color={colors.isLight ? '#D97706' : '#C9A84C'} size={12} />
                  <Text style={{ marginLeft: 2, color: colors.isLight ? '#B45309' : '#C9A84C', fontSize: 11, fontWeight: '700' }}>
                    {String(a.rating)}
                  </Text>
                  <Text style={{ marginLeft: 3, color: colors.isLight ? '#6B7280' : '#6B7A99', fontSize: 10 }}>
                    {`(${a.reviews})`}
                  </Text>
                  <Text style={{ marginHorizontal: 4, color: colors.isLight ? '#9CA3AF' : '#6B7A99', fontSize: 10 }}>•</Text>
                  <Text style={{ color: colors.isLight ? '#4B5563' : '#8F9CAE', fontSize: 10, fontWeight: '500' }}>
                    {a.experience}
                  </Text>
                </View>

                <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '700' }}>
                    {`₹${a.price}/min`}
                  </Text>
                  <View
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 5,
                      borderRadius: 100,
                      backgroundColor: '#713B32',
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <AppIcon name="call_rounded" color="#FFFFFF" size={11} />
                    <Text style={{ marginLeft: 4, color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.4 }}>
                      Consult Now
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/* ---------------------------------------------- AiAstrologersCarouselWidget */
function AiAstrologersCarousel({ aiAstrologers = [] }: { aiAstrologers?: LiveAstrologer[] }) {
  const colors = useThemeColors();
  const displayList = aiAstrologers && aiAstrologers.length > 0 ? aiAstrologers : DEFAULT_AI_ASTROLOGERS;

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '800' }}>✦ 24/7 AI Astrologers</Text>
            <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 100, backgroundColor: '#713B32', borderWidth: 0.5, borderColor: '#C9A84C' }}>
              <Text style={{ color: '#F0EAD6', fontSize: 10, fontWeight: '800' }}>Instant</Text>
            </View>
          </View>
          <Text style={{ color: colors.isLight ? '#7C5205' : colors.goldAccent, fontSize: 11, fontWeight: '600', marginTop: 2 }}>
            Sub-Second Vedic Calculations Powered by AstroParihar AI
          </Text>
        </View>
        <Pressable
          testID="home.aiAstrologers.viewAll"
          onPress={() => push(AppRoutes.aiChatScreen)}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 10,
            backgroundColor: '#713B32',
            borderWidth: 1,
            borderColor: '#C9A84C',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>Chat AI ›</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 14 }}
        contentContainerStyle={{ paddingHorizontal: 20 }}
      >
        {displayList.map((a) => (
          <Pressable
            key={a.id || a.name}
            testID={`home.aiAstrologer.${a.id || a.name}`}
            onPress={() => {
              push(AppRoutes.aiChatScreen, {
                astrologerId: a.id,
                astrologerName: a.name,
                avatarUrl: a.imageUrl,
              });
            }}
            style={{
              width: 300,
              height: 124,
              marginRight: 14,
              borderRadius: 20,
              backgroundColor: colors.isLight ? '#FFFDF8' : argb('14713B32'),
              borderWidth: 1.5,
              borderColor: '#713B32',
              padding: 12,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#713B32',
              shadowOpacity: colors.isLight ? 0.08 : 0.25,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            {/* Left Side: Circular Image with AI badge */}
            <View style={{ width: 66, height: 66, alignItems: 'center', justifyContent: 'center' }}>
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  borderWidth: 2,
                  borderColor: '#C9A84C',
                  overflow: 'hidden',
                  backgroundColor: colors.isLight ? '#FAF5E8' : '#0D1B2A',
                }}
              >
                <AppImage
                  uri={a.imageUrl}
                  width={60}
                  height={60}
                  fit="cover"
                  semanticLabel={a.semanticLabel || a.name}
                  errorWidget={
                    <View style={{ width: 60, height: 60, backgroundColor: '#713B32', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#F0EAD6', fontSize: 18, fontWeight: '800' }}>
                        {(a.name || 'AI')[0]}
                      </Text>
                    </View>
                  }
                />
              </View>

              {/* Online indicator */}
              <View
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: colors.isLight ? '#FFFFFF' : '#080D1A',
                  backgroundColor: '#3DCB7A',
                }}
              />

              {/* AI Guru badge at bottom */}
              <View
                style={{
                  position: 'absolute',
                  bottom: -2,
                  paddingHorizontal: 6,
                  paddingVertical: 1.5,
                  borderRadius: 100,
                  backgroundColor: '#713B32',
                  borderWidth: 1,
                  borderColor: '#C9A84C',
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <AppIcon name="auto_awesome_rounded" color="#F0EAD6" size={8} />
                <Text style={{ marginLeft: 2, color: '#F0EAD6', fontSize: 8, fontWeight: '700' }}>
                  AI Guru
                </Text>
              </View>
            </View>

            {/* Right Side: Related Content */}
            <View style={{ flex: 1, marginLeft: 12, justifyContent: 'center' }}>
              <Text numberOfLines={1} style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>
                {a.name}
              </Text>
              <Text numberOfLines={1} style={{ marginTop: 2, color: colors.isLight ? '#7C5205' : '#C9A84C', fontSize: 11, fontWeight: '600' }}>
                {a.specialty}
              </Text>

              <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center' }}>
                <AppIcon name="star_rounded" color={colors.goldAccent} size={12} />
                <Text style={{ marginLeft: 2, color: colors.goldAccent, fontSize: 11, fontWeight: '700' }}>
                  {String(a.rating)}
                </Text>
                <Text style={{ marginLeft: 3, color: colors.textMuted, fontSize: 10 }}>
                  {`(${a.reviews})`}
                </Text>
                <Text style={{ marginHorizontal: 4, color: colors.textMuted, fontSize: 10 }}>•</Text>
                <Text style={{ color: colors.isLight ? '#15803D' : '#3DCB7A', fontSize: 10, fontWeight: '700' }}>
                  {'<1s reply'}
                </Text>
              </View>

              <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '700' }}>
                  {`₹${a.price}/min`}
                </Text>
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderRadius: 100,
                    backgroundColor: '#713B32',
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <AppIcon name="auto_awesome_rounded" color="#FFFFFF" size={11} />
                  <Text style={{ marginLeft: 4, color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.4 }}>
                    Chat AI
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------- Promotions and Offers Section */
function PromotionsOffersSection({ refreshKey }: { refreshKey?: number }) {
  const colors = useThemeColors();
  const [promotions, setPromotions] = useState<DynamicPromotion[]>([]);
  const scrollRef = React.useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    getDynamicPromotions().then((data) => {
      setPromotions(Array.isArray(data) ? data : []);
    });
  }, [refreshKey]);

  useEffect(() => {
    if (promotions.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % promotions.length;
        scrollRef.current?.scrollTo({ x: next * (290 + 14), animated: true });
        return next;
      });
    }, 3800);
    return () => clearInterval(timer);
  }, [promotions.length]);

  if (promotions.length === 0) return null;

  return (
    <View style={{ marginBottom: 20 }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1, marginRight: 8 }}>
          <Text style={{ fontSize: 16 }}>🎁</Text>
          <Text numberOfLines={1} ellipsizeMode="tail" style={{ marginLeft: 6, color: colors.textPrimary, fontSize: 16, fontWeight: '800' }}>
            Promotions & Offers
          </Text>
        </View>
        <Pressable
          testID="home.promotions.viewAll"
          onPress={() => push(AppRoutes.walletScreen)}
          style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}
        >
          <Text style={{ color: colors.goldAccent, fontSize: 12, fontWeight: '700' }}>
            View All Offers
          </Text>
          <AppIcon name="chevron_right_rounded" color={colors.goldAccent} size={16} />
        </Pressable>
      </View>

      {/* Horizontal Carousel */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
        snapToInterval={290 + 14}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          const offsetX = e.nativeEvent.contentOffset.x;
          const idx = Math.round(offsetX / (290 + 14));
          setActiveIndex(Math.min(Math.max(0, idx), promotions.length - 1));
        }}
      >
        {promotions.map((promo) => {
          const targetRoute = (promo.route?.startsWith('/') ? promo.route : `/${promo.route || 'live-astrologers-screen'}`) as any;
          const showDiscount =
            promo.discount &&
            promo.discount.trim().toLowerCase() !== promo.badge.trim().toLowerCase();

          return (
            <View
              key={promo.id}
              style={{
                width: 290,
                borderRadius: 20,
                overflow: 'hidden',
                borderWidth: 1.5,
                borderColor: colors.isLight ? 'rgba(201,168,76,0.35)' : promo.borderColor,
                backgroundColor: colors.isLight ? '#FFFFFF' : promo.gradientColors[0],
                shadowColor: promo.borderColor,
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <LinearGradient
                colors={colors.isLight ? ['#FFFDF9', '#F9F5EC'] : promo.gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 16 }}
              >
                {/* Badge & Discount (No Duplication) */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                      backgroundColor: colors.isLight ? 'rgba(201,168,76,0.2)' : 'rgba(201,168,76,0.15)',
                      borderWidth: 1,
                      borderColor: colors.goldAccent,
                    }}
                  >
                    <Text style={{ color: colors.goldAccent, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 }}>
                      {promo.badge}
                    </Text>
                  </View>
                  {showDiscount ? (
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 100,
                        backgroundColor: '#713B32',
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800' }}>
                        {promo.discount}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Title & Subtitle */}
                <Text numberOfLines={1} style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '800' }}>
                  {promo.title}
                </Text>
                <Text numberOfLines={2} style={{ marginTop: 4, color: colors.textSecondary, fontSize: 11.5, lineHeight: 16 }}>
                  {promo.subtitle}
                </Text>

                {/* Coupon Code & Action Button */}
                <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderStyle: 'dashed',
                      borderColor: colors.goldAccent,
                      backgroundColor: colors.isLight ? '#FAF5E8' : 'rgba(0,0,0,0.3)',
                    }}
                  >
                    <Text style={{ color: colors.goldAccent, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
                      {promo.code}
                    </Text>
                  </View>

                  <Pressable
                    testID={`home.promo.claim.${promo.id}`}
                    onPress={() => push(targetRoute)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderRadius: 100,
                      backgroundColor: promo.btnBg,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>
                      {promo.btnLabel}
                    </Text>
                    <AppIcon name="arrow_forward" color="#FFFFFF" size={12} style={{ marginLeft: 4 }} />
                  </Pressable>
                </View>
              </LinearGradient>
            </View>
          );
        })}
      </ScrollView>

      {/* Pagination Dot Indicators */}
      {promotions.length > 1 && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12, gap: 6 }}>
          {promotions.map((p, idx) => {
            const isDotActive = activeIndex === idx;
            return (
              <Pressable
                key={`dot-${p.id}`}
                onPress={() => {
                  setActiveIndex(idx);
                  scrollRef.current?.scrollTo({ x: idx * (290 + 14), animated: true });
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Go to banner ${idx + 1}`}
              >
                <View
                  style={{
                    width: isDotActive ? 22 : 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: isDotActive
                      ? colors.goldAccent
                      : (colors.isLight ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.2)'),
                  }}
                />
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

/* --------------------------------------------- Sticky Bottom Action Bar */
function StickyHomeCTAs() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: insets.bottom + 92, // Pinned with 12px breathing room above the 68px floating tab bar
        zIndex: 99,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          borderRadius: 18,
          padding: 6,
          backgroundColor: colors.isLight ? 'rgba(250, 249, 246, 0.96)' : 'rgba(13, 27, 42, 0.96)',
          borderWidth: 1.5,
          borderColor: colors.goldAccent,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
          elevation: 6,
          gap: 8,
        }}
      >
        {/* Left: Chat with AI Astrologer */}
        <Pressable
          testID="home.sticky.chatAI"
          onPress={() => push(AppRoutes.aiChatScreen)}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 46,
            paddingVertical: 10,
            paddingHorizontal: 8,
            borderRadius: 13,
            backgroundColor: '#713B32',
            shadowColor: '#713B32',
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <AppIcon name="auto_awesome_rounded" color="#FFFFFF" size={15} />
          <Text numberOfLines={1} ellipsizeMode="tail" style={{ marginLeft: 6, color: '#FFFFFF', fontSize: 11.5, fontWeight: '800' }}>
            Chat with AI Astrologer
          </Text>
        </Pressable>

        {/* Right: Call Human Astrologer */}
        <Pressable
          testID="home.sticky.callHuman"
          onPress={() => push(AppRoutes.liveAstrologersScreen)}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 46,
            paddingVertical: 10,
            paddingHorizontal: 8,
            borderRadius: 13,
            backgroundColor: '#C9A84C',
            shadowColor: '#C9A84C',
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <AppIcon name="call_rounded" color="#FFFFFF" size={15} />
          <Text numberOfLines={1} ellipsizeMode="tail" style={{ marginLeft: 6, color: '#FFFFFF', fontSize: 11.5, fontWeight: '800' }}>
            Call Astrologer
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ screen */
export default function HomeDashboardScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [realAstrologers, setRealAstrologers] = useState<LiveAstrologer[]>([]);
  const [aiAstrologers, setAiAstrologers] = useState<LiveAstrologer[]>(DEFAULT_AI_ASTROLOGERS);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadData = async () => {
    try {
      const [realList, aiList] = await Promise.all([
        fetchRealAstrologers(),
        fetchAiAstrologers(),
      ]);
      if (realList) setRealAstrologers(realList);
      if (aiList && aiList.length > 0) setAiAstrologers(aiList);
    } catch { }
  };

  useEffect(() => {
    loadData();
    const poll = setInterval(loadData, 5000);
    return () => clearInterval(poll);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    await Promise.all([loadData(), new Promise((r) => setTimeout(r, 600))]);
    setRefreshing(false);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }} testID="home.screen">
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.goldAccent} colors={[colors.goldAccent]} progressBackgroundColor={colors.surface} />}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader />
        <View style={{ height: 16 }} />
        <CosmicInsightsCarousel refreshKey={refreshKey} />
        <PromotionsOffersSection refreshKey={refreshKey} />
        <QuickActionsGrid />
        <View style={{ height: 24 }} />
        <HoroscopeCards />
        <View style={{ height: 24 }} />
        <AiPromptCard />
        <View style={{ height: 24 }} />
        <PersonalisedRecs realAstrologers={realAstrologers} aiAstrologers={aiAstrologers} />
        <View style={{ height: 24 }} />
        <RealAstrologersCarousel realAstrologers={realAstrologers} />
        <View style={{ height: 24 }} />
        <AiAstrologersCarousel aiAstrologers={aiAstrologers} />
        {/* Generous bottom spacing so content never cuts off behind sticky CTAs & floating nav */}
        <View style={{ height: Math.max(220, insets.bottom + 170) }} />
      </ScrollView>

      {/* Sticky CTAs fixed at bottom above navigation */}
      <StickyHomeCTAs />
    </SafeAreaView>
  );
}
