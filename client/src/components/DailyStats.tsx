import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
  type: 'winner' | 'lucky' | 'latest';
  data?: DailyStatsData;
}

export default function DailyStats({ type, data }: DailyStatsProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  const endpoint = type === 'latest' 
    ? '/api/stats/latest-winner'
    : type === 'winner'
    ? '/api/stats/win-of-day'
    : '/api/stats/luck-of-day';

  const { data: apiData } = useQuery<DailyStatsData | null>({
    queryKey: [endpoint],
    refetchInterval: 10000,
    enabled: !data,
  });

  const defaultData: DailyStatsData = type === 'winner' 
    ? { round: 180202, username: 'ion_crypto', userLevel: 42, wonAmount: 2.833, chance: 5.87 }
    : type === 'latest'
    ? { round: 190000, username: 'crypto_king', userLevel: 28, wonAmount: 1.456, chance: 3.42 }
    : { round: 189805, username: 'fendix', userLevel: 11, wonAmount: 0.788, chance: 1.20 };

  const statsData = data || apiData || defaultData;
  const isWinner = type === 'winner';
  const isLatest = type === 'latest';

  useEffect(() => {
    const loadAvatar = async () => {
      if (statsData.avatarUrl) {
        setAvatarUrl(statsData.avatarUrl);
      } else if (statsData.username) {
        try {
          const response = await fetch(`/api/users/avatar/${encodeURIComponent(statsData.username)}`);
          if (response.ok) {
            const data = await response.json();
            setAvatarUrl(data.avatarUrl || undefined);
          }
        } catch {
          setAvatarUrl(undefined);
        }
      }
    };
    loadAvatar();
  }, [statsData.username, statsData.avatarUrl]);

  const labelText = isLatest ? 'LATEST WINNER' : isWinner ? 'WIN OF THE DAY' : 'LUCK OF THE DAY';

  return (
    <div 
      className="glass-panel p-2.5" 
      style={{
        borderRadius: '12px',
        background: 'rgba(20, 20, 20, 0.7)',
        border: '1px solid rgba(60, 60, 60, 0.4)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 2px 8px rgba(0, 0, 0, 0.5)'
      }}
      data-testid={`card-daily-${type}`}
    >
      {/* Header Row: ROUND label left, round number right */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">ROUND</span>
        <span className="text-[11px] text-muted-foreground font-mono">#{statsData.round}</span>
      </div>

      {/* Main Row: Avatar + Username/Badge + Type Label */}
      <div className="flex items-center gap-2 mb-2">
        {/* Avatar */}
        <div 
          style={{
            filter: isLatest 
              ? 'drop-shadow(0 0 8px rgba(147, 51, 234, 0.5))' 
              : 'drop-shadow(0 0 8px rgba(234, 179, 8, 0.5))'
          }}
        >
          <Avatar 
            className="w-14 h-14"
            style={{
              border: isLatest 
                ? '2px solid rgba(147, 51, 234, 0.5)' 
                : '2px solid rgba(234, 179, 8, 0.5)',
              boxShadow: isLatest 
                ? 'inset 0 0 6px rgba(147, 51, 234, 0.3)' 
                : 'inset 0 0 6px rgba(234, 179, 8, 0.3)'
            }}
          >
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="text-xs">{statsData.username.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>

        {/* Username + Level Badge */}
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-foreground text-xs truncate" data-testid={`text-${type}-username`}>
              {statsData.username}
            </span>
            <Badge 
              variant="secondary" 
              className="text-[10px] font-bold px-1.5 py-0"
              style={{
                background: isLatest ? 'rgba(147, 51, 234, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                color: isLatest ? '#c084fc' : '#fcd34d',
                border: isLatest ? '1px solid rgba(147, 51, 234, 0.3)' : '1px solid rgba(234, 179, 8, 0.3)'
              }}
            >
              {statsData.userLevel}
            </Badge>
          </div>
          
          {/* Type Label Badge */}
          <div 
            className="px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider w-fit"
            style={{
              background: isLatest
                ? 'linear-gradient(135deg, rgba(147, 51, 234, 0.8), rgba(168, 85, 247, 0.8))'
                : isWinner 
                ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.9), rgba(250, 204, 21, 0.9))' 
                : 'linear-gradient(135deg, rgba(180, 83, 9, 0.8), rgba(234, 179, 8, 0.8))',
              color: '#ffffff',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
              border: isLatest
                ? '1px solid rgba(147, 51, 234, 0.7)'
                : isWinner
                ? '1px solid rgba(250, 204, 21, 0.8)'
                : '1px solid rgba(234, 179, 8, 0.6)'
            }}
            data-testid={`badge-${type}-label`}
          >
            {labelText}
          </div>
        </div>
      </div>

      {/* Stats Section - Compact */}
      <div className="space-y-1">
        {/* Won Amount */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">WON</span>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground/60 font-mono text-xs">=</span>
            <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 32 32" fill="none"
              style={{ filter: 'drop-shadow(0 0 3px rgba(243, 186, 47, 0.6))' }}>
              <circle cx="16" cy="16" r="16" fill="#F3BA2F"/>
              <path d="M12.116 14.404L16 10.52l3.886 3.886 2.26-2.26L16 6l-6.144 6.144 2.26 2.26zM6 16l2.26-2.26L10.52 16l-2.26 2.26L6 16zm6.116 1.596L16 21.48l3.886-3.886 2.26 2.259L16 26l-6.144-6.144-.003-.003 2.263-2.257zM21.48 16l2.26-2.26L26 16l-2.26 2.26L21.48 16zm-3.188-.002h.002V16L16 18.294l-2.291-2.29-.004-.004.004-.003.401-.402.195-.195L16 13.706l2.293 2.293z" fill="#fff"/>
            </svg>
            <span className="font-mono font-bold no-text-shadow text-sm" style={{color: '#FFFFFF'}} data-testid={`text-${type}-won`}>
              {statsData.wonAmount.toFixed(3)}
            </span>
          </div>
        </div>

        {/* Chance */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">CHANCE</span>
          <span className="font-bold text-sm no-text-shadow" style={{ color: '#fcd34d' }} data-testid={`text-${type}-chance`}>
            {statsData.chance.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}
