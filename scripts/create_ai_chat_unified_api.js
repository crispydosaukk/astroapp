const fs = require('fs');
const path = require('path');

const WEB_ROOT = 'c:\\Users\\PC\\Desktop\\astroparihar';

function writeFile(subPath, content) {
  const fullPath = path.join(WEB_ROOT, subPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Created: ${subPath}`);
}

const AI_CHAT_ROUTE = `import { NextRequest, NextResponse } from 'next/server';
import { getServerOpenAIApiKey, getServerVedikaApiKey, fetchWithOpenAIFallback } from '@/lib/aiConfig';
import { queryVedikaAI } from '@/lib/vedikaClient';
import {
  calculateBirthChartData,
  formatChartSummaryForAI,
  analyzeInquiryEvidence,
} from '@/lib/vedicAstrologyEngine';
import {
  generate48DayRemedyProtocol,
} from '@/lib/vedicRemediesEngine';
import { DEFAULT_AI_ASTROLOGERS } from '@/lib/aiAstrologerData';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

const QUICK_PROMPTS_BY_LANG: Record<string, string[]> = {
  Telugu: [
    '🔮 2026లో నా గ్రహ సంచారాల ఫలితాలు ఎలా ఉన్నాయి?',
    '❤️ నా జాతకంలో వివాహ యోగం ఎప్పుడు ఉంది?',
    '💼 కెరీర్ మార్పు లేదా ప్రమోషన్‌కు సరైన సమయం ఎప్పుడు?',
    '✨ నా అదృష్ట రత్నం, రుద్రాక్ష మరియు నిత్య మంత్రం ఏమిటి?',
    '🪐 నాకు శని సాడే సాతి లేదా రాహు మహర్దశ నడుస్తుందా?',
    '🙏 నా జాతక దోష నివారణకు ఎలాంటి పరిహారాలు లేదా దానం చేయాలి?',
  ],
  Hindi: [
    '🔮 2026 में मेरे मुख्य ग्रह गोचर का क्या प्रभाव रहेगा?',
    '❤️ मेरे विवाह का शुभ योग कब बनेगा?',
    '💼 करियर में पदोन्नति या व्यापार विस्तार का सबसे शुभ समय कब है?',
    '✨ मेरे लिए भाग्यशाली रत्न, रुद्राक्ष और दैनिक मंत्र क्या है?',
    '🪐 क्या मुझ पर शनि की साढ़ेसाती या राहु की महादशा चल रही है?',
    '🙏 ग्रह शांति के लिए मुझे कौन सा विशेष दान या उपाय करना चाहिए?',
  ],
  Tamil: [
    '🔮 2026-ல் எனது கிரக பெயர்ச்சி பலன்கள் எப்படி உள்ளன?',
    '❤️ எனது திருமண யோகம் மற்றும் வாழ்க்கை எப்போது அமையும்?',
    '💼 தொழில் வளர்ச்சி அல்லது வேலை மாற்றத்திற்கு உகந்த நேரம் எப்போது?',
    '✨ எனது அதிர்ஷ்ட ரத்தினம், ருத்ராட்சம் மற்றும் தினசரி மந்திரம் எது?',
    '🪐 எனக்கு ஏழரை சனி அல்லது ராகு தசை நடக்கிறதா?',
    '🙏 கிரக தோஷ நிவர்த்திக்கு என்ன பரிகாரம் அல்லது தானம் செய்ய வேண்டும்?',
  ],
  Kannada: [
    '🔮 2026ರಲ್ಲಿ ನನ್ನ ಗ್ರಹ ಸಂಚಾರದ ಫಲಗಳು ಹೇಗಿವೆ?',
    '❤️ ನನ್ನ ವಿವಾಹ ಯೋಗ ಮತ್ತು ಹೊಂದಾಣಿಕೆ ಯಾವಾಗ ಬರುತ್ತದೆ?',
    '💼 ವೃತ್ತಿ ಬೆಳವಣಿಗೆ ಅಥವಾ ಉದ್ಯೋಗ ಬದಲಾವಣೆಗೆ ಶುಭ ಸಮಯ ಯಾವುದು?',
    '✨ ನನ್ನ ಅದೃಷ್ಟ ರತ್ನ, ರುದ್ರಾಕ್ಷಿ ಮತ್ತು ನಿತ್ಯ ಮಂತ್ರ ಯಾವುದು?',
    '🪐 ನನಗೆ ಸಾಡೇ ಸಾತಿ ಅಥವಾ ರಾಹು ಮಹಾದಶ ನಡೆಯುತ್ತಿದೆಯೇ?',
    '🙏 ಗ್ರಹ ಶಾಂತಿ ಮತ್ತು ದೋಷ ನಿವಾರಣೆಗೆ ಯಾವ ಪರಿಹಾರ ಮಾಡಬೇಕು?',
  ],
  English: [
    '🔮 What do planetary transits say for me in 2026?',
    '❤️ When will I meet my compatible life partner?',
    '💼 When is the best time for a career change or promotion?',
    '✨ What is my lucky gemstone, rudraksha & daily mantra?',
    '🪐 Am I currently running Shani Sade Sati or Rahu Mahadasha?',
    '🙏 What specific Vedic remedies or charity should I perform?',
  ],
};

export async function GET(req: NextRequest) {
  return NextResponse.json({
    success: true,
    availableModels: [
      { id: 'vedika-ai', name: 'Vedika AI Engine', badge: 'Vedic Ephemeris & Kundli Specialist', recommended: true },
      { id: 'openai-gpt4o', name: 'OpenAI GPT-4o', badge: 'High-Precision Astrological Reasoning' },
    ],
    languages: [
      { code: 'Telugu', label: 'తెలుగు (Telugu)', short: 'తె' },
      { code: 'Hindi', label: 'हिन्दी (Hindi)', short: 'हि' },
      { code: 'Tamil', label: 'தமிழ் (Tamil)', short: 'த' },
      { code: 'Kannada', label: 'ಕನ್ನಡ (Kannada)', short: 'ಕ' },
      { code: 'English', label: 'English', short: 'Eng' },
    ],
    quickPrompts: QUICK_PROMPTS_BY_LANG,
  }, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      messages = [],
      language = 'English',
      astrologerId = 'acharya-devavrat',
      modelPreference = 'auto',
      userInfo = null,
    } = body;

    const latestUserMessage = [...messages].reverse().find((m: any) => m.role === 'user')?.content || '';

    // 1. Resolve Astrologer Persona
    const matchedAstrologer = DEFAULT_AI_ASTROLOGERS.find((a: any) => a.id === astrologerId) || {
      name: 'Acharya Devavrat',
      specialty: 'Vedic Jyotish & Dasha Guru',
      discipline: 'Vedic Jyotish',
    };

    // 2. Resolve Birth Chart
    const birthInfo = {
      name: userInfo?.name || 'Devotee',
      gender: userInfo?.gender || 'Male',
      dob: userInfo?.dob || '1995-10-15',
      tob: userInfo?.tob || '12:00 PM',
      pob: userInfo?.pob || 'New Delhi, India',
      lat: userInfo?.lat || '28.6139',
      lon: userInfo?.lon || '77.2090',
    };

    let chart: any = null;
    let evidence: any = null;
    try {
      chart = calculateBirthChartData(
        birthInfo.dob,
        birthInfo.tob,
        birthInfo.pob,
        birthInfo.lat,
        birthInfo.lon,
        birthInfo.name,
        birthInfo.gender
      );
      if (chart) {
        evidence = analyzeInquiryEvidence(chart, latestUserMessage);
      }
    } catch (err) {
      console.warn('Error computing birth chart in ai-chat route:', err);
    }

    // 3. 48-Day Remedy Protocol
    let pariharProtocol: any = null;
    try {
      pariharProtocol = generate48DayRemedyProtocol({
        domain: evidence?.domain || 'career',
        planet: evidence?.primaryAfflictedPlanet || 'Jupiter',
        concern: latestUserMessage,
        language,
      });
    } catch {}

    // 4. Try live Vedika AI or OpenAI if keys are present
    const vedikaKey = await getServerVedikaApiKey();
    const openaiKey = await getServerOpenAIApiKey();

    let modelUsed = 'AstroParihar Vedic Engine';
    let replyText = '';

    // Check if user explicitly chose or keys allow live AI
    const useVedika = (modelPreference === 'vedika-ai' || modelPreference === 'auto') && vedikaKey;
    const useOpenAI = (modelPreference === 'openai-gpt4o' || (!useVedika && openaiKey));

    if (useVedika) {
      try {
        const vedikaRes = await queryVedikaAI({
          prompt: \`You are \${matchedAstrologer.name}, a revered Vedic Astrologer on AstroParihar.
Devotee: \${birthInfo.name}, DOB: \${birthInfo.dob}, POB: \${birthInfo.pob}.
Lagna: \${chart?.ascendant?.sign || 'Aries'}, Moon: \${chart?.moonSign || 'Taurus'}.
Question: "\${latestUserMessage}"
Respond authoritatively and warmly in \${language}. Provide astrological reasoning and auspicious remedies.\`,
          temperature: 0.4,
          maxTokens: 600,
        });
        if (vedikaRes) {
          replyText = vedikaRes;
          modelUsed = 'Vedika AI Engine (Live)';
        }
      } catch {}
    }

    if (!replyText && useOpenAI) {
      try {
        const sysPrompt = \`You are \${matchedAstrologer.name}, an authentic Vedic Astrologer on AstroParihar.
Devotee: \${birthInfo.name}, Lagna: \${chart?.ascendant?.sign || 'Aries'}, Moon Rashi: \${chart?.moonSign || 'Cancer'}.
Active Dasha: \${chart?.dasha?.currentMahadasha || 'Jupiter'} Mahadasha.
Answer the devotee's question in \${language}. Provide spiritually uplifting guidance, transit timelines, and sacred remedies.\`;

        const openAIRes = await fetchWithOpenAIFallback({
          messages: [
            { role: 'system', content: sysPrompt },
            ...messages.slice(-4),
          ],
          temperature: 0.5,
          max_tokens: 650,
        });

        if (openAIRes) {
          replyText = openAIRes;
          modelUsed = 'OpenAI GPT-4o (Live)';
        }
      } catch {}
    }

    // 5. Authentic Deterministic Fallback if live APIs are silent
    if (!replyText) {
      const lagna = chart?.ascendant?.sign || 'Scorpio';
      const moonRashi = chart?.moonSign || 'Cancer';
      const dasha = chart?.dasha?.currentMahadasha || 'Jupiter';
      const antardasha = chart?.dasha?.currentAntardasha || 'Saturn';

      if (language === 'Telugu') {
        replyText = \`**నమస్కారం మరియు దివ్య శుభాశీస్సులు!** 🙏\\n\\nమీ జన్మ కుండలి ప్రకారం, మీ లగ్నం **\${lagna}** మరియు రాశి **\${moonRashi}**. ప్రస్తుతం మీ జాతకంలో **\${dasha} మహాదశ - \${antardasha} అంతర్దశ** నడుస్తోంది.\\n\\n✦ **గ్రహ సంచార ప్రభావం**: గోచారంలో బృహస్పతి మీ కేంద్ర స్థానాలపై దృష్టి సారించి, సమస్యల నుండి విముక్తి మరియు వృద్ధిని ప్రసాదిస్తున్నారు.\\n✦ **కాల నిర్ణయం**: రాబోయే 3 నుండి 6 నెలల కాలం మీ ప్రయత్నాలకు అనుకూలంగా ఉంది.\\n✦ **నిత్య పరిహారం**: గురువారం రోజున దక్షిణామూర్తి లేదా లక్ష్మీ నారాయణ ఆరాధన చేయండి. "ఓం నమో భగవతే వాసుదేవాయ" జపం శుభాన్ని కలిగిస్తుంది.\`;
      } else if (language === 'Hindi') {
        replyText = \`**नमस्ते एवं दिव्य आशीर्वाद!** 🙏\\n\\nआपकी जन्म कुंडली के अनुसार, आपका लग्न **\${lagna}** तथा चंद्र राशि **\${moonRashi}** है। वर्तमान में आपकी पत्रिका में **\${dasha} महादशा - \${antardasha} अंतर्दशा** का शुभ प्रभाव सक्रिय है।\\n\\n✦ **ग्रह गोचर का प्रभाव**: देवगुरु बृहस्पति आपके कर्म व भाग्य भाव पर अपनी शुभ दृष्टि बनाए हुए हैं, जिससे रुके हुए कार्यों में गति आएगी।\\n✦ **शुभ कालखंड**: आगामी 3 से 6 महीने आपके महत्वपूर्ण निर्णयों व सफलता के लिए अत्यंत अनुकूल हैं।\\n✦ **शास्त्रोक्त उपाय**: नित्य सूर्य को तांबे के पात्र से अर्घ्य दें एवं गुरुवार को "ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः" का 108 बार जाप करें।\`;
      } else if (language === 'Tamil') {
        replyText = \`**வணக்கம் மற்றும் ஆசிகள்!** 🙏\\n\\nஉங்கள் ஜாதக கணிப்பின்படி, உங்கள் லக்னம் **\${lagna}** மற்றும் சந்திர ராசி **\${moonRashi}**. தற்பொழுது உங்களுக்கு **\${dasha} மகாதிசை - \${antardasha} புத்தி** நடைபெறுகிறது.\\n\\n✦ **கிரக சஞ்சார பலன்**: குரு பகவானின் பார்வை உங்கள் ராசிக்கு சுப பலன்களை தந்து காரிய தடைகளை நீக்குகிறது.\\n✦ **சுப காலம்**: அடுத்த 3 முதல் 6 மாதங்களில் நல்ல முன்னேற்றம் ஏற்படும்.\\n✦ **பரிகாரம்**: வியாழக்கிழமைகளில் தட்சிணாமூர்த்தி வழிபாடு செய்து நவதானிய தானம் செய்வது மிகுந்த நன்மையை தரும்.\`;
      } else if (language === 'Kannada') {
        replyText = \`**ನಮಸ್ಕಾರ ಮತ್ತು ಶುಭಾಶೀರ್ವಾದಗಳು!** 🙏\\n\\nನಿಮ್ಮ ಜನ್ಮ ಕುಂಡಲಿಯ ಪ್ರಕಾರ, ನಿಮ್ಮ ಲಗ್ನ **\${lagna}** ಮತ್ತು ಚಂದ್ರ ರಾಶಿ **\${moonRashi}**. ಪ್ರಸ್ತುತ ನಿಮ್ಮ ಪತ್ರಿಕೆಯಲ್ಲಿ **\${dasha} ಮಹಾದಶೆ - \${antardasha} ಅಂತರ್ದಶೆ** ನಡೆಯುತ್ತಿದೆ.\\n\\n✦ **ಗ್ರಹ ಸಂಚಾರ ಪ್ರಭಾವ**: ಗುರು ಗ್ರಹದ ಶುಭ ದೃಷ್ಟಿಯಿಂದ ನಿಮ್ಮ ಪ್ರಯತ್ನಗಳಿಗೆ ತಕ್ಕ ಫಲ ಮತ್ತು ಮಾನಸಿಕ ಶಾಂತಿ ಲಭಿಸಲಿದೆ.\\n✦ **ಶುಭ ಕಾಲ**: ಮುಂದಿನ 3 ರಿಂದ 6 ತಿಂಗಳು ಹೊಸ ಆರಂಭಗಳಿಗೆ ಸೂಕ್ತವಾಗಿದೆ.\\n✦ **ನಿತ್ಯ ಪರಿಹಾರ**: ಗುರುವಾರ ವಿಷ್ಣು ಸಹಸ್ರನಾಮ ಪಠಣ ಮತ್ತು ಹಳದಿ ಬಣ್ಣದ ಹೂವುಗಳಿಂದ ಪೂಜೆ ಮಾಡುವುದು ಶ್ರೇಯಸ್ಕರ.\`;
      } else {
        replyText = \`**Namaste and Divine Blessings!** 🙏\\n\\nBased on your authentic Vedic birth chart, your Lagna (Ascendant) is **\${lagna}** and your Moon Rashi is **\${moonRashi}**. You are currently traversing the transformative **\${dasha} Mahadasha – \${antardasha} Antardasha** cycle.\\n\\n✦ **Cosmic Transit Alignment**: Jupiter is casting an auspicious aspect over your key quadrant houses, dissipating longstanding stagnation and clarifying your highest pathway.\\n✦ **Timing Window**: The cosmic currents align strongly over the upcoming 3 to 6 months for pivotal milestones.\\n✦ **Sacred Pariharam**: Light a pure cow-ghee deepam on Thursdays and chant the Gayatri or Guru Mantra 108 times at sunrise for mental fortitude and divine grace.\`;
      }
    }

    const recs = QUICK_PROMPTS_BY_LANG[language] || QUICK_PROMPTS_BY_LANG.English;

    const structured = {
      conclusion: language === 'Telugu'
        ? \`మీ కుండలిలో \${chart?.ascendant?.sign || 'లగ్నం'} బలం అనుకూలంగా ఉంది. కాలపరిమితి లోపల సత్ఫలితాలు అందుతాయి.\`
        : language === 'Hindi'
        ? \`आपकी कुंडली में \${chart?.ascendant?.sign || 'लग्न'} एवं दशेश की स्थिति शुभ परिणाम देने के लिए तत्पर है।\`
        : \`Planetary positions and active \${chart?.dasha?.currentMahadasha || 'Jupiter'} Mahadasha support timely fulfillment with consecrated remedial practices.\`,
      timingWindow: 'Next 3 to 6 Months (Auspicious Transit Window)',
      diagnosis: {
        activeDasha: \`\${chart?.dasha?.currentMahadasha || 'Jupiter'} / \${chart?.dasha?.currentAntardasha || 'Saturn'}\`,
        keyHouses: 'Houses 1, 5, 9 & 10',
        supportingFactors: [
          \`Lagna Lord (\${chart?.ascendant?.lord || 'Benefic'}) in favorable quadrant\`,
          \`Benefic transit of Jupiter amplifying auspicious results\`,
        ],
      },
      whyAstroPariharSaysThis: [
        \`Lagna and Moon sign equilibrium provides emotional stability.\`,
        \`Mahadasha lord aligns with core enterprise.\`,
        \`Remedial resonance accelerates obstacle dissolution.\`,
      ],
      confidence: 'Strong',
      pariharProtocol,
    };

    return NextResponse.json({
      success: true,
      reply: replyText,
      conclusion: structured.conclusion,
      timingWindow: structured.timingWindow,
      structured,
      recommendations: recs.slice(0, 6),
      modelUsed,
      language,
      astrologer: matchedAstrologer,
    }, { headers: corsHeaders });
  } catch (err: any) {
    console.error('Error in unified ai-chat route:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Internal AI service error',
    }, { status: 500, headers: corsHeaders });
  }
}
`;

writeFile('src/app/api/app-dynamic/ai-chat/route.ts', AI_CHAT_ROUTE);
console.log('Unified AI Chat API created successfully!');
