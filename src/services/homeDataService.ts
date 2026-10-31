import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS, resolveMediaUrl } from '@/config/api';

export interface CosmicInsight {
  id: string;
  order?: number;
  tag: string;
  title: string;
  description: string;
  imageUrl: string;
  active: boolean;
  ctaText: string;
  ctaAction: string;
  badgeColor?: string;
  planetTags?: string[];
}

export interface LiveAstrologer {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  rating: number;
  reviews: string;
  consultations?: string;
  price: number;
  isOnline: boolean;
  isAi: boolean;
  imageUrl: string;
  languages: string;
  semanticLabel?: string;
  bio?: string;
  about?: string;
  education?: string;
  certifications?: string[];
  learningSource?: string;
  dailyHours?: string;
  city?: string;
  badge?: string;
  status?: string;
  showOnWebsite?: boolean;
  isPublished?: boolean;
}

const STORAGE_INSIGHTS_KEY = 'astroparihar_cosmic_insights_cache';
const STORAGE_REAL_ASTROLOGERS_KEY = 'astroparihar_real_astrologers_cache';
const STORAGE_AI_ASTROLOGERS_KEY = 'astroparihar_ai_astrologers_cache';
const STORAGE_ASTROLOGERS_KEY = 'astroparihar_home_astrologers_cache';

export const DEFAULT_COSMIC_INSIGHTS: CosmicInsight[] = [
  {
    id: 'insight-1',
    order: 1,
    tag: '✦ Your Cosmic Insight Today',
    title: 'Scorpio — Moon in Punarvasu Nakshatra',
    description: "Jupiter's transit brings divine clarity to your career path and financial growth today.",
    imageUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop',
    active: true,
    ctaText: "View Today's Guidance",
    ctaAction: '/ai-chat-screen',
    badgeColor: '#C9A84C',
    planetTags: ['♃ Jupiter', '♏ Scorpio', 'Punarvasu'],
  },
  {
    id: 'insight-2',
    order: 2,
    tag: '★ Rahu-Ketu Axis Transit',
    title: 'Transformative Soul Shifts Ahead',
    description: 'Auspicious Venus-Mercury harmony favors strategic contracts, spiritual sadhana, and emotional peace.',
    imageUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop',
    active: true,
    ctaText: 'Ask AI Astrologer',
    ctaAction: '/ai-chat-screen',
    badgeColor: '#713B32',
    planetTags: ['♀ Venus', '☿ Mercury', 'Harmony'],
  },
  {
    id: 'insight-3',
    order: 3,
    tag: '❋ Auspicious Shubh Muhurat',
    title: 'Abhijit Muhurat: 11:48 AM – 12:36 PM',
    description: 'Optimal celestial alignment for launching initiatives, closing deals, or beginning sacred remedies.',
    imageUrl: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&auto=format&fit=crop',
    active: true,
    ctaText: 'Explore Panchang',
    ctaAction: '/panchang-screen',
    badgeColor: '#3DCB7A',
    planetTags: ['Abhijit', 'Amrit Kaal', 'Vijay Yoga'],
  },
];

export const DEFAULT_AI_ASTROLOGERS: LiveAstrologer[] = [
  {
    id: 'ai-acharya-devavrat',
    name: 'Acharya Devavrat (AI)',
    specialty: 'Parashara Vedic Astrology, Dasha Analysis & Remedies',
    experience: '1,20,000+ charts',
    rating: 4.99,
    reviews: '38.4k',
    price: 25,
    isOnline: true,
    isAi: true,
    imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&fit=crop',
    languages: 'English, Hindi, Telugu, Tamil, Kannada',
    semanticLabel: 'Autonomous Vedic Ephemeris Grandmaster',
  },
  {
    id: 'ai-vedika',
    name: 'AstroParihar AI Engine',
    specialty: 'Sub-Second Planetary Math & KP Astrology',
    experience: '2,50,000+ calculations',
    rating: 4.98,
    reviews: '42.1k',
    price: 25,
    isOnline: true,
    isAi: true,
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&fit=crop',
    languages: 'English, Hindi, Telugu, Tamil',
    semanticLabel: 'Precision Astronomical Vedic Engine',
  },
  {
    id: 'ai-ananya',
    name: 'Astro Ananya (AI)',
    specialty: 'Love, Marriage Compatibility & Nadi Dosha',
    experience: '80,000+ matchings',
    rating: 4.97,
    reviews: '24.6k',
    price: 25,
    isOnline: true,
    isAi: true,
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&fit=crop',
    languages: 'English, Hindi, Telugu, Tamil',
    semanticLabel: 'Nadi & Kundli Seer, Relationship Expert',
  },
  {
    id: 'ai-arjun',
    name: 'Arjun Pandit (AI)',
    specialty: 'Career Growth, Business Timing & Wealth Astrology',
    experience: '65,000+ career charts',
    rating: 4.96,
    reviews: '18.9k',
    price: 25,
    isOnline: true,
    isAi: true,
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&fit=crop',
    languages: 'English, Hindi, Gujarati, Marathi',
    semanticLabel: 'Vedic Kundli Prodigy & Financial Strategist',
  },
];

