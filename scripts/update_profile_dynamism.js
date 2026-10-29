const fs = require('fs');
const path = require('path');

const WEB_ROOT = 'c:/Users/PC/Desktop/astroparihar';
const APP_ROOT = 'c:/Users/PC/Desktop/astroparihar-app';

console.log('=== Updating Profile Screen Dynamism for 100% Alphabet-Level Control ===');

// ==============================================================================
// 1. Update appDynamicContent.ts in Web Admin
// ==============================================================================
const appDynamicContentPath = path.join(WEB_ROOT, 'src/lib/appDynamicContent.ts');
let appDynamicContent = fs.readFileSync(appDynamicContentPath, 'utf8');

const updatedProfileDefinitions = `// ==========================================
// APP DYNAMIC: PROFILE SCREEN & MENU CONFIG
// ==========================================
export const PROFILE_CONFIG_DOC_ID = 'app_profile_config';

export interface AppProfileMenuItem {
  id: string;
  order: number;
  labelKey: string;
  defaultLabel: string;
  subtitle?: string;
  icon: string;
  route: string;
  action?: string;
  badge?: string;
  badgeColor?: string;
  active: boolean;
  value?: string;
}

export interface AppProfileSection {
  id: string;
  order: number;
  title: string;
  labelKey?: string;
  active: boolean;
  items: AppProfileMenuItem[];
}

export interface AppProfileConfig {
  headerTitle: string;
  welcomeGuestText: string;
  guestSubtitle: string;
  guestSignInButtonText: string;
  defaultMemberBadge: string;

  // Quick Stats
  showWalletStat: boolean;
  walletStatLabel: string;
  showConsultationStat: boolean;
  consultationStatLabel: string;
  showReportsStat: boolean;
  reportsStatLabel: string;

  // Astrological Signs Trio
  showAstroTrio: boolean;
  zodiacStatLabel: string;
  defaultZodiac: string;
  moonSignStatLabel: string;
  defaultMoonSign: string;
  nakshatraStatLabel: string;
  defaultNakshatra: string;

  // VIP Gold Promo Banner
  vipEnabled: boolean;
  vipBadge: string;
  vipTitle: string;
  vipSubtitle: string;
  vipCtaText: string;
  vipCtaRoute: string;
  vipEmoji: string;

  // Support Care Card
  showSupportCard: boolean;
  supportCardTitle: string;
  supportPhone: string;
  supportPhoneLabel: string;
  supportEmail: string;
  helplineHoursPrefix: string;
  helplineHours: string;

  // Sign In / Out
  signOutButtonText: string;
  signOutConfirmTitle: string;
  signOutConfirmMessage: string;
  cancelButtonText: string;

  // Edit Profile Sheet
  editProfileTitle: string;
  editNameLabel: string;
  editPhoneOrEmailLabel: string;
  editDobLabel: string;
  editTobLabel: string;
  editPobLabel: string;
  editSaveButtonText: string;

  // Footer & Sanskrit
  appVersionText: string;
  sanskritTagline: string;

  // Menu Sections & Items
  sections: AppProfileSection[];
  updatedAt?: string;
}

export const DEFAULT_APP_PROFILE_CONFIG: AppProfileConfig = {
  headerTitle: 'Profile',
  welcomeGuestText: 'Guest Explorer • Tap to Sign In',
  guestSubtitle: 'Sign in to sync your profile, birth charts & consultations',
  guestSignInButtonText: 'Sign In / Register',
  defaultMemberBadge: 'AstroParihar Member',

  showWalletStat: true,
  walletStatLabel: 'Wallet',
  showConsultationStat: true,
  consultationStatLabel: 'Consultations',
  showReportsStat: true,
  reportsStatLabel: 'Reports',

  showAstroTrio: true,
  zodiacStatLabel: 'Zodiac',
  defaultZodiac: 'Scorpio',
  moonSignStatLabel: 'Moon Sign',
  defaultMoonSign: 'Cancer',
  nakshatraStatLabel: 'Nakshatra',
  defaultNakshatra: 'Pushya',

  vipEnabled: true,
  vipBadge: 'ASTROPARIHAR GOLD',
  vipTitle: 'Unlock Sacred Kundli & Infinite Wisdom',
  vipSubtitle: 'Unlimited Kundli matching, detailed Mahadasha PDF reports, and 24/7 AI consultations.',
  vipCtaText: 'Upgrade to Gold Seeker',
  vipCtaRoute: '/wallet-screen',
  vipEmoji: '👑',

  showSupportCard: true,
  supportCardTitle: 'Spiritual Care & Help Desk',
  supportPhone: '+91 98765 43210',
  supportPhoneLabel: 'Helpline',
  supportEmail: 'support@astroparihar.com',
  helplineHoursPrefix: 'Helpline: ',
  helplineHours: 'Mon - Sun: 8:00 AM – 11:00 PM IST',

  signOutButtonText: 'Sign Out',
  signOutConfirmTitle: 'Sign Out',
  signOutConfirmMessage: 'Are you sure you want to sign out? Your astrological charts will remain securely saved.',
  cancelButtonText: 'Cancel',

  editProfileTitle: 'Edit Profile Details',
  editNameLabel: 'Full Name',
  editPhoneOrEmailLabel: 'Phone / Email',
  editDobLabel: 'Date of Birth (DD/MM/YYYY)',
  editTobLabel: 'Time of Birth (e.g. 10:30 AM)',
  editPobLabel: 'Place of Birth (City, State)',
  editSaveButtonText: 'Save Profile Details',

  appVersionText: 'AstroParihar v2.4.0 • Sacred Vedic Wisdom',
  sanskritTagline: '॥ लोकाः समस्ताः सुखिनो भवन्तु ॥',

  sections: [
    {
      id: 'my-astrology',
      order: 1,
      title: 'MY ASTROLOGY',
      labelKey: 'profile.myAstrology',
      active: true,
      items: [
        { id: 'myKundli', order: 1, labelKey: 'profile.myKundli', defaultLabel: 'My Kundli', subtitle: 'Your detailed birth chart & planetary positions', icon: 'auto_stories', route: '/my-kundli-screen', active: true },
        { id: 'myRemedies', order: 2, labelKey: 'profile.myRemedies', defaultLabel: 'My Remedies (अष्ट परिहार)', subtitle: 'Personalised 8-directional remedial remedies', icon: 'auto_awesome', route: '/remedies-screen', badge: '8 in 1', active: true },
        { id: 'birthProfiles', order: 3, labelKey: 'profile.birthProfiles', defaultLabel: 'Birth Profiles', subtitle: 'Family, partner & seeker kundli profiles', icon: 'person_outline_rounded', route: '/birth-profiles-screen', active: true },
        { id: 'kundliReports', order: 4, labelKey: 'profile.kundliReports', defaultLabel: 'Kundli & Service Reports', subtitle: 'Saved astrology predictions & PDF reports', icon: 'description_outlined', route: '/kundli-reports-screen', active: true },
        { id: 'matchReports', order: 5, labelKey: 'profile.matchReports', defaultLabel: 'Match Reports', subtitle: '36 Guna Ashtakoot matrimonial reports', icon: 'favorite_border', route: '/match-reports-screen', active: true },
        { id: 'panchangReports', order: 6, labelKey: 'profile.panchangReports', defaultLabel: 'Panchang & Muhurat', subtitle: 'Daily Vedic almanac, tithi & auspicious timings', icon: 'calendar_today_outlined', route: '/panchang-screen', active: true },
        { id: 'savedAstrologers', order: 7, labelKey: 'profile.savedAstrologers', defaultLabel: 'Saved Astrologers', subtitle: 'Your favorite verified Vedic consultants', icon: 'star_outline', route: '/saved-astrologers-screen', active: true },
        { id: 'consultationHistory', order: 8, labelKey: 'profile.consultationHistory', defaultLabel: 'Consultation History', subtitle: 'Past audio, video & AI chat recordings', icon: 'history', route: '/consultation-history-screen', active: true },
      ],
    },
    {
      id: 'my-account',
      order: 2,
      title: 'MY ACCOUNT & BILLING',
      labelKey: 'profile.myAccount',
      active: true,
      items: [
        { id: 'wallet', order: 1, labelKey: 'profile.wallet', defaultLabel: 'Wallet', subtitle: 'View balance, add funds & recharge offers', icon: 'account_balance_wallet_outlined', route: '/wallet-screen', active: true },
        { id: 'transactions', order: 2, labelKey: 'profile.transactions', defaultLabel: 'Transactions', subtitle: 'Detailed billing history & payment receipts', icon: 'receipt_long_outlined', route: '/wallet-screen', active: true },
        { id: 'paymentMethods', order: 3, labelKey: 'profile.paymentMethods', defaultLabel: 'Payment Methods', subtitle: 'UPI, Cards, Netbanking & Saved options', icon: 'credit_card_outlined', route: '/wallet-screen', active: true },
        { id: 'notifications', order: 4, labelKey: 'profile.notifications', defaultLabel: 'Notifications', subtitle: 'Daily horoscopes, muhurat & chat alerts', icon: 'notifications_outlined', route: '/notifications-screen', active: true },
      ],
    },
    {
      id: 'preferences',
      order: 3,
      title: 'PREFERENCES',
      labelKey: 'profile.preferences',
      active: true,
      items: [
        { id: 'language', order: 1, labelKey: 'profile.language', defaultLabel: 'Language', subtitle: 'Choose Telugu, Hindi, English, Tamil, etc.', icon: 'translate', route: '/language-screen', action: 'languageModal', active: true },
        { id: 'theme', order: 2, labelKey: 'profile.theme', defaultLabel: 'Theme', subtitle: 'Switch between Light Vedic and Dark Cosmic', icon: 'palette_outlined', route: '/theme-screen', action: 'themeToggle', active: true },
        { id: 'notificationSettings', order: 3, labelKey: 'profile.notificationSettings', defaultLabel: 'Notification Settings', subtitle: 'Manage reminders, panchang & astro alerts', icon: 'tune_outlined', route: '/notification-settings-screen', active: true },
        { id: 'privacy', order: 4, labelKey: 'profile.privacy', defaultLabel: 'Privacy', subtitle: 'Manage your birth chart & account privacy', icon: 'lock_outline_rounded', route: '/privacy-screen', active: true },
        { id: 'security', order: 5, labelKey: 'profile.security', defaultLabel: 'Security', subtitle: 'Biometric lock, PIN & authentication', icon: 'security_outlined', route: '/security-screen', active: true },
      ],
    },
    {
      id: 'support',
      order: 4,
      title: 'SUPPORT & LEGAL',
      labelKey: 'profile.support',
      active: true,
      items: [
        { id: 'helpCentre', order: 1, labelKey: 'profile.helpCentre', defaultLabel: 'Help Centre', subtitle: 'Guides, tutorials and knowledge base', icon: 'help_outline_rounded', route: '/help-centre-screen', active: true },
        { id: 'contactSupport', order: 2, labelKey: 'profile.contactSupport', defaultLabel: 'Contact Support', subtitle: 'Reach our spiritual care team 24/7', icon: 'support_agent_outlined', route: '/contact-support-screen', active: true },
        { id: 'faqs', order: 3, labelKey: 'profile.faqs', defaultLabel: 'FAQs', subtitle: 'Frequently asked astrological questions', icon: 'quiz_outlined', route: '/help-centre-screen', active: true },
        { id: 'terms', order: 4, labelKey: 'profile.terms', defaultLabel: 'Terms of Service', subtitle: 'Platform usage rules and spiritual disclaimers', icon: 'gavel_outlined', route: '/terms-screen', active: true },
        { id: 'privacyPolicy', order: 5, labelKey: 'profile.privacyPolicy', defaultLabel: 'Privacy Policy', subtitle: 'Birth data privacy and security measures', icon: 'policy_outlined', route: '/privacy-policy-screen', active: true },
      ],
    },
  ],
};

export async function getAppProfileConfig(): Promise<AppProfileConfig> {
  try {
    if (!db) return DEFAULT_APP_PROFILE_CONFIG;

    const docRef = doc(db, COLLECTION_NAME, PROFILE_CONFIG_DOC_ID);
    const snap = await getDoc(docRef);

    if (snap.exists() && snap.data()?.config) {
      return { ...DEFAULT_APP_PROFILE_CONFIG, ...(snap.data().config as AppProfileConfig) };
    }
  } catch (err) {
    console.warn('Could not fetch app profile config from Firestore, using defaults:', err);
  }
  return DEFAULT_APP_PROFILE_CONFIG;
}

export async function saveAppProfileConfig(config: AppProfileConfig): Promise<boolean> {
  try {
    if (!db) return false;

    const docRef = doc(db, COLLECTION_NAME, PROFILE_CONFIG_DOC_ID);
    await setDoc(
      docRef,
      {
        config,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.error('Error saving app profile config to Firestore:', err);
    throw err;
  }
}
`;

