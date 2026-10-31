import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { AnimatedPressable } from '@/components/AnimatedBox';
import { AppIcon } from '@/components/AppIcon';
import { AppImage } from '@/components/AppImage';
import { lh, Text, TextInput } from '@/components/Text';
import { AppRoutes, go, push } from '@/navigation/routes';
import { useAuthStore } from '@/features/auth/authStore';
import { useCurrencyStore } from '@/services/currencyStore';
import {
  deductWalletBalance,
  getWalletBalance,
  rechargeWallet,
  subscribeWallet,
} from '@/services/walletService';
import { showSnackBar } from '@/components/overlays';
import { withAlpha } from '@/theme/colors';
import { useController } from '@/utils/anim';
import {
  sendLiveAIChatMessage,
} from '@/services/astrologyService';
import { AppLanguage, useLanguageStore, useTranslation } from '@/theme/languageStore';
import { useThemeColors } from '@/theme/themeStore';
import {
  speakAstrologerText,
  stopAstrologerSpeech,
} from '@/services/speechService';

export interface ChatMessage {
  isUser: boolean;
  text: string;
  time: string;
  recommendations?: string[];
  structured?: {
    conclusion?: string;
    timingWindow?: string;
    diagnosis?: {
      activeDasha?: string;
      keyHouses?: string;
      supportingFactors?: string[];
      contradictoryFactors?: string[];
    };
    whyAstroPariharSaysThis?: string[];
    confidence?: string;
    pariharProtocol?: any;
  };
  modelUsed?: string;
}

export const LANGUAGES = [
  { code: 'Telugu', label: 'తెలుగు', full: 'తెలుగు (Telugu)' },
  { code: 'Hindi', label: 'हिन्दी', full: 'हिन्दी (Hindi)' },
  { code: 'Tamil', label: 'தமிழ்', full: 'தமிழ் (Tamil)' },
  { code: 'Kannada', label: 'ಕನ್ನಡ', full: 'ಕನ್ನಡ (Kannada)' },
  { code: 'Malayalam', label: 'മലയാളം', full: 'മലയാളം (Malayalam)' },
  { code: 'English', label: 'English', full: 'English (EN)' },
];

export const AI_MODELS = [
  { id: 'auto', name: 'Auto (Recommended)', icon: '⚡', desc: 'Optimal Astrological Synthesis & Fast Calculations' },
  { id: 'vedika-ai', name: 'Vedic Ephemeris AI', icon: '🔮', desc: 'High-Precision Vedic Ephemeris & Kundli Calculations' },
  { id: 'openai-gpt4o', name: 'Deep Synthesis AI', icon: '🧠', desc: 'Deep Astrological Synthesis & Sacred Counsel' },
];

export const ASTROLOGER_PERSONAS = [
  { id: 'acharya-devavrat', name: 'Acharya Devavrat (AI)', title: 'Vedic Grandmaster & Dasha Guru', emoji: '🧘‍♂️', color: '#C9A84C' },
  { id: 'vedika', name: 'AstroParihar AI', title: 'Autonomous Vedic Ephemeris Engine', emoji: '🔮', color: '#9370DB' },
  { id: 'guru-brihaspati', name: 'Guru Brihaspati (AI)', title: 'Celestial Wisdom & Higher Dharma Guide', emoji: '🕉️', color: '#FF9800' },
  { id: 'astro-ananya', name: 'Astro Ananya (AI)', title: 'Nadi & Kundli Seer', emoji: '🌸', color: '#E91E63' },
  { id: 'arjun-pandit', name: 'Arjun Pandit (AI)', title: 'Vedic Kundli Prodigy', emoji: '✨', color: '#2196F3' },
  { id: 'ratna-vidya', name: 'Ratna Vidya AI', title: 'Planetary Gem Resonance Specialist', emoji: '💎', color: '#4CAF50' },
];

const QUICK_PROMPTS_BY_LANG: Record<string, string[]> = {
  Telugu: [
    '🕉️ మంత్ర పరిహారం: నా గ్రహ శాంతికి ఏ నిత్య వేద మంత్రం & జప విధానం పాటించాలి?',
    '⬡ యంత్ర పరిహారం: దోష నివారణ మరియు సంపద కోసం ఏ సిద్ధి యంత్రాన్ని ఇంట్లో పూజించాలి?',
    '🔥 హోమ పరిహారం: నా జన్మ కుండలి శుద్ధికి ఏ పవిత్ర వైదిక హోమం లేదా హవనం చేయించాలి?',
    '🪔 ఇష్ట దేవత: నా ఇష్ట దేవత & కులదైవం ఎవరు? ఏ పుణ్యక్షేత్ర దర్శనం చేయాలి?',
    '💎 రత్న ధారణ: నా జాతక బలానికి ఏ భాగ్య రత్నం (Ratna) & లోహం ధరించాలి?',
    '📿 రుద్రాక్ష పరిహారం: నా నక్షత్రం, ఆరోగ్యం & మానసిక శాంతికి ఏ ముఖి రుద్రాక్ష అనుకూలం?',
    '🏠 వాస్తు పరిహారం: నా గృహం లేదా వ్యాపారంలో దోష నివారణకు ఏ వాస్తు పరిహారాలు చేయాలి?',
    '🤲 దానం & సేవ: కర్మ దోష విముక్తికి ఏ విధమైన దానం మరియు సేవ చేయాలి?',
  ],
  Hindi: [
    '🕉️ मंत्र परिहार: ग्रह शांति और आत्मिक बल हेतु मुझे कौन सा दैनिक वैदिक मंत्र जपना चाहिए?',
    '⬡ यंत्र परिहार: घर में सुख-समृद्धि एवं दोष निवारण हेतु कौन सा सिद्ध यंत्र स्थापित करें?',
    '🔥 होम परिहार: जन्म पत्रिका के ग्रह दोष शांति हेतु कौन सा वैदिक हवन/होम अनुष्ठान करवाएं?',
    '🪔 इष्ट देवता: मेरी कुंडली के अनुसार मेरे इष्ट देव कौन हैं और कौन सा तीर्थ परिहार करें?',
    '💎 रत्न धारण: कुंडली के शुभ ग्रहों को बल देने हेतु कौन सा भाग्यशाली रत्न व धातु धारण करें?',
    '📿 रुद्राक्ष परिहार: मेरे नक्षत्र, आरोग्य एवं मानसिक शांति हेतु कौन सा मुखी रुद्राक्ष शुभ है?',
    '🏠 वास्तु परिहार: घर और कार्यक्षेत्र में सकारात्मक ऊर्जा हेतु कौन से वास्तु उपाय करें?',
    '🤲 दान एवं सेवा: कर्म दोष निवारण एवं पुण्य फल प्राप्ति हेतु क्या दान व सेवा करनी चाहिए?',
  ],
  Tamil: [
    '🕉️ மந்திர பரிகாரம்: கிரக தோஷ நிவர்த்திக்கு நான் தினமும் ஜபிக்க வேண்டிய வேத மந்திரம் எது?',
    '⬡ எந்திர பரிகாரம்: வீட்டில் தோஷங்களை நீக்கி நலம் பெற எந்த சக்திவாய்ந்த எந்திரத்தை நிறுவ வேண்டும்?',
    '🔥 ஹோம பரிகாரம்: எனது ஜாதக தோஷ பரிகாரத்திற்கு எந்த புனித ஹோமம் செய்ய வேண்டும்?',
    '🪔 இஷ்ட தெய்வம்: எனது இஷ்ட தெய்வம் மற்றும் குலதெய்வம் யார்? எந்த கோவில் பரிகாரம் செய்ய வேண்டும்?',
    '💎 ரத்தின பரிகாரம்: எனது ஜாதகத்திற்கு அதிர்ஷ்டம் தரும் ராசிக் கல் மற்றும் உலோகம் எது?',
    '📿 ருத்ராட்ச பரிகாரம்: எனது நட்சத்திரம் மற்றும் ஆரோக்கியத்திற்கு உகந்த முக ருத்ராட்சம் எது?',
    '🏠 வாஸ்து பரிகாரம்: வீட்டில் நேர்மறை ஆற்றலை அதிகரிக்க என்ன வாஸ்து பரிகாரங்கள் செய்ய வேண்டும்?',
    '🤲 தானம் & சேவை: கர்ம வினைகள் நீங்க நான் செய்ய வேண்டிய முக்கிய தானங்கள் மற்றும் சேவைகள் என்ன?',
  ],
  Kannada: [
    '🕉️ ಮಂತ್ರ ಪರಿಹಾರ: ಗ್ರಹ ಶಾಂತಿಗಾಗಿ ನಾನು ನಿತ್ಯ ಜಪಿಸಬೇಕಾದ ವೈದಿಕ ಮಂತ್ರ ಯಾವುದು?',
    '⬡ ಯಂತ್ರ ಪರಿಹಾರ: ದೋಷ ನಿವಾರಣೆ ಮತ್ತು ಸಮೃದ್ಧಿಗಾಗಿ ಮನೆಯಲ್ಲಿ ಯಾವ ಸಿದ್ಧ ಯಂತ್ರ ಸ್ಥಾಪಿಸಬೇಕು?',
    '🔥 ಹೋಮ ಪರಿಹಾರ: ಕುಂಡಲಿ ದೋಷ ನಿವಾರಣೆಗೆ ಯಾವ ಪವಿತ್ರ ಹೋಮ/ಹವನ ಮಾಡಿಸಬೇಕು?',
    '🪔 ಇಷ್ಟ ದೇವತೆ: ನನ್ನ ಇಷ್ಟ ದೇವತೆ ಯಾರು ಮತ್ತು ಯಾವ ಪುಣ್ಯಕ್ಷೇತ್ರ ಪರಿಹಾರ ದರ್ಶಿಸಬೇಕು?',
    '💎 ರತ್ನ ಧಾರಣೆ: ನನ್ನ ಜನ್ಮ ಕುಂಡಲಿಗೆ ಶುಭ ನೀಡುವ ಅದೃಷ್ಟ ರತ್ನ ಮತ್ತು ಲೋಹ ಯಾವುದು?',
    '📿 ರುದ್ರಾಕ್ಷಿ ಪರಿಹಾರ: ನನ್ನ ನಕ್ಷತ್ರ ಮತ್ತು ಆರೋಗ್ಯಕ್ಕೆ ಯಾವ ಮುಖಿ ರುದ್ರಾಕ್ಷಿ ಧರಿಸಬೇಕು?',
    '🏠 ವಾಸ್ತು ಪರಿಹಾರ: ಮನೆ ಮತ್ತು ಕಾರ್ಯಸ್ಥಳದಲ್ಲಿ ಸುಖ-ಶಾಂತಿಗೆ ಯಾವ ವಾಸ್ತು ಪರಿಹಾರ ಮಾಡಬೇಕು?',
    '🤲 ದಾನ & ಸೇವೆ: ಕರ್ಮ ದೋಷ ಪರಿಹಾರಕ್ಕೆ ಯಾವ ವಿಶೇಷ ದಾನ ಮತ್ತು ಸೇವೆ ಮಾಡಬೇಕು?',
  ],
  Malayalam: [
    '🕉️ മന്ത്ര പരിഹാരം: ഗ്രഹദോഷ ശാന്തിക്കായി ഞാൻ നിത്യവും ജപിക്കേണ്ട വേദ മന്ത്രം ഏതാണ്?',
    '⬡ യന്ത്ര പരിഹാരം: ഗൃഹദോഷങ്ങൾ നീക്കി ഐശ്വര്യം വരാൻ ഏത് യന്ത്രമാണ് പ്രതിഷ്ഠിക്കേണ്ടത്?',
    '🔥 ഹോമ പരിഹാരം: ജാതക ദോഷ പരിഹാരത്തിനായി ചെയ്യേണ്ട വിശുദ്ധ ഹോമം ഏതാണ്?',
    '🪔 ഇഷ്ടദേവത: എന്റെ ഇഷ്ടദേവതയും കുലദേവതയും ആരാണ്? ഏത് ക്ഷേത്ര പരിഹാരമാണ് വേണ്ടത്?',
    '💎 രത്ന ധാരണം: എന്റെ കുണ്ഡലിക്ക് അനുയോജ്യമായ ഭാഗ്യ രത്നവും ലോഹവും ഏതാണ്?',
    '📿 രുദ്രാക്ഷ പരിഹാരം: എന്റെ നക്ഷത്രത്തിനും ആരോഗ്യത്തിനും ഉചിതമായ മുഖി രുദ്രാക്ഷം ഏതാണ്?',
    '🏠 വാസ്തു പരിഹാരം: വീട്ടിലെ ഊർജ്ജ സന്തുലനത്തിനായി എന്തെല്ലാം വാസ്തു പരിഹാരങ്ങൾ ചെയ്യണം?',
    '🤲 ദാനം & സേവ: കർമ്മദോഷ നിവാരണത്തിനായി എന്തെല്ലാം ദാനങ്ങളും സേവകളുമാണ് ചെയ്യേണ്ടത്?',
  ],
  English: [
    '🕉️ Mantra: What daily Vedic mantra & Japa protocol should I chant for planetary peace?',
    '⬡ Yantra: Which energized Yantra should I install at home to remove doshas & attract prosperity?',
    '🔥 Homa: Which sacred Vedic Homa (Navagraha/Ganapathi/Chandi) is recommended for my chart?',
    '🪔 Ishta Devata: Who is my Ishta Devata & Kuladevata, and which temple pariharam should I visit?',
    '💎 Gemstone: Which lucky Ratna (gemstone) and metal should I wear according to my Kundli?',
    '📿 Rudraksha: Which Mukhi Rudraksha is most auspicious for my nakshatra, health & mind?',
    '🏠 Vastu: What Vastu dosha remedies should I apply to balance energy in my living space?',
    '🤲 Dana & Seva: What specific charity (food, clothes, grains) should I perform for karmic balance?',
  ],
};

