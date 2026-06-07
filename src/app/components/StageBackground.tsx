import { useEffect, useRef } from 'react';

export default function StageBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Floating particles
    class Particle {
      x: number;
      y: number;
      size: number;
      speed: number;
      opacity: number;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + Math.random() * 100;
        this.size = Math.random() * 3 + 1;
        this.speed = Math.random() * 0.5 + 0.3;
        this.opacity = Math.random() * 0.3 + 0.1;
      }

      update() {
        this.y -= this.speed;
        if (this.y < -10) {
          this.y = canvas.height + 10;
          this.x = Math.random() * canvas.width;
        }
      }

      draw() {
        ctx.fillStyle = `rgba(146, 208, 32, ${this.opacity})`;
        ctx.fillRect(this.x, this.y, this.size, this.size);
      }
    }

    const particles: Particle[] = [];
    for (let i = 0; i < 30; i++) {
      particles.push(new Particle());
    }

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw particles
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <>
      {/* Canvas for particles */}
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
      />

      {/* Pulsing radial glow */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(146, 208, 32, 0.15) 0%, transparent 70%)',
          animation: 'pulse-beat 0.8s ease-in-out infinite',
          zIndex: 1,
        }}
      />

      {/* Audio equalizer bars */}
      <div className="fixed bottom-0 left-0 right-0 flex items-end justify-center gap-1 px-4 pb-4 pointer-events-none" style={{ zIndex: 1, height: '120px' }}>
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="flex-1 max-w-[12px] rounded-t-sm"
            style={{
              backgroundColor: 'rgba(146, 208, 32, 0.6)',
              height: '20%',
              animation: `equalizer ${Math.random() * 0.3 + 0.4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 0.5}s`,
              boxShadow: i % 5 === 0 ? '0 0 10px rgba(146, 208, 32, 0.8)' : 'none',
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes pulse-beat {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.15);
            opacity: 0.8;
          }
        }

        @keyframes equalizer {
          0%, 100% {
            height: 20%;
          }
          50% {
            height: 85%;
          }
        }
      `}</style>
    </>
  );
}
