import { Switch, Route } from "wouter";
import { lazy, Suspense, useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GameStateProvider } from "@/contexts/GameStateContext";
import PersistentHeader from "@/components/PersistentHeader";
import LoadingScreen, { PageTransitionLoader } from "@/components/LoadingScreen";

const Home = lazy(() => import("@/pages/home"));
const Coinflip = lazy(() => import("@/pages/coinflip"));
const PredictionMarkets = lazy(() => import("@/pages/prediction-markets"));
const Admin = lazy(() => import("@/pages/admin"));
const AdminMarkets = lazy(() => import("@/pages/admin-markets"));
const SportsDataDemo = lazy(() => import("@/pages/sports-data-demo"));
const PredictionDataDemo = lazy(() => import("@/pages/prediction-data-demo"));
const NotFound = lazy(() => import("@/pages/not-found"));

function Router() {
  return (
    <Suspense fallback={<PageTransitionLoader />}>
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
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  useEffect(() => {
    const preloadAssets = async () => {
      const criticalImages = [
        '/src/assets/3dgifmaker85766_1764628423703.gif'
      ];
      
      await Promise.all(
        criticalImages.map(src => {
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = resolve;
            img.src = src;
          });
        })
      );
      
      setAssetsLoaded(true);
    };

    preloadAssets();
  }, []);

  const handleLoadingComplete = () => {
    setIsInitialLoading(false);
  };

  if (isInitialLoading) {
    return (
      <LoadingScreen 
        minDuration={1500}
        showProgress={true}
        message="Initializing..."
        onComplete={handleLoadingComplete}
      />
    );
  }

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
