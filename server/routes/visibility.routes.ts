import type { Express, Request } from "express";
import type { RouteDeps } from "./types";
import { z } from "zod";

const sportIdParamSchema = z.object({
  sportId: z.string()
    .min(1, "Sport ID is required")
    .max(100, "Sport ID too long"),
});

const leagueIdParamSchema = z.object({
  leagueId: z.string()
    .min(1, "League ID is required")
    .max(100, "League ID too long"),
});

const sportVisibilityBodySchema = z.object({
  isHidden: z.boolean({
    required_error: "isHidden is required",
    invalid_type_error: "isHidden must be a boolean"
  }),
});

const leagueVisibilityBodySchema = z.object({
  sportId: z.string()
    .min(1, "sportId is required")
    .max(100, "sportId too long"),
  isHidden: z.boolean({
    required_error: "isHidden is required",
    invalid_type_error: "isHidden must be a boolean"
  }),
});

const sportVisibilityBodySchemaNew = z.object({
  isVisible: z.boolean({
    required_error: "isVisible is required",
    invalid_type_error: "isVisible must be a boolean"
  }),
  manualOverride: z.boolean().optional(),
});

const leagueVisibilityBodySchemaNew = z.object({
  sportId: z.string()
    .min(1, "sportId is required")
    .max(100, "sportId too long"),
  isVisible: z.boolean({
    required_error: "isVisible is required",
    invalid_type_error: "isVisible must be a boolean"
  }),
  manualOverride: z.boolean().optional(),
});

let leagueActivityCache: { data: string[], timestamp: number } | null = null;
const ACTIVITY_CACHE_TTL = 5 * 60 * 1000;

