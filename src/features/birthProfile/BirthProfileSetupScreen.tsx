/**
 * Port of lib/presentation/birth_profile_setup_screen/ (screen + 3 widgets).
 * - progress: 400 ms easeOutCubic tween to (step+1)/3
 * - AnimatedSwitcher 350 ms: slide from 5 % + fade
 * - field state lives in the parent so it survives step changes (same as Flutter controllers)
 * - Back on step 0 → go(onboarding); Skip / Complete Setup → go(home)
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedBox, AnimatedPressable, switcherEntering } from '@/components/AnimatedBox';
import { AppIcon } from '@/components/AppIcon';
import { ElevatedButton } from '@/components/common';
import { formatTimeOfDay, pickDate, pickTime } from '@/components/pickers';
import { lh, Text, TextInput } from '@/components/Text';
import { API_ENDPOINTS } from '@/config/api';
import { AppRoutes, go } from '@/navigation/routes';
import { argb } from '@/theme/colors';

/* ---------------------------------------------------------------- step 0 */
const PROFILE_TYPES = [
  { label: 'Myself', icon: 'person_rounded', emoji: '🧘' },
  { label: 'Partner', icon: 'favorite_rounded', emoji: '❤️' },
  { label: 'Child', icon: 'child_care_rounded', emoji: '👶' },
  { label: 'Family', icon: 'family_restroom_rounded', emoji: '👨‍👩‍👧' },
  { label: 'Other', icon: 'people_alt_rounded', emoji: '✨' },
];

function StepTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <Text style={{ color: '#F0EAD6', fontWeight: '800', ...lh(28, 1.2) }}>{title}</Text>
      <Text style={{ marginTop: 8, color: '#A0A8C0', fontSize: 14 }}>{subtitle}</Text>
      <View style={{ height: 32 }} />
    </>
  );
}

