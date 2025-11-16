import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import solanaLogo from '@assets/generated_images/Solana_cryptocurrency_logo_icon_b1e8938e.png';

interface AirdropPlayer {
  id: string;
  username: string;
  avatarUrl?: string;
  amount: number;
  level: number;
}

interface LiveAirdropSidebarProps {
  players?: AirdropPlayer[];
  airdropValue?: number;
  timeRemaining?: string;
}

export default function LiveAirdropSidebar({ 
  players = [],
  airdropValue = 0.261,
  timeRemaining = "05:03"
}: LiveAirdropSidebarProps) {
  return (
    <Card className="h-full flex flex-col rounded-none border-r">
      <CardHeader className="pb-3 border-b space-y-3">
        <div className="flex items-center gap-2">
          <div className="text-sm font-bold uppercase tracking-wider">LIVE</div>
          <Badge variant="default" className="bg-primary">AIRDROP</Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={solanaLogo} alt="SOL" className="h-4 w-4" />
              <div className="text-2xl font-bold font-mono">{airdropValue.toFixed(3)}</div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">Airdrop Live</div>
          <div className="text-xs text-muted-foreground">{timeRemaining}</div>
          <div className="text-xs text-muted-foreground">Joined</div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <ScrollArea className="flex-1 px-3 py-2">
          <div className="space-y-2">
            {players.map((player) => (
              <div 
                key={player.id}
                data-testid={`airdrop-player-${player.id}`}
                className="flex items-center gap-3 p-2 rounded hover-elevate"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={player.avatarUrl} />
                  <AvatarFallback className="text-xs">
                    {player.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{player.username}</span>
                    <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                      {player.level}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {player.amount.toFixed(3)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-3 border-t space-y-2">
          <Input
            data-testid="input-airdrop-message"
            placeholder="Type Message Here..."
            className="h-9 text-sm"
          />
          <Button
            data-testid="button-clear-bets"
            variant="outline"
            className="w-full h-9 text-sm"
          >
            Clear Bets
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
