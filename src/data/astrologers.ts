/** Data ported verbatim from live_astrologers_screen.dart (_astrologerMaps). */
export interface AstrologerData {
  id?: string;
  name: string;
  title?: string;
  specialty: string;
  experience: string;
  rating: number;
  reviews: string;
  consultations?: string;
  price: number;
  isOnline: boolean;
  languages: string;
  imageUrl: string;
  semanticLabel: string;
  category?: string;
  isFeatured?: boolean;
  isAi?: boolean;
  discount?: string | null;
  [k: string]: unknown;
}

export const LIVE_ASTROLOGERS: AstrologerData[] = [
  {
    id: '8No3bTeCRKRdQ2c1AVXi9ZGvSGc2',
    isAi: false,
    name: 'Sharma',
    title: 'Numerology & Vedic Astrology • 12+ Yrs',
    specialty: 'Numerology',
    experience: '12+ Yrs',
    rating: 4.95,
    reviews: '0.9k',
    consultations: '980+',
    price: 20,
    isOnline: true,
    languages: 'English',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    semanticLabel: 'Sharma - Verified Vedic & Numerology Astrologer',
    category: 'Numerology',
    isFeatured: true,
    bio: 'Sharma is a renowned Vedic astrologer with 12 years of dedicated practice. Specializes in accurate predictions and Parihara remedies.',
  },
  {
    id: 'AaQbqgvOUOMifZi4Sg0YUxJvBDJ2',
    isAi: false,
    name: 'Raj Vishwa',
    title: 'Vastu & Numerology • 20+ Yrs',
    specialty: 'Vastu',
    experience: '20+ Yrs',
    rating: 4.95,
    reviews: '1.2k',
    consultations: '1,200+',
    price: 25,
    isOnline: false,
    languages: 'English, Telugu, Tamil, Hindi',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&fit=crop',
    semanticLabel: 'Raj Vishwa - Verified Vastu & Vedic Scholar',
    category: 'Vastu',
    isFeatured: false,
    bio: 'Over 20 years of experience in traditional Vastu Shastra, Numerology, and Vedic solutions.',
  },
  {
    id: 'ast-1789887155087',
    isAi: false,
    name: 'Sandy',
    title: 'Vedic Jyotish • 12+ Yrs',
    specialty: 'Vedic Jyotish',
    experience: '12+ Yrs',
    rating: 4.92,
    reviews: '0.8k',
    consultations: '850+',
    price: 25,
    isOnline: true,
    languages: 'English, Telugu',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&fit=crop',
    semanticLabel: 'Sandy - Verified Vedic Jyotish Astrologer',
    category: 'Vedic',
    isFeatured: false,
    bio: 'Specialist in Vedic Jyotish, birth chart analysis, and practical pariharams.',
  },
];

