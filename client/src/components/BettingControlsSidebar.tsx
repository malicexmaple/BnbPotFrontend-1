import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import solanaLogo from '@assets/generated_images/Solana_cryptocurrency_logo_icon_b1e8938e.png';

interface BettingControlsSidebarProps {
  onPlaceBet?: (amount: number) => void;
}

export default function BettingControlsSidebar({ 
  onPlaceBet
}: BettingControlsSidebarProps) {
  const [betAmount, setBetAmount] = useState("0");
  const [activeTab, setActiveTab] = useState("solpot");

  const handlePlaceBet = () => {
    const amount = parseFloat(betAmount);
    if (amount > 0 && onPlaceBet) {
      onPlaceBet(amount);
      console.log('Bet placed:', amount);
    }
  };

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      <div className="p-4 border-b border-border">
        <div className="flex gap-2">
          <Button
            data-testid="tab-solpot"
            onClick={() => setActiveTab("solpot")}
            variant={activeTab === "solpot" ? "default" : "outline"}
            className="flex-1 h-9 text-sm"
          >
            SOLPOT
          </Button>
          <Button
            data-testid="tab-period"
            onClick={() => setActiveTab("period")}
            variant={activeTab === "period" ? "default" : "outline"}
            className="flex-1 h-9 text-sm"
          >
            PERIOD
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4 p-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Bet Amount</label>
          <div className="relative">
            <Input
              data-testid="input-bet-amount"
              type="text"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="h-14 text-3xl font-mono text-center pr-12 bg-background/50"
              placeholder="0"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <img src={solanaLogo} alt="SOL" className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            data-testid="button-quick-minus"
            variant="outline"
            className="h-10"
            onClick={() => {
              const current = parseFloat(betAmount) || 0;
              setBetAmount(Math.max(0, current - 0.1).toFixed(1));
            }}
          >
            -0.1
          </Button>
          <Button
            data-testid="button-quick-plus"
            variant="outline"
            className="h-10"
            onClick={() => {
              const current = parseFloat(betAmount) || 0;
              setBetAmount((current + 1).toFixed(1));
            }}
          >
            +1
          </Button>
        </div>

        <Button
          data-testid="button-place-bet"
          onClick={handlePlaceBet}
          className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 border-0"
        >
          Place Bet
        </Button>

        <Card className="p-3 bg-card/50 border border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Wins</span>
            <Badge variant="secondary" className="text-[10px] h-4">Chances</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <img src={solanaLogo} alt="SOL" className="h-3.5 w-3.5" />
              <div className="font-mono font-bold text-sm">0.188</div>
            </div>
            <div className="font-semibold text-primary text-sm">2.53%</div>
          </div>
        </Card>

        <div className="flex-1" />

        <Card className="p-4 bg-gradient-to-br from-primary/10 to-purple-600/10 border border-primary/30">
          <div className="text-center space-y-2">
            <Badge className="bg-primary text-[10px] h-5">LOOT OF THE DAY!</Badge>
            <div className="h-20 bg-background/30 rounded flex items-center justify-center border border-border/50">
              <div className="text-3xl">🎁</div>
            </div>
          </div>
        </Card>

        <Card className="p-3 bg-card/50 border border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Wins</span>
            <Badge variant="secondary" className="text-[10px] h-4">Chances</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <img src={solanaLogo} alt="SOL" className="h-3.5 w-3.5" />
              <div className="font-mono font-bold text-sm">0.769</div>
            </div>
            <div className="font-semibold text-primary text-sm">2.00%</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
