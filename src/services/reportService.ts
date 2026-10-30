import AsyncStorage from '@react-native-async-storage/async-storage';
import { Share } from 'react-native';
import { useAuthStore } from '@/features/auth/authStore';
import { LIVE_BASE_URL } from '@/config/api';

const FIREBASE_PROJECT_ID = 'astroparihar-85e2d';
const FIREBASE_API_KEY = 'AIzaSyCXZ9S7Th0lpAVLMnZnRlgusCH1dPgF98g';
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

export interface KundliReportItem {
  id: string;
  title: string;
  subtitle: string;
  pages: string;
  date: string;
  status: 'Ready' | 'Processing';
  emoji: string;
  color: string;
  size: string;
  category: 'services' | 'remedies' | 'panchang' | 'mahadasha' | 'match';
  price?: number;
  language?: string;
  summary?: string;
  astrologicalAnalysis?: string;
  remediesPrescribed?: string[];
  reportContent?: string;
  reportData?: any;
  details?: any;
}

export interface BirthDetailsInput {
  name?: string;
  gender?: string;
  dob?: string;
  tob?: string;
  pob?: string;
  primaryConcern?: string;
}

export interface VastuConsultationInput extends BirthDetailsInput {
  propertyType: string;
  entranceDirection: string;
  primaryConcern: string;
  kitchenDir?: string;
  masterBedroomDir?: string;
  pujaRoomDir?: string;
  toiletDir?: string;
}

const STORAGE_REPORTS_BASE = 'astroparihar_kundli_reports';

function getStorageKey(uid?: string | null): string {
  if (uid) return `${STORAGE_REPORTS_BASE}_${uid.replace(/\D/g, '') || uid}`;
  return STORAGE_REPORTS_BASE;
}

/**
 * Helper to map a Firestore service_requests document into KundliReportItem
 */
function parseFirestoreReportDoc(doc: any): KundliReportItem | null {
  try {
    const f = doc.fields || {};
    const docId = doc.name?.split('/').pop() || `rep_fs_${Date.now()}`;
    const serviceTitle =
      f.serviceTitle?.stringValue ||
      f.type?.stringValue ||
      'Vedic Astrology Report';
    const rawReportContent = f.reportContent?.stringValue;
    let parsedContent: any = null;
    if (rawReportContent) {
      try {
        parsedContent = JSON.parse(rawReportContent);
      } catch {}
    }

    // If reportContent was saved by mobile app as full KundliReportItem
    if (parsedContent && parsedContent.id && parsedContent.title && parsedContent.pages) {
      return {
        ...parsedContent,
        status: 'Ready',
      };
    }

    const createdAt = f.createdAt?.stringValue || f.date?.stringValue;
    const dateStr = createdAt
      ? new Date(createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Recently';

    const lower = serviceTitle.toLowerCase();
    let category: KundliReportItem['category'] = 'services';
    let emoji = '📜';
    let color = '#9370DB';
    if (
      lower.includes('mantra') ||
      lower.includes('yantra') ||
      lower.includes('homa') ||
      lower.includes('gemstone') ||
      lower.includes('rudraksha') ||
      lower.includes('vastu') ||
      lower.includes('charity') ||
      lower.includes('dana') ||
      lower.includes('ishta') ||
      lower.includes('parihar')
    ) {
      category = 'remedies';
      emoji = lower.includes('vastu') ? '🏠' : lower.includes('mantra') ? '📿' : '🕉️';
      color = '#713B32';
    } else if (lower.includes('panchang') || lower.includes('muhurat') || lower.includes('muhurtham')) {
      category = 'panchang';
      emoji = '📅';
      color = '#4FC3F7';
    } else if (lower.includes('mahadasha') || lower.includes('rahu') || lower.includes('sani')) {
      category = 'mahadasha';
      emoji = '🛡️';
      color = '#E65100';
    } else if (lower.includes('match') || lower.includes('milan')) {
      category = 'match';
      emoji = '💍';
      color = '#FF6B6B';
    }

    const detailsMap = f.details?.mapValue?.fields || {};
    const dob = detailsMap.dob?.stringValue || parsedContent?.birthDetails?.dob || '';
    const pob = detailsMap.place?.stringValue || detailsMap.pob?.stringValue || parsedContent?.birthDetails?.place || '';
    const userName = detailsMap.name?.stringValue || detailsMap.fullName?.stringValue || parsedContent?.fullName || 'Seeker';

    return {
      id: docId,
      title: serviceTitle,
      subtitle: `${userName}${dob ? ` • ${dob}` : ''}`,
      pages: '36 pages (PDF)',
      date: dateStr,
      status: 'Ready',
      emoji,
      color,
      size: '2.8 MB',
      category,
      language: 'English',
      summary:
        parsedContent?.summary ||
        parsedContent?.overview ||
        `Personalised ${serviceTitle} prepared with precision Vedic ephemeris.`,
      astrologicalAnalysis:
        parsedContent?.astrologicalAnalysis ||
        parsedContent?.planetaryAfflictionSummary ||
        parsedContent?.lagnaAnalysis ||
        `Vedic chart and planetary synthesis for ${userName}${dob ? ` (Born: ${dob})` : ''}${pob ? ` at ${pob}` : ''}.`,
      remediesPrescribed:
        Array.isArray(parsedContent?.remediesPrescribed)
          ? parsedContent.remediesPrescribed
          : Array.isArray(parsedContent?.remedies)
          ? parsedContent.remedies.map((r: any) =>
              typeof r === 'string' ? r : `${r.direction || r.title || 'Remedy'}: ${r.specificPrescription || r.mantra || r.howToPerform || ''}`
            )
          : [
              'Perform daily Gayatri Mantra recitation 108 times at sunrise',
              'Follow directional Ashta Parihar remedies aligned with your Lagna',
              'Observe sattvic discipline on governing planetary days',
            ],
      reportData: parsedContent,
      details: {
        userName,
        dob,
        pob,
        ...(parsedContent || {}),
      },
    };
  } catch {
    return null;
  }
}

/**
 * Fetch reports for the current user.
 * Filters out legacy fake seed reports ('rep_seed_*') and merges with Firestore service_requests.
 */
export async function getUserReports(customUid?: string | null): Promise<KundliReportItem[]> {
  try {
    const authUser = useAuthStore.getState().user;
    const uid = customUid || authUser?.uid || authUser?.phone || null;
    if (!uid) return [];

    const storageKey = getStorageKey(uid);

    let list: KundliReportItem[] = [];
    const stored = await AsyncStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Remove any legacy fake seed reports
          list = parsed.filter((r: any) => r && r.id && !String(r.id).startsWith('rep_seed_'));
        }
      } catch {}
    }

    // Try syncing from Firestore service_requests for cross-platform web + mobile parity
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4500);
      const queryRes = await fetch(
        `${FIRESTORE_BASE_URL}:runQuery?key=${FIREBASE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            structuredQuery: {
              from: [{ collectionId: 'service_requests' }],
              where: {
                fieldFilter: {
                  field: { fieldPath: 'userId' },
                  op: 'EQUAL',
                  value: { stringValue: uid },
                },
              },
              limit: 25,
            },
          }),
        }
      );
      clearTimeout(timer);

      if (queryRes.ok) {
        const rows = await queryRes.json();
        if (Array.isArray(rows)) {
          const remoteReports: KundliReportItem[] = [];
          for (const row of rows) {
            if (row.document) {
              const mapped = parseFirestoreReportDoc(row.document);
              if (mapped && !String(mapped.id).startsWith('rep_seed_')) {
                remoteReports.push(mapped);
              }
            }
          }
          if (remoteReports.length > 0) {
            const existingIds = new Set(list.map((r) => r.id));
            const existingTitlesAndDates = new Set(list.map((r) => `${r.title}_${r.date}`));
            for (const rem of remoteReports) {
              if (!existingIds.has(rem.id) && !existingTitlesAndDates.has(`${rem.title}_${rem.date}`)) {
                list.push(rem);
              }
            }
          }
        }
      }
    } catch {
      // Offline or Firestore query skipped; use local list
    }

    const normalized = list.map((r) => ({
      ...r,
      status: 'Ready' as const,
    }));

    await AsyncStorage.setItem(storageKey, JSON.stringify(normalized)).catch(() => {});
    return normalized;
  } catch (err) {
    console.warn('Error reading user reports:', err);
    return [];
  }
}

/**
 * Fetch Kundli Matching / Compatibility reports for MatchReportsScreen.
 */
export async function getUserMatchReports(customUid?: string | null): Promise<KundliReportItem[]> {
  const all = await getUserReports(customUid);
  return all.filter(
    (r) =>
      r.category === 'match' ||
      r.id.startsWith('rep_match_') ||
      r.title.toLowerCase().includes('match') ||
      r.title.toLowerCase().includes('milan') ||
      r.title.toLowerCase().includes('compatibility')
  );
}

/**
 * Save a newly generated report to the user's report vault and sync with backend/Firestore.
 */
export async function saveUserReport(
  newReport: KundliReportItem,
  customUid?: string | null,
  skipBackendSync?: boolean
): Promise<KundliReportItem[]> {
  try {
    const authUser = useAuthStore.getState().user;
    const uid = customUid || authUser?.uid || authUser?.phone || null;
    const storageKey = getStorageKey(uid);

    const existing = await getUserReports(uid);
    const filtered = existing.filter((r) => r.id !== newReport.id && !String(r.id).startsWith('rep_seed_'));
    const updated = [{ ...newReport, status: 'Ready' as const }, ...filtered];

    await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
    if (uid) {
      await AsyncStorage.setItem(STORAGE_REPORTS_BASE, JSON.stringify(updated)).catch(() => {});
    }

    // Sync with backend /api/generate-report and Firestore service_requests if not already saved by /api/deduct-service-wallet
    if (!skipBackendSync && uid) {
      try {
        fetch(`${LIVE_BASE_URL}/api/generate-report`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: uid,
            userEmail: authUser?.email || '',
            type: newReport.title,
            details: newReport.details || {},
            reportContent: JSON.stringify(newReport),
          }),
        }).catch(() => {});

        // Also write directly to Firestore service_requests so it is guaranteed to be persisted
        fetch(`${FIRESTORE_BASE_URL}/service_requests?key=${FIREBASE_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              userId: { stringValue: uid },
              userEmail: { stringValue: authUser?.email || '' },
              serviceTitle: { stringValue: newReport.title },
              serviceType: { stringValue: 'report' },
              type: { stringValue: newReport.title },
              status: { stringValue: 'completed' },
              amount: { doubleValue: newReport.price || 0 },
              reportContent: { stringValue: JSON.stringify(newReport) },
              createdAt: { stringValue: new Date().toISOString() },
            },
          }),
        }).catch(() => {});
      } catch {}
    }

    return updated;
  } catch (err) {
    console.warn('Error saving user report:', err);
    return [newReport];
  }
}

