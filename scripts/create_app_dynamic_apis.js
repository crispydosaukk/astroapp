const fs = require('fs');
const path = require('path');

const WEB_ROOT = 'c:\\Users\\PC\\Desktop\\astroparihar';

// Helper to write file safely
function writeFile(subPath, content) {
  const fullPath = path.join(WEB_ROOT, subPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Created: ${subPath}`);
}

const CORS_HEADERS = `
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}
`;

// 1. Kundli Calculate Route
const KUNDLI_CALCULATE_ROUTE = `import { NextRequest, NextResponse } from 'next/server';
import { calculateBirthChartData, resolveCityCoordinates } from '@/lib/vedicAstrologyEngine';

${CORS_HEADERS}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      dob = '1995-10-15',
      tob = '12:00 PM',
      pob = 'New Delhi, India',
      name = 'Devotee',
      gender = 'Male',
      lat,
      lon,
    } = body;

    const coords = resolveCityCoordinates(pob, lat, lon);
    const chart = calculateBirthChartData(
      dob,
      tob,
      pob,
      coords.lat,
      coords.lon,
      name,
      gender
    );

    return NextResponse.json({
      success: true,
      chart,
      coordinates: coords,
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Error calculating kundli in app-dynamic:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to calculate birth chart',
    }, { status: 500, headers: corsHeaders });
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const dob = url.searchParams.get('dob') || '1995-10-15';
  const tob = url.searchParams.get('tob') || '12:00 PM';
  const pob = url.searchParams.get('pob') || 'New Delhi, India';
  const name = url.searchParams.get('name') || 'Devotee';
  const gender = url.searchParams.get('gender') || 'Male';

  const coords = resolveCityCoordinates(pob);
  const chart = calculateBirthChartData(dob, tob, pob, coords.lat, coords.lon, name, gender);

  return NextResponse.json({
    success: true,
    chart,
    coordinates: coords,
  }, { headers: corsHeaders });
}
`;

// 2. Kundli Match Route
const KUNDLI_MATCH_ROUTE = `import { NextRequest, NextResponse } from 'next/server';
import { calculateAshtakootGunMilan } from '@/lib/vedicAstrologyEngine';

${CORS_HEADERS}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      groom = { name: 'Groom', dob: '1994-05-12', tob: '10:30 AM', pob: 'Mumbai, India' },
      bride = { name: 'Bride', dob: '1996-08-20', tob: '02:15 PM', pob: 'Pune, India' },
    } = body;

    const match = calculateAshtakootGunMilan(
      groom.dob,
      groom.tob || '12:00 PM',
      groom.pob || 'India',
      bride.dob,
      bride.tob || '12:00 PM',
      bride.pob || 'India',
      groom.name || 'Groom',
      bride.name || 'Bride'
    );

    return NextResponse.json({
      success: true,
      match,
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Error calculating kundli match in app-dynamic:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to calculate Kundli match',
    }, { status: 500, headers: corsHeaders });
  }
}
`;

// 3. Panchang Route
const PANCHANG_ROUTE = `import { NextRequest, NextResponse } from 'next/server';
import { calculatePanchang } from '@/lib/panchangEngine';
import { fetchVedikaPanchang } from '@/lib/vedikaClient';

${CORS_HEADERS}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
    const location = url.searchParams.get('location') || 'New Delhi, India';

    let panchang = calculatePanchang(date, location);

    // Try enriching with Vedika live ephemeris if available
    try {
      const vRes = await fetchVedikaPanchang({ date, latitude: 28.6139, longitude: 77.209 });
      if (vRes && vRes.success && vRes.data) {
        const v = vRes.data;
        if (v.tithi?.name) panchang.tithi = v.tithi.name;
        if (v.nakshatra?.name) panchang.nakshatra = v.nakshatra.name;
        if (v.yoga?.name) panchang.yoga = v.yoga.name;
        if (v.karana?.name) panchang.karana = v.karana.name;
      }
    } catch (e) {}

    return NextResponse.json({
      success: true,
      panchang,
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Error fetching panchang in app-dynamic:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to calculate Panchang',
    }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const date = body.date || new Date().toISOString().split('T')[0];
    const location = body.location || 'New Delhi, India';

    const panchang = calculatePanchang(date, location);
    return NextResponse.json({
      success: true,
      panchang,
    }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to calculate Panchang',
    }, { status: 500, headers: corsHeaders });
  }
}
`;

// 4. Remedies Route
const REMEDIES_ROUTE = `import { NextRequest, NextResponse } from 'next/server';
import {
  CANONICAL_HOMAMS,
  CANONICAL_MANTRAS,
  CANONICAL_GEMSTONES,
  generate48DayRemedyProtocol,
} from '@/lib/vedicRemediesEngine';

