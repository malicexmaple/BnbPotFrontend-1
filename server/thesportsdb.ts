import type { SportsDBTeam, SportsDBEvent, SportsDBLeague } from '@shared/thesportsdb-types';
import { db } from './db';
import { teamBadgeCache } from '../shared/schema';
import { eq } from 'drizzle-orm';

const THESPORTSDB_BASE_URL = 'https://www.thesportsdb.com/api/v1/json';
const API_KEY = process.env.THESPORTSDB_API_KEY || '164325';

if (!process.env.THESPORTSDB_API_KEY) {
  console.log('Using TheSportsDB fallback API key (164325)');
}

export type { SportsDBTeam, SportsDBEvent, SportsDBLeague };

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>();

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

const eventCache = new SimpleCache<SportsDBEvent[]>();
const teamCache = new SimpleCache<SportsDBTeam[]>();
const badgeCache = new SimpleCache<string | null>();

class TheSportsDBService {
  private async fetchFromAPI<T>(endpoint: string): Promise<T> {
    const url = `${THESPORTSDB_BASE_URL}/${API_KEY}/${endpoint}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`TheSportsDB API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('TheSportsDB API request failed:', error);
      throw error;
    }
  }

  async getUpcomingEventsByLeague(leagueId: string): Promise<SportsDBEvent[]> {
    const cacheKey = `upcoming_${leagueId}`;
    const cached = eventCache.get(cacheKey);
    if (cached) return cached;

    const data = await this.fetchFromAPI<{ events: SportsDBEvent[] | null }>(
      `eventsnextleague.php?id=${leagueId}`
    );
    const events = data.events || [];
    eventCache.set(cacheKey, events, 5 * 60 * 1000); // 5 minute cache
    return events;
  }

  async getPastEventsByLeague(leagueId: string): Promise<SportsDBEvent[]> {
    const data = await this.fetchFromAPI<{ events: SportsDBEvent[] | null }>(
      `eventspastleague.php?id=${leagueId}`
    );
    return data.events || [];
  }

  async getEventsByDate(date: string, sport?: string, league?: string): Promise<SportsDBEvent[]> {
    const cacheKey = `date_${date}_${sport}_${league}`;
    const cached = eventCache.get(cacheKey);
    if (cached) return cached;

    let endpoint = `eventsday.php?d=${date}`;
    if (sport) endpoint += `&s=${encodeURIComponent(sport)}`;
    if (league) endpoint += `&l=${encodeURIComponent(league)}`;
    
    const data = await this.fetchFromAPI<{ events: SportsDBEvent[] | null }>(endpoint);
    const events = data.events || [];
    eventCache.set(cacheKey, events, 5 * 60 * 1000); // 5 minute cache
    return events;
  }

  async getTeamsByLeague(leagueName: string): Promise<SportsDBTeam[]> {
    const cacheKey = `teams_${leagueName}`;
    const cached = teamCache.get(cacheKey);
    if (cached) return cached;

    const data = await this.fetchFromAPI<{ teams: SportsDBTeam[] | null }>(
      `search_all_teams.php?l=${encodeURIComponent(leagueName)}`
    );
    
    if (!data.teams || data.teams.length === 0) {
      return [];
    }

    const teamsWithLogos = await Promise.all(
      data.teams.map(async (team) => {
        const fullTeam = await this.getTeamDetails(team.idTeam);
        return fullTeam || team;
      })
    );

    const teamsWithBadges = teamsWithLogos.filter(team => team.strBadge);
    console.log(`Fetched ${teamsWithLogos.length} teams for ${leagueName}, ${teamsWithBadges.length} have badges`);
    
    teamCache.set(cacheKey, teamsWithLogos, 60 * 60 * 1000); // 1 hour cache
    return teamsWithLogos;
  }

  async searchTeams(teamName: string): Promise<SportsDBTeam[]> {
    const cacheKey = `search_${teamName}`;
    const cached = teamCache.get(cacheKey);
    if (cached) return cached;

    const data = await this.fetchFromAPI<{ teams: SportsDBTeam[] | null }>(
      `searchteams.php?t=${encodeURIComponent(teamName)}`
    );
    
    if (!data.teams || data.teams.length === 0) {
      return [];
    }

    const teamsWithLogos = await Promise.all(
      data.teams.map(async (team) => {
        const fullTeam = await this.getTeamDetails(team.idTeam);
        return fullTeam || team;
      })
    );

    if (teamsWithLogos.length > 0 && teamsWithLogos[0].strBadge) {
      console.log(`Search "${teamName}": found team with badge`);
    }
    
    teamCache.set(cacheKey, teamsWithLogos, 60 * 60 * 1000); // 1 hour cache
    return teamsWithLogos;
  }

  async getTeamDetails(teamId: string): Promise<SportsDBTeam | null> {
    const data = await this.fetchFromAPI<{ teams: SportsDBTeam[] | null }>(
      `lookupteam.php?id=${teamId}`
    );
    return data.teams?.[0] || null;
  }

  async searchLeagues(leagueName: string): Promise<SportsDBLeague[]> {
    const data = await this.fetchFromAPI<{ countries: SportsDBLeague[] | null }>(
      `search_all_leagues.php?l=${encodeURIComponent(leagueName)}`
    );
    return data.countries || [];
  }

  async getLeagueDetails(leagueId: string): Promise<SportsDBLeague | null> {
    const data = await this.fetchFromAPI<{ leagues: SportsDBLeague[] | null }>(
      `lookupleague.php?id=${leagueId}`
    );
    return data.leagues?.[0] || null;
  }

  async getAllSports(): Promise<Array<{ idSport: string; strSport: string; strFormat: string; strSportThumb: string }>> {
    const data = await this.fetchFromAPI<{ sports: Array<{ idSport: string; strSport: string; strFormat: string; strSportThumb: string }> | null }>(
      `all_sports.php`
    );
    return data.sports || [];
  }

  async getEventDetails(eventId: string): Promise<SportsDBEvent | null> {
    const data = await this.fetchFromAPI<{ events: SportsDBEvent[] | null }>(
      `lookupevent.php?id=${eventId}`
    );
    return data.events?.[0] || null;
  }

  async getTeamBadgeByName(teamName: string): Promise<string | null> {
    const cacheKey = `badge_${teamName}`;
    const cached = badgeCache.get(cacheKey);
    if (cached !== null) return cached;

    try {
      // Check database cache first
      const dbCached = await db.select()
        .from(teamBadgeCache)
        .where(eq(teamBadgeCache.teamName, teamName))
        .limit(1);

      // If cached and not expired, return it
      if (dbCached.length > 0 && dbCached[0].expiresAt > new Date()) {
        console.log(`Cache HIT for team: ${teamName}`);
        badgeCache.set(cacheKey, dbCached[0].badgeUrl, 24 * 60 * 60 * 1000);
        return dbCached[0].badgeUrl;
      }

      // Cache miss or expired - fetch from API
      console.log(`Search "${teamName}": checking API...`);
      const teams = await this.searchTeams(teamName);
      
      const badgeUrl = teams.length > 0 && teams[0].strBadge ? teams[0].strBadge : null;
      const teamId = teams.length > 0 ? teams[0].idTeam : null;

      // Only cache successful results
      if (badgeUrl !== null) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        if (dbCached.length > 0) {
          await db.update(teamBadgeCache)
            .set({ 
              badgeUrl, 
              teamId,
              fetchedAt: new Date(),
              expiresAt 
            })
            .where(eq(teamBadgeCache.teamName, teamName));
        } else {
          await db.insert(teamBadgeCache)
            .values({
              teamName,
              badgeUrl,
              teamId,
              expiresAt
            });
        }
      }

      if (badgeUrl) {
        console.log(`Found badge for team: ${teamName}`);
      } else {
        console.log(`No badge found for team: ${teamName}`);
      }
      
      badgeCache.set(cacheKey, badgeUrl, 24 * 60 * 60 * 1000);
      return badgeUrl;
    } catch (error) {
      console.error(`Error fetching badge for ${teamName}:`, error);
      
      // On error, try to return any cached value (even if expired)
      try {
        const dbCached = await db.select()
          .from(teamBadgeCache)
          .where(eq(teamBadgeCache.teamName, teamName))
          .limit(1);
        
        if (dbCached.length > 0 && dbCached[0].badgeUrl) {
          console.log(`Using expired cache for ${teamName} due to API error`);
          return dbCached[0].badgeUrl;
        }
      } catch (dbError) {
        console.error(`Database cache lookup failed:`, dbError);
      }
      
      return null;
    }
  }

  async getTeamsFromEvents(leagueId: string): Promise<Array<{ name: string; badge: string | null }>> {
    try {
      const events = await this.getUpcomingEventsByLeague(leagueId);
      const uniqueTeamNames = new Set<string>();
      
      events.forEach(event => {
        if (event.strHomeTeam) uniqueTeamNames.add(event.strHomeTeam);
        if (event.strAwayTeam) uniqueTeamNames.add(event.strAwayTeam);
      });

      const teamsArray = Array.from(uniqueTeamNames);
      console.log(`Found ${teamsArray.length} unique teams from events for league ${leagueId}`);

      const teamsWithBadges = await Promise.all(
        teamsArray.map(async (teamName) => {
          const badge = await this.getTeamBadgeByName(teamName);
          return { name: teamName, badge };
        })
      );

      return teamsWithBadges.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error(`Error extracting teams from events for league ${leagueId}:`, error);
      return [];
    }
  }
}

