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
import {
  deductWalletBalance,
  getWalletBalance,
  rechargeWallet,
  subscribeWallet,
} from '@/services/walletService';
import { showSnackBar } from '@/components/overlays';
import { AppColors, withAlpha } from '@/theme/colors';
import { useController } from '@/utils/anim';
import {
  sendLiveAIChatMessage,
  AIChatResponse,
} from '@/services/astrologyService';
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
  { code: 'English', label: 'English', full: 'English (EN)' },
];

export const AI_MODELS = [
  { id: 'auto', name: 'Auto (Recommended)', icon: '⚡', desc: 'Hybrid Vedika Ephemeris + OpenAI Brain' },
  { id: 'vedika-ai', name: 'Vedika AI Engine', icon: '🔮', desc: 'High-Precision Vedic Ephemeris & Kundli Calculations' },
  { id: 'openai-gpt4o', name: 'OpenAI GPT-4o', icon: '🧠', desc: 'Deep Astrological Synthesis & Sacred Counsel' },
];

export const ASTROLOGER_PERSONAS = [
  { id: 'acharya-devavrat', name: 'Acharya Devavrat', title: 'Vedic Grandmaster & Dasha Guru', emoji: '🧘‍♂️', color: '#C9A84C' },
  { id: 'vedika', name: 'Vedika AI', title: 'Autonomous Vedic Ephemeris Engine', emoji: '🔮', color: '#9370DB' },
  { id: 'swami-ji', name: 'Swami Shankarananda', title: 'Himalayan Parashari Sage', emoji: '🕉️', color: '#FF9800' },
  { id: 'astro-ananya', name: 'Astro Ananya', title: 'Nadi & Kundli Seer', emoji: '🌸', color: '#E91E63' },
  { id: 'arjun-pandit', name: 'Arjun Pandit', title: 'Vedic Kundli Prodigy', emoji: '✨', color: '#2196F3' },
  { id: 'pandit-raghav', name: 'Pandit Raghavendra', title: 'Lal Kitab & Parihar Master', emoji: '📿', color: '#4CAF50' },
];

