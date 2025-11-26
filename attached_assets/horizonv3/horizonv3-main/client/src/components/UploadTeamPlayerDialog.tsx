import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface UploadTeamPlayerDialogProps {
  sport: string;
  league: string;
  isIndividualSport?: boolean;
}

export function UploadTeamPlayerDialog({ sport, league, isIndividualSport = false }: UploadTeamPlayerDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [teamForm, setTeamForm] = useState({
    name: "",
    file: null as File | null,
  });

  const [playerForm, setPlayerForm] = useState({
    name: "",
    country: "",
    file: null as File | null,
  });

  const uploadTeamMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/sports/custom/teams/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Team logo uploaded successfully",
      });
      setTeamForm({ name: "", file: null });
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/sports/custom/teams"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload team logo",
        variant: "destructive",
      });
    },
  });

  const uploadPlayerMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/sports/custom/players/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Player photo uploaded successfully",
      });
      setPlayerForm({ name: "", country: "", file: null });
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/sports/custom/players"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload player photo",
        variant: "destructive",
      });
    },
  });

  const handleTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.file || !teamForm.name) {
      toast({
        title: "Error",
        description: "Please fill all fields and select a file",
        variant: "destructive",
      });
      return;
    }

    // Validate file type (JPEG, PNG, GIF only)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(teamForm.file.type)) {
      toast({
        title: "Error",
        description: "Only JPEG, PNG, and GIF files are allowed",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (2MB limit)
    if (teamForm.file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("logo", teamForm.file);
    formData.append("name", teamForm.name);
    formData.append("sport", sport);
    formData.append("league", league);

    uploadTeamMutation.mutate(formData);
  };

  const handlePlayerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerForm.file || !playerForm.name) {
      toast({
        title: "Error",
        description: "Please fill all fields and select a file",
        variant: "destructive",
      });
      return;
    }

    // Validate file type (JPEG, PNG, GIF only)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(playerForm.file.type)) {
      toast({
        title: "Error",
        description: "Only JPEG, PNG, and GIF files are allowed",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (2MB limit)
    if (playerForm.file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("photo", playerForm.file);
    formData.append("name", playerForm.name);
    formData.append("sport", sport);
    if (playerForm.country) {
      formData.append("country", playerForm.country);
    }

    uploadPlayerMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card 
          className="flex flex-col items-center justify-center gap-2 cursor-pointer hover-elevate active-elevate-2 border-2 border-dashed min-h-[180px]"
          data-testid="card-upload-trigger"
        >
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-semibold">Upload {isIndividualSport ? "Photo" : "Logo"}</p>
            <p className="text-xs text-muted-foreground">Add custom {isIndividualSport ? "player" : "team"}</p>
          </div>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" data-testid="dialog-upload">
        <DialogHeader>
          <DialogTitle>Upload Custom Data</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue={isIndividualSport ? "player" : "team"} className="w-full mt-4">
          {!isIndividualSport && (
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="team" data-testid="tab-team-upload">Team Logo</TabsTrigger>
              <TabsTrigger value="player" data-testid="tab-player-upload">Player Photo</TabsTrigger>
            </TabsList>
          )}

          {!isIndividualSport && (
            <TabsContent value="team" className="space-y-4">
              <form onSubmit={handleTeamSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="team-name">Team Name</Label>
                  <Input
                    id="team-name"
                    data-testid="input-team-name"
                    value={teamForm.name}
                    onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                    placeholder="e.g., Miami Heat"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="team-file">Logo Image</Label>
                  <Input
                    id="team-file"
                    type="file"
                    data-testid="input-team-file"
                    accept="image/jpeg,image/png,image/gif"
                    onChange={(e) => setTeamForm({ ...teamForm, file: e.target.files?.[0] || null })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Max 2MB. Formats: JPEG, PNG, GIF
                  </p>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    data-testid="button-cancel-team"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    data-testid="button-submit-team"
                    disabled={uploadTeamMutation.isPending}
                  >
                    {uploadTeamMutation.isPending ? "Uploading..." : "Upload Team"}
                  </Button>
                </div>
              </form>
            </TabsContent>
          )}

          <TabsContent value="player" className="space-y-4">
            <form onSubmit={handlePlayerSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="player-name">Player Name</Label>
                <Input
                  id="player-name"
                  data-testid="input-player-name"
                  value={playerForm.name}
                  onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })}
                  placeholder="e.g., Rafael Nadal"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="player-country">Country (Optional)</Label>
                <Input
                  id="player-country"
                  data-testid="input-player-country"
                  value={playerForm.country}
                  onChange={(e) => setPlayerForm({ ...playerForm, country: e.target.value })}
                  placeholder="e.g., Spain"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="player-file">Photo Image</Label>
                <Input
                  id="player-file"
                  type="file"
                  data-testid="input-player-file"
                  accept="image/jpeg,image/png,image/gif"
                  onChange={(e) => setPlayerForm({ ...playerForm, file: e.target.files?.[0] || null })}
                />
                <p className="text-xs text-muted-foreground">
                  Max 2MB. Formats: JPEG, PNG, GIF
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  data-testid="button-cancel-player"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  data-testid="button-submit-player"
                  disabled={uploadPlayerMutation.isPending}
                >
                  {uploadPlayerMutation.isPending ? "Uploading..." : "Upload Player"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function Card({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className || ""}`} {...props}>
      {children}
    </div>
  );
}
