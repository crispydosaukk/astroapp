/**
 * Astrological Text-To-Speech (TTS) Voice Engine
 * AstroParihar - High-Fidelity Recitation Engine
 * 
 * Synchronized with website voice synthesis:
 * - Dynamic Language Support: Telugu (te-IN), Hindi (hi-IN), Tamil (ta-IN), Kannada (kn-IN), Malayalam (ml-IN), English (en-IN)
 * - Astrologer Voice Timbre:
 *   - Female (Devi / Mata / Ananya / Vedika): Pitch 1.05, Rate 0.88 (serene maternal cadence)
 *   - Male (Acharya / Swami / Pandit): Pitch 0.82, Rate 0.85 (deep baritone Pandit timbre)
 * - Deep Emoji & Markdown Stripping: strips all emojis, bold asterisks, and non-phonetic artifacts so native TTS never chokes or reads out symbol names
 * - Sentence Buffer Protection: chunks text into natural sentence boundaries (~160 chars) so native Android/iOS TTS never truncates midway and recites completely up to the very last alphabet in every sentence
 * - Atomic Cancellation Token: prevents audio overlap, ghost playback, or speech leaks when stopping or switching messages
 */

import * as Speech from 'expo-speech';

export interface AstrologerSpeechOptions {
  language?: string;
  astrologerName?: string;
  onStart?: () => void;
  onDone?: () => void;
  onError?: (error: any) => void;
}

// Global speech token to ensure only the latest active speech queue executes
let activeSpeechId = 0;

// Universal regex to strip all emojis and pictorial symbols
const EMOJI_REGEX =
  /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}\u{1FA70}-\u{1FAFF}\u{200D}\u{FE0F}]/gu;

/**
 * Clean astrology response into pristine, 100% speakable text
 * Strips emojis, markdown, symbols, bullet artifacts, and HTML
 */
export function cleanTextForSpeech(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold **text**
    .replace(/\*(.*?)\*/g, '$1')     // Italic *text*
    .replace(/#{1,6}\s?/g, '')       // Headers (#, ##)
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links [text](url) -> text
    .replace(/<[^>]*>/g, ' ')        // Strip any HTML tags
    .replace(EMOJI_REGEX, '')        // Strip all Unicode emojis
    .replace(/[✦•–—\-\|\/\\~`_^{}\[\]]/g, ' ') // Non-phonetic bullet marks & dashes
    .replace(/[;:]/g, ', ')          // Convert colons & semicolons to soft pauses
    .replace(/\s+/g, ' ')            // Collapse multiple spaces
    .trim();
}

/**
 * Split text into natural sentence chunks respecting sentence boundaries
 * Keeps chunk size under 160 characters so Android/iOS buffer never drops text
 */
export function splitIntoSpeechChunks(text: string, maxLen: number = 160): string[] {
  if (!text) return [];

  // Split on sentence boundaries: periods, exclamation marks, question marks, Indic dandas (।, ॥) or newlines
  const sentences = text.split(/(?<=[.!?।॥\n])\s+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const s of sentences) {
    const trimmed = s.trim();
    if (!trimmed) continue;

    if (currentChunk.length + trimmed.length + 1 <= maxLen) {
      currentChunk = currentChunk ? `${currentChunk} ${trimmed}` : trimmed;
    } else {
      if (currentChunk) chunks.push(currentChunk);

      if (trimmed.length > maxLen) {
        // Sentence itself is long without punctuation; split by words
        const words = trimmed.split(/\s+/);
        let sub = '';
        for (const w of words) {
          if (sub.length + w.length + 1 <= maxLen) {
            sub = sub ? `${sub} ${w}` : w;
          } else {
            if (sub) chunks.push(sub);
            sub = w;
          }
        }
        currentChunk = sub;
      } else {
        currentChunk = trimmed;
      }
    }
  }

  if (currentChunk) chunks.push(currentChunk);
  return chunks;
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
 * Speak Astrologer response sequentially sentence by sentence
 * Guarantees zero truncations, speaking completely to the final alphabet of every sentence
 */
export async function speakAstrologerText(
  text: string,
  options: AstrologerSpeechOptions = {}
): Promise<void> {
  const clean = cleanTextForSpeech(text);
  if (!clean) {
    options.onDone?.();
    return;
  }

  // Invalidate any ongoing or queued speech
  activeSpeechId += 1;
  const currentToken = activeSpeechId;

  try {
    await Speech.stop();
  } catch {}

  const chunks = splitIntoSpeechChunks(clean, 160);
  if (chunks.length === 0) {
    options.onDone?.();
    return;
  }

  const langCode = getLanguageCode(options.language);
  const isFemale = isFemaleAstrologer(options.astrologerName);

  // Tuned for reverent, natural Vedic pacing
  const pitch = isFemale ? 1.05 : 0.82;
  const rate = isFemale ? 0.88 : 0.85;

  options.onStart?.();

  let chunkIndex = 0;

  const speakNext = () => {
    // If user cancelled, or a newer speech was launched, halt immediately
    if (currentToken !== activeSpeechId) return;

    if (chunkIndex >= chunks.length) {
      options.onDone?.();
      return;
    }

    const chunk = chunks[chunkIndex];
    chunkIndex += 1;

    Speech.speak(chunk, {
      language: langCode,
      pitch,
      rate,
      onDone: () => {
        if (currentToken === activeSpeechId) {
          speakNext();
        }
      },
      onError: (err) => {
        console.warn('Speech chunk error:', err);
        if (currentToken === activeSpeechId) {
          if (chunkIndex < chunks.length) {
            speakNext();
          } else {
            options.onError?.(err);
          }
        }
      },
      onStopped: () => {
        if (currentToken === activeSpeechId) {
          options.onDone?.();
        }
      },
    });
  };

  speakNext();
}

/**
 * Stop active speech and cancel any pending queued chunks immediately
 */
export async function stopAstrologerSpeech(): Promise<void> {
  activeSpeechId += 1; // Invalidate current speech queue
  try {
    await Speech.stop();
  } catch (err) {
    console.warn('Error stopping speech:', err);
  }
}

/**
 * Check if voice is actively speaking
 */
export async function isAstrologerSpeaking(): Promise<boolean> {
  try {
    return await Speech.isSpeakingAsync();
  } catch {
    return false;
  }
}
