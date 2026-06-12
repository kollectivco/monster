import { motion, AnimatePresence } from 'framer-motion';
import { Rapper, Team, BroadcastState } from '../types';
import { Smile, Clock, Mic, MicOff } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import logo from '../../imports/logo.webp';

// Import judge photos
import ziadPhoto from '../../styles/photos/ziad.webp';
import shahynPhoto from '../../styles/photos/shahyn.webp';
import alyPhoto from '../../styles/photos/aly.webp';
import shehabPhoto from '../../styles/photos/shehab.webp';

const photos = import.meta.glob('../../styles/photos/*.{webp,jpg,jpeg,png}', { query: '?url', import: 'default', eager: true }) as Record<string, string>;

const getRapperPngImage = (name: string) => {
  const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const customMap: Record<string, string> = {
    'therealdopie': 'therealdopie',
    'dezelelgenral': 'dezel',
    'hazemhany': 'hazem',
    'xykoking': 'xykoking',
    'avage': 'avage'
  };
  const searchKey = customMap[normalizedName] || normalizedName;
  const match = Object.keys(photos).find(path => path.toLowerCase().includes(searchKey));
  return match ? photos[match] : null;
};

interface VisualProps {
  state: BroadcastState;
  rappers: Rapper[];
  teams: Team[];
  winner?: { rapper: Rapper; team?: Team; cumulative: number };
  topFour?: { rapper: Rapper; team?: Team; cumulative: number; round1: number; round2: number; round3: number }[];
}

