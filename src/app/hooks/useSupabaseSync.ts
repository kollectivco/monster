import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, EVENT_ID, isSupabaseConfigured } from '../lib/supabase';
import { AppData, BroadcastState } from '../types';
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

interface EventData {
  data: AppData;
  broadcastState: BroadcastState;
  version: string;
}

const DEBOUNCE_DELAY = 300; // ms
const INIT_TIMEOUT = 5000; // 5 seconds timeout for initialization
const POLLING_INTERVAL = 2000; // 2 seconds for polling fallback
const STORAGE_KEY = 'beast-beats-local-data';
const BROADCAST_KEY = 'beast-beats-local-broadcast';

export function useSupabaseSync(
  initialData: AppData,
  initialBroadcast: BroadcastState,
  currentVersion: string
) {
  const [data, setData] = useState<AppData>(initialData);
  const [broadcastState, setBroadcastState] = useState<BroadcastState>(initialBroadcast);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    isSupabaseConfigured() ? 'syncing' : 'disabled'
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<SyncDiagnostics>({
    lastWriteTime: null,
    lastWriteSuccess: null,
    lastWriteError: null,
    lastReadTime: null,
    realtimeStatus: null,
    realtimeError: null,
    eventId: EVENT_ID,
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const writeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingWriteRef = useRef<EventData | null>(null);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRealtimeWorkingRef = useRef<boolean>(false);
  const lastReceivedDataRef = useRef<string>('');

  // Load from localStorage as fallback
  const loadLocalData = useCallback(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      const savedBroadcast = localStorage.getItem(BROADCAST_KEY);

      if (savedData) {
        const parsed = JSON.parse(savedData);
        setData(parsed);
      }

      if (savedBroadcast) {
        const parsed = JSON.parse(savedBroadcast);
        setBroadcastState(parsed);
      }
    } catch (err) {
      console.error('Failed to load local data:', err);
    }
  }, []);

  // Save to localStorage
  const saveLocalData = useCallback((newData: AppData, newBroadcast: BroadcastState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      localStorage.setItem(BROADCAST_KEY, JSON.stringify(newBroadcast));
    } catch (err) {
      console.error('Failed to save local data:', err);
    }
  }, []);

  // Poll for updates (fallback when Realtime doesn't work)
  const pollForUpdates = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) return;

    try {
      const { data: row, error } = await supabase
        .from('event_state')
        .select('*')
        .eq('id', EVENT_ID)
        .single();

      if (error) {
        console.error('[POLLING] Error fetching data:', error);
        return;
      }

      if (row?.data) {
        const eventData = row.data as EventData;
        const newDataStr = JSON.stringify(eventData);

        // Only update if data actually changed
        if (newDataStr !== lastReceivedDataRef.current) {
          console.log('[POLLING] Update received at', new Date().toLocaleTimeString());
          lastReceivedDataRef.current = newDataStr;
          setData(eventData.data);
          setBroadcastState(eventData.broadcastState);
          saveLocalData(eventData.data, eventData.broadcastState);
          setDiagnostics(prev => ({
            ...prev,
            lastReadTime: new Date(),
          }));
        }
      }
    } catch (err) {
      console.error('[POLLING] Poll error:', err);
    }
  }, [saveLocalData]);

  // Start polling fallback
  const startPolling = useCallback(() => {
    console.log('[POLLING] Starting polling fallback (every 2s)');
    setConnectionStatus('polling');
    setDiagnostics(prev => ({
      ...prev,
      realtimeStatus: 'disabled',
    }));

    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Start new polling interval
    pollingIntervalRef.current = setInterval(pollForUpdates, POLLING_INTERVAL);

    // Do an immediate poll
    pollForUpdates();
  }, [pollForUpdates]);

  // Fetch initial data from Supabase with timeout
  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) {
      console.log('[INIT] Supabase not configured, using local storage only');
      loadLocalData();
      setConnectionStatus('disabled');
      setDiagnostics(prev => ({
        ...prev,
        realtimeStatus: 'disabled',
      }));
      setIsInitialized(true);
      return;
    }

    console.log(`[INIT] Fetching initial data for event: ${EVENT_ID}`);

    // Set timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      initTimeoutRef.current = setTimeout(() => {
        reject(new Error('Initialization timeout - loading from local state'));
      }, INIT_TIMEOUT);
    });

    try {
      const fetchPromise = supabase
        .from('event_state')
        .select('*')
        .eq('id', EVENT_ID)
        .single();

      const { data: row, error } = await Promise.race([
        fetchPromise,
        timeoutPromise,
      ]) as any;

      if (error) {
        if (error.code === 'PGRST116') {
          // Row doesn't exist, create it
          console.log('[INIT] Creating initial event_state row');
          const eventData: EventData = {
            data: initialData,
            broadcastState: initialBroadcast,
            version: currentVersion,
          };

          const { error: insertError } = await supabase
            .from('event_state')
            .insert({
              id: EVENT_ID,
              data: eventData,
            });

          if (insertError) {
            console.error('[INIT] Failed to create initial data:', insertError);
            setConnectionStatus('offline');
            setDiagnostics(prev => ({
              ...prev,
              lastWriteSuccess: false,
              lastWriteError: insertError.message,
            }));
          } else {
            console.log('[INIT] Initial data created successfully');
            setData(initialData);
            setBroadcastState(initialBroadcast);
            setConnectionStatus('connected');
            setDiagnostics(prev => ({
              ...prev,
              lastWriteTime: new Date(),
              lastWriteSuccess: true,
              lastWriteError: null,
            }));
          }
        } else {
          console.error('[INIT] Error fetching data:', error);
          setConnectionStatus('offline');
        }
      } else if (row?.data) {
        const eventData = row.data as EventData;
        console.log('[INIT] Loaded data from Supabase');

        // Check version and preserve scores if version changed
        if (eventData.version !== currentVersion) {
          console.log('[INIT] Version mismatch, preserving scores');
          const updatedData: AppData = {
            ...initialData,
            scores: eventData.data.scores || {},
          };
          setData(updatedData);

          // Update remote with new version
          const newEventData: EventData = {
            data: updatedData,
            broadcastState: eventData.broadcastState,
            version: currentVersion,
          };

          await supabase
            .from('event_state')
            .update({ data: newEventData })
            .eq('id', EVENT_ID);
        } else {
          setData(eventData.data);
          setBroadcastState(eventData.broadcastState);
          lastReceivedDataRef.current = JSON.stringify(eventData);
        }

        setConnectionStatus('connected');
        setDiagnostics(prev => ({
          ...prev,
          lastReadTime: new Date(),
        }));
      }

      // Clear timeout on success
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }

      setIsInitialized(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[INIT] Failed to fetch data:', errorMsg);

      // Clear timeout
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }

      // Load from local storage as fallback
      loadLocalData();
      setConnectionStatus('offline');
      setInitError(errorMsg);
      setIsInitialized(true);

      // Continue retrying in background
      console.log('[INIT] Will retry Supabase connection in background...');
    }
  }, [initialData, initialBroadcast, currentVersion, loadLocalData]);

  // Debounced write to Supabase
  const writeToSupabase = useCallback(
    async (eventData: EventData) => {
      if (!isSupabaseConfigured() || !supabase) {
        return;
      }

      try {
        console.log('[WRITE] Sending update to Supabase at', new Date().toLocaleTimeString(), eventData);
        setConnectionStatus('syncing');

        const { error } = await supabase
          .from('event_state')
          .update({
            data: eventData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', EVENT_ID);

        if (error) {
          console.error('[WRITE] Failed to write to Supabase:', error);
          setConnectionStatus('offline');
          setDiagnostics(prev => ({
            ...prev,
            lastWriteTime: new Date(),
            lastWriteSuccess: false,
            lastWriteError: error.message,
          }));
        } else {
          console.log('[WRITE] Successfully wrote to Supabase');
          setConnectionStatus(isRealtimeWorkingRef.current ? 'connected' : 'polling');
          setDiagnostics(prev => ({
            ...prev,
            lastWriteTime: new Date(),
            lastWriteSuccess: true,
            lastWriteError: null,
          }));
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error('[WRITE] Write error:', errorMsg);
        setConnectionStatus('offline');
        setDiagnostics(prev => ({
          ...prev,
          lastWriteTime: new Date(),
          lastWriteSuccess: false,
          lastWriteError: errorMsg,
        }));
      }
    },
    []
  );

  // Debounced update function
  const debouncedWrite = useCallback(
    (eventData: EventData) => {
      pendingWriteRef.current = eventData;

      if (writeTimeoutRef.current) {
        clearTimeout(writeTimeoutRef.current);
      }

      writeTimeoutRef.current = setTimeout(() => {
        if (pendingWriteRef.current) {
          writeToSupabase(pendingWriteRef.current);
          pendingWriteRef.current = null;
        }
      }, DEBOUNCE_DELAY);
    },
    [writeToSupabase]
  );

  // Update data optimistically and sync to Supabase
  const updateData = useCallback(
    (newData: AppData) => {
      setData(newData);
      saveLocalData(newData, broadcastState);

      if (isSupabaseConfigured()) {
        debouncedWrite({
          data: newData,
          broadcastState,
          version: currentVersion,
        });
      }
    },
    [broadcastState, currentVersion, debouncedWrite, saveLocalData]
  );

  const updateBroadcastState = useCallback(
    (newBroadcast: BroadcastState) => {
      setBroadcastState(newBroadcast);
      saveLocalData(data, newBroadcast);

      if (isSupabaseConfigured()) {
        debouncedWrite({
          data,
          broadcastState: newBroadcast,
          version: currentVersion,
        });
      }
    },
    [data, currentVersion, debouncedWrite, saveLocalData]
  );

  // Initialize and subscribe to Realtime
  useEffect(() => {
    fetchData();

    if (!isSupabaseConfigured() || !supabase) {
      return;
    }

    console.log('[REALTIME] Setting up subscription to event_state table');
    setDiagnostics(prev => ({
      ...prev,
      realtimeStatus: 'connecting',
    }));

    // Subscribe to Realtime changes
    const channel = supabase
      .channel('event_state_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'event_state',
          filter: `id=eq.${EVENT_ID}`,
        },
        (payload) => {
          console.log('[REALTIME] Update received at', new Date().toLocaleTimeString(), payload);
          isRealtimeWorkingRef.current = true;

          const eventData = payload.new.data as EventData;
          const newDataStr = JSON.stringify(eventData);

          // Only update if data actually changed
          if (newDataStr !== lastReceivedDataRef.current) {
            lastReceivedDataRef.current = newDataStr;
            setData(eventData.data);
            setBroadcastState(eventData.broadcastState);
            saveLocalData(eventData.data, eventData.broadcastState);
            setConnectionStatus('connected');
            setDiagnostics(prev => ({
              ...prev,
              lastReadTime: new Date(),
              realtimeStatus: 'subscribed',
            }));
          }
        }
      )
      .subscribe((status, err) => {
        console.log('[REALTIME] Subscription status:', status);

        if (status === 'SUBSCRIBED') {
          console.log('[REALTIME] Successfully subscribed');
          isRealtimeWorkingRef.current = true;
          setDiagnostics(prev => ({
            ...prev,
            realtimeStatus: 'subscribed',
            realtimeError: null,
          }));

          // Clear polling if it's running
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }

          if (connectionStatus === 'polling') {
            setConnectionStatus('connected');
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          const errorMsg = err?.message || `Subscription ${status}`;
          console.error('[REALTIME] Subscription error:', errorMsg);
          isRealtimeWorkingRef.current = false;
          setDiagnostics(prev => ({
            ...prev,
            realtimeStatus: 'error',
            realtimeError: errorMsg,
          }));

          // Fall back to polling
          startPolling();
        }
      });

    channelRef.current = channel;

    // If Realtime doesn't connect within 5 seconds, fall back to polling
    const realtimeTimeout = setTimeout(() => {
      if (!isRealtimeWorkingRef.current) {
        console.warn('[REALTIME] No subscription confirmation after 5s, falling back to polling');
        startPolling();
      }
    }, 5000);

    // Cleanup
    return () => {
      clearTimeout(realtimeTimeout);
      if (channelRef.current && supabase) {
        supabase.removeChannel(channelRef.current);
      }
      if (writeTimeoutRef.current) {
        clearTimeout(writeTimeoutRef.current);
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [fetchData, saveLocalData, startPolling]);

  // Monitor connection status
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      return;
    }

    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('event_state').select('id').limit(1);
        if (error) {
          setConnectionStatus('offline');
        } else if (connectionStatus === 'offline') {
          setConnectionStatus(isRealtimeWorkingRef.current ? 'connected' : 'polling');
          // Refetch data when coming back online
          fetchData();
        }
      } catch {
        setConnectionStatus('offline');
      }
    };

    const interval = setInterval(checkConnection, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [connectionStatus, fetchData]);

  return {
    data,
    broadcastState,
    connectionStatus,
    isInitialized,
    initError,
    diagnostics,
    updateData,
    updateBroadcastState,
  };
}
