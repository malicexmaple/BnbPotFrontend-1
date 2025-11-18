import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Trophy, ChevronRight, Settings, BarChart3, Receipt, LogOut } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import crownLogo from '@assets/3dgifmaker00562_1763407280610.gif';
import textLogo from '@assets/bnbpot-text1_1763394945404.png';
import headerBg from '@assets/MOSHED-2025-11-18-1-42-5_1763390565114.gif';

interface GameNavigationProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
  isConnected?: boolean;
  isConnecting?: boolean;
  walletAddress?: string;
  username?: string;
}

export default function GameNavigation({ 
  onConnect,
  onDisconnect,
  isConnected = false,
  isConnecting = false,
  walletAddress,
  username
}: GameNavigationProps) {
  const [activeTab, setActiveTab] = useState("jackpot");

  return (
    <nav className="sticky top-0 z-50 bg-black flex items-center border-b border-border/20" style={{height: '100px'}}>
      {/* Left - Header Logo (320px to match chatbox width) */}
      <div className="flex items-center justify-center flex-shrink-0" style={{
        width: '320px',
        height: '100px',
        backgroundImage: `url(${headerBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
        <div className="shine-image" style={{'--shine-mask': `url(${crownLogo})`, marginLeft: '-30px'} as React.CSSProperties}>
          <img src={crownLogo} alt="Crown" style={{height: '115px', width: 'auto', display: 'block'}} />
        </div>
        <div className="shine-image" style={{'--shine-mask': `url(${textLogo})`, marginLeft: '-10px'} as React.CSSProperties}>
          <img src={textLogo} alt="BNBPOT" style={{width: '180px', height: 'auto', display: 'block'}} />
        </div>
      </div>

      {/* Right side content - Two rows */}
      <div className="flex-1 flex flex-col justify-center px-4">
        {/* Top row - Social icons and links on left, Total Bets on right */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            {/* Social Icons */}
            <button className="w-8 h-8 rounded bg-muted/30 flex items-center justify-center hover-elevate" data-testid="button-social-x">
              <svg className="w-4 h-4 text-foreground" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </button>
            <button className="w-8 h-8 rounded bg-muted/30 flex items-center justify-center hover-elevate" data-testid="button-social-discord">
              <svg className="w-4 h-4 text-foreground" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/>
              </svg>
            </button>
            
            {/* Text Links */}
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-provably-fair">
              Provably Fair
            </button>
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-terms">
              Terms of Service
            </button>
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-support">
              Support
            </button>
          </div>

          {/* Total Bets on top right */}
          <div className="text-foreground font-bold" style={{fontSize: '13px'}} data-testid="text-total-bets">
            11304455 <span className="text-muted-foreground font-normal">Total Bets</span>
          </div>
        </div>

        {/* Bottom row - Navigation tabs on left, Leaderboard and Connect on right */}
        <div className="flex items-center justify-between">
          {/* Navigation tabs */}
          <div className="flex items-center gap-1">
          <Button
            data-testid="button-jackpot-tab"
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("jackpot")}
            className={`font-medium px-3 ${activeTab === "jackpot" ? "text-foreground bg-white/10" : "text-muted-foreground"}`}
            style={{height: '32px', fontSize: '14px'}}
          >
            <svg className="mr-1.5" fill="currentColor" viewBox="0 0 20 20" style={{width: '16px', height: '16px', color: '#7B68EE'}}>
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <circle cx="10" cy="10" r="3" fill="currentColor"/>
            </svg>
            Jackpot
          </Button>
          <Button
            data-testid="button-coinflip-tab"
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("coinflip")}
            className={`font-medium px-3 ${activeTab === "coinflip" ? "text-foreground bg-white/10" : "text-muted-foreground"}`}
            style={{height: '32px', fontSize: '14px'}}
          >
            <svg className="mr-1.5" fill="currentColor" viewBox="0 0 20 20" style={{width: '13px', height: '13px'}}>
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
            className={`font-medium px-3 ${activeTab === "affiliates" ? "text-foreground bg-white/10" : "text-muted-foreground"}`}
            style={{height: '32px', fontSize: '14px'}}
          >
            <svg className="mr-1.5" fill="currentColor" viewBox="0 0 20 20" style={{width: '13px', height: '13px'}}>
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
            </svg>
            Affiliates
          </Button>
          </div>

          {/* Leaderboard and Connect button on bottom right */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{
              background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.8), rgba(30, 30, 30, 0.8))',
              border: '2px solid rgba(234, 179, 8, 0.5)',
              boxShadow: '0 0 20px rgba(234, 179, 8, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
            }} data-testid="badge-leaderboard">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{color: '#EAB308'}}>
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              <span className="font-bold gradient-text italic" style={{fontSize: '13px'}}>$25K WEEKLY</span>
              <span className="text-muted-foreground" style={{fontSize: '13px'}}>LEADERBOARD</span>
            </div>
            
            {isConnected && username ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    data-testid="button-user-menu"
                    size="sm"
                    className="font-bold px-5 text-white border-0 glass-panel"
                    style={{
                      height: '38px',
                      fontSize: '14px',
                      borderRadius: '12px',
                      border: '2px solid transparent',
                      backgroundImage: 'linear-gradient(rgba(15, 15, 15, 0.9), rgba(15, 15, 15, 0.9)), linear-gradient(140deg, #EAB308 0%, #FCD34D 50%, #EAB308 100%)',
                      backgroundOrigin: 'border-box',
                      backgroundClip: 'padding-box, border-box',
                      boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.03), inset 0 -1px 2px rgba(0, 0, 0, 0.5), 0 0 24px rgba(234, 179, 8, 0.4), 0 4px 12px rgba(0, 0, 0, 0.7)'
                    }}
                  >
                    <div className="w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center mr-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    {username}
                    <ChevronRight className="ml-2" style={{width: '14px', height: '14px'}} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-border/40">
                  <div className="px-3 py-3 border-b border-border/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                        </svg>
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
                  
                  <DropdownMenuItem className="px-3 py-2.5 cursor-pointer" data-testid="menu-options">
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
                className="font-bold px-5 text-white border-0 glass-panel"
                style={{
                  height: '38px',
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
        </div>
      </div>
    </nav>
  );
}