${CORS_HEADERS}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const domain = url.searchParams.get('domain') || 'Career & Financial Growth';

    const protocol = generate48DayRemedyProtocol({ domain, concern: domain });

    // Ashta-Digbandhana (8 Directions)
    const ashtaDirections = [
      { direction: 'East (Indra)', deity: 'Surya & Indra', planet: 'Sun', element: 'Fire', remedy: 'Surya Arghya at dawn & Gayatri Mantra', purpose: 'Leadership, Vitality, Career Glory', icon: 'wb_sunny' },
      { direction: 'South-East (Agni)', deity: 'Agni Bhagavan', planet: 'Venus', element: 'Fire', remedy: 'Lighting ghee lamp & Shukra Mantra', purpose: 'Art, Prosperity, Marital Happiness', icon: 'local_fire_department' },
      { direction: 'South (Yama)', deity: 'Yama & Bhairava', planet: 'Mars', element: 'Earth', remedy: 'Mangal Kavacham & Coral offering', purpose: 'Courage, Debt Removal, Land Prosperity', icon: 'shield' },
      { direction: 'South-West (Nirriti)', deity: 'Nirriti & Ganesha', planet: 'Rahu', element: 'Earth', remedy: 'Rahu Shanti Puja & Durva grass offering', purpose: 'Removing Sudden Obstacles & Illusions', icon: 'all_inclusive' },
      { direction: 'West (Varuna)', deity: 'Varuna Deva', planet: 'Saturn', element: 'Water', remedy: 'Shani Stotra, Mustard oil deepa on Saturday', purpose: 'Discipline, Longevity, Sade Sati Relief', icon: 'water' },
      { direction: 'North-West (Vayu)', deity: 'Vayu & Hanuman', planet: 'Moon', element: 'Air', remedy: 'Hanuman Chalisa & Chandra Japa', purpose: 'Mental Peace, Travel, Mind Stability', icon: 'air' },
      { direction: 'North (Kubera)', deity: 'Kubera & Lakshmi', planet: 'Mercury', element: 'Earth', remedy: 'Sri Suktam recitation & Emerald wearing', purpose: 'Business Growth, Liquid Wealth, Commerce', icon: 'account_balance' },
      { direction: 'North-East (Ishanya)', deity: 'Shiva & Brihaspati', planet: 'Jupiter', element: 'Water/Ether', remedy: 'Maha Mrityunjaya Japa & Yellow sapphire', purpose: 'Divine Grace, Wisdom, Moksha & Children', icon: 'self_improvement' },
    ];

    return NextResponse.json({
      success: true,
      ashtaDirections,
      homams: CANONICAL_HOMAMS,
      mantras: CANONICAL_MANTRAS,
      gemstones: CANONICAL_GEMSTONES,
      protocol,
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Error fetching remedies in app-dynamic:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch remedies',
    }, { status: 500, headers: corsHeaders });
  }
}
`;

// 5. Horoscope Route
const HOROSCOPE_ROUTE = `import { NextRequest, NextResponse } from 'next/server';

${CORS_HEADERS}

