import { motion, AnimatePresence } from 'framer-motion';
import { Rapper, Team, BroadcastState } from '../types';
import { Smile, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import logo from '../../imports/Monster_Beast_Beats_To_Ehab_Fahem-1_copy.png';

// Import judge photos
import ziadPhoto from '../../styles/photos/ziad.jpg';
import shahynPhoto from '../../styles/photos/shahyn.jpg';
import alyPhoto from '../../styles/photos/aly.jpg';
import shehabPhoto from '../../styles/photos/shehab.jpg';

const photos = import.meta.glob('../../styles/photos/*.{jpeg,JPEG,jpg,png}', { query: '?url', import: 'default', eager: true }) as Record<string, string>;

const getRapperPngImage = (name: string) => {
  const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const customMap: Record<string, string> = {
    'therealdopie': 'therealdopie',
    'dezelelgenral': 'dezel',
    'hazemhany': 'hazem',
  };
  const searchKey = customMap[normalizedName] || normalizedName;
  const match = Object.keys(photos).find(path => path.toLowerCase().includes(searchKey) && path.toLowerCase().endsWith('.png'));
  return match ? photos[match] : null;
};

interface VisualProps {
  state: BroadcastState;
  rappers: Rapper[];
  teams: Team[];
  winner?: { rapper: Rapper; team?: Team; cumulative: number };
}

export function GeneralVisuals({ state }: VisualProps) {
  if (state.mode === 'intro-logos') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.2 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        className="flex flex-col items-center justify-center min-h-screen relative"
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
          className="w-[350px] md:w-[500px] lg:w-[650px] object-contain relative z-10 max-h-[80vh]"
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
        className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden bg-background"
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

        <div className="relative z-10 flex flex-col items-center justify-center max-w-3xl p-12 md:p-20">
          <motion.div
            animate={{ 
              opacity: [0.7, 1, 0.7],
              scale: [0.95, 1.05, 0.95],
              filter: ['drop-shadow(0 0 10px rgba(146,208,32,0.3))', 'drop-shadow(0 0 40px rgba(146,208,32,0.9))', 'drop-shadow(0 0 10px rgba(146,208,32,0.3))'] 
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="mb-8"
          >
            <Smile className="w-32 h-32 md:w-48 md:h-48 text-primary" strokeWidth={1.5} />
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
            className="text-7xl md:text-9xl text-primary leading-none mb-4 tracking-widest" 
            style={{ fontFamily: 'Rocketbrush', textShadow: '0 0 30px rgba(146, 208, 32, 0.6)' }}
            animate={{ scale: [1, 1.02, 1], textShadow: ['0 0 20px rgba(146,208,32,0.4)', '0 0 40px rgba(146,208,32,0.8)', '0 0 20px rgba(146,208,32,0.4)'] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            SMILE
          </motion.h1>
          
          <h2 className="text-2xl md:text-4xl font-bold text-foreground tracking-[0.4em] uppercase mt-2 text-center">
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
    return <TimerVisual seconds={state.timerSeconds || 300} label="STARTING IN" />;
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
      <div className="flex flex-col items-center justify-center min-h-screen gap-12 w-full px-12">
        {state.mode === 'judges-cards' && <h2 className="text-4xl text-primary tracking-widest mb-8" style={{ fontFamily: 'Rocketbrush' }}>THE JUDGES</h2>}
        <div className={`grid gap-8 w-full ${judgesToShow.length === 1 ? 'max-w-md' : 'grid-cols-2 md:grid-cols-4 max-w-7xl'}`}>
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
                    className="w-full h-full object-cover object-bottom opacity-80 mix-blend-screen"
                    style={{ filter: 'contrast(1.2) grayscale(0.2)' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              )}

              {/* Text Layer */}
              <h3 className={`${judgesToShow.length === 1 ? 'text-5xl md:text-7xl mb-2' : 'text-3xl md:text-5xl'} text-primary relative z-10 w-full`} style={{ fontFamily: 'Rocketbrush', textShadow: 'var(--green-glow-strong)' }}>{j}</h3>

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
      'round-1-intro': { title: 'ROUND ONE', subtitle: 'FREESTYLE & CYPHER' },
      'round-2-intro': { title: 'ROUND TWO', subtitle: 'BEAT ROULETTE' },
      'round-3-intro': { title: 'ROUND THREE', subtitle: 'THE FINAL CLASH' }
    };
    const { title, subtitle } = roundMap[state.mode as keyof typeof roundMap];

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 2, filter: 'blur(20px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="flex flex-col items-center justify-center min-h-screen text-center"
      >
        <div className="flex justify-center mb-8 md:mb-12">
          <img
            src={logo}
            alt="Beast Beats Logo"
            className="w-[250px] md:w-[350px] lg:w-[450px] object-contain"
            style={{ mixBlendMode: 'lighten' }}
          />
        </div>
        <h1 className="text-7xl md:text-[10rem] text-primary mb-6" style={{ fontFamily: 'Rocketbrush', textShadow: 'var(--green-glow-strong)' }}>
          {title}
        </h1>
        <motion.h2 
          className="text-3xl md:text-6xl text-secondary tracking-widest"
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

export function FinalistsVisuals({ state, rappers, teams, winner }: VisualProps) {
  if (state.mode === 'wild-card') {
    const wildCardRapper = state.currentRapperId ? rappers.find(r => r.id === state.currentRapperId) : null;
    const team = wildCardRapper ? teams.find(t => t.id === wildCardRapper.teamId) : null;

    return (
      <motion.div 
        initial={{ opacity: 0, rotate: -10, scale: 0 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ type: 'spring', damping: 15, stiffness: 100 }}
        className="flex flex-col items-center justify-center min-h-screen"
      >
        <h1 className="text-7xl md:text-[8rem] text-secondary mb-12" style={{ fontFamily: 'Rocketbrush' }}>
          WILD CARD
        </h1>
        {wildCardRapper ? (
          <div className="flex flex-col items-center">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="w-80 h-80 md:w-96 md:h-96 border-4 border-primary bg-primary/10 rounded-full flex flex-col items-center justify-center text-center overflow-hidden mb-8 relative" 
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
               <h2 className="text-5xl md:text-6xl text-primary font-bold mb-2" style={{ textShadow: 'var(--green-glow-strong)' }}>{wildCardRapper.name}</h2>
               <p className="text-2xl text-secondary tracking-widest" style={{ fontFamily: 'Rocketbrush' }}>{team?.name}</p>
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
    return (
      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-screen px-8"
      >
        <h1 className="text-6xl md:text-8xl text-primary mb-16" style={{ fontFamily: 'Rocketbrush', textShadow: 'var(--green-glow)' }}>TOP 4 FINALISTS</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-7xl">
          {[1,2,3,4].map((i) => (
            <div key={i} className="aspect-square border border-primary/50 bg-card/50 rounded-2xl flex flex-col items-center justify-center">
              <span className="text-8xl text-muted-foreground/20 font-bold absolute">0{i}</span>
              <h3 className="text-4xl text-primary z-10" style={{ fontFamily: 'Rocketbrush' }}>TBD</h3>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (state.mode === 'finalists-vs') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 1.5 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-row items-center justify-center min-h-screen w-full relative overflow-hidden"
      >
        <div className="flex-1 h-screen bg-primary/10 border-r-4 border-primary flex items-center justify-center">
          <h2 className="text-6xl md:text-9xl text-primary" style={{ fontFamily: 'Rocketbrush' }}>FINALIST A</h2>
        </div>
        <div className="absolute z-10 w-48 h-48 bg-background border-4 border-primary rounded-full flex items-center justify-center" style={{ boxShadow: 'var(--green-glow-strong)' }}>
          <span className="text-6xl text-primary font-bold italic">VS</span>
        </div>
        <div className="flex-1 h-screen bg-secondary/10 border-l-4 border-secondary flex items-center justify-center">
          <h2 className="text-6xl md:text-9xl text-secondary" style={{ fontFamily: 'Rocketbrush' }}>FINALIST B</h2>
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
        className="flex flex-col items-center justify-center min-h-screen text-center relative"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute w-[800px] h-[800px] border-[20px] border-dashed border-primary/20 rounded-full"
        />
        
        {winner ? (
          <>
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
              className="relative z-10"
            >
              <h1 className="text-4xl md:text-6xl text-secondary mb-2 tracking-widest" style={{ fontFamily: 'Rocketbrush' }}>
                THE CHAMPION
              </h1>
            </motion.div>
            
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.5, type: 'spring', bounce: 0.6 }}
              className="relative z-10 flex flex-col items-center mt-6 p-12 border-2 border-primary bg-background/80 backdrop-blur-md rounded-3xl"
              style={{ boxShadow: '0 0 100px rgba(146, 208, 32, 0.5)' }}
            >
              <h2 className="text-7xl md:text-9xl text-primary font-bold mb-4" style={{ textShadow: 'var(--green-glow-strong)' }}>
                {winner.rapper.name}
              </h2>
              <p className="text-3xl text-muted-foreground tracking-[0.2em] uppercase mb-6">{winner.team?.name}</p>
              <div className="text-5xl text-foreground font-mono font-bold bg-primary/20 px-8 py-4 rounded-xl border border-primary/50">
                SCORE: {winner.cumulative}
              </div>
            </motion.div>
          </>
        ) : (
          <>
            <h1 className="text-6xl md:text-8xl text-secondary mb-4 tracking-widest relative z-10" style={{ fontFamily: 'Rocketbrush' }}>
              THE CHAMPION
            </h1>
            <h2 className="text-8xl md:text-[12rem] text-primary relative z-10" style={{ fontFamily: 'Rocketbrush', textShadow: 'var(--green-glow-strong)' }}>
              WINNER
            </h2>
          </>
        )}
      </motion.div>
    );
  }

  return null;
}

function TimerVisual({ seconds: initialSeconds, label, alertAt = 10 }: { seconds: number, label: string, alertAt?: number }) {
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
      className="flex flex-col items-center justify-center min-h-screen"
    >
      <div className="flex justify-center mb-8">
        <img
          src={logo}
          alt="Beast Beats Logo"
          className="h-32 md:h-48 lg:h-56 w-auto object-contain"
          style={{ mixBlendMode: 'lighten' }}
        />
      </div>
      <h2 className="text-4xl text-muted-foreground tracking-widest mb-12" style={{ fontFamily: 'Rocketbrush' }}>{label}</h2>
      <motion.div
        animate={isAlert ? { scale: [1, 1.05, 1], color: ['#ef4444', '#ffffff', '#ef4444'] } : {}}
        transition={isAlert ? { duration: 0.5, repeat: Infinity } : {}}
        className="text-[10rem] md:text-[15rem] font-bold font-mono leading-none"
        style={{ color: isAlert ? '#ef4444' : 'var(--primary)', textShadow: isAlert ? '0 0 50px #ef4444' : 'var(--green-glow)' }}
      >
        {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
      </motion.div>
    </motion.div>
  );
}
