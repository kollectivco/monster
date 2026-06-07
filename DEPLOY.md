# Deployment Guide - Relational Database Version

## Quick Start

### 1. Run SQL Migration

Open **Supabase Dashboard → SQL Editor** and paste the contents of:

```
supabase/migrations/001_relational_schema.sql
```

Click **Run** to create all 4 tables.

### 2. Enable Realtime

Go to **Database → Replication** and toggle ON for:
- ✅ `rappers`
- ✅ `judges`  
- ✅ `scores`
- ✅ `event_control`

### 3. Deploy & Verify

1. Deploy your app (no `.env` changes needed)
2. Open browser console
3. Look for these logs:
   ```
   [SEED] Checking if database needs seeding...
   [SEED] Seeding rappers...
   [SEED] Seeded 8 rappers
   [SEED] Seeding judges...
   [SEED] Seeded 4 judges
   [SEED] Database seeding complete
   ```

### 4. Test Live Sync

1. Open 2 browser tabs
2. Tab 1: Navigate to `#/judge/ali-loka`
3. Tab 2: Navigate to `#/stage`
4. In Tab 1: Tap a score criterion
5. In Tab 2: Watch stage display update within ~1s

✅ If you see the update, Realtime is working!  
⚠️ If it takes ~2s, you're on polling fallback (check Realtime setup)

## SQL Migration

The migration creates:

**4 Tables:**
1. `rappers` - 8 rappers with teams
2. `judges` - 4 judges with slugs
3. `scores` - Individual score rows (one per round/rapper/judge)
4. `event_control` - Broadcast state (single row)

**Features:**
- Row Level Security (allow all for event duration)
- Foreign key constraints
- CHECK constraints on score values
- Indexes for fast queries
- Auto-update triggers for `updated_at` timestamps

## Automatic Migration

If you have existing scores in the old `event_state` table:

1. App automatically detects `event_state` on first load
2. Migrates all scores to new `scores` table
3. Migrates broadcast state to `event_control`
4. Logs migration progress to console
5. Old `event_state` table left intact (not deleted)

Check console for:
```
[SEED] Found old event_state, checking for scores to migrate...
[SEED] Migrating 32 old scores...
[SEED] Successfully migrated 32 scores
[SEED] Migrated broadcast state
```

## Verify Tables

Run these queries in SQL Editor to verify:

```sql
-- Should return 4 rows
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('rappers', 'judges', 'scores', 'event_control');

-- Should return 8
SELECT COUNT(*) FROM rappers;

-- Should return 4  
SELECT COUNT(*) FROM judges;

-- Should return 1
SELECT COUNT(*) FROM event_control;
```

## Troubleshooting

### No data appearing

**Check seeding logs:**
```javascript
// Browser console should show:
[SEED] Seeding rappers...
[SEED] Seeded 8 rappers
```

If not, verify Supabase credentials in `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Scores not updating live

**Check Realtime setup:**
1. Database → Replication → Verify all 4 tables enabled
2. Check console for `[REALTIME] Subscription status: SUBSCRIBED`
3. Look for connection indicator showing "Synced (Realtime)"

If showing "Synced (Polling)":
- Realtime is disabled or failed
- App fell back to 2s polling
- Still works, but slower updates

### Migration didn't run

**Force re-seed:**
1. Delete all rows from `rappers`, `judges`, `scores`
2. Refresh browser
3. Check console for `[SEED]` logs

## Performance Notes

**Expected Latency:**
- Judge tap → Local UI: Instant (optimistic)
- Judge tap → Supabase write: 300ms (debounced)
- Supabase → Stage Display: ~1s (Realtime) or ~2s (polling)

**Database Stats:**
- Round 1 complete: 32 score rows (8 rappers × 4 judges)
- Round 2 complete: 64 total rows
- Round 3 complete: 80 total rows (top 4 only in R3)

## Rollback

If you need to revert to old single-blob approach:

1. Keep `event_state` table (not deleted)
2. Revert app code:
   ```bash
   git revert HEAD
   ```
3. Old code still works with `event_state`

## Support

Check browser console for detailed logs:
- `[SEED]` - Database seeding
- `[RELATIONAL]` - Data loading  
- `[REALTIME]` - Subscription status
- `[WRITE]` - Score writes
- `[POLLING]` - Polling fallback

All logs prefixed with operation type for easy filtering.
