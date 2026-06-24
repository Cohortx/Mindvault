import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from './supabase';

type Theme = 'light' | 'dark';
type BackgroundStyle = 'serene' | 'nature' | 'ocean' | 'sunset' | 'mountains' | 'forest';

interface ThemeContextType {
  theme: Theme;
  backgroundStyle: BackgroundStyle;
  toggleTheme: () => void;
  setBackgroundStyle: (style: BackgroundStyle) => void;
  getBackgroundImage: () => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const wallpapers: { id: BackgroundStyle; name: string; imageUrl: string }[] = [
  {
    id: 'serene',
    name: 'Serene Lake',
    imageUrl: 'https://images.pexels.com/photos/1434608/pexels-photo-1434608.jpeg?auto=compress&cs=tinysrgb&w=1920&q=80'
  },
  {
    id: 'nature',
    name: 'Mountain Meadow',
    imageUrl: 'https://images.pexels.com/photos/1054218/pexels-photo-1054218.jpeg?auto=compress&cs=tinysrgb&w=1920&q=80'
  },
  {
    id: 'ocean',
    name: 'Ocean Waves',
    imageUrl: 'https://images.pexels.com/photos/1000653/pexels-photo-1000653.jpeg?auto=compress&cs=tinysrgb&w=1920&q=80'
  },
  {
    id: 'sunset',
    name: 'Golden Sunset',
    imageUrl: 'https://images.pexels.com/photos/1114348/pexels-photo-1114348.jpeg?auto=compress&cs=tinysrgb&w=1920&q=80'
  },
  {
    id: 'mountains',
    name: 'Snowy Peaks',
    imageUrl: 'https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=1920&q=80'
  },
  {
    id: 'forest',
    name: 'Forest Path',
    imageUrl: 'https://images.pexels.com/photos/144197/pexels-photo-144197.jpeg?auto=compress&cs=tinysrgb&w=1920&q=80'
  }
];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mindvault-theme');
      return (saved as Theme) || 'light';
    }
    return 'light';
  });
  const [backgroundStyle, setBackgroundStyleState] = useState<BackgroundStyle>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mindvault-background');
      return (saved as BackgroundStyle) || 'serene';
    }
    return 'serene';
  });

  const getBackgroundImage = useCallback(() => {
    const wallpaper = wallpapers.find(w => w.id === backgroundStyle);
    return wallpaper?.imageUrl || wallpapers[0].imageUrl;
  }, [backgroundStyle]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('mindvault-theme', theme);
  }, [theme]);

  // Load user preferences from DB
  useEffect(() => {
    if (!user) return;

    const loadPreferences = async () => {
      const { data } = await supabase
        .from('user_preferences')
        .select('theme, background_style')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setTheme(data.theme as Theme);
        setBackgroundStyleState(data.background_style as BackgroundStyle);
      }
    };

    loadPreferences();
  }, [user]);

  // Save preferences to DB when user is logged in
  const savePreferences = useCallback(async (newTheme: Theme, newBg: BackgroundStyle) => {
    if (!user) return;

    await supabase.from('user_preferences').upsert(
      {
        user_id: user.id,
        theme: newTheme,
        background_style: newBg,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
  }, [user]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      savePreferences(next, backgroundStyle);
      return next;
    });
  }, [backgroundStyle, savePreferences]);

  const setBackgroundStyle = useCallback(
    (style: BackgroundStyle) => {
      setBackgroundStyleState(style);
      localStorage.setItem('mindvault-background', style);
      savePreferences(theme, style);
    },
    [theme, savePreferences]
  );

  return (
    <ThemeContext.Provider value={{ theme, backgroundStyle, toggleTheme, setBackgroundStyle, getBackgroundImage }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
