import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { API_ENDPOINTS } from '@/config/api';

export interface ServiceDetailHero {
  title: string;
  subtitle: string;
  imageUrl: string;
  semanticLabel: string;
  accent: string;
  icon: string;
}

export interface ServiceDetailInfoCard {
  icon: string;
  title: string;
  description: string;
}

export interface TarotCardItem {
  name: string;
  meaning: string;
  reversed: string;
}

export interface NumerologyMeaningItem {
  number: number;
  title: string;
  desc: string;
}

export interface MuhuratEventItem {
  event: string;
  icon: string;
  dates: string[];
  color: string;
}

export interface MahadashaReportGuideItem {
  id: string;
  name: string;
  pages: string;
  price: number;
  desc: string;
  icon: string;
  color: string;
  badge: string;
}

export interface AppServiceDetailPagesContent {
  shared: {
    chatNowLabel: string;
    consultNowLabel: string;
    expertAstrologersTitle: string;
  };
  career: {
    hero: ServiceDetailHero;
    intro: string;
    analysisTitle: string;
    analysisCards: ServiceDetailInfoCard[];
    insightsTitle: string;
    insights: Array<{ planet: string; role: string; icon: string }>;
  };
  marriage: {
    hero: ServiceDetailHero;
    intro: string;
    analysisTitle: string;
    analysisCards: ServiceDetailInfoCard[];
    compatibilityTitle: string;
    aspects: Array<{ name: string; maxScore: number; color: string }>;
  };
  business: {
    hero: ServiceDetailHero;
    intro: string;
    insightsTitle: string;
    analysisCards: ServiceDetailInfoCard[];
    sectorsTitle: string;
    sectors: Array<{ planet: string; sector: string; color: string }>;
  };
  finance: {
    hero: ServiceDetailHero;
    intro: string;
    analysisTitle: string;
    analysisCards: ServiceDetailInfoCard[];
    wealthHousesTitle: string;
    wealthHouses: Array<{ house: string; governs: string; planet: string }>;
  };
  tarot: {
    hero: ServiceDetailHero;
    intro: string;
    dailyDrawTitle: string;
    cardOfTheDayLabel: string;
    pinnedDailyCardName?: string;
    pinnedDailyCardDesc?: string;
    readingTypesTitle: string;
    readingTypes: ServiceDetailInfoCard[];
    majorArcanaTitle: string;
    uprightLabel: string;
    reversedLabel: string;
    cards: TarotCardItem[];
  };
  numerology: {
    hero: ServiceDetailHero;
    intro: string;
    calculatorTitle: string;
    nameFieldLabel: string;
    dobFieldLabel: string;
    calculateButtonLabel: string;
    lifePathLabel: string;
    destinyLabel: string;
    coreNumbersTitle: string;
    coreCards: ServiceDetailInfoCard[];
    meanings: NumerologyMeaningItem[];
  };
  muhurat: {
    hero: ServiceDetailHero;
    intro: string;
    upcomingDatesTitle: string;
    muhurats: MuhuratEventItem[];
    dailyPanchangTitle: string;
    inauspiciousTitle: string;
    rahuKaalTitle: string;
    rahuKaalNote: string;
    yamagandaTitle: string;
    yamagandaNote: string;
    abhijitTitle: string;
    abhijitNote: string;
  };
  spiritual: {
    hero: ServiceDetailHero;
    intro: string;
    servicesTitle: string;
    servicesCards: ServiceDetailInfoCard[];
    practiceTitle: string;
    practices: Array<{ name: string; duration: string; icon: string; color: string }>;
    wisdomTitle: string;
    quotes: Array<{ text: string; source: string }>;
  };
  reports: {
    hero: ServiceDetailHero;
    intro: string;
    sectionTitle: string;
    buttonLabel: string;
    guides: MahadashaReportGuideItem[];
  };
}

