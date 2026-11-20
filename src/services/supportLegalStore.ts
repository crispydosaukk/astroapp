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
  cancelButtonText?: string;
  confirmDeleteButtonText?: string;
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
  credentialsSectionTitle?: string;
  changePasswordTitle?: string;
  changePasswordSubtitle?: string;
  changePasswordMessage?: string;
  changePhoneTitle?: string;
  changePhoneSubtitle?: string;
  changePhoneMessage?: string;
  pinSectionTitle: string;
  changePinTitle: string;
  changePinSubtitle: string;
  sessionSectionTitle: string;
  deviceTitle: string;
  deviceSubtitle: string;
  currentBadgeText?: string;
  secondarySessionTitle?: string;
  secondarySessionSubtitle?: string;
  revokeButtonText?: string;
  revokeMessage?: string;
  logoutOtherDevicesTitle: string;
  logoutOtherDevicesSubtitle: string;
}

export interface AppPreferencesScreenContent {
  languageAppBarTitle: string;
  languageInfoBanner: string;
  languageSaveButtonText: string;
  themeAppBarTitle: string;
  themeHeading: string;
  themeSubtitle: string;
  lightVedicTitle: string;
  lightVedicDesc: string;
  darkCosmicTitle: string;
  darkCosmicDesc: string;
  accentHeading: string;
  accentSubtitle: string;
  themeFooterNote: string;
}

