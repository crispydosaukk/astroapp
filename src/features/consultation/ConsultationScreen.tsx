/**
 * Real-time Astrologer Consultation Screen
 * AstroParihar - Mobile & Web Parity
 *
 * Full integration with:
 * 1. Firebase Firestore 'consultations' booking & status polling
 * 2. Real-time Astrologer acceptance alert & ringtone synchronization
 * 3. ZegoCloud WebRTC 1-on-1 Audio/Video Call Rooms
 * 4. Live Server Billing APIs (/api/start-call-billing & /api/deduct-minute)
 */

import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Dimensions,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedBox } from '@/components/AnimatedBox';
import { AppIcon } from '@/components/AppIcon';
import { AppImage } from '@/components/AppImage';
import { Dialog, showSnackBar } from '@/components/overlays';
import { formatDobToDDMMYYYY } from '@/components/pickers';
import { Text, TextInput } from '@/components/Text';
import { useAuthStore } from '@/features/auth/authStore';
import { useBirthProfileStore } from '@/services/birthProfileStore';
import { AppRoutes, go, push, useExtra } from '@/navigation/routes';
import { submitConsultationReview } from '@/services/reviewService';
import { deductWalletBalance, getWalletBalance, subscribeWallet } from '@/services/walletService';
import { generateZegoRoomId } from '@/services/zegoService';
import { useCurrencyStore } from '@/services/currencyStore';
import {
  createConsultationBooking,
  getConsultationStatus,
  cancelConsultationBooking,
  completeConsultationBooking,
  startCallBilling,
} from '@/services/consultationService';
import { fetchCalculatedKundli, KundliChartData, sendLiveAIChatMessage } from '@/services/astrologyService';
import { VedicKundliChart } from '@/components/VedicKundliChart';
import { generateConsultationSummaryReport } from '@/services/reportService';
import { isFemaleAstrologer, speakAstrologerText, stopAstrologerSpeech } from '@/services/speechService';
import { AppColors, argb, withAlpha } from '@/theme/colors';
import { useLanguageStore } from '@/theme/languageStore';
import { useThemeColors } from '@/theme/themeStore';
import { useController } from '@/utils/anim';

type Astro = { id?: string; name: string; title?: string; imageUrl: string; semanticLabel?: string; price?: number; isAi?: boolean;[k: string]: unknown };
type Msg = { text: string; isSystem: boolean; isUser?: boolean; time: string };

function deduplicateTranscript(text: string): string {
  if (!text) return '';
  let words = text.trim().split(/\s+/);
  if (words.length <= 1) return text.trim();

  // Step 1: Clean progressive hypothesis restarts (when speech recognizer restarts sentence with more words)
  for (let minWords = 5; minWords >= 2; minWords--) {
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < words.length - minWords; i++) {
        const needle = words.slice(i, i + minWords).join(' ').toLowerCase();
        for (let j = i + minWords; j <= words.length - minWords; j++) {
          const candidate = words.slice(j, j + minWords).join(' ').toLowerCase();
          if (needle === candidate) {
            let matchLen = 0;
            while (
              i + matchLen < j &&
              j + matchLen < words.length &&
              words[i + matchLen].toLowerCase() === words[j + matchLen].toLowerCase()
            ) {
              matchLen++;
            }
            if (matchLen >= minWords) {
              words.splice(i, j - i);
              changed = true;
              break;
            }
          }
        }
        if (changed) break;
      }
    }
  }

  // Step 2: Clean consecutive duplicate phrase blocks and single repeated words
  const out: string[] = [];
  let i = 0;
  while (i < words.length) {
    let matchedLen = 0;
    const maxLen = Math.min(20, Math.floor((words.length - i) / 2));
    for (let len = maxLen; len >= 1; len--) {
      if (i + 2 * len <= words.length) {
        const p1 = words.slice(i, i + len).join(' ').toLowerCase();
        const p2 = words.slice(i + len, i + 2 * len).join(' ').toLowerCase();
        if (p1 === p2) {
          matchedLen = len;
          break;
        }
      }
    }
    if (matchedLen > 0) {
      for (let k = 0; k < matchedLen; k++) {
        out.push(words[i + k]);
      }
      i += 2 * matchedLen;
    } else {
      let isTrailingDup = false;
      const checkMax = Math.min(20, out.length);
      for (let tLen = checkMax; tLen >= 1; tLen--) {
        if (i + tLen <= words.length) {
          const prevTail = out.slice(out.length - tLen).join(' ').toLowerCase();
          const currHead = words.slice(i, i + tLen).join(' ').toLowerCase();
          if (prevTail === currHead) {
            isTrailingDup = true;
            i += tLen;
            break;
          }
        }
      }
      if (!isTrailingDup) {
        out.push(words[i]);
        i += 1;
      }
    }
  }
  return out.join(' ');
}

const SPEECH_RECOGNITION_HTML = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body>
<script>
  var rec = null;

  function cleanDedup(text) {
    if (!text) return '';
    var words = text.trim().split(/\\s+/);
    if (words.length <= 1) return text.trim();

    // Step 1: Clean progressive hypothesis restarts
    for (var minWords = 5; minWords >= 2; minWords--) {
      var changed = true;
      while (changed) {
        changed = false;
        for (var i = 0; i < words.length - minWords; i++) {
          var needle = words.slice(i, i + minWords).join(' ').toLowerCase();
          for (var j = i + minWords; j <= words.length - minWords; j++) {
            var candidate = words.slice(j, j + minWords).join(' ').toLowerCase();
            if (needle === candidate) {
              var matchLen = 0;
              while (
                i + matchLen < j &&
                j + matchLen < words.length &&
                words[i + matchLen].toLowerCase() === words[j + matchLen].toLowerCase()
              ) {
                matchLen++;
              }
              if (matchLen >= minWords) {
                words.splice(i, j - i);
                changed = true;
                break;
              }
            }
          }
          if (changed) break;
        }
      }
    }

    // Step 2: Clean consecutive duplicate phrase blocks
    var out = [];
    var k = 0;
    while (k < words.length) {
      var matchedLen = 0;
      var maxLen = Math.min(20, Math.floor((words.length - k) / 2));
      for (var len = maxLen; len >= 1; len--) {
        if (k + 2 * len <= words.length) {
          var p1 = words.slice(k, k + len).join(' ').toLowerCase();
          var p2 = words.slice(k + len, k + 2 * len).join(' ').toLowerCase();
          if (p1 === p2) {
            matchedLen = len;
            break;
          }
        }
      }
      if (matchedLen > 0) {
        for (var m = 0; m < matchedLen; m++) {
          out.push(words[k + m]);
        }
        k += 2 * matchedLen;
      } else {
        var isTrailingDup = false;
        var checkMax = Math.min(20, out.length);
        for (var tLen = checkMax; tLen >= 1; tLen--) {
          if (k + tLen <= words.length) {
            var prevTail = out.slice(out.length - tLen).join(' ').toLowerCase();
            var currHead = words.slice(k, k + tLen).join(' ').toLowerCase();
            if (prevTail === currHead) {
              isTrailingDup = true;
              k += tLen;
              break;
            }
          }
        }
        if (!isTrailingDup) {
          out.push(words[k]);
          k += 1;
        }
      }
    }
    return out.join(' ');
  }

  function startListening(lang) {
    try {
      var SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRec) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'UNSUPPORTED' }));
        return;
      }
      if (rec) {
        try { rec.abort(); } catch(e){}
      }
      rec = new SpeechRec();
      rec.lang = lang || 'en-IN';
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onstart = function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'STARTED' }));
      };

      rec.onresult = function(event) {
        var finals = [];
        var latestInterim = '';

        for (var i = 0; i < event.results.length; ++i) {
          var item = event.results[i];
          if (!item || !item[0] || !item[0].transcript) continue;
          var t = item[0].transcript.trim();
          if (!t) continue;

          if (item.isFinal) {
            finals.push(t);
          } else {
            // Non-final items are progressive hypotheses; keep only the latest hypothesis
            latestInterim = t;
          }
        }

        var finalCombined = '';
        for (var f = 0; f < finals.length; f++) {
          var fText = finals[f];
          if (!finalCombined) {
            finalCombined = fText;
          } else {
            if (fText.toLowerCase().indexOf(finalCombined.toLowerCase()) === 0) {
              finalCombined = fText;
            } else if (finalCombined.toLowerCase().indexOf(fText.toLowerCase()) !== -1) {
              // already included
            } else {
              var fcWords = finalCombined.split(/\\s+/);
              var ftWords = fText.split(/\\s+/);
              var maxOv = Math.min(fcWords.length, ftWords.length);
              var ovCount = 0;
              for (var ov = maxOv; ov > 0; ov--) {
                var fcEnd = fcWords.slice(fcWords.length - ov).join(' ').toLowerCase();
                var ftStart = ftWords.slice(0, ov).join(' ').toLowerCase();
                if (fcEnd === ftStart) {
                  ovCount = ov;
                  break;
                }
              }
              if (ovCount > 0) {
                finalCombined = finalCombined + ' ' + ftWords.slice(ovCount).join(' ');
              } else {
                finalCombined = finalCombined + ' ' + fText;
              }
            }
          }
        }

        var combined = '';
        if (!finalCombined) {
          combined = latestInterim;
        } else if (!latestInterim) {
          combined = finalCombined;
        } else {
          if (latestInterim.toLowerCase().indexOf(finalCombined.toLowerCase()) === 0) {
            combined = latestInterim;
          } else if (finalCombined.toLowerCase().indexOf(latestInterim.toLowerCase()) !== -1) {
            combined = finalCombined;
          } else {
            var fcWords2 = finalCombined.split(/\\s+/);
            var liWords = latestInterim.split(/\\s+/);
            var maxOv2 = Math.min(fcWords2.length, liWords.length);
            var ovCount2 = 0;
            for (var ov2 = maxOv2; ov2 > 0; ov2--) {
              var fcEnd2 = fcWords2.slice(fcWords2.length - ov2).join(' ').toLowerCase();
              var liStart = liWords.slice(0, ov2).join(' ').toLowerCase();
              if (fcEnd2 === liStart) {
                ovCount2 = ov2;
                break;
              }
            }
            if (ovCount2 > 0) {
              combined = finalCombined + ' ' + liWords.slice(ovCount2).join(' ');
            } else {
              combined = finalCombined + ' ' + latestInterim;
            }
          }
        }

        var cleaned = cleanDedup(combined);

        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'RESULT',
          transcript: cleaned,
          isFinal: event.results[event.results.length - 1].isFinal
        }));
      };

      rec.onerror = function(event) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', error: event.error }));
      };
      rec.onend = function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ENDED' }));
      };
      rec.start();
    } catch(err) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', error: String(err) }));
    }
  }

  function stopListening() {
    if (rec) {
      try { rec.stop(); } catch(e){}
    }
  }

  window.startListening = startListening;
  window.stopListening = stopListening;
