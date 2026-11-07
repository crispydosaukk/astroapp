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

export interface AstrologerSpeechOptions {
  language?: string;
  astrologerName?: string;
  gender?: 'male' | 'female';
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

  // Explicit male identifiers
  if (
    n.includes('devavrat') ||
    n.includes('dhananjay') ||
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
    n.includes('guruji')
  ) {
    return false;
  }

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
    n.includes('sita')
  ) {
    return true;
  }

  // Default to male for traditional Vedic pandit persona
  return false;
}

// Android/iOS Male voice identifiers
const MALE_PATTERNS = [
  'male', 'man', 'boy', 'guy', 'david', 'ravi', 'mohan', 'madhav', 'kumar',
  'narayan', 'valluvar', 'george', 'mark', 'daniel', 'alex', 'oliver', 'tom',
  'evan', 'fred', 'nathan', 'aaron', 'cove', 'echo', 'onyx',
  '-tem-', 'tem-network', 'tem-local', 'tem',
  '-hid-', 'hid-network', 'hid-local', 'hid',
  '-hie-', 'hie-network', 'hie-local', 'hie',
  '-hic-', 'hic-network', 'hic-local', 'hic',
  '-tpb-', 'tpb-network', 'tpb-local', 'tpb',
  '-knd-', 'knd-network', 'knd-local', 'knd',
  '-mle-', 'mle-network', 'mle-local', 'mle',
  '-end-', 'end-network', 'end-local', 'end',
  '-enc-', 'enc-network', 'enc-local', 'enc',
  '-ene-', 'ene-network', 'ene-local', 'ene',
  '-m-', '#male', 'gender:male'
];

// Android/iOS Female voice identifiers
const FEMALE_PATTERNS = [
  'female', 'woman', 'girl', 'zira', 'swara', 'heera', 'shruti', 'pallavi',
  'kalpana', 'samantha', 'ava', 'karen', 'moira', 'victoria', 'siri', 'juniper',
  'nova', 'shimmer', 'breeze', 'allison', 'susan',
  '-tef-', 'tef-network', 'tef-local', 'tef',
  '-tee-', 'tee-network', 'tee-local', 'tee',
  '-hia-', 'hia-network', 'hia-local', 'hia',
  '-hib-', 'hib-network', 'hib-local', 'hib',
  '-tpd-', 'tpd-network', 'tpd-local', 'tpd',
  '-knf-', 'knf-network', 'knf-local', 'knf',
  '-mlb-', 'mlb-network', 'mlb-local', 'mlb',
  '-ena-', 'ena-network', 'ena-local', 'ena',
  '-enb-', 'enb-network', 'enb-local', 'enb',
  '-f-', '#female', 'gender:female'
];

interface ResolvedVoiceInfo {
  voiceId: string | undefined;
  isNativeGenderMatched: boolean;
}

/**
 * Strict language-preserving voice resolver.
 * ALWAYS selects a voice for the requested language. NEVER returns an English voice for Telugu, Hindi, etc.
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

    const targetPatterns = isFemale ? FEMALE_PATTERNS : MALE_PATTERNS;
    const oppositePatterns = isFemale ? MALE_PATTERNS : FEMALE_PATTERNS;
    const premiumTags = ['enhanced', 'premium', 'natural', 'neural', 'wavenet', 'studio', 'high'];

    // Score all matching voices for this specific language
    const scored = matching.map((v) => {
      const lower = `${v.name || ''} ${v.identifier || ''}`.toLowerCase();
      let score = 0;

      const isTarget = targetPatterns.some((k) => lower.includes(k));
      const isOpposite = oppositePatterns.some((k) => lower.includes(k));

      if (isTarget) score += 60;
      if (isOpposite) score -= 30;

      // Local / installed voices are most reliable on Android
      if (lower.includes('-local') || lower.includes('local') || !lower.includes('network')) score += 30;
      if (premiumTags.some((tag) => lower.includes(tag))) score += 20;
      if ((v as any).quality === 'Enhanced' || (v as any).quality === 'Premium') score += 15;
      if (v.language?.toLowerCase() === meta.bcp47.toLowerCase()) score += 10;

      return { voice: v, score, isTarget };
    });

    scored.sort((a, b) => b.score - a.score);

    const best = scored[0];
    const bestLower = `${best.voice.name || ''} ${best.voice.identifier || ''}`.toLowerCase();
    const isTargetMatched = targetPatterns.some((k) => bestLower.includes(k));

    return {
      voiceId: best.voice.identifier,
      isNativeGenderMatched: isTargetMatched,
    };
  } catch {
    return { voiceId: undefined, isNativeGenderMatched: false };
  }
}

/**
 * Speak Astrologer response with strict gender fidelity across ALL languages.
 * - Male Astrologers: Resonant, mature Pandit baritone (NO high-pitched girl voice in Telugu, Hindi, Tamil, etc.).
 * - Female Astrologers: Sweet, soothing maternal voice.
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

  try {
    await Speech.stop();
  } catch {}

  const chunks = splitIntoSpeechChunks(clean, 180);
  if (chunks.length === 0) {
    options.onDone?.();
    return;
  }

  const meta = getLanguageMetadata(options.language);
  const isFemale = isFemaleAstrologer(options.astrologerName, options.gender);

  const resolved = await resolveVoiceIdentifier(meta.bcp47, isFemale);
  let currentVoiceId = resolved.voiceId;

  // Strict Acoustic Timbre Modulation (Gemini / ChatGPT natural conversational cadence):
  // Ensures Boy = Boy, Girl = Girl across ALL languages (English, Telugu, Hindi, Tamil, Kannada, Malayalam).
  let pitch = 1.00;
  let rate = 0.98;

  if (!isFemale) {
    // MALE ASTROLOGER (Acharya Devavrat / Dhananjay / Swami / Pandit / Bhaskar)
    if (resolved.isNativeGenderMatched && currentVoiceId) {
      // Natural native male voice found (e.g. English male 'end', Telugu 'tem', Hindi 'hid')
      pitch = 0.96;
      rate = 0.98;
    } else {
      // The device only has a default/female voice installed for this language:
      // Modulate pitch naturally into an authentic, clear male Pandit baritone
      pitch = 0.85;
      rate = 0.94;
    }
  } else {
    // FEMALE ASTROLOGER (Devi / Mata / Ananya / Vedika / Priya)
    if (resolved.isNativeGenderMatched && currentVoiceId) {
      pitch = 1.02;
      rate = 0.98;
    } else {
      pitch = 1.10;
      rate = 0.98;
    }
  }

  options.onStart?.();

  let chunkIndex = 0;
  let hasRetriedCurrentChunk = false;

  const speakNext = () => {
    if (currentToken !== activeSpeechId) return;

    if (chunkIndex >= chunks.length) {
      options.onDone?.();
      return;
    }

    const chunk = chunks[chunkIndex];
    const langToSpeak = meta.bcp47;

    Speech.speak(chunk, {
      language: langToSpeak,
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
      onError: (err) => {
        console.warn('Speech chunk error for language:', meta.bcp47, err);
        if (currentToken !== activeSpeechId) return;

        // If specific voice ID failed, retry ONCE with default voice for this language
        if (currentVoiceId && !hasRetriedCurrentChunk) {
          currentVoiceId = undefined;
          hasRetriedCurrentChunk = true;
          speakNext();
          return;
        }

        // Advance to next chunk so recitation never stalls
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
