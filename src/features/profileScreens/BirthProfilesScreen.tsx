/**
 * Port of lib/presentation/profile_screens/birth_profiles_screen.dart
 * Completely dynamic:
 * - Reads & persists family birth profiles via useBirthProfileStore
 * - Active profile synced with user's primary birth chart across whole app
 * - Full Add & Edit Profile Sheets with Name, Relation, DOB, TOB, POB, Gender
 * - Date & Time pickers for seamless accuracy
 * - Set as Active / Edit / Delete / View Kundli fully functional
 * - Dynamic Light Vedic & Dark Cosmic theming with high-contrast text
 */
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { ElevatedButton, OutlinedButton } from '@/components/common';
import { BottomSheet, PopupMenu, showSnackBar } from '@/components/overlays';
import { formatTimeOfDay, pickDate, pickTime } from '@/components/pickers';
import { LocationSearchInput } from '@/components/LocationSearchInput';
import { Text, TextInput } from '@/components/Text';
import { AppRoutes, pop, push } from '@/navigation/routes';
import { useAuthStore } from '@/features/auth/authStore';
import {
  BirthProfile,
  PROFILE_RELATION_TYPES,
  useBirthProfileStore,
} from '@/services/birthProfileStore';
import { withAlpha } from '@/theme/colors';
import { useTranslation } from '@/theme/languageStore';
import { useThemeColors } from '@/theme/themeStore';

const POPULAR_CITIES = [
  'New Delhi, India',
  'Mumbai, India',
  'Bengaluru, India',
  'Hyderabad, India',
  'Chennai, India',
  'Kolkata, India',
  'London, UK',
  'New York, USA',
];

