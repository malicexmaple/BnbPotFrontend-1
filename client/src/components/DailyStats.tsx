import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import bnbLogo from '@assets/3dgifmaker21542_1763401668048.gif';

interface DailyStatsProps {
  type: 'winner' | 'lucky';
}

export default function DailyStats({ type }: DailyStatsProps) {
  // TODO: Replace with actual data from backend/game logic
  const mockData = type === 'winner' 
    ? {
        round: 180202,
        username: 'ion_crypto',
        userLevel: 42,
        wonAmount: 2.833,
        chance: 5.87
      }
    : {
        round: 189805,
        username: 'fendix',
        userLevel: 11,
        wonAmount: 0.788,
        chance: 1.20
      };

  const isWinner = type === 'winner';

  return (
    <div 
      className="glass-panel p-4" 
      style={{
        borderRadius: '18px', 
        width: '297px', 
        marginTop: '10px',
        background: 'rgba(20, 20, 20, 0.7)',
        border: '1px solid rgba(60, 60, 60, 0.4)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 2px 8px rgba(0, 0, 0, 0.5)'
      }}
      data-testid={`card-daily-${type}`}
    >
      {/* Header with Round Number */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">ROUND</div>
        <div className="text-xs text-muted-foreground font-mono">#{mockData.round}</div>
      </div>

      {/* Avatar Section */}
      <div className="flex flex-col items-center mb-3">
        <div 
          className="relative mb-3" 
          style={{
            filter: isWinner 
              ? 'drop-shadow(0 0 20px rgba(147, 51, 234, 0.6))' 
              : 'drop-shadow(0 0 20px rgba(234, 179, 8, 0.6))'
          }}
        >
          <Avatar 
            className="w-20 h-20"
            style={{
              border: isWinner 
                ? '2px solid rgba(147, 51, 234, 0.5)' 
                : '2px solid rgba(234, 179, 8, 0.5)',
              boxShadow: isWinner 
                ? 'inset 0 0 10px rgba(147, 51, 234, 0.3), 0 0 20px rgba(147, 51, 234, 0.4)' 
                : 'inset 0 0 10px rgba(234, 179, 8, 0.3), 0 0 20px rgba(234, 179, 8, 0.4)'
            }}
          >
            <AvatarImage src={localStorage.getItem(`avatar_${mockData.username}`) || undefined} />
            <AvatarFallback>{mockData.username.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>

        {/* Username with Badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className="font-semibold text-foreground text-sm" data-testid={`text-${type}-username`}>
            {mockData.username}
          </span>
          <Badge 
            variant="secondary" 
            className="text-xs font-bold"
            style={{
              background: isWinner 
                ? 'rgba(147, 51, 234, 0.2)' 
                : 'rgba(234, 179, 8, 0.2)',
              color: isWinner ? '#a78bfa' : '#fcd34d',
              border: isWinner 
                ? '1px solid rgba(147, 51, 234, 0.3)' 
                : '1px solid rgba(234, 179, 8, 0.3)'
            }}
          >
            {mockData.userLevel}
          </Badge>
        </div>

        {/* Label Badge */}
        <div 
          className="px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider relative"
          style={{
            background: isWinner 
              ? 'linear-gradient(135deg, rgba(88, 28, 135, 0.8), rgba(147, 51, 234, 0.8))' 
              : 'linear-gradient(135deg, rgba(180, 83, 9, 0.8), rgba(234, 179, 8, 0.8))',
            color: '#ffffff',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
            boxShadow: isWinner 
              ? '0 0 15px rgba(147, 51, 234, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)' 
              : '0 0 15px rgba(234, 179, 8, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            border: isWinner 
              ? '1px solid rgba(147, 51, 234, 0.6)' 
              : '1px solid rgba(234, 179, 8, 0.6)'
          }}
          data-testid={`badge-${type}-label`}
        >
          {isWinner ? 'LAST WINNER' : 'LUCK OF THE DAY'}
          {!isWinner && (
            <>
              {/* Golden sparkles for Luck of the Day */}
              <svg 
                className="absolute -top-1 -right-1 w-3 h-3 animate-ping" 
                viewBox="0 0 24 24" 
                style={{
                  animationDelay: '0s', 
                  filter: 'drop-shadow(0 0 4px rgba(253, 224, 71, 0.8))'
                }}
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FCD34D"/>
              </svg>
              <svg 
                className="absolute -top-1 -left-1 w-2.5 h-2.5 animate-ping" 
                viewBox="0 0 24 24" 
                style={{
                  animationDelay: '0.2s', 
                  filter: 'drop-shadow(0 0 3px rgba(254, 240, 138, 0.8))'
                }}
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FEF08A"/>
              </svg>
            </>
          )}
        </div>
      </div>

      {/* Stats Section */}
      <div className="space-y-2 mt-4">
        {/* Won Amount */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Won</span>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground/60 font-mono">=</span>
            <span 
              className="font-mono font-bold no-text-shadow text-base" 
              style={{color: '#FFFFFF'}}
              data-testid={`text-${type}-won`}
            >
              {mockData.wonAmount.toFixed(3)}
            </span>
          </div>
        </div>

        {/* Chance */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Chance</span>
          <span 
            className="font-bold text-base no-text-shadow" 
            style={{
              color: isWinner ? '#60a5fa' : '#fcd34d'
            }}
            data-testid={`text-${type}-chance`}
          >
            {mockData.chance.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}
