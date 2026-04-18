import { useState, useMemo } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, BarChart3, Clock, TrendingUp, Trophy, Users, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLeagueBadge } from "@/lib/leagueUtils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { PredictionMarket } from "@/components/PredictionMarketCard";

interface MarketBetActivity {
  id: string;
  userAddress: string;
  outcome: 'A' | 'B';
  amount: string;
  oddsAtBet: string;
  createdAt: string;
}
interface Holders {
  A: Array<{ userAddress: string; amount: string; outcome: string }>;
  B: Array<{ userAddress: string; amount: string; outcome: string }>;
}
interface PricePoint { t: number; priceA: number; priceB: number; volume: number }

const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const fmtBnb = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(2)}k` : n.toFixed(4));

export default function MarketDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const [outcome, setOutcome] = useState<'A' | 'B'>('A');
  const [amount, setAmount] = useState<string>("0.05");

  const { data: market, isLoading } = useQuery<PredictionMarket>({
    queryKey: ['/api/markets', id],
    enabled: !!id,
    refetchInterval: 5000,
  });

  const { data: history = [] } = useQuery<PricePoint[]>({
    queryKey: ['/api/markets', id, 'history'],
    enabled: !!id,
    refetchInterval: 5000,
  });

  const { data: activity = [] } = useQuery<MarketBetActivity[]>({
    queryKey: ['/api/markets', id, 'bets'],
    enabled: !!id,
    refetchInterval: 5000,
  });

  const { data: holders } = useQuery<Holders>({
    queryKey: ['/api/markets', id, 'holders'],
    enabled: !!id,
    refetchInterval: 10000,
  });

  const placeBetMutation = useMutation({
    mutationFn: async (vars: { outcome: 'A' | 'B'; amount: string }) => {
      return apiRequest('POST', `/api/markets/${id}/bets`, vars);
    },
    onSuccess: () => {
      toast({ title: "Bet placed", description: "Your position is live." });
      queryClient.invalidateQueries({ queryKey: ['/api/markets', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/markets', id, 'history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/markets', id, 'bets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/markets', id, 'holders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet'] });
    },
    onError: (err: Error) => {
      toast({ title: "Bet failed", description: err.message, variant: "destructive" });
    },
  });

  const derived = useMemo(() => {
    if (!market) return null;
    const poolA = parseFloat(market.poolATotal || "0");
    const poolB = parseFloat(market.poolBTotal || "0");
    const bonus = parseFloat(market.bonusPool || "0");
    const sided = poolA + poolB;
    const probA = sided > 0 ? poolA / sided : 0.5;
    const priceA = Math.max(1, Math.min(99, Math.round(probA * 100)));
    const priceB = 100 - priceA;
    return {
      poolA, poolB, bonus, total: poolA + poolB + bonus,
      priceA, priceB,
      oddsA: poolA > 0 ? (poolA + poolB + bonus) / poolA : 2.0,
      oddsB: poolB > 0 ? (poolA + poolB + bonus) / poolB : 2.0,
    };
  }, [market]);

  const amtNum = parseFloat(amount) || 0;
  const projectedPayout = useMemo(() => {
    if (!derived || amtNum <= 0) return 0;
    // Parimutuel payout: bettor's share of the total pool, weighted by their stake
    // on the chosen side. Uses the precise odds (not rounded cents) so the UI
    // matches what the contract/backend will actually pay out.
    const odds = outcome === 'A' ? derived.oddsA : derived.oddsB;
    return amtNum * odds;
  }, [derived, amtNum, outcome]);

  if (isLoading || !market || !derived) {
    return (
      <div className="container mx-auto p-6 max-w-7xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-72 w-full" />
        <div className="grid lg:grid-cols-3 gap-4">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const leagueBadge = getLeagueBadge(market.league);
  const isDisabled = market.status !== 'active' || !isAuthenticated;
  const gameTime = new Date(market.gameTime);
  const isUpcoming = gameTime > new Date();
  const isSettled = market.status === 'settled';
  const winner =
    isSettled && market.winningOutcome === 'A' ? market.teamA :
    isSettled && market.winningOutcome === 'B' ? market.teamB :
    null;

  const chartData = history.map(p => ({
    time: new Date(p.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    [market.teamA]: p.priceA,
    [market.teamB]: p.priceB,
  }));

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <Link href="/prediction-markets">
        <a className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4" data-testid="link-back">
          <ArrowLeft className="h-4 w-4" /> All markets
        </a>
      </Link>

      {/* Header */}
      <div className="glass-panel rounded-md p-5 mb-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {leagueBadge ? (
              <img src={leagueBadge} alt={market.league} className="h-12 w-12 object-contain shrink-0" />
            ) : (
              <Badge variant="outline">{market.league}</Badge>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-white/60 mb-1">
                <span className="uppercase tracking-wide">{market.sport}</span>
                <span>·</span>
                <span>{market.league}</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-white leading-tight" data-testid="text-market-question">
                Will {market.teamA} beat {market.teamB}?
              </h1>
              {market.description && (
                <p className="text-sm text-white/60 mt-1">{market.description}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {isSettled && winner && (
              <Badge variant="default" className="text-xs font-bold" data-testid="badge-winner">
                <Trophy className="h-3 w-3 mr-1" /> Winner: {winner}
              </Badge>
            )}
            {market.status === 'locked' && <Badge variant="outline">LOCKED</Badge>}
            {market.status === 'voided' && <Badge variant="outline">REFUNDED</Badge>}
            {!isUpcoming && !isSettled && market.status === 'active' && (
              <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
            )}
            {isUpcoming && (
              <div className="flex items-center gap-1.5 text-white/70 text-sm">
                <Clock className="h-4 w-4" />
                <span className="font-mono">{gameTime.toLocaleString()}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-xs text-white/60">
              <div className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> {fmtBnb(derived.total)} BNB vol</div>
              {derived.bonus > 0 && (
                <div className="flex items-center gap-1 text-amber-300">
                  <TrendingUp className="h-3 w-3" /> +{fmtBnb(derived.bonus)} bonus
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Left: chart + activity */}
        <div className="lg:col-span-2 space-y-4">
          {/* Probability chart */}
          <div className="glass-panel rounded-md p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white">Implied probability</h2>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-white/80">{market.teamA}</span>
                  <span className="font-mono font-bold text-emerald-300">{derived.priceA}¢</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-400" />
                  <span className="text-white/80">{market.teamB}</span>
                  <span className="font-mono font-bold text-rose-300">{derived.priceB}¢</span>
                </span>
              </div>
            </div>
            <div className="h-64 w-full" data-testid="chart-history">
              {chartData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fb7185" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#fb7185" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} axisLine={false} tickLine={false} unit="¢" />
                    <Tooltip
                      contentStyle={{ background: 'rgba(20,20,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 12 }}
                      labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
                      formatter={(v: number) => `${v}¢`}
                    />
                    <Area type="monotone" dataKey={market.teamA} stroke="#34d399" strokeWidth={2} fill="url(#gA)" />
                    <Area type="monotone" dataKey={market.teamB} stroke="#fb7185" strokeWidth={2} fill="url(#gB)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-white/40 text-sm">
                  Awaiting first trade — chart starts at 50/50.
                </div>
              )}
            </div>
          </div>

          {/* Recent activity */}
          <div className="glass-panel rounded-md p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-white/60" />
              <h2 className="text-sm font-semibold text-white">Recent activity</h2>
              <Badge variant="outline" className="text-[10px]">{activity.length}</Badge>
            </div>
            {activity.length === 0 ? (
              <p className="text-sm text-white/40">No trades yet. Be the first to take a position.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-[11px] uppercase text-white/40">
                    <tr>
                      <th className="text-left py-2 font-medium">User</th>
                      <th className="text-left py-2 font-medium">Side</th>
                      <th className="text-right py-2 font-medium">Amount</th>
                      <th className="text-right py-2 font-medium">Price</th>
                      <th className="text-right py-2 font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activity.slice(0, 20).map((b) => {
                      const teamName = b.outcome === 'A' ? market.teamA : market.teamB;
                      const colorClass = b.outcome === 'A' ? 'text-emerald-300' : 'text-rose-300';
                      const oddsNum = parseFloat(b.oddsAtBet) || 2;
                      const priceCents = Math.max(1, Math.min(99, Math.round(100 / oddsNum)));
                      return (
                        <tr key={b.id} className="border-t border-white/5" data-testid={`activity-${b.id}`}>
                          <td className="py-2 font-mono text-xs text-white/70">{shortAddr(b.userAddress)}</td>
                          <td className={cn("py-2 text-xs font-semibold", colorClass)}>BUY {teamName}</td>
                          <td className="py-2 text-right font-mono text-xs">{parseFloat(b.amount).toFixed(4)} BNB</td>
                          <td className="py-2 text-right font-mono text-xs">{priceCents}¢</td>
                          <td className="py-2 text-right text-xs text-white/50">
                            {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Top holders */}
          {holders && (holders.A.length > 0 || holders.B.length > 0) && (
            <div className="glass-panel rounded-md p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-white/60" />
                <h2 className="text-sm font-semibold text-white">Top holders</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-bold text-emerald-300 mb-2">{market.teamA}</h3>
                  {holders.A.length === 0 ? (
                    <p className="text-xs text-white/40">No holders yet</p>
                  ) : holders.A.map(h => (
                    <div key={h.userAddress} className="flex items-center justify-between py-1 text-xs">
                      <span className="font-mono text-white/70">{shortAddr(h.userAddress)}</span>
                      <span className="font-mono text-white/90">{parseFloat(h.amount).toFixed(4)} BNB</span>
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-rose-300 mb-2">{market.teamB}</h3>
                  {holders.B.length === 0 ? (
                    <p className="text-xs text-white/40">No holders yet</p>
                  ) : holders.B.map(h => (
                    <div key={h.userAddress} className="flex items-center justify-between py-1 text-xs">
                      <span className="font-mono text-white/70">{shortAddr(h.userAddress)}</span>
                      <span className="font-mono text-white/90">{parseFloat(h.amount).toFixed(4)} BNB</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: buy panel */}
        <div className="lg:col-span-1">
          <div className="glass-panel rounded-md p-4 lg:sticky lg:top-4">
            <h2 className="text-sm font-semibold text-white mb-3">Buy a position</h2>

            {/* Outcome toggle */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Button
                onClick={() => setOutcome('A')}
                variant="outline"
                className={cn(
                  "h-14 flex-col gap-0",
                  outcome === 'A'
                    ? "bg-emerald-500/20 border-emerald-400 text-emerald-200"
                    : "bg-emerald-500/5 border-emerald-500/20 text-emerald-300/70"
                )}
                data-testid="button-outcome-a"
              >
                <span className="text-[10px] uppercase tracking-wide opacity-80">{market.teamA}</span>
                <span className="text-lg font-bold leading-none">{derived.priceA}¢</span>
              </Button>
              <Button
                onClick={() => setOutcome('B')}
                variant="outline"
                className={cn(
                  "h-14 flex-col gap-0",
                  outcome === 'B'
                    ? "bg-rose-500/20 border-rose-400 text-rose-200"
                    : "bg-rose-500/5 border-rose-500/20 text-rose-300/70"
                )}
                data-testid="button-outcome-b"
              >
                <span className="text-[10px] uppercase tracking-wide opacity-80">{market.teamB}</span>
                <span className="text-lg font-bold leading-none">{derived.priceB}¢</span>
              </Button>
            </div>

            {/* Amount */}
            <label className="text-xs text-white/60 mb-1 block">Amount (BNB)</label>
            <Input
              type="number"
              step="0.001"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="font-mono"
              data-testid="input-bet-amount"
            />
            <div className="flex gap-1 mt-2">
              {[0.01, 0.05, 0.1, 0.5, 1].map(v => (
                <Button
                  key={v}
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => setAmount(String(v))}
                  data-testid={`quick-${v}`}
                >
                  {v}
                </Button>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-4 space-y-1.5 text-xs border-t border-white/5 pt-3">
              <div className="flex justify-between">
                <span className="text-white/60">Price</span>
                <span className="font-mono">{outcome === 'A' ? derived.priceA : derived.priceB}¢</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Avg odds</span>
                <span className="font-mono">{(outcome === 'A' ? derived.oddsA : derived.oddsB).toFixed(2)}x</span>
              </div>
              <div className="flex justify-between text-base pt-2 border-t border-white/5">
                <span className="text-white/80 font-semibold">To win</span>
                <span className="font-mono font-bold text-amber-300" data-testid="text-payout">
                  {projectedPayout.toFixed(4)} BNB
                </span>
              </div>
            </div>

            <Button
              className="w-full mt-4"
              size="lg"
              disabled={isDisabled || amtNum <= 0 || placeBetMutation.isPending}
              onClick={() => placeBetMutation.mutate({ outcome, amount })}
              data-testid="button-place-bet"
            >
              {!isAuthenticated ? "Connect wallet to bet" :
                market.status !== 'active' ? "Market closed" :
                placeBetMutation.isPending ? "Placing…" :
                `Buy ${outcome === 'A' ? market.teamA : market.teamB}`}
            </Button>

            {!isAuthenticated && (
              <p className="text-[11px] text-white/50 text-center mt-2">
                Connect your wallet from the header to place a position.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
