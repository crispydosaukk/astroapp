/**
 * Port of lib/widgets/custom_icon_widget.dart (CustomIconWidget) and of direct `Icons.xxx` usages.
 * Flutter Material icon names (e.g. 'home_outlined') are resolved to @expo/vector-icons glyphs:
 *   1. hand-mapped alias
 *   2. exact MaterialIcons name (underscores → hyphens)
 *   3. variant-suffix fallbacks (_outlined → -outline / -border, _rounded/_sharp stripped)
 *   4. MaterialCommunityIcons equivalent
 *   5. 'help-outline' in grey (same fallback as the Flutter widget)
 */
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleProp, TextStyle } from 'react-native';

type Props = { name: string; size?: number; color?: string; style?: StyleProp<TextStyle> };
type Resolved = { set: 'mi' | 'mci'; glyph: string } | null;

const MI = MaterialIcons.glyphMap as Record<string, number>;
const MCI = MaterialCommunityIcons.glyphMap as Record<string, number>;

const ALIASES: Record<string, string> = {
  arrow_back_ios_new: 'arrow-back-ios',
  arrow_back_ios_new_rounded: 'arrow-back-ios',
  arrow_forward_ios_rounded: 'arrow-forward-ios',
  person_outline_rounded: 'person-outline',
  grid_view_outlined: 'grid-view',
  auto_awesome_outlined: 'auto-awesome',
  home_outlined: 'home',
  bookmark_outline: 'bookmark-border',
  bookmark_outline_rounded: 'bookmark-border',
  favorite_outline: 'favorite-border',
  star_outline_rounded: 'star-outline',
  logout_rounded: 'logout',
};

const cache = new Map<string, Resolved>();

export function resolveIcon(name: string): Resolved {
  if (cache.has(name)) return cache.get(name)!;
  const mi = (g: string): Resolved => (MI[g] !== undefined ? { set: 'mi', glyph: g } : null);
  const mci = (g: string): Resolved => (MCI[g] !== undefined ? { set: 'mci', glyph: g } : null);
  const h = (s: string) => s.replace(/_/g, '-');
  const base = name.replace(/_(outlined|rounded|sharp)$/, '');
  const outlined = name.endsWith('_outlined');
  const attempts: Array<() => Resolved> = [
    () => (ALIASES[name] ? mi(ALIASES[name]) : null),
    () => mi(h(name)),
    () => (outlined ? mi(h(base) + '-outline') : null),
    () => (outlined ? mi(h(base) + '-border') : null),
    () => mi(h(base)),
    () => mi(h(base.replace(/_(outline|border)$/, ''))),
    () => (outlined ? mci(h(base) + '-outline') : null),
    () => mci(h(base)),
    () => mci(h(base.replace(/_(outline|border)$/, ''))),
  ];
  for (const a of attempts) {
    const r = a();
    if (r) { cache.set(name, r); return r; }
  }
  cache.set(name, null);
  return null;
}

export function AppIcon({ name, size = 24, color, style }: Props) {
  const r = resolveIcon(name);
  if (!r) return <MaterialIcons name="help-outline" size={size} color="grey" style={style} accessibilityLabel={name} />;
  if (r.set === 'mi')
    return <MaterialIcons name={r.glyph as never} size={size} color={color} style={style} accessibilityLabel={name} />;
  return <MaterialCommunityIcons name={r.glyph as never} size={size} color={color} style={style} accessibilityLabel={name} />;
}
