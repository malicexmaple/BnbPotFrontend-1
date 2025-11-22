import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function GameFooter() {
  const [is3DMode, setIs3DMode] = useState(false);

  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur hidden md:block">
      <div className="flex items-center justify-center gap-2 px-4 py-4">
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
    </footer>
  );
}
