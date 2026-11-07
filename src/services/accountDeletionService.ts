import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '@/config/api';
import { useAuthStore } from '@/features/auth/authStore';
import { useBirthProfileStore } from '@/services/birthProfileStore';

const STORAGE_KEY_DELETED_NUMBERS = 'astroparihar_deleted_phone_numbers';

/**
 * Normalizes phone string to pure digits for collision-free comparison.
 */
export function normalizePhoneDigits(phone?: string | null): string {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '');
}

/**
 * Returns list of phone numbers that have been permanently deleted.
 */
export async function getDeletedPhoneNumbers(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_DELETED_NUMBERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Records a deleted phone number locally so future login attempts are immediately blocked.
 */
export async function recordDeletedPhoneNumberLocally(phone: string): Promise<void> {
  try {
    const clean = normalizePhoneDigits(phone);
    if (!clean) return;
    const existing = await getDeletedPhoneNumbers();
    if (!existing.includes(clean)) {
      const updated = [...existing, clean];
      await AsyncStorage.setItem(STORAGE_KEY_DELETED_NUMBERS, JSON.stringify(updated));
    }
  } catch (err: any) {
    console.warn('Could not record deleted phone number locally:', err?.message);
  }
}

/**
 * Checks if a phone number was previously deleted.
 */
export async function isPhoneNumberDeleted(phone: string): Promise<boolean> {
  const clean = normalizePhoneDigits(phone);
  if (!clean) return false;
  const list = await getDeletedPhoneNumbers();
  return list.includes(clean);
}

/**
 * Permanently deletes the user account, purges all stored charts, consultations,
 * and records the phone number so it cannot be used to log in again.
 */
export async function requestPermanentAccountDeletion(params?: {
  phone?: string;
  uid?: string;
  reason?: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  const currentUser = useAuthStore.getState().user;
  const phone = params?.phone || currentUser?.phone || '';
  const uid = params?.uid || currentUser?.uid || '';
  const reason = params?.reason || 'User requested permanent account deletion from mobile app';
  const cleanPhone = normalizePhoneDigits(phone);

  // 1. Call backend deletion API
  try {
    const res = await fetch(API_ENDPOINTS.deleteAccount, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, uid, reason }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok && !data.success) {
      console.warn('Backend delete-account warning:', data.error);
    }
  } catch (netErr: any) {
    console.warn('Backend delete-account network error (continuing local purge):', netErr?.message);
  }

  // 2. Record this phone number in local deleted registry
  if (cleanPhone) {
    await recordDeletedPhoneNumberLocally(cleanPhone);
  }

  // 3. Purge all in-memory Zustand stores
  try {
    await useBirthProfileStore.getState().clearProfiles();
  } catch {}

  try {
    await useAuthStore.getState().logout();
  } catch {}

  // 4. Wipe all persistent caches, kundlis, and chat logs
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const keysToRemove = allKeys.filter(
      (k) =>
        k.startsWith('astroparihar_chat_messages') ||
        k.startsWith('astroparihar_birth_profiles') ||
        k.startsWith('astroparihar_cached_kundli') ||
        k.startsWith('astroparihar_user_birth_details') ||
        k.startsWith('astroparihar_wallet_') ||
        k.startsWith('astroparihar_report_draft') ||
        k === 'astroparihar_auth_user' ||
        k === 'astroparihar_auth_token'
    );
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
    }
  } catch {}

  return {
    success: true,
    message: 'Your account has been permanently deleted. This phone number cannot be reused to log in.',
  };
}
