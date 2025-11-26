import type { Express } from "express";
import type { RouteDeps } from "./types";
import { z } from "zod";

const idParamSchema = z.object({
  leagueId: z.string()
    .min(1, "League ID is required")
    .max(50, "League ID too long")
    .regex(/^[a-zA-Z0-9_-]+$/, "Invalid league ID format"),
});

const eventIdParamSchema = z.object({
  eventId: z.string()
    .min(1, "Event ID is required")
    .max(50, "Event ID too long")
    .regex(/^[a-zA-Z0-9_-]+$/, "Invalid event ID format"),
});

const teamIdParamSchema = z.object({
  teamId: z.string()
    .min(1, "Team ID is required")
    .max(50, "Team ID too long")
    .regex(/^[a-zA-Z0-9_-]+$/, "Invalid team ID format"),
});

const searchQueryParamSchema = z.object({
  query: z.string()
    .min(1, "Search query is required")
    .max(100, "Search query too long")
    .trim(),
});

const nameParamSchema = z.object({
  leagueName: z.string()
    .min(1, "League name is required")
    .max(200, "League name too long")
    .trim(),
});

const teamNameParamSchema = z.object({
  teamName: z.string()
    .min(1, "Team name is required")
    .max(200, "Team name too long")
    .trim(),
});

const dateParamSchema = z.object({
  date: z.string()
    .min(1, "Date is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD"),
});

const eventsByDateQuerySchema = z.object({
  sport: z.string().max(100).optional(),
  league: z.string().max(100).optional(),
});

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
      const paramResult = idParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        return res.status(400).json({ 
          message: "Invalid league ID", 
          errors: paramResult.error.flatten().fieldErrors 
        });
      }

      const events = await theSportsDB.getUpcomingEventsByLeague(paramResult.data.leagueId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
      res.status(500).json({ message: "Failed to fetch upcoming events" });
    }
  });

  app.get("/api/sports/events/past/:leagueId", async (req, res) => {
    try {
      const paramResult = idParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        return res.status(400).json({ 
          message: "Invalid league ID", 
          errors: paramResult.error.flatten().fieldErrors 
        });
      }

      const events = await theSportsDB.getPastEventsByLeague(paramResult.data.leagueId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching past events:", error);
      res.status(500).json({ message: "Failed to fetch past events" });
    }
  });

  app.get("/api/sports/events/date/:date", async (req, res) => {
    try {
      const paramResult = dateParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        return res.status(400).json({ 
          message: "Invalid date parameter", 
          errors: paramResult.error.flatten().fieldErrors 
        });
      }

      const queryResult = eventsByDateQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        return res.status(400).json({ 
          message: "Invalid query parameters", 
          errors: queryResult.error.flatten().fieldErrors 
        });
      }

      const events = await theSportsDB.getEventsByDate(
        paramResult.data.date,
        queryResult.data.sport,
        queryResult.data.league
      );
      res.json(events);
    } catch (error) {
      console.error("Error fetching events by date:", error);
      res.status(500).json({ message: "Failed to fetch events by date" });
    }
  });

  app.get("/api/sports/events/:eventId", async (req, res) => {
    try {
      const paramResult = eventIdParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        return res.status(400).json({ 
          message: "Invalid event ID", 
          errors: paramResult.error.flatten().fieldErrors 
        });
      }

      const event = await theSportsDB.getEventDetails(paramResult.data.eventId);
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
      const paramResult = nameParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        return res.status(400).json({ 
          message: "Invalid league name", 
          errors: paramResult.error.flatten().fieldErrors 
        });
      }

      const teams = await theSportsDB.getTeamsByLeague(paramResult.data.leagueName);
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.get("/api/sports/teams/search/:query", async (req, res) => {
    try {
      const paramResult = searchQueryParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        return res.status(400).json({ 
          message: "Invalid search query", 
          errors: paramResult.error.flatten().fieldErrors 
        });
      }

      const teams = await theSportsDB.searchTeams(paramResult.data.query);
      res.json(teams);
    } catch (error) {
      console.error("Error searching teams:", error);
      res.status(500).json({ message: "Failed to search teams" });
    }
  });

  app.get("/api/sports/teams/:teamId", async (req, res) => {
    try {
      const paramResult = teamIdParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        return res.status(400).json({ 
          message: "Invalid team ID", 
          errors: paramResult.error.flatten().fieldErrors 
        });
      }

      const team = await theSportsDB.getTeamDetails(paramResult.data.teamId);
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
      const paramResult = teamNameParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        return res.status(400).json({ 
          message: "Invalid team name", 
          errors: paramResult.error.flatten().fieldErrors 
        });
      }

      const badge = await theSportsDB.getTeamBadgeByName(paramResult.data.teamName);
      res.json({ badge });
    } catch (error) {
      console.error("Error fetching team badge:", error);
      res.status(500).json({ message: "Failed to fetch team badge" });
    }
  });

  app.get("/api/sports/teams/from-events/:leagueId", async (req, res) => {
    try {
      const paramResult = idParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        return res.status(400).json({ 
          message: "Invalid league ID", 
          errors: paramResult.error.flatten().fieldErrors 
        });
      }

      const teams = await theSportsDB.getTeamsFromEvents(paramResult.data.leagueId);
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams from events:", error);
      res.status(500).json({ message: "Failed to fetch teams from events" });
    }
  });

  app.get("/api/sports/leagues/search/:query", async (req, res) => {
    try {
      const paramResult = searchQueryParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        return res.status(400).json({ 
          message: "Invalid search query", 
          errors: paramResult.error.flatten().fieldErrors 
        });
      }

      const leagues = await theSportsDB.searchLeagues(paramResult.data.query);
      res.json(leagues);
    } catch (error) {
      console.error("Error searching leagues:", error);
      res.status(500).json({ message: "Failed to search leagues" });
    }
  });

  app.get("/api/sports/leagues/:leagueId", async (req, res) => {
    try {
      const paramResult = idParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        return res.status(400).json({ 
          message: "Invalid league ID", 
          errors: paramResult.error.flatten().fieldErrors 
        });
      }

      const league = await theSportsDB.getLeagueDetails(paramResult.data.leagueId);
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