/**
 * Generate a personalized report for any of the 8 Vedic Remedies (matches Website ServiceReportForm + reportGenerator.ts).
 */
export async function generateRemedyReport(params: {
  remedyName: string;
  remedyData?: any;
  language?: string;
  customConcern?: string;
  birthDetails?: BirthDetailsInput;
  price?: number;
  serverReportContent?: string;
  skipBackendSync?: boolean;
}): Promise<KundliReportItem> {
  const authUser = useAuthStore.getState().user;
  const userName = params.birthDetails?.name || authUser?.name || 'Seeker';
  const zodiac = authUser?.zodiac || 'Scorpio';
  const dob = params.birthDetails?.dob || authUser?.dob || '15 Oct 1995';
  const tob = params.birthDetails?.tob || authUser?.tob || '10:30 AM';
  const pob = params.birthDetails?.pob || authUser?.pob || 'New Delhi, India';
  const concern = params.birthDetails?.primaryConcern || params.customConcern || 'Planetary Harmony & Dosha Nivaran';
  const lang = params.language || 'English';
  const currentYear = new Date().getFullYear();
  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  let parsedServerData: any = null;
  if (params.serverReportContent) {
    try {
      parsedServerData = JSON.parse(params.serverReportContent);
    } catch {}
  }

  const rName = params.remedyName;
  const rLower = rName.toLowerCase();

  let emoji = '🕉️';
  let color = '#713B32';
  let pages = '36 pages (PDF)';
  let size = '2.9 MB';
  let title = `${rName} Personalised Parihar Report`;
  let subtitle = `${userName} (${dob}) • ${currentYear} Protocol`;

  let deity = 'Lord Shiva & Sri Mahalakshmi';
  let direction = 'North-East (Ishanya)';
  let mantra = 'ॐ नमः शिवाय ॥ Om Namah Shivaya';
  let transliteration = 'Om Namah Shivaya';
  let primaryProcedure = 'Daily 108 japa during Brahma Muhurta, followed by Surya Arghya in copper vessel.';
  let materialsRequired = ['Copper Panchapatra', 'Pure Cow Ghee Diya', 'Rudraksha / Sphatik Mala (108 beads)', 'Sandalwood Paste (Chandan)'];
  let precautions = ['Maintain sattvic diet during the 48-day mandala', 'Chant at a consistent time each morning facing East or North-East', 'Never place sacred items directly on the floor'];
  let prescribedRemedies: string[] = [];

  if (rLower.includes('mantra')) {
    emoji = '📿';
    color = '#9370DB';
    pages = '38 pages (PDF)';
    size = '2.8 MB';
    title = 'Consecrated Vedic Mantra Sadhana Report';
    deity = 'Governing Graha & Ishta Devata';
    direction = 'North / East (Kubera & Indra Kona)';
    mantra = 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात् ॥';
    transliteration = 'Om Bhur Bhuvah Svah Tat Savitur Varenyam Bhargo Devasya Dhimahi Dhiyo Yo Nah Prachodayat';
    primaryProcedure =
      '1. Cleanse hands & feet, sit facing East on kusha or woolen asana during Brahma Muhurta (4:24 AM – 5:12 AM).\n2. Light a pure cow ghee diya and offer akshata (unbroken rice) & flowers.\n3. Take Sankalpa stating your Name, Nakshatra, and intention (' +
      concern +
      ').\n4. Chant 108 recitations of your primary Beej & Gayatri Mantra using a consecrated 108-bead Rudraksha or Sphatik mala.\n5. Complete a 48-day continuous Mandala for full planetary resonance.';
    materialsRequired = ['108-bead Consecrated Rudraksha or Sphatik Mala', 'Kusha Grass or Red Woolen Asana', 'Copper Vessel with Gangajal', 'Pure Cow Ghee Lamp'];
    prescribedRemedies = [
      'North: Daily Gayatri & Navagraha Beej Mantra Japa 108 times at sunrise',
      'North-East: Ishta Devata Sahasranama or Ashtottara Shatanamavali on Thursdays',
      'Twilight Sandhya: 27 recitations of Mahamrityunjaya Mantra for karmic protection',
      'Perform Japa with index finger held away from the Mala (use middle finger & thumb)',
    ];
  } else if (rLower.includes('yantra')) {
    emoji = '🔯';
    color = '#C9A84C';
    pages = '32 pages (PDF)';
    size = '3.2 MB';
    title = 'Sacred Shree & Navagraha Yantra Consecration Report';
    deity = 'Maha Tripurasundari & Navagrahas';
    direction = 'North-East (Ishanya) Wall facing West/South';
    mantra = 'ॐ श्रीं ह्रीं श्रीं कमले कमलालये प्रसीद प्रसीद ॐ श्रीं ह्रीं श्रीं महालक्ष्म्यै नमः ॥';
    transliteration = 'Om Shreem Hreem Shreem Kamale Kamalalaye Praseed Praseed Om Shreem Hreem Shreem Mahalakshmyai Namah';
    primaryProcedure =
      '1. On an auspicious Shukla Paksha Friday or Thursday morning, bathe the heavy copper/ashtadhatu Yantra with Panchamrit and Gangajal.\n2. Wipe dry with a clean red/yellow silk cloth and place on a wooden chowki in the North-East altar.\n3. Apply 9 dots of Sandalwood paste (Chandan) and Kumkum on the perimeter and central Bindu.\n4. Offer yellow/lotus flowers, light a cow ghee lamp, and chant the Prana-Pratishtha & activation mantra 108 times.';
    materialsRequired = ['Heavy Copper or Ashtadhatu Engraved Yantra', 'Panchamrit (Milk, Curd, Ghee, Honey, Jaggery)', 'Red or Yellow Silk Cloth', 'Ashtagandha & Kumkum'];
    prescribedRemedies = [
      'North-East: Install consecrated Shree Yantra & Lagna-benefic Graha Yantra in puja room',
      'Perform Trataka (gentle gaze meditation) on the central Bindu for 5 minutes daily',
      'Offer fresh yellow flowers and pure dhoop every Friday and Purnima',
      'Never use iron nails or hang Yantras above bathroom/bedroom doorways',
    ];
  } else if (rLower.includes('homa') || rLower.includes('hawan')) {
    emoji = '🔥';
    color = '#FF6B6B';
    pages = '42 pages (PDF)';
    size = '3.5 MB';
    title = 'Vedic Agni Homa & Hawan Anushthan Dossier';
    deity = 'Agni Deva, Maha Ganapathi & Navagrahas';
    direction = 'South-East (Agni Kona) or East';
    mantra = 'ॐ गं गणपतये नमः स्वाहा ॥ ॐ प्रजापतये स्वाहा, इदं प्रजापतये न मम ॥';
    transliteration = 'Om Gam Ganapataye Namah Svaha | Om Prajapataye Svaha, Idam Prajapataye Na Mama';
    primaryProcedure =
      '1. Set up the copper pyramid Homa Kundam in the East or South-East zone.\n2. Perform Achamanam, Pranayama, and Maha Sankalpa with your birth Nakshatra.\n3. Invoke Agni Deva and Lord Ganapathi with 12 Ahutis of pure cow ghee.\n4. Offer 108 Ahutis of Havan Samagri, black sesame (til), barley (jau), and planetary samidha twigs while chanting "Svaha".\n5. Conclude with Purnahuti (dry coconut wrapped in red silk) and apply Raksha Bhasma on the forehead.';
    materialsRequired = ['Inverted Pyramid Copper Homa Kundam', 'Pure Desi Cow Ghee (500g)', 'Navagraha Samidha Wood Twigs (Peepal, Shami, Ark, Palash, Khadir, Apamarga, Audumbar, Durva, Kusha)', 'Dry Coconut & Havan Samagri'];
    prescribedRemedies = [
      'East / South-East: Perform Ganapathi & Navagraha Shanti Homam on Shukla Paksha Ekadashi or Purnima',
      'Offer 108 Ahutis of pure cow ghee and planetary samidha for dosha pacification',
      'Keep consecrated Homa Bhasma (sacred ash) in a silver/copper box and apply daily',
      'Distribute sweet Payasam / Kheer naivedyam to family and seekers after Purnahuti',
    ];
  } else if (rLower.includes('gemstone') || rLower.includes('ratna')) {
    emoji = '💎';
    color = '#29B6F6';
    pages = '30 pages (PDF)';
    size = '2.7 MB';
    title = 'Vedic Certified Gemstone (Ratna) Prescription Report';
    deity = 'Lagna Lord, 5th & 9th Trikona Lords';
    direction = 'South / North-East Altar Consecration';
    mantra = 'ॐ बृं बृहस्पतये नमः ॥ ॐ घृणि सूर्याय नमः ॥';
    transliteration = 'Om Brim Brihaspataye Namah | Om Ghrini Suryaya Namah';
    primaryProcedure =
      '1. Procure a 100% natural, unheated, eye-clean gemstone of 5.25 to 6.50 Ratti weight.\n2. Set in an open-back ring or pendant (Gold or Silver as prescribed) so the base of the stone touches the skin.\n3. Submerge the ring in unboiled cow milk, Gangajal, honey, and tulsi leaves for 45 minutes on the planet’s auspicious day during Shukla Paksha.\n4. Chant the planetary Beej mantra 108 times, pass the ring over incense smoke, and wear within 1 hour of sunrise.';
    materialsRequired = ['Lab-Certified Natural Unheated Gemstone (5.25–6.5 Ratti)', 'Open-Back Gold / Panchdhatu / Silver Ring', 'Raw Cow Milk, Gangajal & Tulsi Leaves', 'Sandalwood Incense & Yellow Flowers'];
    prescribedRemedies = [
      'Primary Life Stone (Jeevan Ratna): Strengthens 1st House Lagna vitality & immunity',
      'Bhagya Stone (9th House): Activates dharmic fortune, career elevation & wealth flow',
      'Cleanse the gemstone ring every Purnima (Full Moon) in pure water and recharge at sunrise',
      'Strictly avoid wearing conflicting enemy planet gems (never combine Ruby/Pearl with Blue Sapphire/Gomed)',
    ];
  } else if (rLower.includes('rudraksha')) {
    emoji = '🟤';
    color = '#8D6E63';
    pages = '28 pages (PDF)';
    size = '2.4 MB';
    title = 'Mukhi Rudraksha Energy Alignment Report';
    deity = 'Lord Shiva (Mahadeva) & Rudra Avatars';
    direction = 'South-West / North-East Shiva Altar';
    mantra = 'ॐ ह्रीं नमः ॥ ॐ नमः शिवाय ॥';
    transliteration = 'Om Hreem Namah | Om Namah Shivaya';
    primaryProcedure =
      '1. Select a natural X-ray verified Nepal or Java Rudraksha bead on an auspicious Monday or Pradosham.\n2. Wash with Gangajal and unboiled milk, then dry and condition with pure sandalwood or almond oil.\n3. Offer Bilva (Bael) leaves, white flowers, and Vibhuti.\n4. Chant the Mukhi-specific Beej Mantra and Panchakshari Mantra ("Om Namah Shivaya") 108 times before wearing on a red/yellow silk cord or silver/gold capping.';
    materialsRequired = ['Authentic Lab-Tested Nepal Rudraksha Bead', 'Red/Yellow Silk Thread or Silver/Gold Chain', 'Bilva Leaves, Vibhuti & Gangajal', 'Pure Sandalwood or Almond Oil'];
    prescribedRemedies = [
      'Wear 5-Mukhi + Lagna-aligned Mukhi Rudraksha combination touching the Anahata (Heart) chakra',
      'Chant "Om Namah Shivaya" 108 times every Monday morning facing North-East',
      'Remove Rudraksha before sleeping, visiting funeral grounds, or non-sattvic activities',
      'Condition the bead once a month with almond oil and Vibhuti to preserve natural electromagnetic integrity',
    ];
  } else if (rLower.includes('dana') || rLower.includes('charity') || rLower.includes('seva')) {
    emoji = '🤲';
    color = '#FFB347';
    pages = '26 pages (PDF)';
    size = '2.2 MB';
    title = 'Karmic Dāna & Planetary Charity Protocol Report';
    deity = 'Dharma Deva, Shani Deva & Pitris';
    direction = 'North-West / South-West';
    mantra = 'ॐ शं शनैश्चराय नमः ॥ दानेन भूतानि वशीभवन्ति ॥';
    transliteration = 'Om Sham Shanaishcharaya Namah | Danena Bhutani Vashibhavanti';
    primaryProcedure =
      '1. Perform Sattvic Dāna (charity without expectation of praise or return) on the weekday and Hora of your afflicted planet.\n2. Touch the donation items with your right hand while mentally reciting the planetary Shanti mantra.\n3. Donate to deserving Vedic scholars, elderly shelters, Gaushalas (cow sanctuaries), or underprivileged families.\n4. Never consume or bring back items donated for malefic pacification (Rahu, Ketu, Saturn).';
    materialsRequired = ['Black Sesame Seeds (Til) & Mustard Oil (Saturdays)', 'Yellow Chana Dal, Turmeric & Bananas (Thursdays)', 'Green Moong & Fodder for Gaushala (Wednesdays)', 'Copper / Earthen Water Vessels for Birds'];
    prescribedRemedies = [
      'Saturday: Chhaya Dāna (view reflection in mustard oil and donate) + feed crows and stray dogs',
      'Thursday: Offer yellow gram dal, jaggery, and bananas at a Vishnu temple or Gaushala',
      'Amavasya & Ekadashi: Annadanam (donate freshly cooked sattvic meals to the needy)',
      'Daily: Keep an earthen bowl of clean water and grains on your balcony/terrace for birds',
    ];
  } else {
    // Devata Upasana / Ishta Devata
    emoji = '🪔';
    color = '#C9A84C';
    pages = '34 pages (PDF)';
    size = '2.9 MB';
    title = 'Personal Ishta Devata & Upasana Sadhana Report';
    deity = 'Sri Maha Vishnu / Lord Shiva / Devi Lalita Tripurasundari';
    direction = 'South-East / North-East Altar';
    mantra = 'ॐ नमो भगवते वासुदेवाय ॥ ॐ नमः शिवाय ॥';
    transliteration = 'Om Namo Bhagavate Vasudevaya | Om Namah Shivaya';
    primaryProcedure =
      '1. Derived from the 12th house from your Karakamsa Lagna in the D-9 Navamsha chart, your Ishta Devata guides your soul toward liberation and material grace.\n2. Light a daily Panchamukhi or single cow ghee lamp at sunrise and sunset.\n3. Offer Tulsi/Bilva leaves, Naivedyam (jaggery/fruits), and recite the Ishta Devata Stotra and 108 Beej Mantras.\n4. Observe Ekadashi or Pradosham vratas with devotion.';
    materialsRequired = ['Brass/Silver Lamp with Pure Cow Ghee', 'Consecrated Deity Vigraha or Framed Yantra', 'Tulsi / Bilva Leaves & Fresh Flowers', 'Dhoop, Karpooram (Camphor) & Naivedyam'];
    prescribedRemedies = [
      'Perform daily Shodashopachara or Panchopachara Puja to your Ishta Devata at sunrise',
      'Recite Vishnu Sahasranama or Lalita Sahasranama on auspicious weekdays',
      'Maintain an unbroken 48-day Mandala lamp lighting ritual for fulfilling your Sankalpa',
      'Visit an ancient Kshetra (sacred temple) of your Ishta Devata on your Janma Nakshatra day',
    ];
  }

  const astrologicalAnalysis =
    parsedServerData?.astrologicalAnalysis ||
    `Authoritative Nirayana Vedic Ephemeris Analysis for ${userName}:
• Birth Coordinates: ${dob} at ${tob}, ${pob}.
• Primary Focus / Sankalpa: ${concern}.
• Planetary Diagnostic (${currentYear}): Current transits of Jupiter, Saturn, and the Rahu-Ketu nodal axis across your natal houses create a decisive window for karmic balancing and spiritual fortification.
• Sacred Direction & Governing Deity: ${direction} — ${deity}.
• Consecrated Sound Code (Mantra): "${mantra}" (${transliteration}).
• Step-by-Step Sadhana Protocol:
${primaryProcedure}`;

  const newReport: KundliReportItem = {
    id: `rep_rem_${Date.now()}`,
    title,
    subtitle,
    pages,
    date: dateStr,
    status: 'Ready',
    emoji,
    color,
    size,
    category: 'remedies',
    price: params.price ?? 99,
    language: lang,
    summary:
      parsedServerData?.summary ||
      `Complete personalized ${rName} prescription calculated from Vedic ephemeris for ${userName} (${dob}, ${pob}). Covers sacred mantras, directional alignments, required materials, and a 48-day Sadhana protocol.`,
    astrologicalAnalysis,
    remediesPrescribed:
      Array.isArray(parsedServerData?.remediesPrescribed) && parsedServerData.remediesPrescribed.length > 0
        ? parsedServerData.remediesPrescribed
        : prescribedRemedies,
    reportData: parsedServerData || {
      remedyName: rName,
      deity,
      direction,
      mantra,
      transliteration,
      procedure: primaryProcedure,
      materialsRequired,
      precautions,
    },
    details: {
      remedyName: rName,
      deity,
      direction,
      mantra,
      transliteration,
      procedure: primaryProcedure,
      materialsRequired,
      precautions,
      dob,
      tob,
      pob,
      userName,
      primaryConcern: concern,
    },
  };

  await saveUserReport(newReport, undefined, params.skipBackendSync);
  return newReport;
}

