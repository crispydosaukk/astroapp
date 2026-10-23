/**
 * Port of lib/presentation/home_dashboard_screen/ (screen + 7 widgets).
 * RefreshIndicator → RefreshControl (800 ms no-op refresh, same as source).
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable, switcherEntering } from '@/components/AnimatedBox';
import { AppIcon } from '@/components/AppIcon';
import { AppImage } from '@/components/AppImage';
import { ElevatedButton, ProgressRing } from '@/components/common';
import { lh, Text, TextInput } from '@/components/Text';
import { useAuthStore } from '@/features/auth/authStore';
import { AppRoutes, push } from '@/navigation/routes';
import {
  CosmicInsight,
  DEFAULT_COSMIC_INSIGHTS,
  DEFAULT_HOME_ASTROLOGERS,
  getDynamicCosmicInsights,
  getLiveHomeAstrologers,
  LiveAstrologer,
} from '@/services/homeDataService';
import { useLocationStore } from '@/services/locationService';
import { argb, withAlpha } from '@/theme/colors';
import { useThemeColors } from '@/theme/themeStore';
import { SOURCE_INERT } from '@/utils/sourceInert';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/* --------------------------------------------------------- HomeHeaderWidget */
function HomeHeader() {
  const user = useAuthStore((s) => s.user);
  const userName = user?.name?.trim() || 'Priya Sharma';
  const initial = (userName[0] || 'P').toUpperCase();
  const greeting = getGreeting();

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
    <View
      style={{
        paddingHorizontal: 20,
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
          marginRight: 10,
        }}
        accessibilityRole="button"
        accessibilityLabel={`Profile of ${userName}`}
      >
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            borderWidth: 1.5,
            borderColor: '#C9A84C',
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
          }}
        >
          <LinearGradient
            colors={['#8B1A1A', '#3D0A0A']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <Text style={{ color: '#F0EAD6', fontSize: 17, fontWeight: '700' }}>{initial}</Text>
        </View>

        <View style={{ flex: 1, justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <AppIcon name="wb_sunny_rounded" color="#C9A84C" size={12} />
            <Text style={{ marginLeft: 4, color: '#8F9CAE', fontSize: 11, fontWeight: '500' }}>
              {greeting}
            </Text>
          </View>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{ color: '#F0EAD6', fontSize: 16, fontWeight: '700', marginTop: 1 }}
          >
            {userName}
          </Text>
        </View>
      </Pressable>

      {/* Location Badge + Notification Bell in the same line */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Pressable
          testID="home.location"
          onPress={handleLocationPress}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            height: 38,
            paddingHorizontal: 11,
            borderRadius: 19,
            backgroundColor: argb('0FFFFFFF'),
            borderWidth: 1,
            borderColor: argb('1AC9A84C'),
            marginRight: 8,
          }}
          accessibilityRole="button"
          accessibilityLabel={`Current Location: ${displayCity}`}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#C9A84C" style={{ width: 14, height: 14 }} />
          ) : (
            <AppIcon name="location_on_rounded" color="#C9A84C" size={14} />
          )}
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{ marginLeft: 4, color: '#E0D8C3', fontSize: 12, fontWeight: '600', maxWidth: 85 }}
          >
            {displayCity}
          </Text>
        </Pressable>

        <Pressable
          testID="home.notifications"
          onPress={() => push(AppRoutes.notificationsScreen)}
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: argb('0FFFFFFF'),
            borderWidth: 1,
            borderColor: argb('1AC9A84C'),
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <AppIcon name="notifications_outlined" color="#F0EAD6" size={19} />
          <View
            style={{
              position: 'absolute',
              top: 7,
              right: 7,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#8B1A1A',
              borderWidth: 1.5,
              borderColor: '#0D1B2A',
            }}
          />
        </Pressable>
      </View>
    </View>
  );
}

