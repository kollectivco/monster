import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type ConnectionStatus = 'connected' | 'syncing' | 'offline' | 'disabled' | 'polling';

export interface SyncDiagnostics {
  lastWriteTime: Date | null;
  lastWriteSuccess: boolean | null;
  lastWriteError: string | null;
  lastReadTime: Date | null;
  realtimeStatus: 'subscribed' | 'connecting' | 'error' | 'disabled' | null;
  realtimeError: string | null;
  eventId: string;
}

export interface Rapper {
  id: string;
  name: string;
  team: string;
  sort_order: number;
}

export interface Judge {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

export interface ScoreRow {
  id: string;
  round: number;
  rapper_id: string;
  judge_id: string;
  lyricism: number;
  flow: number;
  stage: number;
  originality: number;
  impact: number;
  restart: boolean;
  prerec: boolean;
  technical: number;
  updated_at: string;
}

export interface EventControl {
  id: string;
  current_round: number;
  now_performing: string | null;
  next_up: string | null;
  display_mode: string;
  show_score: boolean;
  wildcard_rapper_id?: string | null;
  updated_at: string;
}

const POLLING_INTERVAL = 500;
const DEBOUNCE_DELAY = 50;

// Fill in any columns missing from a partial score update with safe defaults,
// so optimistic local rows are never partially-undefined (which produces NaN totals)
function withScoreDefaults(scoreData: Partial<ScoreRow> & { id: string }): ScoreRow {
  return {
    id: scoreData.id,
    round: scoreData.round ?? 0,
    rapper_id: scoreData.rapper_id ?? '',
    judge_id: scoreData.judge_id ?? '',
    lyricism: scoreData.lyricism ?? 0,
    flow: scoreData.flow ?? 0,
    stage: scoreData.stage ?? 0,
    originality: scoreData.originality ?? 0,
    impact: scoreData.impact ?? 0,
    restart: scoreData.restart ?? false,
    prerec: scoreData.prerec ?? false,
    technical: scoreData.technical ?? 0,
    updated_at: scoreData.updated_at ?? new Date().toISOString(),
  };
}

export function useRelationalSync() {
  const [rappers, setRappers] = useState<Rapper[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [eventControl, setEventControl] = useState<EventControl | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    isSupabaseConfigured() ? 'syncing' : 'disabled'
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastWriteTime, setLastWriteTime] = useState<Date | null>(null);
  const [lastWriteSuccess, setLastWriteSuccess] = useState<boolean | null>(null);
  const [lastWriteError, setLastWriteError] = useState<string | null>(null);

  const channelsRef = useRef<RealtimeChannel[]>([]);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isScoresRealtimeWorkingRef = useRef(false);
  const isControlRealtimeWorkingRef = useRef(false);
  const pendingWritesRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Compute score for a single judge/rapper/round
  const computeScore = useCallback((score: ScoreRow): number => {
    const raw = score.lyricism + score.flow + score.stage + score.originality + score.impact;
    const deductions =
      (score.restart ? 1 : 0) +
      (score.prerec ? 2 : 0) +
      score.technical;
    return Math.max(0, Math.min(10, raw - deductions));
  }, []);

  // Load initial data
  const loadData = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) {
      console.log('[RELATIONAL] Supabase not configured');
      setConnectionStatus('disabled');
      setIsInitialized(true);
      return;
    }