export function registerVisibilityRoutes(app: Express, deps: RouteDeps): void {
  const { storage, requireAuth, requireAdminRole } = deps;

  app.get("/api/sports/visibility", async (_req, res) => {
    try {
      const sports = await storage.getSportsVisibility();
      const leagues = await storage.getLeaguesVisibility();
      res.json({ sports, leagues });
    } catch (error) {
      console.error("Error fetching visibility settings:", error);
      res.status(500).json({ message: "Failed to fetch visibility settings" });
    }
  });

  app.get("/api/visibility-settings", async (_req, res) => {
    try {
      const settings = await storage.getVisibilitySettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching visibility settings:", error);
      res.status(500).json({ message: "Failed to fetch visibility settings" });
    }
  });

  app.get("/api/leagues/activity-status", async (_req, res) => {
    try {
      if (leagueActivityCache && (Date.now() - leagueActivityCache.timestamp) < ACTIVITY_CACHE_TTL) {
        console.log('Returning cached league activity status');
        return res.json({ activeLeagueIds: leagueActivityCache.data });
      }
      
      console.log('Fetching fresh league activity status...');
      const now = new Date();
      const twoWeeksFromNow = new Date();
      twoWeeksFromNow.setDate(now.getDate() + 14);
      
      const activeLeagueIds = new Set<string>();
      
      try {
        const { sportsData } = await import('@shared/sports-leagues');
        const { sportsDBService } = await import('../thesportsdb');
        
        const BATCH_SIZE = 10;
        const BATCH_DELAY = 1000;
        
        for (const sport of sportsData) {
          if (sport.leagues && sport.leagues.length > 0) {
            for (let i = 0; i < sport.leagues.length; i += BATCH_SIZE) {
              const batch = sport.leagues.slice(i, i + BATCH_SIZE);
              
              await Promise.all(batch.map(async (league) => {
                try {
                  const events = await sportsDBService.getUpcomingEventsByLeague(league.id);
                  
                  const hasUpcomingEvents = events && events.some((event: any) => {
                    if (event.dateEvent) {
                      const eventDate = new Date(event.dateEvent);
                      return eventDate >= now && eventDate <= twoWeeksFromNow;
                    }
                    return false;
                  });
                  
                  if (hasUpcomingEvents) {
                    activeLeagueIds.add(league.id);
                  }
                } catch (error) {
                  console.error(`Failed to check events for league ${league.id}`);
                }
              }));
              
              if (i + BATCH_SIZE < sport.leagues.length) {
                await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
              }
            }
          }
        }
      } catch (importError) {
        console.error('Failed to import sports data modules:', importError);
      }
      
      const result = Array.from(activeLeagueIds);
      leagueActivityCache = { data: result, timestamp: Date.now() };
      
      res.json({ activeLeagueIds: result });
    } catch (error) {
      console.error("Error fetching league activity status:", error);
      res.status(500).json({ message: "Failed to fetch league activity status" });
    }
  });

  app.post("/api/admin/visibility/sport/:sportId", requireAuth, requireAdminRole, async (req: Request & { user?: any }, res) => {
    try {
      const paramResult = sportIdParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        return res.status(400).json({ 
          message: "Invalid sport ID", 
          errors: paramResult.error.flatten().fieldErrors 
        });
      }

      const bodyResult = sportVisibilityBodySchemaNew.safeParse(req.body);
      if (!bodyResult.success) {
        return res.status(400).json({ 
          message: "Invalid request body", 
          errors: bodyResult.error.flatten().fieldErrors 
        });
      }

      const userId = req.user?.id || req.user?.claims?.sub;
      const manualOverride = bodyResult.data.manualOverride ?? true;
      const result = await storage.toggleSportVisibility(
        paramResult.data.sportId, 
        bodyResult.data.isVisible,
        userId,
        manualOverride
      );
      res.json(result);
    } catch (error) {
      console.error("Error toggling sport visibility:", error);
      res.status(500).json({ message: "Failed to toggle sport visibility" });
    }
  });

  app.post("/api/admin/visibility/league/:leagueId", requireAuth, requireAdminRole, async (req: Request & { user?: any }, res) => {
    try {
      const paramResult = leagueIdParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        return res.status(400).json({ 
          message: "Invalid league ID", 
          errors: paramResult.error.flatten().fieldErrors 
        });
      }

      const bodyResult = leagueVisibilityBodySchemaNew.safeParse(req.body);
      if (!bodyResult.success) {
        return res.status(400).json({ 
          message: "Invalid request body", 
          errors: bodyResult.error.flatten().fieldErrors 
        });
      }

      const userId = req.user?.id || req.user?.claims?.sub;
      const manualOverride = bodyResult.data.manualOverride ?? true;
      const result = await storage.toggleLeagueVisibility(
        paramResult.data.leagueId, 
        bodyResult.data.sportId, 
        bodyResult.data.isVisible,
        userId,
        manualOverride
      );
      res.json(result);
    } catch (error) {
      console.error("Error toggling league visibility:", error);
      res.status(500).json({ message: "Failed to toggle league visibility" });
    }
  });

  app.delete("/api/admin/visibility/sport/:sportId/reset", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const paramResult = sportIdParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        return res.status(400).json({ 
          message: "Invalid sport ID", 
          errors: paramResult.error.flatten().fieldErrors 
        });
      }

      await storage.resetSportToAuto(paramResult.data.sportId);
      res.json({ success: true, message: "Sport visibility reset to automatic" });
    } catch (error) {
      console.error("Error resetting sport visibility:", error);
      res.status(500).json({ message: "Failed to reset sport visibility" });
    }
  });

  app.delete("/api/admin/visibility/league/:leagueId/reset", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const paramResult = leagueIdParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        return res.status(400).json({ 
          message: "Invalid league ID", 
          errors: paramResult.error.flatten().fieldErrors 
        });
      }

      await storage.resetLeagueToAuto(paramResult.data.leagueId);
      res.json({ success: true, message: "League visibility reset to automatic" });
    } catch (error) {
      console.error("Error resetting league visibility:", error);
      res.status(500).json({ message: "Failed to reset league visibility" });
    }
  });

  app.patch("/api/sports/visibility/sport/:sportId", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const paramResult = sportIdParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        return res.status(400).json({ 
          message: "Invalid sport ID", 
          errors: paramResult.error.flatten().fieldErrors 
        });
      }

      const bodyResult = sportVisibilityBodySchema.safeParse(req.body);
      if (!bodyResult.success) {
        return res.status(400).json({ 
          message: "Invalid request body", 
          errors: bodyResult.error.flatten().fieldErrors 
        });
      }

      const result = await storage.setSportVisibility(
        paramResult.data.sportId, 
        bodyResult.data.isHidden
      );
      res.json(result);
    } catch (error) {
      console.error("Error setting sport visibility:", error);
      res.status(500).json({ message: "Failed to update sport visibility" });
    }
  });

  app.patch("/api/sports/visibility/league/:leagueId", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const paramResult = leagueIdParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        return res.status(400).json({ 
          message: "Invalid league ID", 
          errors: paramResult.error.flatten().fieldErrors 
        });
      }

      const bodyResult = leagueVisibilityBodySchema.safeParse(req.body);
      if (!bodyResult.success) {
        return res.status(400).json({ 
          message: "Invalid request body", 
          errors: bodyResult.error.flatten().fieldErrors 
        });
      }

      const result = await storage.setLeagueVisibility(
        paramResult.data.leagueId, 
        bodyResult.data.sportId, 
        bodyResult.data.isHidden
      );
      res.json(result);
    } catch (error) {
      console.error("Error setting league visibility:", error);
      res.status(500).json({ message: "Failed to update league visibility" });
    }
  });
}
