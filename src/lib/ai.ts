import type { JournalEntry } from './types';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export type ReflectionPeriod = 'daily' | 'weekly' | 'monthly';

export async function generateReflectionReport(
  entries: JournalEntry[],
  period: ReflectionPeriod
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('Missing OpenAI API key in VITE_OPENAI_API_KEY');
  }

  const journalText = entries
    .map(
      (entry) =>
        `Date: ${new Date(entry.created_at).toLocaleDateString('en-US')}\nMood: ${entry.mood ?? 'None'}\nContent: ${entry.content.trim()}\n`
    )
    .join('\n---\n');

  const messages = [
    {
      role: 'system',
      content:
        'You are a compassionate and empathetic personal journaling coach. Analyze the user\'s journal history to provide a concise summary, emotional and mood insights, key topics, goals, achievements, recurring patterns, and thoughtful follow-up questions. Detect signs of stress, burnout, or emotional distress and recommend supportive coping strategies and professional help when appropriate. Keep the tone supportive, non-judgmental, and private. Never reveal personal journal content outside the user\'s session.',
    },
    {
      role: 'user',
      content: `Here are the user\'s journal entries. Use them to generate a ${period} reflection report, identify emotions such as happiness, stress, anxiety, excitement, frustration, gratitude, sadness, and mention positive habits or goals. Include:
- A concise summary of the entry history
- Key topics and themes
- Mood and sentiment analysis
- Goals, achievements, and progress
- Recurring patterns or habits
- Intelligent follow-up questions for deeper reflection
- Personalized insights and actionable suggestions
- If any burnout or distress appears, provide supportive advice and recommend professional help respectfully

Journal entries:\n${journalText}`,
    },
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
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
