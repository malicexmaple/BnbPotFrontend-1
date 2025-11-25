import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import GameFooter from "@/components/GameFooter";
import ChatSidebar from "@/components/ChatSidebar";
import ChatRulesModal from "@/components/ChatRulesModal";
import DailyStats from "@/components/DailyStats";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Settings, ChevronRight, ChevronDown, Flame,
  Tv, Calendar, Target, Gamepad2, CircleDot, 
  Dribbble, Trophy, Sword
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGameState } from "@/hooks/useGameState";
import GameLayout from "@/components/GameLayout";
import { BORDER_RADIUS } from "@/constants/layout";
import predictionMarketsLogo from '@assets/predictionmarketsnew_1763488010364.png';
import coinStack from '@assets/vecteezy_binance-coin-bnb-coin-stacks-cryptocurrency-3d-render_21627671_1763398880775.png';
import jackpotLegendsLogo from '@assets/jackpotlegends_1763742593143.png';
import signupLogo from '@assets/signupnew_1763410821936.png';

// Sport icons using lucide-react
const SportIcon = ({ sport }: { sport: string }) => {
  const iconClass = "w-4 h-4";
  const iconMap: Record<string, JSX.Element> = {
    'NFL': <Trophy className={iconClass} />,
    'CFB': <Trophy className={iconClass} />,
    'NBA': <Dribbble className={iconClass} />,
    'NHL': <Target className={iconClass} />,
    'CS2': <Gamepad2 className={iconClass} />,
    'Dota 2': <Gamepad2 className={iconClass} />,
    'Valorant': <Gamepad2 className={iconClass} />,
    'Football': <CircleDot className={iconClass} />,
    'Cricket': <Target className={iconClass} />,
    'Live': <Tv className={iconClass} />,
    'Futures': <Calendar className={iconClass} />,
  };
  return iconMap[sport] || <Target className={iconClass} />;
};

// Demo data for games
const demoGames = {
  live: [
    {
      id: 1,
      league: 'TEST (CRICKET)',
      time: 'LIVE',
      volume: '$313.37k Vol.',
      teams: [
        { code: 'IND', name: 'India', moneyline: 'IND 0.6¢', moneylineColor: '#22C55E' },
        { code: 'SOU', name: 'South Africa', moneyline: 'SOU 63¢', moneylineColor: '#6366F1' },
      ],
      draw: 'DRAW 37.2¢',
    }
  ],
  upcoming: [
    {
      id: 2,
      league: 'NBA',
      time: '11:00 AM',
      volume: '$278.37k Vol.',
      gameViews: 9,
      teams: [
        { code: 'ATL', name: 'Hawks', record: '11-7', moneyline: 'ATL 82¢', moneylineColor: '#E11D48', spread: 'ATL -8.5', spreadPrice: '59¢', total: 'O 236.5', totalPrice: '54¢' },
        { code: 'WAS', name: 'Wizards', record: '1-15', moneyline: 'WAS 19¢', moneylineColor: '#3B82F6', spread: 'WAS +8.5', spreadPrice: '42¢', total: 'U 236.5', totalPrice: '47¢' },
      ],
    },
    {
      id: 3,
      league: 'NBA',
      time: '12:00 PM',
      volume: '$605.55k Vol.',
      gameViews: 9,
      teams: [
        { code: 'ORL', name: 'Magic', record: '10-8', moneyline: 'ORL 55¢', moneylineColor: '#3B82F6', spread: 'ORL -1.5', spreadPrice: '51¢', total: 'O 228.5', totalPrice: '50¢' },
        { code: 'PHI', name: '76ers', record: '9-7', moneyline: 'PHI 46¢', moneylineColor: '#3B82F6', spread: 'PHI +1.5', spreadPrice: '50¢', total: 'U 228.5', totalPrice: '51¢' },
      ],
    },
    {
      id: 4,
      league: 'NBA',
      time: '3:00 PM',
      volume: '$564.90k Vol.',
      gameViews: 14,
      teams: [
        { code: 'LAC', name: 'Clippers', record: '5-12', moneyline: 'LAC 34¢', moneylineColor: '#6366F1', spread: 'LAC +5.5', spreadPrice: '52¢', total: 'O 228.5', totalPrice: '52¢' },
        { code: 'LAL', name: 'Lakers', record: '12-4', moneyline: 'LAL 67¢', moneylineColor: '#A855F7', spread: 'LAL -5.5', spreadPrice: '49¢', total: 'U 228.5', totalPrice: '50¢' },
      ],
    },
  ]
};

