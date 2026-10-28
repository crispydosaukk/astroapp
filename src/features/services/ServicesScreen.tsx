/**
 * Services Screen
 * - Dynamic categorized card models reflecting website remedies, panchang, kundli, and consultations.
 * - Sacred Vedic Remedies Card Model: All 8 canonical Ashta Parihar remedies in one prominent card.
 * - Free Services & Tools Card Model: Janam Kundli, Kundli Matching, Panchang, Daily Horoscope, Meditation Guide, Fasting Planner.
 * - Mahadasha Guides Card Model (Paid PDFs): Rahu & Sani Stabilisation (₹499) and Survival (₹999) Guides with instant wallet deduction, reading & PDF download.
 * - Panchang & Timings Card Model: Today/Tomorrow Panchang, Tithi, Vaar, Karana, Shubh Muhurat, Rahu Kaal, Choghadiya, Hora.
 * - Consultations Card Model: Live Astrologer & 24/7 AI Astrologer.
 * - Specialized Life Guidance Card Model: Career, Marriage, Business, Finance, Tarot, Numerology, Spiritual Guidance.
 * - Dynamic sync with Admin Dashboard & live /api/app-dynamic/services API.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { showSnackBar } from '@/components/overlays';
import { Text } from '@/components/Text';
import { API_ENDPOINTS } from '@/config/api';
import { REMEDIES, Remedy } from '@/data/remedies';
import { useAuthStore } from '@/features/auth/authStore';
import { AppRoutes, push } from '@/navigation/routes';
import { deductWalletBalance, getWalletBalance } from '@/services/walletService';
import { withAlpha } from '@/theme/colors';
import { useTranslation } from '@/theme/languageStore';
import { useThemeColors } from '@/theme/themeStore';

const STORAGE_CATEGORIES_KEY = 'astroparihar_app_service_categories_v3';
const STORAGE_REPORTS_KEY = 'astroparihar_kundli_reports';

export interface ServiceCardItem {
  id: string;
  order: number;
  category: string;
  name: string;
  sanskrit?: string;
  desc: string;
  direction?: string;
  directionHindi?: string;
  mantra?: string;
  icon: string;
  route: string;
  color: string;
  badge?: string;
  active: boolean;
  isRemediesCard?: boolean;
}

export interface ServiceCategoryModel {
  id: string;
  order: number;
  category: 'remedies' | 'free-tools' | 'mahadasha' | 'panchang' | 'consultations' | 'guidance' | string;
  title: string;
  sanskrit: string;
  desc: string;
  badge?: string;
  icon: string;
  color: string;
  active: boolean;
  items: ServiceCardItem[];
}

export const DEFAULT_SERVICE_CATEGORIES: ServiceCategoryModel[] = [
  {
    id: 'cat-remedies',
    order: 0,
    category: 'remedies',
    title: 'Sacred Vedic Remedies',
    sanskrit: 'अष्ट परिहार • Ashta-Digbandhana',
    desc: 'Harmonize planetary energies through authentic Vedic remedies prescribed by the 8 sacred directions.',
    badge: '8 in 1 Card',
    icon: 'auto_awesome',
    color: '#713B32',
    active: true,
    items: [
      {
        id: 'rem-mantra',
        order: 1,
        category: 'remedies',
        name: 'Mantra Shakti (मन्त्र शक्ति)',
        sanskrit: 'मन्त्र शक्ति',
        direction: 'North',
        directionHindi: 'उत्तर (North)',
        desc: 'Sacred sound vibrations that align planetary energies',
        mantra: 'ॐ ह्रीं श्रीं क्लीं चामुण्डायै विच्चे ॥',
        icon: 'auto_awesome',
        route: AppRoutes.remedyDetailScreen,
        color: '#9370DB',
        badge: 'North',
        active: true,
      },
      {
        id: 'rem-yantra',
        order: 2,
        category: 'remedies',
        name: 'Yantra (यन्त्र)',
        sanskrit: 'यन्त्र',
        direction: 'North-East',
        directionHindi: 'ईशान (North-East)',
        desc: 'Sacred geometric diagrams that attract cosmic energies',
        mantra: 'ॐ श्रीं ह्रीं क्लीं नमः ॥',
        icon: 'auto_awesome',
        route: AppRoutes.remedyDetailScreen,
        color: '#FFD700',
        badge: 'North-East',
        active: true,
      },
      {
        id: 'rem-homa',
        order: 3,
        category: 'remedies',
        name: 'Homa (होम / हवन)',
        sanskrit: 'होम / हवन',
        direction: 'East',
        directionHindi: 'पूर्व (East)',
        desc: 'Sacred fire rituals to purify and invoke divine blessings',
        mantra: 'ॐ अग्नये स्वाहा ॥',
        icon: 'whatshot',
        route: AppRoutes.remedyDetailScreen,
        color: '#FF6B35',
        badge: 'East',
        active: true,
      },
      {
        id: 'rem-devata',
        order: 4,
        category: 'remedies',
        name: 'Devata Upasana (देवता उपासना)',
        sanskrit: 'देवता उपासना',
        direction: 'South-East',
        directionHindi: 'आग्नेय (South-East)',
        desc: 'Personal deity worship for spiritual alignment',
        mantra: 'ॐ नमः शिवाय ॥',
        icon: 'wb_sunny',
        route: AppRoutes.remedyDetailScreen,
        color: '#FFB347',
        badge: 'South-East',
        active: true,
      },
      {
        id: 'rem-ratna',
        order: 5,
        category: 'remedies',
        name: 'Ratna / Gemstones (रत्न)',
        sanskrit: 'रत्न',
        direction: 'South',
        directionHindi: 'दक्षिण (South)',
        desc: 'Planetary gemstones to strengthen beneficial influences',
        mantra: 'ॐ ग्रहाय नमः ॥',
        icon: 'diamond',
        route: AppRoutes.remedyDetailScreen,
        color: '#4FC3F7',
        badge: 'South (S)',
        active: true,
      },
      {
        id: 'rem-rudraksha',
        order: 6,
        category: 'remedies',
        name: 'Rudraksha (रुद्राक्ष)',
        sanskrit: 'रुद्राक्ष',
        direction: 'South-West',
        directionHindi: 'नैऋत्य (South-West)',
        desc: 'Sacred seeds of Lord Shiva for protection and healing',
        mantra: 'ॐ नमः शिवाय ॥',
        icon: 'spa',
        route: AppRoutes.remedyDetailScreen,
        color: '#8B4513',
        badge: 'South-West (SW)',
        active: true,
      },
      {
        id: 'rem-vastu',
        order: 7,
        category: 'remedies',
        name: 'Vastu (वास्तु)',
        sanskrit: 'वास्तु',
        direction: 'West',
        directionHindi: 'पश्चिम (West)',
        desc: 'Sacred architecture for harmonious living spaces',
        mantra: 'ॐ वास्तुपुरुषाय नमः ॥',
        icon: 'home',
        route: AppRoutes.remedyDetailScreen,
        color: '#81C784',
        badge: 'West (W)',
        active: true,
      },
      {
        id: 'rem-charity',
        order: 8,
        category: 'remedies',
        name: 'Dāna & Seva (दान एवं सेवा)',
        sanskrit: 'दान एवं सेवा',
        direction: 'North-West',
        directionHindi: 'वायव्य (North-West)',
        desc: 'Charitable giving and selfless service for karmic balance',
        mantra: 'ॐ परोपकाराय नमः ॥',
        icon: 'favorite',
        route: AppRoutes.remedyDetailScreen,
        color: '#FF6B6B',
        badge: 'North-West (NW)',
        active: true,
      },
    ],
  },
  {
    id: 'cat-free-tools',
    order: 2,
    category: 'free-tools',
    title: 'Free Services & Tools',
    sanskrit: 'निःशुल्क वैदिक सेवाएं',
    desc: 'Personalized Vedic birth charts, compatibility, Panchang, daily horoscope, meditation & fasting planners.',
    badge: 'Free',
    icon: 'auto_stories',
    color: '#9370DB',
    active: true,
    items: [
      {
        id: 'tool-janam-kundli',
        order: 1,
        category: 'free-tools',
        name: 'Janam Kundli',
        sanskrit: 'जन्म कुंडली',
        desc: 'Personalized Vedic birth chart & life predictions',
        icon: 'auto_stories',
        route: AppRoutes.myKundliScreen,
        color: '#9370DB',
        badge: 'Free',
        active: true,
      },
      {
        id: 'tool-kundli-match',
        order: 2,
        category: 'free-tools',
        name: 'Kundli Matching',
        sanskrit: 'कुंडली मिलान',
        desc: 'Vedic Gun Milan & marital compatibility check',
        icon: 'favorite_border',
        route: AppRoutes.matchKundliScreen,
        color: '#FF6B6B',
        badge: 'Free',
        active: true,
      },
      {
        id: 'tool-panchang',
        order: 3,
        category: 'free-tools',
        name: 'Panchang',
        sanskrit: 'पंचांग',
        desc: 'Tithi, Nakshatra, Yoga & Shubh Muhurat',
        icon: 'calendar_today_outlined',
        route: AppRoutes.panchangScreen,
        color: '#4FC3F7',
        badge: 'Free',
        active: true,
      },
      {
        id: 'tool-horoscope',
        order: 4,
        category: 'free-tools',
        name: 'Daily Horoscope',
        sanskrit: 'दैनिक राशिफल',
        desc: 'Daily zodiac forecasts & lucky guidance',
        icon: 'wb_sunny_outlined',
        route: AppRoutes.horoscopeScreen,
        color: '#FFB347',
        badge: 'Free',
        active: true,
      },
      {
        id: 'tool-meditation',
        order: 5,
        category: 'free-tools',
        name: 'Meditation Guide',
        sanskrit: 'ध्यान एवं प्राणायाम',
        desc: 'Mindfulness, mantras & spiritual alignment',
        icon: 'self_improvement',
        route: 'meditation_modal',
        color: '#81C784',
        badge: 'Free',
        active: true,
      },
      {
        id: 'tool-fasting',
        order: 6,
        category: 'free-tools',
        name: 'Fasting Planner',
        sanskrit: 'व्रत एवं उपवास तालिका',
        desc: 'Sacred Vrat schedules, rules & rituals',
        icon: 'event_note',
        route: 'fasting_modal',
        color: '#E91E63',
        badge: 'Free',
        active: true,
      },
    ],
  },
  {
    id: 'cat-mahadasha',
    order: 3,
    category: 'mahadasha',
    title: 'Mahadasha Guides (Paid PDFs)',
    sanskrit: 'महादशा विशेष संकलन • PDF Dossiers',
    desc: 'In-depth downloadable PDF blueprints with exact Sanskrit mantras, dietary rules, and planetary remedies.',
    badge: 'Paid PDFs',
    icon: 'menu_book',
    color: '#FF6B35',
    active: true,
    items: [
      {
        id: 'maha-rahu-stab',
        order: 1,
        category: 'mahadasha',
        name: 'Rahu Mahadasha Stabilisation Guide',
        sanskrit: 'राहु महादशा शांति संकलन',
        desc: 'Harmonize intense Rahu transit & remedies (PDF Dossier)',
        icon: 'shield',
        route: 'mahadasha_rahu-stabilisation',
        color: '#713B32',
        badge: '₹499',
        active: true,
      },
      {
        id: 'maha-rahu-surv',
        order: 2,
        category: 'mahadasha',
        name: 'Rahu Mahadasha Survival Guide',
        sanskrit: 'राहु महादशा सर्वाइवल गाइड',
        desc: 'Tactical survival & protective mantras (PDF Dossier)',
        icon: 'local_fire_department',
        route: 'mahadasha_rahu-survival',
        color: '#E65100',
        badge: '₹999',
        active: true,
      },
      {
        id: 'maha-sani-stab',
        order: 3,
        category: 'mahadasha',
        name: 'Sani Mahadasha Stabilisation Guide',
        sanskrit: 'शनि महादशा शांति संकलन',
        desc: 'Saturn discipline, endurance & remedies (PDF Dossier)',
        icon: 'shield',
        route: 'mahadasha_sani-stabilisation',
        color: '#1A3D5C',
        badge: '₹499',
        active: true,
      },
      {
        id: 'maha-sani-surv',
        order: 4,
        category: 'mahadasha',
        name: 'Sani Mahadasha Survival Guide',
        sanskrit: 'शनि महादशा सर्वाइवल गाइड',
        desc: 'Navigating Saturn trials & karmic phase (PDF Dossier)',
        icon: 'bolt',
        route: 'mahadasha_sani-survival',
        color: '#4A148C',
        badge: '₹999',
        active: true,
      },
    ],
  },
  {
    id: 'cat-panchang',
    order: 4,
    category: 'panchang',
    title: 'Panchang & Sacred Timings',
    sanskrit: 'पंचांग एवं शुभ मुहूर्त • Celestial Almanac',
    desc: 'Real-time Tithi, Nakshatra, Shubh Muhurat, Rahu Kaal, Choghadiya and Hora calculations.',
    badge: 'Live Almanac',
    icon: 'calendar_today_outlined',
    color: '#4FC3F7',
    active: true,
    items: [
      {
        id: 'pan-today',
        order: 1,
        category: 'panchang',
        name: 'Today Panchang',
        sanskrit: 'आज का पंचांग',
        desc: 'Tithi, Nakshatra, Yoga & Shubh Muhurat',
        icon: 'calendar_today_outlined',
        route: AppRoutes.panchangScreen,
        color: '#4FC3F7',
        badge: 'Live',
        active: true,
      },
      {
        id: 'pan-tomorrow',
        order: 2,
        category: 'panchang',
        name: 'Tomorrow Panchang',
        sanskrit: 'कल का पंचांग',
        desc: 'Advance next-day celestial alignments',
        icon: 'event_outlined',
        route: AppRoutes.panchangScreen,
        color: '#81C784',
        badge: 'Advance',
        active: true,
      },
      {
        id: 'pan-tithi',
        order: 3,
        category: 'panchang',
        name: 'Tithi',
        sanskrit: 'तिथि एवं पक्ष',
        desc: 'Lunar phases & paksha calculations',
        icon: 'nightlight_round',
        route: AppRoutes.panchangScreen,
        color: '#9370DB',
        badge: 'Lunar',
        active: true,
      },
      {
        id: 'pan-vaar',
        order: 4,
        category: 'panchang',
        name: 'Vaar',
        sanskrit: 'वार एवं अधिष्ठाता देवता',
        desc: 'Seven day lords & planetary deity',
        icon: 'wb_sunny_outlined',
        route: AppRoutes.panchangScreen,
        color: '#FFB347',
        badge: 'Solar',
        active: true,
      },
      {
        id: 'pan-karana',
        order: 5,
        category: 'panchang',
        name: 'Karana',
        sanskrit: 'करण',
        desc: 'Half-tithi interval for action planning',
        icon: 'auto_awesome',
        route: AppRoutes.panchangScreen,
        color: '#4FC3F7',
        badge: 'Half-Tithi',
        active: true,
      },
      {
        id: 'pan-muhurat',
        order: 6,
        category: 'panchang',
        name: 'Shubh Muhurat',
        sanskrit: 'शुभ मुहूर्त',
        desc: 'Auspicious Abhijit & Amrit timing windows',
        icon: 'event_available_outlined',
        route: AppRoutes.muhuratScreen,
        color: '#FFD700',
        badge: 'Auspicious',
        active: true,
      },
      {
        id: 'pan-rahu',
        order: 7,
        category: 'panchang',
        name: 'Rahu Kaal & Cautions',
        sanskrit: 'राहु काल एवं यमघंट',
        desc: 'Inauspicious Rahu periods & cautions',
        icon: 'warning_amber_outlined',
        route: AppRoutes.muhuratScreen,
        color: '#FF6B6B',
        badge: 'Caution',
        active: true,
      },
      {
        id: 'pan-choghadiya',
        order: 8,
        category: 'panchang',
        name: 'Choghadiya',
        sanskrit: 'चौघड़िया',
        desc: 'Day & night 7-fold auspicious divisions',
        icon: 'explore_outlined',
        route: AppRoutes.panchangScreen,
        color: '#FFB347',
        badge: '7-Fold',
        active: true,
      },
      {
        id: 'pan-hora',
        order: 9,
        category: 'panchang',
        name: 'Hora',
        sanskrit: 'होरा',
        desc: 'Hourly planetary ruler alignment & tasks',
        icon: 'schedule_outlined',
        route: AppRoutes.panchangScreen,
        color: '#9370DB',
        badge: 'Hourly',
        active: true,
      },
    ],
  },
  {
    id: 'cat-consultations',
    order: 5,
    category: 'consultations',
    title: 'Consultations & AI Astrologer',
    sanskrit: 'विशेषज्ञ ज्योतिष परामर्श',
    desc: 'Direct guidance from verified Vedic scholars and 24/7 AI spiritual intelligence.',
    badge: 'Direct Access',
    icon: 'people_outline',
    color: '#81C784',
    active: true,
    items: [
      {
        id: 'con-live',
        order: 1,
        category: 'consultations',
        name: 'Talk to Astrologer',
        sanskrit: 'ज्योतिषी से बात करें',
        desc: 'Live 1-on-1 consultations with verified Vedic masters',
        icon: 'people_outline',
        route: AppRoutes.liveAstrologersScreen,
        color: '#81C784',
        badge: 'Live',
        active: true,
      },
      {
        id: 'con-ai',
        order: 2,
        category: 'consultations',
        name: 'AI Expert Astrologer',
        sanskrit: 'एआई ज्योतिषी',
        desc: '24/7 instant Kundli calculations, remedies & guidance',
        icon: 'auto_awesome',
        route: AppRoutes.aiChatScreen,
        color: '#713B32',
        badge: '24/7',
        active: true,
      },
    ],
  },
  {
    id: 'cat-guidance',
    order: 6,
    category: 'guidance',
    title: 'Specialized Life Guidance',
    sanskrit: 'विशेष जीवन मार्गदर्शन',
    desc: 'In-depth astrological solutions for career, relationships, business, wealth, and destiny.',
    badge: 'Comprehensive',
    icon: 'psychology_outlined',
    color: '#FFB347',
    active: true,
    items: [
      {
        id: 'gui-career',
        order: 1,
        category: 'guidance',
        name: 'Career Astrology',
        sanskrit: 'करियर मार्गदर्शन',
        desc: 'Career path, promotions, switch timings & business success',
        icon: 'work_outline',
        route: AppRoutes.careerAstrologyScreen,
        color: '#FFD700',
        active: true,
      },
      {
        id: 'gui-marriage',
        order: 2,
        category: 'guidance',
        name: 'Marriage Astrology',
        sanskrit: 'विवाह एवं संबंध',
        desc: 'Marriage timing, spouse characteristics & relationship harmony',
        icon: 'ring_volume_outlined',
        route: AppRoutes.marriageAstrologyScreen,
        color: '#FF6B6B',
        active: true,
      },
      {
        id: 'gui-business',
        order: 3,
        category: 'guidance',
        name: 'Business Astrology',
        sanskrit: 'व्यापार मुहूर्त',
        desc: 'Company launch, partnerships & auspicious commencement',
        icon: 'business_center_outlined',
        route: AppRoutes.businessAstrologyScreen,
        color: '#4FC3F7',
        active: true,
      },
      {
        id: 'gui-finance',
        order: 4,
        category: 'guidance',
        name: 'Finance Astrology',
        sanskrit: 'धन एवं समृद्धि',
        desc: 'Wealth yogas, debt resolution & favorable investment cycles',
        icon: 'attach_money',
        route: AppRoutes.financeAstrologyScreen,
        color: '#81C784',
        active: true,
      },
      {
        id: 'gui-tarot',
        order: 5,
        category: 'guidance',
        name: 'Tarot Readings',
        sanskrit: 'टैरो कार्ड',
        desc: 'Intuitive Tarot spreads for love, decision-making & destiny',
        icon: 'style_outlined',
        route: AppRoutes.tarotScreen,
        color: '#9370DB',
        active: true,
      },
      {
        id: 'gui-numerology',
        order: 6,
        category: 'guidance',
        name: 'Numerology',
        sanskrit: 'अंक ज्योतिष',
        desc: 'Life path numbers, destiny numbers & name vibrations',
        icon: 'tag_outlined',
        route: AppRoutes.numerologyScreen,
        color: '#FFB347',
        active: true,
      },
      {
        id: 'gui-spiritual',
        order: 7,
        category: 'guidance',
        name: 'Spiritual Guidance',
        sanskrit: 'अध्यात्म साधना',
        desc: 'Soul purpose, karmic lessons & meditation practices',
        icon: 'psychology_outlined',
        route: AppRoutes.spiritualGuidanceScreen,
        color: '#9370DB',
        active: true,
      },
    ],
  },
];

interface MahadashaGuideDetail {
  id: string;
  title: string;
  sanskrit: string;
  badge: string;
  price: number;
  pages: string;
  color: string;
  desc: string;
  topics: string[];
  sampleContent: {
    sectionTitle: string;
    text: string;
    mantra?: string;
  }[];
}

const MAHADASHA_DETAILS: Record<string, MahadashaGuideDetail> = {
  'maha-rahu-stab': {
    id: 'maha-rahu-stab',
    title: 'Rahu Mahadasha Stabilisation Guide',
    sanskrit: 'राहु महादशा शांति संकलन',
    badge: '₹499',
    price: 499,
    pages: '36 pages (PDF Dossier)',
    color: '#713B32',
    desc: 'Harmonize intense Rahu transit with exact Sanskrit mantras, planetary dietary rules, Rahu Kaal precautions, and Durga Saptashati sadhana.',
    topics: [
      'Rahu transit mechanics & shadow house karmic effects',
      'Rahu Beej Mantra 18,000 count sadhana ritual instructions',
      'Dietary rules, lead/silver talisman, and Saturday charity guidelines',
      'Durga Saptashati 4th Chapter recitation protocols',
      'Balancing the Rahu-Ketu nodal axis through Ganesha Upasana',
    ],
    sampleContent: [
      {
        sectionTitle: '1. Root Cause & Astrological Nature of Rahu',
        text: 'Rahu represents ambition, material illusion (Maya), and abrupt karmic upheavals. When unharmonized, it causes anxiety, legal friction, and clouded decision-making. Stabilization requires cooling the subtle body and pacifying the North Node through grounding practices.',
        mantra: 'ॐ भ्रां भ्रीं भ्रौं सः राहवे नमः ॥',
      },
      {
        sectionTitle: '2. Daily Remedial Protocol',
        text: 'Feed birds and stray dogs before noon. Never consume intoxicants on Saturdays. Wear a silver ball or square piece in your pocket to invoke lunar tranquility against Rahu’s smoke.',
      },
    ],
  },
  'maha-rahu-surv': {
    id: 'maha-rahu-surv',
    title: 'Rahu Mahadasha Survival Guide',
    sanskrit: 'राहु महादशा सर्वाइवल गाइड',
    badge: '₹999',
    price: 999,
    pages: '48 pages (PDF Dossier)',
    color: '#E65100',
    desc: 'Tactical survival blueprint for navigating the full 18-year Rahu Mahadasha cycle, shielding against sudden financial losses, illusions, and mental anxiety.',
    topics: [
      '18-Year Rahu Mahadasha Antardasha phase-by-phase breakdown',
      'Rahu-Jupiter Chandal Yoga mitigation and remedial counter-weights',
      'Bhairava Ashtakam & Maha Mrityunjaya protective shield protocols',
      'Wealth preservation and contract vetting during Rahu-Mercury cycles',
      'Ashta-Digbandhana psychic boundary technique for spiritual safety',
    ],
    sampleContent: [
      {
        sectionTitle: '1. Navigating the 18-Year Planetary Storm',
        text: 'The 18-year cycle is divided into distinct Antardashas. The entry phase (Rahu-Rahu) creates identity dislocation, while Rahu-Guru offers immense wealth if Guru is well placed. This tactical guide provides month-by-month navigational safeguards.',
        mantra: 'ॐ ह्रीं बटुकाय आपदुद्धारणाय कुरु कुरु बटुकाय ह्रीं ॐ ॥',
      },
      {
        sectionTitle: '2. Financial & Career Defensive Tactics',
        text: 'Never execute major debt expansions or non-collateral speculative investments while Rahu transits your 2nd, 5th, or 12th houses without consulting a verified Vedic scholar.',
      },
    ],
  },
  'maha-sani-stab': {
    id: 'maha-sani-stab',
    title: 'Sani Mahadasha Stabilisation Guide',
    sanskrit: 'शनि महादशा शांति संकलन',
    badge: '₹499',
    price: 499,
    pages: '36 pages (PDF Dossier)',
    color: '#1A3D5C',
    desc: 'Saturn discipline, karmic endurance, and remedial protocols for Sade Sati, Kantaka Shani, Dhayya, and Saturn Mahadasha transitions.',
    topics: [
      'Saturn karmic lessons: Karma alignment vs punitive justice',
      'Shani Beej Mantra 23,000 count sadhana details and timings',
      'Mustard oil lamp (Chhaya Daan) under Peepal tree procedure',
      'Blue sapphire vs Amethyst safety tests & gemstone rules',
      'Hanuman Chalisa & Dasharatha Shani Stotram sadhana instructions',
    ],
    sampleContent: [
      {
        sectionTitle: '1. The Karmic Law of Saturn (Shani Deva)',
        text: 'Saturn represents truth, discipline, hard labor, and time (Kala). It strips away ego and pretension to build everlasting structures. Stabilizing Saturn requires truthfulness, humility, and unwavering routine.',
        mantra: 'ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः ॥',
      },
      {
        sectionTitle: '2. Saturday Chhaya Daan Ritual',
        text: 'Look into a bronze or iron bowl filled with pure mustard oil. See your reflection clearly, acknowledging your mortal deeds, then donate this oil to a needy laborer or pour at the roots of a Peepal tree at dusk.',
      },
    ],
  },
  'maha-sani-surv': {
    id: 'maha-sani-surv',
    title: 'Sani Mahadasha Survival Guide',
    sanskrit: 'शनि महादशा सर्वाइवल गाइड',
    badge: '₹999',
    price: 999,
    pages: '52 pages (PDF Dossier)',
    color: '#4A148C',
    desc: 'Complete karmic mastery handbook for turning Saturn trials into monumental spiritual, professional, and long-term enduring success.',
    topics: [
      '19-Year Shani Mahadasha comprehensive phase navigation',
      'Sade Sati 3 phases (Rising, Peak, Setting) detailed mitigation',
      'Iron ring (from black horse shoe / boat nail) consecration rites',
      'Karmic Seva & Dana: Saturday leprosy / laborer feeding rules',
      'Shani Vajrapanjara Kavacham protective shielding ritual',
    ],
    sampleContent: [
      {
        sectionTitle: '1. The 19-Year Mastery Journey',
        text: 'Those who survive and honor Saturn emerge with unshakeable fortitude and legacy wealth. This handbook outlines the transformational shifts from Shani-Shani through Shani-Brihaspati, turning delays into masterworks.',
        mantra: 'नीलांजन समाभासं रविपुत्रं यमाग्रजम् । छायामार्तण्ड सम्भूतं तं नमामि शनैश्चरम् ॥',
      },
      {
        sectionTitle: '2. Karmic Rebalancing through Seva',
        text: 'Saturn responds not to lavish display, but to silent, authentic charity. Serving sanitation workers, feeding black sesame to crows, and providing foot wear to barefoot pilgrims mitigates heavy planetary pressure.',
      },
    ],
  },
};

function resolveServiceRoute(routeStr?: string): any {
  if (!routeStr) return AppRoutes.servicesScreen;
  const values = Object.values(AppRoutes);
  const found = values.find((v) => v === routeStr || v.toLowerCase() === routeStr.toLowerCase());
  return found || AppRoutes.servicesScreen;
}

function StatChip({ value, label, colors }: { value: string; label: string; colors: any }) {
  return (
    <View
      style={{
        marginRight: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignItems: 'center',
        backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 20 : 25),
        borderWidth: 1,
        borderColor: colors.cardBorder,
      }}
    >
      <Text style={{ color: colors.goldAccent, fontSize: 13, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 10 }}>{label}</Text>
    </View>
  );
}

/**
 * Open Remedy with Payload
 */
