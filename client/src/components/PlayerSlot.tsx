import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface PlayerSlotProps {
  username?: string;
  avatarUrl?: string;
  betAmount?: number;
  winChance?: number;
  level?: number;
  isWaiting?: boolean;
  position?: number;
}

export default function PlayerSlot({ 
  username = "Waiting", 
  avatarUrl,
  betAmount = 0,
  winChance = 0,
  level = 0,
  isWaiting = true,
  position = 0
}: PlayerSlotProps) {
  return (
    <div 
      data-testid={`player-slot-${position}`}
      className={`relative flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
        isWaiting 
          ? 'border-border/50 opacity-40 grayscale' 
          : 'border-primary/50 shadow-lg shadow-primary/20 hover-elevate'
      }`}
    >
      <div className="relative">
        <Avatar className={`h-12 w-12 border-2 ${isWaiting ? 'border-border' : 'border-primary'}`}>
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className="bg-muted text-xs">
            {isWaiting ? '?' : username?.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {!isWaiting && level > 0 && (
          <Badge 
            variant="secondary" 
            className="absolute -bottom-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] rounded-full"
          >
            {level}
          </Badge>
        )}
      </div>

      <div className="flex flex-col items-center gap-1 w-full min-w-[80px]">
        <div className="text-xs font-medium truncate max-w-full" data-testid={`text-username-${position}`}>
          {username}
        </div>
        {!isWaiting && (
          <>
            <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
              <span data-testid={`text-bet-amount-${position}`}>{betAmount.toFixed(3)}</span>
              <span className="text-[10px]">SOL</span>
            </div>
            <div className="text-xs font-semibold text-primary" data-testid={`text-win-chance-${position}`}>
              {winChance.toFixed(2)}%
            </div>
          </>
        )}
      </div>
    </div>
  );
}
