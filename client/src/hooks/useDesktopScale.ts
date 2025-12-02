import { useState, useEffect } from "react";

const DESIGN_WIDTH = 2560;
const MIN_SCALE = 0.75;
const MAX_SCALE = 1.0;

export function useDesktopScale(): number {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
      
      if (isCoarsePointer) {
        setScale(1);
        return;
      }

      const width = window.innerWidth;
      
      if (width >= DESIGN_WIDTH) {
        setScale(1);
      } else {
        const calculatedScale = width / DESIGN_WIDTH;
        const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, calculatedScale));
        setScale(clampedScale);
      }
    };

    updateScale();

    window.addEventListener('resize', updateScale);
    
    const pointerQuery = window.matchMedia('(pointer: coarse)');
    const handlePointerChange = () => updateScale();
    pointerQuery.addEventListener('change', handlePointerChange);

    return () => {
      window.removeEventListener('resize', updateScale);
      pointerQuery.removeEventListener('change', handlePointerChange);
    };
  }, []);

  return scale;
}

export function isFirefox(): boolean {
  return typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('firefox');
}