export function GeneralVisuals({ state, topFour }: VisualProps) {
  if (state.mode === 'intro-logos') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.2 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        className="flex flex-col items-center justify-center h-full min-h-full w-full relative"
      >
        {/* Pulse Fade Effect */}
        <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
          <motion.div
            className="absolute rounded-full blur-[80px]"
            style={{ width: '350px', height: '350px', backgroundColor: 'var(--primary)' }}
            animate={{ 
              scale: [0.8, 1.3, 0.8],
              opacity: [0.2, 0.6, 0.2]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
          />
        </div>

        <motion.img
          src={logo}
          alt="Beast Beats"
          className="w-[500px] object-contain relative z-10 max-h-[80vh]"
          style={{ filter: 'drop-shadow(0 0 30px rgba(146, 208, 32, 0.5))' }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </motion.div>
    );
  }

  if (state.mode === 'warning-screen') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center h-full min-h-full w-full relative overflow-hidden bg-background"
      >
        {/* Subtle grid background */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />

        {/* Scanning line animation */}
        <motion.div 
          className="absolute top-0 left-0 w-full h-1 pointer-events-none"
          style={{ backgroundColor: 'var(--primary)', boxShadow: '0 0 20px 2px var(--primary)', opacity: 0.5 }}
          animate={{ y: ['0vh', '100vh', '0vh'] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />

        <div className="relative z-10 flex flex-col items-center justify-center max-w-3xl p-20">
          <motion.div
            animate={{ 
              opacity: [0.7, 1, 0.7],
              scale: [0.95, 1.05, 0.95],
              filter: ['drop-shadow(0 0 10px rgba(146,208,32,0.3))', 'drop-shadow(0 0 40px rgba(146,208,32,0.9))', 'drop-shadow(0 0 10px rgba(146,208,32,0.3))'] 
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="mb-8"
          >
            <Smile className="w-40 h-40 text-primary" strokeWidth={1.5} />
          </motion.div>

          <motion.div 
            className="flex items-center gap-3 mb-4 text-primary font-mono text-sm tracking-[0.5em] opacity-80"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span>[</span>
            <span>BEAST BEATS ON SPOT</span>
            <span>]</span>
          </motion.div>

          <motion.h1 
            className="text-8xl text-primary leading-none mb-4 tracking-widest" 
            style={{ fontFamily: 'Rocketbrush', textShadow: '0 0 30px rgba(146, 208, 32, 0.6)' }}
            animate={{ scale: [1, 1.02, 1], textShadow: ['0 0 20px rgba(146,208,32,0.4)', '0 0 40px rgba(146,208,32,0.8)', '0 0 20px rgba(146,208,32,0.4)'] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            SMILE
          </motion.h1>
          
          <h2 className="text-3xl font-bold text-foreground tracking-[0.4em] uppercase mt-2 text-center">
            YOU ARE ON SPOT
          </h2>
          
          <div className="mt-12 flex gap-3">
            {[...Array(5)].map((_, i) => (
              <motion.div 
                key={i}
                className="w-2 h-2 bg-primary rounded-full"
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (state.mode === 'countdown-timer') {
    return <TimerVisual seconds={state.timerSeconds || 300} label="STARTING IN" isCountdown={true} />;
  }

  if (state.mode === 'minute-timer') {
    return <TimerVisual seconds={state.timerSeconds || 60} label="FREESTYLE TIME" alertAt={10} />;
  }

  if (state.mode === 'judges-cards' || state.mode.startsWith('judge-')) {
    const allJudges = ['ZIAD ZAZA', 'SHAHYN', 'ALY LOKA', 'SHEHAB'];
    const judgeMapping: Record<string, string> = {
      'judge-zaza': 'ZIAD ZAZA',
      'judge-shahyn': 'SHAHYN',
      'judge-alyloka': 'ALY LOKA',
      'judge-shehab': 'SHEHAB'
    };
    
    const judgePhotos: Record<string, string | undefined> = {
      'ZIAD ZAZA': ziadPhoto,
      'SHAHYN': shahynPhoto,
      'ALY LOKA': alyPhoto,
      'SHEHAB': shehabPhoto
    };
    
    const judgesToShow = state.mode.startsWith('judge-') ? [judgeMapping[state.mode]] : allJudges;

    return (
      <div className="flex flex-col items-center justify-center h-full min-h-full gap-12 w-full px-12">
        {state.mode === 'judges-cards' && <h2 className="text-4xl text-primary tracking-widest mb-8" style={{ fontFamily: 'Rocketbrush' }}>THE JUDGES</h2>}
        <div className={`grid gap-8 w-full ${judgesToShow.length === 1 ? 'max-w-md' : 'grid-cols-4 max-w-7xl'}`}>
          {judgesToShow.map((j, i) => (
            <motion.div
              key={j}
              initial={{ opacity: 0, y: 50, rotateY: 90, scale: judgesToShow.length === 1 ? 0.5 : 1 }}
              animate={{ opacity: 1, y: 0, rotateY: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ delay: judgesToShow.length === 1 ? 0 : i * 0.2, duration: 0.8, type: "spring" }}
              className="aspect-[3/4] border-2 border-primary rounded-2xl flex flex-col items-end justify-end p-6 text-center relative overflow-hidden max-h-[75vh]"
              style={{ backgroundColor: 'var(--card)', boxShadow: 'var(--green-glow-strong)' }}
            >
              {/* Background Glow */}
              <div className="absolute inset-0 bg-primary/10" />
              
              {/* Judge Photo */}
              {judgePhotos[j] ? (
                <div className="absolute inset-0 flex items-end justify-center overflow-hidden">
                  <img 
                    src={judgePhotos[j]} 
                    alt={j} 
                    loading="lazy"
                    className="w-full h-full object-cover object-bottom opacity-80 mix-blend-screen"
                    style={{ filter: 'contrast(1.2) grayscale(0.2)' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              )}

              {/* Text Layer */}
              <h3 className={`${judgesToShow.length === 1 ? 'text-6xl mb-2' : 'text-4xl'} text-primary relative z-10 w-full`} style={{ fontFamily: 'Rocketbrush', textShadow: 'var(--green-glow-strong)' }}>{j}</h3>

            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

export function RoundIntros({ state }: VisualProps) {
  if (state.mode === 'round-1-intro' || state.mode === 'round-2-intro' || state.mode === 'round-3-intro') {
    const roundMap = {
      'round-1-intro': { title: 'ROUND ONE', subtitle: 'FREESTYLE' },
      'round-2-intro': { title: 'ROUND TWO', subtitle: 'BEAT ROULETTE' },
      'round-3-intro': { title: 'ROUND THREE', subtitle: 'THE FINAL' }
    };
    const { title, subtitle } = roundMap[state.mode as keyof typeof roundMap];

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 1.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.8, ease: "circOut" }}
        style={{ willChange: 'transform, opacity' }}
        className="flex flex-col items-center justify-center h-full min-h-full text-center pb-[120px]"
      >
        <div className="flex justify-center mb-4 md:mb-8">
          <img
            src={logo}
            alt="Beast Beats Logo"
            className="w-[150px] md:w-[180px] lg:w-[220px] object-contain"
            style={{ mixBlendMode: 'lighten' }}
          />
        </div>
        <h1 className="text-primary mb-3 md:mb-5 whitespace-nowrap w-full px-4 text-center overflow-visible" style={{ fontFamily: 'Rocketbrush', textShadow: 'var(--green-glow-strong)', fontSize: 'clamp(2rem, 5vw, 6rem)' }}>
          {title}
        </h1>
        <motion.h2 
          className="text-xl md:text-3xl text-secondary tracking-widest"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          {subtitle}
        </motion.h2>
      </motion.div>
    );
  }
  return null;
}

export function FinalistsVisuals({ state, rappers, teams, winner, topFour }: VisualProps) {
  if (state.mode === 'wild-card') {
    const wildCardRapper = state.wildcardRapperId ? rappers.find(r => r.id === state.wildcardRapperId) : null;
    const team = wildCardRapper ? teams.find(t => t.id === wildCardRapper.teamId) : null;

    return (
      <motion.div 
        initial={{ opacity: 0, rotate: -10, scale: 0 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ type: 'spring', damping: 15, stiffness: 100 }}
        className="flex flex-col items-center justify-center h-full min-h-full w-full pb-[120px]"
      >
        <h1 className="text-[8rem] text-secondary mb-12" style={{ fontFamily: 'Rocketbrush' }}>
          WILD CARD
        </h1>
        {wildCardRapper ? (
          <div className="flex flex-col items-center">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="w-96 h-96 border-4 border-primary bg-primary/10 rounded-full flex flex-col items-center justify-center text-center overflow-hidden mb-8 relative" 
              style={{ boxShadow: '0 0 80px rgba(146, 208, 32, 0.4)' }}
            >
              {getRapperPngImage(wildCardRapper.name) ? (
                <img 
                  src={getRapperPngImage(wildCardRapper.name)!} 
                  alt={wildCardRapper.name} 
                  className="w-full h-full object-cover" 
                  style={{ objectPosition: 'top' }}
                />
              ) : (
                <h2 className="text-5xl text-primary font-bold">{wildCardRapper.name}</h2>
              )}
            </motion.div>
            
            <motion.div
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.3 }}
               className="text-center"
            >
               <h2 className="text-6xl text-primary font-bold mb-1 uppercase" style={{ fontFamily: 'Anton, sans-serif', textShadow: '0 0 20px rgba(146, 208, 32, 0.6), 0 0 40px rgba(146, 208, 32, 0.4)', letterSpacing: '0.02em', lineHeight: '0.9' }}>{wildCardRapper.name}</h2>
               <p className="text-2xl text-white tracking-[0.1em] italic opacity-90" style={{ fontFamily: 'Rocketbrush, cursive' }}>{team?.name}</p>
            </motion.div>
          </div>
        ) : (
          <div className="w-96 h-96 border-4 border-secondary rounded-full flex items-center justify-center" style={{ boxShadow: '0 0 80px rgba(0, 255, 255, 0.4)' }}>
             <h2 className="text-6xl text-primary font-bold">???</h2>
          </div>
        )}
      </motion.div>
    );
  }

  if (state.mode === 'top-4-visual') {
    const finalists = topFour && topFour.length > 0 ? topFour : [1,2,3,4].map(i => ({ rapper: { id: `tbd-${i}`, name: 'TBD', teamId: '' }, team: undefined }));
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center h-full max-h-full overflow-hidden w-full px-8 py-2 pb-[120px]"
      >
        <img
          src={logo}
          alt="Beast Beats"
          className="h-20 mb-4 object-contain"
          style={{ filter: 'drop-shadow(0 0 20px rgba(146, 208, 32, 0.4))' }}
        />
        <h1 className="text-5xl text-primary mb-6" style={{ fontFamily: 'Rocketbrush', textShadow: 'var(--green-glow)' }}>TOP 4 FINALISTS</h1>
        <div className="grid grid-cols-2 gap-x-12 md:gap-x-24 gap-y-4 md:gap-y-6 w-full max-w-2xl px-12 md:px-24">
          {finalists.slice(0, 4).map((item, index) => {
            const isTBD = !item.rapper || item.rapper.id.startsWith('tbd');
            return (
              <div key={item.rapper?.id || index} className="flex flex-col items-center w-full">
                {/* 1. RANK NUMBER ABOVE */}
                <div className="text-4xl text-muted-foreground/50 font-bold mb-1">
                  0{index + 1}
                </div>

                {/* 2. IMAGE INSIDE THE BOX */}
                <div
                  className="w-full h-[18vh] md:h-[20vh] border-4 border-primary bg-card/80 rounded-2xl flex flex-col items-center justify-center overflow-hidden mb-2" 
                  style={{ boxShadow: 'var(--green-glow-strong)' }}
                >
                  {!isTBD && getRapperPngImage(item.rapper.name) ? (
                    <img 
                      src={getRapperPngImage(item.rapper.name)!} 
                      alt={item.rapper.name} 
                      loading="lazy" 
                      className="w-full h-full object-cover" 
                      style={{ objectPosition: 'top' }}
                    />
                  ) : (
                    <div className="text-center p-2">
                      <h3 className="text-3xl text-primary mb-1" style={{ fontFamily: 'Rocketbrush' }}>TBD</h3>
                      {index === 3 && (
                        <p className="text-sm tracking-widest text-muted-foreground uppercase font-bold">Wild Card</p>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. NAME (+ team) BELOW */}
                <div className="text-center w-full px-2">
                  <h3 
                    className="text-4xl text-primary break-words leading-none uppercase font-bold" 
                    style={{ 
                      fontFamily: 'Anton, sans-serif', 
                      textShadow: '0 0 10px rgba(146, 208, 32, 0.6), 0 0 20px rgba(146, 208, 32, 0.4)',
                      letterSpacing: '0.02em'
                    }}
                  >
                    {!isTBD ? item.rapper.name : 'TBD'}
                  </h3>
                  {!isTBD && item.team && (
                    <p className="text-base text-white tracking-[0.1em] mt-1 italic opacity-90"
                       style={{ fontFamily: 'Rocketbrush, cursive' }}>
                      {item.team.name}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  if (state.mode === 'finalists-vs') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 1.5 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-row items-center justify-center h-full min-h-full w-full relative overflow-hidden"
      >
        <div className="flex-1 h-full bg-primary/10 border-r-4 border-primary flex items-center justify-center pb-[120px]">
          <h2 className="text-8xl text-primary" style={{ fontFamily: 'Rocketbrush' }}>FINALIST A</h2>
        </div>
        <div className="absolute z-10 w-48 h-48 bg-background border-4 border-primary rounded-full flex items-center justify-center" style={{ boxShadow: 'var(--green-glow-strong)' }}>
          <span className="text-6xl text-primary font-bold italic">VS</span>
        </div>
        <div className="flex-1 h-full bg-secondary/10 border-l-4 border-secondary flex items-center justify-center pb-[120px]">
          <h2 className="text-8xl text-secondary" style={{ fontFamily: 'Rocketbrush' }}>FINALIST B</h2>
        </div>
      </motion.div>
    );
  }

  if (state.mode === 'winner-graphic') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', bounce: 0.5, duration: 2 }}
        className="flex flex-col items-center justify-center h-full min-h-full w-full text-center relative pb-[120px]"
      >
        {/* Removed the border rectangle from the background entirely per user request */}
        
        {winner ? (
          <>
            <motion.img
              src={logo}
              alt="Beast Beats Logo"
              className="h-28 w-auto object-contain mb-6 relative z-10"
              style={{ mixBlendMode: 'lighten' }}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            />
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
              className="relative z-10 mb-[-6rem]"
            >
              <h1 className="text-[3rem] md:text-[4rem] lg:text-[5rem] text-secondary tracking-widest" style={{ fontFamily: 'Rocketbrush' }}>
                THE CHAMPION
              </h1>
            </motion.div>
            
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.5, type: 'spring', bounce: 0.6 }}
              className="relative z-10 flex flex-col items-center mt-0"
            >
              {getRapperPngImage(winner.rapper.name) && (
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.8, duration: 0.8, type: 'spring' }}
                  className="mb-[-4vh] md:mb-[-10vh] lg:mb-[-15vh] relative z-0"
                >
                  <img 
                    src={getRapperPngImage(winner.rapper.name)!}
                    alt={winner.rapper.name}
                    className="w-[30vh] h-[30vh] md:w-[45vh] md:h-[45vh] lg:w-[50vh] lg:h-[50vh] object-contain drop-shadow-[0_0_80px_rgba(146,208,32,0.8)] scale-110"
                  />
                </motion.div>
              )}

              <h2 className={`${winner.rapper.name.length > 10 ? 'text-6xl' : 'text-8xl'} text-primary font-bold mb-2 relative z-10 break-words`} style={{ textShadow: 'var(--green-glow-strong)', wordBreak: 'keep-all' }}>
                {winner.rapper.name}
              </h2>
              <p className="text-3xl text-secondary tracking-[0.2em] uppercase mb-0 relative z-10" style={{ fontFamily: 'Rocketbrush' }}>{winner.team?.name}</p>
            </motion.div>
          </>
        ) : (
          <>
            <h1 className="text-4xl md:text-5xl text-secondary mb-4 tracking-widest relative z-10" style={{ fontFamily: 'Rocketbrush' }}>
              THE CHAMPION
            </h1>
            <h2 className="text-[8rem] md:text-[10rem] text-primary relative z-10" style={{ fontFamily: 'Rocketbrush', textShadow: 'var(--green-glow-strong)' }}>
              WINNER
            </h2>
          </>
        )}
      </motion.div>
    );
  }

  return null;
}

function TimerVisual({ seconds: initialSeconds, label, alertAt = 10, isCountdown = false }: { seconds: number, label: string, alertAt?: number, isCountdown?: boolean }) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);

  useEffect(() => {
    setTimeLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const isAlert = timeLeft <= alertAt && timeLeft > 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center h-full min-h-full w-full ${!isCountdown ? 'pb-[120px]' : ''}`}
    >
      <div className="flex justify-center mb-8">
        <img
          src={logo}
          alt="Beast Beats Logo"
          className="h-24 md:h-32 lg:h-40 w-auto object-contain"
          style={{ mixBlendMode: 'lighten' }}
        />
      </div>
      <h2 className="text-2xl md:text-3xl text-muted-foreground tracking-widest mb-6 md:mb-8" style={{ fontFamily: 'Rocketbrush' }}>{label}</h2>
      <motion.div
        animate={isAlert ? { scale: [1, 1.05, 1], color: ['#ef4444', '#ffffff', '#ef4444'] } : {}}
        transition={isAlert ? { duration: 0.5, repeat: Infinity } : {}}
        className="text-[8rem] md:text-[10rem] lg:text-[12rem] font-bold font-mono leading-none"
        style={{ color: isAlert ? '#ef4444' : 'var(--primary)', textShadow: isAlert ? '0 0 50px #ef4444' : 'var(--green-glow)' }}
      >
        {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
      </motion.div>
    </motion.div>
  );
}

export function BeastBarVisual() {
  const [micState, setMicState] = useState<'checking' | 'prompt' | 'granted' | 'denied'>('checking');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>(0);
  const peakLevelRef = useRef<number>(0);

  const startMic = async () => {
    if (streamRef.current) return; // Already started
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;
      
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64; // Small fftSize for thick bars
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      
      setMicState('granted');
      console.log('Beast Bar: Live mic mode activated');
    } catch (err) {
      console.error('Mic access denied or failed:', err);
      setMicState('denied');
      console.log('Beast Bar: Fallback visualizer mode activated');
    }
  };

  useEffect(() => {
    let isSubscribed = true;
    let permissionStatus: PermissionStatus | null = null;

    const checkPermission = async () => {
      try {
        permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (!isSubscribed) return;

        const updateState = () => {
          if (!isSubscribed) return;
          if (permissionStatus) {
            if (permissionStatus.state === 'granted') {
              setMicState('granted');
              startMic();
            } else if (permissionStatus.state === 'denied') {
              setMicState('denied');
            } else {
              setMicState('prompt');
            }
          }
        };

        updateState();
        permissionStatus.onchange = updateState;
      } catch (err) {
        console.warn('navigator.permissions.query failed:', err);
        if (isSubscribed) setMicState('prompt');
      }
    };

    checkPermission();

    return () => {
      isSubscribed = false;
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, []);

  useEffect(() => {
    if (micState === 'checking' || micState === 'prompt' || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);
      
      const numSegments = 24;
      const columnWidth = 400; // Wider column for better visibility
      const segmentHeight = (height / numSegments) * 0.7;
      const segmentGap = (height / numSegments) * 0.3;
      
      const x = (width - columnWidth) / 2;
      
      let level = 0;
      
      if (micState === 'granted' && analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average volume from lower/mid frequencies
        let sum = 0;
        const binsToAverage = 20;
        for (let i = 0; i < binsToAverage; i++) {
          sum += dataArray[i];
        }
        const avg = sum / binsToAverage;
        const percent = avg / 255;
        
        // Apply gain/scaling so it looks active
        level = Math.min(1, percent * 1.5);
      } else {
        // Fallback visualizer (pseudo-random simulated volume)
        const time = Date.now() / 200;
        const noise = Math.sin(time) * 0.3 + 0.5 + (Math.random() * 0.2);
        level = Math.min(1, Math.max(0.05, noise));
      }
      
      // Update peak hold with decay
      peakLevelRef.current = Math.max(level, peakLevelRef.current - 0.015);
      
      for (let i = 0; i < numSegments; i++) {
        // i = 0 is the bottom segment, numSegments - 1 is the top
        const threshold = i / numSegments;
        const isLit = level > threshold;
        const isPeak = Math.floor(peakLevelRef.current * numSegments) === i;
        
        // Calculate y from top to bottom. i=0 should be near the bottom of canvas.
        const y = height - (i * (height / numSegments)) - segmentHeight - (segmentGap / 2);
        
        if (isLit || isPeak) {
          // Glow and bright
          const intensity = i / numSegments; // 0 at bottom, 1 at top
          // Subtle color shift from deeper green to brighter green, staying in Monster palette
          ctx.fillStyle = '#92d020';
          if (intensity > 0.8) ctx.fillStyle = '#b2f030';
          
          ctx.shadowColor = '#92d020';
          ctx.shadowBlur = 25;
        } else {
          // Dim / unlit state
          ctx.fillStyle = '#1a2608'; // Very dark Monster green
          ctx.shadowBlur = 0;
        }
        
        // Draw rounded rectangle for the segment
        const radius = segmentHeight / 2;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + columnWidth - radius, y);
        ctx.quadraticCurveTo(x + columnWidth, y, x + columnWidth, y + radius);
        ctx.lineTo(x + columnWidth, y + segmentHeight - radius);
        ctx.quadraticCurveTo(x + columnWidth, y + segmentHeight, x + columnWidth - radius, y + segmentHeight);
        ctx.lineTo(x + radius, y + segmentHeight);
        ctx.quadraticCurveTo(x, y + segmentHeight, x, y + segmentHeight - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
      }
    };
    
    draw();
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [micState]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount ONLY, not on every render
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  if (micState === 'checking') {
    return <div className="h-full w-full bg-black" />; // Avoid flash before permission resolves
  }

  if (micState === 'prompt') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center h-full min-h-full w-full bg-black relative"
      >
        <img
          src={logo}
          alt="Beast Beats Logo"
          className="w-48 object-contain mb-8"
          style={{ filter: 'drop-shadow(0 0 20px rgba(146, 208, 32, 0.4))' }}
        />
        <h1 className="text-6xl text-primary mb-12" style={{ fontFamily: 'Rocketbrush', textShadow: 'var(--green-glow)' }}>BEAST BAR</h1>
        <button
          onClick={startMic}
          className="flex items-center gap-3 bg-primary/20 border-2 border-primary text-primary px-8 py-4 rounded-full text-xl hover:bg-primary/30 transition-all shadow-[0_0_20px_rgba(146,208,32,0.4)]"
        >
          <Mic className="w-6 h-6" />
          <span className="font-bold tracking-widest">ENABLE MIC FOR LIVE METER</span>
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-full min-h-full w-full bg-black relative overflow-hidden pb-12 pt-12 px-8"
    >
      <div className="flex flex-col items-center z-10 shrink-0 mb-8">
        <img
          src={logo}
          alt="Beast Beats Logo"
          className="w-32 md:w-48 object-contain mb-4"
          style={{ filter: 'drop-shadow(0 0 20px rgba(146, 208, 32, 0.4))' }}
        />
        <h1 className="text-6xl md:text-8xl text-primary" style={{ fontFamily: 'Rocketbrush', textShadow: 'var(--green-glow-strong)' }}>
          BEAST BAR
        </h1>
        {micState === 'denied' && (
          <div className="flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full bg-red-500/20 border border-red-500/50 text-red-500 text-xs">
            <MicOff className="w-3 h-3" />
            <span className="tracking-widest uppercase">Mic Unavailable - Simulated Mode</span>
          </div>
        )}
      </div>
      
      <div className="flex-1 w-full relative flex items-end justify-center px-4">
        <canvas 
          ref={canvasRef} 
          className="w-full h-full max-h-[600px]"
          width={1000} 
          height={600}
        />
      </div>
    </motion.div>
  );
}
