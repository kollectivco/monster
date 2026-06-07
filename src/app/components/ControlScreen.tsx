import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { Settings, Trophy, ArrowLeft, Tv, Wifi, WifiOff, Activity } from 'lucide-react';
import SetupScreen from './SetupScreen';
import Results from './Results';
import JudgeProgress from './JudgeProgress';
import BroadcastControl from './BroadcastControl';
import { AppData, BroadcastState } from '../types';
import logo from '../../imports/Monster_Beast_Beats_To_Ehab_Fahem-1_copy-1.png';
import type { ConnectionStatus, SyncDiagnostics } from '../hooks/useSupabaseSync';

interface ControlScreenProps {
  data: AppData;
  broadcastState: BroadcastState;
  onUpdateTeam: (id: string, name: string) => void;
  onUpdateRapper: (id: string, name: string) => void;
  onUpdateJudge: (id: string, name: string) => void;
  onUpdateBroadcast: (updates: Partial<BroadcastState>) => void;
  onReset: () => void;
  onSwitchScreen: () => void;
  connectionStatus: ConnectionStatus;
  diagnostics: SyncDiagnostics;
}

export default function ControlScreen({
  data,
  broadcastState,
  onUpdateTeam,
  onUpdateRapper,
  onUpdateJudge,
  onUpdateBroadcast,
  onReset,
  onSwitchScreen,
  connectionStatus,
  diagnostics,
}: ControlScreenProps) {
  const [currentTab, setCurrentTab] = useState<string>('broadcast');
  const [showDiagnostics, setShowDiagnostics] = useState(true);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return '#92d020';
      case 'syncing':
        return '#f59e0b';
      case 'polling':
        return '#60a5fa';
      case 'offline':
        return '#ef4444';
      case 'disabled':
        return '#6b7280';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Synced (Realtime)';
      case 'syncing':
        return 'Syncing...';
      case 'polling':
        return 'Synced (Polling)';
      case 'offline':
        return 'Offline';
      case 'disabled':
        return 'Local Only';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6 pb-24">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={onSwitchScreen}
          className="mb-6 text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          SWITCH SCREEN
        </button>

        <header className="mb-8">
          <div className="flex justify-center mb-3">
            <img
              src={logo}
              alt="Beast Beats Logo"
              className="h-20 md:h-24 w-auto object-contain"
              style={{ mixBlendMode: 'lighten' }}
            />
          </div>
          <p className="text-center text-xs tracking-widest text-muted-foreground mb-3" style={{ fontSize: '0.65rem' }}>
            TEAM CONTROL DASHBOARD
          </p>

          {/* Connection status indicator */}
          <div className="flex items-center justify-center gap-2 text-xs mb-2">
            <div className="flex items-center gap-1.5">
              {connectionStatus === 'offline' ? (
                <WifiOff className="w-3.5 h-3.5" style={{ color: getStatusColor() }} />
              ) : (
                <Wifi className="w-3.5 h-3.5" style={{ color: getStatusColor() }} />
              )}
              <span style={{ color: getStatusColor() }}>{getStatusText()}</span>
            </div>
            <div
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: getStatusColor(),
                boxShadow: connectionStatus === 'connected' || connectionStatus === 'polling' ? `0 0 8px ${getStatusColor()}` : 'none',
              }}
            />
          </div>

          {(connectionStatus === 'offline' || connectionStatus === 'disabled') && (
            <p className="text-center text-xs text-muted-foreground mb-2" style={{ fontSize: '0.6rem' }}>
              {connectionStatus === 'disabled'
                ? 'Multi-device sync disabled (configure Supabase to enable)'
                : 'Changes are saved locally only'}
            </p>
          )}

          {/* Diagnostics Panel */}
          {connectionStatus !== 'disabled' && (
            <div className="max-w-2xl mx-auto mt-4">
              <button
                onClick={() => setShowDiagnostics(!showDiagnostics)}
                className="w-full flex items-center justify-between gap-2 text-xs text-muted-foreground hover:text-primary transition-colors mb-2"
              >
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>SYNC DIAGNOSTICS</span>
                </div>
                <span>{showDiagnostics ? '▼' : '▶'}</span>
              </button>

              {showDiagnostics && (
                <div className="border p-4" style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--bento-radius)', borderColor: 'var(--border-muted)', boxShadow: 'var(--bento-shadow)' }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground mb-1">Event ID:</p>
                      <p className="font-mono text-foreground">{diagnostics.eventId}</p>
                    </div>
                    
                    <div>
                      <p className="text-muted-foreground mb-1">Realtime Status:</p>
                      <p className="font-mono" style={{ color: diagnostics.realtimeStatus === 'subscribed' ? '#92d020' : diagnostics.realtimeStatus === 'error' ? '#ef4444' : '#f59e0b' }}>
                        {diagnostics.realtimeStatus || 'N/A'}
                      </p>
                      {diagnostics.realtimeError && (
                        <p className="text-xs text-destructive mt-1">{diagnostics.realtimeError}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-muted-foreground mb-1">Last Write:</p>
                      <p className="font-mono text-foreground">
                        {diagnostics.lastWriteTime ? diagnostics.lastWriteTime.toLocaleTimeString() : 'Never'}
                      </p>
                      {diagnostics.lastWriteSuccess !== null && (
                        <p className="text-xs mt-1" style={{ color: diagnostics.lastWriteSuccess ? '#92d020' : '#ef4444' }}>
                          {diagnostics.lastWriteSuccess ? '✓ Success' : '✗ Failed'}
                        </p>
                      )}
                      {diagnostics.lastWriteError && (
                        <p className="text-xs text-destructive mt-1">{diagnostics.lastWriteError}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-muted-foreground mb-1">Last Read:</p>
                      <p className="font-mono text-foreground">
                        {diagnostics.lastReadTime ? diagnostics.lastReadTime.toLocaleTimeString() : 'Never'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </header>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="inline-flex gap-2 p-2 border" style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--bento-radius)', borderColor: 'var(--border-muted)', boxShadow: 'var(--bento-shadow)' }}>
              <TabsTrigger
                value="broadcast"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-5 py-2.5 text-xs transition-all flex items-center gap-2"
                style={{ boxShadow: currentTab === 'broadcast' ? 'var(--green-glow)' : 'none' }}
              >
                <Tv className="w-4 h-4" />
                <span className="hidden sm:inline">BROADCAST</span>
              </TabsTrigger>
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-5 py-2.5 text-xs transition-all"
                style={{ boxShadow: currentTab === 'overview' ? 'var(--green-glow)' : 'none' }}
              >
                OVERVIEW
              </TabsTrigger>
              <TabsTrigger
                value="results"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-5 py-2.5 text-xs transition-all flex items-center gap-2"
                style={{ boxShadow: currentTab === 'results' ? 'var(--green-glow)' : 'none' }}
              >
                <Trophy className="w-4 h-4" />
                <span className="hidden sm:inline">RESULTS</span>
              </TabsTrigger>
              <TabsTrigger
                value="setup"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-5 py-2.5 text-xs transition-all flex items-center gap-2"
                style={{ boxShadow: currentTab === 'setup' ? 'var(--green-glow)' : 'none' }}
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">SETUP</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="broadcast">
            <BroadcastControl
              rappers={data.rappers}
              teams={data.teams}
              judges={data.judges}
              scores={data.scores}
              broadcastState={broadcastState}
              onUpdateBroadcast={onUpdateBroadcast}
            />
          </TabsContent>

          <TabsContent value="overview">
            <JudgeProgress
              rappers={data.rappers}
              teams={data.teams}
              judges={data.judges}
              scores={data.scores}
            />
          </TabsContent>

          <TabsContent value="results">
            <Results
              rappers={data.rappers}
              teams={data.teams}
              judges={data.judges}
              scores={data.scores}
            />
          </TabsContent>

          <TabsContent value="setup">
            <SetupScreen
              data={data}
              onUpdateTeam={onUpdateTeam}
              onUpdateRapper={onUpdateRapper}
              onUpdateJudge={onUpdateJudge}
              onReset={onReset}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
