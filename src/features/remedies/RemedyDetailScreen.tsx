/**
 * Remedy Detail Screen
 * - 100% Dynamic from live production backend (/api/app-dynamic/remedies and /api/app-dynamic/services).
 * - Live Mantras, Homams, 8-Directional Vastu Science, Ishta Deities, Gemstones, Rudrakshas,
 *   Planetary Charities, and the 48-Day Sacred Mandala Parihar Protocol.
 * - High-contrast, executive Vedic design with crystal clear typography.
 * - Graceful fallback to rich offline presets when offline.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar, BoxBackButton } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { ElevatedButton, OutlinedButton } from '@/components/common';
import { Text } from '@/components/Text';
import { API_ENDPOINTS } from '@/config/api';
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
import { AppRoutes, push, useExtra } from '@/navigation/routes';
import { withAlpha } from '@/theme/colors';
import { useThemeColors } from '@/theme/themeStore';

const STORAGE_REMEDY_PAYLOAD_CACHE = 'astroparihar_dynamic_remedies_payload';

function Chip({ label, color }: { label: string; color?: string }) {
  const colors = useThemeColors();
  const baseColor = color || colors.goldAccent;
  return (
    <View
      style={{
        paddingHorizontal: 9,
        paddingVertical: 3.5,
        borderRadius: 8,
        backgroundColor: withAlpha(baseColor, colors.isLight ? 15 : 22),
        borderWidth: 1,
        borderColor: withAlpha(baseColor, colors.isLight ? 45 : 65),
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

/**
 * Renders dynamic specific content for each of the 8 remedies
 * using live data from the backend when available.
 */