function DetailRow({ emoji, label, value, colors }: { emoji: string; label: string; value: string; colors: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={{ fontSize: 14 }}>{emoji}</Text>
      <Text style={{ marginLeft: 8, flex: 1, color: colors.textMuted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

function AstroChip({ symbol, value, label, colors }: { symbol: string; value: string; label: string; colors: any }) {
  return (
    <View
      style={{
        marginRight: 8,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        backgroundColor: colors.surfaceVariant,
        borderWidth: 1,
        borderColor: colors.cardBorder,
      }}
    >
      <Text style={{ fontSize: 12 }}>{symbol}</Text>
      <View style={{ marginLeft: 6 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 11, fontWeight: '700' }}>{value}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 9 }}>{label}</Text>
      </View>
    </View>
  );
}

export default function BirthProfilesScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const authUser = useAuthStore((s) => s.user);

  const profiles = useBirthProfileStore((s) => s.profiles);
  const activeProfile = useBirthProfileStore((s) => s.activeProfile);
  const loadProfiles = useBirthProfileStore((s) => s.loadProfiles);
  const setActiveProfile = useBirthProfileStore((s) => s.setActiveProfile);
  const addProfile = useBirthProfileStore((s) => s.addProfile);
  const updateProfile = useBirthProfileStore((s) => s.updateProfile);
  const deleteProfile = useBirthProfileStore((s) => s.deleteProfile);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('Partner');
  const [formGender, setFormGender] = useState('Male');
  const [formDob, setFormDob] = useState('1995-10-15');
  const [formTime, setFormTime] = useState('12:00 PM');
  const [formPlace, setFormPlace] = useState('New Delhi, India');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, [authUser]);

  const openAddSheet = () => {
    setSheetMode('add');
    setEditingId(null);
    setFormName('');
    setFormType('Partner');
    setFormGender('Male');
    setFormDob('1995-10-15');
    setFormTime('12:00 PM');
    setFormPlace('New Delhi, India');
    setSheetOpen(true);
  };

  const openEditSheet = (profile: BirthProfile) => {
    setSheetMode('edit');
    setEditingId(profile.id);
    setFormName(profile.name);
    setFormType(profile.type || 'Myself');
    setFormGender(profile.gender || 'Male');
    setFormDob(profile.dob || '1995-10-15');
    setFormTime(profile.time || '12:00 PM');
    setFormPlace(profile.place || 'New Delhi, India');
    setSheetOpen(true);
  };

  const handlePickDate = async () => {
    try {
      const initialDate = formDob ? new Date(formDob) : new Date(1995, 9, 15);
      const chosen = await pickDate({
        value: isNaN(initialDate.getTime()) ? new Date(1995, 9, 15) : initialDate,
        maximumDate: new Date(),
      });
      if (chosen) {
        const y = chosen.getFullYear();
        const m = String(chosen.getMonth() + 1).padStart(2, '0');
        const d = String(chosen.getDate()).padStart(2, '0');
        setFormDob(`${y}-${m}-${d}`);
      }
    } catch {}
  };

  const handlePickTime = async () => {
    try {
      const chosen = await pickTime({
        value: new Date(2000, 0, 1, 12, 0),
      });
      if (chosen) {
        setFormTime(formatTimeOfDay(chosen));
      }
    } catch {}
  };

  const onMenu = async (index: number, val: 'edit' | 'set_active' | 'delete') => {
    const target = profiles[index];
    if (!target) return;

    if (val === 'set_active') {
      await setActiveProfile(target.id);
      showSnackBar(`${target.name} (${target.type}) is now your active birth chart!`);
    } else if (val === 'delete') {
      if (profiles.length <= 1) {
        showSnackBar('Cannot delete the only profile', '#CF4444');
        return;
      }
      await deleteProfile(target.id);
      showSnackBar(`${target.name} profile removed`);
    } else if (val === 'edit') {
      openEditSheet(target);
    }
  };

  const handleSaveProfile = async () => {
    if (!formName.trim()) {
      showSnackBar('Please enter member name', '#CF4444');
      return;
    }
    if (!formPlace.trim()) {
      showSnackBar('Please enter birth place', '#CF4444');
      return;
    }

    setSaving(true);
    try {
      if (sheetMode === 'edit' && editingId) {
        const updated = await updateProfile(editingId, {
          name: formName.trim(),
          type: formType,
          gender: formGender,
          dob: formDob,
          time: formTime,
          place: formPlace.trim(),
        });
        if (updated) {
          showSnackBar(`Updated birth details for ${updated.name}!`);
        }
      } else {
        const created = await addProfile({
          name: formName.trim(),
          type: formType,
          gender: formGender,
          dob: formDob,
          time: formTime,
          place: formPlace.trim(),
          setAsActive: false,
        });
        showSnackBar(`Added ${created.name} (${created.type}) to your family profiles!`);
      }
      setSheetOpen(false);
    } catch {
      showSnackBar('Could not save profile. Please try again.', '#CF4444');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="birthProfiles.screen">
      <AppBar
        title={t('profile.birthProfiles', 'Birth Profiles')}
        onBack={pop}
        testIDPrefix="birthProfiles"
        backgroundColor={colors.background}
        backColor={colors.textPrimary}
        actions={[
          {
            icon: 'add_circle_outline_rounded',
            color: colors.goldAccent,
            onPress: openAddSheet,
            testID: 'birthProfiles.add',
          },
        ]}
      />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: Math.max(150, insets.bottom + 90) }}>
        <View
          style={{
            padding: 14,
            borderRadius: 16,
            backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 25 : 15),
            borderWidth: 1,
            borderColor: colors.cardBorder,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 20 }}>✨</Text>
          <Text style={{ marginLeft: 10, flex: 1, color: colors.textSecondary, fontSize: 13, lineHeight: 18 }}>
            Manage family birth charts. Switching the active profile recalibrates your Kundli, daily horoscope, and remedies across the entire app.
          </Text>
        </View>

        <View style={{ height: 16 }} />

        {profiles.length === 0 ? (
          <Text testID="birthProfiles.empty" style={{ color: colors.textMuted, textAlign: 'center', marginVertical: 32 }}>
            No birth profiles yet. Add one below!
          </Text>
        ) : null}

        {profiles.map((p, i) => (
          <View
            key={p.id || p.name}
            testID={`birthProfiles.card.${i}`}
            style={{
              marginBottom: 16,
              borderRadius: 22,
              backgroundColor: colors.surface,
              borderWidth: 1.5,
              borderColor: p.active ? colors.goldAccent : colors.cardBorder,
              shadowColor: p.active ? colors.goldAccent : '#000',
              shadowOpacity: p.active ? 0.2 : 0.04,
              shadowRadius: 10,
              elevation: p.active ? 4 : 1,
            }}
          >
            <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: withAlpha(p.color || colors.goldAccent, colors.isLight ? 25 : 30),
                  borderWidth: 2,
                  borderColor: withAlpha(p.color || colors.goldAccent, 80),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 24 }}>{p.emoji || '🧘'}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>{p.name}</Text>
                  {p.active ? (
                    <View
                      style={{
                        marginLeft: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 20,
                        backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 25 : 30),
                        borderWidth: 1,
                        borderColor: colors.goldAccent,
                      }}
                    >
                      <Text style={{ color: colors.goldAccent, fontSize: 10, fontWeight: '700' }}>Active</Text>
                    </View>
                  ) : null}
                </View>
                <View
                  style={{
                    marginTop: 3,
                    alignSelf: 'flex-start',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 20,
                    backgroundColor: withAlpha(p.color || colors.goldAccent, 20),
                  }}
                >
                  <Text style={{ color: p.color || colors.goldAccent, fontSize: 11, fontWeight: '700' }}>{p.type}</Text>
                </View>
              </View>

              <PopupMenu
                testID={`birthProfiles.card.${i}.menu`}
                onSelected={(v) => onMenu(i, v)}
                items={[
                  { value: 'set_active', label: 'Set as Active Chart' },
                  { value: 'edit', label: 'Edit Profile' },
                  { value: 'delete', label: 'Delete', color: '#CF4444' },
                ]}
              />
            </View>

            <View style={{ height: 1, backgroundColor: colors.divider }} />

            <View style={{ padding: 14, gap: 8 }}>
              <DetailRow emoji="📅" label="Date of Birth" value={p.dob} colors={colors} />
              <DetailRow emoji="⏰" label="Birth Time" value={p.time} colors={colors} />
              <DetailRow emoji="📍" label="Birth Place" value={p.place} colors={colors} />
            </View>

            <View style={{ height: 1, backgroundColor: colors.divider }} />

            <View style={{ paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
              <AstroChip symbol="♈" value={p.sign || p.zodiac} label="Rashi" colors={colors} />
              <AstroChip symbol="⭐" value={p.nakshatra} label="Nakshatra" colors={colors} />
              <View style={{ flex: 1 }} />
              <Pressable
                testID={`birthProfiles.card.${i}.viewKundli`}
                onPress={async () => {
                  if (!p.active) {
                    await setActiveProfile(p.id);
                  }
                  push(AppRoutes.myKundliScreen);
                }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: colors.goldAccent,
                  backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 15 : 20),
                }}
              >
                <Text style={{ color: colors.goldAccent, fontSize: 12, fontWeight: '700' }}>
                  {t('profile.myKundli', 'View Kundli')}
                </Text>
              </Pressable>
            </View>
          </View>
        ))}

        <Pressable
          testID="birthProfiles.addButton"
          onPress={openAddSheet}
          style={{
            marginTop: 8,
            padding: 16,
            borderRadius: 20,
            backgroundColor: colors.surface,
            borderWidth: 1.5,
            borderColor: colors.goldAccent,
            borderStyle: 'dashed',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <AppIcon name="add_circle_outline_rounded" color={colors.goldAccent} size={22} />
          <Text style={{ marginLeft: 10, color: colors.goldAccent, fontSize: 15, fontWeight: '700' }}>
            Add Family Birth Profile
          </Text>
        </Pressable>
      </ScrollView>

      {/* Add / Edit Profile BottomSheet */}
      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} testID="birthProfiles.addSheet">
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            maxHeight: '100%',
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 24,
              paddingTop: 18,
              paddingBottom: 14,
              borderBottomWidth: 1,
              borderBottomColor: colors.cardBorder,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: withAlpha(colors.goldAccent, 20),
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <AppIcon name="person_add" size={18} color={colors.goldAccent} />
              </View>
              <View>
                <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '800' }}>
                  {sheetMode === 'add' ? 'Add Family Birth Chart' : 'Edit Birth Profile'}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                  Sacred Vedic kundli details
                </Text>
              </View>
            </View>
            <Pressable onPress={() => setSheetOpen(false)} hitSlop={8} style={{ padding: 4 }}>
              <AppIcon name="close_rounded" color={colors.textMuted} size={22} />
            </Pressable>
          </View>

          {/* Scrollable Form Body with Keyboard Handling */}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingTop: 16,
              paddingBottom: insets.bottom + 24,
            }}
          >
            {/* Relationship */}
            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>
              Relationship
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {PROFILE_RELATION_TYPES.map((r) => {
                const isSel = formType === r.label;
                return (
                  <Pressable
                    key={r.label}
                    onPress={() => setFormType(r.label)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 13,
                      paddingVertical: 7,
                      borderRadius: 16,
                      backgroundColor: isSel ? colors.goldAccent : colors.surfaceVariant,
                      borderWidth: 1.5,
                      borderColor: isSel ? colors.goldAccent : colors.cardBorder,
                      shadowColor: isSel ? colors.goldAccent : 'transparent',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isSel ? 0.25 : 0,
                      shadowRadius: 4,
                      elevation: isSel ? 2 : 0,
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>{r.emoji}</Text>
                    <Text
                      style={{
                        color: isSel ? '#FFFFFF' : colors.textPrimary,
                        fontSize: 12,
                        fontWeight: isSel ? '800' : '600',
                        marginLeft: 5,
                      }}
                    >
                      {r.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Full Name Input */}
            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>
              Full Name <Text style={{ color: colors.goldAccent }}>*</Text>
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surfaceVariant,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: colors.cardBorder,
                paddingHorizontal: 12,
                minHeight: 50,
                marginBottom: 16,
              }}
            >
              <AppIcon name="person_outline" size={20} color={colors.goldAccent} style={{ marginRight: 8 }} />
              <TextInput
                placeholder="e.g. Rahul Sharma"
                value={formName}
                onChangeText={setFormName}
                placeholderTextColor={colors.textMuted}
                style={{
                  flex: 1,
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.textPrimary,
                  paddingVertical: 12,
                }}
              />
            </View>

            {/* Birth Date & Time Side by Side */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>
                  Birth Date <Text style={{ color: colors.goldAccent }}>*</Text>
                </Text>
                <Pressable
                  onPress={handlePickDate}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    minHeight: 50,
                    borderRadius: 14,
                    backgroundColor: colors.surfaceVariant,
                    borderWidth: 1.5,
                    borderColor: colors.cardBorder,
                  }}
                >
                  <AppIcon name="calendar_today" size={17} color={colors.goldAccent} style={{ marginRight: 8 }} />
                  <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700', flex: 1 }}>
                    {formDob || 'Select Date'}
                  </Text>
                </Pressable>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>
                  Birth Time <Text style={{ color: colors.goldAccent }}>*</Text>
                </Text>
                <Pressable
                  onPress={handlePickTime}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    minHeight: 50,
                    borderRadius: 14,
                    backgroundColor: colors.surfaceVariant,
                    borderWidth: 1.5,
                    borderColor: colors.cardBorder,
                  }}
                >
                  <AppIcon name="schedule" size={17} color={colors.goldAccent} style={{ marginRight: 8 }} />
                  <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700', flex: 1 }}>
                    {formTime || 'Select Time'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Google Maps Location Search */}
            <LocationSearchInput
              value={formPlace}
              onChangeText={setFormPlace}
              required
              label="Birth Place (City, State, Country)"
              placeholder="Search city or Google Maps place..."
            />

            {/* Save Button */}
            <ElevatedButton
              label={saving ? 'Calculating Chart...' : sheetMode === 'add' ? 'Save Birth Profile' : 'Update Profile Details'}
              onPress={handleSaveProfile}
              disabled={saving}
              loading={saving}
              radius={14}
              paddingV={14}
              style={{ marginTop: 8 }}
            />
          </ScrollView>
        </View>
      </BottomSheet>
    </View>
  );
}
