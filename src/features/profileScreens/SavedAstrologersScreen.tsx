/**
 * Port of lib/presentation/profile_screens/saved_astrologers_screen.dart
 * Bookmark icon removes the astrologer (local). "Find More" / empty CTA → go(/live-astrologers-screen).
 * SOURCE_INERT: Chat, Call.
 */
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { AppBar, IconButton } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { ElevatedButton, OutlinedButton } from '@/components/common';
import { Text } from '@/components/Text';
import { AppRoutes, go, pop } from '@/navigation/routes';
import { AppColors, withAlpha } from '@/theme/colors';
import { SOURCE_INERT } from '@/utils/sourceInert';

const INITIAL = [
  { name: 'Swami Shankarananda Giri', speciality: 'Vedic Jyotish • KP Astrology', rating: 4.9, reviews: 2847, experience: '28 years', price: '₹15/min', online: true, emoji: '🧘', color: '#9370DB', languages: 'Hindi, English, Sanskrit' },
  { name: 'Pandit Radhey Shyam Chaturvedi', speciality: 'Marriage • Kundli Matching', rating: 4.8, reviews: 1923, experience: '22 years', price: '₹12/min', online: false, emoji: '🔮', color: '#FFD700', languages: 'Hindi, English' },
  { name: 'Dr. Meenakshi Devi', speciality: 'Nadi Astrology • Remedies', rating: 4.7, reviews: 1456, experience: '18 years', price: '₹18/min', online: true, emoji: '🌸', color: '#FF6B6B', languages: 'Tamil, Hindi, English' },
];

function SummaryChip({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={{ marginRight: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: withAlpha(color, 20), borderWidth: 1, borderColor: withAlpha(color, 60) }}>
      <Text style={{ color, fontSize: 14, fontWeight: '700' }}>{value}</Text>
      <Text style={{ marginLeft: 4, color: withAlpha(color, 180), fontSize: 12 }}>{label}</Text>
    </View>
  );
}

export default function SavedAstrologersScreen() {
  const [astros, setAstros] = useState(INITIAL);
  const findMore = () => go(AppRoutes.liveAstrologersScreen);
  return (
    <View style={{ flex: 1, backgroundColor: AppColors.backgroundDark }} testID="savedAstrologers.screen">
      <AppBar
        title="Saved Astrologers"
        onBack={pop}
        testIDPrefix="savedAstrologers"
        actions={[
          <Pressable key="find" testID="savedAstrologers.findMore" onPress={findMore} style={{ paddingHorizontal: 12, height: 40, justifyContent: 'center' }}>
            <Text style={{ color: AppColors.goldAccent, fontSize: 13, fontWeight: '600' }}>Find More</Text>
          </Pressable>,
        ]}
      />
      {astros.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} testID="savedAstrologers.empty">
          <Text style={{ fontSize: 64 }}>🔖</Text>
          <Text style={{ marginTop: 16, color: AppColors.textPrimary, fontSize: 18, fontWeight: '700' }}>No Saved Astrologers</Text>
          <Text style={{ marginTop: 8, color: AppColors.textMuted, fontSize: 13, textAlign: 'center' }}>{'Save your favourite astrologers\nfor quick access'}</Text>
          <ElevatedButton testID="savedAstrologers.findAstrologers" label="Find Astrologers" onPress={findMore} style={{ marginTop: 24 }} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 }}>
          <View style={{ flexDirection: 'row' }}>
            <SummaryChip value={String(astros.length)} label="Saved" color={AppColors.goldAccent} />
            <SummaryChip value={String(astros.filter((a) => a.online).length)} label="Online Now" color={AppColors.online} />
          </View>
          <View style={{ height: 20 }} />
          {astros.map((a, i) => (
            <View key={a.name} testID={`savedAstrologers.card.${i}`} style={{ marginBottom: 14, padding: 16, borderRadius: 20, backgroundColor: AppColors.surfaceDark, borderWidth: 1, borderColor: AppColors.goldBorder }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View>
                  <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: withAlpha(a.color, 30), borderWidth: 2, borderColor: withAlpha(a.color, 80), alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 26 }}>{a.emoji}</Text>
                  </View>
                  <View style={{ position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: AppColors.surfaceDark, backgroundColor: a.online ? AppColors.online : AppColors.textMuted }} />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text numberOfLines={1} style={{ flex: 1, color: AppColors.textPrimary, fontSize: 14, fontWeight: '700' }}>{a.name}</Text>
                    <AppIcon name="verified_rounded" color={AppColors.goldAccent} size={16} />
                  </View>
                  <Text style={{ marginTop: 2, color: AppColors.textMuted, fontSize: 11 }}>{a.speciality}</Text>
                  <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center' }}>
                    <AppIcon name="star_rounded" color={AppColors.goldAccent} size={14} />
                    <Text style={{ marginLeft: 3, color: AppColors.goldAccent, fontSize: 12, fontWeight: '600' }}>{String(a.rating)}</Text>
                    <Text style={{ marginLeft: 4, color: AppColors.textMuted, fontSize: 11 }}>{`(${a.reviews})`}</Text>
                    <Text style={{ marginLeft: 8, color: AppColors.textMuted, fontSize: 11 }}>{`• ${a.experience}`}</Text>
                  </View>
                </View>
                <IconButton testID={`savedAstrologers.card.${i}.unsave`} icon="bookmark_rounded" color={AppColors.goldAccent} size={22} onPress={() => setAstros((l) => l.filter((x) => x !== a))} />
              </View>
              <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center' }}>
                <AppIcon name="language_outlined" color={AppColors.textMuted} size={14} />
                <Text style={{ marginLeft: 4, flex: 1, color: AppColors.textMuted, fontSize: 11 }}>{a.languages}</Text>
                <Text style={{ color: AppColors.goldAccent, fontSize: 14, fontWeight: '700' }}>{a.price}</Text>
              </View>
              <View style={{ marginTop: 12, flexDirection: 'row' }}>
                <OutlinedButton testID={`savedAstrologers.card.${i}.chat`} label="Chat" icon="chat_bubble_outline_rounded" onPress={SOURCE_INERT('savedAstrologers.chat')} color={AppColors.textSecondary} radius={10} paddingV={10} fontSize={13} fontWeight="500" style={{ flex: 1 }} />
                <View style={{ width: 10 }} />
                <ElevatedButton testID={`savedAstrologers.card.${i}.call`} label="Call" icon="call_outlined" onPress={SOURCE_INERT('savedAstrologers.call')} bg={a.online ? AppColors.primary : AppColors.surfaceVariantDark} radius={10} paddingV={10} paddingH={8} fontSize={13} fontWeight="500" style={{ flex: 1 }} />
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
