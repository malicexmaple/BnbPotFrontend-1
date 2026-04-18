// League Selection Page - Shows leagues with active markets for a sport
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Flame } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type { Market } from "@shared/schema";
import { NetworkBackground } from "@/components/NetworkBackground";
import { LiveBettingFeed } from "@/components/LiveBettingFeed";
import { queryClient } from "@/lib/queryClient";
import { sportsData } from "@shared/sports-leagues";

interface LeagueWithMarkets {
  leagueId: string;
  leagueName: string;
  displayName: string;
  badge?: string;
  marketCount: number;
  activeCount: number;
  liveCount: number;
}

interface LeagueSelectionProps {
  sportId: string;
  sportName: string;
}

export default function LeagueSelection({ sportId, sportName }: LeagueSelectionProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

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

  // Fetch markets
  const { data: allMarkets, isLoading: marketsLoading, error: marketsError } = useQuery<Market[]>({
    queryKey: ["/api/markets"],
    retry: false,
  });

  // Get sport config from sports-leagues.ts
  const sportConfig = sportsData.find(s => s.id === sportId);

  // Group markets by league and filter for this sport
  const leaguesWithMarkets: LeagueWithMarkets[] = (() => {
    if (!allMarkets || !sportConfig) return [];

    // Filter markets for this sport
    const sportMarkets = allMarkets.filter(m => {
      // Match by sport name or league name in the market
      return sportConfig.leagues.some(league => 
        m.league === league.name || m.league === league.displayName
      );
    });

    // Group by league
    const leagueMap = new Map<string, LeagueWithMarkets>();

    sportMarkets.forEach(market => {
      const leagueConfig = sportConfig.leagues.find(
        l => l.name === market.league || l.displayName === market.league
      );

      if (!leagueConfig) return;

      const existing = leagueMap.get(leagueConfig.id);
      const isActive = market.status === 'active';
      const isLive = market.isLive === true;

      if (existing) {
        existing.marketCount++;
        if (isActive) existing.activeCount++;
        if (isLive) existing.liveCount++;
      } else {
        leagueMap.set(leagueConfig.id, {
          leagueId: leagueConfig.id,
          leagueName: leagueConfig.name,
          displayName: leagueConfig.displayName,
          badge: leagueConfig.badge,
          marketCount: 1,
          activeCount: isActive ? 1 : 0,
          liveCount: isLive ? 1 : 0,
        });
      }
    });

    // Only return leagues with active markets
    return Array.from(leagueMap.values())
      .filter(league => league.activeCount > 0)
      .sort((a, b) => {
        // Sort by: live first, then by active count
        if (a.liveCount !== b.liveCount) return b.liveCount - a.liveCount;
        return b.activeCount - a.activeCount;
      });
  })();

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

  const handleLeagueClick = (leagueId: string, leagueName: string) => {
    // Navigate to specific league page with league name as parameter
    setLocation(`/sports/${sportId}/league/${encodeURIComponent(leagueName)}`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Live Betting Feed - Horizontal Ticker */}
      <LiveBettingFeed />
      
      <div className="flex-1 overflow-auto relative">
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <NetworkBackground color="gold" className="w-full h-full opacity-30" sizeMultiplier={1.25} />
        </div>
      <div className="container mx-auto p-6 max-w-7xl relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            {sportConfig?.iconName && (
              <img 
                src={`/sport-icons/${sportConfig.iconName}.svg`} 
                alt={sportName}
                className="h-10 w-10 object-contain brightness-0 invert"
              />
            )}
            <h1 className="text-4xl font-bold text-foreground font-sohne">{sportName} Leagues</h1>
          </div>
          <p className="text-muted-foreground">Select a league to view available markets</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-48 bg-card" />
            ))}
          </div>
        )}

        {/* Leagues Grid */}
        {!marketsLoading && !marketsError && (
          <>
            {leaguesWithMarkets.length === 0 ? (
              <Card className="p-12 text-center">
                <CardContent className="space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">No Active Markets</h3>
                    <p className="text-sm text-muted-foreground">
                      There are currently no active markets for {sportName}. Check back soon!
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {leaguesWithMarkets.map((league) => (
                  <Card
                    key={league.leagueId}
                    className="hover-elevate active-elevate-2 cursor-pointer overflow-visible"
                    onClick={() => handleLeagueClick(league.leagueId, league.leagueName)}
                    data-testid={`card-league-${league.leagueId}`}
                  >
                    <CardHeader className="space-y-4">
                      {/* League Badge */}
                      {league.badge && (
                        <div className="flex justify-center">
                          <div className="w-24 h-24 flex items-center justify-center">
                            <img
                              src={league.badge}
                              alt={league.displayName}
                              className="max-w-full max-h-full object-contain"
                              data-testid={`img-league-badge-${league.leagueId}`}
                            />
                          </div>
                        </div>
                      )}
                      {!league.badge && (
                        <div className="flex justify-center">
                          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                            <Flame className="h-12 w-12 text-primary" />
                          </div>
                        </div>
                      )}

                      {/* League Name */}
                      <CardTitle className="text-center text-lg">
                        {league.displayName}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Active Markets</span>
                        <Badge variant="secondary" data-testid={`text-active-count-${league.leagueId}`}>
                          {league.activeCount}
                        </Badge>
                      </div>

                      {league.liveCount > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Live Now</span>
                          <Badge 
                            className="bg-destructive text-destructive-foreground animate-pulse"
                            data-testid={`text-live-count-${league.leagueId}`}
                          >
                            {league.liveCount} LIVE
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
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
