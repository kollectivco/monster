import { Rapper, Team, Judge, Score, BroadcastState } from '../types';
import { Tv, User, Trophy } from 'lucide-react';

interface BroadcastControlProps {
  rappers: Rapper[];
  teams: Team[];
  judges: Judge[];
  scores: Record<string, Score>;
  broadcastState: BroadcastState;
  onUpdateBroadcast: (updates: Partial<BroadcastState>) => void;
}

export default function BroadcastControl({
  rappers,
  teams,
  judges,
  scores,
  broadcastState,
  onUpdateBroadcast,
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
    return cumulativeScores
      .sort((a, b) => b.total - a.total)
      .slice(0, 4)
      .map(x => x.rapper);
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
        <h2 className="text-xl mb-2 text-primary flex items-center gap-2.5">
          <Tv className="w-5 h-5" />
          BROADCAST CONTROL
        </h2>
        <p className="text-xs text-muted-foreground mb-6" style={{ fontSize: '0.7rem' }}>
          Control what appears on the Stage Display screen
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <label className="text-xs text-muted-foreground mb-3 block tracking-widest" style={{ fontSize: '0.65rem' }}>ROUND</label>
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

          <div className="lg:col-span-2">
            <label className="text-xs text-muted-foreground mb-3 block tracking-widest" style={{ fontSize: '0.65rem' }}>DISPLAY MODE</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onUpdateBroadcast({ mode: 'now-performing' })}
                className={`py-3.5 px-3 rounded-xl transition-all text-xs ${
                  broadcastState.mode === 'now-performing'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground border-2'
                }`}
                style={{
                  borderColor: broadcastState.mode === 'now-performing' ? 'transparent' : 'var(--border-muted)',
                  boxShadow: broadcastState.mode === 'now-performing' ? 'var(--green-glow)' : 'none',
                  backgroundColor: broadcastState.mode === 'now-performing' ? undefined : 'var(--muted)',
                }}
              >
                <User className="w-4 h-4 mx-auto mb-1.5" />
                NOW PERFORMING
              </button>
              <button
                onClick={() => onUpdateBroadcast({ mode: 'round-standings' })}
                className={`py-3.5 px-3 rounded-xl transition-all text-xs ${
                  broadcastState.mode === 'round-standings'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground border-2'
                }`}
                style={{
                  borderColor: broadcastState.mode === 'round-standings' ? 'transparent' : 'var(--border-muted)',
                  boxShadow: broadcastState.mode === 'round-standings' ? 'var(--green-glow)' : 'none',
                  backgroundColor: broadcastState.mode === 'round-standings' ? undefined : 'var(--muted)',
                }}
              >
                STANDINGS
              </button>
              <button
                onClick={() => onUpdateBroadcast({ mode: 'podium' })}
                className={`py-3.5 px-3 rounded-xl transition-all text-xs ${
                  broadcastState.mode === 'podium'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground border-2'
                }`}
                style={{
                  borderColor: broadcastState.mode === 'podium' ? 'transparent' : 'var(--border-muted)',
                  boxShadow: broadcastState.mode === 'podium' ? 'var(--green-glow)' : 'none',
                  backgroundColor: broadcastState.mode === 'podium' ? undefined : 'var(--muted)',
                }}
              >
                <Trophy className="w-4 h-4 mx-auto mb-1.5" />
                PODIUM
              </button>
            </div>
          </div>
        </div>

        {broadcastState.mode === 'now-performing' && (
          <div className="grid gap-4 mt-6">
            <div>
              <label className="text-xs text-muted-foreground mb-3 block tracking-widest" style={{ fontSize: '0.65rem' }}>NOW PERFORMING</label>
              <select
                value={broadcastState.currentRapperId || ''}
                onChange={e => onUpdateBroadcast({ currentRapperId: e.target.value || null })}
                className="w-full border-2 rounded-xl px-5 py-3.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                style={{ borderColor: 'var(--border-muted)', backgroundColor: 'var(--muted)' }}
              >
                <option value="">— Select Rapper —</option>
                {currentLineup.map(rapper => {
                  const team = teams.find(t => t.id === rapper.teamId);
                  return (
                    <option key={rapper.id} value={rapper.id}>
                      {rapper.name} ({team?.name})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-3 block tracking-widest" style={{ fontSize: '0.65rem' }}>NEXT UP (OPTIONAL)</label>
              <select
                value={broadcastState.nextRapperId || ''}
                onChange={e => onUpdateBroadcast({ nextRapperId: e.target.value || null })}
                className="w-full border-2 rounded-xl px-5 py-3.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                style={{ borderColor: 'var(--border-muted)', backgroundColor: 'var(--muted)' }}
              >
                <option value="">— None —</option>
                {currentLineup.map(rapper => {
                  const team = teams.find(t => t.id === rapper.teamId);
                  return (
                    <option key={rapper.id} value={rapper.id}>
                      {rapper.name} ({team?.name})
                    </option>
                  );
                })}
              </select>
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
