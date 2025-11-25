import { ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { useGameState } from "@/hooks/useGameState";
import ChatSidebar from "@/components/ChatSidebar";
import ChatRulesModal from "@/components/ChatRulesModal";
import DailyStats from "@/components/DailyStats";
import GameFooter from "@/components/GameFooter";
import { Badge } from "@/components/ui/badge";
import { Flame } from "lucide-react";
import bnbpotBg from '@assets/MOSHED-2025-11-18-4-12-49_1763403537895.gif';
import coinStack from '@assets/vecteezy_binance-coin-bnb-coin-stacks-cryptocurrency-3d-render_21627671_1763398880775.png';
import jackpotLegendsLogo from '@assets/jackpotlegends_1763742593143.png';

interface GlobalLayoutProps {
  children: ReactNode;
}

export default function GlobalLayout({ children }: GlobalLayoutProps) {
  const { 
    address, 
    username, 
    messages, 
    onlineUsers, 
    sendMessage,
    isChatCollapsed,
    setIsChatCollapsed,
    isLeaderboardCollapsed,
    setIsLeaderboardCollapsed,
    showChatRules,
    setShowChatRules
  } = useGameState();
  const { toast } = useToast();

  const handleSendMessage = (message: string) => {
    if (!address) {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "Please connect your wallet to chat.",
      });
      return;
    }

    if (!username) {
      toast({
        variant: "destructive",
        title: "Username Required",
        description: "Please complete signup to use chat.",
      });
      return;
    }

    const success = sendMessage(message);
    if (!success) {
      toast({
        variant: "destructive",
        title: "Failed to Send",
        description: "Could not send message. Please try again.",
      });
    }
  };

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
      <div className="w-full max-w-full overflow-x-hidden">
        {/* Content - with top padding to account for fixed header */}
        <div className="flex flex-col min-h-screen w-full max-w-full" style={{paddingTop: 'clamp(70px, 100px, 100px)'}}>
          {/* Wrapper for content + footer */}
          <div className="flex-1 flex flex-col w-full max-w-full overflow-x-hidden">
            {/* Content wrapper */}
            <div className="flex-1 flex flex-col max-w-full">
              <div className="flex-1 flex max-w-full">
                {/* Left sidebar - Chat (Global/Persistent) */}
                <ChatSidebar
                  isCollapsed={isChatCollapsed}
                  onToggleCollapse={() => setIsChatCollapsed(!isChatCollapsed)}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  canChat={!!address && !!username}
                  placeholderText={!address ? "Connect wallet to chat..." : !username ? "Complete signup to chat..." : "Type Message Here..."}
                  onlineUsers={onlineUsers}
                  onShowChatRules={() => setShowChatRules(true)}
                />

                {/* Main content area */}
                <div className="flex-1 flex flex-col relative min-w-0">
                  {children}
                </div>

                {/* Right sidebar - Leaderboard (Global/Persistent) */}
                <div className="hidden lg:block flex-shrink-0 space-y-3 transition-all duration-300 relative glass-panel" style={{
                  width: isLeaderboardCollapsed ? '0px' : '345px',
                  paddingLeft: '0px',
                  paddingTop: isLeaderboardCollapsed ? '0px' : '24px',
                  paddingBottom: isLeaderboardCollapsed ? '0px' : '24px',
                  paddingRight: '0px',
                  overflow: 'visible',
                  zIndex: 50,
                  borderRadius: '0px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignSelf: 'stretch'
                }}>
                  <button
                    onClick={() => setIsLeaderboardCollapsed(!isLeaderboardCollapsed)}
                    className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center hover-elevate active-elevate-2 transition-all duration-300"
                    style={{
                      right: isLeaderboardCollapsed ? '71px' : 'calc(100% - 324px)',
                      zIndex: 9999,
                      borderRadius: isLeaderboardCollapsed ? '8px' : '4px',
                      width: isLeaderboardCollapsed ? '89px' : '34px',
                      height: '79px',
                      background: 'rgba(20, 20, 20, 1)',
                      border: '1px solid rgba(60, 60, 60, 0.4)',
                      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 2px 8px rgba(0, 0, 0, 0.5)'
                    }}
                    data-testid="button-collapse-leaderboard"
                  >
                    {isLeaderboardCollapsed ? (
                      <Flame className="w-8 h-8 text-white" />
                    ) : (
                      <svg className="w-3 h-3 text-foreground transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                
                {!isLeaderboardCollapsed && (
                  <div style={{marginTop: '-85px', marginLeft: '23px'}}>
                    <div className="p-1" style={{width: '297px'}}>
                      <div className="glass-panel p-4 neon-border relative" style={{borderRadius: '18px', overflow: 'visible'}}>
                        <div className="absolute -top-2 -right-2 w-20 h-20 z-10 group cursor-pointer">
                          <img src={coinStack} alt="Coins" className="w-20 h-20 wiggle-on-hover" />
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                            <svg className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 animate-ping" viewBox="0 0 24 24" style={{animationDelay: '0s', filter: 'drop-shadow(0 0 4px rgba(253, 224, 71, 0.8))'}}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FCD34D"/></svg>
                            <svg className="absolute top-0 right-0 w-2.5 h-2.5 animate-ping" viewBox="0 0 24 24" style={{animationDelay: '0.1s', filter: 'drop-shadow(0 0 3px rgba(254, 240, 138, 0.8))'}}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FEF08A"/></svg>
                            <svg className="absolute top-1/4 -left-2 w-3.5 h-3.5 animate-ping" viewBox="0 0 24 24" style={{animationDelay: '0.2s', filter: 'drop-shadow(0 0 5px rgba(250, 204, 21, 0.8))'}}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FACC15"/></svg>
                            <svg className="absolute top-1/3 right-1/4 w-2.5 h-2.5 animate-ping" viewBox="0 0 24 24" style={{animationDelay: '0.15s', filter: 'drop-shadow(0 0 3px rgba(253, 224, 71, 0.8))'}}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FDE047"/></svg>
                            <svg className="absolute top-1/2 -right-2 w-3 h-3 animate-ping" viewBox="0 0 24 24" style={{animationDelay: '0.25s', filter: 'drop-shadow(0 0 4px rgba(254, 240, 138, 0.8))'}}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FEF08A"/></svg>
                            <svg className="absolute top-1/2 left-0 w-2.5 h-2.5 animate-ping" viewBox="0 0 24 24" style={{animationDelay: '0.3s', filter: 'drop-shadow(0 0 3px rgba(250, 204, 21, 0.8))'}}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FACC15"/></svg>
                            <svg className="absolute top-2/3 left-1/3 w-3 h-3 animate-ping" viewBox="0 0 24 24" style={{animationDelay: '0.05s', filter: 'drop-shadow(0 0 4px rgba(253, 224, 71, 0.8))'}}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FDE047"/></svg>
                            <svg className="absolute bottom-1/4 -right-1 w-2.5 h-2.5 animate-ping" viewBox="0 0 24 24" style={{animationDelay: '0.35s', filter: 'drop-shadow(0 0 3px rgba(254, 240, 138, 0.8))'}}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FEF08A"/></svg>
                            <svg className="absolute bottom-1/3 left-1/4 w-3.5 h-3.5 animate-ping" viewBox="0 0 24 24" style={{animationDelay: '0.4s', filter: 'drop-shadow(0 0 5px rgba(250, 204, 21, 0.8))'}}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FACC15"/></svg>
                            <svg className="absolute -bottom-2 left-1/2 w-3 h-3 animate-ping" viewBox="0 0 24 24" style={{animationDelay: '0.12s', filter: 'drop-shadow(0 0 4px rgba(253, 224, 71, 0.8))'}}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FCD34D"/></svg>
                            <svg className="absolute bottom-0 -left-1 w-2.5 h-2.5 animate-ping" viewBox="0 0 24 24" style={{animationDelay: '0.18s', filter: 'drop-shadow(0 0 3px rgba(254, 240, 138, 0.8))'}}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FEF08A"/></svg>
                            <svg className="absolute top-1/4 left-1/2 w-3 h-3 animate-ping" viewBox="0 0 24 24" style={{animationDelay: '0.22s', filter: 'drop-shadow(0 0 4px rgba(250, 204, 21, 0.8))'}}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FACC15"/></svg>
                            <svg className="absolute top-3/4 right-1/3 w-2.5 h-2.5 animate-ping" viewBox="0 0 24 24" style={{animationDelay: '0.28s', filter: 'drop-shadow(0 0 3px rgba(253, 224, 71, 0.8))'}}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FDE047"/></svg>
                            <svg className="absolute top-1/2 left-1/4 w-3.5 h-3.5 animate-ping" viewBox="0 0 24 24" style={{animationDelay: '0.08s', filter: 'drop-shadow(0 0 5px rgba(254, 240, 138, 0.8))'}}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FEF08A"/></svg>
                            <svg className="absolute bottom-1/2 right-0 w-3 h-3 animate-ping" viewBox="0 0 24 24" style={{animationDelay: '0.33s', filter: 'drop-shadow(0 0 4px rgba(250, 204, 21, 0.8))'}}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FACC15"/></svg>
                            <svg className="absolute top-0 left-1/4 w-2.5 h-2.5 animate-ping" viewBox="0 0 24 24" style={{animationDelay: '0.38s', filter: 'drop-shadow(0 0 3px rgba(253, 224, 71, 0.8))'}}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FDE047"/></svg>
                            <svg className="absolute bottom-0 right-1/4 w-3 h-3 animate-ping" viewBox="0 0 24 24" style={{animationDelay: '0.14s', filter: 'drop-shadow(0 0 4px rgba(254, 240, 138, 0.8))'}}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FEF08A"/></svg>
                            <svg className="absolute top-1/3 left-0 w-2.5 h-2.5 animate-ping" viewBox="0 0 24 24" style={{animationDelay: '0.27s', filter: 'drop-shadow(0 0 3px rgba(250, 204, 21, 0.8))'}}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FACC15"/></svg>
                          </div>
                        </div>
                        <div className="flex items-center justify-start mb-3">
                          <img src={jackpotLegendsLogo} alt="Jackpot Legends" className="h-auto" style={{maxWidth: '200px', width: '200px'}} />
                        </div>
                        <div className="text-xs text-muted-foreground mb-4 uppercase tracking-wider text-center">TOP 3 BIGGEST WINNERS</div>
                        <div className="space-y-2">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-2 p-2 bg-background/50 rounded hover-elevate">
                              <Badge className="gradient-purple-pink text-black font-bold">{i}</Badge>
                              <div className="flex-1 text-sm font-medium">Player{i}</div>
                              <div className="font-mono font-bold no-text-shadow" style={{color: '#FFFFFF', fontSize: '1.01rem'}}>0.188</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{width: '100%', maxWidth: '297px', marginTop: '5px'}}>
                      <DailyStats type="latest" />
                    </div>

                    <div style={{width: '100%', maxWidth: '297px', marginTop: '10px'}}>
                      <DailyStats type="winner" />
                    </div>
                    <div style={{width: '100%', maxWidth: '297px', marginTop: '10px'}}>
                      <DailyStats type="lucky" />
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <GameFooter />
        </div>
      </div>

      {/* Chat Rules Modal */}
      <ChatRulesModal 
        open={showChatRules} 
        onOpenChange={setShowChatRules} 
      />
    </>
  );
}
