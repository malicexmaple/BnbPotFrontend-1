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
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-16 items-center justify-between px-4 gap-4">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
              BNBPOT
            </div>
            <Badge variant="secondary" className="text-xs">LIVE</Badge>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Button
              data-testid="button-jackpot-tab"
              variant={activeTab === "jackpot" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("jackpot")}
            >
              Jackpot
            </Button>
            <Button
              data-testid="button-coinflip-tab"
              variant={activeTab === "coinflip" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("coinflip")}
            >
              Coinflip
            </Button>
            <Button
              data-testid="button-affiliates-tab"
              variant={activeTab === "affiliates" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("affiliates")}
            >
              Affiliates
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isConnected && walletAddress ? (
            <Button
              data-testid="button-wallet-connected"
              variant="outline"
              size="sm"
              className="font-mono text-xs"
            >
              <Wallet className="h-4 w-4 mr-2" />
              {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
            </Button>
          ) : (
            <Button
              data-testid="button-connect-wallet"
              onClick={onConnect}
              size="sm"
              className="bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90 border-0 gradient-animate"
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
