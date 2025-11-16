import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy } from "lucide-react";
import solanaLogo from '@assets/generated_images/Solana_cryptocurrency_logo_icon_b1e8938e.png';

interface Player {
  id: string;
  username: string;
  avatarUrl?: string;
  betAmount: number;
  winChance: number;
  level: number;
}

interface JackpotMainAreaProps {
  players?: Player[];
  jackpotValue?: number;
  yourWager?: number;
  yourChance?: number;
  timeRemaining?: number;
  roundNumber?: number;
  totalPlayers?: number;
}

export default function JackpotMainArea({ 
  players = [],
  jackpotValue = 0.401,
  yourWager = 0.000,
  yourChance = 0.00,
  timeRemaining = 13,
  roundNumber = 186407,
  totalPlayers = 11
}: JackpotMainAreaProps) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  const topSlots = 5;
  const visiblePlayers = players.slice(0, topSlots);
  const emptySlots = Math.max(0, topSlots - visiblePlayers.length);

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
            <Trophy className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-2xl font-bold tracking-wide text-primary">JACKPOT</div>
            <div className="text-xs text-muted-foreground">Winner takes all...</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="bg-card/50 border border-border rounded-lg p-4 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5">
              <img src={solanaLogo} alt="SOL" className="h-4 w-4" />
              <div className="text-2xl font-bold font-mono text-primary">{jackpotValue.toFixed(3)}</div>
            </div>
            <div className="text-xs text-muted-foreground">Jackpot Value</div>
          </div>

          <div className="bg-card/50 border border-border rounded-lg p-4 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5">
              <img src={solanaLogo} alt="SOL" className="h-4 w-4" />
              <div className="text-2xl font-bold font-mono" data-testid="text-your-wager">
                {yourWager.toFixed(3)}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">Your Wager</div>
          </div>

          <div className="bg-card/50 border border-border rounded-lg p-4 text-center space-y-1">
            <div className="text-2xl font-bold text-primary" data-testid="text-your-chance">
              {yourChance.toFixed(2)}%
            </div>
            <div className="text-xs text-muted-foreground">Your Chance</div>
          </div>

          <div className="bg-card/50 border border-border rounded-lg p-4 text-center space-y-1">
            <div className="text-2xl font-bold font-mono" data-testid="text-timer">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <div className="text-xs text-muted-foreground">Time Remaining</div>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {visiblePlayers.map((player) => (
            <div 
              key={player.id}
              className="bg-card border border-primary/30 rounded-lg p-3 flex flex-col items-center gap-2 hover-elevate"
            >
              <Avatar className="h-16 w-16 border-2 border-primary/50">
                <AvatarImage src={player.avatarUrl} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {player.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm font-medium truncate w-full text-center">
                {player.username}
              </div>
              <div className="flex items-center gap-1 text-xs font-mono">
                <img src={solanaLogo} alt="SOL" className="h-3 w-3" />
                <span className="text-primary">{player.betAmount.toFixed(3)}</span>
              </div>
            </div>
          ))}
          
          {Array.from({ length: emptySlots }).map((_, i) => (
            <div 
              key={`empty-${i}`}
              className="bg-card/30 border border-border/50 rounded-lg p-3 flex flex-col items-center gap-2 opacity-40"
            >
              <div className="h-16 w-16 rounded-full bg-muted/50 border-2 border-border/50" />
              <div className="text-sm text-muted-foreground">Waiting</div>
              <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                <img src={solanaLogo} alt="SOL" className="h-3 w-3 opacity-50" />
                0.000
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground pt-2">
          <div>
            <span className="text-foreground font-semibold">{totalPlayers}</span> Players
          </div>
          <div className="h-1 w-1 rounded-full bg-border" />
          <div>Payouts are settled in SOL</div>
          <div className="h-1 w-1 rounded-full bg-border" />
          <div>
            Round: <span className="text-foreground font-mono" data-testid="text-round-number">#{roundNumber}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 border-t border-border bg-card/20">
        <ScrollArea className="h-full">
          <div className="p-3 space-y-2">
            {players.map((player) => (
              <div 
                key={`detail-${player.id}`}
                className="bg-card border border-border rounded-lg p-3 flex items-center gap-3 hover-elevate"
              >
                <Avatar className="h-10 w-10 border border-primary/30">
                  <AvatarImage src={player.avatarUrl} />
                  <AvatarFallback className="bg-primary/20">{player.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium text-sm">{player.username}</div>
                    <div className="text-xs text-muted-foreground">#{player.level}</div>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-sm">
                    <img src={solanaLogo} alt="SOL" className="h-4 w-4" />
                    <span className="text-primary">{player.betAmount.toFixed(3)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ~${(player.betAmount * 135).toFixed(2)}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Chance</div>
                    <div className="font-semibold text-primary text-sm">{player.winChance.toFixed(2)}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
