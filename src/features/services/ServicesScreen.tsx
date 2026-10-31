/**
 * Services Screen
 * - Complete 2-column grid design matching original aesthetic with rich theme-adaptability.
 * - Each row has exactly 2 cards (cellW = Math.floor((gridWidth - 12) / 2)).
 * - Sacred Vedic Remedies card placed right after 'My Kundli'.
 *   Tapping Remedies navigates directly to RemediesScreen (8 Ashta-Digbandhana remedies).
 * - Removed Life Guidance section as requested.
 * - Real-time search filter and pixel-perfect row alignments and spacing.
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

const STORAGE_SERVICES_CACHE = 'astroparihar_services_list_cache';

export interface ServiceItem {
  id: string;
  name: string;
  desc: string;
  icon: string;
  route: string;
  color: string;
  badge?: string;
  isRemedies?: boolean;
}

export const SERVICES: ServiceItem[] = [
  {
    id: 'my-kundli',
    name: 'My Kundli',
    desc: 'Your complete birth chart',
    icon: 'auto_stories',
    route: AppRoutes.myKundliScreen,
    color: '#9370DB',
  },
  {
    id: 'remedies',
    name: 'Remedies',
    desc: '8 Ashta Parihar remedies',
    icon: 'auto_awesome',
    route: AppRoutes.remediesScreen,
    color: '#C9A84C',
    badge: '8 Remedies',
    isRemedies: true,
  },
  {
    id: 'match-kundli',
    name: 'Match Kundli',
    desc: 'Vedic compatibility',
    icon: 'favorite_border',
    route: AppRoutes.matchKundliScreen,
    color: '#FF6B6B',
  },
  {
    id: 'daily-horoscope',
    name: 'Daily Horoscope',
    desc: "Today's cosmic guidance",
    icon: 'wb_sunny_outlined',
    route: AppRoutes.horoscopeScreen,
    color: '#FFB347',
  },
  {
    id: 'panchang',
    name: 'Panchang',
    desc: 'Vedic almanac & muhurat',
    icon: 'calendar_today_outlined',
    route: AppRoutes.panchangScreen,
    color: '#4FC3F7',
  },
  {
    id: 'ai-astrologer',
    name: 'AI Astrologer',
    desc: '24/7 instant guidance',
    icon: 'psychology_outlined',
    route: AppRoutes.aiChatScreen,
    color: '#E53935',
  },
  {
    id: 'talk-astrologer',
    name: 'Talk to Astrologer',
    desc: 'Live expert consultations',
    icon: 'people_outline',
    route: AppRoutes.liveAstrologersScreen,
    color: '#4CAF50',
  },
  {
    id: 'career-astrology',
    name: 'Career Astrology',
    desc: 'Career & profession path',
    icon: 'work_outline',
    route: AppRoutes.careerAstrologyScreen,
    color: '#FFD700',
  },
  {
    id: 'marriage-astrology',
    name: 'Marriage Astrology',
    desc: 'Marriage timing & match',
    icon: 'ring_volume_outlined',
    route: AppRoutes.marriageAstrologyScreen,
    color: '#FF6B6B',
  },
  {
    id: 'business-astrology',
    name: 'Business Astrology',
    desc: 'Business success timing',
    icon: 'business_center_outlined',
    route: AppRoutes.businessAstrologyScreen,
    color: '#29B6F6',
  },
  {
    id: 'finance-astrology',
    name: 'Finance Astrology',
    desc: 'Wealth & investment',
    icon: 'account_balance_outlined',
    route: AppRoutes.financeAstrologyScreen,
    color: '#81C784',
  },
  {
    id: 'tarot',
    name: 'Tarot',
    desc: 'Intuitive card readings',
    icon: 'style_outlined',
    route: AppRoutes.tarotScreen,
    color: '#BA68C8',
  },
  {
    id: 'numerology',
    name: 'Numerology',
    desc: 'Numbers & life destiny',
    icon: 'tag_outlined',
    route: AppRoutes.numerologyScreen,
    color: '#FFB347',
  },
  {
    id: 'muhurat',
    name: 'Muhurat',
    desc: 'Auspicious event timings',
    icon: 'event_available_outlined',
    route: AppRoutes.muhuratScreen,
    color: '#FFD700',
  },
  {
    id: 'kundli-reports',
    name: 'Kundli Reports',
    desc: 'Life, Career & Dasha PDF',
    icon: 'assignment_outlined',
    route: AppRoutes.kundliReportsScreen,
    color: '#2D9E6B',
  },
  {
    id: 'astrology-reports',
    name: 'Astrology Reports',
    desc: 'Detailed PDF reports',
    icon: 'description_outlined',
    route: AppRoutes.astrologyReportsScreen,
    color: '#4FC3F7',
  },
];

function resolveServiceRoute(routeStr?: string, id?: string): string {
  if (!routeStr) {
    if (id?.includes('remed')) return AppRoutes.remediesScreen;
    if (id?.includes('kundli-match') || id?.includes('match')) return AppRoutes.matchKundliScreen;
    if (id?.includes('my-kundli')) return AppRoutes.myKundliScreen;
    if (id?.includes('kundli-reports') || id?.includes('report-kundli')) return AppRoutes.kundliReportsScreen;
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
    if (id?.includes('report')) return AppRoutes.astrologyReportsScreen;
    if (id?.includes('talk') || id?.includes('live')) return AppRoutes.liveAstrologersScreen;
    if (id?.includes('ai')) return AppRoutes.aiChatScreen;
    return AppRoutes.servicesScreen;
  }
  const clean = routeStr.trim();
  switch (clean) {
    case '/my-kundli-screen':
    case 'myKundliScreen':
      return AppRoutes.myKundliScreen;
    case '/remedies-screen':
    case 'remediesScreen':
      return AppRoutes.remediesScreen;
    case '/match-kundli-screen':
    case 'matchKundliScreen':
      return AppRoutes.matchKundliScreen;
    case '/horoscope-screen':
    case 'horoscopeScreen':
      return AppRoutes.horoscopeScreen;
    case '/panchang-screen':
    case 'panchangScreen':
      return AppRoutes.panchangScreen;
    case '/ai-chat-screen':
    case 'aiChatScreen':
      return AppRoutes.aiChatScreen;
    case '/live-astrologers-screen':
    case 'liveAstrologersScreen':
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
    case '/kundli-reports-screen':
    case 'kundliReportsScreen':
      return AppRoutes.kundliReportsScreen;
    case '/astrology-reports-screen':
    case 'astrologyReportsScreen':
      return AppRoutes.astrologyReportsScreen;
    default:
      return clean.startsWith('/') ? clean : `/${clean}`;
  }
}

export function parseDynamicServices(data: any): ServiceItem[] {
  if (!data) return SERVICES;

  const categories: any[] = Array.isArray(data.categories) ? data.categories : [];
  const flatServices: any[] = Array.isArray(data.services) ? data.services : [];

  // Filter out any Life Guidance / Spiritual Guidance category or items
  const itemMap = new Map<string, any>();
  flatServices.forEach((it: any) => {
    if (it.id && !it.id.includes('spiritual') && !it.id.includes('guidance')) itemMap.set(it.id, it);
    if (it.route && !it.route.includes('spiritual-guidance')) itemMap.set(it.route, it);
  });

  const remediesCat = categories.find(
    (c: any) => c.id === 'cat-remedies' || c.category === 'remedies'
  );

  const hydrated = SERVICES.map((base) => {
    let dynamicItem: any = null;
    if (base.id === 'remedies' && remediesCat) {
      return {
        ...base,
        name: remediesCat.title || base.name,
        desc: remediesCat.desc || base.desc,
        badge: remediesCat.badge || base.badge,
        color: remediesCat.color || base.color,
        icon: remediesCat.icon || base.icon,
        active: remediesCat.active !== false,
      };
    }

    if (base.id === 'my-kundli') dynamicItem = itemMap.get('tool-janam-kundli') || itemMap.get('serv-my-kundli');
    else if (base.id === 'match-kundli') dynamicItem = itemMap.get('tool-kundli-match') || itemMap.get('serv-match-kundli');
    else if (base.id === 'daily-horoscope') dynamicItem = itemMap.get('tool-horoscope') || itemMap.get('serv-daily-horoscope');
    else if (base.id === 'panchang') dynamicItem = itemMap.get('tool-panchang') || itemMap.get('pan-today') || itemMap.get('serv-panchang');
    else if (base.id === 'ai-astrologer') dynamicItem = itemMap.get('con-ai') || itemMap.get('serv-ai-astrologer');
    else if (base.id === 'talk-astrologer') dynamicItem = itemMap.get('con-live') || itemMap.get('serv-talk-astrologer');
    else if (base.id === 'career-astrology') dynamicItem = itemMap.get('gui-career') || itemMap.get('serv-career-astrology');
    else if (base.id === 'marriage-astrology') dynamicItem = itemMap.get('gui-marriage') || itemMap.get('serv-marriage-astrology');
    else if (base.id === 'business-astrology') dynamicItem = itemMap.get('gui-business') || itemMap.get('serv-business-astrology');
    else if (base.id === 'finance-astrology') dynamicItem = itemMap.get('gui-finance') || itemMap.get('serv-finance-astrology');
    else if (base.id === 'tarot') dynamicItem = itemMap.get('gui-tarot') || itemMap.get('serv-tarot');
    else if (base.id === 'numerology') dynamicItem = itemMap.get('gui-numerology') || itemMap.get('serv-numerology');
    else if (base.id === 'muhurat') dynamicItem = itemMap.get('pan-muhurat') || itemMap.get('serv-muhurat');
    else if (base.id === 'kundli-reports') dynamicItem = itemMap.get('serv-kundli-reports');
    else if (base.id === 'astrology-reports') dynamicItem = itemMap.get('gui-reports') || itemMap.get('serv-astrology-reports');

    if (!dynamicItem) dynamicItem = itemMap.get(base.id);

    if (dynamicItem) {
      return {
        ...base,
        name: dynamicItem.name || base.name,
        desc: dynamicItem.desc || base.desc,
        badge: dynamicItem.badge !== undefined ? dynamicItem.badge : base.badge,
        color: dynamicItem.color || base.color,
        icon: dynamicItem.icon || base.icon,
        active: dynamicItem.active !== false,
      };
    }

    return { ...base, active: true };
  });

  return hydrated.filter((s: any) => s.active !== false && s.id !== 'spiritual-guidance');
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
  const [servicesList, setServicesList] = useState<ServiceItem[]>(SERVICES);

  useEffect(() => {
    let isMounted = true;

    // 1. Instant load from cache
    AsyncStorage.getItem(STORAGE_SERVICES_CACHE)
      .then((cached) => {
        if (cached && isMounted) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setServicesList(parsed.filter((it: any) => it.id !== 'spiritual-guidance'));
            }
          } catch {}
        }
      })
      .catch(() => {});

    // 2. Fetch live configuration from backend API
    async function fetchDynamicServices() {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(API_ENDPOINTS.services, { signal: controller.signal });
        clearTimeout(timer);

        if (res.ok) {
          const data = await res.json();
          if (data.success && isMounted) {
            const parsed = parseDynamicServices(data);
            if (parsed && parsed.length > 0) {
              const clean = parsed.filter((it: any) => it.id !== 'spiritual-guidance');
              setServicesList(clean);
              AsyncStorage.setItem(STORAGE_SERVICES_CACHE, JSON.stringify(clean)).catch(() => {});
            }
          }
        }
      } catch (err) {
        // Fallback to cache / default
      }
    }

    fetchDynamicServices();

    return () => {
      isMounted = false;
    };
  }, []);

  // Exactly 2 equal columns with 12px gap
  const cellW = Math.floor((effectiveGridWidth - 12) / 2);

  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return servicesList;
    const q = searchQuery.toLowerCase().trim();
    return servicesList.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.desc.toLowerCase().includes(q) ||
        (s.badge && s.badge.toLowerCase().includes(q))
    );
  }, [searchQuery, servicesList]);

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
            marginBottom: 16,
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
            Everything you need for your personal astrology journey.
          </Text>
          <View style={{ marginTop: 12, flexDirection: 'row' }}>
            <StatChip value="16+" label="Services" colors={colors} />
            <StatChip value="50K+" label="Consultations" colors={colors} />
            <StatChip value="4.9★" label="Rating" colors={colors} />
          </View>
        </LinearGradient>

        {/* 2-Column Services Grid */}
        <View style={{ paddingHorizontal: 20, paddingTop: 4 }}>
          {filteredServices.length === 0 ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <AppIcon name="search_off" color={colors.textMuted} size={42} />
              <Text style={{ marginTop: 12, color: colors.textSecondary, fontSize: 14, fontWeight: '600' }}>
                No services found matching "{searchQuery}"
              </Text>
            </View>
          ) : (
            <View
              style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}
              onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                if (w > 0 && Math.abs(w - gridWidth) > 2) {
                  setGridWidth(w);
                }
              }}
            >
              {filteredServices.map((s) => {
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
                          backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 16 : 24),
                          borderWidth: 1,
                          borderColor: withAlpha(colors.goldAccent, colors.isLight ? 35 : 55),
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <AppIcon name={s.icon} color={colors.goldAccent} size={19} />
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
                          fontSize: 13.5,
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
                          fontSize: 11,
                          letterSpacing: 0.1,
                        }}
                      >
                        {s.desc}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