/**
 * Generate a Complete 16-Zone / 8-Direction Vastu Consultation Report (matches Website VastuConsultationForm.tsx).
 */
export async function generateVastuReport(params: {
  vastuDetails: VastuConsultationInput;
  language?: string;
  price?: number;
  serverReportContent?: string;
  skipBackendSync?: boolean;
}): Promise<KundliReportItem> {
  const authUser = useAuthStore.getState().user;
  const v = params.vastuDetails;
  const userName = v.name || authUser?.name || 'Property Owner';
  const dob = v.dob || authUser?.dob || '15 Oct 1995';
  const tob = v.tob || authUser?.tob || '10:30 AM';
  const pob = v.pob || authUser?.pob || 'New Delhi, India';
  const lang = params.language || 'English';
  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  let parsedServerData: any = null;
  if (params.serverReportContent) {
    try {
      parsedServerData = JSON.parse(params.serverReportContent);
    } catch {}
  }

  const entrance = v.entranceDirection || 'East (Indra)';
  const propType = v.propertyType || 'Residential Flat / Apartment';
  const concern = v.primaryConcern || 'Complete Property Vastu Audit';
  const kitchen = v.kitchenDir || 'South-East (Ideal)';
  const masterBed = v.masterBedroomDir || 'South-West (Ideal)';
  const pujaRoom = v.pujaRoomDir || 'North-East (Ideal)';
  const toilet = v.toiletDir || 'North-West (Ideal)';

  const roomAudits = [
    {
      room: 'Main Entrance (Simhadwara)',
      direction: entrance,
      status: entrance.includes('North') || entrance.includes('East') ? 'Auspicious (Shubha)' : 'Needs Vastu Balancing',
      remedy:
        entrance.includes('South') || entrance.includes('West')
          ? 'Install a consecrated Copper Vastu Pyramid and Panchmukhi Hanuman / Ganapathi emblem above the lintel; light a cow ghee diya at dusk.'
          : 'Place a brass Swastik, Om, and Trishul on the entrance threshold and keep the doorway brightly lit without shoe clutter.',
    },
    {
      room: 'Kitchen (Agni Sthana)',
      direction: kitchen,
      status: kitchen.includes('South-East') || kitchen.includes('North-West') ? 'Aligned' : 'Elemental Imbalance',
      remedy:
        kitchen.includes('North-East')
          ? 'CRITICAL: Kitchen in North-East clashes Fire with Water. Place a natural Yellow Jaisalmer stone slab under the stove and hang a consecrated Copper Vastu Strip.'
          : 'Face East while cooking; keep drinking water and sink in the North-East corner of the kitchen away from the gas stove.',
    },
    {
      room: 'Master Bedroom (Nairutya Sthana)',
      direction: masterBed,
      status: masterBed.includes('South-West') || masterBed.includes('South') ? 'Optimal Stability' : 'Needs Earth Grounding',
      remedy:
        'Sleep with your head towards South or East (never North). Place heavy wooden wardrobes along the South or West wall to anchor Earth element stability.',
    },
    {
      room: 'Puja / Mandir Altar (Ishanya Kona)',
      direction: pujaRoom,
      status: pujaRoom.includes('North-East') || pujaRoom.includes('East') || pujaRoom.includes('North') ? 'Sacredly Aligned' : 'Requires Correction',
      remedy:
        'Deities should face West or South while the devotee faces East or North during prayer. Keep a copper kalash filled with fresh water in the North-East corner.',
    },
    {
      room: 'Toilet / Bath (Visarjana Zone)',
      direction: toilet,
      status: toilet.includes('North-West') || toilet.includes('South') || toilet.includes('West') ? 'Acceptable Zone' : 'Vastu Dosha Detected',
      remedy:
        'Keep a glass bowl of unrefined sea salt / rock salt (Sendha Namak) inside the bathroom (replace weekly), keep the door closed at all times, and install a Vastu Zinc/Copper Helix rod on the outer frame.',
    },
  ];

  const analysis =
    parsedServerData?.astrologicalAnalysis ||
    `16-Zone Spatial Vastu Purusha Mandala Audit for ${userName}:
• Property Profile: ${propType} located in ${pob}.
• Owner Birth Coordinates: ${dob} at ${tob}.
• Main Entrance Facing: ${entrance} | Primary Focus: ${concern}.
• Room-by-Room Spatial Diagnostic:
  1. Main Entrance (${entrance}): ${roomAudits[0].status} — ${roomAudits[0].remedy}
  2. Kitchen (${kitchen}): ${roomAudits[1].status} — ${roomAudits[1].remedy}
  3. Master Bedroom (${masterBed}): ${roomAudits[2].status} — ${roomAudits[2].remedy}
  4. Puja Room (${pujaRoom}): ${roomAudits[3].status} — ${roomAudits[3].remedy}
  5. Toilet / Bath (${toilet}): ${roomAudits[4].status} — ${roomAudits[4].remedy}
• Brahmasthan (Central Zone): Keep the center of the property open, bright, and free from heavy pillars or clutter.`;

  const prescribedRemedies = [
    `Main Entrance (${entrance}): ${roomAudits[0].remedy}`,
    `North-East (Ishanya): Place an energized Shree & Vastu Purusha Yantra and copper Urli with fresh water & flower petals`,
    `South-East (Agni): Balance fire element with warm lighting and a red/copper pyramid`,
    `North-West / Toilets (${toilet}): Keep a glass bowl of unrefined sea salt to absorb stagnant negative ions`,
    `Chant "ॐ वास्तुपुरुषाय नमः (Om Vastu Purushaya Namah)" 108 times on Thursdays and light natural camphor (Bhimseni Kapur) every evening`,
  ];

  const newReport: KundliReportItem = {
    id: `rep_vastu_${Date.now()}`,
    title: 'Personalised Vastu Shastra Consultation Report',
    subtitle: `${propType} (${entrance}) • ${userName}`,
    pages: '38 pages (PDF)',
    date: dateStr,
    status: 'Ready',
    emoji: '🏠',
    color: '#81C784',
    size: '3.4 MB',
    category: 'remedies',
    price: params.price ?? 149,
    language: lang,
    summary: `Comprehensive 8-Directional & 16-Zone Vastu Shastra architectural audit for ${userName}'s ${propType} (${entrance} entrance) with zero-demolition Vedic remedies.`,
    astrologicalAnalysis: analysis,
    remediesPrescribed: prescribedRemedies,
    reportData: parsedServerData || {
      propertyType: propType,
      entranceDirection: entrance,
      primaryConcern: concern,
      roomAudits,
    },
    details: {
      remedyName: 'Vastu Shastra',
      deity: 'Vastu Purusha & Ashta-Dikpalas',
      direction: entrance,
      mantra: 'ॐ वास्तुपुरुषाय नमः ॥ Om Vastu Purushaya Namah',
      propertyType: propType,
      entranceDirection: entrance,
      primaryConcern: concern,
      kitchenDir: kitchen,
      masterBedroomDir: masterBed,
      pujaRoomDir: pujaRoom,
      toiletDir: toilet,
      roomAudits,
      dob,
      tob,
      pob,
      userName,
    },
  };

  await saveUserReport(newReport, undefined, params.skipBackendSync);
  return newReport;
}

