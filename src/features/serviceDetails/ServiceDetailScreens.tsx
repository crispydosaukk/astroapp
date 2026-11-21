/**
 * Service Detail Screens (All 9 Inner Content Screens) — 100% Dynamic!
 * - Reads every heading, subtitle, hero image, intro paragraph, info card,
 *   tarot deck, numerology meaning, muhurat dates, spiritual practices, Gita quotes,
 *   Mahadasha PDF guides, and CTA labels live from Admin Panel (/api/app-dynamic/service-details).
 * - MuhuratScreen ALSO syncs today's real-time Panchang (Tithi, Nakshatra, Yoga, Karana,
 *   Vara, Rahu Kaal, Yamaganda, Abhijit Muhurat) live via fetchLivePanchang()!
 * - TarotScreen automatically draws a fresh Daily Card each day (or displays Admin-pinned card).
 * - Pull-to-refresh enabled on every single screen.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_ENDPOINTS, resolveMediaUrl } from '@/config/api';
import { useAuthStore } from '@/features/auth/authStore';
import { fetchLivePanchang, PanchangLiveResult } from '@/services/astrologyService';
import { useCurrencyStore } from '@/services/currencyStore';
import { fetchRealAstrologers } from '@/services/homeDataService';
import { useServiceDetailsStore } from '@/services/serviceDetailsStore';
import { useAppScreensCmsStore } from '@/services/appScreensCmsStore';
import { AnimatedPressable } from '@/components/AnimatedBox';
import { AppBar } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { AppImage } from '@/components/AppImage';
import { ElevatedButton, OutlinedButton } from '@/components/common';
import { lh, Text, TextInput } from '@/components/Text';
import { AppRoutes, pop, push } from '@/navigation/routes';
import { AppColors, withAlpha } from '@/theme/colors';
import { useTranslation } from '@/theme/languageStore';
import { useThemeColors } from '@/theme/themeStore';

const STORAGE_SERVICES_KEY = 'astroparihar_dynamic_services_list';

export function useDynamicService(serviceId: string) {
  const [data, setData] = useState<{
    id: string;
    name: string;
    desc?: string;
    sanskrit?: string;
    icon?: string;
    color?: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const cleanId = (serviceId || '').toLowerCase().trim();

    AsyncStorage.getItem(STORAGE_SERVICES_KEY).then((cached) => {
      if (cached && isMounted) {
        try {
          const list = JSON.parse(cached);
          if (Array.isArray(list)) {
            const found = list.find(
              (s: any) =>
                s.id?.toLowerCase() === cleanId ||
                (s.route && s.route.toLowerCase().includes(cleanId.replace('gui-', ''))) ||
                (s.name && s.name.toLowerCase().includes(cleanId.replace('gui-', '')))
            );
            if (found) setData(found);
          }
        } catch {}
      }
    });

    fetch(API_ENDPOINTS.services)
      .then((res) => res.json())
      .then((json) => {
        if (json?.success) {
          const allItems: any[] =
            Array.isArray(json.services) && json.services.length > 0
              ? json.services
              : Array.isArray(json.categories)
              ? json.categories.flatMap((c: any) => c.items || [])
              : [];

          if (allItems.length > 0) {
            AsyncStorage.setItem(STORAGE_SERVICES_KEY, JSON.stringify(allItems)).catch(() => {});
            if (isMounted) {
              const found = allItems.find(
                (s: any) =>
                  s.id?.toLowerCase() === cleanId ||
                  (s.route && s.route.toLowerCase().includes(cleanId.replace('gui-', ''))) ||
                  (s.name && s.name.toLowerCase().includes(cleanId.replace('gui-', '')))
              );
              if (found) setData(found);
            }
          }
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [serviceId]);

  return data;
}

function useLiveServicePages() {
  const content = useServiceDetailsStore((s) => s.content);
  const fetchContent = useServiceDetailsStore((s) => s.fetchContent);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchContent(true);
    setRefreshing(false);
  };

  return { content, refreshing, onRefresh };
}

/* ------------------------------------------------------------- shared */
function ServiceHeroCard({
  title,
  subtitle,
  imageUrl,
  semanticLabel,
  accent,
  icon,
}: {
  title: string;
  subtitle: string;
  imageUrl: string;
  semanticLabel: string;
  accent: string;
  icon: string;
}) {
  const { t } = useTranslation();
  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 20,
        height: 200,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: withAlpha(accent, 80),
        overflow: 'hidden',
      }}
    >
      <AppImage uri={resolveMediaUrl(imageUrl)} semanticLabel={semanticLabel} width="100%" height="100%" fit="cover" />
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.784)']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View style={{ position: 'absolute', left: 20, right: 20, bottom: 20, flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            padding: 8,
            borderRadius: 10,
            backgroundColor: withAlpha(accent, 40),
            borderWidth: 1,
            borderColor: withAlpha(accent, 80),
          }}
        >
          <AppIcon name={icon} color={accent} size={20} />
        </View>
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '800' }}>{t(title, title)}</Text>
          <Text style={{ color: accent, fontSize: 12, fontWeight: '500' }}>{t(subtitle, subtitle)}</Text>
        </View>
      </View>
    </View>
  );
}

