// DegenArena Bet Slip Dialog
// Reference: design_guidelines.md - Modal with yellow CTA and dynamic payout display
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BetSlipDialogProps {
  open: boolean;
  onClose: () => void;
  marketId: string | null;
  outcome: 'A' | 'B' | null;
  teamName: string;
  currentOdds: number;
  onConfirm: (amount: string) => Promise<void>;
}

export function BetSlipDialog({
  open,
  onClose,
  marketId,
  outcome,
  teamName,
  currentOdds,
  onConfirm,
}: BetSlipDialogProps) {
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const potentialPayout = amount ? (parseFloat(amount) * currentOdds).toFixed(4) : "0.0000";

  useEffect(() => {
    if (!open) {
      setAmount("");
      setError("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid bet amount");
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(amount);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to place bet");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-card-border sm:max-w-md">
        <DialogHeader className="border-b border-accent pb-4">
          <DialogTitle className="text-2xl font-bold text-foreground">Place Your Bet</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Betting on <span className="text-primary font-semibold">{teamName}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Current Odds Display */}
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current Odds</span>
              <span className="text-2xl font-mono font-bold text-primary">
                {currentOdds.toFixed(2)}
              </span>
            </div>
            <Alert className="border-accent bg-accent/10">
              <AlertCircle className="h-4 w-4 text-accent" />
              <AlertDescription className="text-xs text-muted-foreground">
                Odds may change before settlement. Final payout based on your pool share.
              </AlertDescription>
            </Alert>
          </div>

          {/* Bet Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="bet-amount" className="text-foreground">
              Bet Amount (BNB)
            </Label>
            <div className="relative">
              <Input
                id="bet-amount"
                type="number"
                step="0.0001"
                min="0"
                placeholder="0.0000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-mono text-lg pr-16 bg-input border-accent text-foreground focus:border-primary"
                data-testid="input-bet-amount"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-accent">
                BNB
              </span>
            </div>
          </div>

          {/* Potential Payout Display */}
          <div className="bg-primary/10 border border-primary rounded-lg p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-foreground flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                Potential Return
              </span>
            </div>
            <p className="text-3xl font-mono font-bold text-primary">
              {potentialPayout} BNB
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Based on current odds (subject to change)
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-accent text-accent hover:bg-accent hover:text-accent-foreground"
              disabled={isSubmitting}
              data-testid="button-cancel-bet"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
              disabled={isSubmitting || !amount}
              data-testid="button-confirm-bet"
            >
              {isSubmitting ? "Placing Bet..." : "Confirm Bet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