const PLACEHOLDERS_BY_LANG: Record<string, string> = {
  Telugu: 'మీ కుండలి, ప్రేమ, కెరీర్ లేదా పరిహారాల గురించి అడగండి...',
  Hindi: 'अपनी कुंडली, प्रेम, करियर या उपायों के बारे में पूछें...',
  Tamil: 'உங்கள் ஜாதகம், தொழில், திருமணம் அல்லது பரிகாரங்கள் பற்றி கேளுங்கள்...',
  Kannada: 'ನಿಮ್ಮ ಕುಂಡಲಿ, ಪ್ರೀತಿ, ವೃತ್ತಿ ಅಥವಾ ಪರಿಹಾರಗಳ ಬಗ್ಗೆ ಕೇಳಿ...',
  Malayalam: 'നിങ്ങളുടെ ജാതകം, പ്രണയം, കരിയർ അല്ലെങ്കിൽ പരിഹാരങ്ങളെക്കുറിച്ച് ചോദിക്കുക...',
  English: 'Ask about your Kundli, love, career, or remedies...',
};

function getWelcomeMessage(lang: string, name: string, astroName: string = 'Acharya Devavrat') {
  const currentYear = new Date().getFullYear();
  if (lang === 'Telugu') {
    return {
      content: `**నమస్కారం మరియు శుభాశీస్సులు, ${name}!** 🙏\n\nనేను **${astroName}**, మీ వ్యక్తిగత వేద జ్యోతిష్య మార్గదర్శకుడిని. ${currentYear} సంవత్సరానికి సంబంధించి మీ **కుండలి, కెరీర్, వివాహం, ఆర్థిక స్థితి లేదా వేద పరిహారాల** గురించి ఏదైనా అడగండి. ఈరోజు మీకు ఎలా సహాయపడగలను?`,
      recommendations: QUICK_PROMPTS_BY_LANG.Telugu,
    };
  }
  if (lang === 'Hindi') {
    return {
      content: `**नमस्ते एवं आशीर्वाद, ${name}!** 🙏\n\nमैं **${astroName}** हूँ, आपका व्यक्तिगत वैदिक ज्योतिषी एवं आध्यात्मिक मार्गदर्शक। वर्ष ${currentYear} के लिए अपनी **कुंडली, करियर, विवाह, धन या वैदिक उपायों** के बारे में कोई भी प्रश्न पूछें। आज मैं आपका किस प्रकार मार्गदर्शन करूँ?`,
      recommendations: QUICK_PROMPTS_BY_LANG.Hindi,
    };
  }
  if (lang === 'Tamil') {
    return {
      content: `**வணக்கம் மற்றும் ஆசிகள், ${name}!** 🙏\n\nநான் **${astroName}**, உங்கள் தனிப்பட்ட வேத ஜோதிடர் மற்றும் ஆன்மீக வழிகாட்டி. ${currentYear} ஆம் ஆண்டிற்கான உங்கள் **ஜாதகம், தொழில், திருமணம் அல்லது பரிகாரங்கள்** பற்றி என்னிடம் கேளுங்கள். இன்று உங்களுக்கு எவ்வாறு உதவ முடியும்?`,
      recommendations: QUICK_PROMPTS_BY_LANG.Tamil,
    };
  }
  if (lang === 'Kannada') {
    return {
      content: `**ನಮಸ್ಕಾರ ಮತ್ತು ಶುಭಾಶೀರ್ವಾದಗಳು, ${name}!** 🙏\n\nನಾನು **${astroName}**, ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ವೈದಿಕ ಜ್ಯೋತಿಷಿ ಮತ್ತು ಆಧ್ಯಾತ್ಮಿಕ ಮಾರ್ಗದರ್ಶಕ. ${currentYear} ವರ್ಷಕ್ಕೆ ಸಂಬಂಧಿಸಿದ ನಿಮ್ಮ **ಕುಂಡಲಿ, ವೃತ್ತಿ, ವಿವಾಹ ಅಥವಾ ಪರಿಹಾರಗಳ** ಬಗ್ಗೆ ಕೇಳಿ. ಇಂದು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?`,
      recommendations: QUICK_PROMPTS_BY_LANG.Kannada,
    };
  }
  if (lang === 'Malayalam') {
    return {
      content: `**നമസ്കാരം, അനുഗ്രഹങ്ങൾ, ${name}!** 🙏\n\nഞാൻ **${astroName}**, നിങ്ങളുടെ വ്യക്തിഗത വൈദിക ജ്യോതിഷിയും ആത്മീയ വഴികാട്ടിയും. ${currentYear} വർഷത്തെ നിങ്ങളുടെ **ജാതകം, തൊഴിൽ, വിവാഹം അല്ലെങ്കിൽ പരിഹാരങ്ങൾ** സംബന്ധിച്ച് എന്തും ചോദിക്കാം. ഇന്ന് ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കണം?`,
      recommendations: QUICK_PROMPTS_BY_LANG.Malayalam,
    };
  }
  return {
    content: `**Namaste and blessings, ${name}!** 🙏\n\nI am **${astroName}**, your personal Vedic Astrologer & spiritual guide. Ask me any question about your **Kundli, career, marriage, finances, planetary dashas, or daily remedies** for ${currentYear}. How may I guide your chart today?`,
    recommendations: QUICK_PROMPTS_BY_LANG.English,
  };
}

export function currentTime(now = new Date()) {
  const h = now.getHours() > 12 ? now.getHours() - 12 : now.getHours() || 12;
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
}

function approxCos(a: number): number {
  return a < 1.57 ? 1 - (a * a) / 2 : a < 3.14 ? (-(a - 3.14) * (a - 3.14)) / 2 + 1 - 1 : ((a - 3.14) * (a - 3.14)) / 2 - 1;
}
const approxSin = (a: number) => approxCos(a - 1.5708);

