import type { Express } from "express";
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
