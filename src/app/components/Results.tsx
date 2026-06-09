import { useState } from 'react';
import { Download, AlertTriangle, Trophy, Medal, Award } from 'lucide-react';
import { Rapper, Team, Judge, Score, BroadcastState } from '../types';

interface ResultsProps {
  rappers: Rapper[];
  teams: Team[];
  judges: Judge[];
  scores: Record<string, Score>;
  broadcastState?: BroadcastState;
}

interface RapperResult {
  rapper: Rapper;
  team?: Team;
  round1: number;
  round2: number;
  round3: number;
  cumulative: number;
}

export default function Results({
  rappers,
  teams,
  judges,
  scores,
  broadcastState,
}: ResultsProps) {
  const [selectedRound, setSelectedRound] = useState<'all' | 1 | 2 | 3>('all');

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

  let topFourAfterR2 = [...results]
    .sort((a, b) => b.round1 + b.round2 - (a.round1 + a.round2))
    .slice(0, 3);

  if (broadcastState?.wildcardRapperId) {
    const wildcard = results.find(r => r.rapper.id === broadcastState.wildcardRapperId);
    if (wildcard) {
      topFourAfterR2.push(wildcard);
    }
  }

  const checkTie = (results: RapperResult[], position: number): boolean => {
    if (position >= results.length) return false;
    const current = results[position];
    const next = results[position + 1];
    return next && current.cumulative === next.cumulative;
  };

  const hasR2QualifyingTie = () => {
    const sorted = [...results].sort((a, b) => b.round1 + b.round2 - (a.round1 + a.round2));
    if (sorted.length < 5) return false;
    return sorted[3].round1 + sorted[3].round2 === sorted[4].round1 + sorted[4].round2;
  };

  const exportResults = () => {
    let text = 'BEAST BEATS — JUDGES SCORING\n\n';

    text += 'ROUND 1: FREESTYLE ON A COMMON BEAT\n';
    results.forEach(r => {
      text += `${r.rapper.name} (${r.team?.name}): ${r.round1}/40\n`;
    });

    text += '\nROUND 2: INDIVIDUAL TRACK PERFORMANCE\n';
    results.forEach(r => {
      text += `${r.rapper.name} (${r.team?.name}): ${r.round2}/40\n`;
    });

    text += '\nROUND 3: FINAL SHOWDOWN (Top 4)\n';
    topFourAfterR2.forEach(r => {
      text += `${r.rapper.name} (${r.team?.name}): ${r.round3}/40\n`;
    });

    text += '\nFINAL STANDINGS\n';
    sortedResults.forEach((r, i) => {
      text += `${i + 1}. ${r.rapper.name} (${r.team?.name}): ${r.cumulative} total\n`;
    });

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'beast-beats-results.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-6">
      {hasR2QualifyingTie() && (
        <div className="bg-destructive/10 border-2 border-destructive p-5 flex items-start gap-4" style={{ borderRadius: 'var(--bento-radius)' }}>
          <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-destructive tracking-wide">TIE DETECTED</p>
            <p className="text-sm text-foreground mt-1.5">
              30-second tiebreaker needed for Round 3 qualification
            </p>
          </div>
        </div>
      )}

      {checkTie(sortedResults, 0) && (
        <div className="bg-destructive/10 border-2 border-destructive p-5 flex items-start gap-4" style={{ borderRadius: 'var(--bento-radius)' }}>
          <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-destructive tracking-wide">1ST PLACE TIE</p>
            <p className="text-sm text-foreground mt-1.5">
              30-second tiebreaker needed for final placement
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedRound('all')}
          className={`px-6 py-3 rounded-full whitespace-nowrap transition-all font-bold ${
            selectedRound === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'text-foreground border-2'
          }`}
          style={{
            borderColor: selectedRound === 'all' ? 'transparent' : 'var(--border-muted)',
            boxShadow: selectedRound === 'all' ? 'var(--green-glow)' : 'none',
            backgroundColor: selectedRound === 'all' ? undefined : 'var(--muted)',
          }}
        >
          CUMULATIVE
        </button>
        <button
          onClick={() => setSelectedRound(1)}
          className={`px-6 py-3 rounded-full whitespace-nowrap transition-all font-bold ${
            selectedRound === 1
              ? 'bg-primary text-primary-foreground'
              : 'text-foreground border-2'
          }`}
          style={{
            borderColor: selectedRound === 1 ? 'transparent' : 'var(--border-muted)',
            boxShadow: selectedRound === 1 ? 'var(--green-glow)' : 'none',
            backgroundColor: selectedRound === 1 ? undefined : 'var(--muted)',
          }}
        >
          ROUND 1
        </button>
        <button
          onClick={() => setSelectedRound(2)}
          className={`px-6 py-3 rounded-full whitespace-nowrap transition-all font-bold ${
            selectedRound === 2
              ? 'bg-primary text-primary-foreground'
              : 'text-foreground border-2'
          }`}
          style={{
            borderColor: selectedRound === 2 ? 'transparent' : 'var(--border-muted)',
            boxShadow: selectedRound === 2 ? 'var(--green-glow)' : 'none',
            backgroundColor: selectedRound === 2 ? undefined : 'var(--muted)',
          }}
        >
          ROUND 2
        </button>
        <button
          onClick={() => setSelectedRound(3)}
          className={`px-6 py-3 rounded-full whitespace-nowrap transition-all font-bold ${
            selectedRound === 3
              ? 'bg-primary text-primary-foreground'
              : 'text-foreground border-2'
          }`}
          style={{
            borderColor: selectedRound === 3 ? 'transparent' : 'var(--border-muted)',
            boxShadow: selectedRound === 3 ? 'var(--green-glow)' : 'none',
            backgroundColor: selectedRound === 3 ? undefined : 'var(--muted)',
          }}
        >
          ROUND 3
        </button>
      </div>

      {selectedRound === 'all' && (
        <div>
          <h2 className="text-xl mb-5 text-primary">FINAL STANDINGS</h2>

          {sortedResults.slice(0, 4).length === 4 && (
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div
                  className="bg-gradient-to-b from-primary/20 to-card border border-primary p-8"
                  style={{ boxShadow: 'var(--green-glow-strong), var(--bento-shadow)', borderRadius: 'var(--bento-radius)' }}
                >
                  <div className="text-center">
                    <Trophy className="w-16 h-16 mx-auto mb-3 text-primary" style={{ filter: 'drop-shadow(var(--green-glow))' }} />
                    <div className="mono font-bold text-primary mb-2" style={{ textShadow: 'var(--green-glow)', fontSize: '4rem', lineHeight: '1' }}>1</div>
                    <div className="font-bold text-2xl mb-2">{sortedResults[0].rapper.name}</div>
                    <div className="text-xs text-muted-foreground mb-3 tracking-wide">{sortedResults[0].team?.name}</div>
                    <div className="mono text-4xl font-bold text-primary" style={{ textShadow: 'var(--green-glow)' }}>{sortedResults[0].cumulative}</div>
                  </div>
                </div>

                <div
                  className="bg-gradient-to-b from-secondary/10 to-card border p-8"
                  style={{ borderColor: '#f5f5f0', borderRadius: 'var(--bento-radius)', boxShadow: 'var(--bento-shadow)' }}
                >
                  <div className="text-center">
                    <Medal className="w-14 h-14 mx-auto mb-3 text-secondary" />
                    <div className="mono text-5xl font-bold text-secondary mb-2" style={{ lineHeight: '1' }}>2</div>
                    <div className="font-bold text-xl mb-2">{sortedResults[1].rapper.name}</div>
                    <div className="text-xs text-muted-foreground mb-3 tracking-wide">{sortedResults[1].team?.name}</div>
                    <div className="mono text-3xl font-bold text-foreground">{sortedResults[1].cumulative}</div>
                  </div>
                </div>

                <div
                  className="bg-gradient-to-b from-card to-card border p-6"
                  style={{ borderColor: '#5a7a2a', borderRadius: 'var(--bento-radius)', boxShadow: 'var(--bento-shadow)' }}
                >
                  <div className="text-center">
                    <Award className="w-12 h-12 mx-auto mb-3" style={{ color: '#5a7a2a' }} />
                    <div className="mono text-4xl font-bold mb-2" style={{ color: '#5a7a2a', lineHeight: '1' }}>3</div>
                    <div className="font-bold text-lg mb-2">{sortedResults[2].rapper.name}</div>
                    <div className="text-xs text-muted-foreground mb-3 tracking-wide">{sortedResults[2].team?.name}</div>
                    <div className="mono text-2xl font-bold text-foreground">{sortedResults[2].cumulative}</div>
                  </div>
                </div>

                <div
                  className="bg-gradient-to-b from-card to-card border p-6"
                  style={{ borderColor: '#3a5a1a', borderRadius: 'var(--bento-radius)', boxShadow: 'var(--bento-shadow)' }}
                >
                  <div className="text-center">
                    <Award className="w-11 h-11 mx-auto mb-3" style={{ color: '#3a5a1a' }} />
                    <div className="mono text-4xl font-bold mb-2" style={{ color: '#3a5a1a', lineHeight: '1' }}>4</div>
                    <div className="font-bold text-lg mb-2">{sortedResults[3].rapper.name}</div>
                    <div className="text-xs text-muted-foreground mb-3 tracking-wide">{sortedResults[3].team?.name}</div>
                    <div className="mono text-2xl font-bold text-foreground">{sortedResults[3].cumulative}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-3">
            {sortedResults.map((result, index) => (
              <div
                key={result.rapper.id}
                className={`border p-5 flex items-center justify-between`}
                style={{
                  borderColor: index < 4 ? 'var(--primary)' : 'var(--border-muted)',
                  boxShadow: index === 0 ? 'var(--green-glow), var(--bento-shadow)' : index < 4 ? 'var(--bento-shadow)' : 'var(--bento-shadow)',
                  backgroundColor: 'var(--card)',
                  borderRadius: 'var(--bento-radius)',
                }}
              >
                <div className="flex items-center gap-5">
                  <div
                    className={`mono text-3xl font-bold w-12 ${index === 0 ? 'text-primary' : index < 4 ? 'text-secondary' : 'text-muted-foreground'}`}
                    style={index === 0 ? { textShadow: 'var(--green-glow)' } : {}}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-bold text-lg">{result.rapper.name}</div>
                    <div className="text-xs text-muted-foreground tracking-wide">
                      {result.team?.name}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`mono text-3xl font-bold ${index === 0 ? 'text-primary' : 'text-foreground'}`}
                    style={index === 0 ? { textShadow: 'var(--green-glow)' } : {}}
                  >
                    {result.cumulative}
                  </div>
                  <div className="mono text-xs text-muted-foreground">
                    R1:{result.round1} R2:{result.round2} R3:{result.round3}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedRound !== 'all' && (
        <div className="grid gap-3">
          {[...results]
            .sort((a, b) => {
              const aTotal = selectedRound === 1 ? a.round1 : selectedRound === 2 ? a.round1 + a.round2 : a.round1 + a.round2 + a.round3;
              const bTotal = selectedRound === 1 ? b.round1 : selectedRound === 2 ? b.round1 + b.round2 : b.round1 + b.round2 + b.round3;
              return bTotal - aTotal;
            })
            .map((result, index) => {
              const roundScore = selectedRound === 1 ? result.round1 : selectedRound === 2 ? result.round2 : result.round3;
              const totalScore = selectedRound === 1 ? result.round1 : selectedRound === 2 ? result.round1 + result.round2 : result.round1 + result.round2 + result.round3;
              const maxTotal = selectedRound * 40;
              const isTopFour = selectedRound === 3 && topFourAfterR2.some(t => t.rapper.id === result.rapper.id);
              const showInR3 = selectedRound !== 3 || isTopFour;

              if (!showInR3) return null;

              return (
                <div
                  key={result.rapper.id}
                  className="border p-5 flex items-center justify-between"
                  style={{ borderColor: index === 0 ? 'var(--primary)' : 'var(--border-muted)', backgroundColor: 'var(--card)', borderRadius: 'var(--bento-radius)', boxShadow: index === 0 ? 'var(--green-glow), var(--bento-shadow)' : 'var(--bento-shadow)' }}
                >
                  <div className="flex items-center gap-5">
                    <div className="mono text-2xl font-bold text-muted-foreground w-10">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-bold text-lg">{result.rapper.name}</div>
                      <div className="text-xs text-muted-foreground tracking-wide">
                        {result.team?.name}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="mono text-3xl font-bold text-foreground">
                      {totalScore}
                      <span className="text-lg text-muted-foreground">/{maxTotal}</span>
                    </div>
                    {selectedRound > 1 && (
                      <div className="mono text-sm text-muted-foreground mt-1">
                        R{selectedRound}: {roundScore}/40
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      <button
        onClick={exportResults}
        className="w-full bg-primary text-primary-foreground py-4 px-6 rounded-2xl flex items-center justify-center gap-3 hover:opacity-90 transition-all font-bold"
        style={{ boxShadow: 'var(--green-glow), var(--bento-shadow)' }}
      >
        <Download className="w-5 h-5" />
        EXPORT RESULTS
      </button>
    </div>
  );
}
