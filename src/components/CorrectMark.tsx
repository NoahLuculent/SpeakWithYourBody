import { useEffect, useState } from "react";

interface CorrectMarkProps {
  show: boolean;
  onComplete?: () => void;
}

export const CorrectMark = ({ show, onComplete }: CorrectMarkProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
      <div className="relative animate-success-pop">
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl scale-150" />
        
        {/* Main circle */}
        <svg
          width="200"
          height="200"
          viewBox="0 0 200 200"
          className="drop-shadow-[0_0_40px_hsl(var(--primary))]"
        >
          {/* Circle background with gradient */}
          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(45, 93%, 58%)" />
              <stop offset="100%" stopColor="hsl(30, 100%, 60%)" />
            </linearGradient>
          </defs>
          
          {/* Outer circle stroke */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="url(#goldGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            className="animate-[draw-circle_0.5s_ease-out_forwards]"
            style={{
              strokeDasharray: 565,
              strokeDashoffset: 0,
            }}
          />
          
          {/* Inner glow */}
          <circle
            cx="100"
            cy="100"
            r="75"
            fill="hsl(var(--primary) / 0.1)"
          />
        </svg>
      </div>
    </div>
  );
};
