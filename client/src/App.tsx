import { Switch, Route } from "wouter";
import { useEffect } from "react";
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

import crownLogo from '@assets/3dgifmaker85766_1763561140520.gif';
import textLogo from '@assets/bnbpotlogonew_1763432221839.png';
import jackpotTabLogo from '@assets/jackpotnew_1763477420573.png';
import coinflipLogo from '@assets/coinflipnew_1763488010364.png';
import predictionMarketsLogo from '@assets/predictionmarketsnew_1763488010364.png';
import bnbLogo from '@assets/3dgifmaker21542_1763401668048.gif';
import clockIcon from '@assets/3dgifmaker22359_1763413463889.gif';
import cloverIcon from '@assets/3dgifmaker84959_1763403008581.gif';
import treasureChest from '@assets/3dgifmaker81317_1763413607076.gif';
import coinStack from '@assets/vecteezy_binance-coin-bnb-coin-stacks-cryptocurrency-3d-render_21627671_1763398880775.png';
import bnbpotBg from '@assets/MOSHED-2025-11-18-4-12-49_1763403537895.gif';
import signupLogo from '@assets/signupnew_1763410821936.png';
import jackpotLegendsLogo from '@assets/jackpotlegends_1763742593143.png';
import airdropLogo from '@assets/airdropnew_1763414250628.png';
import airdropPackage from '@assets/airdrop-pachage_1763543740528.png';

const PRELOAD_IMAGES = [
  crownLogo,
  textLogo,
  jackpotTabLogo,
  coinflipLogo,
  predictionMarketsLogo,
  bnbLogo,
  clockIcon,
  cloverIcon,
  treasureChest,
  coinStack,
  bnbpotBg,
  signupLogo,
  jackpotLegendsLogo,
  airdropLogo,
  airdropPackage,
];

function ImagePreloader() {
  useEffect(() => {
    PRELOAD_IMAGES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);
  return null;
}

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
          <ImagePreloader />
          <Toaster />
          <PersistentHeader />
          <Router />
        </GameStateProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