export interface DynamicPromotion {
  id: string;
  badge: string;
  discount: string;
  title: string;
  subtitle: string;
  code: string;
  gradientColors: [string, string];
  borderColor: string;
  btnBg: string;
  btnText: string;
  btnLabel: string;
  route: string;
  icon: string;
  active: boolean;
  order?: number;
  imageUrl?: string;
}

const STORAGE_PROMOTIONS_KEY = 'astroparihar_promotions_v2';

export const DEFAULT_DYNAMIC_PROMOTIONS: DynamicPromotion[] = [
  {
    id: 'promo-1',
    badge: 'FIRST CONSULTATION',
    discount: '50% OFF',
    title: '50% OFF Your First Session',
    subtitle: 'Connect with verified Vedic Astrologers or AI Jyotish. Use coupon at checkout.',
    code: 'FIRST50',
    gradientColors: ['#552B24', '#351B17'],
    borderColor: '#713B32',
    btnBg: '#C9A84C',
    btnText: '#FFFFFF',
    btnLabel: 'Claim 50% Off',
    route: '/live-astrologers-screen',
    icon: 'local_offer',
    active: true,
  },
  {
    id: 'promo-2',
    badge: 'FREE LIFE REPORT',
    discount: 'WORTH ₹499',
    title: 'Free Kundli Life Prediction',
    subtitle: 'Get a 40+ page comprehensive Kundli dossier free with any 10-minute session.',
    code: 'FREEKUNDLI',
    gradientColors: ['#0A1D37', '#06101E'],
    borderColor: '#4FC3F7',
    btnBg: '#4FC3F7',
    btnText: '#FFFFFF',
    btnLabel: 'Get Free Report',
    route: '/kundli-reports-screen',
    icon: 'auto_stories',
    active: true,
  },
  {
    id: 'promo-3',
    badge: 'SPECIAL PARIHARA',
    discount: 'FLAT ₹199',
    title: '48-Day Navagraha Shanti',
    subtitle: 'Alleviate active Dasha malefic effects with customized daily Vedic remedies.',
    code: 'PARIHAR199',
    gradientColors: ['#2E1805', '#140A00'],
    borderColor: '#FFB347',
    btnBg: '#FFB347',
    btnText: '#FFFFFF',
    btnLabel: 'Explore Parihar',
    route: '/remedies-screen',
    icon: 'local_fire_department',
    active: true,
  },
];

/**
 * Fetch dynamic Promotions & Offers with turn off/on support
 */
