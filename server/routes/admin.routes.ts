import type { Express } from "express";
import type { RouteDeps } from "./types";
import { z } from "zod";

const createMarketSchema = z.object({
  sport: z.string().min(1).max(64),
  league: z.string().min(1).max(128),
  leagueId: z.string().max(64).optional().or(z.literal('').transform(() => undefined)),
  marketType: z.string().min(1).max(32).optional().default('match_winner'),
  teamA: z.string().min(1).max(128),
  teamB: z.string().min(1).max(128),
  teamALogo: z.string().url().max(2048).optional().or(z.literal('').transform(() => undefined)),
  teamBLogo: z.string().url().max(2048).optional().or(z.literal('').transform(() => undefined)),
  description: z.string().min(1).max(512),
  isLive: z.boolean().optional().default(false),
  gameTime: z.string().refine((v) => !isNaN(Date.parse(v)), { message: "Invalid gameTime" }),
  bonusPool: z.string().regex(/^\d+(\.\d{1,8})?$/).optional().default('0'),
  platformFee: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().default('2.00'),
});

export function registerAdminRoutes(app: Express, deps: RouteDeps): void {
  const { storage, requireAuth, requireAdminRole } = deps;

  app.post("/api/admin/bootstrap", requireAuth, async (req, res) => {
    try {
      const walletAddress = req.session!.walletAddress!;

      const hasAdmin = await storage.hasAnyAdmin();
      if (hasAdmin) {
        return res.status(403).json({ message: "Admin already exists. Contact existing admin for access." });
      }

      const user = await storage.setUserRole(walletAddress, 'admin');
      if (!user) {
        return res.status(404).json({ message: "User not found. Please sign up first." });
      }

      req.session!.isAdmin = true;

      console.log(`👑 Admin bootstrapped: ${walletAddress}`);
      res.json({ success: true, message: "You are now an admin!", isAdmin: true });
    } catch (error) {
      console.error("Error bootstrapping admin:", error);
      res.status(500).json({ message: "Failed to bootstrap admin" });
    }
  });

  app.get("/api/admin/markets", requireAuth, requireAdminRole, async (_req, res) => {
    try {
      const allMarkets = await storage.getAllMarkets();
      res.json(allMarkets);
    } catch (error) {
      console.error("Error fetching admin markets:", error);
      res.status(500).json({ message: "Failed to fetch markets" });
    }
  });

  app.post("/api/admin/markets", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const result = createMarketSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Invalid market data",
          errors: result.error.flatten().fieldErrors,
        });
      }

      const data = result.data;
      const gameTime = new Date(data.gameTime);
      if (gameTime.getTime() <= Date.now()) {
        return res.status(400).json({ message: "gameTime must be in the future" });
      }

      const market = await storage.createMarket({
        sport: data.sport,
        league: data.league,
        leagueId: data.leagueId ?? null,
        marketType: data.marketType,
        teamA: data.teamA,
        teamB: data.teamB,
        teamALogo: data.teamALogo ?? null,
        teamBLogo: data.teamBLogo ?? null,
        description: data.description,
        status: 'active',
        isLive: data.isLive ?? false,
        gameTime,
        poolATotal: '0',
        poolBTotal: '0',
        bonusPool: data.bonusPool,
        winningOutcome: null,
        platformFee: data.platformFee,
      });

      res.status(201).json({ message: "Market created", market });
    } catch (error) {
      console.error("Error creating market:", error);
      res.status(500).json({ message: "Failed to create market" });
    }
  });
}
