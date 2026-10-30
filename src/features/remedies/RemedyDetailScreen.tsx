/**
 * Remedy Detail Screen
 * - High-contrast, executive Vedic design with 100% crystal clear text visibility.
 * - Unified professional color palette (Sacred Gold, Deep Royal Maroon & high-contrast theme typography).
 * - Avoids multiple clashing colors; ensures all text, chips, headings, and descriptions
 *   maintain high contrast and legibility across both Light Vedic and Dark Cosmic themes.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar, BoxBackButton } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { ElevatedButton, OutlinedButton } from '@/components/common';
import {
  InlineServiceReportCard,
  ReportIntakeConfig,
  ServiceReportIntakeModal,
} from '@/components/ServiceReportIntakeModal';
import { lh, Text } from '@/components/Text';
import {
  CHARITIES,
  DEITIES,
  GEMS,
  getRemedyData,
  HOMAS,
  MANTRAS,
  MUKHIS,
  REMEDIES,
  Remedy,
  VASTU_DIRECTIONS,
  YANTRAS,
} from '@/data/remedies';
import { useAuthStore } from '@/features/auth/authStore';
import { AppRoutes, push, useExtra } from '@/navigation/routes';
import { withAlpha } from '@/theme/colors';
import { useTranslation } from '@/theme/languageStore';
import { useThemeColors } from '@/theme/themeStore';

function Chip({ label }: { label: string }) {
  const colors = useThemeColors();
  return (
    <View
      style={{
        paddingHorizontal: 9,
        paddingVertical: 3.5,
        borderRadius: 8,
        backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 15 : 22),
        borderWidth: 1,
        borderColor: withAlpha(colors.goldAccent, colors.isLight ? 45 : 65),
      }}
    >
      <Text style={{ color: colors.textPrimary, fontSize: 11, fontWeight: '700' }}>
        {label}
      </Text>
    </View>
  );
}

const Card = ({
  children,
  mb = 8,
  padding = 14,
  style,
}: {
  children: React.ReactNode;
  mb?: number;
  padding?: number;
  style?: object;
}) => {
  const colors = useThemeColors();
  return (
    <View
      style={[
        {
          marginBottom: mb,
          padding,
          borderRadius: 16,
          backgroundColor: colors.surface,
          borderWidth: 1.2,
          borderColor: colors.cardBorder,
          shadowColor: '#000',
          shadowOpacity: colors.isLight ? 0.03 : 0.15,
          shadowRadius: 6,
          elevation: 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const Heading = ({ text, icon = '✦' }: { text: string; icon?: string }) => {
  const colors = useThemeColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 4 }}>
      <Text style={{ color: colors.goldAccent, fontSize: 13, marginRight: 6 }}>{icon}</Text>
      <Text style={{ color: colors.textPrimary, fontSize: 15.5, fontWeight: '700' }}>{text}</Text>
    </View>
  );
};

function SectionCard({
  title,
  content,
  icon = 'auto_awesome',
}: {
  title: string;
  content: string;
  icon?: string;
}) {
  const colors = useThemeColors();
  return (
    <View
      style={{
        padding: 16,
        borderRadius: 18,
        backgroundColor: colors.surface,
        borderWidth: 1.2,
        borderColor: colors.cardBorder,
        shadowColor: '#000',
        shadowOpacity: colors.isLight ? 0.03 : 0.15,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 16 : 24),
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8,
          }}
        >
          <AppIcon name={icon} color={colors.goldAccent} size={15} />
        </View>
        <Text style={{ color: colors.textPrimary, fontSize: 14.5, fontWeight: '700' }}>
          {title}
        </Text>
      </View>
      <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19 }}>
        {content}
      </Text>
    </View>
  );
}

function SpecificContent({ name }: { name: string }) {
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
          <Heading text="Navagraha Sacred Mantras" icon="🕉️" />
          {MANTRAS.map((m) => (
            <Card key={m.planet}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>
                  {m.planet}
                </Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <Chip label={`${m.count} times`} />
                  <Chip label={m.time} />
                </View>
              </View>
              <Text
                style={{
                  marginTop: 8,
                  color: colors.goldAccent,
                  fontSize: 13,
                  fontWeight: '600',
                  fontStyle: 'italic',
                }}
              >
                {m.mantra}
              </Text>
            </Card>
          ))}
        </View>
      );

    case 'Yantra':
      return (
        <View>
          <Heading text="Popular Sacred Yantras" icon="⬡" />
          {YANTRAS.map((y) => (
            <Card key={y.name} padding={14} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 18 : 26),
                  borderWidth: 1,
                  borderColor: withAlpha(colors.goldAccent, colors.isLight ? 40 : 60),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 20 }}>⬡</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>
                  {y.name}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                  {y.purpose}
                </Text>
              </View>
              <Chip label={y.planet} />
            </Card>
          ))}
        </View>
      );

    case 'Homa':
      return (
        <View>
          <Heading text="Recommended Sacred Homams" icon="🔥" />
          {HOMAS.map((h) => (
            <Card key={h.name} padding={14} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 18 : 26),
                  borderWidth: 1,
                  borderColor: withAlpha(colors.goldAccent, colors.isLight ? 40 : 60),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 20 }}>🔥</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>
                  {h.name}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                  {h.purpose}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Chip label={h.day} />
                <Text style={{ color: colors.textMuted, fontSize: 10 }}>{h.duration}</Text>
              </View>
            </Card>
          ))}
        </View>
      );

    case 'Devata': {
      const cw = gridW > 0 ? (gridW - 10) / 2 : 0;
      return (
        <View>
          <Heading text="Personal Ishta Deities" icon="🪔" />
          <View
            style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}
            onLayout={(e) => setGridW(e.nativeEvent.layout.width)}
          >
            {cw > 0 &&
              DEITIES.map((d) => (
                <View
                  key={d.name}
                  style={{
                    width: cw,
                    height: 110,
                    padding: 12,
                    borderRadius: 16,
                    backgroundColor: colors.surface,
                    borderWidth: 1.2,
                    borderColor: colors.cardBorder,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 28 }}>{d.emoji}</Text>
                  <Text
                    style={{
                      marginTop: 6,
                      color: colors.textPrimary,
                      fontSize: 13,
                      fontWeight: '700',
                      textAlign: 'center',
                    }}
                  >
                    {d.name}
                  </Text>
                  <Text style={{ color: colors.goldAccent, fontSize: 11, fontWeight: '600' }}>
                    {d.quality}
                  </Text>
                </View>
              ))}
          </View>
        </View>
      );
    }

    case 'Gemstones':
      return (
        <View>
          <Heading text="Navagraha Gemstone Therapy" icon="💎" />
          <View
            style={{
              padding: 12,
              borderRadius: 12,
              backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 12 : 20),
              borderWidth: 1,
              borderColor: withAlpha(colors.goldAccent, colors.isLight ? 40 : 60),
              marginBottom: 10,
            }}
          >
            <Text style={{ color: colors.textPrimary, fontSize: 11.5, lineHeight: 16, fontWeight: '500' }}>
              ⚠️ Gemstone recommendations are chart-specific. Always consult an astrologer before wearing.
            </Text>
          </View>
          {GEMS.map((g) => (
            <Card key={g.planet} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 18 : 26),
                  borderWidth: 1,
                  borderColor: withAlpha(colors.goldAccent, colors.isLight ? 40 : 60),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 20 }}>💎</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>
                  {`${g.planet} → ${g.gem}`}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11.5, marginTop: 2 }}>
                  {`${g.metal} • ${g.finger} finger • ${g.day}`}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      );

    case 'Rudraksha':
      return (
        <View>
          <Heading text="Sacred Rudraksha Mukhis" icon="📿" />
          {MUKHIS.map((m) => (
            <Card key={m.mukhi} mb={8} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 18 : 26),
                  borderWidth: 1,
                  borderColor: withAlpha(colors.goldAccent, colors.isLight ? 40 : 60),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: colors.goldAccent, fontSize: 14, fontWeight: '800' }}>
                  {m.mukhi}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 13.5, fontWeight: '700' }}>
                  {`${m.mukhi} Mukhi`}
                </Text>
                <Text style={{ color: colors.goldAccent, fontSize: 11, fontWeight: '600' }}>
                  {m.deity}
                </Text>
              </View>
              <Text
                numberOfLines={2}
                style={{
                  maxWidth: 140,
                  color: colors.textSecondary,
                  fontSize: 11.5,
                  textAlign: 'right',
                }}
              >
                {m.benefit}
              </Text>
            </Card>
          ))}
        </View>
      );

    case 'Vastu':
      return (
        <View>
          <Heading text="8-Directional Vastu Science" icon="🏛️" />
          {VASTU_DIRECTIONS.map((d) => (
            <Card key={d.dir} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 18 : 26),
                  borderWidth: 1,
                  borderColor: withAlpha(colors.goldAccent, colors.isLight ? 40 : 60),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: colors.goldAccent, fontSize: 16, fontWeight: '800' }}>
                  {d.dir.substring(0, 1)}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>
                  {d.dir}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                  {d.area}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 1 }}>
                  {`${d.element} • ${d.deity}`}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      );

    case 'Dāna & Seva':
      return (
        <View>
          <Heading text="Vedic Planetary Charity Guide" icon="🤲" />
          {CHARITIES.map((c) => (
            <Card key={c.planet}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>
                  {c.planet}
                </Text>
                <Chip label={c.day} />
              </View>
              <Text style={{ marginTop: 6, color: colors.textSecondary, fontSize: 12.5 }}>
                {`Donate: ${c.donation}`}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
                {`To: ${c.recipient}`}
              </Text>
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
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authUser = useAuthStore((s) => s.user);
  const isUserLoggedIn = Boolean(isAuthenticated && authUser && (authUser.uid || authUser.phone));
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const rawRemedy = useExtra<Remedy>();
  const remedy = rawRemedy || REMEDIES[0];

  const { name } = remedy;
  const data = getRemedyData(name);
  const isVastu = name.toLowerCase().includes('vastu') || name.toLowerCase().includes('vāstu');

  const reportConfig: ReportIntakeConfig = isVastu
    ? {
        mode: 'vastu',
        title: 'Personalised Vastu Shastra Consultation Report',
        subtitle: '16-Zone spatial audit, entrance direction analysis & non-demolition remedies',
        price: 149,
        serviceId: 'svc-vastu',
        remedyName: name,
        category: 'remedies',
      }
    : {
        mode: 'remedy',
        title: `${name} Personalised Parihar Report`,
        subtitle: `Custom ${remedy.sanskrit} prescription aligned with your natal chart & Dasha`,
        price: 99,
        remedyName: name,
        category: 'remedies',
      };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="remedyDetail.screen">
      <AppBar
        title={name}
        backgroundColor={colors.background}
        backColor={colors.textPrimary}
        leading={<BoxBackButton testID="remedyDetail.back" onPress={() => router.back()} />}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(24, insets.bottom + 16) }}
      >
        {/* Top Hero Banner */}
        <LinearGradient
          colors={
            colors.isLight
              ? ['#FFFDF9', '#F7F1E7']
              : [withAlpha(colors.goldAccent, 28), colors.surfaceVariant]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            marginHorizontal: 20,
            marginTop: 8,
            marginBottom: 16,
            padding: 24,
            borderRadius: 24,
            borderWidth: 1.2,
            borderColor: colors.cardBorder,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOpacity: colors.isLight ? 0.04 : 0.2,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <Text style={{ fontSize: 52 }}>{remedy.emoji}</Text>
          <Text
            style={{
              marginTop: 12,
              color: colors.textPrimary,
              fontSize: 23,
              fontWeight: '800',
              textAlign: 'center',
            }}
          >
            {name}
          </Text>
          <Text
            style={{
              marginTop: 2,
              color: colors.goldAccent,
              fontSize: 16,
              fontWeight: '700',
              textAlign: 'center',
            }}
          >
            {remedy.sanskrit}
          </Text>

          {remedy.direction && (
            <View
              style={{
                marginTop: 10,
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 100,
                backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 18 : 28),
                borderWidth: 1,
                borderColor: withAlpha(colors.goldAccent, colors.isLight ? 45 : 70),
              }}
            >
              <Text style={{ color: colors.textPrimary, fontSize: 11.5, fontWeight: '700' }}>
                {`🧭 ${remedy.direction}${remedy.directionHindi ? ` (${remedy.directionHindi})` : ''}`}
              </Text>
            </View>
          )}

          <Text
            style={{
              marginTop: 12,
              color: colors.textSecondary,
              textAlign: 'center',
              fontSize: 13,
              lineHeight: 19,
            }}
          >
            {data.shortDesc}
          </Text>
        </LinearGradient>

        {/* Informational Cards Section */}
        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          <SectionCard
            title="Why This Remedy May Help"
            content={data.whyHelp}
            icon="psychology"
          />

          {/* Benefits Card */}
          <View
            style={{
              padding: 16,
              borderRadius: 18,
              backgroundColor: colors.surface,
              borderWidth: 1.2,
              borderColor: colors.cardBorder,
              shadowColor: '#000',
              shadowOpacity: colors.isLight ? 0.03 : 0.15,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 16 : 24),
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 8,
                }}
              >
                <AppIcon name="verified" color={colors.goldAccent} size={15} />
              </View>
              <Text style={{ color: colors.textPrimary, fontSize: 14.5, fontWeight: '700' }}>
                Key Spiritual Benefits
              </Text>
            </View>
            {data.benefits.map((b) => (
              <View key={b} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 7 }}>
                <Text style={{ color: colors.goldAccent, fontSize: 13, marginRight: 8, lineHeight: 18 }}>
                  ✦
                </Text>
                <Text style={{ flex: 1, color: colors.textSecondary, fontSize: 13, lineHeight: 18 }}>
                  {b}
                </Text>
              </View>
            ))}
          </View>

          <SectionCard
            title="How It Works in Vedic Science"
            content={data.howItWorks}
            icon="science"
          />

          <SectionCard
            title="Who It Is Suitable For"
            content={data.suitableFor}
            icon="group"
          />

          {/* Personalised Recommendation Box */}
          <LinearGradient
            colors={
              colors.isLight
                ? ['#FFFDF9', '#F9F5EC']
                : [withAlpha(colors.goldAccent, 20), colors.surfaceVariant]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              padding: 16,
              borderRadius: 18,
              borderWidth: 1.2,
              borderColor: colors.goldAccent,
              shadowColor: colors.goldAccent,
              shadowOpacity: 0.1,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <AppIcon name="auto_awesome" color={colors.goldAccent} size={16} />
              <Text style={{ marginLeft: 6, color: colors.textPrimary, fontSize: 14, fontWeight: '800' }}>
                Personalised Recommendation
              </Text>
            </View>
            <Text style={{ marginTop: 4, color: colors.textSecondary, fontSize: 12.5, lineHeight: 18 }}>
              Based on your birth chart analysis, this remedy is particularly recommended for mitigating negative planetary transit effects and strengthening benefic houses.
            </Text>
          </LinearGradient>

          {/* Specific Content for this Remedy */}
          <SpecificContent name={name} />

          {/* Website Parity: Embedded Birth Details / Vastu Report Intake Card (#get-report) */}
          <View style={{ marginTop: 8 }}>
            <InlineServiceReportCard config={reportConfig} />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 }}>
          <ElevatedButton
            testID="remedyDetail.report"
            label={
              !isUserLoggedIn
                ? `🔒 Sign In to Get ${name} Report (₹${reportConfig.price})`
                : `Get My Personalised ${name} Report — ₹${reportConfig.price}`
            }
            onPress={() => setReportModalOpen(true)}
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
              onPress={() =>
                push(AppRoutes.aiChatScreen, {
                  astrologerId: 'vedika',
                  initialPrompt: `Namaste, please guide me on how to perform the Vedic remedy '${name}' (${remedy.sanskrit}) for my planetary benefits.`,
                })
              }
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
      </ScrollView>

      <ServiceReportIntakeModal
        visible={reportModalOpen}
        config={reportConfig}
        onClose={() => setReportModalOpen(false)}
      />
    </View>
  );
}