export async function getDynamicPromotions(): Promise<DynamicPromotion[]> {
  try {
    // 1. Try local cache first for instant render
    const cached = await AsyncStorage.getItem(STORAGE_PROMOTIONS_KEY);
    let parsedCache: DynamicPromotion[] | null = null;
    if (cached) {
      try {
        parsedCache = JSON.parse(cached);
      } catch {}
    }

    // 2. Fetch live banners from dashboard API
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(API_ENDPOINTS.banners, { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.banners)) {
          // If turned off (active === false), exclude it
          const activeBanners = data.banners.filter((b: any) => b.active !== false);

          const palettes: Array<{ gradient: [string, string]; border: string; btnBg: string; btnText: string; icon: string }> = [
            { gradient: ['#552B24', '#351B17'], border: '#713B32', btnBg: '#C9A84C', btnText: '#FFFFFF', icon: 'local_offer' },
            { gradient: ['#0A1D37', '#06101E'], border: '#4FC3F7', btnBg: '#4FC3F7', btnText: '#FFFFFF', icon: 'auto_stories' },
            { gradient: ['#2E1805', '#140A00'], border: '#FFB347', btnBg: '#FFB347', btnText: '#FFFFFF', icon: 'local_fire_department' },
            { gradient: ['#1B0F2E', '#0D0518'], border: '#9370DB', btnBg: '#9370DB', btnText: '#FFFFFF', icon: 'stars' },
          ];

          const mapped: DynamicPromotion[] = activeBanners.map((b: any, idx: number) => {
            const style = palettes[idx % palettes.length];
            return {
              id: b.id || `promo-${idx}`,
              badge: (b.badge || 'PROMO OFFER').toUpperCase(),
              discount: b.discount || b.badge || 'SPECIAL',
              title: b.title || 'Special Vedic Offer',
              subtitle: b.subtitle || '',
              code: b.code || 'ASTRO',
              gradientColors: style.gradient,
              borderColor: style.border,
              btnBg: style.btnBg,
              btnText: style.btnText,
              btnLabel: b.ctaText || 'Claim Offer',
              route: b.ctaAction || '/live-astrologers-screen',
              icon: style.icon,
              imageUrl: b.imageUrl,
              active: b.active !== false,
              order: b.order || idx + 1,
            };
          });

          await AsyncStorage.setItem(STORAGE_PROMOTIONS_KEY, JSON.stringify(mapped));
          return mapped;
        }
      }
    } catch {}

    // Fallback to cache if available
    if (parsedCache !== null) return parsedCache;
  } catch (err) {
    console.warn('Error reading dynamic promotions:', err);
  }

  return DEFAULT_DYNAMIC_PROMOTIONS;
}

/**
 * Fetch dynamic Cosmic Insights from API or Firestore, with cache & fallbacks
 */
export async function getDynamicCosmicInsights(): Promise<CosmicInsight[]> {
  try {
    // 1. Try local cache first for instant render
    const cached = await AsyncStorage.getItem(STORAGE_INSIGHTS_KEY);
    let parsedCache: CosmicInsight[] | null = null;
    if (cached) {
      try {
        parsedCache = JSON.parse(cached);
      } catch {}
    }

    // 2. Try Next.js API endpoint
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(API_ENDPOINTS.cosmicInsights, {
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.insights)) {
          // Accurately respect turned off cards (active === false)
          const active = data.insights.filter((c: CosmicInsight) => c.active !== false);
          await AsyncStorage.setItem(STORAGE_INSIGHTS_KEY, JSON.stringify(active));
          return active;
        }
      }
    } catch {}

    // 3. Fallback to direct Firestore REST API
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const fsRes = await fetch(
        'https://firestore.googleapis.com/v1/projects/astroparihar-85e2d/databases/(default)/documents/app_dynamic_content/cosmic_insights',
        { signal: controller.signal }
      );
      clearTimeout(timer);
      if (fsRes.ok) {
        const fsData = await fsRes.json();
        if (fsData.fields?.insights?.arrayValue?.values) {
          const list = fsData.fields.insights.arrayValue.values.map((v: any) => {
            const m = v.mapValue?.fields || {};
            return {
              id: m.id?.stringValue || `insight-${Date.now()}`,
              tag: m.tag?.stringValue || '✦ Cosmic Transit',
              title: m.title?.stringValue || 'Planetary Shift',
              description: m.description?.stringValue || '',
              imageUrl: m.imageUrl?.stringValue || 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop',
              active: m.active?.booleanValue !== false,
              ctaText: m.ctaText?.stringValue || "View Today's Guidance",
              ctaAction: m.ctaAction?.stringValue || '/ai-chat-screen',
              planetTags: m.planetTags?.arrayValue?.values?.map((p: any) => p.stringValue) || ['Jupiter', 'Vedic'],
            };
          });
          const active = list.filter((c: CosmicInsight) => c.active !== false);
          await AsyncStorage.setItem(STORAGE_INSIGHTS_KEY, JSON.stringify(active));
          return active;
        }
      }
    } catch {}

    if (parsedCache !== null) return parsedCache;
  } catch (err) {
    console.warn('Error reading cosmic insights:', err);
  }

  return DEFAULT_COSMIC_INSIGHTS;
}

