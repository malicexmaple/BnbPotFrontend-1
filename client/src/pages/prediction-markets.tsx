import { useState, useEffect } from "react";
import GameNavigation from "@/components/GameNavigation";
import GameFooter from "@/components/GameFooter";
import ProfileModal from "@/components/ProfileModal";
import ChatRulesModal from "@/components/ChatRulesModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, ChevronRight, ChevronDown, 
  Tv, Calendar, Target, Gamepad2, CircleDot, 
  Dribbble, Trophy, Sword
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGameState } from "@/hooks/useGameState";
import GameLayout from "@/components/GameLayout";
import { BORDER_RADIUS } from "@/constants/layout";

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
    'American Football': <Trophy className={iconClass} />,
    'Basketball': <Dribbble className={iconClass} />,
    'Hockey': <Target className={iconClass} />,
    'Tennis': <CircleDot className={iconClass} />,
    'Esports': <Gamepad2 className={iconClass} />,
    'Baseball': <CircleDot className={iconClass} />,
    'Golf': <Target className={iconClass} />,
    'UFC': <Sword className={iconClass} />,
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
        { code: '9', name: 'IND India', moneyline: 'IND 0.6¢', moneylineColor: '#22C55E' },
        { code: '489', name: 'SOU South Africa', moneyline: 'SOU 63¢', moneylineColor: '#6366F1' },
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
    {
      id: 5,
      league: 'UCL',
      time: '4:45 AM',
      volume: '$174.70k Vol.',
      gameViews: 6,
      teams: [
        { code: 'GAL', name: 'Galatasaray SK', record: '3-0-1', moneyline: 'GAL 58¢', moneylineColor: '#F97316', spread: 'GAL -1.5', spreadPrice: '34¢', total: 'O 2.5', totalPrice: '63¢' },
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

const allSports = [
  'American Football', 'Basketball', 'Hockey', 'Tennis', 'Esports', 'Baseball', 'Football', 'Cricket', 'Golf', 'UFC'
];

export default function PredictionMarkets() {
  const { address, isConnecting, walletError, connect, disconnect, username } = useGameState();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'live' | 'futures'>('live');
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [showSpreadsAndTotals, setShowSpreadsAndTotals] = useState(true);
  const [selectedGame, setSelectedGame] = useState<any>(demoGames.live[0]);
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [expandedSports, setExpandedSports] = useState<string[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChatRules, setShowChatRules] = useState(false);

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

  const toggleSportExpanded = (sport: string) => {
    setExpandedSports(prev => 
      prev.includes(sport) ? prev.filter(s => s !== sport) : [...prev, sport]
    );
  };

  return (
    <>
      <GameLayout
        header={
          <GameNavigation 
            onConnect={connect} 
            onDisconnect={disconnect} 
            isConnected={!!address} 
            isConnecting={isConnecting} 
            walletAddress={address || undefined} 
            username={username || undefined} 
            onOpenProfile={() => setShowProfileModal(true)} 
          />
        }
        leftSidebar={
          /* Sports Navigation Sidebar */
          <div className="flex-shrink-0 glass-panel" style={{
            width: '200px',
            borderRadius: '0px',
            display: 'flex',
            flexDirection: 'column',
            alignSelf: 'stretch',
            borderRight: '1px solid rgba(60, 60, 60, 0.3)'
          }}>
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-1">
                {/* Live / Futures Tabs */}
                <div className="space-y-1 mb-4">
                  <button
                    onClick={() => setActiveTab('live')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
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
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === 'futures' 
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                        : 'text-muted-foreground hover-elevate'
                    }`}
                    data-testid="button-pm-futures"
                  >
                    <SportIcon sport="Futures" />
                    <span>Futures</span>
                  </button>
                </div>

                {/* Popular Section */}
                <div className="pt-2 border-t border-border/30">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider px-3 py-2">Popular</div>
                  {popularSports.map((sport) => (
                    <button
                      key={sport.name}
                      onClick={() => setSelectedSport(sport.name)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                        selectedSport === sport.name 
                          ? 'bg-white/10 text-foreground' 
                          : 'text-muted-foreground hover-elevate'
                      }`}
                      data-testid={`button-pm-sport-${sport.name.toLowerCase()}`}
                    >
                      <div className="flex items-center gap-3">
                        <SportIcon sport={sport.name} />
                        <span>{sport.name}</span>
                      </div>
                      {sport.count && (
                        <span className="text-xs text-muted-foreground">{sport.count}</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* All Sports Section */}
                <div className="pt-4 border-t border-border/30">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider px-3 py-2">All Sports</div>
                  {allSports.map((sport) => (
                    <button
                      key={sport}
                      onClick={() => toggleSportExpanded(sport)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-all text-muted-foreground hover-elevate`}
                      data-testid={`button-pm-allsport-${sport.toLowerCase().replace(' ', '-')}`}
                    >
                      <div className="flex items-center gap-3">
                        <SportIcon sport={sport} />
                        <span>{sport}</span>
                      </div>
                      {expandedSports.includes(sport) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>
        }
        rightSidebar={
          /* Trading Panel */
          <div className="hidden lg:flex flex-shrink-0 glass-panel flex-col" style={{
            width: '280px',
            borderRadius: '0px',
            alignSelf: 'stretch',
            borderLeft: '1px solid rgba(60, 60, 60, 0.3)'
          }}>
            <div className="p-4 space-y-4">
              {/* Selected Game Header */}
              {selectedGame && (
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">
                    {selectedGame.teams?.[0]?.name?.split(' ')[0] || 'Team 1'} vs {selectedGame.teams?.[1]?.name?.split(' ')[0] || 'Team 2'}
                  </div>
                  <div className="text-sm text-primary">{selectedGame.teams?.[0]?.code || 'T1'}</div>
                </div>
              )}

              {/* Buy / Sell Tabs */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => setTradeType('buy')}
                    className={`px-4 py-1.5 text-sm font-medium rounded transition-all ${
                      tradeType === 'buy' 
                        ? 'text-foreground border-b-2 border-foreground' 
                        : 'text-muted-foreground'
                    }`}
                    data-testid="button-pm-buy"
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => setTradeType('sell')}
                    className={`px-4 py-1.5 text-sm font-medium rounded transition-all ${
                      tradeType === 'sell' 
                        ? 'text-foreground border-b-2 border-foreground' 
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
                  className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover-elevate'}`}
                  style={{ background: '#22C55E', color: 'white' }}
                  disabled={isDisabled}
                  data-testid="button-pm-yes"
                >
                  Yes 0.6¢
                </button>
                <button
                  className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover-elevate'}`}
                  style={{ background: 'rgba(60, 60, 60, 0.8)', color: 'white' }}
                  disabled={isDisabled}
                  data-testid="button-pm-no"
                >
                  No 99.8¢
                </button>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Amount</div>
                <div className={`flex items-center justify-between px-4 py-3 rounded-lg ${isDisabled ? 'opacity-50' : ''}`} style={{
                  background: 'rgba(15, 15, 15, 0.8)',
                  border: '1px solid rgba(60, 60, 60, 0.5)'
                }}>
                  <span className="text-2xl font-bold text-foreground">$</span>
                  <input
                    type="text"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    placeholder="0"
                    className="w-full text-right text-2xl font-bold bg-transparent border-0 outline-none text-foreground"
                    disabled={isDisabled}
                    data-testid="input-pm-amount"
                  />
                </div>
                
                {/* Quick Amount Buttons */}
                <div className="flex gap-2">
                  {[1, 20, 100].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setTradeAmount(String((parseFloat(tradeAmount) || 0) + amt))}
                      className={`flex-1 py-2 rounded text-xs font-medium transition-all ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover-elevate'}`}
                      style={{ background: 'rgba(60, 60, 60, 0.5)' }}
                      disabled={isDisabled}
                      data-testid={`button-pm-add-${amt}`}
                    >
                      +${amt}
                    </button>
                  ))}
                  <button
                    onClick={() => setTradeAmount('1000')}
                    className={`flex-1 py-2 rounded text-xs font-medium transition-all ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover-elevate'}`}
                    style={{ background: 'rgba(60, 60, 60, 0.5)' }}
                    disabled={isDisabled}
                    data-testid="button-pm-max"
                  >
                    Max
                  </button>
                </div>
              </div>

              {/* Trade Button */}
              <button
                onClick={handleTrade}
                className={`w-full py-3 rounded-lg font-bold text-sm transition-all ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover-elevate active-elevate-2'}`}
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
        }
        footer={<GameFooter />}
      >
        {/* Main Games Content */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Header with Toggle */}
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-foreground italic">Live</h1>
                <div className="flex items-center gap-4">
                  <Settings className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={showSpreadsAndTotals}
                      onCheckedChange={setShowSpreadsAndTotals}
                      data-testid="switch-pm-spreads"
                    />
                    <span className="text-sm text-muted-foreground">Show Spreads + Totals</span>
                  </div>
                </div>
              </div>

              {/* Live Games */}
              {demoGames.live.map((game) => (
                <div key={game.id} className="space-y-3">
                  <div className="text-lg font-bold text-foreground">{game.league}</div>
                  <div 
                    className="p-4 rounded-lg cursor-pointer hover-elevate transition-all"
                    style={{ background: 'rgba(30, 30, 35, 0.8)', border: '1px solid rgba(60, 60, 60, 0.3)' }}
                    onClick={() => setSelectedGame(game)}
                    data-testid={`card-pm-game-${game.id}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-red-500 text-white text-xs">LIVE</Badge>
                        <span className="text-xs text-muted-foreground">{game.volume}</span>
                      </div>
                      <button className="text-xs text-primary hover:underline" data-testid={`button-pm-gameview-${game.id}`}>
                        Game view &gt;
                      </button>
                    </div>
                    
                    {game.teams.map((team, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <Badge 
                            className="font-bold text-xs px-2"
                            style={{ background: team.moneylineColor, color: 'white' }}
                          >
                            {team.code}
                          </Badge>
                          <span className="text-sm text-foreground">{team.name}</span>
                        </div>
                        <button
                          className="px-4 py-2 rounded font-bold text-sm text-white transition-all hover-elevate"
                          style={{ background: team.moneylineColor }}
                          data-testid={`button-pm-bet-${game.id}-${idx}`}
                        >
                          {team.moneyline}
                        </button>
                      </div>
                    ))}
                    {game.draw && (
                      <div className="flex justify-center mt-2">
                        <span className="text-sm text-muted-foreground">{game.draw}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Starting Soon Section */}
              <div className="space-y-4 pt-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Starting Soon</h2>
                  <div className="text-sm text-muted-foreground">Tue, November 25</div>
                </div>

                {/* Column Headers */}
                <div className="flex items-center text-xs text-muted-foreground uppercase tracking-wider">
                  <div className="flex-1">NBA</div>
                  <div className="w-24 text-center">Moneyline</div>
                  {showSpreadsAndTotals && (
                    <>
                      <div className="w-28 text-center">Spread</div>
                      <div className="w-28 text-center">Total</div>
                    </>
                  )}
                  <div className="w-24"></div>
                </div>

                {/* Upcoming Games */}
                {demoGames.upcoming.map((game) => (
                  <div 
                    key={game.id}
                    className="p-4 rounded-lg cursor-pointer hover-elevate transition-all"
                    style={{ background: 'rgba(30, 30, 35, 0.8)', border: '1px solid rgba(60, 60, 60, 0.3)' }}
                    onClick={() => setSelectedGame(game)}
                    data-testid={`card-pm-game-${game.id}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{game.time}</span>
                        <span className="text-xs text-muted-foreground">{game.volume}</span>
                      </div>
                      <button className="text-xs text-muted-foreground hover:text-primary" data-testid={`button-pm-gameview-${game.id}`}>
                        {game.gameViews} Game View &gt;
                      </button>
                    </div>

                    {game.teams.map((team, idx) => (
                      <div key={idx} className="flex items-center py-2">
                        <div className="flex-1 flex items-center gap-3">
                          <Badge 
                            className="font-bold text-xs px-2"
                            style={{ 
                              background: team.moneylineColor,
                              color: 'white'
                            }}
                          >
                            {team.code}
                          </Badge>
                          <span className="text-sm text-foreground">{team.name}</span>
                          <span className="text-xs text-muted-foreground">{team.record}</span>
                        </div>
                        
                        {/* Moneyline */}
                        <div className="w-24 flex justify-center">
                          <button
                            className="px-3 py-1.5 rounded font-bold text-xs text-white transition-all hover-elevate"
                            style={{ background: team.moneylineColor }}
                            data-testid={`button-pm-moneyline-${game.id}-${idx}`}
                          >
                            {team.moneyline}
                          </button>
                        </div>

                        {/* Spread */}
                        {showSpreadsAndTotals && (
                          <div className="w-28 flex justify-center gap-1">
                            <span className="text-xs text-muted-foreground">{team.spread}</span>
                            <span className="text-xs font-bold text-foreground">{team.spreadPrice}</span>
                          </div>
                        )}

                        {/* Total */}
                        {showSpreadsAndTotals && (
                          <div className="w-28 flex justify-center gap-1">
                            <span className="text-xs text-muted-foreground">{team.total}</span>
                            <span className="text-xs font-bold text-foreground">{team.totalPrice}</span>
                          </div>
                        )}

                        <div className="w-24"></div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </div>
      </GameLayout>

      {/* Profile Modal - only render when we have username and wallet */}
      {username && address && (
        <ProfileModal
          open={showProfileModal}
          onOpenChange={setShowProfileModal}
          username={username}
          walletAddress={address}
        />
      )}

      {/* Chat Rules Modal */}
      <ChatRulesModal 
        open={showChatRules} 
        onOpenChange={setShowChatRules} 
      />
    </>
  );
}
