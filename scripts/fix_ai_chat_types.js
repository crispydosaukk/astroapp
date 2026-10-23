const fs = require('fs');
const file = 'c:/Users/PC/Desktop/astroparihar/src/app/api/app-dynamic/ai-chat/route.ts';
let code = fs.readFileSync(file, 'utf8');

const target = `    if (!replyText && useOpenAI) {
      try {
        const sysPrompt = \`You are \${matchedAstrologer.name}, an authentic Vedic Astrologer on AstroParihar. Devotee: \${birthInfo.name}. Answer in \${language}.\`;
        const openAIRes: any = await fetchWithOpenAIFallback(
          [
            { role: 'system', content: sysPrompt },
            ...messages.slice(-4),
          ] as any,
          'gpt-4o'
        );
        if (typeof openAIRes === 'string') {
          replyText = openAIRes;
          modelUsed = 'OpenAI GPT-4o (Live)';
        } else if (openAIRes?.choices?.[0]?.message?.content) {
          replyText = openAIRes.choices[0].message.content;
          modelUsed = 'OpenAI GPT-4o (Live)';
        }
      } catch {}
    }`;

const replacement = `    if (!replyText && useOpenAI) {
      try {
        const sysPrompt = \`You are \${matchedAstrologer.name}, an authentic Vedic Astrologer on AstroParihar. Devotee: \${birthInfo.name}. Answer in \${language}.\`;
        const openAIRes = await fetchWithOpenAIFallback(
          'https://api.openai.com/v1/chat/completions',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'gpt-4o',
              messages: [
                { role: 'system', content: sysPrompt },
                ...messages.slice(-4),
              ],
              temperature: 0.5,
              max_tokens: 650,
            }),
          }
        );
        if (openAIRes && openAIRes.ok) {
          const json = await openAIRes.json();
          replyText = json.choices?.[0]?.message?.content || '';
          modelUsed = 'OpenAI GPT-4o (Live)';
        }
      } catch {}
    }`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code, 'utf8');
console.log('Fixed fetchWithOpenAIFallback call in app-dynamic/ai-chat/route.ts');
