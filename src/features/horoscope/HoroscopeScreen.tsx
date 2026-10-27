/**
 * Port of lib/presentation/horoscope_screen/horoscope_screen.dart
 * - content fade 350 ms easeOut; changing zodiac/date reverses the fade, swaps state, fades back in
 * - only Aries/Taurus/Gemini have data in source; all other signs fall back to Aries data (parity)
 * - date offset clamps to [-1, 1]; only the formatted date changes (data is not date-dependent in source)
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable, AnimatedText } from '@/components/AnimatedBox';
import { AppIcon } from '@/components/AppIcon';
import { LinearProgress, RadialGlow } from '@/components/common';
import { lh, Text } from '@/components/Text';
import { AppRoutes, pop, push } from '@/navigation/routes';
import { argb, withAlpha } from '@/theme/colors';
import { useThemeColors } from '@/theme/themeStore';
import { fetchLiveHoroscopes } from '@/services/astrologyService';

export const ZODIACS = [
  { sign: 'Aries', symbol: '♈', emoji: '🐏', dates: 'Mar 21 – Apr 19', element: 'Fire' },
  { sign: 'Taurus', symbol: '♉', emoji: '🐂', dates: 'Apr 20 – May 20', element: 'Earth' },
  { sign: 'Gemini', symbol: '♊', emoji: '👯', dates: 'May 21 – Jun 20', element: 'Air' },
  { sign: 'Cancer', symbol: '♋', emoji: '🦀', dates: 'Jun 21 – Jul 22', element: 'Water' },
  { sign: 'Leo', symbol: '♌', emoji: '🦁', dates: 'Jul 23 – Aug 22', element: 'Fire' },
  { sign: 'Virgo', symbol: '♍', emoji: '👩‍🌾', dates: 'Aug 23 – Sep 22', element: 'Earth' },
  { sign: 'Libra', symbol: '♎', emoji: '⚖️', dates: 'Sep 23 – Oct 22', element: 'Air' },
  { sign: 'Scorpio', symbol: '♏', emoji: '🦂', dates: 'Oct 23 – Nov 21', element: 'Water' },
  { sign: 'Sagittarius', symbol: '♐', emoji: '🏹', dates: 'Nov 22 – Dec 21', element: 'Fire' },
  { sign: 'Capricorn', symbol: '♑', emoji: '🐐', dates: 'Dec 22 – Jan 19', element: 'Earth' },
  { sign: 'Aquarius', symbol: '♒', emoji: '🏺', dates: 'Jan 20 – Feb 18', element: 'Air' },
  { sign: 'Pisces', symbol: '♓', emoji: '🐟', dates: 'Feb 19 – Mar 20', element: 'Water' },
];

type Cat = { score: number; text: string };
type HoroscopeData = { overall: number; lucky_number: string; lucky_color: string; lucky_day: string; guidance: string; love: Cat; career: Cat; money: Cat; health: Cat; family: Cat };

const DATA: Record<string, HoroscopeData> = {
  Aries: {
    overall: 87, lucky_number: '3, 9', lucky_color: 'Crimson Red', lucky_day: 'Tuesday',
    guidance: "Mars energises your chart today, bringing bold momentum. Trust your instincts and take decisive action. A long-pending decision finds clarity under today's cosmic alignment. Your natural leadership shines — others look to you for direction.",
    love: { score: 82, text: "Venus favours heartfelt conversations. Express what you've been holding back — your partner is receptive. Singles may encounter a meaningful connection through a social gathering." },
    career: { score: 91, text: 'A powerful day for professional advancement. Your ideas are well-received by authority figures. Push forward on that proposal — the stars align for recognition and reward.' },
    money: { score: 78, text: 'Financial intuition is sharp. Avoid impulsive purchases but consider a calculated investment. A pending payment or reimbursement may arrive sooner than expected.' },
    health: { score: 85, text: 'Energy levels are high. Channel this vitality into physical activity. Watch for minor headaches — stay hydrated and take short breaks during intense work.' },
    family: { score: 80, text: "Family bonds strengthen today. An elder's advice proves invaluable. Make time for a shared meal or conversation — it deepens roots and brings peace." },
  },
  Taurus: {
    overall: 79, lucky_number: '6, 15', lucky_color: 'Emerald Green', lucky_day: 'Friday',
    guidance: 'Venus, your ruling planet, graces your second house today, amplifying material and emotional security. Patience is your greatest virtue now. Slow and steady progress yields lasting results. Trust the process unfolding before you.',
    love: { score: 88, text: 'Deep emotional connection is highlighted. Long-term relationships grow stronger through shared values. Singles drawn to stability may find a grounded, dependable partner entering their orbit.' },
    career: { score: 75, text: "Steady progress over dramatic leaps. Focus on quality work and building reliable systems. A colleague's support proves more valuable than you anticipated." },
    money: { score: 84, text: 'Financial stability is your focus. Review long-term investments and savings plans. A practical financial decision made today bears fruit over the coming months.' },
    health: { score: 76, text: 'Throat and neck areas need attention. Gentle stretching and warm herbal teas support your wellbeing. Avoid overindulgence in rich foods today.' },
    family: { score: 90, text: 'Home and family are your sanctuary today. Domestic harmony prevails. Consider planning a family gathering or home improvement project that everyone can enjoy.' },
  },
  Gemini: {
    overall: 83, lucky_number: '5, 14', lucky_color: 'Bright Yellow', lucky_day: 'Wednesday',
    guidance: 'Mercury sharpens your intellect and communication today. Your words carry unusual power — use them wisely. Multiple opportunities present themselves simultaneously; discernment is key. Choose depth over breadth.',
    love: { score: 79, text: 'Witty exchanges and intellectual connection spark romance. Share your thoughts openly — your partner appreciates your mind. Singles may connect with someone through a shared interest or learning environment.' },
    career: { score: 88, text: 'Communication and networking are your superpowers today. A conversation leads to an unexpected opportunity. Writing, presenting, or teaching activities yield excellent results.' },
    money: { score: 72, text: 'Multiple income streams are on your mind. Research before committing to any new financial venture. Avoid scattering resources — focus on one solid opportunity.' },
    health: { score: 80, text: 'Mental agility is high but physical rest is needed. Balance stimulating activities with quiet time. Breathing exercises calm an overactive mind and restore equilibrium.' },
    family: { score: 77, text: 'Siblings or cousins play a meaningful role today. A family communication that was delayed finally moves forward. Share news and updates — connection is nourishing.' },
  },
};

const CATEGORIES = [
  { key: 'love', label: 'Love', emoji: '💕', color: '#E91E8C' },
  { key: 'career', label: 'Career', emoji: '💼', color: '#4FC3F7' },
  { key: 'money', label: 'Money', emoji: '💰', color: '#2D9E6B' },
  { key: 'health', label: 'Health', emoji: '🌿', color: '#66BB6A' },
  { key: 'family', label: 'Family', emoji: '🏠', color: '#FFB347' },
] as const;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function CategoryCard({ emoji, label, score, text, color }: { emoji: string; label: string; score: number; text: string; color: string }) {
  const [expanded, setExpanded] = useState(false);
  const colors = useThemeColors();
  return (
    <Pressable
      testID={`horoscope.category.${label.toLowerCase()}`}
      onPress={() => setExpanded((e) => !e)}
      style={{
        marginBottom: 10,
        padding: 16,
        borderRadius: 16,
        backgroundColor: colors.isLight ? '#FFFFFF' : argb('0FFFFFFF'),
        borderWidth: 1.5,
        borderColor: colors.isLight ? 'rgba(201,168,76,0.35)' : argb('1AC9A84C'),
        shadowColor: colors.isLight ? '#C9A84C' : '#000',
        shadowOpacity: colors.isLight ? 0.06 : 0.2,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: withAlpha(color, 25), borderWidth: 1, borderColor: withAlpha(color, 60), alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18 }}>{emoji}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 4 }}>{label}</Text>
          <LinearProgress value={score / 100} height={5} radius={4} color={color} backgroundColor={colors.isLight ? '#F0EBE0' : argb('1AFFFFFF')} />
        </View>
        <Text style={{ marginLeft: 12, color, fontSize: 16, fontWeight: '800' }}>{`${score}%`}</Text>
        <AppIcon name={expanded ? 'keyboard_arrow_up_rounded' : 'keyboard_arrow_down_rounded'} color={colors.isLight ? '#713B32' : '#6B7A99'} size={20} style={{ marginLeft: 8 }} />
      </View>
      {expanded ? (
        <>
          <View style={{ marginVertical: 12, height: 1, backgroundColor: colors.isLight ? '#EAE5DB' : argb('1AC9A84C') }} />
          <Text style={{ color: colors.isLight ? '#383852' : '#A0A8C0', ...lh(13, 1.6) }}>{text}</Text>
        </>
      ) : null}
    </Pressable>
  );
}

function LuckyItem({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  const colors = useThemeColors();
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
      <Text style={{ marginTop: 6, textAlign: 'center', color: colors.textPrimary, fontSize: 12, fontWeight: '700' }}>{value}</Text>
      <Text style={{ marginTop: 2, color: colors.isLight ? '#5A6A85' : '#6B7A99', fontSize: 10 }}>{label}</Text>
    </View>
  );
}

export default function HoroscopeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const [dateOffset, setDateOffset] = useState(0);
  const [zodiac, setZodiac] = useState('Aries');
  const [liveData, setLiveData] = useState<Record<string, HoroscopeData>>({});
  const fade = useSharedValue(0);
  const pending = useRef<(() => void) | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchLiveHoroscopes().then((res) => {
      if (res && Object.keys(res).length > 0 && isMounted) {
        setLiveData(res as Record<string, HoroscopeData>);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  useEffect(() => { fade.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) }); }, [fade]);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  const applyPending = () => {
    pending.current?.();
    pending.current = null;
    fade.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) });
  };
  const transition = (update: () => void) => {
    pending.current = update;
    fade.value = withTiming(0, { duration: 350 * fade.value, easing: Easing.out(Easing.quad) }, (f) => { if (f) runOnJS(applyPending)(); });
  };
  const changeDate = (offset: number) => {
    if (dateOffset + offset < -1 || dateOffset + offset > 1) return;
    transition(() => setDateOffset((d) => d + offset));
  };
  const changeZodiac = (sign: string) => transition(() => setZodiac(sign));

  const info = ZODIACS.find((z) => z.sign === zodiac)!;
  const data = liveData[zodiac] ?? DATA[zodiac] ?? DATA.Aries;
  const d = new Date();
  d.setDate(d.getDate() + dateOffset);
  const formattedDate = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }} testID="horoscope.screen">
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}>
        <Pressable
          testID="horoscope.back"
          onPress={pop}
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: colors.isLight ? '#FFFFFF' : argb('0FFFFFFF'),
            borderWidth: 1.5,
            borderColor: colors.isLight ? 'rgba(201,168,76,0.38)' : argb('1AC9A84C'),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppIcon name="arrow_back_ios_new_rounded" color={colors.textPrimary} size={18} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '800' }}>Daily Horoscope</Text>
          <Text style={{ color: colors.isLight ? '#5A6A85' : '#6B7A99', fontSize: 12 }}>Personalised cosmic guidance</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, backgroundColor: colors.isLight ? '#FFF8EE' : argb('1AC9A84C'), borderWidth: 1, borderColor: colors.goldAccent }}>
          <Text style={{ fontSize: 12 }}>✨</Text>
          <Text style={{ marginLeft: 4, color: colors.isLight ? '#7C5205' : '#C9A84C', fontSize: 11, fontWeight: '700' }}>Vedic</Text>
        </View>
      </View>

      <Animated.View style={[{ flex: 1 }, fadeStyle]}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Math.max(160, insets.bottom + 110) }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height: 80, marginTop: 12 }} contentContainerStyle={{ gap: 10 }}>
            {ZODIACS.map((z) => {
              const sel = zodiac === z.sign;
              return (
                <AnimatedPressable
                  key={z.sign}
                  testID={`horoscope.zodiac.${z.sign.toLowerCase()}`}
                  onPress={() => changeZodiac(z.sign)}
                  duration={200}
                  style={{
                    width: 64,
                    height: 80,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: sel ? (colors.isLight ? '#713B32' : argb('33C9A84C')) : (colors.isLight ? '#FFFFFF' : argb('0FFFFFFF')),
                    borderColor: sel ? (colors.isLight ? '#713B32' : '#C9A84C') : (colors.isLight ? 'rgba(201,168,76,0.35)' : argb('1AC9A84C')),
                    borderWidth: sel ? 1.5 : 1,
                    shadowColor: colors.isLight ? '#C9A84C' : '#000',
                    shadowOpacity: colors.isLight ? 0.06 : 0,
                    shadowRadius: 4,
                    elevation: 1,
                  }}
                >
                  <Text style={{ fontSize: 22, color: sel ? '#FFFFFF' : (colors.isLight ? '#7C5205' : '#A0A8C0') }}>{z.symbol}</Text>
                  <Text numberOfLines={1} style={{ marginTop: 4, color: sel ? '#FFFFFF' : (colors.isLight ? '#5A6A85' : '#6B7A99'), fontSize: 9, fontWeight: '700' }}>{z.sign}</Text>
                </AnimatedPressable>
              );
            })}
          </ScrollView>

          <View
            style={{
              marginTop: 18,
              padding: 4,
              borderRadius: 16,
              backgroundColor: colors.isLight ? '#FFFFFF' : argb('0FFFFFFF'),
              borderWidth: 1.5,
              borderColor: colors.isLight ? 'rgba(201,168,76,0.35)' : argb('1AC9A84C'),
              flexDirection: 'row',
              shadowColor: colors.isLight ? '#C9A84C' : '#000',
              shadowOpacity: colors.isLight ? 0.05 : 0,
              shadowRadius: 4,
              elevation: 1,
            }}
          >
            {[
              { label: 'Yesterday', active: dateOffset === -1, delta: -1 - dateOffset },
              { label: 'Today', active: dateOffset === 0, delta: -dateOffset },
              { label: 'Tomorrow', active: dateOffset === 1, delta: 1 - dateOffset },
            ].map((b) => (
              <AnimatedPressable
                key={b.label}
                testID={`horoscope.date.${b.label.toLowerCase()}`}
                onPress={() => changeDate(b.delta)}
                duration={200}
                style={{
                  paddingVertical: 10,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: b.active ? '#713B32' : 'transparent',
                }}
              >
                <AnimatedText style={{ color: b.active ? '#FFFFFF' : (colors.isLight ? '#5A6A85' : '#6B7A99'), fontSize: 13, fontWeight: b.active ? '700' : '600' }}>{b.label}</AnimatedText>
              </AnimatedPressable>
            )).map((el, i) => <View key={i} style={{ flex: 1 }}>{el}</View>)}
          </View>

          <LinearGradient
            colors={
              colors.isLight
                ? ['#FFFDF9', '#F9F5EC']
                : [argb('1AC9A84C'), argb('0A713B32')]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              marginTop: 18,
              padding: 20,
              borderRadius: 20,
              borderWidth: 1.5,
              borderColor: colors.isLight ? 'rgba(201,168,76,0.38)' : argb('33C9A84C'),
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.isLight ? '#FFFFFF' : undefined,
              shadowColor: colors.isLight ? '#C9A84C' : '#000',
              shadowOpacity: colors.isLight ? 0.08 : 0.2,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                borderWidth: 1.5,
                borderColor: colors.isLight ? 'rgba(201,168,76,0.45)' : argb('66C9A84C'),
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.isLight ? '#FFF8EE' : undefined,
              }}
            >
              <RadialGlow colors={colors.isLight ? ['#FFF8EE', '#F5EBE1'] : [argb('33C9A84C'), argb('0AC9A84C')]} />
              <Text style={{ fontSize: 32, color: colors.isLight ? '#7C5205' : '#C9A84C' }}>{info.symbol}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '800' }}>{zodiac}</Text>
                <View style={{ marginLeft: 8, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100, backgroundColor: colors.isLight ? '#DCFCE7' : argb('1A2D9E6B'), borderWidth: 1, borderColor: colors.isLight ? '#86EFAC' : argb('332D9E6B') }}>
                  <Text style={{ color: colors.isLight ? '#15803D' : '#2D9E6B', fontSize: 10, fontWeight: '700' }}>{info.element}</Text>
                </View>
              </View>
              <Text style={{ marginTop: 2, color: colors.isLight ? '#5A6A85' : '#6B7A99', fontSize: 12 }}>{info.dates}</Text>
              <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: colors.isLight ? '#713B32' : '#C9A84C', fontSize: 28, fontWeight: '800' }}>{`${data.overall}%`}</Text>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ color: colors.isLight ? '#5A6A85' : '#6B7A99', fontSize: 10, marginBottom: 4, fontWeight: '600' }}>Overall Score</Text>
                  <LinearProgress value={data.overall / 100} height={6} radius={4} color={colors.isLight ? '#713B32' : '#C9A84C'} backgroundColor={colors.isLight ? '#F0EBE0' : argb('1AC9A84C')} />
                </View>
              </View>
              <Text style={{ marginTop: 6, color: colors.isLight ? '#5A6A85' : '#6B7A99', fontSize: 11, fontWeight: '600' }} testID="horoscope.formattedDate">{formattedDate}</Text>
            </View>
          </LinearGradient>

          <View
            style={{
              marginTop: 16,
              padding: 18,
              borderRadius: 18,
              backgroundColor: colors.isLight ? '#FFFFFF' : argb('0FFFFFFF'),
              borderWidth: 1.5,
              borderColor: colors.isLight ? 'rgba(201,168,76,0.35)' : argb('1AC9A84C'),
              shadowColor: colors.isLight ? '#C9A84C' : '#000',
              shadowOpacity: colors.isLight ? 0.06 : 0.2,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 16 }}>🌟</Text>
              <Text style={{ marginLeft: 8, color: colors.isLight ? '#7C5205' : '#C9A84C', fontSize: 15, fontWeight: '700' }}>Daily Guidance</Text>
            </View>
            <Text style={{ marginTop: 10, color: colors.textPrimary, ...lh(13, 1.6) }}>{data.guidance}</Text>
          </View>

          <View style={{ marginTop: 16 }}>
            {CATEGORIES.map((c) => (
              <CategoryCard key={`${zodiac}-${c.key}`} emoji={c.emoji} label={c.label} score={data[c.key].score} text={data[c.key].text} color={c.color} />
            ))}
          </View>

          <View
            style={{
              marginTop: 16,
              padding: 18,
              borderRadius: 18,
              backgroundColor: colors.isLight ? '#FFFFFF' : argb('0FFFFFFF'),
              borderWidth: 1.5,
              borderColor: colors.isLight ? 'rgba(201,168,76,0.35)' : argb('1AC9A84C'),
              shadowColor: colors.isLight ? '#C9A84C' : '#000',
              shadowOpacity: colors.isLight ? 0.06 : 0.2,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 16 }}>🍀</Text>
              <Text style={{ marginLeft: 8, color: colors.isLight ? '#7C5205' : '#C9A84C', fontSize: 15, fontWeight: '700' }}>Lucky Details</Text>
            </View>
            <View style={{ marginTop: 14, flexDirection: 'row' }}>
              <LuckyItem label="Number" value={data.lucky_number} emoji="🔢" />
              <LuckyItem label="Colour" value={data.lucky_color} emoji="🎨" />
              <LuckyItem label="Day" value={data.lucky_day} emoji="📅" />
            </View>
          </View>

          <LinearGradient
            colors={
              colors.isLight
                ? ['#FFFDF9', '#F9F5EC']
                : [argb('33713B32'), argb('1AC9A84C')]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              marginTop: 16,
              padding: 18,
              borderRadius: 18,
              borderWidth: 1.5,
              borderColor: colors.isLight ? 'rgba(201,168,76,0.38)' : argb('33C9A84C'),
              alignItems: 'center',
              backgroundColor: colors.isLight ? '#FFFFFF' : undefined,
              shadowColor: colors.isLight ? '#C9A84C' : '#000',
              shadowOpacity: colors.isLight ? 0.08 : 0.2,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '800' }}>🔮 Want deeper insights?</Text>
            <Text style={{ marginTop: 6, textAlign: 'center', color: colors.isLight ? '#5A6A85' : '#6B7A99', ...lh(12, 1.5) }}>Ask AstroParihar AI for personalised guidance based on your birth chart</Text>
            <View style={{ marginTop: 14, flexDirection: 'row', alignSelf: 'stretch' }}>
              <Pressable
                testID="horoscope.askAi"
                onPress={() => {
                  push(AppRoutes.aiChatScreen, {
                    astrologerId: 'vedika',
                    initialPrompt: `Namaste Vedika, according to today's Vedic horoscope for ${zodiac} (${formattedDate}), my overall score is ${data.overall}%. What cosmic remedies or advice do you have for my love life, career, and spiritual progress today?`
                  });
                }}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#713B32', alignItems: 'center' }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>✨ Ask AI Astrologer</Text>
              </Pressable>
              <View style={{ width: 10 }} />
              <Pressable
                testID="horoscope.talkToAstrologer"
                onPress={() => push(AppRoutes.liveAstrologersScreen)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: colors.isLight ? '#FFFFFF' : argb('0FFFFFFF'),
                  borderWidth: 1.5,
                  borderColor: colors.isLight ? 'rgba(201,168,76,0.45)' : argb('33C9A84C'),
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: colors.isLight ? '#7C5205' : '#C9A84C', fontSize: 13, fontWeight: '700' }}>📞 Talk to Astrologer</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}
