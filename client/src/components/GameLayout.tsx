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
      
      {/* Full height container */}
      <div className="w-full h-screen flex flex-col overflow-hidden">
        {/* Header - only render if provided (pages can use PersistentHeader from App instead) */}
        {header && (
          <div className="fixed top-0 left-0 right-0 w-full z-50">
            {header}
          </div>
        )}

        {/* Content - with top padding to account for fixed header */}
        <div className="flex-1 flex flex-col w-full min-h-0" style={{paddingTop: 'clamp(70px, 100px, 100px)'}}>
          {/* Main content area with sidebars - grows to fill space */}
          <div className="flex-1 flex min-h-0">
            {/* Left sidebar */}
            {leftSidebar}

            {/* Main game area - scrollable */}
            <div className="flex-1 flex flex-col relative overflow-y-auto">
              {children}
            </div>

            {/* Right sidebar */}
            {rightSidebar}
          </div>
        </div>

        {/* Footer - stays at bottom */}
        <div className="flex-shrink-0">
          {footer}
        </div>
      </div>
    </>
  );
}
