import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, ArrowLeft, Database, Activity, Shield, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { NetworkBackground } from "@/components/NetworkBackground";
import { LiveBettingFeed } from "@/components/LiveBettingFeed";

export default function AdminPanel() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const [activatingDevAdmin, setActivatingDevAdmin] = useState(false);

  const { data: devEnabled } = useQuery<{ enabled: boolean }>({
    queryKey: ["/api/auth/dev-enabled"],
  });

  const devAdminMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/auth/dev-admin");
    },
    onSuccess: () => {
      toast({
        title: "Dev Admin Activated",
        description: "You now have admin access for development",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      setActivatingDevAdmin(false);
    },
    onError: () => {
      toast({
        title: "Failed",
        description: "Could not activate dev admin",
        variant: "destructive",
      });
      setActivatingDevAdmin(false);
    },
  });

  const handleDevAdminLogin = () => {
    setActivatingDevAdmin(true);
    devAdminMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin && devEnabled?.enabled) {
    return (
      <div className="flex flex-col h-full pt-[100px]">
        <LiveBettingFeed />
        <div className="flex-1 overflow-auto relative">
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            <NetworkBackground color="gold" className="w-full h-full opacity-30" sizeMultiplier={1.25} />
          </div>
          <div className="container mx-auto p-6 max-w-screen-xl relative z-10">
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
              <Shield className="h-16 w-16 text-primary" />
              <h1 className="text-3xl font-bold text-foreground text-center">
                Admin <span className="text-primary">Access Required</span>
              </h1>
              <p className="text-muted-foreground text-center max-w-md">
                This page requires admin access. In development mode, you can activate dev admin access below.
              </p>
              <Button
                size="lg"
                onClick={handleDevAdminLogin}
                disabled={activatingDevAdmin}
                data-testid="button-dev-admin-login"
              >
                {activatingDevAdmin ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Activate Dev Admin
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation('/')}
                data-testid="button-back-home"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col h-full pt-[100px]">
        <LiveBettingFeed />
        <div className="flex-1 overflow-auto relative">
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            <NetworkBackground color="gold" className="w-full h-full opacity-30" sizeMultiplier={1.25} />
          </div>
          <div className="container mx-auto p-6 max-w-screen-xl relative z-10">
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
              <Shield className="h-16 w-16 text-destructive" />
              <h1 className="text-3xl font-bold text-foreground text-center">
                Access <span className="text-destructive">Denied</span>
              </h1>
              <p className="text-muted-foreground text-center max-w-md">
                Admin access required. Please connect with an admin wallet.
              </p>
              <Button
                variant="outline"
                onClick={() => setLocation('/')}
                data-testid="button-back-home"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full pt-[100px]">
      <LiveBettingFeed />
      
      <div className="flex-1 overflow-auto relative">
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <NetworkBackground color="gold" className="w-full h-full opacity-30" sizeMultiplier={1.25} />
        </div>
        <div className="container mx-auto p-6 max-w-screen-xl relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Admin <span className="text-primary">Panel</span>
              </h1>
              <p className="text-muted-foreground">Manage your platform operations and integrations</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setLocation('/')}
              data-testid="button-back-home"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-accent/20 hover-elevate cursor-pointer" onClick={() => setLocation('/admin/markets')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
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

            <Card className="border-accent/20 hover-elevate cursor-pointer" onClick={() => setLocation('/admin/sports-data')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Database className="h-5 w-5 text-primary" />
                  Sports Database
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Browse TheSportsDB data, team logos, upcoming events and leagues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocation('/admin/sports-data');
                  }}
                  data-testid="button-sports-data"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Open Sports Database
                </Button>
              </CardContent>
            </Card>

            <Card className="border-accent/20 hover-elevate cursor-pointer" onClick={() => setLocation('/admin/prediction-data')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Activity className="h-5 w-5 text-primary" />
                  Prediction Markets
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Configure non-sports prediction market categories and events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocation('/admin/prediction-data');
                  }}
                  data-testid="button-prediction-data"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Open Prediction Markets
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
