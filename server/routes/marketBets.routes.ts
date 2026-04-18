import type { Express } from "express";
import type { RouteDeps } from "./types";
import { z } from "zod";

const limitSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export function registerMarketBetsRoutes(app: Express, deps: RouteDeps): void {
  const { storage, requireAuth } = deps;

  app.get("/api/market-bets/my-bets", requireAuth, async (req, res) => {
    try {
      const walletAddress = req.session!.walletAddress!;
      const parsed = limitSchema.safeParse(req.query);
      const limit = parsed.success ? parsed.data.limit : 25;
      const bets = await storage.getMarketBetsByUserAddress(walletAddress, limit);
      res.json(bets);
    } catch (e) {
      console.error("my-bets failed", e);
      res.status(500).json({ message: "Failed to load your bets" });
    }
  });

  app.get("/api/market-bets/feed", async (req, res) => {
    try {
      const parsed = limitSchema.safeParse(req.query);
      const limit = parsed.success ? parsed.data.limit : 25;
      const bets = await storage.getRecentMarketBets(limit);
      res.json(bets);
    } catch (e) {
      console.error("feed failed", e);
      res.status(500).json({ message: "Failed to load bets feed" });
    }
  });

  app.get("/api/markets/leaderboard", async (req, res) => {
    try {
      const parsed = limitSchema.safeParse(req.query);
      const limit = parsed.success ? parsed.data.limit : 25;
      const board = await storage.getMarketLeaderboard(limit);
      res.json(board);
    } catch (e) {
      console.error("leaderboard failed", e);
      res.status(500).json({ message: "Failed to load leaderboard" });
    }
  });
}
