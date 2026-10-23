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
  { name: 'Swami Shankarananda Giri', title: 'Venerable Himalayan Sage & Parashara Dasha Guru', specialty: 'Career & Promotion, Marriage & Kundli Milan', experience: '35+ Yrs', rating: 4.99, reviews: '24.5k', consultations: '98,240', price: 45, isOnline: true, languages: 'Hindi, Sanskrit, English', imageUrl: 'https://astroparihar.com/assets/images/ai-astrologers/swami-ji.png', semanticLabel: 'Elderly Indian sage with white beard and traditional orange robes, serene peaceful expression, professional portrait', category: 'Vedic', isFeatured: true, discount: null },
  { name: 'Swami Sadasiva Rao', title: 'Venerable South Indian Vedic Astrologer & Dasha Authority', specialty: 'Dasha Transitions, Life Milestones', experience: '42+ Yrs', rating: 4.99, reviews: '26.8k', consultations: '1,12,450', price: 55, isOnline: true, languages: 'Telugu, Tamil, Hindi, English', imageUrl: 'https://astroparihar.com/assets/images/ai-astrologers/mr-rao.png', semanticLabel: 'Elderly South Indian man in traditional white dhoti with sacred thread, wise expression and calm demeanor', category: 'Vedic', isFeatured: false, discount: null },
  { name: 'Swami Anandamurti Saraswati', title: 'Spiritual Vedic Sage & Karmic Chart Analyzer', specialty: 'Karmic Debts, Mental Peace & Stress', experience: '30+ Yrs', rating: 4.97, reviews: '19.3k', consultations: '76,320', price: 40, isOnline: false, languages: 'Hindi, Sanskrit, Marathi', imageUrl: 'https://astroparihar.com/assets/images/ai-astrologers/swami-ji.png', semanticLabel: 'Indian spiritual teacher in saffron robes with meditation beads, serene and wise expression', category: 'Spirituality', isFeatured: false, discount: '20% off first session' },
  { name: 'Acharya Raghvendra Shastri', title: 'Relationship Astrology & Soul Harmony Expert', specialty: 'Love & Marriage Harmony, Relationship Healing', experience: '19+ Yrs', rating: 4.96, reviews: '18.9k', consultations: '64,100', price: 22, isOnline: true, languages: 'Hindi, English', imageUrl: 'https://astroparihar.com/assets/images/ai-astrologers/love-guru.png', semanticLabel: 'Indian man in traditional kurta with calm and wise expression, professional astrologer headshot', category: 'Love', isFeatured: false, discount: null },
  { name: 'Acharya Shreya Devi', title: 'Kundli Milan Specialist & Marital Bliss Counselor', specialty: '36 Gun Milan, Navamsha (D9) Analysis', experience: '16+ Yrs', rating: 4.97, reviews: '15.2k', consultations: '52,880', price: 20, isOnline: true, languages: 'Tamil, Hindi, English', imageUrl: 'https://astroparihar.com/assets/images/ai-astrologers/meera-devi.png', semanticLabel: 'Indian woman in traditional saree with warm smile and professional appearance, astrologer portrait', category: 'Marriage', isFeatured: false, discount: 'First 3 min free' },
  { name: 'Pandit Radhey Shyam Chaturvedi', title: 'Traditional Mathura Jyotishi & Kundli Dosha Expert', specialty: 'Kaal Sarp & Manglik Dosha, Sade Sati Remedies', experience: '28+ Yrs', rating: 4.96, reviews: '16.4k', consultations: '71,560', price: 35, isOnline: false, languages: 'Hindi, Sanskrit', imageUrl: 'https://astroparihar.com/assets/images/ai-astrologers/pandit-raghav.png', semanticLabel: 'Middle-aged Indian pandit in traditional attire with tilak on forehead, scholarly appearance', category: 'Vedic', isFeatured: false, discount: null },
  { name: 'Shastri Vidyadhar Bhatt', title: 'Kashi Sanskrit University Scholar & Panchang Master', specialty: 'Muhurtha, Panchang, Tithi Analysis', experience: '26+ Yrs', rating: 4.97, reviews: '14.8k', consultations: '58,900', price: 30, isOnline: true, languages: 'Hindi, Sanskrit, Gujarati', imageUrl: 'https://astroparihar.com/assets/images/ai-astrologers/acharya-devavrat.png', semanticLabel: 'Indian scholar in traditional white dhoti with sacred thread and books, knowledgeable expression', category: 'Vedic', isFeatured: false, discount: null },
  { name: 'Jyotishacharya Meenakshi Iyer', title: 'KP Astrology Specialist & Career Guidance Expert', specialty: 'KP System, Career & Finance Timing', experience: '14+ Yrs', rating: 4.95, reviews: '11.2k', consultations: '38,740', price: 18, isOnline: true, languages: 'Tamil, English, Hindi', imageUrl: 'https://astroparihar.com/assets/images/ai-astrologers/priya-sharma.png', semanticLabel: 'South Indian woman with traditional flowers in hair and professional kurta, warm and knowledgeable expression', category: 'Career', isFeatured: false, discount: '₹5/min introductory price' },
];
