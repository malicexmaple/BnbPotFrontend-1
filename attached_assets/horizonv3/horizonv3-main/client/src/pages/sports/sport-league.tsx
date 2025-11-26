// Generic Sport League Page - Shows matches for a specific league in any sport
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useRoute } from "wouter";
import { GameCard } from "@/components/game-card";
import { LiveBettingFeed } from "@/components/LiveBettingFeed";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type { Market } from "@shared/schema";
import { NetworkBackground } from "@/components/NetworkBackground";
import { queryClient } from "@/lib/queryClient";
import { groupMarketsByGame } from "@/lib/gameUtils";
import { useLocation } from "wouter";
import { sportsData } from "@shared/sports-leagues";

interface SportLeagueProps {
  sportId: string;
  sportName: string;
}

export default function SportLeague({ sportId, sportName }: SportLeagueProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, params] = useRoute(`/sports/${sportId}/league/:leagueName`);
  const [, setLocation] = useLocation();
  const leagueName = params?.leagueName ? decodeURIComponent(params.leagueName) : "";

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!isAuthenticated) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('WebSocket connected');
    };

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

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [isAuthenticated]);

  // Fetch markets and filter for this league
  const { data: allMarkets, isLoading: marketsLoading, error: marketsError } = useQuery<Market[]>({
    queryKey: ["/api/markets"],
    retry: false,
  });

  // Get sport config to find league details
  const sportConfig = sportsData.find(s => s.id === sportId);
  
  // Find the league config to match both name and displayName
  const leagueConfig = sportConfig?.leagues.find(
    l => l.name === leagueName || l.displayName === leagueName
  );

  // Filter markets for this specific league (match both name and displayName)
  const leagueMarkets = allMarkets?.filter(m => {
    if (!leagueConfig) return false;
    return m.league === leagueConfig.name || m.league === leagueConfig.displayName;
  }) || [];
  
  const games = groupMarketsByGame(leagueMarkets);

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
      {/* Live Betting Feed - Horizontal Ticker */}
      <LiveBettingFeed />
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-auto relative">
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <NetworkBackground color="gold" className="w-full h-full opacity-30" sizeMultiplier={1.25} />
        </div>
        <div className="container mx-auto p-6 max-w-7xl relative z-10">
          {/* Back Button + Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => setLocation(`/sports/${sportId}/leagues`)}
              className="mb-4"
              data-testid="button-back-to-leagues"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {sportName} Leagues
            </Button>
            <div className="flex items-center gap-4 mb-2">
              {leagueConfig?.badge && (
                <img 
                  src={leagueConfig.badge} 
                  alt={leagueName}
                  className="h-10 w-10 object-contain"
                />
              )}
              <h1 className="text-4xl font-bold text-foreground font-sohne">{leagueName}</h1>
            </div>
            <p className="text-muted-foreground">
              {games.length} {games.length === 1 ? 'game' : 'games'} available
            </p>
          </div>

          {/* Error State */}
          {marketsError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load markets. Please try again.
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {marketsLoading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-64 bg-card" />
              ))}
            </div>
          )}

          {/* Games Grid */}
          {!marketsLoading && !marketsError && (
            <>
              {games.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <AlertCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Games Available</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    There are currently no active markets for {leagueName}.
                  </p>
                  <Button
                    onClick={() => setLocation(`/sports/${sportId}/leagues`)}
                    data-testid="button-back-from-empty"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to {sportName} Leagues
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {games.map((game) => (
                    <GameCard
                      key={game.slug}
                      sport={game.sport}
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
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
