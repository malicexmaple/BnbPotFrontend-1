import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Clock, Hand, Zap } from "lucide-react";
import { sportsData } from "@shared/sports-leagues";
import { apiRequest } from "@/lib/queryClient";
import type { VisibilitySetting } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// All sports now have dropdown menus in the sidebar, so we can show visibility controls for all leagues

export function SportVisibilityControls() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedSports, setExpandedSports] = useState<Set<string>>(new Set());

  const { data: settings = [] } = useQuery<VisibilitySetting[]>({
    queryKey: ['/api/visibility-settings'],
  });

  // Fetch league activity status to know which leagues have upcoming events
  const { data: activityStatus } = useQuery<{ activeLeagueIds: string[] }>({
    queryKey: ['/api/leagues/activity-status'],
    refetchInterval: 60000, // Refresh every minute
  });

  const toggleSportMutation = useMutation({
    mutationFn: async ({ sportId, isVisible }: { sportId: string; isVisible: boolean }) => {
      return await apiRequest('POST', `/api/admin/visibility/sport/${sportId}`, { isVisible });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/visibility-settings'] });
      toast({ title: "Sport visibility updated" });
    },
  });

  const toggleLeagueMutation = useMutation({
    mutationFn: async ({ leagueId, sportId, isVisible }: { leagueId: string; sportId: string; isVisible: boolean }) => {
      return await apiRequest('POST', `/api/admin/visibility/league/${leagueId}`, { sportId, isVisible });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/visibility-settings'] });
      toast({ title: "League visibility updated" });
    },
  });

  const isSportVisible = (sportId: string) => {
    const setting = settings.find(s => s.type === 'sport' && s.sportId === sportId);
    return setting ? setting.isVisible : true;
  };

  const isLeagueVisible = (leagueId: string) => {
    const setting = settings.find(s => s.type === 'league' && s.leagueId === leagueId);
    return setting ? setting.isVisible : true;
  };

  // Get the status and reason for a league's visibility
  const getLeagueStatus = (leagueId: string): {
    visible: boolean;
    reason: 'manual-visible' | 'manual-hidden' | 'auto-hidden' | 'auto-visible';
    hasUpcomingEvents: boolean;
    manualOverride: boolean;
  } => {
    const setting = settings.find(s => s.type === 'league' && s.leagueId === leagueId);
    const hasUpcomingEvents = activityStatus?.activeLeagueIds.includes(leagueId) ?? true;
    
    if (!setting) {
      // No setting exists, default behavior
      return {
        visible: hasUpcomingEvents,
        reason: hasUpcomingEvents ? 'auto-visible' : 'auto-hidden',
        hasUpcomingEvents,
        manualOverride: false,
      };
    }
    
    if (setting.manualOverride) {
      // Manual override is set - admin has explicitly set visibility
      return {
        visible: setting.isVisible,
        reason: setting.isVisible ? 'manual-visible' : 'manual-hidden',
        hasUpcomingEvents,
        manualOverride: true,
      };
    }
    
    // No manual override - visibility depends on both isVisible AND hasUpcomingEvents
    const visible = setting.isVisible && hasUpcomingEvents;
    return {
      visible,
      reason: !hasUpcomingEvents ? 'auto-hidden' : (setting.isVisible ? 'auto-visible' : 'manual-hidden'),
      hasUpcomingEvents,
      manualOverride: false,
    };
  };

  const toggleExpanded = (sportId: string) => {
    const newSet = new Set(expandedSports);
    if (newSet.has(sportId)) {
      newSet.delete(sportId);
    } else {
      newSet.add(sportId);
    }
    setExpandedSports(newSet);
  };

  // Filter sports to only show those that are actually in the sidebar
  const displayedSports = sportsData.filter(sport => {
    // Exclude only the generic esports category (individual esports are included)
    if (sport.id === 'esports') return false;
    
    // Include everything else - all sports appear in sidebar either as:
    // 1. Dropdown menus (basketball, american-football, baseball, tennis, darts)
    // 2. Individual esports (cs2, dota2, lol, valorant)
    // 3. Links to league selection pages (all other sports like rugby, soccer, etc.)
    return true;
  });

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-card-border">
      <CardHeader>
        <CardTitle>Sport & League Visibility</CardTitle>
        <CardDescription>
          Control which sports and leagues appear in the sidebar and markets. Leagues without events in the next 2 weeks are auto-hidden unless manually overridden.
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <Badge variant="outline" className="gap-1"><Hand className="h-3 w-3" />Manual - Admin override active</Badge>
            <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Auto-hidden - No upcoming events</Badge>
            <Badge variant="default" className="gap-1 opacity-70"><Zap className="h-3 w-3" />Active - Has upcoming events</Badge>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayedSports.map((sport) => {
          const visible = isSportVisible(sport.id);
          const isExpanded = expandedSports.has(sport.id);
          const displayedLeagues = sport.leagues; // Show ALL leagues for this sport
          
          return (
            <div key={sport.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {displayedLeagues.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(sport.id)}
                      data-testid={`button-expand-${sport.id}`}
                    >
                      {isExpanded ? '▼' : '▶'}
                    </Button>
                  )}
                  <span className="font-semibold">{sport.name}</span>
                  {displayedLeagues.length > 0 && (
                    <Badge variant={visible ? "default" : "secondary"}>
                      {displayedLeagues.length} leagues
                    </Badge>
                  )}
                </div>
                <Button
                  variant={visible ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleSportMutation.mutate({ sportId: sport.id, isVisible: !visible })}
                  disabled={toggleSportMutation.isPending}
                  data-testid={`button-toggle-sport-${sport.id}`}
                >
                  {visible ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                  {visible ? 'Visible' : 'Hidden'}
                </Button>
              </div>

              {isExpanded && displayedLeagues.length > 0 && (
                <div className="ml-8 space-y-2 pt-2 border-t">
                  {displayedLeagues.map((league) => {
                    const status = getLeagueStatus(league.id);
                    
                    return (
                      <div key={league.id} className="flex items-center justify-between py-2 hover-elevate rounded px-3">
                        <div className="flex items-center gap-2 flex-1">
                          {league.badge && (
                            <img 
                              src={league.badge} 
                              alt={league.displayName} 
                              className="h-5 w-5 object-contain" 
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          )}
                          <span className="text-sm">{league.displayName}</span>
                          
                          {/* Visual indicators for league status */}
                          <div className="flex items-center gap-1 ml-2">
                            {status.manualOverride && (
                              <Badge variant="outline" className="text-xs gap-1">
                                <Hand className="h-3 w-3" />
                                Manual
                              </Badge>
                            )}
                            
                            {status.reason === 'auto-hidden' && (
                              <Badge variant="secondary" className="text-xs gap-1">
                                <Clock className="h-3 w-3" />
                                Auto-hidden
                              </Badge>
                            )}
                            
                            {status.reason === 'auto-visible' && status.hasUpcomingEvents && (
                              <Badge variant="default" className="text-xs gap-1 opacity-70">
                                <Zap className="h-3 w-3" />
                                Active
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          variant={status.visible ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleLeagueMutation.mutate({ 
                            leagueId: league.id, 
                            sportId: sport.id, 
                            isVisible: !status.visible 
                          })}
                          disabled={toggleLeagueMutation.isPending}
                          data-testid={`button-toggle-league-${league.id}`}
                        >
                          {status.visible ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                          {status.visible ? 'Show' : 'Hide'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