    try {
      console.log('[RELATIONAL] Loading initial data');
      setConnectionStatus('syncing');

      const [rappersRes, judgesRes, scoresRes, controlRes] = await Promise.all([
        supabase.from('rappers').select('*').order('sort_order'),
        supabase.from('judges').select('*').order('sort_order'),
        supabase.from('scores').select('*'),
        supabase.from('event_control').select('*').eq('id', 'beastbeats').single(),
      ]);

      if (rappersRes.data) setRappers(rappersRes.data);
      if (judgesRes.data) setJudges(judgesRes.data);
      if (scoresRes.data) setScores(scoresRes.data);
      if (controlRes.data) setEventControl(controlRes.data);

      setConnectionStatus((isScoresRealtimeWorkingRef.current && isControlRealtimeWorkingRef.current) ? 'connected' : 'polling');
      setIsInitialized(true);
    } catch (err) {
      console.error('[RELATIONAL] Failed to load data:', err);
      setConnectionStatus('offline');
      setIsInitialized(true);
    }
  }, []);

  // Poll for updates (fallback)
  const pollForUpdates = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) return;

    try {
      const [scoresRes, controlRes] = await Promise.all([
        supabase.from('scores').select('*'),
        supabase.from('event_control').select('*').eq('id', 'beastbeats').single(),
      ]);

      if (scoresRes.data) setScores(scoresRes.data);
      if (controlRes.data) setEventControl(controlRes.data);
    } catch (err) {
      console.error('[POLLING] Error:', err);
    }
  }, []);

  // Start polling fallback
  const startPolling = useCallback(() => {
    console.log('[POLLING] Starting 2s polling fallback');
    setConnectionStatus('polling');

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(pollForUpdates, POLLING_INTERVAL);
    pollForUpdates();
  }, [pollForUpdates]);

  // Upsert score with debounce
  const upsertScore = useCallback(async (scoreData: Partial<ScoreRow> & { id: string }) => {
    if (!isSupabaseConfigured() || !supabase) return;

    // Optimistic update
    setScores(prev => {
      const existing = prev.find(s => s.id === scoreData.id);
      if (existing) {
        return prev.map(s => s.id === scoreData.id ? { ...s, ...scoreData } : s);
      } else {
        return [...prev, withScoreDefaults(scoreData)];
      }
    });

    // Clear existing debounce timer for this score
    const existingTimer = pendingWritesRef.current.get(scoreData.id);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Debounce the actual write
    const timer = setTimeout(async () => {
      try {
        console.log('[WRITE] Upserting score:', scoreData.id);
        setConnectionStatus('syncing');

        const { error } = await supabase
          .from('scores')
          .upsert(scoreData, { onConflict: 'id' });

        if (error) {
          console.error('[WRITE] Failed to upsert score:', error);
          setConnectionStatus('offline');
          setLastWriteTime(new Date());
          setLastWriteSuccess(false);
          setLastWriteError(error.message);
        } else {
          setConnectionStatus((isScoresRealtimeWorkingRef.current && isControlRealtimeWorkingRef.current) ? 'connected' : 'polling');
          setLastWriteTime(new Date());
          setLastWriteSuccess(true);
          setLastWriteError(null);
        }
      } catch (err) {
        console.error('[WRITE] Error upserting score:', err);
        setConnectionStatus('offline');
        setLastWriteTime(new Date());
        setLastWriteSuccess(false);
        setLastWriteError(err instanceof Error ? err.message : String(err));
      } finally {
        pendingWritesRef.current.delete(scoreData.id);
      }
    }, DEBOUNCE_DELAY);

    pendingWritesRef.current.set(scoreData.id, timer);
  }, []);

  // Update a rapper's name or team
  const updateRapper = useCallback(async (id: string, updates: Partial<Pick<Rapper, 'name' | 'team'>>) => {
    if (!isSupabaseConfigured() || !supabase) return;

    setRappers(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));

    const { error } = await supabase.from('rappers').update(updates).eq('id', id);
    if (error) console.error('[WRITE] Failed to update rapper:', error);
  }, []);

  // Update a judge's name
  const updateJudge = useCallback(async (id: string, name: string) => {
    if (!isSupabaseConfigured() || !supabase) return;

    setJudges(prev => prev.map(j => j.id === id ? { ...j, name } : j));

    const { error } = await supabase.from('judges').update({ name }).eq('id', id);
    if (error) console.error('[WRITE] Failed to update judge:', error);
  }, []);

  // Rename a team by bulk-updating every rapper row sharing that team name
  const renameTeam = useCallback(async (oldName: string, newName: string) => {
    if (!isSupabaseConfigured() || !supabase) return;

    setRappers(prev => prev.map(r => r.team === oldName ? { ...r, team: newName } : r));

    const { error } = await supabase.from('rappers').update({ team: newName }).eq('team', oldName);
    if (error) console.error('[WRITE] Failed to rename team:', error);
  }, []);

  // Delete all rows from the scores table (rehearsal reset)
  const resetScores = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) return;

    setScores([]);

    const { error } = await supabase.from('scores').delete().neq('id', '');
    if (error) console.error('[WRITE] Failed to reset scores:', error);
  }, []);

  // Update event control
  const updateEventControl = useCallback(async (updates: Partial<EventControl>) => {
    if (!isSupabaseConfigured() || !supabase) return;

    // Optimistic update
    setEventControl(prev => prev ? { ...prev, ...updates } : null);

    try {
      console.log('[WRITE] Updating event control:', updates);
      setConnectionStatus('syncing');

      const { error } = await supabase
        .from('event_control')
        .update(updates)
        .eq('id', 'beastbeats');

      if (error) {
        console.error('[WRITE] Failed to update event control:', error);
        setConnectionStatus('offline');
      } else {
        setConnectionStatus((isScoresRealtimeWorkingRef.current && isControlRealtimeWorkingRef.current) ? 'connected' : 'polling');
      }
    } catch (err) {
      console.error('[WRITE] Error updating event control:', err);
      setConnectionStatus('offline');
    }
  }, []);

  // Subscribe to Realtime
  useEffect(() => {
    loadData();

    if (!isSupabaseConfigured() || !supabase) {
      return;
    }

    console.log('[REALTIME] Setting up subscriptions');

    // Subscribe to scores
    const scoresChannel = supabase
      .channel('scores_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scores' },
        (payload) => {
          console.log('[REALTIME] Scores payload received:', payload);
          isScoresRealtimeWorkingRef.current = true;

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setScores(prev => {
              const existing = prev.find(s => s.id === payload.new.id);
              if (existing) {
                return prev.map(s => s.id === payload.new.id ? { ...s, ...payload.new } as ScoreRow : s);
              } else {
                return [...prev, payload.new as ScoreRow];
              }
            });
          } else if (payload.eventType === 'DELETE') {
            setScores(prev => prev.filter(s => s.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('[REALTIME] Scores channel:', status);
        if (status === 'SUBSCRIBED') {
          isScoresRealtimeWorkingRef.current = true;
          if (isControlRealtimeWorkingRef.current) {
            setConnectionStatus('connected');
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
            }
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          isScoresRealtimeWorkingRef.current = false;
          startPolling();
        }
      });

    // Subscribe to event_control
    const controlChannel = supabase
      .channel('control_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_control' },
        (payload) => {
          console.log('[REALTIME] Control payload received:', payload);
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setEventControl(prev => {
              return { ...prev, ...(payload.new as EventControl) };
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('[REALTIME] Control channel:', status);
        if (status === 'SUBSCRIBED') {
          isControlRealtimeWorkingRef.current = true;
          if (isScoresRealtimeWorkingRef.current) {
            setConnectionStatus('connected');
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
            }
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          isControlRealtimeWorkingRef.current = false;
          startPolling();
        }
      });

    // Subscribe to rappers
    const rappersChannel = supabase
      .channel('rappers_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rappers' },
        (payload) => {
          console.log('[REALTIME] Rappers payload received:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setRappers(prev => {
              const existing = prev.find(r => r.id === payload.new.id);
              if (existing) {
                return prev.map(r => r.id === payload.new.id ? { ...r, ...payload.new } as Rapper : r);
              } else {
                return [...prev, payload.new as Rapper].sort((a, b) => a.sort_order - b.sort_order);
              }
            });
          } else if (payload.eventType === 'DELETE') {
            setRappers(prev => prev.filter(r => r.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('[REALTIME] Rappers channel:', status);
      });

    // Subscribe to judges
    const judgesChannel = supabase
      .channel('judges_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'judges' },
        (payload) => {
          console.log('[REALTIME] Judges payload received:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setJudges(prev => {
              const existing = prev.find(j => j.id === payload.new.id);
              if (existing) {
                return prev.map(j => j.id === payload.new.id ? { ...j, ...payload.new } as Judge : j);
              } else {
                return [...prev, payload.new as Judge].sort((a, b) => a.sort_order - b.sort_order);
              }
            });
          } else if (payload.eventType === 'DELETE') {
            setJudges(prev => prev.filter(j => j.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('[REALTIME] Judges channel:', status);
      });

    channelsRef.current = [scoresChannel, controlChannel, rappersChannel, judgesChannel];

    // Fallback to polling if Realtime doesn't connect
    const realtimeTimeout = setTimeout(() => {
      if (!isScoresRealtimeWorkingRef.current || !isControlRealtimeWorkingRef.current) {
        console.warn('[REALTIME] No subscription after 5s, falling back to polling');
        startPolling();
      }
    }, 5000);

    return () => {
      clearTimeout(realtimeTimeout);
      channelsRef.current.forEach(channel => {
        if (supabase) supabase.removeChannel(channel);
      });
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      pendingWritesRef.current.forEach(timer => clearTimeout(timer));
    };
  }, [loadData, startPolling]);

  return {
    rappers,
    judges,
    scores,
    eventControl,
    connectionStatus,
    isInitialized,
    lastWriteTime,
    lastWriteSuccess,
    lastWriteError,
    upsertScore,
    updateRapper,
    updateJudge,
    renameTeam,
    resetScores,
    updateEventControl,
    computeScore,
  };
}
