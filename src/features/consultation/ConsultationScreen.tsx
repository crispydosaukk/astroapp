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
import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { WebView } from 'react-native-webview';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedBox } from '@/components/AnimatedBox';
import { AppIcon } from '@/components/AppIcon';
import { AppImage } from '@/components/AppImage';
import { RadialGlow } from '@/components/common';
import { Dialog, showSnackBar } from '@/components/overlays';
import { formatDobToDDMMYYYY } from '@/components/pickers';
import { Text, TextInput } from '@/components/Text';
import { useAuthStore } from '@/features/auth/authStore';
import { useBirthProfileStore } from '@/services/birthProfileStore';
import { AppRoutes, go, push, useExtra } from '@/navigation/routes';
import { submitConsultationReview } from '@/services/reviewService';
import { deductWalletBalance, getWalletBalance, subscribeWallet } from '@/services/walletService';
import { generateZegoRoomId, openAiCallRoom, openZegoCallRoom } from '@/services/zegoService';
import { useCurrencyStore } from '@/services/currencyStore';
import {
  createConsultationBooking,
  getConsultationStatus,
  cancelConsultationBooking,
  completeConsultationBooking,
  startCallBilling,
} from '@/services/consultationService';
import { fetchCalculatedKundli, KundliChartData, sendLiveAIChatMessage } from '@/services/astrologyService';
import { speakAstrologerText, stopAstrologerSpeech } from '@/services/speechService';
import { AppColors, argb, withAlpha } from '@/theme/colors';
import { useThemeColors } from '@/theme/themeStore';
import { useController } from '@/utils/anim';

type Astro = { id?: string; name: string; title?: string; imageUrl: string; semanticLabel?: string; price?: number; isAi?: boolean; [k: string]: unknown };
type Msg = { text: string; isSystem: boolean; isUser?: boolean; time: string };

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
      <AnimatedBox duration={200} style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', backgroundColor: isActive ? withAlpha(activeColor, 40) : 'rgba(38, 16, 11, 0.85)', borderColor: isActive ? activeColor : 'rgba(201, 168, 76, 0.4)' }}>
        <AppIcon name={icon} color={isActive ? activeColor : '#D4C5A9'} size={22} />
      </AnimatedBox>
      <Text style={{ marginTop: 4, color: isActive ? activeColor : '#D4C5A9', fontSize: 10, fontWeight: '600' }}>{label}</Text>
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

