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
      
      {/* Main layout container */}
      <div className="w-full min-h-screen flex flex-col">
        {/* Header - only render if provided (pages can use PersistentHeader from App instead) */}
        {header && (
          <div className="fixed top-0 left-0 right-0 w-full z-[100]">
            {header}
          </div>
        )}

        {/* Content area - with top padding to account for fixed header */}
        <div className="flex-1 flex" style={{paddingTop: 'clamp(70px, 100px, 100px)'}}>
          {/* Left sidebar - sticky on scroll */}
          <div className="sticky top-[100px] self-start h-[calc(100vh-100px)] flex-shrink-0 z-[60]">
            {leftSidebar}
          </div>

          {/* Main game area - scrollable with content clipping */}
          <div className="flex-1 flex flex-col relative overflow-hidden">
            <div className="flex-1 flex flex-col">
              {children}
            </div>
            {/* Footer inside main area */}
            {footer}
          </div>

          {/* Right sidebar - sticky on scroll */}
          <div className="sticky top-[100px] self-start h-[calc(100vh-100px)] flex-shrink-0 z-[60]">
            {rightSidebar}
          </div>
        </div>
      </div>
    </>
  );
}
