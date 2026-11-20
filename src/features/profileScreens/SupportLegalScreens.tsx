/**
 * Support & Legal Screens — 100% Dynamic Content with offline cache,
 * live Admin Panel sync, pull-to-refresh, interactive FAQ topic filtering,
 * and live Firestore support ticket submission.
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Keyboard, Linking, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { ElevatedButton } from '@/components/common';
import { showSnackBar } from '@/components/overlays';
import { lh, Text, TextInput } from '@/components/Text';
import { API_ENDPOINTS } from '@/config/api';
import { useAuthStore } from '@/features/auth/authStore';
import { AppRoutes, pop, push } from '@/navigation/routes';
import { AppContactOption, useSupportLegalStore } from '@/services/supportLegalStore';
import { withAlpha } from '@/theme/colors';
import { useTranslation } from '@/theme/languageStore';
import { useThemeColors } from '@/theme/themeStore';

const H = ({ children, mt = 0 }: { children: string; mt?: number }) => {
  const colors = useThemeColors();
  return (
    <Text style={{ marginTop: mt, marginBottom: 12, color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>
      {children}
    </Text>
  );
};

export function HelpCentreScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [focused, setFocused] = useState(false);
  const [gridW, setGridW] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const help = useSupportLegalStore((s) => s.content.helpCentre);
  const fetchContent = useSupportLegalStore((s) => s.fetchContent);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchContent();
    setRefreshing(false);
  };

  const cell = gridW > 0 ? (gridW - 20) / 3 : 0;
  const filtered = (help.faqs || [])
    .map((f, i) => ({ ...f, i }))
    .filter((f) => {
      const matchesCategory =
        !selectedCategory || (f.category && f.category.toLowerCase() === selectedCategory.toLowerCase());
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        f.q.toLowerCase().includes(q) ||
        f.a.toLowerCase().includes(q) ||
        (f.category && f.category.toLowerCase().includes(q));
      return matchesCategory && matchesQuery;
    });

  const toggle = (i: number) =>
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  const handleCategoryPress = (title: string) => {
    if (selectedCategory?.toLowerCase() === title.toLowerCase()) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(title);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="helpCentre.screen">
      <AppBar
        title={t('profile.helpCentre', help.appBarTitle || 'Help Centre')}
        onBack={pop}
        testIDPrefix="helpCentre"
        backgroundColor={colors.background}
        backColor={colors.textPrimary}
      />
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.goldAccent} />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: Math.max(150, insets.bottom + 90) }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            height: 52,
            borderRadius: 14,
            backgroundColor: colors.surface,
            borderWidth: focused ? 1.5 : 1,
            borderColor: focused ? colors.goldAccent : colors.cardBorder,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <AppIcon name="search_rounded" color={colors.textMuted} style={{ marginHorizontal: 12 }} />
          <TextInput
            testID="helpCentre.search"
            value={query}
            onChangeText={setQuery}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={help.searchPlaceholder || 'Search help articles...'}
            style={{ flex: 1, fontSize: 15 }}
          />
          {query ? (
            <Pressable
              testID="helpCentre.search.clear"
              onPress={() => setQuery('')}
              style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}
            >
              <AppIcon name="clear_rounded" color={colors.textMuted} size={18} />
            </Pressable>
          ) : null}
        </View>
        <View style={{ height: 20 }} />
        {!query ? (
          <>
            <Pressable testID="helpCentre.contactSupport" onPress={() => push(AppRoutes.contactSupportScreen)}>
              <LinearGradient
                colors={
                  colors.isLight
                    ? ['#FFF9F0', '#F2E9DE']
                    : [withAlpha(colors.goldAccent, 25), colors.surfaceVariant]
                }
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{
                  padding: 16,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 28 }}>{help.needHelpBanner?.emoji || '🎧'}</Text>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>
                    {help.needHelpBanner?.title || 'Need more help?'}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                    {help.needHelpBanner?.subtitle || 'Our Vedic support team is available 24/7'}
                  </Text>
                </View>
                <AppIcon name="chevron_right_rounded" color={colors.goldAccent} />
              </LinearGradient>
            </Pressable>
            <H mt={20}>{help.browseTopicsTitle || 'Browse by Topic'}</H>
            <View
              style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}
              onLayout={(e) => setGridW(e.nativeEvent.layout.width)}
            >
              {cell > 0 &&
                (help.categories || []).map((c) => {
                  const isSelected = selectedCategory?.toLowerCase() === c.title.toLowerCase();
                  const liveCount = (help.faqs || []).filter(
                    (f) => f.category?.toLowerCase() === c.title.toLowerCase()
                  ).length;
                  return (
                    <Pressable
                      key={c.title}
                      onPress={() => handleCategoryPress(c.title)}
                      style={{
                        width: cell,
                        height: cell / 1.05,
                        borderRadius: 14,
                        backgroundColor: isSelected
                          ? withAlpha(c.color, colors.isLight ? 40 : 45)
                          : withAlpha(c.color, colors.isLight ? 15 : 20),
                        borderWidth: isSelected ? 2 : 1,
                        borderColor: isSelected ? c.color : withAlpha(c.color, 60),
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: 4,
                      }}
                    >
                      <Text style={{ fontSize: 22 }}>{c.emoji}</Text>
                      <Text
                        numberOfLines={2}
                        style={{
                          marginTop: 4,
                          color: isSelected ? colors.textPrimary : c.color,
                          fontSize: 10.5,
                          fontWeight: isSelected ? '800' : '700',
                          textAlign: 'center',
                        }}
                      >
                        {c.title}
                      </Text>
                      <Text style={{ color: colors.textMuted, fontSize: 9, marginTop: 2 }}>
                        {`${liveCount || c.count || 0} FAQs`}
                      </Text>
                    </Pressable>
                  );
                })}
            </View>
            <View style={{ height: 24 }} />
          </>
        ) : null}

        <H>{help.faqsTitle || 'Frequently Asked Questions'}</H>

        {selectedCategory ? (
          <View
            style={{
              marginBottom: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 20 : 25),
              borderWidth: 1,
              borderColor: colors.goldAccent,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
              <AppIcon name="filter_alt_rounded" color={colors.goldAccent} size={18} />
              <Text
                numberOfLines={1}
                style={{ marginLeft: 6, color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}
              >
                {`${selectedCategory} (${filtered.length} FAQs)`}
              </Text>
            </View>
            <Pressable
              onPress={() => setSelectedCategory(null)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 8,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }}
            >
              <Text style={{ color: colors.goldAccent, fontSize: 11, fontWeight: '700' }}>✕ Show All</Text>
            </Pressable>
          </View>
        ) : null}

        {filtered.map((f) => {
          const isExp = expanded.has(f.i);
          return (
            <View
              key={f.i}
              style={{
                marginBottom: 8,
                borderRadius: 14,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: isExp ? colors.goldAccent : colors.cardBorder,
              }}
            >
              <Pressable
                testID={`helpCentre.faq.${f.i}`}
                onPress={() => toggle(f.i)}
                style={{ padding: 14, flexDirection: 'row', alignItems: 'flex-start' }}
              >
                <View style={{ flex: 1 }}>
                  {f.category ? (
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: colors.goldAccent,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        marginBottom: 4,
                      }}
                    >
                      {f.category}
                    </Text>
                  ) : null}
                  <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600', lineHeight: 18 }}>
                    {f.q}
                  </Text>
                </View>
                <AppIcon
                  name={isExp ? 'keyboard_arrow_up_rounded' : 'keyboard_arrow_down_rounded'}
                  color={colors.goldAccent}
                  size={20}
                  style={{ marginLeft: 8, marginTop: 2 }}
                />
              </Pressable>
              {isExp ? (
                <Text style={{ paddingHorizontal: 14, paddingBottom: 14, color: colors.textSecondary, ...lh(12.5, 1.6) }}>
                  {f.a}
                </Text>
              ) : null}
            </View>
          );
        })}
        {filtered.length === 0 ? (
          <Text testID="helpCentre.noResults" style={{ paddingVertical: 40, textAlign: 'center', color: colors.textMuted }}>
            {help.noResultsText || 'No results found'}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

function FormField({
  label,
  hint,
  value,
  onChangeText,
  multiline,
  testID,
}: {
  label: string;
  hint: string;
  value: string;
  onChangeText: (v: string) => void;
  multiline?: boolean;
  testID: string;
}) {
  const colors = useThemeColors();
  const [focused, setFocused] = useState(false);
  return (
    <View>
      <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{label}</Text>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={hint}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={{
          fontSize: 13,
          paddingHorizontal: 12,
          paddingVertical: 10,
          minHeight: multiline ? 96 : undefined,
          borderRadius: 12,
          backgroundColor: colors.surfaceVariant,
          borderWidth: focused ? 1.5 : 1,
          borderColor: focused ? colors.goldAccent : colors.cardBorder,
        }}
      />
    </View>
  );
}

export function ContactSupportScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const authUser = useAuthStore((s) => s.user);

  const contact = useSupportLegalStore((s) => s.content.contactSupport);
  const fetchContent = useSupportLegalStore((s) => s.fetchContent);

  const [refreshing, setRefreshing] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchContent();
    setRefreshing(false);
  };

  const handleContactAction = (o: AppContactOption) => {
    if (o.value) {
      Linking.openURL(o.value).catch(() => {
        showSnackBar(`Could not open ${o.title}. Please try again.`, colors.surfaceVariant);
      });
      return;
    }
    if (o.actionType === 'chat') {
      push(AppRoutes.aiChatScreen);
      return;
    }
    showSnackBar(`Connecting to ${o.title}...`, colors.surfaceVariant);
  };

  const handleSubmitTicket = async () => {
    if (submitting) return;
    if (!subject.trim() || !description.trim()) {
      showSnackBar('Please enter both Subject and Description to submit your ticket.', '#CF4444');
      return;
    }
    Keyboard.dismiss();
    setSubmitting(true);
    try {
      const res = await fetch(API_ENDPOINTS.supportTickets, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          description: description.trim(),
          userName: authUser?.name || 'Guest Seeker',
          userPhone: authUser?.phone || '',
          userEmail: authUser?.email || '',
          userUid: authUser?.uid || '',
          source: 'mobile-app',
        }),
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        setSubject('');
        setDescription('');
        showSnackBar(
          data.message || contact.ticketSuccessMessage || `Support ticket submitted! Ticket ID #${data.ticketId}`,
          '#2D9E6B'
        );
      } else {
        showSnackBar(data?.error || 'Could not submit ticket. Please try again.', '#CF4444');
      }
    } catch {
      showSnackBar('Network error submitting ticket. Please try again.', '#CF4444');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="contactSupport.screen">
      <AppBar
        title={t('profile.contactSupport', contact.appBarTitle || 'Contact Support')}
        onBack={pop}
        testIDPrefix="contactSupport"
        backgroundColor={colors.background}
        backColor={colors.textPrimary}
      />
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.goldAccent} />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: Math.max(150, insets.bottom + 90) }}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={
            colors.isLight
              ? ['#FFF9F0', '#F2E9DE']
              : [withAlpha(colors.goldAccent, 25), colors.surfaceVariant]
          }
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ padding: 20, borderRadius: 20, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center' }}
        >
          <Text style={{ fontSize: 40 }}>{contact.banner?.emoji || '🎧'}</Text>
          <Text style={{ marginTop: 10, color: colors.textPrimary, fontSize: 18, fontWeight: '700' }}>
            {contact.banner?.title || "We're Here to Help"}
          </Text>
          <Text style={{ marginTop: 6, color: colors.textMuted, fontSize: 12, textAlign: 'center' }}>
            {contact.banner?.subtitle ||
              'Our customer care team is available 24/7 to assist you with any questions or consultations.'}
          </Text>
          <View style={{ marginTop: 12, flexDirection: 'row', gap: 20 }}>
            {(contact.responseTimes || []).map(([l, timeStr]) => (
              <View key={l} style={{ alignItems: 'center' }}>
                <Text style={{ color: colors.goldAccent, fontSize: 12, fontWeight: '700' }}>{timeStr}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 10 }}>{l}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <H mt={24}>{contact.optionsTitle || 'Contact Options'}</H>
        {(contact.options || []).map((o) => (
          <Pressable
            key={o.title}
            onPress={() => handleContactAction(o)}
            style={{
              marginBottom: 10,
              padding: 14,
              borderRadius: 16,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: withAlpha(o.color, colors.isLight ? 20 : 25),
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 22 }}>{o.emoji}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>{o.title}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>{o.desc}</Text>
            </View>
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: withAlpha(o.color, 25),
                borderWidth: 1,
                borderColor: withAlpha(o.color, 80),
              }}
            >
              <Text style={{ color: o.color, fontSize: 11, fontWeight: '700' }}>{o.action}</Text>
            </View>
          </Pressable>
        ))}

        <H mt={24}>{contact.ticketTitle || 'Submit a Ticket'}</H>
        <View
          style={{
            padding: 16,
            borderRadius: 18,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            gap: 12,
          }}
        >
          <FormField
            testID="contactSupport.subject"
            label={contact.ticketSubjectLabel || 'Subject'}
            hint={contact.ticketSubjectHint || 'Briefly describe your inquiry'}
            value={subject}
            onChangeText={setSubject}
          />
          <FormField
            testID="contactSupport.description"
            label={contact.ticketDescLabel || 'Description'}
            hint={contact.ticketDescHint || 'Provide more details...'}
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <ElevatedButton
            testID="contactSupport.submit"
            label={submitting ? 'Submitting Ticket...' : contact.ticketButtonLabel || 'Submit Ticket'}
            onPress={handleSubmitTicket}
            disabled={submitting}
            loading={submitting}
            radius={12}
            paddingV={14}
            fontSize={14}
            style={{ marginTop: 4 }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function LegalScreen({
  title,
  emoji,
  lastUpdated,
  sections,
  testID,
  onRefresh,
  refreshing,
}: {
  title: string;
  emoji: string;
  lastUpdated?: string;
  sections: [string, string][];
  testID: string;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID={testID}>
      <AppBar
        title={title}
        onBack={pop}
        testIDPrefix={testID.split('.')[0]}
        backgroundColor={colors.background}
        backColor={colors.textPrimary}
      />
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.goldAccent} />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: Math.max(150, insets.bottom + 90) }}
      >
        <View
          style={{
            padding: 14,
            borderRadius: 14,
            backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 20 : 15),
            borderWidth: 1,
            borderColor: colors.cardBorder,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 20 }}>{emoji}</Text>
          <View style={{ marginLeft: 10 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>{title}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 11 }}>{lastUpdated || 'Last updated: January 2026'}</Text>
          </View>
        </View>
        <View style={{ height: 20 }} />
        {sections.map(([heading, body]) => (
          <View key={heading} style={{ marginBottom: 20 }}>
            <Text style={{ color: colors.goldAccent, fontSize: 14, fontWeight: '700' }}>{heading}</Text>
            <Text style={{ marginTop: 8, color: colors.textSecondary, ...lh(13, 1.6) }}>{body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export function TermsOfServiceScreen() {
  const { t } = useTranslation();
  const terms = useSupportLegalStore((s) => s.content.terms);
  const fetchContent = useSupportLegalStore((s) => s.fetchContent);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchContent();
    setRefreshing(false);
  };

  return (
    <LegalScreen
      testID="terms.screen"
      title={t('profile.terms', terms.title || 'Terms of Service')}
      emoji={terms.emoji || '⚖️'}
      lastUpdated={terms.lastUpdated}
      sections={terms.sections || []}
      onRefresh={onRefresh}
      refreshing={refreshing}
    />
  );
}

export function PrivacyPolicyScreen() {
  const { t } = useTranslation();
  const privacyPolicy = useSupportLegalStore((s) => s.content.privacyPolicy);
  const fetchContent = useSupportLegalStore((s) => s.fetchContent);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchContent();
    setRefreshing(false);
  };

  return (
    <LegalScreen
      testID="privacyPolicy.screen"
      title={t('profile.privacyPolicy', privacyPolicy.title || 'Privacy Policy')}
      emoji={privacyPolicy.emoji || '🔒'}
      lastUpdated={privacyPolicy.lastUpdated}
      sections={privacyPolicy.sections || []}
      onRefresh={onRefresh}
      refreshing={refreshing}
    />
  );
}
