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
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Trophy, TrendingUp, X, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";
import { useSignupTracking } from "@/hooks/useSignupTracking";
import { useChat } from "@/hooks/useChat";
import { useGameSocket } from "@/hooks/useGameSocket";
import { useJackpotContract } from "@/hooks/useJackpotContract";
import { GAME, CAROUSEL, GOLDEN, DARK_BG, BORDER_RADIUS } from "@/constants/layout";
import bnbLogo from '@assets/3dgifmaker21542_1763401668048.gif';
import clockIcon from '@assets/3dgifmaker22359_1763413463889.gif';
import cloverIcon from '@assets/3dgifmaker84959_1763403008581.gif';
import treasureChest from '@assets/3dgifmaker81317_1763413607076.gif';
import coinStack from '@assets/vecteezy_binance-coin-bnb-coin-stacks-cryptocurrency-3d-render_21627671_1763398880775.png';
import avatar1 from '@assets/generated_images/Gaming_avatar_placeholder_1_a3c2368d.png';
import avatar2 from '@assets/generated_images/Gaming_avatar_placeholder_2_b74e6961.png';
import avatar3 from '@assets/generated_images/Gaming_avatar_placeholder_3_f673a9f2.png';
import bnbpotBg from '@assets/MOSHED-2025-11-18-4-12-49_1763403537895.gif';
import jackpotLogo from '@assets/jackpotnew_1763477420573.png';
import crownIcon from '@assets/3dgifmaker85766_1763561140520.gif';
import signupLogo from '@assets/signupnew_1763410821936.png';
import jackpotLegendsLogo from '@assets/jackpotlegends_1763742593143.png';

