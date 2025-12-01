import { Switch, Route, useLocation } from "wouter";
import { lazy, Suspense, useState, useEffect, useRef } from "react";
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

function RouteTransitionWrapper({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevLocationRef = useRef(location);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (location !== prevLocationRef.current) {
      setIsTransitioning(true);
      
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }

      transitionTimeoutRef.current = setTimeout(() => {
        setIsTransitioning(false);
      }, 600);
      
      prevLocationRef.current = location;
    }

    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [location]);

  return (
    <>
      <PageTransitionLoader style={{ 
        opacity: isTransitioning ? 1 : 0,
        pointerEvents: isTransitioning ? 'auto' : 'none'
      }} />
      <div style={{ 
        visibility: isTransitioning ? 'hidden' : 'visible',
        opacity: isTransitioning ? 0 : 1
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
          <Route path="/admin" component={Admin} />
          <Route path="/admin/markets" component={AdminMarkets} />
          <Route path="/admin/sports-data" component={SportsDataDemo} />
          <Route path="/admin/prediction-data" component={PredictionDataDemo} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </RouteTransitionWrapper>
  );
}

function App() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const handleLoadingComplete = () => {
    setIsInitialLoading(false);
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
          <PersistentHeader />
          <Router />
        </GameStateProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
