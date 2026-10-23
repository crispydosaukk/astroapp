const fs = require('fs');
const path = require('path');

const webRoot = 'c:/Users/PC/Desktop/astroparihar';

// 1. Create AdminAppCosmicInsightsEditor.tsx
const editorFile = path.join(webRoot, 'src/app/admin-panel/components/AdminAppCosmicInsightsEditor.tsx');
const editorCode = `'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CosmicInsightCard, DEFAULT_COSMIC_INSIGHTS } from '@/lib/appDynamicContent';
import {
  Sparkles,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Eye,
  Edit2,
  RefreshCw,
  X,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminAppCosmicInsightsEditor() {
  const [insights, setInsights] = useState<CosmicInsightCard[]>(DEFAULT_COSMIC_INSIGHTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(0);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/app-dynamic/cosmic-insights');
      const data = await res.json();
      if (data.success && Array.isArray(data.insights) && data.insights.length > 0) {
        setInsights(data.insights);
      }
    } catch (err) {
      console.warn('Failed to fetch cosmic insights:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/app-dynamic/cosmic-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insights }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Cosmic Insight cards published live to mobile app!');
      } else {
        toast.error(data.error || 'Failed to save cosmic insights');
      }
    } catch (err: any) {
      toast.error('Network error saving insights');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCard = () => {
    const newCard: CosmicInsightCard = {
      id: \`insight-\${Date.now()}\`,
      order: insights.length + 1,
      tag: '✦ New Cosmic Insight',
      title: 'Planetary Guidance for Today',
      description: 'Cosmic movements favor self-reflection, spiritual clarity, and auspicious beginnings.',
      imageUrl: 'https://images.pexels.com/photos/1252890/pexels-photo-1252890.jpeg?auto=compress&cs=tinysrgb&w=600',
      active: true,
      ctaText: "View Today's Guidance",
      ctaAction: '/ai-chat-screen',
      badgeColor: '#C9A84C',
      planetTags: ['Vedic Insight', 'Planetary Shift'],
    };
    setInsights([...insights, newCard]);
    setEditingIndex(insights.length);
  };

  const handleDeleteCard = (idx: number) => {
    const updated = insights.filter((_, i) => i !== idx).map((c, i) => ({ ...c, order: i + 1 }));
    setInsights(updated);
    if (editingIndex === idx) setEditingIndex(null);
  };

  const handleMove = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= insights.length) return;
    const copy = [...insights];
    const [moved] = copy.splice(idx, 1);
    copy.splice(target, 0, moved);
    const reordered = copy.map((c, i) => ({ ...c, order: i + 1 }));
    setInsights(reordered);
    if (editingIndex === idx) setEditingIndex(target);
  };

  const handleToggleActive = (idx: number) => {
    const copy = [...insights];
    copy[idx].active = !copy[idx].active;
    setInsights(copy);
  };

  const updateCardField = (idx: number, field: keyof CosmicInsightCard, val: any) => {
    const copy = [...insights];
    copy[idx] = { ...copy[idx], [field]: val };
    setInsights(copy);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-transparent border border-amber-500/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-500">
              <Sparkles size={20} />
            </span>
            <h2 className="text-xl font-bold text-foreground">Home Screen: Cosmic Insights (Side-Scrolling Carousel)</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage the live side-scrolling cards shown under &quot;Your Cosmic Insight Today&quot; on the mobile app home screen.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAddCard}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:opacity-90 shadow-sm transition"
          >
            <Plus size={16} /> Add Card
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-stone-900 font-bold text-sm hover:bg-amber-400 shadow-md transition disabled:opacity-50"
          >
            <Save size={16} /> {saving ? 'Publishing...' : 'Publish Live to App'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cards List (Left 7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Cards in Carousel ({insights.length})
            </h3>
            <span className="text-xs text-muted-foreground">Drag / Reorder cards using arrows</span>
          </div>

          <div className="space-y-3">
            {insights.map((card, idx) => {
              const isEditing = editingIndex === idx;
              return (
                <div
                  key={card.id || idx}
                  className={\`rounded-2xl border transition-all \${
                    isEditing ? 'border-amber-500 bg-amber-500/5 shadow-md' : 'border-border bg-card hover:border-border/80'
                  }\`}
                >
                  <div className="p-4 flex items-center gap-4">
                    <span className="text-xs font-mono font-bold text-muted-foreground w-6 text-center">
                      #{idx + 1}
                    </span>
                    <img
                      src={card.imageUrl}
                      alt={card.title}
                      className="w-16 h-12 object-cover rounded-lg border border-border shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 font-semibold truncate max-w-[150px]">
                          {card.tag}
                        </span>
                        <span
                          className={\`text-[10px] font-bold px-2 py-0.5 rounded-full \${
                            card.active ? 'bg-emerald-500/20 text-emerald-500' : 'bg-stone-500/20 text-stone-400'
                          }\`}
                        >
                          {card.active ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-foreground truncate mt-1">{card.title}</h4>
                      <p className="text-xs text-muted-foreground truncate">{card.description}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleMove(idx, -1)}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground disabled:opacity-30"
                        title="Move Up"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        onClick={() => handleMove(idx, 1)}
                        disabled={idx === insights.length - 1}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground disabled:opacity-30"
                        title="Move Down"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        onClick={() => handleToggleActive(idx)}
                        className={\`p-1.5 rounded-lg border text-xs font-semibold \${
                          card.active ? 'border-emerald-500/30 text-emerald-500' : 'border-stone-500/30 text-stone-400'
                        }\`}
                        title="Toggle Active"
                      >
                        {card.active ? <Check size={14} /> : <X size={14} />}
                      </button>
                      <button
                        onClick={() => setEditingIndex(isEditing ? null : idx)}
                        className="p-1.5 rounded-lg hover:bg-muted text-accent"
                        title="Edit Card"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteCard(idx)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500"
                        title="Delete Card"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Inline Editor Drawer */}
                  {isEditing && (
                    <div className="p-4 pt-0 border-t border-border mt-3 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Badge / Tag</label>
                          <input
                            type="text"
                            value={card.tag}
                            onChange={(e) => updateCardField(idx, 'tag', e.target.value)}
                            className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-background border border-border"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">CTA Button Text</label>
                          <input
                            type="text"
                            value={card.ctaText}
                            onChange={(e) => updateCardField(idx, 'ctaText', e.target.value)}
                            className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-background border border-border"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Card Title</label>
                        <input
                          type="text"
                          value={card.title}
                          onChange={(e) => updateCardField(idx, 'title', e.target.value)}
                          className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-background border border-border"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Description / Astrological Prediction</label>
                        <textarea
                          rows={2}
                          value={card.description}
                          onChange={(e) => updateCardField(idx, 'description', e.target.value)}
                          className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-background border border-border"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Image URL</label>
                          <input
                            type="text"
                            value={card.imageUrl}
                            onChange={(e) => updateCardField(idx, 'imageUrl', e.target.value)}
                            className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-background border border-border"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">CTA Action Route</label>
                          <input
                            type="text"
                            value={card.ctaAction}
                            onChange={(e) => updateCardField(idx, 'ctaAction', e.target.value)}
                            className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-background border border-border"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Mobile Phone Preview (Right 5 Cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Live Mobile Phone Preview
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 font-bold">
                Live App Sync
              </span>
            </div>

            {/* Phone Frame */}
            <div className="w-[320px] mx-auto rounded-[36px] p-3 bg-stone-900 border-4 border-stone-800 shadow-2xl overflow-hidden">
              <div className="rounded-[28px] bg-[#080D1A] p-4 text-[#F0EAD6] space-y-4">
                {/* Header preview */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-800 to-red-950 flex items-center justify-center font-bold text-xs text-amber-200 border border-amber-500/50">
                      P
                    </div>
                    <div>
                      <p className="text-[9px] text-stone-400">Good Morning</p>
                      <p className="text-xs font-bold">Priya Sharma</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 border border-amber-500/20 text-amber-300">
                      📍 Mumbai
                    </span>
                    <span className="w-6 h-6 rounded-lg bg-stone-800 border border-amber-500/20 flex items-center justify-center text-xs">
                      🔔
                    </span>
                  </div>
                </div>

                {/* Section Title */}
                <div>
                  <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1">
                    <span>✦</span> Cosmic Insights Today
                  </h4>
                  <p className="text-[9px] text-stone-400">Swipe horizontally to explore transits</p>
                </div>

                {/* Side-Scrolling Carousel Mockup */}
                <div className="overflow-x-auto flex gap-2.5 pb-2 scrollbar-none snap-x">
                  {insights.filter((c) => c.active).map((card, i) => (
                    <div
                      key={card.id || i}
                      className="w-[240px] shrink-0 snap-center rounded-2xl border border-amber-500/30 overflow-hidden relative bg-[#0D1B2A] p-3 flex flex-col justify-between"
                      style={{ height: '175px' }}
                    >
                      <img
                        src={card.imageUrl}
                        alt={card.title}
                        className="absolute right-0 top-0 w-28 h-28 object-cover opacity-60 rounded-bl-full"
                      />
                      <div className="relative z-10 space-y-1">
                        <span className="inline-block text-[8px] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold">
                          {card.tag}
                        </span>
                        <h5 className="text-[11px] font-bold text-stone-100 line-clamp-2 leading-tight">
                          {card.title}
                        </h5>
                        <p className="text-[9px] text-stone-300 line-clamp-2 leading-snug">
                          {card.description}
                        </p>
                      </div>

                      <div className="relative z-10 pt-2">
                        <button className="w-full py-1.5 rounded-full bg-[#8B1A1A] text-stone-100 text-[10px] font-bold flex items-center justify-center gap-1">
                          <span>✨</span> {card.ctaText || "View Guidance"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Carousel Pagination indicator */}
                <div className="flex justify-center gap-1 pt-1">
                  {insights.filter((c) => c.active).map((_, idx) => (
                    <span
                      key={idx}
                      className={\`h-1 rounded-full \${idx === 0 ? 'w-4 bg-amber-400' : 'w-1.5 bg-stone-700'}\`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
`;
fs.writeFileSync(editorFile, editorCode, 'utf8');
console.log('Created AdminAppCosmicInsightsEditor.tsx');

