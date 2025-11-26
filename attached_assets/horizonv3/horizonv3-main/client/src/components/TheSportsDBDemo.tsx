import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Search, Calendar, Trophy, AlertCircle, Users } from "lucide-react";
import type { SportsDBEvent, SportsDBTeam } from "@shared/thesportsdb-types";
import { atpPlayers, wtaPlayers, type TennisPlayer } from "@shared/players";
import { UploadTeamPlayerDialog } from "@/components/UploadTeamPlayerDialog";
import { getTeamBadge } from "@/lib/teamUtils";

function TeamLogo({ teamName, logoUrl, size = "md" }: { teamName?: string | null; logoUrl?: string; size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const [fetchedLogo, setFetchedLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!logoUrl && teamName && !loading && !fetchedLogo) {
      setLoading(true);
      getTeamBadge(teamName).then(badge => {
        if (badge) {
          setFetchedLogo(badge);
        }
        setLoading(false);
      });
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

  // Fallback initials
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
  isAdmin?: boolean;
}

export function TheSportsDBDemo({ leagueId = "4387", leagueName = "NBA", displayName, leagueBadge, sport = "Basketball", isAdmin = false }: TheSportsDBDemoProps) {
  const displayLeagueName = displayName || leagueName;
  const [teamSearch, setTeamSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [playerSearch, setPlayerSearch] = useState("");
  const [playersToShow, setPlayersToShow] = useState(30);
  const [eventsToShow, setEventsToShow] = useState(50);
  
  // Check if table tennis
  const isTableTennis = !!(leagueName && leagueName.toLowerCase().includes('table tennis'));

  // Check if specifically ATP or WTA tour (not generic tennis events like Olympics)
  const isATP = !!(leagueName && leagueName.toLowerCase().includes('atp'));
  const isWTA = !!(leagueName && leagueName.toLowerCase().includes('wta'));
  const isTennisTour = isATP || isWTA;

  // Check for other individual sports (players, not teams)
  const isDarts = !!(sport && sport.toLowerCase().includes('darts'));
  const isMotorsport = !!(sport && (sport.toLowerCase().includes('motorsport') || sport.toLowerCase().includes('racing')));
  const isFighting = !!(sport && (sport.toLowerCase().includes('fighting') || sport.toLowerCase().includes('mma') || sport.toLowerCase().includes('boxing')));
  const isGolf = !!(sport && sport.toLowerCase().includes('golf'));

  // Check if this is an individual sport that should show players instead of teams
  const isIndividualSport = isTennisTour || isTableTennis || isDarts || isMotorsport || isFighting || isGolf;

  // Determine which tour/sport name to display
  const tourName = isTableTennis ? 'Table Tennis' 
    : isDarts ? 'Darts'
    : isMotorsport ? 'Motorsport'
    : isFighting ? 'Fighting'
    : isGolf ? 'Golf'
    : (isWTA ? 'WTA' : 'ATP');
  
  // Select the correct player database (only for tour-specific leagues)
  const selectedPlayers = isTableTennis ? [] : (isWTA ? wtaPlayers : atpPlayers);

  const { data: upcomingEvents, isLoading: eventsLoading, error: eventsError } = useQuery<SportsDBEvent[]>({
    queryKey: ['/api/sports/events/upcoming', leagueId],
    enabled: !!leagueId,
  });

  const { data: teams, isLoading: teamsLoading, error: teamsError } = useQuery<SportsDBTeam[]>({
    queryKey: ['/api/sports/teams/league', leagueName],
    enabled: !!leagueName,
  });

  // Fetch teams from events with pre-cached badges (server-side)
  // Always fetch this to supplement the league teams data
  const { data: teamsFromEventsData, isLoading: teamsFromEventsLoading } = useQuery<Array<{ name: string; badge: string | null }>>({
    queryKey: ['/api/sports/leagues', leagueId, 'teams-from-events'],
    enabled: !!leagueId,
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery<SportsDBTeam[]>({
    queryKey: ['/api/sports/teams/search', searchTerm],
    enabled: searchTerm.length > 2,
  });

  // Create a lookup map from team names to logos using the league teams data
  const teamLogoMap = new Map<string, string>();
  teams?.forEach(team => {
    if (team.strBadge) {
      teamLogoMap.set(team.strTeam.toLowerCase(), team.strBadge);
    }
  });

  // Also add teams from events to the map
  teamsFromEventsData?.forEach(team => {
    if (team.badge) {
      teamLogoMap.set(team.name.toLowerCase(), team.badge);
    }
  });

  // Use teams from API if available, otherwise use teams from events (with server-cached badges)
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

  // Filter players based on search and selected tour
  const filteredPlayers = useMemo(() => {
    if (!playerSearch || playerSearch.length < 2) return [];
    
    const searchLower = playerSearch.toLowerCase();
    return Object.values(selectedPlayers).filter(player => 
      player.name.toLowerCase().includes(searchLower) ||
      player.country?.toLowerCase().includes(searchLower)
    );
  }, [playerSearch, selectedPlayers]);

  // Get all players for display (from selected tour)
  const allPlayers = useMemo(() => Object.values(selectedPlayers), [selectedPlayers]);

  // Reset players and events to show when switching leagues
  useEffect(() => {
    setPlayersToShow(30);
    setEventsToShow(50);
  }, [leagueName]);

  return (
    <div className="space-y-6">
      {isIndividualSport ? (
        // Individual Sport Player Search (Tennis/Table Tennis)
        <>
          <Card className="bg-card/50 backdrop-blur-sm border-card-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Players
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder={`Search for ${tourName} players...`}
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  data-testid="input-player-search"
                />
                <Button 
                  onClick={() => {}} 
                  disabled={playerSearch.length < 2}
                  data-testid="button-search-players"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {filteredPlayers.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPlayers.map((player) => {
                    const safePlayerName = player.name.toLowerCase().replace(/'/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                    const headshotUrl = `/${safePlayerName}.png`;
                    
                    return (
                      <Card key={player.code} className="bg-card/50 backdrop-blur-sm border-card-border hover-elevate" data-testid={`card-player-${player.code}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage 
                                src={headshotUrl} 
                                alt={player.name}
                                onError={(e) => {
                                  console.error(`Failed to load search image for ${player.name}: ${headshotUrl}`);
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              <AvatarFallback>{player.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate" data-testid={`text-player-name-${player.code}`}>
                                {player.name}
                              </p>
                              {player.country && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {player.country}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {tourName} Tour
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {playerSearch && filteredPlayers.length === 0 && playerSearch.length >= 2 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>No players found for "{playerSearch}"</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-card-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {isTableTennis ? "Table Tennis Players" : `${tourName} ${isWTA ? "Women's" : "Men's"} Players`}
              </CardTitle>
              <CardDescription>
                {isTableTennis 
                  ? `Professional table tennis players (${allPlayers.length} players)` 
                  : `Top ${tourName} players with official headshots (${allPlayers.length} players)`
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {allPlayers.slice(0, playersToShow).map((player) => {
                  const safePlayerName = player.name.toLowerCase().replace(/'/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                  const headshotUrl = `/${safePlayerName}.png`;
                  console.log(`[Tennis] ${player.name} -> ${headshotUrl}`);
                  
                  return (
                    <Card 
                      key={player.code} 
                      className="bg-card/50 backdrop-blur-sm border-card-border hover-elevate cursor-pointer" 
                      data-testid={`card-atp-player-${player.code}`}
                    >
                      <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                        <Avatar className="h-16 w-16">
                          <AvatarImage 
                            src={headshotUrl} 
                            alt={player.name}
                            onError={(e) => {
                              console.error(`Failed to load image for ${player.name}: ${headshotUrl}`);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <AvatarFallback className="text-lg font-bold">
                            {player.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="w-full">
                          <p className="font-semibold text-sm truncate" data-testid={`text-atp-player-name-${player.code}`}>
                            {player.name}
                          </p>
                          {player.country && (
                            <p className="text-xs text-muted-foreground">
                              {player.country}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                
                {isAdmin && playersToShow >= allPlayers.length && (
                  <UploadTeamPlayerDialog 
                    sport={sport} 
                    league={leagueName}
                    isIndividualSport={isIndividualSport}
                  />
                )}
              </div>
              
              {playersToShow < allPlayers.length && (
                <div className="flex justify-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setPlayersToShow(prev => Math.min(prev + 30, allPlayers.length))}
                    data-testid="button-show-more-players"
                  >
                    Show More Players ({allPlayers.length - playersToShow} remaining)
                  </Button>
                </div>
              )}
              
              {playersToShow >= allPlayers.length && allPlayers.length > 30 && (
                <div className="flex justify-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setPlayersToShow(30)}
                    data-testid="button-show-less-players"
                  >
                    Show Less
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        // Team Search (for non-tennis sports)
        <Card className="bg-card/50 backdrop-blur-sm border-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search {isIndividualSport ? 'Players' : 'Teams'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder={isIndividualSport 
                  ? `Search for a ${tourName.toLowerCase()} player...` 
                  : "Search for a team (e.g., Lakers, Warriors)..."}
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
                  <Card key={team.idTeam} className="bg-card/50 backdrop-blur-sm border-card-border hover-elevate" data-testid={`card-team-${team.idTeam}`}>
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
      )}

      <Card className="bg-card/50 backdrop-blur-sm border-card-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {displayLeagueName} {isIndividualSport ? 'Players' : 'Teams'}
          </CardTitle>
          <CardDescription>
            All {isIndividualSport ? 'players' : 'teams'} in {displayLeagueName} with official {isIndividualSport ? 'headshots' : 'logos'}
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
                  className="bg-card/50 backdrop-blur-sm border-card-border hover-elevate cursor-pointer" 
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
              
              {isAdmin && !isIndividualSport && (
                <UploadTeamPlayerDialog 
                  sport={sport} 
                  league={leagueName}
                  isIndividualSport={isIndividualSport}
                />
              )}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No teams found for this league</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm border-card-border">
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
                    <Card key={event.idEvent} className="bg-card/50 backdrop-blur-sm border-card-border hover-elevate" data-testid={`card-event-${event.idEvent}`}>
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
                              {new Date(event.dateEvent).toLocaleDateString()}
                            </p>
                            {event.strTime && (
                              <p className="text-xs text-muted-foreground">
                                {event.strTime}
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
              <AlertDescription>No upcoming events scheduled</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
