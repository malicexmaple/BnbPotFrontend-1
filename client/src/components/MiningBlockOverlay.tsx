import { useEffect, useState } from "react";

interface MiningBlockOverlayProps {
  onComplete?: () => void;
  blockNumber?: number;
}

export default function MiningBlockOverlay({ onComplete, blockNumber }: MiningBlockOverlayProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "" : prev + ".");
    }, 500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Auto-complete after 3 seconds
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(10px)'
      }}
      data-testid="overlay-mining-block"
    >
      <div className="flex flex-col items-center gap-6">
        {/* Animated Cube Icon */}
        <div className="relative">
          <div 
            className="w-24 h-24 rounded-2xl flex items-center justify-center animate-pulse"
            style={{
              background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(168, 85, 247, 0.3))',
              border: '2px solid rgba(147, 51, 234, 0.5)',
              boxShadow: '0 0 40px rgba(147, 51, 234, 0.6), inset 0 0 20px rgba(147, 51, 234, 0.3)'
            }}
          >
            <svg 
              className="w-16 h-16" 
              viewBox="0 0 24 24" 
              fill="none"
              style={{
                filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.8))'
              }}
            >
              <path 
                d="M12 2L4 6v12l8 4 8-4V6l-8-4z" 
                fill="rgba(168, 85, 247, 0.4)" 
                stroke="#a855f7" 
                strokeWidth="2"
              />
              <path 
                d="M12 12L4 8m8 4l8-4m-8 4v8" 
                stroke="#c084fc" 
                strokeWidth="2"
              />
            </svg>
          </div>
          
          {/* Rotating Ring */}
          <div 
            className="absolute inset-0 rounded-2xl animate-spin"
            style={{
              border: '3px solid transparent',
              borderTopColor: '#a855f7',
              borderRightColor: '#a855f7',
              animationDuration: '2s'
            }}
          />
        </div>

        {/* Mining Block Text */}
        <div className="text-center space-y-3">
          <h2 
            className="text-5xl font-bold uppercase tracking-wider"
            style={{
              background: 'linear-gradient(135deg, #a855f7, #c084fc)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 30px rgba(168, 85, 247, 0.5)',
              fontStyle: 'italic'
            }}
          >
            MINING BLOCK
          </h2>
          
          <div 
            className="text-lg font-mono"
            style={{
              color: 'rgba(168, 85, 247, 0.9)'
            }}
          >
            Waiting for BSC Block: <span className="font-bold text-purple-400">#{blockNumber || '...'}</span>
          </div>

          {/* Loading Animation */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <div 
              className="w-2 h-2 rounded-full animate-bounce"
              style={{
                background: '#a855f7',
                boxShadow: '0 0 10px #a855f7',
                animationDelay: '0s'
              }}
            />
            <div 
              className="w-2 h-2 rounded-full animate-bounce"
              style={{
                background: '#a855f7',
                boxShadow: '0 0 10px #a855f7',
                animationDelay: '0.2s'
              }}
            />
            <div 
              className="w-2 h-2 rounded-full animate-bounce"
              style={{
                background: '#a855f7',
                boxShadow: '0 0 10px #a855f7',
                animationDelay: '0.4s'
              }}
            />
          </div>

          <div 
            className="text-sm text-muted-foreground font-mono"
            data-testid="text-mining-status"
          >
            Selecting winner{dots}
          </div>
        </div>
      </div>
    </div>
  );
}
