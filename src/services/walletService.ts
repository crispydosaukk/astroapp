import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIVE_BASE_URL } from '@/config/api';
import { deductMinuteBilling, deductServiceWallet } from './consultationService';

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  title: string;
  subtitle: string;
  amount: number | string;
  date: string;
  status?: string;
  icon?: string;
}

const STORAGE_KEY_BALANCE = 'astroparihar_wallet_balance';
const STORAGE_KEY_TX = 'astroparihar_wallet_transactions';

const FIREBASE_PROJECT_ID = 'astroparihar-85e2d';
const FIREBASE_API_KEY = 'AIzaSyCXZ9S7Th0lpAVLMnZnRlgusCH1dPgF98g';
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

const listeners = new Set<(balance: number) => void>();

export function notifyBalance(newBalance: number) {
  listeners.forEach((listener) => {
    try {
      listener(newBalance);
    } catch {}
  });
}

export function subscribeWallet(listener: (balance: number) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Fetch wallet balance with 100% parity with live website:
 * 1. Queries user document from Firestore (users/{uid})
 * 2. Caches into AsyncStorage and notifies all balance listeners
 */
export async function getWalletBalance(): Promise<number> {
  try {
    const storedAuth = await AsyncStorage.getItem('astroparihar_auth_user');
    if (!storedAuth) {
      return 0;
    }

    const parsedUser = JSON.parse(storedAuth);
    const uid = parsedUser?.uid || parsedUser?.phone;

    // 1. Live Firestore sync
    if (uid) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        const url = `${FIRESTORE_BASE_URL}/users/${encodeURIComponent(uid)}?key=${FIREBASE_API_KEY}`;
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);

        if (res.ok) {
          const userData = await res.json();
          const rawBal = userData.fields?.walletBalance;
          if (rawBal) {
            const balNum =
              rawBal.doubleValue !== undefined
                ? Number(rawBal.doubleValue)
                : rawBal.integerValue !== undefined
                ? Number(rawBal.integerValue)
                : 0;

            if (!isNaN(balNum)) {
              await AsyncStorage.setItem(STORAGE_KEY_BALANCE, String(balNum));
              return balNum;
            }
          }
        }
      } catch (firestoreErr) {
        console.warn('Firestore balance fetch error, falling back to local/backend:', firestoreErr);
      }
    }

    // 2. Fallback to cached local storage
    const cached = await AsyncStorage.getItem(STORAGE_KEY_BALANCE);
    if (cached !== null) {
      const num = Number(cached);
      if (!isNaN(num)) return num;
    }
  } catch (err) {
    console.warn('Error reading wallet balance:', err);
  }

  return 0;
}

/**
 * Fetch wallet transaction history:
 * Reads subcollection users/{uid}/wallet_transactions from Firestore
 */
export async function getWalletTransactions(): Promise<WalletTransaction[]> {
  try {
    const storedAuth = await AsyncStorage.getItem('astroparihar_auth_user');
    if (!storedAuth) {
      return [];
    }

    const parsedUser = JSON.parse(storedAuth);
    const uid = parsedUser?.uid || parsedUser?.phone;

    if (uid) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        const url = `${FIRESTORE_BASE_URL}/users/${encodeURIComponent(uid)}/wallet_transactions?key=${FIREBASE_API_KEY}&pageSize=20`;
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.documents) && data.documents.length > 0) {
            const formatted: WalletTransaction[] = data.documents.map((doc: any) => {
              const f = doc.fields || {};
              const isCredit = f.type?.stringValue === 'credit';
              const amtNum = f.amount?.doubleValue ?? f.amount?.integerValue ?? 0;
              return {
                id: doc.name?.split('/').pop() || String(Math.random()),
                type: isCredit ? 'credit' : 'debit',
                title: f.description?.stringValue || f.title?.stringValue || (isCredit ? 'Wallet Recharge' : 'Astrology Service'),
                subtitle: f.serviceType?.stringValue || (isCredit ? 'UPI / Online' : 'Consultation'),
                amount: isCredit ? `+₹${amtNum}` : `-₹${amtNum}`,
                date: f.date?.stringValue ? new Date(f.date.stringValue).toLocaleDateString() : 'Recently',
                icon: isCredit ? '💳' : '📞',
                status: f.status?.stringValue || 'success',
              };
            });

            await AsyncStorage.setItem(STORAGE_KEY_TX, JSON.stringify(formatted));
            return formatted;
          }
        }
      } catch (txErr) {
        console.warn('Live transactions fetch error:', txErr);
      }
    }

    const cached = await AsyncStorage.getItem(STORAGE_KEY_TX);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    console.warn('Error fetching transactions:', err);
  }

  return [];
}

/**
 * Create Payment Order for Razorpay / UPI
 */