function Intro({ children }: { children: string }) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  return <Text style={{ paddingHorizontal: 16, color: colors.textSecondary, ...lh(13, 1.7) }}>{t(children, children)}</Text>;
}

function SectionTitle({ title, accent }: { title: string; accent: string }) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 3, height: 18, borderRadius: 2, backgroundColor: accent }} />
      <Text style={{ marginLeft: 10, color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>{t(title, title)}</Text>
    </View>
  );
}

function InfoCard({ icon, title, description, accent }: { icon: string; title: string; description: string; accent: string }) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 10,
        padding: 16,
        borderRadius: 16,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        flexDirection: 'row',
        alignItems: 'flex-start',
      }}
    >
      <View style={{ padding: 10, borderRadius: 12, backgroundColor: withAlpha(accent, colors.isLight ? 25 : 20) }}>
        <AppIcon name={icon} color={accent} size={20} />
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>{t(title, title)}</Text>
        <Text style={{ marginTop: 4, color: colors.textSecondary, ...lh(12, 1.5) }}>{t(description, description)}</Text>
      </View>
    </View>
  );
}

function ConsultCTABar({ testIDPrefix }: { testIDPrefix: string }) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { t } = useTranslation();
  const shared = useServiceDetailsStore((s) => s.content.shared);
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: Math.max(24, insets.bottom + 8),
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.cardBorder,
        flexDirection: 'row',
      }}
    >
      <OutlinedButton
        testID={`${testIDPrefix}.chatNow`}
        label={t(shared.chatNowLabel || 'Chat Now', shared.chatNowLabel || 'Chat Now')}
        icon="chat_bubble_outline_rounded"
        color={colors.goldAccent}
        borderColor={colors.goldAccent}
        onPress={() => push(AppRoutes.liveAstrologersScreen)}
        style={{ flex: 1 }}
      />
      <View style={{ width: 12 }} />
      <ElevatedButton
        testID={`${testIDPrefix}.consultNow`}
        label={t(shared.consultNowLabel || 'Consult Now', shared.consultNowLabel || 'Consult Now')}
        icon="call_rounded"
        bg="#713B32"
        fg="#FFFFFF"
        onPress={() => push(AppRoutes.liveAstrologersScreen)}
        radius={100}
        paddingV={14}
        paddingH={8}
        fontSize={14}
        style={{ flex: 1 }}
      />
    </View>
  );
}

type Mini = { name: string; specialty: string; imageUrl: string; rating: number; price: number; fullObj?: any };
function AstrologerRow({ accent }: { accent: string }) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const formatRate = useCurrencyStore((s) => s.formatRate);
  const [liveList, setLiveList] = useState<Mini[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetchRealAstrologers()
      .then((real) => {
        if (isMounted && Array.isArray(real) && real.length > 0) {
          setLiveList(
            real.map((r) => ({
              name: r.name,
              specialty: r.specialty,
              imageUrl: r.imageUrl,
              rating: r.rating || 4.9,
              price: r.price,
              fullObj: r,
            }))
          );
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  if (liveList.length === 0) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height: 180 }} contentContainerStyle={{ paddingHorizontal: 16 }}>
      {liveList.map((a) => (
        <Pressable
          key={a.name}
          onPress={() => {
            if (a.fullObj) push(AppRoutes.astrologerDetailScreen, a.fullObj);
            else push(AppRoutes.liveAstrologersScreen);
          }}
          style={{
            width: 160,
            marginRight: 12,
            padding: 14,
            borderRadius: 16,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            alignItems: 'center',
            alignSelf: 'flex-start',
          }}
        >
          <View style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: withAlpha(accent, 100), overflow: 'hidden' }}>
            <AppImage uri={a.imageUrl} semanticLabel={`Astrologer ${a.name} profile photo`} width="100%" height="100%" fit="cover" />
          </View>
          <Text numberOfLines={1} style={{ marginTop: 8, color: colors.textPrimary, fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
            {t(a.name, a.name)}
          </Text>
          <Text numberOfLines={1} style={{ marginTop: 2, color: colors.textMuted, fontSize: 10, textAlign: 'center' }}>
            {t(a.specialty, a.specialty)}
          </Text>
          <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center' }}>
            <AppIcon name="star_rounded" color={colors.goldAccent} size={12} />
            <Text style={{ marginLeft: 2, color: colors.goldAccent, fontSize: 11, fontWeight: '600' }}>{String(a.rating)}</Text>
          </View>
          <Text style={{ marginTop: 6, color: accent, fontSize: 11, fontWeight: '700' }}>{formatRate(a.price)}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function ServiceLayout({
  title,
  testID,
  refreshing,
  onRefresh,
  children,
}: {
  title: string;
  testID: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID={`${testID}.screen`}>
      <AppBar title={t(title, title)} onBack={pop} testIDPrefix={testID} backSize={24} backgroundColor={colors.background} backColor={colors.textPrimary} />
      <ScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={colors.goldAccent} />
          ) : undefined
        }
      >
        {children}
        <View style={{ height: Math.max(140, insets.bottom + 85) }} />
      </ScrollView>
      <ConsultCTABar testIDPrefix={testID} />
    </View>
  );
}

function HScroll({ height, children }: { height: number; children: React.ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height }} contentContainerStyle={{ paddingHorizontal: 16 }}>
      {children}
    </ScrollView>
  );
}

/* ------------------------------------------------------------- 1. Career */
export function CareerAstrologyScreen() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const dynamicSvc = useDynamicService('gui-career');
  const { content, refreshing, onRefresh } = useLiveServicePages();
  const page = content.career;
  const a = page.hero.accent || dynamicSvc?.color || '#FFD700';
  const title = page.hero.title || dynamicSvc?.name || 'Career Astrology';
  const subtitle = page.hero.subtitle || dynamicSvc?.desc || 'Unlock your professional destiny';

  return (
    <ServiceLayout title={title} testID="careerAstrology" refreshing={refreshing} onRefresh={onRefresh}>
      <ServiceHeroCard
        title={title}
        subtitle={subtitle}
        imageUrl={page.hero.imageUrl}
        semanticLabel={page.hero.semanticLabel}
        accent={a}
        icon={page.hero.icon || dynamicSvc?.icon || 'work_outline_rounded'}
      />
      <Intro>{page.intro}</Intro>
      <SectionTitle title={page.analysisTitle} accent={a} />
      {(page.analysisCards || []).map((card, i) => (
        <InfoCard key={`${card.title}-${i}`} icon={card.icon} title={card.title} description={card.description} accent={a} />
      ))}
      <SectionTitle title={page.insightsTitle} accent={a} />
      <HScroll height={90}>
        {(page.insights || []).map((ins) => (
          <View
            key={ins.planet}
            style={{
              width: 110,
              height: 90,
              marginRight: 10,
              padding: 12,
              borderRadius: 14,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppIcon name={ins.icon} color={a} size={20} />
            <Text style={{ marginTop: 4, color: colors.textPrimary, fontSize: 12, fontWeight: '600' }}>{t(ins.planet, ins.planet)}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 10, textAlign: 'center' }}>{t(ins.role, ins.role)}</Text>
          </View>
        ))}
      </HScroll>
      <SectionTitle title={content.shared.expertAstrologersTitle} accent={a} />
      <AstrologerRow accent={a} />
    </ServiceLayout>
  );
}