const popularSports = [
  { name: 'NFL', count: 16 },
  { name: 'CFB', count: 67 },
  { name: 'NBA', count: 39 },
  { name: 'NHL', count: 16 },
  { name: 'CS2', count: 8 },
  { name: 'Dota 2', count: 65 },
  { name: 'Valorant', count: 6 },
  { name: 'Football', count: null },
  { name: 'Cricket', count: null },
];

export default function PredictionMarkets() {
  const { address, isConnecting, walletError, connect, disconnect, shouldShowSignup, username, agreedToTerms, markSignupComplete, messages, isConnected, isAuthenticated, onlineUsers, sendMessage } = useGameState();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'live' | 'futures'>('live');
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [showSpreadsAndTotals, setShowSpreadsAndTotals] = useState(true);
  const [selectedGame, setSelectedGame] = useState<any>(demoGames.live[0]);
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [showChatRules, setShowChatRules] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [isLeaderboardCollapsed, setIsLeaderboardCollapsed] = useState(false);
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    referralCode: "",
    agreedToTerms: false
  });

  useEffect(() => {
    if (walletError) {
      toast({
        variant: "destructive",
        title: "Wallet Connection Failed",
        description: walletError,
      });
    }
  }, [walletError, toast]);

  const isDisabled = !address || !username;

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

  const handleTrade = () => {
    if (isDisabled) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: !address ? "Please connect your wallet to trade." : "Please create an account to trade.",
      });
      return;
    }
    
    if (!tradeAmount || parseFloat(tradeAmount) <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid trade amount.",
      });
      return;
    }

    toast({
      title: "Trade Placed!",
      description: `${tradeType === 'buy' ? 'Bought' : 'Sold'} $${tradeAmount} on ${selectedGame?.teams?.[0]?.name || 'selection'}`,
    });
    setTradeAmount('');
  };

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
        {/* Main game area content */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <div className="p-6 space-y-4 relative z-10 flex-shrink-0">
            {/* HEADER with Logo */}
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
              
              {/* Toggle for Spreads + Totals */}
              <div className="flex items-center gap-4">
                <Settings className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
                <div className="flex items-center gap-2">
                  <Switch
                    checked={showSpreadsAndTotals}
                    onCheckedChange={setShowSpreadsAndTotals}
                    data-testid="switch-pm-spreads"
                  />
                  <span className="text-xs text-muted-foreground">Spreads + Totals</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable content area */}
          <ScrollArea className="flex-1 px-6">
            <div className="flex gap-4" style={{minWidth: '1008px'}}>
              {/* Left: Sports Navigation */}
              <div className="flex-shrink-0" style={{width: '160px'}}>
                <div className="space-y-1">
                  {/* Live / Futures Tabs */}
                  <button
                    onClick={() => setActiveTab('live')}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === 'live' 
                        ? 'bg-primary/20 text-primary border border-primary/30' 
                        : 'text-muted-foreground hover-elevate'
                    }`}
                    data-testid="button-pm-live"
                  >
                    <SportIcon sport="Live" />
                    <span>Live</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('futures')}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === 'futures' 
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                        : 'text-muted-foreground hover-elevate'
                    }`}
                    data-testid="button-pm-futures"
                  >
                    <SportIcon sport="Futures" />
                    <span>Futures</span>
                  </button>

                  {/* Popular Section */}
                  <div className="pt-3 mt-3 border-t border-border/30">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider px-3 py-1">Popular</div>
                    {popularSports.map((sport) => (
                      <button
                        key={sport.name}
                        onClick={() => setSelectedSport(sport.name)}
                        className={`w-full flex items-center justify-between gap-1 px-3 py-1.5 rounded text-xs transition-all ${
                          selectedSport === sport.name 
                            ? 'bg-white/10 text-foreground' 
                            : 'text-muted-foreground hover-elevate'
                        }`}
                        data-testid={`button-pm-sport-${sport.name.toLowerCase()}`}
                      >
                        <div className="flex items-center gap-2">
                          <SportIcon sport={sport.name} />
                          <span>{sport.name}</span>
                        </div>
                        {sport.count && (
                          <span className="text-xs text-muted-foreground">{sport.count}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Center: Games List */}
              <div className="flex-1 space-y-4">
                {/* Live Section Header */}
                <h2 className="text-2xl font-bold text-foreground italic">Live</h2>

                {/* Live Games */}
                {demoGames.live.map((game) => (
                  <div key={game.id} className="space-y-2">
                    <div className="text-sm font-bold text-foreground">{game.league}</div>
                    <div 
                      className="p-3 rounded-lg cursor-pointer hover-elevate transition-all"
                      style={{ background: 'rgba(30, 30, 35, 0.8)', border: '1px solid rgba(60, 60, 60, 0.3)' }}
                      onClick={() => setSelectedGame(game)}
                      data-testid={`card-pm-game-${game.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5">LIVE</Badge>
                          <span className="text-xs text-muted-foreground">{game.volume}</span>
                        </div>
                        <button className="text-xs text-primary hover:underline">Game view</button>
                      </div>
                      
                      {game.teams.map((team, idx) => (
                        <div key={idx} className="flex items-center justify-between py-1.5">
                          <div className="flex items-center gap-2">
                            <Badge 
                              className="font-bold text-xs px-1.5"
                              style={{ background: team.moneylineColor, color: 'white' }}
                            >
                              {team.code}
                            </Badge>
                            <span className="text-sm text-foreground">{team.name}</span>
                          </div>
                          <button
                            className={`px-3 py-1 rounded font-bold text-xs text-white transition-all ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover-elevate'}`}
                            style={{ background: team.moneylineColor }}
                            disabled={isDisabled}
                            data-testid={`button-pm-bet-${game.id}-${idx}`}
                          >
                            {team.moneyline}
                          </button>
                        </div>
                      ))}
                      {game.draw && (
                        <div className="flex justify-center mt-1">
                          <span className="text-xs text-muted-foreground">{game.draw}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Starting Soon Section */}
                <div className="pt-4">
                  <h2 className="text-xl font-bold text-foreground">Starting Soon</h2>
                  <div className="text-xs text-muted-foreground mb-3">Tue, November 25</div>

                  {/* Column Headers */}
                  <div className="flex items-center text-xs text-muted-foreground uppercase tracking-wider mb-2 px-3">
                    <div className="flex-1">NBA</div>
                    <div className="w-20 text-center">Moneyline</div>
                    {showSpreadsAndTotals && (
                      <>
                        <div className="w-24 text-center">Spread</div>
                        <div className="w-24 text-center">Total</div>
                      </>
                    )}
                  </div>

                  {/* Upcoming Games */}
                  {demoGames.upcoming.map((game) => (
                    <div 
                      key={game.id}
                      className="p-3 rounded-lg cursor-pointer hover-elevate transition-all mb-2"
                      style={{ background: 'rgba(30, 30, 35, 0.8)', border: '1px solid rgba(60, 60, 60, 0.3)' }}
                      onClick={() => setSelectedGame(game)}
                      data-testid={`card-pm-game-${game.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-foreground">{game.time}</span>
                          <span className="text-xs text-muted-foreground">{game.volume}</span>
                        </div>
                        <button className="text-xs text-muted-foreground hover:text-primary">
                          {game.gameViews} Game View
                        </button>
                      </div>

                      {game.teams.map((team, idx) => (
                        <div key={idx} className="flex items-center py-1">
                          <div className="flex-1 flex items-center gap-2">
                            <Badge 
                              className="font-bold text-xs px-1.5"
                              style={{ background: team.moneylineColor, color: 'white' }}
                            >
                              {team.code}
                            </Badge>
                            <span className="text-xs text-foreground">{team.name}</span>
                            <span className="text-xs text-muted-foreground">{team.record}</span>
                          </div>
                          
                          {/* Moneyline */}
                          <div className="w-20 flex justify-center">
                            <button
                              className={`px-2 py-1 rounded font-bold text-xs text-white transition-all ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover-elevate'}`}
                              style={{ background: team.moneylineColor }}
                              disabled={isDisabled}
                            >
                              {team.moneyline}
                            </button>
                          </div>

                          {/* Spread */}
                          {showSpreadsAndTotals && (
                            <div className="w-24 flex justify-center gap-1">
                              <span className="text-xs text-muted-foreground">{team.spread}</span>
                              <span className="text-xs font-bold text-foreground">{team.spreadPrice}</span>
                            </div>
                          )}

                          {/* Total */}
                          {showSpreadsAndTotals && (
                            <div className="w-24 flex justify-center gap-1">
                              <span className="text-xs text-muted-foreground">{team.total}</span>
                              <span className="text-xs font-bold text-foreground">{team.totalPrice}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Trading Panel */}
              <div className="flex-shrink-0" style={{width: '220px'}}>
                <div className="p-3 rounded-lg space-y-3" style={{ 
                  background: 'rgba(30, 30, 35, 0.8)', 
                  border: '1px solid rgba(60, 60, 60, 0.3)' 
                }}>
                  {/* Selected Game Header */}
                  {selectedGame && (
                    <div className="text-center">
                      <div className="text-sm font-bold text-foreground">
                        {selectedGame.teams?.[0]?.name || 'Team 1'} vs {selectedGame.teams?.[1]?.name || 'Team 2'}
                      </div>
                      <div className="text-xs text-primary">{selectedGame.teams?.[0]?.code || 'T1'}</div>
                    </div>
                  )}

                  {/* Buy / Sell Tabs */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTradeType('buy')}
                        className={`px-3 py-1 text-xs font-medium transition-all ${
                          tradeType === 'buy' 
                            ? 'text-foreground border-b border-foreground' 
                            : 'text-muted-foreground'
                        }`}
                        data-testid="button-pm-buy"
                      >
                        Buy
                      </button>
                      <button
                        onClick={() => setTradeType('sell')}
                        className={`px-3 py-1 text-xs font-medium transition-all ${
                          tradeType === 'sell' 
                            ? 'text-foreground border-b border-foreground' 
                            : 'text-muted-foreground'
                        }`}
                        data-testid="button-pm-sell"
                      >
                        Sell
                      </button>
                    </div>
                    <span className="text-xs text-muted-foreground">Market</span>
                  </div>

                  {/* Yes / No Price Buttons */}
                  <div className="flex gap-2">
                    <button
                      className={`flex-1 py-2 rounded font-bold text-xs transition-all ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover-elevate'}`}
                      style={{ background: '#22C55E', color: 'white' }}
                      disabled={isDisabled}
                      data-testid="button-pm-yes"
                    >
                      Yes 0.6¢
                    </button>
                    <button
                      className={`flex-1 py-2 rounded font-bold text-xs transition-all ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover-elevate'}`}
                      style={{ background: 'rgba(60, 60, 60, 0.8)', color: 'white' }}
                      disabled={isDisabled}
                      data-testid="button-pm-no"
                    >
                      No 99.8¢
                    </button>
                  </div>

                  {/* Amount Input */}
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">Amount</div>
                    <div className={`flex items-center justify-between px-3 py-2 rounded ${isDisabled ? 'opacity-50' : ''}`} style={{
                      background: 'rgba(15, 15, 15, 0.8)',
                      border: '1px solid rgba(60, 60, 60, 0.5)'
                    }}>
                      <span className="text-lg font-bold text-foreground">$</span>
                      <input
                        type="text"
                        value={tradeAmount}
                        onChange={(e) => setTradeAmount(e.target.value)}
                        placeholder="0"
                        className="w-full text-right text-lg font-bold bg-transparent border-0 outline-none text-foreground"
                        disabled={isDisabled}
                        data-testid="input-pm-amount"
                      />
                    </div>
                    
                    {/* Quick Amount Buttons */}
                    <div className="flex gap-1">
                      {[1, 20, 100].map((amt) => (
                        <button
                          key={amt}
                          onClick={() => setTradeAmount(String((parseFloat(tradeAmount) || 0) + amt))}
                          className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover-elevate'}`}
                          style={{ background: 'rgba(60, 60, 60, 0.5)' }}
                          disabled={isDisabled}
                        >
                          +${amt}
                        </button>
                      ))}
                      <button
                        onClick={() => setTradeAmount('1000')}
                        className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover-elevate'}`}
                        style={{ background: 'rgba(60, 60, 60, 0.5)' }}
                        disabled={isDisabled}
                      >
                        Max
                      </button>
                    </div>
                  </div>

                  {/* Trade Button */}
                  <button
                    onClick={handleTrade}
                    className={`w-full py-2 rounded font-bold text-xs transition-all ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover-elevate active-elevate-2'}`}
                    style={{ background: '#22C55E', color: 'white' }}
                    disabled={isDisabled}
                    data-testid="button-pm-trade"
                  >
                    Trade
                  </button>

                  {/* Auth Message */}
                  {isDisabled && (
                    <div className="text-xs text-muted-foreground text-center" data-testid="text-pm-auth-required">
                      {!address ? "Connect wallet to trade" : "Create account to trade"}
                    </div>
                  )}

                  {/* Terms */}
                  <div className="text-xs text-muted-foreground text-center">
                    By trading, you agree to the <span className="text-primary underline cursor-pointer">Terms of Use</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </GameLayout>

      {/* Signup Modal */}
      <Dialog open={shouldShowSignup} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md glass-panel neon-border" style={{borderRadius: '18px'}}>
          <DialogHeader>
            <DialogTitle className="text-center">
              <img src={signupLogo} alt="Sign Up" className="h-16 mx-auto mb-2" />
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              Create your account to start trading
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Username</label>
              <input
                type="text"
                value={signupData.name}
                onChange={(e) => setSignupData({...signupData, name: e.target.value})}
                className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border/50 text-foreground"
                placeholder="Enter username"
                data-testid="input-pm-signup-name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Email</label>
              <input
                type="email"
                value={signupData.email}
                onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border/50 text-foreground"
                placeholder="Enter email"
                data-testid="input-pm-signup-email"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={signupData.agreedToTerms}
                onChange={(e) => setSignupData({...signupData, agreedToTerms: e.target.checked})}
                className="w-4 h-4"
                data-testid="checkbox-pm-terms"
              />
              <span className="text-xs text-muted-foreground">
                I agree to the <span className="text-primary">Terms & Conditions</span>
              </span>
            </div>
            <Button 
              onClick={handleSignupSubmit}
              className="w-full"
              data-testid="button-pm-signup-submit"
            >
              Create Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Rules Modal */}
      <ChatRulesModal 
        open={showChatRules} 
        onOpenChange={setShowChatRules} 
      />
    </>
  );
}
