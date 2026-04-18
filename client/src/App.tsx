import { Switch, Route, useLocation } from "wouter";
import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GameStateProvider } from "@/contexts/GameStateContext";
import PersistentHeader from "@/components/PersistentHeader";
import LoadingScreen, { PageTransitionLoader } from "@/components/LoadingScreen";
import RotateDeviceOverlay from "@/components/RotateDeviceOverlay";

import jackpotLogo from "@assets/jackpotnew_1763477420573.png";
import coinflipLogo from "@assets/coinflipnew_1763488010364.png";
import predictionMarketsLogo from "@assets/predictionmarketsnew_1763488010364.png";
import bnbLogo from "@assets/3dgifmaker21542_1763401668048.gif";
import jackpotLegendsLogo from "@assets/jackpotlegends_1763742593143.png";
import coinflipKingsLogo from "@assets/coinfip-kings_1764256293716.png";
import signupLogo from "@assets/signupnew_1763410821936.png";

const CRITICAL_ASSETS = [
  jackpotLogo,
  coinflipLogo,
  predictionMarketsLogo,
  bnbLogo,
  jackpotLegendsLogo,
  coinflipKingsLogo,
  signupLogo
];

const Home = lazy(() => import("@/pages/home"));
const Coinflip = lazy(() => import("@/pages/coinflip"));
const PredictionMarkets = lazy(() => import("@/pages/prediction-markets"));
const MarketDetail = lazy(() => import("@/pages/market-detail"));
const Positions = lazy(() => import("@/pages/positions"));
const Admin = lazy(() => import("@/pages/admin"));
const AdminMarkets = lazy(() => import("@/pages/admin-markets"));
const SportsDataDemo = lazy(() => import("@/pages/sports-data-demo"));
const PredictionDataDemo = lazy(() => import("@/pages/prediction-data-demo"));
const MyBets = lazy(() => import("@/pages/my-bets"));
const Leaderboard = lazy(() => import("@/pages/leaderboard"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Ported pages
const Wallet = lazy(() => import("@/pages/wallet"));
const Profile = lazy(() => import("@/pages/profile"));
const Feed = lazy(() => import("@/pages/feed"));
const GameDetail = lazy(() => import("@/pages/sports/game-detail"));

// Sport hubs
const AmericanFootball = lazy(() => import("@/pages/sports/american-football"));
const Baseball = lazy(() => import("@/pages/sports/baseball"));
const Basketball = lazy(() => import("@/pages/sports/basketball"));
const Football = lazy(() => import("@/pages/sports/football"));
const IceHockey = lazy(() => import("@/pages/sports/ice-hockey"));
const Tennis = lazy(() => import("@/pages/sports/tennis"));
const CS2 = lazy(() => import("@/pages/sports/cs2"));
const Dota2 = lazy(() => import("@/pages/sports/dota2"));
const LoL = lazy(() => import("@/pages/sports/lol"));
const MMA = lazy(() => import("@/pages/sports/mma"));
const Valorant = lazy(() => import("@/pages/sports/valorant"));

// Sport leagues lists (from -leagues.tsx)
const AmericanFootballLeagues = lazy(() => import("@/pages/sports/american-football-leagues"));
const BadmintonLeagues = lazy(() => import("@/pages/sports/badminton-leagues"));
const BaseballLeagues = lazy(() => import("@/pages/sports/baseball-leagues"));
const BasketballLeagues = lazy(() => import("@/pages/sports/basketball-leagues"));
const CricketLeagues = lazy(() => import("@/pages/sports/cricket-leagues"));
const CyclingLeagues = lazy(() => import("@/pages/sports/cycling-leagues"));
const DartsLeagues = lazy(() => import("@/pages/sports/darts-leagues"));
const FightingLeagues = lazy(() => import("@/pages/sports/fighting-leagues"));
const FootballLeagues = lazy(() => import("@/pages/sports/football-leagues"));
const GamblingLeagues = lazy(() => import("@/pages/sports/gambling-leagues"));
const GolfLeagues = lazy(() => import("@/pages/sports/golf-leagues"));
const HandballLeagues = lazy(() => import("@/pages/sports/handball-leagues"));
const IceHockeyLeagues = lazy(() => import("@/pages/sports/ice-hockey-leagues"));
const MotorsportLeagues = lazy(() => import("@/pages/sports/motorsport-leagues"));
const RugbyLeagues = lazy(() => import("@/pages/sports/rugby-leagues"));
const TableTennisLeagues = lazy(() => import("@/pages/sports/table-tennis-leagues"));
const TennisLeagues = lazy(() => import("@/pages/sports/tennis-leagues"));
const VolleyballLeagues = lazy(() => import("@/pages/sports/volleyball-leagues"));
const WeightliftingLeagues = lazy(() => import("@/pages/sports/weightlifting-leagues"));

// League detail (from -league.tsx)
const AmericanFootballLeague = lazy(() => import("@/pages/sports/american-football-league"));
const BadmintonLeague = lazy(() => import("@/pages/sports/badminton-league"));
const BaseballLeague = lazy(() => import("@/pages/sports/baseball-league"));
const BasketballLeague = lazy(() => import("@/pages/sports/basketball-league"));
const CricketLeague = lazy(() => import("@/pages/sports/cricket-league"));
const CyclingLeague = lazy(() => import("@/pages/sports/cycling-league"));
const DartsLeague = lazy(() => import("@/pages/sports/darts-league"));
const FightingLeague = lazy(() => import("@/pages/sports/fighting-league"));
const FootballLeague = lazy(() => import("@/pages/sports/football-league"));
const GamblingLeague = lazy(() => import("@/pages/sports/gambling-league"));
const GolfLeague = lazy(() => import("@/pages/sports/golf-league"));
const HandballLeague = lazy(() => import("@/pages/sports/handball-league"));
const IceHockeyLeague = lazy(() => import("@/pages/sports/ice-hockey-league"));
const MotorsportLeague = lazy(() => import("@/pages/sports/motorsport-league"));
const RugbyLeague = lazy(() => import("@/pages/sports/rugby-league"));
const TableTennisLeague = lazy(() => import("@/pages/sports/table-tennis-league"));
const TennisLeague = lazy(() => import("@/pages/sports/tennis-league"));
const VolleyballLeague = lazy(() => import("@/pages/sports/volleyball-league"));
const WeightliftingLeague = lazy(() => import("@/pages/sports/weightlifting-league"));

function RouteTransitionWrapper({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [showLoader, setShowLoader] = useState(false);
  const [contentVisible, setContentVisible] = useState(true);
  const prevLocationRef = useRef(location);

  useEffect(() => {
    if (location !== prevLocationRef.current) {
      // Immediately show loader and hide content
      setShowLoader(true);
      setContentVisible(false);
      
      // Wait 3.5 seconds to fully hide any loading
      const timer = setTimeout(() => {
        // First make content visible (but loader still showing)
        setContentVisible(true);
        
        // Then after another frame, hide loader
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTimeout(() => {
              setShowLoader(false);
            }, 100);
          });
        });
      }, 3500);
      
      prevLocationRef.current = location;
      
      return () => clearTimeout(timer);
    }
  }, [location]);

  return (
    <>
      {showLoader && <PageTransitionLoader />}
      <div style={{ 
        opacity: contentVisible && !showLoader ? 1 : 0,
        transition: 'opacity 150ms ease-in'
      }}>
        {children}
      </div>
    </>
  );
}

