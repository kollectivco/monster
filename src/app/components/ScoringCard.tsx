import { useState, useEffect } from 'react';
import { Rapper, Team, Score } from '../types';
import AnimatedNumber from './AnimatedNumber';
import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown, CheckCircle2, Circle } from 'lucide-react';

interface ScoringCardProps {
  rapper: Rapper;
  team?: Team;
  score: Score;
  previousScores?: {
    round1: number;
    round2: number;
  };
  currentRound: number;
  onUpdateScore: (updates: Partial<Score>) => void;
  value: string;
}

const CRITERIA = [
  'Lyricism & Wordplay',
  'Flow & Delivery',
  'Stage Presence & Performance',
  'Originality & Style',
  'Content & Impact',
];

export default function ScoringCard({
  rapper,
  team,
  score,
  previousScores,
  currentRound,
  onUpdateScore,
  value,
}: ScoringCardProps) {
  const [finalScore, setFinalScore] = useState(0);

  useEffect(() => {
    const raw = score.criteria.reduce((a, b) => a + (b ?? 0), 0);
    const deductions =
      (score.deductions.restart ? 1 : 0) +
      (score.deductions.preRecorded ? 2 : 0) +
      (score.deductions.technical ?? 0);
    setFinalScore(Math.max(0, raw - deductions));
  }, [score]);

  const updateCriteria = (index: number, value: number) => {
    const newCriteria = [...score.criteria] as [number, number, number, number, number];
    newCriteria[index] = value;
    onUpdateScore({ criteria: newCriteria });
  };

  const toggleDeduction = (type: 'restart' | 'preRecorded') => {
    onUpdateScore({
      deductions: {
        ...score.deductions,
        [type]: !score.deductions[type],
      },
    });
  };

  const setTechnical = (value: 0 | 1 | 2) => {
    onUpdateScore({
      deductions: {
        ...score.deductions,
        technical: value,
      },
    });
  };

  const allScored = score.criteria.every(c => c > 0);

  return (
    <Accordion.Item
      value={value}
      className={`border transition-all duration-300`}
      style={{
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--bento-radius)',
        borderColor: allScored ? 'var(--border-muted)' : 'var(--primary)',
        boxShadow: allScored ? 'var(--bento-shadow)' : 'var(--green-glow), var(--bento-shadow)',
      }}
    >
      <Accordion.Header>
        <Accordion.Trigger className="w-full px-6 py-4 flex items-center justify-between group hover:bg-muted/30 transition-all" style={{ borderRadius: 'var(--bento-radius)' }}>
          <div className="flex items-center gap-4 flex-1">
            <div className="inline-block px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--border-muted)', fontSize: '0.65rem' }}>
              {team?.name || 'NO TEAM'}
            </div>
            <h3 className="text-xl tracking-tight">{rapper.name}</h3>
            {allScored ? (
              <CheckCircle2 className="w-5 h-5 text-primary" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground opacity-50" />
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div
                className="mono font-bold text-primary"
                style={{ textShadow: 'var(--green-glow)', fontSize: '2rem', lineHeight: '1' }}
              >
                <AnimatedNumber value={finalScore} />
              </div>
              <div className="mono text-xs text-muted-foreground">/10</div>
            </div>
            <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform duration-300 group-data-[state=open]:rotate-180" />
          </div>
        </Accordion.Trigger>
      </Accordion.Header>

      <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
        <div className="px-6 pb-6 pt-2">
          {previousScores && (
            <div className="flex gap-3 mb-4">
              {currentRound >= 2 && (
                <p className="text-xs text-muted-foreground mono">
                  R1: {previousScores.round1}/10
                </p>
              )}
              {currentRound >= 3 && (
                <p className="text-xs text-muted-foreground mono">
                  R2: {previousScores.round2}/10
                </p>
              )}
            </div>
          )}

          <div className="space-y-4 mb-5">
            {CRITERIA.map((criterion, index) => (
              <div key={index}>
                <p className="text-xs mb-2 text-muted-foreground tracking-widest" style={{ fontSize: '0.65rem' }}>
                  {criterion}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[0, 1, 2].map(value => (
                    <button
                      key={value}
                      onClick={() => updateCriteria(index, value)}
                      className={`py-3.5 rounded-full transition-all mono font-bold ${
                        score.criteria[index] === value
                          ? 'bg-primary text-primary-foreground'
                          : score.criteria[index] === 0 && value === 0
                          ? 'border-2 border-dashed text-muted-foreground'
                          : 'border-2 text-foreground hover:bg-muted/50 active:scale-95'
                      }`}
                      style={{
                        boxShadow: score.criteria[index] === value ? 'var(--green-glow)' : 'none',
                        borderColor: score.criteria[index] === value ? 'transparent' : 'var(--border-muted)',
                      }}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-5 space-y-3" style={{ borderColor: 'var(--border-muted)' }}>
            <p className="text-xs text-muted-foreground tracking-widest" style={{ fontSize: '0.65rem' }}>
              DEDUCTIONS
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => toggleDeduction('restart')}
                className={`py-2.5 px-3 rounded-xl text-xs transition-all border-2 ${
                  score.deductions.restart
                    ? 'bg-destructive text-destructive-foreground'
                    : 'text-foreground hover:bg-destructive/10'
                }`}
                style={{
                  borderColor: score.deductions.restart ? 'var(--destructive)' : 'var(--border-muted)',
                }}
              >
                RESTART (−1)
              </button>
              <button
                onClick={() => toggleDeduction('preRecorded')}
                className={`py-2.5 px-3 rounded-xl text-xs transition-all border-2 ${
                  score.deductions.preRecorded
                    ? 'bg-destructive text-destructive-foreground'
                    : 'text-foreground hover:bg-destructive/10'
                }`}
                style={{
                  borderColor: score.deductions.preRecorded ? 'var(--destructive)' : 'var(--border-muted)',
                }}
              >
                PRE-REC (−2)
              </button>
            </div>
            <div>
              <p className="text-xs mb-2 text-muted-foreground tracking-widest" style={{ fontSize: '0.65rem' }}>TECHNICAL</p>
              <div className="grid grid-cols-3 gap-2">
                {([0, 1, 2] as const).map(value => (
                  <button
                    key={value}
                    onClick={() => setTechnical(value)}
                    className={`py-2.5 rounded-xl text-xs mono transition-all border-2 font-bold ${
                      score.deductions.technical === value
                        ? 'bg-destructive text-destructive-foreground'
                        : 'text-foreground hover:bg-destructive/10'
                    }`}
                    style={{
                      borderColor: score.deductions.technical === value ? 'var(--destructive)' : 'var(--border-muted)',
                    }}
                  >
                    −{value}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Accordion.Content>
    </Accordion.Item>
  );
}
