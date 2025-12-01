import { useEffect, useState, CSSProperties } from "react";
import { createPortal } from "react-dom";
import loadingLogo from "@assets/3dgifmaker85766_1764628423703.gif";

interface LoadingScreenProps {
  minDuration?: number;
  onComplete?: () => void;
}

function LoadingContent({ fadeOut = false }: { fadeOut?: boolean }) {
  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-300 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      style={{
        background: '#0a0a0a'
      }}
      data-testid="loading-screen"
    >
      <div className="relative">
        <div 
          className="absolute inset-0 blur-2xl opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(234, 179, 8, 0.5) 0%, transparent 70%)',
            transform: 'scale(2)'
          }}
        />
        <img 
          src={loadingLogo} 
          alt="Loading" 
          className="w-24 h-24 relative z-10"
          style={{
            filter: 'drop-shadow(0 0 20px rgba(234, 179, 8, 0.5))'
          }}
          data-testid="img-loading-logo"
        />
      </div>
    </div>
  );
}

export default function LoadingScreen({ 
  minDuration = 0, 
  onComplete
}: LoadingScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (minDuration > 0 && onComplete) {
      const timer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(onComplete, 300);
      }, minDuration);
      return () => clearTimeout(timer);
    }
  }, [minDuration, onComplete]);

  return <LoadingContent fadeOut={fadeOut} />;
}

interface PageTransitionLoaderProps {
  style?: CSSProperties;
}

export function PageTransitionLoader({ style }: PageTransitionLoaderProps = {}) {
  const content = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-200"
      style={{
        background: '#0a0a0a',
        ...style
      }}
      data-testid="page-transition-loader"
    >
      <div className="relative">
        <div 
          className="absolute inset-0 blur-2xl opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(234, 179, 8, 0.5) 0%, transparent 70%)',
            transform: 'scale(2)'
          }}
        />
        <img 
          src={loadingLogo} 
          alt="Loading" 
          className="w-24 h-24 relative z-10"
          style={{
            filter: 'drop-shadow(0 0 20px rgba(234, 179, 8, 0.5))'
          }}
        />
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
