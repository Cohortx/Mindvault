import type { JournalEntry } from './types';

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
    body: JSON.stringify({ entries, period }),
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
