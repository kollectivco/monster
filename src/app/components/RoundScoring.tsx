import { AlertTriangle, Lock } from 'lucide-react';
import { Rapper, Team, Score, Judge, BroadcastState } from '../types';
import ScoringCard from './ScoringCard';
import * as Accordion from '@radix-ui/react-accordion';

interface RoundScoringProps {
  round: number;
  roundTitle: string;
  rappers: Rapper[];
  teams: Team[];
  judges?: Judge[];
  judgeId: string;
  scores: Record<string, Score>;
  onUpdateScore: (
    judgeId: string,
    rapperId: string,
    round: number,
    updates: Partial<Score>
  ) => void;
  topFourOnly?: boolean;
  broadcastState?: BroadcastState;
}

export default function RoundScoring({
  round,
  roundTitle,
  rappers,
  teams,
  judges = [],
  judgeId,
  scores,
  onUpdateScore,
  topFourOnly = false,
  broadcastState,
}: RoundScoringProps) {
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

  const checkRoundComplete = (targetRound: number): { complete: boolean; total: number; done: number } => {
    if (judges.length === 0) return { complete: false, total: 0, done: 0 };

    const total = rappers.length * judges.length;
    let done = 0;

    for (const rapper of rappers) {
      for (const judge of judges) {
        const key = `${judge.id}-${rapper.id}-${targetRound}`;
        const score = scores[key];
        if (score && score.criteria.some(c => c > 0)) {
          done++;
        }
      }
    }

    return { complete: done === total, total, done };
  };

  const checkRoundsComplete = (): boolean => {
    const r1 = checkRoundComplete(1);
    const r2 = checkRoundComplete(2);
    return r1.complete && r2.complete;
  };

  const getTopFourWithTieInfo = () => {
    const cumulativeScores = rappers.map(rapper => {
      const r1 = calculateRapperScore(rapper.id, 1);
      const r2 = calculateRapperScore(rapper.id, 2);
      return { rapper, total: r1 + r2 };
    });

    const sorted = cumulativeScores.sort((a, b) => b.total - a.total);
    const topFour = sorted.slice(0, 3);
    
    if (broadcastState?.wildcardRapperId) {
      const wildcard = cumulativeScores.find(r => r.rapper.id === broadcastState.wildcardRapperId);
      if (wildcard) {
        topFour.push(wildcard);
      }
    }

    const hasTie = sorted.length > 3 && sorted[2].total === sorted[3].total;

    return { topFour, hasTie };
  };

  // Check if Round 2 is locked (for round 2 only)
  if (round === 2 && !topFourOnly) {
    const r1Status = checkRoundComplete(1);
    if (!r1Status.complete) {
      return (
        <div>
          <h2 className="text-lg mb-6 text-center text-primary tracking-wider">
            {roundTitle}
          </h2>
          <div className="bg-card border p-12 text-center" style={{ borderColor: 'var(--border-muted)', borderRadius: 'var(--bento-radius)', boxShadow: 'var(--bento-shadow)' }}>
            <Lock className="w-20 h-20 mx-auto mb-6 text-muted-foreground" />
            <h3 className="text-2xl mb-3 text-secondary">ROUND 2 LOCKED</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Round 2 will unlock once Round 1 is fully scored by all judges.
            </p>
            <div className="inline-block px-6 py-4 rounded-2xl" style={{ backgroundColor: 'var(--muted)' }}>
              <p className="text-xs text-muted-foreground mb-2 tracking-widest" style={{ fontSize: '0.65rem' }}>PROGRESS</p>
              <p className="mono text-2xl text-foreground font-bold">
                {r1Status.done} / {r1Status.total}
              </p>
            </div>
          </div>
        </div>
      );
    }
  }

  if (topFourOnly) {
    const roundsComplete = checkRoundsComplete();

    if (!roundsComplete) {
      const r1Status = checkRoundComplete(1);
      const r2Status = checkRoundComplete(2);
      const totalDone = r1Status.done + r2Status.done;
      const totalRequired = r1Status.total + r2Status.total;

      return (
        <div>
          <h2 className="text-lg mb-6 text-center text-primary tracking-wider">
            {roundTitle}
          </h2>
          <div className="bg-card border p-12 text-center" style={{ borderColor: 'var(--border-muted)', borderRadius: 'var(--bento-radius)', boxShadow: 'var(--bento-shadow)' }}>
            <Lock className="w-20 h-20 mx-auto mb-6 text-muted-foreground" />
            <h3 className="text-2xl mb-3 text-secondary">ROUND 3 LOCKED</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Round 3 will unlock once all judges complete Rounds 1 & 2 scoring for all rappers.
            </p>
            <div className="inline-block px-6 py-4 rounded-2xl" style={{ backgroundColor: 'var(--muted)' }}>
              <p className="text-xs text-muted-foreground mb-2 tracking-widest" style={{ fontSize: '0.65rem' }}>PROGRESS</p>
              <p className="mono text-2xl text-foreground font-bold">
                {totalDone} / {totalRequired}
              </p>
            </div>
          </div>
        </div>
      );
    }

    const { topFour, hasTie } = getTopFourWithTieInfo();

    return (
      <div>
        <h2 className="text-lg mb-6 text-center text-primary tracking-wider">
          {roundTitle}
        </h2>

        {hasTie && (
          <div className="bg-destructive/10 border-2 border-destructive p-5 flex items-start gap-4 mb-6" style={{ borderRadius: 'var(--bento-radius)' }}>
            <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-destructive text-sm tracking-wide">TIEBREAKER NEEDED</p>
              <p className="text-sm text-foreground mt-1.5">
                Two or more rappers are tied for the final qualifying spot. A tiebreaker is required.
              </p>
            </div>
          </div>
        )}

        <div className="bg-card border border-primary p-5 mb-6" style={{ borderRadius: 'var(--bento-radius)', boxShadow: 'var(--green-glow), var(--bento-shadow)' }}>
          <h3 className="text-xs text-primary mb-4 tracking-widest" style={{ fontSize: '0.65rem' }}>TOP 4 QUALIFIERS (AUTO-SELECTED)</h3>
          <div className="space-y-3">
            {topFour.map((item, index) => {
              const team = teams.find(t => t.id === item.rapper.teamId);
              return (
                <div key={item.rapper.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="mono text-primary font-bold text-lg w-8">{index + 1}</div>
                    <div>
                      <div className="font-bold">{item.rapper.name}</div>
                      <div className="text-xs text-muted-foreground tracking-wide">{team?.name}</div>
                    </div>
                  </div>
                  <div className="mono text-foreground font-bold">{item.total}</div>
                </div>
              );
            })}
          </div>
        </div>

        <Accordion.Root type="single" collapsible className="grid gap-6">
          {topFour.map(({ rapper }) => {
            const team = teams.find(t => t.id === rapper.teamId);
            const key = `${judgeId}-${rapper.id}-${round}`;
            const score = scores[key] || {
              judgeId,
              rapperId: rapper.id,
              round,
              criteria: [0, 0, 0, 0, 0],
              deductions: { restart: false, preRecorded: false, technical: 0 },
            };

            const getJudgeOwnScore = (round: number): number => {
              const key = `${judgeId}-${rapper.id}-${round}`;
              const s = scores[key];
              if (!s) return 0;
              const raw = s.criteria.reduce((a, b) => a + (b ?? 0), 0);
              const deductions =
                (s.deductions.restart ? 1 : 0) +
                (s.deductions.preRecorded ? 2 : 0) +
                (s.deductions.technical ?? 0);
              return Math.max(0, raw - deductions);
            };

            const previousScores = {
              round1: getJudgeOwnScore(1),
              round2: getJudgeOwnScore(2),
            };

            return (
              <ScoringCard
                key={rapper.id}
                rapper={rapper}
                team={team}
                score={score}
                previousScores={previousScores}
                currentRound={round}
                onUpdateScore={updates =>
                  onUpdateScore(judgeId, rapper.id, round, updates)
                }
                value={rapper.id}
              />
            );
          })}
        </Accordion.Root>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg mb-6 text-center text-primary tracking-wider">
        {roundTitle}
      </h2>
      <Accordion.Root type="single" collapsible className="grid gap-6">
        {rappers.map(rapper => {
          const team = teams.find(t => t.id === rapper.teamId);
          const key = `${judgeId}-${rapper.id}-${round}`;
          const score = scores[key] || {
            judgeId,
            rapperId: rapper.id,
            round,
            criteria: [0, 0, 0, 0, 0],
            deductions: { restart: false, preRecorded: false, technical: 0 },
          };

          const getJudgeOwnScore = (targetRound: number): number => {
            const key = `${judgeId}-${rapper.id}-${targetRound}`;
            const s = scores[key];
            if (!s) return 0;
            const raw = s.criteria.reduce((a, b) => a + (b ?? 0), 0);
            const deductions =
              (s.deductions.restart ? 1 : 0) +
              (s.deductions.preRecorded ? 2 : 0) +
              (s.deductions.technical ?? 0);
            return Math.max(0, raw - deductions);
          };

          const previousScores = round > 1 ? {
            round1: getJudgeOwnScore(1),
            round2: round > 2 ? getJudgeOwnScore(2) : 0,
          } : undefined;

          return (
            <ScoringCard
              key={rapper.id}
              rapper={rapper}
              team={team}
              score={score}
              previousScores={previousScores}
              currentRound={round}
              onUpdateScore={updates =>
                onUpdateScore(judgeId, rapper.id, round, updates)
              }
              value={rapper.id}
            />
          );
        })}
      </Accordion.Root>
    </div>
  );
}