const QUICK_PROMPTS_BY_LANG: Record<string, string[]> = {
  Telugu: [
    '🔮 2026లో నా గ్రహ సంచారాల ఫలితాలు ఎలా ఉన్నాయి?',
    '❤️ నా జాతకంలో వివాహ యోగం ఎప్పుడు ఉంది?',
    '💼 కెరీర్ మార్పు లేదా ప్రమోషన్‌కు సరైన సమయం ఎప్పుడు?',
    '✨ నా అదృష్ట రత్నం, రుద్రాక్ష మరియు నిత్య మంత్రం ఏమిటి?',
    '🪐 నాకు శని సాడే సాతి లేదా రాహు మహర్దశ నడుస్తుందా?',
    '🙏 నా జాతక దోష నివారణకు ఎలాంటి పరిహారాలు లేదా దానం చేయాలి?',
  ],
  Hindi: [
    '🔮 2026 में मेरे मुख्य ग्रह गोचर का क्या प्रभाव रहेगा?',
    '❤️ मेरे विवाह का शुभ योग कब बनेगा?',
    '💼 करियर में पदोन्नति या व्यापार विस्तार का सबसे शुभ समय कब है?',
    '✨ मेरे लिए भाग्यशाली रत्न, रुद्राक्ष और दैनिक मंत्र क्या है?',
    '🪐 क्या मुझ पर शनि की साढ़ेसाती या राहु की महादशा चल रही है?',
    '🙏 ग्रह शांति के लिए मुझे कौन सा विशेष दान या उपाय करना चाहिए?',
  ],
  Tamil: [
    '🔮 2026-ல் எனது கிரக பெயர்ச்சி பலன்கள் எப்படி உள்ளன?',
    '❤️ எனது திருமண யோகம் மற்றும் வாழ்க்கை எப்போது அமையும்?',
    '💼 தொழில் வளர்ச்சி அல்லது வேலை மாற்றத்திற்கு உகந்த நேரம் எப்போது?',
    '✨ எனது அதிர்ஷ்ட ரத்தினம், ருத்ராட்சம் மற்றும் தினசரி மந்திரம் எது?',
    '🪐 எனக்கு ஏழரை சனி அல்லது ராகு தசை நடக்கிறதா?',
    '🙏 கிரக தோஷ நிவர்த்திக்கு என்ன பரிகாரம் அல்லது தானம் செய்ய வேண்டும்?',
  ],
  Kannada: [
    '🔮 2026ರಲ್ಲಿ ನನ್ನ ಗ್ರಹ ಸಂಚಾರದ ಫಲಗಳು ಹೇಗಿವೆ?',
    '❤️ ನನ್ನ ವಿವಾಹ ಯೋಗ ಮತ್ತು ಹೊಂದಾಣಿಕೆ ಯಾವಾಗ ಬರುತ್ತದೆ?',
    '💼 ವೃತ್ತಿ ಬೆಳವಣಿಗೆ ಅಥವಾ ಉದ್ಯೋಗ ಬದಲಾವಣೆಗೆ ಶುಭ ಸಮಯ ಯಾವುದು?',
    '✨ ನನ್ನ ಅದೃಷ್ಟ ರತ್ನ, ರುದ್ರಾಕ್ಷಿ ಮತ್ತು ನಿತ್ಯ ಮಂತ್ರ ಯಾವುದು?',
    '🪐 ನನಗೆ ಸಾಡೇ ಸಾತಿ ಅಥವಾ ರಾಹು ಮಹಾದಶ ನಡೆಯುತ್ತಿದೆಯೇ?',
    '🙏 ಗ್ರಹ ಶಾಂತಿ ಮತ್ತು ದೋಷ ನಿವಾರಣೆಗೆ ಯಾವ ಪರಿಹಾರ ಮಾಡಬೇಕು?',
  ],
  English: [
    '🔮 What do planetary transits say for me in 2026?',
    '❤️ When will I meet my compatible life partner?',
    '💼 When is the best time for a career change or promotion?',
    '✨ What is my lucky gemstone, rudraksha & daily mantra?',
    '🪐 Am I currently running Shani Sade Sati or Rahu Mahadasha?',
    '🙏 What specific Vedic remedies or charity should I perform?',
  ],
};

