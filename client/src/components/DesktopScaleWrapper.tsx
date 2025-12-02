import { ReactNode } from "react";
import { useViewportScale } from "@/hooks/useViewportScale";

interface DesktopScaleWrapperProps {
  children: ReactNode;
}

export default function DesktopScaleWrapper({ children }: DesktopScaleWrapperProps) {
  const { scale, isDesktop } = useViewportScale();

  if (!isDesktop || scale === 1) {
    return <>{children}</>;
  }

  const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');

  if (isFirefox) {
    return (
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${100 / scale}%`,
          minHeight: `${100 / scale}vh`,
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      style={{
        zoom: scale,
      }}
    >
      {children}
    </div>
  );
}
