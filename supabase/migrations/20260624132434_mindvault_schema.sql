-- Journal entries table
CREATE TABLE journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  voice_url TEXT,
  mood VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Daily quotes cache
CREATE TABLE daily_quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote TEXT NOT NULL,
  author TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'motivation',
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  UNIQUE(date, category)
);

-- Bible verses cache
CREATE TABLE bible_verses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  verse TEXT NOT NULL,
  reference TEXT NOT NULL,
  translation VARCHAR(20) DEFAULT 'NIV',
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  UNIQUE(date)
);

-- User preferences
CREATE TABLE user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  theme VARCHAR(20) DEFAULT 'light',
  background_style VARCHAR(50) DEFAULT 'milky',
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for journal_entries
CREATE POLICY "select_own_entries" ON journal_entries FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_entries" ON journal_entries FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_entries" ON journal_entries FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_entries" ON journal_entries FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for daily_quotes (read-only for authenticated users)
CREATE POLICY "select_quotes" ON daily_quotes FOR SELECT
  TO authenticated USING (true);

-- RLS Policies for bible_verses (read-only for authenticated users)
CREATE POLICY "select_verses" ON bible_verses FOR SELECT
  TO authenticated USING (true);

-- RLS Policies for user_preferences
CREATE POLICY "select_own_prefs" ON user_preferences FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_prefs" ON user_preferences FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_prefs" ON user_preferences FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_journal_entries_created_at ON journal_entries(created_at DESC);