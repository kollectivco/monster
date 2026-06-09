import { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Medal, Award, Activity } from 'lucide-react';
import { Rapper, Team, Judge, Score, BroadcastState } from '../types';
import logo from '../../imports/logo.webp';
import StageBackground from './StageBackground';
import { motion, AnimatePresence } from 'motion/react';
import type { ConnectionStatus, SyncDiagnostics } from '../hooks/useRelationalSync';
import { GeneralVisuals, RoundIntros, FinalistsVisuals } from './VisualModes';

const photos = import.meta.glob('../../styles/photos/*.webp', { query: '?url', import: 'default', eager: true }) as Record<string, string>;

const getRapperImage = (name: string) => {
  const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const customMap: Record<string, string> = {
    'therealdopie': 'therealdopie',
    'dezelelgenral': 'dezel',
    'hazemhany': 'hazem',
  };
  const searchKey = customMap[normalizedName] || normalizedName;
  const match = Object.keys(photos).find(path => path.toLowerCase().includes(searchKey));
  return match ? photos[match] : null;
};

const getRapperPngImage = (name: string) => {
  const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const customMap: Record<string, string> = {
    'therealdopie': 'therealdopie',
    'dezelelgenral': 'dezel',
    'hazemhany': 'hazem',
  };
  const searchKey = customMap[normalizedName] || normalizedName;
  const match = Object.keys(photos).find(path => path.toLowerCase().includes(searchKey) && path.toLowerCase().endsWith('.webp'));
  return match ? photos[match] : null;
};

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

  const calculateRapperCriteria = (rapperId: string, round: number) => {
    let criteriaSum = [0, 0, 0, 0, 0];
    judges.forEach(judge => {
      const key = `${judge.id}-${rapperId}-${round}`;
      const score = scores[key];
      if (score) {
        score.criteria.forEach((val, i) => {
          criteriaSum[i] += (val ?? 0);
        });
      }
    });
    return criteriaSum;
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

  let topFourAfterR2 = [...results]
    .sort((a, b) => b.round1 + b.round2 - (a.round1 + a.round2))
    .slice(0, 3);

  if (broadcastState.wildcardRapperId) {
    const wildcard = results.find(r => r.rapper.id === broadcastState.wildcardRapperId);
    if (wildcard) {
      topFourAfterR2.push(wildcard);
    }
  } else {
    topFourAfterR2.push({
      rapper: { id: 'tbd', name: 'TBD / Wild Card', teamId: '' },
      team: undefined,
      round1: 0,
      round2: 0,
      round3: 0,
      cumulative: 0
    });
  }

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

  // Preload next rapper's image for instant switching
  useEffect(() => {
    if (nextRapper) {
      const imgPath = getRapperPngImage(nextRapper.name);
      if (imgPath) {
        const img = new Image();
        img.src = imgPath;
      }
    }
  }, [nextRapper]);

  const currentRapperCriteria = currentRapper
    ? calculateRapperCriteria(currentRapper.id, broadcastState.round)
    : [0, 0, 0, 0, 0];

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

  const isSpecialVisualMode = [
    'intro-logos', 'countdown-timer', 'warning-screen', 'judges-cards', 
    'round-1-intro', 'minute-timer', 'round-2-intro', 'wild-card', 
    'top-4-visual', 'round-3-intro', 'finalists-vs', 'winner-graphic', 'final-scoring-grid',
    'judge-zaza', 'judge-shahyn', 'judge-alyloka', 'judge-shehab'
  ].includes(broadcastState.mode);

  // Hide equalizer during general visuals
  const isGeneralVisual = [
    'intro-logos', 'countdown-timer', 'warning-screen', 'judges-cards',
    'judge-zaza', 'judge-shahyn', 'judge-alyloka', 'judge-shehab'
  ].includes(broadcastState.mode);

  return (
    <div className="bg-background text-foreground relative overflow-hidden mx-auto" style={{ width: '768px', height: '1536px', fontFamily: 'Anton, sans-serif' }}>
      {/* Animated background */}
      <StageBackground showEqualizer={!isGeneralVisual} />

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
      <div className="relative flex flex-col h-full w-full justify-center" style={{ zIndex: 2 }}>
        <AnimatePresence mode="wait">
          {isSpecialVisualMode ? (
            <motion.div key={broadcastState.mode} className="w-full h-full flex flex-col items-center justify-center">
              <GeneralVisuals state={broadcastState} rappers={rappers} teams={teams} />
              <RoundIntros state={broadcastState} rappers={rappers} teams={teams} />
              <FinalistsVisuals state={broadcastState} rappers={rappers} teams={teams} winner={sortedResults[0]} topFour={topFourAfterR2} />
            </motion.div>
          ) : (
            <motion.div key="standard-mode" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full w-full px-2 md:px-6 lg:px-12 mx-auto">
              {!(broadcastState.mode === 'now-performing' && !currentRapper) && (
                <header className="mb-12 text-center">
                  <div className="flex justify-center mb-4">
                    <img
                      src={logo}
                      alt="Beast Beats Logo"
                      className="h-32 md:h-48 lg:h-56 w-auto object-contain"
                      style={{ mixBlendMode: 'lighten' }}
                    />
                  </div>
                  <p className="text-xl md:text-2xl tracking-widest text-muted-foreground" style={{ fontFamily: 'Rocketbrush' }}>
                    ROUND {broadcastState.round}
                  </p>
                </header>
              )}

        {broadcastState.mode === 'now-performing' && !currentRapper && (
          <div className="min-h-[60vh] flex flex-col items-center justify-center gap-8">
            <div className="text-center">
              <div className="flex justify-center mb-8">
                <img
                  src={logo}
                  alt="Beast Beats Logo"
                  className="h-[300px] md:h-[400px] lg:h-[450px] w-auto object-contain"
                  style={{ mixBlendMode: 'lighten' }}
                />
              </div>
              <p className="text-xl md:text-2xl tracking-widest text-muted-foreground mb-3" style={{ fontFamily: 'Rocketbrush' }}>
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
              className="min-h-[50vh] flex flex-col items-center justify-center gap-4 md:gap-6 w-full max-w-6xl mx-auto p-6 md:p-8"
            >
              <motion.div
                className="text-center border p-6 md:p-10 relative overflow-hidden w-full"
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
                
                <div className="relative z-10 w-full flex flex-col items-center justify-center gap-0 text-center">
                  {getRapperPngImage(currentRapper.name) && (
                    <motion.div
                      className="w-full flex justify-center items-center relative z-0"
                      initial={{ scale: 0.8, opacity: 0, y: -50 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      transition={{ delay: 0.15, duration: 0.6, type: 'spring', bounce: 0.5 }}
                    >
                      <img 
                        src={getRapperPngImage(currentRapper.name)!}
                        alt={currentRapper.name}
                        className="w-[400px] h-[400px] md:w-[700px] md:h-[700px] lg:w-[900px] lg:h-[900px] object-contain drop-shadow-[0_0_80px_rgba(146,208,32,0.8)] scale-110 origin-bottom"
                      />
                    </motion.div>
                  )}

                  <div className="w-full flex flex-col justify-center text-center items-center relative z-10 mt-[-2rem] md:mt-[-6rem] lg:mt-[-10rem]">
                    <motion.p 
                      className="text-xs tracking-widest text-muted-foreground mb-6" 
                      style={{ fontSize: '0.65rem' }}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                    >
                      NOW PERFORMING
                    </motion.p>

                    <motion.h2
                      className={`${currentRapper.name.length > 10 ? 'text-4xl sm:text-5xl md:text-5xl lg:text-6xl' : 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl'} mb-4 text-primary break-words`}
                      style={{ textShadow: 'var(--green-glow-strong)', lineHeight: '1', letterSpacing: '-0.02em', wordBreak: 'keep-all' }}
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
                      className="text-3xl md:text-4xl lg:text-5xl text-secondary mb-8"
                      style={{ fontFamily: 'Rocketbrush' }}
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
                  </div>
                </div>

                {broadcastState.showScore && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5, type: "spring", stiffness: 200, damping: 20 }}
                    className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3 mt-4 w-full relative z-10"
                  >
                    {[
                      { name: 'Lyricism & Wordplay', score: currentRapperCriteria[0], max: 8 },
                      { name: 'Flow & Delivery', score: currentRapperCriteria[1], max: 8 },
                      { name: 'Stage Presence & Performance', score: currentRapperCriteria[2], max: 8 },
                      { name: 'Originality & Style', score: currentRapperCriteria[3], max: 8 },
                      { name: 'Content & Impact', score: currentRapperCriteria[4], max: 8 },
                    ].map((crit, i) => (
                      <div key={i} className="border border-border p-2 text-center flex flex-col justify-center items-center" style={{ borderRadius: 'var(--radius)', backgroundColor: 'var(--card)', boxShadow: 'var(--bento-shadow)' }}>
                        <p className="text-[9px] text-muted-foreground tracking-widest mb-1 leading-tight uppercase">{crit.name}</p>
                        <p className="mono font-bold text-primary text-lg">
                          {crit.score} <span className="text-[10px] text-muted-foreground">/ {crit.max}</span>
                        </p>
                      </div>
                    ))}
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
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: 'Rocketbrush' }}>{nextRapperTeam?.name}</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )}
  </AnimatePresence>

      {broadcastState.mode === 'round-standings' && (
          <div className="grid gap-4 w-full p-6 md:p-8">
            {[...results]
              .sort((a, b) => {
                const aTotal = broadcastState.round === 1 ? a.round1 : broadcastState.round === 2 ? a.round1 + a.round2 : a.round1 + a.round2 + a.round3;
                const bTotal = broadcastState.round === 1 ? b.round1 : broadcastState.round === 2 ? b.round1 + b.round2 : b.round1 + b.round2 + b.round3;
                return bTotal - aTotal;
              })
              .map((result, index) => {
                const roundScore = broadcastState.round === 1 ? result.round1 : broadcastState.round === 2 ? result.round2 : result.round3;
                const totalScore = broadcastState.round === 1 ? result.round1 : broadcastState.round === 2 ? result.round1 + result.round2 : result.round1 + result.round2 + result.round3;
                const maxTotal = broadcastState.round * 40;
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
                    className="bg-card border p-4 md:p-6 flex items-center justify-between"
                    style={{ borderColor: index === 0 ? 'var(--primary)' : 'var(--border-muted)', borderRadius: 'var(--bento-radius)', boxShadow: index === 0 ? 'var(--green-glow), var(--bento-shadow)' : 'var(--bento-shadow)' }}
                  >
                    <div className="flex items-center gap-6">
                      <motion.div
                        className="mono font-bold text-muted-foreground"
                        style={{ fontSize: '3.5rem', lineHeight: '1', width: '4rem' }}
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.2, 1] }}
                        transition={{ delay: index * 0.15 + 0.2, duration: 0.4 }}
                      >
                        {index + 1}
                      </motion.div>
                      {getRapperImage(result.rapper.name) && (
                        <motion.img 
                          src={getRapperImage(result.rapper.name)!} 
                          alt={result.rapper.name}
                          className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-full border-2"
                          style={{ borderColor: index === 0 ? 'var(--primary)' : 'var(--border-muted)' }}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: index * 0.15 + 0.3, duration: 0.4 }}
                        />
                      )}
                      <div>
                        <div className="text-3xl mb-2">{result.rapper.name}</div>
                        <div className="text-sm text-muted-foreground tracking-wide">
                          {result.team?.name}
                        </div>
                      </div>
                    </div>
                    <motion.div
                      className="text-right"
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
                      <div className="mono font-bold text-foreground" style={{ fontSize: '3.5rem', lineHeight: '1' }}>
                        {totalScore}
                        <span className="text-2xl text-muted-foreground">/{maxTotal}</span>
                      </div>
                      {broadcastState.round > 1 && (
                        <div className="mono text-xl mt-1 tracking-widest text-primary" style={{ textShadow: 'var(--green-glow)' }}>
                          R{broadcastState.round}: {roundScore}/40
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                );
              })}
          </div>
        )}

        {broadcastState.mode === 'podium' && sortedResults.slice(0, 4).length === 4 && (
          <motion.div
            className="mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col items-center gap-3 md:gap-4 w-full max-w-5xl mx-auto mb-4">
              {/* 1st Place */}
              <motion.div
                className="w-full md:w-2/3 bg-gradient-to-b from-primary/20 to-card border border-primary p-4 md:p-6 relative overflow-hidden"
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
                  <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-5">
                    {getRapperPngImage(sortedResults[0].rapper.name) && (
                      <img src={getRapperPngImage(sortedResults[0].rapper.name)!} alt={sortedResults[0].rapper.name} loading="lazy" className="w-32 h-32 object-cover rounded-full border-4 border-primary bg-primary/10 shadow-[0_0_20px_rgba(146,208,32,0.3)]" style={{ objectPosition: 'top' }} />
                    )}
                    <div className="flex flex-col md:text-left">
                      <div className="text-4xl font-bold mb-1">{sortedResults[0].rapper.name}</div>
                      <div className="text-lg text-muted-foreground tracking-wide">{sortedResults[0].team?.name}</div>
                    </div>
                  </div>
                  <motion.div
                    className="mono text-6xl font-bold text-primary"
                    style={{ textShadow: 'var(--green-glow)' }}
                    initial={{ scale: 0 }}
                    animate={revealedPositions.includes(0) ? { scale: [0, 1.5, 1] } : {}}
                    transition={{ delay: 0.5, duration: 0.6 }}
                  >
                    {sortedResults[0].cumulative}
                  </motion.div>
                </div>
              </motion.div>

              {/* 2nd and 3rd Place */}
              <div className="w-full flex flex-col md:flex-row gap-3 md:gap-4 justify-center">
                <motion.div
                  className="w-full md:w-1/2 bg-gradient-to-b from-secondary/10 to-card border p-3 md:p-4"
                  style={{ borderColor: '#f5f5f0', borderRadius: 'var(--bento-radius)', boxShadow: 'var(--bento-shadow)' }}
                  initial={{ scale: 0, x: -100 }}
                  animate={revealedPositions.includes(1) ? {
                    scale: [0, 1.1, 1],
                    x: [0, -10, 0],
                    filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)']
                  } : {}}
                  transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                >
                  <div className="text-center flex flex-row items-center justify-around">
                    <div>
                      <Medal className="w-10 h-10 mx-auto mb-1 text-secondary" />
                      <div className="mono text-4xl font-bold text-secondary" style={{ lineHeight: '1' }}>2</div>
                    </div>
                    <div className="flex items-center gap-3 text-left">
                      {getRapperPngImage(sortedResults[1].rapper.name) && (
                        <img src={getRapperPngImage(sortedResults[1].rapper.name)!} alt={sortedResults[1].rapper.name} loading="lazy" className="w-16 h-16 object-cover rounded-full border-2 border-secondary bg-secondary/10" style={{ objectPosition: 'top' }} />
                      )}
                      <div>
                        <div className="text-xl font-bold mb-1">{sortedResults[1].rapper.name}</div>
                        <div className="text-xs text-muted-foreground tracking-wide">{sortedResults[1].team?.name}</div>
                      </div>
                    </div>
                    <div className="mono text-3xl font-bold text-foreground">{sortedResults[1].cumulative}</div>
                  </div>
                </motion.div>

                <motion.div
                  className="w-full md:w-1/2 bg-gradient-to-b from-card to-card border p-3 md:p-4"
                  style={{ borderColor: '#5a7a2a', borderRadius: 'var(--bento-radius)', boxShadow: 'var(--bento-shadow)' }}
                  initial={{ scale: 0, x: 100 }}
                  animate={revealedPositions.includes(2) ? {
                    scale: [0, 1.1, 1],
                    x: [0, 10, 0],
                    filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)']
                  } : {}}
                  transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                >
                  <div className="text-center flex flex-row items-center justify-around">
                    <div>
                      <Award className="w-10 h-10 mx-auto mb-1" style={{ color: '#5a7a2a' }} />
                      <div className="mono text-4xl font-bold" style={{ color: '#5a7a2a', lineHeight: '1' }}>3</div>
                    </div>
                    <div className="flex items-center gap-3 text-left">
                      {getRapperPngImage(sortedResults[2].rapper.name) && (
                        <img src={getRapperPngImage(sortedResults[2].rapper.name)!} alt={sortedResults[2].rapper.name} loading="lazy" className="w-16 h-16 object-cover rounded-full border-2 border-[#5a7a2a] bg-card" style={{ objectPosition: 'top' }} />
                      )}
                      <div>
                        <div className="text-xl font-bold mb-1">{sortedResults[2].rapper.name}</div>
                        <div className="text-xs text-muted-foreground tracking-wide">{sortedResults[2].team?.name}</div>
                      </div>
                    </div>
                    <div className="mono text-3xl font-bold text-foreground">{sortedResults[2].cumulative}</div>
                  </div>
                </motion.div>
              </div>

              {/* 4th Place */}
              <motion.div
                className="w-full md:w-1/2 bg-gradient-to-b from-card to-card border p-3 md:p-4"
                style={{ borderColor: '#3a5a1a', borderRadius: 'var(--bento-radius)', boxShadow: 'var(--bento-shadow)' }}
                initial={{ scale: 0, y: 100 }}
                animate={revealedPositions.includes(3) ? {
                  scale: [0, 1.1, 1],
                  y: [0, -10, 0],
                  filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)']
                } : {}}
                transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              >
                <div className="text-center flex flex-row items-center justify-around">
                  <div>
                    <Award className="w-8 h-8 mx-auto mb-1" style={{ color: '#3a5a1a' }} />
                    <div className="mono text-3xl font-bold" style={{ color: '#3a5a1a', lineHeight: '1' }}>4</div>
                  </div>
                  <div className="flex items-center gap-3 text-left">
                    {getRapperPngImage(sortedResults[3].rapper.name) && (
                      <img src={getRapperPngImage(sortedResults[3].rapper.name)!} alt={sortedResults[3].rapper.name} loading="lazy" className="w-12 h-12 object-cover rounded-full border border-[#3a5a1a] bg-card" style={{ objectPosition: 'top' }} />
                    )}
                    <div>
                      <div className="text-lg mb-1">{sortedResults[3].rapper.name}</div>
                      <div className="text-xs text-muted-foreground tracking-wide">{sortedResults[3].team?.name}</div>
                    </div>
                  </div>
                  <div className="mono text-2xl font-bold text-foreground">{sortedResults[3].cumulative}</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
