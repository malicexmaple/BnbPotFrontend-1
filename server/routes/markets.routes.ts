import type { Express } from "express";
import type { RouteDeps } from "./types";
import type { InsertMarket } from "@shared/schema";
import { z } from "zod";

const uuidParamSchema = z.object({
  id: z.string()
    .min(1, "ID is required")
    .uuid("Invalid market ID format"),
});

const settleMarketSchema = z.object({
  winningOutcome: z.enum(['A', 'B'], { 
    errorMap: () => ({ message: "Invalid winning outcome. Must be 'A' or 'B'" })
  }),
});

const placeMarketBetSchema = z.object({
  outcome: z.enum(['A', 'B']),
  amount: z.string().regex(/^\d+(\.\d{1,8})?$/, "Amount must be a positive number with up to 8 decimals"),
});

const updateMarketSchema = z.object({
  sport: z.string().min(1).max(64).optional(),
  league: z.string().min(1).max(128).optional(),
  leagueId: z.string().max(128).nullable().optional(),
  marketType: z.string().min(1).max(64).optional(),
  teamA: z.string().min(1).max(128).optional(),
  teamB: z.string().min(1).max(128).optional(),
  teamALogo: z.string().url().max(2048).nullable().optional(),
  teamBLogo: z.string().url().max(2048).nullable().optional(),
  description: z.string().min(1).max(500).optional(),
  isLive: z.boolean().optional(),
  gameTime: z.string().datetime().optional(),
  bonusPool: z.string().regex(/^\d+(\.\d{1,8})?$/).optional(),
}).strict();

