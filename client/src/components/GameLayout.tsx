import { ReactNode } from "react";
import bnbpotBg from '@assets/MOSHED-2025-11-18-4-12-49_1763403537895.gif';

interface GameLayoutProps {
  header?: ReactNode;
  leftSidebar: ReactNode;
  rightSidebar: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}

/**
 * Pure structural layout component for game pages
 * Does NOT handle any state or logic - just layout structure
 */
export default function GameLayout({
  header,
  leftSidebar,
  rightSidebar,
  footer,
  children,
}: GameLayoutProps) {
  return (
    <>
      {/* Fixed background */}
      <div className="fixed inset-0 space-bg" style={{
        backgroundImage: `url(${bnbpotBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        zIndex: -1
      }} />
      
      {/* ONE scrollable container with header + content */}
      <div className="w-full">
        {/* Header - only render if provided (pages can use PersistentHeader from App instead) */}
        {header && (
          <div className="fixed top-0 left-0 right-0 w-full z-50">
            {header}
          </div>
        )}

        {/* Content - with top padding to account for fixed header */}
        <div className="flex flex-col min-h-screen w-full" style={{paddingTop: 'clamp(70px, 100px, 100px)'}}>
          {/* Wrapper for content + footer */}
          <div className="flex-1 flex flex-col w-full">
            {/* Content wrapper */}
            <div className="flex-1 flex flex-col">
              <div className="flex-1 flex">
                {/* Left sidebar */}
                {leftSidebar}

                {/* Main game area */}
                <div className="flex-1 flex flex-col relative">
                  {children}
                </div>

                {/* Right sidebar */}
                {rightSidebar}
              </div>
            </div>
          </div>

          {/* Footer */}
          {footer}
        </div>
      </div>
    </>
  );
}
