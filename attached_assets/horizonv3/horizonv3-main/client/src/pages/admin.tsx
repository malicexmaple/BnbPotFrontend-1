// DegenArena Admin Panel - Main Dashboard
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, TrendingUp, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { NetworkBackground } from "@/components/NetworkBackground";
import { LiveBettingFeed } from "@/components/LiveBettingFeed";

export default function AdminPanel() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      } else if (user && user.role !== 'admin') {
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
  }, [isAuthenticated, isLoading, user, toast, setLocation]);

  return (
    <div className="flex flex-col h-full">
      {/* Live Betting Feed - Horizontal Ticker */}
      <LiveBettingFeed />
      
      <div className="flex-1 overflow-auto relative">
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <NetworkBackground color="gold" className="w-full h-full opacity-30" sizeMultiplier={1.25} />
        </div>
        <div className="container mx-auto p-6 max-w-screen-xl relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 font-sohne">
            Admin <span className="text-primary">Panel</span>
          </h1>
          <p className="text-muted-foreground">Manage your platform operations and integrations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Markets & Settlements Card */}
          <Card className="border-accent/20 hover-elevate cursor-pointer" onClick={() => setLocation('/admin/markets')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground font-sohne">
                <TrendingUp className="h-5 w-5 text-primary" />
                Markets & Settlements
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Manage betting markets, lock markets, and process settlements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setLocation('/admin/markets');
                }}
                data-testid="button-markets-settlements"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Open Markets & Settlements
              </Button>
            </CardContent>
          </Card>

          {/* Sports Data Integration Card */}
          <Card className="border-accent/20 hover-elevate cursor-pointer" onClick={() => setLocation('/sports-data')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground font-sohne">
                <Database className="h-5 w-5 text-primary" />
                Sports Data Integration
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Access TheSportsDB API integration, league data, and event information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setLocation('/sports-data');
                }}
                data-testid="button-sports-data-integration"
              >
                <Database className="h-4 w-4 mr-2" />
                Open Sports Data Integration
              </Button>
            </CardContent>
          </Card>

          {/* Prediction Markets Integration Card */}
          <Card className="border-accent/20 hover-elevate cursor-pointer" onClick={() => setLocation('/prediction-data')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground font-sohne">
                <Target className="h-5 w-5 text-primary" />
                Prediction Markets Integration
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Manage prediction markets for politics, economy, crypto, and real-world events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setLocation('/prediction-data');
                }}
                data-testid="button-prediction-markets-integration"
              >
                <Target className="h-4 w-4 mr-2" />
                Open Prediction Markets Integration
              </Button>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </div>
  );
}
