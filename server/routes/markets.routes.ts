import type { Express } from "express";
import type { RouteDeps } from "./types";

export function registerMarketsRoutes(app: Express, deps: RouteDeps): void {
  const { storage, requireAuth, requireAdminRole } = deps;

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
      const market = await storage.getMarketById(req.params.id);
      if (!market) {
        return res.status(404).json({ message: "Market not found" });
      }
      res.json(market);
    } catch (error) {
      console.error("Error fetching market:", error);
      res.status(500).json({ message: "Failed to fetch market" });
    }
  });

  app.post("/api/markets/:id/lock", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const market = await storage.updateMarketStatus(req.params.id, 'locked');
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
      const { winningOutcome } = req.body;

      if (!winningOutcome || (winningOutcome !== 'A' && winningOutcome !== 'B')) {
        return res.status(400).json({ message: "Invalid winning outcome. Must be 'A' or 'B'" });
      }

      const market = await storage.getMarketById(req.params.id);
      if (!market) {
        return res.status(404).json({ message: "Market not found" });
      }

      if (market.status === 'settled') {
        return res.status(400).json({ message: "Market already settled" });
      }

      const settledMarket = await storage.settleMarket(req.params.id, winningOutcome);

      const betsOnMarket = await storage.getMarketBetsByMarketId(req.params.id);

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
