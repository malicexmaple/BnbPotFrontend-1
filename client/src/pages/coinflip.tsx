import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import GameNavigation from "@/components/GameNavigation";
import GameFooter from "@/components/GameFooter";
import ProfileModal from "@/components/ProfileModal";
import ChatSidebar from "@/components/ChatSidebar";
import ChatRulesModal from "@/components/ChatRulesModal";
import DailyStats from "@/components/DailyStats";
import MiningBlockOverlay from "@/components/MiningBlockOverlay";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGameState } from "@/hooks/useGameState";
import GameLayout from "@/components/GameLayout";
import { GAME, BORDER_RADIUS } from "@/constants/layout";
import type { RoundWithBets } from "@shared/schema";
import bnbLogo from '@assets/3dgifmaker21542_1763401668048.gif';
import bnbIcon from '@assets/bnb-bnb-logo_1763489145043.png';
import coinStack from '@assets/vecteezy_binance-coin-bnb-coin-stacks-cryptocurrency-3d-render_21627671_1763398880775.png';
import coinflipLogo from '@assets/coinflipnew_1763488010364.png';
import signupLogo from '@assets/signupnew_1763410821936.png';
import jackpotLegendsLogo from '@assets/jackpotlegends_1763742593143.png';
import coinsBackground from '@assets/Ycjxd8iDdsXoHotkLjUPo-item-0x1_1763550444466.png';

