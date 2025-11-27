import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Calendar, Trophy, AlertCircle, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { SportsDBEvent, SportsDBTeam } from "@shared/thesportsdb-types";

function TeamLogo({ teamName, logoUrl, size = "md" }: { teamName?: string | null; logoUrl?: string; size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const [fetchedLogo, setFetchedLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!logoUrl && teamName && !loading && !fetchedLogo) {
      setLoading(true);
      fetch(`/api/sports/teams/badge/${encodeURIComponent(teamName)}`)
        .then(res => res.json())
        .then(data => {
          if (data.badge) {
            setFetchedLogo(data.badge);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [teamName, logoUrl, loading, fetchedLogo]);

  const displayLogo = logoUrl || fetchedLogo;

  if (displayLogo) {
    return (
      <img 
        src={displayLogo} 
        alt={teamName || 'Team logo'}
        className={`${sizeClass} rounded-full object-cover shrink-0`}
      />
    );
  }

  const initials = teamName 
    ? teamName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '??';
  
  return (
    <div className={`${sizeClass} rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0`}>
      {initials}
    </div>
  );
}

interface TheSportsDBDemoProps {
  leagueId?: string;
  leagueName?: string;
  displayName?: string;
  leagueBadge?: string;
  sport?: string;
}

export function TheSportsDBDemo({ 
  leagueId = "4387", 
  leagueName = "NBA", 
  displayName, 
  leagueBadge, 
  sport = "Basketball" 
}: TheSportsDBDemoProps) {
  const displayLeagueName = displayName || leagueName;
  const [teamSearch, setTeamSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [eventsToShow, setEventsToShow] = useState(50);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({ name: "", logoUrl: "" });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadTeamMutation = useMutation({
    mutationFn: async (data: { name: string; logoUrl: string }) => {
      const payload = {
        entityType: 'team' as const,
        entityId: `custom_team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        entityName: data.name,
        logoUrl: data.logoUrl,
        sportId: sport.toLowerCase().replace(/\s+/g, '-'),
        leagueId: leagueId,
      };
      const response = await apiRequest('POST', '/api/sports/custom-media', payload);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Team logo added successfully" });
      setUploadForm({ name: "", logoUrl: "" });
      setUploadDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/sports/custom-media"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add team logo", variant: "destructive" });
    },
  });

  const handleUploadSubmit = () => {
    if (!uploadForm.name || !uploadForm.logoUrl) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }
    uploadTeamMutation.mutate(uploadForm);
  };

  const { data: upcomingEvents, isLoading: eventsLoading, error: eventsError } = useQuery<SportsDBEvent[]>({
    queryKey: ['/api/sports/events/upcoming', leagueId],
    enabled: !!leagueId,
  });

  const { data: teams, isLoading: teamsLoading } = useQuery<SportsDBTeam[]>({
    queryKey: ['/api/sports/teams/league', leagueName],
    enabled: !!leagueName,
  });

  const { data: teamsFromEventsData, isLoading: teamsFromEventsLoading } = useQuery<Array<{ name: string; badge: string | null }>>({
    queryKey: ['/api/sports/teams/from-events', leagueId],
    enabled: !!leagueId,
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery<SportsDBTeam[]>({
    queryKey: ['/api/sports/teams/search', searchTerm],
    enabled: searchTerm.length > 2,
  });

  const teamLogoMap = new Map<string, string>();
  teams?.forEach(team => {
    if (team.strBadge) {
      teamLogoMap.set(team.strTeam.toLowerCase(), team.strBadge);
    }
  });

  teamsFromEventsData?.forEach(team => {
    if (team.badge) {
      teamLogoMap.set(team.name.toLowerCase(), team.badge);
    }
  });

  const displayTeams = teams && teams.length > 0 
    ? teams 
    : (teamsFromEventsData || []).map(team => ({
        idTeam: team.name,
        strTeam: team.name,
        strBadge: team.badge || undefined,
        strTeamShort: '',
      }));

  const handleSearch = () => {
    setSearchTerm(teamSearch);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  useEffect(() => {
    setEventsToShow(50);
  }, [leagueName]);

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Teams
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search for a team (e.g., Lakers, Warriors)..."
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              data-testid="input-team-search"
            />
            <Button 
              onClick={handleSearch} 
              disabled={teamSearch.length < 3}
              data-testid="button-search-teams"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {searchLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          )}

          {searchResults && searchResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((team) => (
                <Card key={team.idTeam} className="bg-card/50 backdrop-blur-sm border-border hover-elevate" data-testid={`card-team-${team.idTeam}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        {team.strBadge && <AvatarImage src={team.strBadge} alt={team.strTeam} />}
                        <AvatarFallback>{team.strTeamShort || team.strTeam.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" data-testid={`text-team-name-${team.idTeam}`}>
                          {team.strTeam}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {team.strLeague}
                        </p>
                        {team.strStadium && (
                          <p className="text-xs text-muted-foreground truncate">
                            {team.strStadium}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {searchTerm && searchResults && searchResults.length === 0 && !searchLoading && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No teams found for "{searchTerm}"</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {displayLeagueName} Teams
          </CardTitle>
          <CardDescription>
            All teams in {displayLeagueName} with official logos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(teamsLoading || teamsFromEventsLoading) && !displayTeams.length ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : displayTeams && displayTeams.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {displayTeams.map((team) => (
                <Card 
                  key={team.idTeam} 
                  className="bg-card/50 backdrop-blur-sm border-border hover-elevate cursor-pointer" 
                  data-testid={`card-league-team-${team.idTeam}`}
                >
                  <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                    <Avatar className="h-16 w-16">
                      {team.strBadge && <AvatarImage src={team.strBadge} alt={team.strTeam} />}
                      <AvatarFallback className="text-lg font-bold">{team.strTeamShort || team.strTeam.slice(0, 3).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="w-full">
                      <p className="font-semibold text-sm truncate" data-testid={`text-league-team-name-${team.idTeam}`}>
                        {team.strTeam}
                      </p>
                      {team.strTeamShort && (
                        <p className="text-xs text-muted-foreground">
                          {team.strTeamShort}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Upload Logo Card */}
              <Card 
                className="bg-card/30 border-dashed border-2 border-muted-foreground/30 hover-elevate cursor-pointer" 
                onClick={() => setUploadDialogOpen(true)}
                data-testid="card-upload-team-logo"
              >
                <CardContent className="p-4 flex flex-col items-center text-center gap-2 h-full justify-center">
                  <div className="h-16 w-16 rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="w-full">
                    <p className="font-semibold text-sm">Upload Logo</p>
                    <p className="text-xs text-muted-foreground">Add custom team</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No teams found for this league</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {leagueBadge ? (
              <img src={leagueBadge} alt={displayLeagueName} className="h-6 w-6 object-contain" />
            ) : (
              <Calendar className="h-5 w-5" />
            )}
            Upcoming {displayLeagueName} Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {eventsError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Failed to load upcoming events</AlertDescription>
            </Alert>
          )}

          {eventsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : upcomingEvents && upcomingEvents.length > 0 ? (
            <>
              <div className="space-y-4">
                {upcomingEvents.slice(0, eventsToShow).map((event) => {
                  const homeTeamLogo = teamLogoMap.get(event.strHomeTeam?.toLowerCase() || '');
                  const awayTeamLogo = teamLogoMap.get(event.strAwayTeam?.toLowerCase() || '');
                  
                  return (
                    <Card key={event.idEvent} className="bg-card/50 backdrop-blur-sm border-border hover-elevate" data-testid={`card-event-${event.idEvent}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="flex items-center gap-2 justify-end flex-1 min-w-0">
                                <TeamLogo teamName={event.strHomeTeam} logoUrl={homeTeamLogo} size="sm" />
                                <p className="font-semibold truncate" data-testid={`text-home-team-${event.idEvent}`}>
                                  {event.strHomeTeam || 'TBD'}
                                </p>
                              </div>
                              <Badge variant="outline" className="px-3 py-1 shrink-0">
                                VS
                              </Badge>
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <p className="font-semibold truncate" data-testid={`text-away-team-${event.idEvent}`}>
                                  {event.strAwayTeam || 'TBD'}
                                </p>
                                <TeamLogo teamName={event.strAwayTeam} logoUrl={awayTeamLogo} size="sm" />
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-medium" data-testid={`text-event-date-${event.idEvent}`}>
                              {event.dateEvent}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {event.strTime || 'TBD'}
                            </p>
                            {event.strVenue && (
                              <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                {event.strVenue}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              {eventsToShow < upcomingEvents.length && (
                <div className="flex justify-center mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setEventsToShow(prev => Math.min(prev + 50, upcomingEvents.length))}
                    data-testid="button-show-more-events"
                  >
                    Show More Events ({upcomingEvents.length - eventsToShow} remaining)
                  </Button>
                </div>
              )}
              
              {eventsToShow >= upcomingEvents.length && upcomingEvents.length > 50 && (
                <div className="flex justify-center mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setEventsToShow(50)}
                    data-testid="button-show-less-events"
                  >
                    Show Less
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No upcoming events for {displayLeagueName}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Upload Team Logo Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Team Logo</DialogTitle>
            <DialogDescription>
              Add a custom team logo for this league.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                value={uploadForm.name}
                onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                placeholder="e.g., Los Angeles Lakers"
                data-testid="input-upload-team-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                value={uploadForm.logoUrl}
                onChange={(e) => setUploadForm({ ...uploadForm, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
                data-testid="input-upload-logo-url"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUploadDialogOpen(false);
                setUploadForm({ name: "", logoUrl: "" });
              }}
              data-testid="button-cancel-upload"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadSubmit}
              disabled={uploadTeamMutation.isPending}
              data-testid="button-submit-upload"
            >
              {uploadTeamMutation.isPending ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
