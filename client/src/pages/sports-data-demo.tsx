import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TheSportsDBDemo } from "@/components/TheSportsDBDemo";
import { NetworkBackground } from "@/components/NetworkBackground";
import { LiveBettingFeed } from "@/components/LiveBettingFeed";
import { SportVisibilityControls } from "@/components/SportVisibilityControls";
import { UploadPanel } from "@/components/UploadPanel";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { sportsData } from "@shared/sports-leagues";
import type { SportsVisibility, LeaguesVisibility } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Gamepad2, Settings, ChevronDown, ChevronRight, Plus, FolderPlus } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface VisibilitySettings {
  sports: SportsVisibility[];
  leagues: LeaguesVisibility[];
}

function getSportIcon(sport: typeof sportsData[0], className: string = "h-4 w-4") {
  if (sport.iconType === 'svg') {
    return (
      <img 
        src={`/sport-icons/${sport.iconName}.svg`} 
        alt={sport.name}
        className={`${className} brightness-0 invert`}
        onError={(e) => { 
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  } else if (sport.iconType === 'custom') {
    return (
      <img 
        src={`/sport-icons/${sport.iconName}.png`} 
        alt={sport.name}
        className={`${className} brightness-0 invert`}
        onError={(e) => { 
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  } else {
    const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
    const IconComponent = icons[sport.iconName] || Gamepad2;
    return <IconComponent className={className} />;
  }
}

export default function SportsDataDemo() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const { toast } = useToast();
  const [selectedLeagues, setSelectedLeagues] = useState<Record<string, string>>(
    Object.fromEntries(sportsData.map(sport => [sport.id, sport.leagues[0]?.id || ""]))
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addLeagueDialogOpen, setAddLeagueDialogOpen] = useState(false);
  const [addSportDialogOpen, setAddSportDialogOpen] = useState(false);
  const [currentSportForLeague, setCurrentSportForLeague] = useState<string>("");
  const [newLeagueName, setNewLeagueName] = useState("");
  const [newSportName, setNewSportName] = useState("");

  const { data: visibilitySettings } = useQuery<VisibilitySettings>({
    queryKey: ['/api/sports/visibility'],
    enabled: isAdmin,
  });

  const createLeagueMutation = useMutation({
    mutationFn: async ({ sportId, leagueName }: { sportId: string; leagueName: string }) => {
      const response = await apiRequest('POST', '/api/sports/leagues', { sportId, leagueName });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sports'] });
      toast({
        title: "League created",
        description: "The league folder has been created successfully.",
      });
      setAddLeagueDialogOpen(false);
      setNewLeagueName("");
      setCurrentSportForLeague("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create league.",
        variant: "destructive",
      });
    },
  });

  const createSportMutation = useMutation({
    mutationFn: async ({ sportName }: { sportName: string }) => {
      const response = await apiRequest('POST', '/api/sports/folders', { sportName });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sports'] });
      toast({
        title: "Sport created",
        description: "The sport folder has been created successfully.",
      });
      setAddSportDialogOpen(false);
      setNewSportName("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create sport.",
        variant: "destructive",
      });
    },
  });

  const isSportHidden = (sportId: string): boolean => {
    return visibilitySettings?.sports.find(s => s.sportId === sportId)?.isHidden || false;
  };

  const isLeagueHidden = (leagueId: string): boolean => {
    return visibilitySettings?.leagues.find(l => l.leagueId === leagueId)?.isHidden || false;
  };

  const visibleSports = sportsData.filter(sport => !isSportHidden(sport.id));

  const getVisibleLeagues = (sport: typeof sportsData[0]) => {
    return sport.leagues.filter(league => !isLeagueHidden(league.id));
  };

  const handleAddLeague = (sportId: string) => {
    setCurrentSportForLeague(sportId);
    setAddLeagueDialogOpen(true);
  };

  const handleCreateLeague = () => {
    if (!newLeagueName.trim()) {
      toast({
        title: "Validation Error",
        description: "League name is required.",
        variant: "destructive",
      });
      return;
    }
    createLeagueMutation.mutate({ sportId: currentSportForLeague, leagueName: newLeagueName.trim() });
  };

  const handleCreateSport = () => {
    if (!newSportName.trim()) {
      toast({
        title: "Validation Error",
        description: "Sport name is required.",
        variant: "destructive",
      });
      return;
    }
    createSportMutation.mutate({ sportName: newSportName.trim() });
  };

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        toast({
          title: "Unauthorized",
          description: "Please connect your wallet and sign in first.",
          variant: "destructive",
        });
        setTimeout(() => {
          setLocation('/');
        }, 500);
      } else if (!isAdmin) {
        toast({
          title: "Access Denied",
          description: "Admin access required to view this page",
          variant: "destructive",
        });
        setTimeout(() => {
          setLocation('/');
        }, 500);
      }
    }
  }, [isAuthenticated, isLoading, isAdmin, toast, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex flex-col h-full pt-[100px]">
      <LiveBettingFeed />
      
      <div className="flex-1 overflow-auto relative">
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <NetworkBackground color="gold" className="w-full h-full opacity-30" sizeMultiplier={1.25} />
        </div>
        
        <div className="glass-panel px-4 py-4 border-b border-accent/30" style={{borderRadius: 0}}>
          <div className="max-w-full relative z-10">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-foreground mb-1">
                  Sports Data <span className="text-primary">Integration</span>
                </h1>
                <p className="text-muted-foreground text-sm">
                  Real-time sports data including team logos, upcoming events, and league information
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddSportDialogOpen(true)}
                  data-testid="button-add-sport"
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Add Sport
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  data-testid="button-visibility-settings"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Visibility
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation('/admin')}
                  data-testid="button-admin-panel"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Admin Panel
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 max-w-full relative z-10">
          <div className="space-y-4">

            <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
              <CollapsibleContent className="mb-4">
                <SportVisibilityControls />
              </CollapsibleContent>
            </Collapsible>

            {visibleSports.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">All sports are hidden. Use the visibility settings to show sports.</p>
              </Card>
            ) : (
              <Accordion type="single" collapsible defaultValue={visibleSports[0]?.id} className="space-y-2">
                {visibleSports.map((sport) => {
                  const visibleLeagues = getVisibleLeagues(sport);
                  const selectedLeagueId = selectedLeagues[sport.id];
                  const selectedLeague = visibleLeagues.find(l => l.id === selectedLeagueId) || visibleLeagues[0];
                  
                  return (
                    <AccordionItem 
                      key={sport.id} 
                      value={sport.id}
                      className="border border-border rounded-lg bg-card/50 overflow-hidden"
                      data-testid={`accordion-sport-${sport.id}`}
                    >
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30">
                        <div className="flex items-center gap-3">
                          {getSportIcon(sport, "h-5 w-5")}
                          <span className="text-lg font-semibold">{sport.name}</span>
                          <span className="text-sm text-muted-foreground">
                            ({visibleLeagues.length} leagues)
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-4">
                          <UploadPanel sport={sport.name} defaultLeague={selectedLeague?.name} />
                          
                          {visibleLeagues.length === 0 ? (
                            <Card className="p-6 text-center">
                              <p className="text-muted-foreground">All leagues for this sport are hidden.</p>
                            </Card>
                          ) : (
                            <>
                              <div className="flex items-center gap-3 flex-wrap">
                                <label className="text-sm font-medium whitespace-nowrap">Select League:</label>
                                <Select
                                  value={selectedLeague?.id || selectedLeagueId}
                                  onValueChange={(value) => setSelectedLeagues({ ...selectedLeagues, [sport.id]: value })}
                                >
                                  <SelectTrigger className="w-[280px]" data-testid={`select-league-${sport.id}`}>
                                    <SelectValue placeholder="Select a league" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {visibleLeagues.map((league) => (
                                      <SelectItem key={league.id} value={league.id}>
                                        <div className="flex items-center gap-2">
                                          {league.badge && (
                                            <img 
                                              src={league.badge} 
                                              alt={league.displayName} 
                                              className="h-5 w-5 object-contain" 
                                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                            />
                                          )}
                                          <span>{league.displayName}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="border-dashed border-primary/50 text-primary hover:bg-primary/10"
                                  onClick={() => handleAddLeague(sport.id)}
                                  data-testid={`button-add-league-${sport.id}`}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add League
                                </Button>
                              </div>
                              
                              {selectedLeague && (
                                <TheSportsDBDemo 
                                  leagueId={selectedLeague.id} 
                                  leagueName={selectedLeague.name} 
                                  displayName={selectedLeague.displayName}
                                  leagueBadge={selectedLeague.badge}
                                  sport={sport.name}
                                />
                              )}
                            </>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </div>
        </div>
      </div>

      <Dialog open={addLeagueDialogOpen} onOpenChange={setAddLeagueDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New League</DialogTitle>
            <DialogDescription>
              Create a new league folder within the selected sport. This will create the folder structure for storing team logos and media.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="leagueName">League Name</Label>
              <Input
                id="leagueName"
                value={newLeagueName}
                onChange={(e) => setNewLeagueName(e.target.value)}
                placeholder="e.g., Premier League, NBA, NFL"
                data-testid="input-league-name"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Sport: {sportsData.find(s => s.id === currentSportForLeague)?.name || currentSportForLeague}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddLeagueDialogOpen(false);
                setNewLeagueName("");
              }}
              data-testid="button-cancel-add-league"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateLeague}
              disabled={createLeagueMutation.isPending}
              data-testid="button-submit-add-league"
            >
              {createLeagueMutation.isPending ? 'Creating...' : 'Create League'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addSportDialogOpen} onOpenChange={setAddSportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Sport</DialogTitle>
            <DialogDescription>
              Create a new sport folder. You can then add leagues within this sport.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sportName">Sport Name</Label>
              <Input
                id="sportName"
                value={newSportName}
                onChange={(e) => setNewSportName(e.target.value)}
                placeholder="e.g., Cricket, Rugby, Golf"
                data-testid="input-sport-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddSportDialogOpen(false);
                setNewSportName("");
              }}
              data-testid="button-cancel-add-sport"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSport}
              disabled={createSportMutation.isPending}
              data-testid="button-submit-add-sport"
            >
              {createSportMutation.isPending ? 'Creating...' : 'Create Sport'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
