// DegenArena Live Betting Feed Component
// Reference: design_guidelines.md - Social betting feed with user bets
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BetFeedItem {
  id: string;
  userName: string;
  userAvatar?: string;
  amount: string;
  outcome: string;
  marketDescription: string;
  odds: string;
  timestamp: Date;
  status?: 'won' | 'lost' | 'active';
}

interface BettingFeedProps {
  bets: BetFeedItem[];
}

export function BettingFeed({ bets }: BettingFeedProps) {
  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <Card className="bg-card border-card-border h-full">
      <CardHeader className="border-b border-accent pb-4">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <TrendingUp className="h-5 w-5 text-primary" />
          Live Betting Feed
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <div className="p-4 space-y-3">
            {bets.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No recent bets</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Be the first to place a bet!
                </p>
              </div>
            ) : (
              bets.map((bet) => (
                <div
                  key={bet.id}
                  className="bg-muted rounded-lg p-3 hover-elevate transition-all"
                  data-testid={`feed-item-${bet.id}`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 ring-1 ring-accent">
                      <AvatarImage src={bet.userAvatar} alt={bet.userName} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                        {bet.userName[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground text-sm">
                          {bet.userName}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(bet.timestamp)}
                        </span>
                        {bet.status && (
                          <Badge
                            variant={bet.status === 'won' ? 'default' : 'outline'}
                            className={
                              bet.status === 'won'
                                ? 'bg-primary text-primary-foreground'
                                : bet.status === 'lost'
                                ? 'border-destructive text-destructive'
                                : 'border-accent text-accent'
                            }
                          >
                            {bet.status.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-foreground">
                        Bet <span className="font-mono font-bold text-primary">{bet.amount} BNB</span>
                        {' '}on{' '}
                        <span className="font-semibold text-primary">{bet.outcome}</span>
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {bet.marketDescription}
                      </p>
                      <p className="text-xs text-accent mt-1 font-mono">
                        @ {bet.odds} odds
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
