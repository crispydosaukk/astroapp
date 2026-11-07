/**
 * aiChatClarification.ts
 *
 * ChatGPT-style conversational clarification and input guard for AstroParihar AI Chat.
 * When users type ambiguous, single-letter, keyboard-mash, voice-to-text typos (e.g. "A", "Vee see", "Dizi ZZ"),
 * or unrelated non-astrology questions, this module provides natural, polite clarification quoting the user's input,
 * identical to ChatGPT's intelligent conversational guidance.
 */

export interface ClarificationResult {
  needsClarification: boolean;
  message: string;
  category: 'short_letter' | 'voice_to_text' | 'gibberish' | 'unrelated';
}

// Broad keywords that indicate genuine astrological, life, horoscope, or consultation questions
const ASTROLOGY_KEYWORDS = [
  // Core astrology terms
  'kundli', 'kundali', 'janam', 'horoscope', 'astrology', 'astrologer', 'astro',
  'rashi', 'rashee', 'rasi', 'nakshatra', 'nakshatram', 'lagna', 'ascendant',
  'dasha', 'dasa', 'mahadasha', 'antardasha', 'bhukti', 'gochar', 'transit',
  'chart', 'birth chart', 'planetary', 'planet', 'graha', 'navagraha', 'ephemeris',
  // Planets
  'sun', 'surya', 'moon', 'chandra', 'mars', 'mangal', 'kuja', 'angarak', 'chevva',
  'mercury', 'budh', 'budha', 'jupiter', 'guru', 'brihaspati', 'vyazham',
  'venus', 'shukra', 'shukran', 'saturn', 'shani', 'sani', 'rahu', 'ketu',
  // Career & Work
  'career', 'job', 'work', 'promotion', 'business', 'company', 'office',
  'interview', 'salary', 'income', 'boss', 'employment', 'unemployed', 'placement',
  'naukri', 'vyapar', 'pesha', 'rozgar',
  // Marriage & Relationships
  'marriage', 'marry', 'married', 'wedding', 'spouse', 'husband', 'wife',
  'partner', 'life partner', 'love', 'relation', 'relationship', 'affair',
  'divorce', 'breakup', 'separation', 'remarriage', 'match', 'matching', 'compatibility',
  'manglik', 'vivah', 'shadi', 'shaadi', 'rishta', 'vara', 'vadhu',
  // Wealth & Finance
  'money', 'wealth', 'finance', 'financial', 'debt', 'loan', 'rich', 'poor',
  'loss', 'profit', 'investment', 'share market', 'trading', 'dhan', 'paisa', 'lakshmi',
  // Health
  'health', 'disease', 'illness', 'medical', 'sickness', 'operation', 'surgery',
  'hospital', 'cure', 'recovery', 'mental', 'stress', 'depression', 'arogya', 'swasthya',
  // Family & Children
  'child', 'children', 'baby', 'pregnant', 'pregnancy', 'conceive', 'conception',
  'son', 'daughter', 'kids', 'santan', 'vansh', 'family', 'parents', 'mother', 'father',
  // Education & Foreign
  'education', 'study', 'studies', 'exam', 'examination', 'result', 'college',
  'school', 'university', 'degree', 'abroad', 'foreign', 'travel', 'visa', 'pr', 'settlement',
  // Remedies & Spiritual
  'remedy', 'remedies', 'gemstone', 'ratna', 'ring', 'puja', 'pooja', 'havan', 'homa',
  'mantra', 'japa', 'stotram', 'temple', 'mandir', 'dosha', 'dosham', 'parihar',
  'pariharam', 'shanti', 'kaal sarp', 'sade sati', 'sadesati', 'pitra', 'chandal', 'guru chandal',
  // Life queries
  'future', 'destiny', 'luck', 'lucky', 'unlucky', 'fate', 'predict', 'prediction',
  'guidance', 'blessing', 'obstacle', 'problem', 'life', 'birth', 'dob', 'tob', 'pob',
  // Indic terms: Telugu
  'పెళ్లి', 'వివాహం', 'సంబంధం', 'ఉద్యోగం', 'జాబ్', 'కెరీర్', 'వ్యాపారం',
  'డబ్బు', 'ధనం', 'ఆర్థికం', 'కుండలి', 'జాతకం', 'రాశి', 'నక్షత్రం', 'గ్రహం',
  'లగ్నం', 'దశ', 'గోచారం', 'శని', 'గురు', 'రాహు', 'కేతు', 'కుజ', 'దోషం',
  'పరిహారం', 'పూజ', 'రత్నం', 'ఆరోగ్యం', 'పిల్లలు', 'సంతానం', 'చదువు', 'విదేశం',
  'భవిష్యత్తు', 'అదృష్టం', 'ఎప్పుడు', 'ఎలా', 'ఏమిటి',
  // Indic terms: Hindi
  'शादी', 'विवाह', 'नौकरी', 'करियर', 'व्यापार', 'धन', 'पैसा', 'रुपया',
  'कुंडली', 'राशिफल', 'राशि', 'नक्षत्र', 'ग्रह', 'गोचर', 'दशा', 'महादशा',
  'शनि', 'गुरु', 'राहु', 'केतु', 'मंगल', 'दोष', 'उपाय', 'पूजा', 'रत्न',
  'स्वास्थ्य', 'संतान', 'शिक्षा', 'विदेश', 'भविष्य', 'भाग्य', 'कब', 'कैसे', 'क्या',
  // Indic terms: Tamil
  'திருமணம்', 'வேலை', 'தொழில்', 'பணம்', 'ஜாதகம்', 'ராசி', 'நட்சத்திரம்',
  'கிரகம்', 'சனி', 'குரு', 'ராகு', 'கேது', 'தோஷம்', 'பரிகாரம்', 'பூஜை',
  'ஆரோக்கியம்', 'எதிர்காலம்', 'எப்போது', 'எப்படி', 'என்ன',
  // Indic terms: Kannada
  'ಮದುವೆ', 'ವಿವಾಹ', 'ಕೆಲಸ', 'ಉದ್ಯೋಗ', 'ಹಣ', 'ಜನ್ಮ ಕುಂಡಲಿ', 'ರಾಶಿ',
  'ನಕ್ಷತ್ರ', 'ಗ್ರಹ', 'ಶನಿ', 'ಗುರು', 'ರಾಹು', 'ಕೇತು', 'ದೋಷ', 'ಪರಿಹಾರ',
  'ಆರೋಗ್ಯ', 'ಭವಿಷ್ಯ', 'ಯಾವಾಗ', 'ಹೇಗೆ', 'ಏನು',
  // Indic terms: Malayalam
  'വിവാഹം', 'ജോലി', 'തൊഴിൽ', 'പണം', 'ജാതകം', 'രാശി', 'നക്ഷത്രം',
  'ഗ്രഹം', 'ശനി', 'വ്യാഴം', 'രാഹു', 'കേതു', 'ദോഷം', 'പരിഹാരം',
  'ആരോഗ്യം', 'ഭാവി', 'എപ്പോൾ', 'എങ്ങനെ', 'എന്ത്'
];

