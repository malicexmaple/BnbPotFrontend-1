import { useEffect, useState } from "react";
import loadingLogo from "@assets/3dgifmaker85766_1764628423703.gif";

interface LoadingScreenProps {
  minDuration?: number;
  onComplete?: () => void;
  showProgress?: boolean;
  message?: string;
}

export default function LoadingScreen({ 
  minDuration = 0, 
  onComplete,
  showProgress = false,
  message = "Loading..."
}: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!showProgress) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const increment = Math.random() * 15 + 5;
        return Math.min(prev + increment, 100);
      });
    }, 150);

    return () => clearInterval(interval);
  }, [showProgress]);

  useEffect(() => {
    if (minDuration > 0 && onComplete) {
      const timer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(onComplete, 300);
      }, minDuration);
      return () => clearTimeout(timer);
    }
  }, [minDuration, onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-300 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #121212 50%, #0a0a0a 100%)'
      }}
      data-testid="loading-screen"
    >
      <div className="relative flex flex-col items-center">
        <div className="relative">
          <div 
            className="absolute inset-0 blur-3xl opacity-30"
            style={{
              background: 'radial-gradient(circle, rgba(234, 179, 8, 0.4) 0%, transparent 70%)'
            }}
          />
          <img 
            src={loadingLogo} 
            alt="BNBPOT Loading" 
            className="w-32 h-32 sm:w-40 sm:h-40 relative z-10 drop-shadow-2xl"
            style={{
              filter: 'drop-shadow(0 0 20px rgba(234, 179, 8, 0.5))'
            }}
            data-testid="img-loading-logo"
          />
        </div>
        
        <div className="mt-6 text-center">
          <h2 
            className="text-2xl sm:text-3xl font-bold tracking-wider"
            style={{
              background: 'linear-gradient(135deg, #EAB308 0%, #FCD34D 50%, #EAB308 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 30px rgba(234, 179, 8, 0.3)'
            }}
          >
            BNBPOT
          </h2>
          <p className="text-muted-foreground text-sm mt-2 tracking-widest uppercase">
            {message}
          </p>
        </div>

        {showProgress && (
          <div className="mt-6 w-48 sm:w-64">
            <div 
              className="h-1 rounded-full overflow-hidden"
              style={{ background: 'rgba(255, 255, 255, 0.1)' }}
            >
              <div 
                className="h-full rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #EAB308 0%, #FCD34D 100%)',
                  boxShadow: '0 0 10px rgba(234, 179, 8, 0.5)'
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2 font-mono">
              {Math.round(progress)}%
            </p>
          </div>
        )}

        <div className="absolute -z-10">
          <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full opacity-10 animate-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(234, 179, 8, 0.3) 0%, transparent 70%)'
            }}
          />
        </div>
      </div>

      <div className="absolute bottom-8 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

export function PageTransitionLoader() {
  return (
    <div 
      className="flex flex-col items-center justify-center h-screen"
      style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #121212 50%, #0a0a0a 100%)'
      }}
      data-testid="page-transition-loader"
    >
      <div className="relative">
        <div 
          className="absolute inset-0 blur-2xl opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(234, 179, 8, 0.4) 0%, transparent 70%)'
          }}
        />
        <img 
          src={loadingLogo} 
          alt="Loading" 
          className="w-24 h-24 relative z-10"
          style={{
            filter: 'drop-shadow(0 0 15px rgba(234, 179, 8, 0.4))'
          }}
        />
      </div>
      <div className="mt-4 flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
