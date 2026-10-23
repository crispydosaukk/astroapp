import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '@/config/api';

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
  price: number;
  isOnline: boolean;
  isAi: boolean;
  imageUrl: string;
  languages: string;
  semanticLabel?: string;
}

const STORAGE_INSIGHTS_KEY = 'astroparihar_cosmic_insights_cache';
const STORAGE_ASTROLOGERS_KEY = 'astroparihar_home_astrologers_cache';

export const DEFAULT_COSMIC_INSIGHTS: CosmicInsight[] = [
  {
    id: 'insight-1',
    order: 1,
    tag: '✦ Your Cosmic Insight Today',
    title: 'Scorpio — Moon in Punarvasu Nakshatra',
    description: "Jupiter's transit brings divine clarity to your career path and financial growth today.",
    imageUrl: 'https://images.pexels.com/photos/1252890/pexels-photo-1252890.jpeg?auto=compress&cs=tinysrgb&w=600',
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
    badgeColor: '#8B1A1A',
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

export const DEFAULT_HOME_ASTROLOGERS: LiveAstrologer[] = [
  {
    id: 'astro-1',
    name: 'Swami Shankarananda Giri',
    specialty: 'Parashara Dasha Guru',
    experience: '35+ Yrs',
    rating: 4.99,
    reviews: '24.5k',
    price: 45,
    isOnline: true,
    isAi: false,
    imageUrl: 'https://img.rocket.new/generatedImages/rocket_gen_img_155f972a8-1770809507602.png',
    languages: 'Hindi, Sanskrit',
    semanticLabel: 'Elderly Indian sage with white beard and traditional robes',
  },
  {
    id: 'ai-acharya-devavrat',
    name: 'Acharya Devavrat Shastri',
    specialty: 'Vedic Jyotish & Kundli Milan',
    experience: '28+ Yrs',
    rating: 4.98,
    reviews: '18.9k',
    price: 25,
    isOnline: true,
    isAi: true,
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    languages: 'Hindi, English, Telugu',
    semanticLabel: 'Wise Indian Vedic scholar in saffron kurta with peaceful expression',
  },
  {
    id: 'astro-2',
    name: 'Acharya Raghvendra Shastri',
    specialty: 'Relationship & Soul Harmony',
    experience: '19+ Yrs',
    rating: 4.96,
    reviews: '18.9k',
    price: 22,
    isOnline: true,
    isAi: false,
    imageUrl: 'https://img.rocket.new/generatedImages/rocket_gen_img_15a0ea664-1763296536479.png',
    languages: 'Hindi, English',
    semanticLabel: 'Indian man in traditional kurta with calm and wise expression',
  },
  {
    id: 'ai-acharya-bhuvanesh',
    name: 'Acharya Bhuvanesh Joshi',
    specialty: 'Vastu Shastra & Career Remedial',
    experience: '22+ Yrs',
    rating: 4.95,
    reviews: '14.2k',
    price: 22,
    isOnline: true,
    isAi: true,
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    languages: 'Hindi, English, Marathi',
    semanticLabel: 'Distinguished Vedic scholar with traditional tilak',
  },
  {
    id: 'astro-3',
    name: 'Acharya Shreya Devi',
    specialty: 'Kundli Milan Specialist',
    experience: '16+ Yrs',
    rating: 4.97,
    reviews: '15.2k',
    price: 20,
    isOnline: false,
    isAi: false,
    imageUrl: 'https://img.rocket.new/generatedImages/rocket_gen_img_167d481e0-1772731661402.png',
    languages: 'Tamil, Hindi, English',
    semanticLabel: 'Indian woman in traditional saree with warm smile',
  },
];

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
      const timer = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(API_ENDPOINTS.cosmicInsights, {
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.insights) && data.insights.length > 0) {
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
              imageUrl: m.imageUrl?.stringValue || 'https://images.pexels.com/photos/1252890/pexels-photo-1252890.jpeg?auto=compress&cs=tinysrgb&w=600',
              active: m.active?.booleanValue !== false,
              ctaText: m.ctaText?.stringValue || "View Today's Guidance",
              ctaAction: m.ctaAction?.stringValue || '/ai-chat-screen',
              planetTags: m.planetTags?.arrayValue?.values?.map((p: any) => p.stringValue) || ['Jupiter', 'Vedic'],
            };
          });
          const active = list.filter((c: CosmicInsight) => c.active);
          await AsyncStorage.setItem(STORAGE_INSIGHTS_KEY, JSON.stringify(active));
          return active;
        }
      }
    } catch {}

    if (parsedCache && parsedCache.length > 0) return parsedCache;
  } catch (err) {
    console.warn('Error reading cosmic insights:', err);
  }

  return DEFAULT_COSMIC_INSIGHTS;
}

