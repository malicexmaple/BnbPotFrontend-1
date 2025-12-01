import { useState, useEffect } from "react";
import { RotateCcw } from "lucide-react";
import bnbLogoGif from "@assets/3dgifmaker85766_1764628423703.gif";

export default function RotateDeviceOverlay() {
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = window.innerWidth <= 768 || 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      const isPortrait = window.innerHeight > window.innerWidth;
      
      setShowOverlay(isMobile && isPortrait);
    };

    checkOrientation();

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!showOverlay) return null;

  return (
    <div 
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-center gap-6 p-8"
      style={{ background: '#0a0a0a' }}
      data-testid="overlay-rotate-device"
    >
      <img 
        src={bnbLogoGif} 
        alt="BNB" 
        className="w-20 h-20 mb-2"
      />

      <div className="relative">
        <div 
          className="w-20 h-36 rounded-xl border-4 border-primary flex items-center justify-center"
          style={{
            animation: 'rotatePhone 2s ease-in-out infinite',
          }}
        >
          <div className="w-12 h-1 bg-primary/50 rounded-full" />
        </div>
        <RotateCcw 
          className="absolute -right-8 top-1/2 -translate-y-1/2 w-8 h-8 text-primary animate-pulse" 
        />
      </div>

      <div className="text-center space-y-3 max-w-xs">
        <h2 className="text-xl font-bold text-foreground">
          Rotate Your Device
        </h2>
        <p className="text-muted-foreground text-sm">
          Please rotate your phone to landscape mode for the best gaming experience.
        </p>
      </div>

      <style>{`
        @keyframes rotatePhone {
          0%, 100% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(-90deg);
          }
        }
      `}</style>
    </div>
  );
}