export async function createPaymentOrder(amount: number): Promise<{
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}> {
  return {
    orderId: `order_m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    amount: amount * 100,
    currency: 'INR',
    keyId: 'rzp_live_astroparihar',
  };
}

/**
 * Recharge user wallet:
 * Credits live Firestore users/{uid}.walletBalance and appends to wallet_transactions
 */
export async function rechargeWallet(
  amount: number,
  paymentMethod: string = 'UPI'
): Promise<{
  success: boolean;
  newBalance: number;
  message?: string;
}> {
  try {
    const curBal = await getWalletBalance();
    const newBal = curBal + amount;

    const storedAuth = await AsyncStorage.getItem('astroparihar_auth_user');
    const parsedUser = storedAuth ? JSON.parse(storedAuth) : null;
    const uid = parsedUser?.uid || parsedUser?.phone;

    // 1. Patch Firestore live database
    if (uid) {
      try {
        await fetch(
          `${FIRESTORE_BASE_URL}/users/${encodeURIComponent(uid)}?updateMask.fieldPaths=walletBalance&key=${FIREBASE_API_KEY}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fields: {
                walletBalance: { doubleValue: newBal },
              },
            }),
          }
        );

        // Record transaction in subcollection
        await fetch(
          `${FIRESTORE_BASE_URL}/users/${encodeURIComponent(uid)}/wallet_transactions?key=${FIREBASE_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fields: {
                amount: { doubleValue: amount },
                type: { stringValue: 'credit' },
                description: { stringValue: `Wallet Recharge via ${paymentMethod}` },
                status: { stringValue: 'completed' },
                date: { stringValue: new Date().toISOString() },
              },
            }),
          }
        );
      } catch (dbErr) {
        console.warn('Firestore recharge update error:', dbErr);
      }
    }

    // 2. Persist locally and notify
    await AsyncStorage.setItem(STORAGE_KEY_BALANCE, String(newBal));

    const txs = await getWalletTransactions();
    const newTx: WalletTransaction = {
      id: `tx_${Date.now()}`,
      type: 'credit',
      title: 'Wallet Recharge',
      subtitle: `${paymentMethod} Payment`,
      amount: `+₹${amount}`,
      date: 'Just now',
      icon: '💳',
      status: 'success',
    };
    await AsyncStorage.setItem(STORAGE_KEY_TX, JSON.stringify([newTx, ...txs]));

    notifyBalance(newBal);
    return { success: true, newBalance: newBal, message: `₹${amount} added successfully!` };
  } catch (error: any) {
    return { success: false, newBalance: 0, message: error.message || 'Recharge failed' };
  }
}

/**
 * Deduct wallet balance for calls, consultations, or AI chat queries
 * - If consultationId is passed: calls live /api/deduct-minute
 * - Otherwise: calls live /api/deduct-service-wallet or patches Firestore
 */
export async function deductWalletBalance(
  amount: number,
  description?: string,
  astrologerName?: string,
  consultationId?: string
): Promise<{
  success: boolean;
  newBalance: number;
  error?: string;
  isDepleted?: boolean;
}> {
  try {
    const curBal = await getWalletBalance();
    if (curBal < amount) {
      return { success: false, newBalance: curBal, error: 'Insufficient balance', isDepleted: true };
    }

    const storedAuth = await AsyncStorage.getItem('astroparihar_auth_user');
    const parsedUser = storedAuth ? JSON.parse(storedAuth) : null;
    const uid = parsedUser?.uid || parsedUser?.phone;

    let serverNewBalance: number | undefined;

    // 1. If ongoing consultation call, deduct via official backend minute-billing
    if (consultationId) {
      const minRes = await deductMinuteBilling(consultationId);
      if (minRes.success && minRes.remainingBalance !== undefined) {
        serverNewBalance = minRes.remainingBalance;
      } else if (minRes.isDepleted) {
        return { success: false, newBalance: curBal, error: 'Insufficient balance', isDepleted: true };
      }
    } else if (uid) {
      // 2. If one-off service (e.g. AI chat ₹5 prompt or parihar), deduct via live backend service
      const servRes = await deductServiceWallet({
        userId: uid,
        amount,
        serviceTitle: description || `Consultation with ${astrologerName || 'Astrologer'}`,
        serviceType: 'consultation',
      });
      if (servRes.success && servRes.newBalance !== undefined) {
        serverNewBalance = servRes.newBalance;
      }
    }

    const calculatedNewBal = serverNewBalance !== undefined ? serverNewBalance : Math.max(0, curBal - amount);

    // 3. Fallback direct Firestore update if backend endpoint was skipped
    if (serverNewBalance === undefined && uid) {
      try {
        await fetch(
          `${FIRESTORE_BASE_URL}/users/${encodeURIComponent(uid)}?updateMask.fieldPaths=walletBalance&key=${FIREBASE_API_KEY}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fields: {
                walletBalance: { doubleValue: calculatedNewBal },
              },
            }),
          }
        );
      } catch {}
    }

    await AsyncStorage.setItem(STORAGE_KEY_BALANCE, String(calculatedNewBal));

    // Record local transaction
    const txs = await getWalletTransactions();
    const newTx: WalletTransaction = {
      id: `tx_${Date.now()}`,
      type: 'debit',
      title: description || (astrologerName ? `Consultation: ${astrologerName}` : 'Service Payment'),
      subtitle: 'Consultation Usage',
      amount: `-₹${amount}`,
      date: 'Just now',
      icon: '📞',
      status: 'success',
    };
    await AsyncStorage.setItem(STORAGE_KEY_TX, JSON.stringify([newTx, ...txs]));

    notifyBalance(calculatedNewBal);
    return { success: true, newBalance: calculatedNewBal };
  } catch (err: any) {
    return { success: false, newBalance: 0, error: err.message || 'Deduction failed' };
  }
}
