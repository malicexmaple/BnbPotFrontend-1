import { useState, useEffect } from "react";
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
import { ArrowLeft, Gamepad2 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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

export default function SportsDataDemo() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const { toast } = useToast();
  const [selectedLeagues, setSelectedLeagues] = useState<Record<string, string>>(
    Object.fromEntries(sportsData.map(sport => [sport.id, sport.leagues[0]?.id || ""]))
  );

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
                <h1 className="text-4xl font-bold text-foreground mb-2">
                  Sports Data <span className="text-primary">Integration</span>
                </h1>
                <p className="text-muted-foreground">
                  Real-time sports data including team logos, upcoming events, and league information
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setLocation('/admin')}
                data-testid="button-admin-panel"
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Admin Panel
              </Button>
            </div>

            <Tabs defaultValue={sportsData[0]?.id} className="w-full">
              <TabsList className="flex flex-wrap w-full justify-start gap-1 h-auto bg-card/50 p-2" data-testid="tabs-sports">
                {sportsData.map((sport) => (
                  <TabsTrigger 
                    key={sport.id}
                    value={sport.id}
                    className="gap-2"
                    data-testid={`tab-${sport.id}`}
                  >
                    {getSportIcon(sport)}
                    <span>{sport.name}</span>
                  </TabsTrigger>
                ))}
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
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
