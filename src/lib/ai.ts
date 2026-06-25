import type { JournalEntry } from './types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export type ReflectionPeriod = 'daily' | 'weekly' | 'monthly';

export async function generateReflectionReport(
  entries: JournalEntry[],
  period: ReflectionPeriod
): Promise<string> {
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
}

export async function generateFollowUpQuestions(
  entries: JournalEntry[],
  period: ReflectionPeriod
): Promise<string[]> {
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
}
