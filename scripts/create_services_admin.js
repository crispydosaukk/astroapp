const fs = require('fs');
const path = require('path');

const webRoot = 'c:/Users/PC/Desktop/astroparihar';

// ----------------------------------------------------------------------------
// 1. Update appDynamicContent.ts with AppServiceCategory & AppServiceItem
// ----------------------------------------------------------------------------
const appDynamicContentFile = path.join(webRoot, 'src/lib/appDynamicContent.ts');
if (fs.existsSync(appDynamicContentFile)) {
  let content = fs.readFileSync(appDynamicContentFile, 'utf8');

  // Replace or append the services section
  const servicesMarker = '/* ------------------------------------------------ App Services & Remedies */';
  let prefix = content;
  if (content.includes(servicesMarker)) {
    prefix = content.split(servicesMarker)[0];
  }

  const enhancedServicesContent = `${servicesMarker}
const SERVICES_DOC_ID = 'app_services';
const SERVICE_CATEGORIES_DOC_ID = 'app_service_categories';

export interface AppServiceItem {
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
  updatedAt?: string;
}

export interface AppServiceCategory {
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
  items: AppServiceItem[];
  updatedAt?: string;
}

export const DEFAULT_SERVICE_CATEGORIES: AppServiceCategory[] = [
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
        route: '/remedy-detail-screen',
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
        route: '/remedy-detail-screen',
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
        route: '/remedy-detail-screen',
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
        route: '/remedy-detail-screen',
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
        route: '/remedy-detail-screen',
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
        route: '/remedy-detail-screen',
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
        route: '/remedy-detail-screen',
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
        route: '/remedy-detail-screen',
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
        route: '/panchang-screen',
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
        route: '/panchang-screen',
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
        route: '/muhurat-screen',
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
        route: '/muhurat-screen',
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
        route: '/panchang-screen',
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
        route: '/panchang-screen',
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
        route: '/my-kundli-screen',
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
        route: '/match-kundli-screen',
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
        route: '/horoscope-screen',
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
        route: '/astrology-reports-screen',
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
        route: '/live-astrologers-screen',
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
        route: '/ai-chat-screen',
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
        route: '/career-astrology-screen',
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
        route: '/marriage-astrology-screen',
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
        route: '/business-astrology-screen',
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
        route: '/finance-astrology-screen',
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
        route: '/tarot-screen',
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
        route: '/numerology-screen',
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
        route: '/spiritual-guidance-screen',
        color: '#9370DB',
        active: true,
      },
    ],
  },
];

export const DEFAULT_APP_SERVICES: AppServiceItem[] = DEFAULT_SERVICE_CATEGORIES.flatMap(
  (c) => c.items
);

export async function getAppServiceCategories(): Promise<AppServiceCategory[]> {
  try {
    if (!db) return DEFAULT_SERVICE_CATEGORIES;

    const docRef = doc(db, COLLECTION_NAME, SERVICE_CATEGORIES_DOC_ID);
    const snap = await getDoc(docRef);

    if (snap.exists() && snap.data()?.categories && Array.isArray(snap.data()?.categories)) {
      const categories = snap.data().categories as AppServiceCategory[];
      return categories.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
  } catch (err) {
    console.warn('Could not fetch app service categories from Firestore, using defaults:', err);
  }
  return DEFAULT_SERVICE_CATEGORIES;
}

export async function saveAppServiceCategories(categories: AppServiceCategory[]): Promise<boolean> {
  try {
    if (!db) return false;

    const docRef = doc(db, COLLECTION_NAME, SERVICE_CATEGORIES_DOC_ID);
    await setDoc(
      docRef,
      {
        categories,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.error('Error saving app service categories to Firestore:', err);
    throw err;
  }
}

export async function getAppServices(): Promise<AppServiceItem[]> {
  try {
    const categories = await getAppServiceCategories();
    return categories.flatMap((c) => c.items).sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (err) {
    console.warn('Could not fetch app services from categories, using defaults:', err);
  }
  return DEFAULT_APP_SERVICES;
}

export async function saveAppServices(services: AppServiceItem[]): Promise<boolean> {
  try {
    if (!db) return false;

    const docRef = doc(db, COLLECTION_NAME, SERVICES_DOC_ID);
    await setDoc(
      docRef,
      {
        services,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.error('Error saving app services to Firestore:', err);
    throw err;
  }
}
`;

  fs.writeFileSync(appDynamicContentFile, prefix + enhancedServicesContent, 'utf8');
  console.log('Updated appDynamicContent.ts with enhanced categories & services!');
}

