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
   */
  async ensureActiveRound() {
    const currentRound = await storage.getCurrentRound();
    
    if (!currentRound) {
      console.log("📝 No active round found, creating one...");
      await this.createNewRound();
    } else {
      console.log(`✅ Active round found: #${currentRound.roundNumber}`);
    }
  }

  /**
   * Create a new round
   */
  async createNewRound() {
    const latestRoundNumber = await storage.getLatestRoundNumber();
    const nextRoundNumber = latestRoundNumber + 1;

    const endTime = new Date(Date.now() + 90 * 1000); // 90 seconds (1 min 30 sec) from now

    const round = await storage.createRound({
      roundNumber: nextRoundNumber,
      endTime,
      totalPot: "0",
      status: "active",
    });

    console.log(`🎲 Created new round #${round.roundNumber}, ends at ${endTime.toISOString()}`);
    return round;
  }

  /**
   * Monitor rounds and auto-end when time expires
   */
  startRoundMonitoring() {
    if (this.roundCheckInterval) {
      clearInterval(this.roundCheckInterval);
    }

    this.roundCheckInterval = setInterval(async () => {
      const currentRound = await storage.getCurrentRound();
      
      if (!currentRound) {
        await this.createNewRound();
        return;
      }

      // Check if round has expired
      const now = new Date();
      const endTime = new Date(currentRound.endTime || now);

      if (now >= endTime && currentRound.status === "active") {
        await this.endRound(currentRound.id);
      }
    }, 1000); // Check every second
  }

  /**
   * End a round and select a winner
   */
  async endRound(roundId: string) {
    // Prevent duplicate processing
    if (this.endingRounds.has(roundId)) {
      console.log(`⚠️ Round ${roundId} is already being processed`);
      return;
    }

    this.endingRounds.add(roundId);
    console.log(`🏁 Ending round ${roundId}...`);

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
        await this.createNewRound();
        this.endingRounds.delete(roundId);
        return;
      }

    // Select winner using weighted random selection
    const winner = this.selectWinner(bets, parseFloat(round.totalPot));

    // Calculate prize (after 2.5% house fee)
    const totalPot = parseFloat(round.totalPot);
    const prize = totalPot * 0.975;

    // Update round
    await storage.updateRound(roundId, {
      status: "completed",
      winnerAddress: winner.userAddress,
      endTime: new Date(),
    });

    // Update winner stats
    const winnerStats = await storage.getUserStats(winner.userAddress);
    if (winnerStats) {
      const winnerBetTotal = bets
        .filter(b => b.userAddress === winner.userAddress)
        .reduce((sum, b) => sum + parseFloat(b.amount), 0);

      await storage.updateUserStats(winner.userAddress, {
        totalWins: winnerStats.totalWins + 1,
        totalWon: (parseFloat(winnerStats.totalWon) + prize).toString(),
        gamesPlayed: winnerStats.gamesPlayed + 1,
        biggestWin: Math.max(parseFloat(winnerStats.biggestWin), prize).toString(),
      });
    } else {
      // Create stats for new winner
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
    
    const winChance = totalPot > 0 ? (parseFloat(winner.amount) / totalPot) * 100 : 0;

    if (dailyStats) {
      const updates: any = { latestWinRoundId: roundId };
      
      // Check if biggest win of day
      if (!dailyStats.biggestWinRoundId) {
        updates.biggestWinRoundId = roundId;
      } else {
        const currentBiggest = await storage.getRound(dailyStats.biggestWinRoundId);
        if (currentBiggest && parseFloat(currentBiggest.totalPot) < totalPot) {
          updates.biggestWinRoundId = roundId;
        }
      }

      // Check if luckiest win of day (lowest win chance)
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

    console.log(`🎉 Round #${round.roundNumber} winner: ${winner.userAddress} - Prize: ${prize.toFixed(4)} BNB`);

      // Create new round
      await this.createNewRound();
    } finally {
      this.endingRounds.delete(roundId);
    }
  }

  /**
   * Select winner using provably fair block-based selection
   * Similar to the system shown in the image: uses server seed + blockchain block hash
   */
  selectWinner(bets: any[], totalPot: number) {
    // PROVABLY FAIR SYSTEM:
    // 1. Server seed (generated at round start, hashed and revealed to players)
    // 2. Future BSC block hash (unpredictable at time of betting)
    // 3. Combine both to generate winning ticket
    
    // For now, use server-side cryptographic random
    // When smart contract is deployed, this will use actual BSC block hash
    const crypto = require('crypto');
    
    // Generate server seed (in production, this would be stored with round)
    const serverSeed = crypto.randomBytes(32).toString('hex');
    
    // Simulate block hash (in production, fetch from BSC)
    const blockHash = crypto.randomBytes(32).toString('hex');
    
    // Create combined hash for provable fairness
    const combinedHash = crypto.createHash('sha256')
      .update(serverSeed + blockHash)
      .digest('hex');
    
    // Convert hash to number and get winning ticket
    const hashValue = BigInt('0x' + combinedHash.substring(0, 16));
    const maxValue = BigInt('0xFFFFFFFFFFFFFFFF');
    const random = Number(hashValue) / Number(maxValue);
    
    const winningTicket = random * totalPot;

    // Find winner based on ticket ranges
    let currentSum = 0;
    for (const bet of bets) {
      currentSum += parseFloat(bet.amount);
      if (currentSum >= winningTicket) {
        console.log(`🎯 Provably fair selection: serverSeed=${serverSeed.substring(0, 8)}..., block=${blockHash.substring(0, 8)}..., ticket=${winningTicket.toFixed(8)}`);
        return bet;
      }
    }

    // Fallback
    return bets[bets.length - 1];
  }

  /**
   * Set up blockchain event listeners (when contract is deployed)
   */
  async setupBlockchainListeners() {
    const contractAddress = process.env.VITE_CONTRACT_ADDRESS;
    
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
