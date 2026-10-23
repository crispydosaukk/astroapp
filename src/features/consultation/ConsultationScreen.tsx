/**
 * Port of lib/presentation/consultation_screen/consultation_screen.dart
 * Payload: { type: 'voice' | 'video', astrologer } (anything other than 'voice' → video, like the GoRoute builder).
 * - connect after 3 s → call timer (1 s) + balance deduction (every 60 s, rate = price) + system message
 * - pulse 0.95↔1.05 / 1500 ms (voice avatar); connecting ripple + dots 800 ms linear repeat
 * - session chat: canned random reply after 2 s
 * - End → non-dismissible "Session Ended" dialog → Done pops dialog + screen
 * SOURCE_INERT: rating stars in dialog, user PiP tap.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, useWindowDimensions, View, ActivityIndicator } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedBox } from '@/components/AnimatedBox';
import { AppIcon } from '@/components/AppIcon';
import { AppImage } from '@/components/AppImage';
import { RadialGlow } from '@/components/common';
import { Dialog } from '@/components/overlays';
import { Text, TextInput } from '@/components/Text';
import { AppRoutes, push, useExtra } from '@/navigation/routes';
import { submitConsultationReview } from '@/services/reviewService';
import { deductWalletBalance, getWalletBalance, subscribeWallet } from '@/services/walletService';
import { AppColors, argb, withAlpha } from '@/theme/colors';
import { useController } from '@/utils/anim';
import { SOURCE_INERT } from '@/utils/sourceInert';

type Astro = { name: string; imageUrl: string; semanticLabel?: string; price?: number; [k: string]: unknown };
type Msg = { text: string; isSystem: boolean; isUser?: boolean; time: string };

const DEFAULT_ASTRO: Astro = {
  name: 'Swami Shankarananda Giri', title: 'Vedic Astrologer & Dasha Expert',
  imageUrl: 'https://astroparihar.com/assets/images/ai-astrologers/swami-ji.png',
  semanticLabel: 'Elderly Indian sage with white beard and traditional orange robes', isOnline: true, price: 45, rating: 4.99,
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
  const extra = useExtra<{ type?: string; astrologer?: Astro }>();
  const astro = extra?.astrologer ?? DEFAULT_ASTRO;
  const isVideo = extra?.type !== 'voice';
  const ratePerMin = Number(astro.price ?? 45);

  const [isMuted, setMuted] = useState(false);
  const [isCameraOff, setCameraOff] = useState(false);
  const [isSpeakerOn, setSpeakerOn] = useState(true);
  const [isChatOpen, setChatOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [balance, setBalance] = useState(450);
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

  const REVIEW_TAG_OPTIONS = [
    'Accurate Prediction 🎯',
    'Calm & Compassionate 🙏',
    'Effective Remedies ✨',
    'Deep Vedic Wisdom 📜',
    'Clear Guidance 🗣️',
    'Career Clarity 💼',
  ];

  const toggleTag = (t: string) => {
    setSelectedTags((prev) =>
      prev.includes(t) ? prev.filter((item) => item !== t) : [...prev, t]
    );
  };

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

  const secondsRef = useRef(0);
  secondsRef.current = seconds;
  const timers = useRef<{ connect?: ReturnType<typeof setTimeout>; call?: ReturnType<typeof setInterval>; balance?: ReturnType<typeof setInterval> }>({});
  const listRef = useRef<FlatList<Msg>>(null);
  const mounted = useRef(true);

  const scrollChat = () => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 0);
  const addSystem = (text: string) => { setMessages((m) => [...m, { text, isSystem: true, time: fmt(secondsRef.current) }]); scrollChat(); };

  const stopTimers = () => {
    clearTimeout(timers.current.connect);
    clearInterval(timers.current.call);
    clearInterval(timers.current.balance);
  };
  const endCall = () => { stopTimers(); setEnded(true); };

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

  useEffect(() => {
    timers.current.connect = setTimeout(() => {
      if (!mounted.current) return;
      setConnecting(false);
      setConnected(true);
      timers.current.call = setInterval(() => setSeconds((s) => s + 1), 1000);
      timers.current.balance = setInterval(async () => {
        try {
          const res = await deductWalletBalance(
            ratePerMin,
            `${isVideo ? 'Video' : 'Voice'} Call with ${astro.name}`,
            astro.name
          );
          if (res.success) {
            setBalance(res.newBalance);
            setTotalCharged((prev) => prev + ratePerMin);
            if (res.newBalance < ratePerMin) {
              addSystem(`⚠️ Low balance: ₹${res.newBalance.toFixed(0)} left. Less than 1 minute remaining.`);
            }
          } else {
            addSystem('Wallet balance exhausted. Ending session...');
            setTimeout(endCall, 800);
          }
        } catch {
          setBalance((b) => Math.max(0, b - ratePerMin));
          setTotalCharged((prev) => prev + ratePerMin);
        }
      }, 60000);
      addSystem('Call connected. Your session has started.');
    }, 3000);
    return () => { mounted.current = false; stopTimers(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { text, isSystem: false, isUser: true, time: fmt(secondsRef.current) }]);
    setInput('');
    scrollChat();
    setTimeout(() => {
      if (!mounted.current) return;
      const reply = REPLIES[Math.floor(Math.random() * REPLIES.length)];
      setMessages((m) => [...m, { text: reply, isSystem: false, isUser: false, time: fmt(secondsRef.current) }]);
      scrollChat();
    }, 2000);
  };

  /* animations */
  const pulse = useSharedValue(0.95);
  useEffect(() => { pulse.value = withRepeat(withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }), -1, true); }, [pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const conn = useController({ duration: 800, repeat: true, autoStart: true });
  const cv = conn.value;

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
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: AppColors.online }} />
                  <Text style={{ marginLeft: 4, color: AppColors.online, fontSize: 11, fontWeight: '500' }}>{connecting ? 'Connecting...' : isVideo ? 'Video Call' : 'Voice Call'}</Text>
                </View>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.38)', borderWidth: 1, borderColor: AppColors.goldBorder }}>
              <AppIcon name="timer_outlined" color={AppColors.goldAccent} size={14} />
              <Text testID="consultation.timer" style={{ marginLeft: 4, color: AppColors.goldAccent, fontSize: 13, fontWeight: '700', letterSpacing: 1 }}>{fmt(seconds)}</Text>
            </View>
            <View style={{ marginLeft: 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.38)', borderWidth: 1, borderColor: balance < 50 ? withAlpha(AppColors.error, 100) : AppColors.goldBorder }}>
              <AppIcon name="account_balance_wallet_outlined" color={balance < 50 ? AppColors.error : AppColors.goldAccent} size={14} />
              <Text testID="consultation.balance" style={{ marginLeft: 4, color: balance < 50 ? AppColors.error : AppColors.goldAccent, fontSize: 13, fontWeight: '700' }}>{`₹${balance.toFixed(0)}`}</Text>
            </View>
          </View>
          <View style={{ flex: 1 }} />

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
            <ControlButton testID="consultation.mute" icon={isMuted ? 'mic_off_rounded' : 'mic_rounded'} label={isMuted ? 'Unmute' : 'Mute'} isActive={isMuted} activeColor={AppColors.error} onTap={() => setMuted((v) => !v)} />
            {isVideo ? (
              <ControlButton testID="consultation.camera" icon={isCameraOff ? 'videocam_off_rounded' : 'videocam_rounded'} label={isCameraOff ? 'Cam Off' : 'Camera'} isActive={isCameraOff} activeColor={AppColors.error} onTap={() => setCameraOff((v) => !v)} />
            ) : null}
            <ControlButton testID="consultation.speaker" icon={isSpeakerOn ? 'volume_up_rounded' : 'volume_off_rounded'} label={isSpeakerOn ? 'Speaker' : 'Earpiece'} isActive={!isSpeakerOn} activeColor={AppColors.warning} onTap={() => setSpeakerOn((v) => !v)} />
            <ControlButton testID="consultation.chat" icon="chat_bubble_outline_rounded" label="Chat" isActive={isChatOpen} activeColor={AppColors.goldAccent} onTap={() => setChatOpen((v) => !v)} />
            <Pressable testID="consultation.end" onPress={endCall} style={{ alignItems: 'center' }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, overflow: 'hidden', shadowColor: AppColors.error, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 }}>
                <LinearGradient colors={['#CF4444', '#8B1A1A']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <AppIcon name="call_end_rounded" color="#FFFFFF" size={26} />
                </LinearGradient>
              </View>
              <Text style={{ marginTop: 4, color: AppColors.error, fontSize: 11, fontWeight: '600' }}>End</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {isVideo && connected ? (
        <Pressable testID="consultation.pip" onPress={SOURCE_INERT('consultation.pip')} style={{ position: 'absolute', top: 100, right: 16, width: 90, height: 130, borderRadius: 14, borderWidth: 1.5, borderColor: AppColors.goldAccent, backgroundColor: '#1A2640', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8 }}>
          <AppImage
            uri="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg"
            width="100%" height="100%" fit="cover"
            semanticLabel="User video preview in picture-in-picture"
            errorWidget={<View style={{ flex: 1, backgroundColor: '#1A2640', alignItems: 'center', justifyContent: 'center' }}><AppIcon name="person_rounded" color={AppColors.textMuted} size={36} /></View>}
          />
          {isMuted ? (
            <View style={{ position: 'absolute', bottom: 6, right: 6, padding: 4, borderRadius: 10, backgroundColor: withAlpha(AppColors.error, 200) }}>
              <AppIcon name="mic_off_rounded" color="#FFFFFF" size={10} />
            </View>
          ) : null}
        </Pressable>
      ) : null}

      {connecting ? (
        <View testID="consultation.connecting" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: argb('EE030710'), alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 160, height: 160, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ position: 'absolute', width: 160, height: 160, borderRadius: 80, borderWidth: 2, borderColor: withAlpha(AppColors.goldAccent, Math.floor(80 * (1 - cv))), transform: [{ scale: 0.6 + cv * 0.6 }] }} />
            <Avatar uri={astro.imageUrl} size={100} border={2} />
          </View>
          <Text style={{ marginTop: 24, color: AppColors.textPrimary, fontSize: 20, fontWeight: '700' }}>{astro.name}</Text>
          <Text style={{ marginTop: 8, color: AppColors.textSecondary, fontSize: 14 }}>{isVideo ? 'Connecting video call...' : 'Connecting voice call...'}</Text>
          <View style={{ marginTop: 32, flexDirection: 'row' }}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={{ marginHorizontal: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: withAlpha(AppColors.goldAccent, Math.floor(50 + 200 * ((cv + i * 0.33) % 1))) }} />
            ))}
          </View>
          <Pressable
            testID="consultation.cancel"
            onPress={() => { clearTimeout(timers.current.connect); if (router.canGoBack()) router.back(); }}
            style={{ marginTop: 40, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30, backgroundColor: withAlpha(AppColors.error, 40), borderWidth: 1, borderColor: withAlpha(AppColors.error, 100) }}
          >
            <Text style={{ color: AppColors.error, fontSize: 15, fontWeight: '600' }}>Cancel</Text>
          </Pressable>
        </View>
      ) : null}

      <Dialog visible={ended} onClose={() => {}} barrierDismissible={false} style={{ borderRadius: 20, maxHeight: '85%' }} testID="consultation.endDialog">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
          <Text style={{ color: AppColors.textPrimary, fontSize: 22, fontWeight: '700' }}>Session Ended</Text>
        <View style={{ marginTop: 16, padding: 16, borderRadius: 16, backgroundColor: AppColors.cardGlass, borderWidth: 1, borderColor: AppColors.goldBorder, gap: 8 }}>
          {[
            ['Duration', fmt(seconds)],
            ['Amount Charged', `₹${(totalCharged > 0 ? totalCharged : Math.round((seconds / 60) * ratePerMin)).toFixed(2)}`],
            ['Remaining Balance', `₹${balance.toFixed(2)}`],
          ].map(([l, v]) => (
            <View key={l} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: AppColors.textSecondary, fontSize: 13 }}>{l}</Text>
              <Text style={{ color: AppColors.textPrimary, fontSize: 13, fontWeight: '600' }}>{v}</Text>
            </View>
          ))}
        </View>
        {/* Interactive Customer Review System */}
        <View style={{ marginTop: 14, padding: 14, borderRadius: 16, backgroundColor: argb('1AC9A84C'), borderWidth: 1, borderColor: argb('33C9A84C') }}>
          <Text style={{ color: AppColors.textPrimary, fontSize: 14, fontWeight: '700', textAlign: 'center' }}>
            {reviewSubmitted ? 'Review Submitted 🙏' : 'Rate Your Consultation'}
          </Text>

          {reviewSubmitted ? (
            <View style={{ marginTop: 10, padding: 12, borderRadius: 12, backgroundColor: argb('1A2D9E6B'), borderWidth: 1, borderColor: argb('332D9E6B'), alignItems: 'center' }}>
              <Text style={{ color: '#3DCB7A', fontSize: 13, fontWeight: '700' }}>✓ Review Submitted Successfully!</Text>
              <Text style={{ marginTop: 4, color: AppColors.textSecondary, fontSize: 11, textAlign: 'center' }}>
                Thank you for your valuable feedback. It helps thousands of seekers discover genuine Vedic guidance.
              </Text>
            </View>
          ) : (
            <>
              {/* Star Rating Selectors */}
              <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'center' }}>
                {[0, 1, 2, 3, 4].map((i) => {
                  const filled = i < reviewRating;
                  return (
                    <Pressable
                      key={i}
                      testID={`consultation.endDialog.star.${i}`}
                      onPress={() => setReviewRating(i + 1)}
                      style={{ paddingHorizontal: 4 }}
                    >
                      <AppIcon
                        name={filled ? 'star_rounded' : 'star_outline_rounded'}
                        color={filled ? AppColors.goldAccent : AppColors.textMuted}
                        size={32}
                      />
                    </Pressable>
                  );
                })}
              </View>

              <Text style={{ marginTop: 4, color: AppColors.goldAccent, fontSize: 11, fontWeight: '600', textAlign: 'center' }}>
                {reviewRating === 5
                  ? '🌟 Exceptional & Accurate Guidance'
                  : reviewRating === 4
                  ? '⭐ Very Helpful & Compassionate'
                  : reviewRating === 3
                  ? '✨ Good Consultation'
                  : 'Fair Experience'}
              </Text>

              {/* Tag Chips */}
              <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                {REVIEW_TAG_OPTIONS.map((tag) => {
                  const sel = selectedTags.includes(tag);
                  return (
                    <Pressable
                      key={tag}
                      onPress={() => toggleTag(tag)}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 12,
                        backgroundColor: sel ? '#8B1A1A' : argb('0FFFFFFF'),
                        borderWidth: 1,
                        borderColor: sel ? '#8B1A1A' : argb('26C9A84C'),
                      }}
                    >
                      <Text style={{ color: sel ? '#F0EAD6' : AppColors.textSecondary, fontSize: 10, fontWeight: sel ? '700' : '400' }}>
                        {tag}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Review Comment Input */}
              <TextInput
                value={reviewComment}
                onChangeText={setReviewComment}
                placeholder="Share your experience with the astrologer..."
                placeholderTextColor={AppColors.textMuted}
                multiline
                numberOfLines={2}
                style={{
                  marginTop: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: AppColors.cardGlass,
                  borderWidth: 1,
                  borderColor: AppColors.goldBorder,
                  color: AppColors.textPrimary,
                  fontSize: 12,
                  maxHeight: 60,
                }}
              />

              {/* Submit Review Button */}
              <Pressable
                testID="consultation.endDialog.submitReview"
                onPress={handleReviewSubmit}
                disabled={isSubmittingReview}
                style={{ marginTop: 10, borderRadius: 10, overflow: 'hidden' }}
              >
                <LinearGradient
                  colors={['#C9A84C', '#E2C26A']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={{ paddingVertical: 9, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                >
                  {isSubmittingReview ? (
                    <ActivityIndicator size="small" color="#080D1A" style={{ marginRight: 6 }} />
                  ) : null}
                  <Text style={{ color: '#080D1A', fontSize: 12, fontWeight: '800' }}>
                    {isSubmittingReview ? 'Submitting Review...' : 'Submit Feedback ✦'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </>
          )}
        </View>

        <View style={{ marginTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Pressable
            testID="consultation.endDialog.recharge"
            onPress={() => {
              setEnded(false);
              if (router.canGoBack()) router.back();
              push(AppRoutes.walletScreen);
            }}
            style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: argb('26C9A84C'), borderWidth: 1, borderColor: argb('4DC9A84C') }}
          >
            <Text style={{ color: AppColors.goldAccent, fontSize: 13, fontWeight: '700' }}>💳 Recharge Wallet</Text>
          </Pressable>
          <Pressable
            testID="consultation.endDialog.done"
            onPress={() => {
              setEnded(false);
              if (router.canGoBack()) router.back();
            }}
            style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: AppColors.primary }}
          >
            <Text style={{ color: AppColors.textPrimary, fontSize: 14, fontWeight: '600' }}>Done</Text>
          </Pressable>
        </View>
        </ScrollView>
      </Dialog>
    </View>
  );
}
