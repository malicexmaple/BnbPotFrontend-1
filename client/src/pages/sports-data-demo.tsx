import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TheSportsDBDemo } from "@/components/TheSportsDBDemo";
import { NetworkBackground } from "@/components/NetworkBackground";
import { LiveBettingFeed } from "@/components/LiveBettingFeed";
import { SportVisibilityControls } from "@/components/SportVisibilityControls";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sportsData } from "@shared/sports-leagues";
import type { CustomLeague, VisibilitySetting } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Gamepad2, Plus, Upload, Search, Eye, EyeOff, Settings } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";


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
  const [selectedSport, setSelectedSport] = useState<string>(sportsData[0]?.id || "");
  const [selectedLeagues, setSelectedLeagues] = useState<Record<string, string>>(
    Object.fromEntries(sportsData.map(sport => [sport.id, sport.leagues[0]?.id || ""]))
  );
  const [addLeagueDialogOpen, setAddLeagueDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'team' | 'player'>('team');
  const [teamName, setTeamName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newLeagueName, setNewLeagueName] = useState("");
  const [newLeagueBadgeUrl, setNewLeagueBadgeUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: visibilitySettings = [] } = useQuery<VisibilitySetting[]>({
    queryKey: ['/api/visibility-settings'],
    enabled: isAdmin,
  });

  const { data: customLeagues = [] } = useQuery<CustomLeague[]>({
    queryKey: ['/api/sports/custom-leagues', selectedSport],
    queryFn: async () => {
      const res = await fetch(`/api/sports/custom-leagues?sportId=${selectedSport}`);
      return res.json();
    },
    enabled: isAdmin && !!selectedSport,
  });

  const isSportVisible = (sportId: string): boolean => {
    const setting = visibilitySettings.find(s => s.type === 'sport' && s.sportId === sportId);
    return setting ? setting.isVisible : true;
  };

  const isLeagueVisible = (leagueId: string): boolean => {
    const setting = visibilitySettings.find(s => s.type === 'league' && s.leagueId === leagueId);
    return setting ? setting.isVisible : true;
  };

  const toggleSportVisibilityMutation = useMutation({
    mutationFn: async ({ sportId, isVisible }: { sportId: string; isVisible: boolean }) => {
      return await apiRequest('POST', `/api/admin/visibility/sport/${sportId}`, { isVisible });
    },
    onMutate: async ({ sportId, isVisible }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/visibility-settings'] });
      
      const previousSettings = queryClient.getQueryData<VisibilitySetting[]>(['/api/visibility-settings']);
      
      queryClient.setQueryData<VisibilitySetting[]>(['/api/visibility-settings'], (old = []) => {
        const existingIndex = old.findIndex(s => s.type === 'sport' && s.sportId === sportId);
        if (existingIndex >= 0) {
          const updated = [...old];
          updated[existingIndex] = { ...updated[existingIndex], isVisible };
          return updated;
        } else {
          const now = new Date();
          return [...old, { 
            id: `optimistic-${sportId}`, 
            type: 'sport' as const, 
            sportId, 
            leagueId: null, 
            isVisible, 
            manualOverride: false,
            updatedBy: null,
            createdAt: now,
            updatedAt: now,
          }];
        }
      });
      
      return { previousSettings };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/visibility-settings'] });
      
      if (!variables.isVisible && variables.sportId === selectedSport) {
        const nextVisibleSport = sportsData.find(s => 
          s.id !== variables.sportId && isSportVisible(s.id)
        );
        if (nextVisibleSport) {
          setSelectedSport(nextVisibleSport.id);
        }
      }
      
      toast({
        title: "Visibility updated",
        description: !variables.isVisible 
          ? "Sport hidden from prediction market" 
          : "Sport visible in prediction market",
      });
    },
    onError: (_, __, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(['/api/visibility-settings'], context.previousSettings);
      }
      toast({
        title: "Error",
        description: "Failed to update sport visibility",
        variant: "destructive",
      });
    },
  });

  const handleToggleSportVisibility = (sportId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentlyVisible = isSportVisible(sportId);
    toggleSportVisibilityMutation.mutate({ sportId, isVisible: !currentlyVisible });
  };

  const currentSport = sportsData.find(s => s.id === selectedSport) || sportsData[0];
  
  const getVisibleLeagues = (sport: typeof sportsData[0]) => {
    return sport.leagues.filter(league => isLeagueVisible(league.id));
  };

  const staticLeagues = currentSport ? getVisibleLeagues(currentSport) : [];
  
  const customLeagueItems = customLeagues.map(cl => ({
    id: cl.id,
    name: cl.name,
    displayName: cl.displayName,
    badge: cl.badgeUrl || undefined,
    isCustom: true,
  }));
  
  const visibleLeagues = [...staticLeagues, ...customLeagueItems];
  const selectedLeagueId = selectedLeagues[currentSport?.id || ""];
  const selectedLeague = visibleLeagues.find(l => l.id === selectedLeagueId) || visibleLeagues[0];

  const addLeagueMutation = useMutation({
    mutationFn: async ({ sportId, leagueName, displayName, badgeUrl }: { sportId: string; leagueName: string; displayName: string; badgeUrl?: string }) => {
      const response = await apiRequest('POST', '/api/sports/custom-leagues', { 
        sportId, 
        name: leagueName,
        displayName,
        badgeUrl: badgeUrl || null
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "League created",
        description: data.message || `Custom league created successfully`,
      });
      setAddLeagueDialogOpen(false);
      setNewLeagueName("");
      setNewLeagueBadgeUrl("");
      queryClient.invalidateQueries({ queryKey: ['/api/sports/custom-leagues', selectedSport] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create custom league",
        variant: "destructive",
      });
    },
  });

  const uploadMediaMutation = useMutation({
    mutationFn: async ({ name, file, type }: { name: string; file: File; type: 'team' | 'player' }) => {
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      const response = await apiRequest('POST', '/api/sports/upload-media', {
        entityName: name,
        entityType: type,
        entityId: `custom_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sportId: currentSport?.id || '',
        leagueId: selectedLeague?.id || '',
        fileData: base64Data,
        fileName: file.name,
      });
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Upload successful",
        description: `${uploadType === 'team' ? 'Team logo' : 'Player photo'} uploaded successfully`,
      });
      setUploadDialogOpen(false);
      setTeamName("");
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ['/api/sports/custom-media'] });
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 2MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!teamName.trim()) {
      toast({
        title: "Name required",
        description: uploadType === 'team' ? "Please enter a team name" : "Please enter a player name",
        variant: "destructive",
      });
      return;
    }
    if (!selectedFile) {
      toast({
        title: "File required",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    uploadMediaMutation.mutate({ name: teamName, file: selectedFile, type: uploadType });
  };

  const handleAddLeague = () => {
    if (!newLeagueName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a league name",
        variant: "destructive",
      });
      return;
    }
    
    if (!currentSport?.id) {
      toast({
        title: "Sport required",
        description: "Please select a sport first",
        variant: "destructive",
      });
      return;
    }
    
    addLeagueMutation.mutate({ 
      sportId: currentSport.id, 
      leagueName: newLeagueName.trim(),
      displayName: newLeagueName.trim(),
      badgeUrl: newLeagueBadgeUrl.trim() || undefined
    });
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

        <div className="px-4 py-4 max-w-full relative z-10">
          <Tabs defaultValue="data" className="space-y-4">
            <TabsList className="grid w-full max-w-[400px] grid-cols-2">
              <TabsTrigger value="data" data-testid="tab-sports-data">
                <Search className="h-4 w-4 mr-2" />
                Sports Data
              </TabsTrigger>
              <TabsTrigger value="visibility" data-testid="tab-visibility-controls">
                <Settings className="h-4 w-4 mr-2" />
                Visibility Controls
              </TabsTrigger>
            </TabsList>

            <TabsContent value="visibility" className="space-y-4">
              <SportVisibilityControls />
            </TabsContent>

            <TabsContent value="data" className="space-y-4">
            {sportsData.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No sports available.</p>
              </Card>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 pb-2">
                  {sportsData.map((sport) => {
                    const isHidden = !isSportVisible(sport.id);
                    return (
                      <div
                        key={sport.id}
                        className={`flex items-center gap-1 pr-1 rounded-full text-sm transition-colors ${
                          selectedSport === sport.id
                            ? 'bg-primary/20 text-primary border border-primary/50'
                            : isHidden
                              ? 'bg-card/30 text-muted-foreground/50 border border-border/50'
                              : 'bg-card/50 text-muted-foreground border border-border hover:bg-card hover:text-foreground'
                        }`}
                      >
                        <button
                          onClick={() => setSelectedSport(sport.id)}
                          className="flex items-center gap-2 px-3 py-1.5"
                          data-testid={`sport-pill-${sport.id}`}
                        >
                          {getSportIcon(sport, "h-4 w-4")}
                          <span className={isHidden ? 'line-through opacity-50' : ''}>{sport.name}</span>
                        </button>
                        <button
                          onClick={(e) => handleToggleSportVisibility(sport.id, e)}
                          className={`p-1 rounded-full transition-colors ${
                            isHidden 
                              ? 'hover:bg-muted-foreground/20 text-muted-foreground/50' 
                              : 'hover:bg-primary/20 text-primary'
                          }`}
                          title={isHidden ? 'Show in prediction market' : 'Hide from prediction market'}
                          data-testid={`toggle-visibility-${sport.id}`}
                        >
                          {isHidden ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <label className="text-sm font-medium whitespace-nowrap">Select League:</label>
                  <Select
                    value={selectedLeague?.id || selectedLeagueId}
                    onValueChange={(value) => setSelectedLeagues({ ...selectedLeagues, [currentSport?.id || ""]: value })}
                  >
                    <SelectTrigger className="w-[280px]" data-testid="select-league">
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
                    className="border-dashed"
                    onClick={() => setAddLeagueDialogOpen(true)}
                    data-testid="button-add-league"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add League
                  </Button>
                </div>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Search className="h-5 w-5 text-muted-foreground" />
                    <span className="text-lg font-semibold">Search Teams</span>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search for a team (e.g., Lakers, Warriors)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1"
                      data-testid="input-search-teams"
                    />
                    <Button variant="outline" size="icon" data-testid="button-search">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
                
                {selectedLeague && (
                  <TheSportsDBDemo 
                    leagueId={selectedLeague.id} 
                    leagueName={selectedLeague.name} 
                    displayName={selectedLeague.displayName}
                    leagueBadge={selectedLeague.badge}
                    sport={currentSport?.name || ""}
                  />
                )}
              </>
            )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={addLeagueDialogOpen} onOpenChange={(open) => {
        setAddLeagueDialogOpen(open);
        if (!open) {
          setNewLeagueName("");
          setNewLeagueBadgeUrl("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add League</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="leagueName">League Name</Label>
              <Input
                id="leagueName"
                value={newLeagueName}
                onChange={(e) => setNewLeagueName(e.target.value)}
                placeholder="e.g., Premier League"
                data-testid="input-league-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leagueBadgeUrl">Badge URL (optional)</Label>
              <Input
                id="leagueBadgeUrl"
                value={newLeagueBadgeUrl}
                onChange={(e) => setNewLeagueBadgeUrl(e.target.value)}
                placeholder="https://example.com/badge.png"
                data-testid="input-league-badge-url"
              />
              <p className="text-xs text-muted-foreground">
                Enter a URL to an image for the league badge/logo
              </p>
            </div>
            {newLeagueBadgeUrl && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <img 
                  src={newLeagueBadgeUrl} 
                  alt="Badge preview" 
                  className="h-8 w-8 object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <span className="text-sm text-muted-foreground">Badge preview</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddLeagueDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddLeague} disabled={addLeagueMutation.isPending} data-testid="button-create-league">
              {addLeagueMutation.isPending ? "Creating..." : "Add League"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Custom Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex border rounded-md overflow-hidden">
              <button
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  uploadType === 'team' 
                    ? 'bg-muted text-foreground' 
                    : 'bg-background text-muted-foreground hover:bg-muted/50'
                }`}
                onClick={() => setUploadType('team')}
                data-testid="tab-team-logo"
              >
                Team Logo
              </button>
              <button
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  uploadType === 'player' 
                    ? 'bg-muted text-foreground' 
                    : 'bg-background text-muted-foreground hover:bg-muted/50'
                }`}
                onClick={() => setUploadType('player')}
                data-testid="tab-player-photo"
              >
                Player Photo
              </button>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="teamName">
                {uploadType === 'team' ? 'Team Name' : 'Player Name'}
              </Label>
              <Input
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder={uploadType === 'team' ? 'e.g., Miami Heat' : 'e.g., LeBron James'}
                data-testid="input-upload-name"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Logo Image</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                  data-testid="input-file-upload"
                />
              </div>
              <p className="text-xs text-muted-foreground">Max 2MB. Formats: JPEG, PNG, GIF</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload}
              className="bg-primary text-primary-foreground"
              data-testid="button-upload-team"
            >
              Upload {uploadType === 'team' ? 'Team' : 'Player'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
