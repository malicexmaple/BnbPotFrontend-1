import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Trophy, X, Clock, AlertCircle, RotateCcw } from "lucide-react";
import { useLocation } from "wouter";
import { useGameState } from "@/hooks/useGameState";
import type { MarketBet, Market } from "@shared/schema";

type BetWithMarket = MarketBet & { market: Market };

const PAGE_SIZE = 20;

export default function MyBets() {
  const [, setLocation] = useLocation();
  const { address } = useGameState();

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery<BetWithMarket[]>({
    queryKey: ["/api/market-bets/my-bets", address],
    enabled: !!address,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = pageParam as number;
      const res = await fetch(
        `/api/market-bets/my-bets?limit=${PAGE_SIZE}&offset=${offset}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch bets");
      return res.json();
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
      return allPages.reduce((sum, p) => sum + p.length, 0);
    },
  });

  // Reset pagination when wallet changes
  useEffect(() => {
    if (address) refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const bets = useMemo(() => (data?.pages ?? []).flat(), [data]);

  const grouped = {
    active: bets.filter((b) => b.status === "active").length,
    won: bets.filter((b) => b.status === "won").length,
    lost: bets.filter((b) => b.status === "lost").length,
    refunded: bets.filter((b) => b.status === "refunded").length,
  };

  return (
    <div className="bg-background pt-24 px-4 pb-12" style={{ minHeight: 'calc(100vh / var(--app-zoom, 1))' }}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-mybets-title">My Bets</h1>
            <p className="text-muted-foreground text-sm">All your prediction-market bets in one place.</p>
          </div>
          <Button variant="outline" onClick={() => setLocation("/prediction-markets")} data-testid="button-back-to-markets">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Markets
          </Button>
        </div>

        {!address && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Connect your wallet to view your bets.</AlertDescription>
          </Alert>
        )}

        {address && isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Couldn't load your bets. Please try again later.</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Active" value={grouped.active} icon={<Clock className="h-5 w-5" />} testId="stat-active" />
          <StatCard label="Won" value={grouped.won} icon={<Trophy className="h-5 w-5" />} testId="stat-won" />
          <StatCard label="Lost" value={grouped.lost} icon={<X className="h-5 w-5" />} testId="stat-lost" />
          <StatCard label="Refunded" value={grouped.refunded} icon={<RotateCcw className="h-5 w-5" />} testId="stat-refunded" />
        </div>

        {address && isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        )}

        {address && !isLoading && bets.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground" data-testid="text-no-bets">You haven't placed any prediction-market bets yet.</p>
              <Button className="mt-4" onClick={() => setLocation("/prediction-markets")} data-testid="button-browse-markets">
                Browse Markets
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {bets.map((bet) => (
            <BetRow key={bet.id} bet={bet} />
          ))}
        </div>

        {hasNextPage && (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              data-testid="button-load-more-bets"
            >
              {isFetchingNextPage ? "Loading..." : "Load more"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, testId }: { label: string; value: number; icon: React.ReactNode; testId: string }) {
  return (
    <Card data-testid={testId}>
      <CardContent className="py-4 flex items-center gap-3">
        <div className="text-muted-foreground">{icon}</div>
        <div>
          <div className="text-2xl font-bold text-foreground">{value}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function BetRow({ bet }: { bet: BetWithMarket }) {
  const team = bet.outcome === "A" ? bet.market.teamA : bet.market.teamB;
  const opponent = bet.outcome === "A" ? bet.market.teamB : bet.market.teamA;
  const statusVariant: "default" | "secondary" | "destructive" | "outline" =
    bet.status === "won"
      ? "default"
      : bet.status === "lost"
      ? "destructive"
      : bet.status === "refunded"
      ? "outline"
      : "secondary";

  return (
    <Card className="hover-elevate" data-testid={`bet-row-${bet.id}`}>
      <CardContent className="py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{bet.market.sport}</Badge>
            <span className="text-xs text-muted-foreground truncate">{bet.market.league}</span>
          </div>
          <div className="font-semibold text-foreground mt-1 truncate">
            {team} <span className="text-muted-foreground">vs</span> {opponent}
          </div>
          <div className="text-xs text-muted-foreground truncate">{bet.market.description}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-sm text-foreground">{parseFloat(bet.amount).toFixed(4)} BNB</div>
          <div className="text-xs text-muted-foreground">@ {bet.oddsAtBet}x</div>
          <Badge variant={statusVariant} className="mt-1 capitalize">{bet.status}</Badge>
          {bet.status === "won" && bet.actualPayout && (
            <div className="text-xs text-success mt-1 font-mono">+{parseFloat(bet.actualPayout).toFixed(4)} BNB</div>
          )}
          {bet.status === "refunded" && (
            <div className="text-xs text-muted-foreground mt-1 font-mono">Refunded {parseFloat(bet.amount).toFixed(4)} BNB</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
