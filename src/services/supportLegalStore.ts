import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { API_ENDPOINTS } from '@/config/api';

export interface AppTopicCategory {
  emoji: string;
  title: string;
  count: number;
  color: string;
}

export interface AppFaqItem {
  q: string;
  a: string;
  category?: string;
}

export interface AppContactOption {
  emoji: string;
  title: string;
  desc: string;
  color: string;
  action: string;
  actionType?: 'chat' | 'email' | 'call' | 'whatsapp';
  value?: string;
}

export interface AppHelpCentreContent {
  appBarTitle: string;
  searchPlaceholder: string;
  needHelpBanner: {
    emoji: string;
    title: string;
    subtitle: string;
  };
  browseTopicsTitle: string;
  categories: AppTopicCategory[];
  faqsTitle: string;
  faqs: AppFaqItem[];
  noResultsText: string;
}

export interface AppContactSupportContent {
  appBarTitle: string;
  banner: {
    emoji: string;
    title: string;
    subtitle: string;
  };
  responseTimes: [string, string][];
  optionsTitle: string;
  options: AppContactOption[];
  ticketTitle: string;
  ticketSubjectLabel: string;
  ticketSubjectHint: string;
  ticketDescLabel: string;
  ticketDescHint: string;
  ticketButtonLabel: string;
  ticketSuccessMessage: string;
}

export interface AppTermsContent {
  title: string;
  emoji: string;
  lastUpdated: string;
  sections: [string, string][];
}

export interface AppPrivacyPolicyContent {
  title: string;
  emoji: string;
  lastUpdated: string;
  sections: [string, string][];
}

export interface AppPrivacyScreenContent {
  appBarTitle: string;
  bannerEmoji: string;
  bannerTitle: string;
  bannerSubtitle: string;
  controlsSectionTitle: string;
  controls: { key: string; defaultValue: boolean }[];
  dataSectionTitle: string;
  downloadDataTitle: string;
  downloadDataSubtitle: string;
  downloadDataMessage: string;
  deleteAccountTitle: string;
  deleteAccountSubtitle: string;
  deleteAccountConfirmTitle: string;
  deleteAccountConfirmMessage: string;
  deleteAccountSuccessTitle: string;
  deleteAccountSuccessMessage: string;
  privacyPolicyLinkTitle: string;
  termsLinkTitle: string;
}

export interface AppSecurityScreenContent {
  appBarTitle: string;
  statusTitleHigh: string;
  statusSubtitleHigh: string;
  statusTitleLow: string;
  statusSubtitleLow: string;
  sectionTitle: string;
  biometricTitle: string;
  biometricSubtitle: string;
  twoFactorTitle: string;
  twoFactorSubtitle: string;
  alertsTitle: string;
  alertsSubtitle: string;
  pinSectionTitle: string;
  changePinTitle: string;
  changePinSubtitle: string;
  sessionSectionTitle: string;
  deviceTitle: string;
  deviceSubtitle: string;
  logoutOtherDevicesTitle: string;
  logoutOtherDevicesSubtitle: string;
}

export interface AppSupportLegalContent {
  helpCentre: AppHelpCentreContent;
  contactSupport: AppContactSupportContent;
  terms: AppTermsContent;
  privacyPolicy: AppPrivacyPolicyContent;
  privacyScreen: AppPrivacyScreenContent;
  securityScreen: AppSecurityScreenContent;
}

