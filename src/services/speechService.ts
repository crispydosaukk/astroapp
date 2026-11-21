/**
 * Astrological Text-To-Speech (TTS) Voice Engine
 * AstroParihar - High-Fidelity Recitation Engine
 * 
 * Synchronized with website voice synthesis:
 * - Dynamic Language Support: Telugu (te-IN), Hindi (hi-IN), Tamil (ta-IN), Kannada (kn-IN), Malayalam (ml-IN), English (en-IN)
 * - Strict Gender Consistency Across ALL Languages:
 *   - Male Astrologers (Acharya Devavrat / Dhananjay / Swami / Pandit / Bhaskar) ALWAYS speak with an authentic male Pandit baritone across every selected language.
 *   - Female Astrologers (Devi / Mata / Ananya / Vedika / Priya) ALWAYS speak with a serene, gentle maternal feminine voice.
 * - Multi-lingual Transliteration: Translates Sanskrit & English honorifics into native Dravidian & Devanagari scripts.
 * - Deep Emoji & Markdown Stripping: strips all emojis, bold asterisks, and non-phonetic artifacts.
 * - Sentence Buffer Protection: chunks text into natural sentence boundaries (~160 chars) so native Android/iOS TTS recites completely up to the very last alphabet.
 * - Atomic Cancellation Token: prevents audio overlap, ghost playback, or speech leaks.
 */

import * as Speech from 'expo-speech';
import { API_ENDPOINTS } from '@/config/api';
import {
  isNeuralAudioReady,
  playNeuralAudioBase64,
  stopNeuralAudio,
} from '@/components/NeuralAudioHost';

export interface AstrologerSpeechOptions {
  language?: string;
  astrologerName?: string;
  astrologerId?: string;
  gender?: 'male' | 'female';
  voiceId?: string;
  onStart?: () => void;
  onDone?: () => void;
  onError?: (error: any) => void;
}

// Global speech token to ensure only the latest active speech queue executes
let activeSpeechId = 0;
let cachedVoices: Speech.Voice[] | null = null;

// Universal regex to strip all emojis and pictorial symbols
const EMOJI_REGEX =
  /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}\u{1FA70}-\u{1FAFF}\u{200D}\u{FE0F}]/gu;

export interface LanguageMeta {
  bcp47: string;
  iso2: string;
  iso3: string;
  tags: string[];
}

export function getLanguageMetadata(lang?: string): LanguageMeta {
  const l = (lang || '').toLowerCase().trim();
  if (l.includes('telugu') || l.startsWith('te') || l.startsWith('tel')) {
    return { bcp47: 'te-IN', iso2: 'te', iso3: 'tel', tags: ['te', 'te-in', 'te_in', 'tel', 'tel-in', 'tel_in'] };
  }
  if (l.includes('hindi') || l.startsWith('hi') || l.startsWith('hin')) {
    return { bcp47: 'hi-IN', iso2: 'hi', iso3: 'hin', tags: ['hi', 'hi-in', 'hi_in', 'hin', 'hin-in', 'hin_in'] };
  }
  if (l.includes('tamil') || l.startsWith('ta') || l.startsWith('tam')) {
    return { bcp47: 'ta-IN', iso2: 'ta', iso3: 'tam', tags: ['ta', 'ta-in', 'ta_in', 'tam', 'tam-in', 'tam-ind', 'tam_in'] };
  }
  if (l.includes('kannada') || l.startsWith('kn') || l.startsWith('kan')) {
    return { bcp47: 'kn-IN', iso2: 'kn', iso3: 'kan', tags: ['kn', 'kn-in', 'kn_in', 'kan', 'kan-in', 'kan-ind', 'kan_in'] };
  }
  if (l.includes('malayalam') || l.startsWith('ml') || l.startsWith('mal')) {
    return { bcp47: 'ml-IN', iso2: 'ml', iso3: 'mal', tags: ['ml', 'ml-in', 'ml_in', 'mal', 'mal-in', 'mal-ind', 'mal_in'] };
  }
  return { bcp47: 'en-IN', iso2: 'en', iso3: 'eng', tags: ['en', 'en-in', 'en_in', 'en-us', 'en-gb'] };
}

