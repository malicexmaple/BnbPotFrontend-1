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
}

export default function GameCanvas({ 
  players = [],
  jackpotValue = 0,
  timeRemaining = 0,
  roundNumber = 0,
  blockStatus = "Mining Block"
}: GameCanvasProps) {
  const maxSlots = 15;
  const allSlots = Array.from({ length: maxSlots }, (_, i) => {
    const player = players[i];
    return {
      position: i,
      player: player || null
    };
  });

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timerColor = timeRemaining > 180 ? 'text-green-500' : timeRemaining > 60 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="relative flex flex-col items-center justify-center p-8 min-h-[600px]">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-pink-500/5 rounded-lg" />
      
      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-4xl">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <img src={solanaLogo} alt="SOL" className="h-8 w-8 pulse-glow" />
            <div 
              data-testid="text-jackpot-value"
              className="text-5xl md:text-6xl font-bold font-mono bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent"
            >
              {jackpotValue.toFixed(3)}
            </div>
          </div>
          <div className="text-sm text-muted-foreground uppercase tracking-wide">Jackpot Value</div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className={`text-4xl font-mono font-bold ${timerColor}`} data-testid="text-timer">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            {blockStatus}
          </div>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-5 gap-4 w-full">
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

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div>
            Round: <span className="font-mono text-foreground" data-testid="text-round-number">#{roundNumber}</span>
          </div>
          <div className="h-1 w-1 rounded-full bg-muted" />
          <div>
            Players: <span className="text-foreground" data-testid="text-players-count">{players.length}/{maxSlots}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
