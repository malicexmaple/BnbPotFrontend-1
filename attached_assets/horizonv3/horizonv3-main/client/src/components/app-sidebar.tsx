// DegenArena Sports Sidebar Navigation
// Reference: design_guidelines.md - Shadcn sidebar implementation
import { 
  CircleDot,
  Trophy, 
  Flame, 
  TrendingUp,
  Wallet,
  User,
  LogOut,
  Shield,
  Swords,
  Home,
  ShoppingBag,
  Gift,
  Award,
  Crown,
  FileText,
  Calculator,
  Scale,
  Users,
  List,
  ScrollText,
  ChevronDown,
  Gem,
  Star,
  Sparkles,
  Hexagon,
  Zap,
  Eye,
  EyeOff,
  Circle,
  Disc,
  Activity,
  Hand,
  Gauge,
  Target,
  Footprints,
  Cpu,
  Wind,
  Mountain,
  Bike,
  Waves,
  Dumbbell,
  MountainSnow,
  Snowflake,
  MapPin,
  Gamepad2,
  Coins,
  Flag,
} from "lucide-react";
import bannerBackground from "@assets/banner-background.gif";
import horizonLogo from "@assets/horizon-logo.png";
import { useTheme } from "@/components/ThemeProvider";
import { sportsData } from "@shared/sports-leagues";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import type { VisibilitySetting } from "@shared/schema";

// Type definitions for API responses
interface Market {
  id: string;
  sport: string;
  league: string;
  marketType: string;
  teamA: string;
  teamB: string;
  description: string;
  status: string;
  isLive: boolean;
  gameTime: Date;
  poolATotal: string;
  poolBTotal: string;
  bonusPool: string;
  winningOutcome: string | null;
  platformFee: string;
  createdAt: Date;
  updatedAt: Date;
  settledAt: Date | null;
}

interface UserStats {
  user: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    displayName: string | null;
    rank: string;
    rankPoints: number;
    totalWagered: string;
    totalWon: string;
  };
  wallet: {
    id: string;
    balance: string;
    bnbAddress: string;
  };
  rankProgress: {
    current: number;
    min: number;
    max: number | typeof Infinity;
    percentage: number;
    nextRank: string;
  };
}

interface CryptoPrices {
  [currency: string]: number;
}

// Icon name mapping
const iconMap: Record<string, any> = {
  CircleDot,
  Trophy,
  Circle,
  Disc,
  Zap,
  Swords,
  Activity,
  Hand,
  Gauge,
  Target,
  Footprints,
  Gem,
  Cpu,
  Wind,
  Shield,
  Award,
  Mountain,
  Star,
  Bike,
  Waves,
  Dumbbell,
  MountainSnow,
  Snowflake,
  MapPin,
  Gamepad2,
  Coins,
  Hexagon,
  Sparkles,
  Crown,
  Flag,
};

const featureItems = [
  {
    title: "Leaderboard",
    icon: TrendingUp,
    url: "/leaderboard",
  },
  {
    title: "Changelog",
    icon: List,
    url: "/changelog",
  },
];

// Dynamically generate sports items from sportsData
const baseSportsItems = [
  {
    title: "Featured Markets",
    icon: Trophy,
    iconType: "lucide" as const,
    count: 42,
    url: "/",
  },
  {
    title: "My Bets",
    icon: ScrollText,
    iconType: "lucide" as const,
    count: 0,
    url: "/my-bets",
  },
];

// Individual esports games (not using the generic ESports category)
const esportsItems = [
  {
    title: "Counter Strike",
    icon: "cs2",
    iconType: "custom" as const,
    count: 0,
    url: "/sports/cs2",
  },
  {
    title: "Dota 2",
    icon: "dota2",
    iconType: "custom" as const,
    count: 0,
    url: "/sports/dota2",
  },
  {
    title: "League of Legends",
    icon: "lol",
    iconType: "custom" as const,
    count: 0,
    url: "/sports/lol",
  },
  {
    title: "Valorant",
    icon: "valorant",
    iconType: "custom" as const,
    count: 0,
    url: "/sports/valorant",
  },
];

