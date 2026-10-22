/** Data ported verbatim from remedies_screen.dart (_remedies) and remedy_detail_screen.dart (_getRemedyData + per-remedy lists). */
export interface Remedy {
  name: string;
  sanskrit: string;
  direction: string;
  emoji: string;
  color: string;
  desc: string;
  angle: number;
}

const PI = Math.PI;
export const REMEDIES: Remedy[] = [
  { name: 'Mantra', sanskrit: 'मंत्र', direction: 'North', emoji: '🕉️', color: '#9370DB', desc: 'Sacred sound vibrations that align planetary energies', angle: -PI / 2 },
  { name: 'Yantra', sanskrit: 'यंत्र', direction: 'North-East', emoji: '⬡', color: '#FFD700', desc: 'Sacred geometric diagrams that attract cosmic energies', angle: -PI / 4 },
  { name: 'Homa', sanskrit: 'होम', direction: 'East', emoji: '🔥', color: '#FF6B35', desc: 'Sacred fire rituals to purify and invoke divine blessings', angle: 0 },
  { name: 'Devata', sanskrit: 'देवता', direction: 'South-East', emoji: '🪔', color: '#FFB347', desc: 'Personal deity worship for spiritual alignment', angle: PI / 4 },
  { name: 'Gemstones', sanskrit: 'रत्न', direction: 'South', emoji: '💎', color: '#4FC3F7', desc: 'Planetary gemstones to strengthen beneficial influences', angle: PI / 2 },
  { name: 'Rudraksha', sanskrit: 'रुद्राक्ष', direction: 'South-West', emoji: '📿', color: '#8B4513', desc: 'Sacred seeds of Lord Shiva for protection and healing', angle: (3 * PI) / 4 },
  { name: 'Vastu', sanskrit: 'वास्तु', direction: 'West', emoji: '🏠', color: '#81C784', desc: 'Sacred architecture for harmonious living spaces', angle: PI },
  { name: 'Dāna & Seva', sanskrit: 'दान', direction: 'North-West', emoji: '🤲', color: '#FF6B6B', desc: 'Charitable giving and selfless service for karmic balance', angle: (-3 * PI) / 4 },
];

export interface RemedyInfo { shortDesc: string; whyHelp: string; benefits: string[]; howItWorks: string; suitableFor: string }

