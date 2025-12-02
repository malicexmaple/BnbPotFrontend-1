import { ReactNode } from "react";
import { useDesktopScale, isFirefox } from "@/hooks/useDesktopScale";

interface DesktopScaleWrapperProps {
  children: ReactNode;
}

export default function DesktopScaleWrapper({ children }: DesktopScaleWrapperProps) {
  const scale = useDesktopScale();

  if (scale === 1) {
    return <>{children}</>;
  }

  if (isFirefox()) {
    return (
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
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
