import { useState, useEffect } from "react";

interface ViewportScaleResult {
  scale: number;
  isDesktop: boolean;
}

export function useViewportScale(): ViewportScaleResult {
  const [scale, setScale] = useState(1);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const updateScale = () => {
      const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      if (isCoarsePointer || isTouchDevice) {
        setIsDesktop(false);
        setScale(1);
        return;
      }

      setIsDesktop(true);
      
      const width = window.innerWidth;
      
      let newScale = 1;
      if (width >= 2400) {
        newScale = 1.0;
      } else if (width >= 1600) {
        newScale = 0.80;
      } else if (width >= 1128) {
        newScale = 0.50 + (width - 1128) * 0.30 / 472;
      } else if (width >= 900) {
        newScale = 0.50;
      } else {
        newScale = 1.0;
      }
      
      setScale(newScale);
    };

    updateScale();

    window.addEventListener('resize', updateScale);
    
    const pointerMediaQuery = window.matchMedia('(pointer: coarse)');
    pointerMediaQuery.addEventListener('change', updateScale);

    return () => {
      window.removeEventListener('resize', updateScale);
      pointerMediaQuery.removeEventListener('change', updateScale);
    };
  }, []);

  return { scale, isDesktop };
}
