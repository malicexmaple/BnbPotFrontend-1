import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Menu } from "lucide-react";
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
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-black/95 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between px-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="text-xl font-bold tracking-tight gradient-text">
            BNBPOT
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-1">
          <Button
            data-testid="button-jackpot-tab"
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("jackpot")}
            className={`font-semibold text-sm uppercase tracking-wide ${activeTab === "jackpot" ? "text-foreground bg-white/5" : "text-muted-foreground hover:text-foreground"}`}
          >
            Jackpot
          </Button>
          <Button
            data-testid="button-coinflip-tab"
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("coinflip")}
            className={`font-semibold text-sm uppercase tracking-wide ${activeTab === "coinflip" ? "text-foreground bg-white/5" : "text-muted-foreground hover:text-foreground"}`}
          >
            Coinflip
          </Button>
          <Button
            data-testid="button-affiliates-tab"
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("affiliates")}
            className={`font-semibold text-sm uppercase tracking-wide ${activeTab === "affiliates" ? "text-foreground bg-white/5" : "text-muted-foreground hover:text-foreground"}`}
          >
            Affiliates
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {isConnected && walletAddress ? (
            <Button
              data-testid="button-wallet-connected"
              variant="outline"
              size="sm"
              className="font-mono text-xs border-border/40"
            >
              <Wallet className="h-4 w-4 mr-2" />
              {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
            </Button>
          ) : (
            <Button
              data-testid="button-connect-wallet"
              onClick={onConnect}
              size="sm"
              className="gradient-purple-pink text-white font-bold shadow-[0_0_20px_rgba(107,75,255,0.6)] hover:shadow-[0_0_30px_rgba(107,75,255,0.8)] border-0"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Connect
            </Button>
          )}
          <Button
            data-testid="button-menu"
            variant="ghost"
            size="icon"
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
