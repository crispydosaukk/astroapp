const fs = require('fs');
const path = require('path');

const webRoot = 'c:/Users/PC/Desktop/astroparihar';

// 1. Update appDynamicContent.ts
const appDynamicContentPath = path.join(webRoot, 'src/lib/appDynamicContent.ts');
if (fs.existsSync(appDynamicContentPath)) {
  let content = fs.readFileSync(appDynamicContentPath, 'utf8');
  if (!content.includes('CosmicInsightCard')) {
    const code = `
/* ------------------------------------------------ Cosmic Insights Carousel */
const INSIGHTS_DOC_ID = 'cosmic_insights';

export interface CosmicInsightCard {
  id: string;
  order: number;
  tag: string;
  title: string;
  description: string;
  imageUrl: string;
  active: boolean;
  ctaText: string;
  ctaAction: string;
  badgeColor?: string;
  planetTags?: string[];
  updatedAt?: string;
}

export const DEFAULT_COSMIC_INSIGHTS: CosmicInsightCard[] = [
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
    planetTags: ['Jupiter Transit', 'Punarvasu', 'Career Glow'],
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
    planetTags: ['Venus Shanti', 'Mercury Direct', 'Harmony'],
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
    planetTags: ['Abhijit Muhurat', 'Amrit Kaal', 'Vijay Yoga'],
  },
];

export async function getCosmicInsights(): Promise<CosmicInsightCard[]> {
  try {
    if (!db) return DEFAULT_COSMIC_INSIGHTS;

    const docRef = doc(db, COLLECTION_NAME, INSIGHTS_DOC_ID);
    const snap = await getDoc(docRef);

    if (snap.exists() && snap.data()?.insights && Array.isArray(snap.data()?.insights)) {
      const insights = snap.data().insights as CosmicInsightCard[];
      return insights.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
  } catch (err) {
    console.warn('Could not fetch cosmic insights from Firestore, using defaults:', err);
  }
  return DEFAULT_COSMIC_INSIGHTS;
}

export async function saveCosmicInsights(insights: CosmicInsightCard[]): Promise<boolean> {
  try {
    if (!db) return false;

    const docRef = doc(db, COLLECTION_NAME, INSIGHTS_DOC_ID);
    await setDoc(
      docRef,
      {
        insights,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.error('Error saving cosmic insights to Firestore:', err);
    throw err;
  }
}
`;
    fs.writeFileSync(appDynamicContentPath, content + code, 'utf8');
    console.log('Updated appDynamicContent.ts with Cosmic Insights');
  }
}

// 2. Create API route /api/app-dynamic/cosmic-insights/route.ts
const insightsApiDir = path.join(webRoot, 'src/app/api/app-dynamic/cosmic-insights');
fs.mkdirSync(insightsApiDir, { recursive: true });
const insightsApiFile = path.join(insightsApiDir, 'route.ts');
const insightsApiCode = `import { NextRequest, NextResponse } from 'next/server';
import { getCosmicInsights, saveCosmicInsights, DEFAULT_COSMIC_INSIGHTS } from '@/lib/appDynamicContent';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const insights = await getCosmicInsights();
    return NextResponse.json(
      { success: true, insights },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Error fetching cosmic insights:', error);
    return NextResponse.json(
      { success: true, insights: DEFAULT_COSMIC_INSIGHTS, fallback: true },
      { headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { insights } = body;

    if (!Array.isArray(insights)) {
      return NextResponse.json(
        { success: false, error: 'insights must be an array' },
        { status: 400, headers: corsHeaders }
      );
    }

    await saveCosmicInsights(insights);
    return NextResponse.json(
      { success: true, message: 'Cosmic insights updated successfully', insights },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Error saving cosmic insights:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save cosmic insights' },
      { status: 500, headers: corsHeaders }
    );
  }
}
`;
fs.writeFileSync(insightsApiFile, insightsApiCode, 'utf8');
console.log('Created /api/app-dynamic/cosmic-insights/route.ts');

// 3. Create unified Astrologers API endpoint for Mobile App: /api/app-dynamic/astrologers/route.ts
const astrologersApiDir = path.join(webRoot, 'src/app/api/app-dynamic/astrologers');
fs.mkdirSync(astrologersApiDir, { recursive: true });
const astrologersApiFile = path.join(astrologersApiDir, 'route.ts');
const astrologersApiCode = `import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAIAstrologers, DEFAULT_AI_ASTROLOGERS } from '@/lib/aiAstrologerData';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    // 1. Fetch AI Astrologers from Firestore / defaults
    const aiAstrologers = await getAIAstrologers();

    // 2. Fetch Human Astrologers approved in Admin Panel
    let realAstrologers: any[] = [];
    try {
      const snap = await adminDb.collection('astrologers').where('status', '==', 'approved').get();
      if (!snap.empty) {
        realAstrologers = snap.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
        }));
      }
    } catch (e: any) {
      console.warn('Could not read real astrologers from Firestore:', e.message);
    }

    // 3. Normalize into unified list for the mobile app
    const formattedAi = (aiAstrologers || DEFAULT_AI_ASTROLOGERS).map((a) => ({
      id: a.id,
      name: a.name,
      specialty: a.primaryDiscipline || a.tagline || 'Vedic Astrology',
      experience: \`\${a.experienceYears || 15}+ Yrs\`,
      rating: a.rating || 4.98,
      reviews: \`\${Math.round((a.totalConsultations || 1200) / 100) / 10}k\`,
      price: a.pricePerMin || 30,
      isOnline: a.availability === 'online' || a.isActive !== false,
      isAi: true,
      imageUrl: a.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
      languages: (a.languages || ['Hindi', 'English']).join(', '),
      bio: a.bio || a.tagline || '',
    }));

    const formattedReal = realAstrologers.map((r) => ({
      id: r.id,
      name: r.name || 'Acharya Ji',
      specialty: r.specialization || r.specialties?.[0] || 'Vedic Astrology',
      experience: \`\${r.experience || 10}+ Yrs\`,
      rating: Number(r.rating) || 4.95,
      reviews: \`\${Math.round((r.totalConsultations || 850) / 100) / 10}k\`,
      price: Number(r.pricePerMinute || r.price) || 25,
      isOnline: r.isOnline !== false,
      isAi: false,
      imageUrl: r.photoURL || r.avatar || r.imageUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      languages: Array.isArray(r.languages) ? r.languages.join(', ') : (r.languages || 'Hindi, English'),
      bio: r.bio || '',
    }));

    // Combine both: Real astrologers + AI astrologers
    const allAstrologers = [...formattedReal, ...formattedAi];

    return NextResponse.json(
      {
        success: true,
        astrologers: allAstrologers,
        aiCount: formattedAi.length,
        realCount: formattedReal.length,
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('Error fetching unified astrologers:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
`;
fs.writeFileSync(astrologersApiFile, astrologersApiCode, 'utf8');
console.log('Created /api/app-dynamic/astrologers/route.ts');