// Obvious unrelated off-topic prefixes or patterns
const UNRELATED_PREFIXES = [
  'write code', 'python code', 'javascript code', 'html code', 'react code', 'c++ code',
  'write a poem', 'write an essay', 'tell me a joke', 'sing a song',
  'calculate', 'solve math', 'solve equation', 'formula for',
  'recipe for', 'cook food', 'how to make cake', 'how to cook',
  'what is the capital of', 'who is the president', 'who is the prime minister',
  'who won the match', 'cricket score', 'football score',
  'weather in', 'temperature in', 'translate this to',
  'how to build an app', 'what is machine learning', 'who created you'
];

// Common keyboard mashes & test words
const KEYBOARD_MASHES = [
  'asdf', 'ghjk', 'qwerty', 'zxcv', 'lkjh', 'poiuy', 'mnbvc',
  'test', 'testing', 'check', 'checking', 'blah', 'foobar', 'foo', 'bar',
  'asdfgh', 'qwert', 'xyz', 'abc'
];

/**
 * Normalizes input text for analysis while preserving original casing for user-facing echo
 */
function cleanQueryForEcho(raw: string): string {
  return raw.replace(/[\r\n\t]+/g, ' ').trim();
}

/**
 * Intelligent ChatGPT-style input clarification analyzer
 */
