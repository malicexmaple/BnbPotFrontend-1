import { useState } from "react";
import { useLocation } from "wouter";
import { TheSportsDBDemo } from "@/components/TheSportsDBDemo";
import { NetworkBackground } from "@/components/NetworkBackground";
import { LiveBettingFeed } from "@/components/LiveBettingFeed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { sportsData } from "@shared/sports-leagues";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AddLeagueDialog } from "@/components/AddLeagueDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { VisibilitySetting } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function SportsDataDemo() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedLeagues, setSelectedLeagues] = useState<Record<string, string>>(
    Object.fromEntries(sportsData.map(sport => [sport.id, sport.leagues[0]?.id || ""]))
  );
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'sport' | 'league';
    id: string;
    sportId?: string;
    currentlyVisible: boolean;
    name: string;
  } | null>(null);

  // Fetch visibility settings
  const { data: settings = [] } = useQuery<VisibilitySetting[]>({
    queryKey: ['/api/visibility-settings'],
  });

  // Mutation to toggle sport visibility
  const toggleSportMutation = useMutation({
    mutationFn: async ({ sportId, isVisible }: { sportId: string; isVisible: boolean }) => {
      return await apiRequest('POST', `/api/admin/visibility/sport/${sportId}`, { isVisible });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/visibility-settings'] });
      toast({ title: "Sport visibility updated" });
    },
  });

  // Mutation to toggle league visibility
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

  const handleConfirmToggle = () => {
    if (!confirmDialog) return;

    if (confirmDialog.type === 'sport') {
      toggleSportMutation.mutate({
        sportId: confirmDialog.id,
        isVisible: !confirmDialog.currentlyVisible,
      });
    } else {
      toggleLeagueMutation.mutate({
        leagueId: confirmDialog.id,
        sportId: confirmDialog.sportId!,
        isVisible: !confirmDialog.currentlyVisible,
      });
    }
    setConfirmDialog(null);
  };

  return (
    <div className="flex flex-col h-full">
      <LiveBettingFeed />
      
      <div className="flex-1 overflow-auto relative">
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <NetworkBackground color="gold" className="w-full h-full opacity-30" sizeMultiplier={1.25} />
        </div>
        
        <div className="container mx-auto p-6 max-w-7xl relative z-10">
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold text-foreground font-sohne mb-2">
                  Sports Data <span className="text-primary">Integration</span>
                </h1>
                <p className="text-muted-foreground">
                  Real-time sports data including team logos, upcoming events, and league information
                </p>
              </div>
              {user && (
                <Button
                  variant="outline"
                  onClick={() => setLocation('/admin')}
                  data-testid="button-admin-panel"
                  className="shrink-0"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Admin Panel
                </Button>
              )}
            </div>

            <Tabs defaultValue={sportsData[0]?.id} className="w-full">
              <TabsList className="flex flex-wrap w-full justify-start gap-1 h-auto bg-card/50 p-2" data-testid="tabs-sports">
                {sportsData.map((sport) => {
                  const isVisible = isSportVisible(sport.id);
                  return (
                    <div key={sport.id} className="flex items-center gap-1">
                      <TabsTrigger 
                        value={sport.id}
                        className="gap-2"
                        data-testid={`tab-${sport.id}`}
                      >
                        {sport.iconType === 'svg' ? (
                          <img 
                            src={`/sport-icons/${sport.iconName}.svg`} 
                            alt={sport.name}
                            className="h-4 w-4 brightness-0 invert"
                          />
                        ) : sport.iconType === 'custom' ? (
                          <img 
                            src={`/sport-icons/${sport.iconName}.png`} 
                            alt={sport.name}
                            className="h-4 w-4 brightness-0 invert"
                          />
                        ) : (
                          (() => {
                            const IconComponent = (LucideIcons as any)[sport.iconName] || LucideIcons.Circle;
                            return <IconComponent className="h-4 w-4" />;
                          })()
                        )}
                        <span>{sport.name}</span>
                      </TabsTrigger>
                      {user?.role === 'admin' && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDialog({
                              open: true,
                              type: 'sport',
                              id: sport.id,
                              currentlyVisible: isVisible,
                              name: sport.name,
                            });
                          }}
                          data-testid={`button-toggle-sport-${sport.id}`}
                        >
                          {isVisible ? (
                            <Eye className="h-4 w-4 text-green-500" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </TabsList>
              
              {sportsData.map((sport) => {
                const selectedLeagueId = selectedLeagues[sport.id];
                const selectedLeague = sport.leagues.find(l => l.id === selectedLeagueId);
                
                return (
                  <TabsContent key={sport.id} value={sport.id} className="space-y-4">
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium">Select League:</label>
                      <Select
                        value={selectedLeagueId}
                        onValueChange={(value) => setSelectedLeagues({ ...selectedLeagues, [sport.id]: value })}
                      >
                        <SelectTrigger className="w-[300px]" data-testid={`select-league-${sport.id}`}>
                          <SelectValue placeholder="Select a league" />
                        </SelectTrigger>
                        <SelectContent>
                          {sport.leagues.map((league) => (
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
                      {user?.role === 'admin' && selectedLeague && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              const isVisible = isLeagueVisible(selectedLeague.id);
                              setConfirmDialog({
                                open: true,
                                type: 'league',
                                id: selectedLeague.id,
                                sportId: sport.id,
                                currentlyVisible: isVisible,
                                name: selectedLeague.displayName,
                              });
                            }}
                            data-testid={`button-toggle-league-${selectedLeague.id}`}
                          >
                            {isLeagueVisible(selectedLeague.id) ? (
                              <Eye className="h-4 w-4 text-green-500" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                          <AddLeagueDialog sport={sport.name} />
                        </>
                      )}
                    </div>
                    
                    {selectedLeague && (
                      <TheSportsDBDemo 
                        leagueId={selectedLeague.id} 
                        leagueName={selectedLeague.name} 
                        displayName={selectedLeague.displayName}
                        leagueBadge={selectedLeague.badge}
                        sport={sport.name}
                        isAdmin={user?.role === 'admin'}
                      />
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog?.open || false} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.currentlyVisible ? 'Hide' : 'Show'} {confirmDialog?.type === 'sport' ? 'Sport' : 'League'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {confirmDialog?.currentlyVisible ? 'hide' : 'show'} "{confirmDialog?.name}"?
              {confirmDialog?.currentlyVisible 
                ? ' This will remove it from the sidebar and hide all its markets from users.' 
                : ' This will make it visible in the sidebar and show all its markets to users.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmToggle}>
              {confirmDialog?.currentlyVisible ? 'Hide' : 'Show'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
