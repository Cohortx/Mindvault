import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import type { JournalEntry } from '../lib/types';
import { moods } from '../lib/types';
import { BookOpen, Play, Pause, Pencil, Trash2, Loader2 } from 'lucide-react';

interface JournalHistoryProps {
  onEdit: (entry: JournalEntry) => void;
  refreshKey: number;
}

export function JournalHistory({ onEdit, refreshKey }: JournalHistoryProps) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  useEffect(() => {
    if (user) {
      loadEntries();
    }
  }, [user, refreshKey]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (!error && data) {
        setEntries(data);
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = (entry: JournalEntry) => {
    if (!entry.voice_url) return;

    const audio = audioRefs.current[entry.id];
    if (!audio) {
      const newAudio = new Audio(entry.voice_url);
      newAudio.onended = () => setPlayingId(null);
      audioRefs.current[entry.id] = newAudio;
      newAudio.play();
      setPlayingId(entry.id);
    } else if (playingId === entry.id) {
      audio.pause();
      setPlayingId(null);
    } else {
      audio.play();
      setPlayingId(entry.id);
    }
  };

  const deleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      await supabase.from('journal_entries').delete().eq('id', entryId);
      setEntries(entries.filter((e) => e.id !== entryId));
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getMoodEmoji = (mood: string | null) => {
    if (!mood) return null;
    const found = moods.find((m) => m.value === mood);
    return found?.emoji || null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">No journal entries yet. Start writing!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="card hover:shadow-md transition-shadow cursor-pointer group"
          onClick={() => onEdit(entry)}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>{formatDate(entry.created_at)}</span>
              {entry.mood && getMoodEmoji(entry.mood) && (
                <span className="text-lg">{getMoodEmoji(entry.mood)}</span>
              )}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {entry.voice_url && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playAudio(entry);
                  }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-primary-600 dark:text-primary-400"
                >
                  {playingId === entry.id ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(entry);
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteEntry(entry.id);
                }}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-gray-800 dark:text-gray-200 font-serif line-clamp-3">{entry.content}</p>
        </div>
      ))}
    </div>
  );
}