/**
 * Fetch unified list of live Astrologers (both AI and Real Astrologers)
 */
export async function getLiveHomeAstrologers(): Promise<LiveAstrologer[]> {
  try {
    // 1. Try local cache
    const cached = await AsyncStorage.getItem(STORAGE_ASTROLOGERS_KEY);
    let parsedCache: LiveAstrologer[] | null = null;
    if (cached) {
      try {
        parsedCache = JSON.parse(cached);
      } catch {}
    }

    // 2. Try Next.js API endpoint
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(API_ENDPOINTS.astrologers, {
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.astrologers) && data.astrologers.length > 0) {
          await AsyncStorage.setItem(STORAGE_ASTROLOGERS_KEY, JSON.stringify(data.astrologers));
          return data.astrologers;
        }
      }
    } catch {}

    // 3. Fallback to direct Firestore REST query for AI Astrologers
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const fsRes = await fetch(
        'https://firestore.googleapis.com/v1/projects/astroparihar-85e2d/databases/(default)/documents/ai_astrologers?pageSize=10',
        { signal: controller.signal }
      );
      clearTimeout(timer);
      if (fsRes.ok) {
        const fsData = await fsRes.json();
        if (Array.isArray(fsData.documents) && fsData.documents.length > 0) {
          const fsAstros: LiveAstrologer[] = fsData.documents.map((doc: any) => {
            const f = doc.fields || {};
            const docId = doc.name.split('/').pop();
            const ratingVal = f.rating?.doubleValue || (f.rating?.integerValue ? parseInt(f.rating.integerValue, 10) : 4.97);
            const priceVal = f.pricePerMin?.integerValue ? parseInt(f.pricePerMin.integerValue, 10) : (f.pricePerMin?.stringValue ? parseInt(f.pricePerMin.stringValue, 10) : 25);
            const nameVal = f.name?.stringValue || 'Acharya Ji';
            const specialtyVal = f.primaryDiscipline?.stringValue || f.tagline?.stringValue || 'Vedic Astrology';
            const expVal = f.experienceYears?.integerValue ? `${f.experienceYears.integerValue}+ Yrs` : '20+ Yrs';
            const avatarVal = f.avatar?.stringValue || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400';
            const isAvail = f.availability?.stringValue === 'online' || f.isActive?.booleanValue !== false;

            return {
              id: docId || `astro-${Math.random()}`,
              name: nameVal,
              specialty: specialtyVal,
              experience: expVal,
              rating: ratingVal,
              reviews: '18.5k',
              price: priceVal,
              isOnline: isAvail,
              isAi: true,
              imageUrl: avatarVal,
              languages: 'Hindi, English',
              semanticLabel: `${nameVal}, specialist in ${specialtyVal}`,
            };
          });

          if (fsAstros.length > 0) {
            // Combine with default masters for rich diversity
            const combined = [...DEFAULT_HOME_ASTROLOGERS.filter((a) => !a.isAi), ...fsAstros];
            await AsyncStorage.setItem(STORAGE_ASTROLOGERS_KEY, JSON.stringify(combined));
            return combined;
          }
        }
      }
    } catch {}

    if (parsedCache && parsedCache.length > 0) return parsedCache;
  } catch (err) {
    console.warn('Error reading home astrologers:', err);
  }

  return DEFAULT_HOME_ASTROLOGERS;
}
