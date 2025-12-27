import { useEffect, useState } from 'react';

interface SuccessAnimationProps {
  show: boolean;
  onComplete?: () => void;
}

export const SuccessAnimation = ({ show, onComplete }: SuccessAnimationProps) => {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      setAnimating(true);
      
      const timer = setTimeout(() => {
        setAnimating(false);
        setTimeout(() => {
          setVisible(false);
          onComplete?.();
        }, 300);
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!visible) return null;

  return (
    <div className="success-circle">
      <div
        className={`relative transition-all duration-500 ${
          animating ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        }`}
      >
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full bg-firework-blue/20 blur-3xl scale-150" />
        
        {/* Main circle */}
        <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-firework-blue to-blue-600 flex items-center justify-center shadow-2xl shadow-firework-blue/50 animate-success-pop">
          {/* Inner glow */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-white/30 to-transparent" />
          
          {/* Check mark / O */}
          <svg
            viewBox="0 0 100 100"
            className="w-32 h-32 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="50" cy="50" r="35" className="animate-[scale-in_0.3s_ease-out_0.2s_both]" />
          </svg>
        </div>

        {/* Burst particles */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-4 h-4 rounded-full bg-firework-blue animate-firework"
            style={{
              top: '50%',
              left: '50%',
              transform: `rotate(${i * 45}deg) translateY(-100px)`,
              animationDelay: `${i * 0.05}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