/* ------------------------------------------------------------- 2. Marriage */
export function MarriageAstrologyScreen() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const dynamicSvc = useDynamicService('gui-marriage');
  const { content, refreshing, onRefresh } = useLiveServicePages();
  const page = content.marriage;
  const a = page.hero.accent || dynamicSvc?.color || '#FF6B6B';
  const title = page.hero.title || dynamicSvc?.name || 'Marriage Astrology';
  const subtitle = page.hero.subtitle || dynamicSvc?.desc || 'Find your destined life partner';
  const [w, setW] = useState(0);
  const cell = w > 0 ? (w - 24) / 4 : 0;

  return (
    <ServiceLayout title={title} testID="marriageAstrology" refreshing={refreshing} onRefresh={onRefresh}>
      <ServiceHeroCard
        title={title}
        subtitle={subtitle}
        imageUrl={page.hero.imageUrl}
        semanticLabel={page.hero.semanticLabel}
        accent={a}
        icon={page.hero.icon || dynamicSvc?.icon || 'favorite_rounded'}
      />
      <Intro>{page.intro}</Intro>
      <SectionTitle title={page.analysisTitle} accent={a} />
      {(page.analysisCards || []).map((card, i) => (
        <InfoCard key={`${card.title}-${i}`} icon={card.icon} title={card.title} description={card.description} accent={a} />
      ))}
      <SectionTitle title={page.compatibilityTitle} accent={a} />
      <View style={{ paddingHorizontal: 16 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
          {cell > 0 &&
            (page.aspects || []).map((asp, i) => (
              <View
                key={`${asp.name}-${i}`}
                style={{
                  width: cell,
                  height: cell,
                  borderRadius: 12,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: withAlpha(asp.color, colors.isLight ? 50 : 60),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: asp.color, fontSize: 18, fontWeight: '800' }}>{String(asp.maxScore)}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 9, textAlign: 'center' }}>{t(asp.name, asp.name)}</Text>
              </View>
            ))}
        </View>
      </View>
      <SectionTitle title={content.shared.expertAstrologersTitle} accent={a} />
      <AstrologerRow accent={a} />
    </ServiceLayout>
  );
}

