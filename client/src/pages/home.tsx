import { useState, useEffect, useRef } from "react";
import GameNavigation from "@/components/GameNavigation";
import GameFooter from "@/components/GameFooter";
import ProfileModal from "@/components/ProfileModal";
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
import airdropLogo from '@assets/airdropnew_1763414250628.png';
import airdropPackage from '@assets/airdrop-pachage_1763525829440.png';
import crownIcon from '@assets/3dgifmaker00562_1763407280610.gif';
import signupLogo from '@assets/signupnew_1763410821936.png';
import bnbIcon from '@assets/bnb-bnb-logo_1763489145043.png';

export default function Home() {
  const { address, isConnecting, error, connect, disconnect } = useWallet();
  const { toast } = useToast();
  const { shouldShowSignup, username, markSignupComplete } = useSignupTracking(address);
  const { messages, isConnected, sendMessage } = useChat(username || undefined);
  
  /** Time remaining in seconds for the current game round */
  const [timeRemaining, setTimeRemaining] = useState(13);
  
  /** Current bet amount entered by user */
  const [betAmount, setBetAmount] = useState("");
  
  /** Number of users currently online */
  const [onlineUsers, setOnlineUsers] = useState(0);
  
  /** Horizontal scroll offset in pixels for carousel animation */
  const [scrollOffset, setScrollOffset] = useState(0);
  
  /** Controls visibility of chat rules modal */
  const [showChatRules, setShowChatRules] = useState(false);
  
  /** Controls visibility of terms and conditions modal */
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  /** Controls visibility of profile modal */
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  /** Controls whether chat sidebar is collapsed */
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  
  /** Controls whether leaderboard sidebar is collapsed */
  const [isLeaderboardCollapsed, setIsLeaderboardCollapsed] = useState(false);
  
  /** Current chat message being typed */
  const [chatInput, setChatInput] = useState("");
  
  /** Form data for new user signup */
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    referralCode: "",
    agreedToTerms: false
  });
  
  /** Reference to carousel container for scroll calculations */
  const carouselRef = useRef<HTMLDivElement>(null);
  
  /** Reference to chat messages container for auto-scroll */
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => prev <= 0 ? 13 : prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  /**
   * Carousel auto-scroll animation using requestAnimationFrame for smooth 60fps scrolling.
   * Creates an infinite loop effect by resetting scroll position after 10 cards.
   * Uses delta time to ensure consistent speed regardless of frame rate.
   */
  useEffect(() => {
    let animationFrame: number;
    let lastTime = Date.now();
    const speed = 0.08; // pixels per millisecond
    
    const animate = () => {
      const now = Date.now();
      const delta = now - lastTime;
      lastTime = now;
      
      setScrollOffset(prev => {
        const newOffset = prev + (delta * speed);
        if (!carouselRef.current) return newOffset;
        
        const gap = 12; // gap-3 = 0.75rem = 12px
        const cardWidth = 234; // 180 * 1.3 = 234px
        const resetPoint = (cardWidth + gap) * 10;
        
        // Reset scroll position to create seamless loop
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

  /**
   * Auto-scroll chat to bottom when new messages arrive
   */
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  /**
   * Handles sending a chat message
   */
  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    
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

    const success = sendMessage(chatInput);
    if (success) {
      setChatInput("");
    } else {
      toast({
        variant: "destructive",
        title: "Failed to Send",
        description: "Could not send message. Please try again.",
      });
    }
  };

  /**
   * Handles new user signup form submission.
   * Validates required fields, marks wallet as registered, and resets form.
   * In production, this would send data to backend API.
   */
  const handleSignupSubmit = () => {
    if (!signupData.name || !signupData.email || !signupData.agreedToTerms) {
      toast({
        variant: "destructive",
        title: "Incomplete Form",
        description: "Please fill in all required fields and agree to the terms.",
      });
      return;
    }

    // Mark signup as complete in localStorage with username
    markSignupComplete(signupData.name);

    // TODO: Send signup data to backend API
    console.log('Signup data:', { ...signupData, walletAddress: address });

    toast({
      title: "Account Created",
      description: `Welcome to BNBPOT, ${signupData.name}!`,
    });

    setSignupData({ name: "", email: "", referralCode: "", agreedToTerms: false });
  };

  /**
   * Handles placing a bet.
   * Requires wallet connection and signup completion.
   */
  const handlePlaceBet = () => {
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

    if (!betAmount || parseFloat(betAmount) <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Bet Amount",
        description: "Please enter a valid bet amount.",
      });
      return;
    }

    // TODO: Send bet to backend API
    console.log('Placing bet:', { amount: betAmount, username, address });

    toast({
      title: "Bet Placed",
      description: `You bet ${betAmount} BNB on this round!`,
    });
  };

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="flex flex-col h-screen space-bg" style={{
      backgroundImage: `url(${bnbpotBg})`
    }}>
      <GameNavigation onConnect={connect} onDisconnect={disconnect} isConnected={!!address} isConnecting={isConnecting} walletAddress={address || undefined} username={username || undefined} onOpenProfile={() => setShowProfileModal(true)} />

      {/* Golden border wrapper around bottom nav + content */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{
        border: '1px solid rgba(250, 204, 21, 0.85)',
        boxShadow: '0 0 8px rgba(250, 204, 21, 0.22)'
      }}>
        <div className="flex-1 flex" style={{overflow: 'visible'}}>
          {/* LEFT SIDEBAR - CHAT */}
          <div className="flex-shrink-0 transition-all duration-300 relative glass-panel" style={{
            width: isChatCollapsed ? '0px' : '345px',
            paddingLeft: '0px',
            paddingTop: isChatCollapsed ? '0px' : '24px',
            paddingBottom: isChatCollapsed ? '0px' : '24px',
            paddingRight: '0px',
            overflow: 'visible',
            zIndex: 50,
            borderRadius: '0px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Collapse Button - Positioned on the outer right edge */}
            <button
              onClick={() => setIsChatCollapsed(!isChatCollapsed)}
              className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center hover-elevate active-elevate-2 transition-all duration-300"
              style={{
                left: 'calc(100% - 20px)',
                zIndex: 9999,
                borderRadius: isChatCollapsed ? '8px' : '4px',
                width: isChatCollapsed ? '89px' : '34px',
                height: '79px',
                background: 'rgba(20, 20, 20, 1)',
                border: '1px solid rgba(60, 60, 60, 0.4)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 2px 8px rgba(0, 0, 0, 0.5)'
              }}
              data-testid="button-collapse-chat"
            >
              {isChatCollapsed ? (
                <Flame className="w-8 h-8 text-white" fill="white" />
              ) : (
                <svg className="w-3 h-3 text-foreground transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              )}
            </button>

          {!isChatCollapsed && (
            <div className="flex flex-col flex-1" style={{width: '297px', marginTop: '-85px', marginLeft: '23px'}}>
              {/* Degen Chat Header */}
              <div className="glass-panel p-3 flex items-center justify-between" style={{borderRadius: '18px 18px 0 0'}}>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-muted flex items-center justify-center">
                    <svg className="w-3 h-3 text-foreground" fill="currentColor" viewBox="0 0 20 20"><path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/><path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/></svg>
                  </div>
                  <span className="text-sm font-semibold text-foreground">Degen Chat</span>
                </div>
                <Badge className="text-white text-xs font-bold px-2 border-0" style={{
                  background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.8), rgba(30, 30, 30, 0.8))',
                  border: '2px solid rgba(234, 179, 8, 0.5)',
                  boxShadow: '0 0 20px rgba(234, 179, 8, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
                }} data-testid="badge-chat-count">{onlineUsers}</Badge>
              </div>

              {/* Chat Box Container */}
              <div className="glass-panel flex-1 flex flex-col relative" style={{borderRadius: '0 0 18px 18px', overflow: 'hidden'}}>
                  {/* LIVE AIRDROP Section - Overlaying at top */}
                  <div className="absolute top-2 left-2 right-2 z-10">
                    <div className="glass-panel neon-border p-2">
                      <div className="flex items-center justify-start">
                        <div className="flex items-center justify-start gap-0">
                          <img src={bnbIcon} alt="BNB" className="w-12 h-12 -mt-1" style={{marginRight: '-0.25rem'}} />
                          <span className="font-bold font-mono no-text-shadow" style={{color: '#FFFFFF', fontSize: '1.25rem'}} data-testid="text-airdrop-amount">0.255</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-start -mt-5">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-primary/20 text-primary font-bold px-2 py-0.5 border border-primary/30" style={{fontSize: '1.09375rem'}} data-testid="badge-airdrop-live">LIVE</Badge>
                          <div className="shine-image" style={{'--shine-mask': `url(${airdropPackage})`} as React.CSSProperties}>
                            <img src={airdropPackage} alt="AIRDROP" style={{height: '3.125rem'}} data-testid="img-airdrop-logo" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto px-3 pt-32" ref={chatMessagesRef}>
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        <div className="text-center space-y-2">
                          <svg className="w-12 h-12 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <p>No messages yet</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 pb-3">
                        {messages.map((msg) => (
                          <div key={msg.id} className="flex gap-2">
                            <Avatar className="w-7 h-7 flex-shrink-0">
                              <AvatarFallback className="text-xs bg-muted">
                                {msg.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2">
                                <span className="text-xs font-semibold text-foreground">{msg.username}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs text-foreground break-words">{msg.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <div className="p-3 border-t border-border/10">
                    <Input 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder={!address ? "Connect wallet to chat..." : !username ? "Complete signup to chat..." : "Type Message Here..."}
                      className="h-10 text-sm bg-muted/30 border-border/20" 
                      data-testid="input-chat"
                      disabled={!address || !username}
                    />
                    <div className="flex items-center mt-2 text-xs text-muted-foreground">
                      <button onClick={() => setShowChatRules(true)} className="flex items-center gap-1 hover-elevate" data-testid="link-chat-rules">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
                        <span>Chat Rules</span>
                      </button>
                    </div>
                  </div>
              </div>
            </div>
          )}
        </div>

        {/* CENTER - MAIN GAME AREA */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
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
              
              <div className="px-4 py-3" style={{
                borderRadius: '18px',
                background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.8), rgba(30, 30, 30, 0.8))',
                border: '2px solid rgba(60, 60, 60, 0.4)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
              }}>
                <div className="flex items-center justify-center gap-2">
                  <div className="flex items-center justify-between px-4 py-2.5 rounded-lg" style={{
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
                        className="w-16 text-sm font-semibold bg-transparent border-0 outline-none text-foreground"
                        style={{lineHeight: '1.25rem', paddingTop: '1px'}}
                        data-testid="input-bet" 
                      />
                    </div>
                    <div className="flex items-center gap-1.5 pl-3 border-l border-border/20">
                      <span className="text-sm font-semibold text-foreground">BNB</span>
                      <img src={bnbIcon} alt="BNB" className="w-5 h-5" />
                    </div>
                  </div>
                  
                  <div className="px-5 py-2.5 rounded-lg" style={{
                    background: 'rgba(20, 20, 20, 0.9)',
                    border: '1px solid rgba(60, 60, 60, 0.5)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.6)'
                  }}>
                    <button 
                      onClick={() => setBetAmount(String((parseFloat(betAmount) || 0) + 0.1))} 
                      className="text-sm font-semibold text-foreground hover-elevate"
                      data-testid="button-plus-0.1"
                    >
                      +0.1
                    </button>
                  </div>
                  
                  <div className="px-5 py-2.5 rounded-lg" style={{
                    background: 'rgba(20, 20, 20, 0.9)',
                    border: '1px solid rgba(60, 60, 60, 0.5)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.6)'
                  }}>
                    <button 
                      onClick={() => setBetAmount(String((parseFloat(betAmount) || 0) + 0.5))} 
                      className="text-sm font-semibold text-foreground hover-elevate"
                      data-testid="button-plus-0.5"
                    >
                      +0.5
                    </button>
                  </div>
                  
                  <div className="px-5 py-2.5 rounded-lg" style={{
                    background: 'rgba(20, 20, 20, 0.9)',
                    border: '1px solid rgba(60, 60, 60, 0.5)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.6)'
                  }}>
                    <button 
                      onClick={() => setBetAmount(String((parseFloat(betAmount) || 0) + 1))} 
                      className="text-sm font-semibold text-foreground hover-elevate"
                      data-testid="button-plus"
                    >
                      +1
                    </button>
                  </div>
                  
                  <div className="px-10 py-2.5 rounded-lg" style={{
                    background: 'rgba(15, 15, 15, 0.9)',
                    border: '2px solid transparent',
                    backgroundImage: 'linear-gradient(rgba(15, 15, 15, 0.9), rgba(15, 15, 15, 0.9)), linear-gradient(140deg, #EAB308 0%, #FCD34D 50%, #EAB308 100%)',
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box',
                    boxShadow: 'inset 0 1px 2px rgba(234, 179, 8, 0.1), inset 0 -1px 3px rgba(0, 0, 0, 0.6), 0 0 24px rgba(234, 179, 8, 0.4), 0 4px 16px rgba(0, 0, 0, 0.7)'
                  }}>
                    <button 
                      onClick={handlePlaceBet}
                      className="text-white font-bold text-base"
                      data-testid="button-place-bet"
                    >
                      Place Bet
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* STATS BAR */}
            <div className="p-1">
              <div className="flex gap-4 justify-center" style={{overflow: 'visible'}}>
                <div className="stat-box">
                  <div className="flex flex-col items-center gap-2" style={{overflow: 'visible'}}>
                    <div className="stat-icon-wrapper-large">
                      <img src={treasureChest} alt="Treasure Chest" className="h-16 w-16" />
                    </div>
                    <div className="text-4xl font-bold font-mono no-text-shadow" style={{color: '#FCD34D', marginBottom: '-1rem'}}>0.401</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider text-center">Jackpot Value</div>
                  </div>
                </div>
                <div className="stat-box">
                  <div className="flex flex-col items-center gap-2" style={{overflow: 'visible'}}>
                    <div className="stat-icon-wrapper">
                      <img src={bnbLogo} alt="BNB" className="h-16 w-16" />
                    </div>
                    <div className="text-4xl font-bold font-mono no-text-shadow" style={{color: '#FCD34D', marginBottom: '-1rem'}} data-testid="text-your-wager">0.000</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider text-center">Your Wager</div>
                  </div>
                </div>
                <div className="stat-box">
                  <div className="flex flex-col items-center gap-2" style={{overflow: 'visible'}}>
                    <div className="stat-icon-wrapper-small">
                      <img src={cloverIcon} alt="Clover" className="h-14 w-14" />
                    </div>
                    <div className="text-4xl font-bold font-mono no-text-shadow" style={{color: '#FCD34D', marginBottom: '-1rem'}} data-testid="text-your-chance">0.00%</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider text-center">Your Chance</div>
                  </div>
                </div>
                <div className="stat-box">
                  <div className="flex flex-col items-center gap-2" style={{overflow: 'visible'}}>
                    <div className="stat-icon-wrapper-small">
                      <img src={clockIcon} alt="Clock" className="h-14 w-14" />
                    </div>
                    <div className="text-4xl font-bold font-mono no-text-shadow" style={{color: '#FCD34D', marginBottom: '-1rem'}} data-testid="text-timer">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider text-center">Time Remaining</div>
                  </div>
                </div>
              </div>
            </div>

            {/* PLAYER CAROUSEL */}
            <div className="flex justify-center">
              <div className="carousel-container">
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
                    {[...Array(20)].map((_, i) => {
                      // Calculate if this card is under the triangle (highlight when left edge reaches triangle)
                      if (!carouselRef.current) return null;
                      
                      const containerWidth = carouselRef.current.offsetWidth;
                      const gap = 12; // gap-3 = 0.75rem = 12px
                      const cardWidth = 234; // 180 * 1.3 = 234px
                      const cardPosition = i * (cardWidth + gap);
                      const centerPosition = containerWidth / 2;
                      const cardLeftEdge = cardPosition - scrollOffset;
                      const cardRightEdge = cardLeftEdge + cardWidth;
                      const isCentered = cardLeftEdge <= centerPosition && cardRightEdge >= centerPosition;
                      
                      return (
                        <div key={i} className="carousel-card flex-shrink-0 transition-all duration-300" style={{width: '234px', zIndex: isCentered ? 10 : 1, position: 'relative'}}>
                          <div className={`glass-panel flex flex-col items-center transition-all duration-300 ${isCentered ? 'carousel-center-card' : ''}`} style={{
                            borderRadius: '21px', 
                            padding: '26px 21px',
                            transform: isCentered ? 'scale(1.1)' : 'scale(1)',
                            boxShadow: isCentered ? '0 0 30px rgba(234, 179, 8, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.1)' : undefined
                          }}>
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
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div><span className="text-foreground font-semibold">0</span> Players</div>
              <div>•</div>
              <div>Payouts are settled in BNB</div>
              <div>•</div>
              <div>Round: <span className="font-mono" data-testid="text-round">#1</span></div>
            </div>
          </div>

          {/* PLAYER LIST */}
          <div className="flex-1 border-t border-border/30 overflow-hidden relative z-10">
            <ScrollArea className="h-full px-6 py-5">
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                <div className="text-center space-y-2">
                  <svg className="w-12 h-12 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p>No players in this round</p>
                </div>
              </div>
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
            borderRadius: '0px'
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
            <div className="absolute -top-2 right-6 w-20 h-20 z-10 group cursor-pointer">
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
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-bold uppercase tracking-wider text-foreground">$25K WEEKLY</div>
            </div>
            <div className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">LEADERBOARD</div>
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
          
          <div className="glass-panel p-4" style={{borderRadius: '18px', width: '297px', marginTop: '5px'}}>
            <Badge className="gradient-purple-pink text-black text-xs mb-3 uppercase tracking-wider font-bold no-text-shadow">LOOT OF THE DAY!</Badge>
            <div className="h-24 bg-background/30 rounded flex items-center justify-center border border-border/50">
              <div className="text-4xl">🎁</div>
            </div>
          </div>

          <div className="glass-panel p-3" style={{borderRadius: '18px', width: '297px', marginTop: '10px'}}>
            <div className="flex justify-between text-xs text-muted-foreground mb-2 uppercase tracking-wider"><span>Wins</span><Badge variant="secondary" className="text-[10px] uppercase">Chances</Badge></div>
            <div className="flex justify-between"><div className="flex items-center gap-1"><img src={bnbLogo} className="h-[4rem] w-[4rem]" /><span className="font-mono font-bold no-text-shadow" style={{color: '#FFFFFF', fontSize: '1.15rem'}}>0.769</span></div><span className="font-semibold no-text-shadow" style={{color: '#FFFFFF', fontSize: '1.15rem'}}>2.00%</span></div>
          </div>
          </div>
          )}
        </div>
        </div>
      </div>

      <GameFooter />

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

      {/* Chat Rules Dialog */}
      <Dialog open={showChatRules} onOpenChange={setShowChatRules}>
        <DialogContent className="max-w-md border-0 p-6" style={{
          borderRadius: '18px',
          background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.8), rgba(30, 30, 30, 0.8))',
          border: '2px solid rgba(234, 179, 8, 0.5)',
          boxShadow: '0 0 20px rgba(234, 179, 8, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
        }}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold gradient-text uppercase tracking-wide">Chat Rules</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Please follow these rules to maintain a positive environment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm mt-4">
            <div className="space-y-1">
              <h3 className="font-bold text-foreground">1. Be Respectful</h3>
              <p className="text-muted-foreground">Treat all users with respect. No harassment, hate speech, or personal attacks.</p>
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-foreground">2. No Spam</h3>
              <p className="text-muted-foreground">Do not spam messages, links, or advertisements. Keep the chat clean and relevant.</p>
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-foreground">3. No Begging</h3>
              <p className="text-muted-foreground">Do not beg for coins, tips, or giveaways from other users.</p>
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-foreground">4. Keep it Legal</h3>
              <p className="text-muted-foreground">No discussion of illegal activities or sharing of illegal content.</p>
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-foreground">5. Use English</h3>
              <p className="text-muted-foreground">Please use English in the main chat for better communication.</p>
            </div>
          </div>
          <button onClick={() => setShowChatRules(false)} className="w-full mt-6 text-white font-bold" style={{
            borderRadius: '18px',
            padding: '18px 28px',
            background: 'rgba(15, 15, 15, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '2px solid transparent',
            backgroundImage: 'linear-gradient(rgba(15, 15, 15, 0.9), rgba(15, 15, 15, 0.9)), linear-gradient(140deg, #EAB308 0%, #FCD34D 50%, #EAB308 100%)',
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box',
            boxShadow: 'inset 0 1px 2px rgba(234, 179, 8, 0.1), inset 0 -1px 3px rgba(0, 0, 0, 0.6), 0 0 24px rgba(234, 179, 8, 0.4), 0 4px 16px rgba(0, 0, 0, 0.7)',
            cursor: 'pointer',
            fontSize: '16px'
          }} data-testid="button-close-rules">
            Got it!
          </button>
        </DialogContent>
      </Dialog>

      <ProfileModal
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
        username={username || "User"}
        walletAddress={address || undefined}
        onDisconnect={disconnect}
      />
    </div>
  );
}
