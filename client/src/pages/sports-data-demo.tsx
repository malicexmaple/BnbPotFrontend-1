import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TheSportsDBDemo } from "@/components/TheSportsDBDemo";
import { NetworkBackground } from "@/components/NetworkBackground";
import { LiveBettingFeed } from "@/components/LiveBettingFeed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sportsData } from "@shared/sports-leagues";
import type { SportsVisibility, LeaguesVisibility, CustomMedia } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Gamepad2, Settings, ChevronDown, ChevronRight, Plus, Trash2, Image, Users } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface VisibilitySettings {
  sports: SportsVisibility[];
  leagues: LeaguesVisibility[];
}

function getSportIcon(sport: typeof sportsData[0]) {
  if (sport.iconType === 'svg') {
    return (
      <img 
        src={`/sport-icons/${sport.iconName}.svg`} 
        alt={sport.name}
        className="h-4 w-4 brightness-0 invert"
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
        className="h-4 w-4 brightness-0 invert"
        onError={(e) => { 
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  } else {
    const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
    const IconComponent = icons[sport.iconName] || Gamepad2;
    return <IconComponent className="h-4 w-4" />;
  }
}

interface CustomMediaFormData {
  entityType: 'team' | 'player';
  entityName: string;
  logoUrl: string;
  photoUrl: string;
  sportId: string;
  leagueId: string;
}

const initialFormData: CustomMediaFormData = {
  entityType: 'team',
  entityName: '',
  logoUrl: '',
  photoUrl: '',
  sportId: '',
  leagueId: '',
};

export default function SportsDataDemo() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const { toast } = useToast();
  const [selectedLeagues, setSelectedLeagues] = useState<Record<string, string>>(
    Object.fromEntries(sportsData.map(sport => [sport.id, sport.leagues[0]?.id || ""]))
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [expandedSports, setExpandedSports] = useState<Record<string, boolean>>({});
  const [customMediaOpen, setCustomMediaOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<CustomMedia | null>(null);
  const [formData, setFormData] = useState<CustomMediaFormData>(initialFormData);

  const { data: visibilitySettings } = useQuery<VisibilitySettings>({
    queryKey: ['/api/sports/visibility'],
    enabled: isAdmin,
  });

  const { data: customMediaList = [], isLoading: customMediaLoading } = useQuery<CustomMedia[]>({
    queryKey: ['/api/sports/custom-media'],
    enabled: isAdmin,
  });

  const createCustomMediaMutation = useMutation({
    mutationFn: async (data: CustomMediaFormData) => {
      const payload = {
        entityType: data.entityType,
        entityId: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        entityName: data.entityName,
        logoUrl: data.logoUrl || undefined,
        photoUrl: data.photoUrl || undefined,
        sportId: data.sportId || undefined,
        leagueId: data.leagueId || undefined,
      };
      const response = await apiRequest('POST', '/api/sports/custom-media', payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sports/custom-media'] });
      toast({
        title: "Custom media added",
        description: "The custom media has been created successfully.",
      });
      setAddDialogOpen(false);
      setFormData(initialFormData);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create custom media.",
        variant: "destructive",
      });
    },
  });

  const deleteCustomMediaMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/sports/custom-media/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sports/custom-media'] });
      toast({
        title: "Custom media deleted",
        description: "The custom media has been removed.",
      });
      setDeleteDialogOpen(false);
      setMediaToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete custom media.",
        variant: "destructive",
      });
    },
  });

  const sportVisibilityMutation = useMutation({
    mutationFn: async ({ sportId, isHidden }: { sportId: string; isHidden: boolean }) => {
      const response = await apiRequest('PATCH', `/api/sports/visibility/sport/${sportId}`, { isHidden });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sports/visibility'] });
      toast({
        title: "Sport visibility updated",
        description: "The sport visibility has been changed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update sport visibility.",
        variant: "destructive",
      });
    },
  });

  const leagueVisibilityMutation = useMutation({
    mutationFn: async ({ leagueId, sportId, isHidden }: { leagueId: string; sportId: string; isHidden: boolean }) => {
      const response = await apiRequest('PATCH', `/api/sports/visibility/league/${leagueId}`, { sportId, isHidden });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sports/visibility'] });
      toast({
        title: "League visibility updated",
        description: "The league visibility has been changed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update league visibility.",
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

  const toggleSportExpanded = (sportId: string) => {
    setExpandedSports(prev => ({ ...prev, [sportId]: !prev[sportId] }));
  };

  const getSportName = (sportId: string | undefined | null) => {
    if (!sportId) return 'All Sports';
    const sport = sportsData.find(s => s.id === sportId);
    return sport?.name || sportId;
  };

  const getLeagueName = (leagueId: string | undefined | null, sportId: string | undefined | null) => {
    if (!leagueId) return 'All Leagues';
    const sport = sportsData.find(s => s.id === sportId);
    if (sport) {
      const league = sport.leagues.find(l => l.id === leagueId);
      if (league) return league.displayName;
    }
    for (const s of sportsData) {
      const league = s.leagues.find(l => l.id === leagueId);
      if (league) return league.displayName;
    }
    return leagueId;
  };

  const getAvailableLeagues = (sportId: string) => {
    const sport = sportsData.find(s => s.id === sportId);
    return sport?.leagues || [];
  };

  const handleFormSubmit = () => {
    if (!formData.entityName.trim()) {
      toast({
        title: "Validation Error",
        description: "Name is required.",
        variant: "destructive",
      });
      return;
    }
    if (formData.entityType === 'team' && !formData.logoUrl.trim()) {
      toast({
        title: "Validation Error",
        description: "Logo URL is required for teams.",
        variant: "destructive",
      });
      return;
    }
    if (formData.entityType === 'player' && !formData.photoUrl.trim()) {
      toast({
        title: "Validation Error",
        description: "Photo URL is required for players.",
        variant: "destructive",
      });
      return;
    }
    createCustomMediaMutation.mutate(formData);
  };

  const handleConfirmDelete = () => {
    if (mediaToDelete) {
      deleteCustomMediaMutation.mutate(mediaToDelete.id);
    }
  };

  const teamMedia = customMediaList.filter(m => m.entityType === 'team');
  const playerMedia = customMediaList.filter(m => m.entityType === 'player');

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

  const defaultSportId = visibleSports[0]?.id || sportsData[0]?.id;

  return (
    <div className="flex flex-col h-full pt-[100px]">
      <LiveBettingFeed />
      
      <div className="flex-1 overflow-auto relative">
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <NetworkBackground color="gold" className="w-full h-full opacity-30" sizeMultiplier={1.25} />
        </div>
        
        <div className="px-4 py-4 max-w-full relative z-10">
          <div className="space-y-4">
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

            <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
              <CollapsibleContent>
                <Card className="p-4 mb-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Sport & League Visibility Settings
                  </h3>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {sportsData.map((sport) => (
                      <div key={sport.id} className="border rounded-md">
                        <div className="flex items-center justify-between p-2 gap-3">
                          <button
                            onClick={() => toggleSportExpanded(sport.id)}
                            className="flex items-center gap-2 flex-1 text-left hover-elevate rounded-sm p-1"
                            data-testid={`button-expand-${sport.id}`}
                          >
                            {expandedSports[sport.id] ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            {getSportIcon(sport)}
                            <span className="text-sm font-medium">{sport.name}</span>
                            <span className="text-xs text-muted-foreground">({sport.leagues.length} leagues)</span>
                          </button>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {isSportHidden(sport.id) ? 'Hidden' : 'Visible'}
                            </span>
                            <Switch
                              checked={!isSportHidden(sport.id)}
                              onCheckedChange={(checked) => {
                                sportVisibilityMutation.mutate({ sportId: sport.id, isHidden: !checked });
                              }}
                              disabled={sportVisibilityMutation.isPending}
                              data-testid={`switch-sport-${sport.id}`}
                            />
                          </div>
                        </div>
                        
                        {expandedSports[sport.id] && (
                          <div className="border-t bg-muted/30 p-2 space-y-1">
                            {sport.leagues.map((league) => (
                              <div 
                                key={league.id}
                                className="flex items-center justify-between py-1 px-2 rounded-sm"
                              >
                                <div className="flex items-center gap-2">
                                  {league.badge && (
                                    <img 
                                      src={league.badge} 
                                      alt={league.displayName} 
                                      className="h-4 w-4 object-contain" 
                                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                  )}
                                  <span className="text-sm">{league.displayName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    {isLeagueHidden(league.id) ? 'Hidden' : 'Visible'}
                                  </span>
                                  <Switch
                                    checked={!isLeagueHidden(league.id)}
                                    onCheckedChange={(checked) => {
                                      leagueVisibilityMutation.mutate({ 
                                        leagueId: league.id, 
                                        sportId: sport.id, 
                                        isHidden: !checked 
                                      });
                                    }}
                                    disabled={leagueVisibilityMutation.isPending || isSportHidden(sport.id)}
                                    data-testid={`switch-league-${league.id}`}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible open={customMediaOpen} onOpenChange={setCustomMediaOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="mb-2"
                  data-testid="button-custom-media-settings"
                >
                  <Image className="h-4 w-4 mr-2" />
                  Custom Media
                  {customMediaOpen ? (
                    <ChevronDown className="h-4 w-4 ml-2" />
                  ) : (
                    <ChevronRight className="h-4 w-4 ml-2" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Card className="p-4 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      Custom Team Logos & Player Photos
                    </h3>
                    <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" data-testid="button-add-custom-media">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Custom Media
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Custom Media</DialogTitle>
                          <DialogDescription>
                            Add a custom team logo or player photo to override API data.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="entityType">Type</Label>
                            <Select
                              value={formData.entityType}
                              onValueChange={(value: 'team' | 'player') => 
                                setFormData({ ...formData, entityType: value, logoUrl: '', photoUrl: '' })
                              }
                            >
                              <SelectTrigger data-testid="select-entity-type">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="team">Team Logo</SelectItem>
                                <SelectItem value="player">Player Photo</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="entityName">
                              {formData.entityType === 'team' ? 'Team Name' : 'Player Name'}
                            </Label>
                            <Input
                              id="entityName"
                              value={formData.entityName}
                              onChange={(e) => setFormData({ ...formData, entityName: e.target.value })}
                              placeholder={formData.entityType === 'team' ? 'e.g., Manchester United' : 'e.g., Lionel Messi'}
                              data-testid="input-entity-name"
                            />
                          </div>
                          
                          {formData.entityType === 'team' && (
                            <div className="space-y-2">
                              <Label htmlFor="logoUrl">Logo URL</Label>
                              <Input
                                id="logoUrl"
                                value={formData.logoUrl}
                                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                                placeholder="https://example.com/logo.png"
                                data-testid="input-logo-url"
                              />
                            </div>
                          )}
                          
                          {formData.entityType === 'player' && (
                            <div className="space-y-2">
                              <Label htmlFor="photoUrl">Photo URL</Label>
                              <Input
                                id="photoUrl"
                                value={formData.photoUrl}
                                onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                                placeholder="https://example.com/photo.png"
                                data-testid="input-photo-url"
                              />
                            </div>
                          )}
                          
                          <div className="space-y-2">
                            <Label htmlFor="sportId">Sport (optional)</Label>
                            <Select
                              value={formData.sportId || "none"}
                              onValueChange={(value) => 
                                setFormData({ ...formData, sportId: value === 'none' ? '' : value, leagueId: '' })
                              }
                            >
                              <SelectTrigger data-testid="select-sport">
                                <SelectValue placeholder="Select sport" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">All Sports</SelectItem>
                                {sportsData.map((sport) => (
                                  <SelectItem key={sport.id} value={sport.id}>
                                    {sport.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {formData.sportId && (
                            <div className="space-y-2">
                              <Label htmlFor="leagueId">League (optional)</Label>
                              <Select
                                value={formData.leagueId || "none"}
                                onValueChange={(value) => 
                                  setFormData({ ...formData, leagueId: value === 'none' ? '' : value })
                                }
                              >
                                <SelectTrigger data-testid="select-league">
                                  <SelectValue placeholder="Select league" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">All Leagues</SelectItem>
                                  {getAvailableLeagues(formData.sportId).map((league) => (
                                    <SelectItem key={league.id} value={league.id}>
                                      {league.displayName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setAddDialogOpen(false);
                              setFormData(initialFormData);
                            }}
                            data-testid="button-cancel-add"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleFormSubmit}
                            disabled={createCustomMediaMutation.isPending}
                            data-testid="button-submit-add"
                          >
                            {createCustomMediaMutation.isPending ? 'Adding...' : 'Add Media'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {customMediaLoading ? (
                    <div className="text-center py-4 text-muted-foreground">Loading custom media...</div>
                  ) : customMediaList.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No custom media added yet.</p>
                      <p className="text-xs mt-1">Click "Add Custom Media" to add team logos or player photos.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {teamMedia.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                            <Image className="h-3 w-3" />
                            Team Logos ({teamMedia.length})
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {teamMedia.map((media) => (
                              <div
                                key={media.id}
                                className="flex items-center gap-3 p-2 border rounded-md bg-muted/30"
                                data-testid={`custom-media-${media.id}`}
                              >
                                <div className="shrink-0 w-10 h-10 bg-background rounded border flex items-center justify-center overflow-hidden">
                                  {media.logoUrl ? (
                                    <img
                                      src={media.logoUrl}
                                      alt={media.entityName}
                                      className="w-8 h-8 object-contain"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <Image className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{media.entityName}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {getSportName(media.sportId)}
                                    {media.leagueId && ` / ${getLeagueName(media.leagueId, media.sportId)}`}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="shrink-0"
                                  onClick={() => {
                                    setMediaToDelete(media);
                                    setDeleteDialogOpen(true);
                                  }}
                                  data-testid={`button-delete-${media.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {playerMedia.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Player Photos ({playerMedia.length})
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {playerMedia.map((media) => (
                              <div
                                key={media.id}
                                className="flex items-center gap-3 p-2 border rounded-md bg-muted/30"
                                data-testid={`custom-media-${media.id}`}
                              >
                                <div className="shrink-0 w-10 h-10 bg-background rounded-full border flex items-center justify-center overflow-hidden">
                                  {media.photoUrl ? (
                                    <img
                                      src={media.photoUrl}
                                      alt={media.entityName}
                                      className="w-10 h-10 object-cover rounded-full"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{media.entityName}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {getSportName(media.sportId)}
                                    {media.leagueId && ` / ${getLeagueName(media.leagueId, media.sportId)}`}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="shrink-0"
                                  onClick={() => {
                                    setMediaToDelete(media);
                                    setDeleteDialogOpen(true);
                                  }}
                                  data-testid={`button-delete-${media.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </CollapsibleContent>
            </Collapsible>
            
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Custom Media</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this custom media? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                {mediaToDelete && (
                  <div className="flex items-center gap-3 p-3 border rounded-md bg-muted/30">
                    <div className="shrink-0 w-10 h-10 bg-background rounded border flex items-center justify-center overflow-hidden">
                      {mediaToDelete.entityType === 'team' && mediaToDelete.logoUrl ? (
                        <img
                          src={mediaToDelete.logoUrl}
                          alt={mediaToDelete.entityName}
                          className="w-8 h-8 object-contain"
                        />
                      ) : mediaToDelete.entityType === 'player' && mediaToDelete.photoUrl ? (
                        <img
                          src={mediaToDelete.photoUrl}
                          alt={mediaToDelete.entityName}
                          className="w-10 h-10 object-cover rounded-full"
                        />
                      ) : (
                        <Image className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{mediaToDelete.entityName}</p>
                      <p className="text-xs text-muted-foreground capitalize">{mediaToDelete.entityType}</p>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDeleteDialogOpen(false);
                      setMediaToDelete(null);
                    }}
                    data-testid="button-cancel-delete"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleConfirmDelete}
                    disabled={deleteCustomMediaMutation.isPending}
                    data-testid="button-confirm-delete"
                  >
                    {deleteCustomMediaMutation.isPending ? 'Deleting...' : 'Delete'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {visibleSports.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">All sports are hidden. Use the visibility settings to show sports.</p>
              </Card>
            ) : (
              <Tabs defaultValue={defaultSportId} className="w-full">
                <div className="overflow-x-auto pb-2">
                  <TabsList 
                    className="inline-flex w-auto min-w-full justify-start gap-1 h-auto bg-card/50 p-2" 
                    data-testid="tabs-sports"
                  >
                    {visibleSports.map((sport) => (
                      <TabsTrigger 
                        key={sport.id}
                        value={sport.id}
                        className="gap-2 whitespace-nowrap shrink-0"
                        data-testid={`tab-${sport.id}`}
                      >
                        {getSportIcon(sport)}
                        <span>{sport.name}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
                
                {visibleSports.map((sport) => {
                  const visibleLeagues = getVisibleLeagues(sport);
                  const selectedLeagueId = selectedLeagues[sport.id];
                  const selectedLeague = visibleLeagues.find(l => l.id === selectedLeagueId) || visibleLeagues[0];
                  
                  return (
                    <TabsContent key={sport.id} value={sport.id} className="space-y-4">
                      {visibleLeagues.length === 0 ? (
                        <Card className="p-6 text-center">
                          <p className="text-muted-foreground">All leagues for this sport are hidden.</p>
                        </Card>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
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
                    </TabsContent>
                  );
                })}
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