/* ------------------------------------------------------------- 3. Business */
export function BusinessAstrologyScreen() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const dynamicSvc = useDynamicService('gui-business');
  const { content, refreshing, onRefresh } = useLiveServicePages();
  const page = content.business;
  const a = page.hero.accent || dynamicSvc?.color || '#4FC3F7';
  const title = page.hero.title || dynamicSvc?.name || 'Business Astrology';
  const subtitle = page.hero.subtitle || dynamicSvc?.desc || 'Align your enterprise with the cosmos';

  return (
    <ServiceLayout title={title} testID="businessAstrology" refreshing={refreshing} onRefresh={onRefresh}>
      <ServiceHeroCard
        title={title}
        subtitle={subtitle}
        imageUrl={page.hero.imageUrl}
        semanticLabel={page.hero.semanticLabel}
        accent={a}
        icon={page.hero.icon || dynamicSvc?.icon || 'business_center_rounded'}
      />
      <Intro>{page.intro}</Intro>
      <SectionTitle title={page.insightsTitle} accent={a} />
      {(page.analysisCards || []).map((card, i) => (
        <InfoCard key={`${card.title}-${i}`} icon={card.icon} title={card.title} description={card.description} accent={a} />
      ))}
      <SectionTitle title={page.sectorsTitle} accent={a} />
      <HScroll height={80}>
        {(page.sectors || []).map((sec) => (
          <View
            key={sec.planet}
            style={{
              width: 130,
              height: 80,
              marginRight: 10,
              padding: 12,
              borderRadius: 14,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: withAlpha(sec.color, colors.isLight ? 50 : 60),
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: sec.color, fontSize: 12, fontWeight: '700' }}>{t(sec.planet, sec.planet)}</Text>
            <Text style={{ marginTop: 2, color: colors.textSecondary, fontSize: 11 }}>{t(sec.sector, sec.sector)}</Text>
          </View>
        ))}
      </HScroll>
      <SectionTitle title={content.shared.expertAstrologersTitle} accent={a} />
      <AstrologerRow accent={a} />
    </ServiceLayout>
  );
}

/* ------------------------------------------------------------- 4. Finance */
export function FinanceAstrologyScreen() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const dynamicSvc = useDynamicService('gui-finance');
  const { content, refreshing, onRefresh } = useLiveServicePages();
  const page = content.finance;
  const a = page.hero.accent || dynamicSvc?.color || '#81C784';
  const title = page.hero.title || dynamicSvc?.name || 'Finance Astrology';
  const subtitle = page.hero.subtitle || dynamicSvc?.desc || 'Wealth, investments & financial destiny';

  return (
    <ServiceLayout title={title} testID="financeAstrology" refreshing={refreshing} onRefresh={onRefresh}>
      <ServiceHeroCard
        title={title}
        subtitle={subtitle}
        imageUrl={page.hero.imageUrl}
        semanticLabel={page.hero.semanticLabel}
        accent={a}
        icon={page.hero.icon || dynamicSvc?.icon || 'account_balance_rounded'}
      />
      <Intro>{page.intro}</Intro>
      <SectionTitle title={page.analysisTitle} accent={a} />
      {(page.analysisCards || []).map((card, i) => (
        <InfoCard key={`${card.title}-${i}`} icon={card.icon} title={card.title} description={card.description} accent={a} />
      ))}
      <SectionTitle title={page.wealthHousesTitle} accent={a} />
      <View style={{ paddingHorizontal: 16 }}>
        {(page.wealthHouses || []).map((wh) => (
          <View
            key={wh.house}
            style={{
              marginBottom: 8,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 14,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: withAlpha(a, colors.isLight ? 25 : 20),
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: a, fontSize: 11, fontWeight: '700' }}>{t(wh.house.split(' ')[0], wh.house.split(' ')[0])}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>{t(wh.house, wh.house)}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{t(wh.governs, wh.governs)}</Text>
            </View>
            <Text style={{ color: a, fontSize: 12, fontWeight: '600' }}>{t(wh.planet, wh.planet)}</Text>
          </View>
        ))}
      </View>
      <SectionTitle title={content.shared.expertAstrologersTitle} accent={a} />
      <AstrologerRow accent={a} />
    </ServiceLayout>
  );
}