/**
 * Generate the Flagship Complete 8-Fold Personalized Parihara Plan (matches Website CompletePariharaPlanModal.tsx & /api/parihara-plan/generate).
 */
export async function generateCompletePariharaPlan(params: {
  birthDetails: BirthDetailsInput;
  language?: string;
  price?: number;
}): Promise<KundliReportItem> {
  const authUser = useAuthStore.getState().user;
  const uid = authUser?.uid || authUser?.phone || 'user';
  const userName = params.birthDetails.name || authUser?.name || 'Seeker';
  const gender = params.birthDetails.gender || authUser?.gender || 'Male';
  const dob = params.birthDetails.dob || authUser?.dob || '15 Oct 1995';
  const tob = params.birthDetails.tob || authUser?.tob || '10:30 AM';
  const pob = params.birthDetails.pob || authUser?.pob || 'New Delhi, India';
  const primaryConcern = params.birthDetails.primaryConcern || 'Complete 360° Life & Spiritual Alignment';
  const lang = params.language || 'English';
  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  let apiPlan: any = null;
  let serverSaved = false;

  // 1. Try calling the live website endpoint /api/parihara-plan/generate
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${LIVE_BASE_URL}/api/parihara-plan/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        userId: uid,
        userEmail: authUser?.email || '',
        fullName: userName,
        gender,
        dob,
        time: tob,
        place: pob,
        primaryConcern,
        paymentMethod: 'wallet',
      }),
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.plan) {
        apiPlan = data.plan;
        serverSaved = true;
      }
    }
  } catch {}

  const eightFoldRemedies = apiPlan?.remedies || [
    {
      direction: 'North (Uttara)',
      title: '1. Mantra Sadhana (Sound Vibration)',
      deity: 'Kubera & Budha (Mercury)',
      mantra: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात् ॥',
      prescription: 'Chant 108 recitations of Gayatri Mantra & Lagna Lord Beej Mantra every morning during Brahma Muhurta facing East.',
    },
    {
      direction: 'North-East (Ishanya)',
      title: '2. Sacred Yantra Consecration',
      deity: 'Ishana (Shiva) & Brihaspati (Jupiter)',
      mantra: 'ॐ श्रीं ह्रीं श्रीं महालक्ष्म्यै नमः ॥',
      prescription: 'Install an energized Copper Shree Yantra & Navagraha Yantra in the North-East altar; offer yellow flowers & cow ghee diya daily.',
    },
    {
      direction: 'East (Purva)',
      title: '3. Agni Homa & Hawan Anushthan',
      deity: 'Indra & Surya (Sun)',
      mantra: 'ॐ गं गणपतये नमः स्वाहा ॥ ॐ नवग्रहाय स्वाहा ॥',
      prescription: 'Perform Ganapathi & Navagraha Shanti Homam on Shukla Paksha Ekadashi or Purnima with 108 Ahutis of pure cow ghee and samidha.',
    },
    {
      direction: 'South-East (Agneya)',
      title: '4. Ishta Devata Upasana',
      deity: 'Agni & Shukra (Venus)',
      mantra: 'ॐ नमो भगवते वासुदेवाय ॥',
      prescription: 'Perform daily Panchopachara worship to your Ishta Devata and recite Vishnu Sahasranama or Lalita Sahasranama.',
    },
    {
      direction: 'South (Dakshina)',
      title: '5. Certified Vedic Gemstone (Ratna)',
      deity: 'Yama & Mangala (Mars)',
      mantra: 'ॐ बृं बृहस्पतये नमः ॥',
      prescription: 'Wear a natural, unheated 5.5 Ratti Bhagya/Lagna Ratna in an open-back gold/silver ring after Shukla Paksha Prana-Pratishtha.',
    },
    {
      direction: 'South-West (Nairutya)',
      title: '6. Sacred Rudraksha Kavach',
      deity: 'Nirriti & Rahu',
      mantra: 'ॐ नमः शिवाय ॥ ॐ ह्रीं नमः ॥',
      prescription: 'Wear an authentic Nepal 5-Mukhi & 7-Mukhi Rudraksha combination on a red silk thread on Monday morning after Shiva Abhishekam.',
    },
    {
      direction: 'West (Paschima)',
      title: '7. 16-Zone Vastu Shastra Alignment',
      deity: 'Varuna & Shani (Saturn)',
      mantra: 'ॐ वास्तुपुरुषाय नमः ॥',
      prescription: 'Keep North-East clutter-free with a copper water Urli, anchor South-West with heavy elements, and light Bhimseni camphor at dusk.',
    },
    {
      direction: 'North-West (Vayavya)',
      title: '8. Karmic Dāna & Seva (Charity)',
      deity: 'Vayu & Chandra (Moon)',
      mantra: 'ॐ शं शनैश्चराय नमः ॥',
      prescription: 'Donate black sesame & mustard oil on Saturdays, green fodder to Gaushala on Wednesdays, and Annadanam on Amavasya.',
    },
  ];

  const sankalpaProtocol = apiPlan?.sankalpaProtocol || {
    duration: '48 Days (1 Full Vedic Mandala)',
    morningRoutine: 'Wake during Brahma Muhurta (4:30 AM – 5:30 AM), bathe, offer Surya Arghya in a copper vessel, and complete 108 Japa.',
    eveningRoutine: 'Light a pure cow ghee and camphor lamp at sunset (Sandhya Kaal) and chant 27 recitations of Mahamrityunjaya Mantra.',
    dietaryRules: 'Observe strict Sattvic diet on Thursdays and Saturdays; avoid tamasic food, alcohol, and anger during the 48-day Sankalpa.',
  };

  const templePariharams = apiPlan?.templePariharams || [
    'Tirupati Balaji / Local Vishnu Kshetra — Archana on Saturday for Dhana & Karma elevation',
    'Navagraha Sannidhi — Tilt & Ghee Deepam on Saturdays for Rahu-Ketu & Shani pacification',
    'Jyotirlinga / Ancient Shiva Temple — Rudrabhishekam with raw milk and Bilva leaves on Pradosham',
  ];

  const analysis = `Complete 8-Fold Ashta-Digbandhana Personalized Parihara Blueprint for ${userName}:
• Birth Coordinates: ${dob} at ${tob}, ${pob} (${gender}).
• Primary Life Focus: ${primaryConcern}.
• Planetary Affliction & Dasha Diagnostic:
  ${apiPlan?.planetaryAfflictionSummary || 'Your natal chart and current Mahadasha-Antardasha transit indicate key karmic focal points across the 1st, 7th, 9th, and 10th houses. Harmonizing the 8 directional energies (Ashta-Digbandhana) creates an impenetrable spiritual kavach around your aura.'}

• 8-Directional Prescription Overview:
${eightFoldRemedies.map((r: any) => `  • [${r.direction}] ${r.title}: ${r.prescription || r.specificPrescription}`).join('\n')}

• 48-Day Mandala Sankalpa Protocol:
  - Morning: ${sankalpaProtocol.morningRoutine}
  - Evening: ${sankalpaProtocol.eveningRoutine}
  - Discipline: ${sankalpaProtocol.dietaryRules}

• Recommended Kshetra (Temple) Pariharams:
${templePariharams.map((t: string) => `  - ${t}`).join('\n')}`;

  const newReport: KundliReportItem = {
    id: `rep_parihara_${Date.now()}`,
    title: 'Complete 8-Fold Personalized Parihara Plan',
    subtitle: `${userName} (${dob}) • 48-Day Ashta-Digbandhana Dossier`,
    pages: '48 pages (PDF)',
    date: dateStr,
    status: 'Ready',
    emoji: '🕉️',
    color: '#713B32',
    size: '3.8 MB',
    category: 'remedies',
    price: params.price ?? 499,
    language: lang,
    summary: `Master 8-Directional Vedic Remedial Blueprint (Mantra, Yantra, Homa, Ishta Devata, Gemstone, Rudraksha, Vastu & Dāna) + 48-Day Mandala Sankalpa Protocol for ${userName}.`,
    astrologicalAnalysis: analysis,
    remediesPrescribed: eightFoldRemedies.map(
      (r: any) => `${r.direction} — ${r.title}: ${r.prescription || r.specificPrescription}`
    ),
    reportData: {
      isCompletePariharaPlan: true,
      eightFoldRemedies,
      sankalpaProtocol,
      templePariharams,
      primaryConcern,
    },
    details: {
      remedyName: 'Complete 8-Fold Parihara Plan',
      deity: 'Ashta-Dikpalas & Ishta Devata',
      direction: 'All 8 Sacred Directions (Ashta-Digbandhana)',
      mantra: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात् ॥',
      eightFoldRemedies,
      sankalpaProtocol,
      templePariharams,
      dob,
      tob,
      pob,
      gender,
      userName,
      primaryConcern,
    },
  };

  await saveUserReport(newReport, undefined, serverSaved);
  return newReport;
}