const PLACEHOLDERS_BY_LANG: Record<string, string> = {
  Telugu: 'మీ కుండలి, ప్రేమ, కెరీర్ లేదా పరిహారాల గురించి అడగండి...',
  Hindi: 'अपनी कुंडली, प्रेम, करियर या उपायों के बारे में पूछें...',
  Tamil: 'உங்கள் ஜாதகம், தொழில், திருமணம் அல்லது பரிகாரங்கள் பற்றி கேளுங்கள்...',
  Kannada: 'ನಿಮ್ಮ ಕುಂಡಲಿ, ಪ್ರೀತಿ, ವೃತ್ತಿ ಅಥವಾ ಪರಿಹಾರಗಳ ಬಗ್ಗೆ ಕೇಳಿ...',
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

function WhatsAppBackground() {
  const { width, height } = useWindowDimensions();
  const { lines, dots } = useMemo(() => {
    const spacing = 60;
    let l = '';
    let d = '';
    for (let x = 0; x < width + spacing; x += spacing) {
      for (let y0 = 0; y0 < height + spacing; y0 += spacing) {
        const y = y0 + (Math.floor(x / spacing) % 2 === 0 ? 30 : 0);
        const r = 6;
        for (let i = 0; i < 6; i++) {
          const angle = (i * 60 * 3.14159) / 180;
          const k = i % 2 === 0 ? 1 : 0.5;
          l += `M${x} ${y}L${x + r * k * approxCos(angle)} ${y + r * k * approxSin(angle)}`;
        }
        d += `M${x - 2} ${y}a2 2 0 1 0 4 0a2 2 0 1 0 -4 0`;
      }
    }
    return { lines: l, dots: d };
  }, [width, height]);
  return (
    <Svg width={width} height={height} style={{ position: 'absolute' }} pointerEvents="none">
      <Path d={lines} stroke="#D4C9B8" strokeWidth={1.2} fill="none" />
      <Path d={dots} fill="#D4C9B8" />
    </Svg>
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
            borderWidth: 0.5, borderColor: msg.isUser ? 'rgba(7,94,84,0.12)' : 'rgba(0,0,0,0.06)',
          }}
        >
          {!msg.isUser ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: '#075E54', fontSize: 12, fontWeight: '700' }}>
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
                  backgroundColor: isSpeaking ? 'rgba(201,168,76,0.25)' : 'rgba(7,94,84,0.08)',
                  borderWidth: 1,
                  borderColor: isSpeaking ? '#C9A84C' : 'rgba(7,94,84,0.2)',
                }}
              >
                <AppIcon
                  name={isSpeaking ? 'stop_circle_rounded' : 'volume_up_rounded'}
                  size={13}
                  color={isSpeaking ? '#C9A84C' : '#075E54'}
                />
                <Text style={{ marginLeft: 3, color: isSpeaking ? '#C9A84C' : '#075E54', fontSize: 10, fontWeight: '700' }}>
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
          <View style={{ marginTop: 6, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {msg.recommendations.map((rec, rIdx) => (
              <Pressable
                key={rIdx}
                onPress={() => onPromptTap(rec)}
                style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#C9A84C', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 }}
              >
                <Text style={{ color: '#5A3D0B', fontSize: 11, fontWeight: '600' }}>{rec}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
      {msg.isUser ? <View style={{ width: 4 }} /> : null}
    </Animated.View>
  );
}

const TOPICS = ['All', 'Love', 'Career', 'Marriage', 'Money', 'Family', 'Remedies', 'Health'];

export default function AiChatScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ initialPrompt?: string; astrologerName?: string; astrologerId?: string; avatarUrl?: string }>();

  const [selectedLanguage, setSelectedLanguage] = useState<string>('English');
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
      const res = await rechargeWallet(rechargeAmount, selectedPaymentMethod);
      if (res.success) {
        setWalletBalance(res.newBalance);
        setShowRechargeModal(false);
        showSnackBar(`₹${rechargeAmount} added via ${selectedPaymentMethod}! New balance: ₹${res.newBalance}`, '#075E54');
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
    const welcome = getWelcomeMessage(selectedLanguage, userProfile?.name || 'Guest', selectedAstrologer.name);
    setMessages([
      {
        isUser: false,
        text: welcome.content,
        time: currentTime(),
        recommendations: welcome.recommendations,
        modelUsed: selectedAstrologer.name,
      },
    ]);
  }, [selectedLanguage, selectedAstrologer, userProfile?.name]);

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
    if (walletBalance < 5) {
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
        5,
        `AI Astrologer Consultation: ${selectedAstrologer.name}`,
        selectedAstrologer.name
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
          modelUsed: `${selectedAstrologer.name} (${res.modelUsed || 'Vedika AI'})`,
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
          text: 'The celestial transits are moving into harmony. May Lord Shiva and the planetary deities grant peace, clarity, and auspicious fortune to your inquiries.',
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
  const listData: Array<ChatMessage | 'typing'> = isTyping ? [...messages, 'typing'] : messages;

  return (
    <View style={{ flex: 1, backgroundColor: '#EFE7DC' }} testID="aiChat.screen">
      <WhatsAppBackground />
      <KeyboardAvoidingView style={{ flex: 1, paddingTop: insets.top }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Custom Rich Header with Language & Model Selector */}
        <View style={{ paddingLeft: 4, paddingRight: 12, paddingVertical: 8, backgroundColor: '#075E54', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 4, zIndex: 2 }}>
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
                  Online • {selectedModel === 'vedika-ai' ? 'Vedika AI' : selectedModel === 'openai-gpt4o' ? 'GPT-4o' : 'Vedika & OpenAI'}
                </Text>
              </View>
            </Pressable>

            {/* Language Selector Pill */}
            <Pressable
              testID="aiChat.langPill"
              onPress={() => setShowLanguageModal(true)}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: '#C9A84C', marginRight: 6 }}
            >
              <Text style={{ fontSize: 11, color: '#FFFFFF', fontWeight: '700' }}>
                🌐 {LANGUAGES.find((l) => l.code === selectedLanguage)?.label || 'Eng'}
              </Text>
              <AppIcon name="keyboard_arrow_down" color="#FFFFFF" size={14} style={{ marginLeft: 2 }} />
            </Pressable>

            {/* Model Selector Pill */}
            <Pressable
              testID="aiChat.modelPill"
              onPress={() => setShowModelModal(true)}
              style={{ paddingHorizontal: 8, paddingVertical: 5, borderRadius: 14, backgroundColor: 'rgba(201,168,76,0.25)', borderWidth: 1, borderColor: '#C9A84C' }}
            >
              <Text style={{ fontSize: 11, color: '#C9A84C', fontWeight: '700' }}>
                {selectedModel === 'vedika-ai' ? '🔮 Vedika' : selectedModel === 'openai-gpt4o' ? '🧠 GPT-4' : '⚡ Auto'}
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
                backgroundColor: withAlpha('#075E54', 15),
                borderWidth: 1,
                borderColor: '#075E54',
              }}
            >
              <Text style={{ color: '#075E54', fontSize: 11, fontWeight: '700' }}>
                + Recharge ↗
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Topic Chips */}
        <View style={{ height: 40, backgroundColor: '#EFE7DC', borderBottomWidth: 1, borderBottomColor: '#E2D9C8' }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 5, alignItems: 'center' }}>
            {TOPICS.map((t) => {
              const sel = selectedTopic === t;
              return (
                <AnimatedPressable
                  key={t}
                  testID={`aiChat.topic.${t.toLowerCase()}`}
                  onPress={() => {
                    setSelectedTopic(t);
                    if (t !== 'All') {
                      sendMessage(`Tell me about my ${t} prospects and astrological remedies.`);
                    }
                  }}
                  duration={180}
                  style={{ marginRight: 8, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 100, backgroundColor: sel ? '#075E54' : '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 2, elevation: 1 }}
                >
                  <Text style={{ color: sel ? '#FFFFFF' : '#4A5568', fontSize: 11, fontWeight: sel ? '700' : '500' }}>{t}</Text>
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
                backgroundColor: '#075E54',
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
              backgroundColor: '#075E54',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: !isAuth || input.trim().length > 0 || walletBalance < 5 ? 1 : 0.6,
              shadowColor: '#075E54',
              shadowOpacity: 0.3,
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
        <Pressable onPress={() => setShowLanguageModal(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#0D1B2A', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#C9A84C' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ color: '#F0EAD6', fontSize: 18, fontWeight: '700' }}>🌐 Select Astrology Language</Text>
              <Pressable onPress={() => setShowLanguageModal(false)} style={{ padding: 4 }}>
                <AppIcon name="close" color="#A0A8C0" size={22} />
              </Pressable>
            </View>
            <Text style={{ color: '#A0A8C0', fontSize: 12, marginBottom: 14 }}>
              Choose your preferred language for horoscope readings and AI consultations.
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
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, marginBottom: 8, backgroundColor: isSel ? 'rgba(201,168,76,0.2)' : '#16253B', borderWidth: 1, borderColor: isSel ? '#C9A84C' : 'transparent' }}
                >
                  <Text style={{ color: isSel ? '#C9A84C' : '#F0EAD6', fontSize: 15, fontWeight: isSel ? '700' : '500' }}>
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
        <Pressable onPress={() => setShowModelModal(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#0D1B2A', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#C9A84C', maxHeight: '85%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: '#F0EAD6', fontSize: 17, fontWeight: '700' }}>🔮 AI Engine & Astrologer</Text>
              <Pressable onPress={() => setShowModelModal(false)} style={{ padding: 4 }}>
                <AppIcon name="close" color="#A0A8C0" size={22} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Engine Model Section */}
              <Text style={{ color: '#C9A84C', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                AI Calculation Engine
              </Text>
              {AI_MODELS.map((m) => {
                const isSel = selectedModel === m.id;
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => setSelectedModel(m.id as any)}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, marginBottom: 8, backgroundColor: isSel ? 'rgba(201,168,76,0.2)' : '#16253B', borderWidth: 1, borderColor: isSel ? '#C9A84C' : 'transparent' }}
                  >
                    <Text style={{ fontSize: 20 }}>{m.icon}</Text>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={{ color: isSel ? '#C9A84C' : '#F0EAD6', fontSize: 13, fontWeight: '700' }}>{m.name}</Text>
                      <Text style={{ color: '#A0A8C0', fontSize: 10 }}>{m.desc}</Text>
                    </View>
                    {isSel ? <AppIcon name="check_circle" color="#C9A84C" size={18} /> : null}
                  </Pressable>
                );
              })}

              {/* Astrologer Persona Section */}
              <Text style={{ color: '#C9A84C', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 12, marginBottom: 8 }}>
                Vedic Master Persona
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
                    style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, marginBottom: 8, backgroundColor: isSel ? 'rgba(201,168,76,0.2)' : '#16253B', borderWidth: 1, borderColor: isSel ? '#C9A84C' : 'transparent' }}
                  >
                    <Text style={{ fontSize: 22 }}>{astro.emoji}</Text>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={{ color: isSel ? '#C9A84C' : '#F0EAD6', fontSize: 13, fontWeight: '700' }}>{astro.name}</Text>
                      <Text style={{ color: '#A0A8C0', fontSize: 10 }}>{astro.title}</Text>
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
              backgroundColor: '#0D1B2A',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              paddingBottom: Math.max(24, insets.bottom + 12),
              borderWidth: 1,
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
                  <Text style={{ color: '#F0EAD6', fontSize: 18, fontWeight: '800' }}>Recharge Wallet</Text>
                  <Text style={{ color: '#A0A8C0', fontSize: 11 }}>Instant credit for AI & Astrologer Consultations</Text>
                </View>
              </View>
              <Pressable onPress={() => setShowRechargeModal(false)} style={{ padding: 4 }}>
                <AppIcon name="close" color="#A0A8C0" size={22} />
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
                backgroundColor: '#16253B',
                borderWidth: 1,
                borderColor: 'rgba(201,168,76,0.3)',
                marginBottom: 16,
              }}
            >
              <View>
                <Text style={{ color: '#A0A8C0', fontSize: 11 }}>Current Balance</Text>
                <Text style={{ color: walletBalance < 5 ? '#FF6B6B' : '#FFD700', fontSize: 20, fontWeight: '800', marginTop: 2 }}>
                  ₹{walletBalance}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: '#A0A8C0', fontSize: 11 }}>Consultation Rate</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  <Text style={{ color: '#C9A84C', fontSize: 13, fontWeight: '700' }}>₹5 per prompt</Text>
                </View>
              </View>
            </View>

            {/* Select Recharge Amount */}
            <Text style={{ color: '#C9A84C', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
              Select Amount
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {[
                { amount: 100, label: '₹100', bonus: null },
                { amount: 200, label: '₹200', bonus: null },
                { amount: 500, label: '₹500', bonus: '+₹25 Free' },
                { amount: 1000, label: '₹1000', bonus: '+₹75 Free' },
                { amount: 2000, label: '₹2000', bonus: '+₹200 Free' },
              ].map((opt) => {
                const isSel = rechargeAmount === opt.amount;
                return (
                  <Pressable
                    key={opt.amount}
                    onPress={() => setRechargeAmount(opt.amount)}
                    style={{
                      flex: 1,
                      minWidth: '28%',
                      paddingVertical: 10,
                      paddingHorizontal: 8,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isSel ? 'rgba(201,168,76,0.25)' : '#16253B',
                      borderWidth: isSel ? 2 : 1,
                      borderColor: isSel ? '#C9A84C' : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <Text style={{ color: isSel ? '#C9A84C' : '#F0EAD6', fontSize: 15, fontWeight: '800' }}>
                      {opt.label}
                    </Text>
                    {opt.bonus ? (
                      <Text style={{ color: '#4ADE80', fontSize: 9, fontWeight: '700', marginTop: 2 }}>
                        {opt.bonus}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            {/* Payment Method Selector */}
            <Text style={{ color: '#C9A84C', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
              Select Payment Method
            </Text>
            <View style={{ gap: 8, marginBottom: 18 }}>
              {[
                { id: 'UPI', label: 'Google Pay / PhonePe / Paytm (UPI)', icon: '📱' },
                { id: 'Card', label: 'Credit / Debit Card (Visa, RuPay, Master)', icon: '💳' },
                { id: 'Net Banking', label: 'Net Banking (All Major Indian Banks)', icon: '🏦' },
              ].map((pm) => {
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
                      backgroundColor: isSel ? 'rgba(201,168,76,0.18)' : '#16253B',
                      borderWidth: 1,
                      borderColor: isSel ? '#C9A84C' : 'rgba(255,255,255,0.06)',
                    }}
                  >
                    <Text style={{ fontSize: 18, marginRight: 10 }}>{pm.icon}</Text>
                    <Text style={{ flex: 1, color: isSel ? '#C9A84C' : '#F0EAD6', fontSize: 13, fontWeight: isSel ? '700' : '500' }}>
                      {pm.label}
                    </Text>
                    {isSel ? (
                      <AppIcon name="check_circle" color="#C9A84C" size={18} />
                    ) : (
                      <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: '#A0A8C0' }} />
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
                {isRecharging ? 'Processing Secure Payment...' : `Pay & Recharge ₹${rechargeAmount}`}
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
              <Text style={{ color: '#A0A8C0', fontSize: 12, textDecorationLine: 'underline' }}>
                View Full Wallet & Transaction History →
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 4. Auth Required Modal */}
      <Modal visible={showAuthModal} transparent animationType="fade" onRequestClose={() => setShowAuthModal(false)}>
        <Pressable onPress={() => setShowAuthModal(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.68)', justifyContent: 'center', padding: 24 }}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: '#0D1B2A', borderRadius: 24, padding: 22, borderWidth: 1.5, borderColor: '#C9A84C' }}>
            <View style={{ alignItems: 'center', marginBottom: 14 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(201,168,76,0.18)', borderWidth: 1.5, borderColor: '#C9A84C', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <AppIcon name="lock" color="#C9A84C" size={28} />
              </View>
              <Text style={{ color: '#F0EAD6', fontSize: 18, fontWeight: '800', textAlign: 'center' }}>
                Sign In to Consult
              </Text>
              <Text style={{ color: '#A0A8C0', fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 19 }}>
                Please sign in to your AstroParihar account to ask AI Astrologers and unlock Vedic Jyotish insights. Each consultation prompt costs ₹5 from your wallet.
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
              }}
            >
              <Text style={{ color: '#080D1A', fontSize: 15, fontWeight: '800' }}>
                Sign In / Register Now ↗
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setShowAuthModal(false)}
              style={{ marginTop: 12, alignItems: 'center', paddingVertical: 6 }}
            >
              <Text style={{ color: '#7E8BA8', fontSize: 13, fontWeight: '500' }}>
                Maybe Later
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
