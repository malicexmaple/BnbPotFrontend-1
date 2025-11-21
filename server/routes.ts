import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertChatMessageSchema, insertBetSchema } from "@shared/schema";
import { gameService } from "./gameService";

// Module-level variable to hold broadcast function
let broadcastBetUpdate: ((data: any) => void) | null = null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Get user by wallet address
  app.get("/api/users/me", async (req, res) => {
    try {
      const { walletAddress } = req.query;
      if (!walletAddress || typeof walletAddress !== 'string') {
        return res.status(400).json({ message: "Wallet address required" });
      }

      const user = await storage.getUserByWalletAddress(walletAddress);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return user data without password
      const { password, ...userData } = user;
      res.json(userData);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Create or update user (signup)
  app.post("/api/users/signup", async (req, res) => {
    try {
      const { walletAddress, username, email } = req.body;
      
      if (!walletAddress || !username) {
        return res.status(400).json({ message: "Wallet address and username required" });
      }

      const user = await storage.createOrUpdateUserByWallet(walletAddress, username, email);
      
      // Return user data without password
      const { password, ...userData } = user;
      res.json(userData);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // API route to get chat messages
  app.get("/api/chat/messages", async (_req, res) => {
    try {
      const messages = await storage.getChatMessages(50);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Get current active round
  app.get("/api/rounds/current", async (_req, res) => {
    try {
      const round = await storage.getCurrentRound();
      if (!round) {
        return res.status(404).json({ message: "No active round" });
      }
      
      // Get all bets for this round
      const bets = await storage.getBetsByRound(round.id);
      
      // Calculate time remaining based on status
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

  // Get specific round by ID
  app.get("/api/rounds/:id", async (req, res) => {
    try {
      const round = await storage.getRound(req.params.id);
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

  // Place a bet
  app.post("/api/bets", async (req, res) => {
    try {
      // Validate bet data
      const validated = insertBetSchema.parse(req.body);
      
      // Verify user exists and has agreed to terms
      const user = await storage.getUserByWalletAddress(validated.userAddress);
      if (!user) {
        return res.status(403).json({ message: "User not found. Please complete signup first." });
      }
      
      if (!user.agreedToTerms) {
        return res.status(403).json({ message: "You must agree to terms and conditions before placing bets." });
      }
      
      // Get current round
      const currentRound = await storage.getCurrentRound();
      if (!currentRound) {
        return res.status(404).json({ message: "No active round" });
      }
      
      // Only allow bets on waiting or active rounds
      if (currentRound.status !== "waiting" && currentRound.status !== "active") {
        return res.status(400).json({ message: "Round is not accepting bets" });
      }
      
      // Execute bet placement in a transaction for atomicity and consistency
      // This ensures bet creation, pot increment, and round activation all succeed or fail together
      const result = await storage.placeBetTransaction(currentRound.id, validated);
      
      // If round was activated (first bet), log it
      if (result.roundActivated) {
        console.log(`🎲 First bet placed! Round #${currentRound.roundNumber} activated`);
      }
      
      // Broadcast bet update to all WebSocket clients for real-time updates
      // Use the transaction result to ensure we broadcast the exact state that was written
      // This eliminates race conditions and ensures broadcast data matches the committed transaction
      if (broadcastBetUpdate && result.round && (result.round.status === "waiting" || result.round.status === "active")) {
        let timeRemaining = null;
        let isCountdownActive = false;
        
        if (result.round.status === "active" && result.round.endTime) {
          const now = new Date();
          const endTime = new Date(result.round.endTime);
          timeRemaining = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));
          isCountdownActive = true;
        }
        
        broadcastBetUpdate({
          ...result.round,
          bets: result.allBets, // Use bets from transaction, not a separate query
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
      // Return 400 for validation errors, 500 for server errors
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid bet data", error: error.message });
      }
      res.status(500).json({ message: "Failed to place bet" });
    }
  });

  // Get latest winner stats
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
        wonAmount: totalPot * 0.975, // After 2.5% house fee
        chance: winChance,
        avatarUrl: undefined
      });
    } catch (error) {
      console.error("Error fetching latest winner:", error);
      res.status(500).json({ message: "Failed to fetch latest winner" });
    }
  });

  // Get win of the day (biggest win)
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

  // Get luck of the day (lowest win chance)
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

  // Get top winners leaderboard
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

  const httpServer = createServer(app);

  // Set up WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  // Helper function to broadcast online user count to all clients
  const broadcastOnlineCount = () => {
    const onlineCount = wss.clients.size;
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "online_count", count: onlineCount }));
      }
    });
  };

  // Helper function to broadcast game updates to all clients
  const broadcastGameUpdate = (updateType: string, data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: updateType, data }));
      }
    });
  };

  // Set broadcast function for bet updates
  broadcastBetUpdate = (data: any) => {
    broadcastGameUpdate("bet_placed", data);
  };

  wss.on("connection", (ws: WebSocket) => {
    console.log("Client connected");

    // Send existing messages to new client
    storage.getChatMessages(50).then((messages) => {
      ws.send(JSON.stringify({ type: "history", messages }));
    });

    // Send current round info to new client
    storage.getCurrentRound().then(async (round) => {
      if (round) {
        const bets = await storage.getBetsByRound(round.id);
        ws.send(JSON.stringify({ 
          type: "round_update", 
          data: {
            ...round,
            bets,
            timeRemaining: Math.max(0, Math.floor((new Date(round.endTime || new Date()).getTime() - Date.now()) / 1000))
          }
        }));
      }
    });

    // Send current online count to new client and broadcast to all
    broadcastOnlineCount();

    ws.on("message", async (data: Buffer) => {
      try {
        const parsed = JSON.parse(data.toString());
        
        if (parsed.type === "chat") {
          // TODO: SECURITY - Validate username against authenticated session/wallet
          // Currently trusts client-supplied username which allows impersonation
          // In production, validate username against session store or JWT token
          
          // Validate message format
          const validated = insertChatMessageSchema.parse(parsed.data);
          
          // Save to storage
          const message = await storage.createChatMessage(validated);
          
          // Broadcast to all connected clients
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: "message", message }));
            }
          });
        }
        
        // Note: Bet placement and round ending are now handled server-side by gameService
        // This prevents clients from spoofing bets or manipulating game state
        // Real bets should come from blockchain events monitored by gameService
      } catch (error) {
        console.error("WebSocket message error:", error);
        ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected");
      // Broadcast updated count when client disconnects
      broadcastOnlineCount();
    });
  });

  return httpServer;
}