function Router() {
  return (
    <RouteTransitionWrapper>
      <Suspense fallback={<PageTransitionLoader />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/coinflip" component={Coinflip} />
          <Route path="/prediction-markets" component={PredictionMarkets} />
          <Route path="/market/:id" component={MarketDetail} />
          <Route path="/positions" component={Positions} />
          <Route path="/admin" component={Admin} />
          <Route path="/admin/markets" component={AdminMarkets} />
          <Route path="/admin/sports-data" component={SportsDataDemo} />
          <Route path="/admin/prediction-data" component={PredictionDataDemo} />
          <Route path="/my-bets" component={MyBets} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route path="/wallet" component={Wallet} />
          <Route path="/profile" component={Profile} />
          <Route path="/feed" component={Feed} />
          <Route path="/sports/game/:gameId" component={GameDetail} />

          <Route path="/sports/american-football" component={AmericanFootball} />
          <Route path="/sports/american-football/leagues" component={AmericanFootballLeagues} />
          <Route path="/sports/american-football/league/:leagueName" component={AmericanFootballLeague} />

          <Route path="/sports/badminton" component={BadmintonLeagues} />
          <Route path="/sports/badminton/leagues" component={BadmintonLeagues} />
          <Route path="/sports/badminton/league/:leagueName" component={BadmintonLeague} />

          <Route path="/sports/baseball" component={Baseball} />
          <Route path="/sports/baseball/leagues" component={BaseballLeagues} />
          <Route path="/sports/baseball/league/:leagueName" component={BaseballLeague} />

          <Route path="/sports/basketball" component={Basketball} />
          <Route path="/sports/basketball/leagues" component={BasketballLeagues} />
          <Route path="/sports/basketball/league/:leagueName" component={BasketballLeague} />

          <Route path="/sports/cricket" component={CricketLeagues} />
          <Route path="/sports/cricket/leagues" component={CricketLeagues} />
          <Route path="/sports/cricket/league/:leagueName" component={CricketLeague} />

          <Route path="/sports/cycling" component={CyclingLeagues} />
          <Route path="/sports/cycling/leagues" component={CyclingLeagues} />
          <Route path="/sports/cycling/league/:leagueName" component={CyclingLeague} />

          <Route path="/sports/darts" component={DartsLeagues} />
          <Route path="/sports/darts/leagues" component={DartsLeagues} />
          <Route path="/sports/darts/league/:leagueName" component={DartsLeague} />

          <Route path="/sports/fighting" component={FightingLeagues} />
          <Route path="/sports/fighting/leagues" component={FightingLeagues} />
          <Route path="/sports/fighting/league/:leagueName" component={FightingLeague} />

          <Route path="/sports/football" component={Football} />
          <Route path="/sports/football/leagues" component={FootballLeagues} />
          <Route path="/sports/football/league/:leagueName" component={FootballLeague} />

          <Route path="/sports/gambling" component={GamblingLeagues} />
          <Route path="/sports/gambling/leagues" component={GamblingLeagues} />
          <Route path="/sports/gambling/league/:leagueName" component={GamblingLeague} />

          <Route path="/sports/golf" component={GolfLeagues} />
          <Route path="/sports/golf/leagues" component={GolfLeagues} />
          <Route path="/sports/golf/league/:leagueName" component={GolfLeague} />

          <Route path="/sports/handball" component={HandballLeagues} />
          <Route path="/sports/handball/leagues" component={HandballLeagues} />
          <Route path="/sports/handball/league/:leagueName" component={HandballLeague} />

          <Route path="/sports/ice-hockey" component={IceHockey} />
          <Route path="/sports/ice-hockey/leagues" component={IceHockeyLeagues} />
          <Route path="/sports/ice-hockey/league/:leagueName" component={IceHockeyLeague} />

          <Route path="/sports/motorsport" component={MotorsportLeagues} />
          <Route path="/sports/motorsport/leagues" component={MotorsportLeagues} />
          <Route path="/sports/motorsport/league/:leagueName" component={MotorsportLeague} />

          <Route path="/sports/rugby" component={RugbyLeagues} />
          <Route path="/sports/rugby/leagues" component={RugbyLeagues} />
          <Route path="/sports/rugby/league/:leagueName" component={RugbyLeague} />

          <Route path="/sports/table-tennis" component={TableTennisLeagues} />
          <Route path="/sports/table-tennis/leagues" component={TableTennisLeagues} />
          <Route path="/sports/table-tennis/league/:leagueName" component={TableTennisLeague} />

          <Route path="/sports/tennis" component={Tennis} />
          <Route path="/sports/tennis/leagues" component={TennisLeagues} />
          <Route path="/sports/tennis/league/:leagueName" component={TennisLeague} />

          <Route path="/sports/volleyball" component={VolleyballLeagues} />
          <Route path="/sports/volleyball/leagues" component={VolleyballLeagues} />
          <Route path="/sports/volleyball/league/:leagueName" component={VolleyballLeague} />

          <Route path="/sports/weightlifting" component={WeightliftingLeagues} />
          <Route path="/sports/weightlifting/leagues" component={WeightliftingLeagues} />
          <Route path="/sports/weightlifting/league/:leagueName" component={WeightliftingLeague} />

          <Route path="/sports/cs2" component={CS2} />
          <Route path="/sports/dota2" component={Dota2} />
          <Route path="/sports/lol" component={LoL} />
          <Route path="/sports/mma" component={MMA} />
          <Route path="/sports/valorant" component={Valorant} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </RouteTransitionWrapper>
  );
}

function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(
    urls.map(url => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = url;
      });
    })
  );
}

function App() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [assetsReady, setAssetsReady] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    preloadImages(CRITICAL_ASSETS).then(() => {
      setAssetsReady(true);
    });
  }, []);

  useEffect(() => {
    if (assetsReady && minTimeElapsed) {
      setIsInitialLoading(false);
    }
  }, [assetsReady, minTimeElapsed]);

  const handleLoadingComplete = () => {
    setMinTimeElapsed(true);
  };

  if (isInitialLoading) {
    return (
      <LoadingScreen 
        minDuration={1500}
        onComplete={handleLoadingComplete}
      />
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <GameStateProvider>
          <Toaster />
          <RotateDeviceOverlay />
          <PersistentHeader />
          <Router />
        </GameStateProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
