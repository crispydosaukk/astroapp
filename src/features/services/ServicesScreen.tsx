/**
 * Services Screen
 * - Dynamic categorized card models reflecting website remedies, panchang, kundli, and consultations.
 * - Sacred Vedic Remedies Card Model: All 8 canonical Ashta Parihar remedies in one prominent card.
 * - Panchang & Timings Card Model: Today/Tomorrow Panchang, Shubh Muhurat, Rahu Kaal, Choghadiya, Hora.
 * - Kundli & Tools Card Model: Janam Kundli, Match Kundli, Daily Horoscope, Astrology Reports.
 * - Consultations Card Model: Live Astrologer & 24/7 AI Astrologer.
 * - Specialized Life Guidance Card Model: Career, Marriage, Business, Finance, Tarot, Numerology, Spiritual Guidance.
 * - Real-time position swapping and dynamic sync with Admin Dashboard.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { Text } from '@/components/Text';
import { API_ENDPOINTS } from '@/config/api';
import { REMEDIES, Remedy } from '@/data/remedies';
import { AppRoutes, push } from '@/navigation/routes';
import { withAlpha } from '@/theme/colors';
import { useTranslation } from '@/theme/languageStore';
import { useThemeColors } from '@/theme/themeStore';

const STORAGE_CATEGORIES_KEY = 'astroparihar_app_service_categories_cache';

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
  category: 'remedies' | 'panchang' | 'kundli' | 'consultations' | 'guidance' | string;
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
    order: 1,
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
        name: 'Mantra',
        sanskrit: 'मन्त्र',
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
        name: 'Yantra',
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
        name: 'Homa',
        sanskrit: 'होम',
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
        name: 'Devata Upasana',
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
        name: 'Ratna / Gemstone',
        sanskrit: 'रत्न',
        direction: 'South',
        directionHindi: 'दक्षिण (South)',
        desc: 'Planetary gemstones to strengthen beneficial influences',
        mantra: 'ॐ ग्रहाय नमः ॥',
        icon: 'diamond',
        route: AppRoutes.remedyDetailScreen,
        color: '#4FC3F7',
        badge: 'South',
        active: true,
      },
      {
        id: 'rem-rudraksha',
        order: 6,
        category: 'remedies',
        name: 'Rudrākṣa',
        sanskrit: 'रुद्राक्ष',
        direction: 'South-West',
        directionHindi: 'नैऋत्य (South-West)',
        desc: 'Sacred seeds of Lord Shiva for protection and healing',
        mantra: 'ॐ नमः शिवाय ॥',
        icon: 'spa',
        route: AppRoutes.remedyDetailScreen,
        color: '#8B4513',
        badge: 'South-West',
        active: true,
      },
      {
        id: 'rem-vastu',
        order: 7,
        category: 'remedies',
        name: 'Vāstu',
        sanskrit: 'वास्तु',
        direction: 'West',
        directionHindi: 'पश्चिम (West)',
        desc: 'Sacred architecture for harmonious living spaces',
        mantra: 'ॐ वास्तुपुरुषाय नमः ॥',
        icon: 'home',
        route: AppRoutes.remedyDetailScreen,
        color: '#81C784',
        badge: 'West',
        active: true,
      },
      {
        id: 'rem-charity',
        order: 8,
        category: 'remedies',
        name: 'Dāna & Seva',
        sanskrit: 'दान एवं सेवा',
        direction: 'North-West',
        directionHindi: 'वायव्य (North-West)',
        desc: 'Charitable giving and selfless service for karmic balance',
        mantra: 'ॐ परोपकाराय नमः ॥',
        icon: 'favorite',
        route: AppRoutes.remedyDetailScreen,
        color: '#FF6B6B',
        badge: 'North-West',
        active: true,
      },
    ],
  },
  {
    id: 'cat-panchang',
    order: 2,
    category: 'panchang',
    title: 'Panchang & Sacred Timings',
    sanskrit: 'पंचांग एवं शुभ मुहूर्त',
    desc: 'Real-time Tithi, Nakshatra, Shubh Muhurat, Rahu Kaal, and Choghadiya calculations.',
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
        desc: 'Tithi, Nakshatra, Yoga, Karana & Vaar',
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
        id: 'pan-muhurat',
        order: 3,
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
        order: 4,
        category: 'panchang',
        name: 'Rahu Kaal & Cautions',
        sanskrit: 'राहु काल एवं यमघंट',
        desc: 'Inauspicious Rahu periods & planetary cautions',
        icon: 'warning_amber_outlined',
        route: AppRoutes.muhuratScreen,
        color: '#FF6B6B',
        badge: 'Caution',
        active: true,
      },
      {
        id: 'pan-choghadiya',
        order: 5,
        category: 'panchang',
        name: 'Choghadiya',
        sanskrit: 'चौघड़िया',
        desc: 'Day & night 7-fold auspicious divisions',
        icon: 'explore_outlined',
        route: AppRoutes.panchangScreen,
        color: '#FFB347',
        active: true,
      },
      {
        id: 'pan-hora',
        order: 6,
        category: 'panchang',
        name: 'Hora',
        sanskrit: 'होरा',
        desc: 'Hourly planetary ruler alignment & tasks',
        icon: 'schedule_outlined',
        route: AppRoutes.panchangScreen,
        color: '#9370DB',
        active: true,
      },
    ],
  },
  {
    id: 'cat-kundli',
    order: 3,
    category: 'kundli',
    title: 'Kundli & Vedic Tools',
    sanskrit: 'जन्म कुंडली एवं फलित ज्योतिष',
    desc: 'Personalized Vedic birth charts, planetary positions, and compatibility analysis.',
    badge: 'Core Astrology',
    icon: 'auto_stories',
    color: '#9370DB',
    active: true,
    items: [
      {
        id: 'kun-my-kundli',
        order: 1,
        category: 'kundli',
        name: 'Janam Kundli',
        sanskrit: 'जन्म कुंडली',
        desc: 'Personalized Vedic birth chart & D1/D9 houses',
        icon: 'auto_stories',
        route: AppRoutes.myKundliScreen,
        color: '#9370DB',
        badge: 'Core',
        active: true,
      },
      {
        id: 'kun-match',
        order: 2,
        category: 'kundli',
        name: 'Kundli Matching',
        sanskrit: 'कुंडली मिलान',
        desc: 'Vedic 36 Guna Milan & marital compatibility check',
        icon: 'favorite_border',
        route: AppRoutes.matchKundliScreen,
        color: '#FF6B6B',
        badge: 'Free',
        active: true,
      },
      {
        id: 'kun-horoscope',
        order: 3,
        category: 'kundli',
        name: 'Daily Horoscope',
        sanskrit: 'दैनिक राशिफल',
        desc: "Today's planetary forecast & lucky guidance",
        icon: 'wb_sunny_outlined',
        route: AppRoutes.horoscopeScreen,
        color: '#FFB347',
        active: true,
      },
      {
        id: 'kun-reports',
        order: 4,
        category: 'kundli',
        name: 'Astrology Reports',
        sanskrit: 'विस्तृत रिपोर्ट',
        desc: 'Detailed life predictions, Dasha timelines & remedies',
        icon: 'description_outlined',
        route: AppRoutes.astrologyReportsScreen,
        color: '#4FC3F7',
        active: true,
      },
    ],
  },
  {
    id: 'cat-consultations',
    order: 4,
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
    order: 5,
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
        icon: 'account_balance_outlined',
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
                  width: (cellW * 2 + 12 - 10) / 2, // Perfect 2-column fit inside parent
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
 * Standard Service Category Card Model (Panchang, Kundli, Consultations, Guidance)
 */
