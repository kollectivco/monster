import { User, Tv, Settings } from 'lucide-react';
import logo from '../../imports/logo.webp';
import { nameToSlug } from '../hooks/useHashRouter';

interface ScreenSelectorProps {
  onSelectScreen: (screen: string) => void;
}

// Real judge names - hardcoded defaults
const JUDGES = [
  { id: '1', name: 'Ali Loka' },
  { id: '2', name: 'ZIAD ZAZA' },
  { id: '3', name: 'Shehab' },
  { id: '4', name: 'Shahyn' },
];

export default function ScreenSelector({ onSelectScreen }: ScreenSelectorProps) {

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-5xl w-full">
        <header className="mb-12 text-center">
          <div className="flex justify-center mb-4">
            <img
              src={logo}
              alt="Beast Beats Logo"
              className="h-32 md:h-40 w-auto object-contain"
              style={{ mixBlendMode: 'lighten' }}
            />
          </div>
          <p className="text-xs tracking-widest text-muted-foreground" style={{ fontSize: '0.7rem' }}>
            SELECT YOUR SCREEN
          </p>
        </header>

        <div className="grid gap-8">
          <section>
            <h2 className="text-lg mb-5 text-primary tracking-wider">JUDGE SCREENS</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {JUDGES.map(judge => (
                <div
                  key={judge.id}
                  onClick={() => onSelectScreen(`judge-${nameToSlug(judge.name)}`)}
                  className="border p-8 hover:border-primary transition-all cursor-pointer hover:translate-y-[-2px] group"
                  style={{
                    borderColor: 'var(--border-muted)',
                    backgroundColor: 'var(--card)',
                    borderRadius: 'var(--bento-radius)',
                    boxShadow: 'var(--bento-shadow)',
                  }}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <User className="w-8 h-8 text-primary group-hover:opacity-100 opacity-80 transition-opacity" />
                    <h3 className="text-2xl">{judge.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground tracking-widest" style={{ fontSize: '0.65rem' }}>
                    SCORING INTERFACE
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg mb-5 text-secondary tracking-wider">DISPLAY & CONTROL</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                onClick={() => onSelectScreen('stage')}
                className="border p-8 hover:border-primary transition-all cursor-pointer hover:translate-y-[-2px] group"
                style={{
                  borderColor: 'var(--border-muted)',
                  backgroundColor: 'var(--card)',
                  borderRadius: 'var(--bento-radius)',
                  boxShadow: 'var(--bento-shadow)',
                }}
              >
                <div className="flex items-center gap-4 mb-3">
                  <Tv className="w-8 h-8 text-primary group-hover:opacity-100 opacity-80 transition-opacity" />
                  <h3 className="text-2xl">STAGE DISPLAY</h3>
                </div>
                <p className="text-xs text-muted-foreground tracking-widest" style={{ fontSize: '0.65rem' }}>
                  PUBLIC RESULTS VIEW
                </p>
              </div>

              <div
                onClick={() => onSelectScreen('control')}
                className="border p-8 hover:border-primary transition-all cursor-pointer hover:translate-y-[-2px] group"
                style={{
                  borderColor: 'var(--border-muted)',
                  backgroundColor: 'var(--card)',
                  borderRadius: 'var(--bento-radius)',
                  boxShadow: 'var(--bento-shadow)',
                }}
              >
                <div className="flex items-center gap-4 mb-3">
                  <Settings className="w-8 h-8 text-primary group-hover:opacity-100 opacity-80 transition-opacity" />
                  <h3 className="text-2xl">TEAM CONTROL</h3>
                </div>
                <p className="text-xs text-muted-foreground tracking-widest" style={{ fontSize: '0.65rem' }}>
                  ADMIN DASHBOARD
                </p>
              </div>

              <div
                onClick={() => onSelectScreen('mc')}
                className="border p-8 hover:border-primary transition-all cursor-pointer hover:translate-y-[-2px] group"
                style={{
                  borderColor: 'var(--border-muted)',
                  backgroundColor: 'var(--card)',
                  borderRadius: 'var(--bento-radius)',
                  boxShadow: 'var(--bento-shadow)',
                }}
              >
                <div className="flex items-center gap-4 mb-3">
                  <User className="w-8 h-8 text-primary group-hover:opacity-100 opacity-80 transition-opacity" />
                  <h3 className="text-2xl">MC SCREEN</h3>
                </div>
                <p className="text-xs text-muted-foreground tracking-widest" style={{ fontSize: '0.65rem' }}>
                  HOST ANNOUNCER VIEW
                </p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
