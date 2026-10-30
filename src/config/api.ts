/**
 * AstroParihar Production API & Live Domain Configuration.
 * All live API calls across the mobile app connect to the production deployment at https://astroparihar.com.
 */

export const LIVE_BASE_URL = 'https://astroparihar.com';

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || LIVE_BASE_URL;

export const API_ENDPOINTS = {
  auth: `${BASE_URL}/api/auth`,
  saveProfile: `${BASE_URL}/api/auth/save-profile`,
  sendOtp: `${BASE_URL}/api/auth/send-otp`,
  verifyOtp: `${BASE_URL}/api/auth/verify-otp`,
  appDynamic: `${BASE_URL}/api/app-dynamic`,
  onboarding: `${BASE_URL}/api/app-dynamic/onboarding`,
  cosmicInsights: `${BASE_URL}/api/app-dynamic/cosmic-insights`,
  banners: `${BASE_URL}/api/app-dynamic/banners`,
  astrologers: `${BASE_URL}/api/app-dynamic/astrologers`,
  kundliCalculate: `${BASE_URL}/api/app-dynamic/kundli-calculate`,
  matchKundli: `${BASE_URL}/api/app-dynamic/match-kundli`,
  panchang: `${BASE_URL}/api/app-dynamic/panchang`,
  aiChat: `${BASE_URL}/api/app-dynamic/ai-chat`,
  reviews: `${BASE_URL}/api/app-dynamic/reviews`,
  services: `${BASE_URL}/api/app-dynamic/services`,
  profile: `${BASE_URL}/api/app-dynamic/profile`,
  astrologerSendOtp: `${BASE_URL}/api/astrologer/auth/send-otp`,
  astrologerVerifyOtp: `${BASE_URL}/api/astrologer/auth/verify-otp`,
  candidateApply: `${BASE_URL}/api/candidate/apply`,
  assessmentSettings: `${BASE_URL}/api/settings/assessment`,
  generateQuestions: `${BASE_URL}/api/ai/generate-assignment-questions`,
  generateChartCase: `${BASE_URL}/api/ai/generate-chart-case`,
  evaluateKundali: `${BASE_URL}/api/ai/evaluate-kundali`,
  candidateInterview: `${BASE_URL}/api/ai/candidate-interview`,
} as const;

/**
 * Resolves relative image/media paths to full live production URLs.
 */
export function resolveMediaUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}