export const DEFAULT_SERVICE_DETAIL_PAGES: AppServiceDetailPagesContent = {
  shared: {
    chatNowLabel: 'Chat Now',
    consultNowLabel: 'Consult Now',
    expertAstrologersTitle: 'Expert Astrologers',
  },
  career: {
    hero: {
      title: 'Career Astrology',
      subtitle: 'Unlock your professional destiny',
      imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop',
      semanticLabel: 'Professional office setting with charts and career planning documents on a desk',
      accent: '#FFD700',
      icon: 'work_outline_rounded',
    },
    intro:
      'Your birth chart holds the blueprint of your professional life. Vedic astrology reveals the most favourable career paths, promotion timings, and business opportunities aligned with your planetary positions.',
    analysisTitle: 'What We Analyse',
    analysisCards: [
      {
        icon: 'trending_up_rounded',
        title: 'Career Path & Profession',
        description: 'Identify the most suitable career fields based on your 10th house lord, Saturn, and Sun placements.',
      },
      {
        icon: 'schedule_rounded',
        title: 'Promotion & Growth Timing',
        description: 'Pinpoint the exact Dasha and transit periods when career advancement is most likely to occur.',
      },
      {
        icon: 'business_center_rounded',
        title: 'Job vs Business',
        description: 'Determine whether employment or entrepreneurship is written in your stars for maximum success.',
      },
      {
        icon: 'swap_horiz_rounded',
        title: 'Career Change Analysis',
        description: 'Evaluate the planetary support for switching careers and identify the best timing for transitions.',
      },
    ],
    insightsTitle: 'Career Insights',
    insights: [
      { planet: 'Saturn', role: 'Career Karaka', icon: 'circle_outlined' },
      { planet: '10th House', role: 'Profession House', icon: 'home_work_outlined' },
      { planet: 'Sun', role: 'Authority & Status', icon: 'wb_sunny_outlined' },
      { planet: 'Mercury', role: 'Business & Trade', icon: 'swap_horiz_rounded' },
    ],
  },
  marriage: {
    hero: {
      title: 'Marriage Astrology',
      subtitle: 'Find your destined life partner',
      imageUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&auto=format&fit=crop',
      semanticLabel: 'Indian couple in traditional wedding attire with floral decorations and warm golden lighting',
      accent: '#FF6B6B',
      icon: 'favorite_rounded',
    },
    intro:
      'Marriage is one of the most significant events in life. Vedic astrology provides deep insights into marriage timing, partner characteristics, compatibility, and the strength of your marital bond through the 7th house and Venus analysis.',
    analysisTitle: 'Marriage Analysis',
    analysisCards: [
      {
        icon: 'schedule_rounded',
        title: 'Marriage Timing',
        description: 'Determine the most auspicious period for marriage based on Venus Dasha, 7th house transits, and Navamsa chart analysis.',
      },
      {
        icon: 'people_rounded',
        title: 'Partner Characteristics',
        description: 'Understand the nature, appearance, and qualities of your future spouse through 7th house lord and Venus placement.',
      },
      {
        icon: 'favorite_border_rounded',
        title: 'Kundli Milan (36 Gunas)',
        description: 'Complete compatibility matching using traditional Ashtakoot system covering all 8 aspects of marital harmony.',
      },
      {
        icon: 'warning_amber_rounded',
        title: 'Mangal Dosha Analysis',
        description: 'Identify and assess Mangal Dosha, its severity, and effective remedies to ensure a harmonious marriage.',
      },
    ],
    compatibilityTitle: 'Compatibility Score',
    aspects: [
      { name: 'Varna', maxScore: 1, color: '#9370DB' },
      { name: 'Vashya', maxScore: 2, color: '#FF6B6B' },
      { name: 'Tara', maxScore: 3, color: '#FFB347' },
      { name: 'Yoni', maxScore: 4, color: '#4FC3F7' },
      { name: 'Graha Maitri', maxScore: 5, color: '#81C784' },
      { name: 'Gana', maxScore: 6, color: '#FFD700' },
      { name: 'Bhakoot', maxScore: 7, color: '#FF6B6B' },
      { name: 'Nadi', maxScore: 8, color: '#9370DB' },
    ],
  },
  business: {
    hero: {
      title: 'Business Astrology',
      subtitle: 'Align your enterprise with the cosmos',
      imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop',
      semanticLabel: 'Business team meeting around a conference table with charts and graphs on screens',
      accent: '#4FC3F7',
      icon: 'business_center_rounded',
    },
    intro:
      'Every successful business has cosmic timing. Vedic astrology helps entrepreneurs identify the best time to launch, expand, or pivot their business, choose the right partners, and navigate challenging periods with confidence.',
    insightsTitle: 'Business Insights',
    analysisCards: [
      {
        icon: 'rocket_launch_rounded',
        title: 'Business Launch Timing',
        description: 'Identify the most auspicious Muhurat for launching your business, signing contracts, or opening new ventures.',
      },
      {
        icon: 'handshake_rounded',
        title: 'Partnership Compatibility',
        description: 'Analyse the compatibility between business partners using Synastry and composite chart techniques.',
      },
      {
        icon: 'trending_up_rounded',
        title: 'Growth & Expansion Periods',
        description: 'Identify Jupiter and Venus transits that signal the best windows for business expansion and investment.',
      },
      {
        icon: 'shield_rounded',
        title: 'Risk & Challenge Periods',
        description: 'Foresee Saturn and Rahu transits that may bring obstacles, and prepare strategic remedies in advance.',
      },
    ],
    sectorsTitle: 'Business Sectors by Planet',
    sectors: [
      { planet: 'Mercury', sector: 'IT & Communication', color: '#4FC3F7' },
      { planet: 'Venus', sector: 'Fashion & Beauty', color: '#FF6B6B' },
      { planet: 'Mars', sector: 'Real Estate', color: '#FF6B35' },
      { planet: 'Jupiter', sector: 'Education & Law', color: '#FFD700' },
      { planet: 'Saturn', sector: 'Manufacturing', color: '#9370DB' },
      { planet: 'Sun', sector: 'Government & Politics', color: '#FFB347' },
    ],
  },
  finance: {
    hero: {
      title: 'Finance Astrology',
      subtitle: 'Wealth, investments & financial destiny',
      imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop',
      semanticLabel: 'Gold coins and financial charts with upward trending graphs on a dark background',
      accent: '#81C784',
      icon: 'account_balance_rounded',
    },
    intro:
      'The 2nd, 5th, 8th, and 11th houses in your birth chart govern wealth accumulation, speculative gains, inheritance, and income respectively. Our expert astrologers decode your financial destiny and guide you toward prosperity.',
    analysisTitle: 'Financial Analysis',
    analysisCards: [
      {
        icon: 'savings_rounded',
        title: 'Wealth Accumulation Periods',
        description: 'Identify Jupiter and Venus Dasha periods that bring maximum financial growth and wealth accumulation.',
      },
      {
        icon: 'show_chart_rounded',
        title: 'Investment Timing',
        description: 'Determine the best planetary windows for stock market investments, real estate purchases, and gold buying.',
      },
      {
        icon: 'warning_amber_rounded',
        title: 'Financial Loss Prevention',
        description: 'Foresee Ketu and Saturn transits that may cause financial setbacks and take preventive measures.',
      },
      {
        icon: 'home_rounded',
        title: 'Property & Real Estate',
        description: 'Analyse the 4th house for property ownership timing and the best periods for buying or selling property.',
      },
    ],
    wealthHousesTitle: 'Wealth Houses',
    wealthHouses: [
      { house: '2nd House', governs: 'Savings & Assets', planet: 'Venus' },
      { house: '5th House', governs: 'Speculation & Gains', planet: 'Jupiter' },
      { house: '8th House', governs: 'Inheritance', planet: 'Saturn' },
      { house: '11th House', governs: 'Income & Profits', planet: 'Jupiter' },
    ],
  },
  tarot: {
    hero: {
      title: 'Tarot Reading',
      subtitle: 'Ancient wisdom through sacred cards',
      imageUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&auto=format&fit=crop',
      semanticLabel: 'Mystical tarot cards spread on a dark velvet cloth with candles and crystals',
      accent: '#9370DB',
      icon: 'style_rounded',
    },
    intro:
      'Tarot is a powerful divination tool that uses 78 symbolic cards to reveal hidden truths, illuminate life paths, and provide guidance on love, career, and spiritual growth. Each card carries profound archetypal wisdom.',
    dailyDrawTitle: 'Daily Card Draw',
    cardOfTheDayLabel: 'Your Card of the Day',
    pinnedDailyCardName: '',
    pinnedDailyCardDesc: '',
    readingTypesTitle: 'Reading Types',
    readingTypes: [
      {
        icon: 'favorite_rounded',
        title: 'Love & Relationship Spread',
        description: 'A 5-card spread revealing the current state of your love life, obstacles, and the path forward.',
      },
      {
        icon: 'work_rounded',
        title: 'Career & Finance Spread',
        description: 'A 3-card spread covering your current career situation, challenges, and the best action to take.',
      },
      {
        icon: 'psychology_rounded',
        title: 'Celtic Cross Spread',
        description: 'The most comprehensive 10-card spread providing a complete overview of your life situation.',
      },
    ],
    majorArcanaTitle: 'Major Arcana Cards',
    uprightLabel: 'Upright',
    reversedLabel: 'Reversed',
    cards: [
      { name: 'The Star', meaning: 'Hope, faith, purpose, renewal, and spirituality. A period of calm after a storm — trust in the universe.', reversed: 'Lack of faith, despair, disconnection' },
      { name: 'The Fool', meaning: 'New beginnings, innocence, spontaneity, and a bold leap of faith.', reversed: 'Recklessness, hesitation, risk-taking' },
      { name: 'The Magician', meaning: 'Manifestation, resourcefulness, inspired action, and personal power.', reversed: 'Manipulation, poor planning, untapped talents' },
      { name: 'The High Priestess', meaning: 'Intuition, sacred knowledge, divine feminine, and inner wisdom.', reversed: 'Secrets, disconnected from intuition' },
      { name: 'The Empress', meaning: 'Femininity, beauty, abundance, nature, and nurturing energy.', reversed: 'Creative block, dependence on others' },
      { name: 'The Emperor', meaning: 'Authority, establishment, structure, and steady leadership.', reversed: 'Domination, excessive control, rigidity' },
      { name: 'The Hierophant', meaning: 'Spiritual wisdom, sacred traditions, mentorship, and dharma.', reversed: 'Personal beliefs, challenging the status quo' },
      { name: 'The Lovers', meaning: 'Love, harmony, relationships, alignment of values and choices.', reversed: 'Disharmony, imbalance, misalignment' },
      { name: 'The Chariot', meaning: 'Control, willpower, victory, and focused determination.', reversed: 'Lack of direction, opposition, self-doubt' },
      { name: 'The Sun', meaning: 'Positivity, radiant success, vitality, joy, and divine clarity.', reversed: 'Temporary setbacks, overly optimistic expectations' },
    ],
  },
  numerology: {
    hero: {
      title: 'Numerology',
      subtitle: 'Decode the numbers of your destiny',
      imageUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop',
      semanticLabel: 'Sacred numbers and mathematical symbols glowing in golden light on a dark mystical background',
      accent: '#FFB347',
      icon: 'tag_rounded',
    },
    intro:
      'Numerology is the ancient science of numbers and their divine influence on human life. Every number carries a unique vibration that shapes your personality, destiny, and life path.',
    calculatorTitle: 'Calculate Your Numbers',
    nameFieldLabel: 'Full Name',
    dobFieldLabel: 'Date of Birth (DD/MM/YYYY)',
    calculateButtonLabel: 'Calculate My Numbers',
    lifePathLabel: 'Life Path',
    destinyLabel: 'Destiny',
    coreNumbersTitle: 'Core Numbers',
    coreCards: [
      {
        icon: 'route_rounded',
        title: 'Life Path Number',
        description: "Derived from your birth date, this is the most important number — it reveals your life's purpose and the path you are meant to walk.",
      },
      {
        icon: 'star_rounded',
        title: 'Destiny Number',
        description: 'Calculated from your full birth name, this reveals your talents, abilities, and the goals you are destined to achieve.',
      },
      {
        icon: 'favorite_rounded',
        title: 'Soul Urge Number',
        description: 'Derived from the vowels in your name, this reveals your innermost desires, motivations, and what truly makes your soul happy.',
      },
    ],
    meanings: [
      { number: 1, title: 'The Leader', desc: 'Independent, pioneering, ambitious. Born to lead and innovate.' },
      { number: 2, title: 'The Diplomat', desc: 'Cooperative, sensitive, harmonious. Natural peacemaker and mediator.' },
      { number: 3, title: 'The Communicator', desc: 'Creative, expressive, joyful. Gifted in arts and communication.' },
      { number: 4, title: 'The Builder', desc: 'Practical, disciplined, reliable. Creates lasting foundations.' },
      { number: 5, title: 'The Adventurer', desc: 'Freedom-loving, versatile, curious. Thrives on change and experience.' },
      { number: 6, title: 'The Nurturer', desc: 'Caring, responsible, loving. Natural healer and family person.' },
      { number: 7, title: 'The Seeker', desc: 'Analytical, introspective, spiritual. Pursues truth and wisdom.' },
      { number: 8, title: 'The Achiever', desc: 'Ambitious, authoritative, successful. Manifests material abundance.' },
      { number: 9, title: 'The Humanitarian', desc: 'Compassionate, generous, idealistic. Serves humanity with love.' },
      { number: 11, title: 'The Illuminator', desc: 'Highly intuitive, inspirational, visionary. Master number of spiritual insight.' },
      { number: 22, title: 'The Master Builder', desc: 'Practical visionary, powerful, capable. Builds dreams into reality.' },
      { number: 33, title: 'The Master Teacher', desc: 'Selfless compassion, spiritual upliftment, and sacred service to humanity.' },
    ],
  },
  muhurat: {
    hero: {
      title: 'Muhurat',
      subtitle: 'Auspicious timings for life events',
      imageUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop',
      semanticLabel: 'Traditional Hindu calendar with auspicious dates marked, surrounded by marigold flowers and diyas',
      accent: '#FFD700',
      icon: 'event_available_rounded',
    },
    intro:
      'Muhurat is the Vedic science of selecting the most auspicious time for important life events. Starting any significant activity at the right cosmic moment ensures divine blessings and minimises obstacles.',
    upcomingDatesTitle: 'Upcoming Auspicious Dates',
    muhurats: [
      { event: 'Marriage', icon: 'favorite_rounded', dates: ['24 Nov 2026', '2 Dec 2026', '11 Dec 2026'], color: '#FF6B6B' },
      { event: 'Business Launch', icon: 'rocket_launch_rounded', dates: ['23 Nov 2026', '30 Nov 2026', '9 Dec 2026'], color: '#4FC3F7' },
      { event: 'Property Purchase', icon: 'home_rounded', dates: ['25 Nov 2026', '4 Dec 2026', '14 Dec 2026'], color: '#81C784' },
      { event: 'Vehicle Purchase', icon: 'directions_car_rounded', dates: ['22 Nov 2026', '29 Nov 2026', '8 Dec 2026'], color: '#FFB347' },
      { event: 'Griha Pravesh', icon: 'door_front_door_rounded', dates: ['26 Nov 2026', '6 Dec 2026', '16 Dec 2026'], color: '#9370DB' },
    ],
    dailyPanchangTitle: "Today's Live Panchang",
    inauspiciousTitle: 'Auspicious & Inauspicious Periods',
    rahuKaalTitle: 'Rahu Kaal',
    rahuKaalNote: 'Avoid starting new ventures during this period governed by Rahu.',
    yamagandaTitle: 'Yamaganda',
    yamagandaNote: 'An inauspicious period associated with Yama; avoid major beginnings.',
    abhijitTitle: 'Abhijit Muhurat',
    abhijitNote: 'Most victorious midday window blessed by Lord Vishnu for starting important tasks.',
  },
  spiritual: {
    hero: {
      title: 'Spiritual Guidance',
      subtitle: "Illuminate your soul's sacred path",
      imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop',
      semanticLabel: 'Person meditating in lotus position on a mountain peak at sunset with golden light and spiritual energy',
      accent: '#9370DB',
      icon: 'psychology_rounded',
    },
    intro:
      "Beyond the material world lies the realm of the soul. Our spiritual astrologers and guides help you understand your karmic journey, past life influences, dharmic purpose, and the spiritual practices best suited for your soul's evolution.",
    servicesTitle: 'Spiritual Services',
    servicesCards: [
      {
        icon: 'loop_rounded',
        title: 'Karma & Past Life Analysis',
        description: 'Explore karmic debts and past life influences through the 12th house, Saturn, and Rahu-Ketu axis in your birth chart.',
      },
      {
        icon: 'self_improvement_rounded',
        title: 'Dharma & Life Purpose',
        description: "Discover your soul's true purpose through the Atmakaraka planet and the 9th house of dharma and higher wisdom.",
      },
      {
        icon: 'spa_rounded',
        title: 'Spiritual Practice Guidance',
        description: 'Receive personalised recommendations for meditation, yoga, mantra, and spiritual practices aligned with your birth chart.',
      },
      {
        icon: 'star_rounded',
        title: 'Ishta Devata (Personal Deity)',
        description: 'Identify your personal deity through the Atmakaraka and Karakamsha chart for deepened spiritual connection.',
      },
    ],
    practiceTitle: 'Daily Spiritual Practice',
    practices: [
      { name: 'Meditation', duration: '20 min', icon: 'self_improvement_rounded', color: '#9370DB' },
      { name: 'Pranayama', duration: '15 min', icon: 'air_rounded', color: '#4FC3F7' },
      { name: 'Mantra Japa', duration: '108 times', icon: 'music_note_rounded', color: '#FFD700' },
      { name: 'Yoga Asana', duration: '30 min', icon: 'accessibility_new_rounded', color: '#81C784' },
    ],
    wisdomTitle: 'Sacred Wisdom',
    quotes: [
      {
        text: 'The soul is not born; it does not die; it was not produced from anyone. Unborn, eternal, ever-existing and primeval.',
        source: 'Bhagavad Gita 2.20',
      },
      {
        text: 'You have the right to perform your prescribed duties, but you are not entitled to the fruits of your actions.',
        source: 'Bhagavad Gita 2.47',
      },
    ],
  },
  reports: {
    hero: {
      title: 'Mahadasha PDF Guides',
      subtitle: 'Official Rahu & Sani Remedial Dossiers',
      imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop',
      semanticLabel: 'Detailed astrological charts and reports spread on a desk with a pen and cosmic symbols',
      accent: '#4FC3F7',
      icon: 'description_rounded',
    },
    intro:
      'Our authentic Vedic Mahadasha dossiers provide exhaustive blueprints to navigate Rahu and Saturn periods safely with consecrated Sanskrit Beej Mantras, 48-day protocols, and protective talismans.',
    sectionTitle: 'Official Mahadasha Dossiers',
    buttonLabel: 'View Guide →',
    guides: [
      {
        id: 'rahu-stabilisation',
        name: 'Rahu Mahadasha Stabilisation Guide',
        pages: '36 pages (PDF)',
        price: 499,
        desc: 'Harmonize intense Rahu transit with exact mantras, diet rules & silver talisman (PDF Dossier).',
        icon: 'shield_outlined',
        color: '#713B32',
        badge: 'Stabilisation Module',
      },
      {
        id: 'rahu-survival',
        name: 'Rahu Mahadasha Survival Guide',
        pages: '48 pages (PDF)',
        price: 999,
        desc: 'Tactical survival strategies, spiritual shield and karmic remedies for 18-year cycle.',
        icon: 'local_fire_department_rounded',
        color: '#E65100',
        badge: 'Complete Protocol',
      },
      {
        id: 'sani-stabilisation',
        name: 'Sani Mahadasha Stabilisation Guide',
        pages: '36 pages (PDF)',
        price: 499,
        desc: 'Saturn discipline, endurance & remedies for Sade Sati / Dhayya (PDF Dossier).',
        icon: 'spa_rounded',
        color: '#1A3D5C',
        badge: 'Saturn Pacification',
      },
      {
        id: 'sani-survival',
        name: 'Sani Mahadasha Survival Guide',
        pages: '52 pages (PDF)',
        price: 999,
        desc: 'Mastering Saturn 19-year Dasha trials, major Sade Sati shifts & long-term legacy.',
        icon: 'bolt_rounded',
        color: '#4A148C',
        badge: '19-Year Master Guide',
      },
    ],
  },
};

