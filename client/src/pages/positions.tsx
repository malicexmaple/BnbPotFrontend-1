import { useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet2, TrendingUp, TrendingDown, Trophy, RotateCcw, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MarketBetWithMarket } from "@shared/schema";

const fmtBnb = (n: number) => n.toFixed(4);

interface PositionRow {
  bet: MarketBetWithMarket;
  side: 'A' | 'B';
  teamName: string;
  oppName: string;
  entryPriceCents: number;
  currentPriceCents: number;
  status: string;
  amount: number;
  currentValue: number;
  pnl: number;
  pnlPct: number;
}

export default function PositionsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: bets = [], isLoading } = useQuery<MarketBetWithMarket[]>({
    queryKey: ['/api/market-bets/my-bets'],
    enabled: isAuthenticated,
    refetchInterval: 8000,
  });

  // Need each market's current pool to compute live value. The /my-bets payload
  // already includes the embedded market with poolATotal/poolBTotal in most APIs;
  // if not, fall back to entry price.
  const positions = useMemo<PositionRow[]>(() => {
    return bets.map((bet) => {
      const m: any = bet.market;
      const poolA = parseFloat(m?.poolATotal ?? "0") || 0;
      const poolB = parseFloat(m?.poolBTotal ?? "0") || 0;
      const bonus = parseFloat(m?.bonusPool ?? "0") || 0;
      const sided = poolA + poolB;
      const probA = sided > 0 ? poolA / sided : 0.5;
      const side = bet.outcome as 'A' | 'B';
      // Unrounded probability for value math (avoids 1¢ rounding jitter in P&L)
      const probWin = side === 'A' ? probA : 1 - probA;
      // Rounded cents for display only
      const currentPriceCents = Math.max(1, Math.min(99, Math.round(probWin * 100)));

      const oddsAtBet = parseFloat(bet.oddsAtBet) || 2;
      const entryPriceCents = Math.max(1, Math.min(99, Math.round(100 / oddsAtBet)));
      const amount = parseFloat(bet.amount) || 0;

      // Parimutuel mark-to-market:
      //   payoutIfWin  = (amount / poolOnUserSide) * (poolA + poolB + bonus)
      //   liveValue    = probWin * payoutIfWin   (expected value at current prices)
      // Settled overrides: won → actualPayout, lost → 0, refunded → amount
      let currentValue: number;
      if (bet.status === 'won') {
        currentValue = parseFloat(bet.actualPayout || "0");
      } else if (bet.status === 'lost') {
        currentValue = 0;
      } else if (bet.status === 'refunded') {
        currentValue = amount;
      } else {
        const userSidePool = side === 'A' ? poolA : poolB;
        const totalPool = poolA + poolB + bonus;
        const payoutIfWin = userSidePool > 0 ? (amount / userSidePool) * totalPool : amount;
        currentValue = payoutIfWin * probWin;
      }

      const pnl = currentValue - amount;
      const pnlPct = amount > 0 ? (pnl / amount) * 100 : 0;

      return {
        bet,
        side,
        teamName: side === 'A' ? m.teamA : m.teamB,
        oppName: side === 'A' ? m.teamB : m.teamA,
        entryPriceCents,
        currentPriceCents,
        status: bet.status,
        amount,
        currentValue,
        pnl,
        pnlPct,
      };
    });
  }, [bets]);

  const totals = useMemo(() => {
    let invested = 0, value = 0, openInvested = 0, openValue = 0;
    let wins = 0, losses = 0, open = 0;
    for (const p of positions) {
      invested += p.amount;
      value += p.currentValue;
      if (p.status === 'won') wins++;
      else if (p.status === 'lost') losses++;
      else if (p.status === 'active') {
        open++;
        openInvested += p.amount;
        openValue += p.currentValue;
      }
    }
    return { invested, value, openInvested, openValue, wins, losses, open, totalPnl: value - invested };
  }, [positions]);

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="container mx-auto p-6 max-w-3xl">
        <div className="glass-panel rounded-md p-8 text-center">
          <Wallet2 className="h-10 w-10 mx-auto mb-3 text-white/40" />
          <h1 className="text-xl font-bold text-white mb-2">Connect your wallet</h1>
          <p className="text-sm text-white/60 mb-4">Sign in to see your prediction market positions and P&amp;L.</p>
        </div>
      </div>
    );
  }

  if (isLoading || authLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid md:grid-cols-4 gap-3">
          {[0,1,2,3].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">My positions</h1>
        <p className="text-sm text-white/60">Live mark-to-market value of your prediction market bets.</p>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total invested" value={`${fmtBnb(totals.invested)} BNB`} testId="stat-invested" />
        <Stat label="Current value" value={`${fmtBnb(totals.value)} BNB`} testId="stat-value" />
        <Stat
          label="Total P&L"
          value={`${totals.totalPnl >= 0 ? '+' : ''}${fmtBnb(totals.totalPnl)} BNB`}
          highlight={totals.totalPnl >= 0 ? 'pos' : 'neg'}
          testId="stat-pnl"
        />
        <Stat label="Open / Won / Lost" value={`${totals.open} · ${totals.wins} · ${totals.losses}`} testId="stat-record" />
      </div>

      {positions.length === 0 ? (
        <div className="glass-panel rounded-md p-8 text-center">
          <Activity className="h-10 w-10 mx-auto mb-3 text-white/40" />
          <h2 className="text-lg font-semibold text-white mb-1">No positions yet</h2>
          <p className="text-sm text-white/60 mb-4">Go take a position on a live market.</p>
          <Link href="/prediction-markets">
            <Button data-testid="link-markets">Browse markets</Button>
          </Link>
        </div>
      ) : (
        <div className="glass-panel rounded-md p-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase text-white/40">
              <tr>
                <th className="text-left p-3 font-medium">Market</th>
                <th className="text-left p-3 font-medium">Side</th>
                <th className="text-right p-3 font-medium">Amount</th>
                <th className="text-right p-3 font-medium">Entry</th>
                <th className="text-right p-3 font-medium">Now</th>
                <th className="text-right p-3 font-medium">Value</th>
                <th className="text-right p-3 font-medium">P&L</th>
                <th className="text-right p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr key={p.bet.id} className="border-t border-white/5 hover-elevate" data-testid={`row-position-${p.bet.id}`}>
                  <td className="p-3">
                    <Link href={`/market/${p.bet.market.id}`}>
                      <a className="hover:text-white text-white/90 font-medium">
                        {p.bet.market.teamA} vs {p.bet.market.teamB}
                      </a>
                    </Link>
                    <div className="text-[11px] text-white/40">{p.bet.market.league}</div>
                  </td>
                  <td className="p-3">
                    <span className={cn(
                      "text-xs font-semibold",
                      p.side === 'A' ? 'text-emerald-300' : 'text-rose-300'
                    )}>
                      {p.teamName}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono">{fmtBnb(p.amount)}</td>
                  <td className="p-3 text-right font-mono text-white/70">{p.entryPriceCents}¢</td>
                  <td className="p-3 text-right font-mono">{p.currentPriceCents}¢</td>
                  <td className="p-3 text-right font-mono">{fmtBnb(p.currentValue)}</td>
                  <td className={cn(
                    "p-3 text-right font-mono font-semibold",
                    p.pnl > 0 ? 'text-emerald-400' : p.pnl < 0 ? 'text-rose-400' : 'text-white/60'
                  )}>
                    {p.pnl > 0 ? '+' : ''}{fmtBnb(p.pnl)}
                    <div className="text-[10px] font-normal opacity-70">
                      {p.pnl > 0 ? '+' : ''}{p.pnlPct.toFixed(1)}%
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, highlight, testId }: { label: string; value: string; highlight?: 'pos' | 'neg'; testId?: string }) {
  return (
    <div className="glass-panel rounded-md p-3" data-testid={testId}>
      <div className="text-[11px] uppercase tracking-wide text-white/50 mb-1">{label}</div>
      <div className={cn(
        "text-lg font-bold font-mono",
        highlight === 'pos' ? 'text-emerald-400' : highlight === 'neg' ? 'text-rose-400' : 'text-white'
      )}>
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'won') return <Badge variant="default" className="text-[10px]"><Trophy className="h-3 w-3 mr-1" />WON</Badge>;
  if (status === 'lost') return <Badge variant="destructive" className="text-[10px]"><TrendingDown className="h-3 w-3 mr-1" />LOST</Badge>;
  if (status === 'refunded') return <Badge variant="outline" className="text-[10px]"><RotateCcw className="h-3 w-3 mr-1" />REFUND</Badge>;
  return <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-300"><TrendingUp className="h-3 w-3 mr-1" />OPEN</Badge>;
}
