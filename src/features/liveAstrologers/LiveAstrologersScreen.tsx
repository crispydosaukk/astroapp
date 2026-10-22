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
import { FlatList, Platform, Pressable, RefreshControl, ScrollView, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/components/AnimatedBox';
import { AppIcon } from '@/components/AppIcon';
import { AppImage } from '@/components/AppImage';
import { ElevatedButton, Switch } from '@/components/common';
import { BottomSheet } from '@/components/overlays';
import { lh, Text, TextInput } from '@/components/Text';
import { AstrologerData, LIVE_ASTROLOGERS } from '@/data/astrologers';
import { AppRoutes, push } from '@/navigation/routes';
import { argb, withAlpha } from '@/theme/colors';

/* ----------------------------------------------------- search header widget */
function SearchHeader({ onlineCount, onSearchChanged, onFilterTap }: { onlineCount: number; onSearchChanged: (q: string) => void; onFilterTap: () => void }) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: withAlpha('#0D1B2A', 204), borderBottomWidth: 1, borderBottomColor: argb('1AC9A84C') }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ flex: 1, color: '#F0EAD6', fontSize: 20, fontWeight: '800' }}>Find Your Astrologer</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 100, backgroundColor: argb('1A3DCB7A'), borderWidth: 1, borderColor: argb('333DCB7A') }}>
          <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#3DCB7A' }} />
          <Text style={{ marginLeft: 5, color: '#3DCB7A', fontSize: 12, fontWeight: '700' }}>{`${onlineCount} Online`}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', marginTop: 12 }}>
        <View style={{ flex: 1, height: 46, borderRadius: 100, backgroundColor: argb('0FFFFFFF'), borderWidth: 1, borderColor: argb('1AC9A84C'), flexDirection: 'row', alignItems: 'center' }}>
          <AppIcon name="search_rounded" color="#6B7A99" size={20} style={{ marginLeft: 14 }} />
          <TextInput
            testID="liveAstrologers.search"
            onChangeText={onSearchChanged}
            placeholder="Search by name, expertise or language"
            style={{ flex: 1, marginLeft: 10, color: '#F0EAD6', fontSize: 14 }}
          />
        </View>
        <Pressable
          testID="liveAstrologers.filter"
          onPress={onFilterTap}
          style={{ marginLeft: 10, width: 46, height: 46, borderRadius: 14, backgroundColor: argb('0FFFFFFF'), borderWidth: 1, borderColor: argb('1AC9A84C'), alignItems: 'center', justifyContent: 'center' }}
        >
          <AppIcon name="tune_rounded" color="#C9A84C" size={22} />
        </Pressable>
      </View>
    </View>
  );
}

