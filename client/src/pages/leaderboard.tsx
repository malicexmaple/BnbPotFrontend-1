import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, ArrowLeft, Medal } from "lucide-react";
import { useLocation } from "wouter";
import type { MarketLeaderboardEntry } from "@shared/schema";

const SPORT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: "All Sports" },
  { value: "Soccer", label: "Soccer" },
  { value: "Basketball", label: "Basketball" },
  { value: "American Football", label: "American Football" },
  { value: "Baseball", label: "Baseball" },
  { value: "Ice Hockey", label: "Ice Hockey" },
  { value: "MMA", label: "MMA" },
  { value: "Tennis", label: "Tennis" },
  { value: "Esports", label: "Esports" },
];

export default function Leaderboard() {
  const [, setLocation] = useLocation();
  const [sport, setSport] = useState<string>("all");

  const queryKey = sport === "all"
    ? ["/api/markets/leaderboard"]
    : [`/api/markets/leaderboard?sport=${encodeURIComponent(sport)}`];

  const { data, isLoading } = useQuery<MarketLeaderboardEntry[]>({
    queryKey,
  });

  return (
    <div className="bg-background pt-24 px-4 pb-12" style={{ minHeight: 'calc(100vh / var(--app-zoom, 1))' }}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-leaderboard-title">Leaderboard</h1>
            <p className="text-muted-foreground text-sm">Top prediction-market bettors by total winnings.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={sport} onValueChange={setSport}>
              <SelectTrigger className="w-[180px]" data-testid="select-sport-filter">
                <SelectValue placeholder="Filter by sport" />
              </SelectTrigger>
              <SelectContent>
                {SPORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} data-testid={`option-sport-${opt.value}`}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setLocation("/prediction-markets")} data-testid="button-back-to-markets">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Markets
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : (data?.length ?? 0) === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground" data-testid="text-no-leaderboard">
              {sport === "all"
                ? "No bets yet. Be the first to make the leaderboard."
                : `No ${sport} bets yet. Be the first to make the leaderboard.`}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              {(data || []).map((entry, idx) => (
                <Row key={entry.userAddress} rank={idx + 1} entry={entry} />
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function rankColor(rank: number): string {
  if (rank === 1) return "text-yellow-500";
  if (rank === 2) return "text-slate-300";
  if (rank === 3) return "text-amber-700";
  return "text-muted-foreground";
}

function Row({ rank, entry }: { rank: number; entry: MarketLeaderboardEntry }) {
  const winRate = entry.totalBets > 0 ? Math.round((entry.wins / entry.totalBets) * 100) : 0;
  const profit = parseFloat(entry.netProfit);
  const display = entry.username || `${entry.userAddress.slice(0, 6)}...${entry.userAddress.slice(-4)}`;

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0" data-testid={`row-leader-${rank}`}>
      <div className={`w-8 text-center font-bold ${rankColor(rank)}`}>
        {rank <= 3 ? <Medal className="inline h-5 w-5" /> : rank}
      </div>
      <Avatar className="h-9 w-9">
        <AvatarFallback>{display.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-foreground truncate" data-testid={`text-leader-name-${rank}`}>{display}</div>
        <div className="text-xs text-muted-foreground">{entry.totalBets} bets • {winRate}% win rate</div>
      </div>
      <div className="text-right">
        <div className="font-mono text-sm text-foreground flex items-center gap-1 justify-end">
          <Trophy className="h-3 w-3" />
          {parseFloat(entry.totalWon).toFixed(4)}
        </div>
        <div className={`text-xs font-mono ${profit >= 0 ? "text-success" : "text-destructive"}`}>
          {profit >= 0 ? "+" : ""}{profit.toFixed(4)} BNB
        </div>
      </div>
    </div>
  );
}
