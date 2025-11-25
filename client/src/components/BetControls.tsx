import { Button } from "@/components/ui/button";
import { GOLDEN, DARK_BG, BORDER_RADIUS } from "@/constants/layout";
import bnbIcon from '@assets/bnb-bnb-logo_1763489145043.png';
import coinsBackground from '@assets/Ycjxd8iDdsXoHotkLjUPo-item-0x1_1763550444466.png';

interface BetControlsProps {
  betAmount: string;
  onBetAmountChange: (amount: string) => void;
  onPlaceBet: () => void;
  isWalletConnected?: boolean;
  hasAccount?: boolean;
  disabled?: boolean;
}

export default function BetControls({ 
  betAmount, 
  onBetAmountChange, 
  onPlaceBet,
  isWalletConnected = false,
  hasAccount = false,
  disabled = false
}: BetControlsProps) {
  const incrementBet = (increment: number) => {
    const currentAmount = parseFloat(betAmount) || 0;
    onBetAmountChange(String(currentAmount + increment));
  };

  const isDisabled = disabled || !isWalletConnected || !hasAccount;
  
  const getTooltipText = () => {
    if (!isWalletConnected) return "Connect wallet to bet";
    if (!hasAccount) return "Create account to bet";
    return "";
  };

  return (
    <div className="px-4 py-3" style={{
      borderRadius: BORDER_RADIUS.STANDARD,
      background: DARK_BG.GRADIENT,
      border: '2px solid rgba(60, 60, 60, 0.4)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
    }}>
      {/* Authentication requirement message */}
      {isDisabled && (
        <div className="text-xs text-muted-foreground text-center mb-2 px-2" data-testid="text-auth-required">
          {getTooltipText()} 
          {isWalletConnected && !hasAccount && " (click Connect → Create Account)"}
        </div>
      )}
      
      <div className="flex items-center justify-center gap-2">
        {/* Bet Input */}
        <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg ${isDisabled ? 'opacity-50' : ''}`} style={{
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
              className="w-16 text-sm font-semibold bg-transparent border-0 outline-none text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              style={{lineHeight: '1.25rem', paddingTop: '1px'}}
              disabled={isDisabled}
              data-testid="input-bet"
            />
          </div>
          <div className="flex items-center gap-1.5 pl-3 border-l border-border/20">
            <span className="text-sm font-semibold text-foreground">BNB</span>
            <img src={bnbIcon} alt="BNB" className="w-5 h-5" />
          </div>
        </div>

        {/* Increment Buttons */}
        {[0.001, 0.01, 0.1, 0.5, 1].map((increment) => (
          <div key={increment} className={`px-3 py-2.5 rounded-lg ${isDisabled ? 'opacity-50' : ''}`} style={{
            background: DARK_BG.MEDIUM,
            border: '1px solid rgba(60, 60, 60, 0.5)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.6)'
          }}>
            <button
              onClick={() => incrementBet(increment)}
              className="text-xs font-semibold text-foreground hover-elevate disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              disabled={isDisabled}
              data-testid={`button-plus-${increment}`}
            >
              +{increment}
            </button>
          </div>
        ))}

        {/* Place Bet Button */}
        <div className={`glass-panel neon-border px-4 py-2.5 rounded-lg relative overflow-hidden ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`} style={{
          animation: isDisabled ? 'none' : 'floatAirdropBox 2s ease-in-out infinite'
        }}>
          {/* Background coins image */}
          <div className="absolute inset-0 z-0" style={{
            backgroundImage: `url(${coinsBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.3,
            borderRadius: 'inherit'
          }} />
          <button
            onClick={onPlaceBet}
            className="relative z-10 hover-elevate active-elevate-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isDisabled}
            data-testid="button-place-bet"
          >
            <span className="text-xs font-bold uppercase tracking-wide" style={{
              background: 'linear-gradient(180deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.9)) drop-shadow(0 0 4px rgba(0, 0, 0, 0.7))',
              textShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
            }}>
              PLACE BET
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