export interface AppSupportLegalContent {
  helpCentre: AppHelpCentreContent;
  contactSupport: AppContactSupportContent;
  terms: AppTermsContent;
  privacyPolicy: AppPrivacyPolicyContent;
  privacyScreen: AppPrivacyScreenContent;
  securityScreen: AppSecurityScreenContent;
  preferencesScreen: AppPreferencesScreenContent;
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
      { emoji: '🔮', title: 'Getting Started', count: 5, color: '#9370DB' },
      { emoji: '💬', title: 'Consultations', count: 6, color: '#4FC3F7' },
      { emoji: '💳', title: 'Payments & Wallet', count: 5, color: '#FFD700' },
      { emoji: '📜', title: 'Reports & Kundli', count: 5, color: '#FF6B6B' },
      { emoji: '👤', title: 'Account & Profile', count: 5, color: '#81C784' },
      { emoji: '🔒', title: 'Privacy & Security', count: 4, color: '#FFB347' },
    ],
    faqsTitle: 'Frequently Asked Questions',
    faqs: [
      {
        category: 'Getting Started',
        q: 'What is AstroParihar and how does it work?',
        a: 'AstroParihar is an authentic Vedic astrology platform combining ancient Sanskrit Jyotish principles with modern astronomical precision (Swiss Ephemeris Lahiri Ayanamsha). You can consult verified Vedic astrologers, calculate Janam Kundlis, check daily Panchang, and receive personalized 8-directional remedial plans (Ashta-Digbandhana).',
      },
      {
        category: 'Getting Started',
        q: 'How do I create and set up my Janam Kundli birth profile?',
        a: 'Go to Profile → Birth Profiles → Add New Profile. Enter your exact birth date, time of birth, and birth city. The system automatically fetches your geographical coordinates to calculate your Lagna, Moon sign, planetary houses, and Mahadasha.',
      },
      {
        category: 'Getting Started',
        q: 'Why is exact birth time important in Vedic astrology?',
        a: 'In Vedic astrology, the rising sign (Lagna) changes approximately every two hours. An accurate birth time ensures precise house placement, accurate planetary dashas, and correct Navamsha (D9) chart calculations.',
      },
      {
        category: 'Getting Started',
        q: 'Is AstroParihar free to use?',
        a: 'Many core tools on AstroParihar—including Daily Horoscope, Daily Panchang, Choghadiya, and basic Janam Kundli charts—are 100% free. Personalized 1-on-1 consultations with astrologers and custom in-depth PDF dossiers are billed per minute or per report from your wallet.',
      },
      {
        category: 'Getting Started',
        q: 'What is the difference between Vedic, Nadi, and KP astrology?',
        a: 'Vedic (Parashari) astrology focuses on planetary houses, dashas, and yogas. Nadi astrology uses ancient palm-leaf revelations for destiny and karmic patterns. KP (Krishnamurti Paddhati) uses stellar sub-lords for highly accurate event timing. Our verified astrologers specialize in each discipline.',
      },
      {
        category: 'Consultations',
        q: 'How do live 1-on-1 astrologer consultations work?',
        a: 'Browse available astrologers in the Astrologers tab. You can filter by language, specialty, or rating. Tap Chat or Call on any astrologer card to instantly connect. Calls use encrypted HD audio/video via ZegoCloud RTC.',
      },
      {
        category: 'Consultations',
        q: 'How does the AI Pandit chat consultation work?',
        a: 'The AI Pandit is trained on classical Vedic treatises (Brihat Parashara Hora Shastra, Phaladeepika, Jataka Parijata). It analyzes your live Kundli degrees in real-time, speaks with a male or female voice in your language, and offers Vedic guidance 24/7.',
      },
      {
        category: 'Consultations',
        q: 'What happens if my consultation disconnects unexpectedly?',
        a: 'If a call disconnects due to network instability within the first 5 minutes, our billing engine automatically protects you. Minutes are only deducted for actual talk time, and unspent balances remain safely in your wallet.',
      },
      {
        category: 'Consultations',
        q: 'Are my personal birth details and consultations private?',
        a: 'Yes, strictly 100%. All chat messages and audio/video calls are end-to-end encrypted. Astrologers cannot download or export your private data, and we never share your birth chart with external advertisers.',
      },
      {
        category: 'Consultations',
        q: 'Can I ask for specific remedies and gemstone recommendations during a call?',
        a: 'Yes. Our Acharyas will analyze your weak (Neecha) and exalted (Uchha) planets and prescribe exact Sanskrit Beej Mantras, fasts (Vrats), Yantras, and energised gemstone (Ratna) recommendations tailored to your birth chart.',
      },
      {
        category: 'Consultations',
        q: 'How is per-minute consultation billing calculated?',
        a: 'Each astrologer has a transparent rate displayed on their card (e.g. ₹15/min). Billing begins only after the astrologer accepts your call and you are connected. The call screen displays a live timer and your remaining wallet balance.',
      },
      {
        category: 'Payments & Wallet',
        q: 'How do I add money or recharge my AstroParihar wallet?',
        a: 'Go to Profile → Wallet → Recharge Wallet. Select an amount (e.g. ₹100, ₹500, ₹1000) and complete payment using UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, or Net Banking. Funds reflect instantly.',
      },
      {
        category: 'Payments & Wallet',
        q: 'Which payment methods are accepted?',
        a: 'We accept all major Indian and international payment methods via secure Razorpay and Stripe gateways, including UPI, RuPay, Visa, Mastercard, Net Banking, and popular mobile wallets.',
      },
      {
        category: 'Payments & Wallet',
        q: 'What should I do if my money was deducted but not credited to the wallet?',
        a: 'Bank processing delays can occasionally occur. If your balance does not update within 5 minutes, tap Submit a Ticket in Contact Support with your UPI Reference/UTR number. Our finance team resolves all pending credits within 2 hours.',
      },
      {
        category: 'Payments & Wallet',
        q: 'Are wallet balances refundable?',
        a: 'Wallet balances can be refunded to the original payment source upon request if no consultations have been consumed. Unused promotional bonus credits are non-cashable.',
      },
      {
        category: 'Payments & Wallet',
        q: 'How do promotional recharge bonuses work?',
        a: 'We regularly offer 100% or 50% bonus credits on first-time wallet recharges. Bonus credits are automatically added to your promotional wallet balance and can be spent on any astrologer consultation or PDF report.',
      },
      {
        category: 'Reports & Kundli',
        q: 'How accurate are the Janam Kundli calculations?',
        a: 'Our planetary engine runs on the renowned Swiss Ephemeris with Lahiri (Chitra Paksha) Ayanamsha, calibrated to 1/100th of an arcsecond. It calculates planetary degrees, Bhavas, Navamsha (D9), Dashamsha (D10), and Vimshottari Mahadasha.',
      },
      {
        category: 'Reports & Kundli',
        q: 'What is 36-Guna Ashtakoot Kundli Matching?',
        a: 'Ashtakoot matching evaluates 8 vital compatibility dimensions between bride and groom: Varna (ego/work), Vashya (dominance), Tara (destiny), Yoni (biological), Graha Maitri (friendship), Gana (temperament), Bhakoot (emotional harmony), and Nadi (genetic health). A score above 18 is auspicious.',
      },
      {
        category: 'Reports & Kundli',
        q: 'What is the Ashta-Digbandhana 8-in-1 Sacred Remedy Plan?',
        a: 'Ashta-Digbandhana is our signature personalized remedial protocol. It shields all 8 cardinal directions of your life (North, South, East, West, NE, NW, SE, SW) with specific Yantras, Mantras, Daana (charity), and temple rituals to nullify doshas.',
      },
      {
        category: 'Reports & Kundli',
        q: 'How do I download and save my Mahadasha PDF dossier?',
        a: 'After purchasing a Mahadasha report, open Profile → Kundli & Service Reports. Tap Download PDF to save the complete dossier with Sanskrit mantras and 48-day protocol to your device.',
      },
      {
        category: 'Reports & Kundli',
        q: 'Can I share my Kundli chart with my family or astrologer?',
        a: 'Yes. Open My Kundli, tap the Share icon in the top right corner, and you can share a high-resolution chart image or PDF via WhatsApp, Email, or Telegram.',
      },
      {
        category: 'Account & Profile',
        q: 'How do I edit my name, email, or birth time in my profile?',
        a: 'Open Profile → tap the Edit pencil icon next to your name. Update your details and tap Save Profile Details. Your astrological stats (Zodiac, Moon Sign, Nakshatra) will automatically recalculate.',
      },
      {
        category: 'Account & Profile',
        q: 'How do I add multiple family members to Birth Profiles?',
        a: 'Open Profile → Birth Profiles → tap Add Profile. You can save birth charts for your spouse, children, parents, and friends, and quickly switch between them when consulting astrologers.',
      },
      {
        category: 'Account & Profile',
        q: 'How do I switch the app language?',
        a: 'Go to Profile → Preferences → Language. We support Telugu (తెలుగు), Hindi (हिन्दी), Tamil (தமிழ்), Kannada (ಕನ್ನಡ), and English. The entire app, including AI voice synthesis, switches instantly.',
      },
      {
        category: 'Account & Profile',
        q: 'How do I toggle between Light Vedic and Dark Cosmic themes?',
        a: 'Go to Profile → Preferences → Theme. Tap to toggle between the radiant warm cream Light Vedic theme and the deep navy Dark Cosmic theme.',
      },
      {
        category: 'Account & Profile',
        q: 'How do I permanently delete my account and data?',
        a: 'Go to Profile → Privacy → Delete Account Permanently. Confirming this action permanently purges all your Janam Kundli charts, consultations, wallet balance, and birth profiles from our servers.',
      },
      {
        category: 'Privacy & Security',
        q: 'Is my birth date, time, and location secure?',
        a: 'Yes. All birth information is stored in secure, encrypted cloud databases protected by Firebase and Google Cloud security rules. Your birth data is used solely to calculate your Vedic astrological charts.',
      },
      {
        category: 'Privacy & Security',
        q: 'Can astrologers see my phone number or contact details?',
        a: 'Never. Calls and chats are routed anonymously through our secure server-side RTC proxy. Astrologers only see your chosen devotee display name and birth chart.',
      },
      {
        category: 'Privacy & Security',
        q: 'How do I enable biometric or app PIN lock?',
        a: 'Go to Profile → Security → Biometric Authentication. You can toggle fingerprint or Face ID lock to require verification every time the app opens.',
      },
      {
        category: 'Privacy & Security',
        q: 'Does AstroParihar sell or share user data with third-party advertisers?',
        a: 'Never. We do not sell, rent, or monetize your personal or astrological data with any advertising network. Our sole revenue comes from direct consultations and premium reports.',
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
    cancelButtonText: 'Cancel',
    confirmDeleteButtonText: 'Delete Account',
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
    twoFactorSubtitle: 'Extra security via SMS/WhatsApp OTP',
    alertsTitle: 'Login Alerts',
    alertsSubtitle: 'Get notified of new logins',
    credentialsSectionTitle: 'Account Credentials',
    changePasswordTitle: 'Change Password',
    changePasswordSubtitle: 'Update your master passcode',
    changePasswordMessage: 'Passcode reset link sent to registered mobile',
    changePhoneTitle: 'Change Mobile Number',
    changePhoneSubtitle: 'Update linked OTP number',
    changePhoneMessage: 'Verification OTP will be required on new phone number',
    pinSectionTitle: 'PIN Protection',
    changePinTitle: 'Change App PIN',
    changePinSubtitle: 'Update your 4-digit security code',
    sessionSectionTitle: 'Active Sessions',
    deviceTitle: 'Primary Mobile App',
    deviceSubtitle: 'Current Active Device',
    currentBadgeText: 'Current',
    secondarySessionTitle: 'Web Astro Dashboard',
    secondarySessionSubtitle: 'Active 2h ago',
    revokeButtonText: 'Revoke',
    revokeMessage: 'Web session logged out',
    logoutOtherDevicesTitle: 'Log Out All Other Devices',
    logoutOtherDevicesSubtitle: 'Revoke access from other browsers & phones',
  },
  preferencesScreen: {
    languageAppBarTitle: 'Language',
    languageInfoBanner:
      'Select your preferred language. All application navigation, profile, and astrology content will translate instantly.',
    languageSaveButtonText: 'Save Language',
    themeAppBarTitle: 'Theme',
    themeHeading: 'Select App Theme',
    themeSubtitle:
      'Choose between Light Vedic or Dark Cosmic. Both provide high-contrast text and optimal readability.',
    lightVedicTitle: 'Light Vedic',
    lightVedicDesc: 'Luminous pearl white and sacred gold tones with crystal-clear readability',
    darkCosmicTitle: 'Dark Cosmic',
    darkCosmicDesc: 'Deep cosmic space with starry depth and luminous gold accents',
    accentHeading: 'Accent Colour',
    accentSubtitle: 'Personalise highlight badges and interactive buttons',
    themeFooterNote: 'Theme changes apply immediately across all screens and bottom navigation.',
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
                preferencesScreen: {
                  ...s.content.preferencesScreen,
                  ...(parsed.preferencesScreen || {}),
                },
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
            preferencesScreen: {
              ...DEFAULT_SUPPORT_LEGAL_CONTENT.preferencesScreen,
              ...(c.preferencesScreen || {}),
            },
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