function SpecificContent({ name, dynamicData }: { name: string; dynamicData?: any }) {
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
    case 'Mantra': {
      const liveMantras: any[] = dynamicData?.mantras ? Object.values(dynamicData.mantras) : [];
      return (
        <View>
          {liveMantras.length > 0 ? (
            <View style={{ marginBottom: 14 }}>
              <Heading text="Sacred Maha Mantras (Live Shlokas)" icon="🕉️" />
              {liveMantras.map((m: any, idx: number) => (
                <Card key={m.id || idx} padding={16} mb={10}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 14.5, fontWeight: '800', flex: 1 }}>
                      {m.title || m.name}
                    </Text>
                    {m.deity && <Chip label={m.deity} />}
                  </View>

                  {m.sanskrit ? (
                    <Text
                      style={{
                        marginTop: 10,
                        color: colors.goldAccent,
                        fontSize: 14,
                        fontWeight: '700',
                        lineHeight: 22,
                      }}
                    >
                      {m.sanskrit}
                    </Text>
                  ) : null}

                  {m.transliteration ? (
                    <Text
                      style={{
                        marginTop: 6,
                        color: colors.textSecondary,
                        fontSize: 12,
                        fontStyle: 'italic',
                        lineHeight: 18,
                      }}
                    >
                      {m.transliteration}
                    </Text>
                  ) : null}

                  {m.meaning ? (
                    <Text style={{ marginTop: 8, color: colors.textMuted, fontSize: 11.5, lineHeight: 17 }}>
                      {`Meaning: ${m.meaning}`}
                    </Text>
                  ) : null}

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                    {m.japaCount && <Chip label={`📿 ${m.japaCount}`} />}
                    {m.bestTime && <Chip label={`⏰ ${m.bestTime}`} />}
                    {m.mala && <Chip label={`✨ ${m.mala}`} />}
                  </View>

                  {m.benefits ? (
                    <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.cardBorder }}>
                      <Text style={{ color: colors.goldAccent, fontSize: 11, fontWeight: '700' }}>
                        {`Benefits: ${m.benefits}`}
                      </Text>
                    </View>
                  ) : null}
                </Card>
              ))}
            </View>
          ) : null}

          <Heading text="Navagraha Sacred Japa Mantras" icon="✨" />
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
    }

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

    case 'Homa': {
      const liveHomams: any[] = dynamicData?.homams ? Object.values(dynamicData.homams) : [];
      return (
        <View>
          {liveHomams.length > 0 ? (
            <View style={{ marginBottom: 14 }}>
              <Heading text="Prescribed Sacred Homams (Live)" icon="🔥" />
              {liveHomams.map((h: any, idx: number) => (
                <Card key={h.id || idx} padding={16} mb={12}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '800', flex: 1 }}>
                      {h.name}
                    </Text>
                    {h.deity && <Chip label={h.deity} />}
                  </View>

                  {h.sanskritName ? (
                    <Text style={{ marginTop: 2, color: colors.goldAccent, fontSize: 13, fontWeight: '700' }}>
                      {h.sanskritName}
                    </Text>
                  ) : null}

                  {h.purpose ? (
                    <Text style={{ marginTop: 6, color: colors.textSecondary, fontSize: 12.5, lineHeight: 18 }}>
                      {h.purpose}
                    </Text>
                  ) : null}

                  {h.ahutiMantra ? (
                    <View style={{ marginTop: 10, padding: 10, borderRadius: 12, backgroundColor: withAlpha(colors.goldAccent, 14), borderWidth: 1, borderColor: withAlpha(colors.goldAccent, 35) }}>
                      <Text style={{ color: colors.goldAccent, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>
                        Ahuti Mantra
                      </Text>
                      <Text style={{ marginTop: 4, color: colors.textPrimary, fontSize: 13, fontWeight: '700', lineHeight: 20 }}>
                        {h.ahutiMantra}
                      </Text>
                      {h.mantraTransliteration ? (
                        <Text style={{ marginTop: 4, color: colors.textMuted, fontSize: 11, fontStyle: 'italic' }}>
                          {h.mantraTransliteration}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                    {h.day && <Chip label={`📅 ${h.day}`} />}
                    {h.duration && <Chip label={`⏳ ${h.duration}`} />}
                    {h.japaCount && <Chip label={`📿 ${h.japaCount}`} />}
                  </View>

                  {h.materials ? (
                    <Text style={{ marginTop: 8, color: colors.textMuted, fontSize: 11 }}>
                      {`Materials: ${h.materials}`}
                    </Text>
                  ) : null}

                  {h.benefits ? (
                    <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.cardBorder }}>
                      <Text style={{ color: colors.goldAccent, fontSize: 11, fontWeight: '700' }}>
                        {`Benefits: ${h.benefits}`}
                      </Text>
                    </View>
                  ) : null}
                </Card>
              ))}
            </View>
          ) : null}

          <Heading text="Classical Sacred Homams" icon="🔥" />
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
    }

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
                  {`${g.gem} (${g.planet})`}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                  {`Metal: ${g.metal} • Finger: ${g.finger}`}
                </Text>
              </View>
              <Chip label={g.day} />
            </Card>
          ))}
        </View>
      );

    case 'Rudraksha':
      return (
        <View>
          <Heading text="Sacred Mukhi Rudrakshas" icon="📿" />
          {MUKHIS.map((m) => (
            <Card key={m.mukhi}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>
                  {`${m.mukhi} Mukhi Rudraksha`}
                </Text>
                <Chip label={m.deity} />
              </View>
              <Text
                style={{
                  marginTop: 6,
                  color: colors.goldAccent,
                  fontSize: 12.5,
                  fontWeight: '600',
                }}
              >
                {m.benefit}
              </Text>
            </Card>
          ))}
        </View>
      );

    case 'Vastu': {
      const liveDirections: any[] = Array.isArray(dynamicData?.ashtaDirections)
        ? dynamicData.ashtaDirections
        : [];
      return (
        <View>
          <Heading text="8-Directional Vastu Science (Ashta-Digbandhana)" icon="🏛️" />
          {(liveDirections.length > 0 ? liveDirections : VASTU_DIRECTIONS).map((d: any, idx: number) => {
            const dirLabel = d.direction || d.dir || `Direction ${idx + 1}`;
            const deityLabel = d.deity || '';
            const planetLabel = d.planet || '';
            const elementLabel = d.element || '';
            const remedyAction = d.remedy || d.area || '';
            const purposeLabel = d.purpose || '';

            return (
              <Card key={dirLabel} padding={14} mb={10}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 20 : 30),
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 10,
                      }}
                    >
                      <Text style={{ color: colors.goldAccent, fontSize: 16, fontWeight: '800' }}>
                        {dirLabel.substring(0, 1)}
                      </Text>
                    </View>
                    <View>
                      <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>
                        {dirLabel}
                      </Text>
                      {elementLabel || planetLabel ? (
                        <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                          {`${elementLabel}${planetLabel ? ` • Graha: ${planetLabel}` : ''}`}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  {deityLabel ? <Chip label={deityLabel} /> : null}
                </View>

                {remedyAction ? (
                  <View style={{ marginTop: 8, padding: 8, borderRadius: 10, backgroundColor: withAlpha(colors.goldAccent, 10) }}>
                    <Text style={{ color: colors.goldAccent, fontSize: 10.5, fontWeight: '700', textTransform: 'uppercase' }}>
                      Prescribed Parihar
                    </Text>
                    <Text style={{ color: colors.textPrimary, fontSize: 12, marginTop: 2, fontWeight: '600' }}>
                      {remedyAction}
                    </Text>
                  </View>
                ) : null}

                {purposeLabel ? (
                  <Text style={{ marginTop: 6, color: colors.textSecondary, fontSize: 11.5 }}>
                    {`Purpose: ${purposeLabel}`}
                  </Text>
                ) : null}
              </Card>
            );
          })}
        </View>
      );
    }

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

