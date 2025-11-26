// DegenArena Main App Component
// Reference: javascript_log_in_with_replit blueprint for auth routing
// Reference: design_guidelines.md - Shadcn sidebar implementation
import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ChatPanel, ChatPanelProvider, ChatPanelTrigger } from "@/components/ChatPanel";
import { NetworkBackground } from "@/components/NetworkBackground";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Flame, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Wallet from "@/pages/wallet";
import Profile from "@/pages/profile";
import Feed from "@/pages/feed";
import Admin from "@/pages/admin";
import AdminMarkets from "@/pages/admin-markets";
import Leaderboard from "@/pages/leaderboard";
import Basketball from "@/pages/sports/basketball";
import BasketballLeagues from "@/pages/sports/basketball-leagues";
import BasketballLeague from "@/pages/sports/basketball-league";
import Baseball from "@/pages/sports/baseball";
import BaseballLeagues from "@/pages/sports/baseball-leagues";
import BaseballLeague from "@/pages/sports/baseball-league";
import Football from "@/pages/sports/football";
import FootballLeagues from "@/pages/sports/football-leagues";
import FootballLeague from "@/pages/sports/football-league";
import AmericanFootball from "@/pages/sports/american-football";
import AmericanFootballLeagues from "@/pages/sports/american-football-leagues";
import AmericanFootballLeague from "@/pages/sports/american-football-league";
import Tennis from "@/pages/sports/tennis";
import TennisLeagues from "@/pages/sports/tennis-leagues";
import TennisLeague from "@/pages/sports/tennis-league";
import IceHockey from "@/pages/sports/ice-hockey";
import IceHockeyLeagues from "@/pages/sports/ice-hockey-leagues";
import IceHockeyLeague from "@/pages/sports/ice-hockey-league";
import CricketLeagues from "@/pages/sports/cricket-leagues";
import CricketLeague from "@/pages/sports/cricket-league";
import MotorsportLeagues from "@/pages/sports/motorsport-leagues";
import MotorsportLeague from "@/pages/sports/motorsport-league";
import GolfLeagues from "@/pages/sports/golf-leagues";
import GolfLeague from "@/pages/sports/golf-league";
import FightingLeagues from "@/pages/sports/fighting-leagues";
import FightingLeague from "@/pages/sports/fighting-league";
import RugbyLeagues from "@/pages/sports/rugby-leagues";
import RugbyLeague from "@/pages/sports/rugby-league";
import TableTennisLeagues from "@/pages/sports/table-tennis-leagues";
import TableTennisLeague from "@/pages/sports/table-tennis-league";
import BadmintonLeagues from "@/pages/sports/badminton-leagues";
import BadmintonLeague from "@/pages/sports/badminton-league";
import VolleyballLeagues from "@/pages/sports/volleyball-leagues";
import VolleyballLeague from "@/pages/sports/volleyball-league";
import CyclingLeagues from "@/pages/sports/cycling-leagues";
import CyclingLeague from "@/pages/sports/cycling-league";
import HandballLeagues from "@/pages/sports/handball-leagues";
import HandballLeague from "@/pages/sports/handball-league";
import DartsLeagues from "@/pages/sports/darts-leagues";
import DartsLeague from "@/pages/sports/darts-league";
import WeightliftingLeagues from "@/pages/sports/weightlifting-leagues";
import WeightliftingLeague from "@/pages/sports/weightlifting-league";
import GamblingLeagues from "@/pages/sports/gambling-leagues";
import GamblingLeague from "@/pages/sports/gambling-league";
import CounterStrike from "@/pages/sports/cs2";
import Dota2 from "@/pages/sports/dota2";
import LeagueOfLegends from "@/pages/sports/lol";
import MMA from "@/pages/sports/mma";
import Valorant from "@/pages/sports/valorant";
import MyBets from "@/pages/my-bets";
import GameDetail from "@/pages/sports/game-detail";
import SportsDataDemo from "@/pages/sports-data-demo";
import PredictionDataDemo from "@/pages/prediction-data-demo";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/sports-data" component={SportsDataDemo} />
      <Route path="/prediction-data" component={PredictionDataDemo} />
      <Route path="/my-bets" component={MyBets} />
      <Route path="/sports/:sport/game/:gameSlug" component={GameDetail} />
      {/* Basketball League Routes */}
      <Route path="/sports/basketball/league/:leagueName" component={BasketballLeague} />
      <Route path="/sports/basketball/leagues" component={BasketballLeagues} />
      <Route path="/sports/basketball" component={Basketball} />
      {/* Baseball League Routes */}
      <Route path="/sports/baseball/league/:leagueName" component={BaseballLeague} />
      <Route path="/sports/baseball/leagues" component={BaseballLeagues} />
      <Route path="/sports/baseball" component={Baseball} />
      {/* Football (Soccer) League Routes */}
      <Route path="/sports/soccer/league/:leagueName" component={FootballLeague} />
      <Route path="/sports/soccer/leagues" component={FootballLeagues} />
      <Route path="/sports/football" component={Football} />
      {/* American Football League Routes */}
      <Route path="/sports/american-football/league/:leagueName" component={AmericanFootballLeague} />
      <Route path="/sports/american-football/leagues" component={AmericanFootballLeagues} />
      <Route path="/sports/american-football" component={AmericanFootball} />
      {/* Tennis League Routes */}
      <Route path="/sports/tennis/league/:leagueName" component={TennisLeague} />
      <Route path="/sports/tennis/leagues" component={TennisLeagues} />
      <Route path="/sports/tennis" component={Tennis} />
      {/* Ice Hockey League Routes */}
      <Route path="/sports/ice-hockey/league/:leagueName" component={IceHockeyLeague} />
      <Route path="/sports/ice-hockey/leagues" component={IceHockeyLeagues} />
      <Route path="/sports/ice-hockey" component={IceHockey} />
      {/* Cricket League Routes */}
      <Route path="/sports/cricket/league/:leagueName" component={CricketLeague} />
      <Route path="/sports/cricket/leagues" component={CricketLeagues} />
      {/* Motorsport League Routes */}
      <Route path="/sports/motorsport/league/:leagueName" component={MotorsportLeague} />
      <Route path="/sports/motorsport/leagues" component={MotorsportLeagues} />
      {/* Golf League Routes */}
      <Route path="/sports/golf/league/:leagueName" component={GolfLeague} />
      <Route path="/sports/golf/leagues" component={GolfLeagues} />
      {/* Fighting League Routes */}
      <Route path="/sports/fighting/league/:leagueName" component={FightingLeague} />
      <Route path="/sports/fighting/leagues" component={FightingLeagues} />
      {/* Rugby League Routes */}
      <Route path="/sports/rugby/league/:leagueName" component={RugbyLeague} />
      <Route path="/sports/rugby/leagues" component={RugbyLeagues} />
      {/* Table Tennis League Routes */}
      <Route path="/sports/table-tennis/league/:leagueName" component={TableTennisLeague} />
      <Route path="/sports/table-tennis/leagues" component={TableTennisLeagues} />
      {/* Badminton League Routes */}
      <Route path="/sports/badminton/league/:leagueName" component={BadmintonLeague} />
      <Route path="/sports/badminton/leagues" component={BadmintonLeagues} />
      {/* Volleyball League Routes */}
      <Route path="/sports/volleyball/league/:leagueName" component={VolleyballLeague} />
      <Route path="/sports/volleyball/leagues" component={VolleyballLeagues} />
      {/* Cycling League Routes */}
      <Route path="/sports/cycling/league/:leagueName" component={CyclingLeague} />
      <Route path="/sports/cycling/leagues" component={CyclingLeagues} />
      {/* Handball League Routes */}
      <Route path="/sports/handball/league/:leagueName" component={HandballLeague} />
      <Route path="/sports/handball/leagues" component={HandballLeagues} />
      {/* Darts League Routes */}
      <Route path="/sports/darts/league/:leagueName" component={DartsLeague} />
      <Route path="/sports/darts/leagues" component={DartsLeagues} />
      {/* Weightlifting League Routes */}
      <Route path="/sports/weightlifting/league/:leagueName" component={WeightliftingLeague} />
      <Route path="/sports/weightlifting/leagues" component={WeightliftingLeagues} />
      {/* Gambling League Routes */}
      <Route path="/sports/gambling/league/:leagueName" component={GamblingLeague} />
      <Route path="/sports/gambling/leagues" component={GamblingLeagues} />
      {/* Esports Routes */}
      <Route path="/sports/cs2" component={CounterStrike} />
      <Route path="/sports/dota2" component={Dota2} />
      <Route path="/sports/lol" component={LeagueOfLegends} />
      <Route path="/sports/mma" component={MMA} />
      <Route path="/sports/valorant" component={Valorant} />
      {/* Other Routes */}
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/wallet" component={Wallet} />
      <Route path="/profile" component={Profile} />
      <Route path="/feed" component={Feed} />
      <Route path="/admin/markets" component={AdminMarkets} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Custom sidebar width for sports betting application - matches chat panel width
  const style = {
    "--sidebar-width": "20rem",       // 320px to match chat panel (w-80)
    "--sidebar-width-icon": "4rem",   // default icon width
  };

  // Show same layout for both logged-in and logged-out users
  // Logged-out: sidebar with sports only, no chat, no account section
  // Logged-in: sidebar with sports + account, chat enabled
  return (
    <ChatPanelProvider>
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full bg-background">
          {/* Unified Network Background spanning all three headers */}
          <div className="absolute top-0 left-0 right-0 h-28 pointer-events-none" style={{ zIndex: 100 }}>
            <NetworkBackground 
              className="w-full h-full opacity-50" 
              color="gold"
            />
          </div>
          
          <AppSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <header className="flex items-center justify-between px-4 h-28 border-b border-accent bg-transparent relative" style={{ zIndex: 101 }}>
              <SidebarTrigger data-testid="button-sidebar-toggle" className="text-primary hover:text-primary/80" />
              <div className="flex items-center gap-4">
                <ThemeToggle />
                {isAuthenticated && <ChatPanelTrigger />}
              </div>
            </header>
            <main className="flex-1 overflow-auto bg-background">
              <Router />
            </main>
          </div>
          {isAuthenticated && <ChatPanel />}
        </div>
      </SidebarProvider>
    </ChatPanelProvider>
  );
}

function App() {
  // Disable right-click on all images
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthenticatedLayout />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
