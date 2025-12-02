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
      
      {/* Header - only render if provided (pages can use PersistentHeader from App instead) */}
      {header && (
        <div className="fixed top-0 left-0 right-0 w-full z-50">
          {header}
        </div>
      )}
      
      {/* Left sidebar - fixed position, full height minus header and footer */}
      <div className="fixed left-0 z-40 hidden lg:flex flex-col" style={{ 
        top: '100px', 
        bottom: '60px',
        overflowY: 'auto',
        overflowX: 'visible'
      }}>
        <div className="flex-1 flex flex-col h-full">
          {leftSidebar}
        </div>
      </div>
      
      {/* Right sidebar - fixed position, full height minus header and footer */}
      <div className="fixed right-0 z-40 hidden lg:flex flex-col" style={{ 
        top: '100px', 
        bottom: '60px',
        overflowY: 'auto',
        overflowX: 'visible'
      }}>
        <div className="flex-1 flex flex-col h-full">
          {rightSidebar}
        </div>
      </div>
      
      {/* Main scrollable content area */}
      <div className="w-full overflow-y-auto" style={{ 
        minHeight: 'var(--viewport-height, 100vh)',
        paddingTop: '100px',
        paddingBottom: '80px',
        marginLeft: '345px',
        marginRight: '345px',
        width: 'calc(100% - 690px)'
      }}>
        {/* Main game area */}
        <div className="flex-1 flex flex-col relative" style={{
          minHeight: 'calc(var(--viewport-height, 100vh) - 250px)'
        }}>
          {children}
        </div>
      </div>

      {/* Footer - fixed at very bottom of viewport */}
      <div className="fixed left-0 right-0 z-50" style={{ bottom: 0 }}>
        {footer}
      </div>
    </>
  );
}
