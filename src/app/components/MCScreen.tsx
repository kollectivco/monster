import { Rapper, Team, Judge, Score, BroadcastState } from '../types';
import { AlertTriangle, Mic2, Trophy } from 'lucide-react';
import logo from '../../imports/logo.webp';

interface MCScreenProps {
  rappers: Rapper[];
  teams: Team[];
  judges: Judge[];
  scores: Record<string, Score>;
  broadcastState: BroadcastState;
}

interface RapperResult {
  rapper: Rapper;
  team?: Team;
  currentRoundScore: number;
  cumulative: number;
}

export default function MCScreen({
  rappers,
  teams,
  judges,
  scores,
  broadcastState,
}: MCScreenProps) {
  const currentRound = broadcastState.round;

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
    let cumulative = 0;
    for (let i = 1; i <= currentRound; i++) {
      cumulative += calculateRapperScore(rapper.id, i);
    }
    const currentRoundScore = calculateRapperScore(rapper.id, currentRound);
    return {
      rapper,
      team: teams.find(t => t.id === rapper.teamId),
      currentRoundScore,
      cumulative,
    };
  });

  const sortedResults = [...results].sort((a, b) => b.cumulative - a.cumulative);

  const checkTie = (results: RapperResult[], position: number): boolean => {
    if (position >= results.length) return false;
    const current = results[position];
    const next = results[position + 1];
    return next && current.cumulative === next.cumulative;
  };

  const hasR2QualifyingTie = currentRound === 2 && checkTie(sortedResults, 3);
  const hasFirstPlaceTie = currentRound === 3 && checkTie(sortedResults, 0);

  const getHeadline = () => {
    if (sortedResults.length === 0) return "WAITING FOR SCORES...";
    const leader = sortedResults[0];
    if (currentRound === 1) {
      if (leader.cumulative === 0) return "ROUND 1: FREESTYLE IN PROGRESS";
      return `LEADING ROUND 1: ${leader.rapper.name}`;
    }
    if (currentRound === 2) {
      if (leader.cumulative === 0) return "ROUND 2: BEAT ROULETTE IN PROGRESS";
      return `LEADERBOARD TOP: ${leader.rapper.name}`;
    }
    if (currentRound === 3) {
      return `THE CHAMPION: ${leader.rapper.name}`;
    }
    return "BEAST BEATS LIVE";
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-4 pb-12">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md pb-4 mb-6 border-b border-muted">
        <div className="flex items-center justify-between pt-2">
          <img
            src={logo}
            alt="Beast Beats Logo"
            className="h-10 md:h-12 object-contain"
            style={{ mixBlendMode: 'lighten' }}
          />
          <div className="text-right">
            <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-widest uppercase" style={{ fontFamily: 'Anton, sans-serif' }}>
              ROUND {currentRound}
            </h1>
            <div className="text-sm md:text-base text-secondary font-mono">
              {currentRound === 1 && "FREESTYLE"}
              {currentRound === 2 && "BEAT ROULETTE"}
              {currentRound === 3 && "THE FINAL"}
            </div>
          </div>
        </div>

        {/* Headline */}
        <div className="mt-4 bg-primary/10 border-l-4 border-primary p-3 rounded-r-lg">
          <div className="flex items-center gap-2">
            <Mic2 className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0" />
            <h2 className="text-lg md:text-xl font-bold text-foreground">
              {getHeadline()}
            </h2>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Tie Warnings */}
        {(hasR2QualifyingTie || hasFirstPlaceTie) && (
          <div className="mb-6 bg-destructive/10 border-2 border-destructive p-4 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-destructive text-lg">
                {hasFirstPlaceTie ? "1ST PLACE TIE DETECTED!" : "4TH PLACE TIE DETECTED!"}
              </p>
              <p className="text-foreground text-sm mt-1">
                Prepare for a 30-second tiebreaker before proceeding.
              </p>
            </div>
          </div>
        )}

        {/* Rankings */}
        <div className="space-y-3">
          {sortedResults.map((result, index) => {
            const isTop4 = index < 4;
            const isWinner = currentRound === 3 && index === 0;
            
            let borderColor = 'border-muted';
            let bgColor = 'bg-card';
            
            if (currentRound >= 2 && isTop4) {
              borderColor = 'border-primary';
              bgColor = 'bg-primary/5';
            }
            if (isWinner) {
              borderColor = 'border-secondary';
              bgColor = 'bg-secondary/10';
            }

            return (
              <div
                key={result.rapper.id}
                className={`border-2 p-4 rounded-xl flex items-center justify-between ${borderColor} ${bgColor}`}
                style={isWinner || (currentRound >= 2 && isTop4) ? { boxShadow: 'var(--bento-shadow)' } : {}}
              >
                <div className="flex items-center gap-4">
                  <div 
                    className={`w-10 text-center font-mono text-3xl font-bold ${
                      isWinner ? 'text-secondary' : isTop4 && currentRound >= 2 ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-bold text-xl md:text-2xl">{result.rapper.name}</div>
                    <div className="text-xs md:text-sm text-muted-foreground tracking-wide mt-1 uppercase">
                      {result.team?.name}
                    </div>
                    {currentRound >= 2 && isTop4 && currentRound !== 3 && (
                      <div className="text-xs md:text-sm text-primary font-bold mt-1 tracking-wider">
                        TOP 4 QUALIFIER
                      </div>
                    )}
                    {isWinner && (
                      <div className="text-xs md:text-sm text-secondary font-bold mt-1 tracking-wider flex items-center gap-1">
                        <Trophy className="w-3 h-3" /> CHAMPION
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-3xl md:text-4xl font-mono font-bold text-foreground">
                    {result.cumulative}
                  </div>
                  <div className="text-xs md:text-sm font-mono text-muted-foreground mt-1">
                    R{currentRound}: {result.currentRoundScore}/40
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