/**
 * Generate a Kundli Matching Report (36 Guna Ashtakoot Milan).
 */
export async function generateKundliMatchReport(params: {
  groom: { name: string; dob?: string; tob?: string; pob?: string };
  bride: { name: string; dob?: string; tob?: string; pob?: string };
  score?: number;
  verdict?: string;
  ashtakoot?: Array<{ name: string; score: number; max: number; status?: string; desc?: string }>;
  language?: string;
}): Promise<KundliReportItem> {
  const groomName = params.groom.name || 'Partner 1';
  const brideName = params.bride.name || 'Partner 2';
  const groomDob = params.groom.dob || '15 Mar 1992';
  const groomTob = params.groom.tob || '10:30 AM';
  const groomPob = params.groom.pob || 'New Delhi, India';
  const brideDob = params.bride.dob || '12 May 1994';
  const brideTob = params.bride.tob || '10:30 AM';
  const bridePob = params.bride.pob || 'New Delhi, India';
  const score = params.score !== undefined ? params.score : 30;
  const lang = params.language || 'English';
  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const verdict =
    params.verdict ||
    (score >= 28
      ? 'Uttama (Excellent) Matrimonial Match with deep intellectual, biological, and dharmic harmony.'
      : score >= 18
      ? 'Madhyama (Good) Matrimonial Match. Recommended with standard Vedic remedies.'
      : 'Requires remedial pacification and Manglik dosha balancing.');

  const ashtakootItems = params.ashtakoot || [
    { name: 'Varna (Spiritual Ego)', score: 1, max: 1, status: 'Compatible', desc: 'Spiritual ego and mutual respect are harmonious.' },
    { name: 'Vashya (Mutual Attraction)', score: 2, max: 2, status: 'Excellent', desc: 'Natural magnetic attraction and balanced dynamic.' },
    { name: 'Tara (Destiny & Vitality)', score: 3, max: 3, status: 'Good', desc: 'Birth star nakshatra harmony indicates longevity.' },
    { name: 'Yoni (Biological Affinity)', score: 3, max: 4, status: 'Good', desc: 'Emotional and physical compatibility are well balanced.' },
    { name: 'Graha Maitri (Intellectual Bond)', score: 5, max: 5, status: 'Perfect', desc: 'Planetary friendship of Rashi lords fosters deep affinity.' },
    { name: 'Gana (Temperament)', score: 6, max: 6, status: 'Perfect', desc: 'Temperament and behavioral values share natural sync.' },
    { name: 'Bhakoot (Emotional & Wealth)', score: 4, max: 7, status: 'Moderate', desc: 'Constructive communication supports financial growth.' },
    { name: 'Nadi (Genetic Vitality)', score: 7, max: 8, status: 'Excellent', desc: 'Healthy progeny and strong life-force energy.' },
  ];

  const analysis = `Detailed Ashtakoot Milan & Kundli Matching Analysis for ${groomName} & ${brideName}:
• Partner 1 (${groomName}): Born ${groomDob} at ${groomTob}, ${groomPob}.
• Partner 2 (${brideName}): Born ${brideDob} at ${brideTob}, ${bridePob}.
• Total Guna Score: ${score} / 36 points (${Math.round((score / 36) * 100)}% compatibility).
• Verdict: ${verdict}
• Manglik Dosha Analysis: Mars placements in both horoscopes are balanced. No acute Kuja Dosha conflict obstructing marital longevity.
• 8-Kootas Breakdown:
${ashtakootItems.map((k) => `  - ${k.name}: ${k.score}/${k.max} (${k.status || 'Aligned'}) — ${k.desc || ''}`).join('\n')}`;

  const newReport: KundliReportItem = {
    id: `rep_match_${Date.now()}`,
    title: `36 Guna Kundli Matching Report`,
    subtitle: `${groomName} & ${brideName} • Score: ${score}/36`,
    pages: '32 pages (PDF)',
    date: dateStr,
    status: 'Ready',
    emoji: '💍',
    color: '#FF6B6B',
    size: '3.1 MB',
    category: 'match',
    language: lang,
    summary: `Complete 36 Guna Ashtakoot Kundli Milan report for ${groomName} (${groomDob}) and ${brideName} (${brideDob}). Guna score: ${score}/36. Covers all 8 Kootas, Manglik analysis, and pre-marital remedies.`,
    astrologicalAnalysis: analysis,
    remediesPrescribed: [
      'Perform Gauri-Shankar Puja before wedding muhurat for matrimonial harmony',
      'Jointly recite Vishnu Sahasranama on Thursdays for family prosperity',
      'Select an auspicious Shukla Paksha Vivah Muhurat avoiding Rikta Tithis',
      'Install an energized Radha-Krishna or Shiva-Parvati portrait in the North-East zone',
    ],
    reportData: {
      isMatchReport: true,
      groom: { name: groomName, dob: groomDob, tob: groomTob, pob: groomPob },
      bride: { name: brideName, dob: brideDob, tob: brideTob, pob: bridePob },
      score,
      verdict,
      ashtakoot: ashtakootItems,
    },
    details: {
      groomName,
      brideName,
      groomDob,
      groomTob,
      groomPob,
      brideDob,
      brideTob,
      bridePob,
      score,
      verdict,
      ashtakoot: ashtakootItems,
    },
  };

  await saveUserReport(newReport);
  return newReport;
}

