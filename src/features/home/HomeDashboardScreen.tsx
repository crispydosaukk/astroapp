/**
 * Port of lib/presentation/home_dashboard_screen/ (screen + 7 widgets).
 * RefreshIndicator → RefreshControl (800 ms no-op refresh, same as source).
 */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedPressable, switcherEntering } from '@/components/AnimatedBox';
import { AppIcon } from '@/components/AppIcon';
import { AppImage } from '@/components/AppImage';
import { ElevatedButton, ProgressRing } from '@/components/common';
import { lh, Text, TextInput } from '@/components/Text';
import { AppRoutes, push } from '@/navigation/routes';
import { argb, withAlpha } from '@/theme/colors';
import { SOURCE_INERT } from '@/utils/sourceInert';

/* --------------------------------------------------------- HomeHeaderWidget */
function HomeHeader() {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Image
          source={require('@/../assets/images/app_logo.png')}
          style={{ width: 140, height: 40 }}
          contentFit="contain"
          accessibilityLabel="AstroParihar"
        />
        <Pressable
          testID="home.notifications"
          onPress={() => push(AppRoutes.notificationsScreen)}
          style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: argb('0FFFFFFF'), borderWidth: 1, borderColor: argb('1AC9A84C'), alignItems: 'center', justifyContent: 'center' }}
        >
          <AppIcon name="notifications_outlined" color="#F0EAD6" size={20} />
          <View style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: '#8B1A1A' }} />
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: '#C9A84C', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
          <LinearGradient colors={['#8B1A1A', '#3D0A0A']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
          <Text style={{ color: '#F0EAD6', fontSize: 18, fontWeight: '700' }}>P</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <AppIcon name="wb_sunny_rounded" color="#C9A84C" size={14} />
            <Text style={{ marginLeft: 4, color: '#6B7A99', fontSize: 12 }}>Good Morning</Text>
          </View>
          <Text style={{ color: '#F0EAD6', fontSize: 18, fontWeight: '700' }}>Priya Sharma</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 100, backgroundColor: argb('0FFFFFFF'), borderWidth: 1, borderColor: argb('1AC9A84C') }}>
          <AppIcon name="location_on_rounded" color="#C9A84C" size={14} />
          <Text style={{ marginLeft: 4, color: '#A0A8C0', fontSize: 12 }}>Mumbai</Text>
        </View>
      </View>
    </View>
  );
}

/* --------------------------------------------------- DailyInsightCardWidget */
function PlanetTag({ label }: { label: string }) {
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 5, borderRadius: 100, backgroundColor: argb('0FFFFFFF'), borderWidth: 1, borderColor: argb('1AC9A84C') }}>
      <Text style={{ color: '#C9A84C', fontSize: 10, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

function DailyInsightCard() {
  return (
    <View style={{ marginHorizontal: 20, height: 200, borderRadius: 24, borderWidth: 1, borderColor: argb('33C9A84C'), overflow: 'hidden' }}>
      <AppImage
        uri="https://images.pexels.com/photos/1252890/pexels-photo-1252890.jpeg?auto=compress&cs=tinysrgb&w=600"
        width={200} height={200} fit="cover"
        semanticLabel="Cosmic night sky with glowing stars and zodiac constellation patterns in deep purple and gold"
        style={{ position: 'absolute', right: -20, top: 0 }}
      />
      <LinearGradient
        colors={['#0D1B2A', withAlpha('#0D1B2A', 217), withAlpha('#0D1B2A', 77), 'rgba(13,27,42,0)']}
        locations={[0, 0.45, 0.7, 1]}
        start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View style={{ flex: 1, padding: 20 }}>
        <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, backgroundColor: argb('1AC9A84C'), borderWidth: 1, borderColor: argb('33C9A84C') }}>
          <Text style={{ fontSize: 10 }}>✦ </Text>
          <Text style={{ color: '#C9A84C', fontSize: 11, fontWeight: '600' }}>Your Cosmic Insight Today</Text>
        </View>
        <Text style={{ marginTop: 10, color: '#F0EAD6', fontWeight: '800', ...lh(18, 1.2) }}>{'Scorpio — Moon in\nPunarvasu Nakshatra'}</Text>
        <Text style={{ marginTop: 8, color: '#A0A8C0', ...lh(12, 1.4) }}>{"Jupiter's transit brings clarity\nto your career path today."}</Text>
        <View style={{ flex: 1 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable
            testID="home.dailyInsight.guidance"
            onPress={() => push(AppRoutes.aiChatScreen)}
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100, backgroundColor: '#8B1A1A' }}
          >
            <AppIcon name="auto_awesome_rounded" color="#F0EAD6" size={14} />
            <Text style={{ marginLeft: 6, color: '#F0EAD6', fontSize: 12, fontWeight: '600' }}>View Today&apos;s Guidance</Text>
          </Pressable>
          <View style={{ width: 8 }} />
          <PlanetTag label="♃ Jupiter" />
          <View style={{ width: 4 }} />
          <PlanetTag label="♏ Scorpio" />
        </View>
      </View>
    </View>
  );
}

