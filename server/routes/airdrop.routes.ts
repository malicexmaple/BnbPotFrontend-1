import type { Express } from "express";
import type { RouteDeps } from "./types";
import { insertAirdropTipSchema } from "@shared/schema";
import { z } from "zod";

const historyQuerySchema = z.object({
  limit: z.string()
    .optional()
    .transform((val) => {
      if (!val) return 10;
      const num = parseInt(val, 10);
      return isNaN(num) ? 10 : num;
    })
    .pipe(z.number().min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100")),
});

export function registerAirdropRoutes(app: Express, deps: RouteDeps): void {
  const { storage, requireAuth, requireTermsAgreement } = deps;

  app.get("/api/airdrop/pool", async (_req, res) => {
    try {
      const pool = await storage.getAirdropPool();
      if (!pool) {
        return res.status(404).json({ message: "Airdrop pool not found" });
      }
      res.json(pool);
    } catch (error) {
      console.error("Error fetching airdrop pool:", error);
      res.status(500).json({ message: "Failed to fetch airdrop pool" });
    }
  });

  app.get("/api/airdrop/history", async (req, res) => {
    try {
      const queryResult = historyQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        return res.status(400).json({ 
          message: "Invalid query parameters", 
          errors: queryResult.error.flatten().fieldErrors 
        });
      }

      const distributions = await storage.getAirdropDistributions(queryResult.data.limit);
      res.json(distributions);
    } catch (error) {
      console.error("Error fetching airdrop history:", error);
      res.status(500).json({ message: "Failed to fetch airdrop history" });
    }
  });

  app.get("/api/airdrop/my-earnings", requireAuth, async (req, res) => {
    try {
      const walletAddress = req.session!.walletAddress!;
      const earnings = await storage.getUserAirdropEarnings(walletAddress);
      res.json(earnings);
    } catch (error) {
      console.error("Error fetching user airdrop earnings:", error);
      res.status(500).json({ message: "Failed to fetch airdrop earnings" });
    }
  });

  app.post("/api/airdrop/tip", requireAuth, requireTermsAgreement, async (req, res) => {
    try {
      const { amount, txHash } = req.body;
      const walletAddress = req.session!.walletAddress!;

      const validated = insertAirdropTipSchema.parse({
        userAddress: walletAddress,
        userId: null,
        amount,
        txHash: txHash || null,
      });

      const { airdropService } = await import("../airdropService");
      await airdropService.addTip(validated.userAddress, validated.amount, validated.txHash || undefined);

      res.json({ success: true, message: "Tip added to airdrop pool" });
    } catch (error) {
      console.error("Error adding tip:", error);
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid tip data", error: error.message });
      }
      res.status(500).json({ message: "Failed to add tip" });
    }
  });
}
