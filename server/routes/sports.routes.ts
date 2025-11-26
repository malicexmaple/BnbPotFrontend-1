import type { Express } from "express";
import type { RouteDeps } from "./types";

export async function registerSportsRoutes(app: Express, _deps: RouteDeps): Promise<void> {
  const { theSportsDB } = await import('../thesportsdb');

  app.get("/api/sports", async (_req, res) => {
    try {
      const sports = await theSportsDB.getAllSports();
      res.json(sports);
    } catch (error) {
      console.error("Error fetching sports:", error);
      res.status(500).json({ message: "Failed to fetch sports" });
    }
  });

  app.get("/api/sports/events/upcoming/:leagueId", async (req, res) => {
    try {
      const events = await theSportsDB.getUpcomingEventsByLeague(req.params.leagueId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
      res.status(500).json({ message: "Failed to fetch upcoming events" });
    }
  });

  app.get("/api/sports/events/past/:leagueId", async (req, res) => {
    try {
      const events = await theSportsDB.getPastEventsByLeague(req.params.leagueId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching past events:", error);
      res.status(500).json({ message: "Failed to fetch past events" });
    }
  });

  app.get("/api/sports/events/date/:date", async (req, res) => {
    try {
      const { sport, league } = req.query;
      const events = await theSportsDB.getEventsByDate(
        req.params.date,
        sport as string | undefined,
        league as string | undefined
      );
      res.json(events);
    } catch (error) {
      console.error("Error fetching events by date:", error);
      res.status(500).json({ message: "Failed to fetch events by date" });
    }
  });

  app.get("/api/sports/events/:eventId", async (req, res) => {
    try {
      const event = await theSportsDB.getEventDetails(req.params.eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching event details:", error);
      res.status(500).json({ message: "Failed to fetch event details" });
    }
  });

  app.get("/api/sports/teams/league/:leagueName", async (req, res) => {
    try {
      const teams = await theSportsDB.getTeamsByLeague(req.params.leagueName);
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.get("/api/sports/teams/search/:query", async (req, res) => {
    try {
      const query = req.params.query;
      if (!query) {
        return res.status(400).json({ message: "Search query required" });
      }
      const teams = await theSportsDB.searchTeams(query);
      res.json(teams);
    } catch (error) {
      console.error("Error searching teams:", error);
      res.status(500).json({ message: "Failed to search teams" });
    }
  });

  app.get("/api/sports/teams/:teamId", async (req, res) => {
    try {
      const team = await theSportsDB.getTeamDetails(req.params.teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      console.error("Error fetching team details:", error);
      res.status(500).json({ message: "Failed to fetch team details" });
    }
  });

  app.get("/api/sports/teams/badge/:teamName", async (req, res) => {
    try {
      const badge = await theSportsDB.getTeamBadgeByName(req.params.teamName);
      res.json({ badge });
    } catch (error) {
      console.error("Error fetching team badge:", error);
      res.status(500).json({ message: "Failed to fetch team badge" });
    }
  });

  app.get("/api/sports/teams/from-events/:leagueId", async (req, res) => {
    try {
      const teams = await theSportsDB.getTeamsFromEvents(req.params.leagueId);
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams from events:", error);
      res.status(500).json({ message: "Failed to fetch teams from events" });
    }
  });

  app.get("/api/sports/leagues/search/:query", async (req, res) => {
    try {
      const query = req.params.query;
      if (!query) {
        return res.status(400).json({ message: "Search query required" });
      }
      const leagues = await theSportsDB.searchLeagues(query);
      res.json(leagues);
    } catch (error) {
      console.error("Error searching leagues:", error);
      res.status(500).json({ message: "Failed to search leagues" });
    }
  });

  app.get("/api/sports/leagues/:leagueId", async (req, res) => {
    try {
      const league = await theSportsDB.getLeagueDetails(req.params.leagueId);
      if (!league) {
        return res.status(404).json({ message: "League not found" });
      }
      res.json(league);
    } catch (error) {
      console.error("Error fetching league details:", error);
      res.status(500).json({ message: "Failed to fetch league details" });
    }
  });
}