function mergeContent(partial?: Partial<AppServiceDetailPagesContent> | null): AppServiceDetailPagesContent {
  if (!partial) return DEFAULT_SERVICE_DETAIL_PAGES;
  return {
    shared: { ...DEFAULT_SERVICE_DETAIL_PAGES.shared, ...(partial.shared || {}) },
    career: {
      ...DEFAULT_SERVICE_DETAIL_PAGES.career,
      ...(partial.career || {}),
      hero: { ...DEFAULT_SERVICE_DETAIL_PAGES.career.hero, ...(partial.career?.hero || {}) },
    },
    marriage: {
      ...DEFAULT_SERVICE_DETAIL_PAGES.marriage,
      ...(partial.marriage || {}),
      hero: { ...DEFAULT_SERVICE_DETAIL_PAGES.marriage.hero, ...(partial.marriage?.hero || {}) },
    },
    business: {
      ...DEFAULT_SERVICE_DETAIL_PAGES.business,
      ...(partial.business || {}),
      hero: { ...DEFAULT_SERVICE_DETAIL_PAGES.business.hero, ...(partial.business?.hero || {}) },
    },
    finance: {
      ...DEFAULT_SERVICE_DETAIL_PAGES.finance,
      ...(partial.finance || {}),
      hero: { ...DEFAULT_SERVICE_DETAIL_PAGES.finance.hero, ...(partial.finance?.hero || {}) },
    },
    tarot: {
      ...DEFAULT_SERVICE_DETAIL_PAGES.tarot,
      ...(partial.tarot || {}),
      hero: { ...DEFAULT_SERVICE_DETAIL_PAGES.tarot.hero, ...(partial.tarot?.hero || {}) },
    },
    numerology: {
      ...DEFAULT_SERVICE_DETAIL_PAGES.numerology,
      ...(partial.numerology || {}),
      hero: { ...DEFAULT_SERVICE_DETAIL_PAGES.numerology.hero, ...(partial.numerology?.hero || {}) },
    },
    muhurat: {
      ...DEFAULT_SERVICE_DETAIL_PAGES.muhurat,
      ...(partial.muhurat || {}),
      hero: { ...DEFAULT_SERVICE_DETAIL_PAGES.muhurat.hero, ...(partial.muhurat?.hero || {}) },
    },
    spiritual: {
      ...DEFAULT_SERVICE_DETAIL_PAGES.spiritual,
      ...(partial.spiritual || {}),
      hero: { ...DEFAULT_SERVICE_DETAIL_PAGES.spiritual.hero, ...(partial.spiritual?.hero || {}) },
    },
    reports: {
      ...DEFAULT_SERVICE_DETAIL_PAGES.reports,
      ...(partial.reports || {}),
      hero: { ...DEFAULT_SERVICE_DETAIL_PAGES.reports.hero, ...(partial.reports?.hero || {}) },
    },
  };
}

const STORAGE_KEY = 'astroparihar_service_detail_pages_v1';

interface ServiceDetailsState {
  content: AppServiceDetailPagesContent;
  loading: boolean;
  hydrated: boolean;
  fetchContent: (forceFresh?: boolean) => Promise<void>;
}

export const useServiceDetailsStore = create<ServiceDetailsState>((set, get) => ({
  content: DEFAULT_SERVICE_DETAIL_PAGES,
  loading: false,
  hydrated: false,
  fetchContent: async (forceFresh = false) => {
    if (!get().hydrated) {
      try {
        const cached = await AsyncStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object') {
            set({ content: mergeContent(parsed), hydrated: true });
          }
        }
      } catch {}
    }

    if (get().loading && !forceFresh) return;
    set({ loading: true });

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(API_ENDPOINTS.serviceDetails, { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        if (data?.success && data?.content) {
          const merged = mergeContent(data.content);
          set({ content: merged, loading: false, hydrated: true });
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          return;
        }
      }
    } catch {
      // Offline fallback preserved
    } finally {
      set({ loading: false, hydrated: true });
    }
  },
}));