/* ------------------------------------------------------------- 5. Tarot */
export function TarotScreen() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const dynamicSvc = useDynamicService('gui-tarot');
  const { content, refreshing, onRefresh } = useLiveServicePages();
  const page = content.tarot;
  const a = page.hero.accent || dynamicSvc?.color || '#9370DB';
  const title = page.hero.title || dynamicSvc?.name || 'Tarot Reading';
  const subtitle = page.hero.subtitle || dynamicSvc?.desc || 'Ancient wisdom through sacred cards';
  const [selected, setSelected] = useState<number | null>(null);

  // Auto-rotate daily card deterministically by current date unless admin pinned a specific daily card
  const dailyCard = useMemo(() => {
    if (page.pinnedDailyCardName && page.pinnedDailyCardName.trim()) {
      return {
        name: page.pinnedDailyCardName.trim(),
        meaning: page.pinnedDailyCardDesc?.trim() || 'Trust the cosmic guidance illuminating your path today.',
      };
    }
    const deck = page.cards && page.cards.length > 0 ? page.cards : [{ name: 'The Star', meaning: 'Hope, faith, purpose, and renewal.', reversed: '' }];
    const now = new Date();
    const daySeed = now.getFullYear() * 366 + now.getMonth() * 31 + now.getDate();
    return deck[daySeed % deck.length];
  }, [page.cards, page.pinnedDailyCardName, page.pinnedDailyCardDesc]);

  return (
    <ServiceLayout title={title} testID="tarot" refreshing={refreshing} onRefresh={onRefresh}>
      <ServiceHeroCard
        title={title}
        subtitle={subtitle}
        imageUrl={page.hero.imageUrl}
        semanticLabel={page.hero.semanticLabel}
        accent={a}
        icon={page.hero.icon || dynamicSvc?.icon || 'style_rounded'}
      />
      <Intro>{page.intro}</Intro>
      <SectionTitle title={page.dailyDrawTitle} accent={a} />
      <LinearGradient
        colors={[withAlpha(a, colors.isLight ? 20 : 30), colors.surface]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{
          marginHorizontal: 16,
          padding: 20,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: withAlpha(a, colors.isLight ? 50 : 80),
          alignItems: 'center',
        }}
      >
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{t(page.cardOfTheDayLabel, page.cardOfTheDayLabel)}</Text>
        <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center' }}>
          <LinearGradient
            colors={[withAlpha(a, 80), '#1A0A2E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 80,
              height: 130,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: a,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 6,
            }}
          >
            <AppIcon name="auto_awesome" color={a} size={28} />
            <Text style={{ marginTop: 8, color: '#FFFFFF', fontSize: 11, fontWeight: '700', textAlign: 'center' }}>
              {t(dailyCard.name, dailyCard.name)}
            </Text>
          </LinearGradient>
          <View style={{ flex: 1, marginLeft: 20 }}>
            <Text style={{ color: a, fontSize: 18, fontWeight: '800' }}>{t(dailyCard.name, dailyCard.name)}</Text>
            <Text style={{ marginTop: 6, color: colors.textSecondary, ...lh(12, 1.5) }}>{t(dailyCard.meaning, dailyCard.meaning)}</Text>
          </View>
        </View>
      </LinearGradient>
      <SectionTitle title={page.readingTypesTitle} accent={a} />
      {(page.readingTypes || []).map((rt, i) => (
        <InfoCard key={`${rt.title}-${i}`} icon={rt.icon} title={rt.title} description={rt.description} accent={a} />
      ))}
      <SectionTitle title={page.majorArcanaTitle} accent={a} />
      <View style={{ paddingHorizontal: 16 }}>
        {(page.cards || []).map((c, i) => {
          const sel = selected === i;
          return (
            <AnimatedPressable
              key={`${c.name}-${i}`}
              testID={`tarot.card.${i}`}
              onPress={() => setSelected(sel ? null : i)}
              duration={200}
              style={{
                marginBottom: 8,
                padding: 14,
                borderRadius: 14,
                borderWidth: 1,
                backgroundColor: sel ? withAlpha(a, colors.isLight ? 25 : 20) : colors.surface,
                borderColor: sel ? a : colors.cardBorder,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AppIcon name="auto_awesome" color={a} size={16} />
                <Text style={{ marginLeft: 8, flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>{t(c.name, c.name)}</Text>
                <AppIcon name={sel ? 'keyboard_arrow_up_rounded' : 'keyboard_arrow_down_rounded'} color={colors.textMuted} size={18} />
              </View>
              {sel ? (
                <>
                  <Text style={{ marginTop: 10, color: colors.textSecondary, ...lh(12, 1.5) }}>
                    {`✦ ${t(page.uprightLabel || 'Upright')}: ${t(c.meaning, c.meaning)}`}
                  </Text>
                  <Text style={{ marginTop: 4, color: withAlpha(a, 180), ...lh(12, 1.5) }}>
                    {`✦ ${t(page.reversedLabel || 'Reversed')}: ${t(c.reversed, c.reversed)}`}
                  </Text>
                </>
              ) : null}
            </AnimatedPressable>
          );
        })}
      </View>
    </ServiceLayout>
  );
}

/* ------------------------------------------------------------- 6. Numerology */
export function reduceToSingleDigit(n: number): number {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) n = String(n).split('').reduce((s, d) => s + Number(d), 0);
  return n;
}
const LETTERS: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
  S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8,
};
export function calcLifePath(dob: string): number | null {
  const d = dob.replace(/[^0-9]/g, '');
  if (d.length < 8) return null;
  return reduceToSingleDigit(d.split('').reduce((s, c) => s + Number(c), 0));
}
export function calcDestiny(name: string): number | null {
  const n = name.toUpperCase();
  if (!n) return null;
  return reduceToSingleDigit(n.split('').reduce((s, c) => s + (LETTERS[c] ?? 0), 0));
}

function NumField({ label, icon, value, onChange, accent, testID }: { label: string; icon: string; value: string; onChange: (s: string) => void; accent: string; testID: string }) {
  const colors = useThemeColors();
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={{
        height: 56,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: focused ? accent : withAlpha(accent, colors.isLight ? 50 : 40),
        backgroundColor: colors.surfaceVariant,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <AppIcon name={icon} color={accent} style={{ marginHorizontal: 12 }} />
      <View style={{ flex: 1 }}>
        {value || focused ? <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{label}</Text> : null}
        <TextInput
          testID={testID}
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={value || focused ? '' : label}
          placeholderTextColor={colors.textMuted}
          style={{ fontSize: 14, color: colors.textPrimary }}
        />
      </View>
    </View>
  );
}

export function NumerologyScreen() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const authUser = useAuthStore((s) => s.user);
  const dynamicSvc = useDynamicService('gui-numerology');
  const { content, refreshing, onRefresh } = useLiveServicePages();
  const page = content.numerology;
  const a = page.hero.accent || dynamicSvc?.color || '#FFB347';
  const title = page.hero.title || dynamicSvc?.name || 'Numerology';
  const subtitle = page.hero.subtitle || dynamicSvc?.desc || 'Decode the numbers of your destiny';

  const [name, setName] = useState(authUser?.name || '');
  const [dob, setDob] = useState(authUser?.dob || '');
  const [lifePath, setLifePath] = useState<number | null>(() => (authUser?.dob ? calcLifePath(authUser.dob) : null));
  const [destiny, setDestiny] = useState<number | null>(() => (authUser?.name ? calcDestiny(authUser.name) : null));

  const meaningsMap = useMemo(() => {
    const map: Record<number, { title: string; desc: string }> = {};
    (page.meanings || []).forEach((m) => {
      map[m.number] = { title: m.title, desc: m.desc };
    });
    return map;
  }, [page.meanings]);

  useEffect(() => {
    if (authUser) {
      if (authUser.name && !name) {
        setName(authUser.name);
        const d = calcDestiny(authUser.name);
        if (d != null) setDestiny(d);
      }
      if (authUser.dob && !dob) {
        setDob(authUser.dob);
        const lp = calcLifePath(authUser.dob);
        if (lp != null) setLifePath(lp);
      }
    }
  }, [authUser, dob, name]);

  const calculate = () => {
    const lp = calcLifePath(dob);
    if (lp != null) setLifePath(lp);
    const d = calcDestiny(name);
    if (d != null) setDestiny(d);
  };

  const ResultCard = ({ value, label, color, testID }: { value: number; label: string; color: string; testID: string }) => (
    <LinearGradient
      testID={testID}
      colors={[withAlpha(color, colors.isLight ? 25 : 40), colors.surface]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={{
        flex: 1,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: withAlpha(color, 100),
        alignItems: 'center',
      }}
    >
      <Text style={{ color, fontSize: 40, fontWeight: '900' }}>{String(value)}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{t(label, label)}</Text>
      {meaningsMap[value] ? (
        <>
          <Text style={{ marginTop: 6, color: colors.textPrimary, fontSize: 12, fontWeight: '700', textAlign: 'center' }}>
            {t(meaningsMap[value].title, meaningsMap[value].title)}
          </Text>
          <Text style={{ marginTop: 4, color: colors.textMuted, fontSize: 10.5, textAlign: 'center', lineHeight: 15 }}>
            {t(meaningsMap[value].desc, meaningsMap[value].desc)}
          </Text>
        </>
      ) : null}
    </LinearGradient>
  );

  return (
    <ServiceLayout title={title} testID="numerology" refreshing={refreshing} onRefresh={onRefresh}>
      <ServiceHeroCard
        title={title}
        subtitle={subtitle}
        imageUrl={page.hero.imageUrl}
        semanticLabel={page.hero.semanticLabel}
        accent={a}
        icon={page.hero.icon || dynamicSvc?.icon || 'tag_rounded'}
      />
      <Intro>{page.intro}</Intro>
      <SectionTitle title={page.calculatorTitle} accent={a} />
      <View
        style={{
          marginHorizontal: 16,
          padding: 20,
          borderRadius: 20,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: withAlpha(a, colors.isLight ? 50 : 80),
          gap: 12,
        }}
      >
        <NumField testID="numerology.name" label={t(page.nameFieldLabel, page.nameFieldLabel)} icon="person_outline_rounded" value={name} onChange={setName} accent={a} />
        <NumField testID="numerology.dob" label={t(page.dobFieldLabel, page.dobFieldLabel)} icon="calendar_today_rounded" value={dob} onChange={setDob} accent={a} />
        <ElevatedButton
          testID="numerology.calculate"
          label={t(page.calculateButtonLabel, page.calculateButtonLabel)}
          onPress={calculate}
          bg="#713B32"
          fg="#FFFFFF"
          radius={100}
          paddingV={14}
          fontWeight="700"
          style={{ marginTop: 4 }}
        />
      </View>
      {lifePath != null || destiny != null ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 16, flexDirection: 'row', gap: 12 }}>
          {lifePath != null ? <ResultCard testID="numerology.lifePath" value={lifePath} label={page.lifePathLabel} color={a} /> : null}
          {destiny != null ? <ResultCard testID="numerology.destiny" value={destiny} label={page.destinyLabel} color="#9370DB" /> : null}
        </View>
      ) : null}
      <SectionTitle title={page.coreNumbersTitle} accent={a} />
      {(page.coreCards || []).map((card, i) => (
        <InfoCard key={`${card.title}-${i}`} icon={card.icon} title={card.title} description={card.description} accent={a} />
      ))}
    </ServiceLayout>
  );
}

