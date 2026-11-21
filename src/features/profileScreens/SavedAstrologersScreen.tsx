/**
 * Saved Astrologers Screen — 100% Dynamic with live Firestore synchronization,
 * persistent AsyncStorage bookmark cache, real-time online status, and instant Chat/Call actions.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar, IconButton } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { AppImage } from '@/components/AppImage';
import { ElevatedButton, OutlinedButton } from '@/components/common';
import { showSnackBar } from '@/components/overlays';
import { Text } from '@/components/Text';
import { AppRoutes, go, pop, push } from '@/navigation/routes';
import { useCurrencyStore } from '@/services/currencyStore';
import { fetchRealAstrologers, LiveAstrologer } from '@/services/homeDataService';
import { withAlpha } from '@/theme/colors';
import { useThemeColors } from '@/theme/themeStore';
import { fillCmsTemplate, useAppScreensCmsStore } from '@/services/appScreensCmsStore';

const STORAGE_SAVED_KEY = 'astroparihar_saved_astrologer_ids';

function SummaryChip({ value, label, color, colors }: { value: string; label: string; color: string; colors: any }) {
  return (
    <View
      style={{
        marginRight: 10,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: withAlpha(color, colors.isLight ? 20 : 25),
        borderWidth: 1,
        borderColor: withAlpha(color, 60),
      }}
    >
      <Text style={{ color, fontSize: 14, fontWeight: '800' }}>{value}</Text>
      <Text style={{ marginLeft: 6, color: colors.textPrimary, fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

export default function SavedAstrologersScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const cms = useAppScreensCmsStore((s) => s.config.savedAstrologers);
  const { formatPrice } = useCurrencyStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [allAstrologers, setAllAstrologers] = useState<LiveAstrologer[]>([]);

  const loadData = async (forceFresh = false) => {
    try {
      // 1. Load bookmarked IDs from AsyncStorage
      const rawIds = await AsyncStorage.getItem(STORAGE_SAVED_KEY);
      let ids: string[] = [];
      if (rawIds) {
        try {
          const parsed = JSON.parse(rawIds);
          if (Array.isArray(parsed)) ids = parsed;
        } catch {}
      }
      setSavedIds(ids);

      // 2. Fetch live astrologers
      const live = await fetchRealAstrologers(forceFresh);
      setAllAstrologers(live || []);
    } catch {
      // Offline fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const savedAstrologers = allAstrologers.filter((a) => savedIds.includes(a.id));
  const recommendedAstrologers = allAstrologers.filter((a) => !savedIds.includes(a.id)).slice(0, 4);

  const handleToggleSave = async (astrologer: LiveAstrologer) => {
    const isSaved = savedIds.includes(astrologer.id);
    let nextIds: string[];
    if (isSaved) {
      nextIds = savedIds.filter((id) => id !== astrologer.id);
      showSnackBar(fillCmsTemplate(cms.removedToastTemplate, { name: astrologer.name }), colors.surfaceVariant);
    } else {
      nextIds = [...savedIds, astrologer.id];
      showSnackBar(fillCmsTemplate(cms.savedToastTemplate, { name: astrologer.name }), colors.surfaceVariant);
    }
    setSavedIds(nextIds);
    await AsyncStorage.setItem(STORAGE_SAVED_KEY, JSON.stringify(nextIds));
  };

  const handleStartChat = (a: LiveAstrologer) => {
    push(AppRoutes.consultationScreen, {
      id: a.id,
      name: a.name,
      type: 'chat',
      price: `₹${a.price}/min`,
      rate: a.price || 15,
      avatar: a.imageUrl,
    });
  };

  const handleStartCall = (a: LiveAstrologer) => {
    push(AppRoutes.consultationScreen, {
      id: a.id,
      name: a.name,
      type: 'call',
      price: `₹${a.price}/min`,
      rate: a.price || 15,
      avatar: a.imageUrl,
    });
  };

  const findMore = () => go(AppRoutes.liveAstrologersScreen);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="savedAstrologers.screen">
      <AppBar
        title={cms.headerTitle}
        onBack={pop}
        testIDPrefix="savedAstrologers"
        backgroundColor={colors.background}
        backColor={colors.textPrimary}
        actions={[
          <Pressable key="find" testID="savedAstrologers.findMore" onPress={findMore} style={{ paddingHorizontal: 12, height: 40, justifyContent: 'center' }}>
            <Text style={{ color: colors.goldAccent, fontSize: 13, fontWeight: '700' }}>{cms.findMoreLabel}</Text>
          </Pressable>,
        ]}
      />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.goldAccent} size="large" />
          <Text style={{ marginTop: 12, color: colors.textMuted, fontSize: 13 }}>{cms.loadingText}</Text>
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.goldAccent} />}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: Math.max(150, insets.bottom + 90) }}
        >
          <View style={{ flexDirection: 'row' }}>
            <SummaryChip value={String(savedAstrologers.length)} label={cms.chipSaved} color={colors.goldAccent} colors={colors} />
            <SummaryChip value={String(savedAstrologers.filter((a) => a.isOnline).length)} label={cms.chipOnline} color="#2D9E6B" colors={colors} />
          </View>

          <View style={{ height: 18 }} />

          {savedAstrologers.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 24 }} testID="savedAstrologers.empty">
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 20 : 25),
                  borderWidth: 1.5,
                  borderColor: colors.goldAccent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppIcon name="bookmark_border_rounded" color={colors.goldAccent} size={40} />
              </View>
              <Text style={{ marginTop: 16, color: colors.textPrimary, fontSize: 18, fontWeight: '800' }}>
                {cms.emptyTitle}
              </Text>
              <Text style={{ marginTop: 6, color: colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 18 }}>
                {cms.emptySubtitle}
              </Text>
              <ElevatedButton
                testID="savedAstrologers.findAstrologers"
                label={cms.emptyButton}
                onPress={findMore}
                radius={100}
                paddingV={12}
                fontSize={13}
                style={{ marginTop: 18, minWidth: 200 }}
              />

              {recommendedAstrologers.length > 0 ? (
                <View style={{ width: '100%', marginTop: 32 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <AppIcon name="stars_rounded" color={colors.goldAccent} size={18} />
                    <Text style={{ marginLeft: 6, color: colors.textPrimary, fontSize: 15, fontWeight: '700' }}>
                      {cms.recommendedHeading}
                    </Text>
                  </View>
                  {recommendedAstrologers.map((a, i) => (
                    <AstrologerCard
                      key={a.id}
                      astrologer={a}
                      isSaved={false}
                      colors={colors}
                      formatPrice={formatPrice}
                      chatLabel={cms.chatButton}
                      callLabel={cms.callButton}
                      onToggleSave={() => handleToggleSave(a)}
                      onChat={() => handleStartChat(a)}
                      onCall={() => handleStartCall(a)}
                      index={i}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          ) : (
            savedAstrologers.map((a, i) => (
              <AstrologerCard
                key={a.id}
                astrologer={a}
                isSaved={true}
                colors={colors}
                formatPrice={formatPrice}
                chatLabel={cms.chatButton}
                callLabel={cms.callButton}
                onToggleSave={() => handleToggleSave(a)}
                onChat={() => handleStartChat(a)}
                onCall={() => handleStartCall(a)}
                index={i}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

function AstrologerCard({
  astrologer,
  isSaved,
  colors,
  formatPrice,
  chatLabel,
  callLabel,
  onToggleSave,
  onChat,
  onCall,
  index,
}: {
  astrologer: LiveAstrologer;
  isSaved: boolean;
  colors: any;
  formatPrice: (inr: number, usd?: number) => string;
  chatLabel: string;
  callLabel: string;
  onToggleSave: () => void;
  onChat: () => void;
  onCall: () => void;
  index: number;
}) {
  const priceDisplay = formatPrice(astrologer.price || 15);

  return (
    <View
      testID={`savedAstrologers.card.${index}`}
      style={{
        marginBottom: 14,
        padding: 16,
        borderRadius: 20,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        shadowColor: '#000',
        shadowOpacity: colors.isLight ? 0.04 : 0.2,
        shadowRadius: 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View>
          <View
            style={{
              width: 58,
              height: 58,
              borderRadius: 29,
              backgroundColor: withAlpha(colors.goldAccent, 20),
              borderWidth: 2,
              borderColor: colors.goldAccent,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {astrologer.imageUrl ? (
              <AppImage uri={astrologer.imageUrl} style={{ width: 58, height: 58 }} />
            ) : (
              <Text style={{ fontSize: 26 }}>🧘</Text>
            )}
          </View>
          <View
            style={{
              position: 'absolute',
              bottom: 2,
              right: 2,
              width: 14,
              height: 14,
              borderRadius: 7,
              borderWidth: 2,
              borderColor: colors.surface,
              backgroundColor: astrologer.isOnline ? '#2D9E6B' : colors.textMuted,
            }}
          />
        </View>

        <View style={{ flex: 1, marginLeft: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text numberOfLines={1} style={{ flex: 1, color: colors.textPrimary, fontSize: 15, fontWeight: '700' }}>
              {astrologer.name}
            </Text>
            <AppIcon name="verified_rounded" color={colors.goldAccent} size={16} />
          </View>
          <Text style={{ marginTop: 2, color: colors.textMuted, fontSize: 11 }}>{astrologer.specialty}</Text>
          <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center' }}>
            <AppIcon name="star_rounded" color={colors.goldAccent} size={14} />
            <Text style={{ marginLeft: 3, color: colors.goldAccent, fontSize: 12, fontWeight: '700' }}>
              {String(astrologer.rating || 4.8)}
            </Text>
            <Text style={{ marginLeft: 4, color: colors.textMuted, fontSize: 11 }}>
              {`(${astrologer.reviews || '500+'})`}
            </Text>
            <Text style={{ marginLeft: 8, color: colors.textMuted, fontSize: 11 }}>
              {`• ${astrologer.experience || '10+ yrs'}`}
            </Text>
          </View>
        </View>

        <IconButton
          testID={`savedAstrologers.card.${index}.bookmark`}
          icon={isSaved ? 'bookmark_rounded' : 'bookmark_border_rounded'}
          color={isSaved ? colors.goldAccent : colors.textMuted}
          size={22}
          onPress={onToggleSave}
        />
      </View>

      <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center' }}>
        <AppIcon name="language_outlined" color={colors.textMuted} size={14} />
        <Text style={{ marginLeft: 4, flex: 1, color: colors.textMuted, fontSize: 11 }}>
          {astrologer.languages || 'Hindi, English'}
        </Text>
        <Text style={{ color: colors.goldAccent, fontSize: 15, fontWeight: '800' }}>
          {`${priceDisplay}/min`}
        </Text>
      </View>

      <View style={{ marginTop: 14, flexDirection: 'row' }}>
        <OutlinedButton
          testID={`savedAstrologers.card.${index}.chat`}
          label={chatLabel}
          icon="chat_bubble_outline_rounded"
          onPress={onChat}
          color={colors.textSecondary}
          radius={12}
          paddingV={9}
          fontSize={13}
          fontWeight="600"
          style={{ flex: 1 }}
        />
        <View style={{ width: 10 }} />
        <ElevatedButton
          testID={`savedAstrologers.card.${index}.call`}
          label={callLabel}
          icon="call_outlined"
          onPress={onCall}
          bg="#713B32"
          fg="#FFFFFF"
          radius={100}
          paddingV={9}
          fontSize={13}
          fontWeight="700"
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}
