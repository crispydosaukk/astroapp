/**
 * Services Screen
 * - Categorized Card Models reflecting the 6 categories from the Admin Dashboard:
 *   1. Sacred Vedic Remedies (अष्ट परिहार • Ashta-Digbandhana, 8 in 1 Card)
 *   2. Free Services & Tools (निःशुल्क वैदिक सेवाएं, Free)
 *   3. Mahadasha Guides (Paid PDFs) (महादशा विशेष संकलन • PDF Dossiers, Paid PDFs)
 *   4. Panchang & Sacred Timings (पंचांग एवं शुभ मुहूर्त • Celestial Almanac, Live Almanac)
 *   5. Consultations & AI Astrologer (विशेषज्ञ ज्योतिष परामर्श, Direct Access)
 *   6. Specialized Life Guidance (विशेष जीवन मार्गदर्शन, Comprehensive)
 * - Strictly respects the category sequence (order: 1 to 6) configured in Admin Dashboard.
 * - Dynamic Category Filter Tabs (All, Remedies, Free Tools, Mahadasha, Panchang, Consultations, Guidance).
 * - Real-time category renaming, badge customization, item repositioning and active toggle.
 * - Pixel-perfect 2-column grid cards matching original Vedic aesthetic.
 * - Pull-to-refresh & instant cache support.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { BottomSheet } from '@/components/overlays';
import { Text } from '@/components/Text';
import { API_ENDPOINTS } from '@/config/api';
import { AppRoutes, push } from '@/navigation/routes';
import { withAlpha } from '@/theme/colors';
import { useTranslation } from '@/theme/languageStore';
import { useThemeColors } from '@/theme/themeStore';

const STORAGE_CATEGORIES_CACHE = 'astroparihar_services_categories_cache';

export interface ServiceItem {
  id: string;
  name: string;
  sanskrit?: string;
  desc: string;
  icon: string;
  route: string;
  color: string;
  badge?: string;
  direction?: string;
  isRemedies?: boolean;
  active?: boolean;
  order?: number;
}

export interface ServiceCategory {
  id: string;
  order: number;
  category: 'remedies' | 'panchang' | 'kundli' | 'consultations' | 'guidance' | 'mahadasha' | string;
  title: string;
  sanskrit?: string;
  desc: string;
  badge?: string;
  tabLabel?: string;
  icon?: string;
  color?: string;
  active?: boolean;
  items: ServiceItem[];
}

export const DEFAULT_SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'cat-remedies',
    order: 1,
    category: 'remedies',
    title: 'Sacred Vedic Remedies',
    sanskrit: 'अष्ट परिहार • Ashta-Digbandhana',
    desc: 'Harmonize planetary energies through authentic Vedic remedies prescribed by the 8 sacred directions.',
    badge: '8 in 1 Card',
    tabLabel: 'Remedies',
    icon: 'auto_awesome',
    color: '#713B32',
    active: true,
    items: [
      {
        id: 'rem-mantra',
        order: 1,
        name: 'Mantra Shakti (मन्त्र शक्ति)',
        sanskrit: 'मन्त्र शक्ति',
        desc: 'Sacred sound vibrations that align planetary energies',
        icon: 'auto_awesome',
        route: AppRoutes.remediesScreen,
        color: '#9370DB',
        badge: 'North',
        direction: 'North',
        isRemedies: true,
        active: true,
      },
      {
        id: 'rem-yantra',
        order: 2,
        name: 'Yantra (यन्त्र)',
        sanskrit: 'यन्त्र',
        desc: 'Sacred geometric diagrams that attract cosmic energies',
        icon: 'auto_awesome',
        route: AppRoutes.remediesScreen,
        color: '#FFD700',
        badge: 'North-East',
        direction: 'North-East',
        isRemedies: true,
        active: true,
      },
      {
        id: 'rem-homa',
        order: 3,
        name: 'Homa (होम / हवन)',
        sanskrit: 'होम / हवन',
        desc: 'Sacred fire rituals to purify and invoke divine blessings',
        icon: 'whatshot',
        route: AppRoutes.remediesScreen,
        color: '#FF6B35',
        badge: 'East',
        direction: 'East',
        isRemedies: true,
        active: true,
      },
      {
        id: 'rem-devata',
        order: 4,
        name: 'Devata Upasana (देवता उपासना)',
        sanskrit: 'देवता उपासना',
        desc: 'Personal deity worship for spiritual alignment',
        icon: 'wb_sunny',
        route: AppRoutes.remediesScreen,
        color: '#FFB347',
        badge: 'South-East',
        direction: 'South-East',
        isRemedies: true,
        active: true,
      },
      {
        id: 'rem-ratna',
        order: 5,
        name: 'Ratna / Gemstones (रत्न)',
        sanskrit: 'रत्न',
        desc: 'Planetary gemstones to strengthen beneficial influences',
        icon: 'diamond',
        route: AppRoutes.remediesScreen,
        color: '#4FC3F7',
        badge: 'South',
        direction: 'South',
        isRemedies: true,
        active: true,
      },
      {
        id: 'rem-rudraksha',
        order: 6,
        name: 'Rudraksha (रुद्राक्ष)',
        sanskrit: 'रुद्राक्ष',
        desc: 'Sacred seeds of Lord Shiva for protection and healing',
        icon: 'spa',
        route: AppRoutes.remediesScreen,
        color: '#8B4513',
        badge: 'South-West',
        direction: 'South-West',
        isRemedies: true,
        active: true,
      },
      {
        id: 'rem-vastu',
        order: 7,
        name: 'Vastu (वास्तु)',
        sanskrit: 'वास्तु',
        desc: 'Sacred architecture for harmonious living spaces',
        icon: 'home',
        route: AppRoutes.remediesScreen,
        color: '#81C784',
        badge: 'West',
        direction: 'West',
        isRemedies: true,
        active: true,
      },
      {
        id: 'rem-charity',
        order: 8,
        name: 'Dāna & Seva (दान एवं सेवा)',
        sanskrit: 'दान एवं सेवा',
        desc: 'Charitable giving and selfless service for karmic balance',
        icon: 'favorite',
        route: AppRoutes.remediesScreen,
        color: '#FF6B6B',
        badge: 'North-West',
        direction: 'North-West',
        isRemedies: true,
        active: true,
      },
    ],
  },
  {
    id: 'cat-free-tools',
    order: 2,
    category: 'kundli',
    title: 'Free Services & Tools',
    sanskrit: 'निःशुल्क वैदिक सेवाएं',
    desc: 'Personalized Vedic birth charts, compatibility, Panchang, daily horoscope, meditation & fasting planners.',
    badge: 'Free',
    tabLabel: 'Free Tools',
    icon: 'auto_stories',
    color: '#9370DB',
    active: true,
    items: [
      {
        id: 'tool-janam-kundli',
        order: 1,
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
        name: 'Meditation Guide',
        sanskrit: 'ध्यान एवं प्राणायाम',
        desc: 'Mindfulness, mantras & spiritual alignment',
        icon: 'self_improvement',
        route: AppRoutes.spiritualGuidanceScreen,
        color: '#81C784',
        badge: 'Free',
        active: true,
      },
      {
        id: 'tool-fasting',
        order: 6,
        name: 'Fasting Planner',
        sanskrit: 'व्रत एवं उपवास तालिका',
        desc: 'Sacred Vrat schedules, rules & rituals',
        icon: 'event_note',
        route: AppRoutes.panchangScreen,
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
    tabLabel: 'Mahadasha',
    icon: 'menu_book',
    color: '#FF6B35',
    active: true,
    items: [
      {
        id: 'maha-rahu-stab',
        order: 1,
        name: 'Rahu Mahadasha Stabilisation Guide',
        sanskrit: 'राहु महादशा शांति संकलन',
        desc: 'Harmonize intense Rahu transit & remedies (PDF Dossier)',
        icon: 'shield',
        route: AppRoutes.kundliReportsScreen,
        color: '#713B32',
        badge: '₹499',
        active: true,
      },
      {
        id: 'maha-rahu-surv',
        order: 2,
        name: 'Rahu Mahadasha Survival Guide',
        sanskrit: 'राहु महादशा सर्वाइवल गाइड',
        desc: 'Tactical survival & protective mantras (PDF Dossier)',
        icon: 'local_fire_department',
        route: AppRoutes.kundliReportsScreen,
        color: '#E65100',
        badge: '₹999',
        active: true,
      },
      {
        id: 'maha-sani-stab',
        order: 3,
        name: 'Sani Mahadasha Stabilisation Guide',
        sanskrit: 'शनि महादशा शांति संकलन',
        desc: 'Saturn discipline, endurance & remedies (PDF Dossier)',
        icon: 'shield',
        route: AppRoutes.kundliReportsScreen,
        color: '#1A3D5C',
        badge: '₹499',
        active: true,
      },
      {
        id: 'maha-sani-surv',
        order: 4,
        name: 'Sani Mahadasha Survival Guide',
        sanskrit: 'शनि महादशा सर्वाइवल गाइड',
        desc: 'Navigating Saturn trials & karmic phase (PDF Dossier)',
        icon: 'bolt',
        route: AppRoutes.kundliReportsScreen,
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
    tabLabel: 'Panchang',
    icon: 'calendar_today_outlined',
    color: '#4FC3F7',
    active: true,
    items: [
      {
        id: 'pan-today',
        order: 1,
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
    tabLabel: 'Consultations',
    icon: 'people_outline',
    color: '#81C784',
    active: true,
    items: [
      {
        id: 'con-live',
        order: 1,
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
    tabLabel: 'Guidance',
    icon: 'psychology_outlined',
    color: '#FFB347',
    active: true,
    items: [
      {
        id: 'gui-career',
        order: 1,
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
        name: 'Finance Astrology',
        sanskrit: 'धन एवं समृद्धि',
        desc: 'Dhana Yogas, wealth accumulation & investment windows',
        icon: 'attach_money',
        route: AppRoutes.financeAstrologyScreen,
        color: '#81C784',
        active: true,
      },
      {
        id: 'gui-tarot',
        order: 5,
        name: 'Tarot Reading',
        sanskrit: 'टैरो कार्ड परामर्श',
        desc: 'Intuitive card spreads for immediate clarity and insight',
        icon: 'style_outlined',
        route: AppRoutes.tarotScreen,
        color: '#9370DB',
        active: true,
      },
      {
        id: 'gui-numerology',
        order: 6,
        name: 'Numerology',
        sanskrit: 'अंक ज्योतिष',
        desc: 'Life path numbers, name vibrations & lucky dates',
        icon: 'tag_outlined',
        route: AppRoutes.numerologyScreen,
        color: '#FFB347',
        active: true,
      },
      {
        id: 'gui-spiritual',
        order: 7,
        name: 'Spiritual Guidance',
        sanskrit: 'आध्यात्मिक साधना',
        desc: 'Mantra sadhana, chakra balancing & karmic alignment',
        icon: 'self_improvement',
        route: AppRoutes.spiritualGuidanceScreen,
        color: '#FF6B6B',
        active: true,
      },
    ],
  },
];

// Flat fallback SERVICES for backwards-compatibility imports
export const SERVICES: ServiceItem[] = DEFAULT_SERVICE_CATEGORIES.flatMap((c) => c.items);

export function resolveServiceRoute(routeStr?: string, id?: string): string {
  if (!routeStr) {
    if (id?.includes('remed')) return AppRoutes.remediesScreen;
    if (id?.includes('kundli-match') || id?.includes('match')) return AppRoutes.matchKundliScreen;
    if (id?.includes('my-kundli')) return AppRoutes.myKundliScreen;
    if (id?.includes('maha') || id?.includes('report')) return AppRoutes.kundliReportsScreen;
    if (id?.includes('kundli')) return AppRoutes.myKundliScreen;
    if (id?.includes('panchang') || id?.includes('pan-')) return AppRoutes.panchangScreen;
    if (id?.includes('horoscope')) return AppRoutes.horoscopeScreen;
    if (id?.includes('career')) return AppRoutes.careerAstrologyScreen;
    if (id?.includes('marriage')) return AppRoutes.marriageAstrologyScreen;
    if (id?.includes('business')) return AppRoutes.businessAstrologyScreen;
    if (id?.includes('finance')) return AppRoutes.financeAstrologyScreen;
    if (id?.includes('tarot')) return AppRoutes.tarotScreen;
    if (id?.includes('numerology')) return AppRoutes.numerologyScreen;
    if (id?.includes('muhurat')) return AppRoutes.muhuratScreen;
    if (id?.includes('spiritual') || id?.includes('meditation')) return AppRoutes.spiritualGuidanceScreen;
    if (id?.includes('fasting')) return AppRoutes.panchangScreen;
    if (id?.includes('talk') || id?.includes('live')) return AppRoutes.liveAstrologersScreen;
    if (id?.includes('ai')) return AppRoutes.aiChatScreen;
    return AppRoutes.servicesScreen;
  }
  const clean = routeStr.trim();
  if (clean.includes('mahadasha') || clean.includes('kundli-report')) return AppRoutes.kundliReportsScreen;
  if (clean.includes('meditation') || clean.includes('spiritual')) return AppRoutes.spiritualGuidanceScreen;
  if (clean.includes('fasting')) return AppRoutes.panchangScreen;
  if (clean.includes('remedy-detail')) return AppRoutes.remediesScreen;

  switch (clean) {
    case '/my-kundli-screen':
    case 'myKundliScreen':
      return AppRoutes.myKundliScreen;
    case '/remedies-screen':
    case 'remediesScreen':
      return AppRoutes.remediesScreen;
    case '/match-kundli-screen':
    case 'matchKundliScreen':
      return AppRoutes.matchKundliScreen;
    case '/horoscope-screen':
    case 'horoscopeScreen':
      return AppRoutes.horoscopeScreen;
    case '/panchang-screen':
    case 'panchangScreen':
      return AppRoutes.panchangScreen;
    case '/ai-chat-screen':
    case 'aiChatScreen':
      return AppRoutes.aiChatScreen;
    case '/live-astrologers-screen':
    case 'liveAstrologersScreen':
      return AppRoutes.liveAstrologersScreen;
    case '/career-astrology-screen':
    case 'careerAstrologyScreen':
      return AppRoutes.careerAstrologyScreen;
    case '/marriage-astrology-screen':
    case 'marriageAstrologyScreen':
      return AppRoutes.marriageAstrologyScreen;
    case '/business-astrology-screen':
    case 'businessAstrologyScreen':
      return AppRoutes.businessAstrologyScreen;
    case '/finance-astrology-screen':
    case 'financeAstrologyScreen':
      return AppRoutes.financeAstrologyScreen;
    case '/tarot-screen':
    case 'tarotScreen':
      return AppRoutes.tarotScreen;
    case '/numerology-screen':
    case 'numerologyScreen':
      return AppRoutes.numerologyScreen;
    case '/muhurat-screen':
    case 'muhuratScreen':
      return AppRoutes.muhuratScreen;
    case '/kundli-reports-screen':
    case 'kundliReportsScreen':
      return AppRoutes.kundliReportsScreen;
    case '/astrology-reports-screen':
    case 'astrologyReportsScreen':
      return AppRoutes.astrologyReportsScreen;
    case '/spiritual-guidance-screen':
    case 'spiritualGuidanceScreen':
      return AppRoutes.spiritualGuidanceScreen;
    case '/wallet-screen':
    case 'walletScreen':
      return AppRoutes.walletScreen;
    default:
      return clean.startsWith('/') ? clean : `/${clean}`;
  }
}

/**
 * Parses and sorts categories strictly according to their Admin Dashboard sequence (`order` 1 to N).
 * Inside each category, its items are also sorted by `it.order`.
 */