/* ------------------------------------------------ CosmicInsightsCarousel */
function PlanetTag({ label }: { label: string }) {
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 5, borderRadius: 100, backgroundColor: argb('0FFFFFFF'), borderWidth: 1, borderColor: argb('1AC9A84C') }}>
      <Text style={{ color: '#C9A84C', fontSize: 10, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

function CosmicInsightsCarousel() {
  const [insights, setInsights] = useState<CosmicInsight[]>(DEFAULT_COSMIC_INSIGHTS);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    getDynamicCosmicInsights().then((data) => {
      if (data && data.length > 0) setInsights(data);
    });
  }, []);

  return (
    <View>
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
              borderWidth: 1,
              borderColor: argb('33C9A84C'),
              overflow: 'hidden',
              marginRight: 14,
            }}
          >
            <AppImage
              uri={card.imageUrl}
              width={200}
              height={205}
              fit="cover"
              semanticLabel={card.title}
              style={{ position: 'absolute', right: -20, top: 0 }}
            />
            <LinearGradient
              colors={['#0D1B2A', withAlpha('#0D1B2A', 225), withAlpha('#0D1B2A', 80), 'rgba(13,27,42,0)']}
              locations={[0, 0.48, 0.75, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <View style={{ flex: 1, padding: 18, justifyContent: 'space-between' }}>
              <View>
                <View
                  style={{
                    alignSelf: 'flex-start',
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 100,
                    backgroundColor: argb('1AC9A84C'),
                    borderWidth: 1,
                    borderColor: argb('33C9A84C'),
                  }}
                >
                  <Text style={{ fontSize: 10 }}>✦ </Text>
                  <Text style={{ color: '#C9A84C', fontSize: 11, fontWeight: '600' }}>
                    {card.tag}
                  </Text>
                </View>
                <Text
                  numberOfLines={2}
                  style={{ marginTop: 8, color: '#F0EAD6', fontWeight: '800', ...lh(17, 1.25) }}
                >
                  {card.title}
                </Text>
                <Text
                  numberOfLines={2}
                  style={{ marginTop: 6, color: '#A0A8C0', ...lh(12, 1.4) }}
                >
                  {card.description}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <Pressable
                  testID={`home.dailyInsight.guidance.${i}`}
                  onPress={() => push(AppRoutes.aiChatScreen)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 100,
                    backgroundColor: '#8B1A1A',
                  }}
                >
                  <AppIcon name="auto_awesome_rounded" color="#F0EAD6" size={13} />
                  <Text style={{ marginLeft: 6, color: '#F0EAD6', fontSize: 11, fontWeight: '700' }}>
                    {card.ctaText || "View Guidance"}
                  </Text>
                </Pressable>

                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 4 }}>
                  {(card.planetTags || ['♃ Jupiter', '♏ Scorpio']).slice(0, 2).map((tag, tIdx) => (
                    <PlanetTag key={tIdx} label={tag} />
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
                backgroundColor: activeIndex === dotIdx ? '#C9A84C' : '#2A3550',
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
  { emoji: '🔮', label: 'AI Astrologer', route: AppRoutes.aiChatScreen, color: '#8B1A1A', id: 'aiAstrologer', badge: 'AI Guru' },
  { emoji: '👨‍🔮', label: 'Live Astrologers', route: AppRoutes.liveAstrologersScreen, color: '#1A3D5C', id: 'liveAstrologers', badge: 'Live' },
  { emoji: '📜', label: 'My Kundli', route: AppRoutes.myKundliScreen, color: '#1A3D1A', id: 'myKundli' },
  { emoji: '💫', label: 'Kundli Match', route: AppRoutes.matchKundliScreen, color: '#3D1A2A', id: 'matchKundli' },
  { emoji: '✨', label: 'Remedies', route: AppRoutes.remediesScreen, color: '#1A2A3D', id: 'remedies' },
  { emoji: '📅', label: 'Panchang', route: AppRoutes.panchangScreen, color: '#2A2A1A', id: 'panchang' },
];

function QuickActionsGrid() {
  const [w, setW] = useState(0);
  const cell = w > 0 ? (w - 24) / 3 : 0;
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 }}>
        <Text style={{ flex: 1, color: '#F0EAD6', fontSize: 18, fontWeight: '700' }}>Quick Actions</Text>
        <Text style={{ color: '#C9A84C', fontSize: 11, fontWeight: '600' }}>Vedic & AI Tools</Text>
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
                  borderWidth: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: withAlpha(a.color, 77),
                  borderColor: withAlpha(a.color, 128),
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
                      backgroundColor: a.badge === 'AI Guru' ? '#8B1A1A' : '#1A3D2A',
                      borderWidth: 0.5,
                      borderColor: a.badge === 'AI Guru' ? '#C9A84C' : '#3DCB7A',
                    }}
                  >
                    <Text style={{ color: a.badge === 'AI Guru' ? '#C9A84C' : '#3DCB7A', fontSize: 8, fontWeight: '700' }}>
                      {a.badge}
                    </Text>
                  </View>
                ) : null}
                <Text style={{ fontSize: 28 }}>{a.emoji}</Text>
                <Text numberOfLines={2} style={{ marginTop: 6, textAlign: 'center', color: '#F0EAD6', fontWeight: '600', ...lh(11, 1.3) }}>
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
  { emoji: '❤️', label: 'Love', score: 82, color: '#8B1A1A', insight: 'Venus favours romantic connections today. Express your feelings openly — the stars support heartfelt conversations.', tip: 'Wear rose quartz for enhanced love energy' },
  { emoji: '💼', label: 'Career', score: 74, color: '#1A3D5C', insight: "Jupiter's transit through your 10th house brings career advancement. A senior may recognise your contributions.", tip: 'Tuesday is auspicious for new proposals' },
  { emoji: '💰', label: 'Money', score: 68, color: '#2A2A1A', insight: 'Avoid major financial decisions today. Saturn casts a cautionary aspect — wait until Thursday for investments.', tip: 'Recite Lakshmi Stotra in the morning' },
  { emoji: '🏥', label: 'Health', score: 88, color: '#1A3D1A', insight: 'Your vitality is strong. The Sun in your 6th house supports physical health. Morning exercise will be especially beneficial.', tip: 'Drink saffron milk at night for better sleep' },
  { emoji: '👨‍👩‍👧', label: 'Family', score: 77, color: '#2A1A3D', insight: "Mercury's influence brings harmonious family communication. A family gathering will bring joy and resolution.", tip: 'Light a ghee lamp at the family altar' },
];

