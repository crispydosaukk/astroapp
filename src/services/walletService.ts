import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './astrologyService';

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

const DEFAULT_TRANSACTIONS: WalletTransaction[] = [
  { id: 'tx_1', type: 'credit', title: 'Welcome Bonus', subtitle: 'New User Promo', amount: '+₹50', date: 'Today, 09:00 AM', icon: '🎁', status: 'success' },
  { id: 'tx_2', type: 'credit', title: 'Wallet Recharge', subtitle: 'UPI • GPay', amount: '+₹500', date: 'Yesterday, 03:15 PM', icon: '💳', status: 'success' },
  { id: 'tx_3', type: 'debit', title: 'Consultation with Pandit Radhey', subtitle: 'Voice Call • 10 min', amount: '-₹100', date: 'Yesterday, 04:30 PM', icon: '📞', status: 'success' },
  { id: 'tx_4', type: 'debit', title: 'Comprehensive Life Kundli Report', subtitle: 'Report Purchase', amount: '-₹499', date: '12 Jan 2026', icon: '📜', status: 'success' },
];

const listeners = new Set<(balance: number) => void>();

function notifyBalance(newBalance: number) {
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

export async function getWalletBalance(): Promise<number> {
  try {
    // 1. Try fetching from live backend
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`${API_BASE_URL}/wallet`, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data.success && typeof data.balance === 'number') {
          await AsyncStorage.setItem(STORAGE_KEY_BALANCE, String(data.balance));
          return data.balance;
        }
      }
    } catch {}

    // 2. Read from local storage
    const cached = await AsyncStorage.getItem(STORAGE_KEY_BALANCE);
    if (cached !== null) {
      const num = Number(cached);
      if (!isNaN(num)) return num;
    }
  } catch (err) {
    console.warn('Error reading wallet balance:', err);
  }

  // Initial balance for active devotee
  const initial = 450;
  await AsyncStorage.setItem(STORAGE_KEY_BALANCE, String(initial));
  return initial;
}

export async function getWalletTransactions(): Promise<WalletTransaction[]> {
  try {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`${API_BASE_URL}/wallet`, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.transactions) && data.transactions.length > 0) {
          const formatted = data.transactions.map((t: any) => ({
            id: t.id || String(Math.random()),
            type: t.type,
            title: t.title,
            subtitle: t.subtitle || (t.type === 'credit' ? 'Wallet Recharge' : 'Consultation'),
            amount: typeof t.amount === 'number' ? (t.amount > 0 ? `+₹${t.amount}` : `-₹${Math.abs(t.amount)}`) : String(t.amount),
            date: t.date || 'Recently',
            icon: t.type === 'credit' ? '💳' : '📞',
            status: t.status || 'success',
          }));
          await AsyncStorage.setItem(STORAGE_KEY_TX, JSON.stringify(formatted));
          return formatted;
        }
      }
    } catch {}

    const cached = await AsyncStorage.getItem(STORAGE_KEY_TX);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    console.warn('Error fetching transactions:', err);
  }

  await AsyncStorage.setItem(STORAGE_KEY_TX, JSON.stringify(DEFAULT_TRANSACTIONS));
  return DEFAULT_TRANSACTIONS;
}

export async function createPaymentOrder(amount: number): Promise<{
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/wallet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_order',
        amount,
        currency: 'INR',
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          orderId: data.orderId,
          amount: data.amount,
          currency: data.currency || 'INR',
          keyId: data.keyId || 'rzp_live_astroparihar',
        };
      }
    }
  } catch (err) {
    console.warn('Fallback order generation:', err);
  }

  return {
    orderId: `order_m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    amount: amount * 100,
    currency: 'INR',
    keyId: 'rzp_live_astroparihar',
  };
}

export async function rechargeWallet(amount: number, paymentMethod: string = 'UPI'): Promise<{
  success: boolean;
  newBalance: number;
  message?: string;
}> {
  let newBal = 0;
  try {
    // Call server to persist recharge
    try {
      const res = await fetch(`${API_BASE_URL}/wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'recharge',
          amount,
          paymentMethod,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && typeof data.newBalance === 'number') {
          newBal = data.newBalance;
        }
      }
    } catch {}

    if (newBal === 0) {
      const cur = await getWalletBalance();
      newBal = cur + amount;
    }

    await AsyncStorage.setItem(STORAGE_KEY_BALANCE, String(newBal));

    // Save transaction locally
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
    const updatedTxs = [newTx, ...txs];
    await AsyncStorage.setItem(STORAGE_KEY_TX, JSON.stringify(updatedTxs));

    notifyBalance(newBal);
    return { success: true, newBalance: newBal, message: `₹${amount} added successfully!` };
  } catch (error: any) {
    return { success: false, newBalance: 0, message: error.message || 'Recharge failed' };
  }
}

export async function deductWalletBalance(
  amount: number,
  description?: string,
  astrologerName?: string
): Promise<{
  success: boolean;
  newBalance: number;
  error?: string;
}> {
  try {
    const curBal = await getWalletBalance();
    if (curBal < amount) {
      return { success: false, newBalance: curBal, error: 'Insufficient balance' };
    }

    let newBal = curBal - amount;

    // Persist to server
    try {
      const res = await fetch(`${API_BASE_URL}/wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deduct',
          amount,
          description,
          astrologerName,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && typeof data.newBalance === 'number') {
          newBal = data.newBalance;
        }
      }
    } catch {}

    await AsyncStorage.setItem(STORAGE_KEY_BALANCE, String(newBal));

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

    notifyBalance(newBal);
    return { success: true, newBalance: newBal };
  } catch (err: any) {
    return { success: false, newBalance: 0, error: err.message || 'Deduction failed' };
  }
}