function InCallKundliChart({
  planets,
}: {
  planets: Array<{ name: string; symbol: string; house: number; color: string }>;
}) {
  const S = 210;
  const stroke = '#C9A84C';
  const coords: Record<number, { x: number; y: number }> = {
    1:  { x: S * 0.50, y: S * 0.25 },
    2:  { x: S * 0.25, y: S * 0.14 },
    3:  { x: S * 0.14, y: S * 0.25 },
    4:  { x: S * 0.25, y: S * 0.50 },
    5:  { x: S * 0.14, y: S * 0.75 },
    6:  { x: S * 0.25, y: S * 0.86 },
    7:  { x: S * 0.50, y: S * 0.75 },
    8:  { x: S * 0.75, y: S * 0.86 },
    9:  { x: S * 0.86, y: S * 0.75 },
    10: { x: S * 0.75, y: S * 0.50 },
    11: { x: S * 0.86, y: S * 0.25 },
    12: { x: S * 0.75, y: S * 0.14 },
  };

  const planetsByHouse: Record<number, Array<{ symbol: string; color: string }>> = {};
  planets.forEach((p) => {
    if (p.house >= 1 && p.house <= 12) {
      if (!planetsByHouse[p.house]) planetsByHouse[p.house] = [];
      planetsByHouse[p.house].push({ symbol: p.symbol, color: p.color });
    }
  });

  return (
    <View style={{ width: S, height: S, alignSelf: 'center', marginVertical: 6 }}>
      <Svg width={S} height={S}>
        <Rect x={0} y={0} width={S} height={S} fill="rgba(30,12,9,0.92)" stroke={stroke} strokeWidth={1.5} rx={8} />
        {/* Main Diagonals */}
        <Line x1={0} y1={0} x2={S} y2={S} stroke={stroke} strokeWidth={1.2} />
        <Line x1={0} y1={S} x2={S} y2={0} stroke={stroke} strokeWidth={1.2} />
        {/* Inner Diamond */}
        <Line x1={S * 0.5} y1={0} x2={S} y2={S * 0.5} stroke={stroke} strokeWidth={1.2} />
        <Line x1={S} y1={S * 0.5} x2={S * 0.5} y2={S} stroke={stroke} strokeWidth={1.2} />
        <Line x1={S * 0.5} y1={S} x2={0} y2={S * 0.5} stroke={stroke} strokeWidth={1.2} />
        <Line x1={0} y1={S * 0.5} x2={S * 0.5} y2={0} stroke={stroke} strokeWidth={1.2} />

        {/* House Numbers & Lagna */}
        {Object.entries(coords).map(([hStr, pt]) => {
          const h = Number(hStr);
          const housePlanets = planetsByHouse[h] || [];
          return (
            <React.Fragment key={`h_${h}`}>
              <SvgText x={pt.x} y={pt.y - 6} fontSize={9} fontWeight="700" textAnchor="middle" fill="rgba(201,168,76,0.75)">
                {h}
              </SvgText>
              {h === 1 && (
                <SvgText x={pt.x} y={pt.y - 14} fontSize={8} fontWeight="900" textAnchor="middle" fill="#FFD700">
                  Lg
                </SvgText>
              )}
              {housePlanets.length > 0 && (
                <SvgText x={pt.x} y={pt.y + 7} fontSize={11} fontWeight="800" textAnchor="middle" fill={housePlanets[0].color}>
                  {housePlanets.map((hp) => hp.symbol).join('')}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

export default function ConsultationScreen() {
  const colors = useThemeColors();
  const extra = useExtra<{ type?: string; astrologer?: Astro; roomID?: string }>();
  const astro = extra?.astrologer ?? DEFAULT_ASTRO;
  const isVideo = extra?.type !== 'voice';
  const ratePerMin = Number(astro.price ?? 25);
  const isAi = Boolean((astro as any)?.isAi || astro.name?.includes('(AI)') || (astro.title && astro.title.toLowerCase().includes('ai')));
  const { formatPrice, formatRate } = useCurrencyStore();

  // Authentication check
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authUser = useAuthStore((s) => s.user);
  const isAuth = Boolean(isAuthenticated && authUser && (authUser.uid || authUser.phone));
  const activeProfile = useBirthProfileStore((s) => s.activeProfile);

  const [chartData, setChartData] = useState<KundliChartData | null>(null);
  const [callTab, setCallTab] = useState<'chart' | 'stream'>('chart');

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
      .catch(() => {});
  }, [activeProfile, authUser]);

  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [lowBalanceVisible, setLowBalanceVisible] = useState(false);
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const roomID = useRef(extra?.roomID || generateZegoRoomId()).current;

  // Real consultation states
  const [isWaitingAstrologer, setIsWaitingAstrologer] = useState(!isAi);
  const [acceptanceCountdown, setAcceptanceCountdown] = useState(60);
  const [connectionStatusText, setConnectionStatusText] = useState(
    isAi ? 'Connecting to AI Astrologer...' : 'Calling Astrologer... Waiting for acceptance'
  );
  const [inAppVideoVisible, setInAppVideoVisible] = useState(false);

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
  const [input, setInput] = useState('');
  const [ended, setEnded] = useState(false);

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
    setMessages((m) => [...m, { text, isSystem: true, time: fmt(secondsRef.current) }]);
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
    stopTimers();
    setEnded(true);

    if (consultationIdRef.current) {
      completeConsultationBooking(consultationIdRef.current).catch(() => {});
    }

    try {
      const stored = await AsyncStorage.getItem('astroparihar_consultation_history');
      const list = stored ? JSON.parse(stored) : [];
      const record = {
        id: consultationIdRef.current || `call_${Date.now()}`,
        astrologerName: astro.name,
        type: isVideo ? 'Video Call' : 'Voice Call',
        date: 'Today',
        duration: fmt(secondsRef.current),
        amount: totalCharged,
        avatar: astro.imageUrl,
        roomID,
      };
      await AsyncStorage.setItem('astroparihar_consultation_history', JSON.stringify([record, ...list]));
    } catch {}
  };

  const cancelCallBeforeAcceptance = async () => {
    stopTimers();
    if (consultationIdRef.current) {
      await cancelConsultationBooking(consultationIdRef.current, 'Cancelled by user before acceptance');
    }
    showSnackBar('Consultation request cancelled. No amount was deducted.', '#D97706');
    if (router.canGoBack()) router.back();
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

    getWalletBalance().then(async (curBal) => {
      if (!mounted.current) return;
      setBalance(curBal);

      if (curBal < minRequired) {
        setConnecting(false);
        setLowBalanceVisible(true);
        return;
      }

      // If this is an AI Astrologer: Connect immediately without waiting for human acceptance
      if (isAi) {
        setTimeout(async () => {
          if (!mounted.current) return;
          setConnecting(false);
          setConnected(true);
          setIsWaitingAstrologer(false);

          // Deduct 1st minute
          const firstMin = await deductWalletBalance(
            ratePerMin,
            `1st Min: AI Consultation with ${astro.name}`,
            astro.name
          );
          if (firstMin.success) {
            setBalance(firstMin.newBalance);
            setTotalCharged(ratePerMin);
            addSystem(`AI Consultation connected. First minute (${formatPrice(ratePerMin)}) billed.`);
            addSystem(`Session: ${roomID}`);
          }

          // Call timer
          timers.current.call = setInterval(() => setSeconds((s) => s + 1), 1000);

          // 60-second billing interval
          timers.current.balance = setInterval(async () => {
            const res = await deductWalletBalance(
              ratePerMin,
              `AI Consultation with ${astro.name}`,
              astro.name
            );
            if (res.success) {
              setBalance(res.newBalance);
              setTotalCharged((prev) => prev + ratePerMin);
            } else if (res.isDepleted) {
              addSystem('Wallet balance exhausted. Ending session...');
              setTimeout(endCall, 800);
            }
          }, 60000);
        }, 1200);
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
            cancelConsultationBooking(activeConsultId, 'Astrologer timeout (60s)').catch(() => {});
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
            } catch {}

            // Deduct 1st minute from live database
            const firstMin = await deductWalletBalance(
              ratePerMin,
              `1st Min: ${isVideo ? 'Video' : 'Voice'} Call with ${astro.name}`,
              astro.name,
              activeConsultId
            );
            if (firstMin.success) {
              setBalance(firstMin.newBalance);
              setTotalCharged(ratePerMin);
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
                activeConsultId
              );
              if (res.success) {
                setBalance(res.newBalance);
                setTotalCharged((prev) => prev + ratePerMin);
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
      stopTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { text, isSystem: false, isUser: true, time: fmt(secondsRef.current) }]);
    setInput('');
    scrollChat();

    if (isAi) {
      try {
        const res = await sendLiveAIChatMessage({
          messages: [{ role: 'user', content: text }],
          astrologerId: String((astro as any).id || 'acharya-devavrat'),
        });
        if (res.reply) {
          setMessages((m) => [...m, { text: res.reply, isSystem: false, isUser: false, time: fmt(secondsRef.current) }]);
          scrollChat();
          if (isSpeakerOn && !isMuted) {
            speakAstrologerText(res.reply, { astrologerName: astro.name });
          }
          return;
        }
      } catch {}
    }

    setTimeout(() => {
      if (!mounted.current) return;
      const reply = isAi ? REPLIES[Math.floor(Math.random() * REPLIES.length)] : 'The astrologer is listening directly on the live audio channel.';
      setMessages((m) => [...m, { text: reply, isSystem: false, isUser: false, time: fmt(secondsRef.current) }]);
      scrollChat();
      if (isAi && isSpeakerOn && !isMuted) {
        speakAstrologerText(reply, { astrologerName: astro.name });
      }
    }, 1500);
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
    } catch {
      setReviewSubmitted(true);
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
    <View style={{ flex: 1, backgroundColor: '#140604' }} testID="consultation.screen">
      {/* Sacred Vedic Cosmic Background (Images 2 & 3 Fix) */}
      <LinearGradient
        colors={['#1F0C08', '#2D120B', '#140604']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <RadialGlow colors={['rgba(201,168,76,0.18)', 'rgba(113,59,50,0.14)', 'rgba(0,0,0,0)']} r="130%" />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Top Bar: Astrologer Info, Live Timer, Wallet Balance */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 10,
              backgroundColor: 'rgba(38,16,11,0.88)',
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(201,168,76,0.25)',
            }}
          >
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <Avatar uri={astro.imageUrl} size={42} border={1.5} />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text numberOfLines={1} style={{ color: '#F0EAD6', fontSize: 14, fontWeight: '700' }}>
                  {astro.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 1 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: connected ? '#3DCB7A' : '#C9A84C' }} />
                  <Text style={{ marginLeft: 4, color: connected ? '#3DCB7A' : '#C9A84C', fontSize: 11, fontWeight: '600' }}>
                    {connected ? (isVideo ? 'Live Video Call' : 'Live Voice Call') : 'Connecting...'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.4)' }}>
              <AppIcon name="timer_outlined" color="#FFD700" size={13} />
              <Text testID="consultation.timer" style={{ marginLeft: 4, color: '#FFD700', fontSize: 12.5, fontWeight: '800', letterSpacing: 0.5 }}>
                {fmt(seconds)}
              </Text>
            </View>

            <View style={{ marginLeft: 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: balance < 50 ? 'rgba(239,68,68,0.6)' : 'rgba(201,168,76,0.4)' }}>
              <AppIcon name="account_balance_wallet_outlined" color={balance < 50 ? '#EF4444' : '#FFD700'} size={13} />
              <Text testID="consultation.balance" style={{ marginLeft: 4, color: balance < 50 ? '#EF4444' : '#FFD700', fontSize: 12.5, fontWeight: '800' }}>
                {formatPrice(balance)}
              </Text>
            </View>
          </View>

          {/* Segmented Switch: Devotee Kundli Chart vs Astrologer Voice Stream */}
          <View
            style={{
              flexDirection: 'row',
              marginHorizontal: 16,
              marginTop: 8,
              marginBottom: 4,
              padding: 3,
              borderRadius: 14,
              backgroundColor: 'rgba(28, 12, 9, 0.9)',
              borderWidth: 1,
              borderColor: 'rgba(201, 168, 76, 0.3)',
            }}
          >
            <Pressable
              onPress={() => setCallTab('chart')}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 7,
                borderRadius: 11,
                backgroundColor: callTab === 'chart' ? '#713B32' : 'transparent',
              }}
            >
              <AppIcon name="auto_awesome" size={13} color={callTab === 'chart' ? '#FFD700' : '#A0A8C0'} style={{ marginRight: 5 }} />
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: callTab === 'chart' ? '#FFFFFF' : '#A0A8C0' }}>
                Birth Chart (Kundli)
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setCallTab('stream')}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 7,
                borderRadius: 11,
                backgroundColor: callTab === 'stream' ? '#713B32' : 'transparent',
              }}
            >
              <AppIcon name="headset_mic_rounded" size={13} color={callTab === 'stream' ? '#FFD700' : '#A0A8C0'} style={{ marginRight: 5 }} />
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: callTab === 'stream' ? '#FFFFFF' : '#A0A8C0' }}>
                Voice Stream
              </Text>
            </Pressable>
          </View>

          {/* Middle Main View: Kundli Chart OR Astrologer Stream */}
          <View style={{ flex: 1, justifyContent: 'center' }}>
            {connected && !isChatOpen && (
              callTab === 'chart' ? (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 4 }}>
                  {/* Devotee Birth Details Card */}
                  <View
                    style={{
                      marginHorizontal: 16,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 16,
                      backgroundColor: 'rgba(38, 16, 11, 0.92)',
                      borderWidth: 1.5,
                      borderColor: 'rgba(201, 168, 76, 0.45)',
                      shadowColor: '#C9A84C',
                      shadowOpacity: 0.15,
                      shadowRadius: 8,
                      elevation: 3,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: '#F0EAD6', fontSize: 13.5, fontWeight: '800' }}>
                        👤 {devoteeName}
                      </Text>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 8, backgroundColor: 'rgba(201, 168, 76, 0.22)', borderWidth: 1, borderColor: '#C9A84C' }}>
                        <Text style={{ color: '#FFD700', fontSize: 10.5, fontWeight: '800' }}>
                          Lagna: {devoteeLagna}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5, flexWrap: 'wrap', gap: 8 }}>
                      <Text style={{ color: '#D4C5A9', fontSize: 11 }}>
                        📅 {devoteeDob} • ⏰ {devoteeTob}
                      </Text>
                      <Text numberOfLines={1} style={{ color: '#D4C5A9', fontSize: 11, flexShrink: 1 }}>
                        📍 {devoteePob}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 12 }}>
                      <Text style={{ color: '#C9A84C', fontSize: 11.5, fontWeight: '700' }}>
                        ♈ Rashi: {devoteeRashi}
                      </Text>
                      <Text style={{ color: '#C9A84C', fontSize: 11.5, fontWeight: '700' }}>
                        🌟 Nakshatra: {devoteeNakshatra}
                      </Text>
                    </View>
                  </View>

                  {/* North Indian Janam Kundli SVG Chart */}
                  <InCallKundliChart planets={activePlanets} />

                  {/* Planetary Positions Horizontal Chips */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 6, paddingVertical: 4 }}
                  >
                    {activePlanets.map((p) => (
                      <View
                        key={p.name}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingHorizontal: 8,
                          paddingVertical: 4.5,
                          borderRadius: 8,
                          backgroundColor: 'rgba(38, 16, 11, 0.88)',
                          borderWidth: 1,
                          borderColor: 'rgba(201, 168, 76, 0.35)',
                        }}
                      >
                        <Text style={{ color: p.color, fontSize: 11.5, fontWeight: '800', marginRight: 4 }}>
                          {p.symbol}
                        </Text>
                        <Text style={{ color: '#F0EAD6', fontSize: 11, fontWeight: '600' }}>
                          {p.name} ({p.house}H • {p.sign})
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </ScrollView>
              ) : (
                /* Astrologer Voice Stream View */
                <View style={{ alignItems: 'center', paddingHorizontal: 20 }}>
                  <Animated.View style={[{ width: 140, height: 140, alignItems: 'center', justifyContent: 'center' }, pulseStyle]}>
                    <RadialGlow colors={[withAlpha(AppColors.primary, 80), withAlpha(AppColors.primary, 20), 'rgba(0,0,0,0)']} />
                    <Avatar uri={astro.imageUrl} size={100} border={2.5} />
                  </Animated.View>

                  <View
                    style={{
                      width: '100%',
                      marginTop: 14,
                      padding: 16,
                      borderRadius: 20,
                      backgroundColor: 'rgba(38, 16, 11, 0.92)',
                      borderWidth: 1.5,
                      borderColor: '#C9A84C',
                      shadowColor: '#C9A84C',
                      shadowOpacity: 0.2,
                      shadowRadius: 10,
                      elevation: 4,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#3DCB7A', marginRight: 8 }} />
                        <Text style={{ color: '#F0EAD6', fontSize: 13, fontWeight: '700' }}>
                          {isAi ? '⚡ AI Voice Stream Active' : '🎥 Live 1-on-1 Consultation'}
                        </Text>
                      </View>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 8, backgroundColor: 'rgba(201,168,76,0.2)', borderWidth: 1, borderColor: '#C9A84C' }}>
                        <Text style={{ color: '#C9A84C', fontSize: 10.5, fontWeight: '800' }}>
                          {formatRate(ratePerMin)}
                        </Text>
                      </View>
                    </View>

                    <Text style={{ color: '#D4C5A9', fontSize: 11.5, marginBottom: 12, lineHeight: 16 }}>
                      {isAi
                        ? 'Connected to autonomous AI Vedic ephemeris stream with real-time speech synthesis.'
                        : 'Encrypted real-time audio/video stream with your verified master astrologer.'}
                    </Text>

                    <Pressable
                      testID="consultation.openInAppVideo"
                      onPress={() => setInAppVideoVisible(true)}
                      style={{
                        borderRadius: 12,
                        overflow: 'hidden',
                      }}
                    >
                      <LinearGradient
                        colors={['#C9A84C', '#713B32']}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={{
                          paddingVertical: 11,
                          paddingHorizontal: 16,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <AppIcon name="videocam_rounded" color="#FFFFFF" size={17} style={{ marginRight: 6 }} />
                        <Text style={{ color: '#FFFFFF', fontSize: 12.5, fontWeight: '800' }}>
                          {isVideo ? 'Open In-App Video Stream' : 'Live In-App Voice Call Stream'}
                        </Text>
                      </LinearGradient>
                    </Pressable>
                  </View>
                </View>
              )
            )}
          </View>

          {isChatOpen ? (
            <View testID="consultation.chatPanel" style={{ height: 280, marginHorizontal: 12, borderRadius: 20, backgroundColor: 'rgba(28, 12, 9, 0.96)', borderWidth: 1.5, borderColor: '#C9A84C', shadowColor: '#C9A84C', shadowOpacity: 0.25, shadowRadius: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 }}>
                <AppIcon name="chat_bubble_outline_rounded" color="#FFD700" size={16} />
                <Text style={{ marginLeft: 8, flex: 1, color: '#F0EAD6', fontSize: 13, fontWeight: '700' }}>Session Chat</Text>
                <Pressable testID="consultation.chatPanel.close" onPress={() => setChatOpen(false)}>
                  <AppIcon name="keyboard_arrow_down_rounded" color="#D4C5A9" size={22} />
                </Pressable>
              </View>
              <View style={{ height: 1, backgroundColor: 'rgba(201,168,76,0.3)' }} />
              <View style={{ flex: 1 }}>
                {messages.length === 0 ? (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#D4C5A9', fontSize: 12, textAlign: 'center' }}>Chat with your astrologer during the session</Text>
                  </View>
                ) : (
                  <FlatList
                    ref={listRef}
                    data={messages}
                    keyExtractor={(_, i) => String(i)}
                    contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
                    renderItem={({ item }) =>
                      item.isSystem ? (
                        <View style={{ paddingVertical: 4, alignItems: 'center' }}>
                          <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(201,168,76,0.2)' }}>
                            <Text style={{ color: '#FFD700', fontSize: 11 }}>{item.text}</Text>
                          </View>
                        </View>
                      ) : (
                        <View style={{ paddingVertical: 3, flexDirection: 'row', justifyContent: item.isUser ? 'flex-end' : 'flex-start', alignItems: 'center' }}>
                          {!item.isUser ? <View style={{ marginRight: 6 }}><Avatar uri={astro.imageUrl} size={24} /></View> : null}
                          <View style={{ flexShrink: 1, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: item.isUser ? '#713B32' : 'rgba(45, 18, 12, 0.95)', borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomLeftRadius: item.isUser ? 16 : 4, borderBottomRightRadius: item.isUser ? 4 : 16 }}>
                            <Text style={{ color: '#F0EAD6', fontSize: 12 }}>{item.text}</Text>
                          </View>
                        </View>
                      )
                    }
                  />
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 6, paddingBottom: 10 }}>
                <TextInput
                  testID="consultation.chatInput"
                  value={input}
                  onChangeText={setInput}
                  onSubmitEditing={sendMessage}
                  placeholder="Type a message..."
                  placeholderTextColor="#A0A8C0"
                  style={{ flex: 1, fontSize: 13, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)', color: '#F0EAD6' }}
                />
                <Pressable testID="consultation.chatSend" onPress={sendMessage} style={{ marginLeft: 8, width: 38, height: 38, borderRadius: 19, overflow: 'hidden' }}>
                  <LinearGradient colors={['#C9A84C', '#713B32']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <AppIcon name="send_rounded" color="#FFFFFF" size={18} />
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          ) : null}

          {/* controls */}
          <View style={{ marginHorizontal: 16, marginTop: 4, marginBottom: 16, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24, backgroundColor: 'rgba(34, 14, 10, 0.92)', borderWidth: 1.5, borderColor: 'rgba(201, 168, 76, 0.35)', flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'flex-start', shadowColor: '#000', shadowOpacity: 0.47, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 10 }}>
            <ControlButton testID="consultation.mute" icon={isMuted ? 'mic_off_rounded' : 'mic_rounded'} label={isMuted ? 'Unmute' : 'Mute'} isActive={isMuted} activeColor={AppColors.error} onTap={() => setMuted((v) => { if (!v) stopAstrologerSpeech(); return !v; })} />
            {isVideo ? (
              <ControlButton testID="consultation.camera" icon={isCameraOff ? 'videocam_off_rounded' : 'videocam_rounded'} label={isCameraOff ? 'Cam Off' : 'Camera'} isActive={isCameraOff} activeColor={AppColors.error} onTap={() => setCameraOff((v) => !v)} />
            ) : null}
            <ControlButton testID="consultation.speaker" icon={isSpeakerOn ? 'volume_up_rounded' : 'volume_off_rounded'} label={isSpeakerOn ? 'Speaker' : 'Earpiece'} isActive={!isSpeakerOn} activeColor={AppColors.warning} onTap={() => setSpeakerOn((v) => { if (v) stopAstrologerSpeech(); return !v; })} />
            <ControlButton testID="consultation.chat" icon="chat_bubble_outline_rounded" label="Chat" isActive={isChatOpen} activeColor="#FFD700" onTap={() => setChatOpen((v) => !v)} />
            <Pressable testID="consultation.end" onPress={endCall} style={{ alignItems: 'center' }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, overflow: 'hidden', shadowColor: AppColors.error, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 }}>
                <LinearGradient colors={['#CF4444', '#713B32']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <AppIcon name="call_end_rounded" color="#FFFFFF" size={24} />
                </LinearGradient>
              </View>
              <Text style={{ marginTop: 4, color: AppColors.error, fontSize: 10, fontWeight: '600' }}>End</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Connecting & Astrologer Acceptance Radar Overlay */}
      {connecting ? (
        <View testID="consultation.connecting" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(18, 6, 4, 0.96)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <View style={{ width: 170, height: 170, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ position: 'absolute', width: 170, height: 170, borderRadius: 85, borderWidth: 2, borderColor: withAlpha(AppColors.goldAccent, Math.floor(90 * (1 - cv))), transform: [{ scale: 0.6 + cv * 0.6 }] }} />
            <Avatar uri={astro.imageUrl} size={110} border={2.5} />
          </View>

          <Text style={{ marginTop: 24, color: AppColors.textPrimary, fontSize: 22, fontWeight: '700', textAlign: 'center' }}>{astro.name}</Text>
          <Text style={{ marginTop: 6, color: AppColors.goldAccent, fontSize: 13, fontWeight: '600' }}>
            {connectionStatusText}
          </Text>

          {isWaitingAstrologer ? (
            <View style={{ marginTop: 14, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(201,168,76,0.14)', borderWidth: 1, borderColor: AppColors.goldBorder, alignItems: 'center' }}>
              <Text style={{ color: '#E2D9C8', fontSize: 12 }}>
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

      {/* Session Ended Dialog with Rating */}
      <Dialog visible={ended} onClose={() => {}} barrierDismissible={false} style={{ borderRadius: 20, maxHeight: '85%', backgroundColor: colors.surface }} testID="consultation.endDialog">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '700' }}>Session Ended</Text>
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

          <Pressable
            testID="consultation.done"
            onPress={() => {
              setEnded(false);
              go(AppRoutes.homeDashboardScreen);
            }}
            style={{
              marginTop: 16,
              paddingVertical: 14,
              borderRadius: 14,
              backgroundColor: AppColors.primary,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>Done</Text>
          </Pressable>
        </ScrollView>
      </Dialog>

      {/* Fullscreen In-App Video Call Modal (100% Inside the App) */}
      <Modal visible={inAppVideoVisible} animationType="slide" onRequestClose={() => setInAppVideoVisible(false)}>
        <View style={{ flex: 1, backgroundColor: '#080D1A' }}>
          <SafeAreaView edges={['top']} style={{ backgroundColor: 'rgba(8,13,26,0.98)', borderBottomWidth: 1, borderBottomColor: AppColors.goldBorder }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 }}>
              <Pressable
                onPress={() => setInAppVideoVisible(false)}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)' }}
              >
                <AppIcon name="arrow_back_ios_new" color={AppColors.goldAccent} size={16} />
                <Text style={{ color: AppColors.goldAccent, fontSize: 12, fontWeight: '700', marginLeft: 4 }}>Minimize</Text>
              </Pressable>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: AppColors.goldBorder }}>
                <AppIcon name="timer_outlined" color={AppColors.goldAccent} size={14} />
                <Text style={{ color: AppColors.goldAccent, fontSize: 12, fontWeight: '700', marginLeft: 4 }}>{fmt(seconds)}</Text>
              </View>
              <Pressable
                onPress={() => {
                  setInAppVideoVisible(false);
                  endCall();
                }}
                style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, backgroundColor: AppColors.error }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>End Call</Text>
              </Pressable>
            </View>
          </SafeAreaView>

          {Platform.OS !== 'web' ? (
            <WebView
              source={{
                uri: isAi
                  ? `https://astroparihar.com/ai-call/${roomID}?embedded=true`
                  : `https://astroparihar.com/call/${roomID}?embedded=true`,
              }}
              style={{ flex: 1, backgroundColor: '#080D1A' }}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              originWhitelist={['*']}
              onPermissionRequest={(event: any) => {
                event.grant(event.resources);
              }}
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Avatar uri={astro.imageUrl} size={120} border={3} />
              <Text style={{ color: '#FFFFFF', marginTop: 14, fontSize: 16, fontWeight: '700' }}>{astro.name}</Text>
              <Text style={{ color: AppColors.goldAccent, marginTop: 6, fontSize: 13 }}>Live 1-on-1 In-App Consultation</Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}
