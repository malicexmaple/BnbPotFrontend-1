import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, Trophy, RotateCcw, BarChart3 } from "lucide-react";
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
  status: 'active' | 'locked' | 'settled' | 'voided' | 'refunded';
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
  const [, navigate] = useLocation();
  const leagueBadge = getLeagueBadge(market.league);

  useEffect(() => {
    const updateCountdown = () => {
      const gameTime = new Date(market.gameTime);
      const now = new Date();
      const timeDiff = gameTime.getTime() - now.getTime();
      if (timeDiff > 0) {
        setTimeRemaining({
          hours: Math.floor(timeDiff / (1000 * 60 * 60)),
          minutes: Math.floor((timeDiff / (1000 * 60)) % 60),
          seconds: Math.floor((timeDiff / 1000) % 60),
        });
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
  const sidedTotal = poolATotal + poolBTotal;

  // Implied probability (Polymarket-style: price = probability in cents 0-100¢)
  // If a side has 0 stake, default to 50/50 to avoid divide-by-zero before any action.
  const probA = sidedTotal > 0 ? poolATotal / sidedTotal : 0.5;
  const probB = sidedTotal > 0 ? poolBTotal / sidedTotal : 0.5;
  const priceACents = Math.max(1, Math.min(99, Math.round(probA * 100)));
  const priceBCents = Math.max(1, Math.min(99, Math.round(probB * 100)));

  // Decimal odds for the bet handler (existing API contract)
  const oddsA = poolATotal > 0 ? totalPool / poolATotal : 2.0;
  const oddsB = poolBTotal > 0 ? totalPool / poolBTotal : 2.0;

  const formatPool = (amount: number) =>
    amount >= 1000 ? `${(amount / 1000).toFixed(1)}k` : amount.toFixed(3);

  const gameTime = new Date(market.gameTime);
  const isUpcoming = gameTime > new Date();
  const isSettled = market.status === 'settled';
  const isVoided = market.status === 'voided' || market.status === 'refunded';
  const isEnded = isSettled || isVoided;
  const isLive = !isUpcoming && !isEnded;
  const isLocked = market.status === 'locked';
  const winningTeam = isSettled
    ? market.winningOutcome === 'A' ? market.teamA
    : market.winningOutcome === 'B' ? market.teamB
    : null
    : null;
  const isDisabled = disabled || market.status !== 'active';

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => navigate(`/market/${market.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/market/${market.id}`);
        }
      }}
      className="block glass-panel rounded-md p-4 hover-elevate transition-all duration-200 cursor-pointer no-underline text-current"
      data-testid={`card-market-${market.id}`}
    >
      {/* Header: league + status */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {leagueBadge ? (
            <img
              src={leagueBadge}
              alt={market.league}
              className="h-7 w-7 object-contain shrink-0"
              data-testid={`img-league-logo-${market.id}`}
            />
          ) : (
            <Badge variant="outline" className="text-[10px] font-mono">{market.league}</Badge>
          )}
          <span className="text-xs text-white/60 font-medium truncate">{market.sport}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isSettled && (
            <Badge variant="default" className="text-[10px] font-bold" data-testid={`badge-settled-${market.id}`}>
              SETTLED
            </Badge>
          )}
          {isVoided && (
            <Badge variant="outline" className="text-[10px] font-bold" data-testid={`badge-refunded-${market.id}`}>
              REFUNDED
            </Badge>
          )}
          {isLive && (
            <Badge variant="destructive" className="text-[10px] font-bold animate-pulse" data-testid={`badge-live-${market.id}`}>
              LIVE
            </Badge>
          )}
          {isLocked && (
            <Badge variant="outline" className="text-[10px]" data-testid={`badge-locked-${market.id}`}>
              LOCKED
            </Badge>
          )}
          {isUpcoming && (
            <div className="flex items-center gap-1 text-white/70" data-testid={`time-remaining-${market.id}`}>
              <Clock className="h-3 w-3" />
              <span className="font-mono text-[11px] font-semibold">
                {timeRemaining.hours}h {timeRemaining.minutes}m
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Question / matchup */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex -space-x-2">
          {market.teamALogo && (
            <img
              src={market.teamALogo}
              alt={market.teamA}
              className="h-9 w-9 object-contain rounded-full bg-black/40 ring-1 ring-white/10"
              data-testid={`img-team-a-logo-${market.id}`}
            />
          )}
          {market.teamBLogo && (
            <img
              src={market.teamBLogo}
              alt={market.teamB}
              className="h-9 w-9 object-contain rounded-full bg-black/40 ring-1 ring-white/10"
              data-testid={`img-team-b-logo-${market.id}`}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">
            {market.teamA} <span className="text-white/40">vs</span> {market.teamB}
          </h3>
          {market.description && (
            <p className="text-[11px] text-white/50 line-clamp-1 mt-0.5">{market.description}</p>
          )}
        </div>
      </div>

      {/* Implied probability bar (Polymarket-style) */}
      <div className="mb-3" data-testid={`prob-bar-${market.id}`}>
        <div className="flex items-center justify-between text-[10px] font-semibold mb-1">
          <span className="text-emerald-400">{priceACents}¢ · {market.teamA}</span>
          <span className="text-rose-400">{market.teamB} · {priceBCents}¢</span>
        </div>
        <div className="h-1.5 w-full rounded-full overflow-hidden bg-white/5 flex">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
            style={{ width: `${priceACents}%` }}
          />
          <div
            className="h-full bg-gradient-to-r from-rose-400 to-rose-500 transition-all"
            style={{ width: `${100 - priceACents}%` }}
          />
        </div>
      </div>

      {/* Buy buttons: price in cents = market's implied probability */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <Button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPlaceBet(market.id, 'A', oddsA); }}
          disabled={isDisabled}
          variant="outline"
          className={cn(
            "h-12 flex-col gap-0 py-1.5 rounded-md",
            "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300",
            isDisabled && "opacity-50 cursor-not-allowed"
          )}
          data-testid={`button-bet-${market.id}-a`}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">Buy {market.teamA}</span>
          <span className="text-base font-bold leading-none">{priceACents}¢</span>
        </Button>

        <Button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPlaceBet(market.id, 'B', oddsB); }}
          disabled={isDisabled}
          variant="outline"
          className={cn(
            "h-12 flex-col gap-0 py-1.5 rounded-md",
            "bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-300",
            isDisabled && "opacity-50 cursor-not-allowed"
          )}
          data-testid={`button-bet-${market.id}-b`}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">Buy {market.teamB}</span>
          <span className="text-base font-bold leading-none">{priceBCents}¢</span>
        </Button>
      </div>

      {/* Footer: volume + bonus */}
      <div className="flex items-center justify-between text-[11px] text-white/60 pt-2 border-t border-white/5">
        <div className="flex items-center gap-1.5" data-testid={`volume-${market.id}`}>
          <BarChart3 className="h-3 w-3" />
          <span className="font-mono font-semibold">{formatPool(totalPool)} BNB</span>
          <span className="text-white/40">vol</span>
        </div>
        {bonusPool > 0 && (
          <div className="flex items-center gap-1 text-amber-300">
            <TrendingUp className="h-3 w-3" />
            <span className="font-medium">+{formatPool(bonusPool)} BNB bonus</span>
          </div>
        )}
      </div>

      {/* Settled / voided footer state */}
      {isSettled && winningTeam && (
        <Badge variant="default" className="w-full justify-center mt-3" data-testid={`badge-winner-${market.id}`}>
          <Trophy className="h-3 w-3 mr-1" />
          Winner: {winningTeam}
        </Badge>
      )}
      {isVoided && (
        <Badge variant="outline" className="w-full justify-center mt-3" data-testid={`badge-voided-${market.id}`}>
          <RotateCcw className="h-3 w-3 mr-1" />
          All bets refunded
        </Badge>
      )}
    </div>
  );
}