export const DEFAULT_SUPPORT_LEGAL_CONTENT: AppSupportLegalContent = {
  helpCentre: {
    appBarTitle: 'Help Centre',
    searchPlaceholder: 'Search help articles...',
    needHelpBanner: {
      emoji: '🎧',
      title: 'Need more help?',
      subtitle: 'Our Vedic support team is available 24/7',
    },
    browseTopicsTitle: 'Browse by Topic',
    categories: [
      { emoji: '🔮', title: 'Getting Started', count: 8, color: '#9370DB' },
      { emoji: '💬', title: 'Consultations', count: 12, color: '#4FC3F7' },
      { emoji: '💳', title: 'Payments & Wallet', count: 10, color: '#FFD700' },
      { emoji: '📜', title: 'Reports & Kundli', count: 7, color: '#FF6B6B' },
      { emoji: '👤', title: 'Account & Profile', count: 9, color: '#81C784' },
      { emoji: '🔒', title: 'Privacy & Security', count: 6, color: '#FFB347' },
    ],
    faqsTitle: 'Frequently Asked Questions',
    faqs: [
      {
        q: 'How do I start a consultation with an astrologer?',
        a: 'Go to the Astrologers tab, browse available astrologers, and tap Chat or Call on any astrologer card. Ensure you have sufficient wallet balance before starting.',
      },
      {
        q: 'How is my birth chart calculated?',
        a: 'AstroParihar uses traditional Vedic (Jyotish) calculations based on your exact birth date, time, and place. The chart uses the Lahiri ayanamsha system, which is the standard for Vedic astrology.',
      },
      {
        q: 'Can I get a refund for a consultation?',
        a: 'If a consultation ends within 5 minutes due to technical issues, the amount is automatically refunded to your wallet. For other concerns, contact our support team within 24 hours.',
      },
      {
        q: 'How do I add money to my wallet?',
        a: 'Go to Profile → Wallet → Add Money. Select an amount and choose your payment method (UPI, Card, or Net Banking). The amount is credited instantly.',
      },
      {
        q: 'Are my consultations private?',
        a: 'Yes. All consultations are completely private and confidential. Your birth details and conversation history are encrypted and never shared with third parties.',
      },
      {
        q: 'How accurate is the AI Astrologer?',
        a: 'AstroParihar AI is trained on classical Vedic texts and provides guidance based on your birth chart. For complex life decisions, we recommend consulting a human astrologer for deeper personalised insights.',
      },
      {
        q: 'Can I create profiles for family members?',
        a: 'Yes. Go to Profile → Birth Profiles → Add New Profile. You can create profiles for yourself, partner, children, and other family members.',
      },
    ],
    noResultsText: 'No results found',
  },
  contactSupport: {
    appBarTitle: 'Contact Support',
    banner: {
      emoji: '🎧',
      title: "We're Here to Help",
      subtitle: 'Our customer care team is available 24/7 to assist you with any questions or consultations.',
    },
    responseTimes: [
      ['Chat', '< 2 min'],
      ['Email', '< 4 hrs'],
      ['Call', '< 5 min'],
    ],
    optionsTitle: 'Contact Options',
    options: [
      {
        emoji: '💬',
        title: 'Live Chat',
        desc: 'Chat with our support team instantly',
        color: '#4FC3F7',
        action: 'Start Chat',
        actionType: 'chat',
      },
      {
        emoji: '📧',
        title: 'Email Support',
        desc: 'support@astroparihar.com',
        color: '#2D9E6B',
        action: 'Send Email',
        actionType: 'email',
        value: 'mailto:support@astroparihar.com',
      },
      {
        emoji: '📞',
        title: 'Phone Support',
        desc: '+91 1800-ASTRO (Toll Free)',
        color: '#FFB347',
        action: 'Call Now',
        actionType: 'call',
        value: 'tel:+91180027876',
      },
      {
        emoji: '📱',
        title: 'WhatsApp',
        desc: 'Message us on WhatsApp',
        color: '#25D366',
        action: 'Open WhatsApp',
        actionType: 'whatsapp',
        value: 'https://wa.me/917981255989',
      },
    ],
    ticketTitle: 'Submit a Ticket',
    ticketSubjectLabel: 'Subject',
    ticketSubjectHint: 'Briefly describe your inquiry',
    ticketDescLabel: 'Description',
    ticketDescHint: 'Provide more details...',
    ticketButtonLabel: 'Submit Ticket',
    ticketSuccessMessage: 'Support ticket submitted successfully. Ticket ID #ASTRO-9281',
  },
  terms: {
    title: 'Terms of Service',
    emoji: '⚖️',
    lastUpdated: 'Last updated: January 2026',
    sections: [
      [
        '1. Acceptance of Terms',
        "By accessing or using AstroParihar's services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.\n\nAstroParihar provides astrology-related content, AI-powered guidance, and connections to professional astrologers for informational and guidance purposes.",
      ],
      [
        '2. Services Provided',
        'AstroParihar offers:\n• AI-powered astrology guidance\n• Live consultations with verified astrologers\n• Kundli generation and analysis\n• Horoscope reports and predictions\n• Vedic remedies and recommendations\n• Panchang and astrological calendar\n\nAll services are provided for spiritual guidance and should not replace professional medical, legal, or financial advice.',
      ],
      [
        '3. User Accounts',
        'You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate birth details for accurate astrological analysis.',
      ],
      [
        '4. Payments and Refunds',
        'Wallet credits can be utilized for consultations and reports in real-time. Unused balance is stored securely.',
      ],
      [
        '5. Disclaimer',
        'Astrology is an ancient practice. Our services are for spiritual guidance. We do not promote fear-based astrology or guarantee specific outcomes.',
      ],
      [
        '6. Privacy',
        'Your birth data and consultation history are kept strictly confidential. We do not sell personal data to third parties.',
      ],
      [
        '7. Contact',
        'For questions about these Terms, contact us at:\nlegal@astroparihar.com\n\nAstroParihar',
      ],
    ],
  },
  privacyPolicy: {
    title: 'Privacy Policy',
    emoji: '🔒',
    lastUpdated: 'Last updated: January 2026',
    sections: [
      [
        '1. Information We Collect',
        'We collect the following information to provide our services:\n\n• Personal details: Name, email, phone number\n• Birth details: Date, time, and place of birth\n• Usage data: App interactions and preferences\n• Payment information: Transaction records\n• Consultation history: Chat and call records',
      ],
      [
        '2. How We Use Your Information',
        'Your information is used to:\n• Generate accurate Kundli and horoscope reports\n• Connect you with appropriate astrologers\n• Provide personalised recommendations\n• Process payments and maintain wallet balance\n• Improve our AI astrology models\n• Send relevant notifications (with your consent)',
      ],
      [
        '3. Data Security',
        'AstroParihar employs industry-standard security measures:\n• End-to-end encryption for consultations\n• Secure payment processing via 256-bit SSL\n• Regular security audits\n• Strict access controls\n\nYour birth data is treated as sensitive personal information and is never shared without your explicit consent.',
      ],
      [
        '4. Data Sharing',
        'We do not sell your personal data. We may share data with:\n• Astrologers (only birth details necessary for consultation)\n• Payment processors (for transaction processing)\n\nWe never share your consultation content with third parties.',
      ],
      [
        '5. Your Rights',
        'You have the right to:\n• Access your personal data\n• Correct inaccurate information\n• Delete your account and data\n• Download an archive copy of your data',
      ],
      [
        '6. Contact Us',
        'For privacy-related queries:\nprivacy@astroparihar.com\n\nAstroParihar Privacy Team',
      ],
    ],
  },
  privacyScreen: {
    appBarTitle: 'Privacy',
    bannerEmoji: '🔒',
    bannerTitle: 'Your Privacy Matters',
    bannerSubtitle: 'AstroParihar keeps your birth coordinates and consultations completely encrypted and private.',
    controlsSectionTitle: 'Privacy Controls',
    controls: [
      { key: 'Profile Visibility', defaultValue: true },
      { key: 'Show Online Status', defaultValue: true },
      { key: 'Allow Astrologers to View Birth Chart', defaultValue: true },
      { key: 'Personalised Recommendations', defaultValue: true },
      { key: 'Analytics & Improvement', defaultValue: false },
      { key: 'Marketing Communications', defaultValue: false },
    ],
    dataSectionTitle: 'Your Data',
    downloadDataTitle: 'Download My Astrological Data',
    downloadDataSubtitle: 'Get an encrypted copy of all saved charts and reports',
    downloadDataMessage: 'Preparing your data archive... Link will be sent via email.',
    deleteAccountTitle: 'Delete My Account',
    deleteAccountSubtitle: 'Permanently remove your account and all data',
    deleteAccountConfirmTitle: 'Delete Account Permanently?',
    deleteAccountConfirmMessage:
      'Are you sure you want to permanently delete your AstroParihar account?\n\nAll your Janam Kundli charts, consultations, wallet balance, and birth profiles will be erased forever.\n\nOnce deleted, this phone number cannot be reused to log in.',
    deleteAccountSuccessTitle: 'Account Deleted',
    deleteAccountSuccessMessage: 'Your account has been deleted. You can no longer log in with this phone number.',
    privacyPolicyLinkTitle: 'Privacy Policy',
    termsLinkTitle: 'Terms of Service',
  },
  securityScreen: {
    appBarTitle: 'Security',
    statusTitleHigh: 'Excellent Security',
    statusSubtitleHigh: 'Your account is fully protected',
    statusTitleLow: 'Good Security',
    statusSubtitleLow: 'Enable 2FA to achieve 100% protection',
    sectionTitle: 'Authentication',
    biometricTitle: 'Biometric Login',
    biometricSubtitle: 'Use fingerprint or Face ID',
    twoFactorTitle: 'Two-Factor Authentication',
    twoFactorSubtitle: 'Receive SMS verification on sign in',
    alertsTitle: 'Security Alerts',
    alertsSubtitle: 'Get notified of unusual account activity',
    pinSectionTitle: 'PIN Protection',
    changePinTitle: 'Change App PIN',
    changePinSubtitle: 'Update your 4-digit security code',
    sessionSectionTitle: 'Active Sessions',
    deviceTitle: 'Current Device (iOS)',
    deviceSubtitle: 'Signed in today',
    logoutOtherDevicesTitle: 'Log Out All Other Devices',
    logoutOtherDevicesSubtitle: 'Revoke access from other browsers & phones',
  },
};

