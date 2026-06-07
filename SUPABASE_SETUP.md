# Supabase Setup Instructions

This app uses Supabase for real-time multi-device sync. All screens (4 judge screens, Stage Display, Team/Control) stay in sync live across separate devices.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Wait for the project to finish setting up (~2 minutes)

## 2. Run the SQL Setup

Go to your Supabase project dashboard → **SQL Editor** → **New Query**, then paste and run this:

```sql
-- Create the event_state table
create table event_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

-- Enable Row Level Security (required)
alter table event_state enable row level security;

-- Create policy to allow all operations (this is a private event app)
create policy "allow all" on event_state for all using (true) with check (true);
```

## 3. Enable Realtime

1. In your Supabase dashboard, go to **Database** → **Replication**
2. Find the `event_state` table in the list
3. Toggle **Enable** for the `event_state` table
4. This allows real-time updates to be broadcast to all connected clients

## 4. Get Your API Keys

1. Go to **Project Settings** → **API**
2. Copy your **Project URL** (looks like `https://xxxxx.supabase.co`)
3. Copy your **anon/public** key (a long string starting with `eyJ...`)

## 5. Configure the App

Create a `.env` file in the root of your project (copy from `.env.example`):

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace the values with your actual Supabase URL and anon key.

## 6. Test It

1. Start the app: `pnpm run dev` (or use the Figma Make preview)
2. Open the app on multiple devices/browsers
3. Make a change on one device (e.g., score a rapper, change broadcast control)
4. Watch it sync instantly to all other devices!

## Connection Status

- **Green dot + "Synced"**: Connected and up-to-date
- **Amber dot + "Syncing..."**: Writing changes to Supabase
- **Red dot + "Offline"**: Can't reach Supabase, working locally only

When offline, the app continues to work using local state. When connection is restored, it will automatically sync back up.

## Data Model

All event data (roster, teams, judges, scores, broadcast state) is stored in a single JSON row:

```json
{
  "data": {
    "teams": [...],
    "rappers": [...],
    "judges": [...],
    "scores": {...}
  },
  "broadcastState": {
    "round": 1,
    "mode": "now-performing",
    "currentRapperId": "...",
    "nextRapperId": "...",
    "showScore": false
  },
  "version": "2.1"
}
```

The row ID is always `"beastbeats"`. When any device updates the data, Supabase broadcasts the change to all subscribed devices via WebSockets.

## Sync Behavior

- **Optimistic UI**: Changes appear instantly on the device that made them
- **Debounced writes**: Rapid score taps are batched (300ms debounce)
- **Last-write-wins**: If two judges score simultaneously, the last one persists
- **Auto-reconnect**: If connection drops, automatically retries every 10 seconds
- **Version migration**: When app version changes, preserves scores but resets roster to defaults

## Security Note

The current RLS policy allows all operations (`using (true)`). This is fine for a private event with trusted participants. For public deployment, you'd want to add authentication and more restrictive policies.