/**
 * 48-Day Sacred Mandala Parihar Protocol Component
 * Dynamically loaded from backend API.
 */
function MandalaProtocolCard({ protocol }: { protocol: any }) {
  const colors = useThemeColors();
  if (!protocol) return null;

  return (
    <LinearGradient
      colors={
        colors.isLight
          ? ['#FFFDF9', '#FAF3E8']
          : [withAlpha(colors.goldAccent, 25), colors.surfaceVariant]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        marginTop: 14,
        padding: 18,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: colors.goldAccent,
        shadowColor: colors.goldAccent,
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Text style={{ fontSize: 20, marginRight: 8 }}>📜</Text>
          <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '800' }}>
            {protocol.title || '48-Day Sacred Mandala Parihar Protocol'}
          </Text>
        </View>
        <Chip label={`${protocol.totalDays || 48} Days`} />
      </View>

      {protocol.mandalaPurpose ? (
        <Text style={{ color: colors.textSecondary, fontSize: 12.5, lineHeight: 18, marginTop: 4 }}>
          {protocol.mandalaPurpose}
        </Text>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 10 }}>
        {protocol.presidingDeity && <Chip label={`🪔 Deity: ${protocol.presidingDeity}`} />}
        {protocol.dailyMantra && <Chip label={`🕉️ ${protocol.dailyMantra}`} />}
        {protocol.dailyJapaCount && <Chip label={`📿 ${protocol.dailyJapaCount}`} />}
        {protocol.lampOffering && <Chip label={`🪔 ${protocol.lampOffering}`} />}
      </View>

      {/* Protocol Milestones */}
      {protocol.initiationDay1 ? (
        <View style={{ marginTop: 8, padding: 10, borderRadius: 12, backgroundColor: withAlpha(colors.goldAccent, 12) }}>
          <Text style={{ color: colors.goldAccent, fontSize: 11, fontWeight: '800' }}>
            {protocol.initiationDay1.title || 'Day 1: Prathama Sankalpa'}
          </Text>
          <Text style={{ color: colors.textPrimary, fontSize: 12, marginTop: 3, lineHeight: 17 }}>
            {protocol.initiationDay1.action}
          </Text>
        </View>
      ) : null}

      {protocol.midMandalaMilestoneDay24 ? (
        <View style={{ marginTop: 8, padding: 10, borderRadius: 12, backgroundColor: withAlpha(colors.goldAccent, 12) }}>
          <Text style={{ color: colors.goldAccent, fontSize: 11, fontWeight: '800' }}>
            {protocol.midMandalaMilestoneDay24.title || 'Day 24: Madhyama Shanti'}
          </Text>
          <Text style={{ color: colors.textPrimary, fontSize: 12, marginTop: 3, lineHeight: 17 }}>
            {protocol.midMandalaMilestoneDay24.action}
          </Text>
        </View>
      ) : null}

      {protocol.culminationDay48 ? (
        <View style={{ marginTop: 8, padding: 10, borderRadius: 12, backgroundColor: withAlpha(colors.goldAccent, 12) }}>
          <Text style={{ color: colors.goldAccent, fontSize: 11, fontWeight: '800' }}>
            {protocol.culminationDay48.title || 'Day 48: Purnahuti Completion'}
          </Text>
          <Text style={{ color: colors.textPrimary, fontSize: 12, marginTop: 3, lineHeight: 17 }}>
            {protocol.culminationDay48.action}
          </Text>
        </View>
      ) : null}
    </LinearGradient>
  );
}

