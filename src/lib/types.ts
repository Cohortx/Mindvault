import type { User, Session } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  content: string;
  voice_url: string | null;
  mood: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyQuote {
  id: string;
  quote: string;
  author: string;
  category: string;
  date: string;
}

export interface BibleVerse {
  id: string;
  verse: string;
  reference: string;
  translation: string;
  date: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  theme: 'light' | 'dark';
  background_style: string;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type Mood = 'happy' | 'peaceful' | 'grateful' | 'hopeful' | 'reflective' | 'challenged';

export const moods: { value: Mood; label: string; emoji: string }[] = [
  { value: 'happy', label: 'Happy', emoji: '😊' },
  { value: 'peaceful', label: 'Peaceful', emoji: '😌' },
  { value: 'grateful', label: 'Grateful', emoji: '🙏' },
  { value: 'hopeful', label: 'Hopeful', emoji: '🌟' },
  { value: 'reflective', label: 'Reflective', emoji: '💭' },
  { value: 'challenged', label: 'Challenged', emoji: '💪' },
];
