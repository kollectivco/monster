import { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Medal, Award, Activity } from 'lucide-react';
import { Rapper, Team, Judge, Score, BroadcastState } from '../types';
import logo from '../../imports/Monster_Beast_Beats_To_Ehab_Fahem-1_copy-1.png';
import StageBackground from './StageBackground';
import { motion, AnimatePresence } from 'motion/react';
import type { ConnectionStatus, SyncDiagnostics } from '../hooks/useSupabaseSync';

interface StageDisplayProps {
  rappers: Rapper[];
  teams: Team[];
  judges: Judge[];
  scores: Record<string, Score>;
  broadcastState: BroadcastState;
  connectionStatus: ConnectionStatus;
  diagnostics: SyncDiagnostics;
  onSwitchScreen: () => void;
}

interface RapperResult {
  rapper: Rapper;
  team?: Team;
  round1: number;
  round2: number;
  round3: number;
  cumulative: number;
}

export default function StageDisplay({
  rappers,
  teams,
  judges,
  scores,
  broadcastState,
  connectionStatus,
  diagnostics,
  onSwitchScreen,
}: StageDisplayProps) {
  const [showPodium, setShowPodium] = useState(false);
  const [revealedPositions, setRevealedPositions] = useState<number[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    if (broadcastState.mode === 'podium') {
      setShowPodium(true);
      setRevealedPositions([]);
      // Stagger podium reveals: 4th, 3rd, 2nd, 1st
      const delays = [400, 800, 1200, 1600];
      delays.forEach((delay, index) => {
        setTimeout(() => {
          setRevealedPositions(prev => [...prev, 3 - index]);
        }, delay);
      });
    } else {
      setShowPodium(false);
      setRevealedPositions([]);
    }
  }, [broadcastState.mode]);

  const calculateRapperScore = (rapperId: string, round: number): number => {
    let total = 0;
    judges.forEach(judge => {
      const key = `${judge.id}-${rapperId}-${round}`;
      const score = scores[key];
      if (score) {
        const raw = score.criteria.reduce((a, b) => a + (b ?? 0), 0);
        const deductions =
          (score.deductions.restart ? 1 : 0) +
          (score.deductions.preRecorded ? 2 : 0) +
          (score.deductions.technical ?? 0);
        total += Math.max(0, raw - deductions);
      }
    });
    return total;
  };

  const results: RapperResult[] = rappers.map(rapper => {
    const round1 = calculateRapperScore(rapper.id, 1);
    const round2 = calculateRapperScore(rapper.id, 2);
    const round3 = calculateRapperScore(rapper.id, 3);
    return {
      rapper,
      team: teams.find(t => t.id === rapper.teamId),
      round1,
      round2,
      round3,
      cumulative: round1 + round2 + round3,
    };
  });

  const sortedResults = [...results].sort((a, b) => b.cumulative - a.cumulative);

  const topFourAfterR2 = [...results]
    .sort((a, b) => b.round1 + b.round2 - (a.round1 + a.round2))
    .slice(0, 4);

  const currentRapper = broadcastState.currentRapperId
    ? rappers.find(r => r.id === broadcastState.currentRapperId)
    : null;
  const nextRapper = broadcastState.nextRapperId
    ? rappers.find(r => r.id === broadcastState.nextRapperId)
    : null;

  const currentRapperTeam = currentRapper
    ? teams.find(t => t.id === currentRapper.teamId)
    : null;
  const nextRapperTeam = nextRapper
    ? teams.find(t => t.id === nextRapper.teamId)
    : null;

  const currentRapperScore = currentRapper
    ? calculateRapperScore(currentRapper.id, broadcastState.round)
    : 0;

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return '#92d020';
      case 'polling':
        return '#60a5fa';
      case 'syncing':
        return '#f59e0b';
      case 'offline':
        return '#ef4444';
      case 'disabled':
        return '#6b7280';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-8 relative overflow-hidden">
      {/* Animated background */}
      <StageBackground />

      {/* Debug toggle button (bottom-left corner) */}
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="fixed bottom-4 left-4 p-2 border border-muted-foreground/20 bg-card/80 backdrop-blur-sm rounded-lg hover:border-primary transition-colors"
        style={{ zIndex: 100 }}
        title="Toggle Debug Info"
      >
        <Activity className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* Debug panel */}
      {showDebug && (
        <div className="fixed bottom-16 left-4 border p-3 text-xs" style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--bento-radius)', borderColor: 'var(--border-muted)', boxShadow: 'var(--bento-shadow)', zIndex: 100, maxWidth: '300px' }}>
          <p className="font-bold mb-2 text-foreground">Stage Display Debug</p>
          <div className="space-y-1 font-mono text-muted-foreground">
            <div className="flex justify-between">
              <span>Status:</span>
              <span style={{ color: getStatusColor() }}>{connectionStatus}</span>
            </div>
            <div className="flex justify-between">
              <span>Realtime:</span>
              <span style={{ color: diagnostics.realtimeStatus === 'subscribed' ? '#92d020' : diagnostics.realtimeStatus === 'error' ? '#ef4444' : '#f59e0b' }}>
                {diagnostics.realtimeStatus || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Last Update:</span>
              <span className="text-foreground">
                {diagnostics.lastReadTime ? diagnostics.lastReadTime.toLocaleTimeString() : 'Never'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Event ID:</span>
              <span className="text-foreground">{diagnostics.eventId}</span>
            </div>
            {diagnostics.realtimeError && (
              <div className="mt-2 pt-2 border-t border-destructive/20">
                <p className="text-destructive text-xs">{diagnostics.realtimeError}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content layer */}
      <div className="relative flex flex-col min-h-screen w-full justify-center" style={{ zIndex: 2 }}>
        <div className="w-full w-full px-2 md:px-6 lg:px-12 mx-auto">
        <header className="mb-12 text-center">
          <div className="flex justify-center mb-4">
            <img
              src={logo}
              alt="Beast Beats Logo"
              className="h-24 md:h-32 w-auto object-contain"
              style={{ mixBlendMode: 'lighten' }}
            />
          </div>
          <p className="text-sm tracking-widest text-muted-foreground" style={{ fontSize: '0.7rem', fontFamily: 'Shockwave' }}>
            ROUND {broadcastState.round}
          </p>
        </header>

        {broadcastState.mode === 'now-performing' && !currentRapper && (
          <div className="min-h-[60vh] flex flex-col items-center justify-center gap-8">
            <div className="text-center">
              <div className="flex justify-center mb-8">
                <img
                  src={logo}
                  alt="Beast Beats Logo"
                  className="h-48 md:h-64 w-auto object-contain"
                  style={{ mixBlendMode: 'lighten' }}
                />
              </div>
              <p className="text-sm tracking-widest text-muted-foreground mb-3" style={{ fontSize: '0.7rem', fontFamily: 'Shockwave' }}>
                ROUND {broadcastState.round}
              </p>
              <p className="text-xl text-muted-foreground">
                Waiting for the next performer…
              </p>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {broadcastState.mode === 'now-performing' && currentRapper && (
            <motion.div
              key={currentRapper.id}
              initial={{ y: 40, opacity: 0, filter: 'blur(12px)', scale: 0.95 }}
              animate={{
                y: 0,
                opacity: 1,
                filter: 'blur(0px)',
                scale: 1
              }}
              exit={{ y: -40, opacity: 0, filter: 'blur(12px)', scale: 1.05 }}
              transition={{
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1] // Cinematic ease out
              }}
              className="min-h-[60vh] flex flex-col items-center justify-center gap-8"
            >
              <motion.div
                className="text-center border p-12 md:p-16 relative overflow-hidden"
                style={{ borderRadius: 'var(--bento-radius)', borderColor: 'var(--primary)', backgroundColor: 'var(--card)' }}
                animate={{
                  boxShadow: [
                    '0 0 30px rgba(146, 208, 32, 0.4), var(--bento-shadow)',
                    '0 0 60px rgba(146, 208, 32, 0.8), var(--bento-shadow)',
                    '0 0 30px rgba(146, 208, 32, 0.4), var(--bento-shadow)'
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* Glow behind text */}
                <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
                
                <motion.p 
                  className="text-xs tracking-widest text-muted-foreground mb-6 relative z-10" 
                  style={{ fontSize: '0.65rem' }}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  NOW PERFORMING
                </motion.p>

                <motion.h2
                  className="text-6xl md:text-9xl mb-4 text-primary relative z-10"
                  style={{ textShadow: 'var(--green-glow-strong)', lineHeight: '1' }}
                  initial={{ y: 20, opacity: 0, filter: 'blur(8px)' }}
                  animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                  transition={{
                    delay: 0.1,
                    duration: 0.6,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                >
                  {currentRapper.name}
                </motion.h2>

                <motion.p 
                  className="text-3xl md:text-5xl text-secondary mb-8 relative z-10"
                  style={{ fontFamily: 'Shockwave' }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  {currentRapperTeam?.name}
                </motion.p>

                {broadcastState.showScore && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5, type: "spring", stiffness: 200, damping: 20 }}
                    className="inline-block px-10 py-6 border border-primary relative z-10"
                    style={{ borderRadius: 'var(--bento-radius)', backgroundColor: 'var(--muted)', boxShadow: 'var(--green-glow)' }}
                  >
                    <p className="text-xs text-muted-foreground mb-2 tracking-widest" style={{ fontSize: '0.65rem' }}>CURRENT SCORE</p>
                    <p
                      className="mono font-bold text-primary"
                      style={{ textShadow: 'var(--green-glow)', fontSize: '4rem', lineHeight: '1' }}
                    >
                      {currentRapperScore}
                      <span className="text-3xl text-muted-foreground">/40</span>
                    </p>
                  </motion.div>
                )}
              </motion.div>

              {nextRapper && (
                <motion.div
                  initial={{ y: 20, opacity: 0, filter: 'blur(4px)' }}
                  animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="text-center border p-6"
                  style={{ borderRadius: 'var(--bento-radius)', borderColor: 'var(--border-muted)', backgroundColor: 'var(--card)', boxShadow: 'var(--bento-shadow)' }}
                >
                  <p className="text-xs tracking-widest text-muted-foreground mb-3" style={{ fontSize: '0.65rem' }}>
                    NEXT UP
                  </p>
                  <p className="text-2xl text-secondary mb-1">{nextRapper.name}</p>
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: 'Shockwave' }}>{nextRapperTeam?.name}</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {broadcastState.mode === 'round-standings' && (
          <div className="grid gap-4">
            {[...results]
              .sort((a, b) => {
                const aScore = broadcastState.round === 1 ? a.round1 : broadcastState.round === 2 ? a.round2 : a.round3;
                const bScore = broadcastState.round === 1 ? b.round1 : broadcastState.round === 2 ? b.round2 : b.round3;
                return bScore - aScore;
              })
              .map((result, index) => {
                const score = broadcastState.round === 1 ? result.round1 : broadcastState.round === 2 ? result.round2 : result.round3;
                const isTopFour = broadcastState.round === 3 && topFourAfterR2.some(t => t.rapper.id === result.rapper.id);
                const showInR3 = broadcastState.round !== 3 || isTopFour;

                if (!showInR3) return null;

                return (
                  <motion.div
                    key={result.rapper.id}
                    initial={{ x: -50, opacity: 0, scale: 0.9 }}
                    animate={{
                      x: [0, 5, 0],
                      opacity: 1,
                      scale: 1
                    }}
                    transition={{
                      delay: index * 0.15,
                      duration: 0.5,
                      ease: [0.34, 1.56, 0.64, 1]
                    }}
                    className="bg-card border p-8 flex items-center justify-between"
                    style={{ borderColor: index === 0 ? 'var(--primary)' : 'var(--border-muted)', borderRadius: 'var(--bento-radius)', boxShadow: index === 0 ? 'var(--green-glow), var(--bento-shadow)' : 'var(--bento-shadow)' }}
                  >
                    <div className="flex items-center gap-8">
                      <motion.div
                        className="mono font-bold text-muted-foreground"
                        style={{ fontSize: '3.5rem', lineHeight: '1', width: '4rem' }}
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.2, 1] }}
                        transition={{ delay: index * 0.15 + 0.2, duration: 0.4 }}
                      >
                        {index + 1}
                      </motion.div>
                      <div>
                        <div className="text-3xl mb-2">{result.rapper.name}</div>
                        <div className="text-sm text-muted-foreground tracking-wide">
                          {result.team?.name}
                        </div>
                      </div>
                    </div>
                    <motion.div
                      className="mono font-bold text-foreground"
                      style={{ fontSize: '3.5rem', lineHeight: '1' }}
                      initial={{ scale: 0 }}
                      animate={{
                        scale: [0, 1.3, 1],
                        filter: ['brightness(1)', 'brightness(2)', 'brightness(1)']
                      }}
                      transition={{
                        delay: index * 0.15 + 0.3,
                        duration: 0.5,
                        ease: [0.34, 1.56, 0.64, 1]
                      }}
                    >
                      {score}
                      <span className="text-2xl text-muted-foreground">/40</span>
                    </motion.div>
                  </motion.div>
                );
              })}
          </div>
        )}

        {broadcastState.mode === 'podium' && sortedResults.slice(0, 4).length === 4 && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <motion.div
                className="bg-gradient-to-b from-primary/20 to-card border border-primary p-8 lg:col-span-2 lg:row-span-1 relative overflow-hidden"
                style={{ boxShadow: 'var(--green-glow-strong), var(--bento-shadow-hover)', borderRadius: 'var(--bento-radius)' }}
                initial={{ scale: 0, rotate: -10 }}
                animate={revealedPositions.includes(0) ? {
                  scale: [0, 1.15, 1],
                  rotate: [0, 5, 0],
                  filter: ['brightness(1)', 'brightness(2)', 'brightness(1)']
                } : {}}
                transition={{
                  duration: 0.7,
                  ease: [0.34, 1.56, 0.64, 1]
                }}
              >
                {revealedPositions.includes(0) && (
                  <>
                    {/* Confetti burst effect */}
                    {[...Array(20)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-primary rounded-full"
                        style={{
                          left: '50%',
                          top: '50%',
                        }}
                        initial={{ scale: 0, x: 0, y: 0 }}
                        animate={{
                          scale: [0, 1, 0],
                          x: (Math.random() - 0.5) * 300,
                          y: (Math.random() - 0.5) * 300,
                          opacity: [1, 1, 0]
                        }}
                        transition={{
                          duration: 1.5,
                          ease: "easeOut"
                        }}
                      />
                    ))}
                  </>
                )}
                <div className="text-center relative z-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={revealedPositions.includes(0) ? { scale: [0, 1.2, 1], rotate: [0, 360] } : {}}
                    transition={{ delay: 0.3, duration: 0.6 }}
                  >
                    <Trophy className="w-20 h-20 mx-auto mb-4 text-primary" style={{ filter: 'drop-shadow(var(--green-glow))' }} />
                  </motion.div>
                  <div className="mono font-bold text-primary mb-3" style={{ textShadow: 'var(--green-glow)', fontSize: '5rem', lineHeight: '1' }}>1</div>
                  <div className="text-3xl mb-3">{sortedResults[0].rapper.name}</div>
                  <div className="text-sm text-muted-foreground mb-5 tracking-wide">{sortedResults[0].team?.name}</div>
                  <motion.div
                    className="mono text-5xl font-bold text-primary"
                    style={{ textShadow: 'var(--green-glow)' }}
                    initial={{ scale: 0 }}
                    animate={revealedPositions.includes(0) ? { scale: [0, 1.5, 1] } : {}}
                    transition={{ delay: 0.5, duration: 0.6 }}
                  >
                    {sortedResults[0].cumulative}
                  </motion.div>
                </div>
              </motion.div>

              <motion.div
                className="bg-gradient-to-b from-secondary/10 to-card border p-6"
                style={{ borderColor: '#f5f5f0', borderRadius: 'var(--bento-radius)', boxShadow: 'var(--bento-shadow)' }}
                initial={{ scale: 0, x: -100 }}
                animate={revealedPositions.includes(1) ? {
                  scale: [0, 1.1, 1],
                  x: [0, -10, 0],
                  filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)']
                } : {}}
                transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              >
                <div className="text-center">
                  <Medal className="w-16 h-16 mx-auto mb-3 text-secondary" />
                  <div className="mono text-5xl font-bold text-secondary mb-3" style={{ lineHeight: '1' }}>2</div>
                  <div className="text-xl mb-2">{sortedResults[1].rapper.name}</div>
                  <div className="text-xs text-muted-foreground mb-4 tracking-wide">{sortedResults[1].team?.name}</div>
                  <div className="mono text-3xl font-bold text-foreground">{sortedResults[1].cumulative}</div>
                </div>
              </motion.div>

              <motion.div
                className="bg-gradient-to-b from-card to-card border p-6"
                style={{ borderColor: '#5a7a2a', borderRadius: 'var(--bento-radius)', boxShadow: 'var(--bento-shadow)' }}
                initial={{ scale: 0, y: 100 }}
                animate={revealedPositions.includes(2) ? {
                  scale: [0, 1.1, 1],
                  y: [0, -10, 0],
                  filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)']
                } : {}}
                transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              >
                <div className="text-center">
                  <Award className="w-14 h-14 mx-auto mb-3" style={{ color: '#5a7a2a' }} />
                  <div className="mono text-5xl font-bold mb-3" style={{ color: '#5a7a2a', lineHeight: '1' }}>3</div>
                  <div className="text-xl mb-2">{sortedResults[2].rapper.name}</div>
                  <div className="text-xs text-muted-foreground mb-4 tracking-wide">{sortedResults[2].team?.name}</div>
                  <div className="mono text-3xl font-bold text-foreground">{sortedResults[2].cumulative}</div>
                </div>
              </motion.div>

              <motion.div
                className="bg-gradient-to-b from-card to-card border p-6 md:col-span-2 lg:col-span-1"
                style={{ borderColor: '#3a5a1a', borderRadius: 'var(--bento-radius)', boxShadow: 'var(--bento-shadow)' }}
                initial={{ scale: 0, x: 100 }}
                animate={revealedPositions.includes(3) ? {
                  scale: [0, 1.1, 1],
                  x: [0, 10, 0],
                  filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)']
                } : {}}
                transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              >
                <div className="text-center">
                  <Award className="w-12 h-12 mx-auto mb-3" style={{ color: '#3a5a1a' }} />
                  <div className="mono text-5xl font-bold mb-3" style={{ color: '#3a5a1a', lineHeight: '1' }}>4</div>
                  <div className="text-xl mb-2">{sortedResults[3].rapper.name}</div>
                  <div className="text-xs text-muted-foreground mb-4 tracking-wide">{sortedResults[3].team?.name}</div>
                  <div className="mono text-3xl font-bold text-foreground">{sortedResults[3].cumulative}</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
        </div>
      </div>
    </div>
  );
}
