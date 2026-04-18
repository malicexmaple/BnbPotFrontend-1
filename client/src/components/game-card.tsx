import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { getLeagueBadge } from "@/lib/leagueUtils";
import { getTeamBadge } from "@/lib/teamUtils";
import { useEffect, useState } from "react";

interface GameCardProps {
  sport: string;
  teamA: string;
  teamB: string;
  league: string;
  gameTime: Date;
  marketCount: number;
  isLive: boolean;
  gameSlug: string;
}

export function GameCard({
  sport,
  teamA,
  teamB,
  league,
  gameTime,
  marketCount,
  isLive,
  gameSlug,
}: GameCardProps) {
  const leagueBadge = getLeagueBadge(league);
  const [teamABadge, setTeamABadge] = useState<string | null>(null);
  const [teamBBadge, setTeamBBadge] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeamBadges = async () => {
      const [badgeA, badgeB] = await Promise.all([
        getTeamBadge(teamA),
        getTeamBadge(teamB)
      ]);
      setTeamABadge(badgeA);
      setTeamBBadge(badgeB);
    };
    fetchTeamBadges();
  }, [teamA, teamB]);
  
  return (
    <Link href={`/sports/${sport.toLowerCase().replace(/\s+/g, '-')}/game/${gameSlug}`}>
      <Card 
        className="hover-elevate active-elevate-2 cursor-pointer transition-all border-2 border-border/50 h-full"
        data-testid={`card-game-${gameSlug}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <Badge 
              variant={isLive ? "default" : "secondary"}
              className="text-xs font-mono"
              data-testid="badge-game-status"
            >
              {isLive ? (
                <>
                  <TrendingUp className="h-3 w-3 mr-1" />
                  LIVE
                </>
              ) : (
                format(gameTime, "MMM d, h:mm a")
              )}
            </Badge>
            <div className="flex items-center gap-2">
              {leagueBadge ? (
                <img 
                  src={leagueBadge} 
                  alt={league}
                  className="h-8 w-8 object-contain"
                  data-testid="img-league-logo"
                />
              ) : (
                <Badge 
                  variant="outline" 
                  className="text-xs font-mono"
                  data-testid="badge-league"
                >
                  {league}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Teams Matchup */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-md bg-muted/30 hover-elevate">
              <div className="flex items-center gap-2">
                {teamABadge ? (
                  <img 
                    src={teamABadge} 
                    alt={teamA}
                    className="h-8 w-8 object-contain"
                    data-testid="img-team-a-logo"
                  />
                ) : (
                  <Trophy className="h-4 w-4 text-primary" />
                )}
                <span className="font-semibold text-base" data-testid="text-team-a">
                  {teamA}
                </span>
              </div>
            </div>
            
            <div className="text-center text-xs text-muted-foreground font-mono">
              VS
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-md bg-muted/30 hover-elevate">
              <div className="flex items-center gap-2">
                {teamBBadge ? (
                  <img 
                    src={teamBBadge} 
                    alt={teamB}
                    className="h-8 w-8 object-contain"
                    data-testid="img-team-b-logo"
                  />
                ) : (
                  <Trophy className="h-4 w-4 text-primary" />
                )}
                <span className="font-semibold text-base" data-testid="text-team-b">
                  {teamB}
                </span>
              </div>
            </div>
          </div>

          {/* Market Count */}
          <div className="flex items-center justify-center gap-2 pt-2 border-t border-border/50">
            <span className="text-sm text-muted-foreground font-mono" data-testid="text-market-count">
              {marketCount} {marketCount === 1 ? 'Market' : 'Markets'} Available
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
