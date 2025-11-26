import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { TrendingUp, Coins, Trophy, Calendar, Target } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getLeagueBadge } from "@/lib/leagueUtils";
import { format } from "date-fns";

interface BetFeedItem {
  id: string;
  userEmail: string;
  userDisplayName: string | null;
  profileImageUrl?: string;
  userRank: string;
  userRankPoints: number;
  amount: string;
  outcome: string;
  teamA: string;
  teamB: string;
  league: string;
  marketDescription: string;
  oddsAtBet: string;
  actualPayout: string;
  createdAt: Date;
  status: string;
}

export function LiveBettingFeed() {
  const [duplicatedBets, setDuplicatedBets] = useState<BetFeedItem[]>([]);
  const [selectedBet, setSelectedBet] = useState<BetFeedItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: bets = [] } = useQuery<BetFeedItem[]>({
    queryKey: ["/api/bets/feed"],
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (bets.length > 0) {
      const copies = [...bets, ...bets, ...bets, ...bets];
      setDuplicatedBets(copies);
    }
  }, [bets]);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_bet') {
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }
      } catch (e) {
        console.error('Error parsing websocket message:', e);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  if (bets.length === 0) {
    return (
      <div className="w-full glass-panel border-b border-accent/50 py-3 overflow-hidden" style={{borderRadius: 0}}>
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm font-medium">Waiting for winning bets...</span>
        </div>
      </div>
    );
  }

  const getUserName = (displayName: string | null, email: string) => {
    return displayName || "Anonymous Player";
  };

  const formatAmount = (amount: string) => {
    return parseFloat(amount).toFixed(2);
  };

  const handleBetClick = (bet: BetFeedItem) => {
    setSelectedBet(bet);
    setDialogOpen(true);
  };

  return (
    <div className="w-full glass-panel border-b border-accent/50 py-3 overflow-hidden relative" style={{borderRadius: 0}}>
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-card/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-card/80 to-transparent z-10 pointer-events-none" />
      
      <div className="flex gap-6 animate-scroll-left whitespace-nowrap">
        {duplicatedBets.map((bet, index) => (
          <div
            key={`${bet.id}-${index}`}
            className="inline-flex items-center gap-3 px-4 py-2 bg-card/50 rounded-lg border border-accent/30 hover-elevate cursor-pointer active-elevate-2"
            onClick={() => handleBetClick(bet)}
            data-testid={`feed-bet-${index}`}
          >
            <Avatar className="h-8 w-8 border border-primary/30">
              <AvatarImage src={bet.profileImageUrl || ""} alt={getUserName(bet.userDisplayName, bet.userEmail)} />
              <AvatarFallback className="text-xs font-bold text-primary bg-primary/10">
                {getUserName(bet.userDisplayName, bet.userEmail).substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                {getUserName(bet.userDisplayName, bet.userEmail)}
              </span>
              <span className="text-sm text-muted-foreground">won</span>
              <div className="flex items-center gap-1">
                <Coins className="h-3 w-3 text-primary" />
                <span className="text-sm font-bold text-primary">
                  {formatAmount(bet.actualPayout)} BNB
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">on</span>
              <span className="font-medium text-foreground">
                {bet.outcome === 'A' ? bet.teamA : bet.teamB}
              </span>
            </div>

            {(() => {
              const leagueBadge = getLeagueBadge(bet.league);
              return leagueBadge ? (
                <div className="flex items-center justify-center w-7 h-7 flex-shrink-0">
                  <img 
                    src={leagueBadge} 
                    alt={bet.league}
                    className="max-h-6 max-w-6 object-contain"
                    data-testid="img-league-logo-feed"
                  />
                </div>
              ) : (
                <Badge variant="outline" className="border-accent text-accent text-xs font-mono">
                  {bet.league}
                </Badge>
              );
            })()}
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-bet-details">
          {selectedBet && (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Trophy className="h-6 w-6 text-primary" />
                  Winning Bet Details
                </DialogTitle>
              </DialogHeader>

              <div className="flex items-center gap-4 p-4 bg-card rounded-lg border border-accent/30">
                <Avatar className="h-16 w-16 border-2 border-primary/30">
                  <AvatarImage 
                    src={selectedBet.profileImageUrl || ""} 
                    alt={getUserName(selectedBet.userDisplayName, selectedBet.userEmail)} 
                  />
                  <AvatarFallback className="text-lg font-bold text-primary bg-primary/10">
                    {getUserName(selectedBet.userDisplayName, selectedBet.userEmail).substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground" data-testid="text-bet-username">
                    {getUserName(selectedBet.userDisplayName, selectedBet.userEmail)}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {selectedBet.userRankPoints.toLocaleString()} pts
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold text-foreground">Match Details</h4>
                </div>
                <div className="p-4 bg-card rounded-lg border border-accent/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">League</span>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const leagueBadge = getLeagueBadge(selectedBet.league);
                        return leagueBadge ? (
                          <img 
                            src={leagueBadge} 
                            alt={selectedBet.league}
                            className="h-6 w-6 object-contain"
                          />
                        ) : null;
                      })()}
                      <span className="font-medium text-foreground">{selectedBet.league}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Match</span>
                    <span className="font-medium text-foreground">
                      {selectedBet.teamA} vs {selectedBet.teamB}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Market</span>
                    <span className="font-medium text-foreground">{selectedBet.marketDescription}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold text-foreground">Bet Information</h4>
                </div>
                <div className="p-4 bg-card rounded-lg border border-accent/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Picked</span>
                    <Badge variant="default" className="bg-primary text-primary-foreground">
                      {selectedBet.outcome === 'A' ? selectedBet.teamA : selectedBet.teamB}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Bet Amount</span>
                    <span className="font-mono font-medium text-foreground">
                      {formatAmount(selectedBet.amount)} BNB
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Odds at Bet</span>
                    <span className="font-mono font-medium text-foreground">{selectedBet.oddsAtBet}</span>
                  </div>
                  <div className="h-px bg-accent/30" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Payout</span>
                    <span className="font-mono font-bold text-lg text-primary">
                      {formatAmount(selectedBet.actualPayout)} BNB
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Profit</span>
                    <span className="font-mono font-semibold text-green-500">
                      +{formatAmount((parseFloat(selectedBet.actualPayout) - parseFloat(selectedBet.amount)).toString())} BNB
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Won on {format(new Date(selectedBet.createdAt), 'PPpp')}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
