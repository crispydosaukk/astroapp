import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { AppIcon } from '@/components/AppIcon';
import { ElevatedButton, OutlinedButton } from '@/components/common';
import { BottomSheet, SheetContainer, showSnackBar } from '@/components/overlays';
import { formatTimeOfDay, pickDate, pickTime } from '@/components/pickers';
import { LocationSearchInput } from '@/components/LocationSearchInput';
import { Text, TextInput } from '@/components/Text';
import {
  BirthProfile,
  PROFILE_RELATION_TYPES,
  useBirthProfileStore,
} from '@/services/birthProfileStore';
import { AppColors, withAlpha } from '@/theme/colors';
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

const GENDER_OPTIONS = ['Male', 'Female', 'Other'] as const;

interface FamilyProfileSwitcherModalProps {
  visible: boolean;
  onClose: () => void;
  onProfileSelected?: (profile: BirthProfile) => void;
}

export function FamilyProfileSwitcherModal({
  visible,
  onClose,
  onProfileSelected,
}: FamilyProfileSwitcherModalProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();

  const profiles = useBirthProfileStore((s) => s.profiles);
  const activeProfile = useBirthProfileStore((s) => s.activeProfile);
  const setActiveProfile = useBirthProfileStore((s) => s.setActiveProfile);
  const addProfile = useBirthProfileStore((s) => s.addProfile);
  const updateProfile = useBirthProfileStore((s) => s.updateProfile);
  const deleteProfile = useBirthProfileStore((s) => s.deleteProfile);

  // View modes: 'list' | 'add' | 'edit'
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('Myself');
  const [formGender, setFormGender] = useState('Male');
  const [formDob, setFormDob] = useState('1995-10-15');
  const [formTime, setFormTime] = useState('12:00 PM');
  const [formPlace, setFormPlace] = useState('New Delhi, India');
  const [formSetAsActive, setFormSetAsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setFormName('');
    setFormType('Child');
    setFormGender('Male');
    setFormDob('2005-06-15');
    setFormTime('10:30 AM');
    setFormPlace('New Delhi, India');
    setFormSetAsActive(true);
    setEditingProfileId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setMode('add');
  };

  const handleOpenEdit = (profile: BirthProfile) => {
    setEditingProfileId(profile.id);
    setFormName(profile.name);
    setFormType(profile.type || 'Myself');
    setFormGender(profile.gender || 'Male');
    setFormDob(profile.dob || '1995-10-15');
    setFormTime(profile.time || '12:00 PM');
    setFormPlace(profile.place || 'New Delhi, India');
    setFormSetAsActive(profile.active);
    setMode('edit');
  };

  const handleSelectProfile = async (profile: BirthProfile) => {
    try {
      const activated = await setActiveProfile(profile.id);
      if (activated) {
        showSnackBar(`Switched active profile to ${activated.name} (${activated.type})`);
        if (onProfileSelected) onProfileSelected(activated);
        onClose();
      }
    } catch {
      showSnackBar('Failed to switch profile. Please try again.', '#CF4444');
    }
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

  const handleSaveForm = async () => {
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
      if (mode === 'edit' && editingProfileId) {
        const updated = await updateProfile(editingProfileId, {
          name: formName.trim(),
          type: formType,
          gender: formGender,
          dob: formDob,
          time: formTime,
          place: formPlace.trim(),
        });
        if (updated) {
          showSnackBar(`Updated details for ${updated.name}!`);
        }
      } else {
        const created = await addProfile({
          name: formName.trim(),
          type: formType,
          gender: formGender,
          dob: formDob,
          time: formTime,
          place: formPlace.trim(),
          setAsActive: formSetAsActive,
        });
        showSnackBar(`Added ${created.name} (${created.type}) to your family profiles!`);
      }
      setMode('list');
      resetForm();
    } catch {
      showSnackBar('Could not save profile. Please try again.', '#CF4444');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (profile: BirthProfile) => {
    if (profiles.length <= 1) {
      showSnackBar('Cannot delete the only profile', '#CF4444');
      return;
    }
    await deleteProfile(profile.id);
    showSnackBar(`Removed ${profile.name}'s profile`);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} testID="familyProfile.modal">
      <SheetContainer style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28, maxHeight: 620 }}>
        {/* Modal Header */}
        <View style={styles.headerRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor: withAlpha(colors.goldAccent, 24),
                  borderColor: withAlpha(colors.goldAccent, 80),
                },
              ]}
            >
              <Text style={{ fontSize: 18 }}>👨‍👩‍👧</Text>
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '800' }}>
                {mode === 'list'
                  ? 'Family Birth Profiles'
                  : mode === 'add'
                  ? 'Add Family Member'
                  : 'Edit Birth Profile'}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                {mode === 'list'
                  ? 'Switch between family members for personalized Kundli & insights'
                  : 'Enter birth details for accurate Vedic planetary calculations'}
              </Text>
            </View>
          </View>

          {mode !== 'list' ? (
            <Pressable
              onPress={() => setMode('list')}
              style={[
                styles.smallPill,
                { backgroundColor: colors.surfaceVariant, borderColor: colors.cardBorder },
              ]}
            >
              <AppIcon name="arrow_back" size={16} color={colors.textPrimary} />
              <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '700', marginLeft: 4 }}>
                Back
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* -------------------- MODE: LIST OF PROFILES -------------------- */}
        {mode === 'list' ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 14, paddingBottom: 20 }}
          >
            {/* Active profile callout banner */}
            {activeProfile ? (
              <View
                style={[
                  styles.activeCallout,
                  {
                    backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 16 : 24),
                    borderColor: withAlpha(colors.goldAccent, 90),
                  },
                ]}
              >
                <AppIcon name="check_circle" size={18} color={colors.goldAccent} />
                <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700', marginLeft: 8, flex: 1 }}>
                  Active Chart:{' '}
                  <Text style={{ color: colors.goldAccent, fontWeight: '800' }}>
                    {activeProfile.name}
                  </Text>{' '}
                  ({activeProfile.type})
                </Text>
              </View>
            ) : null}

            {/* Profile cards list */}
            <View style={{ marginTop: 10, gap: 10 }}>
              {profiles.map((p) => {
                const isActive = p.active;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => handleSelectProfile(p)}
                    style={[
                      styles.profileCard,
                      {
                        backgroundColor: isActive
                          ? withAlpha(AppColors.primary, colors.isLight ? 14 : 32)
                          : colors.surfaceVariant,
                        borderColor: isActive ? colors.goldAccent : colors.cardBorder,
                        borderWidth: isActive ? 1.5 : 1,
                      },
                    ]}
                  >
                    {/* Emoji Avatar */}
                    <View
                      style={[
                        styles.avatarCircle,
                        {
                          backgroundColor: withAlpha(p.color || colors.goldAccent, 24),
                          borderColor: p.color || colors.goldAccent,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 22 }}>{p.emoji || '🧘'}</Text>
                    </View>

                    {/* Member Details */}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text
                          numberOfLines={1}
                          style={{
                            color: colors.textPrimary,
                            fontSize: 15,
                            fontWeight: '800',
                            flex: 1,
                          }}
                        >
                          {p.name}
                        </Text>
                        <View
                          style={[
                            styles.typeBadge,
                            {
                              backgroundColor: withAlpha(p.color || colors.goldAccent, 20),
                              borderColor: withAlpha(p.color || colors.goldAccent, 80),
                            },
                          ]}
                        >
                          <Text
                            style={{
                              color: colors.isLight ? AppColors.primary : colors.goldAccent,
                              fontSize: 10.5,
                              fontWeight: '800',
                            }}
                          >
                            {p.type}
                          </Text>
                        </View>
                      </View>

                      <Text
                        numberOfLines={1}
                        style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}
                      >
                        📅 {p.dob} • ⏰ {p.time}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={{ color: colors.textMuted, fontSize: 11.5, marginTop: 2 }}
                      >
                        📍 {p.place}
                      </Text>

                      {p.zodiac ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
                          <Text style={{ color: colors.goldAccent, fontSize: 11, fontWeight: '700' }}>
                            ♈ {p.zodiac}
                          </Text>
                          {p.nakshatra ? (
                            <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                              • {p.nakshatra}
                            </Text>
                          ) : null}
                        </View>
                      ) : null}
                    </View>

                    {/* Actions: Edit / Active Check */}
                    <View style={{ alignItems: 'flex-end', marginLeft: 8, justifyContent: 'space-between' }}>
                      <View
                        style={[
                          styles.radioCircle,
                          {
                            backgroundColor: isActive ? AppColors.primary : 'transparent',
                            borderColor: isActive ? colors.goldAccent : colors.cardBorder,
                          },
                        ]}
                      >
                        {isActive ? (
                          <AppIcon name="check" size={12} color="#FFFFFF" />
                        ) : null}
                      </View>

                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 14 }}>
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(p);
                          }}
                          style={[
                            styles.iconActionBtn,
                            { backgroundColor: colors.surface, borderColor: colors.cardBorder },
                          ]}
                        >
                          <AppIcon name="edit" size={14} color={colors.goldAccent} />
                        </Pressable>
                        {profiles.length > 1 ? (
                          <Pressable
                            onPress={(e) => {
                              e.stopPropagation();
                              handleDelete(p);
                            }}
                            style={[
                              styles.iconActionBtn,
                              { backgroundColor: colors.surface, borderColor: colors.cardBorder },
                            ]}
                          >
                            <AppIcon name="delete_outline" size={14} color={AppColors.error} />
                          </Pressable>
                        ) : null}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* "+ Add Family Profile" action button */}
            <ElevatedButton
              label="+ Add Another Family Member"
              icon="person_add_alt_1"
              onPress={handleOpenAdd}
              style={{ marginTop: 20 }}
              paddingV={14}
              fontSize={14}
            />
          </ScrollView>
        ) : (
          /* -------------------- MODE: ADD / EDIT PROFILE FORM -------------------- */
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingTop: 14, paddingBottom: 40 }}
          >
            {/* Relationship Chips */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              Relationship / Profile Type *
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {PROFILE_RELATION_TYPES.map((r) => {
                const sel = formType === r.label;
                return (
                  <Pressable
                    key={r.label}
                    onPress={() => setFormType(r.label)}
                    style={[
                      styles.relationChip,
                      {
                        backgroundColor: sel ? withAlpha(AppColors.primary, 30) : colors.surfaceVariant,
                        borderColor: sel ? colors.goldAccent : colors.cardBorder,
                        borderWidth: sel ? 1.5 : 1,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 16 }}>{r.emoji}</Text>
                    <Text
                      style={{
                        color: sel ? colors.goldAccent : colors.textPrimary,
                        fontSize: 12.5,
                        fontWeight: sel ? '800' : '600',
                        marginLeft: 6,
                      }}
                    >
                      {r.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Member Full Name */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 14 }]}>
              Full Name *
            </Text>
            <TextInput
              value={formName}
              onChangeText={setFormName}
              placeholder="e.g., Aarav Sharma"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.cardBorder,
                  color: colors.textPrimary,
                },
              ]}
            />

            {/* Gender Selection */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 14 }]}>
              Gender *
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {GENDER_OPTIONS.map((g) => {
                const sel = formGender === g;
                return (
                  <Pressable
                    key={g}
                    onPress={() => setFormGender(g)}
                    style={[
                      styles.genderBtn,
                      {
                        backgroundColor: sel ? withAlpha(AppColors.primary, 30) : colors.surfaceVariant,
                        borderColor: sel ? colors.goldAccent : colors.cardBorder,
                        borderWidth: sel ? 1.5 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: sel ? colors.goldAccent : colors.textPrimary,
                        fontSize: 13,
                        fontWeight: sel ? '800' : '600',
                      }}
                    >
                      {g}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Date of Birth & Time of Birth */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  Date of Birth *
                </Text>
                <Pressable
                  onPress={handlePickDate}
                  style={[
                    styles.pickerBtn,
                    {
                      backgroundColor: colors.surfaceVariant,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <AppIcon name="calendar_today" size={16} color={colors.goldAccent} />
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 13,
                      fontWeight: '700',
                      marginLeft: 8,
                      flex: 1,
                    }}
                  >
                    {formDob || 'Select Date'}
                  </Text>
                </Pressable>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  Time of Birth *
                </Text>
                <Pressable
                  onPress={handlePickTime}
                  style={[
                    styles.pickerBtn,
                    {
                      backgroundColor: colors.surfaceVariant,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <AppIcon name="schedule" size={16} color={colors.goldAccent} />
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 13,
                      fontWeight: '700',
                      marginLeft: 8,
                      flex: 1,
                    }}
                  >
                    {formTime || 'Select Time'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Place of Birth with Google Maps */}
            <LocationSearchInput
              value={formPlace}
              onChangeText={setFormPlace}
              required
              label="Place of Birth (City, Country)"
              placeholder="Search city or Google Maps place..."
              style={{ marginTop: 14 }}
            />

            {/* Toggle Set As Active (only for add mode) */}
            {mode === 'add' ? (
              <Pressable
                onPress={() => setFormSetAsActive(!formSetAsActive)}
                style={[
                  styles.toggleRow,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: formSetAsActive ? AppColors.primary : 'transparent',
                      borderColor: formSetAsActive ? colors.goldAccent : colors.textMuted,
                    },
                  ]}
                >
                  {formSetAsActive ? <AppIcon name="check" size={12} color="#FFFFFF" /> : null}
                </View>
                <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600', marginLeft: 10, flex: 1 }}>
                  Set as active profile immediately
                </Text>
              </Pressable>
            ) : null}

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 22 }}>
              <OutlinedButton
                label="Cancel"
                onPress={() => setMode('list')}
                color={colors.textSecondary}
                borderColor={colors.cardBorder}
                style={{ flex: 0.4 }}
                paddingV={13}
              />
              <ElevatedButton
                label={
                  saving
                    ? 'Calculating & Saving...'
                    : mode === 'edit'
                    ? 'Update Profile'
                    : 'Save & Calculate Chart'
                }
                disabled={saving}
                loading={saving}
                icon="auto_awesome"
                onPress={handleSaveForm}
                style={{ flex: 1 }}
                paddingV={13}
                fontSize={13.5}
              />
            </View>
          </ScrollView>
        )}
      </SheetContainer>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201,168,76,0.15)',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
  },
  activeCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
    borderWidth: 1,
    marginLeft: 6,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  relationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13.5,
    fontWeight: '600',
  },
  genderBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  cityChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