export const sportsDBService = new TheSportsDBService();

export const theSportsDB = {
  getUpcomingEventsByLeague: (leagueId: string) => sportsDBService.getUpcomingEventsByLeague(leagueId),
  getPastEventsByLeague: (leagueId: string) => sportsDBService.getPastEventsByLeague(leagueId),
  getEventsByDate: (date: string, sport?: string, league?: string) => sportsDBService.getEventsByDate(date, sport, league),
  getTeamsByLeague: (leagueName: string) => sportsDBService.getTeamsByLeague(leagueName),
  searchTeams: (teamName: string) => sportsDBService.searchTeams(teamName),
  getTeamDetails: (teamId: string) => sportsDBService.getTeamDetails(teamId),
  searchLeagues: (leagueName: string) => sportsDBService.searchLeagues(leagueName),
  getLeagueDetails: (leagueId: string) => sportsDBService.getLeagueDetails(leagueId),
  getAllSports: () => sportsDBService.getAllSports(),
  getEventDetails: (eventId: string) => sportsDBService.getEventDetails(eventId),
  getTeamBadgeByName: (teamName: string) => sportsDBService.getTeamBadgeByName(teamName),
  getTeamsFromEvents: (leagueId: string) => sportsDBService.getTeamsFromEvents(leagueId),
};