const DATA: Record<string, RemedyInfo> = {
  Mantra: {
    shortDesc: 'Sacred sound vibrations that align your energy with planetary forces. Mantra recitation is one of the most powerful and accessible Vedic remedies.',
    whyHelp: 'Sound is the primordial force of creation. Each planet resonates with specific sound frequencies. Regular mantra recitation creates a vibrational alignment between your consciousness and the planetary energies in your birth chart.',
    benefits: ['Reduces malefic planetary influences', 'Strengthens beneficial planetary energies', 'Calms the mind and reduces anxiety', 'Improves focus and mental clarity', 'Creates positive karmic impressions'],
    howItWorks: 'Mantras work through the principle of resonance. The specific sounds activate corresponding energy centres in the body and create sympathetic vibrations with planetary frequencies. Regular practice over 40 days creates lasting transformation.',
    suitableFor: 'Anyone seeking to strengthen planetary influences in their chart. Particularly beneficial during challenging Dasha periods or when a planet is weak or afflicted in the birth chart.',
  },
  Yantra: {
    shortDesc: 'Sacred geometric diagrams that serve as cosmic antennas, attracting and amplifying specific planetary energies into your environment.',
    whyHelp: 'Yantras are visual representations of cosmic energy patterns. They work as focal points for meditation and as energetic tools that continuously radiate specific frequencies into your space.',
    benefits: ['Creates a protective energy field', 'Attracts specific planetary blessings', 'Enhances meditation and focus', 'Transforms the energy of your living space', 'Provides continuous energetic support'],
    howItWorks: 'Each Yantra contains specific geometric patterns, numbers, and seed syllables that correspond to planetary energies. When properly consecrated and placed, they act as continuous transmitters of beneficial cosmic energy.',
    suitableFor: 'Those seeking to strengthen specific areas of life governed by particular planets. Ideal for home, office, or meditation spaces.',
  },
  Homa: {
    shortDesc: 'Sacred fire rituals that purify the environment, invoke divine blessings, and create powerful karmic merit through the offering of sacred substances.',
    whyHelp: 'Fire is the universal purifier and transformer. Homam rituals create a direct channel between the human realm and divine forces, allowing for the dissolution of negative karma and the invocation of specific blessings.',
    benefits: ['Purifies negative karma', 'Invokes specific divine blessings', 'Heals family and ancestral karma', 'Creates powerful positive energy', 'Addresses specific life challenges'],
    howItWorks: 'Specific herbs, ghee, and sacred substances are offered into consecrated fire while chanting specific mantras. The fire transforms these offerings into subtle energy that reaches the intended deities and planetary forces.',
    suitableFor: 'Those facing significant life challenges, seeking blessings for important events, or wishing to address deep karmic patterns. Particularly powerful during major Dasha transitions.',
  },
  Devata: {
    shortDesc: "Personal deity worship based on your birth chart. Your Ishta Devata is the divine form most aligned with your soul's journey in this lifetime.",
    whyHelp: "Every soul has a natural affinity with specific divine expressions. Worshipping your Ishta Devata creates a direct spiritual connection that supports your soul's evolution and provides divine protection and guidance.",
    benefits: ['Deep spiritual connection and guidance', 'Protection from negative influences', "Alignment with your soul's purpose", 'Inner peace and clarity', 'Accelerated spiritual growth'],
    howItWorks: 'Your Ishta Devata is determined by the Atmakaraka planet, 12th house lord, and 5th/9th house influences in your birth chart. Regular worship creates a resonance between your consciousness and the divine qualities of that deity.',
    suitableFor: 'All spiritual seekers. Particularly beneficial for those feeling disconnected from their spiritual path or seeking deeper meaning and purpose.',
  },
  Gemstones: {
    shortDesc: 'Planetary gemstones that act as cosmic lenses, focusing and amplifying specific planetary energies through their crystalline structure.',
    whyHelp: 'Gemstones are crystallized forms of specific planetary energies. When worn in contact with the skin, they create a continuous energetic influence that can strengthen beneficial planets or mitigate malefic ones.',
    benefits: ['Strengthens weak beneficial planets', 'Provides continuous planetary support', 'Enhances specific life areas', 'Creates protective energy field', 'Improves overall planetary balance'],
    howItWorks: 'Each gemstone resonates with a specific planetary frequency. When worn on the correct finger, in the correct metal, on the correct day, they create a sympathetic resonance with the corresponding planet in your birth chart.',
    suitableFor: 'Those with specific planetary weaknesses or those seeking to enhance particular life areas. Always requires individual chart analysis before recommendation.',
  },
  Rudraksha: {
    shortDesc: 'Sacred seeds of Lord Shiva, each with a specific number of natural facets (mukhis) that correspond to different divine energies and planetary influences.',
    whyHelp: 'Rudraksha beads have been used for thousands of years for their powerful healing and protective properties. Each mukhi carries specific divine energy that can address particular life challenges and spiritual needs.',
    benefits: ['Powerful spiritual protection', 'Healing of specific health conditions', 'Enhancement of meditation', 'Balancing of planetary energies', 'Spiritual evolution and clarity'],
    howItWorks: "Rudraksha beads contain specific electromagnetic properties that interact with the body's energy field. Different mukhis carry different divine frequencies that address specific planetary and life issues.",
    suitableFor: 'Spiritual practitioners, those seeking protection, and anyone wishing to address specific planetary imbalances. Safe for most people with proper guidance.',
  },
  Vastu: {
    shortDesc: 'The ancient science of sacred architecture that aligns your living and working spaces with cosmic energies for health, prosperity, and harmony.',
    whyHelp: 'Your home and workplace are extensions of your energy field. Vastu principles ensure that the cosmic energies flowing through your space support rather than hinder your life goals and wellbeing.',
    benefits: ['Improved health and vitality', 'Enhanced prosperity and career', 'Better relationships and harmony', 'Increased spiritual energy', 'Reduced stress and conflict'],
    howItWorks: 'Vastu works by aligning the five elements (earth, water, fire, air, space) in your environment according to cosmic principles. Proper placement of rooms, furniture, and objects creates optimal energy flow.',
    suitableFor: 'Anyone building, renovating, or wishing to improve their current living or working space. Particularly beneficial for those experiencing persistent challenges in specific life areas.',
  },
  'Dāna & Seva': {
    shortDesc: 'Vedic charitable giving and selfless service as a powerful remedy for karmic imbalances and planetary afflictions.',
    whyHelp: 'Dana (giving) and Seva (service) are among the most powerful karmic remedies. They directly address the root cause of planetary afflictions by creating positive karma and reducing the effects of past negative actions.',
    benefits: ['Reduces malefic planetary karma', 'Creates powerful positive merit', 'Improves overall life circumstances', 'Develops compassion and wisdom', 'Accelerates spiritual evolution'],
    howItWorks: 'Each planet governs specific types of charity and service. By giving the right items to the right recipients on the right days, you create a direct energetic exchange that mitigates planetary afflictions and strengthens beneficial influences.',
    suitableFor: 'Everyone. Dana and Seva are universal remedies that benefit all people regardless of their chart. Particularly powerful for those with afflicted planets or challenging Dasha periods.',
  },
};

