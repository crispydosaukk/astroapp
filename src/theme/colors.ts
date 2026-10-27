/** Port of lib/theme/app_theme.dart (AppTheme static palette). */
export const AppColors = {
  primary: '#713B32',
  primaryLight: '#8E4C41',
  primaryContainer: '#552B24',
  goldAccent: '#C9A84C',
  goldLight: '#E2C26A',
  goldMuted: 'rgba(201,168,76,0.4)',
  goldBorder: 'rgba(201,168,76,0.2)',
  backgroundDark: '#080D1A',
  surfaceDark: '#0D1B2A',
  surfaceVariantDark: '#1A2640',
  cardGlass: 'rgba(255,255,255,0.059)',
  cardBorder: 'rgba(201,168,76,0.102)',
  textPrimary: '#F0EAD6',
  textSecondary: '#A0A8C0',
  textMuted: '#6B7A99',
  success: '#2D9E6B',
  warning: '#D4821A',
  error: '#CF4444',
  online: '#3DCB7A',
  backgroundLight: '#FAF9F6',
  surfaceLight: '#FFFFFF',
  outline: '#2A3550',
  outlineVariant: '#1E2A40',
  divider: '#1E2A40',
  white: '#FFFFFF',
  transparent: 'transparent',
} as const;

function rgba(hex: string, alpha: number): string {
  let h = hex.replace('#', '');
  if (h.length === 8) h = h.slice(2);
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${Number(alpha.toFixed(3))})`;
}

/** Flutter `Color.withAlpha(a)` (0-255). */
export function withAlpha(hex: string, a: number): string {
  return rgba(hex, Math.max(0, Math.min(255, a)) / 255);
}

/** Flutter `Color.withOpacity(o)` / `withValues(alpha: o)`. */
export function withOpacity(hex: string, o: number): string {
  return rgba(hex, Math.max(0, Math.min(1, o)));
}

/** Flutter `Color(0xAARRGGBB)` literal → rgba. Pass 'AARRGGBB'. */
export function argb(hex8: string): string {
  const h = hex8.replace('#', '').replace(/^0x/i, '');
  return rgba('#' + h.slice(2), parseInt(h.slice(0, 2), 16) / 255);
}

/** Color.lerp for #RRGGBB colours, with optional per-end alpha. */
export function lerpColor(a: string, b: string, t: number, alphaA = 1, alphaB = 1): string {
  const pa = a.replace('#', ''), pb = b.replace('#', '');
  const c = (i: number) => {
    const x = parseInt(pa.slice(i, i + 2), 16), y = parseInt(pb.slice(i, i + 2), 16);
    return Math.round(x + (y - x) * t);
  };
  const al = alphaA + (alphaB - alphaA) * t;
  return `rgba(${c(0)},${c(2)},${c(4)},${Number(al.toFixed(3))})`;
}
