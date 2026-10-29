/**
 * Port of lib/presentation/service_detail_screens/service_detail_screens.dart
 * 9 separately-routed screens sharing _ServiceHeroCard, _SectionTitle, _InfoCard, _ConsultCTABar, _AstrologerMiniCard.
 * - Consult bar: "Chat Now" / "Consult Now" → push(/live-astrologers-screen) (source)
 * - Tarot: tap Major Arcana card toggles selection (AnimatedContainer 200 ms) + upright/reversed text
 * - Numerology: Life Path from DOB digits (needs ≥ 8 digits), Destiny from Pythagorean letter values,
 *   master numbers 11/22/33 preserved; no validation messages in source
 * - Muhurat: static content (no calculation in source)
 * SOURCE_INERT: "Get Report" buttons on Astrology Reports.
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/features/auth/authStore';
import { AnimatedPressable } from '@/components/AnimatedBox';
import { AppBar } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { AppImage } from '@/components/AppImage';
import { ElevatedButton, OutlinedButton } from '@/components/common';
import { lh, Text, TextInput } from '@/components/Text';
import { AppRoutes, pop, push } from '@/navigation/routes';
import { AppColors, withAlpha } from '@/theme/colors';
import { useTranslation } from '@/theme/languageStore';
import { useThemeColors } from '@/theme/themeStore';

/* ------------------------------------------------------------- shared */
function ServiceHeroCard({ title, subtitle, imageUrl, semanticLabel, accent, icon }: { title: string; subtitle: string; imageUrl: string; semanticLabel: string; accent: string; icon: string }) {
  const { t } = useTranslation();
  return (
    <View style={{ marginHorizontal: 16, marginBottom: 20, height: 200, borderRadius: 24, borderWidth: 1, borderColor: withAlpha(accent, 80), overflow: 'hidden' }}>
      <AppImage uri={imageUrl} semanticLabel={semanticLabel} width="100%" height="100%" fit="cover" />
      <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.784)']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <View style={{ position: 'absolute', left: 20, right: 20, bottom: 20, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ padding: 8, borderRadius: 10, backgroundColor: withAlpha(accent, 40), borderWidth: 1, borderColor: withAlpha(accent, 80) }}>
          <AppIcon name={icon} color={accent} size={20} />
        </View>
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '800' }}>{t(title, title)}</Text>
          <Text style={{ color: accent, fontSize: 12, fontWeight: '500' }}>{t(subtitle, subtitle)}</Text>
        </View>
      </View>
    </View>
  );
}
function Intro({ children }: { children: string }) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  return <Text style={{ paddingHorizontal: 16, color: colors.textSecondary, ...lh(13, 1.7) }}>{t(children, children)}</Text>;
}
function SectionTitle({ title, accent }: { title: string; accent: string }) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 3, height: 18, borderRadius: 2, backgroundColor: accent }} />
      <Text style={{ marginLeft: 10, color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>{t(title, title)}</Text>
    </View>
  );
}
function InfoCard({ icon, title, description, accent }: { icon: string; title: string; description: string; accent: string }) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  return (
    <View style={{ marginHorizontal: 16, marginBottom: 10, padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder, flexDirection: 'row', alignItems: 'flex-start' }}>
      <View style={{ padding: 10, borderRadius: 12, backgroundColor: withAlpha(accent, colors.isLight ? 25 : 20) }}>
        <AppIcon name={icon} color={accent} size={20} />
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>{t(title, title)}</Text>
        <Text style={{ marginTop: 4, color: colors.textSecondary, ...lh(12, 1.5) }}>{t(description, description)}</Text>
      </View>
    </View>
  );
}
function ConsultCTABar({ testIDPrefix }: { testIDPrefix: string }) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { t } = useTranslation();
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: Math.max(24, insets.bottom + 8), backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.cardBorder, flexDirection: 'row' }}>
      <OutlinedButton testID={`${testIDPrefix}.chatNow`} label={t('Chat Now', 'Chat Now')} icon="chat_bubble_outline_rounded" color={colors.goldAccent} borderColor={colors.goldAccent} onPress={() => push(AppRoutes.liveAstrologersScreen)} style={{ flex: 1 }} />
      <View style={{ width: 12 }} />
      <ElevatedButton testID={`${testIDPrefix}.consultNow`} label={t('Consult Now', 'Consult Now')} icon="call_rounded" bg="#713B32" fg="#FFFFFF" onPress={() => push(AppRoutes.liveAstrologersScreen)} radius={100} paddingV={14} paddingH={8} fontSize={14} style={{ flex: 1 }} />
    </View>
  );
}
type Mini = { name: string; specialty: string; imageUrl: string; rating: number; price: number };
function AstrologerRow({ items, accent }: { items: Mini[]; accent: string }) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height: 180 }} contentContainerStyle={{ paddingHorizontal: 16 }}>
      {items.map((a) => (
        <View key={a.name} style={{ width: 160, marginRight: 12, padding: 14, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', alignSelf: 'flex-start' }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: withAlpha(accent, 100), overflow: 'hidden' }}>
            <AppImage uri={a.imageUrl} semanticLabel={`Astrologer ${a.name} profile photo`} width="100%" height="100%" fit="cover" />
          </View>
          <Text numberOfLines={1} style={{ marginTop: 8, color: colors.textPrimary, fontSize: 12, fontWeight: '600', textAlign: 'center' }}>{t(a.name, a.name)}</Text>
          <Text numberOfLines={1} style={{ marginTop: 2, color: colors.textMuted, fontSize: 10, textAlign: 'center' }}>{t(a.specialty, a.specialty)}</Text>
          <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center' }}>
            <AppIcon name="star_rounded" color={colors.goldAccent} size={12} />
            <Text style={{ marginLeft: 2, color: colors.goldAccent, fontSize: 11, fontWeight: '600' }}>{String(a.rating)}</Text>
          </View>
          <Text style={{ marginTop: 6, color: accent, fontSize: 11, fontWeight: '700' }}>{`₹${a.price}/min`}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
function ServiceLayout({ title, testID, children }: { title: string; testID: string; children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID={`${testID}.screen`}>
      <AppBar title={t(title, title)} onBack={pop} testIDPrefix={testID} backSize={24} backgroundColor={colors.background} backColor={colors.textPrimary} />
      <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
        {children}
        <View style={{ height: Math.max(140, insets.bottom + 85) }} />
      </ScrollView>
      <ConsultCTABar testIDPrefix={testID} />
    </View>
  );
}
function HScroll({ height, children }: { height: number; children: React.ReactNode }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height }} contentContainerStyle={{ paddingHorizontal: 16 }}>{children}</ScrollView>;
}

// Verified high-speed Unsplash CDN image helper
const P = (photoId: string) => `https://images.unsplash.com/${photoId}?w=800&auto=format&fit=crop`;

/* ------------------------------------------------------------- Career */
export function CareerAstrologyScreen() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const a = '#FFD700';
  return (
    <ServiceLayout title="Career Astrology" testID="careerAstrology">
      <ServiceHeroCard title="Career Astrology" subtitle="Unlock your professional destiny" imageUrl="https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop" semanticLabel="Professional office setting with charts and career planning documents on a desk" accent={a} icon="work_outline_rounded" />
      <Intro>Your birth chart holds the blueprint of your professional life. Vedic astrology reveals the most favourable career paths, promotion timings, and business opportunities aligned with your planetary positions.</Intro>
      <SectionTitle title="What We Analyse" accent={a} />
      <InfoCard icon="trending_up_rounded" title="Career Path & Profession" description="Identify the most suitable career fields based on your 10th house lord, Saturn, and Sun placements." accent={a} />
      <InfoCard icon="schedule_rounded" title="Promotion & Growth Timing" description="Pinpoint the exact Dasha and transit periods when career advancement is most likely to occur." accent={a} />
      <InfoCard icon="business_center_rounded" title="Job vs Business" description="Determine whether employment or entrepreneurship is written in your stars for maximum success." accent={a} />
      <InfoCard icon="swap_horiz_rounded" title="Career Change Analysis" description="Evaluate the planetary support for switching careers and identify the best timing for transitions." accent={a} />
      <SectionTitle title="Career Insights" accent={a} />
      <HScroll height={90}>
        {[['Saturn', 'Career Karaka', 'circle_outlined'], ['10th House', 'Profession House', 'home_work_outlined'], ['Sun', 'Authority & Status', 'wb_sunny_outlined'], ['Mercury', 'Business & Trade', 'swap_horiz_rounded']].map(([p, r, i]) => (
          <View key={p} style={{ width: 110, height: 90, marginRight: 10, padding: 12, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' }}>
            <AppIcon name={i} color={a} size={20} />
            <Text style={{ marginTop: 4, color: colors.textPrimary, fontSize: 12, fontWeight: '600' }}>{t(p, p)}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 10, textAlign: 'center' }}>{t(r, r)}</Text>
          </View>
        ))}
      </HScroll>
      <SectionTitle title="Expert Astrologers" accent={a} />
      <AstrologerRow accent={a} items={[
        { name: 'Pt. Rajesh Sharma', specialty: 'Career & Finance', imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop', rating: 4.9, price: 35 },
        { name: 'Dr. Meena Iyer', specialty: 'Vedic Career', imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop', rating: 4.8, price: 42 },
        { name: 'Acharya Vikram', specialty: 'Job & Business', imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop', rating: 4.95, price: 55 },
      ]} />
    </ServiceLayout>
  );
}

/* ------------------------------------------------------------- Marriage */
export function MarriageAstrologyScreen() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const a = '#FF6B6B';
  const [w, setW] = useState(0);
  const cell = w > 0 ? (w - 24) / 4 : 0;
  const aspects = [['Varna', 1, '#9370DB'], ['Vashya', 2, '#FF6B6B'], ['Tara', 3, '#FFB347'], ['Yoni', 4, '#4FC3F7'], ['Graha Maitri', 5, '#81C784'], ['Gana', 6, '#FFD700'], ['Bhakoot', 7, '#FF6B6B'], ['Nadi', 8, '#9370DB']] as const;
  return (
    <ServiceLayout title="Marriage Astrology" testID="marriageAstrology">
      <ServiceHeroCard title="Marriage Astrology" subtitle="Find your destined life partner" imageUrl="https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&auto=format&fit=crop" semanticLabel="Indian couple in traditional wedding attire with floral decorations and warm golden lighting" accent={a} icon="favorite_rounded" />
      <Intro>Marriage is one of the most significant events in life. Vedic astrology provides deep insights into marriage timing, partner characteristics, compatibility, and the strength of your marital bond through the 7th house and Venus analysis.</Intro>
      <SectionTitle title="Marriage Analysis" accent={a} />
      <InfoCard icon="schedule_rounded" title="Marriage Timing" description="Determine the most auspicious period for marriage based on Venus Dasha, 7th house transits, and Navamsa chart analysis." accent={a} />
      <InfoCard icon="people_rounded" title="Partner Characteristics" description="Understand the nature, appearance, and qualities of your future spouse through 7th house lord and Venus placement." accent={a} />
      <InfoCard icon="favorite_border_rounded" title="Kundli Milan (36 Gunas)" description="Complete compatibility matching using traditional Ashtakoot system covering all 8 aspects of marital harmony." accent={a} />
      <InfoCard icon="warning_amber_rounded" title="Mangal Dosha Analysis" description="Identify and assess Mangal Dosha, its severity, and effective remedies to ensure a harmonious marriage." accent={a} />
      <SectionTitle title="Compatibility Score" accent={a} />
      <View style={{ paddingHorizontal: 16 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
          {cell > 0 && aspects.map(([n, m, c], i) => (
            <View key={i} style={{ width: cell, height: cell, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: withAlpha(c, colors.isLight ? 50 : 60), alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: c, fontSize: 18, fontWeight: '800' }}>{String(m)}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 9, textAlign: 'center' }}>{t(n, n)}</Text>
            </View>
          ))}
        </View>
      </View>
      <SectionTitle title="Expert Astrologers" accent={a} />
      <AstrologerRow accent={a} items={[
        { name: 'Jyotishi Priya', specialty: 'Marriage & Love', imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop', rating: 4.97, price: 40 },
        { name: 'Pt. Suresh Joshi', specialty: 'Kundli Milan', imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop', rating: 4.88, price: 38 },
        { name: 'Acharya Devi', specialty: 'Relationship', imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop', rating: 4.92, price: 45 },
      ]} />
    </ServiceLayout>
  );
}

/* ------------------------------------------------------------- Business */
export function BusinessAstrologyScreen() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const a = '#4FC3F7';
  const sectors = [['Mercury', 'IT & Communication', '#4FC3F7'], ['Venus', 'Fashion & Beauty', '#FF6B6B'], ['Mars', 'Real Estate', '#FF6B35'], ['Jupiter', 'Education & Law', '#FFD700'], ['Saturn', 'Manufacturing', '#9370DB'], ['Sun', 'Government & Politics', '#FFB347']];
  return (
    <ServiceLayout title="Business Astrology" testID="businessAstrology">
      <ServiceHeroCard title="Business Astrology" subtitle="Align your enterprise with the cosmos" imageUrl="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop" semanticLabel="Business team meeting around a conference table with charts and graphs on screens" accent={a} icon="business_center_rounded" />
      <Intro>Every successful business has cosmic timing. Vedic astrology helps entrepreneurs identify the best time to launch, expand, or pivot their business, choose the right partners, and navigate challenging periods with confidence.</Intro>
      <SectionTitle title="Business Insights" accent={a} />
      <InfoCard icon="rocket_launch_rounded" title="Business Launch Timing" description="Identify the most auspicious Muhurat for launching your business, signing contracts, or opening new ventures." accent={a} />
      <InfoCard icon="handshake_rounded" title="Partnership Compatibility" description="Analyse the compatibility between business partners using Synastry and composite chart techniques." accent={a} />
      <InfoCard icon="trending_up_rounded" title="Growth & Expansion Periods" description="Identify Jupiter and Venus transits that signal the best windows for business expansion and investment." accent={a} />
      <InfoCard icon="shield_rounded" title="Risk & Challenge Periods" description="Foresee Saturn and Rahu transits that may bring obstacles, and prepare strategic remedies in advance." accent={a} />
      <SectionTitle title="Business Sectors by Planet" accent={a} />
      <HScroll height={80}>
        {sectors.map(([p, s, c]) => (
          <View key={p} style={{ width: 130, height: 80, marginRight: 10, padding: 12, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: withAlpha(c, colors.isLight ? 50 : 60), justifyContent: 'center' }}>
            <Text style={{ color: c, fontSize: 12, fontWeight: '700' }}>{t(p, p)}</Text>
            <Text style={{ marginTop: 2, color: colors.textSecondary, fontSize: 11 }}>{t(s, s)}</Text>
          </View>
        ))}
      </HScroll>
      <SectionTitle title="Expert Astrologers" accent={a} />
      <AstrologerRow accent={a} items={[
        { name: 'Acharya Kapil', specialty: 'Business & Finance', imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop', rating: 4.93, price: 50 },
        { name: 'Pt. Anand Mishra', specialty: 'Entrepreneurship', imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop', rating: 4.87, price: 45 },
      ]} />
    </ServiceLayout>
  );
}

/* ------------------------------------------------------------- Finance */
export function FinanceAstrologyScreen() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const a = '#81C784';
  return (
    <ServiceLayout title="Finance Astrology" testID="financeAstrology">
      <ServiceHeroCard title="Finance Astrology" subtitle="Wealth, investments & financial destiny" imageUrl="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop" semanticLabel="Gold coins and financial charts with upward trending graphs on a dark background" accent={a} icon="account_balance_rounded" />
      <Intro>The 2nd, 5th, 8th, and 11th houses in your birth chart govern wealth accumulation, speculative gains, inheritance, and income respectively. Our expert astrologers decode your financial destiny and guide you toward prosperity.</Intro>
      <SectionTitle title="Financial Analysis" accent={a} />
      <InfoCard icon="savings_rounded" title="Wealth Accumulation Periods" description="Identify Jupiter and Venus Dasha periods that bring maximum financial growth and wealth accumulation." accent={a} />
      <InfoCard icon="show_chart_rounded" title="Investment Timing" description="Determine the best planetary windows for stock market investments, real estate purchases, and gold buying." accent={a} />
      <InfoCard icon="warning_amber_rounded" title="Financial Loss Prevention" description="Foresee Ketu and Saturn transits that may cause financial setbacks and take preventive measures." accent={a} />
      <InfoCard icon="home_rounded" title="Property & Real Estate" description="Analyse the 4th house for property ownership timing and the best periods for buying or selling property." accent={a} />
      <SectionTitle title="Wealth Houses" accent={a} />
      <View style={{ paddingHorizontal: 16 }}>
        {[['2nd House', 'Savings & Assets', 'Venus'], ['5th House', 'Speculation & Gains', 'Jupiter'], ['8th House', 'Inheritance', 'Saturn'], ['11th House', 'Income & Profits', 'Jupiter']].map(([h, g, p]) => (
          <View key={h} style={{ marginBottom: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: withAlpha(a, colors.isLight ? 25 : 20), alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: a, fontSize: 11, fontWeight: '700' }}>{t(h.split(' ')[0], h.split(' ')[0])}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>{t(h, h)}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{t(g, g)}</Text>
            </View>
            <Text style={{ color: a, fontSize: 12, fontWeight: '600' }}>{t(p, p)}</Text>
          </View>
        ))}
      </View>
      <SectionTitle title="Expert Astrologers" accent={a} />
      <AstrologerRow accent={a} items={[
        { name: 'Pt. Ramesh Gupta', specialty: 'Wealth & Finance', imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop', rating: 4.91, price: 48 },
        { name: 'Jyotishi Kavita', specialty: 'Investment Timing', imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop', rating: 4.85, price: 40 },
      ]} />
    </ServiceLayout>
  );
}

/* ------------------------------------------------------------- Tarot */
const TAROT_CARDS = [
  { name: 'The Fool', meaning: 'New beginnings, innocence, spontaneity', reversed: 'Recklessness, risk-taking' },
  { name: 'The Magician', meaning: 'Manifestation, resourcefulness, power', reversed: 'Manipulation, poor planning' },
  { name: 'The High Priestess', meaning: 'Intuition, sacred knowledge, divine feminine', reversed: 'Secrets, disconnected from intuition' },
  { name: 'The Empress', meaning: 'Femininity, beauty, nature, nurturing', reversed: 'Creative block, dependence' },
  { name: 'The Emperor', meaning: 'Authority, establishment, structure', reversed: 'Domination, excessive control' },
  { name: 'The Hierophant', meaning: 'Spiritual wisdom, religious beliefs, conformity', reversed: 'Personal beliefs, freedom' },
  { name: 'The Lovers', meaning: 'Love, harmony, relationships, values', reversed: 'Self-love, disharmony, imbalance' },
  { name: 'The Chariot', meaning: 'Control, willpower, success, determination', reversed: 'Self-discipline, opposition' },
];
export function TarotScreen() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const a = '#9370DB';
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <ServiceLayout title="Tarot Reading" testID="tarot">
      <ServiceHeroCard title="Tarot Reading" subtitle="Ancient wisdom through sacred cards" imageUrl="https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&auto=format&fit=crop" semanticLabel="Mystical tarot cards spread on a dark velvet cloth with candles and crystals" accent={a} icon="style_rounded" />
      <Intro>Tarot is a powerful divination tool that uses 78 symbolic cards to reveal hidden truths, illuminate life paths, and provide guidance on love, career, and spiritual growth. Each card carries profound archetypal wisdom.</Intro>
      <SectionTitle title="Daily Card Draw" accent={a} />
      <LinearGradient colors={[withAlpha(a, colors.isLight ? 20 : 30), colors.surface]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ marginHorizontal: 16, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: withAlpha(a, colors.isLight ? 50 : 80), alignItems: 'center' }}>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{t('Your Card of the Day')}</Text>
        <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center' }}>
          <LinearGradient colors={[withAlpha(a, 80), '#1A0A2E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 80, height: 130, borderRadius: 12, borderWidth: 1.5, borderColor: a, alignItems: 'center', justifyContent: 'center' }}>
            <AppIcon name="auto_awesome" color={a} size={28} />
            <Text style={{ marginTop: 8, color: '#FFFFFF', fontSize: 12, fontWeight: '700', textAlign: 'center' }}>{t('The Star', 'The Star')}</Text>
          </LinearGradient>
          <View style={{ flex: 1, marginLeft: 20 }}>
            <Text style={{ color: a, fontSize: 18, fontWeight: '800' }}>{t('The Star', 'The Star')}</Text>
            <Text style={{ marginTop: 6, color: colors.textSecondary, ...lh(12, 1.5) }}>{t("Hope, faith, purpose, renewal, and spirituality. A period of calm after a storm — trust in the universe's plan.", "Hope, faith, purpose, renewal, and spirituality. A period of calm after a storm — trust in the universe's plan.")}</Text>
          </View>
        </View>
      </LinearGradient>
      <SectionTitle title="Reading Types" accent={a} />
      <InfoCard icon="favorite_rounded" title="Love & Relationship Spread" description="A 5-card spread revealing the current state of your love life, obstacles, and the path forward." accent={a} />
      <InfoCard icon="work_rounded" title="Career & Finance Spread" description="A 3-card spread covering your current career situation, challenges, and the best action to take." accent={a} />
      <InfoCard icon="psychology_rounded" title="Celtic Cross Spread" description="The most comprehensive 10-card spread providing a complete overview of your life situation." accent={a} />
      <SectionTitle title="Major Arcana Cards" accent={a} />
      <View style={{ paddingHorizontal: 16 }}>
        {TAROT_CARDS.map((c, i) => {
          const sel = selected === i;
          return (
            <AnimatedPressable
              key={c.name}
              testID={`tarot.card.${i}`}
              onPress={() => setSelected(sel ? null : i)}
              duration={200}
              style={{ marginBottom: 8, padding: 14, borderRadius: 14, borderWidth: 1, backgroundColor: sel ? withAlpha(a, colors.isLight ? 25 : 20) : colors.surface, borderColor: sel ? a : colors.cardBorder }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AppIcon name="auto_awesome" color={a} size={16} />
                <Text style={{ marginLeft: 8, flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>{t(c.name, c.name)}</Text>
                <AppIcon name={sel ? 'keyboard_arrow_up_rounded' : 'keyboard_arrow_down_rounded'} color={colors.textMuted} size={18} />
              </View>
              {sel ? (
                <>
                  <Text style={{ marginTop: 10, color: colors.textSecondary, ...lh(12, 1.5) }}>{`✦ ${t('Upright')}: ${t(c.meaning, c.meaning)}`}</Text>
                  <Text style={{ marginTop: 4, color: withAlpha(a, 180), ...lh(12, 1.5) }}>{`✦ ${t('Reversed')}: ${t(c.reversed, c.reversed)}`}</Text>
                </>
              ) : null}
            </AnimatedPressable>
          );
        })}
      </View>
    </ServiceLayout>
  );
}

/* ------------------------------------------------------------- Numerology */
export function reduceToSingleDigit(n: number): number {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) n = String(n).split('').reduce((s, d) => s + Number(d), 0);
  return n;
}
const LETTERS: Record<string, number> = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9, J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9, S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8 };
const MEANINGS: Record<number, { title: string; desc: string }> = {
  1: { title: 'The Leader', desc: 'Independent, pioneering, ambitious. Born to lead and innovate.' },
  2: { title: 'The Diplomat', desc: 'Cooperative, sensitive, harmonious. Natural peacemaker and mediator.' },
  3: { title: 'The Communicator', desc: 'Creative, expressive, joyful. Gifted in arts and communication.' },
  4: { title: 'The Builder', desc: 'Practical, disciplined, reliable. Creates lasting foundations.' },
  5: { title: 'The Adventurer', desc: 'Freedom-loving, versatile, curious. Thrives on change and experience.' },
  6: { title: 'The Nurturer', desc: 'Caring, responsible, loving. Natural healer and family person.' },
  7: { title: 'The Seeker', desc: 'Analytical, introspective, spiritual. Pursues truth and wisdom.' },
  8: { title: 'The Achiever', desc: 'Ambitious, authoritative, successful. Manifests material abundance.' },
  9: { title: 'The Humanitarian', desc: 'Compassionate, generous, idealistic. Serves humanity with love.' },
  11: { title: 'The Illuminator', desc: 'Highly intuitive, inspirational, visionary. Master number of spiritual insight.' },
  22: { title: 'The Master Builder', desc: 'Practical visionary, powerful, capable. Builds dreams into reality.' },
};
export function calcLifePath(dob: string): number | null {
  const d = dob.replace(/[^0-9]/g, '');
  if (d.length < 8) return null;
  return reduceToSingleDigit(d.split('').reduce((s, c) => s + Number(c), 0));
}
export function calcDestiny(name: string): number | null {
  const n = name.toUpperCase();
  if (!n) return null;
  return reduceToSingleDigit(n.split('').reduce((s, c) => s + (LETTERS[c] ?? 0), 0));
}

function NumField({ label, icon, value, onChange, accent, testID }: { label: string; icon: string; value: string; onChange: (s: string) => void; accent: string; testID: string }) {
  const colors = useThemeColors();
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ height: 56, borderRadius: 12, borderWidth: 1, borderColor: focused ? accent : withAlpha(accent, colors.isLight ? 50 : 40), backgroundColor: colors.surfaceVariant, flexDirection: 'row', alignItems: 'center' }}>
      <AppIcon name={icon} color={accent} style={{ marginHorizontal: 12 }} />
      <View style={{ flex: 1 }}>
        {value || focused ? <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{label}</Text> : null}
        <TextInput testID={testID} value={value} onChangeText={onChange} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder={value || focused ? '' : label} placeholderTextColor={colors.textMuted} style={{ fontSize: 14, color: colors.textPrimary }} />
      </View>
    </View>
  );
}

export function NumerologyScreen() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const authUser = useAuthStore((s) => s.user);
  const a = '#FFB347';
  const [name, setName] = useState(authUser?.name || '');
  const [dob, setDob] = useState(authUser?.dob || '');
  const [lifePath, setLifePath] = useState<number | null>(() => {
    return authUser?.dob ? calcLifePath(authUser.dob) : null;
  });
  const [destiny, setDestiny] = useState<number | null>(() => {
    return authUser?.name ? calcDestiny(authUser.name) : null;
  });

  useEffect(() => {
    if (authUser) {
      if (authUser.name && !name) {
        setName(authUser.name);
        const d = calcDestiny(authUser.name);
        if (d != null) setDestiny(d);
      }
      if (authUser.dob && !dob) {
        setDob(authUser.dob);
        const lp = calcLifePath(authUser.dob);
        if (lp != null) setLifePath(lp);
      }
    }
  }, [authUser]);

  const calculate = () => {
    const lp = calcLifePath(dob);
    if (lp != null) setLifePath(lp); // source only updates when ≥ 8 digits (keeps previous value otherwise)
    const d = calcDestiny(name);
    if (d != null) setDestiny(d);
  };
  const ResultCard = ({ value, label, color, testID }: { value: number; label: string; color: string; testID: string }) => (
    <LinearGradient testID={testID} colors={[withAlpha(color, colors.isLight ? 25 : 40), colors.surface]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flex: 1, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: withAlpha(color, 100), alignItems: 'center' }}>
      <Text style={{ color, fontSize: 40, fontWeight: '900' }}>{String(value)}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{t(label, label)}</Text>
      {MEANINGS[value] ? <Text style={{ marginTop: 6, color: colors.textPrimary, fontSize: 12, fontWeight: '600', textAlign: 'center' }}>{t(MEANINGS[value].title, MEANINGS[value].title)}</Text> : null}
    </LinearGradient>
  );
  return (
    <ServiceLayout title="Numerology" testID="numerology">
      <ServiceHeroCard title="Numerology" subtitle="Decode the numbers of your destiny" imageUrl="https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop" semanticLabel="Sacred numbers and mathematical symbols glowing in golden light on a dark mystical background" accent={a} icon="tag_rounded" />
      <Intro>Numerology is the ancient science of numbers and their divine influence on human life. Every number carries a unique vibration that shapes your personality, destiny, and life path.</Intro>
      <SectionTitle title="Calculate Your Numbers" accent={a} />
      <View style={{ marginHorizontal: 16, padding: 20, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: withAlpha(a, colors.isLight ? 50 : 80), gap: 12 }}>
        <NumField testID="numerology.name" label={t('Full Name')} icon="person_outline_rounded" value={name} onChange={setName} accent={a} />
        <NumField testID="numerology.dob" label={t('Date of Birth (DD/MM/YYYY)')} icon="calendar_today_rounded" value={dob} onChange={setDob} accent={a} />
        <ElevatedButton testID="numerology.calculate" label={t('Calculate My Numbers')} onPress={calculate} bg="#713B32" fg="#FFFFFF" radius={100} paddingV={14} fontWeight="700" style={{ marginTop: 4 }} />
      </View>
      {lifePath != null || destiny != null ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 16, flexDirection: 'row', gap: 12 }}>
          {lifePath != null ? <ResultCard testID="numerology.lifePath" value={lifePath} label="Life Path" color={a} /> : null}
          {destiny != null ? <ResultCard testID="numerology.destiny" value={destiny} label="Destiny" color="#9370DB" /> : null}
        </View>
      ) : null}
      <SectionTitle title="Core Numbers" accent={a} />
      <InfoCard icon="route_rounded" title="Life Path Number" description="Derived from your birth date, this is the most important number — it reveals your life's purpose and the path you are meant to walk." accent={a} />
      <InfoCard icon="star_rounded" title="Destiny Number" description="Calculated from your full birth name, this reveals your talents, abilities, and the goals you are destined to achieve." accent={a} />
      <InfoCard icon="favorite_rounded" title="Soul Urge Number" description="Derived from the vowels in your name, this reveals your innermost desires, motivations, and what truly makes your soul happy." accent={a} />
    </ServiceLayout>
  );
}

/* ------------------------------------------------------------- Muhurat */
export function MuhuratScreen() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const a = '#FFD700';
  const muhurats = [
    { event: 'Marriage', icon: 'favorite_rounded', dates: ['15 Nov 2025', '22 Nov 2025', '3 Dec 2025'], color: '#FF6B6B' },
    { event: 'Business Launch', icon: 'rocket_launch_rounded', dates: ['8 Nov 2025', '19 Nov 2025', '1 Dec 2025'], color: '#4FC3F7' },
    { event: 'Property Purchase', icon: 'home_rounded', dates: ['12 Nov 2025', '25 Nov 2025', '7 Dec 2025'], color: '#81C784' },
    { event: 'Vehicle Purchase', icon: 'directions_car_rounded', dates: ['10 Nov 2025', '21 Nov 2025', '5 Dec 2025'], color: '#FFB347' },
    { event: 'Griha Pravesh', icon: 'door_front_door_rounded', dates: ['17 Nov 2025', '28 Nov 2025', '9 Dec 2025'], color: '#9370DB' },
  ];
  return (
    <ServiceLayout title="Muhurat" testID="muhurat">
      <ServiceHeroCard title="Muhurat" subtitle="Auspicious timings for life events" imageUrl="https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop" semanticLabel="Traditional Hindu calendar with auspicious dates marked, surrounded by marigold flowers and diyas" accent={a} icon="event_available_rounded" />
      <Intro>Muhurat is the Vedic science of selecting the most auspicious time for important life events. Starting any significant activity at the right cosmic moment ensures divine blessings and minimises obstacles.</Intro>
      <SectionTitle title="Upcoming Auspicious Dates" accent={a} />
      {muhurats.map((m) => (
        <View key={m.event} style={{ marginHorizontal: 16, marginBottom: 10, padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: withAlpha(m.color, colors.isLight ? 50 : 60) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ padding: 8, borderRadius: 10, backgroundColor: withAlpha(m.color, 20) }}>
              <AppIcon name={m.icon} color={m.color} size={18} />
            </View>
            <Text style={{ marginLeft: 12, color: colors.textPrimary, fontSize: 15, fontWeight: '600' }}>{t(m.event, m.event)}</Text>
          </View>
          <View style={{ marginTop: 12, flexDirection: 'row' }}>
            {m.dates.map((d) => (
              <View key={d} style={{ marginRight: 8, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: withAlpha(m.color, colors.isLight ? 25 : 20), borderWidth: 1, borderColor: withAlpha(m.color, 60) }}>
                <Text style={{ color: m.color, fontSize: 11, fontWeight: '600' }}>{d}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
      <SectionTitle title="Daily Panchang" accent={a} />
      <View style={{ marginHorizontal: 16, padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder }}>
        {[['Tithi', 'Ekadashi (11th)'], ['Nakshatra', 'Rohini'], ['Yoga', 'Siddhi'], ['Karana', 'Bava'], ['Vara', 'Tuesday']].map(([l, v]) => (
          <View key={l} style={{ paddingVertical: 6, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{t(l, l)}</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>{t(v, v)}</Text>
          </View>
        ))}
      </View>
      <SectionTitle title="Inauspicious Periods" accent={a} />
      <InfoCard icon="warning_amber_rounded" title="Rahu Kaal" description="Today: 3:00 PM – 4:30 PM. Avoid starting new ventures during this period governed by Rahu." accent={AppColors.error} />
      <InfoCard icon="warning_amber_rounded" title="Yamaganda" description="Today: 9:00 AM – 10:30 AM. An inauspicious period associated with Yama, the god of death." accent={AppColors.warning} />
    </ServiceLayout>
  );
}

/* ------------------------------------------------------------- Spiritual */
export function SpiritualGuidanceScreen() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const a = '#9370DB';
  return (
    <ServiceLayout title="Spiritual Guidance" testID="spiritualGuidance">
      <ServiceHeroCard title="Spiritual Guidance" subtitle="Illuminate your soul's sacred path" imageUrl="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop" semanticLabel="Person meditating in lotus position on a mountain peak at sunset with golden light and spiritual energy" accent={a} icon="psychology_rounded" />
      <Intro>Beyond the material world lies the realm of the soul. Our spiritual astrologers and guides help you understand your karmic journey, past life influences, dharmic purpose, and the spiritual practices best suited for your soul&apos;s evolution.</Intro>
      <SectionTitle title="Spiritual Services" accent={a} />
      <InfoCard icon="loop_rounded" title="Karma & Past Life Analysis" description="Explore karmic debts and past life influences through the 12th house, Saturn, and Rahu-Ketu axis in your birth chart." accent={a} />
      <InfoCard icon="self_improvement_rounded" title="Dharma & Life Purpose" description="Discover your soul's true purpose through the Atmakaraka planet and the 9th house of dharma and higher wisdom." accent={a} />
      <InfoCard icon="spa_rounded" title="Spiritual Practice Guidance" description="Receive personalised recommendations for meditation, yoga, mantra, and spiritual practices aligned with your birth chart." accent={a} />
      <InfoCard icon="star_rounded" title="Ishta Devata (Personal Deity)" description="Identify your personal deity through the Atmakaraka and Karakamsha chart for deepened spiritual connection." accent={a} />
      <SectionTitle title="Daily Spiritual Practice" accent={a} />
      <HScroll height={100}>
        {[['Meditation', '20 min', 'self_improvement_rounded', '#9370DB'], ['Pranayama', '15 min', 'air_rounded', '#4FC3F7'], ['Mantra Japa', '108 times', 'music_note_rounded', '#FFD700'], ['Yoga Asana', '30 min', 'accessibility_new_rounded', '#81C784']].map(([n, d, i, c]) => (
          <View key={n} style={{ width: 120, height: 100, marginRight: 10, padding: 14, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: withAlpha(c, colors.isLight ? 50 : 60), alignItems: 'center', justifyContent: 'center' }}>
            <AppIcon name={i} color={c} size={24} />
            <Text style={{ marginTop: 6, color: colors.textPrimary, fontSize: 12, fontWeight: '600' }}>{t(n, n)}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 10 }}>{t(d, d)}</Text>
          </View>
        ))}
      </HScroll>
      <SectionTitle title="Sacred Wisdom" accent={a} />
      <View style={{ paddingHorizontal: 16 }}>
        {[
          ['The soul is not born; it does not die; it was not produced from anyone. Unborn, eternal, ever-existing and primeval.', 'Bhagavad Gita 2.20'],
          ['You have the right to perform your prescribed duties, but you are not entitled to the fruits of your actions.', 'Bhagavad Gita 2.47'],
        ].map(([t, s]) => (
          <LinearGradient key={s} colors={[withAlpha(a, colors.isLight ? 20 : 20), colors.surface]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ marginBottom: 10, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: withAlpha(a, colors.isLight ? 50 : 60) }}>
            <Text style={{ color: colors.textPrimary, fontStyle: 'italic', ...lh(13, 1.6) }}>{`"${t}"`}</Text>
            <Text style={{ marginTop: 8, color: a, fontSize: 12, fontWeight: '600' }}>{`— ${s}`}</Text>
          </LinearGradient>
        ))}
      </View>
    </ServiceLayout>
  );
}

/* ------------------------------------------------------------- Reports */
export function AstrologyReportsScreen() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const a = '#4FC3F7';
  const reports = [
    { name: 'Comprehensive Birth Chart Report', pages: '40+ pages', price: 499, desc: 'Complete analysis of all 12 houses, 9 planets, Dasha periods, and life predictions.', icon: 'auto_stories_rounded', color: '#9370DB', popular: true },
    { name: 'Career & Finance Report', pages: '25+ pages', price: 349, desc: 'Detailed career path analysis, promotion timings, and wealth accumulation periods.', icon: 'work_rounded', color: '#FFD700', popular: false },
    { name: 'Marriage Compatibility Report', pages: '30+ pages', price: 399, desc: 'Complete Kundli Milan with 36 Guna matching, Mangal Dosha analysis, and marriage timing.', icon: 'favorite_rounded', color: '#FF6B6B', popular: true },
    { name: 'Annual Horoscope Report', pages: '35+ pages', price: 449, desc: 'Month-by-month predictions for the coming year covering all life areas.', icon: 'calendar_month_rounded', color: '#4FC3F7', popular: false },
    { name: 'Numerology Life Report', pages: '20+ pages', price: 299, desc: 'Complete numerological analysis of your name, birth date, and destiny numbers.', icon: 'tag_rounded', color: '#FFB347', popular: false },
    { name: 'Child Astrology Report', pages: '28+ pages', price: 379, desc: "Comprehensive analysis of your child's talents, education path, and life journey.", icon: 'child_care_rounded', color: '#81C784', popular: false },
  ];
  return (
    <ServiceLayout title="Astrology Reports" testID="astrologyReports">
      <ServiceHeroCard title="Astrology Reports" subtitle="Detailed PDF reports by expert astrologers" imageUrl="https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop" semanticLabel="Detailed astrological charts and reports spread on a desk with a pen and cosmic symbols" accent={a} icon="description_rounded" />
      <Intro>Our expert astrologers prepare detailed, personalised PDF reports that provide deep insights into every aspect of your life. Each report is hand-crafted based on your exact birth details.</Intro>
      <SectionTitle title="Available Reports" accent={a} />
      {reports.map((r, i) => (
        <View key={r.name} style={{ marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: r.popular ? withAlpha(r.color, 100) : colors.cardBorder }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ padding: 10, borderRadius: 12, backgroundColor: withAlpha(r.color, 20) }}>
              <AppIcon name={r.icon} color={r.color} size={22} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>{t(r.name, r.name)}</Text>
                {r.popular ? (
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: withAlpha(colors.goldAccent, 25), borderWidth: 1, borderColor: withAlpha(colors.goldAccent, 80) }}>
                    <Text style={{ color: colors.goldAccent, fontSize: 10, fontWeight: '600' }}>{t('Popular')}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={{ color: r.color, fontSize: 11, fontWeight: '500' }}>{r.pages}</Text>
            </View>
          </View>
          <Text style={{ marginTop: 10, color: colors.textSecondary, ...lh(12, 1.5) }}>{t(r.desc, r.desc)}</Text>
          <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: colors.goldAccent, fontSize: 20, fontWeight: '800' }}>{`₹${r.price}`}</Text>
            <Text style={{ marginLeft: 4, flex: 1, color: colors.textMuted, fontSize: 11 }}>{t('one-time')}</Text>
            <Pressable testID={`astrologyReports.getReport.${i}`} onPress={() => push(AppRoutes.kundliReportsScreen)} style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: r.color }}>
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>{t('Get Report')}</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ServiceLayout>
  );
}
