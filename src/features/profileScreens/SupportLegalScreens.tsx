/**
 * Port of lib/presentation/profile_screens/support_legal_screens.dart
 * (HelpCentreScreen, ContactSupportScreen, TermsOfServiceScreen, PrivacyPolicyScreen).
 * - Help: FAQ search on question text; banner hidden while searching; expand/collapse; "No results found"
 * - Contact: "Submit Ticket" shows success SnackBar. The source performs NO validation and does not clear
 *   fields — preserved. Contact option pills + topic tiles have no handlers in source → display only.
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { AppBar } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { ElevatedButton } from '@/components/common';
import { showSnackBar } from '@/components/overlays';
import { lh, Text, TextInput } from '@/components/Text';
import { AppRoutes, pop, push } from '@/navigation/routes';
import { AppColors, withAlpha } from '@/theme/colors';

const CATEGORIES = [
  { emoji: '🔮', title: 'Getting Started', count: 8, color: '#9370DB' },
  { emoji: '💬', title: 'Consultations', count: 12, color: '#4FC3F7' },
  { emoji: '💳', title: 'Payments & Wallet', count: 10, color: '#FFD700' },
  { emoji: '📜', title: 'Reports & Kundli', count: 7, color: '#FF6B6B' },
  { emoji: '👤', title: 'Account & Profile', count: 9, color: '#81C784' },
  { emoji: '🔒', title: 'Privacy & Security', count: 6, color: '#FFB347' },
];
const FAQS = [
  { q: 'How do I start a consultation with an astrologer?', a: 'Go to the Astrologers tab, browse available astrologers, and tap Chat or Call on any astrologer card. Ensure you have sufficient wallet balance before starting.' },
  { q: 'How is my birth chart calculated?', a: 'AstroParihar uses traditional Vedic (Jyotish) calculations based on your exact birth date, time, and place. The chart uses the Lahiri ayanamsha system, which is the standard for Vedic astrology.' },
  { q: 'Can I get a refund for a consultation?', a: 'If a consultation ends within 5 minutes due to technical issues, the amount is automatically refunded to your wallet. For other concerns, contact our support team within 24 hours.' },
  { q: 'How do I add money to my wallet?', a: 'Go to Profile → Wallet → Add Money. Select an amount and choose your payment method (UPI, Card, or Net Banking). The amount is credited instantly.' },
  { q: 'Are my consultations private?', a: 'Yes. All consultations are completely private and confidential. Your birth details and conversation history are encrypted and never shared with third parties.' },
  { q: 'How accurate is the AI Astrologer?', a: 'AstroParihar AI is trained on classical Vedic texts and provides guidance based on your birth chart. For complex life decisions, we recommend consulting a human astrologer for deeper personalised insights.' },
  { q: 'Can I create profiles for family members?', a: 'Yes. Go to Profile → Birth Profiles → Add New Profile. You can create profiles for yourself, partner, children, and other family members.' },
];

const H = ({ children, mt = 0 }: { children: string; mt?: number }) => <Text style={{ marginTop: mt, marginBottom: 12, color: AppColors.textPrimary, fontSize: 16, fontWeight: '700' }}>{children}</Text>;

export function HelpCentreScreen() {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [focused, setFocused] = useState(false);
  const [gridW, setGridW] = useState(0);
  const cell = gridW > 0 ? (gridW - 20) / 3 : 0;
  const filtered = FAQS.map((f, i) => ({ ...f, i })).filter((f) => !query || f.q.toLowerCase().includes(query.toLowerCase()));
  const toggle = (i: number) => setExpanded((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; });

  return (
    <View style={{ flex: 1, backgroundColor: AppColors.backgroundDark }} testID="helpCentre.screen">
      <AppBar title="Help Centre" onBack={pop} testIDPrefix="helpCentre" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
        <View style={{ height: 52, borderRadius: 14, backgroundColor: AppColors.surfaceDark, borderWidth: focused ? 1.5 : 1, borderColor: focused ? AppColors.goldAccent : AppColors.goldBorder, flexDirection: 'row', alignItems: 'center' }}>
          <AppIcon name="search_rounded" color={AppColors.textMuted} style={{ marginHorizontal: 12 }} />
          <TextInput testID="helpCentre.search" value={query} onChangeText={setQuery} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder="Search help articles..." style={{ flex: 1, fontSize: 15 }} />
          {query ? (
            <Pressable testID="helpCentre.search.clear" onPress={() => setQuery('')} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
              <AppIcon name="clear_rounded" color={AppColors.textMuted} size={18} />
            </Pressable>
          ) : null}
        </View>
        <View style={{ height: 20 }} />
        {!query ? (
          <>
            <Pressable testID="helpCentre.contactSupport" onPress={() => push(AppRoutes.contactSupportScreen)}>
              <LinearGradient colors={[withAlpha(AppColors.primary, 80), AppColors.surfaceVariantDark]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ padding: 16, borderRadius: 16, borderWidth: 1, borderColor: AppColors.goldBorder, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 28 }}>🎧</Text>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ color: AppColors.textPrimary, fontSize: 14, fontWeight: '700' }}>Need more help?</Text>
                  <Text style={{ color: AppColors.textMuted, fontSize: 11 }}>Our support team is available 24/7</Text>
                </View>
                <AppIcon name="chevron_right_rounded" color={AppColors.goldAccent} />
              </LinearGradient>
            </Pressable>
            <H mt={20}>Browse by Topic</H>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }} onLayout={(e) => setGridW(e.nativeEvent.layout.width)}>
              {cell > 0 && CATEGORIES.map((c) => (
                <View key={c.title} style={{ width: cell, height: cell / 1.1, borderRadius: 14, backgroundColor: withAlpha(c.color, 15), borderWidth: 1, borderColor: withAlpha(c.color, 60), alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 22 }}>{c.emoji}</Text>
                  <Text numberOfLines={2} style={{ marginTop: 4, color: c.color, fontSize: 10, fontWeight: '600', textAlign: 'center' }}>{c.title}</Text>
                  <Text style={{ color: AppColors.textMuted, fontSize: 9 }}>{`${c.count} articles`}</Text>
                </View>
              ))}
            </View>
            <View style={{ height: 24 }} />
          </>
        ) : null}
        <H>Frequently Asked Questions</H>
        {filtered.map((f) => {
          const isExp = expanded.has(f.i);
          return (
            <View key={f.i} style={{ marginBottom: 8, borderRadius: 14, backgroundColor: AppColors.surfaceDark, borderWidth: 1, borderColor: isExp ? withAlpha(AppColors.goldAccent, 80) : AppColors.goldBorder }}>
              <Pressable testID={`helpCentre.faq.${f.i}`} onPress={() => toggle(f.i)} style={{ padding: 14, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ flex: 1, color: AppColors.textPrimary, fontSize: 13, fontWeight: '600' }}>{f.q}</Text>
                <AppIcon name={isExp ? 'keyboard_arrow_up_rounded' : 'keyboard_arrow_down_rounded'} color={AppColors.goldAccent} size={20} />
              </Pressable>
              {isExp ? <Text style={{ paddingHorizontal: 14, paddingBottom: 14, color: AppColors.textSecondary, ...lh(12, 1.5) }}>{f.a}</Text> : null}
            </View>
          );
        })}
        {filtered.length === 0 ? <Text testID="helpCentre.noResults" style={{ paddingVertical: 40, textAlign: 'center', color: AppColors.textMuted }}>No results found</Text> : null}
      </ScrollView>
    </View>
  );
}

function FormField({ label, hint, multiline, testID }: { label: string; hint: string; multiline?: boolean; testID: string }) {
  const [v, setV] = useState('');
  const [focused, setFocused] = useState(false);
  return (
    <View>
      <Text style={{ color: AppColors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{label}</Text>
      <TextInput
        testID={testID}
        value={v}
        onChangeText={setV}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={hint}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={{ fontSize: 13, paddingHorizontal: 12, paddingVertical: 10, minHeight: multiline ? 96 : undefined, borderRadius: 12, backgroundColor: AppColors.surfaceVariantDark, borderWidth: focused ? 1.5 : 1, borderColor: focused ? AppColors.goldAccent : AppColors.goldBorder }}
      />
    </View>
  );
}

export function ContactSupportScreen() {
  const options = [
    { emoji: '💬', title: 'Live Chat', desc: 'Chat with our support team instantly', color: '#4FC3F7', action: 'Start Chat' },
    { emoji: '📧', title: 'Email Support', desc: 'support@astroparihar.com', color: '#81C784', action: 'Send Email' },
    { emoji: '📞', title: 'Phone Support', desc: '+91 1800-XXX-XXXX (Toll Free)', color: '#FFB347', action: 'Call Now' },
    { emoji: '📱', title: 'WhatsApp', desc: 'Message us on WhatsApp', color: '#25D366', action: 'Open WhatsApp' },
  ];
  return (
    <View style={{ flex: 1, backgroundColor: AppColors.backgroundDark }} testID="contactSupport.screen">
      <AppBar title="Contact Support" onBack={pop} testIDPrefix="contactSupport" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={[withAlpha(AppColors.primary, 80), AppColors.surfaceVariantDark]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ padding: 20, borderRadius: 20, borderWidth: 1, borderColor: AppColors.goldBorder, alignItems: 'center' }}>
          <Text style={{ fontSize: 40 }}>🎧</Text>
          <Text style={{ marginTop: 10, color: AppColors.textPrimary, fontSize: 18, fontWeight: '700' }}>We&apos;re Here to Help</Text>
          <Text style={{ marginTop: 6, color: AppColors.textMuted, fontSize: 12, textAlign: 'center' }}>Our support team is available 24/7 to assist you with any questions or concerns.</Text>
          <View style={{ marginTop: 12, flexDirection: 'row', gap: 20 }}>
            {[['Chat', '< 2 min'], ['Email', '< 4 hrs'], ['Call', '< 5 min']].map(([l, t]) => (
              <View key={l} style={{ alignItems: 'center' }}>
                <Text style={{ color: AppColors.goldAccent, fontSize: 12, fontWeight: '700' }}>{t}</Text>
                <Text style={{ color: AppColors.textMuted, fontSize: 10 }}>{l}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>
        <H mt={24}>Contact Options</H>
        {options.map((o) => (
          <View key={o.title} style={{ marginBottom: 10, padding: 14, borderRadius: 16, backgroundColor: AppColors.surfaceDark, borderWidth: 1, borderColor: AppColors.goldBorder, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: withAlpha(o.color, 25), alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 22 }}>{o.emoji}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ color: AppColors.textPrimary, fontSize: 14, fontWeight: '600' }}>{o.title}</Text>
              <Text style={{ color: AppColors.textMuted, fontSize: 11 }}>{o.desc}</Text>
            </View>
            <View style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: withAlpha(o.color, 25), borderWidth: 1, borderColor: withAlpha(o.color, 80) }}>
              <Text style={{ color: o.color, fontSize: 11, fontWeight: '600' }}>{o.action}</Text>
            </View>
          </View>
        ))}
        <H mt={24}>Submit a Ticket</H>
        <View style={{ padding: 16, borderRadius: 18, backgroundColor: AppColors.surfaceDark, borderWidth: 1, borderColor: AppColors.goldBorder, gap: 12 }}>
          <FormField testID="contactSupport.subject" label="Subject" hint="Briefly describe your issue" />
          <FormField testID="contactSupport.description" label="Description" hint="Provide more details..." multiline />
          <ElevatedButton testID="contactSupport.submit" label="Submit Ticket" onPress={() => showSnackBar('Support ticket submitted successfully', AppColors.success)} radius={12} paddingV={14} fontSize={14} style={{ marginTop: 4 }} />
        </View>
      </ScrollView>
    </View>
  );
}

function LegalScreen({ title, emoji, sections, testID }: { title: string; emoji: string; sections: Array<[string, string]>; testID: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: AppColors.backgroundDark }} testID={testID}>
      <AppBar title={title} onBack={pop} testIDPrefix={testID.split('.')[0]} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 }}>
        <View style={{ padding: 14, borderRadius: 14, backgroundColor: withAlpha(AppColors.goldAccent, 15), borderWidth: 1, borderColor: AppColors.goldBorder, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 20 }}>{emoji}</Text>
          <View style={{ marginLeft: 10 }}>
            <Text style={{ color: AppColors.textPrimary, fontSize: 14, fontWeight: '700' }}>{title}</Text>
            <Text style={{ color: AppColors.textMuted, fontSize: 11 }}>Last updated: 1 January 2025</Text>
          </View>
        </View>
        <View style={{ height: 20 }} />
        {sections.map(([t, c]) => (
          <View key={t} style={{ marginBottom: 20 }}>
            <Text style={{ color: AppColors.goldAccent, fontSize: 14, fontWeight: '700' }}>{t}</Text>
            <Text style={{ marginTop: 8, color: AppColors.textSecondary, ...lh(13, 1.6) }}>{c}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export function TermsOfServiceScreen() {
  return (
    <LegalScreen
      testID="terms.screen"
      title="Terms of Service"
      emoji="⚖️"
      sections={[
        ['1. Acceptance of Terms', "By accessing or using AstroParihar's services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.\n\nAstroParihar provides astrology-related content, AI-powered guidance, and connections to professional astrologers for informational and entertainment purposes."],
        ['2. Services Provided', 'AstroParihar offers:\n• AI-powered astrology guidance\n• Live consultations with professional astrologers\n• Kundli generation and analysis\n• Horoscope reports and predictions\n• Vedic remedies and recommendations\n• Panchang and astrological calendar\n\nAll services are provided for informational purposes only and should not replace professional medical, legal, or financial advice.'],
        ['3. User Accounts', 'You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate birth details for accurate astrological analysis. You must be at least 18 years of age to use our services.'],
        ['4. Payments and Refunds', 'Wallet credits are non-refundable except in cases of technical failures. Consultation charges are deducted in real-time. Unused wallet balance can be used for future consultations. Refund requests must be submitted within 24 hours of a consultation.'],
        ['5. Disclaimer', 'Astrology is an ancient practice and AstroParihar does not guarantee the accuracy of predictions. Our services are for guidance purposes only. We do not promote fear-based astrology or guarantee specific outcomes. Always exercise your own judgment in life decisions.'],
        ['6. Privacy', 'Your birth data and consultation history are kept strictly confidential. We do not sell personal data to third parties. Please refer to our Privacy Policy for complete details.'],
        ['7. Contact', 'For questions about these Terms, contact us at:\nlegal@astroparihar.com\n\nAstroParihar\nMumbai, Maharashtra, India'],
      ]}
    />
  );
}

export function PrivacyPolicyScreen() {
  return (
    <LegalScreen
      testID="privacyPolicy.screen"
      title="Privacy Policy"
      emoji="🔒"
      sections={[
        ['1. Information We Collect', 'We collect the following information to provide our services:\n\n• Personal details: Name, email, phone number\n• Birth details: Date, time, and place of birth\n• Usage data: App interactions and preferences\n• Payment information: Transaction records (not card details)\n• Consultation history: Chat and call records'],
        ['2. How We Use Your Information', 'Your information is used to:\n• Generate accurate Kundli and horoscope reports\n• Connect you with appropriate astrologers\n• Provide personalised recommendations\n• Process payments and maintain wallet balance\n• Improve our AI astrology models\n• Send relevant notifications (with your consent)'],
        ['3. Data Security', 'AstroParihar employs industry-standard security measures:\n• End-to-end encryption for consultations\n• Secure payment processing\n• Regular security audits\n• Strict access controls\n\nYour birth data is treated as sensitive personal information and is never shared without your explicit consent.'],
        ['4. Data Sharing', 'We do not sell your personal data. We may share data with:\n• Astrologers (only birth details necessary for consultation)\n• Payment processors (for transaction processing)\n• Analytics providers (anonymised data only)\n\nWe never share your consultation content with third parties.'],
        ['5. Your Rights', 'You have the right to:\n• Access your personal data\n• Correct inaccurate information\n• Delete your account and data\n• Opt out of marketing communications\n• Download a copy of your data\n\nTo exercise these rights, contact privacy@astroparihar.com'],
        ['6. Cookies', 'We use cookies and similar technologies to improve your experience. You can control cookie settings through your device settings.'],
        ['7. Contact Us', 'For privacy-related queries:\nprivacy@astroparihar.com\n\nAstroParihar Privacy Team\nMumbai, Maharashtra, India'],
      ]}
    />
  );
}