export default function Home() {
  const { address, isConnecting, error, connect, disconnect } = useWallet();
  const { toast } = useToast();
  const { shouldShowSignup, username, agreedToTerms, markSignupComplete } = useSignupTracking(address);
  const { messages, isConnected, isAuthenticated, onlineUsers, sendMessage } = useChat({ 
    username: username || undefined, 
    walletAddress: address || undefined 
  });
  
  // Try to connect to smart contract (if deployed)
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || undefined;
  const contract = useJackpotContract(address, contractAddress);
  
  // Connect to game WebSocket for real-time bet updates (works for all users)
  useGameSocket();
  
  // Fetch current round data
  const { data: currentRound, isLoading: isLoadingRound } = useQuery({
    queryKey: ['/api/rounds/current'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });
  
  const [timeRemaining, setTimeRemaining] = useState<number>(GAME.ROUND_DURATION);
  const [betAmount, setBetAmount] = useState("");
  const [scrollOffset, setScrollOffset] = useState(0);
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
  const carouselRef = useRef<HTMLDivElement>(null);

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
    let animationFrame: number;
    let lastTime = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const delta = now - lastTime;
      lastTime = now;
      
      setScrollOffset(prev => {
        const newOffset = prev + (delta * CAROUSEL.ANIMATION_SPEED);
        if (!carouselRef.current) return newOffset;
        
        const resetPoint = (CAROUSEL.CARD_WIDTH + CAROUSEL.GAP) * CAROUSEL.TOTAL_CARDS;
        
        if (newOffset >= resetPoint) {
          return newOffset - resetPoint;
        }
        return newOffset;
      });
      
      animationFrame = requestAnimationFrame(animate);
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, []);


  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Wallet Connection Failed",
        description: error,
      });
    }
  }, [error, toast]);

  useEffect(() => {
    if (address && !error) {
      toast({
        title: "Wallet Connected",
        description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)} on BNB Smart Chain`,
      });
    }
  }, [address, error, toast]);

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
      {/* Fixed background */}
      <div className="fixed inset-0 space-bg" style={{
        backgroundImage: `url(${bnbpotBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        zIndex: -1
      }} />
      
      {/* ONE scrollable container with header + content */}
      <div className="w-full" style={{ minWidth: '1200px' }}>
        {/* Header - in normal flow, scrolls away */}
        <div className="w-full">
          <GameNavigation onConnect={connect} onDisconnect={disconnect} isConnected={!!address} isConnecting={isConnecting} walletAddress={address || undefined} username={username || undefined} onOpenProfile={() => setShowProfileModal(true)} />
        </div>

        {/* Content */}
        <div className="flex flex-col min-h-screen w-full">

      {/* Wrapper for content + footer */}
      <div className="flex-1 flex flex-col w-full">
        {/* Content wrapper */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex">
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

        {/* CENTER - MAIN GAME AREA */}
        <div className="flex-1 flex flex-col relative">
          <div className="p-6 space-y-5 relative z-10">
            {/* HEADER */}
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <div className="shine-image" style={{'--shine-mask': `url(${jackpotLogo})`} as React.CSSProperties}>
                  <img src={jackpotLogo} alt="JACKPOT" style={{height: 'auto', width: '450px'}} />
                </div>
                <div className="flex justify-end pr-4" style={{marginTop: '-15px'}}>
                  <div className="text-sm uppercase tracking-widest shine-text font-semibold italic" style={{
                    color: 'rgb(161, 161, 170)',
                    textShadow: '0 0 10px rgba(234, 179, 8, 0.3)',
                    letterSpacing: '0.15em'
                  }}>
                    Winner takes all...
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

            {/* STATS BAR */}
            <div className="p-1">
              <div className="flex flex-wrap gap-4 justify-center" style={{overflow: 'visible'}}>
                <div className="stat-box">
                  <div className="flex flex-col items-center gap-2" style={{overflow: 'visible'}}>
                    <div className="stat-icon-wrapper-large">
                      <img src={treasureChest} alt="Treasure Chest" className="h-16 w-16" />
                    </div>
                    <div className="text-4xl font-bold font-mono no-text-shadow" style={{color: '#FCD34D', marginBottom: '-1rem'}} data-testid="text-jackpot-value">
                      {isLoadingRound ? '...' : totalPot.toFixed(3)}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider text-center">Jackpot Value</div>
                  </div>
                </div>
                <div className="stat-box">
                  <div className="flex flex-col items-center gap-2" style={{overflow: 'visible'}}>
                    <div className="stat-icon-wrapper">
                      <img src={bnbLogo} alt="BNB" className="h-16 w-16" />
                    </div>
                    <div className="text-4xl font-bold font-mono no-text-shadow" style={{color: '#FCD34D', marginBottom: '-1rem'}} data-testid="text-your-wager">
                      {isLoadingRound ? '...' : userWager.toFixed(3)}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider text-center">Your Wager</div>
                  </div>
                </div>
                <div className="stat-box">
                  <div className="flex flex-col items-center gap-2" style={{overflow: 'visible'}}>
                    <div className="stat-icon-wrapper-small">
                      <img src={cloverIcon} alt="Clover" className="h-14 w-14" />
                    </div>
                    <div className="text-4xl font-bold font-mono no-text-shadow" style={{color: '#FCD34D', marginBottom: '-1rem'}} data-testid="text-your-chance">
                      {isLoadingRound ? '...' : userChance.toFixed(2)}%
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider text-center">Your Chance</div>
                  </div>
                </div>
                <div className="stat-box">
                  <div className="flex flex-col items-center gap-2" style={{overflow: 'visible'}}>
                    <div className="stat-icon-wrapper-small">
                      <img src={clockIcon} alt="Clock" className="h-14 w-14" />
                    </div>
                    {currentRound?.status === "waiting" ? (
                      <div className="text-xl font-bold font-mono no-text-shadow text-center px-2" style={{color: '#FCD34D', marginBottom: '-1rem'}} data-testid="text-timer">Waiting...</div>
                    ) : (
                      <div className="text-4xl font-bold font-mono no-text-shadow" style={{color: '#FCD34D', marginBottom: '-1rem'}} data-testid="text-timer">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</div>
                    )}
                    <div className="text-xs text-muted-foreground uppercase tracking-wider text-center">
                      {currentRound?.status === "waiting" ? "For First Bet" : "Time Remaining"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PLAYER CAROUSEL */}
            <div className="flex justify-center">
              <div className="carousel-container relative">
                {/* Mining Block Overlay */}
                {showMiningBlock && (
                  <MiningBlockOverlay
                    blockNumber={miningBlockNumber}
                    onComplete={() => setShowMiningBlock(false)}
                  />
                )}
                <div className="relative" style={{overflow: 'visible'}} ref={carouselRef}>
                  {/* Triangle indicator pointing to center card */}
                  <div className="absolute left-1/2 z-20 flex flex-col items-center pointer-events-none bounce-arrow" style={{top: '-46px'}}>
                    <svg width="56" height="40" viewBox="0 0 56 40" fill="none" style={{filter: 'drop-shadow(0 0 12px rgba(234, 179, 8, 0.8))'}}>
                      <defs>
                        <linearGradient id="triangleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" style={{stopColor: '#EAB308', stopOpacity: 1}} />
                          <stop offset="50%" style={{stopColor: '#FCD34D', stopOpacity: 1}} />
                          <stop offset="100%" style={{stopColor: '#EAB308', stopOpacity: 1}} />
                        </linearGradient>
                      </defs>
                      <path d="M28 36 L4 4 L52 4 Z" fill="url(#triangleGradient)" stroke="url(#triangleGradient)" strokeWidth="2"/>
                    </svg>
                  </div>
                  
                  <div 
                    className="carousel-track flex gap-3"
                    style={{transform: `translateX(-${scrollOffset}px)`, overflow: 'visible'}}
                  >
                    {(() => {
                      // Get real bets from current round
                      const bets = currentRound?.bets || [];
                      const MIN_CARDS = 20; // Always show at least 20 cards
                      const cardsToShow = Math.max(MIN_CARDS, bets.length);
                      
                      return [...Array(cardsToShow)].map((_, i) => {
                        if (!carouselRef.current) return null;
                        
                        // Check if this index has a real bet
                        const bet = bets[i];
                        const hasRealBet = !!bet;
                        
                        // Calculate centering
                        const containerWidth = carouselRef.current.offsetWidth;
                        const gap = 12;
                        const cardWidth = 234;
                        const cardPosition = i * (cardWidth + gap);
                        const centerPosition = containerWidth / 2;
                        const cardLeftEdge = cardPosition - scrollOffset;
                        const cardRightEdge = cardLeftEdge + cardWidth;
                        const isCentered = cardLeftEdge <= centerPosition && cardRightEdge >= centerPosition;
                        
                        return (
                          <div key={hasRealBet ? bet.id : `empty-${i}`} className="carousel-card flex-shrink-0 transition-all duration-300" style={{width: '234px', zIndex: isCentered ? 10 : 1, position: 'relative'}}>
                            <div className={`glass-panel flex flex-col items-center transition-all duration-300 ${isCentered ? 'carousel-center-card' : ''}`} style={{
                              borderRadius: '21px', 
                              padding: '26px 21px',
                              transform: isCentered ? 'scale(1.1)' : 'scale(1)',
                              transformOrigin: 'center center',
                              willChange: 'transform',
                              boxShadow: isCentered ? '0 0 30px rgba(234, 179, 8, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.1)' : undefined
                            }}>
                              {hasRealBet ? (
                                <>
                                  {/* Real Player Card */}
                                  <Avatar className="w-28 h-28">
                                    <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary/20 to-primary/5">
                                      {bet.username ? bet.username.slice(0, 2).toUpperCase() : bet.userAddress.slice(2, 4).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="font-medium text-foreground" style={{fontSize: '17px', marginTop: '18px', textAlign: 'center'}}>
                                    {bet.username || `${bet.userAddress.slice(0, 6)}...`}
                                  </div>
                                  <div className="flex items-center gap-1.5 font-mono" style={{fontSize: '17px', marginTop: '10px'}}>
                                    <span className="text-muted-foreground/60">=</span>
                                    <span className="text-primary font-bold">{parseFloat(bet.amount).toFixed(3)}</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  {/* Waiting Placeholder */}
                                  <div className="flex items-center justify-center relative" style={{
                                    width: '114px',
                                    height: '114px',
                                    borderRadius: '18px',
                                    background: 'linear-gradient(145deg, rgba(40, 40, 40, 0.6), rgba(20, 20, 20, 0.9))',
                                    border: '1px solid rgba(60, 60, 60, 0.4)',
                                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), inset 0 -2px 4px rgba(0, 0, 0, 0.8), 0 2px 8px rgba(0, 0, 0, 0.5)'
                                  }}>
                                    <svg className="text-muted-foreground/50" fill="currentColor" viewBox="0 0 24 24" style={{width: '55px', height: '55px', filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5))'}}>
                                      <path d="M12 4C9.243 4 7 6.243 7 9h2c0-1.654 1.346-3 3-3s3 1.346 3 3c0 1.069-.454 1.465-1.481 2.255-.382.294-.813.626-1.226 1.038C10.981 13.604 10.995 14.897 11 15v2h2v-2.009c0-.024.023-.601.707-1.284.32-.32.682-.598 1.031-.867C15.798 12.024 17 11.1 17 9c0-2.757-2.243-5-5-5zm-1 14h2v2h-2z"/>
                                    </svg>
                                  </div>
                                  <div className="font-medium text-muted-foreground" style={{fontSize: '17px', marginTop: '18px'}}>Waiting</div>
                                  <div className="flex items-center gap-1.5 font-mono" style={{fontSize: '17px', marginTop: '10px'}}>
                                    <span className="text-muted-foreground/60">=</span>
                                    <span className="text-foreground font-bold">0.000</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
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
                        style={{borderRadius: BORDER_RADIUS.MD}}
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

          {/* RIGHT SIDEBAR - LEADERBOARD */}
          <div className="flex-shrink-0 space-y-3 transition-all duration-300 relative glass-panel" style={{
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
            {/* Collapse Button - Positioned on the outer left edge */}
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
                {/* Multiple star sparkles with varied sizes and positions */}
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
          
          <div style={{width: '297px', marginTop: '5px'}}>
            <DailyStats type="latest" />
          </div>

          <div style={{width: '297px', marginTop: '10px'}}>
            <DailyStats type="winner" />
          </div>
          <div style={{width: '297px', marginTop: '10px'}}>
            <DailyStats type="lucky" />
          </div>
          </div>
          )}
        </div>
        </div>
        </div>

        <GameFooter />
      </div>

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
      </div>
    </div>
    </>
  );
}
