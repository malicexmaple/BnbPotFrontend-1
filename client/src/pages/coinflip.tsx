import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import GameNavigation from "@/components/GameNavigation";
import GameFooter from "@/components/GameFooter";
import ProfileModal from "@/components/ProfileModal";
import ChatSidebar from "@/components/ChatSidebar";
import BetControls from "@/components/BetControls";
import ChatRulesModal from "@/components/ChatRulesModal";
import DailyStats from "@/components/DailyStats";
import MiningBlockOverlay from "@/components/MiningBlockOverlay";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGameState } from "@/hooks/useGameState";
import GameLayout from "@/components/GameLayout";
import { GAME } from "@/constants/layout";
import type { RoundWithBets } from "@shared/schema";
import coinStack from '@assets/vecteezy_binance-coin-bnb-coin-stacks-cryptocurrency-3d-render_21627671_1763398880775.png';
import coinflipLogo from '@assets/coinflipnew_1763488010364.png';
import signupLogo from '@assets/signupnew_1763410821936.png';
import jackpotLegendsLogo from '@assets/jackpotlegends_1763742593143.png';

export default function Coinflip() {
  const { address, isConnecting, walletError, connect, disconnect, username, agreedToTerms, markSignupComplete, messages, isConnected, isAuthenticated, onlineUsers, sendMessage, contract } = useGameState();
  const { toast } = useToast();
  
  // Fetch current round data
  const { data: currentRound, isLoading: isLoadingRound } = useQuery<RoundWithBets>({
    queryKey: ['/api/rounds/current'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });
  
  const [timeRemaining, setTimeRemaining] = useState<number>(GAME.ROUND_DURATION);
  const [betAmount, setBetAmount] = useState("");
  const [showChatRules, setShowChatRules] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [isLeaderboardCollapsed, setIsLeaderboardCollapsed] = useState(false);
  const [showMiningBlock, setShowMiningBlock] = useState(false);
  const [miningBlockNumber, setMiningBlockNumber] = useState<number | undefined>(undefined);
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    referralCode: "",
    agreedToTerms: false
  });

  // Expose utility functions for testing
  useEffect(() => {
    (window as any).clearAllAvatars = () => {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('avatar_')) {
          localStorage.removeItem(key);
        }
      });
      console.log('✅ All avatars cleared! Refresh the page to see changes.');
      window.location.reload();
    };
    
    (window as any).clearAll = () => {
      localStorage.clear();
      console.log('✅ All localStorage cleared! Refresh the page to see changes.');
      window.location.reload();
    };
  }, []);

  // Track previous round to detect when a round actually completes
  const prevRoundRef = useRef<any>(null);

  // Show mining block ONLY when an active round with bets actually completes
  useEffect(() => {
    if (currentRound && prevRoundRef.current) {
      const prevRound = prevRoundRef.current;
      
      // Detect round completion: round ID changed AND previous round was active with bets
      const roundChanged = prevRound.id !== currentRound.id;
      const prevWasActive = prevRound.status === "active";
      const prevHadBets = prevRound.totalBets > 0;
      const prevCompleted = prevRound.status === "completed";
      
      // Only show mining block if:
      // 1. Previous round was active with actual bets, OR
      // 2. Previous round just completed (status changed to completed)
      const shouldShowMining = (roundChanged && prevWasActive && prevHadBets) || 
                               (!prevCompleted && currentRound.status === "completed" && currentRound.totalBets > 0);
      
      if (shouldShowMining) {
        setShowMiningBlock(true);
        setMiningBlockNumber(Math.floor(Math.random() * 1000000) + 468940000); // Mock block number
      }
    }
    
    // Update ref for next comparison
    prevRoundRef.current = currentRound;
  }, [currentRound]);

  useEffect(() => {
    if (walletError) {
      toast({
        variant: "destructive",
        title: "Wallet Connection Failed",
        description: walletError,
      });
    }
  }, [walletError, toast]);

  useEffect(() => {
    if (address && !walletError) {
      toast({
        title: "Wallet Connected",
        description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)} on BNB Smart Chain`,
      });
    }
  }, [address, walletError, toast]);

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

  /**
   * Handles new user signup form submission.
   * Validates required fields, sends to backend API, and resets form.
   */
  const handleSignupSubmit = async () => {
    if (!signupData.name || !signupData.email || !signupData.agreedToTerms) {
      toast({
        variant: "destructive",
        title: "Incomplete Form",
        description: "Please fill in all required fields and agree to the terms.",
      });
      return;
    }

    try {
      // Send signup data to backend API (wallet address is in authenticated session)
      await apiRequest("POST", "/api/users/signup", {
        username: signupData.name,
        email: signupData.email
      });

      // Also mark in localStorage for immediate UI update
      markSignupComplete(signupData.name);

      toast({
        title: "Account Created",
        description: `Welcome to BNBPOT, ${signupData.name}!`,
      });

      setSignupData({ name: "", email: "", referralCode: "", agreedToTerms: false });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: error instanceof Error ? error.message : "Failed to create account. Please try again.",
      });
    }
  };

  /**
   * Handles placing a bet.
   * Uses blockchain if contract available, otherwise falls back to database.
   */
  const handlePlaceBet = async () => {
    if (!address) {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "Please connect your wallet to place a bet.",
      });
      return;
    }

    if (!username) {
      toast({
        variant: "destructive",
        title: "Signup Required",
        description: "Please complete signup to place bets.",
      });
      return;
    }

    if (!agreedToTerms) {
      toast({
        variant: "destructive",
        title: "Terms Agreement Required",
        description: "You must agree to the terms and conditions during signup to place bets.",
      });
      return;
    }

    if (!betAmount || parseFloat(betAmount) <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Bet Amount",
        description: "Please enter a valid bet amount.",
      });
      return;
    }

    // Try blockchain first if contract is available
    if (contract.isContractAvailable && contract.placeBet) {
      try {
        const result = await contract.placeBet(betAmount);
        
        if (result.success) {
          toast({
            title: "Bet Placed on Blockchain! 🎲",
            description: `Transaction: ${result.txHash?.slice(0, 10)}... View on BSCScan`,
          });
          setBetAmount("");
        } else {
          // Blockchain bet failed, fall back to database
          console.log("Blockchain bet failed, using database:", result.error);
          await placeBetDatabase();
        }
      } catch (error) {
        // Blockchain bet failed, fall back to database
        console.error("Blockchain error, using database:", error);
        await placeBetDatabase();
      }
    } else {
      // No contract, use database
      await placeBetDatabase();
    }
  };

  /**
   * Place bet using database (fallback mode)
   * Wallet address comes from authenticated session on backend
   */
  const placeBetDatabase = async () => {
    try {
      await apiRequest("POST", "/api/bets", {
        username: username,
        amount: betAmount,
      });

      await queryClient.invalidateQueries({ queryKey: ['/api/rounds/current'] });

      toast({
        title: "Bet Placed",
        description: `You bet ${betAmount} BNB on this round!`,
      });

      setBetAmount("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Bet Failed",
        description: error instanceof Error ? error.message : "Failed to place bet. Please try again.",
      });
    }
  };

  // Calculate user's stats from current round
  const userBets = currentRound?.bets?.filter((bet: any) => bet.userAddress === address) || [];
  const userWager = userBets.reduce((sum: number, bet: any) => sum + parseFloat(bet.amount || "0"), 0);
  const totalPot = parseFloat(currentRound?.totalPot || "0");
  const userChance = totalPot > 0 ? (userWager / totalPot) * 100 : 0;

  // Use API timeRemaining if countdown is active, otherwise use local timer
  const actualTimeRemaining = currentRound?.isCountdownActive ? (currentRound.timeRemaining ?? 90) : timeRemaining;
  const minutes = Math.floor(actualTimeRemaining / 60);
  const seconds = actualTimeRemaining % 60;

  const shouldShowSignup = address && !username;

  return (
    <>
      <GameLayout
        header={
          <GameNavigation 
            onConnect={connect} 
            onDisconnect={disconnect} 
            isConnected={!!address} 
            isConnecting={isConnecting} 
            walletAddress={address || undefined} 
            username={username || undefined} 
            onOpenProfile={() => setShowProfileModal(true)} 
          />
        }
        leftSidebar={
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
        }
        rightSidebar={
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
        }
        footer={<GameFooter />}
      >
        {/* Main game area content */}
        <div className="flex-1 flex flex-col relative">
          <div className="p-6 space-y-5 relative z-10">
            {/* HEADER */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-col">
                <div className="shine-image" style={{'--shine-mask': `url(${coinflipLogo})`} as React.CSSProperties}>
                  <img src={coinflipLogo} alt="COINFLIP" className="w-full max-w-[450px]" style={{height: 'auto'}} />
                </div>
                <div className="flex justify-end pr-4" style={{marginTop: '-15px'}}>
                  <div className="text-sm uppercase tracking-widest shine-text font-semibold italic" style={{
                    color: 'rgb(161, 161, 170)',
                    textShadow: '0 0 10px rgba(234, 179, 8, 0.3)',
                    letterSpacing: '0.15em'
                  }}>
                    Double or nothing...
                  </div>
                </div>
              </div>
              
              <BetControls
                betAmount={betAmount}
                onBetAmountChange={setBetAmount}
                onPlaceBet={handlePlaceBet}
                isWalletConnected={!!address}
                hasAccount={!!username}
              />
            </div>

            {/* COINFLIP GAME AREA */}
            <div className="flex justify-center">
              <div className="glass-panel p-12 neon-border" style={{borderRadius: '18px', maxWidth: '600px', width: '100%'}}>
                {showMiningBlock && (
                  <MiningBlockOverlay
                    blockNumber={miningBlockNumber}
                    onComplete={() => setShowMiningBlock(false)}
                  />
                )}
                
                <div className="flex flex-col items-center gap-6">
                  <h2 className="text-2xl font-bold text-foreground">Coinflip Game Area</h2>
                  
                  {/* Coin placeholder */}
                  <div className="text-8xl" data-testid="coin-display">🪙</div>
                  
                  <p className="text-lg text-muted-foreground">Choose Heads or Tails</p>
                  
                  {/* Heads/Tails buttons */}
                  <div className="flex gap-4">
                    <Button 
                      size="lg"
                      className="text-lg px-8"
                      data-testid="button-heads"
                    >
                      Heads
                    </Button>
                    <Button 
                      size="lg"
                      className="text-lg px-8"
                      data-testid="button-tails"
                    >
                      Tails
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </GameLayout>

      {/* Signup Dialog */}
      <Dialog open={!!shouldShowSignup} onOpenChange={() => {}}>
        <DialogContent className="max-w-md border-0 p-6 [&>button:first-child]:hidden signup-dialog">
          <DialogHeader>
            <DialogTitle className="flex justify-center mb-2">
              <div className="shine-image" style={{'--shine-mask': `url(${signupLogo})`} as React.CSSProperties}>
                <img src={signupLogo} alt="Sign Up" className="h-16" />
              </div>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-center">
              Complete your account to start playing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Enter Name</label>
              <Input 
                value={signupData.name}
                onChange={(e) => setSignupData({...signupData, name: e.target.value})}
                placeholder="Name"
                className="h-10 text-sm bg-muted/30 border-border/20"
                data-testid="input-signup-name"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Enter Email</label>
              <Input 
                type="email"
                value={signupData.email}
                onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                placeholder="Email"
                className="h-10 text-sm bg-muted/30 border-border/20"
                data-testid="input-signup-email"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Referral Code</label>
              <Input 
                value={signupData.referralCode}
                onChange={(e) => setSignupData({...signupData, referralCode: e.target.value})}
                placeholder="Optional"
                className="h-10 text-sm bg-muted/30 border-border/20"
                data-testid="input-signup-referral"
              />
            </div>
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={signupData.agreedToTerms}
                onChange={(e) => setSignupData({...signupData, agreedToTerms: e.target.checked})}
                className="mt-1"
                data-testid="checkbox-terms"
              />
              <label className="text-sm text-muted-foreground">
                I agree that I am at least <span className="font-bold text-foreground">18 Years Old</span> and agree to the{' '}
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-primary hover:underline font-semibold"
                  data-testid="button-terms"
                >
                  terms and conditions
                </button>.
              </label>
            </div>
          </div>
          <Button 
            onClick={handleSignupSubmit}
            className="w-full mt-6 text-white text-lg font-bold border-0 h-14" 
            style={{
              background: 'linear-gradient(90deg, #8B5CF6 0%, #EC4899 100%)',
              boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)'
            }}
            data-testid="button-signup"
          >
            CREATE ACCOUNT
          </Button>
        </DialogContent>
      </Dialog>

      {/* Terms Modal */}
      <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] border-0">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Terms and Conditions</DialogTitle>
            <DialogDescription>
              Please read these terms carefully before using our platform
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6 text-sm">
              {/* Same terms content as home.tsx... truncated for brevity */}
              <div>
                <h3 className="font-bold text-foreground mb-2">1. Acceptance of Terms</h3>
                <p className="text-muted-foreground">
                  By accessing and using BNBPOT ("the Platform"), you agree to be bound by these Terms and Conditions.
                  If you do not agree, please do not use our services.
                </p>
              </div>
              {/* Add all other terms sections from home.tsx */}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <ChatRulesModal open={showChatRules} onOpenChange={setShowChatRules} />

      <ProfileModal
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
        username={username || "User"}
        walletAddress={address || undefined}
        onDisconnect={disconnect}
      />
    </>
  );
}
