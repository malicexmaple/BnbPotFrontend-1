import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Trophy, ChevronRight, Settings, BarChart3, Receipt, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import crownLogo from '@assets/3dgifmaker85766_1763561140520.gif';
import textLogo from '@assets/bnbpotlogonew_1763432221839.png';
import jackpotTabLogo from '@assets/jackpotnew_1763477420573.png';
import coinflipLogo from '@assets/coinflipnew_1763488010364.png';
import predictionMarketsLogo from '@assets/predictionmarketsnew_1763488010364.png';

interface GameNavigationProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
  isConnected?: boolean;
  isConnecting?: boolean;
  walletAddress?: string;
  username?: string;
  onOpenProfile?: () => void;
}

export default function GameNavigation({ 
  onConnect,
  onDisconnect,
  isConnected = false,
  isConnecting = false,
  walletAddress,
  username,
  onOpenProfile
}: GameNavigationProps) {
  const [activeTab, setActiveTab] = useState("jackpot");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    return username ? localStorage.getItem(`avatar_${username}`) : null;
  });

  useEffect(() => {
    if (username) {
      setAvatarUrl(localStorage.getItem(`avatar_${username}`));
    }
  }, [username]);

  useEffect(() => {
    const handleAvatarUpdate = (event: CustomEvent) => {
      if (username && event.detail.username === username) {
        setAvatarUrl(event.detail.avatarUrl);
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (username && event.key === `avatar_${username}`) {
        setAvatarUrl(event.newValue);
      }
    };

    window.addEventListener('avatarUpdated', handleAvatarUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [username]);

  return (
    <div className="flex w-full" style={{height: '100px'}}>
      {/* Left - Logo section (345px, full height) */}
      <div className="flex items-start justify-center flex-shrink-0 w-full max-w-[345px]" style={{ height: '100px' }}>
        <div className="flex items-center justify-center" style={{height: '100px'}}>
          <div className="shine-image" style={{'--shine-mask': `url(${crownLogo})`, marginLeft: '-30px'} as React.CSSProperties}>
            <img src={crownLogo} alt="Crown" style={{height: '115px', width: 'auto', display: 'block'}} />
          </div>
          <div className="shine-image" style={{'--shine-mask': `url(${textLogo})`, marginLeft: '-10px'} as React.CSSProperties}>
            <img src={textLogo} alt="BNBPOT" style={{width: '198px', height: 'auto', display: 'block'}} />
          </div>
        </div>
      </div>

      {/* Right - Stacked header content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top Header - 30px */}
        <nav className="flex flex-nowrap items-center justify-between px-4 border-b border-border/20" style={{
          height: '30px',
          background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.3), rgba(30, 30, 30, 0.3))',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="flex flex-nowrap items-center gap-3">
            {/* Social Icons */}
            <button className="w-7 h-7 rounded bg-muted/30 flex items-center justify-center hover-elevate" data-testid="button-social-x">
              <svg className="w-3.5 h-3.5 text-foreground" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </button>
            <button className="w-7 h-7 rounded bg-muted/30 flex items-center justify-center hover-elevate" data-testid="button-social-discord">
              <svg className="w-3.5 h-3.5 text-foreground" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/>
              </svg>
            </button>
            
            {/* Text Links */}
            <button className="text-xs text-muted-foreground hover:text-foreground transition-colors" data-testid="link-provably-fair">
              Provably Fair
            </button>
            <button className="text-xs text-muted-foreground hover:text-foreground transition-colors" data-testid="link-terms">
              Terms of Service
            </button>
            <button className="text-xs text-muted-foreground hover:text-foreground transition-colors" data-testid="link-support">
              Support
            </button>
          </div>

          {/* Total Bets on top right */}
          <div className="text-foreground font-bold flex-shrink-0" style={{fontSize: '11px'}} data-testid="text-total-bets">
            11304455 <span className="text-muted-foreground font-normal">Total Bets</span>
          </div>
        </nav>

        {/* Bottom Header - 70px */}
        <nav className="flex flex-nowrap items-center justify-between px-4" style={{
          height: '70px',
          background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.3), rgba(30, 30, 30, 0.3))',
          backdropFilter: 'blur(4px)'
        }}>
          {/* Navigation tabs */}
          <div className="flex flex-nowrap items-center gap-1">
          <Button
            data-testid="button-jackpot-tab"
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("jackpot")}
            className={`font-medium px-3 ${activeTab === "jackpot" ? "text-foreground bg-white/10" : "text-muted-foreground"}`}
            style={{height: '32px', fontSize: '14px'}}
          >
            <svg className="mr-1.5" fill="currentColor" viewBox="0 0 20 20" style={{width: '16px', height: '16px', color: '#EAB308'}}>
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <circle cx="10" cy="10" r="3" fill="currentColor"/>
            </svg>
            <img src={jackpotTabLogo} alt="Jackpot" style={{height: '34px', width: 'auto'}} />
          </Button>
          <Button
            data-testid="button-coinflip-tab"
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("coinflip")}
            className={`font-medium px-3 ${activeTab === "coinflip" ? "text-foreground bg-white/10" : "text-muted-foreground"}`}
            style={{height: '32px', fontSize: '14px'}}
          >
            <img src={coinflipLogo} alt="Coinflip" style={{height: '34px', width: 'auto'}} />
          </Button>
          <Button
            data-testid="button-prediction-markets-tab"
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("prediction-markets")}
            className={`font-medium px-3 ${activeTab === "prediction-markets" ? "text-foreground bg-white/10" : "text-muted-foreground"}`}
            style={{height: '32px', fontSize: '14px'}}
          >
            <img src={predictionMarketsLogo} alt="Prediction Markets" style={{height: '34px', width: 'auto'}} />
          </Button>
          </div>

          {/* Connect button on bottom right */}
          <div className="flex flex-nowrap flex-shrink-0 items-center gap-3">
            {isConnected && username ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    data-testid="button-user-menu"
                    size="sm"
                    className="font-bold pl-2 pr-5 text-white border-0 glass-panel"
                    style={{
                      height: '60px',
                      fontSize: '14px',
                      borderRadius: '12px',
                      border: '2px solid transparent',
                      backgroundImage: 'linear-gradient(rgba(15, 15, 15, 0.9), rgba(15, 15, 15, 0.9)), linear-gradient(140deg, #EAB308 0%, #FCD34D 50%, #EAB308 100%)',
                      backgroundOrigin: 'border-box',
                      backgroundClip: 'padding-box, border-box',
                      boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.03), inset 0 -1px 2px rgba(0, 0, 0, 0.5), 0 0 24px rgba(234, 179, 8, 0.4), 0 4px 12px rgba(0, 0, 0, 0.7)'
                    }}
                  >
                    <div 
                      className="w-12 h-12 rounded-md flex items-center justify-center mr-2 text-base font-bold overflow-hidden"
                      style={{
                        background: 'linear-gradient(145deg, rgba(40, 40, 40, 0.6), rgba(20, 20, 20, 0.9))',
                        border: '2px solid rgba(60, 60, 60, 0.6)',
                        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), inset 0 -2px 4px rgba(0, 0, 0, 0.8), 0 2px 8px rgba(0, 0, 0, 0.5)'
                      }}
                    >
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
                      ) : (
                        <svg className="text-muted-foreground/50" fill="currentColor" viewBox="0 0 24 24" style={{width: '24px', height: '24px'}}>
                          <path d="M12 4C9.243 4 7 6.243 7 9h2c0-1.654 1.346-3 3-3s3 1.346 3 3c0 1.069-.454 1.465-1.481 2.255-.382.294-.813.626-1.226 1.038C10.981 13.604 10.995 14.897 11 15v2h2v-2.009c0-.024.023-.601.707-1.284.32-.32.682-.598 1.031-.867C15.798 12.024 17 11.1 17 9c0-2.757-2.243-5-5-5zm-1 14h2v2h-2z"/>
                        </svg>
                      )}
                    </div>
                    {username}
                    <ChevronRight className="ml-2" style={{width: '14px', height: '14px'}} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-border/40">
                  <div className="px-3 py-3 border-b border-border/20">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 text-base font-bold overflow-hidden"
                        style={{
                          background: avatarUrl ? 'transparent' : `hsl(${username.charCodeAt(0) * 137.5 % 360}, 65%, 50%)`
                        }}
                      >
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
                        ) : (
                          username.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground">{username}</div>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 mt-1">1</Badge>
                      </div>
                      <ChevronRight className="text-muted-foreground flex-shrink-0" style={{width: '16px', height: '16px'}} />
                    </div>
                  </div>
                  
                  <DropdownMenuItem className="px-3 py-2.5 cursor-pointer" style={{
                    border: '2px solid rgba(234, 179, 8, 0.4)',
                    borderRadius: '8px',
                    margin: '8px',
                    background: 'rgba(234, 179, 8, 0.05)'
                  }} data-testid="menu-leaderboard">
                    <Trophy className="mr-3" style={{width: '18px', height: '18px', color: '#EAB308'}} />
                    <span className="font-semibold">SP Leaderboard</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    className="px-3 py-2.5 cursor-pointer" 
                    onClick={onOpenProfile}
                    data-testid="menu-options"
                  >
                    <Settings className="mr-3 text-muted-foreground" style={{width: '18px', height: '18px'}} />
                    <span>Options</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem className="px-3 py-2.5 cursor-pointer" data-testid="menu-statistics">
                    <BarChart3 className="mr-3 text-muted-foreground" style={{width: '18px', height: '18px'}} />
                    <span>Statistics</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem className="px-3 py-2.5 cursor-pointer" data-testid="menu-transactions">
                    <Receipt className="mr-3 text-muted-foreground" style={{width: '18px', height: '18px'}} />
                    <span>Transactions</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    className="px-3 py-2.5 cursor-pointer" 
                    onClick={onDisconnect}
                    data-testid="menu-disconnect"
                  >
                    <LogOut className="mr-3 text-muted-foreground" style={{width: '18px', height: '18px'}} />
                    <span>Disconnect</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                data-testid="button-connect-wallet"
                onClick={onConnect}
                disabled={isConnecting}
                size="sm"
                className="font-bold px-5 text-white border-0 glass-panel no-default-hover-elevate"
                style={{
                  height: '60px',
                  fontSize: '14px',
                  borderRadius: '12px',
                  border: '2px solid transparent',
                  backgroundImage: 'linear-gradient(rgba(15, 15, 15, 0.9), rgba(15, 15, 15, 0.9)), linear-gradient(140deg, #EAB308 0%, #FCD34D 50%, #EAB308 100%)',
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                  boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.03), inset 0 -1px 2px rgba(0, 0, 0, 0.5), 0 0 24px rgba(234, 179, 8, 0.4), 0 4px 12px rgba(0, 0, 0, 0.7)'
                }}
              >
                <svg className="mr-2 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                </svg>
                {isConnecting ? 'Connecting...' : 'Connect'}
              </Button>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}
