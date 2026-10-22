/**
 * Port of lib/presentation/profile_screens/birth_profiles_screen.dart
 * PopupMenu: Edit Profile (no-op in source → SOURCE_INERT), Set as Active, Delete (local state).
 * Add-profile sheet: rows just close the sheet (Navigator.pop) — same as source.
 * SOURCE_INERT: "View Kundli".
 */
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { AppBar } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { BottomSheet, PopupMenu } from '@/components/overlays';
import { Text } from '@/components/Text';
import { pop } from '@/navigation/routes';
import { AppColors, withAlpha } from '@/theme/colors';
import { SOURCE_INERT } from '@/utils/sourceInert';

type Profile = { name: string; type: string; dob: string; time: string; place: string; zodiac: string; sign: string; nakshatra: string; emoji: string; color: string; active: boolean };

const INITIAL: Profile[] = [
  { name: 'Priya Sharma', type: 'Myself', dob: '15 March 1992', time: '10:30 AM', place: 'Mumbai, Maharashtra', zodiac: '♈', sign: 'Aries', nakshatra: 'Ashwini', emoji: '🔮', color: '#9370DB', active: true },
  { name: 'Rahul Sharma', type: 'Partner', dob: '22 July 1989', time: '06:15 AM', place: 'Delhi, India', zodiac: '♋', sign: 'Cancer', nakshatra: 'Pushya', emoji: '💫', color: '#4FC3F7', active: false },
  { name: 'Aryan Sharma', type: 'Child', dob: '08 November 2018', time: '02:45 PM', place: 'Mumbai, Maharashtra', zodiac: '♏', sign: 'Scorpio', nakshatra: 'Jyeshtha', emoji: '⭐', color: '#FFB347', active: false },
];

