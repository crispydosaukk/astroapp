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
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedBox } from '@/components/AnimatedBox';
import { AppIcon } from '@/components/AppIcon';
import { AppImage } from '@/components/AppImage';
import { RadialGlow } from '@/components/common';
import { Dialog, showSnackBar } from '@/components/overlays';
import { Text, TextInput } from '@/components/Text';
import { useAuthStore } from '@/features/auth/authStore';
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
import { sendLiveAIChatMessage } from '@/services/astrologyService';
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
      <AnimatedBox duration={200} style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', backgroundColor: isActive ? withAlpha(activeColor, 40) : AppColors.cardGlass, borderColor: isActive ? activeColor : AppColors.goldBorder }}>
        <AppIcon name={icon} color={isActive ? activeColor : AppColors.textSecondary} size={22} />
      </AnimatedBox>
      <Text style={{ marginTop: 4, color: isActive ? activeColor : AppColors.textMuted, fontSize: 10, fontWeight: '500' }}>{label}</Text>
    </Pressable>
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
        const bookingRes = await createConsultationBooking({
          astrologerId: String((astro as any).id || (astro as any).uid || 'astrologer_live'),
          astrologerName: astro.name,
          customerId: authUser?.uid || 'anonymous_user',
          customerName: authUser?.name || 'Customer',
          customerPhone: authUser?.phone || '',
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

  return (
    <View style={{ flex: 1, backgroundColor: '#030710' }} testID="consultation.screen">
      {/* background */}
      {isVideo ? (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#080D1A' }}>
          {connected ? (
            <>
              <AppImage uri={astro.imageUrl} width="100%" height="100%" fit="cover" semanticLabel={astro.semanticLabel ?? ''} />
              {isCameraOff ? (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#080D1A', alignItems: 'center', justifyContent: 'center' }}>
                  <Avatar uri={astro.imageUrl} size={80} border={2} />
                  <Text style={{ marginTop: 12, color: AppColors.textPrimary, fontSize: 16, fontWeight: '600' }}>{astro.name}</Text>
                  <Text style={{ marginTop: 4, color: AppColors.textSecondary, fontSize: 13 }}>Camera is off</Text>
                </View>
              ) : null}
            </>
          ) : null}
        </View>
      ) : (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
          <RadialGlow colors={['#1A0A2E', '#080D1A', '#030710']} r="120%" />
          {connected ? (
            <Animated.View style={[{ width: 160, height: 160, alignItems: 'center', justifyContent: 'center' }, pulseStyle]}>
              <RadialGlow colors={[withAlpha(AppColors.primary, 80), withAlpha(AppColors.primary, 20), 'rgba(0,0,0,0)']} />
              <Avatar uri={astro.imageUrl} size={110} border={2} />
            </Animated.View>
          ) : null}
        </View>
      )}
      <LinearGradient
        pointerEvents="none"
        colors={[argb('CC030710'), 'rgba(3,7,16,0)', 'rgba(3,7,16,0)', argb('EE030710')]}
        locations={[0, 0.2, 0.6, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* top bar */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <Avatar uri={astro.imageUrl} size={40} border={1.5} />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text numberOfLines={1} style={{ color: AppColors.textPrimary, fontSize: 14, fontWeight: '700' }}>{astro.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: connected ? AppColors.online : AppColors.goldAccent }} />
                  <Text style={{ marginLeft: 4, color: connected ? AppColors.online : AppColors.goldAccent, fontSize: 11, fontWeight: '500' }}>
                    {connected ? (isVideo ? 'Live Video Call' : 'Live Voice Call') : 'Connecting...'}
                  </Text>
                </View>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.38)', borderWidth: 1, borderColor: AppColors.goldBorder }}>
              <AppIcon name="timer_outlined" color={AppColors.goldAccent} size={14} />
              <Text testID="consultation.timer" style={{ marginLeft: 4, color: AppColors.goldAccent, fontSize: 13, fontWeight: '700', letterSpacing: 1 }}>{fmt(seconds)}</Text>
            </View>
            <View style={{ marginLeft: 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.38)', borderWidth: 1, borderColor: balance < 50 ? withAlpha(AppColors.error, 100) : AppColors.goldBorder }}>
              <AppIcon name="account_balance_wallet_outlined" color={balance < 50 ? AppColors.error : AppColors.goldAccent} size={14} />
              <Text testID="consultation.balance" style={{ marginLeft: 4, color: balance < 50 ? AppColors.error : AppColors.goldAccent, fontSize: 13, fontWeight: '700' }}>{formatPrice(balance)}</Text>
            </View>
          </View>

          {/* Middle Live ZegoCloud Room Launcher & Session Info */}
          <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 16 }}>
            {connected && !isChatOpen && (
              <View
                style={{
                  padding: 16,
                  borderRadius: 22,
                  backgroundColor: 'rgba(8,13,26,0.88)',
                  borderWidth: 1.5,
                  borderColor: AppColors.goldAccent,
                  shadowColor: AppColors.goldAccent,
                  shadowOpacity: 0.25,
                  shadowRadius: 12,
                  elevation: 6,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#3DCB7A', marginRight: 8 }} />
                    <Text style={{ color: '#F0EAD6', fontSize: 13, fontWeight: '700' }}>
                      {isAi ? '⚡ AI Voice Stream Room' : '🎥 Live ZegoCloud Call Room'}
                    </Text>
                  </View>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(201,168,76,0.18)', borderWidth: 1, borderColor: '#C9A84C' }}>
                    <Text style={{ color: '#C9A84C', fontSize: 10, fontWeight: '800' }}>
                      {formatRate(ratePerMin)}
                    </Text>
                  </View>
                </View>

                <Text style={{ color: '#A0A8C0', fontSize: 11, marginBottom: 12, lineHeight: 16 }}>
                  {isAi
                    ? 'Connected to autonomous AI Vedic ephemeris stream with real-time speech synthesis.'
                    : 'Real-time encrypted 1-on-1 audio/video stream with your verified astrologer.'}
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)' }}>
                  <Text style={{ color: '#A0A8C0', fontSize: 11 }}>Room ID:</Text>
                  <Text style={{ color: '#FFD700', fontSize: 11, fontWeight: '700' }}>{roomID}</Text>
                </View>

                <Pressable
                  testID="consultation.openInAppVideo"
                  onPress={() => setInAppVideoVisible(true)}
                  style={{
                    borderRadius: 14,
                    overflow: 'hidden',
                    shadowColor: '#C9A84C',
                    shadowOpacity: 0.35,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <LinearGradient
                    colors={['#C9A84C', '#713B32']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AppIcon name="videocam_rounded" color="#FFFFFF" size={18} style={{ marginRight: 8 }} />
                    <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800' }}>
                      {isVideo ? 'Open In-App Video Call Stream' : 'In-App Voice Call Active'}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </View>
            )}
          </View>

          {isChatOpen ? (
            <View testID="consultation.chatPanel" style={{ height: 280, marginHorizontal: 12, borderRadius: 20, backgroundColor: argb('DD080D1A'), borderWidth: 1, borderColor: AppColors.goldBorder }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 }}>
                <AppIcon name="chat_bubble_outline_rounded" color={AppColors.goldAccent} size={16} />
                <Text style={{ marginLeft: 8, flex: 1, color: AppColors.textPrimary, fontSize: 13, fontWeight: '600' }}>Session Chat</Text>
                <Pressable testID="consultation.chatPanel.close" onPress={() => setChatOpen(false)}>
                  <AppIcon name="keyboard_arrow_down_rounded" color={AppColors.textMuted} size={20} />
                </Pressable>
              </View>
              <View style={{ height: 1, backgroundColor: AppColors.goldBorder }} />
              <View style={{ flex: 1 }}>
                {messages.length === 0 ? (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: AppColors.textMuted, fontSize: 12, textAlign: 'center' }}>Chat with your astrologer during the session</Text>
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
                          <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: withAlpha(AppColors.goldAccent, 20) }}>
                            <Text style={{ color: AppColors.goldAccent, fontSize: 11 }}>{item.text}</Text>
                          </View>
                        </View>
                      ) : (
                        <View style={{ paddingVertical: 3, flexDirection: 'row', justifyContent: item.isUser ? 'flex-end' : 'flex-start', alignItems: 'center' }}>
                          {!item.isUser ? <View style={{ marginRight: 6 }}><Avatar uri={astro.imageUrl} size={24} /></View> : null}
                          <View style={{ flexShrink: 1, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: item.isUser ? withAlpha(AppColors.primary, 180) : AppColors.surfaceVariantDark, borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomLeftRadius: item.isUser ? 16 : 4, borderBottomRightRadius: item.isUser ? 4 : 16 }}>
                            <Text style={{ color: AppColors.textPrimary, fontSize: 12 }}>{item.text}</Text>
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
                  style={{ flex: 1, fontSize: 13, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24, backgroundColor: AppColors.cardGlass, borderWidth: 1, borderColor: AppColors.goldBorder }}
                />
                <Pressable testID="consultation.chatSend" onPress={sendMessage} style={{ marginLeft: 8, width: 38, height: 38, borderRadius: 19, overflow: 'hidden' }}>
                  <LinearGradient colors={[AppColors.primary, AppColors.primaryLight]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <AppIcon name="send_rounded" color={AppColors.textPrimary} size={18} />
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          ) : null}

          {/* controls */}
          <View style={{ marginHorizontal: 16, marginTop: 8, marginBottom: 20, paddingHorizontal: 20, paddingVertical: 16, borderRadius: 28, backgroundColor: argb('CC080D1A'), borderWidth: 1, borderColor: AppColors.goldBorder, flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'flex-start', shadowColor: '#000', shadowOpacity: 0.47, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 10 }}>
            <ControlButton testID="consultation.mute" icon={isMuted ? 'mic_off_rounded' : 'mic_rounded'} label={isMuted ? 'Unmute' : 'Mute'} isActive={isMuted} activeColor={AppColors.error} onTap={() => setMuted((v) => { if (!v) stopAstrologerSpeech(); return !v; })} />
            {isVideo ? (
              <ControlButton testID="consultation.camera" icon={isCameraOff ? 'videocam_off_rounded' : 'videocam_rounded'} label={isCameraOff ? 'Cam Off' : 'Camera'} isActive={isCameraOff} activeColor={AppColors.error} onTap={() => setCameraOff((v) => !v)} />
            ) : null}
            <ControlButton testID="consultation.speaker" icon={isSpeakerOn ? 'volume_up_rounded' : 'volume_off_rounded'} label={isSpeakerOn ? 'Speaker' : 'Earpiece'} isActive={!isSpeakerOn} activeColor={AppColors.warning} onTap={() => setSpeakerOn((v) => { if (v) stopAstrologerSpeech(); return !v; })} />
            <ControlButton testID="consultation.chat" icon="chat_bubble_outline_rounded" label="Chat" isActive={isChatOpen} activeColor={AppColors.goldAccent} onTap={() => setChatOpen((v) => !v)} />
            <Pressable testID="consultation.end" onPress={endCall} style={{ alignItems: 'center' }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, overflow: 'hidden', shadowColor: AppColors.error, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 }}>
                <LinearGradient colors={['#CF4444', '#713B32']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <AppIcon name="call_end_rounded" color="#FFFFFF" size={26} />
                </LinearGradient>
              </View>
              <Text style={{ marginTop: 4, color: AppColors.error, fontSize: 11, fontWeight: '600' }}>End</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Connecting & Astrologer Acceptance Radar Overlay */}
      {connecting ? (
        <View testID="consultation.connecting" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: argb('F5030710'), alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
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
