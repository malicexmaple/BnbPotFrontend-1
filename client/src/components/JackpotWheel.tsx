import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Bet {
  id: string;
  userAddress: string;
  amount: string;
  timestamp: string;
}

interface CurrentRound {
  id: string;
  roundNumber: number;
  totalPot: string;
  timeRemaining: number;
  bets: Bet[];
  status: string;
}

interface PlayerSlot {
  userAddress: string;
  username: string;
  totalBet: number;
  winChance: number;
  avatarUrl?: string;
}

export default function JackpotWheel() {
  const [timeLeft, setTimeLeft] = useState(0);
  
  const { data: round, isLoading } = useQuery<CurrentRound>({
    queryKey: ['/api/rounds/current'],
    refetchInterval: 2000, // Refetch every 2 seconds
  });

  useEffect(() => {
    if (round?.timeRemaining) {
      setTimeLeft(round.timeRemaining);
    }
  }, [round]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Group bets by player address and calculate totals
  const playerSlots: PlayerSlot[] = [];
  if (round?.bets) {
    const playerMap = new Map<string, { totalBet: number; username: string }>();
    
    round.bets.forEach(bet => {
      const current = playerMap.get(bet.userAddress) || { totalBet: 0, username: bet.userAddress.slice(0, 8) };
      current.totalBet += parseFloat(bet.amount);
      playerMap.set(bet.userAddress, current);
    });
    
    const totalPot = parseFloat(round.totalPot);
    
    playerMap.forEach((data, address) => {
      const winChance = totalPot > 0 ? (data.totalBet / totalPot) * 100 : 0;
      playerSlots.push({
        userAddress: address,
        username: data.username,
        totalBet: data.totalBet,
        winChance,
      });
    });
    
    // Sort by win chance descending
    playerSlots.sort((a, b) => b.winChance - a.winChance);
  }

  // Create 100 wheel slots, distributed by win chance
  const wheelSlots: PlayerSlot[] = [];
  if (playerSlots.length > 0) {
    playerSlots.forEach(player => {
      const slots = Math.max(1, Math.round(player.winChance)); // At least 1 slot per player
      for (let i = 0; i < slots; i++) {
        wheelSlots.push(player);
      }
    });
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading round data...</div>
      </div>
    );
  }

  if (!round) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">No active round</div>
      </div>
    );
  }

  const totalPot = parseFloat(round.totalPot);

  return (
    <div className="flex flex-col h-full gap-4" data-testid="container-jackpot-wheel">
      {/* Jackpot Value Display */}
      <div 
        className="glass-panel p-6 text-center"
        style={{
          borderRadius: '18px',
          background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.1), rgba(250, 204, 21, 0.05))',
          border: '2px solid rgba(234, 179, 8, 0.3)',
          boxShadow: '0 0 30px rgba(234, 179, 8, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
          Current Jackpot
        </div>
        <div className="flex items-center justify-center gap-3">
          <svg 
            className="w-12 h-12 flex-shrink-0" 
            viewBox="0 0 32 32" 
            fill="none"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(243, 186, 47, 0.6))'
            }}
          >
            <circle cx="16" cy="16" r="16" fill="#F3BA2F"/>
            <path d="M12.116 14.404L16 10.52l3.886 3.886 2.26-2.26L16 6l-6.144 6.144 2.26 2.26zM6 16l2.26-2.26L10.52 16l-2.26 2.26L6 16zm6.116 1.596L16 21.48l3.886-3.886 2.26 2.259L16 26l-6.144-6.144-.003-.003 2.263-2.257zM21.48 16l2.26-2.26L26 16l-2.26 2.26L21.48 16zm-3.188-.002h.002V16L16 18.294l-2.291-2.29-.004-.004.004-.003.401-.402.195-.195L16 13.706l2.293 2.293z" fill="#fff"/>
          </svg>
          <span 
            className="font-mono font-bold text-5xl"
            style={{
              color: '#FBBF24',
              textShadow: '0 0 20px rgba(251, 191, 36, 0.8), 0 2px 4px rgba(0, 0, 0, 0.5)'
            }}
            data-testid="text-jackpot-value"
          >
            {totalPot.toFixed(4)}
          </span>
          <span className="text-2xl text-muted-foreground font-semibold">BNB</span>
        </div>
        
        {/* Time Remaining */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="text-sm text-muted-foreground uppercase tracking-wider">Next Round in:</span>
          <Badge 
            variant="secondary"
            className="text-lg font-mono font-bold px-4 py-1"
            style={{
              background: 'rgba(234, 179, 8, 0.2)',
              color: '#fcd34d',
              border: '1px solid rgba(234, 179, 8, 0.4)'
            }}
            data-testid="text-time-remaining"
          >
            {formatTime(timeLeft)}
          </Badge>
        </div>
      </div>

      {/* Player Carousel Wheel */}
      <div 
        className="glass-panel p-4 flex-1"
        style={{
          borderRadius: '18px',
          background: 'rgba(20, 20, 20, 0.7)',
          border: '1px solid rgba(60, 60, 60, 0.4)',
        }}
      >
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3 text-center">
          Players ({playerSlots.length})
        </div>
        
        {playerSlots.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground text-sm">No bets placed yet</div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Player List with Win Chances */}
            {playerSlots.map((player, index) => (
              <div 
                key={player.userAddress}
                className="flex items-center gap-3 p-3 rounded-lg hover-elevate"
                style={{
                  background: 'rgba(30, 30, 30, 0.5)',
                  border: '1px solid rgba(60, 60, 60, 0.3)'
                }}
                data-testid={`card-player-${index}`}
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={player.avatarUrl} />
                  <AvatarFallback>{player.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate" data-testid={`text-player-name-${index}`}>
                    {player.username}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Wagered:</span>
                    <span className="font-mono text-yellow-400" data-testid={`text-player-bet-${index}`}>
                      {player.totalBet.toFixed(4)} BNB
                    </span>
                  </div>
                </div>
                
                {/* Win Chance Badge */}
                <Badge
                  variant="secondary"
                  className="font-bold"
                  style={{
                    background: `rgba(234, 179, 8, ${Math.min(0.3 + (player.winChance / 100) * 0.4, 0.7)})`,
                    color: '#fcd34d',
                    border: '1px solid rgba(234, 179, 8, 0.4)',
                    minWidth: '70px',
                    textAlign: 'center'
                  }}
                  data-testid={`text-player-chance-${index}`}
                >
                  {player.winChance.toFixed(2)}%
                </Badge>
              </div>
            ))}
            
            {/* Visual Wheel Representation */}
            <div className="mt-6">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2 text-center">
                Win Chance Distribution
              </div>
              <div className="flex h-8 rounded-full overflow-hidden" style={{ border: '2px solid rgba(234, 179, 8, 0.3)' }}>
                {playerSlots.map((player, index) => (
                  <div
                    key={`${player.userAddress}-${index}`}
                    className="relative group"
                    style={{
                      width: `${player.winChance}%`,
                      background: `hsl(${(index * 137) % 360}, 70%, 50%)`,
                      transition: 'all 0.3s ease'
                    }}
                    title={`${player.username}: ${player.winChance.toFixed(2)}%`}
                    data-testid={`wheel-segment-${index}`}
                  >
                    {player.winChance > 10 && (
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                        {player.winChance.toFixed(0)}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Round Info */}
      <div className="flex justify-between text-xs text-muted-foreground px-2">
        <span data-testid="text-round-number">Round #{round.roundNumber}</span>
        <span data-testid="text-total-bets">{round.bets.length} Bets</span>
      </div>
    </div>
  );
}
