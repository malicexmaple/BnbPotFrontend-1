import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shield, FileText, HelpCircle } from "lucide-react";
import { useState } from "react";

export default function GameFooter() {
  const [is3DMode, setIs3DMode] = useState(false);

  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <button
            data-testid="link-provably-fair"
            onClick={() => console.log('Provably Fair clicked')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Shield className="h-4 w-4" />
            Provably Fair
          </button>
          <button
            data-testid="link-terms-of-service"
            onClick={() => console.log('Terms of Service clicked')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <FileText className="h-4 w-4" />
            Terms of Service
          </button>
          <button
            data-testid="link-support"
            onClick={() => console.log('Support clicked')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
            Support
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="3d-mode" className="text-sm text-muted-foreground cursor-pointer">
            3D
          </Label>
          <Switch
            id="3d-mode"
            data-testid="switch-3d-mode"
            checked={is3DMode}
            onCheckedChange={(checked) => {
              setIs3DMode(checked);
              console.log('3D mode:', checked);
            }}
          />
        </div>
      </div>
    </footer>
  );
}
