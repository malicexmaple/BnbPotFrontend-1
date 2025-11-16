import PlayerSlot from "./PlayerSlot";
import BettingPanel from "./BettingPanel";
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
  onPlaceBet?: (amount: number) => void;
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
  onPlaceBet,
  yourWager = 0,
  yourChance = 0,
  totalBets = 11283195
}: GameCanvasProps) {
  const maxSlots = 15;
  
  const innerRing = 8;
  const outerRing = 7;
  
  const innerRadius = 180;
  const outerRadius = 280;

  const getPosition = (index: number) => {
    if (index < innerRing) {
      const angle = (index / innerRing) * 2 * Math.PI - Math.PI / 2;
      return {
        x: Math.cos(angle) * innerRadius,
        y: Math.sin(angle) * innerRadius
      };
    } else {
      const outerIndex = index - innerRing;
      const angle = (outerIndex / outerRing) * 2 * Math.PI - Math.PI / 2;
      return {
        x: Math.cos(angle) * outerRadius,
        y: Math.sin(angle) * outerRadius
      };
    }
  };

  const allSlots = Array.from({ length: maxSlots }, (_, i) => {
    const player = players[i];
    const pos = getPosition(i);
    return {
      position: i,
      player: player || null,
      x: pos.x,
      y: pos.y
    };
  });

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timerColor = timeRemaining > 180 ? 'text-green-500' : timeRemaining > 60 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="relative flex flex-col bg-card/30 backdrop-blur rounded-lg border border-border overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-pink-500/5" />
      
      <div className="relative z-10 flex flex-col items-center py-8 px-4">
        <div className="relative w-full max-w-3xl" style={{ height: '640px' }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                <img src={solanaLogo} alt="SOL" className="h-10 w-10 pulse-glow" />
                <div 
                  data-testid="text-jackpot-value"
                  className="text-6xl font-bold font-mono bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent"
                >
                  {jackpotValue.toFixed(3)}
                </div>
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wide">Jackpot Value</div>
              
              <div className="flex flex-col items-center gap-2 mt-4">
                <div className={`text-5xl font-mono font-bold ${timerColor}`} data-testid="text-timer">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  {blockStatus}
                </div>
              </div>
            </div>
          </div>

          {allSlots.map(({ position, player, x, y }) => (
            <div
              key={position}
              className="absolute"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
              }}
            >
              <PlayerSlot
                position={position}
                username={player?.username}
                avatarUrl={player?.avatarUrl}
                betAmount={player?.betAmount}
                winChance={player?.winChance}
                level={player?.level}
                isWaiting={!player}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-6 text-sm text-muted-foreground mt-6 mb-4">
          <div>
            Round: <span className="font-mono text-foreground" data-testid="text-round-number">#{roundNumber}</span>
          </div>
          <div className="h-1 w-1 rounded-full bg-muted" />
          <div>
            Players: <span className="text-foreground" data-testid="text-players-count">{players.length}/{maxSlots}</span>
          </div>
          <div className="h-1 w-1 rounded-full bg-muted" />
          <div>
            Total Bets: <span className="font-mono text-foreground" data-testid="text-total-bets">{totalBets.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 border-t border-border bg-card/50 backdrop-blur p-6">
        <BettingPanel 
          onPlaceBet={onPlaceBet}
          yourWager={yourWager}
          yourChance={yourChance}
          totalBets={totalBets}
          isIntegrated={true}
        />
      </div>
    </div>
  );
}