export default function Coinflip() {
  const { address, isConnecting, walletError, connect, disconnect, shouldShowSignup, username, agreedToTerms, markSignupComplete, messages, isConnected, isAuthenticated, onlineUsers, sendMessage, contract } = useGameState();
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
  
  // Static demo data for coinflip games (no random values to prevent re-render jitter)
  const demoGames = [
    { username: '999BW', level: 69, amount: 1.666 },
    { username: 'L3on', level: 25, amount: 0.002 },
    { username: 'Franciso', level: 20, amount: 0.002 },
    { username: 'AreWeUp', level: 19, amount: 0.002 },
    { username: 'CryptoKing', level: 45, amount: 0.125 },
    { username: 'BNBWhale', level: 38, amount: 0.500 },
    { username: 'MoonBoy', level: 22, amount: 0.050 },
    { username: 'DiamondHands', level: 31, amount: 0.200 },
  ];

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
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <div className="p-6 space-y-5 relative z-10 flex-shrink-0">
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
              
              {/* COINFLIP BETTING PANEL - Same theme as Jackpot BetControls */}
              <div className="px-4 py-3" style={{
                borderRadius: BORDER_RADIUS.STANDARD,
                background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.9), rgba(30, 30, 30, 0.9))',
                border: '2px solid rgba(60, 60, 60, 0.4)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
              }}>
                {/* Authentication requirement message */}
                {(!address || !username) && (
                  <div className="text-xs text-muted-foreground text-center mb-2 px-2" data-testid="text-coinflip-auth-required">
                    {!address ? "Connect wallet to bet" : "Create account to bet"} 
                    {address && !username && " (click Connect → Create Account)"}
                  </div>
                )}
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {/* Coin side selection - Heads */}
                  <button
                    className={`w-9 h-9 rounded-full flex items-center justify-center hover-elevate transition-all ${(!address || !username) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{
                      background: 'linear-gradient(135deg, #EAB308, #FCD34D)',
                      border: '2px solid rgba(234, 179, 8, 0.8)',
                      boxShadow: '0 0 10px rgba(234, 179, 8, 0.4)'
                    }}
                    disabled={!address || !username}
                    data-testid="button-coinflip-heads"
                  >
                    <img src={bnbLogo} alt="Heads" className="w-5 h-5" />
                  </button>
                  
                  {/* Coin side selection - Tails */}
                  <button
                    className={`w-9 h-9 rounded-full flex items-center justify-center hover-elevate transition-all ${(!address || !username) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{
                      background: 'rgba(15, 15, 15, 0.8)',
                      border: '2px solid rgba(60, 60, 60, 0.5)'
                    }}
                    disabled={!address || !username}
                    data-testid="button-coinflip-tails"
                  >
                    <svg className="w-5 h-5 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                      <text x="12" y="16" textAnchor="middle" fontSize="10" fill="currentColor">T</text>
                    </svg>
                  </button>

                  {/* Bet Input */}
                  <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg ${(!address || !username) ? 'opacity-50' : ''}`} style={{
                    background: 'rgba(20, 20, 20, 0.9)',
                    border: '1px solid rgba(60, 60, 60, 0.5)',
                    minWidth: '160px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.6)'
                  }}>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        placeholder="0.1"
                        className="w-16 text-sm font-semibold bg-transparent border-0 outline-none text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{lineHeight: '1.25rem', paddingTop: '1px'}}
                        disabled={!address || !username}
                        data-testid="input-coinflip-bet"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 pl-3 border-l border-border/20">
                      <span className="text-sm font-semibold text-foreground">BNB</span>
                      <img src={bnbIcon} alt="BNB" className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Increment Buttons - Same as Jackpot */}
                  {[0.001, 0.01, 0.1, 0.5, 1].map((increment) => (
                    <div key={increment} className={`px-3 py-2.5 rounded-lg ${(!address || !username) ? 'opacity-50' : ''}`} style={{
                      background: 'rgba(15, 15, 15, 0.8)',
                      border: '1px solid rgba(60, 60, 60, 0.5)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.6)'
                    }}>
                      <button
                        onClick={() => setBetAmount(String((parseFloat(betAmount) || 0) + increment))}
                        className="text-xs font-semibold text-foreground hover-elevate whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!address || !username}
                        data-testid={`button-coinflip-plus-${increment}`}
                      >
                        +{increment}
                      </button>
                    </div>
                  ))}

                  {/* Create Game Button */}
                  <div className={`glass-panel neon-border px-4 py-2.5 rounded-lg relative overflow-hidden ${(!address || !username) ? 'opacity-50 cursor-not-allowed' : ''}`} style={{
                    animation: (!address || !username) ? 'none' : 'floatAirdropBox 2s ease-in-out infinite'
                  }}>
                    {/* Background coins image */}
                    <div className="absolute inset-0 z-0" style={{
                      backgroundImage: `url(${coinsBackground})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      opacity: 0.3,
                      borderRadius: 'inherit'
                    }} />
                    <button
                      onClick={handlePlaceBet}
                      className="relative z-10 hover-elevate active-elevate-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!address || !username}
                      data-testid="button-create-game"
                    >
                      <span className="text-xs font-bold uppercase tracking-wide" style={{
                        background: 'linear-gradient(180deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        filter: 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.9)) drop-shadow(0 0 4px rgba(0, 0, 0, 0.7))',
                        textShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
                      }}>
                        CREATE GAME
                      </span>
                    </button>
                  </div>
                </div>
                
              </div>
            </div>

            {/* COINFLIP GAMES LIST */}
            <div className="flex justify-center">
              <div className="carousel-container relative">
                {/* Width anchor to match Jackpot carousel width and prevent mobile zoom differences */}
                <div aria-hidden="true" style={{ width: '1008px', height: 0, visibility: 'hidden' }} />
                <div className="px-6">
                {/* Header Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground uppercase tracking-wider">All Games</span>
                  <span className="text-foreground font-bold">{currentRound?.totalBets || 0}</span>
                  <Badge variant="outline" className="text-xs">
                    <img src={bnbLogo} alt="BNB" className="w-3 h-3 mr-1" />
                    Payouts are settled in BNB
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">Sort By</span>
                  <span className="text-foreground">High to Low</span>
                  <span className="text-muted-foreground ml-2">Amount</span>
                  <span className="text-foreground">All</span>
                </div>
              </div>

              {/* Games List */}
              <div className="space-y-2">
                {demoGames.map((game, i) => (
                  <div 
                    key={`game-${i}`}
                    className="glass-panel p-3 hover-elevate transition-all"
                    style={{borderRadius: BORDER_RADIUS.STANDARD}}
                    data-testid={`coinflip-game-${i}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* Player 1 */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="relative flex-shrink-0">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-primary/20 to-primary/5">
                              {game.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold px-1 rounded" style={{minWidth: '18px', textAlign: 'center'}}>
                            {game.level}
                          </div>
                        </div>
                        <span className="font-medium text-foreground truncate text-sm">{game.username}</span>
                      </div>

                      {/* VS Icon */}
                      <div className="flex-shrink-0 px-2">
                        <svg className="w-5 h-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round"/>
                        </svg>
                      </div>

                      {/* Player 2 (Waiting) */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-muted/30 border border-border/30 flex items-center justify-center">
                            <svg className="w-5 h-5 text-muted-foreground/50" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 4C9.243 4 7 6.243 7 9h2c0-1.654 1.346-3 3-3s3 1.346 3 3c0 1.069-.454 1.465-1.481 2.255-.382.294-.813.626-1.226 1.038C10.981 13.604 10.995 14.897 11 15v2h2v-2.009c0-.024.023-.601.707-1.284.32-.32.682-.598 1.031-.867C15.798 12.024 17 11.1 17 9c0-2.757-2.243-5-5-5zm-1 14h2v2h-2z"/>
                            </svg>
                          </div>
                          <div className="absolute -bottom-1 -right-1 bg-muted text-muted-foreground text-[10px] font-bold px-1 rounded" style={{minWidth: '18px', textAlign: 'center'}}>
                            1
                          </div>
                        </div>
                        <span className="text-muted-foreground text-sm">Waiting...</span>
                      </div>

                      {/* Amount */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <img src={bnbLogo} alt="BNB" className="w-4 h-4" />
                        <span className="font-mono font-bold text-foreground">{game.amount.toFixed(3)}</span>
                      </div>

                      {/* Join Button */}
                      <Button 
                        size="sm" 
                        className="flex-shrink-0"
                        data-testid={`button-join-${i}`}
                      >
                        Join
                      </Button>

                      {/* View Icon */}
                      <button className="flex-shrink-0 p-2 text-muted-foreground hover:text-foreground transition-colors" data-testid={`button-view-${i}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div><span className="text-foreground font-semibold">{currentRound?.totalBets || 0}</span> Players</div>
              <div>•</div>
              <div>Payouts are settled in BNB</div>
              <div>•</div>
              <div>Round: <span className="font-mono" data-testid="text-round">#{currentRound?.roundNumber || 1}</span></div>
            </div>
          </div>

          {/* PLAYER LIST */}
          <div className="flex-1 border-t border-border/30 overflow-hidden relative z-10">
            <ScrollArea className="h-full px-6 py-5">
              {currentRound?.bets && currentRound.bets.length > 0 ? (
                <div className="space-y-3">
                  {currentRound.bets.map((bet: any) => {
                    const betAmount = parseFloat(bet.amount);
                    const winChance = totalPot > 0 ? (betAmount / totalPot) * 100 : 0;
                    // Approximate BNB to USD conversion (example rate)
                    const bnbToUsd = 300; // This should come from API in production
                    const usdValue = betAmount * bnbToUsd;
                    
                    return (
                      <div
                        key={bet.id}
                        className="glass-panel p-4 hover-elevate transition-all"
                        style={{borderRadius: BORDER_RADIUS.STANDARD}}
                        data-testid={`player-row-${bet.id}`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          {/* Player Info */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Avatar className="w-10 h-10 flex-shrink-0">
                              <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-primary/20 to-primary/5">
                                {bet.username ? bet.username.slice(0, 2).toUpperCase() : bet.userAddress.slice(2, 4).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-foreground truncate">
                                {bet.username || `${bet.userAddress.slice(0, 6)}...${bet.userAddress.slice(-4)}`}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {bet.userAddress.slice(0, 10)}...{bet.userAddress.slice(-8)}
                              </div>
                            </div>
                          </div>
                          
                          {/* Bet Amount */}
                          <div className="text-right">
                            <div className="font-bold text-primary font-mono">
                              {betAmount.toFixed(4)} BNB
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ${usdValue.toFixed(2)}
                            </div>
                          </div>
                          
                          {/* Win Chance */}
                          <div className="text-right min-w-[80px]">
                            <Badge variant="outline" className="font-mono">
                              {winChance.toFixed(2)}%
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              Chance
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  <div className="text-center space-y-2">
                    <svg className="w-12 h-12 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p>No players in this round</p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </GameLayout>

      {/* Signup Dialog */}
      <Dialog open={shouldShowSignup} onOpenChange={() => {}}>
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
              background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.8), rgba(30, 30, 30, 0.8))',
              border: '2px solid rgba(234, 179, 8, 0.5)',
              boxShadow: '0 0 20px rgba(234, 179, 8, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
            }} 
            data-testid="button-create-account"
          >
            Create Account
          </Button>
        </DialogContent>
      </Dialog>

      {/* Terms and Conditions Dialog */}
      <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] border-0 p-6 signup-dialog">
          <ScrollArea className="h-96 pr-4">
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-bold text-foreground mb-2">1. Acceptance of Terms</h3>
                <p className="text-muted-foreground">
                  By accessing and using BNBPOT ("the Platform"), you acknowledge that you have read, understood, and agree 
                  to be bound by these Terms and Conditions. If you do not agree to these terms, you must immediately 
                  discontinue use of the Platform.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">2. Licensing and Jurisdiction</h3>
                <p className="text-muted-foreground">
                  BNBPOT operates under the jurisdiction and regulatory oversight of the Anjouan Gaming Authority. The Platform 
                  is licensed and regulated in accordance with the laws of Anjouan. By using this Platform, you agree that any 
                  legal matters, disputes, or regulatory issues shall be governed by and construed in accordance with the laws 
                  of Anjouan. You acknowledge that you are accessing the Platform from a jurisdiction where online gambling is 
                  legal and that you are solely responsible for ensuring compliance with your local laws and regulations.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">3. Eligibility Requirements</h3>
                <p className="text-muted-foreground mb-2">
                  You must meet ALL of the following requirements to use this Platform:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>You are at least 18 years of age (or the legal age of majority in your jurisdiction)</li>
                  <li>You are legally permitted to participate in gambling activities in your jurisdiction</li>
                  <li>You are not located in a jurisdiction where online gambling is prohibited</li>
                  <li>You are acting on your own behalf and not on behalf of any third party</li>
                  <li>All information provided during registration is accurate and truthful</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">4. Provably Fair Gaming</h3>
                <p className="text-muted-foreground">
                  BNBPOT is committed to providing provably fair gaming experiences. Our platform utilizes cryptographic 
                  algorithms and blockchain technology to ensure game outcomes are verifiable and cannot be manipulated. 
                  Game results are generated using transparent, auditable mechanisms. However, we make no guarantees 
                  regarding winning outcomes, as all games involve an element of chance.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">5. No Liability for Losses</h3>
                <p className="text-muted-foreground mb-2">
                  <span className="font-bold text-foreground">YOU ACKNOWLEDGE AND AGREE THAT:</span>
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>All gambling involves risk, and you may lose your entire wager</li>
                  <li>BNBPOT is NOT responsible for any financial losses incurred through use of the Platform</li>
                  <li>You are solely responsible for your gambling decisions and their consequences</li>
                  <li>We do not guarantee any specific outcomes or returns on your wagers</li>
                  <li>Cryptocurrency values are volatile and may result in additional financial risk</li>
                  <li>Network fees, gas fees, and transaction costs are your responsibility</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">6. Limitation of Liability</h3>
                <p className="text-muted-foreground">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, BNBPOT, ITS OPERATORS, AFFILIATES, AND SERVICE PROVIDERS SHALL 
                  NOT BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING 
                  FROM OR RELATED TO YOUR USE OF THE PLATFORM. This includes but is not limited to: loss of funds, loss of 
                  profits, loss of data, service interruptions, technical malfunctions, unauthorized access, or any other 
                  losses or damages.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">7. Responsible Gaming</h3>
                <p className="text-muted-foreground mb-2">
                  We encourage responsible gaming practices. You agree to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Only wager amounts you can afford to lose</li>
                  <li>Set personal limits on your gambling activities</li>
                  <li>Seek help if you believe you may have a gambling problem</li>
                  <li>Not use the Platform as a source of income or financial investment</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">8. Prohibited Activities</h3>
                <p className="text-muted-foreground mb-2">
                  You agree NOT to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Use the Platform for money laundering or other illegal activities</li>
                  <li>Create multiple accounts or use the Platform fraudulently</li>
                  <li>Attempt to manipulate, exploit, or hack the Platform</li>
                  <li>Use bots, scripts, or automated systems</li>
                  <li>Collude with other users to gain unfair advantages</li>
                  <li>Provide false or misleading information</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">9. Account Security</h3>
                <p className="text-muted-foreground">
                  You are solely responsible for maintaining the security of your wallet and account credentials. BNBPOT 
                  will NEVER ask for your private keys or seed phrases. Any losses due to compromised accounts, lost 
                  private keys, or unauthorized access are your sole responsibility.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">10. Intellectual Property</h3>
                <p className="text-muted-foreground">
                  All content, trademarks, logos, and intellectual property on the Platform are owned by BNBPOT or its 
                  licensors. You may not copy, reproduce, distribute, or create derivative works without explicit permission.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">11. Dispute Resolution and Arbitration</h3>
                <p className="text-muted-foreground mb-2">
                  In the event of a dispute arising from your use of the Platform or these Terms, you agree to follow the 
                  dispute resolution process outlined below:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li><span className="font-bold text-foreground">Step 1 - Direct Resolution:</span> You must first attempt to resolve the dispute by contacting BNBPOT customer support directly. We will make reasonable efforts to resolve disputes within 30 days.</li>
                  <li><span className="font-bold text-foreground">Step 2 - Anjouan eGaming Authority:</span> If the dispute cannot be resolved directly, you may submit a complaint to the Anjouan Gaming Control Board, which provides independent dispute resolution and mediation services for players. Contact details and procedures are available through the licensing authority.</li>
                  <li><span className="font-bold text-foreground">Step 3 - Arbitration:</span> Any disputes not resolved through the above steps shall be settled by binding arbitration conducted in Anjouan under the laws of Anjouan. The arbitration shall be conducted in English, and the decision of the arbitrator shall be final and binding on all parties.</li>
                  <li><span className="font-bold text-foreground">Class Action Waiver:</span> You agree to resolve disputes on an individual basis only and waive any right to participate in class action lawsuits or class-wide arbitration.</li>
                  <li><span className="font-bold text-foreground">Governing Law:</span> These dispute resolution procedures shall be governed by and construed in accordance with the laws of Anjouan, without regard to conflict of law provisions.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">12. Indemnification</h3>
                <p className="text-muted-foreground">
                  You agree to indemnify, defend, and hold harmless BNBPOT and its operators from any claims, damages, 
                  losses, liabilities, and expenses (including legal fees) arising from your use of the Platform, violation 
                  of these terms, or violation of any applicable laws.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">13. Changes to Terms</h3>
                <p className="text-muted-foreground">
                  BNBPOT reserves the right to modify these terms at any time. Continued use of the Platform after changes 
                  constitutes acceptance of the modified terms. You are responsible for regularly reviewing these terms.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">13. Termination</h3>
                <p className="text-muted-foreground">
                  We reserve the right to suspend or terminate your access to the Platform at any time, for any reason, 
                  without notice. Upon termination, these terms shall remain in effect for any disputes or claims.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">14. Severability</h3>
                <p className="text-muted-foreground">
                  If any provision of these terms is found to be invalid or unenforceable, the remaining provisions shall 
                  continue in full force and effect.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">15. Entire Agreement</h3>
                <p className="text-muted-foreground">
                  These terms constitute the entire agreement between you and BNBPOT regarding use of the Platform and 
                  supersede all prior agreements or understandings.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">16. Jurisdiction and Governing Law</h3>
                <p className="text-muted-foreground">
                  These Terms shall be governed by and construed in accordance with the laws of Anjouan, 
                  without regard to its conflict of law provisions. You agree to submit to the exclusive jurisdiction of courts 
                  located in Anjouan for the resolution of any disputes. You waive any objection to venue in such courts.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">17. Licensing and Regulatory Compliance</h3>
                <p className="text-muted-foreground">
                  BNBPOT operates under applicable gaming licenses and regulatory frameworks. Users are prohibited from accessing 
                  the Platform from jurisdictions where online gambling is illegal. By using the Platform, you represent and 
                  warrant that you are in compliance with all applicable laws and regulations in your jurisdiction. We reserve 
                  the right to verify your location and block access from restricted territories.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">18. Anti-Money Laundering (AML) and Know Your Customer (KYC)</h3>
                <p className="text-muted-foreground mb-2">
                  BNBPOT maintains strict AML and KYC policies. You agree that:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>We may require identity verification documents at any time</li>
                  <li>Failure to provide requested documentation may result in account suspension</li>
                  <li>We reserve the right to report suspicious activities to relevant authorities</li>
                  <li>Accounts may be frozen pending investigation of potential violations</li>
                  <li>Source of funds verification may be required for large transactions</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">19. Cryptocurrency and Digital Asset Risks</h3>
                <p className="text-muted-foreground mb-2">
                  <span className="font-bold text-foreground">YOU ACKNOWLEDGE THE FOLLOWING RISKS:</span>
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Cryptocurrency values are extremely volatile and unpredictable</li>
                  <li>Digital assets may lose all value without warning</li>
                  <li>Blockchain transactions are irreversible once confirmed</li>
                  <li>Network congestion may delay or prevent transactions</li>
                  <li>Smart contract vulnerabilities could result in loss of funds</li>
                  <li>Regulatory changes may impact the legality or value of digital assets</li>
                  <li>We are not responsible for market fluctuations or technical blockchain issues</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">20. Wallet Security and Private Key Management</h3>
                <p className="text-muted-foreground">
                  <span className="font-bold text-foreground">CRITICAL:</span> You are solely and exclusively responsible for 
                  the security of your cryptocurrency wallet and private keys. BNBPOT does not have access to, store, or manage 
                  your private keys. Loss of private keys, seed phrases, or wallet credentials will result in permanent, 
                  irreversible loss of funds. We cannot recover lost wallets or reverse transactions. Never share your private 
                  keys with anyone, including individuals claiming to represent BNBPOT.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">21. Transaction Fees and Costs</h3>
                <p className="text-muted-foreground">
                  All blockchain transaction fees (gas fees), network fees, and associated costs are your sole responsibility. 
                  These fees are determined by the blockchain network and are subject to change based on network conditions. 
                  BNBPOT may charge platform fees, which will be clearly disclosed before transaction confirmation. All fees 
                  are non-refundable.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">22. Platform Availability and Force Majeure</h3>
                <p className="text-muted-foreground">
                  BNBPOT does not guarantee uninterrupted platform availability. We shall not be liable for service interruptions 
                  caused by maintenance, technical issues, blockchain network problems, cyberattacks, natural disasters, government 
                  actions, or any other circumstances beyond our reasonable control. We reserve the right to suspend operations 
                  temporarily or permanently without prior notice.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">23. Audit Rights and Account Suspension</h3>
                <p className="text-muted-foreground">
                  BNBPOT reserves the right to audit any account, transaction, or activity at any time. We may temporarily suspend 
                  accounts during investigations of suspected fraud, money laundering, terms violations, or illegal activities. 
                  Funds may be held pending resolution of investigations. We are not obligated to provide detailed explanations 
                  for account suspensions or terminations.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">24. Bonus Terms and Promotional Offers</h3>
                <p className="text-muted-foreground">
                  All bonuses, promotions, and special offers are subject to specific terms and conditions, which will be provided 
                  separately. Bonuses may have wagering requirements, time limitations, and withdrawal restrictions. BNBPOT reserves 
                  the right to void bonuses if fraud or abuse is detected. Promotional terms may be modified or cancelled at any time.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">25. Data Privacy and Protection</h3>
                <p className="text-muted-foreground">
                  Your use of the Platform is subject to our Privacy Policy. We collect, process, and store personal data in 
                  accordance with applicable data protection laws. By using the Platform, you consent to data collection and 
                  processing as described in our Privacy Policy. We may share information with regulators, law enforcement, and 
                  service providers as required by law or necessary for platform operations.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">26. Third-Party Services and Links</h3>
                <p className="text-muted-foreground">
                  The Platform may contain links to third-party services, wallets, or websites. BNBPOT is not responsible for the 
                  content, security, or practices of third-party services. Your interactions with third parties are solely between 
                  you and such parties. We disclaim all liability for third-party services.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">27. Winnings and Withdrawals</h3>
                <p className="text-muted-foreground">
                  Winnings are subject to verification and compliance checks before withdrawal. We reserve the right to delay or 
                  refuse withdrawals if fraud is suspected, terms are violated, or identity verification is incomplete. Withdrawal 
                  limits and processing times may apply. All withdrawals are subject to applicable fees and blockchain confirmation 
                  times. Tax reporting obligations for winnings are your sole responsibility.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">28. Class Action Waiver</h3>
                <p className="text-muted-foreground">
                  <span className="font-bold text-foreground">YOU EXPRESSLY WAIVE YOUR RIGHT TO PARTICIPATE IN CLASS ACTIONS, 
                  CLASS ARBITRATIONS, OR REPRESENTATIVE ACTIONS AGAINST BNBPOT.</span> All disputes must be brought individually. 
                  You may not consolidate your claim with claims of other users. This waiver is binding and enforceable to the 
                  maximum extent permitted by law.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">29. Limitation Period for Claims</h3>
                <p className="text-muted-foreground">
                  Any claim or cause of action arising from or related to use of the Platform must be filed within ONE (1) YEAR 
                  after the claim or cause of action arose. Failure to file within this period constitutes a permanent bar to such 
                  claim.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">30. Assignment and Transfer</h3>
                <p className="text-muted-foreground">
                  You may not assign, transfer, or delegate these Terms or your account to any third party. BNBPOT may freely 
                  assign these Terms and all rights hereunder to any third party without notice or consent.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">31. Complete Disclaimer of Warranties</h3>
                <p className="text-muted-foreground">
                  <span className="font-bold text-foreground">THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES 
                  OF ANY KIND, EXPRESS OR IMPLIED.</span> We disclaim all warranties including merchantability, fitness for a 
                  particular purpose, non-infringement, accuracy, and reliability. We do not warrant that the Platform will be 
                  error-free, secure, or uninterrupted.
                </p>
              </div>

              <div className="p-4 bg-muted/30 border border-border/50 rounded-lg mt-6">
                <p className="text-xs text-muted-foreground italic">
                  Last Updated: November 2024. These terms are subject to change. Continued use constitutes acceptance of modified terms.
                </p>
              </div>
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
