import { useEffect } from "react";
import { useLocation } from "wouter";
import { NetworkBackground } from "@/components/NetworkBackground";
import { LiveBettingFeed } from "@/components/LiveBettingFeed";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { predictionCategories } from "@shared/prediction-markets";
import { ArrowLeft, DollarSign, Globe, TrendingUp, Cpu, Star, MapPin, LineChart, Vote, MessageSquare, Bitcoin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

function getCategoryIcon(iconName: string) {
  const icons: Record<string, React.ReactNode> = {
    'DollarSign': <DollarSign className="h-6 w-6" />,
    'Bitcoin': <Bitcoin className="h-6 w-6" />,
    'Globe': <Globe className="h-6 w-6" />,
    'TrendingUp': <TrendingUp className="h-6 w-6" />,
    'Cpu': <Cpu className="h-6 w-6" />,
    'Star': <Star className="h-6 w-6" />,
    'MapPin': <MapPin className="h-6 w-6" />,
    'LineChart': <LineChart className="h-6 w-6" />,
    'Vote': <Vote className="h-6 w-6" />,
    'MessageSquare': <MessageSquare className="h-6 w-6" />,
  };
  return icons[iconName] || <Globe className="h-6 w-6" />;
}

export default function PredictionDataDemo() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const { toast } = useToast();

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
                  Prediction <span className="text-primary">Markets</span>
                </h1>
                <p className="text-muted-foreground">
                  Non-sports prediction markets for real-world events across various categories
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {predictionCategories.map((category) => (
                <Card 
                  key={category.id}
                  className="bg-card/50 backdrop-blur-sm border-border hover-elevate cursor-pointer"
                  data-testid={`card-category-${category.id}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className={`${category.color}`}>
                        {getCategoryIcon(category.iconName)}
                      </div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {category.description}
                    </CardDescription>
                    <div className="mt-3">
                      <Badge variant="outline" className="text-xs">
                        Coming Soon
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-card/50 backdrop-blur-sm border-border">
              <CardHeader>
                <CardTitle>About Prediction Markets</CardTitle>
                <CardDescription>
                  How prediction markets work on BNBPOT
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-primary">1. Choose a Market</h3>
                    <p className="text-sm text-muted-foreground">
                      Browse available prediction markets across finance, crypto, geopolitics, and more.
                      Each market has a clear question with defined outcomes.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-primary">2. Place Your Bet</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose your predicted outcome and stake your BNB. Odds are determined by the
                      pool of bets on each outcome.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-primary">3. Collect Winnings</h3>
                    <p className="text-sm text-muted-foreground">
                      When the event resolves, correct predictions share the losing pool.
                      Winners automatically receive their payout.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
