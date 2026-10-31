/**
 * Services Screen - 100% Dynamic Engine connected to Admin Dashboard
 * - Dynamic Category Tabs (All, Remedies, Free Tools, Mahadasha, Panchang, Consultations, Guidance, etc.)
 * - Categories rendered in EXACT order set in Dashboard (Sacred Vedic Remedies first when configured first)
 * - Category Names, Sanskrit subheads, Badges, Tab Labels, and items fully reflect Dashboard edits
 * - 2-Column Responsive Grid with theme-adaptive styling and instant offline caching
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { Text } from '@/components/Text';
import { API_ENDPOINTS } from '@/config/api';
import { AppRoutes, push } from '@/navigation/routes';
import { withAlpha } from '@/theme/colors';
import { useTranslation } from '@/theme/languageStore';
import { useThemeColors } from '@/theme/themeStore';

const STORAGE_SERVICES_CATEGORIES_CACHE = 'astroparihar_services_categories_cache_v3';

export interface ServiceItem {
  id: string;
  name: string;
  sanskrit?: string;
  desc: string;
  icon: string;
  route: string;
  color: string;
  badge?: string;
  direction?: string;
  isRemedies?: boolean;
  active?: boolean;
}

export interface ServiceCategory {
  id: string;
  order: number;
  category: string;
  title: string;
  sanskrit?: string;
  tabLabel?: string;
  desc: string;
  badge?: string;
  icon: string;
  color: string;
  active: boolean;
  items: ServiceItem[];
}

export const DEFAULT_SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'cat-remedies',
    order: 1,
    category: 'remedies',
    title: 'Sacred Vedic Remedies',
    sanskrit: 'अष्ट परिहार • Ashta-Digbandhana',
    tabLabel: 'Remedies',
    desc: 'Harmonize planetary energies through authentic Vedic remedies prescribed by the 8 sacred directions.',
    badge: '8 in 1 Card',
    icon: 'auto_awesome',
    color: '#713B32',
    active: true,
    items: [
      {
        id: 'rem-mantra',
        name: 'Mantra Shakti (मन्त्र शक्ति)',
        sanskrit: 'मन्त्र शक्ति',
        desc: 'Sacred sound vibrations that align planetary energies',
        direction: 'North',
        icon: 'auto_awesome',
        route: AppRoutes.remediesScreen,
        color: '#9370DB',
        badge: 'North',
        isRemedies: true,
      },
      {
        id: 'rem-yantra',
        name: 'Yantra (यन्त्र)',
        sanskrit: 'यन्त्र',
        desc: 'Sacred geometric diagrams that attract cosmic energies',
        direction: 'North-East',
        icon: 'auto_awesome',
        route: AppRoutes.remediesScreen,
        color: '#FFD700',
        badge: 'North-East',
        isRemedies: true,
      },
      {
        id: 'rem-homa',
        name: 'Homa (होम / हवन)',
        sanskrit: 'होम / हवन',
        desc: 'Sacred fire rituals to purify and invoke divine blessings',
        direction: 'East',
        icon: 'whatshot',
        route: AppRoutes.remediesScreen,
        color: '#FF6B35',
        badge: 'East',
        isRemedies: true,
      },
      {
        id: 'rem-devata',
        name: 'Devata Upasana (देवता उपासना)',
        sanskrit: 'देवता उपासना',
        desc: 'Personal deity worship for spiritual alignment',
        direction: 'South-East',
        icon: 'wb_sunny',
        route: AppRoutes.remediesScreen,
        color: '#FFB347',
        badge: 'South-East',
        isRemedies: true,
      },
      {
        id: 'rem-ratna',
        name: 'Ratna / Gemstones (रत्न)',
        sanskrit: 'रत्न',
        desc: 'Planetary gemstones to strengthen beneficial influences',
        direction: 'South',
        icon: 'diamond',
        route: AppRoutes.remediesScreen,
        color: '#4FC3F7',
        badge: 'South',
        isRemedies: true,
      },
      {
        id: 'rem-rudraksha',
        name: 'Rudraksha (रुद्राक्ष)',
        sanskrit: 'रुद्राक्ष',
        desc: 'Sacred seeds of Lord Shiva for protection and healing',
        direction: 'South-West',
        icon: 'spa',
        route: AppRoutes.remediesScreen,
        color: '#8B4513',
        badge: 'South-West',
        isRemedies: true,
      },
      {
        id: 'rem-vastu',
        name: 'Vastu (वास्तु)',
        sanskrit: 'वास्तु',
        desc: 'Sacred architecture for harmonious living spaces',
        direction: 'West',
        icon: 'home',
        route: AppRoutes.remediesScreen,
        color: '#81C784',
        badge: 'West',
        isRemedies: true,
      },
      {
        id: 'rem-charity',
        name: 'Dāna & Seva (दान एवं सेवा)',
        sanskrit: 'दान एवं सेवा',
        desc: 'Charitable giving and selfless service for karmic balance',
        direction: 'North-West',
        icon: 'favorite',
        route: AppRoutes.remediesScreen,
        color: '#FF6B6B',
        badge: 'North-West',
        isRemedies: true,
      },
    ],
  },
  {
    id: 'cat-free-tools',
    order: 2,
    category: 'kundli',
    title: 'Free Services & Tools',
    sanskrit: 'निःशुल्क वैदिक सेवाएं',
    tabLabel: 'Free Tools',
    desc: 'Personalized Vedic birth charts, compatibility, Panchang, daily horoscope, meditation & fasting planners.',
    badge: 'Free',
    icon: 'auto_stories',
    color: '#9370DB',
    active: true,
    items: [
      {
        id: 'tool-janam-kundli',
        name: 'Janam Kundli',
        sanskrit: 'जन्म कुंडली',
        desc: 'Personalized Vedic birth chart & life predictions',
        icon: 'auto_stories',
        route: AppRoutes.myKundliScreen,
        color: '#9370DB',
        badge: 'Free',
      },
      {
        id: 'tool-kundli-match',
        name: 'Kundli Matching',
        sanskrit: 'कुंडली मिलान',
        desc: 'Vedic Gun Milan & marital compatibility check',
        icon: 'favorite_border',
        route: AppRoutes.matchKundliScreen,
        color: '#FF6B6B',
        badge: 'Free',
      },
      {
        id: 'tool-panchang',
        name: 'Panchang',
        sanskrit: 'पंचांग',
        desc: 'Tithi, Nakshatra, Yoga & Shubh Muhurat',
        icon: 'calendar_today_outlined',
        route: AppRoutes.panchangScreen,
        color: '#4FC3F7',
        badge: 'Free',
      },
      {
        id: 'tool-horoscope',
        name: 'Daily Horoscope',
        sanskrit: 'दैनिक राशिफल',
        desc: 'Daily zodiac forecasts & lucky guidance',
        icon: 'wb_sunny_outlined',
        route: AppRoutes.horoscopeScreen,
        color: '#FFB347',
        badge: 'Free',
      },
      {
        id: 'tool-ai-astrologer',
        name: 'AI Astrologer',
        sanskrit: 'एआई ज्योतिषी',
        desc: '24/7 instant spiritual guidance & answers',
        icon: 'psychology_outlined',
        route: AppRoutes.aiChatScreen,
        color: '#E53935',
        badge: 'AI 24/7',
      },
      {
        id: 'tool-talk-astrologer',
        name: 'Talk to Astrologer',
        sanskrit: 'ज्योतिषी से बात करें',
        desc: 'Live 1-on-1 consultations with verified masters',
        icon: 'people_outline',
        route: AppRoutes.liveAstrologersScreen,
        color: '#4CAF50',
        badge: 'Live',
      },
    ],
  },
  {
    id: 'cat-mahadasha',
    order: 3,
    category: 'mahadasha',
    title: 'Mahadasha Guides (Paid PDFs)',
    sanskrit: 'महादशा विशेष संकलन • PDF Dossiers',
    tabLabel: 'Mahadasha',
    desc: 'In-depth downloadable PDF blueprints with exact Sanskrit mantras, dietary rules, and planetary remedies.',
    badge: 'Paid PDFs',
    icon: 'menu_book',
    color: '#FF6B35',
    active: true,
    items: [
      {
        id: 'maha-rahu',
        name: 'Rahu Mahadasha Guide',
        sanskrit: 'राहु महादशा',
        desc: 'Deep dive into Rahu transit cycles & remedies',
        icon: 'description_outlined',
        route: AppRoutes.astrologyReportsScreen,
        color: '#FF6B35',
        badge: 'PDF',
      },
      {
        id: 'maha-saturn',
        name: 'Shani Sade Sati Guide',
        sanskrit: 'शनि साढ़े साती',
        desc: 'Authentic protective remedies for Saturn cycles',
        icon: 'description_outlined',
        route: AppRoutes.astrologyReportsScreen,
        color: '#29B6F6',
        badge: 'PDF',
      },
    ],
  },
  {
    id: 'cat-guidance',
    order: 4,
    category: 'guidance',
    title: 'Specialized Life Guidance',
    sanskrit: 'विशेष जीवन मार्गदर्शन',
    tabLabel: 'Guidance',
    desc: 'In-depth astrological solutions for career, relationships, business, wealth, and destiny.',
    badge: 'Comprehensive',
    icon: 'psychology_outlined',
    color: '#FFB347',
    active: true,
    items: [
      {
        id: 'gui-career',
        name: 'Career Astrology',
        sanskrit: 'करियर ज्योतिष',
        desc: 'Career & profession path timing',
        icon: 'work_outline',
        route: AppRoutes.careerAstrologyScreen,
        color: '#FFD700',
      },
      {
        id: 'gui-marriage',
        name: 'Marriage Astrology',
        sanskrit: 'विवाह ज्योतिष',
        desc: 'Marriage timing, matching & remedies',
        icon: 'ring_volume_outlined',
        route: AppRoutes.marriageAstrologyScreen,
        color: '#FF6B6B',
      },
      {
        id: 'gui-business',
        name: 'Business Astrology',
        sanskrit: 'व्यापार ज्योतिष',
        desc: 'Business success & partnership analysis',
        icon: 'business_center_outlined',
        route: AppRoutes.businessAstrologyScreen,
        color: '#29B6F6',
      },
      {
        id: 'gui-finance',
        name: 'Finance Astrology',
        sanskrit: 'वित्त ज्योतिष',
        desc: 'Wealth accumulation & investment timing',
        icon: 'account_balance_outlined',
        route: AppRoutes.financeAstrologyScreen,
        color: '#81C784',
      },
      {
        id: 'gui-tarot',
        name: 'Tarot Card Reading',
        sanskrit: 'टैरो कार्ड',
        desc: 'Intuitive mystical card readings',
        icon: 'style_outlined',
        route: AppRoutes.tarotScreen,
        color: '#BA68C8',
      },
      {
        id: 'gui-numerology',
        name: 'Numerology',
        sanskrit: 'अंक ज्योतिष',
        desc: 'Life destiny & birth number vibrations',
        icon: 'tag_outlined',
        route: AppRoutes.numerologyScreen,
        color: '#FFB347',
      },
      {
        id: 'gui-spiritual',
        name: 'Spiritual Guidance',
        sanskrit: 'आध्यात्मिक मार्गदर्शन',
        desc: 'Soul path, meditation & chakra balancing',
        icon: 'self_improvement',
        route: AppRoutes.spiritualGuidanceScreen,
        color: '#9370DB',
      },
    ],
  },
];

function resolveServiceRoute(routeStr?: string, id?: string): string {
  if (!routeStr) {
    if (id?.includes('remed')) return AppRoutes.remediesScreen;
    if (id?.includes('kundli-match') || id?.includes('match')) return AppRoutes.matchKundliScreen;
    if (id?.includes('kundli')) return AppRoutes.myKundliScreen;
    if (id?.includes('panchang')) return AppRoutes.panchangScreen;
    if (id?.includes('horoscope')) return AppRoutes.horoscopeScreen;
    if (id?.includes('career')) return AppRoutes.careerAstrologyScreen;
    if (id?.includes('marriage')) return AppRoutes.marriageAstrologyScreen;
    if (id?.includes('business')) return AppRoutes.businessAstrologyScreen;
    if (id?.includes('finance')) return AppRoutes.financeAstrologyScreen;
    if (id?.includes('tarot')) return AppRoutes.tarotScreen;
    if (id?.includes('numerology')) return AppRoutes.numerologyScreen;
    if (id?.includes('muhurat')) return AppRoutes.muhuratScreen;
    if (id?.includes('spiritual')) return AppRoutes.spiritualGuidanceScreen;
    if (id?.includes('report')) return AppRoutes.astrologyReportsScreen;
    if (id?.includes('talk') || id?.includes('live')) return AppRoutes.liveAstrologersScreen;
    if (id?.includes('ai')) return AppRoutes.aiChatScreen;
    return AppRoutes.servicesScreen;
  }
  const clean = routeStr.trim();
  switch (clean) {
    case '/my-kundli-screen':
    case 'myKundliScreen':
    case '/my-kundli':
      return AppRoutes.myKundliScreen;
    case '/remedies-screen':
    case 'remediesScreen':
    case '/remedies':
      return AppRoutes.remediesScreen;
    case '/match-kundli-screen':
    case 'matchKundliScreen':
    case '/match-kundli':
      return AppRoutes.matchKundliScreen;
    case '/horoscope-screen':
    case 'horoscopeScreen':
    case '/horoscope':
      return AppRoutes.horoscopeScreen;
    case '/panchang-screen':
    case 'panchangScreen':
    case '/panchang':
      return AppRoutes.panchangScreen;
    case '/ai-chat-screen':
    case 'aiChatScreen':
    case '/ai-chat':
    case '/talk-to-ai-astrologer':
      return AppRoutes.aiChatScreen;
    case '/live-astrologers-screen':
    case 'liveAstrologersScreen':
    case '/talk-to-astrologer':
    case '/consultation-booking-screen':
      return AppRoutes.liveAstrologersScreen;
    case '/career-astrology-screen':
    case 'careerAstrologyScreen':
      return AppRoutes.careerAstrologyScreen;
    case '/marriage-astrology-screen':
    case 'marriageAstrologyScreen':
      return AppRoutes.marriageAstrologyScreen;
    case '/business-astrology-screen':
    case 'businessAstrologyScreen':
      return AppRoutes.businessAstrologyScreen;
    case '/finance-astrology-screen':
    case 'financeAstrologyScreen':
      return AppRoutes.financeAstrologyScreen;
    case '/tarot-screen':
    case 'tarotScreen':
      return AppRoutes.tarotScreen;
    case '/numerology-screen':
    case 'numerologyScreen':
      return AppRoutes.numerologyScreen;
    case '/muhurat-screen':
    case 'muhuratScreen':
      return AppRoutes.muhuratScreen;
    case '/spiritual-guidance-screen':
    case 'spiritualGuidanceScreen':
      return AppRoutes.spiritualGuidanceScreen;
    case '/astrology-reports-screen':
    case 'astrologyReportsScreen':
      return AppRoutes.astrologyReportsScreen;
    case '/wallet-screen':
    case 'walletScreen':
    case '/wallet':
      return AppRoutes.walletScreen;
    default:
      return clean.startsWith('/') ? clean : `/${clean}`;
  }
}

export function parseCategoriesFromBackend(data: any): ServiceCategory[] {
  if (!data || !Array.isArray(data.categories) || data.categories.length === 0) {
    return DEFAULT_SERVICE_CATEGORIES;
  }

  // Preserve EXACT order from dashboard backend
  const sorted = [...data.categories].sort((a, b) => (a.order || 0) - (b.order || 0));

  return sorted.map((cat: any, cIdx: number) => {
    const rawItems: any[] = Array.isArray(cat.items) ? cat.items : [];
    const items: ServiceItem[] = rawItems
      .filter((it) => it.active !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((it: any) => ({
        id: it.id || `item-${cIdx}-${Math.random()}`,
        name: it.name || 'Service',
        sanskrit: it.sanskrit || '',
        desc: it.desc || '',
        icon: it.icon || 'auto_awesome',
        route: resolveServiceRoute(it.route, it.id),
        color: it.color || cat.color || '#C9A84C',
        badge: it.badge || undefined,
        direction: it.direction || undefined,
        isRemedies:
          cat.category === 'remedies' ||
          it.id === 'remedies' ||
          it.route === '/remedies-screen' ||
          it.isRemedies,
        active: it.active !== false,
      }));

    return {
      id: cat.id || `cat-${cIdx}`,
      order: cat.order || cIdx + 1,
      category: cat.category || 'general',
      title: cat.title || 'Vedic Services',
      sanskrit: cat.sanskrit || '',
      tabLabel: cat.tabLabel || cat.title?.split(' ')[0] || 'Tab',
      desc: cat.desc || '',
      badge: cat.badge || undefined,
      icon: cat.icon || 'auto_awesome',
      color: cat.color || '#713B32',
      active: cat.active !== false,
      items,
    };
  });
}

function StatChip({ value, label, colors }: { value: string; label: string; colors: any }) {
  return (
    <View
      style={{
        marginRight: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignItems: 'center',
        backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 20 : 25),
        borderWidth: 1,
        borderColor: colors.cardBorder,
      }}
    >
      <Text style={{ color: colors.goldAccent, fontSize: 13, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 1 }}>{label}</Text>
    </View>
  );
}

export default function ServicesScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const { width: windowWidth } = useWindowDimensions();
  const [gridWidth, setGridWidth] = useState(0);
  const effectiveGridWidth = gridWidth > 0 ? gridWidth : Math.max(280, windowWidth - 40);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 100% Dynamic Categories directly matching dashboard
  const [categories, setCategories] = useState<ServiceCategory[]>(DEFAULT_SERVICE_CATEGORIES);
  const [selectedTab, setSelectedTab] = useState<string>('All');

  useEffect(() => {
    let isMounted = true;

    // 1. Instant load from local cache
    AsyncStorage.getItem(STORAGE_SERVICES_CATEGORIES_CACHE)
      .then((cached) => {
        if (cached && isMounted) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setCategories(parsed);
            }
          } catch {}
        }
      })
      .catch(() => {});

    // 2. Fetch live configuration from dashboard API
    async function fetchDynamicServices() {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(API_ENDPOINTS.services, { signal: controller.signal });
        clearTimeout(timer);

        if (res.ok) {
          const data = await res.json();
          if (data.success && isMounted) {
            const parsed = parseCategoriesFromBackend(data);
            if (parsed && parsed.length > 0) {
              setCategories(parsed);
              AsyncStorage.setItem(STORAGE_SERVICES_CATEGORIES_CACHE, JSON.stringify(parsed)).catch(() => {});
            }
          }
        }
      } catch (err) {
        // Fallback to cache / defaults
      }
    }

    fetchDynamicServices();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2 equal columns with 12px gap
  const cellW = Math.floor((effectiveGridWidth - 12) / 2);

  // Active categories in EXACT dashboard order
  const activeCategories = useMemo(() => {
    return categories.filter((c) => c.active !== false);
  }, [categories]);

  // Dynamic Tabs generated from Dashboard Categories
  const categoryTabs = useMemo(() => {
    return ['All', ...activeCategories.map((c) => c.tabLabel || c.title.split(' ')[0])];
  }, [activeCategories]);

  // Filtered categories based on selected tab and search query
  const displayedCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return activeCategories
      .filter((cat) => {
        if (selectedTab === 'All') return true;
        const tabMatch = cat.tabLabel?.toLowerCase() === selectedTab.toLowerCase() ||
          cat.title.toLowerCase().includes(selectedTab.toLowerCase()) ||
          cat.category.toLowerCase().includes(selectedTab.toLowerCase());
        return tabMatch;
      })
      .map((cat) => {
        if (!q) return cat;
        // If search query is active, filter items inside category
        const filteredItems = cat.items.filter(
          (it) =>
            it.name.toLowerCase().includes(q) ||
            it.desc.toLowerCase().includes(q) ||
            (it.sanskrit && it.sanskrit.toLowerCase().includes(q)) ||
            (it.badge && it.badge.toLowerCase().includes(q))
        );
        return {
          ...cat,
          items: filteredItems,
        };
      })
      .filter((cat) => cat.items.length > 0);
  }, [activeCategories, selectedTab, searchQuery]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="services.screen">
      <AppBar
        title={t('nav.services', 'Services')}
        backgroundColor={colors.background}
        backColor={colors.textPrimary}
        actions={[
          {
            icon: isSearchOpen ? 'close' : 'search_rounded',
            color: colors.goldAccent,
            onPress: () => {
              setIsSearchOpen((prev) => !prev);
              if (isSearchOpen) setSearchQuery('');
            },
            testID: 'services.search',
          },
        ]}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 88,
        }}
      >
        {/* Interactive Search Bar when toggled */}
        {isSearchOpen && (
          <View
            style={{
              marginHorizontal: 20,
              marginTop: 4,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surface,
              borderRadius: 14,
              borderWidth: 1.2,
              borderColor: colors.goldAccent,
              paddingHorizontal: 12,
              height: 44,
              shadowColor: colors.goldAccent,
              shadowOpacity: 0.15,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <AppIcon name="search_rounded" color={colors.goldAccent} size={18} />
            <TextInput
              placeholder={t('Search services...', 'Search services (Kundli, Remedies, Horoscope...)')}
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              style={{
                flex: 1,
                marginLeft: 8,
                fontSize: 13,
                color: colors.textPrimary,
                paddingVertical: 0,
              }}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <AppIcon name="close" color={colors.textMuted} size={16} />
              </Pressable>
            )}
          </View>
        )}

        {/* Top Header Banner Card */}
        <LinearGradient
          colors={
            colors.isLight
              ? ['#FFFDF9', '#F5EFE6']
              : [withAlpha(colors.goldAccent, 25), colors.surfaceVariant]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            marginHorizontal: 20,
            marginTop: 8,
            marginBottom: 14,
            padding: 20,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            shadowColor: '#000',
            shadowOpacity: colors.isLight ? 0.04 : 0.2,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '800' }}>
            AstroParihar Services
          </Text>
          <Text style={{ marginTop: 6, color: colors.textSecondary, fontSize: 13 }}>
            Categorized Vedic remedies, birth charts, panchang & live consultations.
          </Text>
          <View style={{ marginTop: 12, flexDirection: 'row' }}>
            <StatChip value="16+" label="Services" colors={colors} />
            <StatChip value="50K+" label="Consultations" colors={colors} />
            <StatChip value="4.9★" label="Rating" colors={colors} />
          </View>
        </LinearGradient>

        {/* Dynamic Category Tabs Filter Bar */}
        <View style={{ marginBottom: 16 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          >
            {categoryTabs.map((tab) => {
              const isTabActive = selectedTab.toLowerCase() === tab.toLowerCase();
              return (
                <Pressable
                  key={tab}
                  testID={`services.tab.${tab}`}
                  onPress={() => setSelectedTab(tab)}
                  style={({ pressed }) => ({
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 100,
                    backgroundColor: isTabActive
                      ? '#713B32'
                      : colors.surface,
                    borderWidth: 1.2,
                    borderColor: isTabActive
                      ? '#713B32'
                      : colors.cardBorder,
                    shadowColor: isTabActive ? '#713B32' : '#000',
                    shadowOpacity: isTabActive ? 0.25 : 0.04,
                    shadowRadius: 4,
                    elevation: isTabActive ? 3 : 1,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  })}
                >
                  <Text
                    style={{
                      color: isTabActive ? '#FFFFFF' : colors.textPrimary,
                      fontSize: 12,
                      fontWeight: isTabActive ? '800' : '600',
                    }}
                  >
                    {tab}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Categorized Services Content in EXACT Dashboard Order */}
        <View
          style={{ paddingHorizontal: 20 }}
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            if (w > 0 && Math.abs(w - gridWidth) > 2) {
              setGridWidth(w);
            }
          }}
        >
          {displayedCategories.length === 0 ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <AppIcon name="search_off" color={colors.textMuted} size={42} />
              <Text style={{ marginTop: 12, color: colors.textSecondary, fontSize: 14, fontWeight: '600' }}>
                No services found for "{searchQuery || selectedTab}"
              </Text>
            </View>
          ) : (
            displayedCategories.map((category) => {
              const isRemediesCategory = category.category === 'remedies';

              return (
                <View key={category.id} style={{ marginBottom: 24 }}>
                  {/* Category Header */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 10,
                      paddingHorizontal: 2,
                    }}
                  >
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800' }}>
                          {category.title}
                        </Text>
                        {category.sanskrit ? (
                          <Text style={{ color: colors.goldAccent, fontSize: 12, fontWeight: '700' }}>
                            {category.sanskrit}
                          </Text>
                        ) : null}
                      </View>
                      {category.desc ? (
                        <Text numberOfLines={1} style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
                          {category.desc}
                        </Text>
                      ) : null}
                    </View>

                    {category.badge && (
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 8,
                          backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 18 : 28),
                          borderWidth: 1,
                          borderColor: withAlpha(colors.goldAccent, colors.isLight ? 60 : 80),
                        }}
                      >
                        <Text
                          style={{
                            color: colors.goldAccent,
                            fontSize: 10,
                            fontWeight: '800',
                          }}
                        >
                          {category.badge}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Sacred Remedies Featured Banner if it's the Remedies Category */}
                  {isRemediesCategory && (
                    <Pressable
                      onPress={() => push(AppRoutes.remediesScreen)}
                      style={({ pressed }) => ({
                        marginBottom: 12,
                        padding: 14,
                        borderRadius: 16,
                        backgroundColor: colors.isLight ? '#FAF5EB' : withAlpha(colors.goldAccent, 18),
                        borderWidth: 1.5,
                        borderColor: colors.goldAccent,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                      })}
                    >
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <AppIcon name="auto_awesome" color={colors.goldAccent} size={16} />
                          <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '800' }}>
                            Ashta-Digbandhana Mandala
                          </Text>
                        </View>
                        <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 3 }}>
                          Tap to view full 8 sacred direction rituals & prescriptions
                        </Text>
                      </View>
                      <View
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 100,
                          backgroundColor: '#713B32',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 10.5, fontWeight: '800' }}>
                          Explore
                        </Text>
                        <AppIcon name="arrow_forward" color="#FFFFFF" size={11} />
                      </View>
                    </Pressable>
                  )}

                  {/* 2-Column Grid of Service Cards */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                    {category.items.map((s) => {
                      const isRemedy = !!s.isRemedies;
                      const cardBorderColor = isRemedy ? colors.goldAccent : colors.cardBorder;
                      const cardShadowColor = isRemedy ? colors.goldAccent : '#000';

                      return (
                        <Pressable
                          key={s.id}
                          testID={`services.card.${s.name.replace(/[^A-Za-z]/g, '')}`}
                          onPress={() => push(s.route)}
                          style={({ pressed }) => ({
                            width: cellW,
                            height: 122,
                            padding: 13,
                            borderRadius: 18,
                            backgroundColor: colors.surface,
                            borderWidth: isRemedy ? 1.5 : 1.2,
                            borderColor: cardBorderColor,
                            justifyContent: 'space-between',
                            shadowColor: cardShadowColor,
                            shadowOpacity: colors.isLight ? (isRemedy ? 0.16 : 0.03) : 0.18,
                            shadowRadius: 6,
                            shadowOffset: { width: 0, height: 2 },
                            elevation: isRemedy ? 4 : 2,
                            transform: [{ scale: pressed ? 0.98 : 1 }],
                          })}
                          accessibilityRole="button"
                          accessibilityLabel={`${s.name}, ${s.desc}`}
                        >
                          {/* Top Row: Service Icon & Indicator Arrow / Badge */}
                          <View
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <View
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 11,
                                backgroundColor: withAlpha(s.color || colors.goldAccent, colors.isLight ? 16 : 24),
                                borderWidth: 1,
                                borderColor: withAlpha(s.color || colors.goldAccent, colors.isLight ? 35 : 55),
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <AppIcon name={s.icon} color={s.color || colors.goldAccent} size={19} />
                            </View>

                            {s.badge ? (
                              <View
                                style={{
                                  paddingHorizontal: 7,
                                  paddingVertical: 2.5,
                                  borderRadius: 8,
                                  backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 18 : 28),
                                  borderWidth: 1,
                                  borderColor: withAlpha(colors.goldAccent, colors.isLight ? 60 : 80),
                                }}
                              >
                                <Text
                                  style={{
                                    color: colors.goldAccent,
                                    fontSize: 9.5,
                                    fontWeight: '700',
                                    letterSpacing: 0.3,
                                  }}
                                >
                                  {s.badge}
                                </Text>
                              </View>
                            ) : (
                              <AppIcon
                                name="arrow_forward_ios_rounded"
                                color={colors.textMuted}
                                size={11.5}
                              />
                            )}
                          </View>

                          {/* Bottom Row: Name and Description */}
                          <View>
                            <Text
                              numberOfLines={1}
                              style={{
                                color: colors.textPrimary,
                                fontSize: 13,
                                fontWeight: '700',
                                letterSpacing: 0.2,
                              }}
                            >
                              {s.name}
                            </Text>
                            <Text
                              numberOfLines={1}
                              style={{
                                marginTop: 2,
                                color: colors.textMuted,
                                fontSize: 10.5,
                                letterSpacing: 0.1,
                              }}
                            >
                              {s.sanskrit || s.desc}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