/* ------------------------------------------------------------- 7. Muhurat (LIVE Panchang + Admin Dates) */
export function MuhuratScreen() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const dynamicSvc = useDynamicService('pan-muhurat');
  const { content, refreshing, onRefresh } = useLiveServicePages();
  const muhuratMicro = useAppScreensCmsStore((s) => s.config.cmsMicroLabels.muhurat);
  const page = content.muhurat;
  const a = page.hero.accent || dynamicSvc?.color || '#FFD700';
  const title = page.hero.title || dynamicSvc?.name || 'Muhurat';
  const subtitle = page.hero.subtitle || dynamicSvc?.desc || 'Auspicious timings for life events';

  const [livePanchang, setLivePanchang] = useState<PanchangLiveResult | null>(null);

  const loadPanchang = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await fetchLivePanchang(todayStr);
      if (res) setLivePanchang(res);
    } catch {}
  };

  useEffect(() => {
    loadPanchang();
  }, []);

  const handleRefresh = async () => {
    await Promise.all([onRefresh(), loadPanchang()]);
  };

  const weekdayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const panchangRows: Array<[string, string]> = [
    [muhuratMicro.tithiLabel, livePanchang?.tithi || muhuratMicro.loadingText],
    [muhuratMicro.nakshatraLabel, livePanchang?.nakshatra || muhuratMicro.loadingText],
    [muhuratMicro.yogaLabel, livePanchang?.yoga || muhuratMicro.loadingText],
    [muhuratMicro.karanaLabel, livePanchang?.karana || muhuratMicro.loadingText],
    [muhuratMicro.varaLabel, weekdayName],
  ];

  return (
    <ServiceLayout title={title} testID="muhurat" refreshing={refreshing} onRefresh={handleRefresh}>
      <ServiceHeroCard
        title={title}
        subtitle={subtitle}
        imageUrl={page.hero.imageUrl}
        semanticLabel={page.hero.semanticLabel}
        accent={a}
        icon={page.hero.icon || dynamicSvc?.icon || 'event_available_rounded'}
      />
      <Intro>{page.intro}</Intro>
      <SectionTitle title={page.upcomingDatesTitle} accent={a} />
      {(page.muhurats || []).map((m) => (
        <View
          key={m.event}
          style={{
            marginHorizontal: 16,
            marginBottom: 10,
            padding: 16,
            borderRadius: 16,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: withAlpha(m.color, colors.isLight ? 50 : 60),
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ padding: 8, borderRadius: 10, backgroundColor: withAlpha(m.color, 20) }}>
              <AppIcon name={m.icon} color={m.color} size={18} />
            </View>
            <Text style={{ marginLeft: 12, color: colors.textPrimary, fontSize: 15, fontWeight: '600' }}>{t(m.event, m.event)}</Text>
          </View>
          <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {(m.dates || []).map((d) => (
              <View
                key={d}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: withAlpha(m.color, colors.isLight ? 25 : 20),
                  borderWidth: 1,
                  borderColor: withAlpha(m.color, 60),
                }}
              >
                <Text style={{ color: m.color, fontSize: 11, fontWeight: '600' }}>{d}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      <SectionTitle title={page.dailyPanchangTitle} accent={a} />
      <View style={{ marginHorizontal: 16, padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder }}>
        {panchangRows.map(([l, v]) => (
          <View key={l} style={{ paddingVertical: 6, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{t(l, l)}</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>{t(v, v)}</Text>
          </View>
        ))}
      </View>

      <SectionTitle title={page.inauspiciousTitle} accent={a} />
      {livePanchang?.abhijitMuhurat ? (
        <InfoCard
          icon="wb_sunny_rounded"
          title={page.abhijitTitle || 'Abhijit Muhurat'}
          description={`${muhuratMicro.todayPrefix} ${livePanchang.abhijitMuhurat}. ${page.abhijitNote}`}
          accent="#2D9E6B"
        />
      ) : null}
      <InfoCard
        icon="warning_amber_rounded"
        title={page.rahuKaalTitle || 'Rahu Kaal'}
        description={`${muhuratMicro.todayPrefix} ${livePanchang?.rahuKaal || muhuratMicro.calculatingText}. ${page.rahuKaalNote}`}
        accent={AppColors.error}
      />
      <InfoCard
        icon="warning_amber_rounded"
        title={page.yamagandaTitle || 'Yamaganda'}
        description={`${muhuratMicro.todayPrefix} ${livePanchang?.yamaganda || muhuratMicro.calculatingText}. ${page.yamagandaNote}`}
        accent={AppColors.warning}
      />
    </ServiceLayout>
  );
}

/* ------------------------------------------------------------- 8. Spiritual */
export function SpiritualGuidanceScreen() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const dynamicSvc = useDynamicService('gui-spiritual');
  const { content, refreshing, onRefresh } = useLiveServicePages();
  const page = content.spiritual;
  const a = page.hero.accent || dynamicSvc?.color || '#9370DB';
  const title = page.hero.title || dynamicSvc?.name || 'Spiritual Guidance';
  const subtitle = page.hero.subtitle || dynamicSvc?.desc || "Illuminate your soul's sacred path";

  return (
    <ServiceLayout title={title} testID="spiritualGuidance" refreshing={refreshing} onRefresh={onRefresh}>
      <ServiceHeroCard
        title={title}
        subtitle={subtitle}
        imageUrl={page.hero.imageUrl}
        semanticLabel={page.hero.semanticLabel}
        accent={a}
        icon={page.hero.icon || dynamicSvc?.icon || 'psychology_rounded'}
      />
      <Intro>{page.intro}</Intro>
      <SectionTitle title={page.servicesTitle} accent={a} />
      {(page.servicesCards || []).map((card, i) => (
        <InfoCard key={`${card.title}-${i}`} icon={card.icon} title={card.title} description={card.description} accent={a} />
      ))}
      <SectionTitle title={page.practiceTitle} accent={a} />
      <HScroll height={100}>
        {(page.practices || []).map((pr) => (
          <View
            key={pr.name}
            style={{
              width: 120,
              height: 100,
              marginRight: 10,
              padding: 14,
              borderRadius: 16,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: withAlpha(pr.color, colors.isLight ? 50 : 60),
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppIcon name={pr.icon} color={pr.color} size={24} />
            <Text style={{ marginTop: 6, color: colors.textPrimary, fontSize: 12, fontWeight: '600' }}>{t(pr.name, pr.name)}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 10 }}>{t(pr.duration, pr.duration)}</Text>
          </View>
        ))}
      </HScroll>
      <SectionTitle title={page.wisdomTitle} accent={a} />
      <View style={{ paddingHorizontal: 16 }}>
        {(page.quotes || []).map((q, idx) => (
          <LinearGradient
            key={`${q.source}-${idx}`}
            colors={[withAlpha(a, colors.isLight ? 20 : 20), colors.surface]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{
              marginBottom: 10,
              padding: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: withAlpha(a, colors.isLight ? 50 : 60),
            }}
          >
            <Text style={{ color: colors.textPrimary, fontStyle: 'italic', ...lh(13, 1.6) }}>{`"${q.text}"`}</Text>
            <Text style={{ marginTop: 8, color: a, fontSize: 12, fontWeight: '600' }}>{`— ${q.source}`}</Text>
          </LinearGradient>
        ))}
      </View>
    </ServiceLayout>
  );
}

/* ------------------------------------------------------------- 9. Reports */
export function AstrologyReportsScreen() {
  const colors = useThemeColors();
  const formatPrice = useCurrencyStore((s) => s.formatPrice);
  const { content, refreshing, onRefresh } = useLiveServicePages();
  const page = content.reports;
  const a = page.hero.accent || '#4FC3F7';

  return (
    <ServiceLayout title={page.hero.title} testID="astrologyReports" refreshing={refreshing} onRefresh={onRefresh}>
      <ServiceHeroCard
        title={page.hero.title}
        subtitle={page.hero.subtitle}
        imageUrl={page.hero.imageUrl}
        semanticLabel={page.hero.semanticLabel}
        accent={a}
        icon={page.hero.icon || 'description_rounded'}
      />
      <Intro>{page.intro}</Intro>
      <SectionTitle title={page.sectionTitle} accent={a} />
      {(page.guides || []).map((r, i) => (
        <View
          key={r.id}
          style={{
            marginHorizontal: 16,
            marginBottom: 12,
            padding: 16,
            borderRadius: 18,
            backgroundColor: colors.surface,
            borderWidth: 1.5,
            borderColor: withAlpha(r.color, 80),
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ padding: 10, borderRadius: 12, backgroundColor: withAlpha(r.color, 20) }}>
              <AppIcon name={r.icon} color={r.color} size={22} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>{r.name}</Text>
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                    backgroundColor: withAlpha(colors.goldAccent, 25),
                    borderWidth: 1,
                    borderColor: withAlpha(colors.goldAccent, 80),
                  }}
                >
                  <Text style={{ color: colors.goldAccent, fontSize: 9.5, fontWeight: '700' }}>{r.badge}</Text>
                </View>
              </View>
              <Text style={{ color: r.color, fontSize: 11, fontWeight: '600', marginTop: 2 }}>{r.pages}</Text>
            </View>
          </View>
          <Text style={{ marginTop: 8, color: colors.textSecondary, ...lh(12, 1.5) }}>{r.desc}</Text>
          <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.goldAccent, fontSize: 18, fontWeight: '800' }}>{formatPrice(r.price)}</Text>
            <Pressable
              testID={`astrologyReports.getReport.${i}`}
              onPress={() => push(AppRoutes.kundliReportsScreen, { initialTab: 1 })}
              style={{
                paddingHorizontal: 18,
                paddingVertical: 9,
                borderRadius: 100,
                backgroundColor: '#713B32',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <AppIcon name="menu_book" color="#FFFFFF" size={14} style={{ marginRight: 6 }} />
              <Text style={{ color: '#FFFFFF', fontSize: 12.5, fontWeight: '700' }}>{page.buttonLabel || 'View Guide →'}</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ServiceLayout>
  );
}