// ----------------------------------------------------------------------------
// 2. Update route.ts to return categories & services
// ----------------------------------------------------------------------------
const routeFile = path.join(webRoot, 'src/app/api/app-dynamic/services/route.ts');
const routeCode = `import { NextRequest, NextResponse } from 'next/server';
import {
  getAppServiceCategories,
  saveAppServiceCategories,
  getAppServices,
  saveAppServices,
  DEFAULT_SERVICE_CATEGORIES,
  DEFAULT_APP_SERVICES,
} from '@/lib/appDynamicContent';

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
    const categories = await getAppServiceCategories();
    const services = categories.flatMap((c) => c.items);
    return NextResponse.json(
      { success: true, categories, services },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Error fetching app service categories:', error);
    return NextResponse.json(
      { success: true, categories: DEFAULT_SERVICE_CATEGORIES, services: DEFAULT_APP_SERVICES, fallback: true },
      { headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categories, services } = body;

    if (Array.isArray(categories)) {
      await saveAppServiceCategories(categories);
    }
    if (Array.isArray(services)) {
      await saveAppServices(services);
    }

    const updatedCategories = await getAppServiceCategories();
    return NextResponse.json(
      {
        success: true,
        message: 'App services and categories updated successfully',
        categories: updatedCategories,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Error saving app services/categories:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save app services' },
      { status: 500, headers: corsHeaders }
    );
  }
}
`;
fs.writeFileSync(routeFile, routeCode, 'utf8');
console.log('Updated services API route.ts!');

