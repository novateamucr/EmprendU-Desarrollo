import React, { useEffect, useMemo, useState } from 'react';

interface ConfettiOverlayProps {
  active: boolean;
  durationMs?: number; // default 1200
}

// Lightweight CSS confetti without external deps
export const ConfettiOverlay: React.FC<ConfettiOverlayProps> = ({ active, durationMs = 1200 }) => {
  const [visible, setVisible] = useState(false);
  const pieces = useMemo(() => 120, []);

  useEffect(() => {
    if (!active) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), durationMs);
    return () => clearTimeout(t);
  }, [active, durationMs]);

  if (!visible) return null;

  const colors = ['#FFD166', '#06D6A0', '#EF476F', '#118AB2', '#8338EC', '#FF9F1C'];

  return (
    <div className="confetti-overlay" aria-hidden>
      {[...Array(pieces)].map((_, i) => {
        const left = Math.random() * 100; // vw
        const size = 6 + Math.random() * 6; // px
        const delay = Math.random() * 150; // ms
        const rotate = Math.random() * 360;
        const color = colors[i % colors.length];
        const duration = 700 + Math.random() * 900; // ms
        return (
          <span
            key={i}
            className="confetti-piece"
            style={{
              left: `${left}vw`,
              width: size,
              height: size * 0.6,
              backgroundColor: color,
              animationDelay: `${delay}ms`,
              animationDuration: `${duration}ms`,
              transform: `rotate(${rotate}deg)`
            }}
          />
        );
      })}
      <style>{`
        .confetti-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          z-index: 9999;
        }
        .confetti-piece {
          position: absolute;
          top: -10px;
          border-radius: 1px;
          opacity: 0.9;
          animation-name: confetti-fall;
          animation-timing-function: linear;
        }
        @keyframes confetti-fall {
          0% {
            transform: translate3d(0, -20px, 0) rotate(0deg);
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translate3d(calc(-20px + (var(--drift, 0) * 1px)), 100vh, 0) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
