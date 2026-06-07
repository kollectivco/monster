import { RotateCcw } from 'lucide-react';
import { AppData } from '../types';

interface SetupScreenProps {
  data: AppData;
  onUpdateTeam: (id: string, name: string) => void;
  onUpdateRapper: (id: string, name: string) => void;
  onUpdateJudge: (id: string, name: string) => void;
  onReset: () => void;
}

export default function SetupScreen({
  data,
  onUpdateTeam,
  onUpdateRapper,
  onUpdateJudge,
  onReset,
}: SetupScreenProps) {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl mb-3 text-primary">TEAMS</h2>
        <div className="space-y-2">
          {data.teams.map(team => (
            <input
              key={team.id}
              type="text"
              value={team.name}
              onChange={e => onUpdateTeam(team.id, e.target.value)}
              className="w-full bg-card border rounded px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              style={{ borderColor: 'var(--border-muted)' }}
              placeholder="Team name"
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl mb-3 text-secondary">RAPPERS</h2>
        <div className="space-y-2">
          {data.rappers.map(rapper => {
            const team = data.teams.find(t => t.id === rapper.teamId);
            return (
              <div key={rapper.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={rapper.name}
                  onChange={e => onUpdateRapper(rapper.id, e.target.value)}
                  className="flex-1 bg-card border rounded px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  style={{ borderColor: 'var(--border-muted)' }}
                  placeholder="Rapper name"
                />
                <div className="text-xs text-muted-foreground w-20 text-right">
                  {team?.name}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-xl mb-3 text-secondary">JUDGES</h2>
        <div className="space-y-2">
          {data.judges.map(judge => (
            <input
              key={judge.id}
              type="text"
              value={judge.name}
              onChange={e => onUpdateJudge(judge.id, e.target.value)}
              className="w-full bg-card border rounded px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              style={{ borderColor: 'var(--border-muted)' }}
              placeholder="Judge name"
            />
          ))}
        </div>
      </section>

      <button
        onClick={onReset}
        className="w-full bg-destructive text-destructive-foreground py-3 px-4 rounded flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
      >
        <RotateCcw className="w-4 h-4" />
        RESET ALL DATA
      </button>
    </div>
  );
}
