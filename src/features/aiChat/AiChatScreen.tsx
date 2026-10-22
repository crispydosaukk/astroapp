/**
 * Port of lib/presentation/ai_chat_screen/ (screen + header, topic chips, messages, suggested prompts, input).
 * Behaviour parity:
 *  - local deterministic AI; 1800 ms typing delay; 4 response branches (career/job, marriage/love, saturn/sade sati, generic)
 *  - whitespace-only send blocked; input cleared after send; scroll-to-bottom 100 ms after insert
 *  - suggested prompts visible while messages.length <= 1
 *  - bubble entrance: 280 ms fade + 6 % slide, staggered index*25 ms (max 180 ms)
 *  - typing dots: 900 ms repeat, staggered bounce
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { AnimatedPressable } from '@/components/AnimatedBox';
import { AppIcon } from '@/components/AppIcon';
import { lh, Text, TextInput } from '@/components/Text';
import { AppRoutes, go } from '@/navigation/routes';
import { router } from 'expo-router';
import { useController } from '@/utils/anim';
import { SOURCE_INERT } from '@/utils/sourceInert';

export type ChatMessage = { isUser: boolean; text: string; time: string };

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    isUser: false,
    text: 'Namaste 🙏 I am AstroParihar AI — your personal Vedic astrology companion.\n\nI have analysed your birth chart (Scorpio Sun, Punarvasu Moon, Sagittarius Ascendant) and I am ready to guide you.\n\nWhat would you like to explore today?',
    time: '08:47 AM',
  },
];

export const TYPING_DELAY_MS = 1800;

/** _currentTime() — note: source renders hour 0 as "0" (no 12-hour correction for midnight). */
export function currentTime(now = new Date()) {
  const h = now.getHours() > 12 ? now.getHours() - 12 : now.getHours();
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
}

/** _getAiResponse() — deterministic canned responses. */
export function getAiResponse(userText: string): string {
  const lower = userText.toLowerCase();
  if (lower.includes('job') || lower.includes('career')) {
    return 'Based on your birth chart, Jupiter currently transits your 10th house of career. This is an exceptionally auspicious period for professional growth.\n\n✦ Peak opportunity window: November–February 2027\n✦ Recommended mantra: Om Guruve Namaha (108 times daily)\n✦ Auspicious day for interviews: Thursday\n\nYour Saturn Mahadasha ends in 14 months — after which Jupiter Mahadasha begins, bringing significant career advancement.';
  } else if (lower.includes('marriage') || lower.includes('love')) {
    return "Your 7th house (marriage) is ruled by Venus, currently strong in Libra. The stars indicate a favourable period for romantic unions.\n\n✦ Most auspicious marriage muhurtha: March–May 2027\n✦ Your partner's likely sun sign: Taurus or Libra\n✦ Recommended gemstone: Diamond or White Sapphire\n\nFor deeper compatibility analysis, I recommend a Kundli Milan consultation with one of our Vedic masters.";
  } else if (lower.includes('saturn') || lower.includes('sade sati')) {
    return 'Sade Sati — the 7.5-year Saturn transit — is a period of transformation, not punishment.\n\n📍 Your current status: Pre-Sade Sati phase begins in ~8 months\n\n✦ Phase 1 (Rising): Focus on health and discipline\n✦ Phase 2 (Peak): Career restructuring and inner growth\n✦ Phase 3 (Setting): Harvest of efforts\n\nRemedies: Saturday fasting, Shani Stotra recitation, and blue sapphire (after consultation) can significantly reduce challenges.';
  }
  return 'That is a profound question. Based on your Scorpio Sun and current Jupiter transit through your 10th house, the cosmic energies strongly support your query.\n\n✦ Current planetary influence: Jupiter (expansion) + Saturn (discipline)\n✦ Recommended action: Take deliberate steps on Thursdays\n✦ Spiritual practice: Morning meditation facing east\n\nWould you like me to analyse a specific area of your birth chart in more detail?';
}

/* ------------------------------------------------------- _WhatsAppBgPainter */
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

