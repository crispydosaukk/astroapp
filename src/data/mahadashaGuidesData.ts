/**
 * 4 Official Mahadasha Guides & PDF Protocols — 1:1 Parity with AstroParihar Website
 *
 * 1. Rahu Mahadasha Stabilisation Guide (PDF) - ₹499 / $9.99
 * 2. Rahu Mahadasha Survival Guide (PDF) - ₹999 / $19.99
 * 3. Sani Mahadasha Stabilisation Guide (PDF) - ₹499 / $9.99
 * 4. Sani Mahadasha Survival Guide (PDF) - ₹999 / $19.99
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/features/auth/authStore';

export interface GuideSection {
  heading: string;
  badge?: string;
  paragraphs: string[];
  bulletPoints?: string[];
  mantra?: {
    sanskrit: string;
    translation: string;
    instructions: string;
  };
}

export interface GuideChapter {
  id: string;
  title: string;
  summary: string;
  sections: GuideSection[];
}

export interface MahadashaGuide {
  id: string;
  slug: string;
  title: string;
  pdfTitle: string;
  price: number;
  priceUSD: number;
  pdfUrl: string;
  badge: string;
  subtitle: string;
  description: string;
  previewTopics: string[];
  color: string;
  emoji: string;
  chapters: GuideChapter[];
}

export const MAHADASHA_GUIDES: Record<string, MahadashaGuide> = {
  'rahu-stabilisation': {
    id: 'rahu-stabilisation',
    slug: '/services/rahu-mahadasha-stabilisation-guide',
    title: 'Rahu Mahadasha Stabilisation Guide',
    pdfTitle: 'Rahu_Mahadasha_Stabilisation_Guide_AstroParihar.pdf',
    price: 499,
    priceUSD: 9.99,
    pdfUrl: 'https://astroparihar.com/assets/pdfs/rahu_mahadasha_stabilisation_guide.pdf',
    badge: 'Stabilisation Module',
    subtitle:
      'Harmonize intense Rahu transit with exact Vedic mantras, protective talismans & dietary discipline.',
    description:
      'The Rahu Mahadasha Stabilisation Guide provides a practical, non-fearful roadmap to grounding hyperactive Rahu energy, preventing mental anxiety, financial volatility, and sudden life disruptions.',
    color: '#713B32',
    emoji: '🛡️',
    previewTopics: [
      'Understanding Rahu Energy & Planetary Placement',
      'The 7 Core Symptoms of Rahu Instability',
      'Daily Beej Mantras & Rahu Stotram Protocol',
      'Food & Dietary Rules to Pacify Shadow Planets',
      'Emergency Rahu Pacification Pujas & Charity Guidelines',
    ],
    chapters: [
      {
        id: 'ch-1',
        title: 'Chapter 1: Understanding Rahu Energy & Planetary Placement',
        summary: 'Decode the shadow planet archetype and recognize ungrounded Rahu manifestations.',
        sections: [
          {
            heading: 'The Cosmic Archetype of Rahu (North Node)',
            paragraphs: [
              'In Vedic Astrology, Rahu is the north lunar node—a celestial point without physical mass that exerts extraordinary psychological and karmic pull on the human mind.',
              'Rahu governs ambition, sudden worldly elevation, technological breakthroughs, foreign connections, but also mental illusion (Maya), phobias, and impulsive decisions.',
              'Stabilizing Rahu does not mean suppressing your ambition; it means grounding the cosmic electrical circuit so you experience clarity, deep restorative sleep, and sustained prosperity without fear.',
            ],
            bulletPoints: [
              'Element: Cosmic Smoke / Vata (Wind & Ether)',
              'Governing Direction: South-West (Nairruti)',
              'Primary Deity: Goddess Durga & Lord Shiva (Bhairava)',
              'Karmic Meaning: Unfulfilled desires from previous lifetimes seeking expression.',
            ],
          },
          {
            heading: 'The 7 Core Indicators of Rahu Instability',
            paragraphs: [
              'When Rahu is afflicted or transiting sensitive points in your birth chart (1st, 5th, 8th, or 12th houses), it creates distinctive energetic disruptions:',
            ],
            bulletPoints: [
              '1. Racing thoughts and severe sleep disturbance, especially between 1:00 AM and 3:30 AM.',
              '2. Sudden impulses to start massive projects accompanied by rapid loss of interest.',
              '3. Attraction to speculative investments or get-rich-quick opportunities that carry unseen hidden traps.',
              '4. Feeling disconnected from family roots, chronic digestive Vata gas/bloating, and unexplained restlessness.',
            ],
          },
        ],
      },
      {
        id: 'ch-2',
        title: 'Chapter 2: Daily Beej Mantras & Stotram Protocol',
        summary: 'Exact Sanskrit sound vibrations to create an impenetrable energetic shield.',
        sections: [
          {
            heading: 'Primary Rahu Beej Mantra Sadhana',
            paragraphs: [
              'Chanting the authentic Beej Mantra resonates with the throat and crown chakras, clearing shadow illusions.',
            ],
            mantra: {
              sanskrit: '॥ ॐ भ्रां भ्रीं भ्रौं सः राहवे नमः ॥',
              translation: 'Om, I offer my humble reverences to the mystic Rahu, the dispenser of karmic worldly experiences.',
              instructions: 'Chant 108 times using a Rudraksha or Sandalwood mala on Wednesday or Saturday nights after sunset.',
            },
          },
          {
            heading: 'The Kalabhairava Protective Kavacham',
            paragraphs: [
              'Lord Bhairava is the supreme controller of Rahu and time (Kala). Listening to or reciting the Kalabhairava Ashtakam on Ashtami tithi dissolves anxiety, panic attacks, and evil-eye afflictions immediately.',
            ],
          },
        ],
      },
      {
        id: 'ch-3',
        title: 'Chapter 3: Food, Dietary Discipline & Vata Pacification',
        summary: 'Nutritional adjustments to prevent astral vulnerability and mental agitation.',
        sections: [
          {
            heading: 'Sattvic Dietary Rules for Rahu Dasha',
            paragraphs: [
              'Rahu directly contaminates the astral body when stale, fermented, or artificial chemical-laden foods are consumed.',
            ],
            bulletPoints: [
              'Avoid eating post 8:30 PM to prevent midnight night-terrors and erratic dreaming.',
              'Incorporate warm cow ghee, cardamom, fennel seeds, and freshly cooked khichdi.',
              'Strictly eliminate alcohol and recreational intoxicants which grant Rahu direct psychic intrusion.',
            ],
          },
        ],
      },
      {
        id: 'ch-4',
        title: 'Chapter 4: Sacred Yantra & Gemstone Guidelines',
        summary: 'Safe application of talismans without dangerous side effects.',
        sections: [
          {
            heading: 'Energized Rahu Yantra Placement',
            paragraphs: [
              'The sacred geometric Rahu Yantra condenses harmonious vibrations. Place an authentic energized copper Rahu Yantra in the South-West direction of your altar. Offer a clean blue flower and light a pure sesame oil lamp on Saturday evenings.',
            ],
          },
          {
            heading: 'Caution Regarding Hessonite Garnet (Gomedh)',
            paragraphs: [
              'IMPORTANT VEDIC RULE: Never wear Gomedh (Hessonite) blindly without a thorough chart examination. Gomedh magnifies Rahu energy—if Rahu is in a malefic house, Gomedh will accelerate mental turmoil.',
              'Safe Alternative: An authentic 8-Mukhi Rudraksha bead, blessed by Lord Ganesha and Goddess Durga, provides 100% of Rahu pacification with zero side effects.',
            ],
          },
        ],
      },
    ],
  },

  'rahu-survival': {
    id: 'rahu-survival',
    slug: '/services/rahu-mahadasha-survival-guide',
    title: 'Rahu Mahadasha Survival Guide',
    pdfTitle: 'Rahu_Mahadasha_Survival_Guide_AstroParihar.pdf',
    price: 999,
    priceUSD: 19.99,
    pdfUrl: 'https://astroparihar.com/assets/pdfs/rahu_mahadasha_survival_guide.pdf',
    badge: 'Complete Survival Protocol',
    subtitle:
      'Tactical survival strategies, spiritual shield, karmic remedies & navigating intense 18-year Rahu Dasha.',
    description:
      'An exhaustive 18-year survival blueprint for navigating Rahu Mahadasha and Rahu Antardashas. Master modern career pivots, foreign migrations, and emotional resilience without fear.',
    color: '#E65100',
    emoji: '🔥',
    previewTopics: [
      'Year-by-Year Breakdown of the 18-Year Rahu Mahadasha',
      'Navigating Rahu-Rahu, Rahu-Jupiter & Rahu-Saturn Chhidra Dasha',
      'Karmic Debt & Ancestral Rahu Remedies (Pitra Dosha)',
      'Protecting Marriage & Business Contracts During Rahu Periods',
      'Master Rahu Yantra & Gemstone Selection Protocol',
    ],
    chapters: [
      {
        id: 'ch-1',
        title: 'Chapter 1: The 18-Year Rahu Cycle Blueprint',
        summary: 'Chronological roadmap of the three distinct phases of the 18-year Mahadasha.',
        sections: [
          {
            heading: 'The Three Phases of Rahu Mahadasha',
            paragraphs: [
              'The 18-year Rahu Mahadasha is the greatest crucible of personal evolution in Vedic Astrology. It moves through three distinct 6-year epochs:',
            ],
            bulletPoints: [
              'Phase 1 (Years 1 to 6 - The Uprooting): Breaks old comforts, shifts social circles, and triggers intense ambition and restlessness.',
              'Phase 2 (Years 7 to 12 - The High Altitude Peak): Massive worldly expansion, global travels, tech/business breakthroughs, and elevated status.',
              'Phase 3 (Years 13 to 18 - The Chhidra Awakening): Karmic debt resolution, spiritual disillusionment with materialism, and transition to Jupiter.',
            ],
          },
        ],
      },
      {
        id: 'ch-2',
        title: 'Chapter 2: Critical Antardasha Navigation Strategies',
        summary: 'Tactical survival guides for individual sub-periods.',
        sections: [
          {
            heading: '1. Rahu - Rahu (Years 1 - 2.7)',
            paragraphs: [
              'Characterized by sudden psychological disorientation, feeling like stepping onto a spinning carousel. Key rule: Do not make irreversible life changes in the first 12 months. Focus on steady routines and daily Durga worship.',
            ],
          },
          {
            heading: '2. Rahu - Jupiter (Years 2.7 - 5.1)',
            paragraphs: [
              'The classic "Guru-Chandal Yoga" period. High intellectual expansion, but danger of following false gurus or dubious financial advisors. Anchor yourself in classical scriptures and ethical integrity.',
            ],
          },
          {
            heading: '3. Rahu - Saturn (Years 5.1 - 7.9)',
            paragraphs: [
              'The heavy collision between Rahu ambition and Saturnian karmic reality. Tests your patience, hard work, and spine. Strict discipline, daily Hanuman Chalisa, and humility will turn this into enduring mastery.',
            ],
          },
          {
            heading: '4. Rahu - Mars (Years 13.9 - 14.9)',
            paragraphs: [
              'Angarak Yoga danger zone. High adrenaline, conflict risk, and potential burns/accidents. Avoid reckless driving, speculative stock day-trading, and legal disputes.',
            ],
          },
        ],
      },
      {
        id: 'ch-3',
        title: 'Chapter 3: Protecting Marriage, Contracts & Wealth',
        summary: 'Insulating relationships and finances from eclipse illusions.',
        sections: [
          {
            heading: 'Relationship Shield Protocol',
            paragraphs: [
              'Rahu generates illusions of dissatisfaction in personal relationships by making external options appear disproportionately glamorous.',
            ],
            bulletPoints: [
              'Never make final divorce or separation decisions during Rahu-Ketu nodal eclipse windows.',
              'Practice intentional, transparent communication with your partner.',
              'Perform a joint Friday Lakshmi-Narayana Puja to protect marital harmony.',
            ],
          },
          {
            heading: 'Financial Risk Management',
            paragraphs: [
              'Rahu rules sudden wealth and sudden losses. Always hold 40% of emergency capital in liquid, non-speculative assets. Have verified legal contracts signed before transferring capital in business partnerships.',
            ],
          },
        ],
      },
      {
        id: 'ch-4',
        title: 'Chapter 4: Master Vedic Shanti Rituals & Mantras',
        summary: 'Full remedial ceremonies and mantras for lasting planetary stability.',
        sections: [
          {
            heading: 'Durga Saptashati & Devi Kavacham',
            paragraphs: [
              'Reciting the Argala Stotram and Devi Kavacham from the Durga Saptashati completely neutralizes malefic shadow node afflictions.',
            ],
            mantra: {
              sanskrit: '॥ सर्वमङ्गलमाङ्गल्ये शिवे सर्वार्थसाधिके । शरण्ये त्र्यम्बके गौरि नारायणि नमोऽस्तु ते ॥',
              translation: 'Salutations to the Auspicious Mother Gauri, who brings supreme auspiciousness and fulfills all noble desires.',
              instructions: 'Chant 21 times every Friday morning with red flowers offered at the altar.',
            },
          },
          {
            heading: 'Pitra Dosha & Ancestral Seva',
            paragraphs: [
              'Afflicted Rahu is often connected to unpaid ancestral karmic debts. Feeding cows, donating black umbrellas to elderly pilgrims, and performing Tarpanam on Amavasya brings generational peace.',
            ],
          },
        ],
      },
    ],
  },

  'sani-stabilisation': {
    id: 'sani-stabilisation',
    slug: '/services/sani-mahadasha-stabilisation-guide',
    title: 'Sani Mahadasha Stabilisation Guide',
    pdfTitle: 'Sani_Mahadasha_Stabilisation_Guide_AstroParihar.pdf',
    price: 499,
    priceUSD: 9.99,
    pdfUrl: 'https://astroparihar.com/assets/pdfs/sani_mahadasha_stabilisation_guide.pdf',
    badge: 'Saturn Pacification',
    subtitle:
      'Saturn discipline, endurance, Sade Sati pacification & balancing karmic lessons with grace.',
    description:
      'The Sani Mahadasha Stabilisation Guide equips you with classical Saturn remedies, Hanuman Chalisa daily practices, and lifestyle modifications to transform Saturnian delay into rock-solid mastery.',
    color: '#1A3D5C',
    emoji: '🪐',
    previewTopics: [
      'Decoding Saturn (Shani Dev) as the Great Teacher of Karma',
      'Sade Sati 3-Phase Survival & Dhaiya Analysis',
      'Shanivar Vrat & Mustard Oil Offering Rituals',
      'Building Iron Discipline & Health Endurance',
      'Mantra Chanting for Relief from Shani Obstacles',
    ],
    chapters: [
      {
        id: 'ch-1',
        title: 'Chapter 1: Understanding Lord Shani (Saturn)',
        summary: 'The cosmic dispenser of justice, endurance, and timeless legacy.',
        sections: [
          {
            heading: 'The True Nature of Saturn in Vedic Philosophy',
            paragraphs: [
              'Saturn (Shani Dev) is the cosmic judge (Nyayadhikari). Saturn does not punish out of cruelty; he purifies false ego, cuts away superficial attachments, and teaches patience and humility.',
              'When Saturn influences your chart, superficial shortcuts cease to work. Only authentic effort, unwavering honesty, and meticulous discipline will yield success.',
            ],
            bulletPoints: [
              'Governing Element: Vata / Earth & Air',
              'Governing Day: Saturday (Shanivar)',
              'Protector Deity: Lord Hanuman & Lord Shiva',
              'Cosmic Gift: Indestructible discipline, enduring legacy, and supreme wisdom.',
            ],
          },
        ],
      },
      {
        id: 'ch-2',
        title: 'Chapter 2: Daily Hanuman Chalisa & Shani Stotram',
        summary: 'Sacred chants for relief from delays, fatigue, and obstacles.',
        sections: [
          {
            heading: 'The Hanuman Shield (Supreme Shani Immunity)',
            paragraphs: [
              'According to classical Vedic lore, Lord Hanuman rescued Lord Shani from Ravana. In return, Lord Shani gave an eternal boon: no devotee who sincerely chants the Hanuman Chalisa will ever be harmed by Saturnian maleficence.',
            ],
            mantra: {
              sanskrit: '॥ भूत पिशाच निकट नहिं आवै । महाबीर जब नाम सुनावै ॥\n॥ नासै रोग हरै सब पीरा । जपत निरंतर हनुमत बीरा ॥',
              translation: 'Negative astral energies cannot approach where the name of Mahaveer Hanuman is proclaimed. All diseases and suffering vanish with regular devotion.',
              instructions: 'Recite Hanuman Chalisa 3 to 7 times daily, especially on Tuesdays and Saturdays facing East.',
            },
          },
          {
            heading: 'Dasharatha Shani Stotram',
            paragraphs: [
              'Recite the sacred Shani prayer composed by King Dasharatha to eliminate financial stagnation and physical lethargy.',
            ],
            mantra: {
              sanskrit: '॥ ॐ नीलांजन समाभासं रविपुत्रं यमाग्रजम् । छायामार्तण्ड सम्भूतं तं नमामि शनैश्चरम् ॥',
              translation: 'I bow to Lord Saturn, who glows like blue sapphire, the son of the Sun God and Chhaya, the elder brother of Yama, the slow-moving master of karma.',
              instructions: 'Chant 108 times on Saturdays using a Rudraksha mala after sunset.',
            },
          },
        ],
      },
      {
        id: 'ch-3',
        title: 'Chapter 3: Karma Yoga, Seva & Behavioral Discipline',
        summary: 'Direct actions and lifestyle remedies to earn Saturn blessings.',
        sections: [
          {
            heading: 'Honoring Laborers and Elders',
            paragraphs: [
              'Saturn directly rules laborers, domestic workers, sanitation staff, and senior citizens. Respecting and generously tipping workers acts as an instant energetic remedy.',
            ],
            bulletPoints: [
              'Never delay paying wages or agreed dues to workers or service staff.',
              'Donate warm black blankets, iron utensils, or footwear to poor people on Saturdays.',
              'Feed black sesame seeds (Til) and oil-brushed rotis to crows and stray cows.',
            ],
          },
        ],
      },
      {
        id: 'ch-4',
        title: 'Chapter 4: Protective Talismans & Lifestyle Rules',
        summary: 'Safe gemstones, Rudraksha, and weekly fast protocols.',
        sections: [
          {
            heading: 'Black Horseshoe Ring & 14-Mukhi Rudraksha',
            paragraphs: [
              'Wearing an energized ring crafted from a genuine boat nail or black horse shoe on the middle finger of the right hand on a Saturday evening grounds heavy Saturnian transits.',
              'Wearing a natural 14-Mukhi or 7-Mukhi Rudraksha bead protects the heart, stabilizes blood pressure, and awakens intuitive foresight.',
            ],
          },
        ],
      },
    ],
  },

  'sani-survival': {
    id: 'sani-survival',
    slug: '/services/sani-mahadasha-survival-guide',
    title: 'Sani Mahadasha Survival Guide',
    pdfTitle: 'Sani_Mahadasha_Survival_Guide_AstroParihar.pdf',
    price: 999,
    priceUSD: 19.99,
    pdfUrl: 'https://astroparihar.com/assets/pdfs/sani_mahadasha_survival_guide.pdf',
    badge: '19-Year Master Guide',
    subtitle:
      'Mastering Saturn 19-year Dasha trials, major Sade Sati shifts & long-term legacy building.',
    description:
      'The definitive guide to triumphing through the 19-year Saturn Mahadasha. Learn how Saturn rewards honest hard work, integrity, and spiritual devotion with enduring wealth and authority.',
    color: '#4A148C',
    emoji: '⚡',
    previewTopics: [
      'Comprehensive Analysis of 19-Year Saturn Mahadasha',
      'Shani-Rahu & Shani-Ketu Antardasha Shield',
      'Karmic Restructuring of Career, Health & Property',
      'Sacred Shani Stotram & Blue Sapphire / Iron Ring Guidelines',
      'Long-Term Prosperity & Spiritual Liberation Protocol',
    ],
    chapters: [
      {
        id: 'ch-1',
        title: 'Chapter 1: The 19-Year Shani Mahadasha Blueprint',
        summary: 'Architectural overview of Saturn 19-year dasha cycle.',
        sections: [
          {
            heading: 'The Crucible of Long-Term Legacy',
            paragraphs: [
              'The 19-year Saturn Mahadasha is designed to forge an unbreakable diamond out of your life. While the initial years demand hard work and emotional endurance, the latter half bestows permanent societal authority, wealth, and spiritual poise.',
            ],
            bulletPoints: [
              'Years 1 to 3: The Reality Check (Shani - Shani). Old unsustainable projects are dismantled.',
              'Years 4 to 7: Skill Mastery & Network Building (Shani - Mercury, Shani - Ketu).',
              'Years 8 to 11: The Peak Pressure & Test of Character (Shani - Venus, Shani - Sun).',
              'Years 12 to 19: The Golden Harvest & Lasting Foundations (Shani - Moon, Shani - Mars, Shani - Rahu, Shani - Jupiter).',
            ],
          },
        ],
      },
      {
        id: 'ch-2',
        title: 'Chapter 2: Master Strategy for Sade Sati (7.5 Years)',
        summary: 'How to navigate the three 2.5-year phases of Saturn transit over the natal Moon.',
        sections: [
          {
            heading: 'Phase 1: Rising Sade Sati (12th from Moon)',
            paragraphs: [
              'High expenses, mental worries about the future, and potential relocations. Remedial Focus: Trim unnecessary debt, practice weekly silence (Mauna), and sleep before 10:30 PM.',
            ],
          },
          {
            heading: 'Phase 2: Peak Sade Sati (1st on Moon)',
            paragraphs: [
              'Maximum physical and emotional demands. Ego dissolution. Remedial Focus: Daily Hanuman Chalisa, warm sesame oil body massage (Abhyanga), and steadfast commitment to health.',
            ],
          },
          {
            heading: 'Phase 3: Setting Sade Sati (2nd from Moon)',
            paragraphs: [
              'Financial reorganization and stepping into solid stability. Avoid harsh speech in family matters.',
            ],
          },
        ],
      },
      {
        id: 'ch-3',
        title: 'Chapter 3: Health, Bone Structure & Vata Management',
        summary: 'Physical wellness and joint vitality during Saturn periods.',
        sections: [
          {
            heading: 'Ayurvedic Vata Pacification Protocol',
            paragraphs: [
              'Saturn rules bones, teeth, knees, and the nervous system. Prevent stiffness with these Ayurvedic practices:',
            ],
            bulletPoints: [
              'Warm sesame oil massage on the feet and scalp before sleeping.',
              'Consume soaked almonds, walnuts, and warm milk with a pinch of nutmeg and turmeric.',
              'Practice slow, grounding yoga postures (Vrikshasana, Tadasana, Paschimottanasana).',
            ],
          },
        ],
      },
      {
        id: 'ch-4',
        title: 'Chapter 4: Sacred Temple Pilgrimages & Shanti Homa',
        summary: 'Sacred energy centers and ultimate Shani protection.',
        sections: [
          {
            heading: 'Thirunallar & Shani Shingnapur Connection',
            paragraphs: [
              'Whenever possible, take a sacred bath at Nala Theertham in Thirunallar or offer mustard oil at Shani Shingnapur. Performing a Shani Shanti Homa through qualified Vedic priests purifies collective karmic obstacles.',
            ],
          },
        ],
      },
    ],
  },
};

const STORAGE_PURCHASED_GUIDES = 'astroparihar_purchased_mahadasha_guides';

export async function getPurchasedGuideIds(userId?: string): Promise<string[]> {
  try {
    const key = userId ? `${STORAGE_PURCHASED_GUIDES}_${userId}` : STORAGE_PURCHASED_GUIDES;
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export async function markGuidePurchased(guideId: string, userId?: string): Promise<void> {
  try {
    const key = userId ? `${STORAGE_PURCHASED_GUIDES}_${userId}` : STORAGE_PURCHASED_GUIDES;
    const existing = await getPurchasedGuideIds(userId);
    if (!existing.includes(guideId)) {
      const updated = [...existing, guideId];
      await AsyncStorage.setItem(key, JSON.stringify(updated));
    }
  } catch {}
}