export default function RemedyDetailScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const rawRemedy = useExtra<Remedy>();
  const remedy = rawRemedy || REMEDIES[0];
  const { name } = remedy;

  const [dynamicPayload, setDynamicPayload] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;

    // 1. Load cached payload instantly
    AsyncStorage.getItem(STORAGE_REMEDY_PAYLOAD_CACHE)
      .then((cached) => {
        if (cached && isMounted) {
          try {
            setDynamicPayload(JSON.parse(cached));
          } catch {}
        }
      })
      .catch(() => {});

    // 2. Fetch live data from backend remedies & services APIs
    async function loadLiveData() {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6000);

        const [remRes, servRes] = await Promise.all([
          fetch(API_ENDPOINTS.remedies, { signal: controller.signal }).catch(() => null),
          fetch(API_ENDPOINTS.services, { signal: controller.signal }).catch(() => null),
        ]);
        clearTimeout(timer);

        let combined: any = {};
        if (remRes && remRes.ok) {
          const rJson = await remRes.json();
          if (rJson && rJson.success) combined = { ...combined, ...rJson };
        }
        if (servRes && servRes.ok) {
          const sJson = await servRes.json();
          if (sJson && sJson.success && Array.isArray(sJson.categories)) {
            const remCat = sJson.categories.find(
              (c: any) => c.id === 'cat-remedies' || c.category === 'remedies'
            );
            if (remCat) combined.categoryRemedies = remCat;
          }
        }

        if (isMounted && Object.keys(combined).length > 0) {
          setDynamicPayload(combined);
          AsyncStorage.setItem(STORAGE_REMEDY_PAYLOAD_CACHE, JSON.stringify(combined)).catch(() => {});
        }
      } catch {}
    }

    loadLiveData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Match live remedy metadata from backend cat-remedies items if available
  const liveRemedyItem = dynamicPayload?.categoryRemedies?.items?.find(
    (it: any) =>
      it.name?.toLowerCase().includes(name.toLowerCase().split(' ')[0]) ||
      it.id?.toLowerCase().includes(name.toLowerCase().split(' ')[0]) ||
      it.direction?.toLowerCase() === remedy.direction?.toLowerCase()
  );

  const displayName = liveRemedyItem?.name || name;
  const displaySanskrit = liveRemedyItem?.sanskrit || remedy.sanskrit;
  const displayDesc = liveRemedyItem?.desc || remedy.desc;
  const displayMantra = liveRemedyItem?.mantra || remedy.mantra;
  const displayDirection = liveRemedyItem?.direction || remedy.direction;
  const displayDirectionHindi = liveRemedyItem?.directionHindi || remedy.directionHindi;

  const data = getRemedyData(name);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="remedyDetail.screen">
      <AppBar
        title={displayName}
        backgroundColor={colors.background}
        backColor={colors.textPrimary}
        leading={<BoxBackButton testID="remedyDetail.back" onPress={() => router.back()} />}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(32, insets.bottom + 24) }}
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
            {displayName}
          </Text>
          {displaySanskrit ? (
            <Text
              style={{
                marginTop: 2,
                color: colors.goldAccent,
                fontSize: 16,
                fontWeight: '700',
                textAlign: 'center',
              }}
            >
              {displaySanskrit}
            </Text>
          ) : null}

          {displayDirection && (
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
                {`🧭 ${displayDirection}${displayDirectionHindi ? ` (${displayDirectionHindi})` : ''}`}
              </Text>
            </View>
          )}

          {displayMantra ? (
            <View
              style={{
                marginTop: 12,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 12,
                backgroundColor: withAlpha(colors.goldAccent, 14),
                borderWidth: 1,
                borderColor: withAlpha(colors.goldAccent, 40),
              }}
            >
              <Text style={{ color: colors.goldAccent, fontSize: 13, fontWeight: '700', textAlign: 'center' }}>
                {displayMantra}
              </Text>
            </View>
          ) : null}

          <Text
            style={{
              marginTop: 12,
              color: colors.textSecondary,
              textAlign: 'center',
              fontSize: 13,
              lineHeight: 19,
            }}
          >
            {displayDesc || data.shortDesc}
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
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
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
                Core Spiritual Benefits
              </Text>
            </View>

            {data.benefits.map((b, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  marginBottom: i < data.benefits.length - 1 ? 8 : 0,
                }}
              >
                <Text style={{ color: colors.goldAccent, marginRight: 8, fontSize: 14 }}>✦</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13, flex: 1, lineHeight: 18 }}>
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

          {/* Specific Content for this Remedy (Mantras, Homams, Vastu Directions, etc.) */}
          <SpecificContent name={name} dynamicData={dynamicPayload} />

          {/* 48-Day Sacred Mandala Parihar Protocol */}
          <MandalaProtocolCard protocol={dynamicPayload?.protocol} />
        </View>

        {/* Action Buttons */}
        <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 }}>
          <ElevatedButton
            testID="remedyDetail.askAi"
            label="🤖 Ask AI Astrologer About This Remedy"
            onPress={() =>
              push(AppRoutes.aiChatScreen, {
                astrologerId: 'vedika',
                initialPrompt: `Namaste, please guide me on how to perform the Vedic remedy '${displayName}' (${displaySanskrit}) for my planetary benefits.`,
              })
            }
            radius={100}
            paddingV={14}
            fontSize={14}
            fontWeight="700"
            bg="#713B32"
            fg="#FFFFFF"
          />
          <View style={{ marginTop: 10 }}>
            <OutlinedButton
              testID="remedyDetail.astrologer"
              label="👨‍🔮 Consult Live Astrologer"
              onPress={() => push(AppRoutes.liveAstrologersScreen)}
              radius={100}
              paddingV={13}
              fontSize={13}
              color={colors.textPrimary}
              borderColor={colors.cardBorder}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
