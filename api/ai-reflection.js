const GEMINI_MODEL = process.env.VITE_GEMINI_MODEL || 'gemini-1.0';
const OPENAI_MODEL = process.env.VITE_OPENAI_MODEL || 'gpt-3.5-turbo';
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY;

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
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

function buildJournalText(entries, period) {
  return entries
    .map(
      (entry) =>
        `Date: ${new Date(entry.created_at).toLocaleDateString('en-US')}` +
        `\nMood: ${entry.mood ?? 'None'}` +
        `\nContent: ${entry.content?.trim() ?? ''}`
    )
    .join('\n---\n');
}

function buildUserPrompt(journalText, period) {
  return `Here are the user's journal entries. Use them to generate a ${period} reflection report, identify emotions such as happiness, stress, anxiety, excitement, frustration, gratitude, sadness, and mention positive habits or goals. Include:\n- A concise summary of the entry history\n- Key topics and themes\n- Mood and sentiment analysis\n- Goals, achievements, and progress\n- Recurring patterns or habits\n- Intelligent follow-up questions for deeper reflection\n- Personalized insights and actionable suggestions\n- If any burnout or distress appears, provide supportive advice and recommend professional help respectfully\n\nJournal entries:\n${journalText}`;
}

function buildSystemPrompt() {
  return (
    "You are a compassionate and empathetic personal journaling coach. Analyze the user's journal history to provide a concise summary, emotional and mood insights, key topics, goals, achievements, recurring patterns, and thoughtful follow-up questions. Detect signs of stress, burnout, or emotional distress and recommend supportive coping strategies and professional help when appropriate. Keep the tone supportive, non-judgmental, and private. Never reveal personal journal content outside the user's session."
  );
}

async function callGemini(prompt, apiKey) {
  const response = await fetch(`https://gemini.googleapis.com/v1/models/${GEMINI_MODEL}:generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      prompt: {
        text: prompt,
      },
      temperature: 0.7,
      maxOutputTokens: 900,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed: ${errorText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.output ?? data.output?.text ?? 'No response received from the Gemini service.';
}

async function callOpenAI(prompt, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    return res.end(JSON.stringify({ error: 'Method not allowed.' }));
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'Invalid JSON body.' }));
  }

  const { entries, period } = body;
  if (!Array.isArray(entries) || !period) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'Request must include entries and period.' }));
  }

  const apiKey = GEMINI_API_KEY || OPENAI_API_KEY;
  if (!apiKey) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: 'Missing AI API key on the server. Set VITE_GEMINI_API_KEY or VITE_OPENAI_API_KEY.' }));
  }

  try {
    const journalText = buildJournalText(entries, period);
    const prompt = `${buildSystemPrompt()}\n\n${buildUserPrompt(journalText, period)}`;

    const report = GEMINI_API_KEY
      ? await callGemini(prompt, GEMINI_API_KEY)
      : await callOpenAI(prompt, OPENAI_API_KEY);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ report }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI server error.';
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: message }));
  }
}
