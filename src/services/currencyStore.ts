import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type CurrencyCode = 'INR' | 'USD';

export interface DynamicPricingSettings {
  newUserTrialMinutes: number;
  aiChatPricePerMinute: number;
  aiChatPricePerPrompt: number;
  aiVoicePricePerMinute: number;
  aiChatPricePerMinuteUSD: number;
  aiChatPricePerPromptUSD: number;
  aiVoicePricePerMinuteUSD: number;
  humanAstrologerDefaultRate: number;
  humanAstrologerMinRate: number;
  humanAstrologerMaxRate: number;
  pariharaPlanPrice: number;
  pariharaPlanPriceUSD: number;
  exchangeRateINRtoUSD: number;
}

export const DEFAULT_PRICING_SETTINGS: DynamicPricingSettings = {
  newUserTrialMinutes: 5,
  aiChatPricePerMinute: 5,
  aiChatPricePerPrompt: 5,
  aiVoicePricePerMinute: 7,
  aiChatPricePerMinuteUSD: 0.15,
  aiChatPricePerPromptUSD: 0.15,
  aiVoicePricePerMinuteUSD: 0.15,
  humanAstrologerDefaultRate: 25,
  humanAstrologerMinRate: 15,
  humanAstrologerMaxRate: 100,
  pariharaPlanPrice: 499,
  pariharaPlanPriceUSD: 9.99,
  exchangeRateINRtoUSD: 0.012, // 1 INR = ~0.012 USD
};

export interface RechargeOption {
  amount: string;
  value: number;
  valueINR: number;
  bonus: string | null;
}

const INR_RECHARGE_OPTIONS: RechargeOption[] = [
  { amount: '₹100', value: 100, valueINR: 100, bonus: null },
  { amount: '₹200', value: 200, valueINR: 200, bonus: null },
  { amount: '₹500', value: 500, valueINR: 500, bonus: '₹25 bonus' },
  { amount: '₹1000', value: 1000, valueINR: 1000, bonus: '₹75 bonus' },
  { amount: '₹2000', value: 2000, valueINR: 2000, bonus: '₹200 bonus' },
  { amount: '₹5000', value: 5000, valueINR: 5000, bonus: '₹600 bonus' },
];

const USD_RECHARGE_OPTIONS: RechargeOption[] = [
  { amount: '$5', value: 5, valueINR: Math.round(5 / 0.012), bonus: null },
  { amount: '$10', value: 10, valueINR: Math.round(10 / 0.012), bonus: null },
  { amount: '$25', value: 25, valueINR: Math.round(25 / 0.012), bonus: '$2 bonus' },
  { amount: '$50', value: 50, valueINR: Math.round(50 / 0.012), bonus: '$5 bonus' },
  { amount: '$100', value: 100, valueINR: Math.round(100 / 0.012), bonus: '$12 bonus' },
  { amount: '$200', value: 200, valueINR: Math.round(200 / 0.012), bonus: '$30 bonus' },
];

