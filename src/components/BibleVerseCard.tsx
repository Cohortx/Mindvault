import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { BibleVerse } from '../lib/types';
import { Book, RefreshCw } from 'lucide-react';

const fallbackVerses: BibleVerse[] = [
  { id: '1', verse: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.", reference: "Proverbs 3:5-6", translation: 'NIV', date: new Date().toISOString().split('T')[0] },
  { id: '2', verse: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.", reference: "Jeremiah 29:11", translation: 'NIV', date: new Date().toISOString().split('T')[0] },
  { id: '3', verse: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.", reference: "Joshua 1:9", translation: 'NIV', date: new Date().toISOString().split('T')[0] },
  { id: '4', verse: "But they who wait for the Lord shall renew their strength; they shall mount up with wings like eagles; they shall run and not be weary; they shall walk and not faint.", reference: "Isaiah 40:31", translation: 'ESV', date: new Date().toISOString().split('T')[0] },
  { id: '5', verse: "The Lord is my strength and my shield; my heart trusts in him, and he helps me.", reference: "Psalm 28:7", translation: 'NIV', date: new Date().toISOString().split('T')[0] },
  { id: '6', verse: "Cast all your anxiety on him because he cares for you.", reference: "1 Peter 5:7", translation: 'NIV', date: new Date().toISOString().split('T')[0] },
  { id: '7', verse: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.", reference: "Romans 8:28", translation: 'NIV', date: new Date().toISOString().split('T')[0] },
];

export function BibleVerseCard() {
  const [verse, setVerse] = useState<BibleVerse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadVerse();
  }, []);

  const loadVerse = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('bible_verses')
        .select('*')
        .eq('date', today)
        .single();

      if (data && !error) {
        setVerse(data);
      } else {
        const randomVerse = fallbackVerses[Math.floor(Math.random() * fallbackVerses.length)];
        setVerse(randomVerse);
      }
    } catch {
      const randomVerse = fallbackVerses[Math.floor(Math.random() * fallbackVerses.length)];
      setVerse(randomVerse);
    } finally {
      setLoading(false);
    }
  };

  const refreshVerse = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const randomVerse = fallbackVerses[Math.floor(Math.random() * fallbackVerses.length)];
    setVerse(randomVerse);
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

  if (!verse) return null;

  return (
    <div className="card bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 border-amber-200 dark:border-amber-800">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Book className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Daily Verse
          </span>
        </div>
        <button
          onClick={refreshVerse}
          disabled={refreshing}
          className="p-1.5 rounded-lg hover:bg-amber-200/50 dark:hover:bg-amber-700/30 transition-colors"
          title="Get new verse"
        >
          <RefreshCw className={`w-4 h-4 text-amber-600 dark:text-amber-400 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <blockquote className="text-gray-800 dark:text-gray-200 font-serif text-lg leading-relaxed mb-3">
        "{verse.verse}"
      </blockquote>
      <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">— {verse.reference} ({verse.translation})</p>
    </div>
  );
}