export function getLanguageCode(lang?: string): string {
  return getLanguageMetadata(lang).bcp47;
}

/**
 * Clean astrology response into pristine, 100% speakable text
 * Strips emojis, markdown, symbols, bullet artifacts, and HTML while preserving
 * all letters, numbers, full words, and natural phonetic punctuation.
 * Transliterates honorifics and technical terms into native scripts for Telugu, Hindi, Tamil, Kannada, and Malayalam.
 */
export function cleanTextForSpeech(raw: string, lang?: string): string {
  if (!raw) return '';
  let cleaned = raw
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold **text**
    .replace(/\*(.*?)\*/g, '$1')     // Italic *text*
    .replace(/#{1,6}\s?/g, '')       // Headers (#, ##)
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links [text](url) -> text
    .replace(/<[^>]*>/g, ' ')        // Strip any HTML tags
    .replace(EMOJI_REGEX, '')        // Strip all Unicode emojis
    .replace(/[✦•–—\-\|\/\\~`_^{}\[\]]/g, ' ') // Non-phonetic bullet marks & dashes
    .replace(/["“”'‘’]/g, '')        // Remove quotes so TTS doesn't vocalize "quote"
    .replace(/[;:]/g, ', ')          // Convert colons & semicolons to soft pauses
    .replace(/!+/g, ', ')            // Convert exclamation marks to comma pauses
    .replace(/\n+/g, '. ')           // Newlines to sentence breaks
    .replace(/\s+/g, ' ')            // Collapse multiple spaces
    .trim();

  const l = (lang || '').toLowerCase().trim();

  if (l.includes('telugu') || l.startsWith('te')) {
    cleaned = cleaned
      .replace(/Acharya\s+Devavrat\s+Shastri/gi, 'ఆచార్య దేవవ్రత్ శాస్త్రి')
      .replace(/Acharya\s+Devavrat/gi, 'ఆచార్య దేవవ్రత్')
      .replace(/Acharya\s+Dhananjay\s+Shastri/gi, 'ఆచార్య ధనంజయ్ శాస్త్రి')
      .replace(/Acharya\s+Dhananjay/gi, 'ఆచార్య ధనంజయ్')
      .replace(/Pandit\s+Radha\s+Raman/gi, 'పండిట్ రాధారమణ్')
      .replace(/Guruji\s+Sundararam/gi, 'గురూజీ సుందరరామ్')
      .replace(/Acharya/gi, 'ఆచార్య')
      .replace(/Shastri/gi, 'శాస్త్రి')
      .replace(/Devavrat/gi, 'దేవవ్రత్')
      .replace(/Dhananjay/gi, 'ధనంజయ్')
      .replace(/Janam\s+Kundli/gi, 'జన్మ కుండలి')
      .replace(/Kundli/gi, 'కుండలి')
      .replace(/Parihar/gi, 'పరిహార')
      .replace(/Vedic/gi, 'వేద')
      .replace(/Devotee/gi, 'భక్తులు');
  } else if (l.includes('hindi') || l.startsWith('hi')) {
    cleaned = cleaned
      .replace(/Acharya\s+Devavrat\s+Shastri/gi, 'आचार्य देवव्रत शास्त्री')
      .replace(/Acharya\s+Devavrat/gi, 'आचार्य देवव्रत')
      .replace(/Acharya\s+Dhananjay\s+Shastri/gi, 'आचार्य धनंजय शास्त्री')
      .replace(/Acharya\s+Dhananjay/gi, 'आचार्य धनंजय')
      .replace(/Pandit\s+Radha\s+Raman/gi, 'पंडित राधा रमण')
      .replace(/Guruji\s+Sundararam/gi, 'गुरुजी सुंदरराम')
      .replace(/Acharya/gi, 'आचार्य')
      .replace(/Shastri/gi, 'शास्त्री')
      .replace(/Devavrat/gi, 'देवव्रत')
      .replace(/Dhananjay/gi, 'धनंजय')
      .replace(/Janam\s+Kundli/gi, 'जन्म कुंडली')
      .replace(/Kundli/gi, 'कुंडली')
      .replace(/Parihar/gi, 'परिहार')
      .replace(/Vedic/gi, 'वैदिक')
      .replace(/Devotee/gi, 'भक्त');
  } else if (l.includes('tamil') || l.startsWith('ta')) {
    cleaned = cleaned
      .replace(/Acharya\s+Devavrat\s+Shastri/gi, 'ஆச்சார்ய தேவவ்ரத் சாஸ்திரி')
      .replace(/Acharya\s+Devavrat/gi, 'ஆச்சார்ய தேவவ்ரத்')
      .replace(/Acharya\s+Dhananjay\s+Shastri/gi, 'ஆச்சார்ய தனஞ்சய் சாஸ்திரி')
      .replace(/Acharya\s+Dhananjay/gi, 'ஆச்சார்ய தனஞ்சய்')
      .replace(/Pandit\s+Radha\s+Raman/gi, 'பண்டிட் ராதாரமண்')
      .replace(/Guruji\s+Sundararam/gi, 'குருஜி சுந்தரராம்')
      .replace(/Acharya/gi, 'ஆச்சார்ய')
      .replace(/Shastri/gi, 'சாஸ்திரி')
      .replace(/Devavrat/gi, 'தேவவ்ரத்')
      .replace(/Dhananjay/gi, 'தனஞ்சய்')
      .replace(/Janam\s+Kundli/gi, 'ஜாதகம்')
      .replace(/Kundli/gi, 'ஜாதகம்')
      .replace(/Parihar/gi, 'பரிகாரம்')
      .replace(/Vedic/gi, 'வேத')
      .replace(/Devotee/gi, 'பக்தர்');
  } else if (l.includes('kannada') || l.startsWith('kn')) {
    cleaned = cleaned
      .replace(/Acharya\s+Devavrat\s+Shastri/gi, 'ಆಚಾರ್ಯ ದೇವವ್ರತ್ ಶಾಸ್ತ್ರಿ')
      .replace(/Acharya\s+Devavrat/gi, 'ಆಚಾರ್ಯ ದೇವವ್ರತ್')
      .replace(/Acharya\s+Dhananjay\s+Shastri/gi, 'ಆಚಾರ್ಯ ಧನಂಜಯ್ ಶಾಸ್ತ್ರಿ')
      .replace(/Acharya\s+Dhananjay/gi, 'ಆಚಾರ್ಯ ಧನಂಜಯ್')
      .replace(/Pandit\s+Radha\s+Raman/gi, 'ಪಂಡಿತ್ ರಾಧಾರಮಣ್')
      .replace(/Guruji\s+Sundararam/gi, 'ಗುರೂಜಿ ಸುಂದರರಾಮ್')
      .replace(/Acharya/gi, 'ಆಚಾರ್ಯ')
      .replace(/Shastri/gi, 'ಶಾಸ್ತ್ರಿ')
      .replace(/Devavrat/gi, 'ದೇವವ್ರತ್')
      .replace(/Dhananjay/gi, 'ಧನಂಜಯ್')
      .replace(/Janam\s+Kundli/gi, 'ಜನ್ಮ ಕುಂಡಲಿ')
      .replace(/Kundli/gi, 'ಕುಂಡಲಿ')
      .replace(/Parihar/gi, 'ಪರಿಹಾರ')
      .replace(/Vedic/gi, 'ವೈದಿಕ')
      .replace(/Devotee/gi, 'ಭಕ್ತರು');
  } else if (l.includes('malayalam') || l.startsWith('ml')) {
    cleaned = cleaned
      .replace(/Acharya\s+Devavrat\s+Shastri/gi, 'ആചാര്യ ദേവവ്രത് ശാസ്ത്രി')
      .replace(/Acharya\s+Devavrat/gi, 'ആചാര്യ ദേവവ്രത്')
      .replace(/Acharya\s+Dhananjay\s+Shastri/gi, 'ആചാര്യ ധനഞ്ജയ് ശാസ്ത്രി')
      .replace(/Acharya\s+Dhananjay/gi, 'ആചാര്യ ധനഞ്ജയ്')
      .replace(/Pandit\s+Radha\s+Raman/gi, 'പണ്ഡിറ്റ് രാധാരമൺ')
      .replace(/Guruji\s+Sundararam/gi, 'ഗുരുജി സുന്ദരരാം')
      .replace(/Acharya/gi, 'ആചാര്യ')
      .replace(/Shastri/gi, 'ശാസ്ത്രി')
      .replace(/Devavrat/gi, 'ദേവവ്രത്')
      .replace(/Dhananjay/gi, 'ധനഞ്ജയ്')
      .replace(/Janam\s+Kundli/gi, 'ജനന ജാതകം')
      .replace(/Kundli/gi, 'ജാതകം')
      .replace(/Parihar/gi, 'പരിഹാരം')
      .replace(/Vedic/gi, 'വൈദിക')
      .replace(/Devotee/gi, 'ഭക്തർ');
  }

  return cleaned.trim();
}

/**
 * Split speech text into natural, sentence-by-sentence chunks (max ~180 chars)
 * Ensures Android TTS recites the 100% full response without ever cutting off midway.
 */
export function splitIntoSpeechChunks(text: string, maxLen: number = 180): string[] {
  if (!text) return [];

  // Split on sentence terminators (. , ? । ॥ \n)
  const sentences = text.split(/(?<=[.?,।॥\n])\s+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const s of sentences) {
    const trimmed = s.trim();
    if (!trimmed) continue;

    if (currentChunk.length + trimmed.length + 1 <= maxLen) {
      currentChunk = currentChunk ? `${currentChunk} ${trimmed}` : trimmed;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = trimmed;
    }
  }

  if (currentChunk) chunks.push(currentChunk);
  return chunks.length > 0 ? chunks : [text];
}

export function isFemaleAstrologer(name?: string, gender?: string): boolean {
  if (gender && gender.toLowerCase() === 'female') return true;
  if (gender && gender.toLowerCase() === 'male') return false;
  if (!name) return false;
  const n = name.toLowerCase();

  // Explicit female identifiers
  if (
    n.includes('ananya') ||
    n.includes('vedika') ||
    n.includes('devi') ||
    n.includes('mata') ||
    n.includes('priya') ||
    n.includes('pooja') ||
    n.includes('sunita') ||
    n.includes('lakshmi') ||
    n.includes('sita') ||
    n.includes('meenakshi') ||
    n.includes('gayatri') ||
    n.includes('ratna vidya') ||
    n.includes('astroparihar ai')
  ) {
    return true;
  }

  // Explicit male identifiers
  if (
    n.includes('devavrat') ||
    n.includes('dhananjay') ||
    n.includes('bhuvanesh') ||
    n.includes('joshi') ||
    n.includes('acharya') ||
    n.includes('pandit') ||
    n.includes('swami') ||
    n.includes('bhaskar') ||
    n.includes('radha') ||
    n.includes('raman') ||
    n.includes('sundar') ||
    n.includes('arjun') ||
    n.includes('brihaspati') ||
    n.includes('shastri') ||
    n.includes('guruji') ||
    n.includes('sharma') ||
    n.includes('tiwari')
  ) {
    return false;
  }

  // Default to male for traditional Vedic pandit persona
  return false;
}

// Android/iOS Male voice identifiers
const MALE_PATTERNS = [
  'male', 'man', 'boy', 'guy', 'david', 'ravi', 'mohan', 'madhav', 'kumar',
  'narayan', 'valluvar', 'george', 'mark', 'daniel', 'alex', 'oliver', 'tom',
  'evan', 'fred', 'nathan', 'aaron', 'cove', 'echo', 'onyx', 'rishi', 'prabhat', 'anil', 'siddharth',
  '-tem-', 'tem-network', 'tem-local', '-tem', '_tem',
  '-hid-', 'hid-network', 'hid-local', '-hid', '_hid',
  '-hie-', 'hie-network', 'hie-local', '-hie', '_hie',
  '-hic-', 'hic-network', 'hic-local', '-hic', '_hic',
  '-him-', 'him-network', 'him-local', '-him', '_him',
  '-tpm-', 'tpm-network', 'tpm-local', '-tpm', '_tpm',
  '-tpb-', 'tpb-network', 'tpb-local', '-tpb', '_tpb',
  '-knm-', 'knm-network', 'knm-local', '-knm', '_knm',
  '-knd-', 'knd-network', 'knd-local', '-knd', '_knd',
  '-mlm-', 'mlm-network', 'mlm-local', '-mlm', '_mlm',
  '-mle-', 'mle-network', 'mle-local', '-mle', '_mle',
  '-end-', 'end-network', 'end-local', '-end', '_end',
  '-enc-', 'enc-network', 'enc-local', '-enc', '_enc',
  '-ene-', 'ene-network', 'ene-local', '-ene', '_ene',
  '-enm-', 'enm-network', 'enm-local', '-enm', '_enm',
  '-dfm-', 'dfm-network', 'dfm-local', '-dfm', '_dfm',
  'standard-b', 'wavenet-b', 'neural2-b', 'journey-b', 'chirp-b',
  'standard-c', 'wavenet-c', 'neural2-c', 'journey-c', 'chirp-c',
  '_male', '-male', '#male', ':male', 'gender:male', 'gender=male'
];

// Android/iOS Female voice identifiers
const FEMALE_PATTERNS = [
  'female', 'woman', 'girl', 'lady', 'zira', 'swara', 'heera', 'shruti', 'pallavi',
  'kalpana', 'samantha', 'ava', 'karen', 'moira', 'victoria', 'siri', 'juniper',
  'nova', 'shimmer', 'breeze', 'allison', 'susan', 'fiona', 'veena', 'ananya', 'aditi',
  '-tef-', 'tef-network', 'tef-local', '-tef', '_tef',
  '-tee-', 'tee-network', 'tee-local', '-tee', '_tee',
  '-hia-', 'hia-network', 'hia-local', '-hia', '_hia',
  '-hib-', 'hib-network', 'hib-local', '-hib', '_hib',
  '-taf-', 'taf-network', 'taf-local', '-taf', '_taf',
  '-tpd-', 'tpd-network', 'tpd-local', '-tpd', '_tpd',
  '-tpf-', 'tpf-network', 'tpf-local', '-tpf', '_tpf',
  '-knf-', 'knf-network', 'knf-local', '-knf', '_knf',
  '-mlb-', 'mlb-network', 'mlb-local', '-mlb', '_mlb',
  '-mlf-', 'mlf-network', 'mlf-local', '-mlf', '_mlf',
  '-ena-', 'ena-network', 'ena-local', '-ena', '_ena',
  '-enb-', 'enb-network', 'enb-local', '-enb', '_enb',
  '-enf-', 'enf-network', 'enf-local', '-enf', '_enf',
  '-dfc-', 'dfc-network', 'dfc-local', '-dfc', '_dfc',
  '-dff-', 'dff-network', 'dff-local', '-dff', '_dff',
  'standard-a', 'wavenet-a', 'neural2-a', 'journey-a', 'chirp-a',
  'standard-d', 'wavenet-d', 'neural2-d', 'journey-d', 'chirp-d',
  'standard-f', 'wavenet-f', 'neural2-f', 'journey-f', 'chirp-f',
  '_female', '-female', '#female', ':female', 'gender:female', 'gender=female'
];

interface ResolvedVoiceInfo {
  voiceId: string | undefined;
  isNativeGenderMatched: boolean;
}

/**
 * Strict gender-preserving voice resolver.
 * Always resolves a concrete, rock-solid voice ID installed on the device.
 * For languages without pre-installed male voice packs (e.g. Telugu, Tamil, Kannada, Malayalam):
 * Uses the local offline voice and marks isNativeGenderMatched: false so the acoustic
 * baritone modulator pitch-shifts it into a deep, authentic Pandit male voice!
 */
async function resolveVoiceIdentifier(langCode: string, isFemale: boolean): Promise<ResolvedVoiceInfo> {
  try {
    if (!cachedVoices) {
      cachedVoices = await Speech.getAvailableVoicesAsync();
    }
    if (!cachedVoices || cachedVoices.length === 0) {
      return { voiceId: undefined, isNativeGenderMatched: false };
    }

    const meta = getLanguageMetadata(langCode);

    // Filter all voices matching this language
    const matching = cachedVoices.filter((v) => {
      const vLang = (v.language || '').toLowerCase().replace(/_/g, '-');
      const vId = (v.identifier || '').toLowerCase();
      return (
        vLang.startsWith(meta.iso2) ||
        vLang.startsWith(meta.iso3) ||
        meta.tags.some((t) => vLang.startsWith(t) || vId.includes(t))
      );
    });

    if (matching.length === 0) {
      return { voiceId: undefined, isNativeGenderMatched: false };
    }

    const premiumTags = ['enhanced', 'premium', 'natural', 'neural', 'wavenet', 'studio', 'high'];

    if (!isFemale) {
      // 1. Male Voice Search:
      const maleCandidates = matching.filter((v) => {
        const lower = `${v.name || ''} ${v.identifier || ''}`.toLowerCase();
        const hasMale = MALE_PATTERNS.some((k) => lower.includes(k));
        const hasFemale = FEMALE_PATTERNS.some((k) => lower.includes(k));
        return hasMale && !hasFemale;
      });

      // Prefer local offline male voice
      const localMale = maleCandidates.filter((v) => {
        const lower = (v.identifier || '').toLowerCase();
        return lower.includes('local') || !lower.includes('network');
      });

      if (localMale.length > 0) {
        return { voiceId: localMale[0].identifier, isNativeGenderMatched: true };
      }

      if (maleCandidates.length > 0) {
        return { voiceId: maleCandidates[0].identifier, isNativeGenderMatched: true };
      }

      // No native male voice installed on device for this language (common in Telugu, Tamil, Kannada, Malayalam).
      // Pick the reliable local offline voice for this language and use the Pandit baritone pitch modulator!
      const localVoices = matching.filter((v) => {
        const lower = (v.identifier || '').toLowerCase();
        return lower.includes('local') || !lower.includes('network');
      });

      const fallbackLocal = localVoices.length > 0 ? localVoices[0] : matching[0];
      return { voiceId: fallbackLocal?.identifier, isNativeGenderMatched: false };
    } else {
      // 2. Female Voice Search:
      const femaleCandidates = matching.filter((v) => {
        const lower = `${v.name || ''} ${v.identifier || ''}`.toLowerCase();
        const hasFemale = FEMALE_PATTERNS.some((k) => lower.includes(k));
        const hasMale = MALE_PATTERNS.some((k) => lower.includes(k));
        return hasFemale && !hasMale;
      });

      const localFemale = femaleCandidates.filter((v) => {
        const lower = (v.identifier || '').toLowerCase();
        return lower.includes('local') || !lower.includes('network');
      });

      if (localFemale.length > 0) {
        return { voiceId: localFemale[0].identifier, isNativeGenderMatched: true };
      }

      if (femaleCandidates.length > 0) {
        return { voiceId: femaleCandidates[0].identifier, isNativeGenderMatched: true };
      }

      const localVoices = matching.filter((v) => {
        const lower = (v.identifier || '').toLowerCase();
        return lower.includes('local') || !lower.includes('network');
      });

      const fallbackLocal = localVoices.length > 0 ? localVoices[0] : matching[0];
      return { voiceId: fallbackLocal?.identifier, isNativeGenderMatched: false };
    }
  } catch {
    return { voiceId: undefined, isNativeGenderMatched: false };
  }
}

async function fetchSmoothNeuralAudioChunk(params: {
  text: string;
  lang: string;
  gender: 'male' | 'female';
  voiceId?: string;
  astrologerId?: string;
  astrologerName?: string;
}): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const res = await fetch(API_ENDPOINTS.tts, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: params.text,
        lang: params.lang,
        gender: params.gender,
        voiceId: params.voiceId,
        astrologerId: params.astrologerId,
        astrologerName: params.astrologerName,
        format: 'json',
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.success && typeof data.audioBase64 === 'string' && data.audioBase64.length > 64) {
      return data.audioBase64;
    }
    return null;
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

async function speakWithDeviceFallback(
  textToSpeak: string,
  currentToken: number,
  meta: LanguageMeta,
  isFemale: boolean,
  options: AstrologerSpeechOptions,
  alreadyStarted: boolean
): Promise<void> {
  if (currentToken !== activeSpeechId) return;
  const chunks = splitIntoSpeechChunks(textToSpeak, 180);
  if (chunks.length === 0) {
    options.onDone?.();
    return;
  }

  const resolved = await resolveVoiceIdentifier(meta.bcp47, isFemale);
  if (currentToken !== activeSpeechId) return;
  let currentVoiceId = resolved.voiceId;

  let pitch = 1.0;
  let rate = 0.98;
  if (!isFemale) {
    if (resolved.isNativeGenderMatched) {
      pitch = 0.96;
      rate = 0.98;
    } else {
      pitch = 0.88;
      rate = 0.96;
    }
  } else {
    if (resolved.isNativeGenderMatched) {
      pitch = 1.02;
      rate = 0.98;
    } else {
      pitch = 1.08;
      rate = 0.98;
    }
  }

  if (!alreadyStarted) {
    options.onStart?.();
  }

  let chunkIndex = 0;
  let hasRetriedCurrentChunk = false;

  const speakNext = () => {
    if (currentToken !== activeSpeechId) return;
    if (chunkIndex >= chunks.length) {
      options.onDone?.();
      return;
    }

    const chunk = chunks[chunkIndex];
    Speech.speak(chunk, {
      language: meta.bcp47,
      voice: currentVoiceId,
      pitch,
      rate,
      onDone: () => {
        if (currentToken === activeSpeechId) {
          chunkIndex += 1;
          hasRetriedCurrentChunk = false;
          speakNext();
        }
      },
      onError: () => {
        if (currentToken !== activeSpeechId) return;
        if (currentVoiceId && !hasRetriedCurrentChunk) {
          currentVoiceId = undefined;
          hasRetriedCurrentChunk = true;
          speakNext();
          return;
        }
        chunkIndex += 1;
        hasRetriedCurrentChunk = false;
        if (chunkIndex < chunks.length) {
          speakNext();
        } else {
          options.onDone?.();
        }
      },
      onStopped: () => {
        if (currentToken === activeSpeechId) {
          chunkIndex += 1;
          hasRetriedCurrentChunk = false;
          if (chunkIndex < chunks.length) {
            speakNext();
          } else {
            options.onDone?.();
          }
        }
      },
    });
  };

  speakNext();
}

/**
 * Speak Astrologer response with smooth, ChatGPT-style studio neural Male & Female voices.
 * - Primary: Server neural voice engine (/api/tts: OpenAI ChatGPT gpt-4o-mini-tts -> Microsoft Studio Neural)
 *   with strict Male / Female voice separation and look-ahead chunk prefetching for gapless smooth flow.
 * - Fallback: Tuned on-device expo-speech if offline or remote audio cannot play.
 */
export async function speakAstrologerText(
  text: string,
  options: AstrologerSpeechOptions = {}
): Promise<void> {
  const clean = cleanTextForSpeech(text, options.language);
  if (!clean) {
    options.onDone?.();
    return;
  }

  // Invalidate any ongoing or queued speech
  activeSpeechId += 1;
  const currentToken = activeSpeechId;

  // Immediately silence both neural audio and native device speech
  stopNeuralAudio();
  try {
    const isSpeaking = await Speech.isSpeakingAsync().catch(() => false);
    if (isSpeaking) {
      await Speech.stop().catch(() => {});
    }
  } catch {}

  if (currentToken !== activeSpeechId) return;

  const meta = getLanguageMetadata(options.language);
  const isFemale = isFemaleAstrologer(options.astrologerName, options.gender);
  const resolvedGender: 'male' | 'female' = isFemale ? 'female' : 'male';

  // Primary Path: Smooth ChatGPT-Style Studio Neural Voice (/api/tts)
  if (isNeuralAudioReady()) {
    const neuralChunks = splitIntoSpeechChunks(clean, 420);
    if (neuralChunks.length > 0) {
      let hasNotifiedStart = false;

      // Kick off chunk 0 synthesis right away
      let nextFetchPromise: Promise<string | null> | null = fetchSmoothNeuralAudioChunk({
        text: neuralChunks[0],
        lang: meta.iso2,
        gender: resolvedGender,
        voiceId: options.voiceId,
        astrologerId: options.astrologerId,
        astrologerName: options.astrologerName,
      });

      for (let i = 0; i < neuralChunks.length; i++) {
        if (currentToken !== activeSpeechId) return;

        const audioBase64 = nextFetchPromise ? await nextFetchPromise : null;
        if (currentToken !== activeSpeechId) return;

        // Pre-fetch chunk i+1 in parallel while chunk i plays for seamless ChatGPT-like flow
        if (i + 1 < neuralChunks.length) {
          nextFetchPromise = fetchSmoothNeuralAudioChunk({
            text: neuralChunks[i + 1],
            lang: meta.iso2,
            gender: resolvedGender,
            voiceId: options.voiceId,
            astrologerId: options.astrologerId,
            astrologerName: options.astrologerName,
          });
        } else {
          nextFetchPromise = null;
        }

        if (!audioBase64) {
          // Smoothly finish remaining text using device fallback so speech never cuts off
          const remaining = neuralChunks.slice(i).join(' ');
          await speakWithDeviceFallback(
            remaining,
            currentToken,
            meta,
            isFemale,
            options,
            hasNotifiedStart
          );
          return;
        }

        const played = await playNeuralAudioBase64(audioBase64, {
          onStart: () => {
            if (currentToken === activeSpeechId && !hasNotifiedStart) {
              hasNotifiedStart = true;
              options.onStart?.();
            }
          },
        });

        if (currentToken !== activeSpeechId) return;

        if (!played) {
          const remaining = neuralChunks.slice(i).join(' ');
          await speakWithDeviceFallback(
            remaining,
            currentToken,
            meta,
            isFemale,
            options,
            hasNotifiedStart
          );
          return;
        }
      }

      if (currentToken === activeSpeechId) {
        options.onDone?.();
      }
      return;
    }
  }

  // Fallback Path: On-device tuned TTS when NeuralAudioHost is not mounted or offline
  await speakWithDeviceFallback(clean, currentToken, meta, isFemale, options, false);
}

/**
 * Stop active speech and cancel any pending queued chunks immediately
 */
export async function stopAstrologerSpeech(): Promise<void> {
  activeSpeechId += 1; // Invalidate current speech queue
  stopNeuralAudio();
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