/* ------------------------------------------------------- AiChatHeaderWidget */
function AiChatHeader() {
  const onBack = () => {
    if (router.canGoBack()) router.back();
    // Source called context.go('/home'), which is not a declared route (GoRouter error page).
    // Mapped to the Home tab — recorded in docs/migration-status.md (Known deviations).
    else go(AppRoutes.homeDashboardScreen);
  };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 4, paddingRight: 16, paddingVertical: 8, backgroundColor: '#075E54', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 4, zIndex: 2 }}>
      <Pressable testID="aiChat.back" onPress={onBack} style={{ minWidth: 36, minHeight: 36, alignItems: 'center', justifyContent: 'center' }}>
        <AppIcon name="arrow_back" color="#FFFFFF" size={22} />
      </Pressable>
      <View>
        <View style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: '#C9A84C', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
          <LinearGradient colors={['#8B1A1A', '#3D0A0A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
          <Text style={{ fontSize: 20 }}>🔮</Text>
        </View>
        <View style={{ position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: 5.5, backgroundColor: '#3DCB7A', borderWidth: 2, borderColor: '#075E54' }} />
      </View>
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>AstroParihar AI</Text>
        <Text style={{ color: '#B2DFDB', fontSize: 11 }}>Online • Your 24/7 Vedic companion</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100, backgroundColor: 'rgba(201,168,76,0.2)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.4)' }}>
        <Text style={{ fontSize: 12, color: '#C9A84C' }}>♏</Text>
        <Text style={{ marginLeft: 4, color: '#C9A84C', fontSize: 11, fontWeight: '600' }}>Scorpio</Text>
      </View>
      <AppIcon name="more_vert" color="#FFFFFF" size={22} style={{ marginLeft: 4 }} />
    </View>
  );
}