function ProfileTypeSelector({ selectedType, onTypeSelected }: { selectedType: string; onTypeSelected: (t: string) => void }) {
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
              backgroundColor: sel ? argb('1A8B1A1A') : argb('0FFFFFFF'),
              borderColor: sel ? '#8B1A1A' : argb('1AC9A84C'), borderWidth: sel ? 1.5 : 1,
            }}
          >
            <View style={{ width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: sel ? argb('268B1A1A') : argb('0FC9A84C') }}>
              <Text style={{ fontSize: 24 }}>{t.emoji}</Text>
            </View>
            <Text style={{ marginLeft: 16, flex: 1, color: sel ? '#F0EAD6' : '#A0A8C0', fontSize: 17, fontWeight: sel ? '700' : '500' }}>{t.label}</Text>
            <AnimatedBox
              duration={200}
              style={{
                width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center',
                backgroundColor: sel ? '#8B1A1A' : 'transparent', borderColor: sel ? '#8B1A1A' : '#2A3550',
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
  return (
    <View style={{ paddingHorizontal: 18, paddingVertical: 14, borderRadius: 16, backgroundColor: argb('0FFFFFFF'), borderWidth: 1, borderColor: argb('1AC9A84C') }}>
      <Text style={{ color: '#6B7A99', fontSize: 11, fontWeight: '600', letterSpacing: 0.8 }}>{label}</Text>
      <View style={{ height: 8 }} />
      {children}
    </View>
  );
}

function BirthDetailsForm(p: {
  name: string; setName: (s: string) => void; gender: string; setGender: (g: string) => void;
  date: Date | null; setDate: (d: Date) => void; time: Date | null; setTime: (d: Date) => void;
}) {
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
      <StepTitle title={'Your Birth\nDetails'} subtitle="Accurate details help us generate your precise Kundli." />
      <GlassField label="Full Name">
        <TextInput
          testID="birthProfile.name"
          value={p.name}
          onChangeText={p.setName}
          placeholder="Enter your full name"
          style={{ color: '#F0EAD6', fontSize: 16 }}
        />
      </GlassField>
      <View style={{ height: 16 }} />
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderRadius: 16,
          backgroundColor: argb('0FFFFFFF'),
          borderWidth: 1,
          borderColor: argb('1AC9A84C'),
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ color: '#6B7A99', fontSize: 11, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' }}>
            Gender
          </Text>
          {p.gender ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#C9A84C', marginRight: 5 }} />
              <Text style={{ color: '#C9A84C', fontSize: 11, fontWeight: '600' }}>
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
                  borderColor: sel ? '#C9A84C' : argb('1AC9A84C'),
                  backgroundColor: sel ? argb('268B1A1A') : argb('08FFFFFF'),
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 6,
                  overflow: 'hidden',
                }}
              >
                {sel && (
                  <LinearGradient
                    colors={['#8B1A1A', '#520D0D']}
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
                    backgroundColor: sel ? argb('33C9A84C') : argb('0FFFFFFF'),
                    marginRight: 6,
                  }}
                >
                  <AppIcon
                    name={opt.icon}
                    size={16}
                    color={sel ? '#C9A84C' : '#8F9CAE'}
                  />
                </View>

                <Text
                  style={{
                    color: sel ? '#F0EAD6' : '#8F9CAE',
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
            <AppIcon name="calendar_month_rounded" color="#C9A84C" size={20} />
            <Text style={{ marginLeft: 12, fontSize: 15, color: p.date ? '#F0EAD6' : '#6B7A99' }}>
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
            <AppIcon name="access_time_rounded" color="#C9A84C" size={20} />
            <Text style={{ marginLeft: 12, fontSize: 15, color: p.time ? '#F0EAD6' : '#6B7A99' }}>
              {p.time ? formatTimeOfDay(p.time) : 'Select birth time'}
            </Text>
          </View>
        </GlassField>
      </Pressable>
      <View style={{ marginTop: 12, padding: 14, borderRadius: 12, backgroundColor: argb('0FC9A84C'), borderWidth: 1, borderColor: argb('1AC9A84C'), flexDirection: 'row', alignItems: 'center' }}>
        <AppIcon name="info_outline_rounded" color="#C9A84C" size={16} />
        <Text style={{ marginLeft: 10, flex: 1, color: '#A0A8C0', fontSize: 12 }}>Accurate birth time helps us provide more personalised insights.</Text>
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
      <View style={{ borderRadius: 16, backgroundColor: argb('0FFFFFFF'), borderWidth: 1, borderColor: argb('1AC9A84C'), overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 4 }}>
          <AppIcon name="location_on_rounded" color="#C9A84C" size={22} />
          <TextInput
            testID="birthProfile.place"
            value={value}
            onChangeText={onChanged}
            placeholder="Search city, state, country..."
            style={{ flex: 1, marginLeft: 12, paddingVertical: 16, color: '#F0EAD6', fontSize: 15 }}
          />
        </View>
        {show ? (
          <>
            <View style={{ height: 1, backgroundColor: argb('1AC9A84C') }} />
            {filtered.slice(0, 5).map((s, i) => (
              <Pressable
                key={s}
                testID={`birthProfile.place.suggestion.${i}`}
                android_ripple={{ color: 'rgba(201,168,76,0.1)' }}
                onPress={() => { onChange(s); setShow(false); }}
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}
              >
                <AppIcon name="location_city_rounded" color="#6B7A99" size={16} />
                <Text style={{ marginLeft: 12, flex: 1, color: '#A0A8C0', fontSize: 14 }}>{s}</Text>
              </Pressable>
            ))}
          </>
        ) : null}
      </View>
      <Text style={{ marginTop: 24, color: '#6B7A99', fontSize: 11, fontWeight: '700', letterSpacing: 1.2 }}>POPULAR CITIES</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        {POPULAR_CITIES.map((c) => (
          <Pressable
            key={c}
            testID={`birthProfile.popular.${c.toLowerCase()}`}
            onPress={() => { onChange(`${c}, India`); setShow(false); }}
            style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, backgroundColor: argb('0FFFFFFF'), borderWidth: 1, borderColor: argb('1AC9A84C') }}
          >
            <Text style={{ color: '#A0A8C0', fontSize: 13 }}>{c}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

import { showSnackBar } from '@/components/overlays';
import { useAuthStore } from '@/features/auth/authStore';

/* ---------------------------------------------------------------- screen */
export default function BirthProfileSetupScreen() {
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
    setSaving(true);
    const uid = pendingAuth?.uid || `phone_${Date.now()}`;
    const phone = pendingAuth?.phone || '';
    const formattedDob = date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '';
    const formattedTob = time ? formatTimeOfDay(time) : '';

    const profileData = {
      uid,
      phone,
      name: name.trim() || 'Seeker',
      gender,
      dob: formattedDob,
      tob: formattedTob,
      pob: birthPlace.trim(),
      profileType,
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

    await setUser(profileData);
    showSnackBar('Cosmic Profile successfully registered!');
    go(AppRoutes.homeDashboardScreen);
    setSaving(false);
  };

  const nextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCompleteSetup();
    }
  };

  const prevStep = () => (currentStep > 0 ? setCurrentStep(currentStep - 1) : go(AppRoutes.signInScreen));

  const handleSkip = async () => {
    const uid = pendingAuth?.uid || `phone_${Date.now()}`;
    const phone = pendingAuth?.phone || '';
    await setUser({
      uid,
      phone,
      name: 'Seeker',
      profileType: 'Myself',
    });
    go(AppRoutes.homeDashboardScreen);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#080D1A' }} testID="birthProfile.screen">
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <Pressable
          testID="birthProfile.back"
          onPress={prevStep}
          style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: argb('0FFFFFFF'), borderWidth: 1, borderColor: argb('1AC9A84C'), alignItems: 'center', justifyContent: 'center' }}
        >
          <AppIcon name="arrow_back_ios_new_rounded" color="#F0EAD6" size={18} />
        </Pressable>
        <View style={{ marginLeft: 16, flex: 1 }}>
          <Text style={{ color: '#F0EAD6', fontSize: 20, fontWeight: '700' }}>Birth Profile</Text>
          <Text style={{ color: '#6B7A99', fontSize: 12 }}>{`Step ${currentStep + 1} of 3`}</Text>
        </View>
        <Pressable testID="birthProfile.skip" onPress={handleSkip} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
          <Text style={{ color: '#6B7A99', fontSize: 14 }}>Skip</Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}>
        <View style={{ height: 4, borderRadius: 100, backgroundColor: '#1A2640', overflow: 'hidden' }}>
          <Animated.View style={[{ height: 4, backgroundColor: '#C9A84C', borderRadius: 100 }, barStyle]} />
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
            style={{ flex: 1, marginRight: 12, paddingVertical: 18, borderRadius: 100, borderWidth: 1, borderColor: argb('33C9A84C'), alignItems: 'center' }}
          >
            <Text style={{ color: '#C9A84C', fontSize: 15, fontWeight: '600' }}>Back</Text>
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
