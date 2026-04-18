import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, Trophy, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLeagueBadge } from "@/lib/leagueUtils";

export interface PredictionMarket {
  id: string;
  sport: string;
  league: string;
  leagueId?: string;
  teamA: string;
  teamB: string;
  description: string;
  gameTime: Date;
  status: 'active' | 'locked' | 'settled' | 'voided';
  winningOutcome?: string | null;
  poolATotal: string;
  poolBTotal: string;
  bonusPool: string;
  teamALogo?: string;
  teamBLogo?: string;
  teamAColor?: string;
  teamBColor?: string;
}

interface PredictionMarketCardProps {
  market: PredictionMarket;
  onPlaceBet: (marketId: string, outcome: 'A' | 'B', odds: number) => void;
  disabled?: boolean;
}

export function PredictionMarketCard({ market, onPlaceBet, disabled = false }: PredictionMarketCardProps) {
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const leagueBadge = getLeagueBadge(market.league);

  useEffect(() => {
    const updateCountdown = () => {
      const gameTime = new Date(market.gameTime);
      const now = new Date();
      const timeDiff = gameTime.getTime() - now.getTime();
      
      if (timeDiff > 0) {
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff / (1000 * 60)) % 60);
        const seconds = Math.floor((timeDiff / 1000) % 60);
        setTimeRemaining({ hours, minutes, seconds });
      } else {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [market.gameTime]);

  const poolATotal = parseFloat(market.poolATotal || "0");
  const poolBTotal = parseFloat(market.poolBTotal || "0");
  const bonusPool = parseFloat(market.bonusPool || "0");
  const totalPool = poolATotal + poolBTotal + bonusPool;

  const oddsA = poolATotal > 0 ? (totalPool / poolATotal) : 2.00;
  const oddsB = poolBTotal > 0 ? (totalPool / poolBTotal) : 2.00;

  const formatOdds = (odds: number) => odds.toFixed(2);
  const formatPool = (amount: number) => amount.toFixed(4);

  const gameTime = new Date(market.gameTime);
  const now = new Date();
  const isUpcoming = gameTime > now;
  
  const isSettled = market.status === 'settled';
  const isVoided = market.status === 'voided';
  const isEnded = isSettled || isVoided;
  const isLive = !isUpcoming && !isEnded;
  const isLocked = market.status === 'locked';
  const winningTeam = isSettled
    ? market.winningOutcome === 'A'
      ? market.teamA
      : market.winningOutcome === 'B'
      ? market.teamB
      : null
    : null;
  
  const isDisabled = disabled || market.status !== 'active';

  return (
    <Card 
      className="bg-card border-card-border hover-elevate transition-all duration-200"
      data-testid={`card-market-${market.id}`}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <div className="flex items-center gap-2">
          {leagueBadge ? (
            <img 
              src={leagueBadge} 
              alt={market.league}
              className="h-10 w-10 object-contain"
              data-testid={`img-league-logo-${market.id}`}
            />
          ) : (
            <Badge variant="outline" className="text-xs font-mono">
              {market.league}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-3 flex-1 justify-center">
          {market.teamALogo && (
            <img 
              src={market.teamALogo} 
              alt={market.teamA}
              className="h-10 w-10 object-contain"
              data-testid={`img-team-a-logo-${market.id}`}
            />
          )}
          {market.teamBLogo && (
            <img 
              src={market.teamBLogo} 
              alt={market.teamB}
              className="h-10 w-10 object-contain"
              data-testid={`img-team-b-logo-${market.id}`}
            />
          )}
        </div>
        
        <div className="flex flex-col items-end gap-1">
          {isSettled && (
            <Badge variant="default" className="text-xs font-bold" data-testid={`badge-settled-${market.id}`}>
              SETTLED
            </Badge>
          )}
          {isVoided && (
            <Badge variant="outline" className="text-xs font-bold" data-testid={`badge-refunded-${market.id}`}>
              REFUNDED
            </Badge>
          )}
          {isLive && (
            <div className="flex items-center gap-1">
              <Badge variant="destructive" className="text-xs font-bold animate-pulse" data-testid={`badge-live-${market.id}`}>
                LIVE
              </Badge>
              {isLocked && (
                <Badge variant="outline" className="text-xs" data-testid={`badge-locked-${market.id}`}>
                  🔒
                </Badge>
              )}
            </div>
          )}
          {isUpcoming && (
            <div className="flex items-center gap-1" data-testid={`time-remaining-${market.id}`}>
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-semibold text-muted-foreground">
                {timeRemaining.hours}h {timeRemaining.minutes}m {timeRemaining.seconds}s
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-4">
            <h3 className="text-base font-bold text-foreground leading-none">{market.teamA}</h3>
            <span className="text-2xl font-bold text-primary leading-none">VS</span>
            <h3 className="text-base font-bold text-foreground leading-none">{market.teamB}</h3>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">{market.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => onPlaceBet(market.id, 'A', oddsA)}
            disabled={isDisabled}
            variant="outline"
            className={cn(
              "h-[90px] flex-col justify-center py-3 border-2 rounded-lg bg-card hover:bg-primary/10 border-primary/30 hover:border-primary/50",
              isDisabled && "opacity-50 cursor-not-allowed"
            )}
            data-testid={`button-bet-${market.id}-a`}
          >
            <div className="flex flex-col items-center justify-center gap-1">
              <span className="text-sm font-semibold truncate max-w-full text-foreground">{market.teamA}</span>
              <span className="text-2xl font-bold text-primary">{formatOdds(oddsA)}</span>
              <span className="text-xs text-muted-foreground">
                Pool: {formatPool(poolATotal)} BNB
              </span>
            </div>
          </Button>

          <Button
            onClick={() => onPlaceBet(market.id, 'B', oddsB)}
            disabled={isDisabled}
            variant="outline"
            className={cn(
              "h-[90px] flex-col justify-center py-3 border-2 rounded-lg bg-card hover:bg-primary/10 border-primary/30 hover:border-primary/50",
              isDisabled && "opacity-50 cursor-not-allowed"
            )}
            data-testid={`button-bet-${market.id}-b`}
          >
            <div className="flex flex-col items-center justify-center gap-1">
              <span className="text-sm font-semibold truncate max-w-full text-foreground">{market.teamB}</span>
              <span className="text-2xl font-bold text-primary">{formatOdds(oddsB)}</span>
              <span className="text-xs text-muted-foreground">
                Pool: {formatPool(poolBTotal)} BNB
              </span>
            </div>
          </Button>
        </div>

        {bonusPool > 0 && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-primary">
            <TrendingUp className="h-3 w-3" />
            <span className="font-medium">
              Includes {formatPool(bonusPool)} BNB Bonus Pool!
            </span>
          </div>
        )}

        {isSettled && winningTeam && (
          <Badge variant="default" className="w-full justify-center" data-testid={`badge-winner-${market.id}`}>
            <Trophy className="h-3 w-3 mr-1" />
            Winner: {winningTeam}
          </Badge>
        )}
        {isSettled && !winningTeam && (
          <Badge variant="outline" className="w-full justify-center">SETTLED</Badge>
        )}
        {isVoided && (
          <Badge variant="outline" className="w-full justify-center" data-testid={`badge-voided-${market.id}`}>
            <RotateCcw className="h-3 w-3 mr-1" />
            All bets refunded
          </Badge>
        )}
        {isLocked && (
          <Badge variant="secondary" className="w-full justify-center">LOCKED — Awaiting result</Badge>
        )}
      </CardContent>
    </Card>
  );
}
