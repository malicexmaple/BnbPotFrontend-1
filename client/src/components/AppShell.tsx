import { useState, useEffect, useRef } from "react";

interface AppShellProps {
  children: React.ReactNode;
}

const BASE_WIDTH = 1200;

export default function AppShell({ children }: AppShellProps) {
  const [scale, setScale] = useState(1);
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateScale = () => {
      const viewportWidth = window.innerWidth;
      const newScale = viewportWidth < BASE_WIDTH ? viewportWidth / BASE_WIDTH : 1;
      setScale(newScale);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    window.addEventListener('orientationchange', updateScale);

    return () => {
      window.removeEventListener('resize', updateScale);
      window.removeEventListener('orientationchange', updateScale);
    };
  }, []);

  const compensatedHeight = scale < 1 ? `${100 / scale}vh` : '100vh';

  return (
    <div
      ref={shellRef}
      className="app-shell"
      style={{
        width: `${BASE_WIDTH}px`,
        minWidth: `${BASE_WIDTH}px`,
        height: compensatedHeight,
        minHeight: compensatedHeight,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        overflow: 'hidden'
      }}
    >
      {children}
    </div>
  );
}
