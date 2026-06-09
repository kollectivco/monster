import { Rapper, Team, Judge, Score, BroadcastState } from '../types';
import { Check, X } from 'lucide-react';

interface JudgeProgressProps {
  rappers: Rapper[];
  teams: Team[];
  judges: Judge[];
  scores: Record<string, Score>;
  broadcastState?: BroadcastState;
}

export default function JudgeProgress({
  rappers,
  teams,
  judges,
  scores,
  broadcastState,
}: JudgeProgressProps) {
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

  const hasJudgeScored = (judgeId: string, rapperId: string, round: number): boolean => {
    const key = `${judgeId}-${rapperId}-${round}`;
    const score = scores[key];
    return score ? score.criteria.some(c => c > 0) : false;
  };

  const getTopFour = () => {
    const results = rappers.map(rapper => {
      const total = calculateRapperScore(rapper.id, 1) + calculateRapperScore(rapper.id, 2);
      return { rapper, total };
    });
    const sorted = results.sort((a, b) => b.total - a.total);
    const topFour = sorted.slice(0, 3).map(x => x.rapper);

    if (broadcastState?.wildcardRapperId) {
      const wildcard = results.find(r => r.rapper.id === broadcastState.wildcardRapperId);
      if (wildcard) {
        topFour.push(wildcard.rapper);
      }
    }

    return topFour;
  };

  const topFour = getTopFour();

  return (
    <div className="grid gap-6">
      <section>
        <h2 className="text-xl mb-5 text-primary">JUDGE PROGRESS</h2>
        <div className="grid gap-4">
          {judges.map(judge => (
            <div key={judge.id} className="border p-6" style={{ borderColor: 'var(--border-muted)', backgroundColor: 'var(--card)', borderRadius: 'var(--bento-radius)', boxShadow: 'var(--bento-shadow)' }}>
              <h3 className="text-lg mb-4">{judge.name}</h3>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map(round => {
                  const activeRappers = round === 3 ? topFour : rappers;
                  const scored = activeRappers.filter(r => hasJudgeScored(judge.id, r.id, round)).length;
                  const total = activeRappers.length;
                  const complete = scored === total;

                  return (
                    <div
                      key={round}
                      className={`border-2 rounded-xl p-4 transition-all ${complete ? '' : ''}`}
                      style={{
                        borderColor: complete ? 'var(--primary)' : 'var(--border-muted)',
                        backgroundColor: complete ? 'rgba(146, 208, 32, 0.15)' : 'var(--muted)',
                        boxShadow: complete ? 'var(--green-glow)' : 'none',
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground tracking-widest" style={{ fontSize: '0.65rem' }}>R{round}</span>
                        {complete ? (
                          <Check className="w-5 h-5 text-primary" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground opacity-50" />
                        )}
                      </div>
                      <div className="mono font-bold" style={{ fontSize: '1.1rem' }}>
                        {scored}/{total}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl mb-5 text-primary">ROUND TOTALS</h2>
        <div className="grid gap-4">
          {[...rappers]
            .map(rapper => {
              const team = teams.find(t => t.id === rapper.teamId);
              const r1 = calculateRapperScore(rapper.id, 1);
              const r2 = calculateRapperScore(rapper.id, 2);
              const r3 = calculateRapperScore(rapper.id, 3);
              const cumulative = r1 + r2 + r3;
              return { rapper, team, r1, r2, r3, cumulative };
            })
            .sort((a, b) => b.cumulative - a.cumulative)
            .map(({ rapper, team, r1, r2, r3, cumulative }) => {
            const isTopFour = topFour.some(t => t.id === rapper.id);

            const getJudgeScore = (judgeId: string, round: number): number => {
              const key = `${judgeId}-${rapper.id}-${round}`;
              const score = scores[key];
              if (!score) return 0;
              const raw = score.criteria.reduce((a, b) => a + (b ?? 0), 0);
              const deductions =
                (score.deductions.restart ? 1 : 0) +
                (score.deductions.preRecorded ? 2 : 0) +
                (score.deductions.technical ?? 0);
              return Math.max(0, raw - deductions);
            };

            return (
              <div
                key={rapper.id}
                className="border p-5"
                style={{
                  borderColor: isTopFour ? 'var(--primary)' : 'var(--border-muted)',
                  backgroundColor: 'var(--card)',
                  borderRadius: 'var(--bento-radius)',
                  boxShadow: isTopFour ? 'var(--green-glow), var(--bento-shadow)' : 'var(--bento-shadow)',
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="font-bold text-lg">{rapper.name}</div>
                    <div className="text-xs text-muted-foreground tracking-wide">{team?.name}</div>
                  </div>
                  <div className="mono text-2xl font-bold text-primary">
                    {cumulative}
                  </div>
                </div>

                <div className="grid gap-3 text-xs">
                  {[1, 2, 3].map(round => {
                    const total = round === 1 ? r1 : round === 2 ? r2 : r3;
                    if (total === 0) return null;

                    return (
                      <div key={round} className="rounded-xl p-3" style={{ backgroundColor: 'var(--muted)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-muted-foreground tracking-wider">Round {round}</span>
                          <span className="mono text-foreground font-bold">{total}/40</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {judges.map(judge => (
                            <div key={judge.id} className="text-center">
                              <div className="text-muted-foreground" style={{ fontSize: '0.65rem' }}>{judge.name.split(' ')[0]}</div>
                              <div className="mono text-foreground font-bold">{getJudgeScore(judge.id, round)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-xl mb-5 text-secondary">TOP 4 QUALIFIERS</h2>
        <div className="grid gap-3">
          {topFour.map((rapper, index) => {
            const team = teams.find(t => t.id === rapper.teamId);
            const cumulative = calculateRapperScore(rapper.id, 1) + calculateRapperScore(rapper.id, 2);
            return (
              <div
                key={rapper.id}
                className="border border-primary p-5 flex items-center justify-between"
                style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--bento-radius)', boxShadow: 'var(--green-glow), var(--bento-shadow)' }}
              >
                <div className="flex items-center gap-5">
                  <div className="mono text-3xl font-bold text-primary w-12">{index + 1}</div>
                  <div>
                    <div className="font-bold text-lg">{rapper.name}</div>
                    <div className="text-xs text-muted-foreground tracking-wide">{team?.name}</div>
                  </div>
                </div>
                <div className="mono text-2xl font-bold text-foreground">{cumulative}</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
