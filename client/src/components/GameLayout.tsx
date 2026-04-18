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

        {/* Full-viewport flex column: header padding + sidebars row that grows + footer at the bottom */}
        <div
          className="flex flex-col w-full"
          style={{
            paddingTop: 'clamp(70px, 100px, 100px)',
            minHeight: '100vh',
          }}
        >
          {/* Sidebars + main row — grows to fill all remaining vertical space so panels reach the footer */}
          <div className="flex-1 flex w-full items-stretch min-h-0">
            {/* Left sidebar */}
            {leftSidebar}

            {/* Main game area */}
            <div className="flex-1 flex flex-col relative min-w-0">
              {children}
            </div>

            {/* Right sidebar */}
            {rightSidebar}
          </div>

          {/* Footer pinned to the bottom of the viewport-tall column */}
          <div className="flex-shrink-0 w-full">
            {footer}
          </div>
        </div>
      </div>
    </>
  );
}
