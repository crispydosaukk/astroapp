import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export interface UserProfile {
  uid: string;
  phone: string;
  name?: string;
  gender?: string;
  dob?: string;
  tob?: string;
  pob?: string;
  profileType?: string;
}

export interface PendingAuth {
  uid: string;
  phone: string;
  isNewUser: boolean;
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
  hydrated: boolean;
  load: () => Promise<void>;
  setUser: (user: UserProfile | null, token?: string | null) => Promise<void>;
  setPendingAuth: (pending: PendingAuth | null) => void;
  setOnboardingCompleted: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  hasCompletedOnboarding: false,
  pendingAuth: null,
  hydrated: false,

  load: async () => {
    try {
      const [storedUser, storedToken, storedOnboarding] = await Promise.all([
        AsyncStorage.getItem(STORAGE_USER_KEY),
        AsyncStorage.getItem(STORAGE_TOKEN_KEY),
        AsyncStorage.getItem(STORAGE_ONBOARDING_KEY),
      ]);

      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      const isAuth = !!parsedUser && !!storedToken;
      const completedOnboarding = storedOnboarding === 'true';

      set({
        user: parsedUser,
        token: storedToken,
        isAuthenticated: isAuth,
        hasCompletedOnboarding: completedOnboarding,
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },

  setUser: async (user, token = null) => {
    set({
      user,
      token,
      isAuthenticated: !!user,
      pendingAuth: null,
      hasCompletedOnboarding: true,
    });

    try {
      if (user) {
        await AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
        await AsyncStorage.setItem(STORAGE_ONBOARDING_KEY, 'true');
        if (token) await AsyncStorage.setItem(STORAGE_TOKEN_KEY, token);
      } else {
        await AsyncStorage.removeItem(STORAGE_USER_KEY);
        await AsyncStorage.removeItem(STORAGE_TOKEN_KEY);
      }
    } catch {}
  },

  setPendingAuth: (pending) => {
    set({ pendingAuth: pending });
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
      await AsyncStorage.removeItem(STORAGE_USER_KEY);
      await AsyncStorage.removeItem(STORAGE_TOKEN_KEY);
    } catch {}
  },
}));