const WHATSAPP_DOODLE_EMOJIS = [
  '✨', '🌙', '🔮', '🕉️', '☀️', '🪐', '🪷', '⭐', '🔔', '🌿',
  '🕯️', '🌸', '🕊️', '📜', '💎', '☕', '💬', '🎵', '💖', '🔆',
  '🌟', '🧘', '☸️', '📿', '🎯', '🌞', '🌌', '🪄', '☁️', '🌺',
  '⏳', '🔭', '🌈', '💫', '📖', '🍵', '🍂', '🌻', '🧿', '🍀',
  '🔥', '🌊', '🪔', '🛡️', '🎶', '💌', '🧭', '🌠',
];

function WhatsAppBackground() {
  const { width, height } = useWindowDimensions();

  // WhatsApp-style scattered doodle emojis
  const doodleItems = useMemo(() => {
    const colSpacing = 48;
    const rowSpacing = 52;
    const cols = Math.ceil(width / colSpacing) + 2;
    const rows = Math.ceil(height / rowSpacing) + 2;
    const items: {
      id: string;
      emoji: string;
      x: number;
      y: number;
      rotation: string;
      size: number;
      opacity: number;
    }[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const seed = r * 19 + c * 31;
        const emojiIndex = (seed + (r % 7) * 5) % WHATSAPP_DOODLE_EMOJIS.length;
        const emoji = WHATSAPP_DOODLE_EMOJIS[emojiIndex];
        const staggerX = r % 2 === 1 ? colSpacing * 0.5 : 0;
        const jitterX = (seed % 7) - 3;
        const jitterY = ((seed * 3) % 7) - 3;
        const x = c * colSpacing + staggerX + jitterX - 8;
        const y = r * rowSpacing + jitterY - 8;
        const rotation = `${((seed * 11) % 46) - 23}deg`;
        const size = 15 + (seed % 5);
        const opacity = 0.085 + ((seed % 4) * 0.01); // 0.085 to 0.115 subtle watermark opacity

        items.push({
          id: `d_${r}_${c}`,
          emoji,
          x,
          y,
          rotation,
          size,
          opacity,
        });
      }
    }
    return items;
  }, [width, height]);

  // Subtle micro constellation lines & dots between doodles
  const { lines, dots } = useMemo(() => {
    const spacing = 72;
    let l = '';
    let d = '';
    for (let x = 0; x < width + spacing; x += spacing) {
      for (let y0 = 0; y0 < height + spacing; y0 += spacing) {
        const y = y0 + (Math.floor(x / spacing) % 2 === 0 ? 36 : 0);
        const r = 5;
        for (let i = 0; i < 4; i++) {
          const angle = (i * 90 * 3.14159) / 180;
          l += `M${x} ${y}L${x + r * approxCos(angle)} ${y + r * approxSin(angle)}`;
        }
        d += `M${x - 1.5} ${y}a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0`;
      }
    }
    return { lines: l, dots: d };
  }, [width, height]);

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
      }}
    >
      {/* WhatsApp parchment beige base */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#EFE7DE' }} />

      {/* Subtle micro constellation lines */}
      <Svg width={width} height={height} style={{ position: 'absolute' }} pointerEvents="none">
        <Path d={lines} stroke="#D4C9B8" strokeWidth={0.8} fill="none" opacity={0.3} />
        <Path d={dots} fill="#D4C9B8" opacity={0.35} />
      </Svg>

      {/* Scattered WhatsApp doodle emojis wallpaper */}
      {doodleItems.map((item) => (
        <Text
          key={item.id}
          style={{
            position: 'absolute',
            left: item.x,
            top: item.y,
            fontSize: item.size,
            opacity: item.opacity,
            transform: [{ rotate: item.rotation }],
          }}
        >
          {item.emoji}
        </Text>
      ))}
    </View>
  );
}

