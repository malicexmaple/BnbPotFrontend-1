import { Switch, Route } from "wouter";
import { lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GameStateProvider } from "@/contexts/GameStateContext";
import PersistentHeader from "@/components/PersistentHeader";
import Home from "@/pages/home";
import Coinflip from "@/pages/coinflip";
import PredictionMarkets from "@/pages/prediction-markets";
import NotFound from "@/pages/not-found";

const Admin = lazy(() => import("@/pages/admin"));
const AdminMarkets = lazy(() => import("@/pages/admin-markets"));
const SportsDataDemo = lazy(() => import("@/pages/sports-data-demo"));
const PredictionDataDemo = lazy(() => import("@/pages/prediction-data-demo"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
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
    </Suspense>
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
