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
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{
        background: 'rgba(0, 0, 0, 0.92)',
        backdropFilter: 'blur(8px)',
        borderRadius: '21px'
      }}
      data-testid="overlay-mining-block"
    >
      <div className="flex flex-col items-center gap-4">
        {/* Animated Cube Icon */}
        <div className="relative">
          <div 
            className="w-20 h-20 rounded-xl flex items-center justify-center animate-pulse"
            style={{
              background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.3), rgba(250, 204, 21, 0.3))',
              border: '2px solid rgba(234, 179, 8, 0.6)',
              boxShadow: '0 0 30px rgba(234, 179, 8, 0.5), inset 0 0 15px rgba(234, 179, 8, 0.2)'
            }}
          >
            <svg 
              className="w-14 h-14" 
              viewBox="0 0 24 24" 
              fill="none"
              style={{
                filter: 'drop-shadow(0 0 8px rgba(250, 204, 21, 0.8))'
              }}
            >
              <path 
                d="M12 2L4 6v12l8 4 8-4V6l-8-4z" 
                fill="rgba(250, 204, 21, 0.4)" 
                stroke="#FACC15" 
                strokeWidth="2"
              />
              <path 
                d="M12 12L4 8m8 4l8-4m-8 4v8" 
                stroke="#FCD34D" 
                strokeWidth="2"
              />
            </svg>
          </div>
          
          {/* Rotating Ring */}
          <div 
            className="absolute inset-0 rounded-xl animate-spin"
            style={{
              border: '3px solid transparent',
              borderTopColor: '#FACC15',
              borderRightColor: '#FACC15',
              animationDuration: '2s'
            }}
          />
        </div>

        {/* Mining Block Text */}
        <div className="text-center space-y-2">
          <h2 
            className="text-3xl font-bold uppercase tracking-wider"
            style={{
              background: 'linear-gradient(135deg, #FACC15, #FCD34D)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 20px rgba(234, 179, 8, 0.4)',
              fontStyle: 'italic'
            }}
          >
            MINING BLOCK
          </h2>
          
          <div 
            className="text-sm font-mono"
            style={{
              color: 'rgba(250, 204, 21, 0.9)'
            }}
          >
            Waiting for BSC Block: <span className="font-bold" style={{color: '#FCD34D'}}>#{blockNumber || '...'}</span>
          </div>

          {/* Loading Animation */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <div 
              className="w-2 h-2 rounded-full animate-bounce"
              style={{
                background: '#FACC15',
                boxShadow: '0 0 8px #FACC15',
                animationDelay: '0s'
              }}
            />
            <div 
              className="w-2 h-2 rounded-full animate-bounce"
              style={{
                background: '#FACC15',
                boxShadow: '0 0 8px #FACC15',
                animationDelay: '0.2s'
              }}
            />
            <div 
              className="w-2 h-2 rounded-full animate-bounce"
              style={{
                background: '#FACC15',
                boxShadow: '0 0 8px #FACC15',
                animationDelay: '0.4s'
              }}
            />
          </div>

          <div 
            className="text-xs font-mono"
            style={{color: 'rgba(161, 161, 170, 0.8)'}}
            data-testid="text-mining-status"
          >
            Selecting winner{dots}
          </div>
        </div>
      </div>
    </div>
  );
}
