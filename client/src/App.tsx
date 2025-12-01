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
const Admin = lazy(() => import("@/pages/admin"));
const AdminMarkets = lazy(() => import("@/pages/admin-markets"));
const SportsDataDemo = lazy(() => import("@/pages/sports-data-demo"));
const PredictionDataDemo = lazy(() => import("@/pages/prediction-data-demo"));
const NotFound = lazy(() => import("@/pages/not-found"));

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
      
      // Wait for page to fully load and zoom to stabilize
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
      }, 500);
      
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