// Custom order based on global popularity and betting volume
const sportOrder = [
  "soccer",           // 1. Football (Soccer)
  "basketball",       // 2. Basketball
  "tennis",           // 3. Tennis
  "cricket",          // 4. Cricket
  "american-football", // 5. American Football
  // Esports are already handled separately above
  "motorsport",       // 6. Motor Racing
  "baseball",         // 7. Baseball
  "golf",             // 8. Golf
  "fighting",         // 9. Boxing/MMA
  "ice-hockey",       // 10. Ice Hockey
  "rugby",            // 11. Rugby
  "table-tennis",     // 12. Table Tennis
  "badminton",        // 13. Badminton
  "volleyball",       // 14. Volleyball
  "cycling",          // 15. Cycling
  "handball",         // 16. Handball
  "darts",            // 17. Darts
  "weightlifting",    // 18. Weightlifting
  "gambling",         // 19. Gambling
];

// Create a map of sports by ID for quick lookup
const sportsMap = sportsData.reduce((acc, sport) => {
  acc[sport.id] = sport;
  return acc;
}, {} as Record<string, typeof sportsData[0]>);

// Sports with dropdown menus (all sports that have leagues)
// These will be rendered as Collapsible dropdowns
const sportsWithDropdowns = sportOrder
  .filter(id => id !== "esports" && sportsMap[id] && sportsMap[id].leagues && sportsMap[id].leagues.length > 0)
  .map(id => sportsMap[id]);

// Combine esports for the "SPORTS MARKETS" category
// (regular sports will be rendered as dropdowns)
const allSportsMarkets = esportsItems;

