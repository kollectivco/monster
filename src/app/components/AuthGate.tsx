import { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import logo from '../../imports/logo.webp';

const PASSWORDS: Record<string, string> = {
  'judge_shehab': '1111',
  'judge_shahyn': '1112',
  'judge_ziad-zaza': '1113',
  'judge_ali-loka': '1114',
  'mc': '1115',
  'control': '1136',
};

interface AuthGateProps {
  screenId: string;
  children: React.ReactNode;
}

export default function AuthGate({ screenId, children }: AuthGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    // Check if this screen needs a password
    const requiredPassword = PASSWORDS[screenId];
    if (!requiredPassword) {
      setIsAuthenticated(true);
      return;
    }

    // Check sessionStorage
    const isAuthed = sessionStorage.getItem(`auth_${screenId}`) === 'true';
    setIsAuthenticated(isAuthed);
  }, [screenId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const requiredPassword = PASSWORDS[screenId];
    
    if (password === requiredPassword) {
      sessionStorage.setItem(`auth_${screenId}`, 'true');
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setPassword('');
    }
  };

  if (isAuthenticated === null) return null; // Loading state

  if (isAuthenticated) {
    return (
      <div className="h-full w-full">
        {children}
        {PASSWORDS[screenId] && (
          <button
            onClick={() => {
              sessionStorage.removeItem(`auth_${screenId}`);
              setIsAuthenticated(false);
            }}
            className="fixed bottom-4 right-4 z-50 p-3 bg-black/50 text-white rounded-full hover:bg-black/80 transition-colors backdrop-blur-md border border-white/10"
            title="Lock Screen"
          >
            <Lock className="w-4 h-4 text-[#C1FF00]" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 font-mono relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 left-0 w-full h-full bg-[#C1FF00]/5 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#C1FF00]/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full bg-[#0a0a0a] p-8 rounded-2xl border border-[#C1FF00]/20 shadow-[0_0_50px_rgba(193,255,0,0.1)] relative z-10">
        <div className="text-center mb-10 flex flex-col items-center">
          <img src={logo} alt="Beast Beats Logo" className="w-32 h-auto mb-6 object-contain filter drop-shadow-[0_0_15px_rgba(193,255,0,0.3)]" />
          <div className="inline-block bg-[#111] border border-[#C1FF00]/30 px-4 py-1.5 rounded-full">
            <p className="text-gray-400 text-sm uppercase tracking-widest font-semibold">
              {screenId.replace('_', ' ')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[#C1FF00] text-sm font-bold mb-3 uppercase tracking-wider text-center">
              Enter Passcode
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              className={`w-full bg-[#111] border-2 ${
                error ? 'border-red-500 text-red-500' : 'border-[#C1FF00]/30 text-[#C1FF00]'
              } p-4 rounded-xl text-center text-3xl tracking-[0.5em] font-black focus:outline-none focus:border-[#C1FF00] transition-colors placeholder:text-[#C1FF00]/20 placeholder:font-normal`}
              placeholder="••••"
              maxLength={4}
              autoFocus
            />
            <div className="h-6 mt-2">
              {error && (
                <p className="text-red-500 text-sm text-center uppercase tracking-wider font-bold animate-pulse">
                  Access Denied
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#C1FF00] text-black font-black uppercase tracking-widest py-4 rounded-xl hover:bg-[#a6db00] transition-colors active:scale-[0.98] shadow-[0_0_20px_rgba(193,255,0,0.2)]"
          >
            Unlock Screen
          </button>
        </form>
      </div>
    </div>
  );
}
