/**
 * Port of lib/presentation/birth_profile_setup_screen/ (screen + 3 widgets).
 * - progress: 400 ms easeOutCubic tween to (step+1)/3
 * - AnimatedSwitcher 350 ms: slide from 5 % + fade
 * - field state lives in the parent so it survives step changes (same as Flutter controllers)
 * - Back on step 0 → go(onboarding); Skip / Complete Setup → go(home)
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedBox, AnimatedPressable, switcherEntering } from '@/components/AnimatedBox';
import { AppIcon } from '@/components/AppIcon';
import { ElevatedButton } from '@/components/common';
import { showSnackBar } from '@/components/overlays';
import { formatTimeOfDay, pickDate, pickTime } from '@/components/pickers';
import { lh, Text, TextInput } from '@/components/Text';
import { API_ENDPOINTS } from '@/config/api';
import { useAuthStore } from '@/features/auth/authStore';
import { AppRoutes, go } from '@/navigation/routes';
import { fetchCalculatedKundli } from '@/services/astrologyService';
import { AppColors, withAlpha } from '@/theme/colors';
import { useThemeColors } from '@/theme/themeStore';

/* ---------------------------------------------------------------- step 0 */
const PROFILE_TYPES = [
  { label: 'Myself', icon: 'person_rounded', emoji: '🧘' },
  { label: 'Partner', icon: 'favorite_rounded', emoji: '❤️' },
  { label: 'Child', icon: 'child_care_rounded', emoji: '👶' },
  { label: 'Family', icon: 'family_restroom_rounded', emoji: '👨‍👩‍👧' },
  { label: 'Other', icon: 'people_alt_rounded', emoji: '✨' },
];

function StepTitle({ title, subtitle }: { title: string; subtitle: string }) {
  const colors = useThemeColors();
  return (
    <>
      <Text style={{ color: colors.textPrimary, fontWeight: '800', ...lh(28, 1.2) }}>{title}</Text>
      <Text style={{ marginTop: 8, color: colors.textSecondary, fontSize: 14 }}>{subtitle}</Text>
      <View style={{ height: 32 }} />
    </>
  );
}

function ProfileTypeSelector({ selectedType, onTypeSelected }: { selectedType: string; onTypeSelected: (t: string) => void }) {
  const colors = useThemeColors();
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>
      <StepTitle title={'Who is this\nprofile for?'} subtitle="Create profiles for yourself and your loved ones." />
      {PROFILE_TYPES.map((t) => {
        const sel = selectedType === t.label;
        return (
          <AnimatedPressable
            key={t.label}
            testID={`birthProfile.type.${t.label.toLowerCase()}`}
            onPress={() => onTypeSelected(t.label)}
            duration={200}
            curve="easeOutCubic"
            style={{
              marginBottom: 12, padding: 20, borderRadius: 20, flexDirection: 'row', alignItems: 'center',
              backgroundColor: sel ? withAlpha(AppColors.primary, colors.isLight ? 20 : 25) : colors.surface,
              borderColor: sel ? AppColors.primary : colors.cardBorder, borderWidth: sel ? 1.5 : 1,
            }}
          >
            <View style={{ width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: sel ? withAlpha(AppColors.primary, colors.isLight ? 25 : 38) : withAlpha(colors.goldAccent, 20) }}>
              <Text style={{ fontSize: 24 }}>{t.emoji}</Text>
            </View>
            <Text style={{ marginLeft: 16, flex: 1, color: sel ? AppColors.primary : colors.textPrimary, fontSize: 17, fontWeight: sel ? '700' : '500' }}>{t.label}</Text>
            <AnimatedBox
              duration={200}
              style={{
                width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center',
                backgroundColor: sel ? AppColors.primary : 'transparent', borderColor: sel ? AppColors.primary : colors.cardBorder,
              }}
            >
              {sel ? <AppIcon name="check_rounded" color="#FFFFFF" size={14} /> : null}
            </AnimatedBox>
          </AnimatedPressable>
        );
      })}
    </ScrollView>
  );
}

/* ---------------------------------------------------------------- step 1 */
const GENDER_OPTIONS = [
  { label: 'Male', icon: 'male' },
  { label: 'Female', icon: 'female' },
  { label: 'Other', icon: 'transgender' },
] as const;

function GlassField({ label, children }: { label: string; children: React.ReactNode }) {
  const colors = useThemeColors();
  return (
    <View style={{ paddingHorizontal: 18, paddingVertical: 14, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder }}>
      <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', letterSpacing: 0.8 }}>{label}</Text>
      <View style={{ height: 8 }} />
      {children}
    </View>
  );
}