function StandardCategoryCardModel({
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
            const targetRoute = resolveServiceRoute(item.route);

            return (
              <Pressable
                key={item.id}
                testID={`services.card.${item.name.replace(/[^A-Za-z]/g, '')}`}
                onPress={() => push(targetRoute)}
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
                          paddingHorizontal: 5,
                          paddingVertical: 1.5,
                          borderRadius: 5,
                          backgroundColor: withAlpha(item.color || colors.goldAccent, colors.isLight ? 25 : 35),
                        }}
                      >
                        <Text style={{ fontSize: 8.5, fontWeight: '700', color: item.color || colors.goldAccent }}>
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

export default function ServicesScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [w, setW] = useState(Dimensions.get('window').width - 40);
  const [categoriesList, setCategoriesList] = useState<ServiceCategoryModel[]>(DEFAULT_SERVICE_CATEGORIES);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  const cellW = Math.max(140, (w - 12) / 2);

  const loadData = useCallback(async () => {
    try {
      // 1. Read cached categories
      const cached = await AsyncStorage.getItem(STORAGE_CATEGORIES_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategoriesList(parsed);
        }
      }

      // 2. Fetch live configuration from Admin API
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(API_ENDPOINTS.services, { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.categories) && data.categories.length > 0) {
          const sorted = data.categories
            .filter((c: ServiceCategoryModel) => c.active !== false)
            .sort((a: ServiceCategoryModel, b: ServiceCategoryModel) => (a.order || 0) - (b.order || 0));
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

  const filterTabs = [
    { id: 'all', label: 'All Services' },
    { id: 'remedies', label: 'Remedies (8)' },
    { id: 'panchang', label: 'Panchang' },
    { id: 'kundli', label: 'Kundli' },
    { id: 'consultations', label: 'Consultations' },
    { id: 'guidance', label: 'Life Guidance' },
  ];

  // Filter categories by selected pill and search query
  const displayedCategories = categoriesList
    .filter((cat) => {
      if (activeFilter === 'all') return true;
      return cat.category === activeFilter;
    })
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
            Vedic Remedies, Live Panchang, Janam Kundli & Master Consultations.
          </Text>
          <View style={{ marginTop: 12, flexDirection: 'row' }}>
            <StatChip value="5" label="Sacred Sections" colors={colors} />
            <StatChip value="8" label="Canonical Remedies" colors={colors} />
            <StatChip value="4.9★" label="Vedic Masters" colors={colors} />
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
            placeholder="Search remedies, panchang, kundli..."
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
              />
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
