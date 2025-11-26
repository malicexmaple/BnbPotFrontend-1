import { useState } from "react";
import { useLocation } from "wouter";
import { PredictionMarketsDemo } from "@/components/PredictionMarketsDemo";
import { NetworkBackground } from "@/components/NetworkBackground";
import { LiveBettingFeed } from "@/components/LiveBettingFeed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { predictionCategories } from "@shared/prediction-markets";
import { ArrowLeft } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function PredictionDataDemo() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

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
                  Prediction Markets <span className="text-primary">Integration</span>
                </h1>
                <p className="text-muted-foreground">
                  Real-world events betting markets for politics, economy, crypto, and more
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

            <Tabs defaultValue={predictionCategories[0]?.id} className="w-full">
              <TabsList className="flex flex-wrap w-full justify-start gap-1 h-auto bg-card/50 p-2" data-testid="tabs-predictions">
                {predictionCategories.map((category) => {
                  const IconComponent = (LucideIcons as any)[category.iconName] || LucideIcons.Circle;
                  
                  return (
                    <TabsTrigger 
                      key={category.id}
                      value={category.id}
                      className="gap-2"
                      data-testid={`tab-${category.id}`}
                    >
                      <IconComponent className={`h-4 w-4 ${category.color}`} />
                      <span>{category.name}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              
              {predictionCategories.map((category) => (
                <TabsContent key={category.id} value={category.id} className="space-y-4">
                  <PredictionMarketsDemo 
                    categoryId={category.id}
                    isAdmin={user?.role === 'admin'}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
