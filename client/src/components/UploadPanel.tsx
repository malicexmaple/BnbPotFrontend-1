import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, ChevronDown, ChevronUp, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
    logoUrl: "",
  });

  const [playerForm, setPlayerForm] = useState({
    name: "",
    country: "",
    photoUrl: "",
  });

  const [leagueForm, setLeagueForm] = useState({
    name: "",
    badgeUrl: "",
  });

  const addTeamMutation = useMutation({
    mutationFn: async (data: { name: string; league: string; logoUrl: string }) => {
      const payload = {
        entityType: 'team' as const,
        entityId: `custom_team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        entityName: data.name,
        logoUrl: data.logoUrl,
        sportId: sport.toLowerCase().replace(/\s+/g, '-'),
        leagueId: data.league.toLowerCase().replace(/\s+/g, '-'),
      };
      const response = await apiRequest('POST', '/api/sports/custom-media', payload);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Team logo added successfully",
      });
      setTeamForm({ name: "", league: defaultLeague || "", logoUrl: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/sports/custom-media"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add team logo",
        variant: "destructive",
      });
    },
  });

  const addPlayerMutation = useMutation({
    mutationFn: async (data: { name: string; country: string; photoUrl: string }) => {
      const payload = {
        entityType: 'player' as const,
        entityId: `custom_player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        entityName: data.name,
        photoUrl: data.photoUrl,
        sportId: sport.toLowerCase().replace(/\s+/g, '-'),
      };
      const response = await apiRequest('POST', '/api/sports/custom-media', payload);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Player photo added successfully",
      });
      setPlayerForm({ name: "", country: "", photoUrl: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/sports/custom-media"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add player photo",
        variant: "destructive",
      });
    },
  });

  const addLeagueMutation = useMutation({
    mutationFn: async (data: { name: string; badgeUrl: string }) => {
      const payload = {
        entityType: 'league' as const,
        entityId: `custom_league_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        entityName: data.name,
        logoUrl: data.badgeUrl || undefined,
        sportId: sport.toLowerCase().replace(/\s+/g, '-'),
      };
      const response = await apiRequest('POST', '/api/sports/custom-media', payload);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "League badge added successfully",
      });
      setLeagueForm({ name: "", badgeUrl: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/sports/custom-media"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add league badge",
        variant: "destructive",
      });
    },
  });

  const handleTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.name || !teamForm.league || !teamForm.logoUrl) {
      toast({
        title: "Error",
        description: "Please fill all fields including the logo URL",
        variant: "destructive",
      });
      return;
    }

    addTeamMutation.mutate(teamForm);
  };

  const handlePlayerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerForm.name || !playerForm.photoUrl) {
      toast({
        title: "Error",
        description: "Please enter player name and photo URL",
        variant: "destructive",
      });
      return;
    }

    addPlayerMutation.mutate(playerForm);
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

    addLeagueMutation.mutate(leagueForm);
  };

  return (
    <Card className="mb-6" data-testid="card-upload-panel">
      <CardHeader className="cursor-pointer hover-elevate active-elevate-2" onClick={() => setIsExpanded(!isExpanded)} data-testid="button-upload-toggle">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Add Custom Media
          </CardTitle>
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Add custom team logos, player photos, or league badges by providing an image URL. 
            Images can be hosted on services like Imgur, Cloudinary, or any public URL.
          </p>
          
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
                  <Label htmlFor="team-logo-url" className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Logo Image URL
                  </Label>
                  <Input
                    id="team-logo-url"
                    data-testid="input-team-logo-url"
                    value={teamForm.logoUrl}
                    onChange={(e) => setTeamForm({ ...teamForm, logoUrl: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <Button 
                  type="submit" 
                  data-testid="button-submit-team"
                  disabled={addTeamMutation.isPending}
                  className="w-full"
                >
                  {addTeamMutation.isPending ? "Adding..." : "Add Team Logo"}
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
                  <Label htmlFor="player-photo-url" className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Photo Image URL
                  </Label>
                  <Input
                    id="player-photo-url"
                    data-testid="input-player-photo-url"
                    value={playerForm.photoUrl}
                    onChange={(e) => setPlayerForm({ ...playerForm, photoUrl: e.target.value })}
                    placeholder="https://example.com/photo.png"
                  />
                </div>

                <Button 
                  type="submit" 
                  data-testid="button-submit-player"
                  disabled={addPlayerMutation.isPending}
                  className="w-full"
                >
                  {addPlayerMutation.isPending ? "Adding..." : "Add Player Photo"}
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
                  <Label htmlFor="league-badge-url" className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Badge Image URL (Optional)
                  </Label>
                  <Input
                    id="league-badge-url"
                    data-testid="input-league-badge-url"
                    value={leagueForm.badgeUrl}
                    onChange={(e) => setLeagueForm({ ...leagueForm, badgeUrl: e.target.value })}
                    placeholder="https://example.com/badge.png"
                  />
                </div>

                <Button 
                  type="submit" 
                  data-testid="button-submit-league"
                  disabled={addLeagueMutation.isPending}
                  className="w-full"
                >
                  {addLeagueMutation.isPending ? "Adding..." : "Add League"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
}