// ----------------------------------------------------------------------------
// 3. Update AdminAppServicesEditor.tsx with Category & Item position swapping
// ----------------------------------------------------------------------------
const editorFile = path.join(webRoot, 'src/app/admin-panel/components/AdminAppServicesEditor.tsx');
const editorCode = `'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AppServiceCategory,
  AppServiceItem,
  DEFAULT_SERVICE_CATEGORIES,
} from '@/lib/appDynamicContent';
import {
  Grid,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Edit2,
  RefreshCw,
  X,
  Check,
  Smartphone,
  ChevronDown,
  ChevronUp,
  FolderPlus,
  Compass,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminAppServicesEditor() {
  const [categories, setCategories] = useState<AppServiceCategory[]>(DEFAULT_SERVICE_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>('cat-remedies');
  const [editingItem, setEditingItem] = useState<{ catIndex: number; itemIndex: number } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/app-dynamic/services');
      const data = await res.json();
      if (data.success && Array.isArray(data.categories) && data.categories.length > 0) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.warn('Failed to fetch service categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/app-dynamic/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('App Services, Remedies & Panchang order published live to mobile app!');
      } else {
        toast.error(data.error || 'Failed to save configuration');
      }
    } catch {
      toast.error('Network error saving services configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Reset services and categories back to Vedic defaults?')) {
      setCategories(DEFAULT_SERVICE_CATEGORIES);
      setEditingItem(null);
      toast.info('Reset to default Vedic layout. Click "Publish Live to App" to save.');
    }
  };

  // Swapping Category order (Move Up/Down)
  const handleMoveCategory = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= categories.length) return;
    const copy = [...categories];
    const [moved] = copy.splice(idx, 1);
    copy.splice(target, 0, moved);
    const reordered = copy.map((c, i) => ({ ...c, order: i + 1 }));
    setCategories(reordered);
    toast.success(\`Moved category "\${moved.title}" \${dir === -1 ? 'Up' : 'Down'} (Position #\${target + 1})\`);
  };

  // Swapping Item order within Category (Move Up/Down)
  const handleMoveItem = (catIdx: number, itemIdx: number, dir: -1 | 1) => {
    const cat = categories[catIdx];
    const target = itemIdx + dir;
    if (target < 0 || target >= cat.items.length) return;
    const copyCats = [...categories];
    const copyItems = [...cat.items];
    const [moved] = copyItems.splice(itemIdx, 1);
    copyItems.splice(target, 0, moved);
    copyCats[catIdx] = {
      ...cat,
      items: copyItems.map((it, i) => ({ ...it, order: i + 1 })),
    };
    setCategories(copyCats);
    toast.success(\`Moved item "\${moved.name}" \${dir === -1 ? 'Up' : 'Down'} in \${cat.title}\`);
  };

  const handleToggleCategoryActive = (catIdx: number) => {
    const copy = [...categories];
    copy[catIdx] = { ...copy[catIdx], active: !copy[catIdx].active };
    setCategories(copy);
  };

  const handleToggleItemActive = (catIdx: number, itemIdx: number) => {
    const copy = [...categories];
    const cat = copy[catIdx];
    const copyItems = [...cat.items];
    copyItems[itemIdx] = { ...copyItems[itemIdx], active: !copyItems[itemIdx].active };
    copy[catIdx] = { ...cat, items: copyItems };
    setCategories(copy);
  };

  const updateItemField = (catIdx: number, itemIdx: number, field: keyof AppServiceItem, val: any) => {
    const copy = [...categories];
    const cat = copy[catIdx];
    const copyItems = [...cat.items];
    copyItems[itemIdx] = { ...copyItems[itemIdx], [field]: val };
    copy[catIdx] = { ...cat, items: copyItems };
    setCategories(copy);
  };

  const handleAddItem = (catIdx: number) => {
    const cat = categories[catIdx];
    const newItem: AppServiceItem = {
      id: \`item-\${Date.now()}\`,
      order: cat.items.length + 1,
      category: cat.category,
      name: 'New Service Item',
      desc: 'Expert personalized guidance',
      icon: 'auto_awesome',
      route: '/ai-chat-screen',
      color: cat.color || '#713B32',
      badge: 'New',
      active: true,
    };
    const copy = [...categories];
    copy[catIdx] = { ...cat, items: [...cat.items, newItem] };
    setCategories(copy);
    setEditingItem({ catIndex: catIdx, itemIndex: cat.items.length });
  };

  const handleDeleteItem = (catIdx: number, itemIdx: number) => {
    const cat = categories[catIdx];
    if (confirm(\`Delete "\${cat.items[itemIdx].name}" from \${cat.title}?\`)) {
      const copy = [...categories];
      const filtered = cat.items.filter((_, i) => i !== itemIdx).map((it, i) => ({ ...it, order: i + 1 }));
      copy[catIdx] = { ...cat, items: filtered };
      setCategories(copy);
      if (editingItem?.catIndex === catIdx && editingItem?.itemIndex === itemIdx) {
        setEditingItem(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#713B32]/15 via-amber-500/10 to-transparent border border-[#713B32]/25 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#713B32]/20 text-[#713B32] dark:text-[#C9A84C]">
              <Grid size={22} />
            </span>
            <h2 className="text-xl font-bold text-foreground">
              Dynamic Services & Remedies Management
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Manage all 5 category card models: Sacred Remedies (Ashta Parihar), Panchang & Timings, Kundli & Vedic Tools, Consultations, and Life Guidance.
            Swap category positions and item positions in real time!
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition"
            title="Reset to default arrangement"
          >
            <RotateCcw size={14} /> Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#713B32] text-white font-bold text-sm hover:bg-[#552B24] shadow-md transition disabled:opacity-50"
          >
            <Save size={16} /> {saving ? 'Publishing...' : 'Publish Live to App'}
          </button>
        </div>
      </div>

      {/* Main Grid: Categories Management (7 cols) + Mobile Preview (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Categories & Items Reordering */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Categories ({categories.length} Total · {categories.filter((c) => c.active).length} Active)
            </h3>
            <span className="text-xs text-muted-foreground">Use arrows to swap category order</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-muted-foreground">
              <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-[#713B32]" />
              <p className="text-sm font-semibold">Loading services configuration...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((cat, catIdx) => {
                const isExpanded = expandedCat === cat.id;
                const isFirst = catIdx === 0;
                const isLast = catIdx === categories.length - 1;

                return (
                  <div
                    key={cat.id}
                    className={\`rounded-2xl border transition-all \${
                      cat.category === 'remedies'
                        ? 'border-[#713B32]/40 bg-[#713B32]/5'
                        : 'border-border bg-card'
                    } \${!cat.active ? 'opacity-50' : ''}\`}
                  >
                    {/* Category Header */}
                    <div className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-muted-foreground w-6 text-center">
                          #{catIdx + 1}
                        </span>

                        {/* Category Position Swapping (Up / Down) */}
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => handleMoveCategory(catIdx, -1)}
                            disabled={isFirst}
                            title="Move Category UP (Swap position)"
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-20 transition"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            onClick={() => handleMoveCategory(catIdx, 1)}
                            disabled={isLast}
                            title="Move Category DOWN (Swap position)"
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-20 transition"
                          >
                            <ArrowDown size={14} />
                          </button>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">{cat.title}</span>
                            <span className="text-xs text-amber-500 font-semibold">{cat.sanskrit}</span>
                            {cat.badge && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#713B32]/10 text-[#713B32] dark:text-[#C9A84C] border border-[#713B32]/20">
                                {cat.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {cat.items.length} items inside ({cat.items.filter((i) => i.active).length} active)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleCategoryActive(catIdx)}
                          className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
                          title={cat.active ? 'Visible in app' : 'Hidden from app'}
                        >
                          {cat.active ? <Eye size={16} className="text-emerald-500" /> : <EyeOff size={16} />}
                        </button>
                        <button
                          onClick={() => setExpandedCat(isExpanded ? null : cat.id)}
                          className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
                          title="Expand/Collapse items"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Category Items List (Expanded) */}
                    {isExpanded && (
                      <div className="border-t border-border/70 p-4 space-y-3 bg-muted/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-muted-foreground">
                            Items inside {cat.title}:
                          </span>
                          <button
                            onClick={() => handleAddItem(catIdx)}
                            className="flex items-center gap-1 text-xs font-bold text-[#713B32] dark:text-[#C9A84C] hover:underline"
                          >
                            <Plus size={14} /> Add Item
                          </button>
                        </div>

                        {cat.items.map((item, itemIdx) => {
                          const isItemEditing =
                            editingItem?.catIndex === catIdx && editingItem?.itemIndex === itemIdx;
                          const isItemFirst = itemIdx === 0;
                          const isItemLast = itemIdx === cat.items.length - 1;

                          return (
                            <div
                              key={item.id || itemIdx}
                              className={\`rounded-xl border p-3 bg-card transition-all \${
                                isItemEditing ? 'border-amber-500 shadow-sm' : 'border-border'
                              } \${!item.active ? 'opacity-40' : ''}\`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {/* Item Position Swapping (Up / Down) */}
                                  <div className="flex flex-col gap-0.5">
                                    <button
                                      onClick={() => handleMoveItem(catIdx, itemIdx, -1)}
                                      disabled={isItemFirst}
                                      title="Move Item UP"
                                      className="p-0.5 rounded hover:bg-muted text-muted-foreground disabled:opacity-20"
                                    >
                                      <ArrowUp size={12} />
                                    </button>
                                    <button
                                      onClick={() => handleMoveItem(catIdx, itemIdx, 1)}
                                      disabled={isItemLast}
                                      title="Move Item DOWN"
                                      className="p-0.5 rounded hover:bg-muted text-muted-foreground disabled:opacity-20"
                                    >
                                      <ArrowDown size={12} />
                                    </button>
                                  </div>

                                  <div
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 text-white"
                                    style={{ backgroundColor: item.color || '#713B32' }}
                                  >
                                    {item.direction ? item.direction[0] : '✦'}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-xs font-bold text-foreground truncate">
                                        {item.name}
                                      </span>
                                      {item.sanskrit && (
                                        <span className="text-[10px] text-amber-500 font-semibold">
                                          ({item.sanskrit})
                                        </span>
                                      )}
                                      {item.badge && (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 font-bold">
                                          {item.badge}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground truncate">{item.desc}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() =>
                                      setEditingItem(isItemEditing ? null : { catIndex: catIdx, itemIndex: itemIdx })
                                    }
                                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                                    title="Edit item details"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button
                                    onClick={() => handleToggleItemActive(catIdx, itemIdx)}
                                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                                  >
                                    {item.active ? <Eye size={13} className="text-emerald-500" /> : <EyeOff size={13} />}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteItem(catIdx, itemIdx)}
                                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>

                              {/* Inline Item Editor Drawer */}
                              {isItemEditing && (
                                <div className="mt-3 pt-3 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                  <div>
                                    <label className="text-[11px] font-semibold text-muted-foreground">Title Name</label>
                                    <input
                                      type="text"
                                      value={item.name}
                                      onChange={(e) => updateItemField(catIdx, itemIdx, 'name', e.target.value)}
                                      className="w-full mt-1 p-2 rounded-lg bg-muted border border-border text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[11px] font-semibold text-muted-foreground">Sanskrit / Subhead</label>
                                    <input
                                      type="text"
                                      value={item.sanskrit || ''}
                                      onChange={(e) => updateItemField(catIdx, itemIdx, 'sanskrit', e.target.value)}
                                      className="w-full mt-1 p-2 rounded-lg bg-muted border border-border text-xs"
                                    />
                                  </div>
                                  <div className="sm:col-span-2">
                                    <label className="text-[11px] font-semibold text-muted-foreground">Description</label>
                                    <input
                                      type="text"
                                      value={item.desc}
                                      onChange={(e) => updateItemField(catIdx, itemIdx, 'desc', e.target.value)}
                                      className="w-full mt-1 p-2 rounded-lg bg-muted border border-border text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[11px] font-semibold text-muted-foreground">Badge (optional)</label>
                                    <input
                                      type="text"
                                      value={item.badge || ''}
                                      onChange={(e) => updateItemField(catIdx, itemIdx, 'badge', e.target.value)}
                                      className="w-full mt-1 p-2 rounded-lg bg-muted border border-border text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[11px] font-semibold text-muted-foreground">Color Hex</label>
                                    <input
                                      type="text"
                                      value={item.color}
                                      onChange={(e) => updateItemField(catIdx, itemIdx, 'color', e.target.value)}
                                      className="w-full mt-1 p-2 rounded-lg bg-muted border border-border text-xs"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Live Mobile App Simulator */}
        <div className="lg:col-span-5">
          <div className="sticky top-6 rounded-3xl border border-border/80 bg-neutral-900 text-white p-4 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Smartphone size={16} className="text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Mobile App Simulator (Services Screen)
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                Live Preview
              </span>
            </div>

            {/* Mobile Viewport Screen */}
            <div className="mt-3 rounded-2xl bg-[#0F0B15] border border-white/10 p-3 h-[620px] overflow-y-auto space-y-3 font-sans text-xs">
              {/* Header inside phone */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-[#713B32]/30 via-amber-500/10 to-transparent border border-white/10">
                <h4 className="font-extrabold text-sm text-white">AstroParihar Services</h4>
                <p className="text-[10px] text-neutral-400 mt-0.5">
                  Categorized card models reflecting website remedies & panchang.
                </p>
                <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
                  {['All', 'Remedies', 'Panchang', 'Kundli', 'Consultations', 'Guidance'].map((tab, i) => (
                    <span
                      key={tab}
                      className={\`px-2 py-0.5 rounded-full text-[9px] font-bold \${
                        i === 0 ? 'bg-[#713B32] text-white' : 'bg-white/5 text-neutral-400'
                      }\`}
                    >
                      {tab}
                    </span>
                  ))}
                </div>
              </div>

              {/* Render each Category Card Model */}
              {categories
                .filter((c) => c.active)
                .map((cat) => (
                  <div
                    key={cat.id}
                    className="p-3 rounded-xl border border-white/10 bg-white/5 space-y-2 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs text-white">{cat.title}</span>
                          <span className="text-[10px] text-amber-400 font-semibold">{cat.sanskrit}</span>
                        </div>
                        <p className="text-[9px] text-neutral-400">{cat.desc}</p>
                      </div>
                      {cat.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#713B32]/30 text-amber-300 border border-amber-400/20">
                          {cat.badge}
                        </span>
                      )}
                    </div>

                    {/* Items inside this Category Card Model */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      {cat.items
                        .filter((i) => i.active)
                        .map((it) => (
                          <div
                            key={it.id}
                            className="p-2 rounded-lg bg-white/5 border border-white/5 hover:border-amber-400/30 flex items-center gap-2"
                          >
                            <div
                              className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                              style={{ backgroundColor: it.color || '#713B32' }}
                            >
                              {it.direction ? it.direction[0] : '✦'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-[10px] text-neutral-200 truncate">{it.name}</p>
                              <p className="text-[8px] text-neutral-400 truncate">{it.sanskrit || it.desc}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
`;
fs.writeFileSync(editorFile, editorCode, 'utf8');
console.log('Updated AdminAppServicesEditor.tsx with full Category and Item reordering!');
