import { getAtpPlayerHeadshot, findPlayerByName } from '@shared/players';

const API_KEY = "164325";
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour in-memory
const LOCAL_STORAGE_CACHE_DAYS = 7; // 7 days in localStorage
const BADGE_CACHE_KEY_PREFIX = 'team_badge_';

interface TeamCache {
  badge: string | null;
  timestamp: number;
}

const teamBadgeCache = new Map<string, TeamCache>();

interface CachedBadge {
  url: string | null;
  timestamp: number;
}

function getCachedBadgeFromLocalStorage(teamName: string): string | null {
  try {
    const cached = localStorage.getItem(BADGE_CACHE_KEY_PREFIX + teamName);
    if (!cached) return null;

    const data: CachedBadge = JSON.parse(cached);
    const expiryTime = data.timestamp + (LOCAL_STORAGE_CACHE_DAYS * 24 * 60 * 60 * 1000);
    
    if (Date.now() > expiryTime) {
      localStorage.removeItem(BADGE_CACHE_KEY_PREFIX + teamName);
      return null;
    }

    return data.url;
  } catch {
    return null;
  }
}

function setCachedBadgeToLocalStorage(teamName: string, url: string | null): void {
  try {
    // Don't cache NULL values - they might be from rate limit errors
    if (url === null) {
      return;
    }
    
    const data: CachedBadge = {
      url,
      timestamp: Date.now()
    };
    localStorage.setItem(BADGE_CACHE_KEY_PREFIX + teamName, JSON.stringify(data));
  } catch (error) {
    console.warn('localStorage cache failed:', error);
  }
}

// Utility to clear all badge caches (useful after errors)
export function clearBadgeCache(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(BADGE_CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    console.log('Badge cache cleared');
  } catch (error) {
    console.warn('Failed to clear cache:', error);
  }
}

// Sports that feature individual athletes instead of teams
const INDIVIDUAL_SPORTS = new Set([
  'Tennis',
  'Golf',
  'Boxing',
  'MMA',
  'UFC',
  'Wrestling',
  'Athletics',
  'Track and Field',
  'Swimming',
  'Cycling'
]);

export interface ExtractedTeams {
  teamA: string | null;
  teamB: string | null;
}

/**
 * Extracts actual team names from market data.
 * Strategy:
 * 1. First check if teamA/teamB are real team names (not bet outcomes)
 * 2. If they're bet outcomes, try extracting teams from description
 * 3. Return null if no real teams found
 */
export function extractTeamsFromMarket(market: { teamA: string; teamB: string; description: string }): ExtractedTeams {
  // Check if teamA and teamB look like actual team names (not bet outcomes)
  const betOutcomes = ['yes', 'no', 'over', 'under', 'touchdown', 'field goal', 'safety', 'draw'];
  const isTeamAOutcome = betOutcomes.some(outcome => market.teamA.toLowerCase().includes(outcome));
  const isTeamBOutcome = betOutcomes.some(outcome => market.teamB.toLowerCase().includes(outcome));
  
  // If both are real team names, use them (most accurate - includes full names like "Golden State Warriors")
  if (!isTeamAOutcome && !isTeamBOutcome) {
    return {
      teamA: market.teamA,
      teamB: market.teamB
    };
  }
  
  // If teamA/teamB are bet outcomes, try to extract actual teams from description
  // For example: "Chiefs vs Bills - First Score Type" → { teamA: "Chiefs", teamB: "Bills" }
  const vsPattern = /([A-Za-z0-9\s&'.]+?)\s+vs\s+([A-Za-z0-9\s&'.]+?)\s*[-–—]/i;
  const match = market.description.match(vsPattern);
  
  if (match && match[1] && match[2]) {
    return {
      teamA: match[1].trim(),
      teamB: match[2].trim()
    };
  }
  
  // No real teams found
  return {
    teamA: null,
    teamB: null
  };
}

/**
 * Checks if a sport is an individual sport (tennis, golf, etc.) vs team sport (basketball, football, etc.)
 */
export function isIndividualSport(sport: string): boolean {
  return INDIVIDUAL_SPORTS.has(sport);
}

/**
 * Gets the image URL for a team or player depending on sport type
 * For team sports: fetches team badge from TheSportsDB
 * For individual sports: fetches player headshot from ATP Tour (or other sources)
 */
export async function getTeamOrPlayerImage(
  name: string, 
  sport: string
): Promise<string | null> {
  // Return null for empty names
  if (!name || name.trim() === '') {
    return null;
  }
  
  // For individual sports like tennis, get player headshot
  if (isIndividualSport(sport)) {
    return await getPlayerHeadshot(name, sport);
  }
  
  // For team sports, get team badge
  return await getTeamBadge(name);
}

/**
 * Gets player headshot for individual sports
 */
async function getPlayerHeadshot(playerName: string, sport: string): Promise<string | null> {
  if (sport === 'Tennis') {
    // Try to find ATP player
    const headshotUrl = getAtpPlayerHeadshot(playerName);
    if (headshotUrl) {
      return headshotUrl;
    }
    
    // Try fuzzy matching
    const player = findPlayerByName(playerName);
    if (player) {
      return getAtpPlayerHeadshot(player.name);
    }
  }
  
  // TODO: Add support for other individual sports (Golf, Boxing, MMA, etc.)
  
  return null;
}

/**
 * Gets team badge from TheSportsDB via server-side cache
 */
export async function getTeamBadge(teamName: string): Promise<string | null> {
  // Return null for empty team names
  if (!teamName || teamName.trim() === '') {
    return null;
  }
  
  const cacheKey = teamName.toLowerCase().trim();
  
  // Check localStorage first (persistent across page reloads)
  const localStorageCached = getCachedBadgeFromLocalStorage(cacheKey);
  if (localStorageCached !== null) {
    return localStorageCached;
  }

  // Check in-memory cache (faster, but doesn't persist)
  const cached = teamBadgeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.badge;
  }

  try {
    // Use server-side cached endpoint (database-backed)
    const response = await fetch(
      `/api/sports/teams/badge/${encodeURIComponent(teamName)}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch team badge');
    }
    
    const data = await response.json();
    const badge = data.badge || null;
    
    // Cache the result on client side (both memory and localStorage)
    teamBadgeCache.set(cacheKey, {
      badge,
      timestamp: Date.now()
    });
    setCachedBadgeToLocalStorage(cacheKey, badge);
    
    return badge;
  } catch (error) {
    console.error(`Failed to fetch team badge for ${teamName}:`, error);
    
    // Cache null result to avoid repeated failed requests
    teamBadgeCache.set(cacheKey, {
      badge: null,
      timestamp: Date.now()
    });
    
    return null;
  }
}