function HoroscopeCards() {
  const [selected, setSelected] = useState(0);
  const cat = HOROSCOPE_CATEGORIES[selected];

  const handleAskAIAboutHoroscope = () => {
    push(AppRoutes.aiChatScreen, {
      initialPrompt: `Namaste 🙏 Please analyze my ${cat.label} horoscope for today based on my birth chart and current planetary transits. What guidance and parihar do you recommend?`,
    });
  };

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 }}>
        <Text style={{ flex: 1, color: '#F0EAD6', fontSize: 18, fontWeight: '700' }}>Today&apos;s Horoscope</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 100, backgroundColor: argb('1AC9A84C') }}>
          <Text style={{ color: '#C9A84C', fontSize: 10, fontWeight: '700' }}>✦ Vedika AI Engine</Text>
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
                marginRight: 8, height: 36, paddingHorizontal: 16, borderRadius: 100, borderWidth: 1, flexDirection: 'row', alignItems: 'center',
                backgroundColor: sel ? '#8B1A1A' : argb('0FFFFFFF'), borderColor: sel ? '#8B1A1A' : argb('1AC9A84C'),
              }}
            >
              <Text style={{ fontSize: 13 }}>{item.emoji}</Text>
              <Text style={{ marginLeft: 6, color: sel ? '#F0EAD6' : '#6B7A99', fontSize: 13, fontWeight: '600' }}>{item.label}</Text>
            </AnimatedPressable>
          );
        }}
      />
      <View style={{ marginTop: 14, paddingHorizontal: 20 }}>
        <Animated.View key={selected} entering={switcherEntering(10, 300)}>
          <View style={{ padding: 20, borderRadius: 20, backgroundColor: withAlpha(cat.color, 51), borderWidth: 1, borderColor: withAlpha(cat.color, 102) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 24 }}>{cat.emoji}</Text>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={{ color: '#F0EAD6', fontSize: 16, fontWeight: '700' }}>{`${cat.label} Horoscope`}</Text>
                <Text style={{ color: '#6B7A99', fontSize: 12 }}>Scorpio • Live Vedic Transit</Text>
              </View>
              <View style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }}>
                <ProgressRing value={cat.score / 100} size={36} strokeWidth={4} color={cat.color} backgroundColor={withAlpha(cat.color, 51)} />
                <Text style={{ position: 'absolute', color: '#F0EAD6', fontSize: 13, fontWeight: '700' }}>{String(cat.score)}</Text>
              </View>
            </View>
            <Text style={{ marginTop: 14, color: '#A0A8C0', ...lh(14, 1.6) }}>{cat.insight}</Text>
            <View style={{ marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: argb('0FC9A84C'), borderWidth: 1, borderColor: argb('1AC9A84C'), flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 14 }}>🕯️</Text>
              <Text style={{ marginLeft: 8, flex: 1, color: '#C9A84C', fontSize: 12, fontStyle: 'italic' }}>{cat.tip}</Text>
            </View>

            {/* AI Astrologer Consultation Button for this Category */}
            <Pressable
              onPress={handleAskAIAboutHoroscope}
              style={{
                marginTop: 12,
                paddingVertical: 9,
                paddingHorizontal: 12,
                borderRadius: 12,
                backgroundColor: argb('1A8B1A1A'),
                borderWidth: 1,
                borderColor: argb('338B1A1A'),
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppIcon name="auto_awesome_rounded" color="#F0EAD6" size={13} />
              <Text style={{ marginLeft: 6, color: '#F0EAD6', fontSize: 11, fontWeight: '700' }}>
                {`Ask AI Astrologer about your ${cat.label}`}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
      <Pressable
        testID="home.horoscope.viewFull"
        onPress={() => push(AppRoutes.horoscopeScreen)}
        style={{ marginTop: 12, marginHorizontal: 20, paddingVertical: 12, borderRadius: 14, backgroundColor: argb('0FFFFFFF'), borderWidth: 1, borderColor: argb('33C9A84C'), flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
      >
        <Text style={{ fontSize: 14 }}>🔮</Text>
        <Text style={{ marginLeft: 8, color: '#C9A84C', fontSize: 13, fontWeight: '700' }}>View Full 12 Signs Horoscope</Text>
        <AppIcon name="arrow_forward_ios_rounded" color="#C9A84C" size={12} style={{ marginLeft: 6 }} />
      </Pressable>
    </View>
  );
}

/* -------------------------------------------------------- AiPromptCardWidget */
function AiPromptCard() {
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
    <View style={{ marginHorizontal: 20, borderRadius: 24, borderWidth: 1, borderColor: argb('338B1A1A'), overflow: 'hidden' }}>
      <LinearGradient colors={[withAlpha('#8B1A1A', 38), withAlpha('#0D1B2A', 204)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ padding: 8, borderRadius: 12, backgroundColor: argb('1A8B1A1A'), borderWidth: 1, borderColor: argb('338B1A1A') }}>
            <Text style={{ fontSize: 20 }}>🔮</Text>
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={{ color: '#F0EAD6', fontSize: 17, fontWeight: '700' }}>Ask AstroParihar AI</Text>
            <Text style={{ color: '#6B7A99', fontSize: 12 }}>Powered by Vedika AI & OpenAI Vedic Ephemeris</Text>
          </View>
        </View>
        <Text style={{ marginTop: 16, color: '#A0A8C0', fontSize: 14 }}>Have a question about your life?</Text>
        <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', borderRadius: 100, backgroundColor: argb('0FFFFFFF'), borderWidth: 1, borderColor: argb('1AC9A84C') }}>
          <TextInput
            testID="home.aiPrompt.input"
            value={text}
            onChangeText={setText}
            onSubmitEditing={() => handleAsk()}
            placeholder="Ask about career, love, marriage..."
            style={{ flex: 1, marginLeft: 16, paddingVertical: 14, fontSize: 13, color: '#F0EAD6' }}
          />
          <Pressable
            testID="home.aiPrompt.mic"
            onPress={() => handleAsk()}
            style={{ width: 44, height: 44, marginRight: 4, borderRadius: 22, backgroundColor: argb('1AC9A84C'), alignItems: 'center', justifyContent: 'center' }}
          >
            <AppIcon name="arrow_forward_ios_rounded" color="#C9A84C" size={16} />
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
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 100,
                backgroundColor: argb('1AC9A84C'),
                borderWidth: 1,
                borderColor: argb('33C9A84C'),
              }}
            >
              <Text style={{ color: '#C9A84C', fontSize: 11, fontWeight: '600' }}>{pill}</Text>
            </Pressable>
          ))}
        </View>

        <ElevatedButton
          testID="home.aiPrompt.ask"
          label="Ask AI Astrologer"
          icon="auto_awesome_rounded"
          onPress={() => handleAsk()}
          style={{ marginTop: 16 }}
          fontWeight="700"
        />
      </LinearGradient>
    </View>
  );
}

