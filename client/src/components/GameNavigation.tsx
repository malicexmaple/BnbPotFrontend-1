import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Menu, Shield, FileText, HelpCircle } from "lucide-react";
import { useState } from "react";

interface GameNavigationProps {
  onConnect?: () => void;
  isConnected?: boolean;
  walletAddress?: string;
}

export default function GameNavigation({ 
  onConnect, 
  isConnected = false,
  walletAddress 
}: GameNavigationProps) {
  const [activeTab, setActiveTab] = useState("jackpot");

  return (
    <nav className="sticky top-0 z-50 bg-black border-b border-border/20">
      {/* Top row - Logo and small links */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-border/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight text-foreground">
              SOLPOT
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-3 ml-2">
            <button
              data-testid="link-provably-fair"
              onClick={() => console.log('Provably Fair clicked')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Provably Fair
            </button>
            <button
              data-testid="link-terms-of-service"
              onClick={() => console.log('Terms of Service clicked')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms of Service
            </button>
            <button
              data-testid="link-support"
              onClick={() => console.log('Support clicked')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Support
            </button>
          </div>
        </div>
      </div>

      {/* Bottom row - Main navigation */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <Button
            data-testid="button-jackpot-tab"
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("jackpot")}
            className={`text-xs font-medium h-7 ${activeTab === "jackpot" ? "text-foreground bg-white/10" : "text-muted-foreground"}`}
          >
            <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            Jackpot
          </Button>
          <Button
            data-testid="button-coinflip-tab"
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("coinflip")}
            className={`text-xs font-medium h-7 ${activeTab === "coinflip" ? "text-foreground bg-white/10" : "text-muted-foreground"}`}
          >
            <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
            </svg>
            Coinflip
          </Button>
          <Button
            data-testid="button-affiliates-tab"
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("affiliates")}
            className={`text-xs font-medium h-7 ${activeTab === "affiliates" ? "text-foreground bg-white/10" : "text-muted-foreground"}`}
          >
            <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
            </svg>
            Affiliates
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-4 text-xs">
            <div className="text-muted-foreground">
              <span className="font-bold text-foreground">313909.00</span> Total Bets
            </div>
            <div className="text-muted-foreground">
              AIRDROP WEEKLY <span className="font-bold text-primary">$4,000</span>
            </div>
          </div>
          
          {isConnected && walletAddress ? (
            <Button
              data-testid="button-wallet-connected"
              variant="outline"
              size="sm"
              className="font-mono text-xs border-border/40 h-7"
            >
              <Wallet className="h-3 w-3 mr-1.5" />
              {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
            </Button>
          ) : (
            <Button
              data-testid="button-connect-wallet"
              onClick={onConnect}
              size="sm"
              className="gradient-purple-pink text-white font-bold text-xs h-7 px-4 shadow-[0_0_20px_rgba(123,104,238,0.5)] hover:shadow-[0_0_30px_rgba(123,104,238,0.7)] border-0"
            >
              <Wallet className="h-3 w-3 mr-1.5" />
              Connect
            </Button>
          )}
          <Button
            data-testid="button-menu"
            variant="ghost"
            size="icon"
            className="md:hidden h-7 w-7"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