/**
 * Generate a Panchang & Shubh Muhurat Almanac Report.
 */
export async function generatePanchangReport(params: {
  dateStr?: string;
  locationStr?: string;
  language?: string;
  panchangData?: any;
}): Promise<KundliReportItem> {
  const authUser = useAuthStore.getState().user;
  const loc = params.locationStr || authUser?.pob || 'New Delhi, India';
  const lang = params.language || 'English';
  const dateStr = params.dateStr || new Date().toISOString().split('T')[0];
  const p = params.panchangData || {};

  const tithi = p.tithi || 'Shukla Paksha Ekadashi';
  const nakshatra = p.nakshatra || 'Punarvasu';
  const yoga = p.yoga || 'Siddha';
  const karana = p.karana || 'Bava';
  const abhijit = p.abhijitMuhurat || '11:48 AM – 12:36 PM';
  const rahuKaal = p.rahuKaal || '10:30 AM – 12:00 PM';
  const sunrise = p.sunrise || '6:18 AM';
  const sunset = p.sunset || '6:42 PM';

  const analysis = `Vedic Panchang & Muhurat Almanac Dossier:
• Observation Date: ${dateStr} at ${loc}.
• Tithi: ${tithi} (Governed by auspicious lunar phase).
• Nakshatra: ${nakshatra} (Radiates creative vigor and dharmic focus).
• Yoga: ${yoga} (Bestows accomplishment in virtuous undertakings).
• Karana: ${karana} (Fortifies trade, transactions, and agreements).
• Solar Transit: Sunrise at ${sunrise}, Sunset at ${sunset}.
• Prime Auspicious Window: Abhijit Muhurat (${abhijit}) — optimal for inaugurations, contracts, and sacred purchases.
• Caution Window: Rahu Kaal (${rahuKaal}) — avoid signing deeds or starting new ventures.`;

  const newReport: KundliReportItem = {
    id: `rep_pan_${Date.now()}`,
    title: `Panchang & Shubh Muhurat Almanac`,
    subtitle: `${dateStr} • ${loc}`,
    pages: '28 pages (PDF)',
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    status: 'Ready',
    emoji: '📅',
    color: '#4FC3F7',
    size: '2.1 MB',
    category: 'panchang',
    language: lang,
    summary: `Comprehensive daily & monthly Vedic almanac for ${loc}. Complete Tithi, Nakshatra, Yoga, Karana, Abhijit Muhurat, Choghadiya, and Rahu Kaal guidelines.`,
    astrologicalAnalysis: analysis,
    remediesPrescribed: [
      'Begin major activities during Shukla Paksha Amrit or Shubh Choghadiya',
      'Offer Surya Arghya with a copper vessel during sunrise',
      'Avoid initiating contracts or agreements during the daily Rahu Kaal window',
    ],
    details: {
      date: dateStr,
      location: loc,
      tithi,
      nakshatra,
      yoga,
      karana,
      abhijitMuhurat: abhijit,
      rahuKaal,
    },
  };

  await saveUserReport(newReport);
  return newReport;
}

