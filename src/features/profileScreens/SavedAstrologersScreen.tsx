/**
 * Port of lib/presentation/profile_screens/saved_astrologers_screen.dart
 * Functional bookmark removal, instant Chat and Call actions, theme adaptive.
 */
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar, IconButton } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { ElevatedButton, OutlinedButton } from '@/components/common';
import { showSnackBar } from '@/components/overlays';
import { Text } from '@/components/Text';
import { AppRoutes, go, pop, push } from '@/navigation/routes';
import { withAlpha } from '@/theme/colors';
import { useTranslation } from '@/theme/languageStore';
import { useThemeColors } from '@/theme/themeStore';

const INITIAL = [
  { name: 'Swami Shankarananda Giri', speciality: 'Vedic Jyotish • KP Astrology', rating: 4.9, reviews: 2847, experience: '28 years', price: '₹15/min', online: true, emoji: '🧘', color: '#9370DB', languages: 'Hindi, English, Sanskrit' },
  { name: 'Pandit Radhey Shyam Chaturvedi', speciality: 'Marriage • Kundli Matching', rating: 4.8, reviews: 1923, experience: '22 years', price: '₹12/min', online: false, emoji: '🔮', color: '#FFD700', languages: 'Hindi, English' },
  { name: 'Dr. Meenakshi Devi', speciality: 'Nadi Astrology • Remedies', rating: 4.7, reviews: 1456, experience: '18 years', price: '₹18/min', online: true, emoji: '🌸', color: '#FF6B6B', languages: 'Tamil, Hindi, English' },
];

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
  const { t } = useTranslation();
  const [astros, setAstros] = useState(INITIAL);
  const findMore = () => go(AppRoutes.liveAstrologersScreen);

  const handleStartChat = (a: typeof INITIAL[0]) => {
    push(AppRoutes.consultationScreen, {
      name: a.name,
      type: 'chat',
      price: a.price,
      rate: 15,
    });
  };

  const handleStartCall = (a: typeof INITIAL[0]) => {
    push(AppRoutes.consultationScreen, {
      name: a.name,
      type: 'call',
      price: a.price,
      rate: 15,
    });
  };

  const handleUnsave = (a: typeof INITIAL[0]) => {
    setAstros((l) => l.filter((x) => x !== a));
    showSnackBar(`Removed ${a.name} from saved astrologers`, colors.surfaceVariant);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="savedAstrologers.screen">
      <AppBar
        title={t('profile.savedAstrologers', 'Saved Astrologers')}
        onBack={pop}
        testIDPrefix="savedAstrologers"
        backgroundColor={colors.background}
        backColor={colors.textPrimary}
        actions={[
          <Pressable key="find" testID="savedAstrologers.findMore" onPress={findMore} style={{ paddingHorizontal: 12, height: 40, justifyContent: 'center' }}>
            <Text style={{ color: colors.goldAccent, fontSize: 13, fontWeight: '700' }}>Find More</Text>
          </Pressable>,
        ]}
      />
      {astros.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} testID="savedAstrologers.empty">
          <Text style={{ fontSize: 64 }}>🔖</Text>
          <Text style={{ marginTop: 16, color: colors.textPrimary, fontSize: 18, fontWeight: '800' }}>No Saved Astrologers</Text>
          <Text style={{ marginTop: 8, color: colors.textMuted, fontSize: 13, textAlign: 'center' }}>
            {'Save your favourite astrologers\nfor quick access'}
          </Text>
          <ElevatedButton testID="savedAstrologers.findAstrologers" label="Find Astrologers" onPress={findMore} style={{ marginTop: 24 }} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: Math.max(150, insets.bottom + 90) }}>
          <View style={{ flexDirection: 'row' }}>
            <SummaryChip value={String(astros.length)} label="Saved" color={colors.goldAccent} colors={colors} />
            <SummaryChip value={String(astros.filter((a) => a.online).length)} label="Online Now" color="#2D9E6B" colors={colors} />
          </View>
          <View style={{ height: 18 }} />
          {astros.map((a, i) => (
            <View
              key={a.name}
              testID={`savedAstrologers.card.${i}`}
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
                      backgroundColor: withAlpha(a.color, colors.isLight ? 25 : 30),
                      borderWidth: 2,
                      borderColor: withAlpha(a.color, 80),
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 26 }}>{a.emoji}</Text>
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
                      backgroundColor: a.online ? '#2D9E6B' : colors.textMuted,
                    }}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text numberOfLines={1} style={{ flex: 1, color: colors.textPrimary, fontSize: 15, fontWeight: '700' }}>
                      {a.name}
                    </Text>
                    <AppIcon name="verified_rounded" color={colors.goldAccent} size={16} />
                  </View>
                  <Text style={{ marginTop: 2, color: colors.textMuted, fontSize: 11 }}>{a.speciality}</Text>
                  <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center' }}>
                    <AppIcon name="star_rounded" color={colors.goldAccent} size={14} />
                    <Text style={{ marginLeft: 3, color: colors.goldAccent, fontSize: 12, fontWeight: '700' }}>{String(a.rating)}</Text>
                    <Text style={{ marginLeft: 4, color: colors.textMuted, fontSize: 11 }}>{`(${a.reviews})`}</Text>
                    <Text style={{ marginLeft: 8, color: colors.textMuted, fontSize: 11 }}>{`• ${a.experience}`}</Text>
                  </View>
                </View>
                <IconButton testID={`savedAstrologers.card.${i}.unsave`} icon="bookmark_rounded" color={colors.goldAccent} size={22} onPress={() => handleUnsave(a)} />
              </View>

              <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center' }}>
                <AppIcon name="language_outlined" color={colors.textMuted} size={14} />
                <Text style={{ marginLeft: 4, flex: 1, color: colors.textMuted, fontSize: 11 }}>{a.languages}</Text>
                <Text style={{ color: colors.goldAccent, fontSize: 15, fontWeight: '800' }}>{a.price}</Text>
              </View>

              <View style={{ marginTop: 14, flexDirection: 'row' }}>
                <OutlinedButton
                  testID={`savedAstrologers.card.${i}.chat`}
                  label="Chat"
                  icon="chat_bubble_outline_rounded"
                  onPress={() => handleStartChat(a)}
                  color={colors.textSecondary}
                  radius={12}
                  paddingV={9}
                  fontSize={13}
                  fontWeight="600"
                  style={{ flex: 1 }}
                />
                <View style={{ width: 10 }} />
                <ElevatedButton
                  testID={`savedAstrologers.card.${i}.call`}
                  label="Call"
                  icon="call_outlined"
                  onPress={() => handleStartCall(a)}
                  bg={colors.goldAccent}
                  fg="#080D1A"
                  radius={12}
                  paddingV={9}
                  fontSize={13}
                  fontWeight="700"
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