async function fetchDirectFirestoreRealAstrologers(): Promise<LiveAstrologer[]> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/astroparihar-85e2d/databases/(default)/documents/astrologers?pageSize=100&_t=${Date.now()}`,
      {
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      }
    );
    clearTimeout(timer);
    if (!res.ok) return [];
    const json = await res.json();
    if (!Array.isArray(json.documents)) return [];

    const allVerified: LiveAstrologer[] = [];
    for (const doc of json.documents) {
      const id = doc.name ? doc.name.split('/').pop() : '';
      const f = doc.fields || {};
      const status = f.status?.stringValue || '';
      if (!['approved', 'active', 'probation', 'verified'].includes(status)) continue;

      const rawName = f.name?.stringValue || 'Astrologer';
      const cleanName = rawName
        .split(' ')
        .map((w: string) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ''))
        .join(' ')
        .trim();

      let skillsArr: string[] = [];
      if (f.skills?.arrayValue?.values) {
        skillsArr = f.skills.arrayValue.values.map((v: any) => v.stringValue).filter(Boolean);
      } else if (f.skills?.stringValue) {
        skillsArr = f.skills.stringValue.split(',').map((s: string) => s.trim()).filter(Boolean);
      } else if (f.specialisations?.arrayValue?.values) {
        skillsArr = f.specialisations.arrayValue.values.map((v: any) => v.stringValue).filter(Boolean);
      } else if (f.speciality?.stringValue || f.specialization?.stringValue) {
        skillsArr = [f.speciality?.stringValue || f.specialization?.stringValue];
      }

      const specialty = skillsArr.length > 0 ? skillsArr.join(', ') : '';

      let expNum = f.experienceYears?.integerValue
        ? parseInt(f.experienceYears.integerValue, 10)
        : f.experienceYears?.doubleValue
        ? Math.round(f.experienceYears.doubleValue)
        : 0;
      if (!expNum && f.experience?.stringValue) {
        const parsed = parseInt(f.experience.stringValue.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(parsed) && parsed > 0) expNum = parsed;
      }

      const isOnline = f.isOnline?.booleanValue === true;
      const rawPrice =
        f.amount?.integerValue ||
        f.amount?.stringValue ||
        f.pricePerMinute?.integerValue ||
        f.pricePerMinute?.stringValue ||
        f.price?.integerValue;
      const price = rawPrice ? parseInt(String(rawPrice), 10) || 0 : 0;

      const rating =
        f.rating?.doubleValue ||
        (f.rating?.integerValue ? parseFloat(f.rating.integerValue) : 0);

      const reviewsCount =
        f.reviewsCount?.integerValue ||
        f.reviews?.integerValue ||
        f.reviews?.stringValue ||
        '0';

      const totalConsultations =
        f.totalConsultations?.integerValue ||
        f.consultations?.integerValue ||
        f.completedConsultations?.integerValue ||
        '0';

      let languages = '';
      if (f.languages?.stringValue) {
        languages = f.languages.stringValue;
      } else if (f.languages?.arrayValue?.values) {
        languages = f.languages.arrayValue.values
          .map((v: any) => v.stringValue)
          .filter(Boolean)
          .join(', ');
      }

      const photo =
        f.profileImageUrl?.stringValue ||
        f.photoURL?.stringValue ||
        f.avatar?.stringValue ||
        f.imageUrl?.stringValue ||
        f.profilePic?.stringValue ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=713B32&color=fff&size=512`;

      const bio = f.bio?.stringValue || f.about?.stringValue || '';
      const education = f.education?.stringValue || '';
      const learningSource = f.learningSource?.stringValue || '';
      const dailyHours = f.dailyHours?.stringValue || '';
      const city = f.city?.stringValue || f.location?.stringValue || '';
      const badge = f.badge?.stringValue || (status === 'probation' ? 'PROBATION' : 'VERIFIED');

      let certifications: string[] = [];
      if (f.certifications?.arrayValue?.values) {
        certifications = f.certifications.arrayValue.values
          .map((v: any) => v.stringValue)
          .filter(Boolean);
      } else if (f.certifications?.stringValue) {
        certifications = f.certifications.stringValue
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean);
      }

      const showOnWebsite =
        f.showOnWebsite?.booleanValue !== undefined
          ? f.showOnWebsite.booleanValue
          : f.isPublished?.booleanValue !== undefined
          ? f.isPublished.booleanValue
          : true;

      allVerified.push({
        id: id || cleanName.toLowerCase(),
        name: cleanName,
        specialty,
        experience: expNum > 0 ? `${expNum}+ Yrs` : '',
        rating: rating > 0 ? Number(rating.toFixed(2)) : 0,
        reviews: String(reviewsCount),
        consultations: String(totalConsultations),
        price,
        isOnline,
        isAi: false,
        imageUrl: resolveMediaUrl(photo),
        languages,
        semanticLabel: `${cleanName} - Verified Astrologer`,
        bio,
        about: bio,
        education,
        certifications,
        learningSource,
        dailyHours,
        city,
        badge,
        status,
        showOnWebsite,
        isPublished: showOnWebsite,
      });
    }

    const published = allVerified.filter((a) => a.showOnWebsite !== false);
    const list = published.length > 0 ? published : allVerified;
    // Sort online astrologers first so live status changes immediately reflect at the top
    return list.sort((a, b) => Number(b.isOnline) - Number(a.isOnline));
  } catch {
    return [];
  }
}

