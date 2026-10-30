import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export interface UserProfile {
  uid: string;
  phone: string;
  name?: string;
  email?: string;
  gender?: string;
  dob?: string;
  tob?: string;
  pob?: string;
  profileType?: string;
  zodiac?: string;
  moonSign?: string;
  nakshatra?: string;
}

export interface PendingAuth {
  uid: string;
  phone: string;
  isNewUser: boolean;
  token?: string;
}

export interface PostLoginRedirect {
  route: string;
  extra?: any;
  popOnSuccess?: boolean;
}

const STORAGE_USER_KEY = 'astroparihar_auth_user';
const STORAGE_TOKEN_KEY = 'astroparihar_auth_token';
const STORAGE_ONBOARDING_KEY = 'astroparihar_onboarding_completed';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  pendingAuth: PendingAuth | null;
  postLoginRedirect: PostLoginRedirect | null;
  hydrated: boolean;
  load: () => Promise<void>;
  setUser: (user: UserProfile | null, token?: string | null) => Promise<void>;
  updateUserProfile: (partial: Partial<UserProfile>) => Promise<void>;
  setPendingAuth: (pending: PendingAuth | null) => void;
  setPostLoginRedirect: (redirect: PostLoginRedirect | null) => void;
  setOnboardingCompleted: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  hasCompletedOnboarding: false,
  pendingAuth: null,
  postLoginRedirect: null,
  hydrated: false,

  load: async () => {
    try {
      const [storedUser, storedToken, storedOnboarding] = await Promise.all([
        AsyncStorage.getItem(STORAGE_USER_KEY),
        AsyncStorage.getItem(STORAGE_TOKEN_KEY),
        AsyncStorage.getItem(STORAGE_ONBOARDING_KEY),
      ]);

      const parsedUser: UserProfile | null = storedUser ? JSON.parse(storedUser) : null;
      const isAuth = !!parsedUser && (!!storedToken || !!parsedUser.uid || !!parsedUser.phone);
      const completedOnboarding = storedOnboarding === 'true';

      set({
        user: parsedUser,
        token: storedToken || (parsedUser?.uid ? `session_${parsedUser.uid}` : null),
        isAuthenticated: isAuth,
        hasCompletedOnboarding: completedOnboarding,
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },

  setUser: async (user, token = null) => {
    const effectiveToken = token || (user ? `session_${user.uid}_${Date.now()}` : null);
    set({
      user,
      token: effectiveToken,
      isAuthenticated: !!user,
      pendingAuth: null,
      hasCompletedOnboarding: true,
    });

    try {
      if (user) {
        await AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
        await AsyncStorage.setItem(STORAGE_ONBOARDING_KEY, 'true');
        if (effectiveToken) await AsyncStorage.setItem(STORAGE_TOKEN_KEY, effectiveToken);

        // Save user-scoped birth details so each user has their own isolated record
        const userKey = `astroparihar_user_birth_details_${user.uid}`;
        const phoneKey = user.phone ? `astroparihar_user_birth_details_${user.phone.replace(/\D/g, '')}` : null;
        const detailsToSave = {
          uid: user.uid,
          phone: user.phone,
          name: user.name || '',
          email: user.email || '',
          gender: user.gender || '',
          dob: user.dob || '',
          tob: user.tob || '',
          pob: user.pob || '',
          profileType: user.profileType || 'Myself',
          zodiac: user.zodiac,
          moonSign: user.moonSign,
          nakshatra: user.nakshatra,
        };
        await AsyncStorage.setItem(userKey, JSON.stringify(detailsToSave));
        if (phoneKey) await AsyncStorage.setItem(phoneKey, JSON.stringify(detailsToSave));
        await AsyncStorage.setItem('astroparihar_user_birth_details', JSON.stringify(detailsToSave));
      } else {
        await AsyncStorage.removeItem(STORAGE_USER_KEY);
        await AsyncStorage.removeItem(STORAGE_TOKEN_KEY);
      }
    } catch {}
  },

  updateUserProfile: async (partial: Partial<UserProfile>) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...partial };
    set({ user: updated });
    try {
      await AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updated));
      const userKey = `astroparihar_user_birth_details_${updated.uid}`;
      const phoneKey = updated.phone ? `astroparihar_user_birth_details_${updated.phone.replace(/\D/g, '')}` : null;
      await AsyncStorage.setItem(userKey, JSON.stringify(updated));
      if (phoneKey) await AsyncStorage.setItem(phoneKey, JSON.stringify(updated));
      await AsyncStorage.setItem('astroparihar_user_birth_details', JSON.stringify(updated));
      // Invalidate active kundli cache so next view generates fresh calculations for updated details
      await AsyncStorage.removeItem('astroparihar_cached_kundli');
      await AsyncStorage.removeItem(`astroparihar_cached_kundli_${updated.uid}`);
    } catch {}
  },

  setPendingAuth: (pending) => {
    set({ pendingAuth: pending });
  },

  setPostLoginRedirect: (redirect) => {
    set({ postLoginRedirect: redirect });
  },

  setOnboardingCompleted: async () => {
    set({ hasCompletedOnboarding: true });
    try {
      await AsyncStorage.setItem(STORAGE_ONBOARDING_KEY, 'true');
    } catch {}
  },

  logout: async () => {
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      pendingAuth: null,
    });
    try {
      // Clear global active session keys so the next user doesn't inherit any data
      await AsyncStorage.multiRemove([
        STORAGE_USER_KEY,
        STORAGE_TOKEN_KEY,
        'astroparihar_wallet_balance',
        'astroparihar_wallet_transactions',
        'astroparihar_user_birth_details',
        'astroparihar_cached_kundli',
      ]);
    } catch {}
  },
}));
