/**
 * Astrological Text-To-Speech (TTS) Voice Engine
 * 
 * Synchronized with website voice synthesis:
 * - Dynamic Language Support: Telugu (te-IN), Hindi (hi-IN), Tamil (ta-IN), Kannada (kn-IN), Malayalam (ml-IN), English (en-IN)
 * - Astrologer Voice Gender Differentiation:
 *   - Female (Devi / Mata / Ananya / Vedika): Pitch 1.15, Rate 0.90 (serene maternal cadence)
 *   - Male (Acharya / Swami / Pandit): Pitch 0.75, Rate 0.85 (deep baritone Pandit timbre)
 * - Markdown Stripping: cleans astrology markdown for natural Vedic recitation
 */
import * as Speech from 'expo-speech';

export interface AstrologerSpeechOptions {
  language?: string;
  astrologerName?: string;
  onStart?: () => void;
  onDone?: () => void;
  onError?: (error: any) => void;
}

export function cleanTextForSpeech(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold **text**
    .replace(/\*(.*?)\*/g, '$1')     // Italic *text*
    .replace(/#{1,6}\s?/g, '')       // Headers
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links [text](url)
    .replace(/[✦•–—\-\|\/]/g, ' ')   // Bullet marks & dashes
    .replace(/\s+/g, ' ')            // Collapsed whitespace
    .trim();
}

export function getLanguageCode(lang?: string): string {
  const l = (lang || '').toLowerCase().trim();
  if (l.includes('telugu') || l === 'te') return 'te-IN';
  if (l.includes('hindi') || l === 'hi') return 'hi-IN';
  if (l.includes('tamil') || l === 'ta') return 'ta-IN';
  if (l.includes('kannada') || l === 'kn') return 'kn-IN';
  if (l.includes('malayalam') || l === 'ml') return 'ml-IN';
  return 'en-IN';
}

export function isFemaleAstrologer(name?: string): boolean {
  if (!name) return false;
  const n = name.toLowerCase();
  return (
    n.includes('vedika') ||
    n.includes('ananya') ||
    n.includes('devi') ||
    n.includes('mata') ||
    n.includes('priya') ||
    n.includes('meera') ||
    n.includes('smita') ||
    n.includes('radha') ||
    n.includes('laxmi') ||
    n.includes('parvati') ||
    n.includes('female')
  );
}

/**
 * Speak Astrologer response with authentic voice characteristics
 */
export async function speakAstrologerText(
  text: string,
  options: AstrologerSpeechOptions = {}
): Promise<void> {
  const clean = cleanTextForSpeech(text);
  if (!clean) return;

  try {
    // Cancel any ongoing speech
    await Speech.stop();

    const langCode = getLanguageCode(options.language);
    const isFemale = isFemaleAstrologer(options.astrologerName);

    // Voice Pitch & Rate tuned to match the website
    const pitch = isFemale ? 1.15 : 0.75;
    const rate = isFemale ? 0.90 : 0.85;

    options.onStart?.();

    Speech.speak(clean, {
      language: langCode,
      pitch,
      rate,
      onDone: () => {
        options.onDone?.();
      },
      onError: (err) => {
        console.warn('Speech error:', err);
        options.onError?.(err);
      },
      onStopped: () => {
        options.onDone?.();
      },
    });
  } catch (err) {
    console.warn('Error starting speech:', err);
    options.onError?.(err);
  }
}

/**
 * Stop active speech
 */
export async function stopAstrologerSpeech(): Promise<void> {
  try {
    await Speech.stop();
  } catch (err) {
    console.warn('Error stopping speech:', err);
  }
}

/**
 * Check if voice is speaking
 */
export async function isAstrologerSpeaking(): Promise<boolean> {
  try {
    return await Speech.isSpeakingAsync();
  } catch {
    return false;
  }
}