export function parseCategories(data: any): ServiceCategory[] {
  if (!data || !Array.isArray(data.categories) || data.categories.length === 0) {
    return DEFAULT_SERVICE_CATEGORIES;
  }

  const rawCats: any[] = [...data.categories];
  rawCats.sort((a, b) => (a.order || 0) - (b.order || 0));

  return rawCats
    .filter((c) => c.active !== false)
    .map((c, catIdx) => {
      const itemsRaw: any[] = Array.isArray(c.items) ? [...c.items] : [];
      itemsRaw.sort((a, b) => (a.order || 0) - (b.order || 0));

      const isRemediesCategory = c.id === 'cat-remedies' || c.category === 'remedies';

      const items: ServiceItem[] = itemsRaw
        .filter((it) => it.active !== false && it.id !== 'spiritual-guidance')
        .map((it, itemIdx) => ({
          id: it.id || `item-${catIdx}-${itemIdx}`,
          name: it.name || 'Service',
          sanskrit: it.sanskrit || '',
          desc: it.desc || '',
          icon: it.icon || c.icon || 'auto_awesome',
          route: resolveServiceRoute(it.route, it.id),
          color: it.color || c.color || '#C9A84C',
          badge: it.badge,
          direction: it.direction,
          isRemedies: isRemediesCategory || it.id?.startsWith('rem-'),
          active: it.active !== false,
          order: it.order || itemIdx + 1,
        }));

      return {
        id: c.id || `cat-${catIdx}`,
        order: c.order || catIdx + 1,
        category: c.category || 'custom',
        title: c.title || 'Category',
        sanskrit: c.sanskrit || '',
        desc: c.desc || '',
        badge: c.badge,
        tabLabel: c.tabLabel || c.title || 'Category',
        icon: c.icon || 'auto_awesome',
        color: c.color || '#713B32',
        active: c.active !== false,
        items,
      };
    });
}

