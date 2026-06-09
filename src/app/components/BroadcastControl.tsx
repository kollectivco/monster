import { Rapper, Team, Judge, Score, BroadcastState } from '../types';
import { Tv, User, Trophy } from 'lucide-react';

interface BroadcastControlProps {
  rappers: Rapper[];
  teams: Team[];
  judges: Judge[];
  scores: Record<string, Score>;
  broadcastState: BroadcastState;
  onUpdateBroadcast: (updates: Partial<BroadcastState>) => void;
  onUpdateScore?: (judgeId: string, rapperId: string, round: number, updates: any) => void;
}

export default function BroadcastControl({
  rappers,
  teams,
  judges,
  scores,
  broadcastState,
  onUpdateBroadcast,
  onUpdateScore,
}: BroadcastControlProps) {
  const calculateRapperScore = (rapperId: string, targetRound: number): number => {
    let total = 0;
    judges.forEach(judge => {
      const key = `${judge.id}-${rapperId}-${targetRound}`;
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

  const getTopFour = () => {
    const cumulativeScores = rappers.map(rapper => {
      const r1 = calculateRapperScore(rapper.id, 1);
      const r2 = calculateRapperScore(rapper.id, 2);
      return { rapper, total: r1 + r2 };
    });
    
    const sorted = cumulativeScores.sort((a, b) => b.total - a.total);
    const top3 = sorted.slice(0, 3).map(x => x.rapper);
    
    if (broadcastState.wildcardRapperId) {
      const wildcard = rappers.find(r => r.id === broadcastState.wildcardRapperId);
      if (wildcard) {
        top3.push(wildcard);
      }
    }
    
    return top3;
  };

  const getRoundLineup = (round: number): Rapper[] => {
    if (round === 3) {
      return getTopFour();
    }
    return rappers;
  };

  const currentLineup = getRoundLineup(broadcastState.round);

  return (
    <div className="grid gap-6">
      <div className="border p-6" style={{ borderRadius: 'var(--bento-radius)', borderColor: 'var(--border-muted)', backgroundColor: 'var(--card)', boxShadow: 'var(--bento-shadow)' }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Tv className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-primary tracking-wider">BROADCAST CONTROL</h2>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-6" style={{ fontSize: '0.7rem' }}>
          Control what appears on the Stage Display screen
        </p>

        <div className="mb-6">
          <label className="text-xs text-muted-foreground mb-3 block tracking-widest" style={{ fontSize: '0.65rem' }}>GENERAL VISUALS</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => onUpdateBroadcast({ mode: 'intro-logos' })}
              className={`py-2.5 px-2 rounded-xl transition-all text-[10px] sm:text-xs flex flex-col items-center justify-center gap-1 ${broadcastState.mode === 'intro-logos' ? 'bg-primary text-primary-foreground' : 'text-foreground border-2 hover:border-primary/50'}`}
              style={{ borderColor: broadcastState.mode === 'intro-logos' ? 'transparent' : 'var(--border-muted)', boxShadow: broadcastState.mode === 'intro-logos' ? 'var(--green-glow)' : 'none', backgroundColor: broadcastState.mode === 'intro-logos' ? undefined : 'var(--card)' }}
            ><span className="text-center leading-tight font-bold">Logos Intro</span></button>
            <button
              onClick={() => onUpdateBroadcast({ mode: 'countdown-timer' })}
              className={`py-2.5 px-2 rounded-xl transition-all text-[10px] sm:text-xs flex flex-col items-center justify-center gap-1 ${broadcastState.mode === 'countdown-timer' ? 'bg-primary text-primary-foreground' : 'text-foreground border-2 hover:border-primary/50'}`}
              style={{ borderColor: broadcastState.mode === 'countdown-timer' ? 'transparent' : 'var(--border-muted)', boxShadow: broadcastState.mode === 'countdown-timer' ? 'var(--green-glow)' : 'none', backgroundColor: broadcastState.mode === 'countdown-timer' ? undefined : 'var(--card)' }}
            ><span className="text-center leading-tight font-bold">Countdown</span></button>
            <button
              onClick={() => onUpdateBroadcast({ mode: 'warning-screen' })}
              className={`py-2.5 px-2 rounded-xl transition-all text-[10px] sm:text-xs flex flex-col items-center justify-center gap-1 ${broadcastState.mode === 'warning-screen' ? 'bg-primary text-primary-foreground' : 'text-foreground border-2 hover:border-primary/50'}`}
              style={{ borderColor: broadcastState.mode === 'warning-screen' ? 'transparent' : 'var(--border-muted)', boxShadow: broadcastState.mode === 'warning-screen' ? 'var(--green-glow)' : 'none', backgroundColor: broadcastState.mode === 'warning-screen' ? undefined : 'var(--card)' }}
            ><span className="text-center leading-tight font-bold">Warning Screen</span></button>
            <button
              onClick={() => onUpdateBroadcast({ mode: 'judge-zaza' })}
              className={`py-2.5 px-2 rounded-xl transition-all text-[10px] sm:text-xs flex flex-col items-center justify-center gap-1 ${broadcastState.mode === 'judge-zaza' ? 'bg-primary text-primary-foreground' : 'text-foreground border-2 hover:border-primary/50'}`}
              style={{ borderColor: broadcastState.mode === 'judge-zaza' ? 'transparent' : 'var(--border-muted)', boxShadow: broadcastState.mode === 'judge-zaza' ? 'var(--green-glow)' : 'none', backgroundColor: broadcastState.mode === 'judge-zaza' ? undefined : 'var(--card)' }}
            ><span className="text-center leading-tight font-bold">Judge: ZAZA</span></button>
            <button
              onClick={() => onUpdateBroadcast({ mode: 'judge-shahyn' })}
              className={`py-2.5 px-2 rounded-xl transition-all text-[10px] sm:text-xs flex flex-col items-center justify-center gap-1 ${broadcastState.mode === 'judge-shahyn' ? 'bg-primary text-primary-foreground' : 'text-foreground border-2 hover:border-primary/50'}`}
              style={{ borderColor: broadcastState.mode === 'judge-shahyn' ? 'transparent' : 'var(--border-muted)', boxShadow: broadcastState.mode === 'judge-shahyn' ? 'var(--green-glow)' : 'none', backgroundColor: broadcastState.mode === 'judge-shahyn' ? undefined : 'var(--card)' }}
            ><span className="text-center leading-tight font-bold">Judge: SHAHYN</span></button>
            <button
              onClick={() => onUpdateBroadcast({ mode: 'judge-alyloka' })}
              className={`py-2.5 px-2 rounded-xl transition-all text-[10px] sm:text-xs flex flex-col items-center justify-center gap-1 ${broadcastState.mode === 'judge-alyloka' ? 'bg-primary text-primary-foreground' : 'text-foreground border-2 hover:border-primary/50'}`}
              style={{ borderColor: broadcastState.mode === 'judge-alyloka' ? 'transparent' : 'var(--border-muted)', boxShadow: broadcastState.mode === 'judge-alyloka' ? 'var(--green-glow)' : 'none', backgroundColor: broadcastState.mode === 'judge-alyloka' ? undefined : 'var(--card)' }}
            ><span className="text-center leading-tight font-bold">Judge: ALY LOKA</span></button>
            <button
              onClick={() => onUpdateBroadcast({ mode: 'judge-shehab' })}
              className={`py-2.5 px-2 rounded-xl transition-all text-[10px] sm:text-xs flex flex-col items-center justify-center gap-1 ${broadcastState.mode === 'judge-shehab' ? 'bg-primary text-primary-foreground' : 'text-foreground border-2 hover:border-primary/50'}`}
              style={{ borderColor: broadcastState.mode === 'judge-shehab' ? 'transparent' : 'var(--border-muted)', boxShadow: broadcastState.mode === 'judge-shehab' ? 'var(--green-glow)' : 'none', backgroundColor: broadcastState.mode === 'judge-shehab' ? undefined : 'var(--card)' }}
            ><span className="text-center leading-tight font-bold">Judge: SHEHAB</span></button>
          </div>
          {broadcastState.mode === 'countdown-timer' && (
            <div className="mt-3 flex gap-2 items-center">
              <input 
                type="number" 
                placeholder="Minutes"
                className="w-24 border-2 rounded-lg px-3 py-1.5 text-sm"
                style={{ borderColor: 'var(--border-muted)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}
                onChange={(e) => onUpdateBroadcast({ mode: 'countdown-timer', timerSeconds: Number(e.target.value) * 60 })}
                value={broadcastState.timerSeconds ? Math.floor(broadcastState.timerSeconds / 60) : ''}
              />
              <span className="text-sm text-muted-foreground">Min Timer</span>
            </div>
          )}
        </div>

        <div className="mb-6">
          <label className="text-xs text-muted-foreground mb-3 block tracking-widest" style={{ fontSize: '0.65rem' }}>ACTIVE ROUND</label>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map(round => (
              <button
                key={round}
                onClick={() => onUpdateBroadcast({ round: round as 1 | 2 | 3 })}
                className={`py-3.5 rounded-xl transition-all font-bold ${
                  broadcastState.round === round
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground border-2'
                }`}
                style={{
                  borderColor: broadcastState.round === round ? 'transparent' : 'var(--border-muted)',
                  boxShadow: broadcastState.round === round ? 'var(--green-glow)' : 'none',
                }}
              >
                R{round}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="text-xs text-muted-foreground mb-3 block tracking-widest" style={{ fontSize: '0.65rem' }}>ROUND SPECIFIC VISUALS</label>
          
          {broadcastState.round === 1 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button onClick={() => onUpdateBroadcast({ mode: 'round-1-intro' })} className={`py-2.5 px-2 rounded-xl transition-all text-[10px] sm:text-xs flex flex-col items-center justify-center gap-1 ${broadcastState.mode === 'round-1-intro' ? 'bg-primary text-primary-foreground' : 'text-foreground border-2'} border-muted`} style={{ backgroundColor: broadcastState.mode === 'round-1-intro' ? undefined : 'var(--card)' }}><span className="font-bold">R1 Intro Text</span></button>
              <button onClick={() => onUpdateBroadcast({ mode: 'now-performing', currentRapperId: null, nextRapperId: null })} className={`py-2.5 px-2 rounded-xl transition-all text-[10px] sm:text-xs flex flex-col items-center justify-center gap-1 ${broadcastState.mode === 'now-performing' ? 'bg-primary text-primary-foreground' : 'text-foreground border-2'} border-muted`} style={{ backgroundColor: broadcastState.mode === 'now-performing' ? undefined : 'var(--card)' }}><span className="font-bold">Scoreboard</span></button>
              <button onClick={() => onUpdateBroadcast({ mode: 'minute-timer' })} className={`py-2.5 px-2 rounded-xl transition-all text-[10px] sm:text-xs flex flex-col items-center justify-center gap-1 ${broadcastState.mode === 'minute-timer' ? 'bg-primary text-primary-foreground' : 'text-foreground border-2'} border-muted`} style={{ backgroundColor: broadcastState.mode === 'minute-timer' ? undefined : 'var(--card)' }}><span className="font-bold">1 Min Timer</span></button>
              <button onClick={() => onUpdateBroadcast({ mode: 'round-standings' })} className={`py-2.5 px-2 rounded-xl transition-all text-[10px] sm:text-xs flex flex-col items-center justify-center gap-1 ${broadcastState.mode === 'round-standings' ? 'bg-primary text-primary-foreground' : 'text-foreground border-2'} border-muted`} style={{ backgroundColor: broadcastState.mode === 'round-standings' ? undefined : 'var(--card)' }}><span className="font-bold">Standings</span></button>
            </div>
          )}

          {broadcastState.round === 2 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button onClick={() => onUpdateBroadcast({ mode: 'round-2-intro' })} className={`py-2.5 px-2 rounded-xl transition-all text-[10px] sm:text-xs flex flex-col items-center justify-center gap-1 ${broadcastState.mode === 'round-2-intro' ? 'bg-primary text-primary-foreground' : 'text-foreground border-2'} border-muted`} style={{ backgroundColor: broadcastState.mode === 'round-2-intro' ? undefined : 'var(--card)' }}><span className="font-bold">R2 Intro Text</span></button>
              <button onClick={() => onUpdateBroadcast({ mode: 'now-performing', currentRapperId: null, nextRapperId: null })} className={`py-2.5 px-2 rounded-xl transition-all text-[10px] sm:text-xs flex flex-col items-center justify-center gap-1 ${broadcastState.mode === 'now-performing' ? 'bg-primary text-primary-foreground' : 'text-foreground border-2'} border-muted`} style={{ backgroundColor: broadcastState.mode === 'now-performing' ? undefined : 'var(--card)' }}><span className="font-bold">Scoreboard</span></button>
              <button onClick={() => onUpdateBroadcast({ mode: 'wild-card', currentRapperId: null, nextRapperId: null })} className={`py-2.5 px-2 rounded-xl transition-all text-[10px] sm:text-xs flex flex-col items-center justify-center gap-1 ${broadcastState.mode === 'wild-card' ? 'bg-primary text-primary-foreground' : 'text-foreground border-2'} border-muted`} style={{ backgroundColor: broadcastState.mode === 'wild-card' ? undefined : 'var(--card)' }}><span className="font-bold">Wild Card</span></button>
              <button onClick={() => onUpdateBroadcast({ mode: 'top-4-visual' })} className={`py-2.5 px-2 rounded-xl transition-all text-[10px] sm:text-xs flex flex-col items-center justify-center gap-1 ${broadcastState.mode === 'top-4-visual' ? 'bg-primary text-primary-foreground' : 'text-foreground border-2'} border-muted`} style={{ backgroundColor: broadcastState.mode === 'top-4-visual' ? undefined : 'var(--card)' }}><span className="font-bold">Top 4 Finalists</span></button>
              <button onClick={() => onUpdateBroadcast({ mode: 'round-standings' })} className={`py-2.5 px-2 rounded-xl transition-all text-[10px] sm:text-xs flex flex-col items-center justify-center gap-1 ${broadcastState.mode === 'round-standings' ? 'bg-primary text-primary-foreground' : 'text-foreground border-2'} border-muted`} style={{ backgroundColor: broadcastState.mode === 'round-standings' ? undefined : 'var(--card)' }}><span className="font-bold">Standings</span></button>
            </div>
          )}

          {broadcastState.round === 3 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button onClick={() => onUpdateBroadcast({ mode: 'round-3-intro' })} className={`py-2.5 px-2 rounded-xl transition-all text-[10px] sm:text-xs flex flex-col items-center justify-center gap-1 ${broadcastState.mode === 'round-3-intro' ? 'bg-primary text-primary-foreground' : 'text-foreground border-2'} border-muted`} style={{ backgroundColor: broadcastState.mode === 'round-3-intro' ? undefined : 'var(--card)' }}><span className="font-bold">R3 Intro Text</span></button>
              <button onClick={() => onUpdateBroadcast({ mode: 'now-performing', currentRapperId: null, nextRapperId: null })} className={`py-2.5 px-2 rounded-xl transition-all text-[10px] sm:text-xs flex flex-col items-center justify-center gap-1 ${broadcastState.mode === 'now-performing' ? 'bg-primary text-primary-foreground' : 'text-foreground border-2'} border-muted`} style={{ backgroundColor: broadcastState.mode === 'now-performing' ? undefined : 'var(--card)' }}><span className="font-bold">Performance</span></button>
              <button onClick={() => onUpdateBroadcast({ mode: 'final-scoring-grid' })} className={`py-2.5 px-2 rounded-xl transition-all text-[10px] sm:text-xs flex flex-col items-center justify-center gap-1 ${broadcastState.mode === 'final-scoring-grid' ? 'bg-primary text-primary-foreground' : 'text-foreground border-2'} border-muted`} style={{ backgroundColor: broadcastState.mode === 'final-scoring-grid' ? undefined : 'var(--card)' }}><span className="font-bold">Final Scores</span></button>
              <button onClick={() => onUpdateBroadcast({ mode: 'winner-graphic' })} className={`py-2.5 px-2 rounded-xl transition-all text-[10px] sm:text-xs flex flex-col items-center justify-center gap-1 ${broadcastState.mode === 'winner-graphic' ? 'bg-primary text-primary-foreground' : 'text-foreground border-2'} border-muted`} style={{ backgroundColor: broadcastState.mode === 'winner-graphic' ? undefined : 'var(--card)' }}><span className="font-bold">Winner Crown</span></button>
              <button onClick={() => onUpdateBroadcast({ mode: 'podium' })} className={`py-2.5 px-2 rounded-xl transition-all text-[10px] sm:text-xs flex flex-col items-center justify-center gap-1 ${broadcastState.mode === 'podium' ? 'bg-primary text-primary-foreground' : 'text-foreground border-2'} border-muted`} style={{ backgroundColor: broadcastState.mode === 'podium' ? undefined : 'var(--card)' }}><span className="font-bold">Podium (Top 4)</span></button>
            </div>
          )}
        </div>

        {broadcastState.mode === 'now-performing' && (
          <div className="grid gap-4 mt-6">
            <div>
              <label className="text-xs text-muted-foreground mb-3 block tracking-widest" style={{ fontSize: '0.65rem' }}>NOW PERFORMING</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button
                  onClick={() => onUpdateBroadcast({ currentRapperId: null })}
                  className={`py-2 px-2 rounded-xl border-2 text-xs flex flex-col items-center justify-center transition-all ${!broadcastState.currentRapperId ? 'border-primary bg-primary/10 text-primary' : 'border-transparent bg-muted text-muted-foreground hover:bg-muted/80'}`}
                >
                  — None —
                </button>
                {currentLineup.map(rapper => {
                  const team = teams.find(t => t.id === rapper.teamId);
                  const isActive = broadcastState.currentRapperId === rapper.id;
                  return (
                    <button
                      key={rapper.id}
                      onClick={() => onUpdateBroadcast({ currentRapperId: rapper.id })}
                      className={`py-2 px-2 rounded-xl border-2 text-xs flex flex-col items-center justify-center text-center transition-all ${isActive ? 'border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(146,208,32,0.3)]' : 'border-transparent bg-muted text-foreground hover:bg-muted/80'}`}
                    >
                      <span className="font-bold mb-0.5">{rapper.name}</span>
                      <span className="text-[9px] opacity-70">{team?.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-3 block tracking-widest" style={{ fontSize: '0.65rem' }}>NEXT UP (OPTIONAL)</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button
                  onClick={() => onUpdateBroadcast({ nextRapperId: null })}
                  className={`py-2 px-2 rounded-xl border-2 text-xs flex flex-col items-center justify-center transition-all ${!broadcastState.nextRapperId ? 'border-primary bg-primary/10 text-primary' : 'border-transparent bg-muted text-muted-foreground hover:bg-muted/80'}`}
                >
                  — None —
                </button>
                {currentLineup.map(rapper => {
                  const team = teams.find(t => t.id === rapper.teamId);
                  const isActive = broadcastState.nextRapperId === rapper.id;
                  return (
                    <button
                      key={rapper.id}
                      onClick={() => onUpdateBroadcast({ nextRapperId: rapper.id })}
                      className={`py-2 px-2 rounded-xl border-2 text-xs flex flex-col items-center justify-center text-center transition-all ${isActive ? 'border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(146,208,32,0.3)]' : 'border-transparent bg-muted text-foreground hover:bg-muted/80'}`}
                    >
                      <span className="font-bold mb-0.5">{rapper.name}</span>
                      <span className="text-[9px] opacity-70">{team?.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border-2 transition-all hover:bg-muted/50" style={{ borderColor: 'var(--border-muted)' }}>
                <input
                  type="checkbox"
                  checked={broadcastState.showScore}
                  onChange={e => onUpdateBroadcast({ showScore: e.target.checked })}
                  className="w-5 h-5 rounded border-border-muted bg-card accent-primary"
                />
                <span className="text-sm text-foreground">Show current round score</span>
              </label>
            </div>
          </div>
        )}

        {/* The Wild Card reveal control was removed; the permanent selection now drives it */}

        <div className="mt-8 pt-8 border-t" style={{ borderColor: 'var(--border-muted)' }}>
          <label className="text-xs text-muted-foreground mb-3 block tracking-widest" style={{ fontSize: '0.65rem' }}>SELECT WILD CARD (4th finalist → advances to R3)</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button
              onClick={() => onUpdateBroadcast({ wildcardRapperId: null })}
              className={`py-2 px-2 rounded-xl border-2 text-xs flex flex-col items-center justify-center transition-all ${!broadcastState.wildcardRapperId ? 'border-primary bg-primary/10 text-primary' : 'border-transparent bg-muted text-muted-foreground hover:bg-muted/80'}`}
            >
              — Unselected —
            </button>
            {rappers.filter(r => {
              // Exclude the top 3 auto qualifiers
              const cumulativeScores = rappers.map(rap => ({ rap, total: calculateRapperScore(rap.id, 1) + calculateRapperScore(rap.id, 2) }));
              const top3Ids = cumulativeScores.sort((a, b) => b.total - a.total).slice(0, 3).map(x => x.rap.id);
              return !top3Ids.includes(r.id);
            }).map(rapper => {
              const team = teams.find(t => t.id === rapper.teamId);
              const isActive = broadcastState.wildcardRapperId === rapper.id;
              return (
                <button
                  key={rapper.id}
                  onClick={() => onUpdateBroadcast({ wildcardRapperId: rapper.id })}
                  className={`py-2 px-2 rounded-xl border-2 text-xs flex flex-col items-center justify-center text-center transition-all ${isActive ? 'border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(146,208,32,0.3)]' : 'border-transparent bg-muted text-foreground hover:bg-muted/80'}`}
                >
                  <span className="font-bold mb-0.5">{rapper.name}</span>
                  <span className="text-[9px] opacity-70">{team?.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="border p-6" style={{ borderRadius: 'var(--bento-radius)', borderColor: 'var(--border-muted)', backgroundColor: 'var(--card)', boxShadow: 'var(--bento-shadow)' }}>
        <h3 className="text-sm text-secondary mb-4 tracking-wider">ROUND {broadcastState.round} LINEUP</h3>
        <div className="space-y-2">
          {currentLineup.map(rapper => {
            const team = teams.find(t => t.id === rapper.teamId);
            const isCurrent = broadcastState.currentRapperId === rapper.id;
            const isNext = broadcastState.nextRapperId === rapper.id;
            return (
              <div
                key={rapper.id}
                className={`flex items-center justify-between py-3 px-4 rounded-xl border-2 ${
                  isCurrent ? 'border-primary' : 'border-transparent'
                }`}
                style={{
                  backgroundColor: isCurrent ? 'rgba(146, 208, 32, 0.15)' : isNext ? 'var(--muted)' : 'transparent',
                  boxShadow: isCurrent ? 'var(--green-glow)' : 'none',
                }}
              >
                <div>
                  <div className="text-sm font-bold">{rapper.name}</div>
                  <div className="text-xs text-muted-foreground tracking-wide">{team?.name}</div>
                </div>
                {isCurrent && <span className="text-xs text-primary font-bold px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}>NOW</span>}
                {isNext && <span className="text-xs text-muted-foreground font-bold px-3 py-1 rounded-full border-2" style={{ borderColor: 'var(--border-muted)' }}>NEXT</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
