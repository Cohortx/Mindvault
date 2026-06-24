-- Update background_style constraint to allow new values
ALTER TABLE user_preferences DROP CONSTRAINT IF EXISTS user_preferences_background_style_check;

ALTER TABLE user_preferences ADD CONSTRAINT user_preferences_background_style_check
  CHECK (background_style IN ('serene', 'nature', 'ocean', 'sunset', 'mountains', 'forest', 'milky', 'gradient', 'minimal'));