function TypingIndicator() {
  const ctl = useController({ duration: 900, repeat: true, autoStart: true });
  return (
    <View style={{ paddingBottom: 8, paddingLeft: 4, flexDirection: 'row', alignItems: 'flex-end' }} testID="aiChat.typing">
      <View style={{ width: 28, height: 28, borderRadius: 14, marginRight: 4, backgroundColor: '#8B1A1A', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 13 }}>🔮</Text>
      </View>
      <View style={{ paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FFFFFF', borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomLeftRadius: 2, borderBottomRightRadius: 8, flexDirection: 'row', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
        {[0, 1, 2].map((i) => {
          const t = Math.min(1, Math.max(0, ctl.value - i * 0.33));
          const bounce = t < 0.5 ? t * 2 : (1 - t) * 2;
          return <View key={i} style={{ marginHorizontal: 2, width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#8A8A8A', transform: [{ translateY: -bounce * 5 }] }} />;
        })}
      </View>
    </View>
  );
}

function StructuredAnalysisCard({ structured }: { structured: ChatMessage['structured'] }) {
  const [expanded, setExpanded] = useState(false);
  if (!structured) return null;

  return (
    <View style={{ marginTop: 8, borderRadius: 12, backgroundColor: '#FAF7F2', borderWidth: 1, borderColor: '#C9A84C', padding: 10 }}>
      {structured.timingWindow ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ fontSize: 13 }}>📅</Text>
          <Text style={{ marginLeft: 6, color: '#8B1A1A', fontSize: 12, fontWeight: '700' }}>
            {structured.timingWindow}
          </Text>
        </View>
      ) : null}

      {structured.conclusion ? (
        <View style={{ padding: 8, borderRadius: 8, backgroundColor: 'rgba(201,168,76,0.15)', marginBottom: 6 }}>
          <Text style={{ color: '#5A3D0B', fontSize: 12, fontWeight: '600' }}>
            {structured.conclusion}
          </Text>
        </View>
      ) : null}

      {structured.diagnosis?.activeDasha ? (
        <Text style={{ color: '#4A5568', fontSize: 11, marginBottom: 4 }}>
          ✦ Active Dasha: <Text style={{ fontWeight: '700', color: '#1A1A1A' }}>{structured.diagnosis.activeDasha}</Text>
        </Text>
      ) : null}

      <Pressable onPress={() => setExpanded((e) => !e)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
        <Text style={{ color: '#8B1A1A', fontSize: 11, fontWeight: '600' }}>
          {expanded ? '▲ Hide Astrological Evidence' : '▼ View Astrological Basis'}
        </Text>
      </Pressable>

      {expanded && structured.whyAstroPariharSaysThis?.length ? (
        <View style={{ marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#E2D9C8' }}>
          {structured.whyAstroPariharSaysThis.map((pt, i) => (
            <Text key={i} style={{ color: '#4A5568', marginBottom: 3, ...lh(11, 1.4) }}>
              • {pt}
            </Text>
          ))}
          {structured.pariharProtocol?.recommendedHomam ? (
            <View style={{ marginTop: 6, padding: 6, borderRadius: 6, backgroundColor: '#FFF2E0' }}>
              <Text style={{ color: '#D97706', fontSize: 11, fontWeight: '700' }}>
                🕉️ Recommended Homam: {structured.pariharProtocol.recommendedHomam}
              </Text>
              <Text style={{ color: '#78350F', fontSize: 10, marginTop: 2 }}>
                Mantra: {structured.pariharProtocol.dailyMantra}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function Bubble({
  msg,
  index,
  onPromptTap,
  onVoiceTap,
  isSpeaking,
}: {
  msg: ChatMessage;
  index: number;
  onPromptTap: (s: string) => void;
  onVoiceTap?: (text: string, index: number) => void;
  isSpeaking?: boolean;
}) {
  const { width } = useWindowDimensions();
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(Math.min(180, Math.max(0, index * 25)), withTiming(1, { duration: 280 }));
  }, [index, p]);
  const maxW = width * 0.82;
  const anim = useAnimatedStyle(() => {
    const slide = 1 - Math.pow(1 - p.value, 3);
    const fade = 1 - (1 - p.value) * (1 - p.value);
    return { opacity: fade, transform: [{ translateX: (1 - slide) * (msg.isUser ? 0.06 : -0.06) * width }] };
  });
  const bg = msg.isUser ? '#D9FDD3' : '#FFFFFF';

  return (
    <Animated.View style={[{ marginBottom: 10, flexDirection: 'row', alignItems: 'flex-end', justifyContent: msg.isUser ? 'flex-end' : 'flex-start' }, anim]}>
      {!msg.isUser ? (
        <View style={{ width: 28, height: 28, borderRadius: 14, marginRight: 4, marginBottom: 2, borderWidth: 1, borderColor: '#C9A84C', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
          <LinearGradient colors={['#8B1A1A', '#3D0A0A']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
          <Text style={{ fontSize: 13 }}>🔮</Text>
        </View>
      ) : null}
      <View style={{ maxWidth: maxW, flexShrink: 1 }}>
        <View
          style={{
            paddingLeft: 12, paddingRight: 12, paddingTop: 9, paddingBottom: 22, backgroundColor: bg,
            borderTopLeftRadius: 12, borderTopRightRadius: 12, borderBottomLeftRadius: msg.isUser ? 12 : 2, borderBottomRightRadius: msg.isUser ? 2 : 12,
            shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1,
            borderWidth: 0.5, borderColor: msg.isUser ? 'rgba(0,128,105,0.15)' : 'rgba(0,0,0,0.06)',
          }}
        >
          {!msg.isUser ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: '#008069', fontSize: 12, fontWeight: '700' }}>
                {msg.modelUsed || 'AstroParihar AI'}
              </Text>
              <Pressable
                testID={`aiChat.voice.${index}`}
                onPress={() => onVoiceTap?.(msg.text, index)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 12,
                  backgroundColor: isSpeaking ? 'rgba(201,168,76,0.25)' : 'rgba(0,128,105,0.08)',
                  borderWidth: 1,
                  borderColor: isSpeaking ? '#C9A84C' : 'rgba(0,128,105,0.2)',
                }}
              >
                <AppIcon
                  name={isSpeaking ? 'stop_circle_rounded' : 'volume_up_rounded'}
                  size={13}
                  color={isSpeaking ? '#C9A84C' : '#008069'}
                />
                <Text style={{ marginLeft: 3, color: isSpeaking ? '#C9A84C' : '#008069', fontSize: 10, fontWeight: '700' }}>
                  {isSpeaking ? 'Stop' : 'Listen'}
                </Text>
              </Pressable>
            </View>
          ) : null}

          <Text style={{ color: '#111B21', ...lh(14, 1.48) }}>{msg.text}</Text>

          {msg.structured ? <StructuredAnalysisCard structured={msg.structured} /> : null}

          <View style={{ position: 'absolute', bottom: 4, right: 8, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: '#667781', fontSize: 10 }}>{msg.time}</Text>
            {msg.isUser ? <AppIcon name="done_all" size={14} color="#53BDEB" style={{ marginLeft: 3 }} /> : null}
          </View>
        </View>

        {!msg.isUser && msg.recommendations && msg.recommendations.length > 0 ? (
          <View style={{ marginTop: 8, gap: 7 }}>
            {msg.recommendations.map((rec, rIdx) => (
              <Pressable
                key={rIdx}
                onPress={() => onPromptTap(rec)}
                style={({ pressed }) => ({
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: 20,
                backgroundColor: '#FFFFFF',
                borderWidth: 1.2,
                borderColor: '#C9A84C',
                shadowColor: '#C9A84C',
                shadowOpacity: 0.06,
                shadowRadius: 3,
                elevation: 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
              >
                <Text style={{ color: '#4A320A', fontSize: 12.5, fontWeight: '600', lineHeight: 18 }}>{rec}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
      {msg.isUser ? <View style={{ width: 4 }} /> : null}
    </Animated.View>
  );
}

export interface TopicItem {
  id: string;
  label: string;
  emoji: string;
  promptByLang: Record<string, string>;
}

export const TOPICS: TopicItem[] = [
  {
    id: 'All',
    label: 'All',
    emoji: '🌐',
    promptByLang: {},
  },
  {
    id: 'Remedies',
    label: 'Remedies',
    emoji: '🕉️',
    promptByLang: {
      Telugu: 'నమస్కారం, నా జన్మ కుండలిని పరిశీలించి గ్రహ దోష నివారణకు తగిన అష్ట పరిహారాలు, నిత్య మంత్రాలు, మరియు రత్న ధారణ పూజా విధానాలు సూచించండి.',
      Hindi: 'नमस्ते, कृपया मेरी जन्म पत्रिका का विश्लेषण कर ग्रह शांति हेतु अनुकूल वैदिक उपाय (अष्ट परिहार), रत्न, सिद्ध मंत्र एवं दान विधान बताएं।',
      Tamil: 'வணக்கம், எனது ஜாதகத்தை ஆய்வு செய்து அஷ்ட பரிகாரங்கள், கிரக தோஷ நிவர்த்தி மந்திரங்கள் மற்றும் எளிய பரிகார முறைகளை பரிந்துரைக்கவும்.',
      Kannada: 'ನಮಸ್ಕಾರ, ನನ್ನ ಜನ್ಮ ಕುಂಡಲಿಯನ್ನು ಪರಿಶೀಲಿಸಿ ಗ್ರಹ ದೋಷ ಶಾಂತಿಗೆ ಸೂಕ್ತ ಅಷ್ಟ ಪರಿಹಾರಗಳು, ಮಂತ್ರಗಳು ಮತ್ತು ದಾನ ವಿಧಾನಗಳನ್ನು ತಿಳಿಸಿ.',
      Malayalam: 'നമസ്കാരം, എന്റെ ജാതകം പരിശോധിച്ച് ഗ്രഹദോഷ ശാന്തിക്ക് അനുയോജ്യമായ അഷ്ട പരിഹാരങ്ങളും മന്ത്രങ്ങളും നിർദ്ദേശിക്കുക.',
      English: 'Namaste, please analyze my birth chart and prescribe personalized Vedic remedies (Ashta Parihar, planetary mantras, gemstone, and puja rituals) to pacify afflictions and strengthen benefic planets.',
    },
  },
  {
    id: 'Career',
    label: 'Career',
    emoji: '💼',
    promptByLang: {
      Telugu: 'నా జాతకంలో 10వ భావం మరియు ప్రస్తుతం నడుస్తున్న దశ ఆధారంగా ఉద్యోగ మార్పు, ప్రమోషన్ మరియు కెరీర్ పురోగతి ఎలా ఉందో చెప్పండి.',
      Hindi: 'मेरी कुंडली के 10वें भाव और वर्तमान महादशा के आधार पर करियर उन्नति, पदोन्नति अथवा नौकरी परिवर्तन का शुभ समय बताएं।',
      Tamil: 'எனது ஜாதகத்தில் 10-ஆம் வீடு மற்றும் தற்போதைய தசா புத்தியின்படி தொழில் வளர்ச்சி, வேலை மாற்றம் எப்போது சாத்தியமாகும்?',
      Kannada: 'ನನ್ನ ಕುಂಡಲಿಯ 10ನೇ ಸ್ಥಾನ ಮತ್ತು ದಶಾ ಕಾಲದ ಪ್ರಕಾರ ವೃತ್ತಿ ಪ್ರಗತಿ, ಬಡ್ತಿ ಅಥವಾ ಉದ್ಯೋಗ ಬದಲಾವಣೆಗೆ ಸೂಕ್ತ ಸಮಯ ತಿಳಿಸಿ.',
      Malayalam: 'എന്റെ ജാതകത്തിലെ പത്താം ഭാവം പരിശോധിച്ച് ജോലി മാറ്റം, പ്രമോഷൻ, തൊഴിൽ വളർച്ച എന്നിവയെക്കുറിച്ച് വ്യക്തമാക്കുക.',
      English: 'Please analyze my 10th house and active planetary dasha for career growth, job change, promotion, and professional milestones.',
    },
  },
  {
    id: 'Love',
    label: 'Love',
    emoji: '❤️',
    promptByLang: {
      Telugu: 'నా జాతకంలో 5వ మరియు 7వ స్థానాల ఆధారంగా ప్రేమ సంబంధాలు, అనుకూలత మరియు భవిష్యత్ దాంపత్య జీవితం ఎలా ఉంటుందో విశ్లేషించండి.',
      Hindi: 'मेरी जन्म कुंडली के 5वें और 7वें भाव के अनुसार प्रेम संबंध, अनुकूलता और भविष्य के रिश्ते की स्थिति का विश्लेषण करें।',
      Tamil: 'எனது ஜாதகத்தில் 5 மற்றும் 7-ஆம் வீடுகளின் அடிப்படையில் காதல் உறவு, ஒற்றுமை மற்றும் எதிர்காலம் குறித்து விளக்கவும்.',
      Kannada: 'ನನ್ನ ಜನ್ಮ ಕುಂಡಲಿಯ 5 ಮತ್ತು 7ನೇ ಸ್ಥಾನಗಳ ಪ್ರಕಾರ ಪ್ರೇಮ ಸಂಬಂಧಗಳು, ಹೊಂದಾಣಿಕೆ ಮತ್ತು ಭವಿಷ್ಯದ ಬಗ್ಗೆ ವಿಶ್ಲೇಷಿಸಿ.',
      Malayalam: 'എന്റെ ജാതകത്തിലെ 5, 7 ഭാവങ്ങളുടെ അടിസ്ഥാനത്തിൽ പ്രണയ ബന്ധങ്ങളും അനുയോജ്യതയും വിശകലനം ചെയ്യുക.',
      English: 'Please analyze my 5th and 7th houses for love life, relationship compatibility, emotional harmony, and romantic prospects.',
    },
  },
  {
    id: 'Marriage',
    label: 'Marriage',
    emoji: '💍',
    promptByLang: {
      Telugu: 'నా జాతకంలో వివాహ యోగం ఎప్పుడు ఉంది? 7వ స్థానం ప్రకారం నా జీవిత భాగస్వామి స్వభావం మరియు వైవాహిక జీవితం ఎలా ఉంటుంది?',
      Hindi: 'मेरी कुंडली में विवाह का शुभ योग कब बनेगा? 7वें भाव के अनुसार जीवनसाथी का स्वरूप एवं दांपत्य जीवन कैसा रहेगा?',
      Tamil: 'எனக்கு திருமண யோகம் எப்போது கூடிவரும்? 7-ஆம் பாவத்தின்படி எனது வாழ்க்கை துணைவர் மற்றும் இல்லற வாழ்க்கை எவ்வாறு அமையும்?',
      Kannada: 'ನನ್ನ ಜಾತಕದಲ್ಲಿ ವಿವಾಹ ಯೋಗ ಯಾವಾಗ ಬರುತ್ತದೆ? 7ನೇ ಸ್ಥಾನದ ಪ್ರಕಾರ ನನ್ನ ಜೀವನ ಸಂಗಾತಿ ಮತ್ತು ದಾಂಪತ್ಯ ಜೀವನ ಹೇಗಿರುತ್ತದೆ?',
      Malayalam: 'എനിക്ക് വിവാഹ യോഗം എപ്പോഴാണ്? ഏഴാം ഭാവം അനുസരിച്ച് എന്റെ ജീവിത പങ്കാളിയെക്കുറിച്ചും ദാമ്പത്യത്തെക്കുറിച്ചും പറയുക.',
      English: 'When is the most auspicious timing for my marriage, and what does my 7th house reveal about my future spouse and married life?',
    },
  },
  {
    id: 'Money',
    label: 'Money',
    emoji: '💰',
    promptByLang: {
      Telugu: 'నా జాతకంలో 2వ మరియు 11వ ధన స్థానాల ప్రకారం సంపద ప్రాప్తి, ఆర్థిక స్థిరత్వం మరియు పెట్టుబడుల లాభాలు ఎలా ఉన్నాయి?',
      Hindi: 'मेरी कुंडली के 2वें और 11वें धन भाव के अनुसार आर्थिक स्थिति, धन संचय और निवेश के लिए कौन सा समय सबसे उत्तम रहेगा?',
      Tamil: 'எனது ஜாதகத்தில் 2 மற்றும் 11-ஆம் வீடுகளின்படி தன யோகம், நிதி நிலைமை மற்றும் முதலீடுகளுக்கான பலன்கள் எவ்வாறு உள்ளன?',
      Kannada: 'ನನ್ನ ಕುಂಡಲಿಯ 2 ಮತ್ತು 11ನೇ ಸ್ಥಾನಗಳ ಪ್ರಕಾರ ಧನ ಯೋಗ, ಆರ್ಥಿಕ ಸ್ಥಿರತೆ ಮತ್ತು ಹೂಡಿಕೆಗಳ ಬಗ್ಗೆ ತಿಳಿಸಿ.',
      Malayalam: 'എന്റെ ജാതകത്തിലെ ധന ഭാവങ്ങൾ അനുസരിച്ച് സാമ്പത്തിക സ്ഥിതിയും നിക്ഷേപ നേട്ടങ്ങളും എങ്ങനെയെന്ന് വ്യക്തമാക്കുക.',
      English: 'Please examine my 2nd and 11th houses of wealth for financial prosperity, debt clearance, and auspicious investment timing.',
    },
  },
  {
    id: 'Health',
    label: 'Health',
    emoji: '🌿',
    promptByLang: {
      Telugu: 'నా జాతకంలో 6వ భావం మరియు గ్రహ గోచారం ప్రకారం శారీరక ఆరోగ్యం, రక్షణ మరియు శక్తి వృద్ధికి ఎలాంటి సూచనలు ఉన్నాయి?',
      Hindi: 'मेरी कुंडली के 6वें भाव और गोचर के अनुसार स्वास्थ्य, रोग मुक्ति एवं दीर्घायु के लिए क्या सावधानियां और उपाय आवश्यक हैं?',
      Tamil: 'எனது ஜாதகத்தில் 6-ஆம் பாவத்தின்படி உடல் நலம், ஆரோக்கியம் மற்றும் பாதுகாப்புக்கான பரிகார ஆலோசனைகள் என்ன?',
      Kannada: 'ನನ್ನ ಕುಂಡಲಿಯ 6ನೇ ಸ್ಥಾನ ಮತ್ತು ಗೋಚಾರ ಫಲಗಳ ಪ್ರಕಾರ ಆರೋಗ್ಯ ಸುಧಾರಣೆ ಮತ್ತು ರಕ್ಷಣೆಗೆ ಅಗತ್ಯ ಪರಿಹಾರಗಳನ್ನು ತಿಳಿಸಿ.',
      Malayalam: 'എന്റെ ജാതകത്തിലെ ആറാം ഭാവം അനുസരിച്ച് ആരോഗ്യ രക്ഷയ്ക്കും ദീർഘായുസ്സിനുമുള്ള നിർദ്ദേശങ്ങൾ നൽകുക.',
      English: 'Please evaluate my 6th house, Ascendant lord, and active planetary transits for health vitality, wellness, and preventive parihars.',
    },
  },
  {
    id: 'Family',
    label: 'Family',
    emoji: '👨‍👩‍👧',
    promptByLang: {
      Telugu: 'నా జాతకంలో 4వ స్థానం ప్రకారం కుటుంబ సామరస్యం, గృహ శాంతి మరియు తల్లిదండ్రుల ఆశీర్వాదం ఎలా ఉంది?',
      Hindi: 'मेरी कुंडली के 4थे भाव के अनुसार पारिवारिक सुख, गृह शांति और माता-पिता के स्वास्थ्य व स्नेह का मार्गदर्शन करें।',
      Tamil: 'எனது ஜாதகத்தில் 4-ஆம் வீட்டின்படி குடும்ப அமைதி, மகிழ்ச்சி மற்றும் பெற்றோரின் ஆசிகள் குறித்து விவரிக்கவும்.',
      Kannada: 'ನನ್ನ ಕುಂಡಲಿಯ 4ನೇ ಸ್ಥಾನದ ಪ್ರಕಾರ ಕುಟುಂಬ ಸಾಮರಸ್ಯ, ಗೃಹ ಶಾಂತಿ ಮತ್ತು ಸುಖ ಸಂತೋಷದ ಬಗ್ಗೆ ಮಾರ್ಗದರ್ಶನ ನೀಡಿ.',
      Malayalam: 'എന്റെ ജാതകത്തിലെ നാലാം ഭാവം അനുസരിച്ച് കുടുംബ സമാധാനവും ഗൃഹ ശാന്തിയും എങ്ങനെയെന്ന് വിശകലനം ചെയ്യുക.',
      English: 'Please examine my 4th house for family harmony, domestic happiness, ancestral blessings, and peaceful living environment.',
    },
  },
];

export default function AiChatScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ initialPrompt?: string; astrologerName?: string; astrologerId?: string; avatarUrl?: string }>();

  const selectedLanguage = useLanguageStore((s) => s.selectedLanguage);
  const setSelectedLanguage = (lang: string) => {
    useLanguageStore.getState().setLanguage(lang as AppLanguage);
  };
  const [selectedModel, setSelectedModel] = useState<'auto' | 'vedika-ai' | 'openai-gpt4o'>('auto');
  const [selectedAstrologer, setSelectedAstrologer] = useState<{ id: string; name: string; title: string; emoji?: string; color?: string; avatarUrl?: string }>(() => {
    if (params.astrologerName) {
      return {
        id: params.astrologerId || 'ai-custom',
        name: params.astrologerName,
        title: 'Vedic Astrologer & AI Jyotish',
        emoji: '🔮',
        color: '#C9A84C',
        avatarUrl: params.avatarUrl,
      };
    }
    return ASTROLOGER_PERSONAS.find((a) => a.id === params.astrologerId) || ASTROLOGER_PERSONAS[0];
  });

  useEffect(() => {
    if (params.astrologerName && params.astrologerName !== selectedAstrologer.name) {
      setSelectedAstrologer({
        id: params.astrologerId || 'ai-custom',
        name: params.astrologerName,
        title: 'Vedic Astrologer & AI Jyotish',
        emoji: '🔮',
        color: '#C9A84C',
        avatarUrl: params.avatarUrl,
      });
    }
  }, [params.astrologerName, params.astrologerId, params.avatarUrl]);

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authUser = useAuthStore((s) => s.user);
  const isAuth = Boolean(isAuthenticated && authUser && (authUser.uid || authUser.phone));

  const [userProfile, setUserProfile] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('All');

  const scrollRef = useRef<ScrollView>(null);
  const listRef = useRef<FlatList<ChatMessage | 'typing'>>(null);
  const mounted = useRef(true);
  const hasTriggeredInitial = useRef(false);

  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);

  const handleToggleVoice = (text: string, idx: number) => {
    if (speakingIndex === idx) {
      stopAstrologerSpeech();
      setSpeakingIndex(null);
    } else {
      setSpeakingIndex(idx);
      speakAstrologerText(text, {
        language: selectedLanguage,
        astrologerName: selectedAstrologer.name,
        onStart: () => setSpeakingIndex(idx),
        onDone: () => setSpeakingIndex(null),
        onError: () => setSpeakingIndex(null),
      });
    }
  };

  useEffect(() => {
    return () => {
      mounted.current = false;
      stopAstrologerSpeech();
    };
  }, []);

  // Load saved birth profile
  useEffect(() => {
    AsyncStorage.getItem('astroparihar_user_birth_details').then((stored) => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUserProfile(parsed);
        } catch {}
      }
    });
  }, []);

  const { currencyCode, currencySymbol, formatPrice, getPromptCost, getRechargeOptions } = useCurrencyStore();
  const promptCost = getPromptCost();
  const rechargeOptions = getRechargeOptions();
  const [selectedRechargeIdx, setSelectedRechargeIdx] = useState(2);
  const activeRecharge = rechargeOptions[selectedRechargeIdx] || rechargeOptions[0];

  const [walletBalance, setWalletBalance] = useState(0);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState(500);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('UPI');
  const [isRecharging, setIsRecharging] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getWalletBalance().then((b) => {
      if (isMounted) setWalletBalance(b);
    });
    const unsub = subscribeWallet((b) => {
      if (isMounted) setWalletBalance(b);
    });
    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  const handleExecuteRecharge = async () => {
    setIsRecharging(true);
    try {
      const res = await rechargeWallet(activeRecharge.value, selectedPaymentMethod, {
        currency: currencyCode,
        displayAmount: `+${activeRecharge.amount}`,
        creditedINR: activeRecharge.valueINR,
      });
      if (res.success) {
        setWalletBalance(res.newBalance);
        setShowRechargeModal(false);
        showSnackBar(`${activeRecharge.amount} added via ${selectedPaymentMethod}! New balance: ${formatPrice(res.newBalance)}`, '#008069');
      } else {
        showSnackBar('Recharge failed. Please try again.', '#CF4444');
      }
    } catch {
      showSnackBar('Payment failed. Please try again.', '#CF4444');
    } finally {
      setIsRecharging(false);
    }
  };

  // Set initial welcome message when language or astrologer changes
  useEffect(() => {
    const userName = authUser?.name || userProfile?.name || 'Guest';
    const welcome = getWelcomeMessage(selectedLanguage, userName, selectedAstrologer.name);
    setMessages([
      {
        isUser: false,
        text: welcome.content,
        time: currentTime(),
        recommendations: welcome.recommendations,
        modelUsed: selectedAstrologer.name,
      },
    ]);
  }, [selectedLanguage, selectedAstrologer, userProfile?.name, authUser?.name]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
      listRef.current?.scrollToEnd({ animated: true });
    }, 120);
  };

  const sendMessage = async (text: string) => {
    if (text.trim().length === 0) return;

    // 0. Gate on authentication: Without sign in, AI Astro chat cannot be used
    if (!isAuth) {
      setShowAuthModal(true);
      return;
    }

    // 1. Check wallet balance: Each prompt costs ₹5
    if (walletBalance < promptCost.costINR) {
      setShowRechargeModal(true);
      return;
    }

    const userMsgText = text.trim();
    const newMsg: ChatMessage = { isUser: true, text: userMsgText, time: currentTime() };

    setMessages((prev) => [...prev, newMsg]);
    setIsTyping(true);
    setInput('');
    scrollToBottom();

    // 2. Real-time amount deduction: Deduct ₹5 per prompt
    try {
      const deductRes = await deductWalletBalance(
        promptCost.costINR,
        `AI Astrologer Consultation: ${selectedAstrologer.name}`,
        selectedAstrologer.name,
        undefined,
        { displayAmount: `-${promptCost.label}` }
      );
      if (deductRes.success) {
        setWalletBalance(deductRes.newBalance);
      }
    } catch (e) {
      console.warn('Wallet deduction note:', e);
    }

    try {
      const chatHistory = [...messages, newMsg].map((m) => ({
        role: m.isUser ? ('user' as const) : ('assistant' as const),
        content: m.text,
      }));

      const res = await sendLiveAIChatMessage({
        messages: chatHistory,
        language: selectedLanguage,
        astrologerId: selectedAstrologer.id,
        modelPreference: selectedModel,
        userInfo: userProfile,
      });

      if (!mounted.current) return;
      setIsTyping(false);

      setMessages((prev) => [
        ...prev,
        {
          isUser: false,
          text: res.reply,
          time: currentTime(),
          recommendations: res.recommendations,
          structured: res.structured,
          modelUsed: `${selectedAstrologer.name} (${res.modelUsed || 'AstroParihar AI'})`,
        },
      ]);
      scrollToBottom();
    } catch {
      if (!mounted.current) return;
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          isUser: false,
          text: useLanguageStore.getState().translateText('The celestial transits are moving into harmony. May Lord Shiva and the planetary deities grant peace, clarity, and auspicious fortune to your inquiries.'),
          time: currentTime(),
          recommendations: QUICK_PROMPTS_BY_LANG[selectedLanguage] || QUICK_PROMPTS_BY_LANG.English,
        },
      ]);
      scrollToBottom();
    }
  };

  // Auto-send initial prompt if routed with one from Home screen cards
  useEffect(() => {
    if (params.initialPrompt && !hasTriggeredInitial.current) {
      hasTriggeredInitial.current = true;
      setTimeout(() => {
        sendMessage(params.initialPrompt as string);
      }, 400);
    }
  }, [params.initialPrompt]);

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const onBack = () => {
    if (router.canGoBack()) router.back();
    else go(AppRoutes.homeDashboardScreen);
  };

  const currentPlaceholder = PLACEHOLDERS_BY_LANG[selectedLanguage] || PLACEHOLDERS_BY_LANG.English;
  const listData: (ChatMessage | 'typing')[] = isTyping ? [...messages, 'typing'] : messages;

  return (
    <View style={{ flex: 1, backgroundColor: '#EFE7DC' }} testID="aiChat.screen">
      <WhatsAppBackground />
      <KeyboardAvoidingView style={{ flex: 1, paddingTop: insets.top }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Custom Rich Header with Language & Model Selector */}
        <View style={{ paddingLeft: 4, paddingRight: 12, paddingVertical: 8, backgroundColor: '#008069', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 4, zIndex: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable testID="aiChat.back" onPress={onBack} style={{ minWidth: 36, minHeight: 36, alignItems: 'center', justifyContent: 'center' }}>
              <AppIcon name="arrow_back" color="#FFFFFF" size={22} />
            </Pressable>

            {/* Astrologer Avatar */}
            <Pressable onPress={() => setShowModelModal(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: '#C9A84C', overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0D1B2A' }}>
                {selectedAstrologer.avatarUrl ? (
                  <AppImage
                    uri={selectedAstrologer.avatarUrl}
                    width={40}
                    height={40}
                    fit="cover"
                    errorWidget={
                      <View style={{ width: 40, height: 40, backgroundColor: '#8B1A1A', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 18 }}>{selectedAstrologer.emoji || '🔮'}</Text>
                      </View>
                    }
                  />
                ) : (
                  <>
                    <LinearGradient colors={['#8B1A1A', '#3D0A0A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
                    <Text style={{ fontSize: 20 }}>{selectedAstrologer.emoji || '🔮'}</Text>
                  </>
                )}
              </View>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text numberOfLines={1} style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>
                  {selectedAstrologer.name}
                </Text>
                <Text style={{ color: '#B2DFDB', fontSize: 10 }}>
                  Online • Certified Vedic AI Astrologer
                </Text>
              </View>
            </Pressable>

            {/* Language Selector Symbol */}
            <Pressable
              testID="aiChat.langPill"
              onPress={() => setShowLanguageModal(true)}
              style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: '#C9A84C', marginRight: 6 }}
              accessibilityRole="button"
              accessibilityLabel="Select Language"
            >
              <Text style={{ fontSize: 13, color: '#FFFFFF' }}>🌐</Text>
            </Pressable>

            {/* Model Selector Pill */}
            <Pressable
              testID="aiChat.modelPill"
              onPress={() => setShowModelModal(true)}
              style={{ paddingHorizontal: 8, paddingVertical: 5, borderRadius: 14, backgroundColor: 'rgba(201,168,76,0.25)', borderWidth: 1, borderColor: '#C9A84C' }}
            >
              <Text style={{ fontSize: 11, color: '#C9A84C', fontWeight: '700' }}>
                {selectedModel === 'vedika-ai' ? '🔮 Ephemeris' : selectedModel === 'openai-gpt4o' ? '🧠 Deep AI' : '⚡ Auto'}
              </Text>
            </Pressable>

            {/* Wallet Balance Pill */}
            <Pressable
              testID="aiChat.walletPill"
              onPress={() => setShowRechargeModal(true)}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.28)', borderWidth: 1, borderColor: '#C9A84C', marginLeft: 6 }}
            >
              <Text style={{ fontSize: 11, color: '#FFD700', fontWeight: '800' }}>
                💳 ₹{walletBalance}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Dynamic Wallet Balance & Pricing Bar (Matching Website AIChatSidebar) */}
        <View
          style={{
            paddingHorizontal: 14,
            paddingVertical: 7,
            backgroundColor: '#F8F3EA',
            borderBottomWidth: 1,
            borderBottomColor: '#E5D9C8',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Pressable
            onPress={() => setShowRechargeModal(true)}
            style={{ flexDirection: 'row', alignItems: 'center' }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 7,
                backgroundColor: withAlpha('#8B1A1A', 15),
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 6,
              }}
            >
              <AppIcon name="account_balance_wallet" size={14} color="#8B1A1A" />
            </View>
            <Text style={{ color: '#6B5E55', fontSize: 12, fontWeight: '500' }}>Balance: </Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '800',
                color: walletBalance < 5 ? '#CF4444' : '#8B1A1A',
              }}
            >
              ₹{walletBalance}
            </Text>
          </Pressable>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                paddingHorizontal: 7,
                paddingVertical: 3,
                borderRadius: 8,
                backgroundColor: '#FFFDFC',
                borderWidth: 1,
                borderColor: '#E5D9C8',
                marginRight: 8,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#C9A84C' }}>
                ⚡ ₹5 / prompt
              </Text>
            </View>
            <Pressable
              onPress={() => setShowRechargeModal(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 9,
                paddingVertical: 4,
                borderRadius: 12,
                backgroundColor: withAlpha('#008069', 15),
                borderWidth: 1,
                borderColor: '#008069',
              }}
            >
              <Text style={{ color: '#008069', fontSize: 11, fontWeight: '700' }}>
                + Recharge ↗
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Topic Chips with Remedies in First Position */}
        <View style={{ height: 42, backgroundColor: '#EFE7DC', borderBottomWidth: 1, borderBottomColor: '#E2D9C8' }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 5, alignItems: 'center' }}>
            {TOPICS.map((topic) => {
              const sel = selectedTopic === topic.id;
              const isRemedies = topic.id === 'Remedies';
              return (
                <AnimatedPressable
                  key={topic.id}
                  testID={`aiChat.topic.${topic.id.toLowerCase()}`}
                  onPress={() => {
                    setSelectedTopic(topic.id);
                    if (topic.id !== 'All') {
                      const prompt =
                        topic.promptByLang[selectedLanguage] ||
                        topic.promptByLang.English ||
                        `Tell me about my ${topic.label} prospects and astrological remedies.`;
                      sendMessage(prompt);
                    }
                  }}
                  duration={180}
                  style={{
                    marginRight: 8,
                    paddingHorizontal: 13,
                    paddingVertical: 5,
                    borderRadius: 100,
                    backgroundColor: sel ? (isRemedies ? '#8B1A1A' : '#008069') : '#FFFFFF',
                    borderWidth: isRemedies ? 1.5 : 1,
                    borderColor: isRemedies ? (sel ? '#C9A84C' : '#8B1A1A') : (sel ? '#008069' : '#E2D9C8'),
                    flexDirection: 'row',
                    alignItems: 'center',
                    shadowColor: isRemedies ? '#8B1A1A' : '#000',
                    shadowOpacity: isRemedies ? 0.12 : 0.06,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                >
                  <Text style={{ fontSize: 12, marginRight: 5 }}>{topic.emoji}</Text>
                  <Text
                    style={{
                      color: sel ? '#FFFFFF' : (isRemedies ? '#8B1A1A' : '#4A5568'),
                      fontSize: 11,
                      fontWeight: (sel || isRemedies) ? '700' : '600',
                    }}
                  >
                    {topic.label}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Message Feed */}
        <View style={{ flex: 1 }}>
          <FlatList
            ref={listRef}
            data={listData}
            keyExtractor={(item, i) => (item === 'typing' ? 'typing' : String(i))}
            contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 12, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item, index }) => (
              item === 'typing' ? (
                <TypingIndicator />
              ) : (
                <Bubble
                  msg={item}
                  index={index}
                  isSpeaking={speakingIndex === index}
                  onVoiceTap={handleToggleVoice}
                  onPromptTap={(promptText) => {
                    if (!isAuth) {
                      setShowAuthModal(true);
                    } else {
                      sendMessage(promptText);
                    }
                  }}
                />
              )
            )}
          />
        </View>

        {/* Guest Auth Banner or Low Balance Warning Banner */}
        {!isAuth ? (
          <View
            style={{
              marginHorizontal: 10,
              marginBottom: 8,
              padding: 12,
              borderRadius: 14,
              backgroundColor: '#FFF8E7',
              borderWidth: 1.5,
              borderColor: '#C9A84C',
              shadowColor: '#C9A84C',
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: 'rgba(201,168,76,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <AppIcon name="lock" size={18} color="#8B1A1A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#8B1A1A', fontSize: 13, fontWeight: '800' }}>
                  Sign In Required to Consult
                </Text>
                <Text style={{ color: '#5A4A3A', fontSize: 11, marginTop: 2 }}>
                  Please sign in or register to chat with AI Astrologers. Each prompt costs ₹5.
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => go(AppRoutes.signInScreen)}
              style={{
                marginTop: 8,
                paddingVertical: 9,
                borderRadius: 10,
                backgroundColor: '#075E54',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800' }}>
                🔐 Sign In / Register Now ↗
              </Text>
            </Pressable>
          </View>
        ) : walletBalance < 5 && (
          <View
            style={{
              marginHorizontal: 10,
              marginBottom: 8,
              padding: 10,
              borderRadius: 12,
              backgroundColor: '#FFF5F5',
              borderWidth: 1,
              borderColor: '#FEB2B2',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <AppIcon name="warning_amber_rounded" size={17} color="#E53E3E" style={{ marginRight: 6, marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#C53030', fontSize: 12, fontWeight: '700' }}>
                  Low Wallet Balance (Available: ₹{walletBalance})
                </Text>
                <Text style={{ color: '#9B2C2C', fontSize: 11, marginTop: 1 }}>
                  Each prompt requires ₹5. Please recharge your wallet to continue chatting.
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => setShowRechargeModal(true)}
              style={{
                marginTop: 7,
                paddingVertical: 7,
                borderRadius: 8,
                backgroundColor: '#008069',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>
                ⚡ Recharge Wallet Now
              </Text>
            </Pressable>
          </View>
        )}

        {/* Chat Input Widget - Authentic WhatsApp layout without voice or attachment icons */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 10, paddingTop: 8, paddingBottom: isKeyboardVisible ? Math.max(10, insets.bottom + 4) : insets.bottom + 90, backgroundColor: '#EFEAE2', borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.06)' }}>
          <Pressable
            onPress={() => {
              if (!isAuth) setShowAuthModal(true);
            }}
            style={{ flex: 1, minHeight: 44, borderRadius: 24, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 2, elevation: 1 }}
          >
            <TextInput
              testID="aiChat.input"
              value={input}
              onChangeText={setInput}
              multiline
              numberOfLines={4}
              placeholder={!isAuth ? 'Sign in to ask AI Astrologer...' : currentPlaceholder}
              placeholderTextColor="#8A8A8A"
              editable={isAuth}
              onSubmitEditing={() => {
                if (!isAuth) {
                  setShowAuthModal(true);
                } else if (walletBalance < 5) {
                  setShowRechargeModal(true);
                } else if (input.trim().length > 0) {
                  sendMessage(input);
                }
              }}
              style={{ flex: 1, paddingVertical: 10, color: '#111B21', fontSize: 14, maxHeight: 4 * 22 + 20 }}
            />
          </Pressable>
          <Pressable
            testID="aiChat.send"
            onPress={() => {
              if (!isAuth) {
                setShowAuthModal(true);
              } else if (walletBalance < 5) {
                setShowRechargeModal(true);
              } else if (input.trim().length > 0) {
                sendMessage(input);
              }
            }}
            disabled={isAuth && input.trim().length === 0 && walletBalance >= 5}
            style={{
              marginLeft: 8,
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#00A884',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: !isAuth || input.trim().length > 0 || walletBalance < 5 ? 1 : 0.6,
              shadowColor: '#00A884',
              shadowOpacity: 0.35,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <AppIcon name={!isAuth ? 'lock' : 'send_rounded'} color="#FFFFFF" size={19} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* 1. Language Selection Modal */}
      <Modal visible={showLanguageModal} transparent animationType="fade" onRequestClose={() => setShowLanguageModal(false)}>
        <Pressable onPress={() => setShowLanguageModal(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: colors.isLight ? '#FFFFFF' : '#0D1B2A', borderRadius: 24, padding: 22, borderWidth: 1.5, borderColor: '#C9A84C' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={{ color: colors.isLight ? '#1F1535' : '#FFFFFF', fontSize: 18, fontWeight: '800' }}>🌐 {t('Select Astrology Language', 'Select Astrology Language')}</Text>
              <Pressable onPress={() => setShowLanguageModal(false)} style={{ padding: 4 }}>
                <AppIcon name="close" color={colors.isLight ? '#5A6A85' : '#A0A8C0'} size={22} />
              </Pressable>
            </View>
            <Text style={{ color: colors.isLight ? '#5A6A85' : '#A0A8C0', fontSize: 12.5, marginBottom: 14, lineHeight: 18 }}>
              {t('Choose your preferred language for horoscope readings and AI consultations.', 'Choose your preferred language for horoscope readings and AI consultations.')}
            </Text>
            {LANGUAGES.map((lang) => {
              const isSel = selectedLanguage === lang.code;
              return (
                <Pressable
                  key={lang.code}
                  onPress={() => {
                    setSelectedLanguage(lang.code);
                    setShowLanguageModal(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 13,
                    paddingHorizontal: 16,
                    borderRadius: 14,
                    marginBottom: 8,
                    backgroundColor: isSel ? 'rgba(201,168,76,0.22)' : (colors.isLight ? '#F5F5F7' : '#16253B'),
                    borderWidth: 1.2,
                    borderColor: isSel ? '#C9A84C' : 'transparent',
                  }}
                >
                  <Text style={{ color: isSel ? '#C9A84C' : (colors.isLight ? '#1F1535' : '#FFFFFF'), fontSize: 15, fontWeight: isSel ? '800' : '600' }}>
                    {lang.full}
                  </Text>
                  {isSel ? <AppIcon name="check_circle" color="#C9A84C" size={20} /> : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>

      {/* 2. Model & Astrologer Persona Selection Modal */}
      <Modal visible={showModelModal} transparent animationType="fade" onRequestClose={() => setShowModelModal(false)}>
        <Pressable onPress={() => setShowModelModal(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: colors.isLight ? '#FFFFFF' : '#0D1B2A', borderRadius: 24, padding: 20, borderWidth: 1.5, borderColor: '#C9A84C', maxHeight: '85%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: colors.isLight ? '#1F1535' : '#FFFFFF', fontSize: 18, fontWeight: '800' }}>🔮 {t('Vedic Engine & Astrologer', 'Vedic Engine & Astrologer')}</Text>
              <Pressable onPress={() => setShowModelModal(false)} style={{ padding: 4 }}>
                <AppIcon name="close" color={colors.isLight ? '#5A6A85' : '#A0A8C0'} size={22} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Engine Model Section */}
              <Text style={{ color: '#C9A84C', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                {t('AI Calculation Engine', 'AI Calculation Engine')}
              </Text>
              {AI_MODELS.map((m) => {
                const isSel = selectedModel === m.id;
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => setSelectedModel(m.id as any)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 12,
                      borderRadius: 14,
                      marginBottom: 8,
                      backgroundColor: isSel ? 'rgba(201,168,76,0.22)' : (colors.isLight ? '#F5F5F7' : '#16253B'),
                      borderWidth: 1.2,
                      borderColor: isSel ? '#C9A84C' : 'transparent',
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>{m.icon}</Text>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={{ color: isSel ? '#C9A84C' : (colors.isLight ? '#1F1535' : '#FFFFFF'), fontSize: 13, fontWeight: '700' }}>{t(m.name, m.name)}</Text>
                      <Text style={{ color: colors.isLight ? '#5A6A85' : '#A0A8C0', fontSize: 10.5 }}>{t(m.desc, m.desc)}</Text>
                    </View>
                    {isSel ? <AppIcon name="check_circle" color="#C9A84C" size={18} /> : null}
                  </Pressable>
                );
              })}

              {/* Astrologer Persona Section */}
              <Text style={{ color: '#C9A84C', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginTop: 12, marginBottom: 8 }}>
                {t('Vedic Master Persona', 'Vedic Master Persona')}
              </Text>
              {ASTROLOGER_PERSONAS.map((astro) => {
                const isSel = selectedAstrologer.id === astro.id;
                return (
                  <Pressable
                    key={astro.id}
                    onPress={() => {
                      setSelectedAstrologer(astro);
                      setShowModelModal(false);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 12,
                      borderRadius: 14,
                      marginBottom: 8,
                      backgroundColor: isSel ? 'rgba(201,168,76,0.22)' : (colors.isLight ? '#F5F5F7' : '#16253B'),
                      borderWidth: 1.2,
                      borderColor: isSel ? '#C9A84C' : 'transparent',
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>{astro.emoji}</Text>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={{ color: isSel ? '#C9A84C' : (colors.isLight ? '#1F1535' : '#FFFFFF'), fontSize: 13, fontWeight: '700' }}>{astro.name}</Text>
                      <Text style={{ color: colors.isLight ? '#5A6A85' : '#A0A8C0', fontSize: 10.5 }}>{astro.title}</Text>
                    </View>
                    {isSel ? <AppIcon name="check_circle" color="#C9A84C" size={18} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* 3. Recharge Wallet Modal (Matching Website & App Wallet module) */}
      <Modal
        visible={showRechargeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRechargeModal(false)}
      >
        <Pressable
          onPress={() => setShowRechargeModal(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.isLight ? '#FFFFFF' : '#0D1B2A',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              paddingBottom: Math.max(24, insets.bottom + 12),
              borderWidth: 1.5,
              borderColor: '#C9A84C',
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(201,168,76,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 10, borderWidth: 1, borderColor: '#C9A84C' }}>
                  <Text style={{ fontSize: 18 }}>⚡</Text>
                </View>
                <View>
                  <Text style={{ color: colors.isLight ? '#1F1535' : '#FFFFFF', fontSize: 18, fontWeight: '800' }}>{t('Recharge Wallet', 'Recharge Wallet')}</Text>
                  <Text style={{ color: colors.isLight ? '#5A6A85' : '#A0A8C0', fontSize: 11 }}>{t('Instant credit for AI & Astrologer Consultations', 'Instant credit for AI & Astrologer Consultations')}</Text>
                </View>
              </View>
              <Pressable onPress={() => setShowRechargeModal(false)} style={{ padding: 4 }}>
                <AppIcon name="close" color={colors.isLight ? '#5A6A85' : '#A0A8C0'} size={22} />
              </Pressable>
            </View>

            {/* Current Balance & Prompt Cost Bar */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 12,
                borderRadius: 14,
                backgroundColor: colors.isLight ? '#FAF5E8' : '#16253B',
                borderWidth: 1,
                borderColor: 'rgba(201,168,76,0.3)',
                marginBottom: 16,
              }}
            >
              <View>
                <Text style={{ color: colors.isLight ? '#5A6A85' : '#A0A8C0', fontSize: 11 }}>{t('Current Balance', 'Current Balance')}</Text>
                <Text style={{ color: walletBalance < promptCost.costINR ? '#FF6B6B' : (colors.isLight ? '#B45309' : '#FFD700'), fontSize: 20, fontWeight: '800', marginTop: 2 }}>
                  {formatPrice(walletBalance)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: colors.isLight ? '#5A6A85' : '#A0A8C0', fontSize: 11 }}>{t('Consultation Rate', 'Consultation Rate')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  <Text style={{ color: '#C9A84C', fontSize: 13, fontWeight: '700' }}>{promptCost.label} per prompt</Text>
                </View>
              </View>
            </View>

            {/* Select Recharge Amount */}
            <Text style={{ color: '#C9A84C', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
              {t('Select Amount', 'Select Amount')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {rechargeOptions.slice(0, 5).map((opt, idx) => {
                const isSel = selectedRechargeIdx === idx;
                return (
                  <Pressable
                    key={opt.amount}
                    onPress={() => setSelectedRechargeIdx(idx)}
                    style={{
                      flex: 1,
                      minWidth: '28%',
                      paddingVertical: 10,
                      paddingHorizontal: 8,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isSel ? 'rgba(201,168,76,0.25)' : (colors.isLight ? '#F5F5F7' : '#16253B'),
                      borderWidth: isSel ? 2 : 1,
                      borderColor: isSel ? '#C9A84C' : (colors.isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'),
                    }}
                  >
                    <Text style={{ color: isSel ? '#C9A84C' : (colors.isLight ? '#1F1535' : '#FFFFFF'), fontSize: 15, fontWeight: '800' }}>
                      {opt.amount}
                    </Text>
                    {opt.bonus ? (
                      <Text style={{ color: '#16A34A', fontSize: 9, fontWeight: '700', marginTop: 2 }}>
                        {opt.bonus}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            {/* Payment Method Selector */}
            <Text style={{ color: '#C9A84C', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
              {t('Select Payment Method', 'Select Payment Method')}
            </Text>
            <View style={{ gap: 8, marginBottom: 18 }}>
              {(currencyCode === 'INR'
                ? [
                    { id: 'UPI', label: 'Google Pay / PhonePe / Paytm (UPI)', icon: '📱' },
                    { id: 'Card', label: 'Credit / Debit Card (Visa, RuPay, Master)', icon: '💳' },
                    { id: 'Net Banking', label: 'Net Banking (All Major Indian Banks)', icon: '🏦' },
                  ]
                : [
                    { id: 'Card', label: 'Credit / Debit Card (Visa, Master, Amex)', icon: '💳' },
                    { id: 'PayPal', label: 'PayPal / Apple Pay / Google Pay', icon: '🌐' },
                    { id: 'Wire', label: 'International Wire Transfer', icon: '🏦' },
                  ]
              ).map((pm) => {
                const isSel = selectedPaymentMethod === pm.id;
                return (
                  <Pressable
                    key={pm.id}
                    onPress={() => setSelectedPaymentMethod(pm.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 12,
                      borderRadius: 12,
                      backgroundColor: isSel ? 'rgba(201,168,76,0.18)' : (colors.isLight ? '#F8F9FA' : '#16253B'),
                      borderWidth: 1,
                      borderColor: isSel ? '#C9A84C' : (colors.isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'),
                    }}
                  >
                    <Text style={{ fontSize: 18, marginRight: 10 }}>{pm.icon}</Text>
                    <Text style={{ flex: 1, color: isSel ? '#C9A84C' : (colors.isLight ? '#1F1535' : '#FFFFFF'), fontSize: 13, fontWeight: isSel ? '700' : '500' }}>
                      {pm.label}
                    </Text>
                    {isSel ? (
                      <AppIcon name="check_circle" color="#C9A84C" size={18} />
                    ) : (
                      <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: colors.isLight ? '#9CA3AF' : '#A0A8C0' }} />
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Pay Button */}
            <Pressable
              onPress={handleExecuteRecharge}
              disabled={isRecharging}
              style={{
                paddingVertical: 14,
                borderRadius: 14,
                backgroundColor: '#C9A84C',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                shadowColor: '#C9A84C',
                shadowOpacity: 0.35,
                shadowRadius: 6,
                elevation: 3,
                opacity: isRecharging ? 0.7 : 1,
              }}
            >
              <Text style={{ color: '#080D1A', fontSize: 15, fontWeight: '800' }}>
                {isRecharging ? t('Processing Secure Payment...', 'Processing Secure Payment...') : `${t('Pay & Recharge', 'Pay & Recharge')} ${activeRecharge.amount}`}
              </Text>
            </Pressable>

            {/* Redirect to full wallet screen */}
            <Pressable
              onPress={() => {
                setShowRechargeModal(false);
                push(AppRoutes.walletScreen);
              }}
              style={{ marginTop: 12, alignItems: 'center', paddingVertical: 4 }}
            >
              <Text style={{ color: colors.isLight ? '#5A6A85' : '#A0A8C0', fontSize: 12, textDecorationLine: 'underline' }}>
                {t('View Full Wallet & Transaction History →', 'View Full Wallet & Transaction History →')}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 4. Auth Required Modal */}
      <Modal visible={showAuthModal} transparent animationType="fade" onRequestClose={() => setShowAuthModal(false)}>
        <Pressable onPress={() => setShowAuthModal(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.68)', justifyContent: 'center', padding: 24 }}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.isLight ? '#FFFFFF' : '#0D1B2A',
              borderRadius: 24,
              padding: 24,
              borderWidth: 1.5,
              borderColor: '#C9A84C',
              shadowColor: '#C9A84C',
              shadowOpacity: 0.25,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 29,
                  backgroundColor: colors.isLight ? 'rgba(201,168,76,0.14)' : 'rgba(201,168,76,0.22)',
                  borderWidth: 1.5,
                  borderColor: '#C9A84C',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                <AppIcon name="lock" color="#C9A84C" size={28} />
              </View>
              <Text
                style={{
                  color: colors.isLight ? '#1F1535' : '#FFFFFF',
                  fontSize: 20,
                  fontWeight: '800',
                  textAlign: 'center',
                  letterSpacing: 0.3,
                }}
              >
                {t('Sign In to Consult', 'Sign In to Consult')}
              </Text>
              <Text
                style={{
                  color: colors.isLight ? '#4A5568' : '#CBD5E1',
                  fontSize: 13.5,
                  textAlign: 'center',
                  marginTop: 10,
                  lineHeight: 20,
                }}
              >
                {t(
                  `Please sign in to your AstroParihar account to ask AI Astrologers and unlock Vedic Jyotish insights. Each consultation prompt costs ${promptCost.label} from your wallet.`,
                  `Please sign in to your AstroParihar account to ask AI Astrologers and unlock Vedic Jyotish insights. Each consultation prompt costs ${promptCost.label} from your wallet.`
                )}
              </Text>
            </View>

            <Pressable
              onPress={() => {
                setShowAuthModal(false);
                go(AppRoutes.signInScreen);
              }}
              style={{
                paddingVertical: 14,
                borderRadius: 14,
                backgroundColor: '#C9A84C',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 8,
                shadowColor: '#C9A84C',
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 3,
              }}
            >
              <Text style={{ color: '#080D1A', fontSize: 15, fontWeight: '800' }}>
                {t('Sign In / Register Now ↗', 'Sign In / Register Now ↗')}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setShowAuthModal(false)}
              style={{ marginTop: 12, alignItems: 'center', paddingVertical: 6 }}
            >
              <Text style={{ color: colors.isLight ? '#718096' : '#94A3B8', fontSize: 13.5, fontWeight: '600' }}>
                {t('Maybe Later', 'Maybe Later')}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