export function getRemedyData(name: string): RemedyInfo {
  return DATA[name] ?? {
    shortDesc: 'A powerful Vedic remedy for planetary alignment and spiritual growth.',
    whyHelp: 'This remedy addresses specific planetary imbalances in your birth chart.',
    benefits: ['Planetary harmony', 'Spiritual growth', 'Life improvement'],
    howItWorks: 'Through ancient Vedic principles and practices.',
    suitableFor: 'Those seeking planetary remedies and spiritual guidance.',
  };
}

export const MANTRAS = [
  { planet: 'Sun', mantra: 'Om Hraam Hreem Hraum Sah Suryaya Namah', count: '108', time: 'Sunrise' },
  { planet: 'Moon', mantra: 'Om Shraam Shreem Shraum Sah Chandraya Namah', count: '108', time: 'Evening' },
  { planet: 'Mars', mantra: 'Om Kraam Kreem Kraum Sah Bhaumaya Namah', count: '108', time: 'Tuesday' },
  { planet: 'Mercury', mantra: 'Om Braam Breem Braum Sah Budhaya Namah', count: '108', time: 'Wednesday' },
  { planet: 'Jupiter', mantra: 'Om Graam Greem Graum Sah Gurave Namah', count: '108', time: 'Thursday' },
  { planet: 'Venus', mantra: 'Om Draam Dreem Draum Sah Shukraya Namah', count: '108', time: 'Friday' },
  { planet: 'Saturn', mantra: 'Om Praam Preem Praum Sah Shanaischaraya Namah', count: '108', time: 'Saturday' },
];
export const YANTRAS = [
  { name: 'Sri Yantra', purpose: 'Wealth & Prosperity', planet: 'Venus' },
  { name: 'Surya Yantra', purpose: 'Health & Vitality', planet: 'Sun' },
  { name: 'Shani Yantra', purpose: 'Career & Discipline', planet: 'Saturn' },
  { name: 'Kuber Yantra', purpose: 'Financial Growth', planet: 'Jupiter' },
];
export const HOMAS = [
  { name: 'Navagraha Shanti', purpose: 'Planetary harmony', day: 'Sunday', duration: '3-4 hours' },
  { name: 'Ganapathi Homam', purpose: 'Remove obstacles', day: 'Wednesday', duration: '2-3 hours' },
  { name: 'Sudarshana Homam', purpose: 'Protection & victory', day: 'Saturday', duration: '4-5 hours' },
  { name: 'Mrityunjaya Homam', purpose: 'Health & longevity', day: 'Monday', duration: '3-4 hours' },
  { name: 'Lakshmi Kubera Homam', purpose: 'Wealth & prosperity', day: 'Friday', duration: '3-4 hours' },
  { name: 'Ayush Homam', purpose: 'Long life & vitality', day: 'Birthday', duration: '2-3 hours' },
];
export const DEITIES = [
  { name: 'Lord Shiva', emoji: '🔱', planet: 'Saturn/Ketu', quality: 'Transformation' },
  { name: 'Lord Vishnu', emoji: '🪷', planet: 'Jupiter', quality: 'Preservation' },
  { name: 'Maa Durga', emoji: '⚔️', planet: 'Mars', quality: 'Strength' },
  { name: 'Lord Ganesha', emoji: '🐘', planet: 'Ketu', quality: 'Wisdom' },
  { name: 'Goddess Lakshmi', emoji: '🌸', planet: 'Venus', quality: 'Prosperity' },
  { name: 'Lord Hanuman', emoji: '🙏', planet: 'Mars/Saturn', quality: 'Devotion' },
];
export const GEMS = [
  { planet: 'Sun', gem: 'Ruby', metal: 'Gold', finger: 'Ring', day: 'Sunday' },
  { planet: 'Moon', gem: 'Pearl', metal: 'Silver', finger: 'Little', day: 'Monday' },
  { planet: 'Mars', gem: 'Red Coral', metal: 'Gold', finger: 'Ring', day: 'Tuesday' },
  { planet: 'Mercury', gem: 'Emerald', metal: 'Gold', finger: 'Little', day: 'Wednesday' },
  { planet: 'Jupiter', gem: 'Yellow Sapphire', metal: 'Gold', finger: 'Index', day: 'Thursday' },
  { planet: 'Venus', gem: 'Diamond', metal: 'Platinum', finger: 'Middle', day: 'Friday' },
  { planet: 'Saturn', gem: 'Blue Sapphire', metal: 'Silver', finger: 'Middle', day: 'Saturday' },
  { planet: 'Rahu', gem: 'Hessonite', metal: 'Silver', finger: 'Middle', day: 'Saturday' },
  { planet: 'Ketu', gem: "Cat's Eye", metal: 'Silver', finger: 'Ring', day: 'Tuesday' },
];
export const MUKHIS = [
  { mukhi: '1', deity: 'Lord Shiva', benefit: 'Moksha, spiritual liberation' },
  { mukhi: '2', deity: 'Ardhanarishvara', benefit: 'Unity, relationships' },
  { mukhi: '3', deity: 'Agni Dev', benefit: 'Self-confidence, creativity' },
  { mukhi: '4', deity: 'Lord Brahma', benefit: 'Knowledge, intelligence' },
  { mukhi: '5', deity: 'Kalagni Rudra', benefit: 'Health, peace of mind' },
  { mukhi: '6', deity: 'Lord Kartikeya', benefit: 'Willpower, focus' },
  { mukhi: '7', deity: 'Goddess Lakshmi', benefit: 'Wealth, prosperity' },
  { mukhi: '8', deity: 'Lord Ganesha', benefit: 'Remove obstacles' },
  { mukhi: '9', deity: 'Goddess Durga', benefit: 'Protection, energy' },
  { mukhi: '10', deity: 'Lord Vishnu', benefit: 'Peace, protection' },
  { mukhi: '11', deity: 'Lord Hanuman', benefit: 'Strength, devotion' },
  { mukhi: '12', deity: 'Lord Surya', benefit: 'Leadership, success' },
  { mukhi: '13', deity: 'Lord Indra', benefit: 'Fulfillment of desires' },
  { mukhi: '14', deity: 'Lord Shiva', benefit: 'Intuition, protection' },
];
export const VASTU_DIRECTIONS = [
  { dir: 'North', area: 'Career & Wealth', element: 'Water', deity: 'Kuber' },
  { dir: 'North-East', area: 'Spirituality', element: 'Water+Earth', deity: 'Ishaan' },
  { dir: 'East', area: 'Health & Growth', element: 'Wood', deity: 'Indra' },
  { dir: 'South-East', area: 'Kitchen & Fire', element: 'Fire', deity: 'Agni' },
  { dir: 'South', area: 'Fame & Reputation', element: 'Fire', deity: 'Yama' },
  { dir: 'South-West', area: 'Relationships', element: 'Earth', deity: 'Nairutya' },
  { dir: 'West', area: 'Creativity & Children', element: 'Metal', deity: 'Varuna' },
  { dir: 'North-West', area: 'Travel & Support', element: 'Metal+Air', deity: 'Vayu' },
];
export const CHARITIES = [
  { planet: 'Sun', donation: 'Wheat, jaggery, copper', day: 'Sunday', recipient: 'Temple or elderly' },
  { planet: 'Moon', donation: 'Rice, milk, silver', day: 'Monday', recipient: 'Women or children' },
  { planet: 'Mars', donation: 'Red lentils, copper', day: 'Tuesday', recipient: 'Soldiers or poor' },
  { planet: 'Mercury', donation: 'Green moong, books', day: 'Wednesday', recipient: 'Students' },
  { planet: 'Jupiter', donation: 'Yellow dal, gold', day: 'Thursday', recipient: 'Brahmins or teachers' },
  { planet: 'Venus', donation: 'White rice, silver', day: 'Friday', recipient: 'Young women' },
  { planet: 'Saturn', donation: 'Black sesame, iron', day: 'Saturday', recipient: 'Poor or disabled' },
];