/* --------------------------------------------------- PersonalisedRecsWidget */
function PersonalisedRecs({ astrologers = [] }: { astrologers?: LiveAstrologer[] }) {
  const topAi = astrologers.find((a) => a.isAi) || DEFAULT_HOME_ASTROLOGERS.find((a) => a.isAi) || DEFAULT_HOME_ASTROLOGERS[1];
  const topReal = astrologers.find((a) => !a.isAi) || DEFAULT_HOME_ASTROLOGERS.find((a) => !a.isAi) || DEFAULT_HOME_ASTROLOGERS[0];

  const dynamicRecs = [
    {
      emoji: '🔮',
      title: `Talk to AI Astrologer: ${topAi.name}`,
      subtitle: `${topAi.specialty} • Instant Answers with Vedika AI`,
      tag: 'AI Guru',
      tagColor: '#C9A84C',
      onPress: () => push(AppRoutes.aiChatScreen, { astrologerId: topAi.id, astrologerName: topAi.name, avatarUrl: topAi.imageUrl }),
    },
    {
      emoji: '👨‍🔮',
      title: `Live Consultation: ${topReal.name}`,
      subtitle: `${topReal.specialty} • ${topReal.experience} • ₹${topReal.price}/min`,
      tag: 'Live Now',
      tagColor: '#2D9E6B',
      onPress: () => push(AppRoutes.liveAstrologersScreen),
    },
    {
      emoji: '🪐',
      title: 'Your Saturn Period is Approaching',
      subtitle: 'Sade Sati begins in 8 months — prepare with remedies',
      tag: 'Dasha Alert',
      tagColor: '#CF4444',
      onPress: () => push(AppRoutes.remediesScreen),
    },
    {
      emoji: '❤️',
      title: '36 Guna Kundli Milan & Compatibility',
      subtitle: 'Check Ashtakoot planetary harmony for marriage',
      tag: 'Recommended',
      tagColor: '#1A3D5C',
      onPress: () => push(AppRoutes.matchKundliScreen),
    },
  ];

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 }}>
        <Text style={{ flex: 1, color: '#F0EAD6', fontSize: 18, fontWeight: '700' }}>Recommended For You</Text>
        <Text style={{ color: '#6B7A99', fontSize: 11 }}>Live Synced • Based on your chart</Text>
      </View>
      <View style={{ height: 14 }} />
      {dynamicRecs.map((r) => (
        <Pressable
          key={r.title}
          onPress={r.onPress}
          style={{ marginHorizontal: 20, marginBottom: 10, padding: 16, borderRadius: 16, backgroundColor: argb('0FFFFFFF'), borderWidth: 1, borderColor: argb('1AC9A84C'), flexDirection: 'row', alignItems: 'center' }}
        >
          <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: withAlpha(r.tagColor, 38), alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 22 }}>{r.emoji}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <View style={{ alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100, backgroundColor: withAlpha(r.tagColor, 38) }}>
              <Text style={{ color: r.tagColor, fontSize: 10, fontWeight: '700' }}>{r.tag}</Text>
            </View>
            <Text style={{ marginTop: 4, color: '#F0EAD6', fontSize: 14, fontWeight: '600' }}>{r.title}</Text>
            <Text style={{ marginTop: 2, color: '#6B7A99', fontSize: 12 }}>{r.subtitle}</Text>
          </View>
          <AppIcon name="chevron_right_rounded" color="#6B7A99" size={20} style={{ marginLeft: 8 }} />
        </Pressable>
      ))}
    </View>
  );
}

