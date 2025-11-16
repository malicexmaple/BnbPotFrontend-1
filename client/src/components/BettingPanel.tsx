import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useState } from "react";
import solanaLogo from '@assets/generated_images/Solana_cryptocurrency_logo_icon_b1e8938e.png';

interface BettingPanelProps {
  onPlaceBet?: (amount: number) => void;
  yourWager?: number;
  yourChance?: number;
  totalBets?: number;
  isIntegrated?: boolean;
}

export default function BettingPanel({ 
  onPlaceBet,
  yourWager = 0,
  yourChance = 0,
  totalBets = 11283195,
  isIntegrated = false
}: BettingPanelProps) {
  const [betAmount, setBetAmount] = useState("0.000");
  const solPrice = 135.42;
  const usdValue = parseFloat(betAmount) * solPrice;

  const handleQuickBet = (amount: number) => {
    const current = parseFloat(betAmount) || 0;
    const newAmount = current + amount;
    setBetAmount(newAmount.toFixed(3));
  };

  const handlePlaceBet = () => {
    const amount = parseFloat(betAmount);
    if (amount > 0 && onPlaceBet) {
      onPlaceBet(amount);
      console.log('Bet placed:', amount);
    }
  };

  if (isIntegrated) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-muted-foreground">
              Bet Amount
            </label>
            <div className="relative">
              <Input
                data-testid="input-bet-amount"
                type="number"
                step="0.001"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="pr-16 font-mono text-lg h-12 bg-background/50"
                placeholder="0.000"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <img src={solanaLogo} alt="SOL" className="h-4 w-4" />
                <span className="text-sm font-medium">SOL</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              ≈ ${usdValue.toFixed(2)} USD
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-wide text-muted-foreground">
              Quick Bet
            </label>
            <div className="flex gap-2">
              <Button
                data-testid="button-quick-bet-01"
                variant="outline"
                size="sm"
                onClick={() => handleQuickBet(0.1)}
                className="flex-1 h-12"
              >
                <Plus className="h-3 w-3 mr-1" />
                0.1
              </Button>
              <Button
                data-testid="button-quick-bet-1"
                variant="outline"
                size="sm"
                onClick={() => handleQuickBet(1)}
                className="flex-1 h-12"
              >
                <Plus className="h-3 w-3 mr-1" />
                1
              </Button>
            </div>
            <Button
              data-testid="button-place-bet"
              onClick={handlePlaceBet}
              className="w-full h-12 text-base bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90 border-0 gradient-animate"
            >
              Place Bet
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Your Wager</div>
            <div className="font-mono font-semibold flex items-center gap-1" data-testid="text-your-wager">
              <img src={solanaLogo} alt="SOL" className="h-3 w-3" />
              {yourWager.toFixed(3)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Your Chance</div>
            <div className="font-semibold text-primary" data-testid="text-your-chance">
              {yourChance.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Place Your Bet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wide text-muted-foreground">
            Bet Amount
          </label>
          <div className="relative">
            <Input
              data-testid="input-bet-amount"
              type="number"
              step="0.001"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="pr-16 font-mono text-lg h-12"
              placeholder="0.000"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <img src={solanaLogo} alt="SOL" className="h-4 w-4" />
              <span className="text-sm font-medium">SOL</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            ≈ ${usdValue.toFixed(2)} USD
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            data-testid="button-quick-bet-01"
            variant="outline"
            size="sm"
            onClick={() => handleQuickBet(0.1)}
            className="flex-1"
          >
            <Plus className="h-3 w-3 mr-1" />
            0.1
          </Button>
          <Button
            data-testid="button-quick-bet-1"
            variant="outline"
            size="sm"
            onClick={() => handleQuickBet(1)}
            className="flex-1"
          >
            <Plus className="h-3 w-3 mr-1" />
            1
          </Button>
        </div>

        <Button
          data-testid="button-place-bet"
          onClick={handlePlaceBet}
          className="w-full h-12 text-base bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90 border-0 gradient-animate"
        >
          Place Bet
        </Button>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Your Wager</div>
            <div className="font-mono font-semibold flex items-center gap-1" data-testid="text-your-wager">
              <img src={solanaLogo} alt="SOL" className="h-3 w-3" />
              {yourWager.toFixed(3)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Your Chance</div>
            <div className="font-semibold text-primary" data-testid="text-your-chance">
              {yourChance.toFixed(2)}%
            </div>
          </div>
        </div>

        <div className="pt-2 text-center">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            Total Bets
          </div>
          <div className="text-2xl font-bold font-mono" data-testid="text-total-bets">
            {totalBets.toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
