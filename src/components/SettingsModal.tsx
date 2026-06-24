import { X, Check } from 'lucide-react';
import { useTheme, wallpapers } from '../lib/ThemeContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyReminderEnabled: boolean;
  dailyReminderTime: string;
  onToggleDailyReminder: () => void;
  onUpdateDailyReminderTime: (time: string) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  dailyReminderEnabled,
  dailyReminderTime,
  onToggleDailyReminder,
  onUpdateDailyReminderTime,
}: SettingsModalProps) {
  const { backgroundStyle, setBackgroundStyle } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl mx-4 p-6 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Daily Reminder */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Daily Journal Reminder
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Get a browser reminder each day to write in your journal.
                </p>
              </div>
              <button
                onClick={onToggleDailyReminder}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                  dailyReminderEnabled
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {dailyReminderEnabled ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Reminder time
              </label>
              <input
                type="time"
                value={dailyReminderTime}
                onChange={(e) => onUpdateDailyReminderTime(e.target.value)}
                className="input-field w-full sm:w-40"
                disabled={!dailyReminderEnabled}
              />
            </div>
          </div>

          {/* Wallpapers */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Choose Your Wallpaper
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {wallpapers.map((wp) => (
                <button
                  key={wp.id}
                  onClick={() => setBackgroundStyle(wp.id)}
                  className={`relative rounded-xl overflow-hidden transition-all ${
                    backgroundStyle === wp.id
                      ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 scale-[1.02]'
                      : 'hover:scale-[1.02]'
                  }`}
                >
                  <div className="aspect-[4/3] w-full">
                    <img
                      src={wp.imageUrl}
                      alt={wp.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2.5">
                    <p className="text-xs font-medium text-white drop-shadow-sm">{wp.name}</p>
                  </div>
                  {backgroundStyle === wp.id && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center shadow-lg">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
