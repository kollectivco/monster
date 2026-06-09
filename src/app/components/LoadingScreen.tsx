import logo from '../../imports/logo.webp';

interface LoadingScreenProps {
  status?: string;
}

export default function LoadingScreen({ status = 'CONNECTING...' }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center overflow-hidden">
      {/* Pulsing radial glow behind logo */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(146, 208, 32, 0.2) 0%, transparent 70%)',
          animation: 'pulse-glow 2s ease-in-out infinite',
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.3 + 0.1,
              animation: `float-particle ${Math.random() * 3 + 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo */}
        <div className="mb-12">
          <img
            src={logo}
            alt="Beast Beats"
            className="h-40 md:h-48 w-auto object-contain"
            style={{
              mixBlendMode: 'lighten',
              animation: 'logo-pulse 2s ease-in-out infinite',
            }}
          />
        </div>

        {/* Equalizer bars */}
        <div className="flex items-end justify-center gap-1.5 mb-8 h-16">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="w-2 rounded-t-sm bg-primary"
              style={{
                height: '30%',
                animation: `equalizer-load ${Math.random() * 0.4 + 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.05}s`,
                boxShadow: '0 0 8px rgba(146, 208, 32, 0.6)',
              }}
            />
          ))}
        </div>

        {/* Circular spinner */}
        <div className="relative w-16 h-16 mb-6">
          <svg className="w-full h-full" viewBox="0 0 50 50">
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="rgba(146, 208, 32, 0.2)"
              strokeWidth="3"
            />
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="#92d020"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="80, 200"
              style={{
                animation: 'spin-loader 1.5s linear infinite',
                filter: 'drop-shadow(0 0 4px rgba(146, 208, 32, 0.8))',
              }}
            />
          </svg>
        </div>

        {/* Status text */}
        <p
          className="text-xs tracking-widest"
          style={{
            color: '#8a958a',
            fontSize: '0.7rem',
            animation: 'fade-pulse 2s ease-in-out infinite',
          }}
        >
          {status}
        </p>
      </div>

      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0.8;
          }
        }

        @keyframes logo-pulse {
          0%, 100% {
            opacity: 0.9;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.02);
          }
        }

        @keyframes equalizer-load {
          0%, 100% {
            height: 30%;
          }
          50% {
            height: 90%;
          }
        }

        @keyframes spin-loader {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes float-particle {
          0%, 100% {
            transform: translateY(0px);
            opacity: 0.1;
          }
          50% {
            transform: translateY(-20px);
            opacity: 0.3;
          }
        }

        @keyframes fade-pulse {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