/* ------------------------------------------------ AstrologersCarouselWidget */
function AstrologersCarousel({ astrologers = [] }: { astrologers?: LiveAstrologer[] }) {
  const displayList = astrologers && astrologers.length > 0 ? astrologers : DEFAULT_HOME_ASTROLOGERS;
  const onlineCount = displayList.filter((a) => a.isOnline).length || 47;

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 }}>
        <Text style={{ color: '#F0EAD6', fontSize: 18, fontWeight: '700' }}>Astrologers Online Now</Text>
        <View style={{ marginLeft: 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, backgroundColor: argb('1A3DCB7A') }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#3DCB7A' }} />
          <Text style={{ marginLeft: 4, color: '#3DCB7A', fontSize: 11, fontWeight: '600' }}>
            {`${onlineCount} Online`}
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        <Pressable testID="home.astrologers.viewAll" onPress={() => push(AppRoutes.liveAstrologersScreen)}>
          <Text style={{ color: '#C9A84C', fontSize: 13, fontWeight: '600' }}>View All</Text>
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
            testID={`home.astrologer.${a.id || a.name}`}
            onPress={() => {
              if (a.isAi) {
                push(AppRoutes.aiChatScreen, {
                  astrologerId: a.id,
                  astrologerName: a.name,
                  avatarUrl: a.imageUrl,
                });
              } else {
                push(AppRoutes.liveAstrologersScreen);
              }
            }}
            style={{
              width: 300,
              height: 124,
              marginRight: 14,
              borderRadius: 20,
              backgroundColor: argb('0FFFFFFF'),
              borderWidth: 1,
              borderColor: argb('1AC9A84C'),
              padding: 12,
              flexDirection: 'row',
              alignItems: 'center',
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
                  borderColor: '#C9A84C',
                  overflow: 'hidden',
                  backgroundColor: '#0D1B2A',
                }}
              >
                <AppImage
                  uri={a.imageUrl}
                  width={60}
                  height={60}
                  fit="cover"
                  semanticLabel={a.semanticLabel || a.name}
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
                  borderColor: '#080D1A',
                  backgroundColor: a.isOnline ? '#3DCB7A' : '#6B7A99',
                }}
              />

              {/* Verified or AI badge at bottom of circle */}
              <View
                style={{
                  position: 'absolute',
                  bottom: -2,
                  paddingHorizontal: 6,
                  paddingVertical: 1.5,
                  borderRadius: 100,
                  backgroundColor: a.isAi ? '#8B1A1A' : '#0D1B2A',
                  borderWidth: 1,
                  borderColor: '#C9A84C',
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <AppIcon name={a.isAi ? 'auto_awesome_rounded' : 'verified_rounded'} color="#C9A84C" size={8} />
                <Text style={{ marginLeft: 2, color: '#F0EAD6', fontSize: 8, fontWeight: '700' }}>
                  {a.isAi ? 'AI Guru' : 'Verified'}
                </Text>
              </View>
            </View>

            {/* Right Side: Related Content */}
            <View style={{ flex: 1, marginLeft: 12, justifyContent: 'center' }}>
              <Text numberOfLines={1} style={{ color: '#F0EAD6', fontSize: 13, fontWeight: '700' }}>
                {a.name}
              </Text>
              <Text numberOfLines={1} style={{ marginTop: 2, color: '#C9A84C', fontSize: 11, fontWeight: '600' }}>
                {a.specialty}
              </Text>

              <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center' }}>
                <AppIcon name="star_rounded" color="#C9A84C" size={12} />
                <Text style={{ marginLeft: 2, color: '#C9A84C', fontSize: 11, fontWeight: '700' }}>
                  {String(a.rating)}
                </Text>
                <Text style={{ marginLeft: 3, color: '#6B7A99', fontSize: 10 }}>
                  {`(${a.reviews})`}
                </Text>
                <Text style={{ marginHorizontal: 4, color: '#6B7A99', fontSize: 10 }}>•</Text>
                <Text style={{ color: '#8F9CAE', fontSize: 10, fontWeight: '500' }}>
                  {a.experience}
                </Text>
              </View>

              <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: '#F0EAD6', fontSize: 12, fontWeight: '700' }}>
                  {`₹${a.price}/min`}
                </Text>
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderRadius: 100,
                    backgroundColor: '#8B1A1A',
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <AppIcon name="chat_bubble_outline_rounded" color="#F0EAD6" size={11} />
                  <Text style={{ marginLeft: 4, color: '#F0EAD6', fontSize: 10, fontWeight: '700' }}>
                    Consult
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
interface PromoCardData {
  id: string;
  badge: string;
  discount: string;
  title: string;
  subtitle: string;
  code: string;
  gradientColors: [string, string];
  borderColor: string;
  btnBg: string;
  btnText: string;
  btnLabel: string;
  route: string;
  icon: string;
}