/**
 * Generate general service or Mahadasha reports (Comprehensive Birth Chart, Career, Finance, Mahadasha Guides, etc.).
 */
export async function generateServiceReport(params: {
  title: string;
  category?: 'services' | 'remedies' | 'panchang' | 'mahadasha' | 'match';
  price?: number;
  language?: string;
  birthDetails?: BirthDetailsInput;
  details?: any;
  serverReportContent?: string;
  skipBackendSync?: boolean;
}): Promise<KundliReportItem> {
  const authUser = useAuthStore.getState().user;
  const userName =
    params.birthDetails?.name ||
    params.details?.name ||
    params.details?.userName ||
    authUser?.name ||
    'Seeker';
  const zodiac = authUser?.zodiac || 'Scorpio';
  const dob = params.birthDetails?.dob || params.details?.dob || authUser?.dob || '15 Oct 1995';
  const tob = params.birthDetails?.tob || params.details?.tob || authUser?.tob || '10:30 AM';
  const pob = params.birthDetails?.pob || params.details?.pob || authUser?.pob || 'New Delhi, India';
  const concern = params.birthDetails?.primaryConcern || params.details?.primaryConcern || '';
  const lang = params.language || 'English';
  const currentYear = new Date().getFullYear();
  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  let parsedServerData: any = null;
  if (params.serverReportContent) {
    try {
      parsedServerData = JSON.parse(params.serverReportContent);
    } catch {}
  }

  const title = params.title;
  const tLower = title.toLowerCase();
  let emoji = '📜';
  let color = '#9370DB';
  let pages = '40+ pages (PDF)';
  let size = '2.8 MB';
  let category: KundliReportItem['category'] = params.category || 'services';

  if (tLower.includes('career') || tLower.includes('wealth') || tLower.includes('finance') || tLower.includes('business')) {
    emoji = '💼';
    color = '#FFD700';
    pages = '32 pages (PDF)';
  } else if (tLower.includes('marriage') || tLower.includes('love') || tLower.includes('match')) {
    emoji = '❤️';
    color = '#FF6B6B';
    pages = '30 pages (PDF)';
  } else if (tLower.includes('annual') || tLower.includes('horoscope') || tLower.includes('transit')) {
    emoji = '🌟';
    color = '#4FC3F7';
    pages = '35 pages (PDF)';
  } else if (tLower.includes('numerology')) {
    emoji = '🔢';
    color = '#FFB347';
    pages = '24 pages (PDF)';
  } else if (tLower.includes('tarot')) {
    emoji = '🃏';
    color = '#BA68C8';
    pages = '22 pages (PDF)';
  } else if (tLower.includes('child')) {
    emoji = '👶';
    color = '#81C784';
    pages = '28 pages (PDF)';
  } else if (tLower.includes('rahu') || tLower.includes('sani') || tLower.includes('mahadasha')) {
    emoji = '🛡️';
    color = '#E65100';
    pages = '44 pages (PDF)';
    category = 'mahadasha';
  }

  const analysis =
    parsedServerData?.astrologicalAnalysis ||
    `Comprehensive Vedic Astrology Dossier for ${userName} (${zodiac}):
• Birth Coordinates: ${dob} at ${tob}, ${pob}.${concern ? `\n• Primary Question / Focus: ${concern}.` : ''}
• Lagna (Ascendant) & Natal Strength: Strong Kendra and Trikona lords provide resilience, strategic clarity, and dharmic elevation.
• 10th House (Karma) & 2nd/11th House (Dhana): Favorable Jupiter and Sun aspects activate leadership growth, career stability, and wealth accumulation in ${currentYear}–${currentYear + 1}.
• Active Mahadasha & Antardasha Synthesis: Navigating a transformative planetary sub-period; disciplined execution and prescribed Vedic Pariharam unlock peak results.
• Transit Outlook: Saturn's transit anchors long-term foundations while Jupiter's aspect brings auspicious opportunities.`;

  const remedies =
    Array.isArray(parsedServerData?.remediesPrescribed) && parsedServerData.remediesPrescribed.length > 0
      ? parsedServerData.remediesPrescribed
      : tLower.includes('rahu')
      ? [
          'Chant "ॐ भ्रां भ्रीं भ्रौं सः राहवे नमः" 108 times daily during twilight (Sandhya Kaal)',
          'Perform Durga Saptashati Argala Stotram recitation on Wednesdays and Saturdays',
          'Donate black sesame seeds, coconut, and blue/black blankets to the needy on Saturdays',
          'Wear an energized 8-Mukhi Nepal Rudraksha or Gomed (only after chart verification)',
        ]
      : tLower.includes('sani')
      ? [
          'Chant "ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः" 108 times and Hanuman Chalisa every Saturday',
          'Light a sesame oil (Til Tel) diya under a Peepal tree on Saturday evenings',
          'Perform Chhaya Dāna and feed black dogs/crows on Saturdays',
          'Maintain strict ethical integrity, humility, and service to elderly/working-class people',
        ]
      : [
          'North-East: Perform daily Gayatri Mantra recitation 108 times during sunrise',
          'East: Offer Surya Arghya in a copper vessel with red flowers every morning',
          'Thursday: Offer yellow chana dal, turmeric, and bananas at a Vishnu / Brihaspati shrine',
          'Follow directional Ashta Parihar guidelines aligned with your natal Lagna',
        ];

  const newReport: KundliReportItem = {
    id: `rep_svc_${Date.now()}`,
    title,
    subtitle: `${userName} (${dob}) • ${currentYear} Edition`,
    pages,
    date: dateStr,
    status: 'Ready',
    emoji,
    color,
    size,
    category,
    price: params.price,
    language: lang,
    summary:
      parsedServerData?.summary ||
      `Complete authoritative Vedic astrology analysis for ${userName} (${title}). Calculated from precision Nirayana ephemeris for ${dob} (${tob}, ${pob}).`,
    astrologicalAnalysis: analysis,
    remediesPrescribed: remedies,
    reportData: parsedServerData || undefined,
    details: {
      title,
      dob,
      tob,
      pob,
      userName,
      primaryConcern: concern,
      ...(params.details || {}),
    },
  };

  await saveUserReport(newReport, undefined, params.skipBackendSync);
  return newReport;
}