// 2. Create app-dynamic/cosmic-insights/page.tsx
const cosmicInsightsPageDir = path.join(webRoot, 'src/app/admin-panel/(authenticated)/app-dynamic/cosmic-insights');
fs.mkdirSync(cosmicInsightsPageDir, { recursive: true });
const cosmicInsightsPageFile = path.join(cosmicInsightsPageDir, 'page.tsx');
const cosmicInsightsPageCode = `import React from 'react';
import AppLayout from '@/components/AppLayout';
import AdminContent from '../../../components/AdminContent';

export default function AdminAppCosmicInsightsPage() {
  return (
    <AppLayout>
      <AdminContent activeTab="tab-app-cosmic-insights" />
    </AppLayout>
  );
}
`;
fs.writeFileSync(cosmicInsightsPageFile, cosmicInsightsPageCode, 'utf8');
console.log('Created app-dynamic/cosmic-insights/page.tsx');

// 3. Update AdminContent.tsx to import AdminAppCosmicInsightsEditor
const adminContentFile = path.join(webRoot, 'src/app/admin-panel/components/AdminContent.tsx');
if (fs.existsSync(adminContentFile)) {
  let content = fs.readFileSync(adminContentFile, 'utf8');
  if (!content.includes('AdminAppCosmicInsightsEditor')) {
    content = content.replace(
      "import AdminAppBannersEditor from './AdminAppBannersEditor';",
      "import AdminAppBannersEditor from './AdminAppBannersEditor';\nimport AdminAppCosmicInsightsEditor from './AdminAppCosmicInsightsEditor';"
    );
    content = content.replace(
      "{activeTab === 'tab-app-banners' && <AdminAppBannersEditor />}",
      "{activeTab === 'tab-app-banners' && <AdminAppBannersEditor />}\n        {activeTab === 'tab-app-cosmic-insights' && <AdminAppCosmicInsightsEditor />}"
    );
    fs.writeFileSync(adminContentFile, content, 'utf8');
    console.log('Updated AdminContent.tsx with Cosmic Insights Tab');
  }
}

// 4. Update AppSidebar.tsx with Cosmic Insights navigation link
const appSidebarFile = path.join(webRoot, 'src/components/AppSidebar.tsx');
if (fs.existsSync(appSidebarFile)) {
  let content = fs.readFileSync(appSidebarFile, 'utf8');
  if (!content.includes('App Dynamic: Cosmic Insights')) {
    content = content.replace(
      "{ icon: LayoutTemplate, label: 'App Dynamic: Banners', href: '/admin-panel/app-dynamic/banners', badge: null },",
      "{ icon: LayoutTemplate, label: 'App Dynamic: Banners', href: '/admin-panel/app-dynamic/banners', badge: null },\n      { icon: Sparkles, label: 'App Dynamic: Cosmic Insights', href: '/admin-panel/app-dynamic/cosmic-insights', badge: 'App' },"
    );
    fs.writeFileSync(appSidebarFile, content, 'utf8');
    console.log('Updated AppSidebar.tsx with Cosmic Insights link');
  }
}
