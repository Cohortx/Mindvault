import { useAuth } from '../lib/AuthContext';
import { useTheme } from '../lib/ThemeContext';
import { BookHeart, Sun, Moon, LogOut, Bell, Settings } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  notificationEnabled: boolean;
  onToggleNotifications: () => void;
}

export function Header({ onOpenSettings, notificationEnabled, onToggleNotifications }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/30 dark:border-gray-700/30 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shadow-sm">
            <BookHeart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white font-serif">MindVault</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              Your personal journal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Notification Toggle */}
          <button
            onClick={onToggleNotifications}
            className={`relative p-2.5 rounded-lg transition-all ${
              notificationEnabled
                ? 'bg-primary-100/80 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400'
                : 'hover:bg-gray-100/80 dark:hover:bg-gray-800/60 text-gray-500 dark:text-gray-400'
            }`}
            title={notificationEnabled ? 'Notifications enabled' : 'Notifications disabled'}
          >
            <Bell className="w-5 h-5" />
            {notificationEnabled && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-800/60 text-gray-600 dark:text-gray-300 transition-all"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-800/60 text-gray-600 dark:text-gray-300 transition-all"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Sign Out */}
          <button
            onClick={signOut}
            className="p-2.5 rounded-lg hover:bg-red-50/80 dark:hover:bg-red-900/20 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all"
            title="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
