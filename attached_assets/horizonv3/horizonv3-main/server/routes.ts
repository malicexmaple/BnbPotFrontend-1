// DegenArena API Routes
// Reference: javascript_log_in_with_replit blueprint for auth routes
import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { randomBytes } from "crypto";
import { theSportsDB } from "./thesportsdb";
import multer from "multer";
import path from "path";
import { sportsData } from "@shared/sports-leagues";

export async function registerRoutes(app: Express): Promise<Server> {
  // ============================================================================
  // AUTH MIDDLEWARE & ROUTES
  // ============================================================================
  
  await setupAuth(app);

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ============================================================================
  // PROFILE ROUTES
  // ============================================================================

  // Update profile (display name and profile image, 7 day cooldown for name)
  app.patch('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { displayName, profileImageUrl } = req.body;

      if (!displayName || displayName.trim().length === 0) {
        return res.status(400).json({ message: "Display name is required" });
      }

      if (displayName.trim().length > 20) {
        return res.status(400).json({ message: "Display name must be 20 characters or less" });
      }

      // Get current user to check last name change
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check 7-day cooldown for display name changes
      if (user.lastNameChange) {
        const daysSinceLastChange = (Date.now() - new Date(user.lastNameChange).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastChange < 7) {
          const daysRemaining = Math.ceil(7 - daysSinceLastChange);
          return res.status(429).json({ 
            message: `You can change your name again in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}` 
          });
        }
      }

      const updatedUser = await storage.updateUserProfile(userId, {
        displayName: displayName.trim(),
        profileImageUrl: profileImageUrl ? profileImageUrl.trim() : undefined,
        lastNameChange: new Date(),
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // ============================================================================
  // LEADERBOARD ROUTES
  // ============================================================================

  // Get leaderboard (top players)
  app.get('/api/leaderboard', async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const leaders = await storage.getLeaderboard(limit);
      res.json(leaders);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // ============================================================================
  // WALLET ROUTES
  // ============================================================================

  // Get user's wallet
  app.get('/api/wallet', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let wallet = await storage.getWalletByUserId(userId);
      
      // Auto-create wallet if it doesn't exist
      if (!wallet) {
        const bnbAddress = `0x${randomBytes(20).toString('hex')}`;
        wallet = await storage.createWallet({
          userId,
          bnbAddress,
          balance: "0",
        });
      }
      
      res.json(wallet);
    } catch (error) {
      console.error("Error fetching wallet:", error);
      res.status(500).json({ message: "Failed to fetch wallet" });
    }
  });

  // Deposit to wallet
  app.post('/api/wallet/deposit', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amount } = req.body;
      
      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Invalid deposit amount" });
      }
      
      let wallet = await storage.getWalletByUserId(userId);
      if (!wallet) {
        const bnbAddress = `0x${randomBytes(20).toString('hex')}`;
        wallet = await storage.createWallet({
          userId,
          bnbAddress,
          balance: "0",
        });
      }
      
      const currentBalance = parseFloat(wallet.balance);
      const newBalance = (currentBalance + parseFloat(amount)).toString();
      
      const updatedWallet = await storage.updateWalletBalance(wallet.id, newBalance);
      
      // Create transaction record
      await storage.createTransaction({
        walletId: wallet.id,
        userId,
        type: 'deposit',
        amount,
        status: 'completed',
        txHash: `0x${randomBytes(32).toString('hex')}`,
        metadata: { method: 'mock_deposit' },
      });
      
      res.json(updatedWallet);
    } catch (error) {
      console.error("Error processing deposit:", error);
      res.status(500).json({ message: "Failed to process deposit" });
    }
  });

  // Withdraw from wallet
  app.post('/api/wallet/withdraw', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amount, toAddress } = req.body;
      
      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Invalid withdrawal amount" });
      }
      
      if (!toAddress) {
        return res.status(400).json({ message: "Withdrawal address required" });
      }
      
      const wallet = await storage.getWalletByUserId(userId);
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }
      
      const currentBalance = parseFloat(wallet.balance);
      if (currentBalance < parseFloat(amount)) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      const newBalance = (currentBalance - parseFloat(amount)).toString();
      const updatedWallet = await storage.updateWalletBalance(wallet.id, newBalance);
      
      // Create transaction record
      await storage.createTransaction({
        walletId: wallet.id,
        userId,
        type: 'withdrawal',
        amount,
        status: 'completed',
        txHash: `0x${randomBytes(32).toString('hex')}`,
        metadata: { toAddress },
      });
      
      res.json(updatedWallet);
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      res.status(500).json({ message: "Failed to process withdrawal" });
    }
  });

  // Get wallet transactions
  app.get('/api/wallet/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const wallet = await storage.getWalletByUserId(userId);
      
      if (!wallet) {
        return res.json([]);
      }
      
      const transactions = await storage.getTransactionsByWalletId(wallet.id);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // ============================================================================
  // MARKET ROUTES
  // ============================================================================

  // Get all active markets (filtered by visibility settings)
  app.get('/api/markets', async (req, res) => {
    try {
      const markets = await storage.getAllActiveMarkets();
      const visibilitySettings = await storage.getVisibilitySettings();
      
      // Create a map of sport names to sport IDs (handles all sports including esports)
      const sportNameToId = new Map<string, string>();
      sportsData.forEach(sport => {
        sportNameToId.set(sport.name, sport.id);
      });
      
      // Create a map of league names to league IDs
      const leagueNameToId = new Map<string, string>();
      sportsData.forEach(sport => {
        sport.leagues.forEach(league => {
          leagueNameToId.set(league.name, league.id);
        });
      });
      
      // Filter markets based on visibility settings
      const filteredMarkets = markets.filter(market => {
        // Get sport ID from market using the sportNameToId map
        const sportId = sportNameToId.get(market.sport);
        
        if (sportId) {
          // Check sport visibility (default to visible if no setting)
          const sportSetting = visibilitySettings.find(s => s.type === 'sport' && s.sportId === sportId);
          const isSportVisible = sportSetting ? sportSetting.isVisible : true;
          
          if (!isSportVisible) {
            return false; // Hide entire sport
          }
        }
        
        // Check league visibility
        const leagueId = leagueNameToId.get(market.league);
        if (leagueId) {
          const leagueSetting = visibilitySettings.find(s => s.type === 'league' && s.leagueId === leagueId);
          const isLeagueVisible = leagueSetting ? leagueSetting.isVisible : true;
          
          if (!isLeagueVisible) {
            return false; // Hide markets from this league
          }
        }
        
        return true;
      });
      
      res.json(filteredMarkets);
    } catch (error) {
      console.error("Error fetching markets:", error);
      res.status(500).json({ message: "Failed to fetch markets" });
    }
  });

  // Admin check middleware
  const requireAdminRole = async (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required. Only administrators can perform this action" });
      }
      
      next();
    } catch (error) {
      console.error("Error checking admin status:", error);
      return res.status(500).json({ message: "Failed to verify admin status" });
    }
  };

  // Get all markets (admin only - includes locked and settled)
  app.get('/api/admin/markets', isAuthenticated, requireAdminRole, async (req: any, res) => {
    try {
      const markets = await storage.getAllMarkets();
      res.json(markets);
    } catch (error) {
      console.error("Error fetching admin markets:", error);
      res.status(500).json({ message: "Failed to fetch markets" });
    }
  });

  // Get market by ID
  app.get('/api/markets/:id', async (req, res) => {
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

  // Lock market (admin action - close betting)
  app.post('/api/markets/:id/lock', isAuthenticated, requireAdminRole, async (req: any, res) => {
    try {
      const market = await storage.updateMarketStatus(req.params.id, 'locked');
      
      // Broadcast market status change
      if (app.locals.broadcastMarketUpdate) {
        app.locals.broadcastMarketUpdate({
          id: market.id,
          status: 'locked',
        });
      }
      
      res.json({ message: "Market locked successfully", market });
    } catch (error) {
      console.error("Error locking market:", error);
      res.status(500).json({ message: "Failed to lock market" });
    }
  });

  // Settle market with winning outcome (admin action)
  app.post('/api/markets/:id/settle', isAuthenticated, requireAdminRole, async (req: any, res) => {
    const { db } = await import('./db');
    
    try {
      const { winningOutcome } = req.body;
      
      if (!winningOutcome || (winningOutcome !== 'A' && winningOutcome !== 'B')) {
        return res.status(400).json({ message: "Invalid winning outcome. Must be 'A' or 'B'" });
      }
      
      // Execute settlement in atomic transaction
      const result = await db.transaction(async (tx) => {
        // Fetch market inside transaction for consistent read
        const market = await storage.getMarketById(req.params.id, tx);
        if (!market) {
          throw new Error("Market not found");
        }
        
        if (market.status === 'settled') {
          throw new Error("Market already settled");
        }
        
        // Calculate pool totals from transactional read
        const totalPool = parseFloat(market.poolATotal) + parseFloat(market.poolBTotal);
        const winningPool = winningOutcome === 'A' ? parseFloat(market.poolATotal) : parseFloat(market.poolBTotal);
        
        // Check for zero winning pool (no bets on winning outcome)
        if (winningPool === 0) {
          throw new Error("Cannot settle market - no bets placed on winning outcome");
        }
        
        // Settle the market (use tx parameter)
        const settledMarket = await storage.settleMarket(req.params.id, winningOutcome, tx);
        
        // Get all bets on this market (use tx parameter)
        const bets = await storage.getBetsByMarketId(req.params.id, tx);
        
        // Process each bet
        const payouts = [];
        for (const bet of bets) {
          if (bet.outcome === winningOutcome) {
            // Calculate payout: (bet amount / winning pool) * total pool
            const betAmount = parseFloat(bet.amount);
            const payout = (betAmount / winningPool) * totalPool;
            const actualPayout = payout.toString();
            
            // Update bet status to won (use tx parameter)
            await storage.updateBetStatus(bet.id, 'won', actualPayout, tx);
            
            // Get user's wallet and add payout (use tx parameter)
            const wallet = await storage.getWalletByUserId(bet.userId, tx);
            if (wallet) {
              const newBalance = (parseFloat(wallet.balance) + payout).toString();
              await storage.updateWalletBalance(wallet.id, newBalance, tx);
              
              // Create payout transaction (use tx parameter)
              await storage.createTransaction({
                walletId: wallet.id,
                userId: bet.userId,
                type: 'bet_won',
                amount: actualPayout,
                status: 'completed',
                metadata: {
                  betId: bet.id,
                  marketId: market.id,
                },
              }, tx);
              
              // Update user stats (won amount) - use tx parameter
              await storage.updateUserStats(bet.userId, undefined, actualPayout, tx);
              
              payouts.push({ userId: bet.userId, amount: payout });
            }
          } else {
            // Losing bet (use tx parameter)
            await storage.updateBetStatus(bet.id, 'lost', '0', tx);
          }
        }
        
        return { settledMarket, payouts };
      });
      
      // Broadcast market settlement
      if (app.locals.broadcastMarketUpdate) {
        app.locals.broadcastMarketUpdate({
          id: result.settledMarket.id,
          status: 'settled',
          winningOutcome,
        });
      }
      
      res.json({ 
        message: "Market settled successfully", 
        market: result.settledMarket,
        payoutsProcessed: result.payouts.length,
      });
    } catch (error: any) {
      console.error("Error settling market:", error);
      // Return specific error messages from transaction
      if (error.message === "Market not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Market already settled" || 
          error.message === "Cannot settle market - no bets placed on winning outcome") {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to settle market" });
    }
  });

  // ============================================================================
  // VISIBILITY SETTINGS ROUTES
  // ============================================================================

  // Get all visibility settings (public - needed for sidebar filtering for all users)
  app.get('/api/visibility-settings', async (req, res) => {
    try {
      const settings = await storage.getVisibilitySettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching visibility settings:", error);
      res.status(500).json({ message: "Failed to fetch visibility settings" });
    }
  });

  // Toggle sport visibility
  app.post('/api/admin/visibility/sport/:sportId', isAuthenticated, requireAdminRole, async (req: any, res) => {
    try {
      const { sportId } = req.params;
      const { isVisible } = req.body;
      const userId = req.user.claims.sub;

      if (typeof isVisible !== 'boolean') {
        return res.status(400).json({ message: "isVisible must be a boolean" });
      }

      const setting = await storage.toggleSportVisibility(sportId, isVisible, userId);
      res.json(setting);
    } catch (error) {
      console.error("Error toggling sport visibility:", error);
      res.status(500).json({ message: "Failed to toggle sport visibility" });
    }
  });

  // Toggle league visibility
  app.post('/api/admin/visibility/league/:leagueId', isAuthenticated, requireAdminRole, async (req: any, res) => {
    try {
      const { leagueId } = req.params;
      const { sportId, isVisible } = req.body;
      const userId = req.user.claims.sub;

      if (!sportId) {
        return res.status(400).json({ message: "sportId is required" });
      }

      if (typeof isVisible !== 'boolean') {
        return res.status(400).json({ message: "isVisible must be a boolean" });
      }

      const setting = await storage.toggleLeagueVisibility(leagueId, sportId, isVisible, userId);
      res.json(setting);
    } catch (error) {
      console.error("Error toggling league visibility:", error);
      res.status(500).json({ message: "Failed to toggle league visibility" });
    }
  });

  // Cache for league activity status (5 minute TTL)
  let leagueActivityCache: { data: string[], timestamp: number } | null = null;
  const ACTIVITY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  // Get leagues activity status (whether they have events in next 2 weeks)
  app.get('/api/leagues/activity-status', async (req, res) => {
    try {
      // Check if we have cached data that's still valid
      if (leagueActivityCache && (Date.now() - leagueActivityCache.timestamp) < ACTIVITY_CACHE_TTL) {
        console.log('Returning cached league activity status');
        return res.json({ activeLeagueIds: leagueActivityCache.data });
      }
      
      console.log('Fetching fresh league activity status...');
      const now = new Date();
      const twoWeeksFromNow = new Date();
      twoWeeksFromNow.setDate(now.getDate() + 14);
      
      const activeLeagueIds = new Set<string>();
      let successfulFetches = 0;
      let totalLeagues = 0;
      
      // Check all leagues from sportsData
      const { sportsData } = await import('@shared/sports-leagues');
      const { sportsDBService } = await import('./thesportsdb');
      
      // Process leagues in smaller batches to avoid overwhelming the API
      const BATCH_SIZE = 10;
      const BATCH_DELAY = 1000; // 1 second delay between batches
      
      for (const sport of sportsData) {
        if (sport.leagues && sport.leagues.length > 0) {
          // Process in batches
          for (let i = 0; i < sport.leagues.length; i += BATCH_SIZE) {
            const batch = sport.leagues.slice(i, i + BATCH_SIZE);
            
            await Promise.all(batch.map(async (league) => {
              totalLeagues++;
              try {
                const events = await sportsDBService.getUpcomingEventsByLeague(league.id);
                successfulFetches++;
                
                // Check if any events are within the next 2 weeks
                const hasUpcomingEvents = events && events.some((event: any) => {
                  if (event.dateEvent) {
                    const eventDate = new Date(event.dateEvent);
                    return eventDate >= now && eventDate <= twoWeeksFromNow;
                  }
                  return false;
                });
                
                if (hasUpcomingEvents) {
                  activeLeagueIds.add(league.id);
                }
              } catch (error) {
                // Skip leagues that fail to fetch
                console.error(`Failed to check events for league ${league.id}`);
              }
            }));
            
            // Delay between batches to avoid rate limiting
            if (i + BATCH_SIZE < sport.leagues.length) {
              await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
            }
          }
        }
      }
      
      // If we got rate-limited on everything (less than 10% success rate), throw error to trigger stale cache fallback
      if (totalLeagues > 0 && successfulFetches < totalLeagues * 0.1) {
        throw new Error(`Activity check failed: only ${successfulFetches}/${totalLeagues} leagues fetched successfully (rate limited)`);
      }
      
      const result = Array.from(activeLeagueIds);
      
      // Only update cache if we got meaningful data
      leagueActivityCache = {
        data: result,
        timestamp: Date.now()
      };
      
      console.log(`League activity check complete: ${result.length} active leagues found (${successfulFetches}/${totalLeagues} successful fetches)`);
      res.json({ activeLeagueIds: result });
    } catch (error) {
      console.error("Error checking league activity:", error);
      
      // If we have stale cache data, return it rather than failing
      if (leagueActivityCache) {
        console.log('Returning stale cached data due to error');
        return res.json({ activeLeagueIds: leagueActivityCache.data });
      }
      
      res.status(500).json({ message: "Failed to check league activity" });
    }
  });

  // ============================================================================
  // CHAT ROUTES
  // ============================================================================

  // Get recent chat messages
  app.get('/api/chat/messages', isAuthenticated, async (req: any, res) => {
    try {
      const messages = await storage.getRecentChatMessages(50);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  // Send a chat message
  app.post('/api/chat/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { message } = req.body;
      
      if (!message || message.trim().length === 0) {
        return res.status(400).json({ message: "Message cannot be empty" });
      }
      
      if (message.length > 500) {
        return res.status(400).json({ message: "Message too long (max 500 characters)" });
      }
      
      const chatMessage = await storage.createChatMessage({
        userId,
        message: message.trim(),
      });
      
      // Get user info for broadcast
      const user = await storage.getUser(userId);
      
      // Broadcast new message to all connected clients
      if (app.locals.broadcastChatMessage) {
        app.locals.broadcastChatMessage({
          id: chatMessage.id,
          userId: chatMessage.userId,
          message: chatMessage.message,
          createdAt: chatMessage.createdAt,
          userEmail: user?.email,
          userFirstName: user?.firstName,
          userLastName: user?.lastName,
          profileImageUrl: user?.profileImageUrl,
          nameColor: user?.nameColor,
        });
      }
      
      res.json(chatMessage);
    } catch (error) {
      console.error("Error sending chat message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // ============================================================================
  // BETTING ROUTES
  // ============================================================================

  // Place a bet with atomic database transaction
  app.post('/api/bets', isAuthenticated, async (req: any, res) => {
    const { db } = await import('./db');
    
    try {
      const userId = req.user.claims.sub;
      const { marketId, outcome, amount, oddsAtBet } = req.body;
      
      if (!marketId || !outcome || !amount || !oddsAtBet) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      if (outcome !== 'A' && outcome !== 'B') {
        return res.status(400).json({ message: "Invalid outcome" });
      }
      
      if (parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Invalid bet amount" });
      }
      
      // Get user's wallet
      const wallet = await storage.getWalletByUserId(userId);
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }
      
      const currentBalance = parseFloat(wallet.balance);
      const betAmount = parseFloat(amount);
      
      if (currentBalance < betAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Get market
      const market = await storage.getMarketById(marketId);
      if (!market) {
        return res.status(404).json({ message: "Market not found" });
      }
      
      if (market.status !== 'active') {
        return res.status(400).json({ message: "Market is not accepting bets" });
      }
      
      // Execute all operations in a database transaction for atomicity
      const result = await db.transaction(async (tx) => {
        // Deduct from wallet
        const newBalance = (currentBalance - betAmount).toString();
        await storage.updateWalletBalance(wallet.id, newBalance, tx);
        
        // Update market pools
        const poolATotal = parseFloat(market.poolATotal);
        const poolBTotal = parseFloat(market.poolBTotal);
        
        const newPoolATotal = outcome === 'A' 
          ? (poolATotal + betAmount).toString()
          : poolATotal.toString();
        const newPoolBTotal = outcome === 'B' 
          ? (poolBTotal + betAmount).toString()
          : poolBTotal.toString();
        
        await storage.updateMarketPools(marketId, newPoolATotal, newPoolBTotal, tx);
        
        // Create bet
        const bet = await storage.createBet({
          userId,
          marketId,
          walletId: wallet.id,
          outcome,
          amount,
          oddsAtBet,
        }, tx);
        
        // Create transaction record
        await storage.createTransaction({
          walletId: wallet.id,
          userId,
          type: 'bet_placed',
          amount,
          status: 'completed',
          metadata: { 
            betId: bet.id,
            marketId,
            outcome,
          },
        }, tx);
        
        // Update user stats (wagered amount)
        await storage.updateUserStats(userId, amount, undefined, tx);
        
        return { bet, updatedMarket: { ...market, poolATotal: newPoolATotal, poolBTotal: newPoolBTotal } };
      });
      
      // Recalculate odds after pool updates
      const totalPool = parseFloat(result.updatedMarket.poolATotal) + parseFloat(result.updatedMarket.poolBTotal);
      const oddsA = totalPool > 0 ? (totalPool / parseFloat(result.updatedMarket.poolATotal)).toFixed(2) : "0.00";
      const oddsB = totalPool > 0 ? (totalPool / parseFloat(result.updatedMarket.poolBTotal)).toFixed(2) : "0.00";
      
      // Broadcast new bet to all WebSocket clients for live feed updates
      if (app.locals.broadcastBet) {
        const betPayload = {
          id: result.bet.id,
          userEmail: req.user?.email || "Anonymous",
          amount: result.bet.amount,
          outcome: result.bet.outcome,
          teamA: market.teamA,
          teamB: market.teamB,
          marketDescription: market.description,
          oddsAtBet: result.bet.oddsAtBet,
          createdAt: result.bet.createdAt,
          status: result.bet.status,
        };
        app.locals.broadcastBet(betPayload);
      }
      
      // Broadcast updated market state for real-time odds updates
      if (app.locals.broadcastMarketUpdate) {
        const marketUpdate = {
          id: marketId,
          poolATotal: result.updatedMarket.poolATotal,
          poolBTotal: result.updatedMarket.poolBTotal,
          oddsA,
          oddsB,
        };
        app.locals.broadcastMarketUpdate(marketUpdate);
      }
      
      res.json(result.bet);
    } catch (error) {
      console.error("Error placing bet:", error);
      res.status(500).json({ message: "Failed to place bet" });
    }
  });

  // Get user's bets
  app.get('/api/bets/my-bets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bets = await storage.getBetsByUserId(userId);
      res.json(bets);
    } catch (error) {
      console.error("Error fetching bets:", error);
      res.status(500).json({ message: "Failed to fetch bets" });
    }
  });

  // Get betting feed (recent bets from all users)
  app.get('/api/bets/feed', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const feed = await storage.getRecentBetsForFeed(limit);
      res.json(feed);
    } catch (error) {
      console.error("Error fetching betting feed:", error);
      res.status(500).json({ message: "Failed to fetch betting feed" });
    }
  });

  // ============================================================================
  // CRYPTO PRICE API (For currency conversion)
  // ============================================================================

  // Get crypto prices from CoinGecko (BNB to multiple currencies)
  app.get('/api/crypto/prices', async (req: any, res) => {
    try {
      const currencies = req.query.currencies || 'usd,eur,gbp,jpy,cad,aud';
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=${currencies}&include_24hr_change=true`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch crypto prices');
      }
      
      const data = await response.json();
      res.json(data.binancecoin || {});
    } catch (error) {
      console.error("Error fetching crypto prices:", error);
      // Return fallback prices if API fails
      res.json({
        usd: 600,
        eur: 550,
        gbp: 475,
        jpy: 90000,
        cad: 820,
        aud: 920,
      });
    }
  });

  // Get user stats (wallet + rank + XP all in one)
  app.get('/api/user/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      let wallet = await storage.getWalletByUserId(userId);
      
      // Auto-create wallet if it doesn't exist
      if (!wallet) {
        const bnbAddress = `0x${randomBytes(20).toString('hex')}`;
        wallet = await storage.createWallet({
          userId,
          bnbAddress,
          balance: "0",
        });
      }
      
      // Calculate XP progress to next rank - 12 tier progressive system
      const rankThresholds = {
        Bronze: { min: 0, max: 10000 },
        Silver: { min: 10000, max: 30000 },
        Gold: { min: 30000, max: 60000 },
        Sapphire: { min: 60000, max: 100000 },
        Emerald: { min: 100000, max: 150000 },
        Ruby: { min: 150000, max: 210000 },
        Diamond: { min: 210000, max: 280000 },
        Pearl: { min: 280000, max: 360000 },
        Opal: { min: 360000, max: 450000 },
        Stardust: { min: 450000, max: 550000 },
        Nebula: { min: 550000, max: 660000 },
        Supernova: { min: 660000, max: Infinity },
      };
      
      // Map legacy ranks (Platinum, Obsidian) to new tier equivalents based on actual XP
      let mappedRank = user.rank;
      
      // For Platinum and Obsidian users (legacy ranks), recalculate rank based on their actual XP
      if (user.rank === "Platinum" || user.rank === "Obsidian") {
        const xp = user.rankPoints;
        if (xp >= 660000) mappedRank = "Supernova";
        else if (xp >= 550000) mappedRank = "Nebula";
        else if (xp >= 450000) mappedRank = "Stardust";
        else if (xp >= 360000) mappedRank = "Opal";
        else if (xp >= 280000) mappedRank = "Pearl";
        else if (xp >= 210000) mappedRank = "Diamond";
        else if (xp >= 150000) mappedRank = "Ruby";
        else if (xp >= 100000) mappedRank = "Emerald";
        else if (xp >= 60000) mappedRank = "Sapphire";
        else if (xp >= 30000) mappedRank = "Gold";
        else if (xp >= 10000) mappedRank = "Silver";
        else mappedRank = "Bronze";
      }
      
      const currentRank = mappedRank as keyof typeof rankThresholds;
      const threshold = rankThresholds[currentRank] || rankThresholds.Bronze; // Fallback to Bronze for old ranks
      const progress = threshold.max === Infinity 
        ? 100 
        : Math.min(100, ((user.rankPoints - threshold.min) / (threshold.max - threshold.min)) * 100);
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          nameColor: user.nameColor,
          rank: mappedRank, // Return mapped rank for UI consistency
          rankPoints: user.rankPoints,
          totalWagered: user.totalWagered,
          totalWon: user.totalWon,
        },
        wallet: {
          id: wallet.id,
          balance: wallet.balance,
          bnbAddress: wallet.bnbAddress,
        },
        rankProgress: {
          current: user.rankPoints,
          min: threshold.min,
          max: threshold.max === Infinity ? user.rankPoints : threshold.max,
          percentage: progress,
          nextRank: threshold.max === Infinity ? 'Max Rank' : Object.keys(rankThresholds)[Object.keys(rankThresholds).indexOf(currentRank) + 1],
        },
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // ============================================================================
  // THESPORTSDB API ROUTES
  // ============================================================================

  app.get('/api/sports/events/upcoming/:leagueId', async (req, res) => {
    try {
      const { leagueId } = req.params;
      const { limit } = req.query;
      const maxEvents = limit ? parseInt(limit as string, 10) : undefined;
      
      let events = await theSportsDB.getUpcomingEventsByLeague(leagueId);
      
      // Apply limit if specified
      if (maxEvents && maxEvents > 0) {
        events = events.slice(0, maxEvents);
      }
      
      res.json(events);
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
      res.status(500).json({ message: "Failed to fetch upcoming events" });
    }
  });

  app.get('/api/sports/events/past/:leagueId', async (req, res) => {
    try {
      const { leagueId } = req.params;
      const events = await theSportsDB.getPastEventsByLeague(leagueId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching past events:", error);
      res.status(500).json({ message: "Failed to fetch past events" });
    }
  });

  app.get('/api/sports/events/date/:date', async (req, res) => {
    try {
      const { date } = req.params;
      const { sport, league } = req.query;
      const events = await theSportsDB.getEventsByDate(
        date, 
        sport as string | undefined, 
        league as string | undefined
      );
      res.json(events);
    } catch (error) {
      console.error("Error fetching events by date:", error);
      res.status(500).json({ message: "Failed to fetch events by date" });
    }
  });

  app.get('/api/sports/teams/league/:leagueName', async (req, res) => {
    try {
      const { leagueName } = req.params;
      const teams = await theSportsDB.getTeamsByLeague(leagueName);
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.get('/api/sports/teams/search', async (req, res) => {
    try {
      const { name } = req.query;
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ message: "Team name is required" });
      }
      const teams = await theSportsDB.searchTeams(name);
      res.json(teams);
    } catch (error) {
      console.error("Error searching teams:", error);
      res.status(500).json({ message: "Failed to search teams" });
    }
  });

  app.get('/api/sports/teams/badge/:teamName', async (req, res) => {
    try {
      const { teamName } = req.params;
      const badge = await theSportsDB.getTeamBadgeByName(teamName);
      res.json({ teamName, badge });
    } catch (error) {
      console.error("Error fetching team badge:", error);
      res.status(500).json({ message: "Failed to fetch team badge" });
    }
  });

  app.get('/api/sports/leagues/:leagueId/teams-from-events', async (req, res) => {
    try {
      const { leagueId } = req.params;
      const teams = await theSportsDB.getTeamsFromEvents(leagueId);
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams from events:", error);
      res.status(500).json({ message: "Failed to fetch teams from events" });
    }
  });

  app.get('/api/sports/teams/:teamId', async (req, res) => {
    try {
      const { teamId } = req.params;
      const team = await theSportsDB.getTeamDetails(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      console.error("Error fetching team details:", error);
      res.status(500).json({ message: "Failed to fetch team details" });
    }
  });

  app.get('/api/sports/leagues/search', async (req, res) => {
    try {
      const { name } = req.query;
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ message: "League name is required" });
      }
      const leagues = await theSportsDB.searchLeagues(name);
      res.json(leagues);
    } catch (error) {
      console.error("Error searching leagues:", error);
      res.status(500).json({ message: "Failed to search leagues" });
    }
  });

  app.get('/api/sports/leagues/:leagueId', async (req, res) => {
    try {
      const { leagueId } = req.params;
      const league = await theSportsDB.getLeagueDetails(leagueId);
      if (!league) {
        return res.status(404).json({ message: "League not found" });
      }
      res.json(league);
    } catch (error) {
      console.error("Error fetching league details:", error);
      res.status(500).json({ message: "Failed to fetch league details" });
    }
  });

  app.get('/api/sports/all', async (req, res) => {
    try {
      const sports = await theSportsDB.getAllSports();
      res.json(sports);
    } catch (error) {
      console.error("Error fetching all sports:", error);
      res.status(500).json({ message: "Failed to fetch sports" });
    }
  });

  app.get('/api/sports/events/:eventId', async (req, res) => {
    try {
      const { eventId} = req.params;
      const event = await theSportsDB.getEventDetails(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching event details:", error);
      res.status(500).json({ message: "Failed to fetch event details" });
    }
  });

  // ============================================================================
  // CUSTOM SPORTS DATA UPLOAD ROUTES
  // ============================================================================

  // Configure multer for file uploads to server/public/
  // WARNING: Files are stored in publicly accessible directory
  // TODO: Consider moving uploads to a separate directory with controlled access
  const storage_multer = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(process.cwd(), 'server/public'));
    },
    filename: (req, file, cb) => {
      // Generate secure random filename to prevent path traversal
      const uniqueSuffix = `${Date.now()}-${randomBytes(6).toString('hex')}`;
      // Sanitize extension to only allow safe raster image formats (NO SVG due to XSS risk)
      const originalExt = path.extname(file.originalname).toLowerCase();
      const safeExt = ['.jpg', '.jpeg', '.png', '.gif'].includes(originalExt) 
        ? originalExt 
        : '.png'; // Default to .png if extension is suspicious
      cb(null, `custom-${uniqueSuffix}${safeExt}`);
    }
  });

  const upload = multer({ 
    storage: storage_multer,
    limits: { 
      fileSize: 2 * 1024 * 1024, // 2MB limit (reduced from 5MB for security)
      files: 1 // Only allow 1 file per upload
    },
    fileFilter: (req, file, cb) => {
      // Strict MIME type and extension validation (NO SVG to prevent XSS attacks)
      const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      const allowedExts = /\.(jpe?g|png|gif)$/i;
      
      const hasValidMime = allowedMimes.includes(file.mimetype);
      const hasValidExt = allowedExts.test(path.extname(file.originalname));
      
      if (hasValidMime && hasValidExt) {
        return cb(null, true);
      } else {
        cb(new Error(`Invalid file type. Only raster images allowed (JPEG, PNG, GIF). SVG blocked due to security concerns. Got: ${file.mimetype}`));
      }
    }
  });

  // Admin check middleware for uploads
  const requireAdmin = async (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required. Only administrators can upload custom sports data" });
      }
      
      next();
    } catch (error) {
      console.error("Error checking admin status:", error);
      return res.status(500).json({ message: "Failed to verify admin status" });
    }
  };

  // Upload team logo - ADMIN ONLY
  app.post('/api/sports/custom/teams/upload', isAuthenticated, requireAdmin, (req, res, next) => {
    upload.single('logo')(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: "File too large. Maximum size is 2MB" });
        }
        return res.status(400).json({ message: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  }, async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded. Please select an image file (JPEG, PNG, GIF, or SVG)" });
      }

      const { name, sport, league } = req.body;
      if (!name || !sport || !league) {
        return res.status(400).json({ message: "Team name, sport, and league are required" });
      }

      const userId = req.user.claims.sub;
      const team = await storage.createCustomTeam({
        name,
        sport,
        league,
        logoFilename: req.file.filename,
        uploadedBy: userId,
      });

      res.json(team);
    } catch (error) {
      console.error("Error uploading team:", error);
      res.status(500).json({ message: "Failed to upload team. Please try again" });
    }
  });

  // Upload player photo - ADMIN ONLY
  app.post('/api/sports/custom/players/upload', isAuthenticated, requireAdmin, (req, res, next) => {
    upload.single('photo')(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: "File too large. Maximum size is 2MB" });
        }
        return res.status(400).json({ message: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  }, async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { name, sport, country } = req.body;
      if (!name || !sport) {
        return res.status(400).json({ message: "Player name and sport are required" });
      }

      const userId = req.user.claims.sub;
      const player = await storage.createCustomPlayer({
        name,
        sport,
        country: country || null,
        photoFilename: req.file.filename,
        uploadedBy: userId,
      });

      res.json(player);
    } catch (error) {
      console.error("Error uploading player:", error);
      res.status(500).json({ message: "Failed to upload player" });
    }
  });

  // Upload league badge - ADMIN ONLY
  app.post('/api/sports/custom/leagues/upload', isAuthenticated, requireAdmin, (req, res, next) => {
    upload.single('badge')(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: "File too large. Maximum size is 2MB" });
        }
        return res.status(400).json({ message: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  }, async (req: any, res) => {
    try {
      const { name, sport } = req.body;
      if (!name || !sport) {
        return res.status(400).json({ message: "League name and sport are required" });
      }

      const userId = req.user.claims.sub;
      const league = await storage.createCustomLeague({
        name,
        sport,
        badgeFilename: req.file ? req.file.filename : null,
        uploadedBy: userId,
      });

      res.json(league);
    } catch (error) {
      console.error("Error uploading league:", error);
      res.status(500).json({ message: "Failed to upload league" });
    }
  });

  // Get custom teams by sport/league
  app.get('/api/sports/custom/teams', async (req, res) => {
    try {
      const { sport, league } = req.query;
      const teams = await storage.getCustomTeams(
        sport as string | undefined,
        league as string | undefined
      );
      res.json(teams);
    } catch (error) {
      console.error("Error fetching custom teams:", error);
      res.status(500).json({ message: "Failed to fetch custom teams" });
    }
  });

  // Get custom players by sport
  app.get('/api/sports/custom/players', async (req, res) => {
    try {
      const { sport } = req.query;
      const players = await storage.getCustomPlayers(sport as string | undefined);
      res.json(players);
    } catch (error) {
      console.error("Error fetching custom players:", error);
      res.status(500).json({ message: "Failed to fetch custom players" });
    }
  });

  // Get custom leagues by sport
  app.get('/api/sports/custom/leagues', async (req, res) => {
    try {
      const { sport } = req.query;
      const leagues = await storage.getCustomLeagues(sport as string | undefined);
      res.json(leagues);
    } catch (error) {
      console.error("Error fetching custom leagues:", error);
      res.status(500).json({ message: "Failed to fetch custom leagues" });
    }
  });

  // ============================================================================
  // WEBSOCKET SERVER FOR REAL-TIME UPDATES
  // ============================================================================
  // Reference: javascript_websocket blueprint
  
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: typeof WebSocket) => {
    console.log('New WebSocket client connected');

    // Send initial connection message
    ws.send(JSON.stringify({ 
      type: 'connected',
      message: 'Connected to DegenArena live updates',
    }));

    // Broadcast market updates every 5 seconds
    const updateInterval = setInterval(async () => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          const markets = await storage.getAllActiveMarkets();
          ws.send(JSON.stringify({
            type: 'markets_update',
            data: markets,
          }));
        } catch (error) {
          console.error('Error sending market updates:', error);
        }
      }
    }, 5000);

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clearInterval(updateInterval);
    });

    ws.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
      clearInterval(updateInterval);
    });
  });

  // Broadcast function for bet placement events
  app.locals.broadcastBet = (bet: any) => {
    wss.clients.forEach((client: typeof WebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'new_bet',
          data: bet,
        }));
      }
    });
  };

  // Broadcast function for market updates (real-time odds)
  app.locals.broadcastMarketUpdate = (marketUpdate: any) => {
    wss.clients.forEach((client: typeof WebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'market_update',
          data: marketUpdate,
        }));
      }
    });
  };

  // Broadcast function for chat messages
  app.locals.broadcastChatMessage = (chatMessage: any) => {
    wss.clients.forEach((client: typeof WebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'chat_message',
          data: chatMessage,
        }));
      }
    });
  };

  return httpServer;
}