function BirthDetailsForm(p: {
  name: string; setName: (s: string) => void; gender: string; setGender: (g: string) => void;
  date: Date | null; setDate: (d: Date) => void; time: Date | null; setTime: (d: Date) => void;
}) {
  const colors = useThemeColors();
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
      <StepTitle title={'Your Birth\nDetails'} subtitle="Accurate details help us generate your precise Kundli." />
      <GlassField label="Full Name">
        <TextInput
          testID="birthProfile.name"
          value={p.name}
          onChangeText={p.setName}
          placeholder="Enter your full name"
          placeholderTextColor={colors.textMuted}
          style={{ color: colors.textPrimary, fontSize: 16 }}
        />
      </GlassField>
      <View style={{ height: 16 }} />
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderRadius: 16,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.cardBorder,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' }}>
            Gender
          </Text>
          {p.gender ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.goldAccent, marginRight: 5 }} />
              <Text style={{ color: colors.goldAccent, fontSize: 11, fontWeight: '600' }}>
                {p.gender}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {GENDER_OPTIONS.map((opt) => {
            const sel = p.gender === opt.label;
            return (
              <AnimatedPressable
                key={opt.label}
                testID={`birthProfile.gender.${opt.label.toLowerCase()}`}
                onPress={() => p.setGender(opt.label)}
                duration={200}
                curve="easeOutCubic"
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 14,
                  borderWidth: sel ? 1.5 : 1,
                  borderColor: sel ? colors.goldAccent : colors.cardBorder,
                  backgroundColor: sel ? withAlpha(AppColors.primary, colors.isLight ? 20 : 38) : colors.surfaceVariant,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 6,
                  overflow: 'hidden',
                }}
              >
                {sel && (
                  <LinearGradient
                    colors={['#713B32', '#552B24']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                  />
                )}

                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: sel ? withAlpha(colors.goldAccent, 50) : withAlpha(colors.goldAccent, 20),
                    marginRight: 6,
                  }}
                >
                  <AppIcon
                    name={opt.icon}
                    size={16}
                    color={sel ? colors.goldAccent : colors.textMuted}
                  />
                </View>

                <Text
                  style={{
                    color: sel ? '#FFFFFF' : colors.textSecondary,
                    fontSize: 13,
                    fontWeight: sel ? '700' : '500',
                    letterSpacing: 0.2,
                  }}
                >
                  {opt.label}
                </Text>
              </AnimatedPressable>
            );
          })}
        </View>
      </View>
      <View style={{ height: 16 }} />
      <Pressable
        testID="birthProfile.date"
        onPress={async () => {
          const d = await pickDate({ value: p.date ?? new Date(1990, 0, 1), minimumDate: new Date(1900, 0, 1), maximumDate: new Date() });
          if (d) p.setDate(d);
        }}
      >
        <GlassField label="Date of Birth">
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <AppIcon name="calendar_month_rounded" color={colors.goldAccent} size={20} />
            <Text style={{ marginLeft: 12, fontSize: 15, color: p.date ? colors.textPrimary : colors.textMuted }}>
              {p.date ? `${p.date.getDate()} / ${p.date.getMonth() + 1} / ${p.date.getFullYear()}` : 'Select date of birth'}
            </Text>
          </View>
        </GlassField>
      </Pressable>
      <View style={{ height: 16 }} />
      <Pressable
        testID="birthProfile.time"
        onPress={async () => {
          const t = await pickTime({ value: p.time ?? new Date() });
          if (t) p.setTime(t);
        }}
      >
        <GlassField label="Birth Time">
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <AppIcon name="access_time_rounded" color={colors.goldAccent} size={20} />
            <Text style={{ marginLeft: 12, fontSize: 15, color: p.time ? colors.textPrimary : colors.textMuted }}>
              {p.time ? formatTimeOfDay(p.time) : 'Select birth time'}
            </Text>
          </View>
        </GlassField>
      </Pressable>
      <View style={{ marginTop: 12, padding: 14, borderRadius: 12, backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 20 : 25), borderWidth: 1, borderColor: colors.cardBorder, flexDirection: 'row', alignItems: 'center' }}>
        <AppIcon name="info_outline_rounded" color={colors.goldAccent} size={16} />
        <Text style={{ marginLeft: 10, flex: 1, color: colors.textSecondary, fontSize: 12 }}>Accurate birth time helps us provide more personalised insights.</Text>
      </View>
    </ScrollView>
  );
}

/* ---------------------------------------------------------------- step 2 */
const PLACE_SUGGESTIONS = [
  'Mumbai, Maharashtra, India', 'Delhi, India', 'Bengaluru, Karnataka, India', 'Chennai, Tamil Nadu, India',
  'Hyderabad, Telangana, India', 'Kolkata, West Bengal, India', 'Pune, Maharashtra, India', 'Ahmedabad, Gujarat, India',
  'London, United Kingdom', 'New York, USA',
];
const POPULAR_CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Hyderabad', 'Kolkata'];

