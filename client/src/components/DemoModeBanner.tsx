import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DemoModeBannerProps {
  onLearnMore?: () => void;
}

export default function DemoModeBanner({ onLearnMore }: DemoModeBannerProps) {
  return (
    <Alert className="border-primary/30 bg-primary/5 mb-4" data-testid="alert-demo-mode">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-primary mt-0.5" />
        <div className="flex-1">
          <div className="font-semibold text-foreground mb-1">🧪 BNB Chain Testnet Mode - Real Blockchain, Fake Tokens</div>
          <AlertDescription className="text-sm text-muted-foreground">
            Connected to BNB Smart Chain Testnet. You can test all features with real wallet connections and blockchain transactions using <strong className="text-foreground">testnet tBNB (no real value)</strong>. 
            Winners are currently determined by server algorithms. <strong className="text-foreground">No real cryptocurrency is at risk.</strong>
            {onLearnMore && (
              <Button 
                variant="link" 
                className="h-auto p-0 ml-1 text-primary hover:text-primary/80"
                onClick={onLearnMore}
                data-testid="button-learn-more"
              >
                Get testnet tokens →
              </Button>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
