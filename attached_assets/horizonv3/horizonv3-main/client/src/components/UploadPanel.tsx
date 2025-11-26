import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface UploadPanelProps {
  sport: string;
  defaultLeague?: string;
}

export function UploadPanel({ sport, defaultLeague }: UploadPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [teamForm, setTeamForm] = useState({
    name: "",
    league: defaultLeague || "",
    file: null as File | null,
  });

  const [playerForm, setPlayerForm] = useState({
    name: "",
    country: "",
    file: null as File | null,
  });

  const [leagueForm, setLeagueForm] = useState({
    name: "",
    file: null as File | null,
  });

  const uploadTeamMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/sports/custom/teams/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Team logo uploaded successfully",
      });
      setTeamForm({ name: "", league: defaultLeague || "", file: null });
      queryClient.invalidateQueries({ queryKey: ["/api/sports/custom/teams"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload team logo",
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
      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Player photo uploaded successfully",
      });
      setPlayerForm({ name: "", country: "", file: null });
      queryClient.invalidateQueries({ queryKey: ["/api/sports/custom/players"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload player photo",
        variant: "destructive",
      });
    },
  });

  const uploadLeagueMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/sports/custom/leagues/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "League badge uploaded successfully",
      });
      setLeagueForm({ name: "", file: null });
      queryClient.invalidateQueries({ queryKey: ["/api/sports/custom/leagues"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload league badge",
        variant: "destructive",
      });
    },
  });

  const handleTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.file || !teamForm.name || !teamForm.league) {
      toast({
        title: "Error",
        description: "Please fill all fields and select a file",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("logo", teamForm.file);
    formData.append("name", teamForm.name);
    formData.append("sport", sport);
    formData.append("league", teamForm.league);

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

    const formData = new FormData();
    formData.append("photo", playerForm.file);
    formData.append("name", playerForm.name);
    formData.append("sport", sport);
    if (playerForm.country) {
      formData.append("country", playerForm.country);
    }

    uploadPlayerMutation.mutate(formData);
  };

  const handleLeagueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leagueForm.name) {
      toast({
        title: "Error",
        description: "Please enter a league name",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    if (leagueForm.file) {
      formData.append("badge", leagueForm.file);
    }
    formData.append("name", leagueForm.name);
    formData.append("sport", sport);

    uploadLeagueMutation.mutate(formData);
  };

  return (
    <Card className="mb-6" data-testid="card-upload-panel">
      <CardHeader className="cursor-pointer hover-elevate active-elevate-2" onClick={() => setIsExpanded(!isExpanded)} data-testid="button-upload-toggle">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Custom Data
          </CardTitle>
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <Tabs defaultValue="team" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="team" data-testid="tab-team-upload">Team Logo</TabsTrigger>
              <TabsTrigger value="player" data-testid="tab-player-upload">Player Photo</TabsTrigger>
              <TabsTrigger value="league" data-testid="tab-league-upload">League Badge</TabsTrigger>
            </TabsList>

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
                  <Label htmlFor="team-league">League</Label>
                  <Input
                    id="team-league"
                    data-testid="input-team-league"
                    value={teamForm.league}
                    onChange={(e) => setTeamForm({ ...teamForm, league: e.target.value })}
                    placeholder="e.g., NBA"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="team-file">Logo Image</Label>
                  <Input
                    id="team-file"
                    type="file"
                    data-testid="input-team-file"
                    accept="image/*"
                    onChange={(e) => setTeamForm({ ...teamForm, file: e.target.files?.[0] || null })}
                  />
                </div>

                <Button 
                  type="submit" 
                  data-testid="button-submit-team"
                  disabled={uploadTeamMutation.isPending}
                  className="w-full"
                >
                  {uploadTeamMutation.isPending ? "Uploading..." : "Upload Team Logo"}
                </Button>
              </form>
            </TabsContent>

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
                    accept="image/*"
                    onChange={(e) => setPlayerForm({ ...playerForm, file: e.target.files?.[0] || null })}
                  />
                </div>

                <Button 
                  type="submit" 
                  data-testid="button-submit-player"
                  disabled={uploadPlayerMutation.isPending}
                  className="w-full"
                >
                  {uploadPlayerMutation.isPending ? "Uploading..." : "Upload Player Photo"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="league" className="space-y-4">
              <form onSubmit={handleLeagueSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="league-name">League Name</Label>
                  <Input
                    id="league-name"
                    data-testid="input-league-name"
                    value={leagueForm.name}
                    onChange={(e) => setLeagueForm({ ...leagueForm, name: e.target.value })}
                    placeholder="e.g., Premier League"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="league-file">Badge Image (Optional)</Label>
                  <Input
                    id="league-file"
                    type="file"
                    data-testid="input-league-file"
                    accept="image/*"
                    onChange={(e) => setLeagueForm({ ...leagueForm, file: e.target.files?.[0] || null })}
                  />
                </div>

                <Button 
                  type="submit" 
                  data-testid="button-submit-league"
                  disabled={uploadLeagueMutation.isPending}
                  className="w-full"
                >
                  {uploadLeagueMutation.isPending ? "Uploading..." : "Upload League"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
}