function BirthPlace({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  const colors = useThemeColors();
  const [filtered, setFiltered] = useState<string[]>([]);
  const [show, setShow] = useState(false);
  const onChanged = (val: string) => {
    onChange(val);
    if (val.length > 1) {
      const f = PLACE_SUGGESTIONS.filter((s) => s.toLowerCase().includes(val.toLowerCase()));
      setFiltered(f);
      setShow(f.length > 0);
    } else setShow(false);
  };
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
      <StepTitle title={'Your Birth\nPlace'} subtitle="Enter the city and country where you were born." />
      <View style={{ borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 4 }}>
          <AppIcon name="location_on_rounded" color={colors.goldAccent} size={22} />
          <TextInput
            testID="birthProfile.place"
            value={value}
            onChangeText={onChanged}
            placeholder="Search city, state, country..."
            placeholderTextColor={colors.textMuted}
            style={{ flex: 1, marginLeft: 12, paddingVertical: 16, color: colors.textPrimary, fontSize: 15 }}
          />
        </View>
        {show ? (
          <>
            <View style={{ height: 1, backgroundColor: colors.cardBorder }} />
            {filtered.slice(0, 5).map((s, i) => (
              <Pressable
                key={s}
                testID={`birthProfile.place.suggestion.${i}`}
                android_ripple={{ color: 'rgba(201,168,76,0.1)' }}
                onPress={() => { onChange(s); setShow(false); }}
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}
              >
                <AppIcon name="location_city_rounded" color={colors.textMuted} size={16} />
                <Text style={{ marginLeft: 12, flex: 1, color: colors.textPrimary, fontSize: 14 }}>{s}</Text>
              </Pressable>
            ))}
          </>
        ) : null}
      </View>
      <Text style={{ marginTop: 24, color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 }}>POPULAR CITIES</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        {POPULAR_CITIES.map((c) => (
          <Pressable
            key={c}
            testID={`birthProfile.popular.${c.toLowerCase()}`}
            onPress={() => { onChange(`${c}, India`); setShow(false); }}
            style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, backgroundColor: colors.surfaceVariant, borderWidth: 1, borderColor: colors.cardBorder }}
          >
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{c}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

/* ---------------------------------------------------------------- screen */
export default function BirthProfileSetupScreen() {
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [profileType, setProfileType] = useState('Myself');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('Male');
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [birthPlace, setBirthPlace] = useState('');
  const [saving, setSaving] = useState(false);

  const pendingAuth = useAuthStore((s) => s.pendingAuth);
  const setUser = useAuthStore((s) => s.setUser);

  const progress = useSharedValue(1 / 3);
  useEffect(() => {
    progress.value = withTiming((currentStep + 1) / 3, { duration: 400, easing: Easing.out(Easing.cubic) });
  }, [currentStep, progress]);
  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  const handleCompleteSetup = async () => {
    if (!birthPlace.trim()) {
      showSnackBar('Please enter your birth place / location', '#CF4444');
      return;
    }
    setSaving(true);
    const cleanPhone = pendingAuth?.phone ? pendingAuth.phone.replace(/\D/g, '') : '';
    const uid = pendingAuth?.uid || (cleanPhone ? `phone_${cleanPhone}` : `user_${Date.now()}`);
    const phone = pendingAuth?.phone || '';
    const formattedDob = date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '';
    const formattedTob = time ? formatTimeOfDay(time) : '';

    let calculatedZodiac = 'Scorpio';
    let calculatedMoonSign = 'Cancer';
    let calculatedNakshatra = 'Pushya';

    try {
      const chart = await fetchCalculatedKundli({
        dob: formattedDob,
        tob: formattedTob || '12:00 PM',
        pob: birthPlace.trim(),
        name: name.trim(),
        gender,
      });
      if (chart) {
        if (chart.ascendant?.sign) calculatedZodiac = chart.ascendant.sign;
        if (chart.moonSign) calculatedMoonSign = chart.moonSign;
        if (chart.nakshatra) calculatedNakshatra = chart.nakshatra;
      }
    } catch {}

    const profileData = {
      uid,
      phone,
      name: name.trim(),
      gender,
      dob: formattedDob,
      tob: formattedTob,
      pob: birthPlace.trim(),
      profileType,
      zodiac: calculatedZodiac,
      moonSign: calculatedMoonSign,
      nakshatra: calculatedNakshatra,
    };

    try {
      // Connect and persist to same shared Firestore database via API
      await fetch(API_ENDPOINTS.saveProfile, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });
    } catch (e: any) {
      console.warn('Could not reach backend save-profile API, saving locally:', e.message);
    }

    const token = pendingAuth?.token || `session_${uid}_${Date.now()}`;
    await setUser(profileData, token);

    try {
      const serialized = JSON.stringify(profileData);
      await AsyncStorage.setItem(`astroparihar_user_birth_details_${uid}`, serialized);
      if (cleanPhone) {
        await AsyncStorage.setItem(`astroparihar_user_birth_details_${cleanPhone}`, serialized);
      }
      await AsyncStorage.setItem('astroparihar_user_birth_details', serialized);

      // Invalidate old cached kundli so this new user gets their own calculated chart
      await AsyncStorage.removeItem('astroparihar_cached_kundli');
      await AsyncStorage.removeItem(`astroparihar_cached_kundli_${uid}`);

      // Seed birth profiles list with this user's primary profile
      const primaryProfileItem = {
        id: `bp_${uid}`,
        name: profileData.name,
        type: profileType,
        dob: formattedDob,
        time: formattedTob,
        place: birthPlace.trim(),
        zodiac: calculatedZodiac,
        sign: calculatedZodiac,
        nakshatra: calculatedNakshatra,
        emoji: profileType === 'Partner' ? '❤️' : profileType === 'Child' ? '👶' : '🔮',
        color: '#9370DB',
        active: true,
      };
      await AsyncStorage.setItem(`astroparihar_birth_profiles_${uid}`, JSON.stringify([primaryProfileItem]));
      await AsyncStorage.setItem('astroparihar_birth_profiles', JSON.stringify([primaryProfileItem]));
    } catch {}

    showSnackBar('Cosmic Birth Profile successfully registered!');
    go(AppRoutes.homeDashboardScreen);
    setSaving(false);
  };

  const nextStep = () => {
    if (currentStep === 0) {
      if (!profileType) {
        showSnackBar('Please select who this profile is for', '#CF4444');
        return;
      }
      setCurrentStep(1);
      return;
    }

    if (currentStep === 1) {
      if (!name.trim()) {
        showSnackBar('Please enter your full name', '#CF4444');
        return;
      }
      if (!gender) {
        showSnackBar('Please select your gender', '#CF4444');
        return;
      }
      if (!date) {
        showSnackBar('Please select your date of birth', '#CF4444');
        return;
      }
      if (!time) {
        showSnackBar('Please select your birth time', '#CF4444');
        return;
      }
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (!birthPlace.trim()) {
        showSnackBar('Please enter your birth place / location', '#CF4444');
        return;
      }
      handleCompleteSetup();
    }
  };

  const prevStep = () => (currentStep > 0 ? setCurrentStep(currentStep - 1) : go(AppRoutes.signInScreen));

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }} testID="birthProfile.screen">
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <Pressable
          testID="birthProfile.back"
          onPress={prevStep}
          style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surfaceVariant, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' }}
        >
          <AppIcon name="arrow_back_ios_new_rounded" color={colors.textPrimary} size={18} />
        </Pressable>
        <View style={{ marginLeft: 16, flex: 1 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '700' }}>Birth Profile</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>{`Step ${currentStep + 1} of 3 • Mandatory`}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}>
        <View style={{ height: 4, borderRadius: 100, backgroundColor: colors.isLight ? '#E5E7EB' : '#1A2640', overflow: 'hidden' }}>
          <Animated.View style={[{ height: 4, backgroundColor: colors.goldAccent, borderRadius: 100 }, barStyle]} />
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <Animated.View key={`step${currentStep}`} style={{ flex: 1 }} entering={switcherEntering(width * 0.05, 350)}>
          {currentStep === 0 ? (
            <ProfileTypeSelector selectedType={profileType} onTypeSelected={setProfileType} />
          ) : currentStep === 1 ? (
            <BirthDetailsForm name={name} setName={setName} gender={gender} setGender={setGender} date={date} setDate={setDate} time={time} setTime={setTime} />
          ) : (
            <BirthPlace value={birthPlace} onChange={setBirthPlace} />
          )}
        </Animated.View>
      </View>

      <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingTop: 16, paddingBottom: insets.bottom + 24 }}>
        {currentStep > 0 ? (
          <Pressable
            testID="birthProfile.backButton"
            onPress={prevStep}
            style={{ flex: 1, marginRight: 12, paddingVertical: 18, borderRadius: 100, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', backgroundColor: colors.surfaceVariant }}
          >
            <Text style={{ color: colors.goldAccent, fontSize: 15, fontWeight: '600' }}>Back</Text>
          </Pressable>
        ) : null}
        <ElevatedButton
          testID="birthProfile.next"
          label={saving ? 'Saving...' : currentStep < 2 ? 'Continue' : 'Complete Setup'}
          onPress={nextStep}
          disabled={saving}
          style={{ flex: 2 }}
          paddingV={18}
          paddingH={0}
          fontWeight="700"
        />
      </View>
    </SafeAreaView>
  );
}
