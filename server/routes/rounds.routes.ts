import type { Express } from "express";
import type { RouteDeps } from "./types";
import { z } from "zod";

const uuidParamSchema = z.object({
  id: z.string()
    .min(1, "Round ID is required")
    .uuid("Invalid round ID format"),
});

export function registerRoundsRoutes(app: Express, deps: RouteDeps): void {
  const { storage } = deps;

  app.get("/api/rounds/current", async (_req, res) => {
    try {
      const round = await storage.getCurrentRound();
      if (!round) {
        return res.status(404).json({ message: "No active round" });
      }

      const bets = await storage.getBetsByRound(round.id);

      let timeRemaining = null;
      let isCountdownActive = false;

      if (round.status === "active" && round.endTime) {
        const now = new Date();
        const endTime = new Date(round.endTime);
        timeRemaining = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));
        isCountdownActive = true;
      }

      res.json({
        ...round,
        bets,
        timeRemaining,
        isCountdownActive,
        totalBets: bets.length
      });
    } catch (error) {
      console.error("Error fetching current round:", error);
      res.status(500).json({ message: "Failed to fetch current round" });
    }
  });

  app.get("/api/rounds/:id", async (req, res) => {
    try {
      const paramResult = uuidParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        return res.status(400).json({ 
          message: "Invalid round ID", 
          errors: paramResult.error.flatten().fieldErrors 
        });
      }

      const round = await storage.getRound(paramResult.data.id);
      if (!round) {
        return res.status(404).json({ message: "Round not found" });
      }

      const bets = await storage.getBetsByRound(round.id);

      res.json({
        ...round,
        bets,
        totalBets: bets.length
      });
    } catch (error) {
      console.error("Error fetching round:", error);
      res.status(500).json({ message: "Failed to fetch round" });
    }
  });
}
