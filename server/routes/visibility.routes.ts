import type { Express } from "express";
import type { RouteDeps } from "./types";

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
      const { sportId } = req.params;
      const { isHidden } = req.body;

      if (typeof isHidden !== 'boolean') {
        return res.status(400).json({ message: "isHidden must be a boolean" });
      }

      const result = await storage.setSportVisibility(sportId, isHidden);
      res.json(result);
    } catch (error) {
      console.error("Error setting sport visibility:", error);
      res.status(500).json({ message: "Failed to update sport visibility" });
    }
  });

  app.patch("/api/sports/visibility/league/:leagueId", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const { leagueId } = req.params;
      const { sportId, isHidden } = req.body;

      if (!sportId) {
        return res.status(400).json({ message: "sportId is required" });
      }

      if (typeof isHidden !== 'boolean') {
        return res.status(400).json({ message: "isHidden must be a boolean" });
      }

      const result = await storage.setLeagueVisibility(leagueId, sportId, isHidden);
      res.json(result);
    } catch (error) {
      console.error("Error setting league visibility:", error);
      res.status(500).json({ message: "Failed to update league visibility" });
    }
  });
}
