import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { useAuthStore, UserProfile } from '@/features/auth/authStore';
import { fetchCalculatedKundli } from '@/services/astrologyService';

export interface BirthProfile {
  id: string;
  name: string;
  type: string; // 'Myself' | 'Partner' | 'Child' | 'Parent' | 'Family' | 'Other'
  gender?: string; // 'Male' | 'Female' | 'Other'
  dob: string; // YYYY-MM-DD or readable date string
  time: string; // e.g. 10:30 AM
  place: string; // e.g. New Delhi, India
  zodiac: string; // e.g. Scorpio
  sign: string;
  moonSign?: string;
  nakshatra: string; // e.g. Pushya
  emoji: string;
  color: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const PROFILE_RELATION_TYPES = [
  { label: 'Myself', emoji: '🧘', color: '#C9A84C' },
  { label: 'Partner', emoji: '❤️', color: '#FF6B6B' },
  { label: 'Child', emoji: '👶', color: '#4FC3F7' },
  { label: 'Parent', emoji: '👴', color: '#9370DB' },
  { label: 'Family', emoji: '👨‍👩‍👧', color: '#2D9E6B' },
  { label: 'Other', emoji: '✨', color: '#FFB347' },
] as const;

export function getRelationMeta(type?: string) {
  const match = PROFILE_RELATION_TYPES.find(
    (r) => r.label.toLowerCase() === (type || '').toLowerCase()
  );
  return match || { label: type || 'Family', emoji: '🌟', color: '#C9A84C' };
}

const STORAGE_PROFILES_KEY = 'astroparihar_birth_profiles';

function getUserStorageKey(user: UserProfile | null): string {
  if (user?.uid) return `astroparihar_birth_profiles_${user.uid}`;
  if (user?.phone) {
    const cleanPhone = user.phone.replace(/\D/g, '');
    if (cleanPhone) return `astroparihar_birth_profiles_${cleanPhone}`;
  }
  return STORAGE_PROFILES_KEY;
}

interface BirthProfileState {
  profiles: BirthProfile[];
  activeProfile: BirthProfile | null;
  loading: boolean;
  loadProfiles: () => Promise<BirthProfile[]>;
  setActiveProfile: (profileId: string) => Promise<BirthProfile | null>;
  addProfile: (
    data: {
      name: string;
      type: string;
      gender?: string;
      dob: string;
      time?: string;
      place?: string;
      setAsActive?: boolean;
    }
  ) => Promise<BirthProfile>;
  updateProfile: (
    profileId: string,
    data: Partial<{
      name: string;
      type: string;
      gender: string;
      dob: string;
      time: string;
      place: string;
    }>
  ) => Promise<BirthProfile | null>;
  deleteProfile: (profileId: string) => Promise<void>;
}

export const useBirthProfileStore = create<BirthProfileState>((set, get) => ({
  profiles: [],
  activeProfile: null,
  loading: false,

  loadProfiles: async () => {
    set({ loading: true });
    try {
      const authUser = useAuthStore.getState().user;
      const storageKey = getUserStorageKey(authUser);
      const stored = await AsyncStorage.getItem(storageKey);

      let list: BirthProfile[] = [];
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            list = parsed;
          }
        } catch {}
      }

      // If user is logged in, ensure at least primary profile exists
      if (list.length === 0) {
        const meta = getRelationMeta(authUser?.profileType || 'Myself');
        const defaultProfile: BirthProfile = {
          id: `bp_${authUser?.uid || Date.now()}`,
          name: authUser?.name?.trim() || 'My Profile',
          type: authUser?.profileType || 'Myself',
          gender: authUser?.gender || 'Male',
          dob: authUser?.dob || '1995-10-15',
          time: authUser?.tob || '12:00 PM',
          place: authUser?.pob || 'New Delhi, India',
          zodiac: authUser?.zodiac || 'Scorpio',
          sign: authUser?.zodiac || 'Scorpio',
          moonSign: authUser?.moonSign || 'Cancer',
          nakshatra: authUser?.nakshatra || 'Pushya',
          emoji: meta.emoji,
          color: meta.color,
          active: true,
          createdAt: new Date().toISOString(),
        };
        list = [defaultProfile];
        await AsyncStorage.setItem(storageKey, JSON.stringify(list));
        await AsyncStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(list));
      }

      // Ensure at least one profile is active
      let activeItem = list.find((p) => p.active);
      if (!activeItem) {
        list[0].active = true;
        activeItem = list[0];
      }

      set({ profiles: list, activeProfile: activeItem, loading: false });
      return list;
    } catch {
      set({ loading: false });
      return [];
    }
  },

  setActiveProfile: async (profileId: string) => {
    const { profiles } = get();
    const target = profiles.find((p) => p.id === profileId);
    if (!target) return null;

    const updatedList = profiles.map((p) => ({
      ...p,
      active: p.id === profileId,
    }));

    const activatedProfile = { ...target, active: true };
    set({ profiles: updatedList, activeProfile: activatedProfile });

    try {
      const authUser = useAuthStore.getState().user;
      const storageKey = getUserStorageKey(authUser);
      await AsyncStorage.setItem(storageKey, JSON.stringify(updatedList));
      await AsyncStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(updatedList));

      // Sync active profile details to auth store so the entire app reflects it immediately
      await useAuthStore.getState().updateUserProfile({
        name: activatedProfile.name,
        gender: activatedProfile.gender || 'Male',
        dob: activatedProfile.dob,
        tob: activatedProfile.time,
        pob: activatedProfile.place,
        profileType: activatedProfile.type,
        zodiac: activatedProfile.zodiac || activatedProfile.sign,
        moonSign: activatedProfile.moonSign,
        nakshatra: activatedProfile.nakshatra,
      });

      // Clear cached chart so fresh calculations run for this active profile
      await AsyncStorage.removeItem('astroparihar_cached_kundli');
      if (authUser?.uid) {
        await AsyncStorage.removeItem(`astroparihar_cached_kundli_${authUser.uid}`);
      }
    } catch (e: any) {
      console.warn('Error setting active birth profile:', e?.message);
    }

    return activatedProfile;
  },

  addProfile: async (data) => {
    const authUser = useAuthStore.getState().user;
    const meta = getRelationMeta(data.type);

    let calculatedZodiac = 'Scorpio';
    let calculatedMoonSign = 'Cancer';
    let calculatedNakshatra = 'Pushya';

    if (data.dob) {
      try {
        const chart = await fetchCalculatedKundli({
          dob: data.dob,
          tob: data.time || '12:00 PM',
          pob: data.place || 'New Delhi, India',
          name: data.name.trim(),
          gender: data.gender || 'Male',
        });
        if (chart) {
          if (chart.ascendant?.sign) calculatedZodiac = chart.ascendant.sign;
          if (chart.moonSign) calculatedMoonSign = chart.moonSign;
          if (chart.nakshatra) calculatedNakshatra = chart.nakshatra;
        }
      } catch {}
    }

    const newProfile: BirthProfile = {
      id: `bp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: data.name.trim(),
      type: data.type || 'Family',
      gender: data.gender || 'Male',
      dob: data.dob.trim(),
      time: data.time?.trim() || '12:00 PM',
      place: data.place?.trim() || 'New Delhi, India',
      zodiac: calculatedZodiac,
      sign: calculatedZodiac,
      moonSign: calculatedMoonSign,
      nakshatra: calculatedNakshatra,
      emoji: meta.emoji,
      color: meta.color,
      active: !!data.setAsActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const currentProfiles = get().profiles;
    let nextList: BirthProfile[];

    if (newProfile.active) {
      nextList = currentProfiles.map((p) => ({ ...p, active: false })).concat(newProfile);
    } else {
      nextList = [...currentProfiles, newProfile];
    }

    set({
      profiles: nextList,
      activeProfile: newProfile.active ? newProfile : get().activeProfile,
    });

    try {
      const storageKey = getUserStorageKey(authUser);
      await AsyncStorage.setItem(storageKey, JSON.stringify(nextList));
      await AsyncStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(nextList));

      if (newProfile.active) {
        await useAuthStore.getState().updateUserProfile({
          name: newProfile.name,
          gender: newProfile.gender,
          dob: newProfile.dob,
          tob: newProfile.time,
          pob: newProfile.place,
          profileType: newProfile.type,
          zodiac: newProfile.zodiac,
          moonSign: newProfile.moonSign,
          nakshatra: newProfile.nakshatra,
        });
        await AsyncStorage.removeItem('astroparihar_cached_kundli');
      }
    } catch (e: any) {
      console.warn('Error saving added birth profile:', e?.message);
    }

    return newProfile;
  },

  updateProfile: async (profileId: string, partial) => {
    const { profiles } = get();
    const index = profiles.findIndex((p) => p.id === profileId);
    if (index === -1) return null;

    const existing = profiles[index];
    const updatedType = partial.type !== undefined ? partial.type : existing.type;
    const meta = getRelationMeta(updatedType);

    const nextDob = partial.dob !== undefined ? partial.dob : existing.dob;
    const nextTob = partial.time !== undefined ? partial.time : existing.time;
    const nextPob = partial.place !== undefined ? partial.place : existing.place;
    const nextName = partial.name !== undefined ? partial.name.trim() : existing.name;
    const nextGender = partial.gender !== undefined ? partial.gender : existing.gender;

    let nextZodiac = existing.zodiac;
    let nextMoonSign = existing.moonSign;
    let nextNakshatra = existing.nakshatra;

    // Recalculate Vedic signs if DOB / TOB / POB changed
    if (nextDob && (nextDob !== existing.dob || nextTob !== existing.time || nextPob !== existing.place)) {
      try {
        const chart = await fetchCalculatedKundli({
          dob: nextDob,
          tob: nextTob || '12:00 PM',
          pob: nextPob || 'New Delhi, India',
          name: nextName,
          gender: nextGender || 'Male',
        });
        if (chart) {
          if (chart.ascendant?.sign) nextZodiac = chart.ascendant.sign;
          if (chart.moonSign) nextMoonSign = chart.moonSign;
          if (chart.nakshatra) nextNakshatra = chart.nakshatra;
        }
      } catch {}
    }

    const updatedProfile: BirthProfile = {
      ...existing,
      name: nextName,
      type: updatedType,
      gender: nextGender,
      dob: nextDob,
      time: nextTob,
      place: nextPob,
      zodiac: nextZodiac,
      sign: nextZodiac,
      moonSign: nextMoonSign,
      nakshatra: nextNakshatra,
      emoji: meta.emoji,
      color: meta.color,
      updatedAt: new Date().toISOString(),
    };

    const nextList = [...profiles];
    nextList[index] = updatedProfile;

    const authUser = useAuthStore.getState().user;
    const storageKey = getUserStorageKey(authUser);

    set({
      profiles: nextList,
      activeProfile: updatedProfile.active ? updatedProfile : get().activeProfile,
    });

    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(nextList));
      await AsyncStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(nextList));

      if (updatedProfile.active) {
        await useAuthStore.getState().updateUserProfile({
          name: updatedProfile.name,
          gender: updatedProfile.gender,
          dob: updatedProfile.dob,
          tob: updatedProfile.time,
          pob: updatedProfile.place,
          profileType: updatedProfile.type,
          zodiac: updatedProfile.zodiac,
          moonSign: updatedProfile.moonSign,
          nakshatra: updatedProfile.nakshatra,
        });
        await AsyncStorage.removeItem('astroparihar_cached_kundli');
      }
    } catch (e: any) {
      console.warn('Error updating birth profile:', e?.message);
    }

    return updatedProfile;
  },

  deleteProfile: async (profileId: string) => {
    const { profiles, activeProfile } = get();
    if (profiles.length <= 1) {
      return; // Keep at least one profile
    }

    const nextList = profiles.filter((p) => p.id !== profileId);
    let nextActive = activeProfile;

    if (activeProfile?.id === profileId) {
      nextActive = nextList[0];
      nextList[0].active = true;
    }

    set({ profiles: nextList, activeProfile: nextActive });

    try {
      const authUser = useAuthStore.getState().user;
      const storageKey = getUserStorageKey(authUser);
      await AsyncStorage.setItem(storageKey, JSON.stringify(nextList));
      await AsyncStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(nextList));

      if (nextActive && activeProfile?.id === profileId) {
        await useAuthStore.getState().updateUserProfile({
          name: nextActive.name,
          gender: nextActive.gender,
          dob: nextActive.dob,
          tob: nextActive.time,
          pob: nextActive.place,
          profileType: nextActive.type,
          zodiac: nextActive.zodiac,
          moonSign: nextActive.moonSign,
          nakshatra: nextActive.nakshatra,
        });
        await AsyncStorage.removeItem('astroparihar_cached_kundli');
      }
    } catch (e: any) {
      console.warn('Error deleting birth profile:', e?.message);
    }
  },
}));

