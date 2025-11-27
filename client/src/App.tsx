import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GameStateProvider } from "@/contexts/GameStateContext";
import PersistentHeader from "@/components/PersistentHeader";
import Home from "@/pages/home";
import Coinflip from "@/pages/coinflip";
import PredictionMarkets from "@/pages/prediction-markets";
import Admin from "@/pages/admin";
import AdminMarkets from "@/pages/admin-markets";
import SportsDataDemo from "@/pages/sports-data-demo";
import PredictionDataDemo from "@/pages/prediction-data-demo";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/coinflip" component={Coinflip} />
      <Route path="/prediction-markets" component={PredictionMarkets} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/markets" component={AdminMarkets} />
      <Route path="/admin/sports-data" component={SportsDataDemo} />
      <Route path="/admin/prediction-data" component={PredictionDataDemo} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <GameStateProvider>
          <Toaster />
          <PersistentHeader />
          <Router />
        </GameStateProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