const HOROSCOPE_DATABASE: Record<string, any> = {
  Aries: {
    sign: 'Aries',
    symbol: '♈',
    ruler: 'Mars (Mangal)',
    overall: 88,
    lucky_number: '3, 9',
    lucky_color: 'Crimson Red',
    lucky_day: 'Tuesday',
    guidance: "Mars in your quadrant energises bold initiatives today. A pending career milestone or administrative clarity emerges under this transit.",
    love: { score: 84, text: "Venus casts an affectionate trine. Speak openly from the heart; your partner will appreciate your genuine transparency." },
    career: { score: 92, text: "Jupiter in your 10th house supports ambitious strides. Favorable for presenting new proposals and taking leadership." },
    money: { score: 79, text: "Steady inflow expected. Avoid high-risk speculative trading before Thursday." },
    health: { score: 86, text: "High vitality and stamina. Morning physical exercise will balance mental fire." },
    family: { score: 82, text: "Domestic harmony prevails. An elder's blessing brings reassurance." },
  },
  Taurus: {
    sign: 'Taurus',
    symbol: '♉',
    ruler: 'Venus (Shukra)',
    overall: 82,
    lucky_number: '6, 15',
    lucky_color: 'Emerald Green',
    lucky_day: 'Friday',
    guidance: "Venus in the 2nd house enhances wealth accumulation and harmonious relationships. Trust patient consistency.",
    love: { score: 89, text: "Deep, soulful connection. A peaceful evening together brings great contentment." },
    career: { score: 78, text: "Methodical execution wins over speed. Maintain meticulous documentation." },
    money: { score: 87, text: "Favorable planetary alignment for asset protection and sound investments." },
    health: { score: 80, text: "Good stamina. Protect throat and maintain hydration." },
    family: { score: 91, text: "Family sanctuary offers deep solace and comforting warmth." },
  },
  Gemini: {
    sign: 'Gemini',
    symbol: '♊',
    ruler: 'Mercury (Budha)',
    overall: 85,
    lucky_number: '5, 14',
    lucky_color: 'Bright Yellow',
    lucky_day: 'Wednesday',
    guidance: "Mercury sharpens analytical acumen and negotiating power. An important conversation unlocks fresh avenues.",
    love: { score: 81, text: "Witty exchanges and shared intellectual curiosity ignite romance." },
    career: { score: 90, text: "Exceptional day for presentations, agreements, and team coordination." },
    money: { score: 83, text: "Gain through intellectual work or communications. Watch minor expenses." },
    health: { score: 82, text: "Good energy. Balance screen time with outdoor mindfulness." },
    family: { score: 84, text: "Pleasant interactions with siblings and younger family members." },
  },
  Cancer: {
    sign: 'Cancer',
    symbol: '♋',
    ruler: 'Moon (Chandra)',
    overall: 84,
    lucky_number: '2, 7',
    lucky_color: 'Pearl White',
    lucky_day: 'Monday',
    guidance: "Moon in Punarvasu invites renewal and spiritual devotion. Trust your intuitive instincts in financial planning.",
    love: { score: 87, text: "Gentle emotional bonding. Nurturing your relationship brings divine peace." },
    career: { score: 80, text: "Focus on creative and empathetic problem solving. Coworkers seek your counsel." },
    money: { score: 81, text: "Savings grow steadily. Favorable time for long-term domestic planning." },
    health: { score: 85, text: "Emotional calm translates to physical resilience. Drink herbal infusions." },
    family: { score: 92, text: "Strong maternal blessings and serene family atmosphere today." },
  },
  Leo: {
    sign: 'Leo',
    symbol: '♌',
    ruler: 'Sun (Surya)',
    overall: 90,
    lucky_number: '1, 10',
    lucky_color: 'Royal Gold',
    lucky_day: 'Sunday',
    guidance: "Sun illuminates your ascendant with authority and magnetic presence. Take decisive initiative in your key enterprise.",
    love: { score: 85, text: "Generous and affectionate. Your natural warmth charms those around you." },
    career: { score: 94, text: "Peak executive performance. Senior mentors or clients recognize your distinction." },
    money: { score: 88, text: "Prosperous signs for new revenue streams and prestigious contracts." },
    health: { score: 89, text: "Radiant vitality. Surya Namaskar at sunrise amplifies your solar aura." },
    family: { score: 86, text: "You stand as a protective pillar for your household." },
  },
  Virgo: {
    sign: 'Virgo',
    symbol: '♍',
    ruler: 'Mercury (Budha)',
    overall: 83,
    lucky_number: '5, 23',
    lucky_color: 'Olive Green',
    lucky_day: 'Wednesday',
    guidance: "Mercury's analytical grace helps you untangle complex logistics. A methodical checklist brings quick triumph.",
    love: { score: 80, text: "Acts of thoughtful service communicate love more clearly than grand words." },
    career: { score: 89, text: "Flawless attention to detail saves significant resources at work." },
    money: { score: 86, text: "Excellent budgeting and tax or financial reconciliation day." },
    health: { score: 81, text: "Support digestive health with light, sattvic food today." },
    family: { score: 83, text: "Constructive discussions resolve a pending domestic matter." },
  },
  Libra: {
    sign: 'Libra',
    symbol: '♎',
    ruler: 'Venus (Shukra)',
    overall: 86,
    lucky_number: '6, 15',
    lucky_color: 'Pastel Blue',
    lucky_day: 'Friday',
    guidance: "Venus radiates charm and diplomatic grace. Ideal time for contracts, design, partnership agreements, and celebrations.",
    love: { score: 92, text: "Enchanting romantic harmony. Mutual appreciation reaches a delightful high." },
    career: { score: 84, text: "Collaboration is your greatest asset. Mediate disputes with natural tact." },
    money: { score: 85, text: "Favorable for aesthetics, arts, and balanced luxury investments." },
    health: { score: 83, text: "Peaceful balance. Gentle yoga and deep breathing enhance wellbeing." },
    family: { score: 87, text: "Gracious hospitality and joyful family gatherings favored." },
  },
  Scorpio: {
    sign: 'Scorpio',
    symbol: '♏',
    ruler: 'Mars & Ketu',
    overall: 89,
    lucky_number: '9, 18',
    lucky_color: 'Deep Maroon',
    lucky_day: 'Tuesday',
    guidance: "Jupiter transiting your 10th house brings breakthrough karmic growth. Deep research and courage pay rich dividends.",
    love: { score: 85, text: "Intense, loyal emotional bonding. Unspoken understanding deepens trust." },
    career: { score: 93, text: "Strategic insight gives you an insurmountable competitive edge." },
    money: { score: 87, text: "Gains through hidden resources, inheritances, or smart restructuring." },
    health: { score: 88, text: "High recuperative strength. Meditation clears latent stress." },
    family: { score: 82, text: "Stand firm on ethical principles to guide your loved ones." },
  },
  Sagittarius: {
    sign: 'Sagittarius',
    symbol: '♐',
    ruler: 'Jupiter (Brihaspati)',
    overall: 91,
    lucky_number: '3, 12',
    lucky_color: 'Saffron Yellow',
    lucky_day: 'Thursday',
    guidance: "Brihaspati casts a protective trine, blessing higher education, legal triumphs, and philosophical clarity.",
    love: { score: 86, text: "Shared ideals and spiritual travel plans invigorate romantic bonds." },
    career: { score: 92, text: "Mentorship and visionary planning open international horizons." },
    money: { score: 89, text: "Fortunate expansion. Long-range wealth plans receive planetary support." },
    health: { score: 87, text: "Robust vitality. Spend time outdoors under open skies." },
    family: { score: 88, text: "Auspicious celebrations and philosophical joy shared at home." },
  },
  Capricorn: {
    sign: 'Capricorn',
    symbol: '♑',
    ruler: 'Saturn (Shani)',
    overall: 85,
    lucky_number: '8, 17',
    lucky_color: 'Navy Blue',
    lucky_day: 'Saturday',
    guidance: "Saturn rewards unwavering discipline and structured labor. A long-term ambition begins solidifying into reality.",
    love: { score: 80, text: "Steadfast loyalty and enduring commitment outshine fleeting thrills." },
    career: { score: 91, text: "Executive authority and operational excellence draw high praise." },
    money: { score: 88, text: "Disciplined capital accumulation and long-term asset growth." },
    health: { score: 82, text: "Care for bone and joint health; maintain steady posture." },
    family: { score: 84, text: "Reliable stewardship keeps family affairs completely secure." },
  },
  Aquarius: {
    sign: 'Aquarius',
    symbol: '♒',
    ruler: 'Saturn & Rahu',
    overall: 87,
    lucky_number: '4, 13',
    lucky_color: 'Electric Cyan',
    lucky_day: 'Saturday',
    guidance: "Innovative ideas and humanitarian endeavors receive planetary backing. Connect with forward-thinking networks.",
    love: { score: 83, text: "Cherish intellectual freedom and mutual respect within the partnership." },
    career: { score: 89, text: "Breakthrough solutions in technology, teamwork, or community efforts." },
    money: { score: 84, text: "Gains through group ventures or unconventional business models." },
    health: { score: 85, text: "Circulatory health supported by brisk walking and fresh air." },
    family: { score: 85, text: "Progressive, modern harmony within family discussions." },
  },
  Pisces: {
    sign: 'Pisces',
    symbol: '♓',
    ruler: 'Jupiter & Neptune',
    overall: 88,
    lucky_number: '7, 16',
    lucky_color: 'Sea Green',
    lucky_day: 'Thursday',
    guidance: "Jupiter deepens spiritual intuition and creative imagination. Trust dreams and inner promptings today.",
    love: { score: 91, text: "Poetic, empathetic connection. A truly compassionate mutual bond." },
    career: { score: 86, text: "Creative and healing vocations reach a high point of fulfillment." },
    money: { score: 82, text: "Generosity balances steady incoming funds. Practice sacred daana." },
    health: { score: 86, text: "Deep sleep and sound meditation restore cellular vitality." },
    family: { score: 89, text: "Compassion dissolves past misunderstandings in the home." },
  },
};

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const sign = url.searchParams.get('sign');

    if (sign && HOROSCOPE_DATABASE[sign]) {
      return NextResponse.json({
        success: true,
        horoscope: HOROSCOPE_DATABASE[sign],
      }, { headers: corsHeaders });
    }

    return NextResponse.json({
      success: true,
      allSigns: HOROSCOPE_DATABASE,
    }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch horoscope',
    }, { status: 500, headers: corsHeaders });
  }
}
`;

// Write all routes
writeFile('src/app/api/app-dynamic/kundli/calculate/route.ts', KUNDLI_CALCULATE_ROUTE);
writeFile('src/app/api/app-dynamic/kundli/match/route.ts', KUNDLI_MATCH_ROUTE);
writeFile('src/app/api/app-dynamic/panchang/route.ts', PANCHANG_ROUTE);
writeFile('src/app/api/app-dynamic/remedies/route.ts', REMEDIES_ROUTE);
writeFile('src/app/api/app-dynamic/horoscope/route.ts', HOROSCOPE_ROUTE);

console.log('All 5 App-Dynamic API routes generated successfully!');