const profileStartIdx = appDynamicContent.indexOf('// ==========================================\n// APP DYNAMIC: PROFILE SCREEN & MENU CONFIG');
if (profileStartIdx !== -1) {
  appDynamicContent = appDynamicContent.substring(0, profileStartIdx) + updatedProfileDefinitions;
} else {
  appDynamicContent += '\n' + updatedProfileDefinitions;
}
fs.writeFileSync(appDynamicContentPath, appDynamicContent, 'utf8');
console.log('Updated appDynamicContent.ts with complete alphabet-level properties');

// ==============================================================================
// 2. Update AdminAppProfileEditor.tsx with 5 Comprehensive Tabs & Section CRUD
// ==============================================================================
const editorPath = path.join(WEB_ROOT, 'src/app/admin-panel/components/AdminAppProfileEditor.tsx');
const editorContent = `'use client';

import React, { useState, useEffect } from 'react';
import {
  AppProfileConfig,
  AppProfileSection,
  AppProfileMenuItem,
  DEFAULT_APP_PROFILE_CONFIG,
} from '@/lib/appDynamicContent';
import {
  User,
  Shield,
  Sparkles,
  Settings,
  HelpCircle,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit2,
  RefreshCw,
  Phone,
  Mail,
  Clock,
  Crown,
  FileText,
  CreditCard,
  Bell,
  Globe,
  Palette,
  Lock,
  Compass,
  Layers,
  Check,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminAppProfileEditor() {
  const [config, setConfig] = useState<AppProfileConfig>(DEFAULT_APP_PROFILE_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'sections' | 'card' | 'astro' | 'vip' | 'support'>('sections');
  const [activeSectionId, setActiveSectionId] = useState<string>('my-astrology');

  // Section Editing Modal
  const [editingSection, setEditingSection] = useState<AppProfileSection | null>(null);

  // Item Editing Modal
  const [editingItem, setEditingItem] = useState<{
    sectionId: string;
    itemIndex: number;
    item: AppProfileMenuItem;
  } | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/app-dynamic/profile');
      const data = await res.json();
      if (data.success && data.config) {
        setConfig({ ...DEFAULT_APP_PROFILE_CONFIG, ...data.config });
        if (data.config.sections?.[0]?.id) {
          setActiveSectionId(data.config.sections[0].id);
        }
      }
    } catch (err) {
      console.warn('Failed to load profile config from API:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/app-dynamic/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('All Profile screen settings & texts saved and live in mobile app!');
      } else {
        toast.error(data.error || 'Failed to save configuration');
      }
    } catch (err: any) {
      toast.error('Network error saving configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Reset entire profile screen configuration to initial Vedic defaults?')) {
      setConfig(DEFAULT_APP_PROFILE_CONFIG);
      toast.info('Reset to defaults. Click "Save Live Changes" to publish.');
    }
  };

  // Section CRUD
  const handleAddSection = () => {
    const newSec: AppProfileSection = {
      id: 'custom-sec-' + Date.now(),
      order: (config.sections?.length || 0) + 1,
      title: 'NEW CUSTOM SECTION',
      labelKey: '',
      active: true,
      items: [],
    };
    setConfig((prev) => ({
      ...prev,
      sections: [...prev.sections, newSec],
    }));
    setActiveSectionId(newSec.id);
    toast.success('New section added. You can now add menu items and configure its title.');
  };

  const handleDeleteSection = (secId: string) => {
    if (confirm('Are you sure you want to delete this section and all its menu items?')) {
      setConfig((prev) => {
        const remaining = prev.sections.filter((s) => s.id !== secId);
        return {
          ...prev,
          sections: remaining.map((s, idx) => ({ ...s, order: idx + 1 })),
        };
      });
      const remainingSecs = config.sections.filter((s) => s.id !== secId);
      if (remainingSecs.length > 0) {
        setActiveSectionId(remainingSecs[0].id);
      }
      toast.success('Section deleted');
    }
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= config.sections.length) return;
    const newSections = [...config.sections];
    const [moved] = newSections.splice(index, 1);
    newSections.splice(targetIndex, 0, moved);
    setConfig((prev) => ({
      ...prev,
      sections: newSections.map((sec, idx) => ({ ...sec, order: idx + 1 })),
    }));
  };

  // Item CRUD
  const currentSection = config.sections.find((s) => s.id === activeSectionId) || config.sections[0];

  const toggleItemActive = (sectionId: string, itemId: string) => {
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) =>
        sec.id === sectionId
          ? {
              ...sec,
              items: sec.items.map((it) => (it.id === itemId ? { ...it, active: !it.active } : it)),
            }
          : sec
      ),
    }));
  };

  const moveItem = (sectionId: string, index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        if (targetIndex < 0 || targetIndex >= sec.items.length) return sec;
        const newItems = [...sec.items];
        const [moved] = newItems.splice(index, 1);
        newItems.splice(targetIndex, 0, moved);
        return {
          ...sec,
          items: newItems.map((it, idx) => ({ ...it, order: idx + 1 })),
        };
      }),
    }));
  };

  const deleteItem = (sectionId: string, itemId: string) => {
    if (confirm('Are you sure you want to remove this menu item?')) {
      setConfig((prev) => ({
        ...prev,
        sections: prev.sections.map((sec) =>
          sec.id === sectionId
            ? {
                ...sec,
                items: sec.items.filter((it) => it.id !== itemId).map((it, idx) => ({ ...it, order: idx + 1 })),
              }
            : sec
        ),
      }));
      toast.success('Menu item removed');
    }
  };

  const addNewItem = (sectionId: string) => {
    const newItem: AppProfileMenuItem = {
      id: 'custom-' + Date.now(),
      order: (currentSection?.items?.length || 0) + 1,
      labelKey: '',
      defaultLabel: 'New Menu Option',
      subtitle: 'Custom Vedic feature description',
      icon: 'auto_awesome',
      route: '/home-dashboard-screen',
      active: true,
    };
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) =>
        sec.id === sectionId ? { ...sec, items: [...sec.items, newItem] } : sec
      ),
    }));
    toast.success('New menu item added. Click edit to customize its label and route.');
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="bg-card/70 backdrop-blur-md border border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
              100% Dynamic Engine
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle2 size={12} className="text-emerald-500" /> Realtime App Sync
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <User className="text-accent" /> Profile Screen & Menus Editor
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Every single alphabet, title, subtitle, stat, badge, banner, button & disclaimer on the Devotee Profile screen is completely dynamic.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button
            onClick={fetchConfig}
            disabled={loading}
            className="p-2.5 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
            title="Refresh from server"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleReset}
            className="px-3.5 py-2.5 rounded-xl border border-border hover:bg-destructive/10 text-destructive text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <RotateCcw size={14} /> Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-bold shadow-md shadow-accent/20 transition-all flex items-center gap-1.5"
          >
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{saving ? 'Saving...' : 'Save Live Changes'}</span>
          </button>
        </div>
      </div>

      {/* Editor Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('sections')}
          className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 \${
            activeTab === 'sections'
              ? 'bg-accent text-accent-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }\`}
        >
          <Compass size={14} /> Menu Sections ({config.sections.length})
        </button>
        <button
          onClick={() => setActiveTab('card')}
          className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 \${
            activeTab === 'card'
              ? 'bg-accent text-accent-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }\`}
        >
          <User size={14} /> Devotee Card & Quick Stats
        </button>
        <button
          onClick={() => setActiveTab('astro')}
          className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 \${
            activeTab === 'astro'
              ? 'bg-accent text-accent-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }\`}
        >
          <Sparkles size={14} /> Kundli Signs Trio
        </button>
        <button
          onClick={() => setActiveTab('vip')}
          className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 \${
            activeTab === 'vip'
              ? 'bg-accent text-accent-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }\`}
        >
          <Crown size={14} /> VIP Gold Promo Banner
        </button>
        <button
          onClick={() => setActiveTab('support')}
          className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 \${
            activeTab === 'support'
              ? 'bg-accent text-accent-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }\`}
        >
          <HelpCircle size={14} /> Care Desk, Auth Dialogs & Footers
        </button>
      </div>

      {/* =========================================================================
          TAB 1: MENU SECTIONS & ITEMS (FULL SECTION & ITEM CRUD)
      ========================================================================= */}
      {activeTab === 'sections' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Section Selector Column */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Profile Sections ({config.sections.length})
              </h3>
              <button
                onClick={handleAddSection}
                className="px-2.5 py-1 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent text-xs font-bold flex items-center gap-1"
              >
                <Plus size={12} /> Add Section
              </button>
            </div>

            {config.sections.map((sec, secIdx) => (
              <div
                key={sec.id}
                onClick={() => setActiveSectionId(sec.id)}
                className={\`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between \${
                  activeSectionId === sec.id
                    ? 'bg-accent/10 border-accent/60 shadow-sm'
                    : 'bg-card border-border hover:border-muted-foreground/30'
                }\`}
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-foreground truncate">{sec.title}</h4>
                    {!sec.active && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground">Hidden</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {sec.items.length} items • {sec.items.filter((i) => i.active).length} visible
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => moveSection(secIdx, 'up')}
                    disabled={secIdx === 0}
                    className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-20"
                    title="Move Section Up"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    onClick={() => moveSection(secIdx, 'down')}
                    disabled={secIdx === config.sections.length - 1}
                    className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-20"
                    title="Move Section Down"
                  >
                    <ArrowDown size={12} />
                  </button>
                  <button
                    onClick={() => setEditingSection({ ...sec })}
                    className="p-1.5 rounded hover:bg-muted text-accent"
                    title="Rename Section"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={() => handleDeleteSection(sec.id)}
                    className="p-1.5 rounded hover:bg-destructive/10 text-destructive"
                    title="Delete Section"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Section Items Manager Column */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Section: {currentSection?.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Change labels, descriptions, icons, destination routes, badges, or toggle visibility.
                </p>
              </div>
              <button
                onClick={() => addNewItem(currentSection.id)}
                className="px-3.5 py-1.5 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Plus size={14} /> Add Menu Item
              </button>
            </div>

            {/* List of items */}
            <div className="space-y-2.5">
              {currentSection?.items?.map((item, index) => (
                <div
                  key={item.id}
                  className={\`p-4 rounded-xl border transition-all flex items-center justify-between gap-3 \${
                    item.active
                      ? 'bg-card border-border'
                      : 'bg-muted/40 border-dashed border-border/70 opacity-60'
                  }\`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0 text-accent font-bold text-xs">
                      {item.icon.substring(0, 3)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground truncate">
                          {item.defaultLabel}
                        </span>
                        {item.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        Route: <span className="font-mono">{item.route}</span>
                        {item.subtitle ? \` • \${item.subtitle}\` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => moveItem(currentSection.id, index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground disabled:opacity-30"
                      title="Move Up"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      onClick={() => moveItem(currentSection.id, index, 'down')}
                      disabled={index === currentSection.items.length - 1}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown size={13} />
                    </button>
                    <button
                      onClick={() => toggleItemActive(currentSection.id, item.id)}
                      className={\`px-2.5 py-1 rounded-lg text-xs font-bold transition-all \${
                        item.active
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : 'bg-muted text-muted-foreground'
                      }\`}
                    >
                      {item.active ? 'Active' : 'Hidden'}
                    </button>
                    <button
                      onClick={() => setEditingItem({ sectionId: currentSection.id, itemIndex: index, item: { ...item } })}
                      className="p-2 rounded-lg hover:bg-muted text-accent"
                      title="Edit Item Details"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => deleteItem(currentSection.id, item.id)}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"
                      title="Delete Item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: DEVOTEE CARD & QUICK STATS
      ========================================================================= */}
      {activeTab === 'card' && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <User className="text-accent" /> Devotee Card & Quick Stats Configuration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold text-foreground">Screen Header Title</label>
              <input
                type="text"
                value={config.headerTitle}
                onChange={(e) => setConfig({ ...config, headerTitle: e.target.value })}
                className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground">Default Member Badge</label>
              <input
                type="text"
                value={config.defaultMemberBadge}
                onChange={(e) => setConfig({ ...config, defaultMemberBadge: e.target.value })}
                className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground">Welcome Guest Text (When Signed Out)</label>
              <input
                type="text"
                value={config.welcomeGuestText}
                onChange={(e) => setConfig({ ...config, welcomeGuestText: e.target.value })}
                className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground">Guest Subtitle / CTA Description</label>
              <input
                type="text"
                value={config.guestSubtitle}
                onChange={(e) => setConfig({ ...config, guestSubtitle: e.target.value })}
                className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground">Guest Sign In Button Label</label>
              <input
                type="text"
                value={config.guestSignInButtonText || 'Sign In / Register'}
                onChange={(e) => setConfig({ ...config, guestSignInButtonText: e.target.value })}
                className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>

          <div className="pt-5 border-t border-border">
            <h4 className="text-sm font-bold text-foreground mb-4">Quick Profile Stats (Labels & Visibility)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Wallet Stat */}
              <div className="p-4 rounded-xl bg-background border border-border space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showWalletStat}
                    onChange={(e) => setConfig({ ...config, showWalletStat: e.target.checked })}
                    className="rounded text-accent focus:ring-accent"
                  />
                  <span className="text-xs font-bold text-foreground">Show Wallet Stat</span>
                </label>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground">Custom Stat Label</label>
                  <input
                    type="text"
                    value={config.walletStatLabel || 'Wallet'}
                    onChange={(e) => setConfig({ ...config, walletStatLabel: e.target.value })}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-medium"
                  />
                </div>
              </div>

              {/* Consultation Stat */}
              <div className="p-4 rounded-xl bg-background border border-border space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showConsultationStat}
                    onChange={(e) => setConfig({ ...config, showConsultationStat: e.target.checked })}
                    className="rounded text-accent focus:ring-accent"
                  />
                  <span className="text-xs font-bold text-foreground">Show Consultations Stat</span>
                </label>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground">Custom Stat Label</label>
                  <input
                    type="text"
                    value={config.consultationStatLabel || 'Consultations'}
                    onChange={(e) => setConfig({ ...config, consultationStatLabel: e.target.value })}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-medium"
                  />
                </div>
              </div>

              {/* Reports Stat */}
              <div className="p-4 rounded-xl bg-background border border-border space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showReportsStat}
                    onChange={(e) => setConfig({ ...config, showReportsStat: e.target.checked })}
                    className="rounded text-accent focus:ring-accent"
                  />
                  <span className="text-xs font-bold text-foreground">Show Reports Stat</span>
                </label>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground">Custom Stat Label</label>
                  <input
                    type="text"
                    value={config.reportsStatLabel || 'Reports'}
                    onChange={(e) => setConfig({ ...config, reportsStatLabel: e.target.value })}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-medium"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: KUNDLI SIGNS TRIO (ASTROLOGICAL CARD)
      ========================================================================= */}
      {activeTab === 'astro' && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Sparkles className="text-accent" /> Vedic Astrological Signs Card
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Displays the devotee&apos;s Sun Sign (Zodiac), Moon Sign (Rashi) and Nakshatra, with fallback defaults when unregistered.
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showAstroTrio !== false}
                onChange={(e) => setConfig({ ...config, showAstroTrio: e.target.checked })}
                className="rounded text-accent focus:ring-accent"
              />
              <span className="text-xs font-bold text-foreground">Show Astro Trio Card</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Zodiac Box */}
            <div className="p-4 rounded-xl bg-background border border-border space-y-3">
              <h4 className="text-xs font-bold text-accent uppercase tracking-wider">1. Sun Sign / Zodiac</h4>
              <div>
                <label className="text-xs font-bold text-foreground">Label</label>
                <input
                  type="text"
                  value={config.zodiacStatLabel || 'Zodiac'}
                  onChange={(e) => setConfig({ ...config, zodiacStatLabel: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-card border border-border text-sm font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">Fallback Sign</label>
                <input
                  type="text"
                  value={config.defaultZodiac}
                  onChange={(e) => setConfig({ ...config, defaultZodiac: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-card border border-border text-sm font-medium"
                />
              </div>
            </div>

            {/* Moon Sign Box */}
            <div className="p-4 rounded-xl bg-background border border-border space-y-3">
              <h4 className="text-xs font-bold text-accent uppercase tracking-wider">2. Moon Sign / Rashi</h4>
              <div>
                <label className="text-xs font-bold text-foreground">Label</label>
                <input
                  type="text"
                  value={config.moonSignStatLabel || 'Moon Sign'}
                  onChange={(e) => setConfig({ ...config, moonSignStatLabel: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-card border border-border text-sm font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">Fallback Moon Sign</label>
                <input
                  type="text"
                  value={config.defaultMoonSign}
                  onChange={(e) => setConfig({ ...config, defaultMoonSign: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-card border border-border text-sm font-medium"
                />
              </div>
            </div>

            {/* Nakshatra Box */}
            <div className="p-4 rounded-xl bg-background border border-border space-y-3">
              <h4 className="text-xs font-bold text-accent uppercase tracking-wider">3. Nakshatra</h4>
              <div>
                <label className="text-xs font-bold text-foreground">Label</label>
                <input
                  type="text"
                  value={config.nakshatraStatLabel || 'Nakshatra'}
                  onChange={(e) => setConfig({ ...config, nakshatraStatLabel: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-card border border-border text-sm font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">Fallback Nakshatra</label>
                <input
                  type="text"
                  value={config.defaultNakshatra}
                  onChange={(e) => setConfig({ ...config, defaultNakshatra: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-card border border-border text-sm font-medium"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: VIP GOLD PROMO BANNER
      ========================================================================= */}
      {activeTab === 'vip' && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Crown className="text-amber-500" /> VIP Gold Member Promo Banner
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Displays a prominent sacred membership card on the devotee profile screen.
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.vipEnabled}
                onChange={(e) => setConfig({ ...config, vipEnabled: e.target.checked })}
                className="rounded text-accent focus:ring-accent"
              />
              <span className="text-xs font-bold text-foreground">Enable VIP Banner</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold text-foreground">Badge Text</label>
              <input
                type="text"
                value={config.vipBadge}
                onChange={(e) => setConfig({ ...config, vipBadge: e.target.value })}
                className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground">Banner Title</label>
              <input
                type="text"
                value={config.vipTitle}
                onChange={(e) => setConfig({ ...config, vipTitle: e.target.value })}
                className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-foreground">Banner Subtitle / Value Proposition</label>
              <textarea
                rows={2}
                value={config.vipSubtitle}
                onChange={(e) => setConfig({ ...config, vipSubtitle: e.target.value })}
                className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground">CTA Button Text</label>
              <input
                type="text"
                value={config.vipCtaText}
                onChange={(e) => setConfig({ ...config, vipCtaText: e.target.value })}
                className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground">CTA Destination Route</label>
              <input
                type="text"
                value={config.vipCtaRoute}
                onChange={(e) => setConfig({ ...config, vipCtaRoute: e.target.value })}
                className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: CARE DESK, AUTH DIALOGS & FOOTERS
      ========================================================================= */}
      {activeTab === 'support' && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
          {/* Spiritual Care & Help Desk Card */}
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <HelpCircle className="text-accent" /> Spiritual Care & Help Desk Card
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showSupportCard !== false}
                  onChange={(e) => setConfig({ ...config, showSupportCard: e.target.checked })}
                  className="rounded text-accent focus:ring-accent"
                />
                <span className="text-xs font-bold text-foreground">Show Support Card</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-xs font-bold text-foreground">Card Title</label>
                <input
                  type="text"
                  value={config.supportCardTitle || 'Spiritual Care & Help Desk'}
                  onChange={(e) => setConfig({ ...config, supportCardTitle: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-sm font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Mail size={13} /> Support Email
                </label>
                <input
                  type="email"
                  value={config.supportEmail}
                  onChange={(e) => setConfig({ ...config, supportEmail: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-sm font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Phone size={13} /> Helpline Phone Number
                </label>
                <input
                  type="text"
                  value={config.supportPhone}
                  onChange={(e) => setConfig({ ...config, supportPhone: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-sm font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Clock size={13} /> Working Hours
                </label>
                <input
                  type="text"
                  value={config.helplineHours}
                  onChange={(e) => setConfig({ ...config, helplineHours: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-sm font-medium"
                />
              </div>
            </div>
          </div>

          {/* Sign Out & Auth Dialog Texts */}
          <div className="pt-4 border-t border-border">
            <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Lock size={15} className="text-accent" /> Sign Out & Auth Dialog Texts
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-foreground">Sign Out Button Label</label>
                <input
                  type="text"
                  value={config.signOutButtonText || 'Sign Out'}
                  onChange={(e) => setConfig({ ...config, signOutButtonText: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-sm font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Sign Out Confirmation Title</label>
                <input
                  type="text"
                  value={config.signOutConfirmTitle || 'Sign Out'}
                  onChange={(e) => setConfig({ ...config, signOutConfirmTitle: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-sm font-medium"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-foreground">Sign Out Confirmation Message</label>
                <input
                  type="text"
                  value={config.signOutConfirmMessage || 'Are you sure you want to sign out? Your astrological charts will remain securely saved.'}
                  onChange={(e) => setConfig({ ...config, signOutConfirmMessage: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-sm font-medium"
                />
              </div>
            </div>
          </div>

          {/* Edit Profile Dialog Labels */}
          <div className="pt-4 border-t border-border">
            <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Edit2 size={15} className="text-accent" /> Edit Profile Sheet Labels
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-foreground">Modal Title</label>
                <input
                  type="text"
                  value={config.editProfileTitle || 'Edit Profile Details'}
                  onChange={(e) => setConfig({ ...config, editProfileTitle: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-sm font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">Full Name Label</label>
                <input
                  type="text"
                  value={config.editNameLabel || 'Full Name'}
                  onChange={(e) => setConfig({ ...config, editNameLabel: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-sm font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">Phone / Email Label</label>
                <input
                  type="text"
                  value={config.editPhoneOrEmailLabel || 'Phone / Email'}
                  onChange={(e) => setConfig({ ...config, editPhoneOrEmailLabel: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-sm font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">Date of Birth Label</label>
                <input
                  type="text"
                  value={config.editDobLabel || 'Date of Birth (DD/MM/YYYY)'}
                  onChange={(e) => setConfig({ ...config, editDobLabel: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-sm font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">Time of Birth Label</label>
                <input
                  type="text"
                  value={config.editTobLabel || 'Time of Birth (e.g. 10:30 AM)'}
                  onChange={(e) => setConfig({ ...config, editTobLabel: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-sm font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">Place of Birth Label</label>
                <input
                  type="text"
                  value={config.editPobLabel || 'Place of Birth (City, State)'}
                  onChange={(e) => setConfig({ ...config, editPobLabel: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-sm font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">Save Button Label</label>
                <input
                  type="text"
                  value={config.editSaveButtonText || 'Save Profile Details'}
                  onChange={(e) => setConfig({ ...config, editSaveButtonText: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-sm font-medium"
                />
              </div>
            </div>
          </div>

          {/* Footers & Sanskrit Blessing */}
          <div className="pt-4 border-t border-border">
            <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Sparkles size={15} className="text-accent" /> Footers & Vedic Tagline
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-foreground">Sacred Sanskrit Vedic Tagline</label>
                <input
                  type="text"
                  value={config.sanskritTagline}
                  onChange={(e) => setConfig({ ...config, sanskritTagline: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-sm font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">App Version Disclaimer</label>
                <input
                  type="text"
                  value={config.appVersionText}
                  onChange={(e) => setConfig({ ...config, appVersionText: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-sm font-medium"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: EDIT / RENAME SECTION
      ========================================================================= */}
      {editingSection && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Edit Section Details</h3>
              <button
                onClick={() => setEditingSection(null)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-foreground">Section Title</label>
                <input
                  type="text"
                  value={editingSection.title}
                  onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-sm font-medium uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Display Order</label>
                <input
                  type="number"
                  value={editingSection.order}
                  onChange={(e) => setEditingSection({ ...editingSection, order: Number(e.target.value) })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-sm font-medium"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={editingSection.active}
                  onChange={(e) => setEditingSection({ ...editingSection, active: e.target.checked })}
                  className="rounded text-accent focus:ring-accent"
                />
                <span className="text-xs font-bold text-foreground">Section Visible in App</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                onClick={() => setEditingSection(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setConfig((prev) => ({
                    ...prev,
                    sections: prev.sections.map((s) => (s.id === editingSection.id ? editingSection : s)),
                  }));
                  setEditingSection(null);
                  toast.success('Section updated');
                }}
                className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-bold"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: EDIT MENU ITEM
      ========================================================================= */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Edit Menu Item</h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-foreground">Item Label</label>
                <input
                  type="text"
                  value={editingItem.item.defaultLabel}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      item: { ...editingItem.item, defaultLabel: e.target.value },
                    })
                  }
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-sm font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Subtitle / Purpose</label>
                <input
                  type="text"
                  value={editingItem.item.subtitle || ''}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      item: { ...editingItem.item, subtitle: e.target.value },
                    })
                  }
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground">Icon Name</label>
                  <input
                    type="text"
                    value={editingItem.item.icon}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        item: { ...editingItem.item, icon: e.target.value },
                      })
                    }
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-sm font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground">Badge (Optional)</label>
                  <input
                    type="text"
                    value={editingItem.item.badge || ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        item: { ...editingItem.item, badge: e.target.value },
                      })
                    }
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Destination Route</label>
                <input
                  type="text"
                  value={editingItem.item.route}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      item: { ...editingItem.item, route: e.target.value },
                    })
                  }
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-sm font-medium font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setConfig((prev) => ({
                    ...prev,
                    sections: prev.sections.map((sec) =>
                      sec.id === editingItem.sectionId
                        ? {
                            ...sec,
                            items: sec.items.map((it, idx) =>
                              idx === editingItem.itemIndex ? editingItem.item : it
                            ),
                          }
                        : sec
                    ),
                  }));
                  setEditingItem(null);
                  toast.success('Item updated');
                }}
                className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-bold"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`;
fs.writeFileSync(editorPath, editorContent, 'utf8');
console.log('Updated AdminAppProfileEditor.tsx with 5 comprehensive tabs and full section CRUD');

console.log('Script execution complete!');
