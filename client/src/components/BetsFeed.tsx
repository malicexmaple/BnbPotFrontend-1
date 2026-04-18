import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";
import type { MarketBet, Market } from "@shared/schema";

type FeedItem = MarketBet & { market: Market; username: string | null };

function timeAgo(dateStr: string | Date): string {
  const date = new Date(dateStr);
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function BetsFeed({ limit = 15 }: { limit?: number }) {
  const { data, isLoading } = useQuery<FeedItem[]>({
    queryKey: ["/api/market-bets/feed"],
    refetchInterval: 15_000,
  });

  return (
    <Card data-testid="card-bets-feed">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Live Bets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-80 overflow-y-auto">
        {isLoading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)
        ) : (data?.length ?? 0) === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-4" data-testid="text-no-feed">
            No bets yet. Place the first one!
          </div>
        ) : (
          (data ?? []).slice(0, limit).map((b) => {
            const team = b.outcome === "A" ? b.market.teamA : b.market.teamB;
            const who = b.username || `${b.userAddress.slice(0, 6)}...${b.userAddress.slice(-4)}`;
            return (
              <div key={b.id} className="text-xs flex items-center justify-between gap-2 py-1 border-b border-border last:border-0" data-testid={`feed-item-${b.id}`}>
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-foreground">{who}</span>
                  <span className="text-muted-foreground"> bet on </span>
                  <span className="font-medium text-foreground truncate">{team}</span>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-foreground">{parseFloat(b.amount).toFixed(3)} BNB</div>
                  <div className="text-muted-foreground">{timeAgo(b.createdAt)}</div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
