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
      
      {/* Left sidebar - fixed position */}
      <div className="fixed left-0 z-40" style={{ 
        top: 'clamp(70px, 100px, 100px)', 
        bottom: '50px',
        overflowY: 'auto'
      }}>
        {leftSidebar}
      </div>
      
      {/* Right sidebar - fixed position */}
      <div className="fixed right-0 z-40" style={{ 
        top: 'clamp(70px, 100px, 100px)', 
        bottom: '50px',
        overflowY: 'auto'
      }}>
        {rightSidebar}
      </div>
      
      {/* Scrollable main content area */}
      <div className="w-full overflow-y-auto" style={{ 
        minHeight: 'var(--viewport-height, 100vh)',
        paddingTop: 'clamp(70px, 100px, 100px)',
        paddingBottom: '120px'
      }}>
        {/* Header - only render if provided (pages can use PersistentHeader from App instead) */}
        {header && (
          <div className="fixed top-0 left-0 right-0 w-full z-50">
            {header}
          </div>
        )}

        {/* Main game area with margins for fixed sidebars */}
        <div className="flex-1 flex flex-col relative" style={{
          marginLeft: '345px',
          marginRight: '345px',
          minHeight: 'calc(var(--viewport-height, 100vh) - 170px)'
        }}>
          {children}
        </div>

        {/* Footer - at bottom of scrollable area */}
        <div className="flex-shrink-0">
          {footer}
        </div>
      </div>
    </>
  );
}