const accountItems = [
  {
    title: "My Wallet",
    icon: Wallet,
    url: "/wallet",
  },
  {
    title: "My Profile",
    icon: User,
    url: "/profile",
  },
  {
    title: "Admin Panel",
    icon: Shield,
    url: "/admin",
  },
];

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const [selectedCurrency, setSelectedCurrency] = useState('usd');
  const [showBalance, setShowBalance] = useState(true);
  
  // Fetch all markets to count by sport
  const { data: markets = [] } = useQuery<Market[]>({
    queryKey: ['/api/markets'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });
  
  // Fetch user's bets to count for "My Bets"
  const { data: userBets = [] } = useQuery<any[]>({
    queryKey: ['/api/bets/my-bets'],
    enabled: isAuthenticated,
    refetchInterval: 10000, // Refresh every 10 seconds
  });
  
  // Fetch user stats (wallet + rank + XP)
  const { data: userStats } = useQuery<UserStats>({
    queryKey: ['/api/user/stats'],
    enabled: isAuthenticated,
    refetchInterval: 10000, // Refresh every 10 seconds
  });
  
  // Fetch crypto prices
  const { data: cryptoPrices } = useQuery<CryptoPrices>({
    queryKey: ['/api/crypto/prices'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  // Fetch visibility settings (public endpoint for all users)
  const { data: visibilitySettings = [] } = useQuery<VisibilitySetting[]>({
    queryKey: ['/api/visibility-settings'],
    refetchInterval: 10000, // Refresh every 10 seconds
    retry: 1, // Only retry once on failure
  });
  
  // Fetch league activity status (leagues with events in next 2 weeks)
  const { data: activityStatus, isError: activityError } = useQuery<{ activeLeagueIds: string[] }>({
    queryKey: ['/api/leagues/activity-status'],
    refetchInterval: 300000, // Refresh every 5 minutes (reduced from 1 minute to avoid rate limiting)
    retry: 0, // Don't retry on failure to avoid excessive API calls
    staleTime: 300000, // Consider data fresh for 5 minutes
  });
  
  // Helper functions to check visibility
  const isSportVisible = (sportId: string) => {
    const setting = visibilitySettings.find(s => s.type === 'sport' && s.sportId === sportId);
    return setting ? setting.isVisible : true; // Default to visible if no setting exists
  };
  
  const isLeagueVisible = (leagueId: string) => {
    const setting = visibilitySettings.find(s => s.type === 'league' && s.leagueId === leagueId);
    
    // If activity check failed or is loading, default to showing leagues to avoid hiding everything
    if (activityError || !activityStatus) {
      // If there's a visibility setting, respect it
      if (setting) {
        return setting.isVisible;
      }
      // Otherwise default to visible
      return true;
    }
    
    // If no setting exists, default to visible only if league has upcoming events
    if (!setting) {
      return activityStatus.activeLeagueIds.includes(leagueId);
    }
    
    // If manualOverride is true, respect the admin's isVisible setting regardless of activity
    if (setting.manualOverride) {
      return setting.isVisible;
    }
    
    // If manualOverride is false, show only if isVisible AND league has upcoming events
    const hasUpcomingEvents = activityStatus.activeLeagueIds.includes(leagueId);
    return setting.isVisible && hasUpcomingEvents;
  };
  
  // Filter sports markets by visibility
  const filteredSportsMarkets = useMemo(() => {
    return allSportsMarkets.filter(item => {
      // Extract sport ID from URL (e.g., "/sports/soccer/leagues" -> "soccer", "/sports/cs2" -> "cs2")
      const matches = item.url.match(/\/sports\/([^/]+)/);
      if (!matches) return true; // Show if we can't extract sport ID
      const sportId = matches[1];
      return isSportVisible(sportId);
    });
  }, [visibilitySettings]);
  
  // Map sport values from DB to sidebar category titles
  // This maps the database sport field to the sidebar display categories
  const sportCategoryMap: Record<string, string> = sportsData.reduce((acc, sport) => {
    acc[sport.name] = sport.name;
    return acc;
  }, {} as Record<string, string>);
  
  // Count markets by category
  const marketCountsByCategory = markets.reduce((acc, market) => {
    const category = sportCategoryMap[market.sport] || market.sport;
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Get dynamic counts for sports items
  const getSportItemCount = (title: string): number => {
    if (title === 'Featured Markets') {
      return markets.length; // Total count for featured
    }
    if (title === 'My Bets') {
      return userBets.length; // User's active bets count
    }
    return marketCountsByCategory[title] || 0;
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border h-28 p-0 overflow-hidden bg-background relative" style={{ zIndex: 101 }}>
        <img 
          src={bannerBackground} 
          alt="Background" 
          className="absolute inset-0 h-full w-full object-cover" 
          data-testid="banner-background"
        />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <img 
            src={horizonLogo} 
            alt="Horizon" 
            className="max-h-16 w-auto object-contain" 
            data-testid="logo-image"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup className="pb-0">
            <SidebarGroupLabel asChild className="text-foreground text-base font-bold font-sohne">
              <CollapsibleTrigger className="hover-elevate active-elevate-2">
                <span className="text-white">LIVE</span> <span className="ml-1 goldify-text">MARKETS</span>
                <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {baseSportsItems.map((item) => {
                    const isActive = location === item.url;
                    const dynamicCount = getSportItemCount(item.title);
                    const IconComponent = item.icon;
                    
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          onClick={() => setLocation(item.url)}
                          data-active={isActive}
                          className="glow-on-hover bg-transparent hover:bg-transparent [&>svg]:hover:text-white [&>span]:hover:text-white hover:scale-105 transition-transform"
                          data-testid={`sidebar-sport-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <span></span>
                          <span></span>
                          <span></span>
                          <span></span>
                          <IconComponent className="h-5 w-5 transition-colors" style={{ position: 'relative', zIndex: 1 }} />
                          <span className="flex-1 transition-colors" style={{ position: 'relative', zIndex: 1 }}>{item.title}</span>
                          <span className="font-mono text-xs text-primary transition-colors" style={{ position: 'relative', zIndex: 1 }}>{dynamicCount}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <Collapsible defaultOpen className="group/sports-markets">
          <SidebarGroup className="pb-0 pt-0">
            <SidebarGroupLabel asChild className="text-foreground text-base font-bold font-sohne">
              <CollapsibleTrigger className="hover-elevate active-elevate-2">
                <span className="text-white">SPORTS</span> <span className="ml-1 goldify-text">MARKETS</span>
                <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/sports-markets:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {/* Esports items (no dropdown menus) */}
                  {filteredSportsMarkets.map((item) => {
                    const isActive = location === item.url;
                    const dynamicCount = getSportItemCount(item.title);
                    const IconComponent = item.icon as any;
                    
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          onClick={() => setLocation(item.url)}
                          data-active={isActive}
                          className="glow-on-hover bg-transparent hover:bg-transparent [&>svg]:hover:text-white [&>span]:hover:text-white [&>img]:hover:brightness-0 [&>img]:hover:invert hover:scale-105 transition-transform"
                          data-testid={`sidebar-sport-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <span></span>
                          <span></span>
                          <span></span>
                          <span></span>
                          {item.iconType === 'custom' ? (
                            <img 
                              src={`/sport-icons/${IconComponent}.png`} 
                              alt={item.title}
                              loading="eager"
                              decoding="async"
                              className="h-5 w-5 transition-all brightness-0 invert opacity-70"
                              style={{ position: 'relative', zIndex: 1 }}
                            />
                          ) : (
                            <IconComponent className="h-5 w-5 transition-colors" style={{ position: 'relative', zIndex: 1 }} />
                          )}
                          <span className="flex-1 transition-colors" style={{ position: 'relative', zIndex: 1 }}>{item.title}</span>
                          <span className="font-mono text-xs text-primary transition-colors" style={{ position: 'relative', zIndex: 1 }}>{dynamicCount}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}

                  {/* Dynamic dropdown menus for all sports with leagues */}
                  {sportsWithDropdowns.map((sport) => {
                    if (!isSportVisible(sport.id)) return null;
                    
                    const IconComponent = sport.iconType === 'svg' || sport.iconType === 'custom' 
                      ? null 
                      : (iconMap[sport.iconName] || CircleDot);
                    
                    return (
                      <Collapsible key={sport.id} className={`group/${sport.id}`}>
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              className="glow-on-hover bg-transparent hover:bg-transparent [&>svg]:hover:text-white [&>span]:hover:text-white [&>img]:hover:brightness-0 [&>img]:hover:invert hover:scale-105 transition-transform"
                              data-testid={`sidebar-sport-${sport.id}`}
                            >
                              <span></span>
                              <span></span>
                              <span></span>
                              <span></span>
                              {sport.iconType === 'svg' ? (
                                <img 
                                  src={`/sport-icons/${sport.iconName}.svg`} 
                                  alt={sport.name}
                                  loading="eager"
                                  decoding="async"
                                  className="h-5 w-5 transition-all brightness-0 invert opacity-70"
                                  style={{ position: 'relative', zIndex: 1 }}
                                />
                              ) : sport.iconType === 'custom' ? (
                                <img 
                                  src={`/sport-icons/${sport.iconName}.png`} 
                                  alt={sport.name}
                                  loading="eager"
                                  decoding="async"
                                  className="h-5 w-5 transition-all brightness-0 invert opacity-70"
                                  style={{ position: 'relative', zIndex: 1 }}
                                />
                              ) : IconComponent ? (
                                <IconComponent className="h-5 w-5 transition-colors" style={{ position: 'relative', zIndex: 1 }} />
                              ) : null}
                              <span className="flex-1 transition-colors" style={{ position: 'relative', zIndex: 1 }}>{sport.name}</span>
                              <ChevronDown className={`h-4 w-4 transition-transform group-data-[state=open]/${sport.id}:rotate-180`} style={{ position: 'relative', zIndex: 1 }} />
                              <span className="font-mono text-xs text-primary transition-colors ml-1" style={{ position: 'relative', zIndex: 1 }}>{getSportItemCount(sport.name)}</span>
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenu className="pl-8">
                              {sport.leagues
                                .filter((league) => isLeagueVisible(league.id))
                                .map((league) => ({
                                  ...league,
                                  marketCount: markets.filter(m => 
                                    m.sport === sport.name && m.league === league.name
                                  ).length
                                }))
                                .sort((a, b) => b.marketCount - a.marketCount)
                                .map((league) => {
                                  const leagueUrl = `/sports/${sport.id}/league/${league.name}`;
                                  const isActive = location === leagueUrl;
                                  
                                  return (
                                    <SidebarMenuItem key={league.id}>
                                      <SidebarMenuButton
                                        onClick={() => setLocation(leagueUrl)}
                                        data-active={isActive}
                                        className="glow-on-hover bg-transparent hover:bg-transparent [&>svg]:hover:text-white [&>span]:hover:text-white hover:scale-105 transition-transform"
                                        data-testid={`sidebar-${sport.id}-league-${league.name.toLowerCase().replace(/\s+/g, '-')}`}
                                      >
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                        {league.badge ? (
                                          <img 
                                            src={league.badge} 
                                            alt={league.name}
                                            className="h-5 w-5 object-contain transition-all"
                                            style={{ position: 'relative', zIndex: 1 }}
                                          />
                                        ) : (
                                          <div className="h-5 w-5" style={{ position: 'relative', zIndex: 1 }} />
                                        )}
                                        <span className="flex-1 transition-colors" style={{ position: 'relative', zIndex: 1 }}>{league.displayName}</span>
                                        <span className="font-mono text-xs text-primary transition-colors" style={{ position: 'relative', zIndex: 1 }}>{league.marketCount}</span>
                                      </SidebarMenuButton>
                                    </SidebarMenuItem>
                                  );
                                })}
                            </SidebarMenu>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  })}

                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <Collapsible className="group/collapsible">
          <SidebarGroup className="pb-0 pt-0">
            <SidebarGroupLabel asChild className="text-foreground text-base font-bold font-sohne">
              <CollapsibleTrigger className="hover-elevate active-elevate-2">
                <span className="text-white">SITE</span> <span className="ml-1 goldify-text">FEATURES</span>
                <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {featureItems.map((item) => {
                    const isActive = location === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          onClick={() => setLocation(item.url)}
                          data-active={isActive}
                          className="glow-on-hover bg-transparent hover:bg-transparent [&>svg]:hover:text-white [&>span]:hover:text-white hover:scale-105 transition-transform"
                          data-testid={`sidebar-${item.title.toLowerCase().replace(' ', '-')}`}
                        >
                          <span></span>
                          <span></span>
                          <span></span>
                          <span></span>
                          <item.icon className="h-5 w-5 transition-colors" style={{ position: 'relative', zIndex: 1 }} />
                          <span className="flex-1 transition-colors" style={{ position: 'relative', zIndex: 1 }}>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {isAuthenticated && (
          <Collapsible className="group/collapsible">
            <SidebarGroup className="pb-0 pt-0">
              <SidebarGroupLabel asChild className="text-foreground text-base font-bold font-sohne">
                <CollapsibleTrigger className="hover-elevate active-elevate-2">
                  <span className="text-white">ACCOUNT</span> <span className="ml-1 goldify-text">SETTINGS</span>
                  <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {accountItems.map((item) => {
                      const isActive = location === item.url;
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            onClick={() => setLocation(item.url)}
                            data-active={isActive}
                            className="glow-on-hover bg-transparent hover:bg-transparent [&>svg]:hover:text-white [&>span]:hover:text-white hover:scale-105 transition-transform"
                            data-testid={`sidebar-${item.title.toLowerCase().replace(' ', '-')}`}
                          >
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                            <item.icon className="h-5 w-5 transition-colors" style={{ position: 'relative', zIndex: 1 }} />
                            <span className="transition-colors" style={{ position: 'relative', zIndex: 1 }}>{item.title}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2 space-y-1.5">
        {isAuthenticated ? (
          <>
            {/* User Info & Balance */}
            <div className="flex items-start gap-2">
              {showBalance && (
                <Avatar className="h-8 w-8 border-2 border-accent">
                  <AvatarImage src={user?.profileImageUrl || ""} alt={user?.displayName || "User"} />
                  <AvatarFallback className="text-xs font-bold text-primary bg-primary/10">
                    {(user?.displayName || user?.email)?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <p className="text-sm font-bold text-foreground truncate font-sohne">
                    {showBalance ? (user?.displayName || user?.email?.split('@')[0] || "User") : "•••••••••"}
                  </p>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setShowBalance(!showBalance)}
                    className="h-5 w-5 shrink-0"
                    data-testid="button-toggle-balance"
                  >
                    {showBalance ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                {userStats?.wallet && (
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-primary font-sohne leading-tight" data-testid="text-balance-bnb">
                        {showBalance ? `${parseFloat(userStats.wallet.balance).toFixed(4)} BNB` : '•••••••'}
                      </p>
                      {cryptoPrices && (
                        <p className="text-xs text-foreground font-bold font-sohne leading-tight" data-testid="text-balance-fiat">
                          {showBalance ? `≈ ${(parseFloat(userStats.wallet.balance) * (cryptoPrices[selectedCurrency] || 0)).toFixed(2)} ${selectedCurrency.toUpperCase()}` : '≈ •••••••'}
                        </p>
                      )}
                    </div>
                    {showBalance && (
                      <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                        <SelectTrigger className="h-6 w-16 text-[10px] border-accent font-sohne" data-testid="select-currency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="usd">USD</SelectItem>
                          <SelectItem value="eur">EUR</SelectItem>
                          <SelectItem value="gbp">GBP</SelectItem>
                          <SelectItem value="jpy">JPY</SelectItem>
                          <SelectItem value="cad">CAD</SelectItem>
                          <SelectItem value="aud">AUD</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </div>
            </div>


            {/* Logout Button */}
            <Button
              size="sm"
              onClick={handleLogout}
              className="w-full goldify-button h-7 text-xs mt-1"
              data-testid="button-logout"
            >
              <LogOut className="h-3 w-3 mr-1.5" style={{ position: 'relative', zIndex: 1 }} />
              <span className="font-sohne" style={{ position: 'relative', zIndex: 1 }}>Logout</span>
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            onClick={handleLogin}
            className="w-full goldify-button h-7 text-xs"
            data-testid="button-sidebar-login"
          >
            <LogIn className="h-3 w-3 mr-1.5" style={{ position: 'relative', zIndex: 1 }} />
            <span className="font-sohne" style={{ position: 'relative', zIndex: 1 }}>Login / Sign up</span>
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