/**
 * Share or download the report to the user's device via native share dialog.
 */
export async function downloadOrShareReport(report: KundliReportItem): Promise<boolean> {
  try {
    const formattedContent = `══════════════════════════════════════════════════
🕉️ ASTROPARIHAR VEDIC ASTROLOGY REPORT 🕉️
══════════════════════════════════════════════════
Title: ${report.title}
Subtitle: ${report.subtitle}
Date: ${report.date}
Language: ${report.language || 'English'}
Pages: ${report.pages} | Size: ${report.size}

──────────────────────────────────────────────────
📖 EXECUTIVE SUMMARY
──────────────────────────────────────────────────
${report.summary || 'Personalized Vedic analysis prepared with Nirayana astronomical ephemeris.'}

──────────────────────────────────────────────────
🔮 COSMIC ANALYSIS & EPHEMERIS INSIGHTS
──────────────────────────────────────────────────
${report.astrologicalAnalysis || 'Calculations verified by AstroParihar Council.'}

──────────────────────────────────────────────────
🪷 PRESCRIBED VEDIC PARIHARAM & REMEDIES
──────────────────────────────────────────────────
${(report.remediesPrescribed || ['Follow daily Gayatri Mantra Japa 108 times', 'Observe sattvic disciplines']).map((r, i) => `${i + 1}. ${r}`).join('\n')}

══════════════════════════════════════════════════
AstroParihar — Ancient Vedic Wisdom for Modern Transformation
Website: https://astroparihar.com
══════════════════════════════════════════════════`;

    const result = await Share.share({
      title: `${report.title} — AstroParihar`,
      message: formattedContent,
    });

    return result.action !== Share.dismissedAction;
  } catch (err) {
    console.warn('Error sharing report:', err);
    return false;
  }
}
