import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import MiningBlockOverlay from "@/components/MiningBlockOverlay";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useGameState } from "@/hooks/useGameState";
import { GAME, BORDER_RADIUS, DARK_BG } from "@/constants/layout";
import type { RoundWithBets } from "@shared/schema";
import bnbLogo from '@assets/3dgifmaker21542_1763401668048.gif';
import bnbIcon from '@assets/bnb-bnb-logo_1763489145043.png';
import coinflipLogo from '@assets/coinflipnew_1763488010364.png';
import signupLogo from '@assets/signupnew_1763410821936.png';
import coinsBackground from '@assets/Ycjxd8iDdsXoHotkLjUPo-item-0x1_1763550444466.png';

export default function Coinflip() {
  const { address, isConnecting, walletError, connect, disconnect, shouldShowSignup, username, agreedToTerms, markSignupComplete, contract } = useGameState();
  const { toast } = useToast();
  
  // Fetch current round data
  const { data: currentRound, isLoading: isLoadingRound } = useQuery<RoundWithBets>({
    queryKey: ['/api/rounds/current'],
    refetchInterval: 5000,
  });
  
  const [timeRemaining, setTimeRemaining] = useState<number>(GAME.ROUND_DURATION);
  const [betAmount, setBetAmount] = useState("");
  const [showTermsModal, setShowTermsModal] = useState(false);
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
              background: DARK_BG.GRADIENT,
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
                
                {/* Amount input */}
                <div className="relative flex items-center" style={{width: '120px'}}>
                  <img src={bnbIcon} alt="BNB" className="absolute left-2 w-4 h-4" />
                  <Input
                    type="number"
                    step="0.001"
                    min="0.001"
                    placeholder="0.001"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="pl-8 pr-2 py-1 h-9 text-sm font-mono"
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(60, 60, 60, 0.5)'
                    }}
                    disabled={!address || !username}
                    data-testid="input-coinflip-amount"
                  />
                </div>
                
                {/* Coin side selection - Tails */}
                <button
                  className={`w-9 h-9 rounded-full flex items-center justify-center hover-elevate transition-all ${(!address || !username) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{
                    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                    border: '2px solid rgba(99, 102, 241, 0.8)',
                    boxShadow: '0 0 10px rgba(99, 102, 241, 0.4)'
                  }}
                  disabled={!address || !username}
                  data-testid="button-coinflip-tails"
                >
                  <span className="text-white font-bold text-sm">T</span>
                </button>
                
                {/* Flip button */}
                <Button
                  onClick={handlePlaceBet}
                  disabled={!address || !username || !betAmount}
                  className="h-9 px-4 font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                    border: 'none'
                  }}
                  data-testid="button-coinflip-flip"
                >
                  FLIP
                </Button>
              </div>
            </div>
          </div>

          {/* COINFLIP GAMES LIST */}
          <div className="relative" style={{
            background: 'linear-gradient(to bottom, rgba(15, 15, 15, 0.95), rgba(10, 10, 10, 0.98))',
            borderRadius: BORDER_RADIUS.STANDARD,
            border: '1px solid rgba(60, 60, 60, 0.3)',
            overflow: 'hidden'
          }}>
            {/* Decorative coins background */}
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
              backgroundImage: `url(${coinsBackground})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }} />
            
            <ScrollArea className="h-[400px]">
              <div className="p-4 space-y-2 relative z-10">
                {/* Header row */}
                <div className="flex items-center justify-between text-xs text-muted-foreground uppercase tracking-wider px-4 py-2">
                  <span className="w-1/3">Player</span>
                  <span className="w-1/4 text-center">Side</span>
                  <span className="w-1/4 text-right">Amount</span>
                  <span className="w-1/6 text-right">Action</span>
                </div>
                
                {/* Game rows */}
                {demoGames.map((game, i) => (
                  <div 
                    key={i}
                    className="flex items-center justify-between px-4 py-3 hover-elevate transition-all"
                    style={{
                      background: 'rgba(30, 30, 35, 0.6)',
                      borderRadius: BORDER_RADIUS.STANDARD,
                      border: '1px solid rgba(60, 60, 60, 0.2)'
                    }}
                    data-testid={`card-coinflip-game-${i}`}
                  >
                    {/* Player info */}
                    <div className="flex items-center gap-3 w-1/3">
                      <Avatar className="h-8 w-8 border-2 border-primary/30">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${game.username}`} />
                        <AvatarFallback>{game.username[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-bold text-foreground text-sm">{game.username}</div>
                        <div className="text-xs text-muted-foreground">Level {game.level}</div>
                      </div>
                    </div>
                    
                    {/* Coin side */}
                    <div className="w-1/4 flex justify-center">
                      <div 
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{
                          background: i % 2 === 0 
                            ? 'linear-gradient(135deg, #EAB308, #FCD34D)' 
                            : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                          boxShadow: i % 2 === 0 
                            ? '0 0 8px rgba(234, 179, 8, 0.4)' 
                            : '0 0 8px rgba(99, 102, 241, 0.4)'
                        }}
                      >
                        {i % 2 === 0 ? (
                          <img src={bnbLogo} alt="Heads" className="w-4 h-4" />
                        ) : (
                          <span className="text-white font-bold text-xs">T</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Amount */}
                    <div className="w-1/4 flex items-center justify-end gap-1">
                      <img src={bnbIcon} alt="BNB" className="w-4 h-4" />
                      <span className="font-mono font-bold text-foreground">{game.amount.toFixed(3)}</span>
                    </div>
                    
                    {/* Action button */}
                    <div className="w-1/6 flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className={`h-7 text-xs ${(!address || !username) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!address || !username}
                        data-testid={`button-coinflip-join-${i}`}
                      >
                        Join
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Mining Block Overlay */}
      <MiningBlockOverlay 
        isVisible={showMiningBlock}
        onComplete={() => setShowMiningBlock(false)}
        blockNumber={miningBlockNumber}
      />

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
                data-testid="input-coinflip-signup-name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Email</label>
              <Input
                type="email"
                value={signupData.email}
                onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                placeholder="Enter email"
                data-testid="input-coinflip-signup-email"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Referral Code (optional)</label>
              <Input
                type="text"
                value={signupData.referralCode}
                onChange={(e) => setSignupData({...signupData, referralCode: e.target.value})}
                placeholder="Enter referral code"
                data-testid="input-coinflip-signup-referral"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={signupData.agreedToTerms}
                onChange={(e) => setSignupData({...signupData, agreedToTerms: e.target.checked})}
                className="w-4 h-4"
                data-testid="checkbox-coinflip-terms"
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
              data-testid="button-coinflip-signup-submit"
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
