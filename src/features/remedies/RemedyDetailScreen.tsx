/**
 * Port of lib/presentation/remedies_screen/remedy_detail_screen.dart
 * Reached only imperatively from RemediesScreen (Navigator.push in Flutter) with the remedy payload.
 * SOURCE_INERT: "Get My Personalised Report", "🤖 Ask AI", "👨‍🔮 Astrologer".
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar, BoxBackButton } from '@/components/AppBar';
import { ElevatedButton, OutlinedButton } from '@/components/common';
import { lh, Text } from '@/components/Text';
import {
  CHARITIES, DEITIES, GEMS, getRemedyData, HOMAS, MANTRAS, MUKHIS, REMEDIES, Remedy, VASTU_DIRECTIONS, YANTRAS,
} from '@/data/remedies';
import { AppRoutes, push, useExtra } from '@/navigation/routes';
import { AppColors, withAlpha } from '@/theme/colors';
import { useThemeColors } from '@/theme/themeStore';

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: withAlpha(color, 30), borderWidth: 1, borderColor: withAlpha(color, 80) }}>
      <Text style={{ color, fontSize: 10, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}
const Card = ({ children, mb = 8, padding = 12, style }: { children: React.ReactNode; mb?: number; padding?: number; style?: object }) => {
  const colors = useThemeColors();
  return (
    <View style={[{ marginBottom: mb, padding, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder }, style]}>
      {children}
    </View>
  );
};
const Heading = ({ text, color }: { text: string; color: string }) => <Text style={{ color, fontSize: 15, fontWeight: '700', marginBottom: 10 }}>{text}</Text>;

function SectionCard({ title, content, color }: { title: string; content: string; color: string }) {
  const colors = useThemeColors();
  return (
    <View style={{ padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder }}>
      <Text style={{ color, fontSize: 14, fontWeight: '700' }}>{title}</Text>
      <Text style={{ marginTop: 8, color: colors.textSecondary, ...lh(13, 1.6) }}>{content}</Text>
    </View>
  );
}

function SpecificContent({ name, color }: { name: string; color: string }) {
  const [gridW, setGridW] = useState(0);
  const colors = useThemeColors();

  const lower = (name || '').toLowerCase();
  let targetCase = name;
  if (lower.includes('mantra')) targetCase = 'Mantra';
  else if (lower.includes('yantra')) targetCase = 'Yantra';
  else if (lower.includes('homa')) targetCase = 'Homa';
  else if (lower.includes('devata') || lower.includes('ishta') || lower.includes('upasana')) targetCase = 'Devata';
  else if (lower.includes('gem') || lower.includes('ratna')) targetCase = 'Gemstones';
  else if (lower.includes('rudra')) targetCase = 'Rudraksha';
  else if (lower.includes('vastu') || lower.includes('vāstu')) targetCase = 'Vastu';
  else if (lower.includes('dāna') || lower.includes('dana') || lower.includes('charity') || lower.includes('seva')) targetCase = 'Dāna & Seva';

  switch (targetCase) {
    case 'Mantra':
      return (
        <View>
          <Heading text="Navagraha Mantras" color={color} />
          {MANTRAS.map((m) => (
            <Card key={m.planet}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color, fontSize: 13, fontWeight: '700' }}>{m.planet}</Text>
                <View style={{ flexDirection: 'row' }}>
                  <Chip label={`${m.count} times`} color={colors.goldAccent} />
                  <View style={{ width: 6 }} />
                  <Chip label={m.time} color={colors.textMuted} />
                </View>
              </View>
              <Text style={{ marginTop: 6, color: colors.textSecondary, fontSize: 12, fontStyle: 'italic' }}>{m.mantra}</Text>
            </Card>
          ))}
        </View>
      );
    case 'Yantra':
      return (
        <View>
          <Heading text="Popular Yantras" color={color} />
          {YANTRAS.map((y) => (
            <Card key={y.name} padding={14} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: withAlpha(color, 30), alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 22 }}>⬡</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>{y.name}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{y.purpose}</Text>
              </View>
              <Chip label={y.planet} color={color} />
            </Card>
          ))}
        </View>
      );
    case 'Homa':
      return (
        <View>
          <Heading text="Recommended Homams" color={color} />
          {HOMAS.map((h) => (
            <Card key={h.name} padding={14} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 24 }}>🔥</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>{h.name}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{h.purpose}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Chip label={h.day} color={color} />
                <Text style={{ marginTop: 4, color: colors.textMuted, fontSize: 10 }}>{h.duration}</Text>
              </View>
            </Card>
          ))}
        </View>
      );
    case 'Devata': {
      const cw = gridW > 0 ? (gridW - 10) / 2 : 0;
      return (
        <View>
          <Heading text="Deity Cards" color={color} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }} onLayout={(e) => setGridW(e.nativeEvent.layout.width)}>
            {cw > 0 && DEITIES.map((d) => (
              <View key={d.name} style={{ width: cw, height: cw / 1.3, padding: 12, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: withAlpha(color, colors.isLight ? 50 : 60), alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 28 }}>{d.emoji}</Text>
                <Text style={{ marginTop: 6, color: colors.textPrimary, fontSize: 12, fontWeight: '600', textAlign: 'center' }}>{d.name}</Text>
                <Text style={{ color, fontSize: 10 }}>{d.quality}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    }
    case 'Gemstones':
      return (
        <View>
          <Text style={{ color, fontSize: 15, fontWeight: '700' }}>Navagraha Gemstones</Text>
          <Text style={{ marginTop: 4, marginBottom: 10, color: AppColors.warning, fontSize: 11 }}>⚠️ Gemstone recommendations are chart-specific. Always consult an astrologer before wearing.</Text>
          {GEMS.map((g) => (
            <Card key={g.planet} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 20 }}>💎</Text>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>{`${g.planet} → ${g.gem}`}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>{`${g.metal} • ${g.finger} finger • ${g.day}`}</Text>
              </View>
            </Card>
          ))}
        </View>
      );
    case 'Rudraksha':
      return (
        <View>
          <Heading text="Rudraksha Mukhis" color={color} />
          {MUKHIS.map((m) => (
            <Card key={m.mukhi} mb={6} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: withAlpha(color, 30), borderWidth: 1, borderColor: withAlpha(color, 80), alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color, fontSize: 13, fontWeight: '700' }}>{m.mukhi}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>{`${m.mukhi} Mukhi`}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>{m.deity}</Text>
              </View>
              <Text style={{ flex: 1, color: colors.textSecondary, fontSize: 11, textAlign: 'right' }}>{m.benefit}</Text>
            </Card>
          ))}
        </View>
      );
    case 'Vastu':
      return (
        <View>
          <Heading text="8-Direction Vastu Guide" color={color} />
          {VASTU_DIRECTIONS.map((d) => (
            <Card key={d.dir} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: withAlpha(color, 30), alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color, fontSize: 16, fontWeight: '800' }}>{d.dir.substring(0, 1)}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>{d.dir}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{d.area}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>{`${d.element} • ${d.deity}`}</Text>
              </View>
            </Card>
          ))}
        </View>
      );
    case 'Dāna & Seva':
      return (
        <View>
          <Heading text="Planetary Charity Guide" color={color} />
          {CHARITIES.map((c) => (
            <Card key={c.planet}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color, fontSize: 13, fontWeight: '700' }}>{c.planet}</Text>
                <Chip label={c.day} color={color} />
              </View>
              <Text style={{ marginTop: 4, color: colors.textSecondary, fontSize: 12 }}>{`Donate: ${c.donation}`}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>{`To: ${c.recipient}`}</Text>
            </Card>
          ))}
        </View>
      );
    default:
      return null;
  }
}

export default function RemedyDetailScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const rawRemedy = useExtra<Remedy>();
  const remedy = rawRemedy || REMEDIES[0];

  const { color, name } = remedy;
  const data = getRemedyData(name);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="remedyDetail.screen">
      <AppBar
        title={name}
        backgroundColor={colors.background}
        backColor={colors.textPrimary}
        leading={<BoxBackButton testID="remedyDetail.back" onPress={() => router.back()} />}
      />
      <ScrollView>
        <LinearGradient
          colors={
            colors.isLight
              ? ['#FFF9F0', colors.surfaceVariant]
              : [withAlpha(color, 60), colors.surfaceVariant]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            marginHorizontal: 20,
            marginTop: 8,
            marginBottom: 16,
            padding: 24,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: withAlpha(color, colors.isLight ? 70 : 100),
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 56 }}>{remedy.emoji}</Text>
          <Text style={{ marginTop: 12, color: colors.textPrimary, fontSize: 24, fontWeight: '800' }}>{name}</Text>
          <Text style={{ color, fontSize: 18, fontWeight: '600' }}>{remedy.sanskrit}</Text>
          <Text style={{ marginTop: 12, color: colors.textSecondary, textAlign: 'center', ...lh(14, 1.5) }}>{data.shortDesc}</Text>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          <SectionCard title="Why This Remedy May Help" content={data.whyHelp} color={color} />
          <View style={{ padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder }}>
            <Text style={{ color, fontSize: 14, fontWeight: '700', marginBottom: 10 }}>Benefits</Text>
            {data.benefits.map((b) => (
              <View key={b} style={{ flexDirection: 'row', marginBottom: 6 }}>
                <Text style={{ color, fontSize: 12 }}>✦ </Text>
                <Text style={{ flex: 1, color: colors.textSecondary, fontSize: 13 }}>{b}</Text>
              </View>
            ))}
          </View>
          <SectionCard title="How It Works" content={data.howItWorks} color={color} />
          <SectionCard title="Who It Is Suitable For" content={data.suitableFor} color={color} />
          <LinearGradient
            colors={
              colors.isLight
                ? ['#FFFDF9', colors.surfaceVariant]
                : [withAlpha(color, 30), colors.surfaceVariant]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              padding: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: withAlpha(color, colors.isLight ? 60 : 80),
            }}
          >
            <Text style={{ color, fontSize: 14, fontWeight: '700' }}>Personalised Recommendation</Text>
            <Text style={{ marginTop: 8, color: colors.textSecondary, ...lh(13, 1.5) }}>
              Based on your birth chart analysis, this remedy is particularly recommended for your current Saturn Mahadasha period. The planetary influences in your chart suggest this practice will bring significant positive transformation.
            </Text>
          </LinearGradient>
          <SpecificContent name={name} color={color} />
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <ElevatedButton
            testID="remedyDetail.report"
            label="Get My Personalised Report"
            onPress={() => push(AppRoutes.kundliReportsScreen)}
            radius={100}
            paddingV={14}
            fontSize={14}
            fontWeight="700"
            bg="#713B32"
            fg="#FFFFFF"
          />
          <View style={{ marginTop: 10, flexDirection: 'row' }}>
            <OutlinedButton
              testID="remedyDetail.askAi"
              label="🤖 Ask AI"
              onPress={() => push(AppRoutes.aiChatScreen, {
                astrologerId: 'vedika',
                initialPrompt: `Namaste Vedika, please guide me on how to perform the Vedic remedy '${name}' (${remedy.sanskrit}) for my planetary benefits.`
              })}
              paddingV={12}
              fontSize={13}
              color={colors.textPrimary}
              borderColor={colors.cardBorder}
              style={{ flex: 1 }}
            />
            <View style={{ width: 10 }} />
            <OutlinedButton
              testID="remedyDetail.astrologer"
              label="👨‍🔮 Astrologer"
              onPress={() => push(AppRoutes.liveAstrologersScreen)}
              paddingV={12}
              fontSize={13}
              color={colors.textPrimary}
              borderColor={colors.cardBorder}
              style={{ flex: 1 }}
            />
          </View>
        </View>
        <View style={{ height: Math.max(140, insets.bottom + 80) }} />
      </ScrollView>
    </View>
  );
}
