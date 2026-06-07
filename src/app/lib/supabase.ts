import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

// Supabase configuration
// Falls back to the baked-in project credentials when no .env is present
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || `https://${projectId}.supabase.co`;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || publicAnonKey;

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return (
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    SUPABASE_URL !== 'https://your-project.supabase.co' &&
    SUPABASE_ANON_KEY !== 'your-anon-key' &&
    SUPABASE_URL.includes('supabase.co')
  );
};

// Create Supabase client (only if configured)
export const supabase = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

/*
SQL SETUP (run this in Supabase SQL editor):

create table event_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

alter table event_state enable row level security;

create policy "allow all" on event_state for all using (true) with check (true);

-- Enable Realtime on this table in Dashboard:
-- Database > Replication > Enable for event_state table
*/

export const EVENT_ID = 'beastbeats';
