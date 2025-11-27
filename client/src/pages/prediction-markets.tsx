import { useState, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import GameFooter from "@/components/GameFooter";
import ChatSidebar from "@/components/ChatSidebar";
import ChatRulesModal from "@/components/ChatRulesModal";
import DailyStats from "@/components/DailyStats";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ChevronDown, Flame, Tv, Calendar, LayoutGrid, List, Trophy
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGameState } from "@/hooks/useGameState";
import GameLayout from "@/components/GameLayout";
import { PredictionMarketCard, type PredictionMarket } from "@/components/PredictionMarketCard";
import { PredictionMarketPane } from "@/components/PredictionMarketPane";
import { BetSlipDialog } from "@/components/BetSlipDialog";
import predictionMarketsLogo from '@assets/predictionmarketsnew_1763488010364.png';
import coinStack from '@assets/vecteezy_binance-coin-bnb-coin-stacks-cryptocurrency-3d-render_21627671_1763398880775.png';
import jackpotLegendsLogo from '@assets/jackpotlegends_1763742593143.png';
import signupLogo from '@assets/signupnew_1763410821936.png';
import { sportsData, type Sport } from "@shared/sports-leagues";
import { getSportIcon } from "@/lib/leagueUtils";

const SportIconImage = ({ sport, className = "w-4 h-4" }: { sport: Sport; className?: string }) => {
  const iconPath = getSportIcon(sport.id);
  return (
    <img 
      src={iconPath} 
      alt={sport.name} 
      className={`${className} object-contain brightness-0 invert opacity-70`}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
};

const SportIcon = ({ sport }: { sport: string }) => {
  const iconClass = "w-5 h-5";
  const sportData = sportsData.find(s => s.name === sport || s.id === sport);
  
  if (sportData) {
    return <SportIconImage sport={sportData} className={iconClass} />;
  }
  
  const iconMap: Record<string, JSX.Element> = {
    'Live': <Tv className={iconClass} />,
    'Futures': <Calendar className={iconClass} />,
    'Featured': <Trophy className={iconClass} />,
  };
  return iconMap[sport] || <Trophy className={iconClass} />;
};

const demoMarkets: PredictionMarket[] = [
  {
    id: 'market-1',
    sport: 'Basketball',
    league: 'NBA',
    leagueId: '4387',
    teamA: 'Lakers',
    teamB: 'Celtics',
    description: 'Regular Season - Who will win?',
    gameTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    status: 'active',
    poolATotal: '0.523',
    poolBTotal: '0.481',
    bonusPool: '0.05',
    teamAColor: '#552583',
    teamBColor: '#007A33',
  },
  {
    id: 'market-2',
    sport: 'Football',
    league: 'English Premier League',
    leagueId: '4328',
    teamA: 'Liverpool',
    teamB: 'Manchester United',
    description: 'Premier League Match - Winner',
    gameTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
    status: 'active',
    poolATotal: '0.892',
    poolBTotal: '0.654',
    bonusPool: '0.1',
    teamAColor: '#C8102E',
    teamBColor: '#DA291C',
  },
  {
    id: 'market-3',
    sport: 'Football',
    league: 'UEFA Champions League',
    leagueId: '4480',
    teamA: 'Barcelona',
    teamB: 'Bayern Munich',
    description: 'Champions League Quarterfinal',
    gameTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    status: 'active',
    poolATotal: '1.234',
    poolBTotal: '1.456',
    bonusPool: '0.2',
    teamAColor: '#A50044',
    teamBColor: '#DC052D',
  },
  {
    id: 'market-4',
    sport: 'Cricket',
    league: 'Indian Premier League',
    leagueId: '4707',
    teamA: 'Mumbai Indians',
    teamB: 'Chennai Super Kings',
    description: 'IPL Match - Winner Takes All',
    gameTime: new Date(Date.now() - 30 * 60 * 1000),
    status: 'active',
    poolATotal: '0.765',
    poolBTotal: '0.823',
    bonusPool: '0.15',
    teamAColor: '#004BA0',
    teamBColor: '#FFCB05',
  },
  {
    id: 'market-5',
    sport: 'Basketball',
    league: 'NBA',
    leagueId: '4387',
    teamA: 'Warriors',
    teamB: 'Suns',
    description: 'Western Conference Showdown',
    gameTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
    status: 'active',
    poolATotal: '0.445',
    poolBTotal: '0.512',
    bonusPool: '0.08',
    teamAColor: '#1D428A',
    teamBColor: '#E56020',
  },
  {
    id: 'market-6',
    sport: 'Tennis',
    league: 'ATP Tour',
    leagueId: '4464',
    teamA: 'Djokovic',
    teamB: 'Alcaraz',
    description: 'Grand Slam Final',
    gameTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
    status: 'active',
    poolATotal: '0.678',
    poolBTotal: '0.721',
    bonusPool: '0.12',
  },
];

export default function PredictionMarkets() {
  const { address, walletError, shouldShowSignup, username, markSignupComplete, messages, onlineUsers, sendMessage } = useGameState();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'featured' | 'live' | 'upcoming'>('featured');
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [expandedSport, setExpandedSport] = useState<string | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'pane'>(() => {
    const saved = localStorage.getItem('pm-view-mode');
    return (saved === 'pane' || saved === 'grid') ? saved : 'grid';
  });
  const [showChatRules, setShowChatRules] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [isLeaderboardCollapsed, setIsLeaderboardCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [betSlipOpen, setBetSlipOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<{
    id: string;
    outcome: 'A' | 'B';
    teamName: string;
    odds: number;
  } | null>(null);
  
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    referralCode: "",
    agreedToTerms: false
  });

  useEffect(() => {
    localStorage.setItem('pm-view-mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (walletError) {
      toast({
        variant: "destructive",
        title: "Wallet Connection Failed",
        description: walletError,
      });
    }
  }, [walletError, toast]);

  const handleSendMessage = (message: string) => {
    if (!address) {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "Please connect your wallet to chat.",
      });
      return;
    }

    if (!username) {
      toast({
        variant: "destructive",
        title: "Username Required",
        description: "Please complete signup to use chat.",
      });
      return;
    }

    const success = sendMessage(message);
    if (!success) {
      toast({
        variant: "destructive",
        title: "Failed to Send",
        description: "Could not send message. Please try again.",
      });
    }
  };

  const isDisabled = !address || !username;

  const handlePlaceBet = (marketId: string, outcome: 'A' | 'B', odds: number) => {
    if (isDisabled) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: !address ? "Please connect your wallet to place bets." : "Please create an account to place bets.",
      });
      return;
    }

    const market = demoMarkets.find(m => m.id === marketId);
    if (!market) return;

    const teamName = outcome === 'A' ? market.teamA : market.teamB;
    setSelectedBet({ id: marketId, outcome, teamName, odds });
    setBetSlipOpen(true);
  };

  const handleConfirmBet = async (amount: string) => {
    if (!selectedBet) return;

    toast({
      title: "Bet Placed!",
      description: `Successfully bet ${amount} BNB on ${selectedBet.teamName} at ${selectedBet.odds.toFixed(2)}x odds`,
    });
  };

  const handleSignupSubmit = async () => {
    if (!signupData.name || !signupData.email || !signupData.agreedToTerms) {
      toast({
        variant: "destructive",
        title: "Incomplete Form",
        description: "Please fill in all required fields and agree to the terms.",
      });
      return;
    }

    try {
      await apiRequest("POST", "/api/users/signup", {
        username: signupData.name,
        email: signupData.email
      });

      markSignupComplete(signupData.name);

      toast({
        title: "Account Created",
        description: `Welcome to BNBPOT, ${signupData.name}!`,
      });

      setSignupData({ name: "", email: "", referralCode: "", agreedToTerms: false });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: error instanceof Error ? error.message : "Failed to create account. Please try again.",
      });
    }
  };

  const filteredMarkets = demoMarkets.filter(market => {
    if (selectedSport && market.sport.toLowerCase() !== sportsData.find(s => s.id === selectedSport)?.name.toLowerCase()) {
      return false;
    }
    if (selectedLeague) {
      if (market.leagueId && market.leagueId !== selectedLeague) {
        return false;
      }
    }
    const gameTime = new Date(market.gameTime);
    const now = new Date();
    const isLive = gameTime <= now && market.status === 'active';
    const isUpcoming = gameTime > now;
    
    if (activeTab === 'live') return isLive;
    if (activeTab === 'upcoming') return isUpcoming;
    return true;
  });

  return (
    <>
      <GameLayout
        leftSidebar={
          <ChatSidebar
            isCollapsed={isChatCollapsed}
            onToggleCollapse={() => setIsChatCollapsed(!isChatCollapsed)}
            messages={messages}
            onSendMessage={handleSendMessage}
            canChat={!!address && !!username}
            placeholderText={!address ? "Connect wallet to chat..." : !username ? "Complete signup to chat..." : "Type Message Here..."}
            onlineUsers={onlineUsers}
            onShowChatRules={() => setShowChatRules(true)}
          />
        }
        rightSidebar={
          <div className="hidden lg:block flex-shrink-0 space-y-3 transition-all duration-300 relative glass-panel" style={{
            width: isLeaderboardCollapsed ? '0px' : '345px',
            paddingLeft: '0px',
            paddingTop: isLeaderboardCollapsed ? '0px' : '24px',
            paddingBottom: isLeaderboardCollapsed ? '0px' : '24px',
            paddingRight: '0px',
            overflow: 'visible',
            zIndex: 50,
            borderRadius: '0px',
            display: 'flex',
            flexDirection: 'column',
            alignSelf: 'stretch'
          }}>
            <button
              onClick={() => setIsLeaderboardCollapsed(!isLeaderboardCollapsed)}
              className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center hover-elevate active-elevate-2 transition-all duration-300"
              style={{
                right: isLeaderboardCollapsed ? '71px' : 'calc(100% - 324px)',
                zIndex: 9999,
                borderRadius: isLeaderboardCollapsed ? '8px' : '4px',
                width: isLeaderboardCollapsed ? '89px' : '34px',
                height: '79px',
                background: 'rgba(20, 20, 20, 1)',
                border: '1px solid rgba(60, 60, 60, 0.4)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 2px 8px rgba(0, 0, 0, 0.5)'
              }}
              data-testid="button-collapse-leaderboard"
            >
              {isLeaderboardCollapsed ? (
                <Flame className="w-8 h-8 text-white" />
              ) : (
                <svg className="w-3 h-3 text-foreground transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          
            {!isLeaderboardCollapsed && (
              <div style={{marginTop: '-85px', marginLeft: '23px'}}>
                <div className="p-1" style={{width: '297px'}}>
                  <div className="glass-panel p-4 neon-border relative" style={{borderRadius: '18px', overflow: 'visible'}}>
                    <div className="absolute -top-2 -right-2 w-20 h-20 z-10 group cursor-pointer">
                      <img src={coinStack} alt="Coins" className="w-20 h-20 wiggle-on-hover" />
                    </div>
                    <div className="flex items-center justify-start mb-3">
                      <img src={jackpotLegendsLogo} alt="Jackpot Legends" className="h-auto" style={{maxWidth: '200px', width: '200px'}} />
                    </div>
                    <div className="text-xs text-muted-foreground mb-4 uppercase tracking-wider text-center">TOP 3 BIGGEST WINNERS</div>
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-background/50 rounded hover-elevate">
                          <Badge className="gradient-purple-pink text-black font-bold">{i}</Badge>
                          <div className="flex-1 text-sm font-medium">Player{i}</div>
                          <div className="font-mono font-bold no-text-shadow" style={{color: '#FFFFFF', fontSize: '1.01rem'}}>0.188</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div style={{width: '100%', maxWidth: '297px', marginTop: '5px'}}>
                  <DailyStats type="latest" />
                </div>

                <div style={{width: '100%', maxWidth: '297px', marginTop: '10px'}}>
                  <DailyStats type="winner" />
                </div>
                <div style={{width: '100%', maxWidth: '297px', marginTop: '10px'}}>
                  <DailyStats type="lucky" />
                </div>
              </div>
            )}
          </div>
        }
        footer={<GameFooter />}
      >
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <div className="p-6 space-y-4 flex-shrink-0">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-col">
                <div className="shine-image" style={{'--shine-mask': `url(${predictionMarketsLogo})`} as React.CSSProperties}>
                  <img src={predictionMarketsLogo} alt="PREDICTION MARKETS" className="w-full max-w-[450px]" style={{height: 'auto'}} />
                </div>
                <div className="flex justify-end pr-4" style={{marginTop: '-15px'}}>
                  <div className="text-sm uppercase tracking-widest shine-text font-semibold italic" style={{
                    color: 'rgb(161, 161, 170)',
                    textShadow: '0 0 10px rgba(234, 179, 8, 0.3)',
                    letterSpacing: '0.15em'
                  }}>
                    Predict the future...
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
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
          </div>

          <ScrollArea className="flex-1 px-6">
            <div className="flex gap-6">
              <div className="hidden lg:block flex-shrink-0" style={{width: '200px'}}>
                <div className="space-y-1 sticky top-0">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider px-3 py-2 font-bold">
                    <span className="text-foreground">LIVE</span> <span className="text-primary">MARKETS</span>
                  </div>
                  
                  <button
                    onClick={() => { setActiveTab('featured'); setSelectedSport(null); setSelectedLeague(null); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === 'featured' && !selectedSport
                        ? 'bg-primary/20 text-primary border border-primary/30' 
                        : 'text-muted-foreground hover-elevate'
                    }`}
                    data-testid="button-pm-featured"
                  >
                    <SportIcon sport="Featured" />
                    <span className="flex-1 text-left">Featured</span>
                    <span className="font-mono text-xs text-primary">{demoMarkets.length}</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('live')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === 'live' 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                        : 'text-muted-foreground hover-elevate'
                    }`}
                    data-testid="button-pm-live"
                  >
                    <Tv className="w-5 h-5" />
                    <span className="flex-1 text-left">Live</span>
                    <span className="font-mono text-xs">{demoMarkets.filter(m => new Date(m.gameTime) <= new Date()).length}</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === 'upcoming' 
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                        : 'text-muted-foreground hover-elevate'
                    }`}
                    data-testid="button-pm-upcoming"
                  >
                    <Calendar className="w-5 h-5" />
                    <span className="flex-1 text-left">Upcoming</span>
                    <span className="font-mono text-xs">{demoMarkets.filter(m => new Date(m.gameTime) > new Date()).length}</span>
                  </button>

                  <div className="pt-4 mt-4 border-t border-border/30">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider px-3 py-2 font-bold">
                      <span className="text-foreground">SPORTS</span> <span className="text-primary">MARKETS</span>
                    </div>
                    
                    {sportsData.slice(0, 12).map((sport) => (
                      <div key={sport.id}>
                        <button
                          onClick={() => {
                            if (expandedSport === sport.id) {
                              setExpandedSport(null);
                            } else {
                              setExpandedSport(sport.id);
                            }
                            setSelectedSport(sport.id);
                            setSelectedLeague(null);
                            setActiveTab('featured');
                          }}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                            selectedSport === sport.id 
                              ? 'bg-white/10 text-foreground' 
                              : 'text-muted-foreground hover-elevate'
                          }`}
                          data-testid={`button-pm-sport-${sport.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <SportIcon sport={sport.id} />
                            <span>{sport.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ChevronDown className={`w-4 h-4 transition-transform ${expandedSport === sport.id ? 'rotate-180' : ''}`} />
                          </div>
                        </button>
                        
                        {expandedSport === sport.id && (
                          <div className="ml-6 mt-1 mb-2 space-y-0.5 max-h-64 overflow-y-auto">
                            {sport.leagues.slice(0, 15).map((league) => (
                              <button
                                key={league.id}
                                onClick={() => {
                                  setSelectedLeague(league.id);
                                  setActiveTab('featured');
                                }}
                                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-all ${
                                  selectedLeague === league.id 
                                    ? 'bg-primary/20 text-primary' 
                                    : 'text-muted-foreground hover:bg-white/5'
                                }`}
                                data-testid={`button-pm-league-${league.id}`}
                              >
                                {league.badge ? (
                                  <img 
                                    src={league.badge} 
                                    alt={league.displayName}
                                    className="w-5 h-5 object-contain flex-shrink-0"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-muted flex-shrink-0" />
                                )}
                                <span className="truncate">{league.displayName}</span>
                              </button>
                            ))}
                            {sport.leagues.length > 15 && (
                              <div className="text-xs text-muted-foreground px-3 py-1">
                                +{sport.leagues.length - 15} more
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-1 pb-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">
                    <span className="text-foreground">
                      {activeTab === 'featured' ? 'FEATURED' : activeTab === 'live' ? 'LIVE' : 'UPCOMING'}
                    </span>
                    <span className="text-primary ml-2">MARKETS</span>
                  </h2>
                  
                  {selectedSport && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => { setSelectedSport(null); setSelectedLeague(null); }}
                      className="text-muted-foreground"
                    >
                      Clear Filter
                    </Button>
                  )}
                </div>

                {isLoading ? (
                  <div className={viewMode === 'grid' ? "grid md:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-3"}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Skeleton key={i} className={viewMode === 'grid' ? "h-64 bg-card" : "h-24 bg-card"} />
                    ))}
                  </div>
                ) : filteredMarkets.length > 0 ? (
                  viewMode === 'grid' ? (
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredMarkets.map((market) => (
                        <PredictionMarketCard
                          key={market.id}
                          market={market}
                          onPlaceBet={handlePlaceBet}
                          disabled={isDisabled}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredMarkets.map((market) => (
                        <PredictionMarketPane
                          key={market.id}
                          market={market}
                          onPlaceBet={handlePlaceBet}
                          disabled={isDisabled}
                        />
                      ))}
                    </div>
                  )
                ) : (
                  <div className="text-center py-12 bg-card rounded-lg border border-border">
                    <p className="text-muted-foreground text-lg">No active markets</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Check back soon for new betting opportunities!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>
      </GameLayout>

      <BetSlipDialog
        open={betSlipOpen}
        onClose={() => setBetSlipOpen(false)}
        marketId={selectedBet?.id || null}
        outcome={selectedBet?.outcome || null}
        teamName={selectedBet?.teamName || ''}
        currentOdds={selectedBet?.odds || 2.0}
        onConfirm={handleConfirmBet}
      />

      <Dialog open={shouldShowSignup} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md glass-panel neon-border" style={{borderRadius: '18px'}}>
          <DialogHeader>
            <DialogTitle className="text-center">
              <img src={signupLogo} alt="Sign Up" className="h-16 mx-auto mb-2" />
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input
                placeholder="Enter your username"
                value={signupData.name}
                onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                data-testid="input-signup-username"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={signupData.email}
                onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                data-testid="input-signup-email"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Referral Code (Optional)</label>
              <Input
                placeholder="Enter referral code"
                value={signupData.referralCode}
                onChange={(e) => setSignupData({ ...signupData, referralCode: e.target.value })}
                data-testid="input-signup-referral"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="terms"
                checked={signupData.agreedToTerms}
                onCheckedChange={(checked) => setSignupData({ ...signupData, agreedToTerms: !!checked })}
                data-testid="checkbox-signup-terms"
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground">
                I agree to the <span className="text-primary underline cursor-pointer">Terms of Service</span>
              </label>
            </div>
            <Button 
              className="w-full" 
              onClick={handleSignupSubmit}
              disabled={!signupData.name || !signupData.email || !signupData.agreedToTerms}
              data-testid="button-signup-submit"
            >
              Create Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ChatRulesModal open={showChatRules} onOpenChange={setShowChatRules} />
    </>
  );
}
