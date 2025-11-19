import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { GOLDEN, DARK_BG, BORDER_RADIUS } from "@/constants/layout";

interface ChatRulesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ChatRulesModal({ open, onOpenChange }: ChatRulesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-0 p-6" style={{
        borderRadius: BORDER_RADIUS.STANDARD,
        background: DARK_BG.GRADIENT,
        border: GOLDEN.BORDER_LIGHT,
        boxShadow: GOLDEN.GLOW
      }}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-text uppercase tracking-wide">Chat Rules</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Please follow these rules to maintain a positive environment
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm mt-4">
          <div className="space-y-1">
            <h3 className="font-bold text-foreground">1. Be Respectful</h3>
            <p className="text-muted-foreground">Treat all users with respect. No harassment, hate speech, or personal attacks.</p>
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-foreground">2. No Spam</h3>
            <p className="text-muted-foreground">Do not spam messages, links, or advertisements. Keep the chat clean and relevant.</p>
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-foreground">3. No Begging</h3>
            <p className="text-muted-foreground">Do not beg for coins, tips, or giveaways from other users.</p>
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-foreground">4. Keep it Legal</h3>
            <p className="text-muted-foreground">No discussion of illegal activities or sharing of illegal content.</p>
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-foreground">5. Use English</h3>
            <p className="text-muted-foreground">Please use English in the main chat for better communication.</p>
          </div>
        </div>
        <button onClick={() => onOpenChange(false)} className="w-full mt-6 text-white font-bold" style={{
          borderRadius: BORDER_RADIUS.STANDARD,
          padding: '18px 28px',
          background: DARK_BG.SOLID,
          backdropFilter: 'blur(20px)',
          border: '2px solid transparent',
          backgroundImage: `${DARK_BG.SOLID}, linear-gradient(140deg, #EAB308 0%, #FCD34D 50%, #EAB308 100%)`,
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          boxShadow: 'inset 0 1px 2px rgba(234, 179, 8, 0.1), inset 0 -1px 3px rgba(0, 0, 0, 0.6), 0 0 24px rgba(234, 179, 8, 0.4), 0 4px 16px rgba(0, 0, 0, 0.7)',
          cursor: 'pointer',
          fontSize: '16px'
        }} data-testid="button-close-rules">
          Got it!
        </button>
      </DialogContent>
    </Dialog>
  );
}
