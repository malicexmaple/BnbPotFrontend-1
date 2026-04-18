import type { Express } from "express";
import type { RouteDeps } from "./types";
import { z } from "zod";

const limitSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

const myBetsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

const leaderboardSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
  sport: z.string().trim().min(1).max(50).optional(),
});

export function registerMarketBetsRoutes(app: Express, deps: RouteDeps): void {
  const { storage, requireAuth } = deps;

  app.get("/api/market-bets/my-bets", requireAuth, async (req, res) => {
    try {
      const walletAddress = req.session!.walletAddress!;
      const parsed = myBetsSchema.safeParse(req.query);
      const limit = parsed.success ? parsed.data.limit : 25;
      const offset = parsed.success ? parsed.data.offset : 0;
      const bets = await storage.getMarketBetsByUserAddress(walletAddress, limit, offset);
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
      const parsed = leaderboardSchema.safeParse(req.query);
      const limit = parsed.success ? parsed.data.limit : 25;
      const sport = parsed.success ? parsed.data.sport : undefined;
      const board = await storage.getMarketLeaderboard(limit, sport);
      res.json(board);
    } catch (e) {
      console.error("leaderboard failed", e);
      res.status(500).json({ message: "Failed to load leaderboard" });
    }
  });
}
