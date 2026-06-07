import { supabase, isSupabaseConfigured, EVENT_ID } from './supabase';
import { nameToSlug } from '../hooks/useHashRouter';
import type { Rapper, Judge } from '../hooks/useRelationalSync';

// Hardcoded real roster data
const INITIAL_RAPPERS: Rapper[] = [
  // Ali Loka Team
  { id: '8', name: 'Hazem Hany', team: 'Ali Loka Team', sort_order: 0 },
  { id: '4', name: 'ZOZZ', team: 'Ali Loka Team', sort_order: 1 },
  // Shahyn Team
  { id: '5', name: 'Dezel elgenral', team: 'Shahyn Team', sort_order: 2 },
  { id: '1', name: 'Rajab', team: 'Shahyn Team', sort_order: 3 },
  // ZIAD ZAZA Team
  { id: '7', name: 'TheRealDopie™️', team: 'ZIAD ZAZA Team', sort_order: 4 },
  { id: '3', name: 'KOPRA', team: 'ZIAD ZAZA Team', sort_order: 5 },
  // Shehab Team
  { id: '2', name: 'XykoKing', team: 'Shehab Team', sort_order: 6 },
  { id: '6', name: '$AVAGE', team: 'Shehab Team', sort_order: 7 },
];

const INITIAL_JUDGES: Judge[] = [
  { id: '1', name: 'Ali Loka', slug: nameToSlug('Ali Loka'), sort_order: 0 },
  { id: '2', name: 'ZIAD ZAZA', slug: nameToSlug('ZIAD ZAZA'), sort_order: 1 },
  { id: '3', name: 'Shehab', slug: nameToSlug('Shehab'), sort_order: 2 },
  { id: '4', name: 'Shahyn', slug: nameToSlug('Shahyn'), sort_order: 3 },
];

interface OldScore {
  judgeId: string;
  rapperId: string;
  round: number;
  criteria: number[];
  deductions: {
    restart: boolean;
    preRecorded: boolean;
    technical: number;
  };
}

export async function seedDatabase(): Promise<void> {
  if (!isSupabaseConfigured() || !supabase) {
    console.log('[SEED] Supabase not configured, skipping seed');
    return;
  }

  try {
    console.log('[SEED] Checking if database needs seeding...');

    // Check if rappers table is empty
    const { data: existingRappers, error: rappersError } = await supabase
      .from('rappers')
      .select('id')
      .limit(1);

    if (rappersError) {
      console.error('[SEED] Error checking rappers:', rappersError);
      return;
    }

    // Seed rappers if empty
    if (!existingRappers || existingRappers.length === 0) {
      console.log('[SEED] Seeding rappers...');
      const { error } = await supabase.from('rappers').insert(INITIAL_RAPPERS);
      if (error) {
        console.error('[SEED] Error seeding rappers:', error);
      } else {
        console.log('[SEED] Seeded', INITIAL_RAPPERS.length, 'rappers');
      }
    }

    // Check if judges table is empty
    const { data: existingJudges, error: judgesError } = await supabase
      .from('judges')
      .select('id')
      .limit(1);

    if (judgesError) {
      console.error('[SEED] Error checking judges:', judgesError);
      return;
    }

    // Seed judges if empty
    if (!existingJudges || existingJudges.length === 0) {
      console.log('[SEED] Seeding judges...');
      const { error } = await supabase.from('judges').insert(INITIAL_JUDGES);
      if (error) {
        console.error('[SEED] Error seeding judges:', error);
      } else {
        console.log('[SEED] Seeded', INITIAL_JUDGES.length, 'judges');
      }
    }

    // Check if we need to migrate from old event_state
    const { data: oldEventState } = await supabase
      .from('event_state')
      .select('data')
      .eq('id', EVENT_ID)
      .single();

    if (oldEventState?.data) {
      console.log('[SEED] Found old event_state, checking for scores to migrate...');
      await migrateOldScores(oldEventState.data);
    }

    console.log('[SEED] Database seeding complete');
  } catch (err) {
    console.error('[SEED] Unexpected error during seeding:', err);
  }
}

async function migrateOldScores(oldData: any): Promise<void> {
  if (!supabase) return;

  try {
    const oldScores = oldData.data?.scores || {};
    const scoreEntries = Object.entries(oldScores) as [string, OldScore][];

    if (scoreEntries.length === 0) {
      console.log('[SEED] No old scores to migrate');
      return;
    }

    console.log('[SEED] Migrating', scoreEntries.length, 'old scores...');

    // Check if scores already exist
    const { data: existingScores } = await supabase
      .from('scores')
      .select('id')
      .limit(1);

    if (existingScores && existingScores.length > 0) {
      console.log('[SEED] Scores already exist, skipping migration');
      return;
    }

    // Convert old scores to new format
    const newScores = scoreEntries.map(([key, oldScore]) => {
      const id = `r${oldScore.round}_${oldScore.rapperId}_${oldScore.judgeId}`;
      return {
        id,
        round: oldScore.round,
        rapper_id: oldScore.rapperId,
        judge_id: oldScore.judgeId,
        lyricism: oldScore.criteria[0] || 0,
        flow: oldScore.criteria[1] || 0,
        stage: oldScore.criteria[2] || 0,
        originality: oldScore.criteria[3] || 0,
        impact: oldScore.criteria[4] || 0,
        restart: oldScore.deductions.restart || false,
        prerec: oldScore.deductions.preRecorded || false,
        technical: oldScore.deductions.technical || 0,
      };
    });

    // Insert migrated scores
    const { error } = await supabase.from('scores').insert(newScores);

    if (error) {
      console.error('[SEED] Error migrating scores:', error);
    } else {
      console.log('[SEED] Successfully migrated', newScores.length, 'scores');
    }

    // Migrate broadcast state to event_control if it exists
    if (oldData.broadcastState) {
      const bs = oldData.broadcastState;
      const { error: controlError } = await supabase
        .from('event_control')
        .update({
          current_round: bs.round || 1,
          now_performing: bs.currentRapperId || null,
          next_up: bs.nextRapperId || null,
          display_mode: bs.mode || 'now-performing',
          show_score: bs.showScore !== undefined ? bs.showScore : false,
        })
        .eq('id', 'beastbeats');

      if (controlError) {
        console.error('[SEED] Error migrating broadcast state:', controlError);
      } else {
        console.log('[SEED] Migrated broadcast state');
      }
    }
  } catch (err) {
    console.error('[SEED] Error during migration:', err);
  }
}