const STORAGE_KEY_CURRENCY = 'astroparihar_currency';
const FIREBASE_PROJECT_ID = 'astroparihar-85e2d';
const FIREBASE_API_KEY = 'AIzaSyCXZ9S7Th0lpAVLMnZnRlgusCH1dPgF98g';
const FIRESTORE_SETTINGS_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/settings/general?key=${FIREBASE_API_KEY}`;

interface CurrencyStoreState {
  currencyCode: CurrencyCode;
  currencySymbol: string;
  isIndia: boolean;
  pricingSettings: DynamicPricingSettings;
  initialized: boolean;

  initCurrency: () => Promise<void>;
  setCurrencyCode: (code: CurrencyCode) => Promise<void>;
  toggleCurrency: () => Promise<void>;
  convertPrice: (amountInINR: number | string, amountInUSD?: number | string) => number;
  formatPrice: (amountInINR: number | string, amountInUSD?: number | string) => string;
  formatRate: (rateInINR: number | string, rateInUSD?: number | string) => string;
  formatPromptFee: () => string;
  getPromptCost: () => { cost: number; costINR: number; label: string };
  getRechargeOptions: () => RechargeOption[];
}

export const useCurrencyStore = create<CurrencyStoreState>((set, get) => ({
  currencyCode: 'INR',
  currencySymbol: '₹',
  isIndia: true,
  pricingSettings: DEFAULT_PRICING_SETTINGS,
  initialized: false,

  initCurrency: async () => {
    try {
      // 1. Check if user already manually selected a currency in AsyncStorage
      const savedCode = await AsyncStorage.getItem(STORAGE_KEY_CURRENCY);
      let detectedCode: CurrencyCode = 'INR';
      let inIndia = true;

      if (savedCode === 'INR' || savedCode === 'USD') {
        detectedCode = savedCode;
        inIndia = savedCode === 'INR';
      } else {
        // 2. Instant Local Detection via Device Timezone & Offset
        // Standard IST: 'Asia/Calcutta', 'Asia/Kolkata', or UTC+5:30 (offset === -330)
        try {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
          const tzLower = tz.toLowerCase();
          const isISTOffset = new Date().getTimezoneOffset() === -330;
          const isIndianTimeZone =
            tzLower.includes('calcutta') ||
            tzLower.includes('kolkata') ||
            tz === 'Asia/Calcutta' ||
            tz === 'Asia/Kolkata';

          if (isIndianTimeZone || isISTOffset) {
            detectedCode = 'INR';
            inIndia = true;
          } else {
            detectedCode = 'USD';
            inIndia = false;
          }
        } catch {
          detectedCode = 'INR';
          inIndia = true;
        }

        // 3. Non-blocking Geo-IP verification for 100% accuracy
        (async () => {
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 3000);
            const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
            clearTimeout(timer);
            if (res.ok) {
              const data = await res.json();
              if (data && data.country_code) {
                const geoIsIndia = data.country_code === 'IN';
                // Only auto-switch if user hasn't manually chosen yet
                const currentSaved = await AsyncStorage.getItem(STORAGE_KEY_CURRENCY);
                if (!currentSaved) {
                  const newCode = geoIsIndia ? 'INR' : 'USD';
                  set({
                    currencyCode: newCode,
                    currencySymbol: newCode === 'INR' ? '₹' : '$',
                    isIndia: geoIsIndia,
                  });
                }
              }
            }
          } catch {
            // Silently fallback if offline
          }
        })();
      }

      set({
        currencyCode: detectedCode,
        currencySymbol: detectedCode === 'INR' ? '₹' : '$',
        isIndia: inIndia,
        initialized: true,
      });

      // 4. Fetch dynamic pricing from Firestore settings/general
      (async () => {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 4000);
          const res = await fetch(FIRESTORE_SETTINGS_URL, { signal: controller.signal });
          clearTimeout(timer);
          if (res.ok) {
            const data = await res.json();
            const f = data.fields || {};
            const num = (v: any, fallback: number) => {
              if (!v) return fallback;
              const val = v.doubleValue !== undefined ? Number(v.doubleValue) : v.integerValue !== undefined ? Number(v.integerValue) : fallback;
              return isNaN(val) ? fallback : val;
            };

            const updatedPricing: DynamicPricingSettings = {
              newUserTrialMinutes: num(f.newUserTrialMinutes, 5),
              aiChatPricePerMinute: num(f.aiChatPricePerMinute, 5),
              aiChatPricePerPrompt: num(f.aiChatPricePerPrompt, num(f.aiChatPricePerMinute, 5)),
              aiVoicePricePerMinute: num(f.aiVoicePricePerMinute, 7),
              aiChatPricePerMinuteUSD: num(f.aiChatPricePerMinuteUSD, 0.15),
              aiChatPricePerPromptUSD: num(f.aiChatPricePerPromptUSD, num(f.aiChatPricePerMinuteUSD, 0.15)),
              aiVoicePricePerMinuteUSD: num(f.aiVoicePricePerMinuteUSD, 0.15),
              humanAstrologerDefaultRate: num(f.humanAstrologerDefaultRate, 25),
              humanAstrologerMinRate: num(f.humanAstrologerMinRate, 15),
              humanAstrologerMaxRate: num(f.humanAstrologerMaxRate, 100),
              pariharaPlanPrice: num(f.pariharaPlanPrice, 499),
              pariharaPlanPriceUSD: num(f.pariharaPlanPriceUSD, 9.99),
              exchangeRateINRtoUSD: 0.012,
            };

            set({ pricingSettings: updatedPricing });
          }
        } catch {
          // Keep defaults if network fails
        }
      })();
    } catch (e) {
      console.warn('Currency initialization error:', e);
      set({ initialized: true });
    }
  },

  setCurrencyCode: async (code: CurrencyCode) => {
    const isIndia = code === 'INR';
    set({
      currencyCode: code,
      currencySymbol: isIndia ? '₹' : '$',
      isIndia,
    });
    await AsyncStorage.setItem(STORAGE_KEY_CURRENCY, code).catch(() => {});
  },

  toggleCurrency: async () => {
    const nextCode: CurrencyCode = get().currencyCode === 'INR' ? 'USD' : 'INR';
    await get().setCurrencyCode(nextCode);
  },

  convertPrice: (amountInINR: number | string, amountInUSD?: number | string): number => {
    const { currencyCode, pricingSettings } = get();

    if (currencyCode === 'USD') {
      if (amountInUSD !== undefined && amountInUSD !== null && amountInUSD !== '') {
        const usdVal =
          typeof amountInUSD === 'string'
            ? parseFloat(amountInUSD.replace(/[^0-9.]/g, ''))
            : amountInUSD;
        if (!isNaN(usdVal) && usdVal > 0) return Number(usdVal.toFixed(2));
      }

      const inrVal =
        typeof amountInINR === 'string'
          ? parseFloat(amountInINR.replace(/[^0-9.]/g, ''))
          : amountInINR;
      if (isNaN(inrVal) || inrVal === 0) return 0;
      return Number((inrVal * (pricingSettings.exchangeRateINRtoUSD || 0.012)).toFixed(2));
    }

    // Default INR
    const inrVal =
      typeof amountInINR === 'string'
        ? parseFloat(amountInINR.replace(/[^0-9.]/g, ''))
        : amountInINR;
    if (isNaN(inrVal)) return 0;
    return Math.round(inrVal);
  },

  formatPrice: (amountInINR: number | string, amountInUSD?: number | string): string => {
    const { currencyCode } = get();
    const converted = get().convertPrice(amountInINR, amountInUSD);

    if (currencyCode === 'USD') {
      const formatted = converted % 1 === 0 ? converted.toFixed(0) : converted.toFixed(2);
      return `$${formatted}`;
    }

    return `₹${converted.toLocaleString('en-IN')}`;
  },

  formatRate: (rateInINR: number | string, rateInUSD?: number | string): string => {
    const { currencyCode } = get();
    if (currencyCode === 'USD') {
      const converted = get().convertPrice(rateInINR, rateInUSD);
      const formatted = converted % 1 === 0 ? converted.toFixed(0) : converted.toFixed(2);
      return `$${formatted}/min`;
    }
    const val = typeof rateInINR === 'string' ? parseFloat(rateInINR.replace(/[^0-9.]/g, '')) : rateInINR;
    return `₹${Math.round(val || 0)}/min`;
  },

  formatPromptFee: (): string => {
    const { currencyCode, pricingSettings } = get();
    if (currencyCode === 'USD') {
      const fee = pricingSettings.aiChatPricePerPromptUSD || 0.15;
      return `$${fee % 1 === 0 ? fee.toFixed(0) : fee.toFixed(2)} / prompt`;
    }
    const fee = pricingSettings.aiChatPricePerPrompt || 5;
    return `₹${fee} / prompt`;
  },

  getPromptCost: () => {
    const { currencyCode, pricingSettings } = get();
    if (currencyCode === 'USD') {
      const cost = pricingSettings.aiChatPricePerPromptUSD || 0.15;
      // In INR equivalence for wallet deduction against base balance
      const costINR = Math.round(cost / (pricingSettings.exchangeRateINRtoUSD || 0.012)) || 12;
      return {
        cost,
        costINR,
        label: `$${cost.toFixed(2)}`,
      };
    }
    const cost = pricingSettings.aiChatPricePerPrompt || 5;
    return {
      cost,
      costINR: cost,
      label: `₹${cost}`,
    };
  },

  getRechargeOptions: (): RechargeOption[] => {
    const { currencyCode } = get();
    return currencyCode === 'USD' ? USD_RECHARGE_OPTIONS : INR_RECHARGE_OPTIONS;
  },
}));

// Auto-initialize when app loads
useCurrencyStore.getState().initCurrency();

