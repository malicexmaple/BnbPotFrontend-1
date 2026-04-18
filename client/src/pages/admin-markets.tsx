import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Lock, CheckCircle, Trophy, AlertCircle, ArrowLeft, Search, Grid3x3, Gamepad2, Plus, Pencil, Trash2, RotateCcw, ListChecks } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Market, MarketBet } from "@shared/schema";
import { useLocation } from "wouter";
import { sportsData } from "@shared/sports-leagues";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NetworkBackground } from "@/components/NetworkBackground";
import { LiveBettingFeed } from "@/components/LiveBettingFeed";

export default function AdminMarkets() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const [settleDialogOpen, setSettleDialogOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const emptyForm = {
    sport: "Football",
    league: "",
    leagueId: "",
    teamA: "",
    teamB: "",
    description: "",
    gameTime: "",
    teamALogo: "",
    teamBLogo: "",
    bonusPool: "0",
    isLive: false,
  };
  const [createForm, setCreateForm] = useState(emptyForm);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editMarket, setEditMarket] = useState<Market | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundMarket, setRefundMarket] = useState<Market | null>(null);
  const [betsDialogOpen, setBetsDialogOpen] = useState(false);
  const [betsMarket, setBetsMarket] = useState<Market | null>(null);

  const getSportIcon = (sport: string) => {
    if (sport === 'all') {
      return <Grid3x3 className="h-5 w-5" />;
    }
    
    const sportConfig = sportsData.find(s => 
      s.name.toLowerCase() === sport.toLowerCase() || 
      s.id.toLowerCase() === sport.toLowerCase()
    );
    
    if (sportConfig) {
      if (sportConfig.iconType === 'lucide' || sportConfig.iconName === 'Gamepad2') {
        return <Gamepad2 className="h-5 w-5" />;
      }
      
      const iconPath = sportConfig.iconType === 'custom'
        ? `/sport-icons/${sportConfig.iconName}.png`
        : `/sport-icons/${sportConfig.iconName}.svg`;
      
      return (
        <img 
          src={iconPath}
          alt={sportConfig.name}
          className="h-5 w-5 object-contain brightness-0 invert"
        />
      );
    }
    
    return <Grid3x3 className="h-5 w-5" />;
  };

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        toast({
          title: "Unauthorized",
          description: "Please connect your wallet and sign in first.",
          variant: "destructive",
        });
        setTimeout(() => {
          setLocation('/');
        }, 500);
      } else if (!isAdmin) {
        toast({
          title: "Access Denied",
          description: "Admin access required to view this page",
          variant: "destructive",
        });
        setTimeout(() => {
          setLocation('/');
        }, 500);
      }
    }
  }, [isAuthenticated, isLoading, isAdmin, toast, setLocation]);

  const { data: markets, isLoading: marketsLoading } = useQuery<Market[]>({
    queryKey: ["/api/admin/markets"],
    refetchInterval: 5000,
    enabled: isAdmin,
  });

  const availableSports = useMemo(() => {
    const popularityOrder = [
      'Football',
      'Basketball',
      'American Football',
      'Baseball',
      'Tennis',
      'Counter Strike',
      'Dota 2',
      'Valorant',
      'League of Legends',
      'Ice Hockey',
      'Cricket',
      'Golf',
      'Fighting',
      'Rugby',
      'Motorsport',
      'Table Tennis',
      'Badminton',
      'ESports'
    ];
    
    return sportsData
      .map(s => s.name)
      .sort((a, b) => {
        const indexA = popularityOrder.indexOf(a);
        const indexB = popularityOrder.indexOf(b);
        
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        
        return a.localeCompare(b);
      });
  }, []);

  const filteredMarkets = useMemo(() => {
    if (!markets) return [];
    
    return markets.filter(market => {
      if (selectedSport !== "all" && market.sport !== selectedSport) {
        return false;
      }
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          market.description.toLowerCase().includes(query) ||
          market.teamA.toLowerCase().includes(query) ||
          market.teamB.toLowerCase().includes(query) ||
          market.sport.toLowerCase().includes(query) ||
          market.league.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  }, [markets, selectedSport, searchQuery]);

  const createMarketMutation = useMutation({
    mutationFn: async (payload: typeof emptyForm) => {
      const body: Record<string, unknown> = {
        sport: payload.sport,
        league: payload.league,
        teamA: payload.teamA,
        teamB: payload.teamB,
        description: payload.description,
        gameTime: new Date(payload.gameTime).toISOString(),
        bonusPool: payload.bonusPool || "0",
        isLive: payload.isLive,
      };
      if (payload.teamALogo) body.teamALogo = payload.teamALogo;
      if (payload.teamBLogo) body.teamBLogo = payload.teamBLogo;
      if (payload.leagueId) body.leagueId = payload.leagueId;
      const res = await apiRequest("POST", "/api/admin/markets", body);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Market created", description: "It's now live for betting." });
      setCreateDialogOpen(false);
      setCreateForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/markets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/markets"] });
    },
    onError: (error: any) => {
      toast({
        title: "Create failed",
        description: error?.message || "Could not create market",
        variant: "destructive",
      });
    },
  });

  const handleCreateMarket = () => {
    const f = createForm;
    if (!f.league || !f.teamA || !f.teamB || !f.description || !f.gameTime) {
      toast({
        title: "Missing fields",
        description: "Sport, league, both teams, description and game time are required.",
        variant: "destructive",
      });
      return;
    }
    if (new Date(f.gameTime).getTime() <= Date.now()) {
      toast({
        title: "Invalid game time",
        description: "Game time must be in the future.",
        variant: "destructive",
      });
      return;
    }
    createMarketMutation.mutate(f);
  };

  const lockMarketMutation = useMutation({
    mutationFn: async (marketId: string) => {
      return await apiRequest("POST", `/api/markets/${marketId}/lock`, {});
    },
    onSuccess: () => {
      toast({
        title: "Market Locked",
        description: "Betting has been closed for this market",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/markets"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lock Failed",
        description: error.message || "Failed to lock market",
        variant: "destructive",
      });
    },
  });

  const settleMarketMutation = useMutation({
    mutationFn: async ({ marketId, winningOutcome }: { marketId: string; winningOutcome: 'A' | 'B' }) => {
      return await apiRequest("POST", `/api/markets/${marketId}/settle`, { winningOutcome });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Market Settled",
        description: `Processed ${data.payoutsProcessed} winning bets`,
      });
      setSettleDialogOpen(false);
      setSelectedMarket(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/markets"] });
    },
    onError: (error: any) => {
      toast({
        title: "Settlement Failed",
        description: error.message || "Failed to settle market",
        variant: "destructive",
      });
    },
  });

  const updateMarketMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: typeof emptyForm }) => {
      const body: Record<string, unknown> = {
        sport: payload.sport,
        league: payload.league,
        teamA: payload.teamA,
        teamB: payload.teamB,
        description: payload.description,
        gameTime: new Date(payload.gameTime).toISOString(),
        bonusPool: payload.bonusPool || "0",
        isLive: payload.isLive,
      };
      if (payload.teamALogo) body.teamALogo = payload.teamALogo;
      if (payload.teamBLogo) body.teamBLogo = payload.teamBLogo;
      if (payload.leagueId) body.leagueId = payload.leagueId;
      const res = await apiRequest("PATCH", `/api/admin/markets/${id}`, body);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Market updated" });
      setEditDialogOpen(false);
      setEditMarket(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/markets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/markets"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error?.message || "Could not update market",
        variant: "destructive",
      });
    },
  });

  const deleteMarketMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/markets/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Market deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/markets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/markets"] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error?.message || "Could not delete market",
        variant: "destructive",
      });
    },
  });

  const refundMarketMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/admin/markets/${id}/refund`, {});
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Market refunded",
        description: `Refunded ${data.refundedBets} bets`,
      });
      setRefundDialogOpen(false);
      setRefundMarket(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/markets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/markets"] });
    },
    onError: (error: any) => {
      toast({
        title: "Refund failed",
        description: error?.message || "Could not refund market",
        variant: "destructive",
      });
    },
  });

  const { data: betsData, isLoading: betsLoading } = useQuery<{ market: Market; bets: MarketBet[] }>({
    queryKey: ["/api/admin/markets", betsMarket?.id, "bets"],
    enabled: !!betsMarket?.id && betsDialogOpen,
  });

  const openEditDialog = (market: Market) => {
    setEditMarket(market);
    const dt = new Date(market.gameTime);
    const tzAdjusted = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setEditForm({
      sport: market.sport,
      league: market.league,
      leagueId: market.leagueId || "",
      teamA: market.teamA,
      teamB: market.teamB,
      description: market.description,
      gameTime: tzAdjusted,
      teamALogo: market.teamALogo || "",
      teamBLogo: market.teamBLogo || "",
      bonusPool: market.bonusPool || "0",
      isLive: market.isLive,
    });
    setEditDialogOpen(true);
  };

  const handleUpdateMarket = () => {
    if (!editMarket) return;
    const f = editForm;
    if (!f.league || !f.teamA || !f.teamB || !f.description || !f.gameTime) {
      toast({
        title: "Missing fields",
        description: "Sport, league, both teams, description and game time are required.",
        variant: "destructive",
      });
      return;
    }
    updateMarketMutation.mutate({ id: editMarket.id, payload: f });
  };

  const handleDeleteMarket = (market: Market) => {
    if (confirm(`Delete market "${market.description}"? This only works if no bets have been placed.`)) {
      deleteMarketMutation.mutate(market.id);
    }
  };

  const openRefundDialog = (market: Market) => {
    setRefundMarket(market);
    setRefundDialogOpen(true);
  };

  const openBetsDialog = (market: Market) => {
    setBetsMarket(market);
    setBetsDialogOpen(true);
  };

  const handleLockMarket = (market: Market) => {
    if (confirm(`Lock betting for "${market.description}"?`)) {
      lockMarketMutation.mutate(market.id);
    }
  };

  const handleSettleMarket = (market: Market, winningOutcome: 'A' | 'B') => {
    settleMarketMutation.mutate({ marketId: market.id, winningOutcome });
  };

  const openSettleDialog = (market: Market) => {
    setSelectedMarket(market);
    setSettleDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-primary text-primary-foreground">Active</Badge>;
      case 'locked':
        return <Badge className="bg-accent text-accent-foreground">Locked</Badge>;
      case 'settled':
        return <Badge className="bg-card text-card-foreground border">Settled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex-1 overflow-auto relative pt-[100px]">
      <LiveBettingFeed />
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <NetworkBackground color="gold" className="w-full h-full opacity-30" sizeMultiplier={1.25} />
      </div>
      
      <div className="glass-panel px-6 py-4 border-b border-accent/30" style={{borderRadius: 0}}>
        <div className="container mx-auto max-w-screen-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Markets & <span className="text-primary">Settlements</span>
              </h1>
              <p className="text-muted-foreground">Manage betting markets and process settlements</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search markets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-markets"
                />
              </div>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                data-testid="button-open-create-market"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Market
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation('/admin')}
                data-testid="button-back-to-admin"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              variant={selectedSport === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSport("all")}
              data-testid="button-filter-all"
              className="h-9 w-9 p-0"
              title="All Sports"
            >
              {getSportIcon("all")}
            </Button>
            {availableSports.map((sport) => (
              <Button
                key={sport}
                variant={selectedSport === sport ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSport(sport)}
                data-testid={`button-filter-${sport.toLowerCase().replace(/\s+/g, '-')}`}
                className="h-9 w-9 p-0"
                title={sport}
              >
                {getSportIcon(sport)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-screen-xl relative z-10">
        {marketsLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-20 bg-card" />
            <Skeleton className="h-20 bg-card" />
            <Skeleton className="h-20 bg-card" />
          </div>
        ) : filteredMarkets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No markets found matching your filters.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredMarkets.map((market) => (
              <Card key={market.id} className="border-accent/20 bg-card">
                <CardContent className="p-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-[400px]">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Badge className="bg-primary/20 text-primary border-primary/30 text-xs px-1.5 py-0 shrink-0">
                            {market.sport}
                          </Badge>
                          {market.isLive && (
                            <Badge className="bg-accent text-accent-foreground animate-pulse text-xs px-1.5 py-0 shrink-0">LIVE</Badge>
                          )}
                          {getStatusBadge(market.status)}
                        </div>
                        <h3 className="text-sm font-bold text-foreground truncate">
                          {market.description}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {market.teamA} vs {market.teamB}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {market.teamALogo && (
                          <div className="w-8 h-8 flex items-center justify-center">
                            <img
                              src={market.teamALogo}
                              alt={market.teamA}
                              className="max-w-full max-h-full object-contain"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          </div>
                        )}
                        {market.teamBLogo && (
                          <div className="w-8 h-8 flex items-center justify-center">
                            <img
                              src={market.teamBLogo}
                              alt={market.teamB}
                              className="max-w-full max-h-full object-contain"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <div className="bg-background/50 px-2.5 py-1.5 rounded border border-accent/10 min-w-[100px]">
                        <div className="text-xs text-muted-foreground">Pool A</div>
                        <div className="text-sm font-mono font-bold text-primary">
                          {parseFloat(market.poolATotal).toFixed(2)} BNB
                        </div>
                        <div className="text-xs text-accent">
                          {(() => {
                            const poolA = parseFloat(market.poolATotal || "0");
                            const poolB = parseFloat(market.poolBTotal || "0");
                            const bonus = parseFloat(market.bonusPool || "0");
                            const total = poolA + poolB + bonus;
                            return poolA > 0 ? (total / poolA).toFixed(2) : "2.00";
                          })()}x
                        </div>
                      </div>
                      <div className="bg-background/50 px-2.5 py-1.5 rounded border border-accent/10 min-w-[100px]">
                        <div className="text-xs text-muted-foreground">Pool B</div>
                        <div className="text-sm font-mono font-bold text-primary">
                          {parseFloat(market.poolBTotal).toFixed(2)} BNB
                        </div>
                        <div className="text-xs text-accent">
                          {(() => {
                            const poolA = parseFloat(market.poolATotal || "0");
                            const poolB = parseFloat(market.poolBTotal || "0");
                            const bonus = parseFloat(market.bonusPool || "0");
                            const total = poolA + poolB + bonus;
                            return poolB > 0 ? (total / poolB).toFixed(2) : "2.00";
                          })()}x
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0 ml-auto flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openBetsDialog(market)}
                        data-testid={`button-view-bets-${market.id}`}
                        title="View bets"
                      >
                        <ListChecks className="h-4 w-4 mr-1.5" />
                        Bets
                      </Button>
                      {(market.status === 'active' || market.status === 'locked') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(market)}
                          data-testid={`button-edit-${market.id}`}
                          title="Edit market"
                        >
                          <Pencil className="h-4 w-4 mr-1.5" />
                          Edit
                        </Button>
                      )}
                      {market.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLockMarket(market)}
                          disabled={lockMarketMutation.isPending}
                          data-testid={`button-lock-${market.id}`}
                        >
                          <Lock className="h-4 w-4 mr-1.5" />
                          Lock
                        </Button>
                      )}
                      {(market.status === 'locked' || market.status === 'active') && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => openSettleDialog(market)}
                          disabled={settleMarketMutation.isPending}
                          data-testid={`button-settle-${market.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-1.5" />
                          Settle
                        </Button>
                      )}
                      {(market.status === 'active' || market.status === 'locked') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRefundDialog(market)}
                          disabled={refundMarketMutation.isPending}
                          data-testid={`button-refund-${market.id}`}
                          title="Refund all bets and void this market"
                        >
                          <RotateCcw className="h-4 w-4 mr-1.5" />
                          Refund
                        </Button>
                      )}
                      {market.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteMarket(market)}
                          disabled={deleteMarketMutation.isPending}
                          data-testid={`button-delete-${market.id}`}
                          title="Delete market (only allowed when no bets exist)"
                        >
                          <Trash2 className="h-4 w-4 mr-1.5" />
                          Delete
                        </Button>
                      )}
                      {market.status === 'settled' && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground px-2">
                          <Trophy className="h-4 w-4 text-primary" />
                          <span className="truncate max-w-[120px]">
                            {market.winningOutcome === 'A' ? market.teamA : market.teamB}
                          </span>
                        </div>
                      )}
                      {market.status === 'refunded' && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground px-2">
                          <RotateCcw className="h-4 w-4 text-accent" />
                          <span>Refunded</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="bg-background border-accent max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-foreground">Create New Market</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Set up a head-to-head prediction market. Bets open immediately.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="space-y-1">
                <Label htmlFor="cm-sport">Sport</Label>
                <select
                  id="cm-sport"
                  value={createForm.sport}
                  onChange={(e) => setCreateForm({ ...createForm, sport: e.target.value })}
                  className="w-full h-9 rounded-md bg-background border border-input px-2 text-sm"
                  data-testid="select-create-sport"
                >
                  {availableSports.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="cm-league">League</Label>
                <Input
                  id="cm-league"
                  value={createForm.league}
                  onChange={(e) => setCreateForm({ ...createForm, league: e.target.value })}
                  placeholder="e.g. NBA, Premier League"
                  data-testid="input-create-league"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cm-leagueId">League ID (optional)</Label>
                <Input
                  id="cm-leagueId"
                  value={createForm.leagueId}
                  onChange={(e) => setCreateForm({ ...createForm, leagueId: e.target.value })}
                  placeholder="Slug used by sidebar filter (e.g. nba, epl)"
                  data-testid="input-create-leagueId"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cm-teamA">Team / Outcome A</Label>
                <Input
                  id="cm-teamA"
                  value={createForm.teamA}
                  onChange={(e) => setCreateForm({ ...createForm, teamA: e.target.value })}
                  placeholder="e.g. Lakers"
                  data-testid="input-create-teamA"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cm-teamB">Team / Outcome B</Label>
                <Input
                  id="cm-teamB"
                  value={createForm.teamB}
                  onChange={(e) => setCreateForm({ ...createForm, teamB: e.target.value })}
                  placeholder="e.g. Celtics"
                  data-testid="input-create-teamB"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label htmlFor="cm-desc">Description</Label>
                <Input
                  id="cm-desc"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="e.g. Regular Season - Who will win?"
                  data-testid="input-create-description"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cm-time">Game Time</Label>
                <Input
                  id="cm-time"
                  type="datetime-local"
                  value={createForm.gameTime}
                  onChange={(e) => setCreateForm({ ...createForm, gameTime: e.target.value })}
                  data-testid="input-create-gametime"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cm-bonus">Bonus Pool (BNB)</Label>
                <Input
                  id="cm-bonus"
                  type="text"
                  value={createForm.bonusPool}
                  onChange={(e) => setCreateForm({ ...createForm, bonusPool: e.target.value })}
                  placeholder="0"
                  data-testid="input-create-bonus"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cm-logoA">Team A Logo URL (optional)</Label>
                <Input
                  id="cm-logoA"
                  value={createForm.teamALogo}
                  onChange={(e) => setCreateForm({ ...createForm, teamALogo: e.target.value })}
                  placeholder="https://..."
                  data-testid="input-create-logoA"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cm-logoB">Team B Logo URL (optional)</Label>
                <Input
                  id="cm-logoB"
                  value={createForm.teamBLogo}
                  onChange={(e) => setCreateForm({ ...createForm, teamBLogo: e.target.value })}
                  placeholder="https://..."
                  data-testid="input-create-logoB"
                />
              </div>
              <div className="col-span-2 flex items-center gap-3 pt-1">
                <Switch
                  id="cm-live"
                  checked={createForm.isLive}
                  onCheckedChange={(c) => setCreateForm({ ...createForm, isLive: c })}
                  data-testid="switch-create-live"
                />
                <Label htmlFor="cm-live">Mark as live (in-progress)</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setCreateDialogOpen(false)}
                data-testid="button-cancel-create"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateMarket}
                disabled={createMarketMutation.isPending}
                data-testid="button-confirm-create"
              >
                {createMarketMutation.isPending ? "Creating..." : "Create Market"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={settleDialogOpen} onOpenChange={setSettleDialogOpen}>
          <DialogContent className="bg-background border-accent">
            <DialogHeader>
              <DialogTitle className="text-foreground">Settle Market</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Select the winning outcome for: {selectedMarket?.description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              <Alert className="border-accent/20">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm text-muted-foreground">
                  This will distribute payouts to all winning bets and mark losing bets.
                  This action cannot be undone.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => selectedMarket && handleSettleMarket(selectedMarket, 'A')}
                  disabled={settleMarketMutation.isPending}
                  className="h-20 flex-col"
                  data-testid="button-settle-outcome-a"
                >
                  <div className="text-lg font-bold">{selectedMarket?.teamA}</div>
                  <div className="text-xs text-muted-foreground">Outcome A Wins</div>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => selectedMarket && handleSettleMarket(selectedMarket, 'B')}
                  disabled={settleMarketMutation.isPending}
                  className="h-20 flex-col"
                  data-testid="button-settle-outcome-b"
                >
                  <div className="text-lg font-bold">{selectedMarket?.teamB}</div>
                  <div className="text-xs text-muted-foreground">Outcome B Wins</div>
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setSettleDialogOpen(false)}
                data-testid="button-cancel-settle"
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-background border-accent max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-foreground">Edit Market</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Update market details. Pools and bets are not affected.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="space-y-1">
                <Label htmlFor="em-sport">Sport</Label>
                <select
                  id="em-sport"
                  value={editForm.sport}
                  onChange={(e) => setEditForm({ ...editForm, sport: e.target.value })}
                  className="w-full h-9 rounded-md bg-background border border-input px-2 text-sm"
                  data-testid="select-edit-sport"
                >
                  {availableSports.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="em-league">League</Label>
                <Input
                  id="em-league"
                  value={editForm.league}
                  onChange={(e) => setEditForm({ ...editForm, league: e.target.value })}
                  data-testid="input-edit-league"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="em-leagueId">League ID</Label>
                <Input
                  id="em-leagueId"
                  value={editForm.leagueId}
                  onChange={(e) => setEditForm({ ...editForm, leagueId: e.target.value })}
                  data-testid="input-edit-leagueId"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="em-teamA">Team A</Label>
                <Input
                  id="em-teamA"
                  value={editForm.teamA}
                  onChange={(e) => setEditForm({ ...editForm, teamA: e.target.value })}
                  data-testid="input-edit-teamA"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="em-teamB">Team B</Label>
                <Input
                  id="em-teamB"
                  value={editForm.teamB}
                  onChange={(e) => setEditForm({ ...editForm, teamB: e.target.value })}
                  data-testid="input-edit-teamB"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label htmlFor="em-desc">Description</Label>
                <Input
                  id="em-desc"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  data-testid="input-edit-description"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="em-time">Game Time</Label>
                <Input
                  id="em-time"
                  type="datetime-local"
                  value={editForm.gameTime}
                  onChange={(e) => setEditForm({ ...editForm, gameTime: e.target.value })}
                  data-testid="input-edit-gametime"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="em-bonus">Bonus Pool (BNB)</Label>
                <Input
                  id="em-bonus"
                  type="text"
                  value={editForm.bonusPool}
                  onChange={(e) => setEditForm({ ...editForm, bonusPool: e.target.value })}
                  data-testid="input-edit-bonus"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="em-logoA">Team A Logo URL</Label>
                <Input
                  id="em-logoA"
                  value={editForm.teamALogo}
                  onChange={(e) => setEditForm({ ...editForm, teamALogo: e.target.value })}
                  data-testid="input-edit-logoA"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="em-logoB">Team B Logo URL</Label>
                <Input
                  id="em-logoB"
                  value={editForm.teamBLogo}
                  onChange={(e) => setEditForm({ ...editForm, teamBLogo: e.target.value })}
                  data-testid="input-edit-logoB"
                />
              </div>
              <div className="col-span-2 flex items-center gap-3 pt-1">
                <Switch
                  id="em-live"
                  checked={editForm.isLive}
                  onCheckedChange={(c) => setEditForm({ ...editForm, isLive: c })}
                  data-testid="switch-edit-live"
                />
                <Label htmlFor="em-live">Mark as live (in-progress)</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setEditDialogOpen(false)}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateMarket}
                disabled={updateMarketMutation.isPending}
                data-testid="button-confirm-edit"
              >
                {updateMarketMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
          <DialogContent className="bg-background border-accent">
            <DialogHeader>
              <DialogTitle className="text-foreground">Refund Market</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Refund all open bets on: {refundMarket?.description}
              </DialogDescription>
            </DialogHeader>

            <div className="py-2 space-y-3">
              <Alert className="border-accent/20">
                <AlertCircle className="h-4 w-4 text-accent" />
                <AlertDescription className="text-sm text-muted-foreground">
                  All open bets on this market will be marked as refunded with their full
                  stake credited back as the payout. The market status becomes
                  <span className="font-semibold text-foreground"> refunded</span> and
                  cannot be settled afterwards.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setRefundDialogOpen(false)}
                data-testid="button-cancel-refund"
              >
                Cancel
              </Button>
              <Button
                onClick={() => refundMarket && refundMarketMutation.mutate(refundMarket.id)}
                disabled={refundMarketMutation.isPending}
                data-testid="button-confirm-refund"
              >
                {refundMarketMutation.isPending ? "Refunding..." : "Refund All Bets"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={betsDialogOpen} onOpenChange={setBetsDialogOpen}>
          <DialogContent className="bg-background border-accent max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">Bets on Market</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {betsMarket?.description}
              </DialogDescription>
            </DialogHeader>

            <div className="py-2">
              {betsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 bg-card" />
                  <Skeleton className="h-12 bg-card" />
                </div>
              ) : !betsData || betsData.bets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6" data-testid="text-no-bets">
                  No bets have been placed on this market yet.
                </p>
              ) : (
                <div className="space-y-1.5" data-testid="list-market-bets">
                  <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground px-2 pb-1 border-b border-accent/20">
                    <div className="col-span-5">Wallet</div>
                    <div className="col-span-2">Outcome</div>
                    <div className="col-span-2 text-right">Amount</div>
                    <div className="col-span-1 text-right">Odds</div>
                    <div className="col-span-2 text-right">Status</div>
                  </div>
                  {betsData.bets.map((bet) => (
                    <div
                      key={bet.id}
                      className="grid grid-cols-12 gap-2 text-xs items-center px-2 py-1.5 rounded bg-card/50"
                      data-testid={`row-bet-${bet.id}`}
                    >
                      <div className="col-span-5 font-mono truncate">{bet.userAddress}</div>
                      <div className="col-span-2">
                        <Badge variant="outline" className="text-xs">
                          {bet.outcome === 'A' ? betsData.market.teamA : betsData.market.teamB}
                        </Badge>
                      </div>
                      <div className="col-span-2 text-right font-mono">
                        {parseFloat(bet.amount).toFixed(4)} BNB
                      </div>
                      <div className="col-span-1 text-right font-mono">{bet.oddsAtBet}x</div>
                      <div className="col-span-2 text-right">
                        <Badge variant={bet.status === 'won' ? 'default' : 'outline'} className="text-xs">
                          {bet.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setBetsDialogOpen(false)}
                data-testid="button-close-bets"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