export function analyzeQueryClarification(
  userInput: string,
  language: string = 'English',
  astroName: string = 'Acharya Devavrat'
): ClarificationResult | null {
  const trimmed = (userInput || '').trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  const cleanEcho = cleanQueryForEcho(trimmed);

  // 1. Check if the query contains any genuine astrology / horoscope / life query keywords
  const hasAstroKeyword = ASTROLOGY_KEYWORDS.some((kw) => {
    // Word boundary or substring matching for Indic scripts
    if (/[\u0900-\u0D7F]/.test(kw)) {
      return lower.includes(kw);
    }
    const regex = new RegExp(`(^|[^a-zA-Z0-9])${kw}([^a-zA-Z0-9]|$)`, 'i');
    return regex.test(lower);
  });

  // If it has recognized astrology keywords, it is a valid astrological consultation query
  if (hasAstroKeyword) {
    return null;
  }

  // 2. Longer queries (4+ words or >= 25 chars) with natural conversational verbs usually represent valid consultation questions
  const words = lower.split(/\s+/).filter(Boolean);
  const conversationalQuestions = [
    'when', 'will', 'how', 'why', 'what', 'can', 'should', 'is', 'am', 'are', 'do', 'does',
    'tell', 'predict', 'guide', 'future', 'my', 'me', 'i', 'please', 'help', 'upcoming', 'next year'
  ];
  const hasQuestionVerb = words.some((w) => conversationalQuestions.includes(w));
  if (words.length >= 4 && hasQuestionVerb) {
    // Valid conversational user query (e.g. "Can you tell me about next year?")
    return null;
  }

  // === NOW DETECT THE SPECIFIC CLARIFICATION NEEDED (CHATGPT STYLE) ===

  // Category A: Single letter, single character, or extremely short (< 3 chars, e.g. "A", "b", "hi", "ok", "?")
  // Matches ChatGPT screenshot: User: "A" -> ChatGPT: "Could you please clarify what you mean by "A"?"
  if (trimmed.length <= 2 || words.length === 1 && trimmed.length <= 3 && !hasAstroKeyword) {
    return {
      needsClarification: true,
      category: 'short_letter',
      message: getShortLetterClarification(cleanEcho, language),
    };
  }

  // Category B: Pure symbols, numbers, repeated characters (e.g. "???", "333", "aaaa", "12345")
  const isPureSymbols = /^[\d\s.,!?@#$%^&*()_+=\-\[\]{}|\\:;"'<>~`]+$/.test(trimmed);
  const isRepeatedLetter = /^(.)\1{2,}$/.test(trimmed.replace(/\s+/g, ''));
  const isKeyboardMash = KEYBOARD_MASHES.some((mash) => lower === mash || lower.replace(/\s+/g, '') === mash);

  if (isPureSymbols || isRepeatedLetter || isKeyboardMash) {
    return {
      needsClarification: true,
      category: 'gibberish',
      message: getGibberishClarification(cleanEcho, language),
    };
  }

  // Category C: Obvious non-astrological tasks (programming, math, recipes, general trivia)
  const isUnrelatedTask = UNRELATED_PREFIXES.some((p) => lower.startsWith(p));
  if (isUnrelatedTask) {
    return {
      needsClarification: true,
      category: 'unrelated',
      message: getUnrelatedClarification(cleanEcho, language, astroName),
    };
  }

  // Category D: 1 to 3 words ambiguous phrase or voice-to-text spelling (e.g. "Vee see", "Dizi ZZ", "apple red")
  // Matches ChatGPT screenshot:
  // User: "Vee see" -> ChatGPT: 'Do you mean "Vee See" as a name, or are you trying to say something else? Could you clarify?'
  // User: "Dizi ZZ" -> ChatGPT: 'Are you referring to Dizzy ZZ, or is this a voice-to-text spelling? What are you trying to tell me?'
  if (words.length <= 3 && !hasQuestionVerb) {
    return {
      needsClarification: true,
      category: 'voice_to_text',
      message: getVoiceToTextClarification(cleanEcho, language),
    };
  }

  // Default: if no astrology context found in shorter sentence (< 5 words)
  if (words.length < 5) {
    return {
      needsClarification: true,
      category: 'voice_to_text',
      message: getVoiceToTextClarification(cleanEcho, language),
    };
  }

  return null;
}

/**
 * 1. Single letter / very short query clarification (Identical to ChatGPT "A" screenshot)
 */
function getShortLetterClarification(query: string, language: string): string {
  switch (language) {
    case 'Telugu':
      return `దయచేసి "${query}" అంటే ఏమిటో స్పష్టం చేయగలరా? మీ జన్మ కుండలి, కెరీర్, వివాహం లేదా వేద పరిహారాల గురించి ఏదైనా అడగాలనుకుంటున్నారా?`;
    case 'Hindi':
      return `क्या आप स्पष्ट कर सकते हैं कि "${query}" से आपका क्या तात्पर्य है? क्या आप अपनी जन्म कुंडली, करियर, विवाह या वैदिक उपायों के बारे में पूछना चाहते हैं?`;
    case 'Tamil':
      return `தயவுசெய்து "${query}" என்பதன் மூலம் நீங்கள் என்ன குறிப்பிடுகிறீர்கள் என்பதை விளக்க முடியுமா? உங்கள் ஜாதகம், தொழில், திருமணம் அல்லது பரிகாரங்கள் பற்றி கேட்க விரும்புகிறீர்களா?`;
    case 'Kannada':
      return `"${query}" ಎಂಬುದರ ಅರ್ಥವೇನು ಎಂಬುದನ್ನು ದಯವಿಟ್ಟು ಸ್ಪಷ್ಟಪಡಿಸಬಹುದೇ? ನಿಮ್ಮ ಜನ್ಮ ಕುಂಡಲಿ, ವೃತ್ತಿ, ವಿವಾಹ ಅಥವಾ ಪರಿಹಾರಗಳ ಬಗ್ಗೆ ತಿಳಿಯಲು ಬಯಸುತ್ತೀರಾ?`;
    case 'Malayalam':
      return `"${query}" എന്നതുകൊണ്ട് നിങ്ങൾ എന്താണ് ഉദ്ദേശിച്ചതെന്ന് ദയവായി വ്യക്തമാക്കാമോ? നിങ്ങളുടെ ജാതകം, തൊഴിൽ, വിവാഹം അല്ലെങ്കിൽ പരിഹാരങ്ങളെക്കുറിച്ചാണോ ചോദിക്കുന്നത്?`;
    default:
      return `Could you please clarify what you mean by "${query}"? Are you asking about your birth chart, career, marriage timing, or Vedic remedies?`;
  }
}

/**
 * 2. Voice-to-text / ambiguous phrase clarification (Identical to ChatGPT "Vee see" & "Dizi ZZ" screenshot)
 */
function getVoiceToTextClarification(query: string, language: string): string {
  switch (language) {
    case 'Telugu':
      return `మీరు "${query}" అని ఒక పేరుగా అడుగుతున్నారా, లేదా మైక్ వాయిస్-టు-టెక్స్ట్ వల్ల అలా వచ్చిందా? దయచేసి మీ జ్యోతిష్య ప్రశ్నను మరింత స్పష్టంగా తెలియజేయండి.`;
    case 'Hindi':
      return `क्या आप "${query}" किसी नाम के रूप में पूछ रहे हैं या यह वॉइस-टू-टेक्स्ट टाइपिंग है? कृपया स्पष्ट करें कि आप अपनी कुंडली के बारे में क्या जानना चाहते हैं।`;
    case 'Tamil':
      return `நீங்கள் "${query}" என்பதை ஒரு பெயராகக் கேட்கிறீர்களா அல்லது இது குரல் பதிவு எழுத்துப் பிழையா? உங்கள் ஜாதகம் பற்றி நீங்கள் என்ன தெரிந்து கொள்ள விரும்புகிறீர்கள் என்பதைத் தெளிவுபடுத்தவும்.`;
    case 'Kannada':
      return `ನೀವು "${query}" ಎಂಬುದನ್ನು ಹೆಸರಾಗಿ ಹೇಳುತ್ತಿದ್ದೀರಾ ಅಥವಾ ಇದು ವಾಯ್ಸ್-ಟು-ಟೆಕ್ಸ್ಟ್ ಅಕ್ಷರದೋಷವೇ? ನಿಮ್ಮ ಜಾತಕದ ಬಗ್ಗೆ ನೀವು ಏನು ತಿಳಿಯಲು ಬಯಸುತ್ತೀರಿ ಎಂದು ಸ್ಪಷ್ಟಪಡಿಸಿ.`;
    case 'Malayalam':
      return `നിങ്ങൾ "${query}" എന്നത് ഒരു പേരായി പറയുകയാണോ അതോ വോയ്‌സ്-ടു-ടെക്‌സ്‌റ്റ് ടൈപ്പിംഗ് പിഴവാണോ? നിങ്ങളുടെ ജാതകത്തെക്കുറിച്ച് എന്താണ് അറിയേണ്ടതെന്ന് ദയവായി വ്യക്തമാക്കാമോ?`;
    default:
      return `Do you mean "${query}" as a name, or is this a voice-to-text spelling? Could you please clarify what you would like to know about your astrology chart?`;
  }
}

/**
 * 3. Pure gibberish, numbers, keyboard mash clarification
 */
function getGibberishClarification(query: string, language: string): string {
  switch (language) {
    case 'Telugu':
      return `దయచేసి మీరు ఏమి అడగాలనుకుంటున్నారో స్పష్టంగా తెలియజేయండి. మీ జన్మ కుండలి, ఉద్యోగం, వివాహం లేదా గ్రహ పరిహారాల గురించి అడగండి.`;
    case 'Hindi':
      return `कृपया स्पष्ट करें कि आप क्या पूछना चाहते हैं। अपनी जन्म कुंडली, नौकरी, विवाह या वैदिक उपायों के संबंध में प्रश्न पूछें।`;
    case 'Tamil':
      return `நீங்கள் என்ன கேட்க விரும்புகிறீர்கள் என்பதைத் தெளிவாகக் கூறவும். உங்கள் ஜாதகம், தொழில், திருமணம் அல்லது பரிகாரங்கள் பற்றி கேளுங்கள்.`;
    case 'Kannada':
      return `ದಯವಿಟ್ಟು ನೀವು ಏನು ಕೇಳಲು ಬಯಸುತ್ತೀರಿ ಎಂದು ಸ್ಪಷ್ಟಪಡಿಸಿ. ನಿಮ್ಮ ಕುಂಡಲಿ, ಉದ್ಯೋಗ, ವಿವಾಹ ಅಥವಾ ಪರಿಹಾರಗಳ ಬಗ್ಗೆ ಪ್ರಶ್ನಿಸಿ.`;
    case 'Malayalam':
      return `നിങ്ങൾ എന്താണ് ചോദിക്കാൻ ആഗ്രഹിക്കുന്നതെന്ന് വ്യക്തമാക്കുക. നിങ്ങളുടെ ജാതകം, ജോലി, വിവാഹം അല്ലെങ്കിൽ പരിഹാരങ്ങളെക്കുറിച്ച് ചോദിക്കൂ.`;
    default:
      return `Could you please clarify what you are trying to ask? Please share a question about your Janam Kundli, career, marriage, or Vedic remedies.`;
  }
}

/**
 * 4. Obvious unrelated off-topic tasks clarification
 */
function getUnrelatedClarification(query: string, language: string, astroName: string): string {
  switch (language) {
    case 'Telugu':
      return `నేను మీ వేద జ్యోతిష్య మార్గదర్శకుడిని. జన్మ కుండలి, కెరీర్, వివాహం మరియు గ్రహ పరిహారాలలో నేను మీకు సహాయం చేయగలను. దయచేసి "${query}" కాకుండా మీ జ్యోతిష్యానికి సంబంధించిన ప్రశ్నను అడగండి.`;
    case 'Hindi':
      return `मैं आपका व्यक्तिगत वैदिक ज्योतिषी हूँ और जन्म कुंडली, करियर, विवाह व जीवन उपायों में मार्गदर्शन करता हूँ। कृपया "${query}" के स्थान पर ज्योतिष या अपने भविष्य से संबंधित प्रश्न पूछें।`;
    case 'Tamil':
      return `நான் உங்கள் தனிப்பட்ட வேத ஜோதிடர். ஜாதகம், தொழில், திருமணம் மற்றும் ஆன்மீக பரிகாரங்களில் உங்களுக்கு உதவ முடியும். தயவுசெய்து "${query}" தவிர்த்து உங்கள் வாழ்க்கை அல்லது ஜோதிடம் சார்ந்த கேள்வியைக் கேளுங்கள்.`;
    case 'Kannada':
      return `ನಾನು ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ವೈದಿಕ ಜ್ಯೋತಿಷಿ. ಜನ್ಮ ಕುಂಡಲಿ, ವೃತ್ತಿ, ವಿವಾಹ ಮತ್ತು ಪರಿಹಾರಗಳಲ್ಲಿ ಮಾರ್ಗದರ್ಶನ ನೀಡಬಲ್ಲೆ. ದಯವಿಟ್ಟು "${query}" ಬದಲಾಗಿ ಜ್ಯೋತಿಷ್ಯಕ್ಕೆ ಸಂಬಂಧಿಸಿದ ಪ್ರಶ್ನೆಯನ್ನು ಕೇಳಿ.`;
    case 'Malayalam':
      return `ഞാൻ നിങ്ങളുടെ വ്യക്തിഗത വൈദിക ജ്യോതിഷിയാണ്. ജാതകം, തൊഴിൽ, വിവാഹം, പരിഹാരങ്ങൾ എന്നിവയിലാണ് ഞാൻ മാർഗ്ഗനിർദ്ദേശം നൽകുന്നത്. ദയവായി "${query}" മാറ്റി ജ്യോതിഷ സംബന്ധിയായ ചോദ്യം ചോദിക്കൂ.`;
    default:
      return `I am your personal Vedic Astrologer specializing in Janam Kundli analysis, career, and relationships. Could you please clarify how "${query}" relates to your life or astrology consultation?`;
  }
}

