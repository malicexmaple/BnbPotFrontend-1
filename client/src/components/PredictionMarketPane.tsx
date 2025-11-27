import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLeagueBadge } from "@/lib/leagueUtils";
import type { PredictionMarket } from "@/components/PredictionMarketCard";

interface PredictionMarketPaneProps {
  market: PredictionMarket;
  onPlaceBet: (marketId: string, outcome: 'A' | 'B', odds: number) => void;
  disabled?: boolean;
}

export function PredictionMarketPane({ market, onPlaceBet, disabled = false }: PredictionMarketPaneProps) {
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
  const formatPool = (amount: number) => amount.toFixed(3);

  const gameTime = new Date(market.gameTime);
  const now = new Date();
  const isUpcoming = gameTime > now;
  
  const isEnded = market.status === 'settled' || market.status === 'voided';
  const isLive = !isUpcoming && !isEnded;
  const isLocked = market.status === 'locked';
  
  const isDisabled = disabled || market.status !== 'active';

  const totalNameLength = market.teamA.length + market.teamB.length;
  const getTeamNameSize = () => {
    if (totalNameLength > 35) return "text-xs";
    if (totalNameLength > 25) return "text-sm";
    return "text-base";
  };

  return (
    <div 
      className="bg-card border border-border hover-elevate transition-all duration-200 p-4 rounded-md"
      data-testid={`pane-market-${market.id}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center justify-center min-w-[50px]">
          {leagueBadge ? (
            <img 
              src={leagueBadge} 
              alt={market.league}
              className="h-8 w-8 object-contain"
              data-testid={`img-league-logo-pane-${market.id}`}
            />
          ) : (
            <Badge variant="outline" className="text-xs font-mono">
              {market.league.slice(0, 3)}
            </Badge>
          )}
        </div>

        <div className="flex flex-col min-w-[100px] gap-1">
          {isEnded && (
            <Badge variant="secondary" className="text-xs font-bold w-fit" data-testid={`badge-ended-pane-${market.id}`}>
              ENDED
            </Badge>
          )}
          {isLive && (
            <div className="flex items-center gap-1">
              <Badge variant="destructive" className="text-xs font-bold animate-pulse" data-testid={`badge-live-pane-${market.id}`}>
                LIVE
              </Badge>
              {isLocked && (
                <Badge variant="outline" className="text-xs px-1" data-testid={`badge-locked-pane-${market.id}`}>
                  🔒
                </Badge>
              )}
            </div>
          )}
          {isUpcoming && (
            <div className="flex items-center gap-1" data-testid={`time-remaining-pane-${market.id}`}>
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-semibold text-muted-foreground">
                {timeRemaining.hours}h {timeRemaining.minutes}m {timeRemaining.seconds}s
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="relative flex items-center justify-center min-h-[2rem] gap-2">
            <div className="flex items-center justify-end gap-2 flex-1">
              {market.teamALogo && (
                <img 
                  src={market.teamALogo} 
                  alt={market.teamA}
                  className="w-10 h-10 object-contain flex-shrink-0"
                  data-testid={`img-team-a-logo-pane-${market.id}`}
                />
              )}
              <span className={cn(getTeamNameSize(), "font-bold text-foreground leading-none text-right")}>{market.teamA}</span>
            </div>
            <span className="text-xl font-bold text-primary leading-none">VS</span>
            <div className="flex items-center justify-start gap-2 flex-1">
              <span className={cn(getTeamNameSize(), "font-bold text-foreground leading-none text-left")}>{market.teamB}</span>
              {market.teamBLogo && (
                <img 
                  src={market.teamBLogo} 
                  alt={market.teamB}
                  className="w-10 h-10 object-contain flex-shrink-0"
                  data-testid={`img-team-b-logo-pane-${market.id}`}
                />
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1 text-center">{market.description}</p>
        </div>

        <div className="text-right min-w-[80px]">
          <div className="text-xs text-muted-foreground">Liquidity</div>
          <div className="text-sm font-semibold text-foreground">{formatPool(totalPool)} BNB</div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => onPlaceBet(market.id, 'A', oddsA)}
            disabled={isDisabled}
            variant="outline"
            className={cn(
              "h-[55px] w-[70px] flex flex-col items-center justify-center gap-0.5 border-2 p-2 bg-card hover:bg-primary/10 border-primary/30 hover:border-primary/50",
              isDisabled && "opacity-50 cursor-not-allowed"
            )}
            data-testid={`button-bet-pane-${market.id}-a`}
          >
            <span className="text-lg font-bold text-primary">{formatOdds(oddsA)}</span>
            <span className="text-[10px] text-muted-foreground">
              {formatPool(poolATotal)} BNB
            </span>
          </Button>

          <Button
            onClick={() => onPlaceBet(market.id, 'B', oddsB)}
            disabled={isDisabled}
            variant="outline"
            className={cn(
              "h-[55px] w-[70px] flex flex-col items-center justify-center gap-0.5 border-2 p-2 bg-card hover:bg-primary/10 border-primary/30 hover:border-primary/50",
              isDisabled && "opacity-50 cursor-not-allowed"
            )}
            data-testid={`button-bet-pane-${market.id}-b`}
          >
            <span className="text-lg font-bold text-primary">{formatOdds(oddsB)}</span>
            <span className="text-[10px] text-muted-foreground">
              {formatPool(poolBTotal)} BNB
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
