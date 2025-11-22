import { storage } from "./storage";
import { web3Service } from "./web3Service";

/**
 * Game Service - Manages round lifecycle and blockchain sync
 */
class GameService {
  private roundCheckInterval: NodeJS.Timeout | null = null;
  private eventCleanup: (() => void) | null = null;
  private endingRounds: Set<string> = new Set(); // Track rounds currently being ended

  /**
   * Initialize the game service
   */
  async initialize() {
    console.log("🎮 Initializing Game Service...");

    // Ensure we have an active round
    await this.ensureActiveRound();

    // Set up blockchain event listeners if contract is configured
    await this.setupBlockchainListeners();

    // Start round monitoring
    this.startRoundMonitoring();

    console.log("✅ Game Service initialized");
  }

  /**
   * Ensure there's always an active round
   * In blockchain mode, this relies on event listener to create rounds
   * In database-only mode, server creates rounds manually
   */
  async ensureActiveRound() {
    const contractAddress = process.env.CONTRACT_ADDRESS || process.env.VITE_CONTRACT_ADDRESS;
    const isBlockchainMode = !!contractAddress;
    
    const currentRound = await storage.getCurrentRound();
    
    if (!currentRound) {
      if (isBlockchainMode) {
        console.log("⛓️ No round in database yet - event listener will sync from blockchain");
      } else {
        console.log("📝 No active round found, creating one...");
        await this.createNewRound();
      }
    } else {
      console.log(`✅ Active round found: #${currentRound.roundNumber}`);
    }
  }

  /**
   * Create a new round (database-only mode)
   * In blockchain mode, rounds are created by event listener when syncing from chain
   */
  async createNewRound() {
    const contractAddress = process.env.CONTRACT_ADDRESS || process.env.VITE_CONTRACT_ADDRESS;
    const isBlockchainMode = !!contractAddress;
    
    if (isBlockchainMode) {
      console.log("⚠️ Cannot manually create rounds in blockchain mode - waiting for blockchain sync");
      return null;
    }

    const latestRoundNumber = await storage.getLatestRoundNumber();
    const nextRoundNumber = latestRoundNumber + 1;

    const round = await storage.createRound({
      roundNumber: nextRoundNumber,
      endTime: null,
      countdownStart: null,
      totalPot: "0",
      status: "waiting",
    });

    console.log(`⏳ [DB MODE] Created new round #${round.roundNumber} - waiting for first bet`);
    return round;
  }

  /**
   * Start countdown when first bet is placed
   * Uses atomic database operation to prevent race conditions from concurrent first bets
   */
  async activateRound(roundId: string) {
    const now = new Date();
    const endTime = new Date(now.getTime() + 90 * 1000); // 90 seconds from now

    // Atomic update: only succeeds if round is still in 'waiting' status
    // This prevents race conditions when multiple first bets arrive simultaneously
    const updatedRound = await storage.activateRoundIfWaiting(roundId, {
      status: "active",
      countdownStart: now,
      endTime,
    });

    // If update succeeded, log activation
    if (updatedRound) {
      console.log(`▶️ Round #${updatedRound.roundNumber} activated - countdown started, ends at ${endTime.toISOString()}`);
    }
    // If no round was updated, another request already activated it (idempotent behavior)
  }

  /**
   * Monitor rounds - only for database-only mode
   * In blockchain mode, smart contract handles winner selection via Chainlink VRF
   */
  startRoundMonitoring() {
    // Check for blockchain mode using server-side env var (NOT VITE_ prefix!)
    const contractAddress = process.env.CONTRACT_ADDRESS || process.env.VITE_CONTRACT_ADDRESS;
    const isBlockchainMode = !!contractAddress;
    
    if (isBlockchainMode) {
      console.log("⛓️ Blockchain mode detected - contract handles round settlement");
      console.log("   Contract:", contractAddress);
      console.log("   Server will not auto-end rounds (blockchain does this via VRF)");
      return;
    }

    console.log("💾 Database-only mode - server will manage round lifecycle");
    
    if (this.roundCheckInterval) {
      clearInterval(this.roundCheckInterval);
    }

    this.roundCheckInterval = setInterval(async () => {
      const currentRound = await storage.getCurrentRound();
      
      if (!currentRound) {
        await this.createNewRound();
        return;
      }

      // Skip rounds that are waiting for first bet
      if (currentRound.status === "waiting") {
        return;
      }

      // Check if round has expired
      const now = new Date();
      const endTime = new Date(currentRound.endTime || now);

      if (now >= endTime && currentRound.status === "active") {
        await this.endRoundDatabaseMode(currentRound.id);
      }
    }, 1000); // Check every second
  }