</script>
</body>
</html>
`;

const DEFAULT_ASTRO: Astro = {
  name: 'Swami Shankarananda Giri',
  title: 'Vedic Astrologer & Dasha Expert',
  imageUrl: 'https://astroparihar.com/assets/images/ai-astrologers/swami-ji.png',
  semanticLabel: 'Elderly Indian sage with white beard and traditional orange robes',
  isOnline: true,
  price: 25,
  rating: 4.99,
};

const REPLIES = [
  'I can see the planetary positions clearly. Let me analyse this for you.',
  'Your question is very important. The stars indicate a significant period ahead.',
  'Based on your birth chart, I see strong Jupiter influence here.',
  'This is a favourable time for the matter you are asking about.',
];

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

function Avatar({ uri, size, border = 0 }: { uri: string; size: number; border?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: border, borderColor: AppColors.goldAccent, overflow: 'hidden' }}>
      <AppImage uri={uri} width="100%" height="100%" fit="cover" />
    </View>
  );
}

function ControlButton({ icon, label, isActive, activeColor, onTap, testID }: { icon: string; label: string; isActive: boolean; activeColor: string; onTap: () => void; testID: string }) {
  return (
    <Pressable testID={testID} onPress={onTap} style={{ alignItems: 'center' }}>
      <AnimatedBox duration={200} style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', backgroundColor: isActive ? withAlpha(activeColor, 40) : '#1E293B', borderColor: isActive ? activeColor : 'rgba(201, 168, 76, 0.35)' }}>
        <AppIcon name={icon} color={isActive ? activeColor : '#E2E8F0'} size={22} />
      </AnimatedBox>
      <Text style={{ marginTop: 4, color: isActive ? activeColor : '#E2E8F0', fontSize: 10, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

const DEFAULT_KUNDLI_PLANETS = [
  { name: 'Sun', symbol: '☉', sign: 'Aries', house: 1, degree: "12°34'", color: '#FFB347' },
  { name: 'Moon', symbol: '☽', sign: 'Cancer', house: 4, degree: "8°22'", color: '#E0E0E0' },
  { name: 'Mars', symbol: '♂', sign: 'Scorpio', house: 8, degree: "24°11'", color: '#FF6B6B' },
  { name: 'Mercury', symbol: '☿', sign: 'Taurus', house: 2, degree: "3°45'", color: '#90EE90' },
  { name: 'Jupiter', symbol: '♃', sign: 'Sagittarius', house: 9, degree: "17°58'", color: '#FFD700' },
  { name: 'Venus', symbol: '♀', sign: 'Pisces', house: 12, degree: "29°03'", color: '#FFB6C1' },
  { name: 'Saturn', symbol: '♄', sign: 'Capricorn', house: 10, degree: "6°17'", color: '#9370DB' },
  { name: 'Rahu', symbol: '☊', sign: 'Gemini', house: 3, degree: "14°29'", color: '#A0A8C0' },
  { name: 'Ketu', symbol: '☋', sign: 'Sagittarius', house: 9, degree: "14°29'", color: '#CD853F' },
];

export default function ConsultationScreen() {
  const colors = useThemeColors();
  const extra = useExtra<{ type?: string; astrologer?: Astro; roomID?: string }>();
  const astro = extra?.astrologer ?? DEFAULT_ASTRO;
  const isVideo = extra?.type !== 'voice';
  const isAi = Boolean((astro as any)?.isAi || astro.name?.includes('(AI)') || (astro.title && astro.title.toLowerCase().includes('ai')));
  // Unified dynamic pricing for all AI astrologers (admin controlled)
  const dynamicAiVoiceRate = useCurrencyStore((s) => s.pricingSettings.aiVoicePricePerMinute) || 25;
  const ratePerMin = isAi ? dynamicAiVoiceRate : Number(astro.price ?? 25);
  const astroGender: 'male' | 'female' =
    (astro as any)?.gender || (isFemaleAstrologer(astro.name) ? 'female' : 'male');
  const { formatPrice, formatRate } = useCurrencyStore();

  // Authentication check
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authUser = useAuthStore((s) => s.user);
  const isAuth = Boolean(isAuthenticated && authUser && (authUser.uid || authUser.phone));
  const activeProfile = useBirthProfileStore((s) => s.activeProfile);

  const [chartData, setChartData] = useState<KundliChartData | null>(null);
  const [callTab, setCallTab] = useState<'stream' | 'chart'>('stream');
  const [inCallChartFormat, setInCallChartFormat] = useState<'north' | 'south'>('south');

  // Load Devotee Birth Chart for the Call Screen
  useEffect(() => {
    const name = activeProfile?.name?.trim() || authUser?.name?.trim() || 'Devotee';
    const dob = activeProfile?.dob || authUser?.dob || '15/10/1995';
    const tob = activeProfile?.time || authUser?.tob || '12:00 PM';
    const pob = activeProfile?.place || authUser?.pob || 'New Delhi, India';

    fetchCalculatedKundli({ name, dob, tob, pob })
      .then((data) => {
        if (data) setChartData(data);
      })
      .catch(() => { });
  }, [activeProfile, authUser]);

  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [lowBalanceVisible, setLowBalanceVisible] = useState(false);
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const roomID = useRef(extra?.roomID || generateZegoRoomId()).current;

  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    useLanguageStore.getState().selectedLanguage || 'English'
  );
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [confirmEndCallVisible, setConfirmEndCallVisible] = useState(false);
  const callEndedRef = useRef(false);

  const astroDisplayName = selectedLanguage === 'Telugu'
    ? (astro.name.includes('Devavrat') ? 'ఆచార్య దేవవ్రత్ శాస్త్రి' : astro.name.includes('Dhananjay') ? 'ఆచార్య ధనంజయ్ శాస్త్రి' : 'వైదిక జ్యోతిష నిపుణుడిని')
    : selectedLanguage === 'Hindi'
      ? (astro.name.includes('Devavrat') ? 'आचार्य देवव्रत शास्त्री' : astro.name.includes('Dhananjay') ? 'आचार्य धनंजय शास्त्री' : 'वैदिक ज्योतिषी')
      : selectedLanguage === 'Tamil'
        ? (astro.name.includes('Devavrat') ? 'ஆச்சார்ய தேவவ்ரத் சாஸ்திரி' : astro.name.includes('Dhananjay') ? 'ஆச்சார்ய தனஞ்சய் சாஸ்திரி' : 'வேத ஜோதிடர்')
        : selectedLanguage === 'Kannada'
          ? (astro.name.includes('Devavrat') ? 'ಆಚಾರ್ಯ ದೇವವ್ರತ್ ಶಾಸ್ತ್ರಿ' : astro.name.includes('Dhananjay') ? 'ಆಚಾರ್ಯ ಧನಂಜಯ್ ಶಾಸ್ತ್ರಿ' : 'ವೈದಿಕ ಜ್ಯೋತಿಷಿ')
          : selectedLanguage === 'Malayalam'
            ? (astro.name.includes('Devavrat') ? 'ആചാര്യ ദേവവ്രത് ശാസ്ത്രി' : astro.name.includes('Dhananjay') ? 'ആചാര്യ ധനഞ്ജയ് ശാസ്ത്രി' : 'വൈദിക ജ്യോതിഷി')
            : astro.name;

  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Real consultation states
  const [isWaitingAstrologer, setIsWaitingAstrologer] = useState(!isAi);
  const [acceptanceCountdown, setAcceptanceCountdown] = useState(60);
  const [connectionStatusText, setConnectionStatusText] = useState(
    isAi ? 'Connecting to AI Astrologer...' : 'Calling Astrologer... Waiting for acceptance'
  );

  const insets = useSafeAreaInsets();
  const [isMuted, setMuted] = useState(false);
  const [isCameraOff, setCameraOff] = useState(false);
  const [isSpeakerOn, setSpeakerOn] = useState(true);
  const [isChatOpen, setChatOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [balance, setBalance] = useState(0);
  const [totalCharged, setTotalCharged] = useState(0);
  const [messages, setMessages] = useState<Msg[]>([]);
  const messagesRef = useRef<Msg[]>([]);
  const isHoldPressRef = useRef(false);
  const lastSentTextRef = useRef('');
  const lastSentTimestampRef = useRef(0);
  const isSendingMessageRef = useRef(false);
  const holdEndTimerRef = useRef<any>(null);
  const isVoiceSendingRef = useRef(false);

  const updateMessages = (updater: Msg[] | ((prev: Msg[]) => Msg[])) => {
    setMessages((prev) => {
      let next = typeof updater === 'function' ? (updater as (p: Msg[]) => Msg[])(prev) : updater;
      // Filter out immediate consecutive duplicate messages (user messages or duplicate system alerts)
      if (next.length > 1) {
        const cleaned: Msg[] = [];
        for (let i = 0; i < next.length; i++) {
          const curr = next[i];
          const prevMsg = cleaned[cleaned.length - 1];
          if (
            prevMsg &&
            prevMsg.isUser === curr.isUser &&
            prevMsg.text.trim().toLowerCase() === curr.text.trim().toLowerCase()
          ) {
            continue; // Skip consecutive duplicate message
          }
          cleaned.push(curr);
        }
        next = cleaned;
      }
      messagesRef.current = next;
      return next;
    });
  };

  const [input, setInput] = useState('');
  const [ended, setEnded] = useState(false);
  const [lastGeneratedReportId, setLastGeneratedReportId] = useState<string>('');
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [voiceQueryInput, setVoiceQueryInput] = useState('');
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const speechWebViewRef = useRef<any>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isVoiceInputFocused, setIsVoiceInputFocused] = useState(false);
  const [isChatInputFocused, setIsChatInputFocused] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [analyzingTipText, setAnalyzingTipText] = useState('');
  const [isHoldingMic, setIsHoldingMic] = useState(false);
  const holdStartTimeRef = useRef(0);
  const spokenTranscriptRef = useRef('');
  const voiceScrollRef = useRef<ScrollView>(null);
  const isKeypadActive = keyboardHeight > 0;
  const isChatKeypadOpen = keyboardHeight > 0;
  const { height: windowH } = useWindowDimensions();
  const screenH = Dimensions.get('screen').height;
  const initialWindowH = useRef(Dimensions.get('window').height).current;
  const isWindowResized = Platform.OS === 'android' && windowH < initialWindowH - 150;
  const androidBottomPad = Platform.OS === 'android'
    ? (isWindowResized ? 0 : keyboardHeight + (keyboardHeight > 0 ? Math.max(insets.bottom, 0) + 8 : 0))
    : 0;

  useEffect(() => {
    const onShow = (e: any) => {
      const h = e?.endCoordinates?.height || 0;
      if (h > 0) setKeyboardHeight((prev) => (prev === h ? prev : h));
    };
    const onHide = () => {
      setKeyboardHeight((prev) => (prev === 0 ? prev : 0));
    };

    const s1 = Keyboard.addListener('keyboardWillShow', onShow);
    const s2 = Keyboard.addListener('keyboardDidShow', onShow);
    const s3 = Keyboard.addListener('keyboardWillHide', onHide);
    const s4 = Keyboard.addListener('keyboardDidHide', onHide);

    return () => {
      s1.remove();
      s2.remove();
      s3.remove();
      s4.remove();
    };
  }, []);

  // Review states
  const [reviewRating, setReviewRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'Accurate Prediction 🎯',
    'Calm & Compassionate 🙏',
  ]);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const secondsRef = useRef(0);
  secondsRef.current = seconds;
  const consultationIdRef = useRef<string | null>(null);
  consultationIdRef.current = consultationId;

  const timers = useRef<{
    countdown?: ReturnType<typeof setInterval>;
    poll?: ReturnType<typeof setInterval>;
    call?: ReturnType<typeof setInterval>;
    balance?: ReturnType<typeof setInterval>;
  }>({});
  const listRef = useRef<FlatList<Msg>>(null);
  const mounted = useRef(true);

  const scrollChat = () => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 0);
  const addSystem = (text: string) => {
    updateMessages((m) => [...m, { text, isSystem: true, time: fmt(secondsRef.current) }]);
    scrollChat();
  };

  const stopTimers = () => {
    clearInterval(timers.current.countdown);
    clearInterval(timers.current.poll);
    clearInterval(timers.current.call);
    clearInterval(timers.current.balance);
    stopAstrologerSpeech();
  };

  const endCall = async () => {
    callEndedRef.current = true;
    setConnecting(false);
    setConfirmEndCallVisible(false);
    stopTimers();
    stopAstrologerSpeech();
    setIsWaitingAstrologer(false);
    setIsAiSpeaking(false);
    setIsListening(false);
    setEnded(true);

    const consultId = consultationIdRef.current || `call_${Date.now()}`;
    const durationSec = secondsRef.current;
    const durationMins = Math.max(1, Math.round(durationSec / 60));
    const durationText = fmt(durationSec);
    const charged = totalCharged > 0 ? totalCharged : Number(ratePerMin.toFixed(2));
    const dateFormatted = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const dateISO = new Date().toISOString();

    // 1. Generate & Save Consultation Summary Report ONLY if user asked questions
    // Read from messagesRef to ensure we have the live, un-staled messages
    const allMsgs = messagesRef.current.length > 0 ? messagesRef.current : messages;
    const userExchanges = allMsgs.filter((m) => m.isUser && m.text && m.text.trim().length > 0);
    const hasUserAskedQuestions = userExchanges.length > 0;
    // Generate report strictly if user asked questions
    const shouldGenerateReport = hasUserAskedQuestions;

    let genReportId = '';
    if (shouldGenerateReport) {
      try {
        const chatSummary = allMsgs.filter((m) => !m.isSystem).length > 0
          ? allMsgs.filter((m) => !m.isSystem).map((m) => `${m.isUser ? 'Devotee' : astro.name}:\n${m.text}`).join('\n\n')
          : `Devotee ${devoteeName} consulted with Vedic Astrologer ${astro.name} regarding Kundli analysis, planetary transits, and Vedic remedies.`;

        const rep = await generateConsultationSummaryReport(
          {
            consultationId: consultId,
            astrologerName: astro.name,
            astrologerId: String((astro as any).id || (astro as any).uid || 'astro_live'),
            serviceType: isVideo ? 'Video Call' : 'Voice Call',
            durationText,
            durationMinutes: durationMins,
            amountCharged: charged,
            devoteeName,
            devoteeDob,
            devoteeTob,
            devoteePob,
            devoteeLagna,
            devoteeRashi,
            devoteeNakshatra,
            language: selectedLanguage,
            chatSummary,
            primaryConcern: userExchanges[0]?.text || undefined,
          },
          authUser?.uid || authUser?.phone
        );
        genReportId = rep.id;
      } catch (err) {
        console.warn('generateConsultationSummaryReport error:', err);
      }
    }
    setLastGeneratedReportId(genReportId);
    setConnected(false);

    if (consultationIdRef.current) {
      completeConsultationBooking(consultationIdRef.current).catch(() => { });
    }

    try {
      const stored = await AsyncStorage.getItem('astroparihar_consultation_history');
      const list = stored ? JSON.parse(stored) : [];
      const record = {
        id: consultId,
        customerId: authUser?.uid || 'anonymous_user',
        customerPhone: authUser?.phone || '',
        customerName: devoteeName,
        astrologerName: astro.name,
        astrologer: astro.name,
        type: isVideo ? 'Video Call' : 'Voice Call',
        topic: 'Vedic Kundli & Parihar Consultation',
        date: dateFormatted,
        createdAt: dateISO,
        duration: `${durationMins} min`,
        durationMinutes: durationMins,
        amount: charged,
        price: charged,
        rawAmount: charged,
        avatar: astro.imageUrl,
        roomID,
        rating: 5,
        status: 'completed',
        source: isAi ? 'ai' : 'human',
        emoji: isAi ? '🤖' : isVideo ? '📹' : '🔮',
        color: isAi ? '#81C784' : isVideo ? '#FF6B6B' : '#FFD700',
        reportId: genReportId || undefined,
      };
      const filtered = list.filter((item: any) => item.id !== consultId);
      await AsyncStorage.setItem('astroparihar_consultation_history', JSON.stringify([record, ...filtered]));

      // Also sync to Firestore
      fetch(`https://firestore.googleapis.com/v1/projects/astroparihar-85e2d/databases/(default)/documents/${isAi ? 'ai_consultations' : 'consultations'}?key=AIzaSyCXZ9S7Th0lpAVLMnZnRlgusCH1dPgF98g`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            customerId: { stringValue: authUser?.uid || 'anonymous_user' },
            customerPhone: { stringValue: authUser?.phone || '' },
            customerName: { stringValue: devoteeName },
            astrologerName: { stringValue: astro.name },
            type: { stringValue: isVideo ? 'Video Call' : 'Voice Call' },
            topic: { stringValue: 'Vedic Kundli & Parihar Consultation' },
            duration: { stringValue: `${durationMins} min` },
            durationMinutes: { integerValue: String(durationMins) },
            price: { doubleValue: charged },
            amount: { doubleValue: charged },
            rating: { integerValue: '5' },
            status: { stringValue: 'completed' },
            createdAt: { stringValue: dateISO },
            roomID: { stringValue: roomID },
            reportId: { stringValue: genReportId },
            source: { stringValue: isAi ? 'ai' : 'human' },
          },
        }),
      }).catch(() => { });
    } catch { }
  };

  const cancelCallBeforeAcceptance = async () => {
    callEndedRef.current = true;
    stopTimers();
    stopAstrologerSpeech();
    if (consultationIdRef.current) {
      await cancelConsultationBooking(consultationIdRef.current, 'Cancelled by user before acceptance');
    }
    showSnackBar('Consultation request cancelled. No amount was deducted.', '#D97706');
    if (router.canGoBack()) router.back();
  };

  const handleCloseEndedPopup = () => {
    setEnded(false);
    stopTimers();
    stopAstrologerSpeech();
    if (router.canGoBack()) {
      router.back();
    } else {
      go(AppRoutes.homeDashboardScreen);
    }
  };

  // 1. Initial wallet subscription & real-time balance sync
  useEffect(() => {
    let isSubscribed = true;
    getWalletBalance().then((b) => {
      if (isSubscribed) setBalance(b);
    });
    const unsub = subscribeWallet((b) => {
      if (isSubscribed) setBalance(b);
    });
    return () => {
      isSubscribed = false;
      unsub();
    };
  }, []);

  // 2. Strict Authentication and 5-min minimum wallet balance verification
  useEffect(() => {
    if (!isAuth) {
      setConnecting(false);
      setAuthModalVisible(true);
      return;
    }

    const minRequired = ratePerMin * 5;

    // If this is an AI Astrologer: Connect and initialize
    if (isAi) {
      const activeConsultId = consultationIdRef.current || `ai_call_${Date.now()}_${roomID}`;
      setConsultationId(activeConsultId);
      consultationIdRef.current = activeConsultId;

      const initialGreeting = selectedLanguage === 'Telugu'
        ? `నమస్కారం! నేను మీ జ్యోతిష నిపుణుడు ${astroDisplayName}. మీ కుండలి పరిశీలించడానికి సిద్ధంగా ఉన్నాను. మీ ఉద్యోగం, వివాహం, ఆర్థికం లేదా గ్రహ పరిహారాల గురించి ఏ ప్రశ్న అయినా అడగండి.`
        : selectedLanguage === 'Hindi'
          ? `नमस्ते! मैं आपका ज्योतिषी ${astroDisplayName} हूँ। आपकी जन्म कुंडली के अनुसार करियर, विवाह, धन या ग्रह शांति के बारे में आप क्या जानना चाहते हैं?`
          : selectedLanguage === 'Tamil'
            ? `வணக்கம்! நான் உங்கள் வேத ஜோதிடர் ${astroDisplayName}. உங்கள் ஜாதகத்தை கணிக்க தயாராக உள்ளேன். உங்கள் தொழில், திருமணம், நிதி அல்லது கிரக பரிகாரங்கள் குறித்து கேளுங்கள்.`
            : selectedLanguage === 'Kannada'
              ? `ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ವೈದಿಕ ಜ್ಯೋತಿಷಿ ${astroDisplayName}. ನಿಮ್ಮ ಜನ್ಮ ಕುಂಡಲಿಯನ್ನು ವಿಶ್ಲೇಷಿಸಲು ಸಿದ್ಧನಾಗಿದ್ದೇನೆ. ನಿಮ್ಮ ಉದ್ಯೋಗ, ವಿವಾಹ, ಆರ್ಥಿಕ ಅಥವಾ ಪರಿಹಾರಗಳ ಬಗ್ಗೆ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಬಹುದು.`
              : selectedLanguage === 'Malayalam'
                ? `നമസ്കാരം! ഞാൻ നിങ്ങളുടെ വൈദിക ജ്യോതിഷി ${astroDisplayName}. നിങ്ങളുടെ ജാതകം പരിശോധിക്കാൻ തയ്യാറാണ്. കരിയർ, വിവാഹം, ധനം, പരിഹാരങ്ങൾ എന്നിവയെക്കുറിച്ച് ചോദിക്കാം.`
                : `Namaste! I am your Vedic astrologer ${astro.name}. I am analyzing your birth chart. Please ask any question regarding career, marriage, finances, or planetary remedies.`;

      // 1. Verify 5-minute minimum balance BEFORE connecting
      (async () => {
        const curBal = await getWalletBalance();
        if (!mounted.current || callEndedRef.current) return;
        setBalance(curBal);

        if (curBal < minRequired) {
          // DO NOT connect: Stop all connection, speech, and timers; show professional low balance dialog
          setConnecting(false);
          setConnected(false);
          setIsWaitingAstrologer(false);
          setIsAiSpeaking(false);
          setLowBalanceVisible(true);
          return;
        }

        // If customer has at least 5 mins balance: Connect cleanly
        setConnecting(false);
        setConnected(true);
        setIsWaitingAstrologer(false);

        // 2. Display greeting in transcript
        updateMessages([
          { text: initialGreeting, isSystem: false, isUser: false, time: fmt(0) }
        ]);

        // 3. Audio speech starts once 5-min balance is verified (recites full greeting)
        speakAstrologerText(initialGreeting, {
          astrologerName: astro.name,
          gender: astroGender,
          language: selectedLanguage,
          onStart: () => { if (!callEndedRef.current) setIsAiSpeaking(true); },
          onDone: () => setIsAiSpeaking(false),
        });

        // 4. Start call timer
        timers.current.call = setInterval(() => setSeconds((s) => s + 1), 1000);

        // 5. Deduct 1st minute
        const firstMin = await deductWalletBalance(
          ratePerMin,
          `1st Min: AI Consultation with ${astro.name}`,
          astro.name,
          undefined,
          { displayAmount: `-${formatPrice(ratePerMin)}` }
        );
        if (!mounted.current || callEndedRef.current) return;
        if (firstMin.success) {
          setBalance(firstMin.newBalance);
          setTotalCharged(Number(ratePerMin.toFixed(2)));
          addSystem(`AI Consultation connected. First minute (${formatPrice(ratePerMin)}) billed.`);
          addSystem(`Session: ${roomID}`);
        } else if (firstMin.isDepleted) {
          stopAstrologerSpeech();
          setIsAiSpeaking(false);
          setLowBalanceVisible(true);
          return;
        }

        // 60-second billing interval
        timers.current.balance = setInterval(async () => {
          const res = await deductWalletBalance(
            ratePerMin,
            `AI Consultation with ${astro.name}`,
            astro.name,
            undefined,
            { displayAmount: `-${formatPrice(ratePerMin)}` }
          );
          if (res.success) {
            setBalance(res.newBalance);
            setTotalCharged((prev) => Number((prev + ratePerMin).toFixed(2)));
          } else if (res.isDepleted) {
            addSystem('Wallet balance exhausted. Ending session...');
            setTimeout(endCall, 800);
          }
        }, 60000);
      })();

      return;
    }

    getWalletBalance().then(async (curBal) => {
      if (!mounted.current) return;
      setBalance(curBal);

      if (curBal < minRequired) {
        setConnecting(false);
        setLowBalanceVisible(true);
        return;
      }

      // If this is a REAL HUMAN Astrologer:
      // Create live Firestore booking and wait for astrologer acceptance
      try {
        setConnectionStatusText(`Sending request to ${astro.name}...`);
        const activeProfile = useBirthProfileStore.getState().activeProfile;
        const customerName = activeProfile?.name?.trim() || authUser?.name?.trim() || 'Customer';
        const bookingRes = await createConsultationBooking({
          astrologerId: String((astro as any).id || (astro as any).uid || 'astrologer_live'),
          astrologerName: astro.name,
          customerId: authUser?.uid || 'anonymous_user',
          customerName,
          customerPhone: authUser?.phone || '',
          customerDob: activeProfile?.dob || (authUser as any)?.dob || '',
          customerTob: activeProfile?.time || (authUser as any)?.tob || '',
          customerPob: activeProfile?.place || (authUser as any)?.pob || '',
          customerGender: activeProfile?.gender || (authUser as any)?.gender || '',
          customerRelation: activeProfile?.type || 'Myself',
          type: isVideo ? 'video' : 'voice',
          price: ratePerMin,
          roomID,
          duration: Math.floor(curBal / ratePerMin),
        });

        if (!bookingRes.success || !bookingRes.consultationId) {
          showSnackBar(bookingRes.error || 'Failed to request consultation.', '#CF4444');
          setTimeout(() => { if (router.canGoBack()) router.back(); }, 1200);
          return;
        }

        const activeConsultId = bookingRes.consultationId;
        setConsultationId(activeConsultId);
        setIsWaitingAstrologer(true);
        setConnectionStatusText(`Waiting for ${astro.name} to accept...`);

        // Countdown timer: 60s
        let countdownSec = 60;
        timers.current.countdown = setInterval(() => {
          countdownSec -= 1;
          setAcceptanceCountdown(countdownSec);
          if (countdownSec <= 0) {
            clearInterval(timers.current.countdown);
            clearInterval(timers.current.poll);
            cancelConsultationBooking(activeConsultId, 'Astrologer timeout (60s)').catch(() => { });
            showSnackBar(`${astro.name} is currently occupied with devotees. Please try again or select another astrologer.`, '#D97706');
            setTimeout(() => { if (router.canGoBack()) router.back(); }, 1500);
          }
        }, 1000);

        // Status Polling every 2.5s
        timers.current.poll = setInterval(async () => {
          const statusRes = await getConsultationStatus(activeConsultId);
          if (!mounted.current) return;

          if (statusRes.status === 'active') {
            // Astrologer accepted!
            clearInterval(timers.current.countdown);
            clearInterval(timers.current.poll);

            setIsWaitingAstrologer(false);
            setConnecting(false);
            setConnected(true);

            // Trigger server call billing
            try {
              await startCallBilling(activeConsultId);
            } catch { }

            // Deduct 1st minute from live database
            const firstMin = await deductWalletBalance(
              ratePerMin,
              `1st Min: ${isVideo ? 'Video' : 'Voice'} Call with ${astro.name}`,
              astro.name,
              activeConsultId,
              { displayAmount: `-${formatPrice(ratePerMin)}` }
            );
            if (firstMin.success) {
              setBalance(firstMin.newBalance);
              setTotalCharged(Number(ratePerMin.toFixed(2)));
              addSystem(`Astrologer accepted! Call connected. First minute (${formatPrice(ratePerMin)}) billed.`);
              addSystem(`ZegoCloud Room: ${roomID}`);
            }

            // Start 1-second call duration timer
            timers.current.call = setInterval(() => setSeconds((s) => s + 1), 1000);

            // Start 60-second billing interval calling live /api/deduct-minute
            timers.current.balance = setInterval(async () => {
              const res = await deductWalletBalance(
                ratePerMin,
                `${isVideo ? 'Video' : 'Voice'} Call with ${astro.name}`,
                astro.name,
                activeConsultId,
                { displayAmount: `-${formatPrice(ratePerMin)}` }
              );
              if (res.success) {
                setBalance(res.newBalance);
                setTotalCharged((prev) => Number((prev + ratePerMin).toFixed(2)));
                if (res.newBalance < ratePerMin) {
                  addSystem(`⚠️ Low balance: ${formatPrice(res.newBalance)} left. Less than 1 minute remaining.`);
                }
              } else if (res.isDepleted) {
                addSystem('Wallet balance exhausted. Ending session...');
                setTimeout(endCall, 800);
              }
            }, 60000);
          } else if (statusRes.status === 'declined' || statusRes.status === 'cancelled') {
            clearInterval(timers.current.countdown);
            clearInterval(timers.current.poll);
            showSnackBar(`${astro.name} is unavailable right now. No amount has been deducted.`, '#D97706');
            setTimeout(() => { if (router.canGoBack()) router.back(); }, 1500);
          }
        }, 2500);
      } catch (err: any) {
        showSnackBar(err.message || 'Error connecting to astrologer', '#CF4444');
      }
    });

    return () => {
      mounted.current = false;
      callEndedRef.current = true;
      stopTimers();
      stopAstrologerSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth]);

  // Clean Android Hardware Back press handling: Prompts confirmation instead of abruptly ending or disconnecting
  useEffect(() => {
    const onBackPress = () => {
      if (confirmEndCallVisible) {
        setConfirmEndCallVisible(false);
        return true;
      }
      if (connected && !ended && !callEndedRef.current) {
        setConfirmEndCallVisible(true);
        return true;
      }
      stopTimers();
      stopAstrologerSpeech();
      return false;
    };
    const backSub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => {
      backSub.remove();
    };
  }, [connected, ended, confirmEndCallVisible]);

  const QUICK_VOICE_TOPICS = selectedLanguage === 'Telugu' ? [
    { label: '💼 ఉద్యోగం & కెరీర్', query: 'నా ఉద్యోగం మరియు కెరీర్ భవిష్యత్తు ఎలా ఉంది? ప్రమోషన్ ఎప్పుడు వస్తుంది?' },
    { label: '💍 వివాహ సమయం', query: 'నా జాతకంలో వివాహ యోగం ఎప్పుడు ఉంది? ఎలాంటి సంబంధం కుదురుతుంది?' },
    { label: '💰 ఆర్థిక వృద్ధి', query: 'నా ఆర్థిక పరిస్థితి ఎప్పుడు మెరుగుపడుతుంది? ధన లాభం ఎప్పుడు కలుగుతుంది?' },
    { label: '🪐 రాహు-కేతు పరిహారం', query: 'నా జాతకంలో రాహు కేతు లేదా శని దోషాలు ఉన్నాయా? నివారణ పరిహారాలు ఏమిటి?' },
    { label: '✨ అదృష్ట రత్నం', query: 'నా కుండలికి అత్యంత అనుకూలమైన అదృష్ట రత్నం మరియు రుద్రాక్ష ఏది?' },
    { label: '🙏 శాంతి పరిహారం', query: 'ప్రస్తుతం నా గ్రహ శాంతికి ఏ దేవతా పూజ లేదా హోమం చేయాలి?' },
  ] : selectedLanguage === 'Hindi' ? [
    { label: '💼 करियर व नौकरी', query: 'मेरे करियर और नौकरी में पदोन्नति का समय कब बनेगा?' },
    { label: '💍 विवाह योग', query: 'मेरी कुंडली में विवाह का शुभ योग कब बन रहा है?' },
    { label: '💰 धन व समृद्धि', query: 'आर्थिक स्थिति में सुधार और धन लाभ का योग कब है?' },
    { label: '🪐 ग्रह दोष शांति', query: 'क्या मेरी कुंडली में कोई ग्रह दोष है और उसका निवारण क्या है?' },
    { label: '✨ शुभ रत्न व रुद्राक्ष', query: 'मेरी जन्म कुंडली के अनुसार मेरे लिए सबसे शुभ रत्न और रुद्राक्ष कौन सा है?' },
    { label: '🙏 वैदिक उपाय', query: 'ग्रह शांति के लिए कौन सा सरल एवं सिद्ध उपाय करना चाहिए?' },
  ] : selectedLanguage === 'Tamil' ? [
    { label: '💼 வேலை & தொழில்', query: 'எனது தொழில் மற்றும் வேலை வாய்ப்புகள் எப்படி உள்ளன? பதவி உயர்வு எப்போது கிடைக்கும்?' },
    { label: '💍 திருமண நேரம்', query: 'எனது ஜாதகத்தில் திருமண யோகம் எப்போது கூடிவரும்?' },
    { label: '💰 பண வரவு & செல்வம்', query: 'எனது நிதி நிலைமை எப்போது சீராகும் மற்றும் பண வரவு எப்போது உண்டாகும்?' },
    { label: '🪐 ராகு-கேது பரிகாரம்', query: 'எனது ஜாதகத்தில் ஏழரை சனி அல்லது ராகு தோஷம் உள்ளதா? எளிய பரிகாரங்கள் என்ன?' },
    { label: '✨ அதிர்ஷ்ட ரத்தினம்', query: 'என் ராசி மற்றும் லக்னத்திற்கு உகந்த அதிர்ஷ்ட ரத்தினம் எது?' },
    { label: '🙏 பரிகார பூஜை', query: 'கிரக தோஷ சாந்திக்கு நான் என்ன தெய்வ வழிபாடு செய்ய வேண்டும்?' },
  ] : selectedLanguage === 'Kannada' ? [
    { label: '💼 ಉದ್ಯೋಗ & ವೃತ್ತಿ', query: 'ನನ್ನ ಉದ್ಯೋಗ ಮತ್ತು ವೃತ್ತಿ ಭವಿಷ್ಯ ಹೇಗಿದೆ? ಬಡ್ತಿ ಯಾವಾಗ ಸಿಗಬಹುದು?' },
    { label: '💍 ವಿವಾಹ ಯೋಗ', query: 'ನನ್ನ ಜಾತಕದಲ್ಲಿ ವಿವಾಹ ಯೋಗ ಯಾವಾಗ ಕೂಡಿಬರಲಿದೆ?' },
    { label: '💰 ಆರ್ಥಿಕ ಪ್ರಗತಿ', query: 'ನನ್ನ ಆರ್ಥಿಕ ಪರಿಸ್ಥಿತಿ ಯಾವಾಗ ಸುಧಾರಿಸಲಿದೆ ಮತ್ತು ಧನ ಲಾಭ ಯಾವಾಗ?' },
    { label: '🪐 ರಾಹು-ಕೇತು ಪರಿಹಾರ', query: 'ನನ್ನ ಜಾತಕದಲ್ಲಿ ರಾಹು ಕೇತು ಅಥವಾ ಶನಿ ದೋಷವಿದೆಯೇ? ಸರಳ ಪರಿಹಾರಗಳೇನು?' },
    { label: '✨ ಅದೃಷ್ಟ ರತ್ನ', query: 'ನನ್ನ ಕುಂಡಲಿಗೆ ಅತ್ಯಂತ ಸೂಕ್ತವಾದ ಅದೃಷ್ಟ ರತ್ನ ಮತ್ತು ರುದ್ರಾಕ್ಷಿ ಯಾವುದು?' },
    { label: '🙏 ಶಾಂತಿ ಪರಿಹಾರ', query: 'ಗ್ರಹ ಶಾಂತಿಗಾಗಿ ಯಾವ ದೇವರ ಆರಾಧನೆ ಅಥವಾ ಪೂಜೆ ಮಾಡಬೇಕು?' },
  ] : selectedLanguage === 'Malayalam' ? [
    { label: '💼 ജോലി & കരിയർ', query: 'എന്റെ കരിയറും ജോലിയും എങ്ങനെയുണ്ടാകും? പ്രമോഷൻ എപ്പോഴാണ് ലഭിക്കുക?' },
    { label: '💍 വിവാഹ സമയം', query: 'എന്റെ ജാതകത്തിൽ വിവാഹ സമയം എപ്പോഴാണ് അനുകൂലമാകുന്നത്?' },
    { label: '💰 സാമ്പത്തിക വളർച്ച', query: 'എന്റെ സാമ്പത്തിക സ്ഥിതി എപ്പോൾ മെച്ചപ്പെടും?' },
    { label: '🪐 ദോഷ പരിഹാരം', query: 'എന്റെ ജാതകത്തിൽ എന്തെങ്കിലും ഗ്രഹദോഷങ്ങൾ ഉണ്ടോ? എന്ത് പരിഹാരമാണ് വേണ്ടത്?' },
    { label: '✨ ഭാഗ്യ രത്നം', query: 'എന്റെ നക്ഷത്രത്തിനും ലഗ്നത്തിനും അനുയോജ്യമായ രത്നം ഏതാണ്?' },
    { label: '🙏 വൈദിക പൂജ', query: 'ഗ്രഹശാന്തിക്കായി ഞാൻ ഏത് ദേവതയെയാണ് ഭജിക്കേണ്ടത്?' },
  ] : [
    { label: '💼 Career & Job', query: 'What does my birth chart indicate regarding my career progression and financial stability?' },
    { label: '💍 Marriage Timing', query: 'When will the auspicious window for marriage or relationship harmony open in my chart?' },
    { label: '💰 Wealth & Finance', query: 'What are the upcoming planetary indicators for wealth accumulation and prosperity?' },
    { label: '🪐 Dosha Parihar', query: 'Are there any active planetary doshas affecting me, and what parihar is prescribed?' },
    { label: '✨ Lucky Gemstone', query: 'Which gemstone and rudraksha best align with my ascendant and moon sign?' },
    { label: '🙏 Vedic Remedies', query: 'Which daily mantra and deity sadhana is most potent for my current dasha?' },
  ];

  const sendMessage = async (customText?: string) => {
    if (callEndedRef.current) return;
    const text = (typeof customText === 'string' ? customText : input).trim();
    if (!text) return;

    // Strict deduplication guard: prevent same text being sent within 3 seconds
    const now = Date.now();
    if (
      lastSentTextRef.current.trim().toLowerCase() === text.trim().toLowerCase() &&
      now - lastSentTimestampRef.current < 3000
    ) {
      return;
    }
    if (isSendingMessageRef.current) return;
    isSendingMessageRef.current = true;
    lastSentTextRef.current = text;
    lastSentTimestampRef.current = now;

    Keyboard.dismiss();
    setIsChatInputFocused(false);
    updateMessages((m) => [...m, { text, isSystem: false, isUser: true, time: fmt(secondsRef.current) }]);
    if (typeof customText !== 'string') setInput('');
    setIsListening(false);
    scrollChat();

    setTimeout(() => {
      isSendingMessageRef.current = false;
    }, 600);

    if (isAi) {
      setIsAiAnalyzing(true);
      setAnalyzingTipText(
        selectedLanguage === 'Telugu'
          ? `🔮 మీ జన్మ కుండలి మరియు గ్రహ గోచారాలను విశ్లేషిస్తున్నారు...`
          : selectedLanguage === 'Hindi'
            ? `🔮 आपकी जन्म कुंडली और ग्रह गोचर का विश्लेषण हो रहा है...`
            : selectedLanguage === 'Tamil'
              ? `🔮 உங்கள் ஜாதகம் மற்றும் கிரக நிலைகள் ஆராயப்படுகின்றன...`
              : selectedLanguage === 'Kannada'
                ? `🔮 ನಿಮ್ಮ ಜನ್ಮ ಕುಂಡಲಿ ಮತ್ತು ಗ್ರಹ ಸಂಚಾರಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...`
                : selectedLanguage === 'Malayalam'
                  ? `🔮 നിങ്ങളുടെ ജാതകവും ഗ്രഹ നിലയും വിശകലനം ചെയ്യുന്നു...`
                  : `🔮 Analyzing your Janam Kundli & planetary transits...`
      );
      try {
        const res = await sendLiveAIChatMessage({
          messages: [{ role: 'user', content: text }],
          language: selectedLanguage,
          astrologerId: String((astro as any).id || 'acharya-devavrat'),
        });
        if (callEndedRef.current) return;
        if (res.reply) {
          setIsAiAnalyzing(false);
          updateMessages((m) => [...m, { text: res.reply, isSystem: false, isUser: false, time: fmt(secondsRef.current) }]);
          scrollChat();
          if (isSpeakerOn && !isMuted && !callEndedRef.current) {
            speakAstrologerText(res.reply, {
              astrologerName: astro.name,
              gender: astroGender,
              language: selectedLanguage,
              onStart: () => { if (!callEndedRef.current) setIsAiSpeaking(true); },
              onDone: () => setIsAiSpeaking(false),
            });
          }
          return;
        }
      } catch { }
      finally {
        setIsAiAnalyzing(false);
      }
    }

    setTimeout(() => {
      setIsAiAnalyzing(false);
      if (!mounted.current || callEndedRef.current) return;
      const fallbackReply = selectedLanguage === 'Telugu'
        ? `మీ జన్మ కుండలిని పరిశీలించాను. గ్రహ గోచారాల ప్రభావం సానుకూలంగా ఉంది. నిత్యం ఇష్టదేవతా స్మరణ మరియు తూర్పు ముఖంగా దీపారాధన చేయండి.`
        : selectedLanguage === 'Hindi'
          ? `आपकी जन्म कुंडली के अनुसार देवगुरु बृहस्पति का गोचर शुभ है। प्रतिदिन सूर्य को अर्घ्य दें एवं वैदिक उपाय करें।`
          : selectedLanguage === 'Tamil'
            ? `உங்கள் ஜாதகத்தை கணித்ததில் கிரக நிலைகள் சுபமாக உள்ளன. தினமும் இஷ்ட தெய்வ வழிபாடு மற்றும் விளக்கேற்றி பிரார்த்தனை செய்யவும்.`
            : selectedLanguage === 'Kannada'
              ? `ನಿಮ್ಮ ಜನ್ಮ ಕುಂಡಲಿಯನ್ನು ಪರಿಶೀಲಿಸಿದ್ದೇನೆ. ಗ್ರಹ ಸಂಚಾರಗಳು ಅನುಕೂಲಕರವಾಗಿವೆ. ನಿತ್ಯವೂ ಇಷ್ಟ ದೇವತಾ ಪ್ರಾರ್ಥನೆ ಮತ್ತು ತುಳಸಿ ಪೂಜೆ ಮಾಡಿ.`
              : selectedLanguage === 'Malayalam'
                ? `നിങ്ങളുടെ ജാതകം പരിശോധിച്ചു. ഗ്രഹങ്ങളുടെ സ്വാധീനം അനുകൂലമാണ്. ദിവസവും ഇഷ്ടദേവതാ പ്രാർത്ഥന നടത്തുക.`
                : `Based on your birth chart, the planetary transits are supportive. Maintain mental peace and observe your daily remedies.`;
      updateMessages((m) => [...m, { text: fallbackReply, isSystem: false, isUser: false, time: fmt(secondsRef.current) }]);
      scrollChat();
      if (isAi && isSpeakerOn && !isMuted && !callEndedRef.current) {
        speakAstrologerText(fallbackReply, {
          astrologerName: astro.name,
          gender: astroGender,
          language: selectedLanguage,
          onStart: () => { if (!callEndedRef.current) setIsAiSpeaking(true); },
          onDone: () => setIsAiSpeaking(false),
        });
      }
    }, 1500);
  };

  const handleQuickTopicVoiceConsult = (query: string) => {
    sendMessage(query);
  };

  const startVoiceListening = () => {
    stopAstrologerSpeech();
    setIsAiSpeaking(false);
    setIsVoiceInputFocused(false);
    setIsListening(true);
    setVoiceModalVisible(true);
    setSpokenTranscript('');
    spokenTranscriptRef.current = '';
    setSpeechError(null);

    const langCode =
      selectedLanguage === 'Telugu'
        ? 'te-IN'
        : selectedLanguage === 'Hindi'
          ? 'hi-IN'
          : selectedLanguage === 'Tamil'
            ? 'ta-IN'
            : selectedLanguage === 'Kannada'
              ? 'kn-IN'
              : selectedLanguage === 'Malayalam'
                ? 'ml-IN'
                : 'en-IN';

    speechWebViewRef.current?.injectJavaScript(`if (window.startListening) { window.startListening("${langCode}"); } true;`);
  };

  const stopVoiceListeningAndSend = (textToSend?: string) => {
    if (holdEndTimerRef.current) {
      clearTimeout(holdEndTimerRef.current);
      holdEndTimerRef.current = null;
    }
    if (isVoiceSendingRef.current) return;
    isVoiceSendingRef.current = true;
    setTimeout(() => { isVoiceSendingRef.current = false; }, 800);

    Keyboard.dismiss();
    setIsVoiceInputFocused(false);
    speechWebViewRef.current?.injectJavaScript(`if (window.stopListening) { window.stopListening(); } true;`);
    setIsListening(false);
    setIsHoldingMic(false);
    setVoiceModalVisible(false);

    const query = (textToSend !== undefined ? textToSend : (spokenTranscriptRef.current || spokenTranscript)).trim();
    // Clear transcript immediately so it cannot be double-sent
    setSpokenTranscript('');
    spokenTranscriptRef.current = '';

    if (query.length > 0) {
      sendMessage(query);
    }
  };

  const cancelVoiceListening = () => {
    if (holdEndTimerRef.current) {
      clearTimeout(holdEndTimerRef.current);
      holdEndTimerRef.current = null;
    }
    Keyboard.dismiss();
    setIsVoiceInputFocused(false);
    speechWebViewRef.current?.injectJavaScript(`if (window.stopListening) { window.stopListening(); } true;`);
    setIsListening(false);
    setIsHoldingMic(false);
    setVoiceModalVisible(false);
    setSpokenTranscript('');
    spokenTranscriptRef.current = '';
    setSpeechError(null);
  };

  const handleHoldMicStart = () => {
    if (holdEndTimerRef.current) {
      clearTimeout(holdEndTimerRef.current);
      holdEndTimerRef.current = null;
    }
    isHoldPressRef.current = false;
    holdStartTimeRef.current = Date.now();
    setIsHoldingMic(true);
    startVoiceListening();
  };

  const handleHoldMicEnd = () => {
    const elapsed = Date.now() - holdStartTimeRef.current;
    setIsHoldingMic(false);

    // If held for 400ms or longer, it was a hold-to-speak action (just like ChatGPT)
    if (elapsed >= 400) {
      isHoldPressRef.current = true;
      if (holdEndTimerRef.current) clearTimeout(holdEndTimerRef.current);
      holdEndTimerRef.current = setTimeout(() => {
        const text = (spokenTranscriptRef.current || spokenTranscript).trim();
        if (text.length > 0) {
          stopVoiceListeningAndSend(text);
        }
      }, 350);
    }
  };

  const handleMicToggle = () => {
    // Suppress if this was already handled as a hold-to-speak gesture
    if (isHoldPressRef.current) {
      isHoldPressRef.current = false;
      return;
    }
    if (isListening) {
      stopVoiceListeningAndSend();
    } else {
      startVoiceListening();
    }
  };

  /* animations */
  const pulse = useSharedValue(0.95);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const conn = useController({ duration: 800, repeat: true, autoStart: true });
  const cv = conn.value;

  const handleReviewSubmit = async () => {
    setIsSubmittingReview(true);
    try {
      await submitConsultationReview({
        astrologerId: String((astro as any).id || 'swami-shankarananda'),
        astrologerName: astro.name,
        rating: reviewRating,
        reviewText: reviewComment.trim() || 'Very accurate reading and compassionate Vedic guidance.',
        tags: selectedTags,
        serviceType: isVideo ? 'Video Call' : 'Voice Call',
      });
      setReviewSubmitted(true);
      showSnackBar('Review submitted! Redirecting to your Consultation Report...', '#075E54');
      setTimeout(() => {
        setEnded(false);
        push(AppRoutes.kundliReportsScreen, { reportId: lastGeneratedReportId, autoOpen: true });
      }, 900);
    } catch {
      setReviewSubmitted(true);
      setTimeout(() => {
        setEnded(false);
        push(AppRoutes.kundliReportsScreen, { reportId: lastGeneratedReportId, autoOpen: true });
      }, 900);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const devoteeName = activeProfile?.name?.trim() || authUser?.name?.trim() || 'Devotee';
  const devoteeDob = formatDobToDDMMYYYY(activeProfile?.dob || authUser?.dob) || '15/10/1995';
  const devoteeTob = activeProfile?.time || authUser?.tob || '12:00 PM';
  const devoteePob = activeProfile?.place || authUser?.pob || 'New Delhi, India';
  const devoteeRashi = activeProfile?.zodiac || activeProfile?.moonSign || authUser?.moonSign || authUser?.zodiac || chartData?.moonSign || 'Cancer';
  const devoteeNakshatra = activeProfile?.nakshatra || authUser?.nakshatra || chartData?.nakshatra || 'Punarvasu';
  const devoteeLagna = chartData?.ascendant?.sign || 'Scorpio';

  const activePlanets = chartData?.planets && chartData.planets.length > 0
    ? chartData.planets.map((p) => ({
      name: p.name,
      symbol: p.symbol || p.name.substring(0, 2),
      sign: p.sign,
      house: p.house,
      degree: p.degree,
      color: p.name === 'Sun' ? '#FFB347' : p.name === 'Moon' ? '#E0E0E0' : p.name === 'Mars' ? '#FF6B6B' : p.name === 'Mercury' ? '#90EE90' : p.name === 'Jupiter' ? '#FFD700' : p.name === 'Venus' ? '#FFB6C1' : p.name === 'Saturn' ? '#9370DB' : '#CD853F',
    }))
    : DEFAULT_KUNDLI_PLANETS;

  return (
    <View style={{ flex: 1, backgroundColor: '#080D1A' }} testID="consultation.screen">
      {/* Sacred Vedic Cosmic Background */}
      <LinearGradient
        colors={['#080D1A', '#0D1527', '#111A30']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1, paddingBottom: androidBottomPad }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Top Bar: Astrologer Info, Live Timer, Wallet Balance */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: 'rgba(13, 21, 39, 0.95)',
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(201, 168, 76, 0.3)',
            }}
          >
            {/* Top Back Navigation Button */}
            <Pressable
              onPress={() => {
                if (connected && !ended && !callEndedRef.current) {
                  setConfirmEndCallVisible(true);
                } else {
                  if (router.canGoBack()) router.back();
                  else router.replace(AppRoutes.homeDashboardScreen);
                }
              }}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Back"
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderWidth: 1,
                borderColor: 'rgba(201, 168, 76, 0.3)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 6,
              }}
            >
              <AppIcon name="arrow_back" size={17} color="#FFD700" />
            </Pressable>

            {/* Astrologer Avatar & Name */}
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0, marginRight: 6 }}>
              <Avatar uri={astro.imageUrl} size={36} border={1.5} />
              <View style={{ marginLeft: 7, flex: 1, minWidth: 0, justifyContent: 'center' }}>
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}
                >
                  {astro.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 1 }}>
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: connected ? '#3DCB7A' : (ended || callEndedRef.current ? '#EF4444' : (connecting ? '#FFD700' : '#94A3B8')),
                    }}
                  />
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={{
                      marginLeft: 3.5,
                      color: connected ? '#3DCB7A' : (ended || callEndedRef.current ? '#EF4444' : (connecting ? '#FFD700' : '#94A3B8')),
                      fontSize: 10,
                      fontWeight: '600',
                    }}
                  >
                    {connected
                      ? (isVideo ? 'Live Video' : 'Live Call')
                      : (ended || callEndedRef.current ? 'Ended' : (connecting ? 'Connecting...' : 'Ready'))}
                  </Text>
                </View>
              </View>
            </View>

            {/* Right Status Actions: Language, Live Timer, Wallet Balance */}
            <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}>
              {/* Language Selection Button */}
              <Pressable
                onPress={() => setLanguageModalVisible(true)}
                hitSlop={8}
                style={{
                  marginRight: 4,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 6,
                  paddingVertical: 4.5,
                  borderRadius: 12,
                  backgroundColor: 'rgba(201, 168, 76, 0.2)',
                  borderWidth: 1,
                  borderColor: '#C9A84C',
                }}
              >
                <AppIcon name="language" color="#FFD700" size={12} />
                <Text style={{ marginLeft: 2.5, color: '#FFD700', fontSize: 10.5, fontWeight: '800' }}>
                  {selectedLanguage.substring(0, 3).toUpperCase()}
                </Text>
              </Pressable>

              {/* Timer Pill */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 6.5,
                  paddingVertical: 4.5,
                  borderRadius: 12,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  borderWidth: 1,
                  borderColor: 'rgba(201,168,76,0.4)',
                }}
              >
                <AppIcon name="timer_outlined" color="#FFD700" size={12} />
                <Text testID="consultation.timer" style={{ marginLeft: 3, color: '#FFD700', fontSize: 11.5, fontWeight: '800', letterSpacing: 0.3 }}>
                  {fmt(seconds)}
                </Text>
              </View>

              {/* Wallet Balance Pill */}
              <View
                style={{
                  marginLeft: 4,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 6.5,
                  paddingVertical: 4.5,
                  borderRadius: 12,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  borderWidth: 1,
                  borderColor: balance < 50 ? 'rgba(239,68,68,0.6)' : 'rgba(201,168,76,0.4)',
                }}
              >
                <AppIcon name="account_balance_wallet_outlined" color={balance < 50 ? '#EF4444' : '#FFD700'} size={12} />
                <Text testID="consultation.balance" style={{ marginLeft: 3, color: balance < 50 ? '#EF4444' : '#FFD700', fontSize: 11.5, fontWeight: '800' }}>
                  {formatPrice(balance)}
                </Text>
              </View>
            </View>
          </View>

          {/* Segmented Switch: Devotee Kundli Chart vs Astrologer Voice Stream (hidden during chat keypad for full vertical room) */}
          {!isChatKeypadOpen && (
            <View
              style={{
                flexDirection: 'row',
                marginHorizontal: 16,
                marginTop: 8,
                marginBottom: 4,
                padding: 3,
                borderRadius: 14,
                backgroundColor: 'rgba(13, 21, 39, 0.9)',
                borderWidth: 1,
                borderColor: 'rgba(201, 168, 76, 0.3)',
              }}
            >
              {/* 1. Voice Stream Tab (First Step / Active by Default) */}
              <Pressable
                onPress={() => setCallTab('stream')}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 7,
                  borderRadius: 11,
                  backgroundColor: callTab === 'stream' ? '#C9A84C' : 'transparent',
                }}
              >
                <AppIcon name="headset_mic_rounded" size={13} color={callTab === 'stream' ? '#0A0E1A' : '#94A3B8'} style={{ marginRight: 5 }} />
                <Text style={{ fontSize: 11.5, fontWeight: '800', color: callTab === 'stream' ? '#0A0E1A' : '#94A3B8' }}>
                  Voice Stream
                </Text>
              </Pressable>

              {/* 2. Birth Chart (Kundli) Tab */}
              <Pressable
                onPress={() => {
                  setCallTab('chart');
                  setChatOpen(false);
                }}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 7,
                  borderRadius: 11,
                  backgroundColor: callTab === 'chart' ? '#C9A84C' : 'transparent',
                }}
              >
                <AppIcon name="auto_awesome" size={13} color={callTab === 'chart' ? '#0A0E1A' : '#94A3B8'} style={{ marginRight: 5 }} />
                <Text style={{ fontSize: 11.5, fontWeight: '800', color: callTab === 'chart' ? '#0A0E1A' : '#94A3B8' }}>
                  Birth Chart (Kundli)
                </Text>
              </Pressable>
            </View>
          )}

          {/* Middle Main View: Kundli Chart OR Astrologer Stream */}
          <View style={{ flex: 1, justifyContent: 'center' }}>
            {connecting && !connected && !ended && !callEndedRef.current && (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: 'rgba(201, 168, 76, 0.15)',
                    borderWidth: 1.5,
                    borderColor: '#C9A84C',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <AppIcon name="phone_in_talk" size={32} color="#FFD700" />
                </View>
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800', textAlign: 'center' }}>
                  Connecting to {astro.name}...
                </Text>
                <Text style={{ color: '#CBD5E1', fontSize: 12, textAlign: 'center', marginTop: 6, lineHeight: 18 }}>
                  Establishing secure Vedic consultation session & computing Janam Kundli
                </Text>
              </View>
            )}

            {(!connecting || connected || ended || callEndedRef.current) && (
              callTab === 'chart' ? (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 6, paddingBottom: 28 }}>
                  {/* Devotee Birth Details Header Card */}
                  <View
                    style={{
                      marginHorizontal: 16,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: 18,
                      backgroundColor: 'rgba(17, 26, 48, 0.95)',
                      borderWidth: 1.5,
                      borderColor: '#C9A84C',
                      shadowColor: '#C9A84C',
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                      elevation: 4,
                      marginBottom: 12,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>
                        👤 {devoteeName}
                      </Text>
                      <View style={{ paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(201, 168, 76, 0.25)', borderWidth: 1, borderColor: '#C9A84C' }}>
                        <Text style={{ color: '#FFD700', fontSize: 11, fontWeight: '800' }}>
                          Lagna: {devoteeLagna}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, flexWrap: 'wrap', gap: 10 }}>
                      <Text style={{ color: '#F8FAFC', fontSize: 11.5, fontWeight: '600' }}>
                        📅 {devoteeDob} • ⏰ {devoteeTob}
                      </Text>
                      <Text numberOfLines={1} style={{ color: '#CBD5E1', fontSize: 11.5, fontWeight: '500', flexShrink: 1 }}>
                        📍 {devoteePob}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 7, flexWrap: 'wrap', gap: 8 }}>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 7, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 0.8, borderColor: 'rgba(201, 168, 76, 0.35)' }}>
                        <Text style={{ color: '#FFD700', fontSize: 11, fontWeight: '700' }}>
                          ♈ Rashi: {devoteeRashi}
                        </Text>
                      </View>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 7, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 0.8, borderColor: 'rgba(201, 168, 76, 0.35)' }}>
                        <Text style={{ color: '#FFD700', fontSize: 11, fontWeight: '700' }}>
                          🌟 Nakshatra: {devoteeNakshatra}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Fully Dynamic Vedic Kundli Chart */}
                  <VedicKundliChart
                    chartData={chartData}
                    devoteeName={devoteeName}
                    dob={devoteeDob}
                    tob={devoteeTob}
                    pob={devoteePob}
                    ascendantSign={devoteeLagna}
                    moonSign={devoteeRashi}
                    nakshatra={devoteeNakshatra}
                    planets={activePlanets}
                    chartStyle={inCallChartFormat === 'north' ? 'north-indian' : 'south-indian'}
                    onChartStyleChange={(s) => setInCallChartFormat(s === 'north-indian' ? 'north' : 'south')}
                    showFormatSwitcher={true}
                    showPlanetaryList={true}
                    compact={false}
                  />
                </ScrollView>
              ) : (
                /* Native In-App Astrologer Voice Consultation View */
                <View style={{ flex: 1, paddingHorizontal: 14 }}>
                  {/* Astrologer Avatar & Speaking Wave Animation (Collapsed to compact bar during chat keypad) */}
                  {!isChatKeypadOpen ? (
                    <View style={{ alignItems: 'center', marginTop: 2, marginBottom: 8 }}>
                      <Animated.View style={[{ width: 104, height: 104, alignItems: 'center', justifyContent: 'center' }, isAiSpeaking ? pulseStyle : {}]}>
                        <View
                          style={{
                            position: 'absolute',
                            width: 98,
                            height: 98,
                            borderRadius: 49,
                            backgroundColor: isAiSpeaking ? 'rgba(201, 168, 76, 0.28)' : 'rgba(201, 168, 76, 0.12)',
                            borderWidth: 1.5,
                            borderColor: isAiSpeaking ? '#FFD700' : 'rgba(201, 168, 76, 0.4)',
                          }}
                        />
                        <Pressable onPress={handleMicToggle} style={{ alignItems: 'center' }}>
                          <Avatar uri={astro.imageUrl} size={82} border={2.5} />
                        </Pressable>
                      </Animated.View>

                      <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginTop: 4 }}>
                        {astro.name}
                      </Text>

                      <Pressable
                        onPressIn={handleHoldMicStart}
                        onPressOut={handleHoldMicEnd}
                        onPress={handleMicToggle}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginTop: 4,
                          paddingHorizontal: 12,
                          paddingVertical: 4.5,
                          borderRadius: 16,
                          backgroundColor: isHoldingMic ? 'rgba(16, 185, 129, 0.3)' : 'rgba(201, 168, 76, 0.2)',
                          borderWidth: 1,
                          borderColor: isHoldingMic ? '#10B981' : '#C9A84C',
                        }}
                      >
                        <AppIcon name={isHoldingMic ? 'graphic_eq' : 'mic_rounded'} size={13} color={isHoldingMic ? '#34D399' : '#FFD700'} style={{ marginRight: 5 }} />
                        <Text style={{ color: isHoldingMic ? '#34D399' : '#FFD700', fontSize: 11, fontWeight: '800' }}>
                          {isHoldingMic
                            ? (selectedLanguage === 'Telugu' ? 'విడువగానే పంపబడుతుంది (Release to Send)' : selectedLanguage === 'Hindi' ? 'छोड़ें - पूछें' : 'Release to Send')
                            : isAiSpeaking
                              ? `🔊 ${astro.name} is speaking...`
                              : selectedLanguage === 'Telugu'
                                ? 'పట్టుకుని మాట్లాడండి (Hold to Speak)'
                                : selectedLanguage === 'Hindi'
                                  ? 'दबाकर बोलें (Hold to Speak)'
                                  : 'Hold to speak with astrologer'}
                        </Text>
                      </Pressable>

                      {/* Animated Equalizer Wave Bars */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4, gap: 3 }}>
                        {[0.3, 0.6, 0.9, 1.0, 0.8, 0.5, 0.7, 0.4].map((scale, i) => (
                          <View
                            key={i}
                            style={{
                              width: 3.5,
                              height: isAiSpeaking ? Math.max(4, 16 * scale) : 4,
                              borderRadius: 2,
                              backgroundColor: isAiSpeaking ? '#FFD700' : 'rgba(255, 255, 255, 0.25)',
                            }}
                          />
                        ))}
                      </View>
                    </View>
                  ) : (
                    /* Sleek compact header when typing so transcript gets full space */
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        marginBottom: 6,
                        borderRadius: 14,
                        backgroundColor: 'rgba(13, 21, 39, 0.88)',
                        borderWidth: 1,
                        borderColor: 'rgba(201, 168, 76, 0.3)',
                        overflow: 'hidden',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, marginRight: 10 }}>
                        <Avatar uri={astro.imageUrl} size={28} border={1.5} />
                        <View style={{ marginLeft: 8, flex: 1, minWidth: 0 }}>
                          <Text
                            style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800' }}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {astro.name}
                          </Text>
                          {isAiSpeaking && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 1 }}>
                              <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#FFD700', marginRight: 4 }} />
                              <Text style={{ color: '#FFD700', fontSize: 10, fontWeight: '700' }} numberOfLines={1}>
                                {selectedLanguage === 'Telugu' ? 'మాట్లాడుతున్నారు...' : selectedLanguage === 'Hindi' ? 'बोल रहे हैं...' : 'Speaking...'}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <Pressable
                        onPress={() => {
                          Keyboard.dismiss();
                          setIsChatInputFocused(false);
                        }}
                        style={{
                          flexShrink: 0,
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 14,
                          backgroundColor: 'rgba(201, 168, 76, 0.18)',
                          borderWidth: 1,
                          borderColor: 'rgba(201, 168, 76, 0.45)',
                        }}
                      >
                        <AppIcon name="keyboard_hide_rounded" size={14} color="#FFD700" />
                        <Text style={{ color: '#FFD700', fontSize: 11, fontWeight: '700', marginLeft: 4 }}>
                          {selectedLanguage === 'Telugu' ? 'కీప్యాడ్ దాచు' : selectedLanguage === 'Hindi' ? 'कीबोर्ड छिपाएं' : 'Hide Keypad'}
                        </Text>
                      </Pressable>
                    </View>
                  )}

                  {/* Native Live Transcript Card */}
                  <View
                    style={{
                      flex: 1,
                      borderRadius: 18,
                      backgroundColor: 'rgba(13, 21, 39, 0.96)',
                      borderWidth: 1.2,
                      borderColor: 'rgba(201, 168, 76, 0.4)',
                      padding: 10,
                      marginBottom: isChatKeypadOpen ? 4 : 8,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, paddingBottom: 5, borderBottomWidth: 1, borderBottomColor: 'rgba(201, 168, 76, 0.2)' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <AppIcon name="record_voice_over_rounded" size={14} color="#FFD700" style={{ marginRight: 5 }} />
                        <Text style={{ color: '#FFD700', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 }}>
                          LIVE TRANSCRIPT ({selectedLanguage.toUpperCase()})
                        </Text>
                      </View>
                      <Text style={{ color: '#94A3B8', fontSize: 10, fontWeight: '600' }}>
                        {messages.filter((m) => !m.isSystem).length} exchanges
                      </Text>
                    </View>

                    <FlatList
                      ref={listRef}
                      data={messages.filter((m) => !m.isSystem)}
                      keyExtractor={(_, i) => String(i)}
                      showsVerticalScrollIndicator={true}
                      contentContainerStyle={{ paddingVertical: 4, flexGrow: 1 }}
                      ListEmptyComponent={
                        <View style={{ padding: 10, borderRadius: 12, backgroundColor: 'rgba(201, 168, 76, 0.12)', borderWidth: 1, borderColor: 'rgba(201, 168, 76, 0.25)' }}>
                          <Text style={{ color: '#FFD700', fontSize: 10.5, fontWeight: '700', marginBottom: 2 }}>
                            {astro.name} • {fmt(seconds)}
                          </Text>
                          <Text style={{ color: '#F8FAFC', fontSize: 11.5, lineHeight: 16 }}>
                            {selectedLanguage === 'Telugu'
                              ? `నమస్కారం! నేను మీ జ్యోతిష నిపుణుడు ${astroDisplayName}. మీ కుండలి పరిశీలించడానికి సిద్ధంగా ఉన్నాను. మీ ఉద్యోగం, వివాహం, ఆర్థికం లేదా గ్రహ పరిహారాల గురించి ఏ ప్రశ్న అయినా అడగండి.`
                              : selectedLanguage === 'Hindi'
                                ? `नमस्ते! मैं आपका ज्योतिषी ${astroDisplayName} हूँ। आपकी जन्म कुंडली के अनुसार करियर, विवाह, धन या ग्रह शांति के बारे में आप क्या जानना चाहते हैं?`
                                : `Namaste! I am ${astro.name}. I am actively examining your Janam Kundli. Ask any question regarding your career, marriage, finances, or planetary remedies.`}
                          </Text>
                        </View>
                      }
                      renderItem={({ item: m }) => (
                        <View
                          style={{
                            marginBottom: 8,
                            alignSelf: m.isUser ? 'flex-end' : 'flex-start',
                            maxWidth: '90%',
                          }}
                        >
                          <View
                            style={{
                              paddingHorizontal: 11,
                              paddingVertical: 7,
                              borderRadius: 14,
                              backgroundColor: m.isUser ? '#C9A84C' : 'rgba(255, 255, 255, 0.08)',
                              borderWidth: m.isUser ? 0 : 1,
                              borderColor: 'rgba(201, 168, 76, 0.3)',
                            }}
                          >
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                              <Text style={{ color: m.isUser ? '#0A0E1A' : '#FFD700', fontSize: 9.5, fontWeight: '800' }}>
                                {m.isUser ? 'You' : astro.name} • {m.time}
                              </Text>
                              {!m.isUser ? (
                                <Pressable
                                  onPress={() => {
                                    if (callEndedRef.current) return;
                                    speakAstrologerText(m.text, {
                                      astrologerName: astro.name,
                                      gender: astroGender,
                                      language: selectedLanguage,
                                      onStart: () => { if (!callEndedRef.current) setIsAiSpeaking(true); },
                                      onDone: () => setIsAiSpeaking(false),
                                    });
                                  }}
                                  hitSlop={8}
                                  style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}
                                >
                                  <AppIcon name="volume_up_rounded" size={12} color="#FFD700" />
                                  <Text style={{ color: '#FFD700', fontSize: 9, fontWeight: '700', marginLeft: 2 }}>
                                    {selectedLanguage === 'Telugu' ? 'వినండి' : 'Listen'}
                                  </Text>
                                </Pressable>
                              ) : null}
                            </View>
                            <Text style={{ color: m.isUser ? '#0A0E1A' : '#F8FAFC', fontSize: 11.5, lineHeight: 16, fontWeight: m.isUser ? '700' : '500' }}>
                              {m.text}
                            </Text>

                            {/* Response Tooltip Badge */}
                            {!m.isUser ? (
                              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5, paddingTop: 4, borderTopWidth: 0.6, borderTopColor: 'rgba(201, 168, 76, 0.25)' }}>
                                <Text style={{ color: '#FFD700', fontSize: 9.5, fontWeight: '700' }}>
                                  {selectedLanguage === 'Telugu'
                                    ? '✨ వేద జ్యోతిష నివారణ • మళ్ళీ వినడానికి పైనున్న "వినండి" నొక్కండి'
                                    : selectedLanguage === 'Hindi'
                                      ? '✨ वैदिक समाधान • पुनः सुनने के लिए "Listen" दबाएं'
                                      : '✨ Vedic Astrological Remedy • Tap "Listen" to replay voice'}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                      )}
                      ListFooterComponent={
                        isAiAnalyzing ? (
                          <View
                            style={{
                              marginVertical: 6,
                              alignSelf: 'flex-start',
                              maxWidth: '92%',
                              paddingHorizontal: 12,
                              paddingVertical: 9,
                              borderRadius: 14,
                              backgroundColor: 'rgba(201, 168, 76, 0.16)',
                              borderWidth: 1.2,
                              borderColor: '#FFD700',
                              flexDirection: 'row',
                              alignItems: 'center',
                            }}
                          >
                            <ActivityIndicator size="small" color="#FFD700" style={{ marginRight: 8 }} />
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: '#FFD700', fontSize: 10.5, fontWeight: '800' }}>
                                {astro.name} • {selectedLanguage === 'Telugu' ? 'గ్రహ విశ్లేషణ జరుగుతోంది...' : selectedLanguage === 'Hindi' ? 'ग्रह विश्लेषण हो रहा है...' : 'Analyzing Kundli...'}
                              </Text>
                              <Text style={{ color: '#F8FAFC', fontSize: 11, marginTop: 1, fontWeight: '600', lineHeight: 15 }}>
                                {analyzingTipText}
                              </Text>
                            </View>
                          </View>
                        ) : null
                      }
                    />

                    {/* Quick Voice Topics Bar (hidden during keypad typing for space) */}
                    {!isChatKeypadOpen && (
                      <View style={{ marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.08)' }}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
                          {QUICK_VOICE_TOPICS.map((topic, tIdx) => (
                            <Pressable
                              key={tIdx}
                              onPress={() => handleQuickTopicVoiceConsult(topic.query)}
                              style={({ pressed }) => ({
                                paddingHorizontal: 9,
                                paddingVertical: 4.5,
                                borderRadius: 12,
                                backgroundColor: 'rgba(201, 168, 76, 0.18)',
                                borderWidth: 1,
                                borderColor: '#C9A84C',
                                opacity: pressed ? 0.8 : 1,
                              })}
                            >
                              <Text style={{ color: '#FFD700', fontSize: 10.5, fontWeight: '700' }}>
                                {topic.label}
                              </Text>
                            </Pressable>
                          ))}
                        </ScrollView>
                      </View>
                    )}

                    {/* Guidance Tooltip while user is asking */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'rgba(201, 168, 76, 0.12)',
                        borderRadius: 10,
                        paddingHorizontal: 8,
                        paddingVertical: 3.5,
                        marginTop: 4,
                        marginBottom: 4,
                        borderWidth: 1,
                        borderColor: 'rgba(201, 168, 76, 0.25)',
                      }}
                    >
                      <AppIcon name="lightbulb" size={12} color="#FFD700" style={{ marginRight: 5 }} />
                      <Text style={{ color: '#FFD700', fontSize: 10.5, fontWeight: '700', flex: 1 }} numberOfLines={1}>
                        {selectedLanguage === 'Telugu'
                          ? 'చిట్కా: ఉద్యోగం, వివాహం, ఆర్థికం లేదా గ్రహ పరిహారాల గురించి అడగండి'
                          : selectedLanguage === 'Hindi'
                            ? 'सुझाव: करियर, विवाह, धन लाभ या ग्रह शांति उपाय पूछें'
                            : 'Tip: Ask about career, marriage timing, wealth or dosha remedies'}
                      </Text>
                    </View>

                    {/* Voice / Text Question Input Row */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, paddingBottom: 2 }}>
                      <TextInput
                        value={input}
                        onChangeText={setInput}
                        onFocus={() => {
                          setIsChatInputFocused(true);
                          setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 150);
                        }}
                        onBlur={() => setIsChatInputFocused(false)}
                        onSubmitEditing={() => sendMessage()}
                        placeholder={
                          selectedLanguage === 'Telugu'
                            ? 'తెలుగులో ప్రశ్న అడగండి... (Ask in Telugu)'
                            : selectedLanguage === 'Hindi'
                              ? 'वैदिक प्रश्न यहाँ पूछें... (Ask in Hindi)'
                              : 'Ask your question...'
                        }
                        placeholderTextColor="#94A3B8"
                        style={{
                          flex: 1,
                          height: 44,
                          borderRadius: 22,
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          borderWidth: 1.5,
                          borderColor: isChatKeypadOpen ? '#FFD700' : 'rgba(201, 168, 76, 0.4)',
                          paddingHorizontal: 16,
                          color: '#FFFFFF',
                          fontSize: 13,
                        }}
                      />
                      <Pressable
                        onPress={() => sendMessage()}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          backgroundColor: '#C9A84C',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginLeft: 8,
                        }}
                      >
                        <AppIcon name="send_rounded" size={18} color="#0A0E1A" />
                      </Pressable>
                    </View>
                  </View>
                </View>
              )
            )}
          </View>

          {/* Bottom Native Voice & Call Controls (hidden during typing to give keyboard clean space) */}
          {!isChatKeypadOpen && (
            <View
              style={{
                marginHorizontal: 14,
                marginTop: 4,
                marginBottom: 12,
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderRadius: 26,
                backgroundColor: 'rgba(13, 21, 39, 0.96)',
                borderWidth: 1.5,
                borderColor: 'rgba(201, 168, 76, 0.4)',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                shadowColor: '#000',
                shadowOpacity: 0.5,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 6 },
                elevation: 8,
              }}
            >
              {/* 1. ChatGPT-Style Hold to Speak Mic Button */}
              <Pressable
                testID="consultation.micSpeak"
                onPressIn={handleHoldMicStart}
                onPressOut={handleHoldMicEnd}
                onPress={handleMicToggle}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: isHoldingMic || isListening ? '#10B981' : '#C9A84C',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 8,
                  opacity: pressed ? 0.9 : 1,
                  shadowColor: isHoldingMic || isListening ? '#10B981' : '#C9A84C',
                  shadowOpacity: 0.5,
                  shadowRadius: 8,
                  elevation: 5,
                  transform: [{ scale: isHoldingMic ? 1.03 : 1 }],
                })}
              >
                <AppIcon name={isHoldingMic || isListening ? 'graphic_eq' : 'mic_rounded'} color={isHoldingMic || isListening ? '#FFFFFF' : '#0A0E1A'} size={18} />
                <Text style={{ marginLeft: 6, color: isHoldingMic || isListening ? '#FFFFFF' : '#0A0E1A', fontSize: 13, fontWeight: '800' }} numberOfLines={1}>
                  {isHoldingMic
                    ? (selectedLanguage === 'Telugu' ? 'విడువండి - పంపు' : selectedLanguage === 'Hindi' ? 'छोड़ें - पूछें' : 'Release to Send')
                    : isListening
                      ? (selectedLanguage === 'Telugu' ? 'వింటున్నాము...' : selectedLanguage === 'Hindi' ? 'सुन रहे हैं...' : 'Listening...')
                      : (selectedLanguage === 'Telugu' ? 'పట్టుకుని మాట్లాడండి' : selectedLanguage === 'Hindi' ? 'दबाकर बोलें' : 'Hold to Speak')}
                </Text>
              </Pressable>

              {/* 2. Speaker Audio Output Toggle */}
              <Pressable
                testID="consultation.speaker"
                onPress={() => setSpeakerOn((v) => { if (v) stopAstrologerSpeech(); return !v; })}
                style={({ pressed }) => ({
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: isSpeakerOn ? 'rgba(201, 168, 76, 0.22)' : 'rgba(255, 255, 255, 0.08)',
                  borderWidth: 1.5,
                  borderColor: isSpeakerOn ? '#C9A84C' : 'rgba(255, 255, 255, 0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <AppIcon name={isSpeakerOn ? 'volume_up_rounded' : 'volume_off_rounded'} color={isSpeakerOn ? '#FFD700' : '#94A3B8'} size={20} />
              </Pressable>

              {/* 3. End Call Button */}
              <Pressable
                testID="consultation.end"
                onPress={() => {
                  if (connected && !ended && !callEndedRef.current) {
                    setConfirmEndCallVisible(true);
                  } else {
                    endCall();
                  }
                }}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: '#EF4444',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 8,
                  opacity: pressed ? 0.85 : 1,
                  shadowColor: '#EF4444',
                  shadowOpacity: 0.35,
                  shadowRadius: 6,
                  elevation: 4,
                })}
              >
                <AppIcon name="call_end_rounded" color="#FFFFFF" size={17} style={{ marginRight: 5 }} />
                <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800' }} numberOfLines={1}>
                  {selectedLanguage === 'Telugu' ? 'ముగించు' : selectedLanguage === 'Hindi' ? 'समाप्त' : 'End'}
                </Text>
              </Pressable>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Connecting & Astrologer Acceptance Radar Overlay */}
      {connecting ? (
        <View testID="consultation.connecting" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(8, 13, 26, 0.97)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <View style={{ width: 170, height: 170, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ position: 'absolute', width: 170, height: 170, borderRadius: 85, borderWidth: 2, borderColor: withAlpha(AppColors.goldAccent, Math.floor(90 * (1 - cv))), transform: [{ scale: 0.6 + cv * 0.6 }] }} />
            <Avatar uri={astro.imageUrl} size={110} border={2.5} />
          </View>

          <Text style={{ marginTop: 24, color: '#FFFFFF', fontSize: 22, fontWeight: '700', textAlign: 'center' }}>{astro.name}</Text>
          <Text style={{ marginTop: 6, color: '#FFD700', fontSize: 13, fontWeight: '600' }}>
            {connectionStatusText}
          </Text>

          {isWaitingAstrologer ? (
            <View style={{ marginTop: 14, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(201,168,76,0.14)', borderWidth: 1, borderColor: AppColors.goldBorder, alignItems: 'center' }}>
              <Text style={{ color: '#F8FAFC', fontSize: 12 }}>
                Ringing astrologer dashboard... ({acceptanceCountdown}s)
              </Text>
            </View>
          ) : null}

          <View style={{ marginTop: 28, flexDirection: 'row' }}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={{ marginHorizontal: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: withAlpha(AppColors.goldAccent, Math.floor(50 + 200 * ((cv + i * 0.33) % 1))) }} />
            ))}
          </View>

          <Pressable
            testID="consultation.cancel"
            onPress={cancelCallBeforeAcceptance}
            style={{ marginTop: 40, paddingHorizontal: 36, paddingVertical: 14, borderRadius: 30, backgroundColor: withAlpha(AppColors.error, 40), borderWidth: 1.5, borderColor: withAlpha(AppColors.error, 160) }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>Cancel Call</Text>
          </Pressable>
        </View>
      ) : null}

      {/* 100% Native Responsive Voice Listening Modal */}
      <Modal visible={voiceModalVisible} transparent statusBarTranslucent animationType="slide" onRequestClose={cancelVoiceListening}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.78)',
            justifyContent: 'flex-end',
            paddingBottom: keyboardHeight,
          }}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={() => {
              if (isKeypadActive) {
                Keyboard.dismiss();
                setIsVoiceInputFocused(false);
              } else {
                cancelVoiceListening();
              }
            }}
          />
          <View
            style={{
              backgroundColor: '#0D1527',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              borderWidth: 1.5,
              borderBottomWidth: 0,
              borderColor: '#C9A84C',
              maxHeight: isKeypadActive
                ? Math.min(screenH - keyboardHeight - (insets.top || 24) - 10, 480)
                : Math.min(620, windowH - 30),
              overflow: 'hidden',
            }}
          >
            <ScrollView
              ref={voiceScrollRef}
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="none"
              bounces={false}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: isKeypadActive ? 12 : 16,
                paddingBottom: isKeypadActive ? 16 : Math.max(insets.bottom, 16) + 16,
              }}
            >
              {/* Drag Handle */}
              <View style={{ width: 44, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)', alignSelf: 'center', marginBottom: isKeypadActive ? 8 : 14 }} />

              {/* Header: Astrologer + Live Listening Badge */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: isKeypadActive ? 8 : 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                  <Avatar uri={astro.imageUrl} size={isKeypadActive ? 34 : 44} border={2} />
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text numberOfLines={1} style={{ color: '#FFFFFF', fontSize: isKeypadActive ? 14 : 16, fontWeight: '800' }}>
                      {astro.name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isKeypadActive ? '#10B981' : '#EF4444', marginRight: 6 }} />
                      <Text style={{ color: '#FFD700', fontSize: isKeypadActive ? 11 : 12, fontWeight: '700' }}>
                        {isKeypadActive
                          ? (selectedLanguage === 'Telugu' ? '⌨️ ప్రశ్నను టైప్ చేయండి / మాట్లాడండి' : selectedLanguage === 'Hindi' ? '⌨️ प्रश्न टाइप करें / बोलें' : '⌨️ Type or speak your question...')
                          : (selectedLanguage === 'Telugu' ? '🎙️ శ్రద్ధగా వింటున్నాము...' : selectedLanguage === 'Hindi' ? '🎙️ हम सुन रहे हैं...' : '🎙️ Listening to you speak...')}
                      </Text>
                    </View>
                  </View>
                </View>
                <Pressable
                  onPress={cancelVoiceListening}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Close voice modal"
                  style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <AppIcon name="close_rounded" size={18} color="#CBD5E1" />
                </Pressable>
              </View>

              {/* In Voice Mode: Full Pulsing Mic & Audio Waveform Visualizer */}
              {!isKeypadActive ? (
                <View style={{ alignItems: 'center', marginVertical: 8 }}>
                  <Pressable
                    onPressIn={handleHoldMicStart}
                    onPressOut={handleHoldMicEnd}
                    onPress={handleMicToggle}
                  >
                    <Animated.View
                      style={[
                        pulseStyle,
                        {
                          width: 76,
                          height: 76,
                          borderRadius: 38,
                          backgroundColor: isHoldingMic ? 'rgba(16, 185, 129, 0.35)' : 'rgba(201, 168, 76, 0.25)',
                          borderWidth: 2,
                          borderColor: isHoldingMic ? '#10B981' : '#C9A84C',
                          alignItems: 'center',
                          justifyContent: 'center',
                          shadowColor: isHoldingMic ? '#10B981' : '#C9A84C',
                          shadowOpacity: 0.6,
                          shadowRadius: 16,
                          elevation: 6,
                          transform: [{ scale: isHoldingMic ? 1.08 : 1 }],
                        },
                      ]}
                    >
                      <AppIcon name={isHoldingMic ? 'graphic_eq' : 'mic_rounded'} size={38} color={isHoldingMic ? '#34D399' : '#FFD700'} />
                    </Animated.View>
                  </Pressable>

                  {/* Animated Audio Wave Bars */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 }}>
                    {[14, 24, 34, 26, 16, 28, 18].map((h, i) => (
                      <View
                        key={i}
                        style={{
                          width: 4,
                          height: h,
                          borderRadius: 2,
                          backgroundColor: '#C9A84C',
                          opacity: 0.85,
                        }}
                      />
                    ))}
                  </View>

                  <Text style={{ marginTop: 8, color: '#94A3B8', fontSize: 11.5, fontWeight: '600', textAlign: 'center' }}>
                    {selectedLanguage === 'Telugu'
                      ? 'మీ ప్రశ్నను మాట్లాడండి — మీ మాటలు స్వయంచాలకంగా అక్షరాలుగా మారుతున్నాయి'
                      : selectedLanguage === 'Hindi'
                        ? 'अपना प्रश्न बोलें — आपकी आवाज़ शब्दों में बदल रही है'
                        : 'Speak your question clearly — converting your voice to text in real-time'}
                  </Text>
                </View>
              ) : (
                /* In Keypad Mode: Sleek single-line shortcut with Hide Keypad */
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 2 }}>
                  <Text style={{ color: '#94A3B8', fontSize: 11.5, fontWeight: '600' }}>
                    {selectedLanguage === 'Telugu' ? 'మీ ప్రశ్నను క్రింద టైప్ చేయండి:' : selectedLanguage === 'Hindi' ? 'नीचे अपना प्रश्न टाइप करें:' : 'Type your Vedic question below:'}
                  </Text>
                  <Pressable
                    onPress={() => {
                      Keyboard.dismiss();
                      setIsVoiceInputFocused(false);
                    }}
                    hitSlop={8}
                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(201, 168, 76, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(201, 168, 76, 0.35)' }}
                  >
                    <AppIcon name="keyboard_hide" size={14} color="#FFD700" />
                    <Text style={{ color: '#FFD700', fontSize: 11, fontWeight: '700', marginLeft: 4 }}>
                      {selectedLanguage === 'Telugu' ? 'కీప్యాడ్ మూసివేయి' : selectedLanguage === 'Hindi' ? 'कीबोर्ड छिपाएं' : 'Hide Keypad'}
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* Clear Tooltip while user is asking/speaking */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  borderRadius: 12,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  marginVertical: 4,
                  borderWidth: 1,
                  borderColor: 'rgba(16, 185, 129, 0.35)',
                }}
              >
                <AppIcon name="info" size={13} color="#10B981" style={{ marginRight: 6 }} />
                <Text style={{ color: '#34D399', fontSize: 11, fontWeight: '700', flex: 1 }}>
                  {selectedLanguage === 'Telugu'
                    ? 'చిట్కా: మీ ప్రశ్న స్పష్టంగా చెప్పండి, పూర్తయ్యాక క్రింద ఆకుపచ్చ బటన్ నొక్కండి'
                    : selectedLanguage === 'Hindi'
                      ? 'सुझाव: अपना प्रश्न स्पष्ट बोलें, पूरा होने पर नीचे हरा बटन दबाएं'
                      : 'Tip: Speak clearly, then tap "Done Speaking — Ask" when finished'}
                </Text>
              </View>

              {/* Live Speech-to-Text & Typed Question Box */}
              <View
                style={{
                  marginTop: isKeypadActive ? 2 : 6,
                  padding: 12,
                  borderRadius: 16,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderWidth: 1.5,
                  borderColor: isKeypadActive || spokenTranscript ? '#C9A84C' : 'rgba(201, 168, 76, 0.4)',
                  minHeight: isKeypadActive ? 85 : 74,
                  maxHeight: 140,
                }}
              >
                <TextInput
                  value={spokenTranscript}
                  onChangeText={setSpokenTranscript}
                  onFocus={() => {
                    setIsVoiceInputFocused(true);
                    setTimeout(() => voiceScrollRef.current?.scrollToEnd({ animated: true }), 100);
                  }}
                  onBlur={() => setIsVoiceInputFocused(false)}
                  multiline
                  autoFocus={false}
                  scrollEnabled={true}
                  textAlignVertical="top"
                  placeholder={
                    selectedLanguage === 'Telugu'
                      ? 'మీరు మాట్లాడుతున్నది ఇక్కడ కనిపిస్తుంది... (లేదా ఇక్కడ టైప్ చేయవచ్చు)'
                      : selectedLanguage === 'Hindi'
                        ? 'आप जो बोल रहे हैं वह यहाँ दिखाई देगा... (या यहाँ टाइप कर सकते हैं)'
                        : 'Your spoken words will appear here in real-time... (or type here)'
                  }
                  placeholderTextColor="#64748B"
                  style={{
                    color: '#FFFFFF',
                    fontSize: 14,
                    fontWeight: '700',
                    lineHeight: 22,
                    minHeight: isKeypadActive ? 60 : 50,
                  }}
                />
              </View>


              {/* Action Buttons: Done Speaking & Cancel */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: isKeypadActive ? 10 : 14 }}>
                <Pressable
                  onPress={cancelVoiceListening}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#E2E8F0', fontSize: 13, fontWeight: '700' }}>
                    {selectedLanguage === 'Telugu' ? 'రద్దు చేయి' : selectedLanguage === 'Hindi' ? 'रद्द करें' : 'Cancel'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => stopVoiceListeningAndSend()}
                  style={({ pressed }) => ({
                    flex: 2,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: '#10B981',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.85 : 1,
                    shadowColor: '#10B981',
                    shadowOpacity: 0.45,
                    shadowRadius: 8,
                    elevation: 4,
                  })}
                >
                  <AppIcon name="check_circle_rounded" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={{ color: '#FFFFFF', fontSize: 13.5, fontWeight: '800' }}>
                    {selectedLanguage === 'Telugu'
                      ? 'ముగించు & అడగండి ✓'
                      : selectedLanguage === 'Hindi'
                        ? 'समाप्त करें और पूछें ✓'
                        : 'Done Speaking — Ask ✓'}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Hidden Speech-to-Text Recognition Engine */}
      <View style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }}>
        <WebView
          ref={speechWebViewRef}
          source={{ html: SPEECH_RECOGNITION_HTML }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mediaPlaybackRequiresUserAction={false}
          originWhitelist={['*']}
          onPermissionRequest={(request: any) => {
            try {
              request.grant(request.resources);
            } catch (e) { }
          }}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === 'RESULT' && data.transcript) {
                const clean = deduplicateTranscript(data.transcript);
                setSpokenTranscript(clean);
                spokenTranscriptRef.current = clean;
              } else if (data.type === 'ERROR') {
                console.warn('SpeechRecognition note:', data.error);
              }
            } catch (e) { }
          }}
        />
      </View>

      {/* Session Ended Dialog with Rating */}
      <Dialog
        visible={ended}
        onClose={handleCloseEndedPopup}
        barrierDismissible={true}
        style={{ borderRadius: 20, maxHeight: '85%', backgroundColor: colors.surface }}
        testID="consultation.endDialog"
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '700' }}>
              {selectedLanguage === 'Telugu' ? 'సెషన్ ముగిసింది' : selectedLanguage === 'Hindi' ? 'सत्र समाप्त' : 'Session Ended'}
            </Text>
            <Pressable
              onPress={handleCloseEndedPopup}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={({ pressed }) => ({
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: colors.surfaceVariant,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <AppIcon name="close_rounded" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
          <View style={{ marginTop: 16, padding: 16, borderRadius: 16, backgroundColor: colors.surfaceVariant, borderWidth: 1, borderColor: colors.cardBorder, gap: 8 }}>
            {[
              ['Duration', fmt(seconds)],
              ['Amount Charged', formatPrice(totalCharged > 0 ? totalCharged : Math.round((seconds / 60) * ratePerMin))],
              ['Remaining Balance', formatPrice(balance)],
            ].map(([l, v]) => (
              <View key={l} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{l}</Text>
                <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>{v}</Text>
              </View>
            ))}
          </View>

          {/* Interactive Customer Review System */}
          <View style={{ marginTop: 14, padding: 14, borderRadius: 16, backgroundColor: withAlpha(colors.goldAccent, 20), borderWidth: 1, borderColor: colors.cardBorder }}>
            <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700', textAlign: 'center' }}>
              {reviewSubmitted ? 'Review Submitted 🙏' : 'Rate Your Consultation'}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10, gap: 8 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Pressable key={s} onPress={() => !reviewSubmitted && setReviewRating(s)}>
                  <AppIcon
                    name={s <= reviewRating ? 'star' : 'star_outline'}
                    color={s <= reviewRating ? colors.goldAccent : colors.textMuted}
                    size={28}
                  />
                </Pressable>
              ))}
            </View>

            {!reviewSubmitted && (
              <>
                <TextInput
                  value={reviewComment}
                  onChangeText={setReviewComment}
                  placeholder="Share your spiritual feedback..."
                  placeholderTextColor={colors.textMuted}
                  style={{
                    marginTop: 12,
                    padding: 10,
                    borderRadius: 10,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    color: colors.textPrimary,
                    fontSize: 12,
                    minHeight: 48,
                  }}
                  multiline
                />
                <Pressable
                  onPress={handleReviewSubmit}
                  disabled={isSubmittingReview}
                  style={{
                    marginTop: 10,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: colors.goldAccent,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>
                    {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                  </Text>
                </Pressable>
              </>
            )}
          </View>

          {/* 1. Primary CTA: View Consultation Summary Report (Only shown if user actually asked questions & report was created) */}
          {lastGeneratedReportId ? (
            <Pressable
              testID="consultation.viewReport"
              onPress={() => {
                setEnded(false);
                push(AppRoutes.kundliReportsScreen, { reportId: lastGeneratedReportId, autoOpen: true });
              }}
              style={{
                marginTop: 16,
                height: 48,
                paddingHorizontal: 16,
                borderRadius: 14,
                backgroundColor: '#C9A84C',
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                shadowColor: '#C9A84C',
                shadowOpacity: 0.35,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <AppIcon name="description" color="#0A0E1A" size={18} style={{ marginRight: 8 }} />
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{ color: '#0A0E1A', fontSize: 14, fontWeight: '800', textAlign: 'center' }}
              >
                {selectedLanguage === 'Telugu' ? 'సారాంశ నివేదిక చూడండి' : selectedLanguage === 'Hindi' ? 'सारांश रिपोर्ट देखें' : 'View Summary Report'}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              testID="consultation.backToAstro"
              onPress={() => {
                setEnded(false);
                if (router.canGoBack()) router.back();
                else router.replace(AppRoutes.homeDashboardScreen);
              }}
              style={{
                marginTop: 16,
                height: 48,
                paddingHorizontal: 16,
                borderRadius: 14,
                backgroundColor: '#C9A84C',
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                shadowColor: '#C9A84C',
                shadowOpacity: 0.35,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <AppIcon name="arrow_back" color="#0A0E1A" size={18} style={{ marginRight: 8 }} />
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{ color: '#0A0E1A', fontSize: 14, fontWeight: '800', textAlign: 'center' }}
              >
                {selectedLanguage === 'Telugu' ? 'జ్యోతిషుల జాబితాకు తిరిగి వెళ్ళు' : selectedLanguage === 'Hindi' ? 'ज्योतिषी सूची पर वापस जाएं' : 'Back to Astrologers'}
              </Text>
            </Pressable>
          )}

          {/* 2. Secondary CTA */}
          <Pressable
            testID="consultation.done"
            onPress={() => {
              setEnded(false);
              if (lastGeneratedReportId) {
                push(AppRoutes.kundliReportsScreen, { reportId: lastGeneratedReportId, autoOpen: true });
              } else {
                if (router.canGoBack()) router.back();
                else router.replace(AppRoutes.homeDashboardScreen);
              }
            }}
            style={{
              marginTop: 10,
              paddingVertical: 12,
              borderRadius: 14,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderWidth: 1,
              borderColor: 'rgba(201, 168, 76, 0.35)',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>
              {lastGeneratedReportId ? 'Go to Profile Reports & History →' : 'Done / Close →'}
            </Text>
          </Pressable>
        </ScrollView>
      </Dialog>

      {/* Dynamic Language Change Modal */}
      <Modal
        visible={languageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.72)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
          onPress={() => setLanguageModalVisible(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 360,
              borderRadius: 22,
              backgroundColor: colors.surface,
              borderWidth: 1.5,
              borderColor: colors.goldAccent,
              padding: 20,
              elevation: 16,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AppIcon name="translate" size={20} color={colors.goldAccent} style={{ marginRight: 8 }} />
                <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '800' }}>
                  Choose Voice & Chat Language
                </Text>
              </View>
              <Pressable onPress={() => setLanguageModalVisible(false)} hitSlop={8}>
                <AppIcon name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 14 }}>
              Voices, live speech recitations, chat transcripts, and the final consultation report will instantly adapt to your selected language.
            </Text>

            <View style={{ gap: 8 }}>
              {[
                { name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
                { name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
                { name: 'English', native: 'English', flag: '🌐' },
                { name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
                { name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
                { name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
              ].map((lang) => {
                const isSelected = selectedLanguage === lang.name;
                return (
                  <Pressable
                    key={lang.name}
                    onPress={() => {
                      setSelectedLanguage(lang.name);
                      useLanguageStore.getState().setLanguage(lang.name as any);
                      setLanguageModalVisible(false);
                      stopAstrologerSpeech();

                      const switchMsg = lang.name === 'Telugu'
                        ? `భాషను తెలుగులోకి మార్చారు. నేను మీ జ్యోతిష ప్రశ్నలకు సమాధానం ఇవ్వడానికి సిద్ధంగా ఉన్నాను.`
                        : lang.name === 'Hindi'
                          ? `भाषा बदलकर हिन्दी कर दी गई है। मैं आपकी कुंडली के विश्लेषण हेतु तत्पर हूँ।`
                          : lang.name === 'Tamil'
                            ? `மொழி தமிழுக்கு மாற்றப்பட்டது. உங்கள் ஜாதகத்தை பகுப்பாய்வு செய்து பதிலளிக்க தயாராக உள்ளேன்.`
                            : lang.name === 'Kannada'
                              ? `ಭಾಷೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ. ನಿಮ್ಮ ಜನ್ಮ ಕುಂಡಲಿಯನ್ನು ವಿಶ್ಲೇಷಿಸಿ ಮಾರ್ಗದರ್ಶನ ನೀಡಲು ಸಿದ್ಧನಾಗಿದ್ದೇನೆ.`
                              : lang.name === 'Malayalam'
                                ? `ഭാഷ മലയാളത്തിലേക്ക് മാറ്റിയിരിക്കുന്നു. നിങ്ങളുടെ ജാതകം വിശകലനം ചെയ്ത് മറുപടി നൽകാൻ ഞാൻ തയ്യാറാണ്.`
                                : `Language changed to ${lang.name}. I am ready to answer your astrological questions.`;

                      updateMessages((m) => [
                        ...m,
                        { text: switchMsg, isSystem: false, isUser: false, time: fmt(secondsRef.current) }
                      ]);

                      if (isSpeakerOn && !isMuted && !callEndedRef.current) {
                        speakAstrologerText(switchMsg, {
                          astrologerName: astro.name,
                          gender: astroGender,
                          language: lang.name,
                          onStart: () => { if (!callEndedRef.current) setIsAiSpeaking(true); },
                          onDone: () => setIsAiSpeaking(false),
                        });
                      }
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      borderRadius: 14,
                      backgroundColor: isSelected ? withAlpha(colors.goldAccent, 20) : colors.surfaceVariant,
                      borderWidth: 1.5,
                      borderColor: isSelected ? colors.goldAccent : colors.cardBorder,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 16, marginRight: 10 }}>{lang.flag}</Text>
                      <View>
                        <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>
                          {lang.native}
                        </Text>
                        <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                          {lang.name}
                        </Text>
                      </View>
                    </View>
                    {isSelected && <AppIcon name="check_circle" size={18} color={colors.goldAccent} />}
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Professional Minimum 5-Min Balance Modal */}
      <Modal
        visible={lowBalanceVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setLowBalanceVisible(false);
          if (router.canGoBack()) router.back();
          else router.replace(AppRoutes.homeDashboardScreen);
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.78)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 22,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 380,
              backgroundColor: '#0D1527',
              borderRadius: 24,
              borderWidth: 1.5,
              borderColor: '#C9A84C',
              padding: 22,
              shadowColor: '#C9A84C',
              shadowOpacity: 0.35,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            {/* Header Icon & Title */}
            <View style={{ alignItems: 'center', marginBottom: 14 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: 'rgba(201, 168, 76, 0.18)',
                  borderWidth: 1.5,
                  borderColor: '#FFD700',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <AppIcon name="account_balance_wallet" size={30} color="#FFD700" />
              </View>

              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 18,
                  fontWeight: '800',
                  textAlign: 'center',
                  letterSpacing: 0.3,
                }}
              >
                {selectedLanguage === 'Telugu'
                  ? 'కనిష్ట బ్యాలెన్స్ అవసరం'
                  : selectedLanguage === 'Hindi'
                    ? 'न्यूनतम बैलेंस आवश्यक'
                    : 'Minimum Balance Required'}
              </Text>

              <Text
                style={{
                  color: '#FFD700',
                  fontSize: 12,
                  fontWeight: '700',
                  marginTop: 3,
                  letterSpacing: 0.5,
                }}
              >
                {selectedLanguage === 'Telugu'
                  ? '5 నిమిషాల సంప్రదింపు బ్యాలెన్స్'
                  : selectedLanguage === 'Hindi'
                    ? '5 मिनट परामर्श बैलेंस'
                    : '5 Minutes Consultation Balance'}
              </Text>
            </View>

            {/* Breakdown Card */}
            <View
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 16,
                padding: 14,
                borderWidth: 1,
                borderColor: 'rgba(201, 168, 76, 0.25)',
                marginBottom: 14,
                gap: 8,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#94A3B8', fontSize: 12.5, fontWeight: '600' }}>
                  {selectedLanguage === 'Telugu' ? 'ప్రస్తుత బ్యాలెన్స్:' : selectedLanguage === 'Hindi' ? 'वर्तमान बैलेंस:' : 'Current Balance:'}
                </Text>
                <Text style={{ color: balance < ratePerMin ? '#EF4444' : '#F59E0B', fontSize: 13.5, fontWeight: '800' }}>
                  {formatPrice(balance)}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#94A3B8', fontSize: 12.5, fontWeight: '600' }}>
                  {selectedLanguage === 'Telugu' ? 'నిమిషానికి రుసుము:' : selectedLanguage === 'Hindi' ? 'प्रति मिनट दर:' : 'Rate per Minute:'}
                </Text>
                <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>
                  {formatPrice(ratePerMin)} / min
                </Text>
              </View>

              <View style={{ height: 1, backgroundColor: 'rgba(201, 168, 76, 0.2)', marginVertical: 2 }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#FFD700', fontSize: 13, fontWeight: '800' }}>
                  {selectedLanguage === 'Telugu' ? '5 నిమిషాలకు అవసరమైనది:' : selectedLanguage === 'Hindi' ? '5 मिनट हेतु आवश्यक:' : 'Required for 5 Min:'}
                </Text>
                <Text style={{ color: '#FFD700', fontSize: 15, fontWeight: '900' }}>
                  {formatPrice(ratePerMin * 5)}
                </Text>
              </View>
            </View>

            {/* Clear explanation text */}
            <Text
              style={{
                color: '#CBD5E1',
                fontSize: 12.5,
                lineHeight: 18,
                textAlign: 'center',
                marginBottom: 18,
              }}
            >
              {selectedLanguage === 'Telugu'
                ? `జ్యోతిష నిపుణులతో నిరంతరాయంగా మాట్లాడటానికి కనీసం 5 నిమిషాల బ్యాలెన్స్ (${formatPrice(ratePerMin * 5)}) నిర్వహించాలి. దయచేసి రీఛార్జ్ చేయండి.`
                : selectedLanguage === 'Hindi'
                  ? `निर्बाध परामर्श हेतु वॉलेट में न्यूनतम 5 मिनट का बैलेंस (${formatPrice(ratePerMin * 5)}) होना आवश्यक है। कृपया आगे बढ़ने के लिए रिचार्ज करें।`
                  : `To maintain an uninterrupted divine consultation, please maintain at least 5 minutes balance (${formatPrice(ratePerMin * 5)}) in your wallet.`}
            </Text>

            {/* Action Buttons */}
            <Pressable
              onPress={() => {
                setLowBalanceVisible(false);
                push(AppRoutes.walletScreen);
              }}
              style={({ pressed }) => ({
                height: 48,
                borderRadius: 14,
                backgroundColor: '#C9A84C',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.9 : 1,
                shadowColor: '#C9A84C',
                shadowOpacity: 0.45,
                shadowRadius: 8,
                elevation: 4,
                marginBottom: 10,
              })}
            >
              <AppIcon name="flash_on" color="#0A0E1A" size={18} style={{ marginRight: 6 }} />
              <Text style={{ color: '#0A0E1A', fontSize: 14, fontWeight: '800' }}>
                {selectedLanguage === 'Telugu' ? '⚡ ఇప్పుడే రీఛార్జ్ చేయండి' : selectedLanguage === 'Hindi' ? '⚡ अभी रिचार्ज करें' : '⚡ Recharge Wallet Now'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setLowBalanceVisible(false);
                if (router.canGoBack()) router.back();
                else router.replace(AppRoutes.homeDashboardScreen);
              }}
              style={{
                paddingVertical: 10,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '600' }}>
                {selectedLanguage === 'Telugu' ? '← తిరిగి వెళ్ళు' : selectedLanguage === 'Hindi' ? '← वापस जाएं' : '← Go Back'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Authentication Prompt Modal for Guests */}
      <Modal
        visible={authModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setAuthModalVisible(false);
          if (router.canGoBack()) router.back();
          else router.replace(AppRoutes.homeDashboardScreen);
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.78)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 22,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 380,
              backgroundColor: '#0D1527',
              borderRadius: 24,
              borderWidth: 1.5,
              borderColor: '#C9A84C',
              padding: 24,
              alignItems: 'center',
              shadowColor: '#C9A84C',
              shadowOpacity: 0.35,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: 'rgba(201, 168, 76, 0.18)',
                borderWidth: 1.5,
                borderColor: '#FFD700',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
              }}
            >
              <AppIcon name="lock" color="#FFD700" size={30} />
            </View>

            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 8 }}>
              {selectedLanguage === 'Telugu' ? 'సంప్రదింపు కోసం లాగిన్ చేయండి' : selectedLanguage === 'Hindi' ? 'परामर्श हेतु लॉगिन करें' : 'Sign In to Consult'}
            </Text>

            <Text style={{ color: '#CBD5E1', fontSize: 13, lineHeight: 19, textAlign: 'center', marginBottom: 20 }}>
              {selectedLanguage === 'Telugu'
                ? 'జ్యోతిష నిపుణులతో లైవ్ కాల్ మాట్లాడటానికి దయచేసి మీ మొబైల్ నంబర్‌తో సైన్ ఇన్ అవ్వండి.'
                : selectedLanguage === 'Hindi'
                  ? 'ज्योतिषी के साथ लाइव कॉल शुरू करने के लिए कृपया अपने मोबाइल नंबर से साइन इन करें।'
                  : 'Please sign in with your mobile number to connect live with certified Vedic astrologers.'}
            </Text>

            <Pressable
              onPress={() => {
                setAuthModalVisible(false);
                push(AppRoutes.signInScreen);
              }}
              style={({ pressed }) => ({
                width: '100%',
                height: 48,
                borderRadius: 14,
                backgroundColor: '#C9A84C',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.9 : 1,
                shadowColor: '#C9A84C',
                shadowOpacity: 0.45,
                shadowRadius: 8,
                elevation: 4,
                marginBottom: 10,
              })}
            >
              <AppIcon name="login" color="#0A0E1A" size={18} style={{ marginRight: 6 }} />
              <Text style={{ color: '#0A0E1A', fontSize: 14, fontWeight: '800' }}>
                {selectedLanguage === 'Telugu' ? 'సైన్ ఇన్ అవ్వండి' : selectedLanguage === 'Hindi' ? 'साइन इन करें' : 'Sign In to Proceed'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setAuthModalVisible(false);
                if (router.canGoBack()) router.back();
                else router.replace(AppRoutes.homeDashboardScreen);
              }}
              style={{ paddingVertical: 10 }}
            >
              <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '600' }}>
                {selectedLanguage === 'Telugu' ? '← తిరిగి వెళ్ళు' : selectedLanguage === 'Hindi' ? '← वापस जाएं' : '← Go Back'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* 4. Professional Confirmation Modal when User taps Back or End Call */}
      <Modal
        visible={confirmEndCallVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmEndCallVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.78)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 22,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 380,
              backgroundColor: '#0D1527',
              borderRadius: 24,
              borderWidth: 1.5,
              borderColor: '#C9A84C',
              padding: 24,
              alignItems: 'center',
              shadowColor: '#C9A84C',
              shadowOpacity: 0.35,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            {/* Warning Call End Icon */}
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                borderWidth: 1.5,
                borderColor: '#EF4444',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
              }}
            >
              <AppIcon name="phone_disabled" color="#EF4444" size={30} />
            </View>

            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 8 }}>
              {selectedLanguage === 'Telugu'
                ? 'కాల్ ముగించాలనుకుంటున్నారా?'
                : selectedLanguage === 'Hindi'
                  ? 'क्या आप परामर्श समाप्त करना चाहते हैं?'
                  : 'End Consultation Session?'}
            </Text>

            <Text style={{ color: '#CBD5E1', fontSize: 13, lineHeight: 19, textAlign: 'center', marginBottom: 20 }}>
              {selectedLanguage === 'Telugu'
                ? `${astroDisplayName}తో మీ లైవ్ సంప్రదింపు సెషన్ ముగుస్తుంది. మీ పూర్తి జాతక చర్చ మరియు పరిహారాల నివేదిక వెంటనే సిద్ధం చేయబడుతుంది.`
                : selectedLanguage === 'Hindi'
                  ? `${astroDisplayName} के साथ आपका लाइव सत्र समाप्त हो जाएगा। आपके वार्तालाप की विस्तृत वैदिक रिपोर्ट तैयार की जाएगी।`
                  : `Are you sure you want to end your active consultation with ${astro.name}? A comprehensive Vedic summary report will be prepared for you.`}
            </Text>

            {/* 1. Primary Button: Stay in Call (Golden) */}
            <Pressable
              onPress={() => setConfirmEndCallVisible(false)}
              style={({ pressed }) => ({
                width: '100%',
                height: 48,
                borderRadius: 14,
                backgroundColor: '#C9A84C',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.9 : 1,
                shadowColor: '#C9A84C',
                shadowOpacity: 0.45,
                shadowRadius: 8,
                elevation: 4,
                marginBottom: 10,
              })}
            >
              <AppIcon name="phone_in_talk" color="#0A0E1A" size={18} style={{ marginRight: 6 }} />
              <Text style={{ color: '#0A0E1A', fontSize: 14, fontWeight: '800' }}>
                {selectedLanguage === 'Telugu' ? 'కాల్‌లో కొనసాగండి' : selectedLanguage === 'Hindi' ? 'कॉल जारी रखें' : 'Stay in Consultation'}
              </Text>
            </Pressable>

            {/* 2. Secondary Button: End Call (Red border) */}
            <Pressable
              onPress={() => {
                setConfirmEndCallVisible(false);
                endCall();
              }}
              style={({ pressed }) => ({
                width: '100%',
                height: 44,
                borderRadius: 14,
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                borderWidth: 1.5,
                borderColor: '#EF4444',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <AppIcon name="call_end" color="#EF4444" size={17} style={{ marginRight: 6 }} />
              <Text style={{ color: '#EF4444', fontSize: 13.5, fontWeight: '800' }}>
                {selectedLanguage === 'Telugu' ? 'అవును, ముగించండి' : selectedLanguage === 'Hindi' ? 'हाँ, समाप्त करें' : 'Yes, End Consultation'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