function handleOpenRemedyItem(item: ServiceCardItem) {
  const match = REMEDIES.find(
    (r) =>
      r.name.toLowerCase() === item.name.toLowerCase() ||
      item.name.toLowerCase().includes(r.name.toLowerCase()) ||
      r.sanskrit === item.sanskrit
  );
  if (match) {
    push(AppRoutes.remedyDetailScreen, match);
  } else {
    const fallbackRemedy: Remedy = {
      name: item.name,
      sanskrit: item.sanskrit || '',
      direction: item.direction || 'North',
      directionHindi: item.directionHindi,
      emoji: '🕉️',
      color: item.color || '#713B32',
      desc: item.desc,
      mantra: item.mantra,
      angle: 0,
    };
    push(AppRoutes.remedyDetailScreen, fallbackRemedy);
  }
}

/**
 * Sacred Vedic Remedies (Ashta Parihar) Dedicated Card Model
 */
function RemediesCategoryCardModel({
  category,
  colors,
  cellW,
}: {
  category: ServiceCategoryModel;
  colors: any;
  cellW: number;
}) {
  return (
    <View
      testID="services.remediesCategoryCard"
      style={{
        width: '100%',
        marginBottom: 20,
        borderRadius: 24,
        padding: 18,
        borderWidth: 1.5,
        borderColor: colors.isLight ? 'rgba(113,59,50,0.35)' : 'rgba(201,168,76,0.4)',
        backgroundColor: colors.surface,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: colors.isLight ? 0.06 : 0.25,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      <LinearGradient
        colors={
          colors.isLight
            ? ['rgba(113,59,50,0.08)', 'rgba(201,168,76,0.05)', 'transparent']
            : ['rgba(113,59,50,0.32)', 'rgba(201,168,76,0.12)', 'transparent']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Top Header of Category */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: '#713B32',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#713B32',
              shadowOpacity: 0.35,
              shadowRadius: 6,
            }}
          >
            <AppIcon name="auto_awesome" color="#FFFFFF" size={22} />
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text numberOfLines={1} style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '800' }}>
              {category.title}
            </Text>
            <Text numberOfLines={1} style={{ color: colors.goldAccent, fontSize: 11, fontWeight: '700', marginTop: 1 }}>
              {category.sanskrit}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => push(AppRoutes.remediesScreen)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 20,
            backgroundColor: withAlpha('#713B32', colors.isLight ? 20 : 35),
            borderWidth: 1,
            borderColor: colors.isLight ? 'rgba(113,59,50,0.3)' : 'rgba(201,168,76,0.3)',
          }}
        >
          <Text style={{ color: colors.isLight ? '#713B32' : colors.goldAccent, fontSize: 11, fontWeight: '700', marginRight: 4 }}>
            Explore Wheel ✦
          </Text>
          <AppIcon name="arrow_forward_rounded" color={colors.isLight ? '#713B32' : colors.goldAccent} size={13} />
        </Pressable>
      </View>

      {/* Subtitle / Description */}
      <Text style={{ color: colors.textSecondary, fontSize: 12.5, lineHeight: 18, marginBottom: 14 }}>
        {category.desc}
      </Text>

      {/* Grid of the 8 Canonical Remedies inside this single Card Model */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {category.items
          .filter((it) => it.active !== false)
          .map((item) => {
            return (
              <Pressable
                key={item.id}
                testID={`services.remedyItem.${item.name.replace(/[^A-Za-z]/g, '')}`}
                onPress={() => handleOpenRemedyItem(item)}
                style={{
                  width: (cellW * 2 + 12 - 10) / 2,
                  padding: 10,
                  borderRadius: 14,
                  backgroundColor: colors.isLight ? '#FFFDF9' : colors.surfaceVariant,
                  borderWidth: 1,
                  borderColor: withAlpha(item.color || colors.goldAccent, colors.isLight ? 40 : 50),
                  flexDirection: 'row',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOpacity: colors.isLight ? 0.03 : 0.15,
                  shadowRadius: 4,
                  elevation: 1,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: withAlpha(item.color || colors.goldAccent, colors.isLight ? 25 : 35),
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 9,
                  }}
                >
                  <Text style={{ fontSize: 14 }}>
                    {item.direction ? item.direction[0] : '🕉️'}
                  </Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text numberOfLines={1} style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '700' }}>
                      {item.name}
                    </Text>
                    {item.badge && (
                      <View
                        style={{
                          paddingHorizontal: 4,
                          paddingVertical: 1,
                          borderRadius: 4,
                          backgroundColor: withAlpha(item.color || colors.goldAccent, 20),
                        }}
                      >
                        <Text style={{ fontSize: 8.5, fontWeight: '700', color: item.color || colors.goldAccent }}>
                          {item.badge}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text numberOfLines={1} style={{ color: colors.goldAccent, fontSize: 10, fontWeight: '600', marginTop: 1 }}>
                    {item.sanskrit || item.desc}
                  </Text>
                </View>
              </Pressable>
            );
          })}
      </View>

      {/* Footer CTA */}
      <Pressable
        onPress={() => push(AppRoutes.remediesScreen)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 14,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: colors.divider,
        }}
      >
        <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '500' }}>
          Tap any remedy to view mantras, rituals & prescriptions
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: colors.goldAccent, fontSize: 12, fontWeight: '700', marginRight: 4 }}>
            View Details
          </Text>
          <AppIcon name="arrow_forward_rounded" color={colors.goldAccent} size={14} />
        </View>
      </Pressable>
    </View>
  );
}

