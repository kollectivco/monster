import { useState, useMemo, useEffect } from 'react';
import ScreenSelector from './components/ScreenSelector';
import JudgeScreen from './components/JudgeScreen';
import StageDisplay from './components/StageDisplay';
import ControlScreen from './components/ControlScreen';
import LoadingScreen from './components/LoadingScreen';
import MCScreen from './components/MCScreen';
import { AppData, Score, BroadcastState, Judge } from './types';
import { useRelationalSync } from './hooks/useRelationalSync';
import { useHashRouter, nameToSlug } from './hooks/useHashRouter';
import { seedDatabase } from './lib/seedData';
import {
  convertToAppData,
  convertToBroadcastState,
  convertScoreUpdate,
  convertBroadcastUpdate,
} from './lib/dataAdapter';
import { X } from 'lucide-react';

const CURRENT_VERSION = '3.0'; // Relational database version

export default function App() {
  const [showErrorDismissed, setShowErrorDismissed] = useState(false);
  const { hash, navigate } = useHashRouter();

  // Seed database on mount
  useEffect(() => {
    seedDatabase();
  }, []);

  // Use relational Supabase sync
  const {
    rappers: dbRappers,
    judges: dbJudges,
    scores: dbScores,
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
  } = useRelationalSync();

  // Convert relational data to legacy format for existing components
  const data = useMemo(() => {
    return convertToAppData(dbRappers, dbJudges, dbScores);
  }, [dbRappers, dbJudges, dbScores]);

  const broadcastState = useMemo(() => {
    return convertToBroadcastState(eventControl);
  }, [eventControl]);

  const diagnostics = useMemo(() => ({
    lastWriteTime,
    lastWriteSuccess,
    lastWriteError,
    lastReadTime: eventControl ? new Date(eventControl.updated_at) : null,
    realtimeStatus: connectionStatus === 'connected' ? 'subscribed' as const :
                    connectionStatus === 'syncing' ? 'connecting' as const :
                    connectionStatus === 'offline' ? 'error' as const :
                    'disabled' as const,
    realtimeError: null,
    eventId: 'beastbeats',
  }), [connectionStatus, eventControl, lastWriteTime, lastWriteSuccess, lastWriteError]);

  // Create slug-to-judge mapping
  const judgesBySlug = useMemo(() => {
    const map = new Map<string, Judge>();
    data.judges.forEach((judge, index) => {
      const slug = nameToSlug(judge.name);
      map.set(slug, judge);
      // Also add fallback numeric slug
      map.set(String(index + 1), judge);
    });
    return map;
  }, [data.judges]);

  // Parse current route
  const currentRoute = useMemo(() => {
    if (hash === '/') {
      return { type: 'picker' as const };
    }

    if (hash === '/stage') {
      return { type: 'stage' as const };
    }

    if (hash === '/control') {
      return { type: 'control' as const };
    }

    if (hash === '/mc') {
      return { type: 'mc' as const };
    }

    // Match /judge/:slug
    const judgeMatch = hash.match(/^\/judge\/(.+)$/);
    if (judgeMatch) {
      const slug = judgeMatch[1];
      const judge = judgesBySlug.get(slug);
      if (judge) {
        return { type: 'judge' as const, judge };
      }
    }

    // Unknown route, fallback to picker
    return { type: 'picker' as const };
  }, [hash, judgesBySlug]);

  const handleSelectScreen = (screen: string) => {
    if (screen.startsWith('judge-')) {
      const slug = screen.replace('judge-', '');
      navigate(`/judge/${slug}`);
    } else if (screen === 'stage') {
      navigate('/stage');
    } else if (screen === 'control') {
      navigate('/control');
    } else if (screen === 'mc') {
      navigate('/mc');
    }
  };

  const handleSwitchScreen = () => {
    navigate('/');
  };

  const updateTeamName = (id: string, name: string) => {
    const team = data.teams.find(t => t.id === id);
    if (team) renameTeam(team.name, name);
  };

  const updateRapperName = (id: string, name: string) => {
    updateRapper(id, { name });
  };

  const updateJudgeName = (id: string, name: string) => {
    updateJudge(id, name);
  };

  const updateScore = (
    judgeId: string,
    rapperId: string,
    round: number,
    updates: Partial<Score>
  ) => {
    const scoreUpdate = convertScoreUpdate(judgeId, rapperId, round, updates);
    upsertScore(scoreUpdate);
  };

  const handleUpdateBroadcast = (updates: Partial<BroadcastState>) => {
    const controlUpdate = convertBroadcastUpdate(updates);
    updateEventControl(controlUpdate);
  };

  const resetAll = () => {
    if (window.confirm('RESET ALL DATA? This cannot be undone.')) {
      resetScores();
    }
  };

  // Show loading state while initializing
  if (!isInitialized) {
    return <LoadingScreen status={connectionStatus === 'syncing' ? 'CONNECTING...' : 'LOADING...'} />;
  }

  // Show dismissible error notification if offline
  const showErrorNotification = !showErrorDismissed && connectionStatus === 'offline';

  // Render based on current route
  if (currentRoute.type === 'picker') {
    return (
      <>
        <ScreenSelector onSelectScreen={handleSelectScreen} />
        {showErrorNotification && (
          <div className="fixed top-4 right-4 max-w-md border-2 border-destructive p-4 rounded-2xl z-50" style={{ backgroundColor: 'var(--card)', boxShadow: 'var(--bento-shadow)' }}>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-bold text-destructive mb-1">Connection Issue</p>
                <p className="text-xs text-muted-foreground">
                  Could not connect to Supabase. Running in local-only mode. Multi-device sync disabled.
                </p>
              </div>
              <button
                onClick={() => setShowErrorDismissed(true)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  if (currentRoute.type === 'judge') {
    return (
      <JudgeScreen
        judge={currentRoute.judge}
        data={data}
        onUpdateScore={updateScore}
        onSwitchScreen={handleSwitchScreen}
      />
    );
  }

  if (currentRoute.type === 'stage') {
    return (
      <StageDisplay
        rappers={data.rappers}
        teams={data.teams}
        judges={data.judges}
        scores={data.scores}
        broadcastState={broadcastState}
        connectionStatus={connectionStatus}
        diagnostics={diagnostics}
        onSwitchScreen={handleSwitchScreen}
      />
    );
  }

  if (currentRoute.type === 'control') {
    return (
      <ControlScreen
        data={data}
        broadcastState={broadcastState}
        onUpdateTeam={updateTeamName}
        onUpdateRapper={updateRapperName}
        onUpdateJudge={updateJudgeName}
        onUpdateBroadcast={handleUpdateBroadcast}
        onUpdateScore={updateScore}
        onReset={resetAll}
        onSwitchScreen={handleSwitchScreen}
        connectionStatus={connectionStatus}
        diagnostics={diagnostics}
      />
    );
  }

  return <ScreenSelector onSelectScreen={handleSelectScreen} />;
}