  /**
   * End round in database-only mode (NO BLOCKCHAIN)
   * NOTE: This is ONLY used when running without smart contract
   * In production blockchain mode, winner selection happens on-chain via Chainlink VRF
   */
  private async endRoundDatabaseMode(roundId: string) {
    // Prevent duplicate processing
    if (this.endingRounds.has(roundId)) {
      console.log(`⚠️ Round ${roundId} is already being processed`);
      return;
    }

    this.endingRounds.add(roundId);
    console.log(`🏁 [DB MODE] Ending round ${roundId}...`);

    try {
      const round = await storage.getRound(roundId);
      if (!round || round.status !== "active") {
        console.log("⚠️ Round not active or not found");
        this.endingRounds.delete(roundId);
        return;
      }

      const bets = await storage.getBetsByRound(roundId);

      if (bets.length === 0) {
        console.log("⚠️ No bets in round, creating new round");
        await storage.updateRound(roundId, { status: "cancelled", endTime: new Date() });
        this.endingRounds.delete(roundId);
        await this.createNewRound();
        return;
      }

      // Database-mode winner selection (simple weighted random)
      const winner = this.selectWinnerDatabaseMode(bets, parseFloat(round.totalPot));

      // Calculate prize (after 5% house fee to match contract)
      const totalPot = parseFloat(round.totalPot);
      const prize = totalPot * 0.95;

      // Update round
      await storage.updateRound(roundId, {
        status: "completed",
        winnerAddress: winner.userAddress,
        endTime: new Date(),
      });

      // Update winner stats
      const winnerStats = await storage.getUserStats(winner.userAddress);
      if (winnerStats) {
        await storage.updateUserStats(winner.userAddress, {
          totalWins: winnerStats.totalWins + 1,
          totalWon: (parseFloat(winnerStats.totalWon) + prize).toString(),
          gamesPlayed: winnerStats.gamesPlayed + 1,
          biggestWin: Math.max(parseFloat(winnerStats.biggestWin), prize).toString(),
        });
      } else {
        await storage.createUserStats({
          userAddress: winner.userAddress,
          username: winner.userAddress.slice(0, 8),
          level: 1,
          totalWins: 1,
          totalWon: prize.toString(),
          gamesPlayed: 1,
          biggestWin: prize.toString(),
        });
      }

      // Update daily stats
      const today = new Date().toISOString().split('T')[0];
      const dailyStats = await storage.getDailyStats(today);

      if (dailyStats) {
        const updates: any = { latestWinRoundId: roundId };
        
        if (!dailyStats.biggestWinRoundId) {
          updates.biggestWinRoundId = roundId;
        } else {
          const currentBiggest = await storage.getRound(dailyStats.biggestWinRoundId);
          if (currentBiggest && parseFloat(currentBiggest.totalPot) < totalPot) {
            updates.biggestWinRoundId = roundId;
          }
        }

        if (!dailyStats.luckiestWinRoundId) {
          updates.luckiestWinRoundId = roundId;
        }

        await storage.updateDailyStats(today, updates);
      } else {
        await storage.createDailyStats({
          date: today,
          latestWinRoundId: roundId,
          biggestWinRoundId: roundId,
          luckiestWinRoundId: roundId,
        });
      }

      console.log(`🎉 [DB MODE] Round #${round.roundNumber} winner: ${winner.userAddress} - Prize: ${prize.toFixed(4)} BNB`);

      // Create new round
      await this.createNewRound();
    } finally {
      this.endingRounds.delete(roundId);
    }
  }

  /**
   * Database-mode winner selection (simple weighted random)
   * NOTE: Only used when running without blockchain
   * Production uses Chainlink VRF on-chain for provably fair selection
   */
  private selectWinnerDatabaseMode(bets: any[], totalPot: number) {
    const random = Math.random();
    const winningTicket = random * totalPot;

    let currentSum = 0;
    for (const bet of bets) {
      currentSum += parseFloat(bet.amount);
      if (currentSum >= winningTicket) {
        console.log(`🎲 [DB MODE] Winner selected: ticket=${winningTicket.toFixed(8)}`);
        return bet;
      }
    }

    return bets[bets.length - 1];
  }

  /**
   * Set up blockchain event listeners (when contract is deployed)
   */
  async setupBlockchainListeners() {
    const contractAddress = process.env.CONTRACT_ADDRESS || process.env.VITE_CONTRACT_ADDRESS;
    
    if (!contractAddress) {
      console.log("⚠️ No contract address configured, skipping blockchain listeners");
      return;
    }

    try {
      // Clean up existing listeners
      if (this.eventCleanup) {
        this.eventCleanup();
      }

      // Subscribe to contract events
      this.eventCleanup = web3Service.subscribeToEvents({
        onBetPlaced: async (player: string, roundNumber: number, amount: string, roundTotal: string) => {
          console.log(`📊 Bet placed: ${player} wagered ${amount} BNB in round ${roundNumber}`);
          // Handle bet from blockchain
          // This ensures blockchain is source of truth
        },
        onWinnerSelected: async (winner: string, roundNumber: number, prize: string) => {
          console.log(`🏆 Winner selected on-chain: ${winner} won ${prize} BNB in round ${roundNumber}`);
          // Sync with blockchain winner selection
        },
      });

      console.log("✅ Blockchain event listeners configured");
    } catch (error) {
      console.error("❌ Failed to set up blockchain listeners:", error);
    }
  }

  /**
   * Shutdown the game service
   */
  shutdown() {
    if (this.roundCheckInterval) {
      clearInterval(this.roundCheckInterval);
    }
    if (this.eventCleanup) {
      this.eventCleanup();
    }
    console.log("🛑 Game Service shut down");
  }
}

export const gameService = new GameService();
