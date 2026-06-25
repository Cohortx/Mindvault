import { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { generateReflectionReport, ReflectionPeriod } from '../lib/ai';
import type { JournalEntry } from '../lib/types';
import { Loader2, Sparkles, MessageCircle } from 'lucide-react';

const periods: { value: ReflectionPeriod; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export function ReflectionAgent() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<ReflectionPeriod>('daily');
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadEntriesForPeriod = async (): Promise<JournalEntry[]> => {
    if (!user) return [];

    const periodDays = selectedPeriod === 'daily' ? 1 : selectedPeriod === 'weekly' ? 7 : 30;
    const since = new Date();
    since.setDate(since.getDate() - periodDays);

    const { data, error: fetchError } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw new Error('Could not load entries. Please try again.');
    }

    return data || [];
  };

  const createReport = async () => {
    if (!user) {
      setError('You must be signed in to generate a reflection report.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const entries = await loadEntriesForPeriod();
      if (!entries.length) {
        setError('No entries found for the selected period.');
        setReport('');
        return;
      }

      const reflection = await generateReflectionReport(entries, selectedPeriod);
      setReport(reflection);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Failed to generate the reflection report. Please try again.';
      setError(message);
      setReport('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Reflection Agent</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Generate personalized insights, sentiment analysis, and follow-up questions from your journal history.
          </p>
        </div>
        <Sparkles className="w-6 h-6 text-primary-500" />
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-4">
        {periods.map((period) => (
          <button
            key={period.value}
            onClick={() => setSelectedPeriod(period.value)}
            className={`rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
              selectedPeriod === period.value
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <button
          onClick={createReport}
          disabled={loading}
          className="btn-primary flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
          {loading ? 'Generating...' : 'Generate Reflection'}
        </button>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Reports are based on entries from the last {selectedPeriod}.
        </p>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 p-4">{error}</div>}

      {report && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 whitespace-pre-wrap text-sm leading-6 text-gray-800 dark:text-gray-100">
          {report}
        </div>
      )}
    </div>
  );
}
