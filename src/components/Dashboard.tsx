import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useTheme } from '../lib/ThemeContext';
import { supabase } from '../lib/supabase';
import { Header } from './Header';
import { QuoteCard } from './QuoteCard';
import { BibleVerseCard } from './BibleVerseCard';
import { JournalPad } from './JournalPad';
import { JournalHistory } from './JournalHistory';
import { ReflectionAgent } from './ReflectionAgent';
import { SettingsModal } from './SettingsModal';
import type { JournalEntry } from '../lib/types';
import { PenLine, BookOpen, Sparkles } from 'lucide-react';

type View = 'write' | 'history' | 'reflection';

export function Dashboard() {
  const { user } = useAuth();
  const { getBackgroundImage } = useTheme();
  const [view, setView] = useState<View>('write');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(false);
  const [dailyReminderTime, setDailyReminderTime] = useState('20:00');
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    loadPreferences();
  }, [user]);

  useEffect(() => {
    if (!dailyReminderEnabled || !notificationsEnabled) return;

    const now = new Date();
    const [hour, minute] = dailyReminderTime.split(':').map(Number);
    const reminderDate = new Date(now);
    reminderDate.setHours(hour, minute, 0, 0);

    if (reminderDate <= now) {
      reminderDate.setDate(reminderDate.getDate() + 1);
    }

    const timeoutMs = reminderDate.getTime() - now.getTime();
    const reminderTimer = window.setTimeout(() => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('MindVault Reminder', {
          body: 'Time to write your daily journal entry.',
        });
      }
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }, timeoutMs);

    return () => {
      window.clearTimeout(reminderTimer);
    };
  }, [dailyReminderEnabled, dailyReminderTime, notificationsEnabled]);

  const loadPreferences = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_preferences')
      .select('notifications_enabled, daily_reminder_enabled, daily_reminder_time')
      .eq('user_id', user.id)
      .single();
    if (data) {
      setNotificationsEnabled(data.notifications_enabled);
      setDailyReminderEnabled(data.daily_reminder_enabled ?? false);
      setDailyReminderTime(data.daily_reminder_time ?? '20:00');
    }
  };

  const toggleNotifications = useCallback(async () => {
    if (!user) return;

    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);

    await supabase.from('user_preferences').upsert(
      {
        user_id: user.id,
        notifications_enabled: newValue,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (newValue && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setNotificationsEnabled(false);
        alert('Notification permission denied. Please enable notifications in your browser settings.');
      }
    }
  }, [user, notificationsEnabled]);

  const toggleDailyReminder = useCallback(async () => {
    if (!user) return;

    const newValue = !dailyReminderEnabled;
    setDailyReminderEnabled(newValue);

    await supabase.from('user_preferences').upsert(
      {
        user_id: user.id,
        notifications_enabled: notificationsEnabled,
        daily_reminder_enabled: newValue,
        daily_reminder_time: dailyReminderTime,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
  }, [user, dailyReminderEnabled, dailyReminderTime, notificationsEnabled]);

  const updateDailyReminderTime = useCallback(async (time: string) => {
    if (!user) return;

    setDailyReminderTime(time);

    await supabase.from('user_preferences').upsert(
      {
        user_id: user.id,
        notifications_enabled: notificationsEnabled,
        daily_reminder_enabled: dailyReminderEnabled,
        daily_reminder_time: time,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
  }, [user, dailyReminderEnabled, notificationsEnabled]);

  const handleSaveEntry = () => {
    setRefreshKey((k) => k + 1);
    setEditingEntry(null);
    setView('history');
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setView('write');
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed transition-all duration-500"
      style={{ backgroundImage: `url(${getBackgroundImage()})` }}
    >
      {/* Overlay for readability */}
      <div className="min-h-screen bg-gradient-to-br from-white/85 via-white/80 to-white/85 dark:from-gray-900/90 dark:via-gray-900/85 dark:to-gray-900/90">
        <Header
          onOpenSettings={() => setSettingsOpen(true)}
          notificationEnabled={notificationsEnabled}
          onToggleNotifications={toggleNotifications}
        />

        <main className="max-w-4xl mx-auto px-4 py-6">
          {/* Quote & Verse Section */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="backdrop-blur-sm">
              <QuoteCard />
            </div>
            <div className="backdrop-blur-sm">
              <BibleVerseCard />
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <button
              onClick={() => {
                setView('write');
                setEditingEntry(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all backdrop-blur-sm ${
                view === 'write'
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700'
              }`}
            >
              <PenLine className="w-4 h-4" />
              Write
            </button>
            <button
              onClick={() => {
                setView('history');
                setEditingEntry(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all backdrop-blur-sm ${
                view === 'history'
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Journal
            </button>
            <button
              onClick={() => {
                setView('reflection');
                setEditingEntry(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all backdrop-blur-sm ${
                view === 'reflection'
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Reflect
            </button>
          </div>

          {/* Content */}
          <div className="backdrop-blur-sm">
            {view === 'write' ? (
              editingEntry ? (
                <JournalPad
                  key={editingEntry.id}
                  onSave={handleSaveEntry}
                  existingEntry={editingEntry}
                  onCancel={() => setEditingEntry(null)}
                />
              ) : (
                <JournalPad key="new" onSave={handleSaveEntry} />
              )
            ) : view === 'history' ? (
              <JournalHistory
                onEdit={handleEditEntry}
                refreshKey={refreshKey}
              />
            ) : (
              <ReflectionAgent />
            )}
          </div>
        </main>

        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          dailyReminderEnabled={dailyReminderEnabled}
          dailyReminderTime={dailyReminderTime}
          onToggleDailyReminder={toggleDailyReminder}
          onUpdateDailyReminderTime={updateDailyReminderTime}
        />
      </div>
    </div>
  );
}
