import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { DailyQuote } from '../lib/types';
import { Quote, RefreshCw } from 'lucide-react';

const fallbackQuotes: DailyQuote[] = [
  { id: '1', quote: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: 'motivation', date: new Date().toISOString().split('T')[0] },
  { id: '2', quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", category: 'motivation', date: new Date().toISOString().split('T')[0] },
  { id: '3', quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", category: 'motivation', date: new Date().toISOString().split('T')[0] },
  { id: '4', quote: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle", category: 'motivation', date: new Date().toISOString().split('T')[0] },
  { id: '5', quote: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs", category: 'motivation', date: new Date().toISOString().split('T')[0] },
  { id: '6', quote: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb", category: 'motivation', date: new Date().toISOString().split('T')[0] },
  { id: '7', quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill", category: 'motivation', date: new Date().toISOString().split('T')[0] },
];

export function QuoteCard() {
  const [quote, setQuote] = useState<DailyQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadQuote();
  }, []);

  const loadQuote = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_quotes')
        .select('*')
        .eq('date', today)
        .eq('category', 'motivation')
        .single();

      if (data && !error) {
        setQuote(data);
      } else {
        // Use a random fallback quote
        const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
        setQuote(randomQuote);
      }
    } catch {
      const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
      setQuote(randomQuote);
    } finally {
      setLoading(false);
    }
  };

  const refreshQuote = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
    setQuote(randomQuote);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
      </div>
    );
  }

  if (!quote) return null;

  return (
    <div className="card bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10 border-primary-200 dark:border-primary-800">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Quote className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <span className="text-xs font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wider">
            Daily Motivation
          </span>
        </div>
        <button
          onClick={refreshQuote}
          disabled={refreshing}
          className="p-1.5 rounded-lg hover:bg-primary-200/50 dark:hover:bg-primary-700/30 transition-colors"
          title="Get new quote"
        >
          <RefreshCw className={`w-4 h-4 text-primary-600 dark:text-primary-400 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <blockquote className="text-gray-800 dark:text-gray-200 font-serif text-lg leading-relaxed mb-3">
        "{quote.quote}"
      </blockquote>
      <p className="text-sm text-primary-700 dark:text-primary-300 font-medium">— {quote.author}</p>
    </div>
  );
}
