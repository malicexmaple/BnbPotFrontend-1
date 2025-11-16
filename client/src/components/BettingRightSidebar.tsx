import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import solanaLogo from '@assets/generated_images/Solana_cryptocurrency_logo_icon_b1e8938e.png';

interface BettingRightSidebarProps {
  onPlaceBet?: (amount: number) => void;
}

export default function BettingRightSidebar({ 
  onPlaceBet
}: BettingRightSidebarProps) {
  const [betAmount, setBetAmount] = useState("0");
  const [activeTab, setActiveTab] = useState("solpot");

  const handleQuickBet = (amount: number) => {
    const current = parseFloat(betAmount) || 0;
    const newAmount = current + amount;
    setBetAmount(newAmount.toString());
  };

  const handlePlaceBet = () => {
    const amount = parseFloat(betAmount);
    if (amount > 0 && onPlaceBet) {
      onPlaceBet(amount);
      console.log('Bet placed:', amount);
    }
  };

  return (
    <Card className="h-full flex flex-col rounded-none border-l">
      <CardHeader className="pb-3 border-b">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="solpot" className="flex-1" data-testid="tab-solpot">
              SOLPOT
            </TabsTrigger>
            <TabsTrigger value="period" className="flex-1" data-testid="tab-period">
              PERIOD
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-6 p-4">
        <div className="space-y-3">
          <label className="text-sm font-medium">Bet Amount</label>
          <div className="relative">
            <Input
              data-testid="input-bet-amount"
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="h-12 text-2xl font-mono text-center pr-12"
              placeholder="0"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <img src={solanaLogo} alt="SOL" className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            data-testid="button-quick-bet-minus"
            variant="outline"
            onClick={() => handleQuickBet(-0.1)}
            className="flex-1 h-10"
          >
            -0.1
          </Button>
          <Button
            data-testid="button-quick-bet-plus"
            variant="outline"
            onClick={() => handleQuickBet(1)}
            className="flex-1 h-10"
          >
            +1
          </Button>
        </div>

        <Button
          data-testid="button-place-bet"
          onClick={handlePlaceBet}
          className="w-full h-14 text-lg bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90 border-0 gradient-animate"
        >
          Place Bet
        </Button>

        <Card className="p-4 bg-card/50">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Wins</div>
            <Badge variant="secondary" className="text-xs">Chances</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <img src={solanaLogo} alt="SOL" className="h-4 w-4" />
              <div className="font-mono font-bold">0.188</div>
            </div>
            <div className="font-semibold text-primary">2.53%</div>
          </div>
        </Card>

        <div className="flex-1" />

        <Card className="p-4 bg-gradient-to-br from-primary/10 to-pink-500/10 border-primary/50">
          <div className="text-center space-y-2">
            <Badge className="bg-primary text-xs">LOOT OF THE DAY!</Badge>
            <div className="h-24 bg-muted/50 rounded flex items-center justify-center">
              <div className="text-4xl">🎁</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card/50">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Wins</div>
            <Badge variant="secondary" className="text-xs">Chances</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <img src={solanaLogo} alt="SOL" className="h-4 w-4" />
              <div className="font-mono font-bold">0.769</div>
            </div>
            <div className="font-semibold text-primary">2.00%</div>
          </div>
        </Card>
      </CardContent>
    </Card>
  );
}
