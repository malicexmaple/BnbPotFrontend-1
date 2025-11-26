import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertChatMessageSchema, insertBetSchema, insertAirdropTipSchema } from "@shared/schema";
import { gameService } from "./gameService";
import { generateAuthMessage, verifyWalletSignature, requireAuth, requireTermsAgreement, requireAdminRole } from "./auth";
import { randomBytes } from "crypto";
import type { IncomingMessage } from "http";
import type session from "express-session";
import { rateLimiters } from "./rateLimit";

// Module-level variable to hold broadcast function
let broadcastBetUpdate: ((data: any) => void) | null = null;

export async function registerRoutes(app: Express, sessionParser: any): Promise<Server> {
  // ========================================
  // AUTHENTICATION ENDPOINTS
  // ========================================
  
  /**
   * Step 1: Request a nonce for wallet authentication
   * Generates a unique nonce to prevent replay attacks
   * RATE LIMITED: 10 requests per 15 minutes
   */
  app.post("/api/auth/nonce", rateLimiters.auth, async (req, res) => {
    try {
      const { walletAddress } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address required" });
      }
      
      // Generate cryptographically secure nonce
      const nonce = randomBytes(32).toString('hex');
      const message = generateAuthMessage(walletAddress, nonce);
      
      // Store nonce in session (temporary, will be verified soon)
      if (req.session) {
        req.session.pendingNonce = nonce;
        req.session.pendingWallet = walletAddress.toLowerCase();
      }
      
      res.json({ message, nonce });
    } catch (error) {
      console.error("Error generating nonce:", error);
      res.status(500).json({ message: "Failed to generate authentication challenge" });
    }
  });
  
  /**
   * Step 2: Verify wallet signature and create authenticated session
   * Verifies the signature matches the nonce and wallet address
   * CRITICAL: Must verify the message contains the server-issued nonce
   * RATE LIMITED: 10 requests per 15 minutes
   */
  app.post("/api/auth/verify", rateLimiters.auth, async (req, res) => {
    try {
      const { walletAddress, signature, message } = req.body;
      
      if (!walletAddress || !signature || !message) {
        return res.status(400).json({ message: "Wallet address, signature, and message required" });
      }
      
      // SECURITY: Verify the nonce matches the one we issued
      const pendingNonce = req.session?.pendingNonce;
      const pendingWallet = req.session?.pendingWallet;
      
      if (!pendingNonce || !pendingWallet) {
        return res.status(401).json({ message: "No pending authentication. Please request a new challenge." });
      }
      
      // Verify wallet matches the one that requested the nonce
      if (pendingWallet.toLowerCase() !== walletAddress.toLowerCase()) {
        return res.status(401).json({ message: "Wallet address mismatch" });
      }
      
      // Verify the message contains the correct nonce (prevents replay attacks)
      if (!message.includes(pendingNonce)) {
        return res.status(401).json({ message: "Invalid authentication challenge" });
      }
      
      // Verify the cryptographic signature
      const isValid = verifyWalletSignature(message, signature, walletAddress);
      
      if (!isValid) {
        return res.status(401).json({ message: "Invalid signature" });
      }
      
      // Check if user exists
      const user = await storage.getUserByWalletAddress(walletAddress);
      
      // Check if this wallet is in the admin list (environment-based security)
      const adminWallets = (process.env.ADMIN_WALLETS || '').toLowerCase().split(',').map(w => w.trim());
      const isAdmin = adminWallets.includes(walletAddress.toLowerCase());
      
      if (req.session) {
        // Create authenticated session
        req.session.walletAddress = walletAddress.toLowerCase();
        req.session.username = user?.username;
        req.session.agreedToTerms = user?.agreedToTerms || false;
        req.session.isAdmin = isAdmin;
        
        // IMPORTANT: Clear and invalidate the used nonce (one-time use only)
        delete req.session.pendingNonce;
        delete req.session.pendingWallet;
      }
      
      res.json({ 
        success: true, 
        walletAddress: walletAddress.toLowerCase(),
        username: user?.username,
        agreedToTerms: user?.agreedToTerms || false,
        isAdmin
      });
    } catch (error) {
      console.error("Error verifying signature:", error);
      res.status(500).json({ message: "Failed to verify signature" });
    }
  });
  
  /**
   * Get current session info
   */
  app.get("/api/auth/session", async (req, res) => {
    if (!req.session?.walletAddress) {
      return res.status(401).json({ authenticated: false });
    }
    
    const user = await storage.getUserByWalletAddress(req.session.walletAddress);
    
    // Check if this wallet is in the admin list (environment-based security)
    const adminWallets = (process.env.ADMIN_WALLETS || '').toLowerCase().split(',').map(w => w.trim());
    const isAdmin = adminWallets.includes(req.session.walletAddress.toLowerCase());
    
    // Update session with current admin status
    if (req.session) {
      req.session.isAdmin = isAdmin;
    }
    
    res.json({
      authenticated: true,
      walletAddress: req.session.walletAddress,
      username: user?.username,
      agreedToTerms: user?.agreedToTerms || false,
      isAdmin
    });
  });
  
  /**
   * Logout - destroy session
   */
  app.post("/api/auth/logout", async (req, res) => {
    req.session?.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });
  
  // ========================================
  // USER ENDPOINTS
  // ========================================
  
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

  // Create or update user (signup) - REQUIRES AUTHENTICATION
  app.post("/api/users/signup", requireAuth, async (req, res) => {
    try {
      const { username, email } = req.body;
      
      // Get wallet address from authenticated session
      const walletAddress = req.session!.walletAddress!;
      
      if (!username) {
        return res.status(400).json({ message: "Username required" });
      }

      const user = await storage.createOrUpdateUserByWallet(walletAddress, username, email);
      
      // Update session with user info
      if (req.session) {
        req.session.username = user.username;
        req.session.agreedToTerms = user.agreedToTerms;
      }
      
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

  // Place a bet - REQUIRES AUTHENTICATION AND TERMS AGREEMENT
  app.post("/api/bets", requireAuth, requireTermsAgreement, async (req, res) => {
    try {
      const { amount, username } = req.body;
      
      // Get wallet address from authenticated session
      const userAddress = req.session!.walletAddress!;
      
      // Validate bet data
      const validated = insertBetSchema.parse({
        userAddress,
        username: username || req.session!.username,
        amount
      });
      
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

  // ========================================
  // AIRDROP ENDPOINTS
  // ========================================

  // Get airdrop pool information
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

  // Get airdrop distribution history
  app.get("/api/airdrop/history", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const distributions = await storage.getAirdropDistributions(limit);
      res.json(distributions);
    } catch (error) {
      console.error("Error fetching airdrop history:", error);
      res.status(500).json({ message: "Failed to fetch airdrop history" });
    }
  });

  // Get user's airdrop earnings
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

  // Add tip to airdrop pool - REQUIRES AUTHENTICATION AND TERMS AGREEMENT
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
      
      const { airdropService } = await import("./airdropService");
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

  // ========================================
  // ADMIN ENDPOINTS
  // ========================================

  /**
   * Bootstrap admin - allows first authenticated user to become admin
   * Only works if no admin exists yet
   */
  app.post("/api/admin/bootstrap", requireAuth, async (req, res) => {
    try {
      const walletAddress = req.session!.walletAddress!;
      
      // Check if any admin exists
      const hasAdmin = await storage.hasAnyAdmin();
      if (hasAdmin) {
        return res.status(403).json({ message: "Admin already exists. Contact existing admin for access." });
      }
      
      // Make the current user an admin
      const user = await storage.setUserRole(walletAddress, 'admin');
      if (!user) {
        return res.status(404).json({ message: "User not found. Please sign up first." });
      }
      
      // Update session
      req.session!.isAdmin = true;
      
      console.log(`👑 Admin bootstrapped: ${walletAddress}`);
      res.json({ success: true, message: "You are now an admin!", isAdmin: true });
    } catch (error) {
      console.error("Error bootstrapping admin:", error);
      res.status(500).json({ message: "Failed to bootstrap admin" });
    }
  });

  /**
   * Get all markets (admin only - includes locked and settled)
   */
  app.get("/api/admin/markets", requireAuth, requireAdminRole, async (_req, res) => {
    try {
      const allMarkets = await storage.getAllMarkets();
      res.json(allMarkets);
    } catch (error) {
      console.error("Error fetching admin markets:", error);
      res.status(500).json({ message: "Failed to fetch markets" });
    }
  });

  /**
   * Get active markets (public)
   */
  app.get("/api/markets", async (_req, res) => {
    try {
      const activeMarkets = await storage.getAllActiveMarkets();
      res.json(activeMarkets);
    } catch (error) {
      console.error("Error fetching markets:", error);
      res.status(500).json({ message: "Failed to fetch markets" });
    }
  });

  /**
   * Get market by ID
   */
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

  /**
   * Lock market (admin action - close betting)
   */
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

  /**
   * Settle market with winning outcome (admin action)
   */
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
      
      // Settle the market
      const settledMarket = await storage.settleMarket(req.params.id, winningOutcome);
      
      // Get all bets for this market
      const betsOnMarket = await storage.getMarketBetsByMarketId(req.params.id);
      
      // Calculate pool totals
      const totalPool = parseFloat(market.poolATotal) + parseFloat(market.poolBTotal);
      const winningPool = winningOutcome === 'A' ? parseFloat(market.poolATotal) : parseFloat(market.poolBTotal);
      
      // Process payouts
      let payoutsProcessed = 0;
      for (const bet of betsOnMarket) {
        if (bet.outcome === winningOutcome) {
          // Calculate payout: (bet amount / winning pool) * total pool
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

  // ========================================
  // SPORTS DATA API ENDPOINTS (TheSportsDB)
  // ========================================
  
  const { theSportsDB } = await import('./thesportsdb');

  /**
   * Get all sports from TheSportsDB
   */
  app.get("/api/sports", async (_req, res) => {
    try {
      const sports = await theSportsDB.getAllSports();
      res.json(sports);
    } catch (error) {
      console.error("Error fetching sports:", error);
      res.status(500).json({ message: "Failed to fetch sports" });
    }
  });

  /**
   * Get upcoming events by league ID
   */
  app.get("/api/sports/events/upcoming/:leagueId", async (req, res) => {
    try {
      const events = await theSportsDB.getUpcomingEventsByLeague(req.params.leagueId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
      res.status(500).json({ message: "Failed to fetch upcoming events" });
    }
  });

  /**
   * Get past events by league ID
   */
  app.get("/api/sports/events/past/:leagueId", async (req, res) => {
    try {
      const events = await theSportsDB.getPastEventsByLeague(req.params.leagueId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching past events:", error);
      res.status(500).json({ message: "Failed to fetch past events" });
    }
  });

  /**
   * Get events by date
   */
  app.get("/api/sports/events/date/:date", async (req, res) => {
    try {
      const { sport, league } = req.query;
      const events = await theSportsDB.getEventsByDate(
        req.params.date,
        sport as string | undefined,
        league as string | undefined
      );
      res.json(events);
    } catch (error) {
      console.error("Error fetching events by date:", error);
      res.status(500).json({ message: "Failed to fetch events by date" });
    }
  });

  /**
   * Get event details by ID
   */
  app.get("/api/sports/events/:eventId", async (req, res) => {
    try {
      const event = await theSportsDB.getEventDetails(req.params.eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching event details:", error);
      res.status(500).json({ message: "Failed to fetch event details" });
    }
  });

  /**
   * Get teams by league name
   */
  app.get("/api/sports/teams/league/:leagueName", async (req, res) => {
    try {
      const teams = await theSportsDB.getTeamsByLeague(req.params.leagueName);
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  /**
   * Search teams by name
   */
  app.get("/api/sports/teams/search/:query", async (req, res) => {
    try {
      const query = req.params.query;
      if (!query) {
        return res.status(400).json({ message: "Search query required" });
      }
      const teams = await theSportsDB.searchTeams(query);
      res.json(teams);
    } catch (error) {
      console.error("Error searching teams:", error);
      res.status(500).json({ message: "Failed to search teams" });
    }
  });

  /**
   * Get team details by ID
   */
  app.get("/api/sports/teams/:teamId", async (req, res) => {
    try {
      const team = await theSportsDB.getTeamDetails(req.params.teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      console.error("Error fetching team details:", error);
      res.status(500).json({ message: "Failed to fetch team details" });
    }
  });

  /**
   * Get team badge by name
   */
  app.get("/api/sports/teams/badge/:teamName", async (req, res) => {
    try {
      const badge = await theSportsDB.getTeamBadgeByName(req.params.teamName);
      res.json({ badge });
    } catch (error) {
      console.error("Error fetching team badge:", error);
      res.status(500).json({ message: "Failed to fetch team badge" });
    }
  });

  /**
   * Get teams with badges from events for a league
   */
  app.get("/api/sports/teams/from-events/:leagueId", async (req, res) => {
    try {
      const teams = await theSportsDB.getTeamsFromEvents(req.params.leagueId);
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams from events:", error);
      res.status(500).json({ message: "Failed to fetch teams from events" });
    }
  });

  /**
   * Search leagues by name
   */
  app.get("/api/sports/leagues/search/:query", async (req, res) => {
    try {
      const query = req.params.query;
      if (!query) {
        return res.status(400).json({ message: "Search query required" });
      }
      const leagues = await theSportsDB.searchLeagues(query);
      res.json(leagues);
    } catch (error) {
      console.error("Error searching leagues:", error);
      res.status(500).json({ message: "Failed to search leagues" });
    }
  });

  /**
   * Get league details by ID
   */
  app.get("/api/sports/leagues/:leagueId", async (req, res) => {
    try {
      const league = await theSportsDB.getLeagueDetails(req.params.leagueId);
      if (!league) {
        return res.status(404).json({ message: "League not found" });
      }
      res.json(league);
    } catch (error) {
      console.error("Error fetching league details:", error);
      res.status(500).json({ message: "Failed to fetch league details" });
    }
  });

  const httpServer = createServer(app);

  // Set up WebSocket server for real-time chat with session verification
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: "/ws",
    verifyClient: (info, callback) => {
      // Parse session from WebSocket upgrade request
      sessionParser(info.req, {} as any, () => {
        callback(true); // Allow connection, we'll auth on ws_auth message
      });
    }
  });

  // Extended WebSocket type to store authentication data
  interface AuthenticatedWebSocket extends WebSocket {
    walletAddress?: string;
    username?: string;
    isAuthenticated?: boolean;
    request?: IncomingMessage & { session?: session.Session & Partial<session.SessionData> };
  }

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

  wss.on("connection", (ws: AuthenticatedWebSocket, request: IncomingMessage) => {
    console.log("Client connected");
    
    // Store request for session access
    ws.request = request as any;

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
        
        // Handle WebSocket authentication - VERIFY AGAINST HTTP SESSION
        if (parsed.type === "ws_auth") {
          const { walletAddress } = parsed.data;
          
          if (!walletAddress) {
            ws.send(JSON.stringify({ 
              type: "auth_error", 
              message: "Wallet address required for authentication" 
            }));
            return;
          }
          
          // SECURITY: Verify wallet address matches authenticated HTTP session
          const session = (ws.request as any)?.session;
          
          if (!session || !session.walletAddress) {
            ws.send(JSON.stringify({ 
              type: "auth_error", 
              message: "No authenticated session. Please connect and verify your wallet first." 
            }));
            console.warn(`⚠️ WebSocket auth attempt without valid session: ${walletAddress}`);
            return;
          }
          
          // Verify the wallet address matches the session
          if (session.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
            ws.send(JSON.stringify({ 
              type: "auth_error", 
              message: "Wallet address mismatch. Session tampering detected." 
            }));
            console.error(`🚨 WebSocket auth mismatch - Session: ${session.walletAddress}, Claimed: ${walletAddress}`);
            ws.close(1008, "Authentication failed"); // Policy violation close code
            return;
          }
          
          // Verify user exists in database
          const user = await storage.getUserByWalletAddress(walletAddress);
          
          if (!user) {
            ws.send(JSON.stringify({ 
              type: "auth_error", 
              message: "User not found. Please sign up first." 
            }));
            return;
          }
          
          // Store authenticated data on WebSocket connection (from verified session)
          ws.walletAddress = session.walletAddress;
          ws.username = session.username || user.username || undefined;
          ws.isAuthenticated = true;
          
          ws.send(JSON.stringify({ 
            type: "auth_success", 
            data: { username: ws.username, walletAddress: ws.walletAddress }
          }));
          
          console.log(`🔐 WebSocket authenticated: ${ws.username} (${ws.walletAddress})`);
          return;
        }
        
        // Handle chat messages - REQUIRES AUTHENTICATION
        if (parsed.type === "chat") {
          // SECURITY: Reject messages from unauthenticated connections
          if (!ws.isAuthenticated || !ws.username || !ws.walletAddress) {
            ws.send(JSON.stringify({ 
              type: "error", 
              message: "Authentication required to send messages. Please connect your wallet." 
            }));
            return;
          }
          
          // Build message data from authenticated session
          // SECURITY: Username comes from authenticated session (server-verified)
          // Message content is validated by schema (length, format)
          // Frontend MUST escape HTML when rendering to prevent XSS
          const messageData = {
            username: ws.username, // From authenticated WebSocket
            walletAddress: ws.walletAddress, // From authenticated WebSocket
            message: parsed.data.message, // Raw message content (frontend escapes on render)
            timestamp: new Date()
          };
          
          // SECURITY: Validate message format and length (Zod schema enforces constraints)
          // This ensures message meets length/format requirements before storage
          const validated = insertChatMessageSchema.parse(messageData);
          
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