/**
 * Fetch strictly REAL human astrologers directly from live Firestore.
 * Zero static fallback data — reflects live Online/Offline status and profile fields.
 */
export async function fetchRealAstrologers(): Promise<LiveAstrologer[]> {
  try {
    // 1. Direct Firestore REST dynamic sync first (instant reflection of Online/Offline & profile edits)
    const directLive = await fetchDirectFirestoreRealAstrologers();
    if (directLive.length > 0) {
      await AsyncStorage.setItem(STORAGE_REAL_ASTROLOGERS_KEY, JSON.stringify(directLive));
      return directLive;
    }

    // 2. Fallback to Next.js API endpoint if direct Firestore call fails
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`${API_ENDPOINTS.astrologers}?type=real&_t=${Date.now()}`, {
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.realAstrologers) && data.realAstrologers.length > 0
          ? data.realAstrologers
          : Array.isArray(data.astrologers)
          ? data.astrologers.filter((a: any) => !a.isAi && !a.id?.startsWith('ai-'))
          : null;

        if (list && list.length > 0) {
          const resolved = list.map((a: any) => ({
            ...a,
            isAi: false,
            isOnline: Boolean(a.isOnline),
            imageUrl: resolveMediaUrl(a.profileImageUrl || a.imageUrl || a.photoURL || a.avatar),
          }));
          await AsyncStorage.setItem(STORAGE_REAL_ASTROLOGERS_KEY, JSON.stringify(resolved));
          return resolved;
        }
      }
    } catch {}
  } catch (err) {
    console.warn('Error fetching real astrologers:', err);
  }

  return [];
}

/**
 * Fetch strictly AI Astrologers.
 * Never mixed with real astrologers!
 */
export async function fetchAiAstrologers(): Promise<LiveAstrologer[]> {
  try {
    const cached = await AsyncStorage.getItem(STORAGE_AI_ASTROLOGERS_KEY);
    let parsedCache: LiveAstrologer[] | null = null;
    if (cached) {
      try {
        parsedCache = JSON.parse(cached);
      } catch {}
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`${API_ENDPOINTS.astrologers}?type=ai`, {
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.aiAstrologers) && data.aiAstrologers.length > 0
          ? data.aiAstrologers
          : Array.isArray(data.astrologers)
          ? data.astrologers.filter((a: any) => a.isAi)
          : null;

        if (list && list.length > 0) {
          const resolved = list.map((a: any) => ({
            ...a,
            isAi: true,
            imageUrl: resolveMediaUrl(a.imageUrl),
          }));
          await AsyncStorage.setItem(STORAGE_AI_ASTROLOGERS_KEY, JSON.stringify(resolved));
          return resolved;
        }
      }
    } catch {}

    if (parsedCache && parsedCache.length > 0) {
      return parsedCache.map((a: any) => ({
        ...a,
        isAi: true,
        imageUrl: resolveMediaUrl(a.imageUrl),
      }));
    }
  } catch (err) {
    console.warn('Error fetching AI astrologers:', err);
  }

  return DEFAULT_AI_ASTROLOGERS;
}

/**
 * Default home astrologers query returns strictly Real Astrologers.
 */
export async function getLiveHomeAstrologers(): Promise<LiveAstrologer[]> {
  return fetchRealAstrologers();
}
