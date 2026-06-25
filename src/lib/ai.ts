import type { JournalEntry } from './types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const USE_MOCK_REFLECTION = import.meta.env.VITE_USE_MOCK_REFLECTION === 'true';

const MOCK_REFLECTION_REPORT = `Sample Reflection Report:

- Summary: Over the last period, you've written consistently and reflected on both small wins and challenges. Your journal shows a thoughtful balance between gratitude, stress, and growth.
- Mood themes: You reported feelings of calm, occasional anxiety, and renewed motivation. There is evidence of more positive mood moments when you focus on specific progress.
- Key topics: self-care, work momentum, relationship balance, creative energy, and rest.
- Patterns: After busy or stressful days, you benefit from intentional downtime and writing your next day plan.
- Goals: Keep building daily consistency, notice when stress appears, and celebrate small achievements.
- Suggestions: Use brief morning intentions, reflect on one win each day, and consider asking for support when stress peaks.

Follow-up questions are below to help you go deeper.`;

const MOCK_FOLLOW_UP_QUESTIONS = [
  'What small action could you take tomorrow to make today feel more balanced?',
  'Which emotion came up most often in this period, and what triggered it?',
  'What progress makes you most proud from the last few entries?',
  'How can you support yourself when you notice stress or fatigue building?',
  'What would it feel like to carry forward one positive habit from this week?'
];

export type ReflectionPeriod = 'daily' | 'weekly' | 'monthly';

export async function generateReflectionReport(
  entries: JournalEntry[],
  period: ReflectionPeriod
): Promise<string> {
  try {
    const response = await fetch('/api/ai-reflection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ entries, period, mode: 'reflection' }),
    });

    if (!response.ok) {
      const text = await response.text();
      const maybeJson = text ? JSON.parse(text) : null;
      const errorMessage = maybeJson?.error || text || 'Failed to generate reflection report.';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.report ?? 'No reflection report was returned.';
  } catch (error) {
    if (USE_MOCK_REFLECTION || (!GEMINI_API_KEY && !OPENAI_API_KEY)) {
      console.error('Generating reflection report failed, using mock reflection report.', error);
      return MOCK_REFLECTION_REPORT;
    }
    throw error;
  }
}

export async function generateFollowUpQuestions(
  entries: JournalEntry[],
  period: ReflectionPeriod
): Promise<string[]> {
  try {
    const response = await fetch('/api/ai-reflection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ entries, period, mode: 'followups' }),
    });

    if (!response.ok) {
      const text = await response.text();
      const maybeJson = text ? JSON.parse(text) : null;
      const errorMessage = maybeJson?.error || text || 'Failed to generate follow-up questions.';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return Array.isArray(data.questions) ? data.questions : [];
  } catch (error) {
    if (USE_MOCK_REFLECTION || (!GEMINI_API_KEY && !OPENAI_API_KEY)) {
      console.error('Generating follow-up questions failed, using mock questions.', error);
      return MOCK_FOLLOW_UP_QUESTIONS;
    }
    throw error;
  }
}
