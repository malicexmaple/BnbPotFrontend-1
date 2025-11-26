import { sportsData } from "@shared/sports-leagues";

export function getLeagueBadge(leagueName: string): string | undefined {
  const normalizedSearchName = leagueName.toLowerCase().trim();
  
  for (const sport of sportsData) {
    for (const league of sport.leagues) {
      const normalizedName = league.name.toLowerCase();
      const normalizedDisplayName = league.displayName.toLowerCase();
      
      if (normalizedName === normalizedSearchName || 
          normalizedDisplayName === normalizedSearchName ||
          normalizedName.includes(normalizedSearchName) ||
          normalizedSearchName.includes(normalizedName)) {
        return league.badge;
      }
    }
  }
  return undefined;
}

export function getSportIcon(sportId: string): string {
  const sport = sportsData.find(s => s.id === sportId || s.name.toLowerCase() === sportId.toLowerCase());
  
  if (!sport) {
    return '/sport-icons/soccer.svg';
  }
  
  if (sport.iconType === 'custom') {
    return `/sport-icons/${sport.iconName}.png`;
  }
  
  return `/sport-icons/${sport.iconName}.svg`;
}
