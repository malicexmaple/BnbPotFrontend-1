import type { Express } from "express";
import type { RouteDeps } from "./types";
import { insertBetSchema } from "@shared/schema";
import { randomBytes } from "crypto";

export function registerBetsRoutes(app: Express, deps: RouteDeps): void {
  const { storage, requireAuth, requireTermsAgreement, realtime } = deps;

  app.post("/api/bets", requireAuth, requireTermsAgreement, async (req, res) => {
    try {
      const { amount, txHash } = req.body;

      const userAddress = req.session!.walletAddress!;
      
      // In demo mode, generate a placeholder txHash if not provided
      // In production, txHash would come from actual blockchain transaction
      const finalTxHash = txHash || `0x${randomBytes(32).toString('hex')}`;

      const validated = insertBetSchema.parse({
        userAddress,
        amount,
        txHash: finalTxHash
      });

      const currentRound = await storage.getCurrentRound();
      if (!currentRound) {
        return res.status(404).json({ message: "No active round" });
      }

      if (currentRound.status !== "waiting" && currentRound.status !== "active") {
        return res.status(400).json({ message: "Round is not accepting bets" });
      }

      const result = await storage.placeBetTransaction(currentRound.id, validated);

      if (result.roundActivated) {
        console.log(`🎲 First bet placed! Round #${currentRound.roundNumber} activated`);
      }

      if (result.round && (result.round.status === "waiting" || result.round.status === "active")) {
        let timeRemaining = null;
        let isCountdownActive = false;

        if (result.round.status === "active" && result.round.endTime) {
          const now = new Date();
          const endTime = new Date(result.round.endTime);
          timeRemaining = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));
          isCountdownActive = true;
        }

        realtime.broadcastRoundUpdate({
          ...result.round,
          bets: result.allBets,
          timeRemaining,
          isCountdownActive,
          totalBets: result.allBets.length
        });
      }

      res.json({
        success: true,
        bet: result.bet,
        round: result.round
      });
    } catch (error) {
      console.error("Error placing bet:", error);
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid bet data", error: error.message });
      }
      res.status(500).json({ message: "Failed to place bet" });
    }
  });
}
