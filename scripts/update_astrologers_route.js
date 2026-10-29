const fs = require('fs');
const path = require('path');

const targetPath = 'C:\\Users\\PC\\Desktop\\astroparihar\\src\\app\\api\\app-dynamic\\astrologers\\route.ts';

const code = `import { NextRequest, NextResponse } from 'next/server';
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

function parseFirestoreValue(val: any): any {
  if (!val) return undefined;
  if (val.stringValue !== undefined) return val.stringValue;
  if (val.integerValue !== undefined) return parseInt(val.integerValue, 10);
  if (val.doubleValue !== undefined) return parseFloat(val.doubleValue);
  if (val.booleanValue !== undefined) return val.booleanValue;
  if (val.arrayValue !== undefined) {
    return (val.arrayValue.values || []).map((v: any) => parseFirestoreValue(v));
  }
  if (val.mapValue !== undefined) {
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
      res[k] = parseFirestoreValue(v);
    }
    return res;
  }
  return undefined;
}

function capitalizeWords(str: string): string {
  if (!str) return '';
  return str
    .split(' ')
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ''))
    .join(' ')
    .trim();
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const requestedType = url.searchParams.get('type'); // 'real' | 'ai' | null

    // 1. Fetch Real Human Astrologers from Firestore
    let dbRealAstrologers: any[] = [];
    try {
      if (adminDb && typeof adminDb.collection === 'function') {
        let snap = await adminDb
          .collection('astrologers')
          .where('status', 'in', ['approved', 'active', 'probation', 'verified'])
          .get();

        if (snap.empty) {
          snap = await adminDb.collection('astrologers').get();
        }

        if (!snap.empty) {
          dbRealAstrologers = snap.docs
            .map((doc: any) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .filter((d: any) => ['approved', 'active', 'probation', 'verified'].includes(d.status));
        }
      }
    } catch (adminErr: any) {
      console.warn('adminDb query failed, falling back to Firestore REST:', adminErr?.message);
    }

    // Direct Firestore REST API fallback if adminDb did not return records
    if (dbRealAstrologers.length === 0) {
      try {
        const restRes = await fetch(
          'https://firestore.googleapis.com/v1/projects/astroparihar-85e2d/databases/(default)/documents/astrologers',
          { next: { revalidate: 10 } }
        );
        if (restRes.ok) {
          const restData = await restRes.json();
          if (Array.isArray(restData.documents)) {
            dbRealAstrologers = restData.documents
              .map((doc: any) => {
                const id = doc.name ? doc.name.split('/').pop() : '';
                const fields = doc.fields || {};
                const parsed: Record<string, any> = { id };
                for (const [k, v] of Object.entries(fields)) {
                  parsed[k] = parseFirestoreValue(v);
                }
                return parsed;
              })
              .filter((d: any) => ['approved', 'active', 'probation', 'verified'].includes(d.status));
          }
        }
      } catch (restErr: any) {
        console.warn('Firestore REST fallback error:', restErr?.message);
      }
    }

    // Format real human astrologers strictly matching website schema
    const formattedDbReal = dbRealAstrologers.map((r) => {
      const skillsList = Array.isArray(r.skills)
        ? r.skills
        : typeof r.skills === 'string'
        ? r.skills.split(',').map((s: string) => s.trim())
        : Array.isArray(r.specialisations)
        ? r.specialisations
        : Array.isArray(r.specialties)
        ? r.specialties
        : [r.speciality || r.specialization || 'Vedic Astrology'];

      const langsList = Array.isArray(r.languages)
        ? r.languages
        : typeof r.languages === 'string'
        ? r.languages.split(',').map((l: string) => l.trim())
        : ['English', 'Hindi'];

      const expNum =
        Number(r.experienceYears) ||
        (typeof r.experience === 'string' ? Number(r.experience.replace(/[^0-9]/g, '')) : Number(r.experience)) ||
        12;

      const mainSpecialty = skillsList[0] || 'Vedic Astrology';
      const cleanName = capitalizeWords(r.name || 'Astrologer');

      return {
        id: r.id,
        name: cleanName,
        specialty: mainSpecialty,
        title: r.title || \`\${mainSpecialty} • \${expNum}+ Yrs\`,
        experience: \`\${expNum}+ Yrs\`,
        rating: Number(r.rating) || 4.95,
        reviews: \`\${Math.round((Number(r.totalConsultations || r.reviewsCount || r.reviews) || 980) / 100) / 10}k\`,
        consultations: \`\${Number(r.totalConsultations || r.reviewsCount || r.reviews) || 980}+\`,
        price: Math.max(10, Number(r.pricePerMinute || r.amount || r.price) || 25),
        isOnline: r.isOnline !== undefined ? Boolean(r.isOnline) : true,
        isAi: false,
        imageUrl:
          r.photoURL ||
          r.avatar ||
          r.imageUrl ||
          r.profilePic ||
          r.profileImageUrl ||
          \`https://ui-avatars.com/api/?name=\${encodeURIComponent(cleanName)}&background=f59e0b&color=fff&size=400\`,
        languages: langsList.map((l: string) => capitalizeWords(l)).join(', '),
        category: r.category || 'Vedic',
        bio: r.bio || r.about || \`\${cleanName} is a verified Vedic Astrologer providing personalized astrological guidance.\`,
      };
    });

    // Pure Real Astrologers list: 100% dynamic from Firestore. ZERO hardcoded mock data!
    const realAstrologers = formattedDbReal;

    // 2. Fetch AI Astrologers (Strictly separated)
    const aiAstrologersData = await getAIAstrologers();
    const formattedAi = (aiAstrologersData || DEFAULT_AI_ASTROLOGERS).map((a) => ({
      id: a.id,
      name: a.name,
      specialty: a.primaryDiscipline || a.tagline || 'Vedic AI Astrology',
      title: a.tagline || 'Autonomous Vedic Ephemeris Guide',
      experience: \`\${a.experienceYears || 15}+ Yrs equivalent\`,
      rating: a.rating || 4.98,
      reviews: \`\${Math.round((a.totalConsultations || 1200) / 100) / 10}k\`,
      consultations: \`\${a.totalConsultations || 1200}+\`,
      price: a.pricePerMin || 10,
      isOnline: a.availability === 'online' || a.isActive !== false,
      isAi: true,
      imageUrl: a.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      languages: (a.languages || ['Hindi', 'English']).join(', '),
      category: (a as any).category || 'AI',
      bio: a.bio || a.tagline || '',
    }));

    // Depending on requested type, serve STRICTLY real or strictly AI
    let selectedList = realAstrologers;
    if (requestedType === 'ai') {
      selectedList = formattedAi;
    } else if (requestedType === 'real') {
      selectedList = realAstrologers;
    }

    return NextResponse.json(
      {
        success: true,
        realAstrologers,
        aiAstrologers: formattedAi,
        astrologers: selectedList,
        realCount: realAstrologers.length,
        aiCount: formattedAi.length,
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('Error fetching astrologers:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
`;

fs.writeFileSync(targetPath, code, 'utf8');
console.log('Successfully updated:', targetPath);
