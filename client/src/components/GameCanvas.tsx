import PlayerSlot from "./PlayerSlot";
import solanaLogo from '@assets/generated_images/Solana_cryptocurrency_logo_icon_b1e8938e.png';

interface Player {
  id: string;
  username: string;
  avatarUrl?: string;
  betAmount: number;
  winChance: number;
  level: number;
}

interface GameCanvasProps {
  players?: Player[];
  jackpotValue?: number;
  timeRemaining?: number;
  roundNumber?: number;
  blockStatus?: string;
  yourWager?: number;
  yourChance?: number;
  totalBets?: number;
}

export default function GameCanvas({ 
  players = [],
  jackpotValue = 0,
  timeRemaining = 0,
  roundNumber = 0,
  blockStatus = "Mining Block",
  yourWager = 0,
  yourChance = 0,
  totalBets = 11283195
}: GameCanvasProps) {
  const maxSlots = 15;
  
  const allSlots = Array.from({ length: maxSlots }, (_, i) => {
    const player = players[i];
    return {
      position: i,
      player: player || null
    };
  });

  const hours = Math.floor(timeRemaining / 3600);
  const minutes = Math.floor((timeRemaining % 3600) / 60);
  const seconds = timeRemaining % 60;
  const timerColor = timeRemaining > 180 ? 'text-green-500' : timeRemaining > 60 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-start p-6 overflow-auto">
        <div className="w-full max-w-2xl space-y-6">
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex items-center gap-3">
              <img src={solanaLogo} alt="SOL" className="h-8 w-8 pulse-glow" />
              <div 
                data-testid="text-jackpot-value"
                className="text-5xl md:text-6xl font-bold font-mono bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent"
              >
                {jackpotValue.toFixed(3)}
              </div>
            </div>
            <div className="text-sm text-muted-foreground uppercase tracking-wider">Jackpot Value</div>
          </div>

          <div className="grid grid-cols-2 gap-6 px-8">
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card/50 border border-border">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Your Wager</div>
              <div className="flex items-center gap-2">
                <img src={solanaLogo} alt="SOL" className="h-4 w-4" />
                <div className="font-mono font-bold text-xl" data-testid="text-your-wager">
                  {yourWager.toFixed(3)}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card/50 border border-border">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Your Chance</div>
              <div className="font-bold text-xl text-primary" data-testid="text-your-chance">
                {yourChance.toFixed(2)}%
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 py-6">
            <div className={`text-6xl md:text-7xl font-mono font-bold tracking-wider ${timerColor}`} data-testid="text-timer">
              {String(hours).padStart(2, '0')}   {String(minutes).padStart(2, '0')}   ::   {String(minutes).padStart(2, '0')}   {String(seconds).padStart(2, '0')}
            </div>
            <div className="text-sm text-muted-foreground uppercase tracking-wider">
              Time Remaining
            </div>
            <div className="text-xs text-muted-foreground">
              {blockStatus}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {allSlots.map(({ position, player }) => (
              <PlayerSlot
                key={position}
                position={position}
                username={player?.username}
                avatarUrl={player?.avatarUrl}
                betAmount={player?.betAmount}
                winChance={player?.winChance}
                level={player?.level}
                isWaiting={!player}
              />
            ))}
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground py-4">
            <div>
              <span className="text-foreground font-semibold" data-testid="text-players-count">{players.length}</span> Players
            </div>
            <div className="h-1 w-1 rounded-full bg-muted" />
            <div>
              Round: <span className="font-mono text-foreground font-semibold" data-testid="text-round-number">#{roundNumber}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-card/30 backdrop-blur p-3">
        <div className="text-center text-xs text-muted-foreground">
          Payouts are settled in SOL
        </div>
      </div>
    </div>
  );
}