/* ----------------------------------------------------- ChatTopicChipsWidget */
const TOPICS = ['All', 'Love', 'Career', 'Marriage', 'Money', 'Family', 'Spirituality', 'Health'];
function TopicChips({ selected, onSelect }: { selected: string; onSelect: (t: string) => void }) {
  return (
    <View style={{ height: 42, backgroundColor: '#EFE7DC' }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 5, alignItems: 'center' }}>
        {TOPICS.map((t) => {
          const sel = selected === t;
          return (
            <AnimatedPressable
              key={t}
              testID={`aiChat.topic.${t.toLowerCase()}`}
              onPress={() => onSelect(t)}
              duration={180}
              style={{ marginRight: 8, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 100, backgroundColor: sel ? '#075E54' : '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}
            >
              <Text style={{ color: sel ? '#FFFFFF' : '#4A5568', fontSize: 12, fontWeight: sel ? '700' : '400' }}>{t}</Text>
            </AnimatedPressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------------- ChatMessagesWidget */
function BotAvatar() {
  return (
    <View style={{ width: 28, height: 28, borderRadius: 14, marginRight: 4, marginBottom: 2, borderWidth: 1, borderColor: '#C9A84C', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      <LinearGradient colors={['#8B1A1A', '#3D0A0A']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <Text style={{ fontSize: 13 }}>🔮</Text>
    </View>
  );
}

function DateSeparator({ label }: { label: string }) {
  return (
    <View style={{ paddingVertical: 10, alignItems: 'center' }}>
      <View style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, backgroundColor: '#D1E8C7', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
        <Text style={{ color: '#4A5568', fontSize: 12, fontWeight: '500' }}>{label}</Text>
      </View>
    </View>
  );
}

function Bubble({ msg, index }: { msg: ChatMessage; index: number }) {
  const { width } = useWindowDimensions();
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(Math.min(180, Math.max(0, index * 25)), withTiming(1, { duration: 280 }));
  }, [index, p]);
  const maxW = width * 0.75;
  const anim = useAnimatedStyle(() => {
    const slide = 1 - Math.pow(1 - p.value, 3); // easeOutCubic
    const fade = 1 - (1 - p.value) * (1 - p.value); // easeOut
    return { opacity: fade, transform: [{ translateX: (1 - slide) * (msg.isUser ? 0.06 : -0.06) * width }] };
  });
  const bg = msg.isUser ? '#DCF8C6' : '#FFFFFF';
  return (
    <Animated.View style={[{ marginBottom: 4, flexDirection: 'row', alignItems: 'flex-end', justifyContent: msg.isUser ? 'flex-end' : 'flex-start' }, anim]}>
      {!msg.isUser ? <BotAvatar /> : null}
      <View style={{ maxWidth: maxW, flexShrink: 1 }}>
        <View
          style={{
            paddingLeft: 10, paddingRight: 10, paddingTop: 8, paddingBottom: 24, backgroundColor: bg,
            borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomLeftRadius: msg.isUser ? 8 : 2, borderBottomRightRadius: msg.isUser ? 2 : 8,
            shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1,
          }}
        >
          {!msg.isUser ? <Text style={{ marginBottom: 3, color: '#8B1A1A', fontSize: 12, fontWeight: '700' }}>AstroParihar AI</Text> : null}
          <Text style={{ color: '#1A1A1A', ...lh(14, 1.45) }}>{msg.text}</Text>
          <View style={{ position: 'absolute', bottom: 5, right: 8, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: msg.isUser ? '#6B8E6B' : '#8A8A8A', fontSize: 10 }}>{msg.time}</Text>
            {msg.isUser ? <AppIcon name="done_all" size={14} color="#4FC3F7" style={{ marginLeft: 3 }} /> : null}
          </View>
        </View>
        <Svg width={8} height={12} style={{ position: 'absolute', bottom: 0, ...(msg.isUser ? { right: -6 } : { left: -6 }) }}>
          <Path d={msg.isUser ? 'M0 0L8 12L0 12Z' : 'M8 0L0 12L8 12Z'} fill={bg} />
        </Svg>
      </View>
      {msg.isUser ? <View style={{ width: 4 }} /> : null}
    </Animated.View>
  );
}

function TypingIndicator() {
  const ctl = useController({ duration: 900, repeat: true, autoStart: true });
  return (
    <View style={{ paddingBottom: 8, paddingLeft: 4, flexDirection: 'row', alignItems: 'flex-end' }} testID="aiChat.typing">
      <BotAvatar />
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

function MessageRow({ msg, index }: { msg: ChatMessage; index: number }) {
  return (
    <View>
      {index === 0 ? <DateSeparator label="Today" /> : null}
      <Bubble msg={msg} index={index} />
    </View>
  );
}

/* ----------------------------------------------- ChatSuggestedPromptsWidget */
const PROMPTS = [
  { emoji: '💼', text: 'Will I change my job this year?' },
  { emoji: '💍', text: 'When is a good time for marriage?' },
  { emoji: '🪐', text: 'What does my Saturn period mean?' },
  { emoji: '📈', text: 'How can I improve my career?' },
  { emoji: '🌟', text: 'Show me my current planetary influence.' },
  { emoji: '❤️', text: 'What does my Venus placement say about love?' },
];
function SuggestedPrompts({ onPromptTap }: { onPromptTap: (s: string) => void }) {
  return (
    <View style={{ paddingHorizontal: 12, paddingTop: 8 }}>
      <Text style={{ marginBottom: 10, color: '#4A5568', fontSize: 12, fontWeight: '600', letterSpacing: 0.5 }}>Suggested Questions</Text>
      {PROMPTS.map((p, i) => (
        <Pressable
          key={p.text}
          testID={`aiChat.prompt.${i}`}
          onPress={() => onPromptTap(p.text)}
          style={{ marginBottom: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}
        >
          <Text style={{ fontSize: 16 }}>{p.emoji}</Text>
          <Text style={{ marginLeft: 12, flex: 1, color: '#1A1A1A', fontSize: 13 }}>{p.text}</Text>
          <AppIcon name="arrow_forward_ios_rounded" color="#8A8A8A" size={13} />
        </Pressable>
      ))}
    </View>
  );
}

/* ---------------------------------------------------------- ChatInputWidget */
function ChatInput({ value, onChange, onSend }: { value: string; onChange: (s: string) => void; onSend: (s: string) => void }) {
  const insets = useSafeAreaInsets();
  const hasText = value.trim().length > 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 8, paddingTop: 8, paddingBottom: insets.bottom + 90, backgroundColor: '#EFE7DC' }}>
      <View style={{ flex: 1, minHeight: 44, borderRadius: 24, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'flex-end', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
        <Pressable testID="aiChat.input.emoji" onPress={SOURCE_INERT('aiChat.input.emoji')} style={{ paddingLeft: 10, paddingBottom: 10 }}>
          <AppIcon name="emoji_emotions_outlined" color="#8A8A8A" size={24} />
        </Pressable>
        <TextInput
          testID="aiChat.input"
          value={value}
          onChangeText={onChange}
          multiline
          numberOfLines={4}
          placeholder="Message"
          placeholderTextColor="#8A8A8A"
          onSubmitEditing={() => onSend(value)}
          style={{ flex: 1, paddingHorizontal: 8, paddingVertical: 10, color: '#1A1A1A', fontSize: 15, maxHeight: 4 * 22 + 20 }}
        />
        <Pressable testID="aiChat.input.attach" onPress={SOURCE_INERT('aiChat.input.attach')} style={{ paddingRight: 4, paddingBottom: 10 }}>
          <AppIcon name="attach_file" color="#8A8A8A" size={22} />
        </Pressable>
        <Pressable testID="aiChat.input.camera" onPress={SOURCE_INERT('aiChat.input.camera')} style={{ paddingRight: 10, paddingBottom: 10 }}>
          <AppIcon name="camera_alt_outlined" color="#8A8A8A" size={22} />
        </Pressable>
      </View>
      <Pressable
        testID="aiChat.send"
        onPress={hasText ? () => onSend(value) : undefined}
        style={{ marginLeft: 8, width: 48, height: 48, borderRadius: 24, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center', shadowColor: '#25D366', shadowOpacity: 0.31, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 }}
      >
        {hasText ? <AppIcon name="send_rounded" color="#FFFFFF" size={22} /> : <AppIcon name="mic" color="#FFFFFF" size={24} />}
      </Pressable>
    </View>
  );
}

/* ------------------------------------------------------------------ screen */
export default function AiChatScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>(() => INITIAL_MESSAGES.map((m) => ({ ...m })));
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('All');
  const scrollRef = useRef<ScrollView>(null);
  const listRef = useRef<FlatList<ChatMessage | 'typing'>>(null);
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
      listRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const sendMessage = (text: string) => {
    if (text.trim().length === 0) return;
    setMessages((m) => [...m, { isUser: true, text: text.trim(), time: currentTime() }]);
    setIsTyping(true);
    setInput('');
    scrollToBottom();
    setTimeout(() => {
      if (!mounted.current) return;
      setIsTyping(false);
      setMessages((m) => [...m, { isUser: false, text: getAiResponse(text), time: currentTime() }]);
      scrollToBottom();
    }, TYPING_DELAY_MS);
  };

  const showSuggested = messages.length <= 1;
  const listData: Array<ChatMessage | 'typing'> = isTyping ? [...messages, 'typing'] : messages;

  return (
    <View style={{ flex: 1, backgroundColor: '#EFE7DC' }} testID="aiChat.screen">
      <WhatsAppBackground />
      <KeyboardAvoidingView style={{ flex: 1, paddingTop: insets.top }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <AiChatHeader />
        <TopicChips selected={selectedTopic} onSelect={setSelectedTopic} />
        <View style={{ flex: 1 }}>
          {showSuggested ? (
            <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled">
              <View style={{ paddingHorizontal: 10, paddingVertical: 8 }}>
                {messages.map((m, i) => <MessageRow key={i} msg={m} index={i} />)}
                {isTyping ? <TypingIndicator /> : null}
              </View>
              <SuggestedPrompts onPromptTap={sendMessage} />
              <View style={{ height: 20 }} />
            </ScrollView>
          ) : (
            <FlatList
              ref={listRef}
              data={listData}
              keyExtractor={(item, i) => (item === 'typing' ? 'typing' : String(i))}
              contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 8 }}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item, index }) => (item === 'typing' ? <TypingIndicator /> : <MessageRow msg={item} index={index} />)}
            />
          )}
        </View>
        <ChatInput value={input} onChange={setInput} onSend={sendMessage} />
      </KeyboardAvoidingView>
    </View>
  );
}
