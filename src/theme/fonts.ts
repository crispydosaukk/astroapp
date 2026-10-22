import {
  Raleway_300Light, Raleway_400Regular, Raleway_500Medium, Raleway_600SemiBold,
  Raleway_700Bold, Raleway_800ExtraBold, Raleway_900Black,
} from '@expo-google-fonts/raleway';

/** Bundled via expo-font (no runtime fetch → no layout flash; Flutter used google_fonts). */
export const fontAssets = {
  Raleway_300Light, Raleway_400Regular, Raleway_500Medium, Raleway_600SemiBold,
  Raleway_700Bold, Raleway_800ExtraBold, Raleway_900Black,
};

export function ralewayFamily(weight?: string | number): string {
  const w = typeof weight === 'number' ? weight : weight === 'bold' ? 700 : parseInt(weight ?? '400', 10) || 400;
  if (w <= 300) return 'Raleway_300Light';
  if (w <= 400) return 'Raleway_400Regular';
  if (w <= 500) return 'Raleway_500Medium';
  if (w <= 600) return 'Raleway_600SemiBold';
  if (w <= 700) return 'Raleway_700Bold';
  if (w <= 800) return 'Raleway_800ExtraBold';
  return 'Raleway_900Black';
}
