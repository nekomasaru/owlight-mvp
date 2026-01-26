-- Migration 004: daily_reflections table for Closed Loop Ritual
-- This table stores daily reflection snapshots taken during the Closing Ritual.

CREATE TABLE IF NOT EXISTS daily_reflections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL REFERENCES users(id),
  reflection_text TEXT,                               -- User's optional comment
  reflection_type TEXT DEFAULT 'contribution',        -- 'contribution', 'hard_day', etc.
  metrics_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g., {"points": 1200, "thanks": 5, "time_saved": 60}
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient user-based lookups (ordered by date)
CREATE INDEX IF NOT EXISTS idx_daily_reflections_user_date 
  ON daily_reflections (user_id, created_at DESC);

-- RLS: Users can only access their own reflections
ALTER TABLE daily_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_reflections_select" ON daily_reflections
  FOR SELECT USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "own_reflections_insert" ON daily_reflections
  FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id', true));