/* ---------------------------------------------------- category chips widget */
const CATEGORIES = [
  { label: 'All', emoji: '✦' }, { label: 'Love', emoji: '❤️' }, { label: 'Marriage', emoji: '💍' }, { label: 'Career', emoji: '💼' },
  { label: 'Vedic', emoji: '🕉️' }, { label: 'Finance', emoji: '💰' }, { label: 'Spirituality', emoji: '🧘' }, { label: 'Tarot', emoji: '🃏' },
  { label: 'Numerology', emoji: '🔢' }, { label: 'Vastu', emoji: '🏛️' }, { label: 'KP', emoji: '📐' }, { label: 'Nadi', emoji: '📜' },
  { label: 'Mantra', emoji: '🔔' }, { label: 'Yantra', emoji: '🔯' }, { label: 'Homa', emoji: '🔥' }, { label: 'Devata', emoji: '🪔' },
  { label: 'Gemstones', emoji: '💎' }, { label: 'Rudraksha', emoji: '📿' }, { label: 'Dāna & Seva', emoji: '🤲' },
];
function CategoryChips({ selected, onSelect }: { selected: string; onSelect: (c: string) => void }) {
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
              style={{ marginRight: 8, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100, borderWidth: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: sel ? '#8B1A1A' : argb('0FFFFFFF'), borderColor: sel ? '#8B1A1A' : argb('1AC9A84C') }}
            >
              <Text style={{ fontSize: 12 }}>{c.emoji}</Text>
              <Text style={{ marginLeft: 5, color: sel ? '#F0EAD6' : '#6B7A99', fontSize: 12, fontWeight: sel ? '700' : '400' }}>{c.label}</Text>
            </AnimatedPressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/* --------------------------------------------------- astrologer card widget */
function ActionButton({ label, icon, isPrimary, onTap, testID }: { label: string; icon: string; isPrimary: boolean; onTap: () => void; testID: string }) {
  const fg = isPrimary ? '#F0EAD6' : '#C9A84C';
  return (
    <Pressable
      testID={testID}
      onPress={onTap}
      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 100, borderWidth: 1, backgroundColor: isPrimary ? '#8B1A1A' : argb('0FFFFFFF'), borderColor: isPrimary ? '#8B1A1A' : argb('33C9A84C') }}
    >
      <AppIcon name={icon} color={fg} size={13} />
      <Text style={{ marginLeft: 4, color: fg, fontSize: 12, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

export function AstrologerCard({ data, index }: { data: AstrologerData; index: number }) {
  const { width } = useWindowDimensions();
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(Math.min(400, index * 60), withTiming(1, { duration: 400, easing: Easing.linear }));
  }, [index, p]);
  const anim = useAnimatedStyle(() => ({
    opacity: 1 - (1 - p.value) * (1 - p.value),
    transform: [{ translateY: (1 - (1 - Math.pow(1 - p.value, 3))) * 0.05 * 180 }],
  }));
  const featured = !!data.isFeatured;
  const open = () => push(AppRoutes.astrologerDetailScreen, data);
  const id = `liveAstrologers.card.${index}`;
  return (
    <Animated.View style={[{ marginBottom: 14 }, anim]}>
      <Pressable testID={id} onPress={open}>
        <View style={{ flexDirection: 'row', borderRadius: 20, overflow: 'hidden', backgroundColor: argb('0FFFFFFF'), borderWidth: featured ? 1.5 : 1, borderColor: featured ? argb('66C9A84C') : argb('1AC9A84C') }}>
          <View style={{ width: (width - 40) * 0.35 }}>
            <AppImage uri={data.imageUrl} width="100%" height={180} fit="cover" semanticLabel={data.semanticLabel} />
            <View style={{ position: 'absolute', top: 10, left: 10, width: 11, height: 11, borderRadius: 5.5, borderWidth: 2, borderColor: '#080D1A', backgroundColor: data.isOnline ? '#3DCB7A' : '#6B7A99' }} />
            {featured ? (
              <View style={{ position: 'absolute', bottom: 10, left: 6, right: 6, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6, backgroundColor: '#C9A84C' }}>
                <Text style={{ textAlign: 'center', color: '#080D1A', fontSize: 8, fontWeight: '800' }}>⭐ TOP RATED</Text>
              </View>
            ) : null}
          </View>
          <View style={{ flex: 1, padding: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text numberOfLines={1} style={{ flex: 1, color: '#F0EAD6', fontSize: 14, fontWeight: '700' }}>{data.name}</Text>
              <AppIcon name="verified_rounded" color="#C9A84C" size={15} />
            </View>
            <Text numberOfLines={2} style={{ marginTop: 2, color: '#6B7A99', ...lh(11, 1.4) }}>{data.title}</Text>
            <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center' }}>
              <AppIcon name="star_rounded" color="#C9A84C" size={13} />
              <Text style={{ marginLeft: 3, color: '#C9A84C', fontSize: 12, fontWeight: '700' }}>{String(data.rating)}</Text>
              <Text style={{ color: '#6B7A99', fontSize: 11 }}>{` (${data.reviews})`}</Text>
              <View style={{ flex: 1 }} />
              <Text style={{ color: '#A0A8C0', fontSize: 11 }}>{data.experience}</Text>
            </View>
            <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center' }}>
              <AppIcon name="language_rounded" color="#6B7A99" size={12} />
              <Text numberOfLines={1} style={{ marginLeft: 4, flex: 1, color: '#6B7A99', fontSize: 11 }}>{data.languages}</Text>
            </View>
            {data.discount ? (
              <View style={{ marginTop: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, backgroundColor: argb('1A2D9E6B'), borderWidth: 1, borderColor: argb('332D9E6B') }}>
                <Text style={{ color: '#2D9E6B', fontSize: 10, fontWeight: '600' }}>{data.discount}</Text>
              </View>
            ) : null}
            <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#F0EAD6', fontSize: 14, fontWeight: '800' }}>{`₹${data.price}/min`}</Text>
                <Text style={{ color: '#6B7A99', fontSize: 10 }}>{`${data.consultations}+ sessions`}</Text>
              </View>
              <ActionButton testID={`${id}.chat`} label="Chat" icon="chat_bubble_outline_rounded" isPrimary onTap={open} />
              <View style={{ width: 6 }} />
              <ActionButton testID={`${id}.call`} label="Call" icon="call_rounded" isPrimary={false} onTap={open} />
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
            style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, borderWidth: 1, backgroundColor: sel ? '#8B1A1A' : argb('0FFFFFFF'), borderColor: sel ? '#8B1A1A' : argb('1AC9A84C') }}
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

/* ------------------------------------------------------------------ screen */
export default function LiveAstrologersScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return LIVE_ASTROLOGERS.filter((a) => {
      const matchesSearch = q.length === 0 || a.name.toLowerCase().includes(q) || a.specialty.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'All' || a.category === selectedCategory;
      const matchesOnline = !onlineOnly || a.isOnline;
      return matchesSearch && matchesCategory && matchesOnline;
    });
  }, [searchQuery, selectedCategory, onlineOnly]);
  const onlineCount = LIVE_ASTROLOGERS.filter((a) => a.isOnline).length;

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#080D1A' }} testID="liveAstrologers.screen">
      <SearchHeader onlineCount={onlineCount} onSearchChanged={setSearchQuery} onFilterTap={() => setSheetOpen(true)} />
      <CategoryChips selected={selectedCategory} onSelect={setSelectedCategory} />
      <View style={{ flex: 1 }}>
        {filtered.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} testID="liveAstrologers.empty">
            <Text style={{ fontSize: 48 }}>🔍</Text>
            <Text style={{ marginTop: 16, color: '#F0EAD6', fontSize: 18, fontWeight: '700' }}>No astrologers found</Text>
            <Text style={{ marginTop: 8, color: '#6B7A99', fontSize: 14 }}>Try adjusting your search or filters</Text>
            <Pressable
              testID="liveAstrologers.clearFilters"
              onPress={() => { setSearchQuery(''); setSelectedCategory('All'); setOnlineOnly(false); }}
              style={{ marginTop: 24, paddingHorizontal: 12, paddingVertical: 8 }}
            >
              <Text style={{ color: '#C9A84C', fontWeight: '600', fontSize: 14 }}>Clear Filters</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(a) => a.name}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 }}
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
