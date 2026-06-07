# Relational Database Migration Guide

## Overview

This migration refactors the Beast Beats app from a single JSON blob (`event_state` table) to proper relational tables for better performance, concurrency, and reliability during live events.

## Key Benefits

✅ **Zero Conflicts**: Each judge writes their own score rows - no more overwriting shared data  
✅ **Live Updates**: Stage Display updates within ~1 second via Realtime subscriptions  
✅ **Faster Queries**: Indexed relational tables vs parsing large JSON blobs  
✅ **Better Concurrency**: 4 judges can score simultaneously without conflicts  
✅ **Automatic Migration**: Existing scores from `event_state` are migrated automatically  

## New Schema

### Tables Created

1. **`rappers`** - Rapper roster
   - `id`, `name`, `team`, `sort_order`

2. **`judges`** - Judge roster  
   - `id`, `name`, `slug`, `sort_order`

3. **`scores`** - Individual score rows (one per round/rapper/judge)
   - `id`, `round`, `rapper_id`, `judge_id`
   - `lyricism`, `flow`, `stage`, `originality`, `impact` (0-2 each)
   - `restart`, `prerec`, `technical` (deductions)
   - `updated_at` (auto-updated timestamp)

4. **`event_control`** - Broadcast state (single row)
   - `current_round`, `now_performing`, `next_up`
   - `display_mode`, `show_score`, `updated_at`

## Migration Steps

### 1. Run the SQL Migration

Open Supabase SQL Editor and run:

\`\`\`bash
cat supabase/migrations/001_relational_schema.sql
\`\`\`

Or manually copy/paste the SQL from `supabase/migrations/001_relational_schema.sql` into the Supabase SQL Editor.

### 2. Enable Realtime

In Supabase Dashboard:
1. Go to **Database → Replication**
2. Enable Realtime for these tables:
   - ✅ `rappers`
   - ✅ `judges`
   - ✅ `scores`
   - ✅ `event_control`

### 3. Verify Tables

Run this query to verify tables were created:

\`\`\`sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('rappers', 'judges', 'scores', 'event_control');
\`\`\`

You should see all 4 tables.

### 4. Check Seeding

On first app load, the app will automatically:
- Seed `rappers` table with 8 rappers
- Seed `judges` table with 4 judges
- Migrate any existing scores from old `event_state` table
- Insert default row in `event_control`

Check the browser console for seed logs:
\`\`\`
[SEED] Checking if database needs seeding...
[SEED] Seeding rappers...
[SEED] Seeded 8 rappers
[SEED] Seeding judges...
[SEED] Seeded 4 judges
[SEED] Database seeding complete
\`\`\`

### 5. Verify Data

Check that data was seeded:

\`\`\`sql
SELECT COUNT(*) FROM rappers;  -- Should be 8
SELECT COUNT(*) FROM judges;   -- Should be 4
SELECT * FROM event_control;   -- Should have 1 row
\`\`\`

## How It Works

### Judge Scoring

When a judge taps a score criterion:

1. **Optimistic Update**: Score appears instantly in UI
2. **Debounced Write**: After 300ms of no changes, upsert to Supabase
3. **Realtime Broadcast**: Other screens receive update within ~1s
4. **No Conflicts**: Each judge writes only their own rows

Score ID format: `r{round}_{rapperId}_{judgeId}`

Example: `r1_8_1` = Round 1, Rapper 8 (Hazem Hany), Judge 1 (Ali Loka)

### Stage Display

Subscribes to Realtime on `scores` and `event_control`:

1. Receives score updates as judges tap
2. Computes totals on the client:
   - Per-judge score = `clamp(sum(criteria) - deductions, 0, 10)`
   - Per-rapper-per-round = sum of all judges' scores (max 40)
   - Cumulative = sum across rounds
3. Updates display within ~1s

Falls back to 2s polling if Realtime unavailable.

### Team Control

Writes to `event_control` table:
- Current round
- Now performing (rapper ID)
- Next up (rapper ID)
- Display mode (now-performing | standings | podium)
- Show score toggle

## Troubleshooting

### Tables not created

Run the SQL migration again. Check for errors in SQL Editor.

### No data showing

Check browser console for seed logs. Verify Supabase credentials in `.env`:
\`\`\`
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
\`\`\`

### Scores not updating live

1. Verify Realtime is enabled on all 4 tables
2. Check connection status indicator in Team Control
3. Look for `[REALTIME]` logs in browser console
4. If showing "Polling", Realtime failed - check Supabase status

### Migration didn't run

Check console for `[SEED]` logs. If old `event_state` exists, migration runs once and logs:
\`\`\`
[SEED] Found old event_state, checking for scores to migrate...
[SEED] Migrating X old scores...
[SEED] Successfully migrated X scores
\`\`\`

## Rollback (if needed)

To revert to old single-blob approach:

1. Keep `event_state` table intact
2. Revert to previous commit:
   \`\`\`bash
   git revert HEAD
   \`\`\`

The old code still works - just disable the new tables.

## Performance Notes

- **Writes**: Debounced 300ms, optimistic UI
- **Reads**: Realtime subscriptions (~1s latency)
- **Fallback**: 2s polling if Realtime unavailable
- **Indexes**: Added on `round`, `rapper_id`, `judge_id` for fast queries

## Questions?

Check browser console for detailed logs:
- `[SEED]` - Database seeding
- `[RELATIONAL]` - Data loading
- `[REALTIME]` - Realtime subscriptions
- `[WRITE]` - Score writes
- `[POLLING]` - Polling fallback
