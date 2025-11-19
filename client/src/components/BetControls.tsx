import { Button } from "@/components/ui/button";
import { GOLDEN, DARK_BG, BORDER_RADIUS } from "@/constants/layout";
import bnbIcon from '@assets/bnb-bnb-logo_1763489145043.png';
import coinsBackground from '@assets/Ycjxd8iDdsXoHotkLjUPo-item-0x1_1763550444466.png';

interface BetControlsProps {
  betAmount: string;
  onBetAmountChange: (amount: string) => void;
  onPlaceBet: () => void;
}

export default function BetControls({ betAmount, onBetAmountChange, onPlaceBet }: BetControlsProps) {
  const incrementBet = (increment: number) => {
    const currentAmount = parseFloat(betAmount) || 0;
    onBetAmountChange(String(currentAmount + increment));
  };

  return (
    <div className="px-4 py-3" style={{
      borderRadius: BORDER_RADIUS.STANDARD,
      background: DARK_BG.GRADIENT,
      border: '2px solid rgba(60, 60, 60, 0.4)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
    }}>
      <div className="flex items-center justify-center gap-2">
        {/* Bet Input */}
        <div className="flex items-center justify-between px-4 py-2.5 rounded-lg" style={{
          background: DARK_BG.MEDIUM,
          border: '1px solid rgba(60, 60, 60, 0.5)',
          minWidth: '160px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.6)'
        }}>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={betAmount}
              onChange={(e) => onBetAmountChange(e.target.value)}
              placeholder="0.1"
              className="w-16 text-sm font-semibold bg-transparent border-0 outline-none text-foreground"
              style={{lineHeight: '1.25rem', paddingTop: '1px'}}
              data-testid="input-bet"
            />
          </div>
          <div className="flex items-center gap-1.5 pl-3 border-l border-border/20">
            <span className="text-sm font-semibold text-foreground">BNB</span>
            <img src={bnbIcon} alt="BNB" className="w-5 h-5" />
          </div>
        </div>

        {/* Increment Buttons */}
        {[0.1, 0.5, 1].map((increment) => (
          <div key={increment} className="px-5 py-2.5 rounded-lg" style={{
            background: DARK_BG.MEDIUM,
            border: '1px solid rgba(60, 60, 60, 0.5)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.6)'
          }}>
            <button
              onClick={() => incrementBet(increment)}
              className="text-sm font-semibold text-foreground hover-elevate"
              data-testid={`button-plus-${increment}`}
            >
              +{increment}
            </button>
          </div>
        ))}

        {/* Place Bet Button */}
        <div className="glass-panel neon-border px-10 py-2.5 rounded-lg relative overflow-hidden">
          {/* Background coins image */}
          <div className="absolute inset-0 z-0" style={{
            backgroundImage: `url(${coinsBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.3,
            borderRadius: 'inherit'
          }} />
          <Button
            onClick={onPlaceBet}
            variant="ghost"
            className="text-sm font-bold text-white no-default-hover-elevate no-default-active-elevate h-auto p-0 relative z-10"
            data-testid="button-place-bet"
          >
            PLACE BET
          </Button>
        </div>
      </div>
    </div>
  );
}
