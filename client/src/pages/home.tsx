import { useState, useEffect, useRef } from "react";
import GameNavigation from "@/components/GameNavigation";
import GameFooter from "@/components/GameFooter";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, TrendingUp } from "lucide-react";
import solanaLogo from '@assets/generated_images/Solana_cryptocurrency_logo_icon_b1e8938e.png';
import avatar1 from '@assets/generated_images/Gaming_avatar_placeholder_1_a3c2368d.png';
import avatar2 from '@assets/generated_images/Gaming_avatar_placeholder_2_b74e6961.png';
import avatar3 from '@assets/generated_images/Gaming_avatar_placeholder_3_f673a9f2.png';

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(13);
  const [betAmount, setBetAmount] = useState("");
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => prev <= 0 ? 13 : prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let animationFrame: number;
    let lastTime = Date.now();
    const speed = 0.08; // Much faster speed
    
    const animate = () => {
      const now = Date.now();
      const delta = now - lastTime;
      lastTime = now;
      
      setScrollOffset(prev => {
        const newOffset = prev + (delta * speed);
        // Reset when we've scrolled past one full set (10 cards)
        const cardWidth = carouselRef.current ? carouselRef.current.offsetWidth / 5 : 200;
        const resetPoint = cardWidth * 10 + 160; // 10 cards + 10 gaps (16px each)
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


  const handleConnect = () => {
    setTimeout(() => {
      setIsConnected(true);
      setWalletAddress('8kTx...9mKp');
    }, 1000);
  };

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="flex flex-col h-screen space-bg">
      <GameNavigation onConnect={handleConnect} isConnected={isConnected} walletAddress={walletAddress} />

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR - CHAT */}
        <div className="w-80 flex-shrink-0 flex flex-col border-r border-border/10" style={{background: 'rgba(15, 15, 15, 0.7)'}}>
          {/* Degen Chat Header */}
          <div className="p-3 border-b border-border/10">
            <div className="glass-panel p-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-muted flex items-center justify-center">
                  <svg className="w-3 h-3 text-foreground" fill="currentColor" viewBox="0 0 20 20"><path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/><path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/></svg>
                </div>
                <span className="text-sm font-semibold text-foreground">Degen Chat</span>
              </div>
              <Badge className="gradient-purple-pink text-white text-xs font-bold px-2" data-testid="badge-chat-count">{onlineUsers}</Badge>
            </div>
          </div>

          {/* LIVE AIRDROP Section */}
          <div className="p-3">
            <div className="glass-panel neon-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary/20 text-primary text-xs font-bold px-2 border border-primary/30" data-testid="badge-airdrop-live">LIVE</Badge>
                  <span className="text-lg font-bold gradient-text uppercase tracking-wide" data-testid="text-airdrop-title">AIRDROP</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={solanaLogo} alt="SOL" className="h-5 w-5" />
                  <span className="text-xl font-bold font-mono text-foreground" data-testid="text-airdrop-amount">0.255</span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center" data-testid="icon-airdrop-lock">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <ScrollArea className="flex-1 px-3">
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              <div className="text-center space-y-2">
                <svg className="w-12 h-12 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>No messages yet</p>
              </div>
            </div>
          </ScrollArea>

          {/* Chat Input */}
          <div className="p-3 border-t border-border/10">
            <div className="relative">
              <Input 
                placeholder={isConnected ? "Type Message Here..." : "Connect wallet to chat..."}
                className="h-10 text-sm bg-muted/30 border-border/20 pr-10" 
                data-testid="input-chat"
                disabled={!isConnected}
              />
              <button 
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center hover-elevate disabled:opacity-50 disabled:cursor-not-allowed" 
                data-testid="button-chat-emoji"
                disabled={!isConnected}
              >
                <svg className="w-3.5 h-3.5 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg>
              </button>
            </div>
            {!isConnected && (
              <div className="mt-2 text-xs text-center text-muted-foreground/70 flex items-center justify-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
                <span>Connect your wallet to participate in chat</span>
              </div>
            )}
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <button className="flex items-center gap-1 hover-elevate" data-testid="link-chat-rules">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
                <span>Chat Rules</span>
              </button>
              <span data-testid="text-website">solpot.com</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4" data-testid="badge-footer-count">180</Badge>
            </div>
          </div>
        </div>

        {/* CENTER - MAIN GAME AREA */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 space-y-5">
            {/* HEADER */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                  <Trophy className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-4xl font-bold uppercase tracking-[0.2em] gradient-text">JACKPOT</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Winner takes all...</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground uppercase">Bet Amount</div>
                  <Input value={betAmount} onChange={(e) => setBetAmount(e.target.value)} placeholder="0" className="w-32 h-10 text-center font-mono glass-panel" data-testid="input-bet" />
                  <img src={solanaLogo} alt="SOL" className="h-4 w-4" />
                </div>
                <Button size="sm" variant="outline" onClick={() => setBetAmount(String((parseFloat(betAmount) || 0) - 0.1))} data-testid="button-minus">-0.1</Button>
                <Button size="sm" variant="outline" onClick={() => setBetAmount(String((parseFloat(betAmount) || 0) + 1))} data-testid="button-plus">+1</Button>
                <Button className="gradient-purple-pink text-white font-bold shadow-[0_0_20px_rgba(123,104,238,0.5)] hover:shadow-[0_0_30px_rgba(123,104,238,0.7)]" data-testid="button-place-bet">Place Bet</Button>
              </div>
            </div>

            {/* STATS BAR */}
            <div className="p-1">
              <div className="glass-panel neon-border overflow-visible" style={{borderRadius: '18px', padding: '18px 28px'}}>
                <div className="flex items-stretch">
                  <div className="flex-1 text-center py-2">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <img src={solanaLogo} alt="SOL" className="h-5 w-5" />
                      <div className="text-4xl font-bold font-mono gradient-text">0.401</div>
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Jackpot Value</div>
                  </div>
                  <div className="flex-1 text-center py-2 stats-divider">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <img src={solanaLogo} alt="SOL" className="h-5 w-5" />
                      <div className="text-2xl font-bold font-mono text-foreground" data-testid="text-your-wager">0.000</div>
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Your Wager</div>
                  </div>
                  <div className="flex-1 text-center py-2 stats-divider">
                    <div className="text-2xl font-bold font-mono text-foreground mb-2" data-testid="text-your-chance">0.00%</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Your Chance</div>
                  </div>
                  <div className="flex-1 text-center py-2 stats-divider">
                    <div className="text-3xl font-bold font-mono text-foreground mb-2" data-testid="text-timer">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Time Remaining</div>
                  </div>
                </div>
              </div>
            </div>

            {/* PLAYER CAROUSEL */}
            <div className="relative overflow-hidden pt-12" ref={carouselRef}>
              {/* Arrow indicator pointing to center card */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-primary animate-pulse">
                  <path d="M12 4L12 20M12 20L6 14M12 20L18 14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              
              <div 
                className="flex gap-4 transition-transform duration-75 ease-linear"
                style={{transform: `translateX(-${scrollOffset}px)`}}
              >
                {[...Array(20)].map((_, i) => {
                  // Calculate if this card is centered based on scroll position
                  const cardWidth = carouselRef.current ? carouselRef.current.offsetWidth / 5 : 200;
                  const cardPosition = i * (cardWidth + 16); // card width + gap
                  const centerPosition = carouselRef.current ? carouselRef.current.offsetWidth / 2 : 400;
                  const cardCenter = cardPosition + cardWidth / 2 - scrollOffset;
                  const distanceFromCenter = Math.abs(cardCenter - centerPosition);
                  const isCentered = distanceFromCenter < cardWidth / 3;
                  
                  return (
                    <div key={i} className={`flex-shrink-0 transition-all duration-300 ${isCentered ? 'p-1' : ''}`} style={{width: 'calc(20% - 12.8px)'}}>
                      <div className={`glass-panel p-4 flex flex-col items-center gap-2 ${isCentered ? 'carousel-center-card scale-110' : ''}`} style={{borderRadius: '18px'}}>
                        <Avatar className="h-16 w-16 border-2 border-primary/60 shadow-[0_0_15px_rgba(123,104,238,0.4)]">
                          <AvatarFallback>W</AvatarFallback>
                        </Avatar>
                        <div className="text-sm font-medium text-muted-foreground">Waiting</div>
                        <div className="flex items-center gap-1 text-sm font-mono">
                          <img src={solanaLogo} alt="SOL" className="h-4 w-4" />
                          <span className="text-muted-foreground font-bold">0.000</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div><span className="text-foreground font-semibold">0</span> Players</div>
              <div>•</div>
              <div>Payouts are settled in SOL</div>
              <div>•</div>
              <div>Round: <span className="font-mono" data-testid="text-round">#1</span></div>
            </div>
          </div>

          {/* PLAYER LIST */}
          <div className="flex-1 border-t border-border/30 overflow-hidden">
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
        <div className="w-72 flex-shrink-0 p-6 space-y-3 border-l border-border/30">
          <div className="p-1">
            <div className="glass-panel p-4 neon-border" style={{borderRadius: '18px'}}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-bold uppercase tracking-wider text-foreground">$25K WEEKLY</div>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">LEADERBOARD</div>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-2 p-2 bg-background/50 rounded hover-elevate">
                  <Badge className="gradient-purple-pink text-black font-bold">{i}</Badge>
                  <div className="flex-1 text-sm font-medium">Player{i}</div>
                  <div className="text-sm font-mono text-foreground font-bold">0.188</div>
                </div>
              ))}
            </div>
            </div>
          </div>
          
          <div className="glass-panel p-4" style={{borderRadius: '18px'}}>
            <Badge className="gradient-purple-pink text-black text-xs mb-3 uppercase tracking-wider font-bold">LOOT OF THE DAY!</Badge>
            <div className="h-24 bg-background/30 rounded flex items-center justify-center border border-border/50">
              <div className="text-4xl">🎁</div>
            </div>
          </div>

          <div className="glass-panel p-3" style={{borderRadius: '18px'}}>
            <div className="flex justify-between text-xs text-muted-foreground mb-2 uppercase tracking-wider"><span>Wins</span><Badge variant="secondary" className="text-[10px] uppercase">Chances</Badge></div>
            <div className="flex justify-between"><div className="flex items-center gap-1"><img src={solanaLogo} className="h-3.5 w-3.5" /><span className="font-mono font-bold text-base text-foreground">0.769</span></div><span className="font-semibold text-foreground text-base">2.00%</span></div>
          </div>
        </div>
      </div>

      <GameFooter />
    </div>
  );
}