function DetailRow({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={{ fontSize: 14 }}>{emoji}</Text>
      <Text style={{ marginLeft: 8, flex: 1, color: AppColors.textMuted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: AppColors.textPrimary, fontSize: 12, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}
function AstroChip({ symbol, value, label }: { symbol: string; value: string; label: string }) {
  return (
    <View style={{ marginRight: 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: AppColors.surfaceVariantDark, borderWidth: 1, borderColor: AppColors.goldBorder }}>
      <Text style={{ fontSize: 12 }}>{symbol}</Text>
      <View style={{ marginLeft: 4 }}>
        <Text style={{ color: AppColors.textPrimary, fontSize: 11, fontWeight: '600' }}>{value}</Text>
        <Text style={{ color: AppColors.textMuted, fontSize: 9 }}>{label}</Text>
      </View>
    </View>
  );
}

export default function BirthProfilesScreen() {
  const [profiles, setProfiles] = useState<Profile[]>(INITIAL);
  const [sheet, setSheet] = useState(false);

  const onMenu = (index: number, val: 'edit' | 'set_active' | 'delete') => {
    if (val === 'set_active') setProfiles((ps) => ps.map((p, i) => ({ ...p, active: i === index })));
    else if (val === 'delete') setProfiles((ps) => ps.filter((_, i) => i !== index));
    else SOURCE_INERT('birthProfiles.menu.edit')();
  };

  return (
    <View style={{ flex: 1, backgroundColor: AppColors.backgroundDark }} testID="birthProfiles.screen">
      <AppBar title="Birth Profiles" onBack={pop} testIDPrefix="birthProfiles" actions={[{ icon: 'add_circle_outline_rounded', color: AppColors.goldAccent, onPress: () => setSheet(true), testID: 'birthProfiles.add' }]} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 }}>
        <View style={{ padding: 14, borderRadius: 14, backgroundColor: withAlpha(AppColors.goldAccent, 15), borderWidth: 1, borderColor: AppColors.goldBorder, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 18 }}>✨</Text>
          <Text style={{ marginLeft: 10, flex: 1, color: AppColors.textSecondary, fontSize: 12 }}>Accurate birth details help us provide more personalised Vedic insights.</Text>
        </View>
        <View style={{ height: 20 }} />
        {profiles.length === 0 ? (
          <Text testID="birthProfiles.empty" style={{ color: AppColors.textMuted, textAlign: 'center', marginVertical: 24 }}>No birth profiles yet.</Text>
        ) : null}
        {profiles.map((p, i) => (
          <View key={p.name} testID={`birthProfiles.card.${i}`} style={{ marginBottom: 14, borderRadius: 20, backgroundColor: AppColors.surfaceDark, borderWidth: 1, borderColor: p.active ? withAlpha(AppColors.goldAccent, 120) : AppColors.goldBorder }}>
            <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: withAlpha(p.color, 30), borderWidth: 2, borderColor: withAlpha(p.color, 80), alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 24 }}>{p.emoji}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: AppColors.textPrimary, fontSize: 15, fontWeight: '700' }}>{p.name}</Text>
                  {p.active ? (
                    <View style={{ marginLeft: 8, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, backgroundColor: withAlpha(AppColors.goldAccent, 30), borderWidth: 1, borderColor: AppColors.goldBorder }}>
                      <Text style={{ color: AppColors.goldAccent, fontSize: 10, fontWeight: '600' }}>Active</Text>
                    </View>
                  ) : null}
                </View>
                <View style={{ marginTop: 2, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, backgroundColor: withAlpha(p.color, 20) }}>
                  <Text style={{ color: p.color, fontSize: 11, fontWeight: '600' }}>{p.type}</Text>
                </View>
              </View>
              <PopupMenu
                testID={`birthProfiles.card.${i}.menu`}
                onSelected={(v) => onMenu(i, v)}
                items={[
                  { value: 'edit', label: 'Edit Profile' },
                  { value: 'set_active', label: 'Set as Active' },
                  { value: 'delete', label: 'Delete', color: AppColors.error },
                ]}
              />
            </View>
            <View style={{ height: 1, backgroundColor: '#1E2A40' }} />
            <View style={{ padding: 14, gap: 8 }}>
              <DetailRow emoji="📅" label="Date of Birth" value={p.dob} />
              <DetailRow emoji="⏰" label="Birth Time" value={p.time} />
              <DetailRow emoji="📍" label="Birth Place" value={p.place} />
            </View>
            <View style={{ height: 1, backgroundColor: '#1E2A40' }} />
            <View style={{ paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
              <AstroChip symbol={p.zodiac} value={p.sign} label="Rashi" />
              <AstroChip symbol="⭐" value={p.nakshatra} label="Nakshatra" />
              <View style={{ flex: 1 }} />
              <Pressable testID={`birthProfiles.card.${i}.viewKundli`} onPress={SOURCE_INERT('birthProfiles.viewKundli')} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: AppColors.goldBorder }}>
                <Text style={{ color: AppColors.goldAccent, fontSize: 12, fontWeight: '600' }}>View Kundli</Text>
              </Pressable>
            </View>
          </View>
        ))}
        <Pressable testID="birthProfiles.addButton" onPress={() => setSheet(true)} style={{ marginTop: 16, padding: 18, borderRadius: 20, backgroundColor: AppColors.surfaceDark, borderWidth: 1, borderColor: AppColors.goldBorder, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <AppIcon name="add_circle_outline_rounded" color={AppColors.goldAccent} size={22} />
          <Text style={{ marginLeft: 10, color: AppColors.goldAccent, fontSize: 15, fontWeight: '600' }}>Add New Profile</Text>
        </Pressable>
      </ScrollView>

      <BottomSheet visible={sheet} onClose={() => setSheet(false)} testID="birthProfiles.addSheet">
        <View style={{ padding: 24, backgroundColor: AppColors.surfaceDark, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
          <Text style={{ color: AppColors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 20 }}>Add Profile For</Text>
          {['Myself', 'Partner', 'Child', 'Family Member', 'Other'].map((t) => (
            <Pressable key={t} testID={`birthProfiles.addSheet.${t.replace(' ', '')}`} onPress={() => setSheet(false)} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, minHeight: 56 }}>
              <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: withAlpha(AppColors.goldAccent, 20), alignItems: 'center', justifyContent: 'center' }}>
                <AppIcon name="person_outline_rounded" color={AppColors.goldAccent} size={20} />
              </View>
              <Text style={{ marginLeft: 16, flex: 1, color: AppColors.textPrimary, fontSize: 16, fontWeight: '500' }}>{t}</Text>
              <AppIcon name="chevron_right_rounded" color={AppColors.textMuted} />
            </Pressable>
          ))}
          <View style={{ height: 16 }} />
        </View>
      </BottomSheet>
    </View>
  );
}
