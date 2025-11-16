import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import solanaLogo from '@assets/generated_images/Solana_cryptocurrency_logo_icon_b1e8938e.png';

interface Player {
  id: string;
  username: string;
  avatarUrl?: string;
  betAmount: number;
  winChance: number;
  level: number;
}

interface JackpotGameAreaProps {
  players?: Player[];
  jackpotValue?: number;
  yourWager?: number;
  yourChance?: number;
  timeRemaining?: number;
  roundNumber?: number;
  totalPlayers?: number;
}

export default function JackpotGameArea({ 
  players = [],
  jackpotValue = 0.401,
  yourWager = 0.000,
  yourChance = 0.00,
  timeRemaining = 13,
  roundNumber = 186407,
  totalPlayers = 11
}: JackpotGameAreaProps) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  const visibleSlots = 5;
  const topPlayers = players.slice(0, visibleSlots);
  const emptySlots = Math.max(0, visibleSlots - topPlayers.length);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <div className="h-4 w-4 rounded-full bg-primary" />
          </div>
          <div>
            <div className="text-2xl font-bold uppercase tracking-wide">JACKPOT</div>
            <div className="text-xs text-muted-foreground">Winner takes all...</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4 text-center space-y-1">
            <div className="flex items-center justify-center gap-1">
              <img src={solanaLogo} alt="SOL" className="h-4 w-4" />
              <div className="text-2xl font-bold font-mono">{jackpotValue.toFixed(3)}</div>
            </div>
            <div className="text-xs text-muted-foreground">Jackpot Value</div>
          </Card>

          <Card className="p-4 text-center space-y-1">
            <div className="flex items-center justify-center gap-1">
              <img src={solanaLogo} alt="SOL" className="h-4 w-4" />
              <div className="text-2xl font-bold font-mono" data-testid="text-your-wager">
                {yourWager.toFixed(3)}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">Your Wager</div>
          </Card>

          <Card className="p-4 text-center space-y-1">
            <div className="text-2xl font-bold" data-testid="text-your-chance">
              {yourChance.toFixed(2)}%
            </div>
            <div className="text-xs text-muted-foreground">Your Chance</div>
          </Card>

          <Card className="p-4 text-center space-y-1">
            <div className="text-2xl font-bold font-mono" data-testid="text-timer">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <div className="text-xs text-muted-foreground">Time Remaining</div>
          </Card>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {topPlayers.map((player) => (
            <Card 
              key={player.id}
              className="p-3 flex flex-col items-center gap-2 border-primary/50"
            >
              <Avatar className="h-16 w-16 border-2 border-primary">
                <AvatarImage src={player.avatarUrl} />
                <AvatarFallback>{player.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="text-sm font-medium truncate w-full text-center">
                {player.username}
              </div>
              <div className="flex items-center gap-1 text-xs font-mono">
                <img src={solanaLogo} alt="SOL" className="h-3 w-3" />
                {player.betAmount.toFixed(3)}
              </div>
            </Card>
          ))}
          
          {Array.from({ length: emptySlots }).map((_, i) => (
            <Card 
              key={`empty-${i}`}
              className="p-3 flex flex-col items-center gap-2 opacity-30"
            >
              <div className="h-16 w-16 rounded-full bg-muted border-2 border-border" />
              <div className="text-sm text-muted-foreground">Waiting</div>
              <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                <img src={solanaLogo} alt="SOL" className="h-3 w-3 opacity-50" />
                0.000
              </div>
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground pt-2">
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

      <div className="flex-1 border-t">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-2">
            {players.map((player) => (
              <Card 
                key={`detail-${player.id}`}
                className="p-3 flex items-center gap-4"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={player.avatarUrl} />
                  <AvatarFallback>{player.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{player.username}</div>
                    <div className="text-xs text-muted-foreground">#{player.level}</div>
                  </div>
                  <div className="flex items-center gap-1 font-mono">
                    <img src={solanaLogo} alt="SOL" className="h-4 w-4" />
                    {player.betAmount.toFixed(3)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ~${(player.betAmount * 135).toFixed(2)}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Chance</div>
                    <div className="font-semibold text-primary">{player.winChance.toFixed(2)}%</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
