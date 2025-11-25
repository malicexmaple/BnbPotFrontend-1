import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import BetControls from "@/components/BetControls";
import MiningBlockOverlay from "@/components/MiningBlockOverlay";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useGameState } from "@/hooks/useGameState";
import { GAME, CAROUSEL, BORDER_RADIUS } from "@/constants/layout";
import type { RoundWithBets } from "@shared/schema";
import bnbLogo from '@assets/3dgifmaker21542_1763401668048.gif';
import clockIcon from '@assets/3dgifmaker22359_1763413463889.gif';
import cloverIcon from '@assets/3dgifmaker84959_1763403008581.gif';
import treasureChest from '@assets/3dgifmaker81317_1763413607076.gif';
import jackpotLogo from '@assets/jackpotnew_1763477420573.png';
import signupLogo from '@assets/signupnew_1763410821936.png';

export default function Home() {
  const { address, isConnecting, walletError, connect, disconnect, shouldShowSignup, username, agreedToTerms, markSignupComplete, contract } = useGameState();
  const { toast } = useToast();
  
  // Fetch current round data
  const { data: currentRound, isLoading: isLoadingRound } = useQuery<RoundWithBets>({
    queryKey: ['/api/rounds/current'],
    refetchInterval: 5000,
  });
  
  const [timeRemaining, setTimeRemaining] = useState<number>(GAME.ROUND_DURATION);
  const [betAmount, setBetAmount] = useState("");
  const [scrollOffset, setScrollOffset] = useState(0);
  const [showTermsModal, setShowTermsModal] = useState(false);
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
      
      const roundChanged = prevRound.id !== currentRound.id;
      const prevWasActive = prevRound.status === "active";
      const prevHadBets = prevRound.totalBets > 0;
      const prevCompleted = prevRound.status === "completed";
      
      const shouldShowMining = (roundChanged && prevWasActive && prevHadBets) || 
                               (!prevCompleted && currentRound.status === "completed" && currentRound.totalBets > 0);
      
      if (shouldShowMining) {
        setShowMiningBlock(true);
        setMiningBlockNumber(Math.floor(Math.random() * 1000000) + 468940000);
      }
    }
    
    prevRoundRef.current = currentRound;
  }, [currentRound]);

  useEffect(() => {
    let animationFrame: number;
    let lastTime = Date.now();
    let mounted = true;
    
    const animate = () => {
      if (!mounted) return;
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
    
    const timeout = setTimeout(() => {
      if (mounted) {
        animationFrame = requestAnimationFrame(animate);
      }
    }, 100);
    
    return () => {
      mounted = false;
      clearTimeout(timeout);
      cancelAnimationFrame(animationFrame);
    };
  }, []);


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
      await apiRequest("POST", "/api/users/signup", {
        username: signupData.name,
        email: signupData.email
      });

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
          console.log("Blockchain bet failed, using database:", result.error);
          await placeBetDatabase();
        }
      } catch (error) {
        console.error("Blockchain error, using database:", error);
        await placeBetDatabase();
      }
    } else {
      await placeBetDatabase();
    }
  };

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

  const userBets = currentRound?.bets?.filter((bet: any) => bet.userAddress === address) || [];
  const userWager = userBets.reduce((sum: number, bet: any) => sum + parseFloat(bet.amount || "0"), 0);
  const totalPot = parseFloat(currentRound?.totalPot || "0");
  const userChance = totalPot > 0 ? (userWager / totalPot) * 100 : 0;

  const actualTimeRemaining = currentRound?.isCountdownActive ? (currentRound.timeRemaining ?? 90) : timeRemaining;
  const minutes = Math.floor(actualTimeRemaining / 60);
  const seconds = actualTimeRemaining % 60;

  return (
    <>
      {/* Main game area content */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="p-6 space-y-5 relative z-10 flex-shrink-0">
          {/* HEADER */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col">
              <div className="shine-image" style={{'--shine-mask': `url(${jackpotLogo})`} as React.CSSProperties}>
                <img src={jackpotLogo} alt="JACKPOT" className="w-full max-w-[450px]" style={{height: 'auto'}} />
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
            <div className="max-sm:grid max-sm:grid-cols-2 sm:flex sm:flex-wrap gap-4 justify-center" style={{overflow: 'visible'}}>
              <div className="stat-box">
                <div className="flex flex-col items-center gap-2" style={{overflow: 'visible'}}>
                  <div className="stat-icon-wrapper-large">
                    <img src={treasureChest} alt="Treasure Chest" className="h-16 w-16" />
                  </div>
                  <div className="stat-label uppercase text-xs tracking-wider" style={{color: 'rgb(161, 161, 170)'}}>TOTAL POT</div>
                  <div className="flex items-center gap-2">
                    <img src={bnbLogo} alt="BNB" className="w-6 h-6" />
                    <span className="stat-value font-mono font-bold no-text-shadow" style={{color: '#FFFFFF', fontSize: '1.35rem'}} data-testid="text-total-pot">
                      {totalPot.toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="stat-box">
                <div className="flex flex-col items-center gap-2" style={{overflow: 'visible'}}>
                  <div className="stat-icon-wrapper-large">
                    <img src={clockIcon} alt="Clock" className="h-16 w-16" />
                  </div>
                  <div className="stat-label uppercase text-xs tracking-wider" style={{color: 'rgb(161, 161, 170)'}}>TIME REMAINING</div>
                  <div className="stat-value font-mono font-bold no-text-shadow" style={{color: '#FFFFFF', fontSize: '1.35rem'}} data-testid="text-time-remaining">
                    {minutes}:{seconds.toString().padStart(2, '0')}
                  </div>
                </div>
              </div>
              
              <div className="stat-box">
                <div className="flex flex-col items-center gap-2" style={{overflow: 'visible'}}>
                  <div className="stat-icon-wrapper-large">
                    <img src={cloverIcon} alt="Luck" className="h-16 w-16" />
                  </div>
                  <div className="stat-label uppercase text-xs tracking-wider" style={{color: 'rgb(161, 161, 170)'}}>YOUR CHANCE</div>
                  <div className="stat-value font-mono font-bold no-text-shadow" style={{color: '#FFFFFF', fontSize: '1.35rem'}} data-testid="text-user-chance">
                    {userChance.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* JACKPOT CAROUSEL - Continuous scrolling infinite loop */}
        <div className="relative mb-4 w-full" style={{
          paddingTop: '20px',
          height: '180px',
          overflow: 'hidden',
          maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
        }}>
          <div 
            ref={carouselRef}
            className="absolute flex gap-4" 
            style={{ 
              transform: `translateX(-${scrollOffset}px)`,
              willChange: 'transform',
            }}
          >
            {/* Render 3x the cards for seamless looping */}
            {[...Array(3)].map((_, setIndex) => (
              <div key={setIndex} className="flex gap-4">
                {(currentRound?.bets || []).length > 0 ? (
                  currentRound?.bets?.map((bet: any, i: number) => (
                    <div
                      key={`${setIndex}-${i}`}
                      className="flex-shrink-0 relative overflow-visible"
                      style={{
                        width: `${CAROUSEL.CARD_WIDTH}px`,
                        height: `${CAROUSEL.CARD_HEIGHT}px`,
                        borderRadius: BORDER_RADIUS.CAROUSEL,
                        background: 'linear-gradient(135deg, rgba(30, 30, 35, 0.95) 0%, rgba(20, 20, 25, 0.98) 100%)',
                        border: '2px solid rgba(100, 100, 100, 0.3)',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      <div className="p-4 h-full flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 border-2 border-primary/30">
                              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${bet.username || bet.userAddress?.slice(2, 8)}`} />
                              <AvatarFallback>{(bet.username || 'U')[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-bold text-foreground text-sm">{bet.username || `${bet.userAddress?.slice(0, 6)}...`}</div>
                              <div className="text-xs text-muted-foreground">Level {Math.floor(Math.random() * 50) + 1}</div>
                            </div>
                          </div>
                          <Badge className="gradient-purple-pink text-black font-bold text-xs">
                            {((parseFloat(bet.amount) / totalPot) * 100).toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <img src={bnbLogo} alt="BNB" className="w-5 h-5" />
                            <span className="font-mono font-bold no-text-shadow" style={{color: '#FFFFFF', fontSize: '1.1rem'}}>
                              {parseFloat(bet.amount).toFixed(3)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  [...Array(CAROUSEL.TOTAL_CARDS)].map((_, i) => (
                    <div
                      key={`${setIndex}-placeholder-${i}`}
                      className="flex-shrink-0 relative overflow-visible"
                      style={{
                        width: `${CAROUSEL.CARD_WIDTH}px`,
                        height: `${CAROUSEL.CARD_HEIGHT}px`,
                        borderRadius: BORDER_RADIUS.CAROUSEL,
                        background: 'linear-gradient(135deg, rgba(30, 30, 35, 0.95) 0%, rgba(20, 20, 25, 0.98) 100%)',
                        border: '2px solid rgba(100, 100, 100, 0.3)',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      <div className="p-4 h-full flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 border-2 border-primary/30">
                              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=player${i}`} />
                              <AvatarFallback>P</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-bold text-foreground text-sm">Player{i + 1}</div>
                              <div className="text-xs text-muted-foreground">Level {(i + 1) * 5}</div>
                            </div>
                          </div>
                          <Badge className="gradient-purple-pink text-black font-bold text-xs">
                            {(Math.random() * 30 + 5).toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <img src={bnbLogo} alt="BNB" className="w-5 h-5" />
                            <span className="font-mono font-bold no-text-shadow" style={{color: '#FFFFFF', fontSize: '1.1rem'}}>
                              {(Math.random() * 0.5 + 0.01).toFixed(3)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Mining Block Overlay - inside game area so it doesn't cover sidebars */}
        <MiningBlockOverlay 
          isVisible={showMiningBlock}
          onComplete={() => setShowMiningBlock(false)}
          blockNumber={miningBlockNumber}
        />
      </div>

      {/* Signup Modal */}
      <Dialog open={shouldShowSignup} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md glass-panel neon-border" style={{borderRadius: '18px'}}>
          <DialogHeader>
            <DialogTitle className="text-center">
              <img src={signupLogo} alt="Sign Up" className="h-16 mx-auto mb-2" />
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              Create your account to start playing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Username</label>
              <Input
                type="text"
                value={signupData.name}
                onChange={(e) => setSignupData({...signupData, name: e.target.value})}
                placeholder="Enter username"
                data-testid="input-signup-name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Email</label>
              <Input
                type="email"
                value={signupData.email}
                onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                placeholder="Enter email"
                data-testid="input-signup-email"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Referral Code (optional)</label>
              <Input
                type="text"
                value={signupData.referralCode}
                onChange={(e) => setSignupData({...signupData, referralCode: e.target.value})}
                placeholder="Enter referral code"
                data-testid="input-signup-referral"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={signupData.agreedToTerms}
                onChange={(e) => setSignupData({...signupData, agreedToTerms: e.target.checked})}
                className="w-4 h-4"
                data-testid="checkbox-terms"
              />
              <span className="text-xs text-muted-foreground">
                I agree to the{" "}
                <button 
                  onClick={() => setShowTermsModal(true)}
                  className="text-primary underline hover:text-primary/80"
                  type="button"
                >
                  Terms & Conditions
                </button>
              </span>
            </div>
            <Button 
              onClick={handleSignupSubmit}
              className="w-full"
              data-testid="button-signup-submit"
            >
              Create Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Terms Modal */}
      <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
        <DialogContent className="sm:max-w-2xl glass-panel neon-border max-h-[80vh]" style={{borderRadius: '18px'}}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">Terms & Conditions</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Please read these terms carefully before using BNBPOT
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-bold text-foreground mb-2">1. Acceptance of Terms</h3>
                <p className="text-muted-foreground">
                  By accessing and using BNBPOT ("the Platform"), you acknowledge that you have read, understood, and agree to be 
                  bound by these Terms and Conditions. If you do not agree to these terms, you must not use the Platform.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">2. Eligibility</h3>
                <p className="text-muted-foreground">
                  You must be at least 18 years old (or the legal gambling age in your jurisdiction, whichever is higher) to use 
                  this Platform. By using BNBPOT, you represent and warrant that you meet these eligibility requirements. 
                  Users from jurisdictions where online gambling is prohibited are not permitted to use this Platform.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">3. Risk Acknowledgment</h3>
                <p className="text-muted-foreground">
                  <span className="font-bold text-foreground">GAMBLING INVOLVES SUBSTANTIAL RISK OF FINANCIAL LOSS.</span> You acknowledge 
                  that you may lose all funds deposited. Only gamble with money you can afford to lose. BNBPOT is not responsible 
                  for any financial losses you incur. Past performance does not guarantee future results.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">4. Responsible Gaming</h3>
                <p className="text-muted-foreground">
                  We encourage responsible gambling. If you believe you may have a gambling problem, please seek help from 
                  organizations such as Gamblers Anonymous or the National Council on Problem Gambling. We may implement 
                  responsible gaming features including deposit limits, session time limits, and self-exclusion options.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">5. Account Security</h3>
                <p className="text-muted-foreground">
                  You are responsible for maintaining the security of your wallet and account credentials. BNBPOT will never 
                  ask for your private keys or seed phrases. Any losses resulting from unauthorized access to your account 
                  are your sole responsibility. Enable all available security features to protect your account.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">6. Fair Play</h3>
                <p className="text-muted-foreground">
                  You agree not to engage in any form of cheating, collusion, fraud, or manipulation. The use of bots, scripts, 
                  or automated systems is strictly prohibited. BNBPOT reserves the right to void bets and suspend accounts 
                  suspected of unfair play without prior notice.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">7. Smart Contract Risks</h3>
                <p className="text-muted-foreground">
                  BNBPOT operates on blockchain technology and smart contracts. While we strive for security, smart contracts 
                  may contain vulnerabilities. You acknowledge and accept the inherent risks of blockchain technology, including 
                  but not limited to potential bugs, network congestion, and irreversible transactions.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">8. Provably Fair Gaming</h3>
                <p className="text-muted-foreground">
                  Our games use blockchain-based random number generation to ensure fair and verifiable outcomes. All game 
                  results can be independently verified on the blockchain. We do not manipulate game outcomes.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">9. Limitation of Liability</h3>
                <p className="text-muted-foreground">
                  <span className="font-bold text-foreground">TO THE MAXIMUM EXTENT PERMITTED BY LAW, BNBPOT SHALL NOT BE LIABLE FOR 
                  ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES</span>, including but not limited to loss of 
                  profits, data, or other intangible losses, resulting from your use of or inability to use the Platform.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">10. Indemnification</h3>
                <p className="text-muted-foreground">
                  You agree to indemnify, defend, and hold harmless BNBPOT, its affiliates, officers, directors, employees, 
                  and agents from any claims, damages, losses, or expenses arising from your use of the Platform or violation 
                  of these terms.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">11. Deposits and Withdrawals</h3>
                <p className="text-muted-foreground">
                  All deposits and withdrawals are processed in cryptocurrency (BNB). Transaction times depend on blockchain 
                  network conditions. We are not responsible for delays caused by network congestion. Minimum deposit and 
                  withdrawal amounts may apply. All transactions are final and irreversible once confirmed on the blockchain.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">12. Prohibited Activities</h3>
                <p className="text-muted-foreground mb-2">
                  The following activities are strictly prohibited:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Using the Platform for money laundering or illegal activities</li>
                  <li>Creating multiple accounts to abuse bonuses or promotions</li>
                  <li>Attempting to exploit bugs or vulnerabilities</li>
                  <li>Harassing other users or Platform staff</li>
                  <li>Sharing account access with others</li>
                  <li>Using VPNs to circumvent geographic restrictions</li>
                </ul>
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
    </>
  );
}
