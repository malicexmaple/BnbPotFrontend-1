// Dota 2 Games List Page
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { GameCard } from "@/components/game-card";
import { LiveBettingFeed } from "@/components/LiveBettingFeed";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type { Market } from "@shared/schema";
import { NetworkBackground } from "@/components/NetworkBackground";
import { queryClient } from "@/lib/queryClient";
import { groupMarketsByGame } from "@/lib/gameUtils";

export default function Dota2() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => console.log('WebSocket connected');
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'markets_update' || message.type === 'market_update') {
          queryClient.invalidateQueries({ queryKey: ["/api/markets"] });
        } else if (message.type === 'new_bet') {
          queryClient.invalidateQueries({ queryKey: ["/api/bets/feed"] });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    return () => { if (socket.readyState === WebSocket.OPEN) socket.close(); };
  }, [isAuthenticated]);

  const { data: allMarkets, isLoading: marketsLoading, error: marketsError } = useQuery<Market[]>({
    queryKey: ["/api/markets"],
    retry: false,
  });

  const dota2Markets = allMarkets?.filter(m => m.league === 'Dota 2' || m.league === 'Dota2') || [];
  const games = groupMarketsByGame(dota2Markets);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-lg text-muted-foreground font-sohne">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <LiveBettingFeed />
      
      <div className="flex-1 overflow-auto relative">
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <NetworkBackground color="gold" className="w-full h-full opacity-30" sizeMultiplier={1.25} />
        </div>
        <div className="container mx-auto p-6 max-w-7xl relative z-10">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img 
                  src="/sport-icons/dota2.png" 
                  alt="Dota 2" 
                  className="w-10 h-10 object-contain brightness-0 invert"
                />
                <h2 className="text-3xl font-bold text-foreground font-sohne">
                  DOTA 2 <span className="text-primary ml-1">MATCHES</span>
                </h2>
              </div>
            </div>

            {marketsError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Failed to load matches. Please try again later.</AlertDescription>
              </Alert>
            )}

            {marketsLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-64 bg-card" />)}
              </div>
            ) : games && games.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {games.map((game) => (
                  <GameCard
                    key={game.slug}
                    sport="dota2"
                    teamA={game.teamA}
                    teamB={game.teamB}
                    league={game.league}
                    gameTime={game.gameTime}
                    marketCount={game.marketCount}
                    isLive={game.isLive}
                    gameSlug={game.slug}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-lg border border-card-border">
                <p className="text-muted-foreground text-lg">No active Dota 2 matches</p>
                <p className="text-sm text-muted-foreground mt-2">Check back soon for new betting opportunities!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
