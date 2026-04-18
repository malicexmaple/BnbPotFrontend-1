// Game Detail Page - Shows all markets for a specific game
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { MarketCard } from "@/components/market-card";
import { MarketPane } from "@/components/market-pane";
import { BetSlipDialog } from "@/components/bet-slip-dialog";
import { LiveBettingFeed } from "@/components/LiveBettingFeed";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ChevronLeft, LayoutGrid, List } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import type { Market } from "@shared/schema";
import { NetworkBackground } from "@/components/NetworkBackground";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link, useParams } from "wouter";
import { buildGameSlug } from "@/lib/gameUtils";

export default function GameDetail() {
  const { toast } = useToast();
  const params = useParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [betSlipOpen, setBetSlipOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'pane'>(() => {
    const saved = localStorage.getItem('market-view-mode');
    return (saved === 'pane' || saved === 'grid') ? saved : 'grid';
  });
  const [selectedMarket, setSelectedMarket] = useState<{
    id: string;
    outcome: 'A' | 'B';
    teamName: string;
    odds: number;
  } | null>(null);

  // Save view mode preference
  useEffect(() => {
    localStorage.setItem('market-view-mode', viewMode);
  }, [viewMode]);

  // Get sport and game slug from URL params
  const sport = params.sport || '';
  const gameSlug = params.gameSlug || '';
  
  // Parse timestamp from slug (format: teamA-vs-teamB-timestamp)
  const slugParts = gameSlug.split('-');
  const timestamp = slugParts[slugParts.length - 1];
  const gameTimeMs = parseInt(timestamp, 10);

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
        
        if (message.type === 'markets_update') {
          queryClient.invalidateQueries({ queryKey: ["/api/markets"] });
        } else if (message.type === 'market_update') {
          const { id, poolATotal, poolBTotal, oddsA, oddsB } = message.data;
          queryClient.setQueryData(["/api/markets"], (oldData: any) => {
            if (!oldData) return oldData;
            return oldData.map((market: any) => 
              market.id === id 
                ? { ...market, poolATotal, poolBTotal, oddsA, oddsB }
                : market
            );
          });
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

  // Fetch all markets
  const { data: allMarkets, isLoading: marketsLoading, error: marketsError } = useQuery<Market[]>({
    queryKey: ["/api/markets"],
    retry: false,
  });

  // Filter markets for this specific game by matching the slug
  const markets = allMarkets?.filter(m => {
    const marketSlug = buildGameSlug(m.teamA, m.teamB, new Date(m.gameTime));
    return marketSlug === gameSlug;
  }) || [];

  // Get game info from first market
  const gameInfo = markets.length > 0 ? {
    teamA: markets[0].teamA,
    teamB: markets[0].teamB,
    league: markets[0].league,
  } : null;

  const handlePlaceBet = (marketId: string, outcome: 'A' | 'B', odds: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to place bets",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
    }

    const market = markets?.find(m => m.id === marketId);
    if (!market) return;

    const teamName = outcome === 'A' ? market.teamA : market.teamB;
    setSelectedMarket({ id: marketId, outcome, teamName, odds });
    setBetSlipOpen(true);
  };

  const handleConfirmBet = async (amount: string) => {
    if (!selectedMarket) return;

    try {
      await apiRequest("POST", "/api/bets", {
        marketId: selectedMarket.id,
        outcome: selectedMarket.outcome,
        amount,
        oddsAtBet: selectedMarket.odds,
      });

      toast({
        title: "Bet Placed!",
        description: `Successfully bet ${amount} BNB on ${selectedMarket.teamName}`,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/markets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bets/feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/transactions"] });
    } catch (error: any) {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 500);
        throw error;
      }
      throw new Error(error.message || "Failed to place bet");
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <LiveBettingFeed />
      
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="space-y-6">
            {/* Back Button */}
            <Link href={`/sports/${sport}`}>
              <Button 
                variant="ghost" 
                className="mb-2"
                data-testid="button-back"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to {sport.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Button>
            </Link>

            {/* Game Header */}
            {gameInfo && (
              <div className="flex items-center justify-between relative">
                <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ height: '80px', marginTop: '-10px', marginLeft: '-24px', marginRight: '-24px' }}>
                  <NetworkBackground color="gold" className="w-full h-full opacity-30" />
                </div>
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold text-white font-sohne">
                    {gameInfo.teamA} <span className="goldify-text ml-1">VS</span> {gameInfo.teamB}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 font-mono">{gameInfo.league}</p>
                </div>
                
                {/* View Toggle */}
                <div className="flex gap-2 relative z-10">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                    data-testid="button-view-grid"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'pane' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('pane')}
                    data-testid="button-view-pane"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {marketsError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load markets. Please try again later.
                </AlertDescription>
              </Alert>
            )}

            {marketsLoading ? (
              <div className={viewMode === 'grid' ? "grid md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className={viewMode === 'grid' ? "h-64 bg-card" : "h-24 bg-card"} />
                ))}
              </div>
            ) : markets && markets.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {markets.map((market) => (
                    <MarketCard
                      key={market.id}
                      market={market}
                      onPlaceBet={handlePlaceBet}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {markets.map((market) => (
                    <MarketPane
                      key={market.id}
                      market={market}
                      onPlaceBet={handlePlaceBet}
                    />
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-12 bg-card rounded-lg border border-card-border">
                <p className="text-muted-foreground text-lg">No markets found for this game</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Check back soon for new betting opportunities!
                </p>
              </div>
            )}
          </div>

          {selectedMarket && (
            <BetSlipDialog
              open={betSlipOpen}
              onClose={() => setBetSlipOpen(false)}
              marketId={selectedMarket.id}
              outcome={selectedMarket.outcome}
              teamName={selectedMarket.teamName}
              currentOdds={selectedMarket.odds}
              onConfirm={handleConfirmBet}
            />
          )}
        </div>
      </div>
    </div>
  );
}