/**
 * Backward compatibility helper for flat services list
 */
export function parseDynamicServices(data: any): ServiceItem[] {
  const cats = parseCategories(data);
  return cats.flatMap((c) => c.items);
}

export function getCategoryRoute(cat: ServiceCategory): string {
  const catId = cat.id || '';
  const catType = (cat.category || '').toLowerCase();
  if (catId === 'cat-remedies' || catType.includes('remedies')) return AppRoutes.remediesScreen;
  if (catId === 'cat-free-tools' || catType.includes('kundli') || catType.includes('free')) return AppRoutes.myKundliScreen;
  if (catId === 'cat-mahadasha' || catType.includes('mahadasha')) return AppRoutes.kundliReportsScreen;
  if (catId === 'cat-panchang' || catType.includes('panchang')) return AppRoutes.panchangScreen;
  if (catId === 'cat-consultations' || catType.includes('consult')) return AppRoutes.liveAstrologersScreen;
  if (catId === 'cat-guidance' || catType.includes('guidance')) return AppRoutes.spiritualGuidanceScreen;
  return cat.items && cat.items[0]?.route ? cat.items[0].route : AppRoutes.remediesScreen;
}

export default function ServicesScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const screenPadH = 16;
  const gridGap = 12;
  // Exactly 2 equal columns guaranteed across all mobile screens
  const cardW = Math.max(140, Math.floor((windowWidth - (screenPadH * 2) - gridGap) / 2));
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<ServiceCategory[]>(DEFAULT_SERVICE_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const sheetContentHeight = selectedCategory
    ? selectedCategory.items.length <= 2
      ? Math.min(340, Math.floor(windowHeight * 0.48))
      : selectedCategory.items.length <= 4
      ? Math.min(480, Math.floor(windowHeight * 0.65))
      : Math.min(680, Math.floor(windowHeight * 0.82))
    : Math.floor(windowHeight * 0.82);

  // 1. Load Categories from Cache & Backend
  const loadCategories = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(API_ENDPOINTS.services, { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.categories) && data.categories.length > 0) {
          const parsed = parseCategories(data);
          if (parsed.length > 0) {
            setCategories(parsed);
            AsyncStorage.setItem(STORAGE_CATEGORIES_CACHE, JSON.stringify(parsed)).catch(() => { });
          }
        }
      }
    } catch {
      // Offline fallback
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Instant load from cache
    AsyncStorage.getItem(STORAGE_CATEGORIES_CACHE)
      .then((cached) => {
        if (cached && isMounted) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setCategories(parsed);
            }
          } catch { }
        }
      })
      .catch(() => { });

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, [loadCategories]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCategories();
    setRefreshing(false);
  }, [loadCategories]);

  // Flat list of all items for global search
  const searchedItems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    const allItems = categories.flatMap((c) => c.items);
    return allItems.filter(
      (it) =>
        it.name.toLowerCase().includes(q) ||
        it.desc.toLowerCase().includes(q) ||
        (it.sanskrit && it.sanskrit.toLowerCase().includes(q)) ||
        (it.badge && it.badge.toLowerCase().includes(q))
    );
  }, [categories, searchQuery]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="services.screen">
      <AppBar
        title={t('nav.services', 'Services')}
        backgroundColor={colors.background}
        backColor={colors.textPrimary}
        actions={[
          {
            icon: isSearchOpen ? 'close' : 'search_rounded',
            color: colors.goldAccent,
            onPress: () => {
              setIsSearchOpen((prev) => !prev);
              if (isSearchOpen) setSearchQuery('');
            },
            testID: 'services.search',
          },
        ]}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.goldAccent}
            colors={[colors.goldAccent]}
          />
        }
        contentContainerStyle={{
          paddingBottom: insets.bottom + 88,
        }}
      >
        {/* Interactive Search Bar when toggled */}
        {isSearchOpen && (
          <View
            style={{
              marginHorizontal: 20,
              marginTop: 4,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surface,
              borderRadius: 14,
              borderWidth: 1.2,
              borderColor: colors.goldAccent,
              paddingHorizontal: 12,
              height: 44,
              shadowColor: colors.goldAccent,
              shadowOpacity: 0.15,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <AppIcon name="search_rounded" color={colors.goldAccent} size={18} />
            <TextInput
              placeholder={t('Search services...', 'Search services (Kundli, Remedies, Horoscope...)')}
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              style={{
                flex: 1,
                marginLeft: 8,
                fontSize: 13,
                color: colors.textPrimary,
                paddingVertical: 0,
              }}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <AppIcon name="close" color={colors.textMuted} size={16} />
              </Pressable>
            )}
          </View>
        )}

        <View style={{ paddingHorizontal: screenPadH, paddingTop: 10 }}>
          {searchQuery.trim().length > 0 ? (
            /* Search Results: 2-column grid of matching individual services */
            <View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: 12 }}>
                Found {searchedItems.length} matching services for &quot;{searchQuery}&quot;
              </Text>
              {searchedItems.length === 0 ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <AppIcon name="search_off" color={colors.textMuted} size={42} />
                  <Text style={{ marginTop: 12, color: colors.textSecondary, fontSize: 14, fontWeight: '600' }}>
                    No services found matching &quot;{searchQuery}&quot;
                  </Text>
                </View>
              ) : (
                <View>
                  {Array.from({ length: Math.ceil(searchedItems.length / 2) }, (_, rowIdx) => {
                    const pair = searchedItems.slice(rowIdx * 2, rowIdx * 2 + 2);
                    return (
                      <View key={`search-row-${rowIdx}`} style={{ flexDirection: 'row', gap: gridGap, marginBottom: gridGap }}>
                        {pair.map((item) => (
                          <Pressable
                            key={item.id}
                            onPress={() => push(item.route)}
                            style={({ pressed }) => ({
                              flex: 1,
                              minHeight: 120,
                              padding: 12,
                              borderRadius: 16,
                              backgroundColor: colors.surface,
                              borderWidth: 1.2,
                              borderColor: colors.cardBorder,
                              justifyContent: 'space-between',
                              shadowColor: '#000',
                              shadowOpacity: colors.isLight ? 0.03 : 0.12,
                              shadowRadius: 5,
                              elevation: 1.5,
                              transform: [{ scale: pressed ? 0.98 : 1 }],
                            })}
                          >
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <View
                                style={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: 10,
                                  backgroundColor: withAlpha(item.color || colors.goldAccent, 18),
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <AppIcon name={item.icon || 'auto_awesome'} color={item.color || colors.goldAccent} size={18} />
                              </View>
                              {item.badge ? (
                                <View style={{ paddingHorizontal: 6.5, paddingVertical: 2, borderRadius: 6, backgroundColor: withAlpha(colors.goldAccent, 20) }}>
                                  <Text style={{ color: colors.goldAccent, fontSize: 9, fontWeight: '800' }}>{item.badge}</Text>
                                </View>
                              ) : (
                                <AppIcon name="arrow_forward_ios_rounded" color={colors.textMuted} size={11} />
                              )}
                            </View>

                            <View style={{ marginTop: 8 }}>
                              <Text numberOfLines={1} style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>
                                {item.name}
                              </Text>
                              <Text numberOfLines={1} style={{ marginTop: 2, color: colors.textMuted, fontSize: 10.5 }}>
                                {item.sanskrit || item.desc}
                              </Text>
                            </View>
                          </Pressable>
                        ))}
                        {pair.length === 1 && <View style={{ flex: 1 }} />}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          ) : (
            /* Main Services Grid: EXACTLY 2 cards per row, 6 cards total */
            <View>
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary }}>
                  Vedic Services & Sacred Solutions
                </Text>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                  Tap any category to view and launch individual Vedic services
                </Text>
              </View>

              {/* Main Services Grid: EXACTLY 2 cards per row */}
              <View>
                {Array.from({ length: Math.ceil(Math.min(categories.length, 6) / 2) }, (_, rowIdx) => {
                  const pair = categories.slice(rowIdx * 2, rowIdx * 2 + 2);
                  return (
                    <View key={`main-cat-row-${rowIdx}`} style={{ flexDirection: 'row', gap: gridGap, marginBottom: gridGap }}>
                      {pair.map((cat) => {
                        const isRemedy =
                          cat.id === 'cat-remedies' ||
                          cat.category === 'remedies' ||
                          cat.id?.toLowerCase().includes('remed') ||
                          cat.title?.toLowerCase().includes('remed') ||
                          cat.tabLabel?.toLowerCase().includes('remed');
                        const cardBorderColor = isRemedy ? colors.goldAccent : colors.cardBorder;
                        const cardShadowColor = isRemedy ? colors.goldAccent : '#000';

                        return (
                          <Pressable
                            key={cat.id}
                            testID={`services.categoryCard.${cat.id}`}
                            onPress={() => {
                              if (isRemedy) {
                                push(AppRoutes.remediesScreen);
                              } else {
                                setSelectedCategory(cat);
                              }
                            }}
                            style={({ pressed }) => ({
                              flex: 1,
                              minHeight: 146,
                              padding: 14,
                              borderRadius: 20,
                              backgroundColor: colors.surface,
                              borderWidth: isRemedy ? 1.5 : 1.2,
                              borderColor: cardBorderColor,
                              justifyContent: 'space-between',
                              shadowColor: cardShadowColor,
                              shadowOpacity: colors.isLight ? (isRemedy ? 0.14 : 0.04) : 0.18,
                              shadowRadius: 7,
                              shadowOffset: { width: 0, height: 2 },
                              elevation: isRemedy ? 3.5 : 2,
                              transform: [{ scale: pressed ? 0.98 : 1 }],
                            })}
                            accessibilityRole="button"
                            accessibilityLabel={`${cat.title}, ${cat.desc}`}
                          >
                            {/* Top Row: Icon & Badge */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <View
                                style={{
                                  width: 38,
                                  height: 38,
                                  borderRadius: 12,
                                  backgroundColor: withAlpha(cat.color || colors.goldAccent, colors.isLight ? 16 : 24),
                                  borderWidth: 1,
                                  borderColor: withAlpha(cat.color || colors.goldAccent, colors.isLight ? 35 : 55),
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <AppIcon name={cat.icon || 'auto_awesome'} color={cat.color || colors.goldAccent} size={20} />
                              </View>

                              {cat.badge ? (
                                <View
                                  style={{
                                    paddingHorizontal: 7,
                                    paddingVertical: 2.5,
                                    borderRadius: 8,
                                    backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 18 : 28),
                                    borderWidth: 1,
                                    borderColor: withAlpha(colors.goldAccent, colors.isLight ? 60 : 80),
                                  }}
                                >
                                  <Text style={{ color: colors.goldAccent, fontSize: 9.5, fontWeight: '800', letterSpacing: 0.2 }}>
                                    {cat.badge}
                                  </Text>
                                </View>
                              ) : (
                                <AppIcon name="arrow_forward_ios_rounded" color={colors.textMuted} size={11} />
                              )}
                            </View>

                            {/* Middle: Title & Sanskrit */}
                            <View style={{ marginTop: 8 }}>
                              <Text numberOfLines={1} style={{ color: colors.textPrimary, fontSize: 13.5, fontWeight: '800', letterSpacing: 0.2 }}>
                                {cat.title}
                              </Text>
                              {cat.sanskrit ? (
                                <Text numberOfLines={1} style={{ marginTop: 2, color: colors.goldAccent, fontSize: 10.5, fontWeight: '700' }}>
                                  {cat.sanskrit}
                                </Text>
                              ) : null}
                              <Text numberOfLines={2} style={{ marginTop: 3, color: colors.textMuted, fontSize: 10.5, lineHeight: 14 }}>
                                {cat.desc}
                              </Text>
                            </View>

                            {/* Bottom: Item Count CTA */}
                            <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Text style={{ color: colors.goldAccent, fontSize: 10.5, fontWeight: '700' }}>
                                {cat.items.length} {cat.tabLabel || 'Services'}
                              </Text>
                              <AppIcon name="arrow_forward_ios_rounded" color={colors.goldAccent} size={10} />
                            </View>
                          </Pressable>
                        );
                      })}
                      {pair.length === 1 && <View style={{ flex: 1 }} />}
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Individual Respective Related Services BottomSheet */}
      <BottomSheet
        visible={
          !!selectedCategory &&
          !(
            selectedCategory.id === 'cat-remedies' ||
            selectedCategory.category === 'remedies' ||
            selectedCategory.id?.toLowerCase().includes('remed') ||
            selectedCategory.title?.toLowerCase().includes('remed')
          )
        }
        onClose={() => setSelectedCategory(null)}
        maxHeightRatio={0.92}
        testID="services.categorySheet"
      >
        {selectedCategory ? (
          <View
            style={{
              width: '100%',
              height: sheetContentHeight,
              backgroundColor: colors.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              borderWidth: 1,
              borderBottomWidth: 0,
              borderColor: colors.cardBorder,
              overflow: 'hidden',
            }}
          >
            {/* Header: Fixed Non-Scrolling */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingTop: 18,
                paddingBottom: 14,
                borderBottomWidth: 1,
                borderBottomColor: colors.cardBorder,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    backgroundColor: withAlpha(selectedCategory.color || colors.goldAccent, 20),
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                  }}
                >
                  <AppIcon name={selectedCategory.icon || 'auto_awesome'} size={20} color={selectedCategory.color || colors.goldAccent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800' }}>
                    {selectedCategory.title}
                  </Text>
                  {selectedCategory.sanskrit ? (
                    <Text numberOfLines={1} style={{ color: colors.goldAccent, fontSize: 11, fontWeight: '700' }}>
                      {selectedCategory.sanskrit}
                    </Text>
                  ) : null}
                </View>
              </View>
              <Pressable
                onPress={() => setSelectedCategory(null)}
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                style={{ padding: 4 }}
              >
                <AppIcon name="close_rounded" color={colors.textMuted} size={22} />
              </Pressable>
            </View>

            {/* Scrollable Items: smooth scroll with generous bottom clearance */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingHorizontal: screenPadH,
                paddingTop: 14,
                paddingBottom: Math.max(insets.bottom, 24) + 40,
                flexGrow: 1,
              }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
              bounces={true}
            >
              {selectedCategory.desc ? (
                <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginBottom: 14 }}>
                  {selectedCategory.desc}
                </Text>
              ) : null}

              {/* Individual Respective Items: GUARANTEED EXACTLY 2 CARDS IN A ROW */}
              <View>
                {Array.from({ length: Math.ceil(selectedCategory.items.length / 2) }, (_, rowIdx) => {
                  const pair = selectedCategory.items.slice(rowIdx * 2, rowIdx * 2 + 2);
                  return (
                    <View key={`sheet-row-${rowIdx}`} style={{ flexDirection: 'row', gap: gridGap, marginBottom: gridGap }}>
                      {pair.map((item) => (
                        <Pressable
                          key={item.id}
                          onPress={() => {
                            const targetRoute = item.route;
                            setSelectedCategory(null);
                            if (targetRoute === AppRoutes.kundliReportsScreen) {
                              push(AppRoutes.kundliReportsScreen, { initialTab: 1 });
                            } else {
                              push(targetRoute);
                            }
                          }}
                          style={({ pressed }) => ({
                            flex: 1,
                            minHeight: 115,
                            padding: 12,
                            borderRadius: 16,
                            backgroundColor: colors.isLight ? '#FAFAFA' : colors.surfaceVariant,
                            borderWidth: 1,
                            borderColor: colors.cardBorder,
                            justifyContent: 'space-between',
                            transform: [{ scale: pressed ? 0.98 : 1 }],
                          })}
                        >
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 10,
                                backgroundColor: withAlpha(item.color || colors.goldAccent, 18),
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <AppIcon name={item.icon || 'auto_awesome'} color={item.color || colors.goldAccent} size={17} />
                            </View>
                            {item.badge ? (
                              <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: withAlpha(colors.goldAccent, 20) }}>
                                <Text style={{ color: colors.goldAccent, fontSize: 9, fontWeight: '800' }}>{item.badge}</Text>
                              </View>
                            ) : (
                              <AppIcon name="arrow_forward_ios_rounded" color={colors.textMuted} size={10} />
                            )}
                          </View>

                          <View style={{ marginTop: 6 }}>
                            <Text numberOfLines={1} style={{ color: colors.textPrimary, fontSize: 12.5, fontWeight: '700' }}>
                              {item.name}
                            </Text>
                            <Text numberOfLines={1} style={{ marginTop: 1, color: colors.textMuted, fontSize: 10 }}>
                              {item.sanskrit || item.desc}
                            </Text>
                          </View>
                        </Pressable>
                      ))}
                      {pair.length === 1 && <View style={{ flex: 1 }} />}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        ) : null}
      </BottomSheet>
    </View>
  );
}