const PROMOTIONS_DATA: PromoCardData[] = [
  {
    id: 'promo-1',
    badge: 'FIRST CONSULTATION',
    discount: '50% OFF',
    title: '50% OFF Your First Session',
    subtitle: 'Connect with verified Vedic Astrologers or AI Jyotish. Use coupon at checkout.',
    code: 'FIRST50',
    gradientColors: ['#3D0A0A', '#1A0404'],
    borderColor: '#8B1A1A',
    btnBg: '#C9A84C',
    btnText: '#080D1A',
    btnLabel: 'Claim 50% Off',
    route: AppRoutes.liveAstrologersScreen,
    icon: 'local_offer',
  },
  {
    id: 'promo-2',
    badge: 'FREE LIFE REPORT',
    discount: 'WORTH ₹499',
    title: 'Free Kundli Life Prediction',
    subtitle: 'Get a 40+ page comprehensive Kundli dossier free with any 10-minute session.',
    code: 'FREEKUNDLI',
    gradientColors: ['#0A1D37', '#06101E'],
    borderColor: '#4FC3F7',
    btnBg: '#4FC3F7',
    btnText: '#080D1A',
    btnLabel: 'Get Free Report',
    route: AppRoutes.kundliReportsScreen,
    icon: 'auto_stories',
  },
  {
    id: 'promo-3',
    badge: 'SPECIAL PARIHARA',
    discount: 'FLAT ₹199',
    title: '48-Day Navagraha Shanti',
    subtitle: 'Alleviate active Dasha malefic effects with customized daily Vedic remedies.',
    code: 'PARIHAR199',
    gradientColors: ['#2E1805', '#140A00'],
    borderColor: '#FFB347',
    btnBg: '#FFB347',
    btnText: '#080D1A',
    btnLabel: 'Explore Parihar',
    route: AppRoutes.remediesScreen,
    icon: 'local_fire_department',
  },
];

