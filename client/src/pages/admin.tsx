import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { NetworkBackground } from "@/components/NetworkBackground";
import { LiveBettingFeed } from "@/components/LiveBettingFeed";

export default function AdminPanel() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth();
  const [, setLocation] = useLocation();

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>
        </div>
      </div>
    </div>
  );
}
