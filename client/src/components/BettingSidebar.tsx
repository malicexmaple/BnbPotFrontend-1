import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useState } from "react";
import solanaLogo from '@assets/generated_images/Solana_cryptocurrency_logo_icon_b1e8938e.png';

interface BettingSidebarProps {
  onPlaceBet?: (amount: number) => void;
  totalBets?: number;
}

export default function BettingSidebar({ 
  onPlaceBet,
  totalBets = 11283195
}: BettingSidebarProps) {
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

  return (
    <Card className="w-full h-full flex flex-col border-r rounded-none">
      <CardHeader className="pb-4 border-b">
        <CardTitle className="text-2xl">Jackpot</CardTitle>
        <CardDescription>Winner takes all...</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-6 p-6">
        <div className="space-y-3">
          <label className="text-sm font-medium">
            Bet Amount
          </label>
          <div className="relative">
            <Input
              data-testid="input-bet-amount"
              type="number"
              step="0.001"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="pr-16 font-mono text-lg h-14 text-center"
              placeholder="0.000"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <img src={solanaLogo} alt="SOL" className="h-5 w-5" />
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            ~${usdValue.toFixed(2)}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            data-testid="button-quick-bet-01"
            variant="outline"
            onClick={() => handleQuickBet(0.1)}
            className="flex-1 h-12"
          >
            +0.1
          </Button>
          <Button
            data-testid="button-quick-bet-1"
            variant="outline"
            onClick={() => handleQuickBet(1)}
            className="flex-1 h-12"
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

        <div className="flex-1" />

        <div className="pt-4 border-t">
          <div className="text-center">
            <div className="text-3xl font-bold font-mono" data-testid="text-total-bets">
              {totalBets.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
              Total Bets
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