/* ---------------------------------------------------- QuickActionsGridWidget */
const QUICK_ACTIONS = [
  { emoji: '🔮', label: 'AI Astrologer', route: AppRoutes.aiChatScreen, color: '#8B1A1A', id: 'aiAstrologer' },
  { emoji: '👨‍🔮', label: 'Talk to Astrologer', route: AppRoutes.liveAstrologersScreen, color: '#1A3D5C', id: 'liveAstrologers' },
  { emoji: '📜', label: 'My Kundli', route: AppRoutes.myKundliScreen, color: '#1A3D1A', id: 'myKundli' },
  { emoji: '❤️', label: 'Match Kundli', route: AppRoutes.matchKundliScreen, color: '#3D1A2A', id: 'matchKundli' },
  { emoji: '📅', label: 'Panchang', route: AppRoutes.panchangScreen, color: '#2A2A1A', id: 'panchang' },
  { emoji: '✨', label: 'Remedies', route: AppRoutes.remediesScreen, color: '#1A2A3D', id: 'remedies' },
];

function QuickActionsGrid() {
  const [w, setW] = useState(0);
  const cell = w > 0 ? (w - 24) / 3 : 0;
  return (
    <View>
      <Text style={{ paddingHorizontal: 20, color: '#F0EAD6', fontSize: 18, fontWeight: '700' }}>Quick Actions</Text>
      <View style={{ marginTop: 14, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
          {cell > 0 &&
            QUICK_ACTIONS.map((a) => (
              <Pressable
                key={a.id}
                testID={`home.quickAction.${a.id}`}
                onPress={() => push(a.route)}
                style={{
                  width: cell, height: cell / 1.1, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: withAlpha(a.color, 77), borderColor: withAlpha(a.color, 128),
                }}
              >
                <Text style={{ fontSize: 28 }}>{a.emoji}</Text>
                <Text numberOfLines={2} style={{ marginTop: 6, textAlign: 'center', color: '#F0EAD6', fontWeight: '600', ...lh(11, 1.3) }}>{a.label}</Text>
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
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 }}>
        <Text style={{ flex: 1, color: '#F0EAD6', fontSize: 18, fontWeight: '700' }}>Today&apos;s Horoscope</Text>
        <Text style={{ color: '#6B7A99', fontSize: 12 }}>Oct 6, 2026</Text>
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
                <Text style={{ color: '#6B7A99', fontSize: 12 }}>Scorpio • Tuesday</Text>
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
          </View>
        </Animated.View>
      </View>
      <Pressable
        testID="home.horoscope.viewFull"
        onPress={() => push(AppRoutes.horoscopeScreen)}
        style={{ marginTop: 12, marginHorizontal: 20, paddingVertical: 12, borderRadius: 14, backgroundColor: argb('0FFFFFFF'), borderWidth: 1, borderColor: argb('33C9A84C'), flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
      >
        <Text style={{ fontSize: 14 }}>🔮</Text>
        <Text style={{ marginLeft: 8, color: '#C9A84C', fontSize: 13, fontWeight: '700' }}>View Full Horoscope</Text>
        <AppIcon name="arrow_forward_ios_rounded" color="#C9A84C" size={12} style={{ marginLeft: 6 }} />
      </Pressable>
    </View>
  );
}

/* -------------------------------------------------------- AiPromptCardWidget */
function AiPromptCard() {
  const [text, setText] = useState('');
  return (
    <View style={{ marginHorizontal: 20, borderRadius: 24, borderWidth: 1, borderColor: argb('338B1A1A'), overflow: 'hidden' }}>
      <LinearGradient colors={[withAlpha('#8B1A1A', 38), withAlpha('#0D1B2A', 204)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ padding: 8, borderRadius: 12, backgroundColor: argb('1A8B1A1A'), borderWidth: 1, borderColor: argb('338B1A1A') }}>
            <Text style={{ fontSize: 20 }}>🔮</Text>
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={{ color: '#F0EAD6', fontSize: 17, fontWeight: '700' }}>Ask AstroParihar AI</Text>
            <Text style={{ color: '#6B7A99', fontSize: 12 }}>Your 24/7 Vedic astrology companion</Text>
          </View>
        </View>
        <Text style={{ marginTop: 16, color: '#A0A8C0', fontSize: 14 }}>Have a question about your life?</Text>
        <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', borderRadius: 100, backgroundColor: argb('0FFFFFFF'), borderWidth: 1, borderColor: argb('1AC9A84C') }}>
          <TextInput
            testID="home.aiPrompt.input"
            value={text}
            onChangeText={setText}
            placeholder="Ask about career, love, marriage..."
            style={{ flex: 1, marginLeft: 16, paddingVertical: 14, fontSize: 13, color: '#F0EAD6' }}
          />
          <Pressable
            testID="home.aiPrompt.mic"
            onPress={SOURCE_INERT('home.aiPrompt.mic')}
            style={{ width: 44, height: 44, marginRight: 4, borderRadius: 22, backgroundColor: argb('1AC9A84C'), alignItems: 'center', justifyContent: 'center' }}
          >
            <AppIcon name="mic_rounded" color="#C9A84C" size={20} />
          </Pressable>
        </View>
        <ElevatedButton
          testID="home.aiPrompt.ask"
          label="Ask AI Astrologer"
          icon="auto_awesome_rounded"
          onPress={() => push(AppRoutes.aiChatScreen)}
          style={{ marginTop: 16 }}
          fontWeight="700"
        />
      </LinearGradient>
    </View>
  );
}

/* --------------------------------------------------- PersonalisedRecsWidget */
const RECS = [
  { emoji: '🪐', title: 'Your Saturn Period is Approaching', subtitle: 'Sade Sati begins in 8 months — prepare with remedies', tag: 'Dasha Alert', tagColor: '#CF4444' },
  { emoji: '💼', title: 'Explore Your Career Report', subtitle: 'Jupiter transit favours career shifts in Q1 2027', tag: 'Recommended', tagColor: '#1A3D5C' },
  { emoji: '💎', title: 'Try Your Personalised Remedy', subtitle: 'Emerald gemstone recommended for Mercury strengthening', tag: 'For You', tagColor: '#1A3D1A' },
  { emoji: '👨‍🔮', title: 'Consult a Vedic Astrologer', subtitle: 'Based on your current Antardasha — deep guidance available', tag: 'Live Now', tagColor: '#2D9E6B' },
];

function PersonalisedRecs() {
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 }}>
        <Text style={{ flex: 1, color: '#F0EAD6', fontSize: 18, fontWeight: '700' }}>Recommended For You</Text>
        <Text style={{ color: '#6B7A99', fontSize: 11 }}>Based on your chart</Text>
      </View>
      <View style={{ height: 14 }} />
      {RECS.map((r) => (
        // Rows are display-only in source (no gesture handler).
        <View key={r.title} style={{ marginHorizontal: 20, marginBottom: 10, padding: 16, borderRadius: 16, backgroundColor: argb('0FFFFFFF'), borderWidth: 1, borderColor: argb('1AC9A84C'), flexDirection: 'row', alignItems: 'center' }}>
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
        </View>
      ))}
    </View>
  );
}

/* ------------------------------------------------ AstrologersCarouselWidget */
const CAROUSEL_ASTROLOGERS = [
  { name: 'Swami Shankarananda Giri', specialty: 'Parashara Dasha Guru', experience: '35+ Yrs', rating: 4.99, reviews: '24.5k', price: 45, isOnline: true, imageUrl: 'https://img.rocket.new/generatedImages/rocket_gen_img_155f972a8-1770809507602.png', semanticLabel: 'Elderly Indian sage with white beard and traditional orange robes, serene expression', languages: 'Hindi, Sanskrit' },
  { name: 'Acharya Raghvendra Shastri', specialty: 'Relationship & Soul Harmony', experience: '19+ Yrs', rating: 4.96, reviews: '18.9k', price: 22, isOnline: true, imageUrl: 'https://img.rocket.new/generatedImages/rocket_gen_img_15a0ea664-1763296536479.png', semanticLabel: 'Indian man in traditional kurta with calm and wise expression, professional headshot', languages: 'Hindi, English' },
  { name: 'Acharya Shreya Devi', specialty: 'Kundli Milan Specialist', experience: '16+ Yrs', rating: 4.97, reviews: '15.2k', price: 20, isOnline: false, imageUrl: 'https://img.rocket.new/generatedImages/rocket_gen_img_167d481e0-1772731661402.png', semanticLabel: 'Indian woman in traditional saree with warm smile and professional appearance', languages: 'Tamil, Hindi, English' },
];

function AstrologersCarousel() {
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 }}>
        <Text style={{ color: '#F0EAD6', fontSize: 18, fontWeight: '700' }}>Astrologers Online Now</Text>
        <View style={{ marginLeft: 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, backgroundColor: argb('1A3DCB7A') }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#3DCB7A' }} />
          <Text style={{ marginLeft: 4, color: '#3DCB7A', fontSize: 11, fontWeight: '600' }}>47 Online</Text>
        </View>
        <View style={{ flex: 1 }} />
        <Pressable testID="home.astrologers.viewAll" onPress={() => push(AppRoutes.liveAstrologersScreen)}>
          <Text style={{ color: '#C9A84C', fontSize: 13, fontWeight: '600' }}>View All</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14, height: 220 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
        {CAROUSEL_ASTROLOGERS.map((a) => (
          <View key={a.name} style={{ width: 160, marginRight: 12, alignSelf: 'flex-start', borderRadius: 20, backgroundColor: argb('0FFFFFFF'), borderWidth: 1, borderColor: argb('1AC9A84C'), overflow: 'hidden' }}>
            <View>
              <AppImage uri={a.imageUrl} width={160} height={100} fit="cover" semanticLabel={a.semanticLabel} />
              <View style={{ position: 'absolute', top: 8, right: 8, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#0D1B2A', backgroundColor: a.isOnline ? '#3DCB7A' : '#6B7A99' }} />
              <View style={{ position: 'absolute', bottom: 8, left: 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 100, backgroundColor: withAlpha('#0D1B2A', 204) }}>
                <AppIcon name="verified_rounded" color="#C9A84C" size={10} />
                <Text style={{ marginLeft: 3, color: '#C9A84C', fontSize: 9, fontWeight: '600' }}>Verified</Text>
              </View>
            </View>
            <View style={{ padding: 10 }}>
              <Text numberOfLines={1} style={{ color: '#F0EAD6', fontSize: 12, fontWeight: '700' }}>{a.name}</Text>
              <Text numberOfLines={1} style={{ marginTop: 2, color: '#6B7A99', fontSize: 10 }}>{a.specialty}</Text>
              <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center' }}>
                <AppIcon name="star_rounded" color="#C9A84C" size={12} />
                <Text style={{ marginLeft: 2, color: '#C9A84C', fontSize: 11, fontWeight: '700' }}>{String(a.rating)}</Text>
                <View style={{ flex: 1 }} />
                <Text style={{ color: '#F0EAD6', fontSize: 11, fontWeight: '700' }}>{`₹${a.price}/min`}</Text>
              </View>
              {/* "Chat" pill is a plain Container in the source (no tap handler). */}
              <View style={{ marginTop: 8, paddingVertical: 7, borderRadius: 100, backgroundColor: '#8B1A1A', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                <AppIcon name="chat_bubble_outline_rounded" color="#F0EAD6" size={12} />
                <Text style={{ marginLeft: 4, color: '#F0EAD6', fontSize: 11, fontWeight: '700' }}>Chat</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------------------------ screen */
export default function HomeDashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 800));
    setRefreshing(false);
  };
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#080D1A' }} testID="home.screen">
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A84C" colors={['#C9A84C']} progressBackgroundColor="#0D1B2A" />}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader />
        <View style={{ height: 20 }} />
        <DailyInsightCard />
        <View style={{ height: 24 }} />
        <QuickActionsGrid />
        <View style={{ height: 24 }} />
        <HoroscopeCards />
        <View style={{ height: 24 }} />
        <AiPromptCard />
        <View style={{ height: 24 }} />
        <PersonalisedRecs />
        <View style={{ height: 24 }} />
        <AstrologersCarousel />
        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