export function registerMarketsRoutes(app: Express, deps: RouteDeps): void {
  const { storage, requireAuth, requireTermsAgreement, requireAdminRole, realtime } = deps;

  app.get("/api/markets", async (_req, res) => {
    try {
      const activeMarkets = await storage.getAllActiveMarkets();
      res.json(activeMarkets);
    } catch (error) {
      console.error("Error fetching markets:", error);
      res.status(500).json({ message: "Failed to fetch markets" });
    }
  });

  app.get("/api/markets/:id", async (req, res) => {
    try {
      const paramResult = uuidParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        return res.status(400).json({ 
          message: "Invalid market ID", 
          errors: paramResult.error.flatten().fieldErrors 
        });
      }

      const market = await storage.getMarketById(paramResult.data.id);
      if (!market) {
        return res.status(404).json({ message: "Market not found" });
      }
      res.json(market);
    } catch (error) {
      console.error("Error fetching market:", error);
      res.status(500).json({ message: "Failed to fetch market" });
    }
  });

  app.post("/api/markets/:id/bets", requireAuth, requireTermsAgreement, async (req, res) => {
    try {
      const paramResult = uuidParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        return res.status(400).json({
          message: "Invalid market ID",
          errors: paramResult.error.flatten().fieldErrors,
        });
      }

      const bodyResult = placeMarketBetSchema.safeParse(req.body);
      if (!bodyResult.success) {
        return res.status(400).json({
          message: "Invalid bet",
          errors: bodyResult.error.flatten().fieldErrors,
        });
      }

      const amount = parseFloat(bodyResult.data.amount);
      if (!isFinite(amount) || amount <= 0) {
        return res.status(400).json({ message: "Bet amount must be greater than zero" });
      }
      // Reasonable bounds to keep pools/analytics sane in demo mode.
      const MIN_BET = 0.001;
      const MAX_BET = 100;
      if (amount < MIN_BET) {
        return res.status(400).json({ message: `Minimum bet is ${MIN_BET} BNB` });
      }
      if (amount > MAX_BET) {
        return res.status(400).json({ message: `Maximum bet is ${MAX_BET} BNB` });
      }

      const userAddress = req.session!.walletAddress!;
      const user = await storage.getUserByWalletAddress(userAddress);

      const result = await storage.placeMarketBetTransaction(paramResult.data.id, {
        userId: user?.id ?? null,
        userAddress,
        outcome: bodyResult.data.outcome,
        amount: bodyResult.data.amount,
        status: 'active',
      });

      res.status(201).json({
        message: "Bet placed",
        bet: result.bet,
        market: result.market,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to place bet";
      const status = /not found|no longer|closed/i.test(msg) ? 400 : 500;
      console.error("Error placing market bet:", error);
      res.status(status).json({ message: msg });
    }
  });

  app.post("/api/markets/:id/lock", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const paramResult = uuidParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        return res.status(400).json({ 
          message: "Invalid market ID", 
          errors: paramResult.error.flatten().fieldErrors 
        });
      }

      const market = await storage.updateMarketStatus(paramResult.data.id, 'locked');
      if (!market) {
        return res.status(404).json({ message: "Market not found" });
      }
      realtime.broadcastMarketsUpdated({ id: market.id, action: 'locked' });
      res.json({ message: "Market locked successfully", market });
    } catch (error) {
      console.error("Error locking market:", error);
      res.status(500).json({ message: "Failed to lock market" });
    }
  });

  app.patch("/api/admin/markets/:id", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const paramResult = uuidParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        return res.status(400).json({
          message: "Invalid market ID",
          errors: paramResult.error.flatten().fieldErrors,
        });
      }

      const bodyResult = updateMarketSchema.safeParse(req.body);
      if (!bodyResult.success) {
        return res.status(400).json({
          message: "Invalid update payload",
          errors: bodyResult.error.flatten().fieldErrors,
        });
      }

      const { gameTime, ...rest } = bodyResult.data;
      const data: Partial<InsertMarket> = {
        ...rest,
        ...(gameTime ? { gameTime: new Date(gameTime) } : {}),
      };

      let market;
      try {
        market = await storage.updateMarket(paramResult.data.id, data);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Cannot edit market";
        return res.status(400).json({ message: msg });
      }
      if (!market) {
        return res.status(404).json({ message: "Market not found" });
      }
      realtime.broadcastMarketsUpdated({ id: market.id, action: 'updated' });
      res.json({ message: "Market updated", market });
    } catch (error) {
      console.error("Error updating market:", error);
      res.status(500).json({ message: "Failed to update market" });
    }
  });

  app.delete("/api/admin/markets/:id", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const paramResult = uuidParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        return res.status(400).json({
          message: "Invalid market ID",
          errors: paramResult.error.flatten().fieldErrors,
        });
      }

      const result = await storage.deleteMarket(paramResult.data.id);
      if (!result.deleted) {
        const status = result.reason === 'Market not found' ? 404 : 400;
        return res.status(status).json({ message: result.reason || "Failed to delete market" });
      }
      realtime.broadcastMarketsUpdated({ id: paramResult.data.id, action: 'deleted' });
      res.json({ message: "Market deleted" });
    } catch (error) {
      console.error("Error deleting market:", error);
      res.status(500).json({ message: "Failed to delete market" });
    }
  });

  app.post("/api/admin/markets/:id/refund", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const paramResult = uuidParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        return res.status(400).json({
          message: "Invalid market ID",
          errors: paramResult.error.flatten().fieldErrors,
        });
      }

      const result = await storage.refundMarket(paramResult.data.id);
      if (!result) {
        return res.status(404).json({ message: "Market not found" });
      }
      realtime.broadcastMarketsUpdated({ id: result.market.id, action: 'refunded' });
      res.json({
        message: "Market refunded",
        market: result.market,
        refundedBets: result.refundedBets,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to refund market";
      const status = /already|cannot/i.test(msg) ? 400 : 500;
      console.error("Error refunding market:", error);
      res.status(status).json({ message: msg });
    }
  });

  app.get("/api/admin/markets/:id/bets", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const paramResult = uuidParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        return res.status(400).json({
          message: "Invalid market ID",
          errors: paramResult.error.flatten().fieldErrors,
        });
      }

      const market = await storage.getMarketById(paramResult.data.id);
      if (!market) {
        return res.status(404).json({ message: "Market not found" });
      }
      const bets = await storage.getMarketBetsByMarketId(paramResult.data.id);
      let totalA = 0;
      let totalB = 0;
      for (const b of bets) {
        const amt = parseFloat(b.amount);
        if (!isFinite(amt)) continue;
        if (b.outcome === 'A') totalA += amt;
        else if (b.outcome === 'B') totalB += amt;
      }
      const summary = {
        totalBets: bets.length,
        totalA: totalA.toFixed(8),
        totalB: totalB.toFixed(8),
        totalPool: (totalA + totalB).toFixed(8),
      };
      res.json({ market, bets, summary });
    } catch (error) {
      console.error("Error fetching market bets:", error);
      res.status(500).json({ message: "Failed to fetch market bets" });
    }
  });

  app.post("/api/markets/:id/settle", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const paramResult = uuidParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        return res.status(400).json({ 
          message: "Invalid market ID", 
          errors: paramResult.error.flatten().fieldErrors 
        });
      }

      const bodyResult = settleMarketSchema.safeParse(req.body);
      if (!bodyResult.success) {
        return res.status(400).json({ 
          message: "Invalid request body", 
          errors: bodyResult.error.flatten().fieldErrors 
        });
      }

      const { winningOutcome } = bodyResult.data;

      const market = await storage.getMarketById(paramResult.data.id);
      if (!market) {
        return res.status(404).json({ message: "Market not found" });
      }

      if (market.status === 'settled' || market.status === 'refunded') {
        return res.status(400).json({
          message: `Cannot settle a market that has been ${market.status}`,
        });
      }

      let settledMarket;
      try {
        settledMarket = await storage.settleMarket(paramResult.data.id, winningOutcome);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Cannot settle market";
        return res.status(400).json({ message: msg });
      }

      const betsOnMarket = await storage.getMarketBetsByMarketId(paramResult.data.id);

      const totalPool = parseFloat(market.poolATotal) + parseFloat(market.poolBTotal);
      const winningPool = winningOutcome === 'A' ? parseFloat(market.poolATotal) : parseFloat(market.poolBTotal);

      let payoutsProcessed = 0;
      for (const bet of betsOnMarket) {
        if (bet.outcome === winningOutcome) {
          const betAmount = parseFloat(bet.amount);
          const payout = winningPool > 0 ? (betAmount / winningPool) * totalPool : 0;
          await storage.updateMarketBetStatus(bet.id, 'won', payout.toString());
          payoutsProcessed++;
        } else {
          await storage.updateMarketBetStatus(bet.id, 'lost', '0');
        }
      }

      realtime.broadcastMarketsUpdated({ id: settledMarket.id, action: 'settled' });

      res.json({
        message: "Market settled successfully",
        market: settledMarket,
        payoutsProcessed
      });
    } catch (error) {
      console.error("Error settling market:", error);
      res.status(500).json({ message: "Failed to settle market" });
    }
  });
}
