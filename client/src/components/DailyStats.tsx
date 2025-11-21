import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface DailyStatsData {
  round: number;
  username: string;
  userLevel: number;
  wonAmount: number;
  chance: number;
  avatarUrl?: string;
}

interface DailyStatsProps {
  type: 'winner' | 'lucky';
  data?: DailyStatsData;
}

export default function DailyStats({ type, data }: DailyStatsProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  // TODO: Replace with actual data from backend/game logic
  const defaultData: DailyStatsData = type === 'winner' 
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

  const statsData = data || defaultData;
  const isWinner = type === 'winner';

  // Load avatar from localStorage in effect to avoid SSR issues
  useEffect(() => {
    if (statsData.avatarUrl) {
      setAvatarUrl(statsData.avatarUrl);
    } else {
      const storedAvatar = localStorage.getItem(`avatar_${statsData.username}`);
      setAvatarUrl(storedAvatar || undefined);
    }
  }, [statsData.username, statsData.avatarUrl]);

  return (
    <div 
      className="glass-panel p-4" 
      style={{
        borderRadius: '18px',
        background: 'rgba(20, 20, 20, 0.7)',
        border: '1px solid rgba(60, 60, 60, 0.4)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 2px 8px rgba(0, 0, 0, 0.5)'
      }}
      data-testid={`card-daily-${type}`}
    >
      {/* Header with Round Number */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">ROUND</div>
        <div className="text-xs text-muted-foreground font-mono">#{statsData.round}</div>
      </div>

      {/* Avatar Section */}
      <div className="flex flex-col items-center mb-3">
        <div 
          className="relative mb-3" 
          style={{
            filter: 'drop-shadow(0 0 20px rgba(234, 179, 8, 0.6))'
          }}
        >
          <Avatar 
            className="w-20 h-20"
            style={{
              border: '2px solid rgba(234, 179, 8, 0.5)',
              boxShadow: 'inset 0 0 10px rgba(234, 179, 8, 0.3), 0 0 20px rgba(234, 179, 8, 0.4)'
            }}
          >
            <AvatarImage src={avatarUrl} />
            <AvatarFallback>{statsData.username.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>

        {/* Username with Badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className="font-semibold text-foreground text-sm" data-testid={`text-${type}-username`}>
            {statsData.username}
          </span>
          <Badge 
            variant="secondary" 
            className="text-xs font-bold"
            style={{
              background: 'rgba(234, 179, 8, 0.2)',
              color: '#fcd34d',
              border: '1px solid rgba(234, 179, 8, 0.3)'
            }}
          >
            {statsData.userLevel}
          </Badge>
        </div>

        {/* Label Badge */}
        <div 
          className="px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider relative"
          style={{
            background: 'linear-gradient(135deg, rgba(180, 83, 9, 0.8), rgba(234, 179, 8, 0.8))',
            color: '#ffffff',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
            boxShadow: '0 0 15px rgba(234, 179, 8, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(234, 179, 8, 0.6)'
          }}
          data-testid={`badge-${type}-label`}
        >
          {isWinner ? 'WIN OF THE DAY' : 'LUCK OF THE DAY'}
          {isWinner ? (
            <>
              {/* Lightning strikes for Win of the Day */}
              <svg 
                className="absolute -top-1 -right-1 w-3 h-3 animate-ping" 
                viewBox="0 0 24 24" 
                style={{
                  animationDelay: '0s', 
                  filter: 'drop-shadow(0 0 4px rgba(253, 224, 71, 0.8))'
                }}
              >
                <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="#FCD34D"/>
              </svg>
              <svg 
                className="absolute -top-1 -left-1 w-2.5 h-2.5 animate-ping" 
                viewBox="0 0 24 24" 
                style={{
                  animationDelay: '0.2s', 
                  filter: 'drop-shadow(0 0 3px rgba(254, 240, 138, 0.8))'
                }}
              >
                <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="#FEF08A"/>
              </svg>
            </>
          ) : (
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
        {/* Won Amount with BNB icon */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Won</span>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground/60 font-mono text-sm">=</span>
            <svg 
              className="w-4 h-4 flex-shrink-0" 
              viewBox="0 0 32 32" 
              fill="none"
              style={{
                filter: 'drop-shadow(0 0 4px rgba(243, 186, 47, 0.6))'
              }}
            >
              <circle cx="16" cy="16" r="16" fill="#F3BA2F"/>
              <path d="M12.116 14.404L16 10.52l3.886 3.886 2.26-2.26L16 6l-6.144 6.144 2.26 2.26zM6 16l2.26-2.26L10.52 16l-2.26 2.26L6 16zm6.116 1.596L16 21.48l3.886-3.886 2.26 2.259L16 26l-6.144-6.144-.003-.003 2.263-2.257zM21.48 16l2.26-2.26L26 16l-2.26 2.26L21.48 16zm-3.188-.002h.002V16L16 18.294l-2.291-2.29-.004-.004.004-.003.401-.402.195-.195L16 13.706l2.293 2.293z" fill="#fff"/>
            </svg>
            <span 
              className="font-mono font-bold no-text-shadow text-base" 
              style={{color: '#FFFFFF'}}
              data-testid={`text-${type}-won`}
            >
              {statsData.wonAmount.toFixed(3)}
            </span>
          </div>
        </div>

        {/* Chance */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Chance</span>
          <span 
            className="font-bold text-base no-text-shadow" 
            style={{
              color: '#fcd34d'
            }}
            data-testid={`text-${type}-chance`}
          >
            {statsData.chance.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}
