import type { Express } from "express";
import type { RouteDeps } from "./types";

export function registerStatsRoutes(app: Express, deps: RouteDeps): void {
  const { storage } = deps;

  app.get("/api/stats/latest-winner", async (_req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const dailyStats = await storage.getDailyStats(today);

      if (!dailyStats?.latestWinRoundId) {
        return res.json(null);
      }

      const round = await storage.getRound(dailyStats.latestWinRoundId);
      if (!round || !round.winnerAddress) {
        return res.json(null);
      }

      const winnerStats = await storage.getUserStats(round.winnerAddress);
      const bets = await storage.getBetsByRound(round.id);
      const winnerBet = bets.find(b => b.userAddress === round.winnerAddress);

      const totalPot = parseFloat(round.totalPot);
      const winnerAmount = winnerBet ? parseFloat(winnerBet.amount) : 0;
      const winChance = totalPot > 0 ? (winnerAmount / totalPot) * 100 : 0;

      res.json({
        round: round.roundNumber,
        username: winnerStats?.username || round.winnerAddress.slice(0, 8),
        userLevel: winnerStats?.level || 1,
        wonAmount: totalPot * 0.975,
        chance: winChance,
        avatarUrl: undefined
      });
    } catch (error) {
      console.error("Error fetching latest winner:", error);
      res.status(500).json({ message: "Failed to fetch latest winner" });
    }
  });

  app.get("/api/stats/win-of-day", async (_req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const dailyStats = await storage.getDailyStats(today);

      if (!dailyStats?.biggestWinRoundId) {
        return res.json(null);
      }

      const round = await storage.getRound(dailyStats.biggestWinRoundId);
      if (!round || !round.winnerAddress) {
        return res.json(null);
      }

      const winnerStats = await storage.getUserStats(round.winnerAddress);
      const bets = await storage.getBetsByRound(round.id);
      const winnerBet = bets.find(b => b.userAddress === round.winnerAddress);

      const totalPot = parseFloat(round.totalPot);
      const winnerAmount = winnerBet ? parseFloat(winnerBet.amount) : 0;
      const winChance = totalPot > 0 ? (winnerAmount / totalPot) * 100 : 0;

      res.json({
        round: round.roundNumber,
        username: winnerStats?.username || round.winnerAddress.slice(0, 8),
        userLevel: winnerStats?.level || 1,
        wonAmount: totalPot * 0.975,
        chance: winChance,
        avatarUrl: undefined
      });
    } catch (error) {
      console.error("Error fetching win of day:", error);
      res.status(500).json({ message: "Failed to fetch win of day" });
    }
  });

  app.get("/api/stats/luck-of-day", async (_req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const dailyStats = await storage.getDailyStats(today);

      if (!dailyStats?.luckiestWinRoundId) {
        return res.json(null);
      }

      const round = await storage.getRound(dailyStats.luckiestWinRoundId);
      if (!round || !round.winnerAddress) {
        return res.json(null);
      }

      const winnerStats = await storage.getUserStats(round.winnerAddress);
      const bets = await storage.getBetsByRound(round.id);
      const winnerBet = bets.find(b => b.userAddress === round.winnerAddress);

      const totalPot = parseFloat(round.totalPot);
      const winnerAmount = winnerBet ? parseFloat(winnerBet.amount) : 0;
      const winChance = totalPot > 0 ? (winnerAmount / totalPot) * 100 : 0;

      res.json({
        round: round.roundNumber,
        username: winnerStats?.username || round.winnerAddress.slice(0, 8),
        userLevel: winnerStats?.level || 1,
        wonAmount: totalPot * 0.975,
        chance: winChance,
        avatarUrl: undefined
      });
    } catch (error) {
      console.error("Error fetching luck of day:", error);
      res.status(500).json({ message: "Failed to fetch luck of day" });
    }
  });

  app.get("/api/leaderboard/top", async (_req, res) => {
    try {
      const topWinners = await storage.getTopWinners(3);

      const leaderboard = topWinners.map((stats, index) => ({
        rank: index + 1,
        username: stats.username,
        level: stats.level,
        totalWon: parseFloat(stats.totalWon),
        totalWins: stats.totalWins,
        gamesPlayed: stats.gamesPlayed,
        avatarUrl: undefined
      }));

      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });
}