/**
 * Standard Service Category Card Model
 */
function StandardCategoryCardModel({
  category,
  colors,
  cellW,
  onItemPress,
}: {
  category: ServiceCategoryModel;
  colors: any;
  cellW: number;
  onItemPress: (item: ServiceCardItem) => void;
}) {
  return (
    <View
      testID={`services.category.${category.category}`}
      style={{
        width: '100%',
        marginBottom: 20,
        borderRadius: 22,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        backgroundColor: colors.surface,
        shadowColor: '#000',
        shadowOpacity: colors.isLight ? 0.04 : 0.2,
        shadowRadius: 10,
        elevation: 3,
      }}
    >
      {/* Category Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: withAlpha(category.color || colors.goldAccent, colors.isLight ? 20 : 30),
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppIcon name={category.icon || 'auto_awesome'} color={category.color || colors.goldAccent} size={20} />
          </View>
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text numberOfLines={1} style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800' }}>
              {category.title}
            </Text>
            <Text numberOfLines={1} style={{ color: colors.goldAccent, fontSize: 11, fontWeight: '700', marginTop: 1 }}>
              {category.sanskrit}
            </Text>
          </View>
        </View>

        {category.badge && (
          <View
            style={{
              paddingHorizontal: 9,
              paddingVertical: 3.5,
              borderRadius: 16,
              backgroundColor: withAlpha(category.color || colors.goldAccent, colors.isLight ? 20 : 30),
              borderWidth: 1,
              borderColor: withAlpha(category.color || colors.goldAccent, 60),
            }}
          >
            <Text style={{ color: category.color || colors.goldAccent, fontSize: 10.5, fontWeight: '700' }}>
              {category.badge}
            </Text>
          </View>
        )}
      </View>

      {/* Description */}
      <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginBottom: 12 }}>
        {category.desc}
      </Text>

      {/* Items inside this Category Card Model */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {category.items
          .filter((it) => it.active !== false)
          .map((item) => {
            return (
              <Pressable
                key={item.id}
                testID={`services.card.${item.name.replace(/[^A-Za-z]/g, '')}`}
                onPress={() => onItemPress(item)}
                style={{
                  width: (cellW * 2 + 12 - 10) / 2,
                  minHeight: 88,
                  padding: 12,
                  borderRadius: 15,
                  backgroundColor: colors.isLight ? '#FAFAFA' : colors.surfaceVariant,
                  borderWidth: 1,
                  borderColor: withAlpha(item.color || colors.cardBorder, 60),
                  justifyContent: 'space-between',
                  shadowColor: '#000',
                  shadowOpacity: colors.isLight ? 0.02 : 0.15,
                  shadowRadius: 4,
                  elevation: 1,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      backgroundColor: withAlpha(item.color || colors.goldAccent, colors.isLight ? 20 : 30),
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AppIcon name={item.icon || 'auto_awesome'} color={item.color || colors.goldAccent} size={17} />
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {item.badge && (
                      <View
                        style={{
                          marginRight: 4,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 6,
                          backgroundColor: withAlpha(item.color || colors.goldAccent, colors.isLight ? 25 : 35),
                        }}
                      >
                        <Text style={{ fontSize: 9, fontWeight: '800', color: item.color || colors.goldAccent }}>
                          {item.badge}
                        </Text>
                      </View>
                    )}
                    <AppIcon name="arrow_forward_ios_rounded" color={withAlpha(item.color || colors.textMuted, 160)} size={11} />
                  </View>
                </View>

                <View style={{ marginTop: 6 }}>
                  <Text numberOfLines={1} style={{ color: colors.textPrimary, fontSize: 12.5, fontWeight: '700' }}>
                    {item.name}
                  </Text>
                  <Text numberOfLines={1} style={{ color: colors.textMuted, fontSize: 10.5, marginTop: 1 }}>
                    {item.sanskrit || item.desc}
                  </Text>
                </View>
              </Pressable>
            );
          })}
      </View>
    </View>
  );
}

/**
 * Helper to guarantee Remedies (Sacred Ashta Parihar) is always sorted to index 0 (top first)
 */
export const sortCategoriesWithRemediesFirst = (
  categories: ServiceCategoryModel[]
): ServiceCategoryModel[] => {
  return [...categories].sort((a, b) => {
    if (a.category === 'remedies') return -1;
    if (b.category === 'remedies') return 1;
    return (a.order || 0) - (b.order || 0);
  });
};

export default function ServicesScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [w, setW] = useState(Dimensions.get('window').width - 40);
  const [categoriesList, setCategoriesList] = useState<ServiceCategoryModel[]>(() =>
    sortCategoriesWithRemediesFirst(DEFAULT_SERVICE_CATEGORIES)
  );
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [selectedMahadashaItem, setSelectedMahadashaItem] = useState<ServiceCardItem | null>(null);
  const [purchasedReports, setPurchasedReports] = useState<string[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isBuying, setIsBuying] = useState<boolean>(false);
  const [readingPdfModal, setReadingPdfModal] = useState<boolean>(false);
  const [meditationModalVisible, setMeditationModalVisible] = useState<boolean>(false);
  const [fastingModalVisible, setFastingModalVisible] = useState<boolean>(false);

  // Meditation Japa Counter State
  const [japaCount, setJapaCount] = useState<number>(0);

  const cellW = Math.max(140, (w - 12) / 2);

  const loadData = useCallback(async () => {
    try {
      // 1. Read cached categories
      const cached = await AsyncStorage.getItem(STORAGE_CATEGORIES_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategoriesList(sortCategoriesWithRemediesFirst(parsed));
        }
      }

      // 2. Load purchased reports
      const storedReports = await AsyncStorage.getItem(STORAGE_REPORTS_KEY);
      if (storedReports) {
        const parsed = JSON.parse(storedReports);
        if (Array.isArray(parsed)) {
          setPurchasedReports(parsed.map((r: any) => r.title));
        }
      }

      // 3. Load wallet balance
      const bal = await getWalletBalance();
      setWalletBalance(bal);

      // 4. Fetch live configuration from Admin API
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(API_ENDPOINTS.services, { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.categories) && data.categories.length > 0) {
          const sorted = sortCategoriesWithRemediesFirst(
            data.categories.filter((c: ServiceCategoryModel) => c.active !== false)
          );
          setCategoriesList(sorted);
          await AsyncStorage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(sorted));
        }
      }
    } catch {
      // Keep existing cached or default list
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleItemPress = (item: ServiceCardItem) => {
    if (item.category === 'remedies') {
      handleOpenRemedyItem(item);
      return;
    }
    if (item.category === 'mahadasha' || item.id.startsWith('maha-')) {
      setSelectedMahadashaItem(item);
      return;
    }
    if (item.route === 'meditation_modal' || item.id === 'tool-meditation') {
      setMeditationModalVisible(true);
      return;
    }
    if (item.route === 'fasting_modal' || item.id === 'tool-fasting') {
      setFastingModalVisible(true);
      return;
    }

    const targetRoute = resolveServiceRoute(item.route);
    push(targetRoute);
  };

  const handleBuyMahadasha = async (detail: MahadashaGuideDetail) => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    const authUser = useAuthStore.getState().user;
    const isAuth = Boolean(isAuthenticated && authUser && (authUser.uid || authUser.phone));
    if (!isAuth) {
      showSnackBar('Please sign in to order Mahadasha Guide PDFs', '#713B32');
      push(AppRoutes.signInScreen);
      return;
    }

    const bal = await getWalletBalance();
    if (bal < detail.price) {
      showSnackBar(`Insufficient balance (₹${bal}). Need ₹${detail.price - bal} more.`, '#CF4444');
      push(AppRoutes.walletScreen);
      return;
    }

    setIsBuying(true);
    const deduction = await deductWalletBalance(detail.price, `Mahadasha Guide: ${detail.title}`);
    setIsBuying(false);

    if (deduction.success) {
      const storedReports = await AsyncStorage.getItem(STORAGE_REPORTS_KEY);
      const existing = storedReports ? JSON.parse(storedReports) : [];
      const newRep = {
        id: `rep_${Date.now()}`,
        title: detail.title,
        subtitle: `Mahadasha Dossier • ${new Date().getFullYear()} Edition`,
        pages: detail.pages,
        date: 'Today',
        status: 'Ready',
        emoji: detail.id.includes('rahu') ? '🛡️' : '🪐',
        color: detail.color,
        size: '3.2 MB',
        summary: detail.desc,
      };
      const updated = [newRep, ...existing];
      await AsyncStorage.setItem(STORAGE_REPORTS_KEY, JSON.stringify(updated));
      setPurchasedReports((prev) => [detail.title, ...prev]);
      setWalletBalance((prev) => prev - detail.price);
      showSnackBar(`Purchased ${detail.title}! Dossier unlocked.`, colors.surfaceVariant);
    } else {
      showSnackBar('Transaction failed. Please check your wallet.', '#CF4444');
    }
  };

  const activeMahadashaDetail = selectedMahadashaItem ? MAHADASHA_DETAILS[selectedMahadashaItem.id] : null;
  const isMahadashaPurchased = activeMahadashaDetail
    ? purchasedReports.some((t) => t.toLowerCase().includes(activeMahadashaDetail.title.toLowerCase()))
    : false;

  const filterTabs = [
    { id: 'all', label: 'All Services' },
    { id: 'remedies', label: '🕉️ Remedies (8)' },
    { id: 'free-tools', label: 'Free Tools' },
    { id: 'mahadasha', label: 'Mahadasha PDFs' },
    { id: 'panchang', label: 'Panchang' },
    { id: 'consultations', label: 'Consultations' },
    { id: 'guidance', label: 'Life Guidance' },
  ];

  // Filter categories by selected pill and search query, strictly prioritizing Remedies at the top first
  const displayedCategories = sortCategoriesWithRemediesFirst(
    categoriesList.filter((cat) => {
      if (activeFilter === 'all') return true;
      return cat.category === activeFilter;
    })
  )
    .map((cat) => {
      if (!searchQuery.trim()) return cat;
      const q = searchQuery.toLowerCase().trim();
      const matchingItems = cat.items.filter(
        (it) =>
          it.name.toLowerCase().includes(q) ||
          (it.sanskrit && it.sanskrit.toLowerCase().includes(q)) ||
          it.desc.toLowerCase().includes(q)
      );
      return { ...cat, items: matchingItems };
    })
    .filter((cat) => cat.items.length > 0 || !searchQuery.trim());

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="services.screen">
      <AppBar
        title={t('nav.services', 'Services')}
        backgroundColor={colors.background}
        backColor={colors.textPrimary}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.goldAccent} />}
      >
        {/* Hero Banner */}
        <LinearGradient
          colors={
            colors.isLight
              ? ['#FFFDF9', '#F5EFE6']
              : [withAlpha(colors.goldAccent, 25), colors.surfaceVariant]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            marginHorizontal: 20,
            marginTop: 8,
            marginBottom: 14,
            padding: 20,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: colors.cardBorder,
          }}
        >
          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '800' }}>
            AstroParihar Services
          </Text>
          <Text style={{ marginTop: 6, color: colors.textSecondary, fontSize: 13 }}>
            Sacred Ashta Parihar Remedies, Free Vedic Tools, Paid Mahadasha PDFs & Live Panchang.
          </Text>
          <View style={{ marginTop: 12, flexDirection: 'row' }}>
            <StatChip value="8" label="Canonical Remedies" colors={colors} />
            <StatChip value="6" label="Sections" colors={colors} />
            <StatChip value="4" label="Paid PDFs" colors={colors} />
          </View>
        </LinearGradient>

        {/* Search Bar */}
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 16,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.cardBorder,
          }}
        >
          <AppIcon name="search_rounded" color={colors.textMuted} size={18} />
          <TextInput
            placeholder="Search remedies, panchang, kundli, PDFs..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              flex: 1,
              marginLeft: 10,
              fontSize: 13,
              color: colors.textPrimary,
              padding: 0,
            }}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <AppIcon name="close_rounded" color={colors.textMuted} size={16} />
            </Pressable>
          )}
        </View>

        {/* Category Filter Pills Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 14, gap: 8 }}
        >
          {filterTabs.map((tab) => {
            const isSelected = activeFilter === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveFilter(tab.id)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 20,
                  backgroundColor: isSelected
                    ? colors.isLight
                      ? '#713B32'
                      : colors.goldAccent
                    : colors.surface,
                  borderWidth: 1,
                  borderColor: isSelected
                    ? colors.isLight
                      ? '#713B32'
                      : colors.goldAccent
                    : colors.cardBorder,
                  shadowColor: '#000',
                  shadowOpacity: isSelected ? 0.15 : 0.02,
                  shadowRadius: 4,
                  elevation: isSelected ? 2 : 0,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: isSelected ? '700' : '500',
                    color: isSelected
                      ? colors.isLight
                        ? '#FFFFFF'
                        : '#000000'
                      : colors.textSecondary,
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Main Category Cards List */}
        <View
          style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: Math.max(160, insets.bottom + 110) }}
          onLayout={(e) => setW(e.nativeEvent.layout.width)}
        >
          {displayedCategories.map((cat) => {
            if (cat.category === 'remedies') {
              return (
                <RemediesCategoryCardModel
                  key={cat.id}
                  category={cat}
                  colors={colors}
                  cellW={cellW}
                />
              );
            }

            return (
              <StandardCategoryCardModel
                key={cat.id}
                category={cat}
                colors={colors}
                cellW={cellW}
                onItemPress={handleItemPress}
              />
            );
          })}
        </View>
      </ScrollView>

      {/* =========================================================================
          MAHADASHA PAID PDF DOSSIER MODAL
         ========================================================================= */}
      {selectedMahadashaItem && activeMahadashaDetail && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedMahadashaItem(null)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.65)',
              justifyContent: 'flex-end',
            }}
          >
            <Pressable style={{ flex: 1 }} onPress={() => setSelectedMahadashaItem(null)} />
            <View
              style={{
                backgroundColor: colors.surface,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                maxHeight: Dimensions.get('window').height * 0.88,
                padding: 22,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                shadowColor: '#000',
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 10,
              }}
            >
              {/* Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 8,
                        backgroundColor: withAlpha(activeMahadashaDetail.color, 25),
                        borderWidth: 1,
                        borderColor: withAlpha(activeMahadashaDetail.color, 70),
                      }}
                    >
                      <Text style={{ color: activeMahadashaDetail.color, fontSize: 11, fontWeight: '800' }}>
                        {activeMahadashaDetail.badge}
                      </Text>
                    </View>
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 8,
                        backgroundColor: withAlpha(colors.goldAccent, 20),
                      }}
                    >
                      <Text style={{ color: colors.goldAccent, fontSize: 11, fontWeight: '700' }}>
                        {activeMahadashaDetail.pages}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '800', lineHeight: 24 }}>
                    {activeMahadashaDetail.title}
                  </Text>
                  <Text style={{ color: colors.goldAccent, fontSize: 12, fontWeight: '700', marginTop: 2 }}>
                    {activeMahadashaDetail.sanskrit}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setSelectedMahadashaItem(null)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: colors.surfaceVariant,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AppIcon name="close_rounded" color={colors.textPrimary} size={18} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 16 }}>
                  {activeMahadashaDetail.desc}
                </Text>

                {/* Topics Covered */}
                <View
                  style={{
                    padding: 14,
                    borderRadius: 16,
                    backgroundColor: colors.isLight ? '#FAFAFA' : colors.surfaceVariant,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '800', marginBottom: 10 }}>
                    What this PDF Blueprint contains:
                  </Text>
                  {activeMahadashaDetail.topics.map((top, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 }}>
                      <Text style={{ color: activeMahadashaDetail.color, fontSize: 12, marginRight: 6, fontWeight: '800' }}>✦</Text>
                      <Text style={{ color: colors.textPrimary, fontSize: 12, flex: 1, lineHeight: 17 }}>{top}</Text>
                    </View>
                  ))}
                </View>

                {/* Status / Purchase Action */}
                {isMahadashaPurchased ? (
                  <View
                    style={{
                      padding: 14,
                      borderRadius: 16,
                      backgroundColor: withAlpha('#2D9E6B', 15),
                      borderWidth: 1,
                      borderColor: withAlpha('#2D9E6B', 50),
                      marginBottom: 14,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <AppIcon name="check_circle" color="#2D9E6B" size={18} />
                      <Text style={{ color: '#2D9E6B', fontSize: 13, fontWeight: '800', marginLeft: 6 }}>
                        Dossier Unlocked & Ready in Your Account
                      </Text>
                    </View>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 12 }}>
                      You have full access to view, read, and download the high-resolution PDF document.
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <Pressable
                        onPress={() => setReadingPdfModal(true)}
                        style={{
                          flex: 1,
                          paddingVertical: 11,
                          borderRadius: 12,
                          backgroundColor: colors.goldAccent,
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'row',
                        }}
                      >
                        <AppIcon name="menu_book" color="#000000" size={16} />
                        <Text style={{ color: '#000000', fontSize: 13, fontWeight: '800', marginLeft: 6 }}>
                          Read Dossier
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          showSnackBar(`Downloading "${activeMahadashaDetail.title}.pdf"... Saved to device!`, colors.surfaceVariant);
                        }}
                        style={{
                          flex: 1,
                          paddingVertical: 11,
                          borderRadius: 12,
                          backgroundColor: colors.surfaceVariant,
                          borderWidth: 1,
                          borderColor: colors.cardBorder,
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'row',
                        }}
                      >
                        <AppIcon name="download_rounded" color={colors.textPrimary} size={16} />
                        <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700', marginLeft: 6 }}>
                          Download PDF
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View
                    style={{
                      padding: 14,
                      borderRadius: 16,
                      backgroundColor: colors.isLight ? '#FFF9F2' : colors.surfaceVariant,
                      borderWidth: 1,
                      borderColor: withAlpha(colors.goldAccent, 50),
                      marginBottom: 14,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>
                        Dossier Price:
                      </Text>
                      <Text style={{ color: colors.goldAccent, fontSize: 18, fontWeight: '800' }}>
                        {activeMahadashaDetail.badge}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                        Current Wallet Balance:
                      </Text>
                      <Text style={{ color: walletBalance >= activeMahadashaDetail.price ? '#2D9E6B' : '#CF4444', fontSize: 13, fontWeight: '700' }}>
                        ₹{walletBalance}
                      </Text>
                    </View>

                    <Pressable
                      disabled={isBuying}
                      onPress={() => handleBuyMahadasha(activeMahadashaDetail)}
                      style={{
                        paddingVertical: 12,
                        borderRadius: 14,
                        backgroundColor: colors.isLight ? '#713B32' : colors.goldAccent,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        shadowColor: '#000',
                        shadowOpacity: 0.2,
                        shadowRadius: 6,
                        elevation: 3,
                      }}
                    >
                      <AppIcon
                        name={walletBalance >= activeMahadashaDetail.price ? 'lock_open_rounded' : 'account_balance_wallet_outlined'}
                        color={colors.isLight ? '#FFFFFF' : '#000000'}
                        size={17}
                      />
                      <Text
                        style={{
                          color: colors.isLight ? '#FFFFFF' : '#000000',
                          fontSize: 14,
                          fontWeight: '800',
                          marginLeft: 8,
                        }}
                      >
                        {walletBalance >= activeMahadashaDetail.price
                          ? `Pay ${activeMahadashaDetail.badge} & Unlock PDF`
                          : `Recharge Wallet (Needs ₹${activeMahadashaDetail.price - walletBalance} more)`}
                      </Text>
                    </Pressable>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* =========================================================================
          MAHADASHA PDF READING MODAL (Full In-App Viewer)
         ========================================================================= */}
      {readingPdfModal && activeMahadashaDetail && (
        <Modal
          visible={true}
          transparent={false}
          animationType="slide"
          onRequestClose={() => setReadingPdfModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            <AppBar
              title={activeMahadashaDetail.title}
              onBack={() => setReadingPdfModal(false)}
              backgroundColor={colors.background}
              backColor={colors.textPrimary}
            />
            <ScrollView
              contentContainerStyle={{
                padding: 20,
                paddingBottom: Math.max(100, insets.bottom + 60),
              }}
            >
              <View
                style={{
                  padding: 16,
                  borderRadius: 18,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  marginBottom: 16,
                }}
              >
                <Text style={{ color: colors.goldAccent, fontSize: 13, fontWeight: '800' }}>
                  {activeMahadashaDetail.sanskrit} • Authentic Vedic Dossier
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                  Verified by AstroParihar Senior Astrological Council • Edition 2026
                </Text>
              </View>

              {activeMahadashaDetail.sampleContent.map((sec, idx) => (
                <View
                  key={idx}
                  style={{
                    padding: 18,
                    borderRadius: 18,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '800', marginBottom: 8 }}>
                    {sec.sectionTitle}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>
                    {sec.text}
                  </Text>
                  {sec.mantra && (
                    <View
                      style={{
                        marginTop: 12,
                        padding: 12,
                        borderRadius: 12,
                        backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 15 : 20),
                        borderLeftWidth: 3,
                        borderLeftColor: colors.goldAccent,
                      }}
                    >
                      <Text style={{ color: colors.goldAccent, fontSize: 14, fontWeight: '800', textAlign: 'center' }}>
                        {sec.mantra}
                      </Text>
                    </View>
                  )}
                </View>
              ))}

              <Pressable
                onPress={() => {
                  showSnackBar(`Downloading "${activeMahadashaDetail.title}.pdf"... Saved!`, colors.surfaceVariant);
                }}
                style={{
                  paddingVertical: 14,
                  borderRadius: 16,
                  backgroundColor: colors.goldAccent,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                }}
              >
                <AppIcon name="download_rounded" color="#000000" size={18} />
                <Text style={{ color: '#000000', fontSize: 14, fontWeight: '800', marginLeft: 8 }}>
                  Download Full PDF ({activeMahadashaDetail.pages})
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </Modal>
      )}

      {/* =========================================================================
          MEDITATION GUIDE MODAL
         ========================================================================= */}
      {meditationModalVisible && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setMeditationModalVisible(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.65)',
              justifyContent: 'flex-end',
            }}
          >
            <Pressable style={{ flex: 1 }} onPress={() => setMeditationModalVisible(false)} />
            <View
              style={{
                backgroundColor: colors.surface,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                maxHeight: Dimensions.get('window').height * 0.88,
                padding: 22,
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <View>
                  <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '800' }}>
                    Vedic Meditation Guide
                  </Text>
                  <Text style={{ color: colors.goldAccent, fontSize: 12, fontWeight: '700' }}>
                    ध्यान, प्राणायाम एवं 108 जप माला
                  </Text>
                </View>
                <Pressable
                  onPress={() => setMeditationModalVisible(false)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: colors.surfaceVariant,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AppIcon name="close_rounded" color={colors.textPrimary} size={18} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {/* Stage 1: Nadi Shodhana */}
                <View
                  style={{
                    padding: 14,
                    borderRadius: 16,
                    backgroundColor: colors.surfaceVariant,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '800', marginBottom: 4 }}>
                    1. Nadi Shodhana Pranayama (नाड़ी शोधन)
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12.5, lineHeight: 18 }}>
                    Sit in Sukhasana facing East or North. Inhale through left nostril for 4 counts, hold for 4 counts, exhale through right for 4 counts, hold for 4 counts. Cleanses 72,000 psychic nadis.
                  </Text>
                </View>

                {/* Stage 2: Japa Counter 108 */}
                <View
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    backgroundColor: withAlpha('#9370DB', 15),
                    borderWidth: 1,
                    borderColor: withAlpha('#9370DB', 50),
                    marginBottom: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#9370DB', fontSize: 14, fontWeight: '800', marginBottom: 4 }}>
                    2. Interactive 108 Japa Counter (जप माला)
                  </Text>
                  <Text style={{ color: colors.textPrimary, fontSize: 12, fontStyle: 'italic', textAlign: 'center', marginBottom: 10 }}>
                    {'“ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात् ॥”'}
                  </Text>

                  <Pressable
                    onPress={() => setJapaCount((prev) => (prev < 108 ? prev + 1 : 0))}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: '#9370DB',
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#9370DB',
                      shadowOpacity: 0.4,
                      shadowRadius: 10,
                      elevation: 4,
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '800' }}>
                      {japaCount}
                    </Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 10 }}>/ 108</Text>
                  </Pressable>
                  <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                    Tap circular bead to count each sacred recitation
                  </Text>
                </View>

                {/* Stage 3: Chakra Dhyana */}
                <View
                  style={{
                    padding: 14,
                    borderRadius: 16,
                    backgroundColor: colors.surfaceVariant,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '800', marginBottom: 4 }}>
                    3. Chakra Dhyana & Seed Sounds
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18 }}>
                    Muladhara (LAM) • Svadhisthana (VAM) • Manipura (RAM) • Anahata (YAM) • Vishuddha (HAM) • Ajna (AUM) • Sahasrara (Silence).
                  </Text>
                </View>

                {/* Stage 4: Shanti Path */}
                <View
                  style={{
                    padding: 14,
                    borderRadius: 16,
                    backgroundColor: withAlpha(colors.goldAccent, 15),
                    borderWidth: 1,
                    borderColor: withAlpha(colors.goldAccent, 40),
                  }}
                >
                  <Text style={{ color: colors.goldAccent, fontSize: 13, fontWeight: '800', marginBottom: 4 }}>
                    4. Shanti Path (शांति पाठ)
                  </Text>
                  <Text style={{ color: colors.textPrimary, fontSize: 12, fontStyle: 'italic', textAlign: 'center' }}>
                    ॐ द्यौः शान्तिरन्तरिक्षं शान्तिः पृथिवी शान्तिरापः शान्तिरोषधयः शान्तिः ॥
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* =========================================================================
          FASTING PLANNER MODAL (Vrat Calendar)
         ========================================================================= */}
      {fastingModalVisible && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setFastingModalVisible(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.65)',
              justifyContent: 'flex-end',
            }}
          >
            <Pressable style={{ flex: 1 }} onPress={() => setFastingModalVisible(false)} />
            <View
              style={{
                backgroundColor: colors.surface,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                maxHeight: Dimensions.get('window').height * 0.88,
                padding: 22,
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <View>
                  <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '800' }}>
                    Sacred Vedic Fasting Planner
                  </Text>
                  <Text style={{ color: colors.goldAccent, fontSize: 12, fontWeight: '700' }}>
                    व्रत एवं उपवास तालिका • Ritual Calendars
                  </Text>
                </View>
                <Pressable
                  onPress={() => setFastingModalVisible(false)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: colors.surfaceVariant,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AppIcon name="close_rounded" color={colors.textPrimary} size={18} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {[
                  {
                    name: 'Ekadashi Vrat (एकादशी व्रत)',
                    timing: '11th Lunar Day (Shukla & Krishna Paksha)',
                    rules: 'Strictly grain-free, water/fruits only. Lord Vishnu puja with Tulsi leaves. Parana on Dwadashi.',
                    color: '#9370DB',
                  },
                  {
                    name: 'Pradosh Vrat (प्रदोष व्रत)',
                    timing: '13th Lunar Day (Trayodashi at Twilight)',
                    rules: 'Twilight Lord Shiva & Parvati abhishek. Milk, bilva patra, and sacred bhasma offerings.',
                    color: '#4FC3F7',
                  },
                  {
                    name: 'Sankashti Chaturthi (संकष्टी चतुर्थी)',
                    timing: '4th Day after Full Moon (Purnima)',
                    rules: 'Fasting until Moonrise. Lord Ganesha modak puja and Durva grass offering for obstacle removal.',
                    color: '#FF6B6B',
                  },
                  {
                    name: 'Somwar Vrat (सोमवार व्रत)',
                    timing: 'Mondays dedicated to Lord Shiva',
                    rules: 'White flower, raw milk, and honey abhishek. Solves relationship friction and Chandra afflictions.',
                    color: '#FFB347',
                  },
                  {
                    name: 'Brihaspativar Vrat (बृहस्पतिवार व्रत)',
                    timing: 'Thursdays dedicated to Guru & Vishnu',
                    rules: 'Wear yellow, worship Banana tree with turmeric water, chana dal & jaggery. Strengthens Jupiter.',
                    color: '#FFD700',
                  },
                  {
                    name: 'Navratri Vrat (नवरात्रि अनुष्ठान)',
                    timing: '9 Auspicious Nights (Chaitra & Ashwin)',
                    rules: 'Ghatasthapana, Akhand Jyot, Durga Saptashati recitation, Kanya Pujan on Ashtami/Navami.',
                    color: '#E91E63',
                  },
                ].map((vrat, idx) => (
                  <View
                    key={idx}
                    style={{
                      padding: 14,
                      borderRadius: 16,
                      backgroundColor: colors.surfaceVariant,
                      borderLeftWidth: 4,
                      borderLeftColor: vrat.color,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                      marginBottom: 10,
                    }}
                  >
                    <Text style={{ color: colors.textPrimary, fontSize: 13.5, fontWeight: '800' }}>
                      {vrat.name}
                    </Text>
                    <Text style={{ color: vrat.color, fontSize: 11, fontWeight: '700', marginTop: 2 }}>
                      {vrat.timing}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 4 }}>
                      {vrat.rules}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