const STORAGE_KEY = 'astroparihar_dynamic_support_legal_cache';

interface SupportLegalState {
  content: AppSupportLegalContent;
  loading: boolean;
  hydrated: boolean;
  fetchContent: () => Promise<void>;
}

export const useSupportLegalStore = create<SupportLegalState>((set, get) => ({
  content: DEFAULT_SUPPORT_LEGAL_CONTENT,
  loading: false,
  hydrated: false,
  fetchContent: async () => {
    // 1. Hydrate from AsyncStorage cache first for instant display
    if (!get().hydrated) {
      try {
        const cached = await AsyncStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object') {
            set((s) => ({
              content: {
                ...s.content,
                ...parsed,
                helpCentre: { ...s.content.helpCentre, ...(parsed.helpCentre || {}) },
                contactSupport: { ...s.content.contactSupport, ...(parsed.contactSupport || {}) },
                terms: { ...s.content.terms, ...(parsed.terms || {}) },
                privacyPolicy: { ...s.content.privacyPolicy, ...(parsed.privacyPolicy || {}) },
                privacyScreen: { ...s.content.privacyScreen, ...(parsed.privacyScreen || {}) },
                securityScreen: { ...s.content.securityScreen, ...(parsed.securityScreen || {}) },
              },
              hydrated: true,
            }));
          }
        }
      } catch {}
    }

    // 2. Fetch live from server
    set({ loading: true });
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(API_ENDPOINTS.supportLegal, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.content) {
          const c = data.content as Partial<AppSupportLegalContent>;
          const merged: AppSupportLegalContent = {
            helpCentre: { ...DEFAULT_SUPPORT_LEGAL_CONTENT.helpCentre, ...(c.helpCentre || {}) },
            contactSupport: { ...DEFAULT_SUPPORT_LEGAL_CONTENT.contactSupport, ...(c.contactSupport || {}) },
            terms: { ...DEFAULT_SUPPORT_LEGAL_CONTENT.terms, ...(c.terms || {}) },
            privacyPolicy: { ...DEFAULT_SUPPORT_LEGAL_CONTENT.privacyPolicy, ...(c.privacyPolicy || {}) },
            privacyScreen: { ...DEFAULT_SUPPORT_LEGAL_CONTENT.privacyScreen, ...(c.privacyScreen || {}) },
            securityScreen: { ...DEFAULT_SUPPORT_LEGAL_CONTENT.securityScreen, ...(c.securityScreen || {}) },
          };
          set({ content: merged, loading: false, hydrated: true });
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          return;
        }
      }
    } catch {
      // Offline fallback preserved seamlessly
    } finally {
      set({ loading: false, hydrated: true });
    }
  },
}));
