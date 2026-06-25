import type { JournalEntry } from './types';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.0';

export type ReflectionPeriod = 'daily' | 'weekly' | 'monthly';

async function callOpenAI(messages: unknown[], apiKey: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages,
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
  return data.choices?.[0]?.message?.content ?? 'No response received from the AI service.';
}

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
  const prediction = data.predictions?.[0]?.content?.[0]?.text;
  return prediction ?? 'No response received from the Gemini service.';
}

export async function generateReflectionReport(
  entries: JournalEntry[],
  period: ReflectionPeriod
): Promise<string> {
  const apiKey = GEMINI_API_KEY || OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing AI API key. Set VITE_GEMINI_API_KEY or VITE_OPENAI_API_KEY.');
  }

  const journalText = entries
    .map(
      (entry) =>
        `Date: ${new Date(entry.created_at).toLocaleDateString('en-US')}\nMood: ${entry.mood ?? 'None'}\nContent: ${entry.content.trim()}\n`
    )
    .join('\n---\n');

  const systemPrompt =
    'You are a compassionate and empathetic personal journaling coach. Analyze the user\'s journal history to provide a concise summary, emotional and mood insights, key topics, goals, achievements, recurring patterns, and thoughtful follow-up questions. Detect signs of stress, burnout, or emotional distress and recommend supportive coping strategies and professional help when appropriate. Keep the tone supportive, non-judgmental, and private. Never reveal personal journal content outside the user\'s session.';

  const userPrompt = `Here are the user\'s journal entries. Use them to generate a ${period} reflection report, identify emotions such as happiness, stress, anxiety, excitement, frustration, gratitude, sadness, and mention positive habits or goals. Include:\n- A concise summary of the entry history\n- Key topics and themes\n- Mood and sentiment analysis\n- Goals, achievements, and progress\n- Recurring patterns or habits\n- Intelligent follow-up questions for deeper reflection\n- Personalized insights and actionable suggestions\n- If any burnout or distress appears, provide supportive advice and recommend professional help respectfully\n\nJournal entries:\n${journalText}`;

  if (GEMINI_API_KEY) {
    return await callGemini(`${systemPrompt}\n\n${userPrompt}`, GEMINI_API_KEY);
  }

  return await callOpenAI(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    OPENAI_API_KEY
  );
}