function PromotionsOffersSection() {
  const colors = useThemeColors();

  return (
    <View style={{ marginTop: 2 }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 16 }}>🎁</Text>
          <Text style={{ marginLeft: 6, color: colors.textPrimary, fontSize: 16, fontWeight: '800' }}>
            Promotions & Offers
          </Text>
        </View>
        <Pressable
          testID="home.promotions.viewAll"
          onPress={() => push(AppRoutes.walletScreen)}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <Text style={{ color: colors.goldAccent, fontSize: 12, fontWeight: '700' }}>
            View All Offers
          </Text>
          <AppIcon name="chevron_right_rounded" color={colors.goldAccent} size={16} />
        </Pressable>
      </View>

      {/* Horizontal Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
      >
        {PROMOTIONS_DATA.map((promo) => (
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
              {/* Badge & Discount */}
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
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 100,
                    backgroundColor: '#8B1A1A',
                  }}
                >
                  <Text style={{ color: '#F0EAD6', fontSize: 10, fontWeight: '800' }}>
                    {promo.discount}
                  </Text>
                </View>
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
                  onPress={() => push(promo.route)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 100,
                    backgroundColor: promo.btnBg,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: promo.btnText, fontSize: 11, fontWeight: '800' }}>
                    {promo.btnLabel}
                  </Text>
                  <AppIcon name="arrow_forward" color={promo.btnText} size={12} style={{ marginLeft: 4 }} />
                </Pressable>
              </View>
            </LinearGradient>
          </View>
        ))}
      </ScrollView>
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
        bottom: insets.bottom + 84, // Pinned right above the 68px floating bottom tab bar
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
            paddingVertical: 12,
            paddingHorizontal: 8,
            borderRadius: 13,
            backgroundColor: '#8B1A1A',
            shadowColor: '#8B1A1A',
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <AppIcon name="auto_awesome_rounded" color="#F0EAD6" size={16} />
          <Text style={{ marginLeft: 6, color: '#F0EAD6', fontSize: 12.5, fontWeight: '800' }}>
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
            paddingVertical: 12,
            paddingHorizontal: 8,
            borderRadius: 13,
            backgroundColor: '#C9A84C',
            shadowColor: '#C9A84C',
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <AppIcon name="call_rounded" color="#080D1A" size={16} />
          <Text style={{ marginLeft: 6, color: '#080D1A', fontSize: 12.5, fontWeight: '800' }}>
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
  const [astrologers, setAstrologers] = useState<LiveAstrologer[]>(DEFAULT_HOME_ASTROLOGERS);

  const loadData = async () => {
    try {
      const list = await getLiveHomeAstrologers();
      if (list && list.length > 0) setAstrologers(list);
    } catch {}
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
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
        <View style={{ height: 20 }} />
        <CosmicInsightsCarousel />
        <View style={{ height: 24 }} />
        <PromotionsOffersSection />
        <View style={{ height: 24 }} />
        <QuickActionsGrid />
        <View style={{ height: 24 }} />
        <HoroscopeCards />
        <View style={{ height: 24 }} />
        <AiPromptCard />
        <View style={{ height: 24 }} />
        <PersonalisedRecs astrologers={astrologers} />
        <View style={{ height: 24 }} />
        <AstrologersCarousel astrologers={astrologers} />
        {/* Generous bottom spacing so content never cuts off behind sticky CTAs & floating nav */}
        <View style={{ height: Math.max(220, insets.bottom + 170) }} />
      </ScrollView>

      {/* Sticky CTAs fixed at bottom above navigation */}
      <StickyHomeCTAs />
    </SafeAreaView>
  );
}
