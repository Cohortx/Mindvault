import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function parseJsonBody(req: any) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer | string) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const GEMINI_API_KEY = env.VITE_GEMINI_API_KEY;
  const OPENAI_API_KEY = env.VITE_OPENAI_API_KEY;
  const GEMINI_MODEL = env.VITE_GEMINI_MODEL || 'gemini-1.0';
  const OPENAI_MODEL = env.VITE_OPENAI_MODEL || 'gpt-3.5-turbo';

  const systemPrompt =
    "You are a compassionate and empathetic personal journaling coach. Analyze the user's journal history to provide a concise summary, emotional and mood insights, key topics, goals, achievements, recurring patterns, and thoughtful follow-up questions. Detect signs of stress, burnout, or emotional distress and recommend supportive coping strategies and professional help when appropriate. Keep the tone supportive, non-judgmental, and private. Never reveal personal journal content outside the user's session.";

  async function callGemini(prompt: string, apiKey: string) {
    const response = await fetch(`https://gemini.googleapis.com/v1/models/${GEMINI_MODEL}:predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        instances: [{ content: prompt }],
        parameters: {
          temperature: 0.7,
          max_output_tokens: 900,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini request failed: ${errorText}`);
    }

    const data = await response.json();
    return data.predictions?.[0]?.content?.[0]?.text ?? 'No response received from the Gemini service.';
  }

  async function callOpenAI(prompt: string, apiKey: string) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 900,
        top_p: 1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI request failed: ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? 'No response received from the OpenAI service.';
  }

  async function handleAiReflection(body: any) {
    const apiKey = GEMINI_API_KEY || OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Missing AI API key on the local dev server. Set VITE_GEMINI_API_KEY or VITE_OPENAI_API_KEY.');
    }

    const journalText = body.entries
      .map(
        (entry: any) =>
          `Date: ${new Date(entry.created_at).toLocaleDateString('en-US')}\nMood: ${entry.mood ?? 'None'}\nContent: ${entry.content?.trim() ?? ''}`
      )
      .join('\n---\n');

    const prompt = `${systemPrompt}\n\nHere are the user's journal entries. Use them to generate a ${body.period} reflection report, identify emotions such as happiness, stress, anxiety, excitement, frustration, gratitude, sadness, and mention positive habits or goals. Include:\n- A concise summary of the entry history\n- Key topics and themes\n- Mood and sentiment analysis\n- Goals, achievements, and progress\n- Recurring patterns or habits\n- Intelligent follow-up questions for deeper reflection\n- Personalized insights and actionable suggestions\n- If any burnout or distress appears, provide supportive advice and recommend professional help respectfully\n\nJournal entries:\n${journalText}`;

    return GEMINI_API_KEY ? await callGemini(prompt, GEMINI_API_KEY) : await callOpenAI(prompt, apiKey);
  }

  return {
    plugins: [
      react(),
      {
        name: 'local-ai-reflection-proxy',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.method !== 'POST' || req.url?.split('?')[0] !== '/api/ai-reflection') {
              return next();
            }

            try {
              const body = await parseJsonBody(req);
              const report = await handleAiReflection(body);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ report }));
            } catch (error) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal AI proxy error.' }));
            }
          });
        },
      },
    ],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});
