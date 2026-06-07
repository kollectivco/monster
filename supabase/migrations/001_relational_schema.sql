-- Beast Beats Relational Schema
-- Replaces single JSON blob with proper normalized tables

-- Rappers table
CREATE TABLE IF NOT EXISTS rappers (
  id text PRIMARY KEY,
  name text NOT NULL,
  team text NOT NULL,
  sort_order int DEFAULT 0
);

-- Judges table
CREATE TABLE IF NOT EXISTS judges (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  sort_order int DEFAULT 0
);

-- Scores table: ONE row per (round, rapper, judge)
CREATE TABLE IF NOT EXISTS scores (
  id text PRIMARY KEY,
  round int NOT NULL,
  rapper_id text NOT NULL REFERENCES rappers(id) ON DELETE CASCADE,
  judge_id text NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
  lyricism int DEFAULT 0 CHECK (lyricism >= 0 AND lyricism <= 2),
  flow int DEFAULT 0 CHECK (flow >= 0 AND flow <= 2),
  stage int DEFAULT 0 CHECK (stage >= 0 AND stage <= 2),
  originality int DEFAULT 0 CHECK (originality >= 0 AND originality <= 2),
  impact int DEFAULT 0 CHECK (impact >= 0 AND impact <= 2),
  restart boolean DEFAULT false,
  prerec boolean DEFAULT false,
  technical int DEFAULT 0 CHECK (technical >= 0 AND technical <= 2),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (round, rapper_id, judge_id)
);

-- Event control: single row for broadcast state
CREATE TABLE IF NOT EXISTS event_control (
  id text PRIMARY KEY DEFAULT 'beastbeats',
  current_round int DEFAULT 1,
  now_performing text,
  next_up text,
  display_mode text DEFAULT 'now-performing',
  show_score boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

-- Insert default event_control row
INSERT INTO event_control (id, current_round, display_mode, show_score)
VALUES ('beastbeats', 1, 'now-performing', false)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE rappers ENABLE ROW LEVEL SECURITY;
ALTER TABLE judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_control ENABLE ROW LEVEL SECURITY;

-- Allow all operations for this event (temporary for short event duration)
CREATE POLICY "Allow all on rappers" ON rappers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on judges" ON judges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on scores" ON scores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on event_control" ON event_control FOR ALL USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scores_round_rapper ON scores(round, rapper_id);
CREATE INDEX IF NOT EXISTS idx_scores_round_judge ON scores(round, judge_id);
CREATE INDEX IF NOT EXISTS idx_scores_updated_at ON scores(updated_at DESC);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating updated_at
CREATE TRIGGER update_scores_updated_at BEFORE UPDATE ON scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_control_updated_at BEFORE UPDATE ON event_control
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- IMPORTANT: After running this SQL, enable Realtime replication in Supabase Dashboard:
-- Database → Replication → Enable for: rappers, judges, scores, event_control
