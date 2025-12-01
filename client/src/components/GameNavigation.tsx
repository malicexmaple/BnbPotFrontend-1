import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Trophy, ChevronRight, Settings, BarChart3, Receipt, LogOut, Shield, VolumeX } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
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
  bnbBalance?: string;
  onOpenOptions?: () => void;
  onOpenStatistics?: () => void;
  onOpenTransactions?: () => void;
  onOpenMutedUsers?: () => void;
  isAdmin?: boolean;
}

export default function GameNavigation({ 
  onConnect,
  onDisconnect,
  isConnected = false,
  isConnecting = false,
  walletAddress,
  username,
  bnbBalance,
  onOpenOptions,
  onOpenStatistics,
  onOpenTransactions,
  onOpenMutedUsers,
  isAdmin = false
}: GameNavigationProps) {
  const [location] = useLocation();
  
  const activeTab = location === "/" ? "jackpot" 
    : location === "/coinflip" ? "coinflip"
    : location === "/prediction-markets" ? "prediction-markets"
    : "jackpot";
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Fetch avatar from database when user is authenticated
  useEffect(() => {
    const fetchAvatar = async () => {
      if (walletAddress) {
        try {
          const response = await fetch(`/api/users/me?walletAddress=${encodeURIComponent(walletAddress)}`);
          if (response.ok) {
            const userData = await response.json();
            setAvatarUrl(userData.avatarUrl || null);
          }
        } catch (error) {
          console.error("Failed to fetch avatar:", error);
        }
      } else {
        setAvatarUrl(null);
      }
    };
    fetchAvatar();
  }, [walletAddress]);

  // Listen for avatar updates from same session (e.g., ProfileModal updates)
  useEffect(() => {
    const handleAvatarUpdate = (event: CustomEvent) => {
      if (username && event.detail.username === username) {
        setAvatarUrl(event.detail.avatarUrl);
      }
    };

    window.addEventListener('avatarUpdated', handleAvatarUpdate as EventListener);
    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdate as EventListener);
    };
  }, [username]);

  return (
    <div className="flex w-full" style={{height: '100px', display: 'flex'}}>
      {/* Left - Logo section (345px on desktop, smaller on mobile) */}
      <div className="hidden lg:flex items-start justify-center flex-shrink-0 w-full max-w-[345px]" style={{ height: '100px' }}>
        <div className="flex items-center justify-center" style={{height: '100px'}}>
          <div className="shine-image" style={{'--shine-mask': `url(${crownLogo})`, marginLeft: '-30px'} as React.CSSProperties}>
            <img src={crownLogo} alt="Crown" style={{height: '115px', width: 'auto', display: 'block'}} />
          </div>
          <div className="shine-image" style={{'--shine-mask': `url(${textLogo})`, marginLeft: '-10px'} as React.CSSProperties}>
            <img src={textLogo} alt="BNBPOT" style={{width: '198px', height: 'auto', display: 'block'}} />
          </div>
        </div>
      </div>
      {/* Mobile logo - smaller version */}
      <div className="flex lg:hidden items-center justify-center flex-shrink-0 px-2" style={{ height: '100px', width: '80px' }}>
        <div className="shine-image" style={{'--shine-mask': `url(${crownLogo})`} as React.CSSProperties}>
          <img src={crownLogo} alt="Crown" style={{height: '60px', width: 'auto', display: 'block'}} />
        </div>
      </div>

      {/* Right - Stacked header content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top Header - 30px (hidden on mobile) - darker glass */}
        <nav className="hidden sm:flex flex-nowrap items-center justify-between px-4" style={{
          height: '30px',
          background: 'rgba(10, 10, 10, 0.9)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(60, 60, 60, 0.2)',
          boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.02), inset 0 -1px 2px rgba(0, 0, 0, 0.5)'
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

        {/* Bottom Header - 70px on desktop - glass panel matching site */}
        <nav className="flex flex-nowrap items-center justify-between px-2 sm:px-4" style={{
          height: '70px',
          background: 'rgba(20, 20, 20, 0.8)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(60, 60, 60, 0.3)',
          boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.03), inset 0 -1px 2px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.7)',
          flex: 1
        }}>
          {/* Navigation tabs */}
          <div className="flex flex-nowrap items-center gap-1 sm:gap-2">
          <Link href="/" onClick={(e) => { if (activeTab === "jackpot") e.preventDefault(); }}>
            <Button
              data-testid="button-jackpot-tab"
              variant="ghost"
              className={`px-2 sm:px-4 h-10 sm:h-12 ${activeTab === "jackpot" ? "bg-white/10" : ""}`}
            >
              <img src={jackpotTabLogo} alt="Jackpot" className="h-6 sm:h-8 w-auto" />
            </Button>
          </Link>
          <Link href="/coinflip" onClick={(e) => { if (activeTab === "coinflip") e.preventDefault(); }}>
            <Button
              data-testid="button-coinflip-tab"
              variant="ghost"
              className={`px-2 sm:px-4 h-10 sm:h-12 ${activeTab === "coinflip" ? "bg-white/10" : ""}`}
            >
              <img src={coinflipLogo} alt="Coinflip" className="h-6 sm:h-8 w-auto" />
            </Button>
          </Link>
          <Link href="/prediction-markets" onClick={(e) => { if (activeTab === "prediction-markets") e.preventDefault(); }}>
            <Button
              data-testid="button-prediction-markets-tab"
              variant="ghost"
              className={`px-2 sm:px-4 h-10 sm:h-12 ${activeTab === "prediction-markets" ? "bg-white/10" : ""}`}
            >
              <img src={predictionMarketsLogo} alt="Prediction Markets" className="h-6 sm:h-8 w-auto" />
            </Button>
          </Link>
          </div>

          {/* Connect button on bottom right */}
          <div className="flex flex-nowrap flex-shrink-0 items-center gap-1 sm:gap-3">
            {isConnected && username ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    data-testid="button-user-menu"
                    size="sm"
                    className="font-bold pl-1.5 pr-2 sm:pl-2 sm:pr-5 text-white border-0 glass-panel"
                    style={{
                      height: '44px',
                      fontSize: '12px',
                      borderRadius: '10px',
                      border: '2px solid transparent',
                      backgroundImage: 'linear-gradient(rgba(15, 15, 15, 0.9), rgba(15, 15, 15, 0.9)), linear-gradient(140deg, #EAB308 0%, #FCD34D 50%, #EAB308 100%)',
                      backgroundOrigin: 'border-box',
                      backgroundClip: 'padding-box, border-box',
                      boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.03), inset 0 -1px 2px rgba(0, 0, 0, 0.5), 0 0 24px rgba(234, 179, 8, 0.4), 0 4px 12px rgba(0, 0, 0, 0.7)'
                    }}
                  >
                    <div 
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-md flex items-center justify-center mr-1 sm:mr-2 text-sm font-bold overflow-hidden"
                      style={{
                        background: 'linear-gradient(145deg, rgba(40, 40, 40, 0.6), rgba(20, 20, 20, 0.9))',
                        border: '2px solid rgba(60, 60, 60, 0.6)',
                        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), inset 0 -2px 4px rgba(0, 0, 0, 0.8), 0 2px 8px rgba(0, 0, 0, 0.5)'
                      }}
                    >
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
                      ) : (
                        <svg className="text-muted-foreground/50" fill="currentColor" viewBox="0 0 24 24" style={{width: '20px', height: '20px'}}>
                          <path d="M12 4C9.243 4 7 6.243 7 9h2c0-1.654 1.346-3 3-3s3 1.346 3 3c0 1.069-.454 1.465-1.481 2.255-.382.294-.813.626-1.226 1.038C10.981 13.604 10.995 14.897 11 15v2h2v-2.009c0-.024.023-.601.707-1.284.32-.32.682-.598 1.031-.867C15.798 12.024 17 11.1 17 9c0-2.757-2.243-5-5-5zm-1 14h2v2h-2z"/>
                        </svg>
                      )}
                    </div>
                    <div className="hidden sm:flex flex-col items-start">
                      <span className="font-bold">{username}</span>
                      {bnbBalance && (
                        <span className="text-[10px] text-primary opacity-80 font-mono">
                          {parseFloat(bnbBalance).toFixed(4)} BNB
                        </span>
                      )}
                    </div>
                    <ChevronRight className="ml-1 sm:ml-2" style={{width: '12px', height: '12px'}} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-border/40">
                  {walletAddress && (
                    <div 
                      className="px-3 py-2.5 border-b border-border/40"
                      data-testid="display-wallet-address"
                    >
                      <div className="text-[10px] text-muted-foreground mb-1">Connected Wallet</div>
                      <div 
                        className="text-xs font-mono text-foreground/80 cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => {
                          navigator.clipboard.writeText(walletAddress);
                        }}
                        title="Click to copy full address"
                      >
                        {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                      </div>
                    </div>
                  )}
                  <DropdownMenuItem 
                    className="px-3 py-2.5 cursor-pointer" 
                    onClick={onOpenOptions}
                    data-testid="menu-options"
                  >
                    <Settings className="mr-3 text-muted-foreground" style={{width: '18px', height: '18px'}} />
                    <span>Options</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    className="px-3 py-2.5 cursor-pointer" 
                    onClick={onOpenStatistics}
                    data-testid="menu-statistics"
                  >
                    <BarChart3 className="mr-3 text-muted-foreground" style={{width: '18px', height: '18px'}} />
                    <span>Statistics</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    className="px-3 py-2.5 cursor-pointer" 
                    onClick={onOpenTransactions}
                    data-testid="menu-transactions"
                  >
                    <Receipt className="mr-3 text-muted-foreground" style={{width: '18px', height: '18px'}} />
                    <span>Transactions</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    className="px-3 py-2.5 cursor-pointer" 
                    onClick={onOpenMutedUsers}
                    data-testid="menu-muted-users"
                  >
                    <VolumeX className="mr-3 text-muted-foreground" style={{width: '18px', height: '18px'}} />
                    <span>Muted Users</span>
                  </DropdownMenuItem>
                  
                  {isAdmin && (
                    <DropdownMenuItem asChild className="px-3 py-2.5 cursor-pointer" data-testid="menu-admin">
                      <Link href="/admin">
                        <Shield className="mr-3 text-muted-foreground" style={{width: '18px', height: '18px'}} />
                        <span>Admin</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
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
                className="font-bold px-3 sm:px-5 text-white border-0 glass-panel no-default-hover-elevate"
                style={{
                  height: '44px',
                  fontSize: '12px',
                  borderRadius: '10px',
                  border: '2px solid transparent',
                  backgroundImage: 'linear-gradient(rgba(15, 15, 15, 0.9), rgba(15, 15, 15, 0.9)), linear-gradient(140deg, #EAB308 0%, #FCD34D 50%, #EAB308 100%)',
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                  boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.03), inset 0 -1px 2px rgba(0, 0, 0, 0.5), 0 0 24px rgba(234, 179, 8, 0.4), 0 4px 12px rgba(0, 0, 0, 0.7)'
                }}
              >
                <svg className="mr-1.5 sm:mr-2 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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
