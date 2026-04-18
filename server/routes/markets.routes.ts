import type { Express } from "express";
import type { RouteDeps } from "./types";
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

export function registerMarketsRoutes(app: Express, deps: RouteDeps): void {
  const { storage, requireAuth, requireTermsAgreement, requireAdminRole } = deps;

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
      res.json({ message: "Market locked successfully", market });
    } catch (error) {
      console.error("Error locking market:", error);
      res.status(500).json({ message: "Failed to lock market" });
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

      if (market.status === 'settled') {
        return res.status(400).json({ message: "Market already settled" });
      }

      const settledMarket = await storage.settleMarket(paramResult.data.id, winningOutcome);

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
