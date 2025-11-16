import { useState, useEffect } from "react";
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

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => prev <= 0 ? 13 : prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mockPlayers = [
    { id: '1', username: 'B0ZO', avatarUrl: avatar1, betAmount: 0.033, winChance: 8.22, level: 10 },
    { id: '2', username: 'B0Zo', avatarUrl: avatar2, betAmount: 0.005, winChance: 1.24, level: 15 },
    { id: '3', username: 'shayand', avatarUrl: avatar3, betAmount: 0.050, winChance: 12.46, level: 12 },
    { id: '4', username: 'B0Zo', betAmount: 0.005, winChance: 1.24, level: 10 },
  ];

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
        {/* LEFT SIDEBAR - LIVE AIRDROP + CHAT */}
        <div className="w-80 flex-shrink-0 flex flex-col border-r border-border/30">
          <div className="glass-panel m-3 rounded-lg p-4 space-y-3 neon-border">
            <div className="flex items-center justify-between">
              <Badge className="gradient-purple-pink text-white text-xs font-bold uppercase tracking-wider">LIVE</Badge>
              <Badge variant="secondary" className="text-xs uppercase tracking-wider">AIRDROP</Badge>
            </div>
            <div className="flex items-center gap-2">
              <img src={solanaLogo} alt="SOL" className="h-6 w-6 pulse-glow" />
              <div className="text-3xl font-bold font-mono text-foreground">0.261</div>
            </div>
            <div className="text-sm font-mono text-foreground">05:03</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Joined</div>
          </div>

          <ScrollArea className="flex-1 px-3">
            <div className="space-y-1">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded hover:bg-white/5">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">U{i}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="text-sm">User{i}</div>
                    <div className="text-xs text-muted-foreground font-mono">0.00</div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{10 + i}</Badge>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-3 space-y-2 border-t border-border/30">
            <Input placeholder="Type Message Here..." className="h-9 text-sm glass-panel" data-testid="input-chat" />
            <Button variant="outline" className="w-full h-9 text-sm" data-testid="button-clear">Clear Bets</Button>
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
                <Button className="gradient-purple-pink text-white font-bold shadow-[0_0_20px_rgba(107,75,255,0.6)] hover:shadow-[0_0_30px_rgba(107,75,255,0.8)]" data-testid="button-place-bet">Place Bet</Button>
              </div>
            </div>

            {/* STATS CARDS */}
            <div className="grid grid-cols-4 gap-3">
              <div className="glass-panel rounded-lg p-5 text-center neon-border">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <img src={solanaLogo} alt="SOL" className="h-5 w-5" />
                  <div className="text-5xl font-bold font-mono gradient-text">0.401</div>
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Jackpot Value</div>
              </div>
              <div className="glass-panel rounded-lg p-5 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <img src={solanaLogo} alt="SOL" className="h-5 w-5" />
                  <div className="text-2xl font-bold font-mono text-foreground" data-testid="text-your-wager">0.000</div>
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Your Wager</div>
              </div>
              <div className="glass-panel rounded-lg p-5 text-center">
                <div className="text-2xl font-bold font-mono text-foreground mb-2" data-testid="text-your-chance">0.00%</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Your Chance</div>
              </div>
              <div className="glass-panel rounded-lg p-5 text-center">
                <div className="text-4xl font-bold font-mono text-foreground mb-2" data-testid="text-timer">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Time Remaining</div>
              </div>
            </div>

            {/* PLAYER CAROUSEL */}
            <div className="grid grid-cols-5 gap-3">
              {mockPlayers.slice(0, 5).map((p, i) => (
                <div key={p.id || i} className={`glass-panel rounded-lg p-4 flex flex-col items-center gap-2 ${i === 2 ? 'neon-border scale-110 shadow-[0_0_30px_rgba(107,75,255,0.5)]' : ''}`}>
                  <Avatar className="h-16 w-16 border-2 border-primary/60 shadow-[0_0_15px_rgba(107,75,255,0.4)]">
                    <AvatarImage src={p.avatarUrl} />
                    <AvatarFallback>{p.username?.slice(0, 2) || 'W'}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm font-medium text-foreground">{p.username || 'Waiting'}</div>
                  <div className="flex items-center gap-1 text-sm font-mono">
                    <img src={solanaLogo} alt="SOL" className="h-4 w-4" />
                    <span className="text-foreground font-bold">{p.betAmount?.toFixed(3) || '0.000'}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div><span className="text-foreground font-semibold">11</span> Players</div>
              <div>•</div>
              <div>Payouts are settled in SOL</div>
              <div>•</div>
              <div>Round: <span className="font-mono" data-testid="text-round">#186407</span></div>
            </div>
          </div>

          {/* PLAYER LIST */}
          <div className="flex-1 border-t border-border/30 overflow-hidden">
            <ScrollArea className="h-full p-3">
              {mockPlayers.map(p => (
                <div key={p.id} className="glass-panel rounded-lg p-3 mb-2 flex items-center gap-3 hover-elevate">
                  <Avatar className="h-10 w-10 border border-primary/40"><AvatarImage src={p.avatarUrl} /><AvatarFallback>{p.username.slice(0, 2)}</AvatarFallback></Avatar>
                  <div className="flex-1 flex items-center justify-between">
                    <div><div className="font-medium text-sm text-foreground">{p.username}</div><div className="text-xs text-muted-foreground uppercase tracking-wider">LVL {p.level}</div></div>
                    <div className="flex items-center gap-1 font-mono"><img src={solanaLogo} className="h-4 w-4" /><span className="text-foreground font-bold text-sm">{p.betAmount.toFixed(3)}</span></div>
                    <div className="text-xs text-muted-foreground">~${(p.betAmount * 135).toFixed(2)}</div>
                    <div className="text-right"><div className="text-xs text-muted-foreground uppercase tracking-wider">Chance</div><div className="font-semibold text-foreground text-sm">{p.winChance.toFixed(2)}%</div></div>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>
        </div>

        {/* RIGHT SIDEBAR - LEADERBOARD */}
        <div className="w-72 flex-shrink-0 p-4 space-y-3 border-l border-border/30">
          <div className="glass-panel rounded-lg p-4 neon-border">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-bold uppercase tracking-wider text-foreground">$25K WEEKLY</div>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">LEADERBOARD</div>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-2 p-2 bg-background/50 rounded hover-elevate">
                  <Badge className="gradient-purple-pink text-white font-bold">{i}</Badge>
                  <div className="flex-1 text-sm font-medium">Player{i}</div>
                  <div className="text-sm font-mono text-foreground font-bold">0.188</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="glass-panel rounded-lg p-4">
            <Badge className="gradient-purple-pink text-white text-xs mb-3 uppercase tracking-wider font-bold">LOOT OF THE DAY!</Badge>
            <div className="h-24 bg-background/30 rounded flex items-center justify-center border border-border/50">
              <div className="text-4xl">🎁</div>
            </div>
          </div>

          <div className="glass-panel rounded-lg p-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-2 uppercase tracking-wider"><span>Wins</span><Badge variant="secondary" className="text-[10px] uppercase">Chances</Badge></div>
            <div className="flex justify-between"><div className="flex items-center gap-1"><img src={solanaLogo} className="h-3.5 w-3.5" /><span className="font-mono font-bold text-base text-foreground">0.769</span></div><span className="font-semibold text-foreground text-base">2.00%</span></div>
          </div>
        </div>
      </div>

      <GameFooter />
    </div>
  );
}
