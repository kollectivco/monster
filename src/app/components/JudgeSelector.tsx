import { Judge } from '../types';

interface JudgeSelectorProps {
  judges: Judge[];
  selectedJudge: string;
  onSelectJudge: (id: string) => void;
}

export default function JudgeSelector({
  judges,
  selectedJudge,
  onSelectJudge,
}: JudgeSelectorProps) {
  return (
    <div className="mb-6">
      <p className="text-xs text-muted-foreground mb-2 tracking-widest">
        SCORING AS:
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {judges.map(judge => (
          <button
            key={judge.id}
            onClick={() => onSelectJudge(judge.id)}
            className={`py-3 px-4 rounded transition-all ${
              selectedJudge === judge.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-foreground border hover:border-primary'
            }`}
            style={{
              borderColor: selectedJudge === judge.id ? 'transparent' : 'var(--border-muted)',
              boxShadow: selectedJudge === judge.id ? 'var(--green-glow)' : 'none',
            }}
          >
            {judge.name}
          </button>
        ))}
      </div>
    </div>
  );
}
