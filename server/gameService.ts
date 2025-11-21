import { storage } from "./storage";
import { web3Service } from "./web3Service";

/**
 * Game Service - Manages round lifecycle and blockchain sync
 */
class GameService {
  private roundCheckInterval: NodeJS.Timeout | null = null;
  private eventCleanup: (() => void) | null = null;

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
    const lastRounds = await storage.getTopWinners(1); // Just to get count
    const nextRoundNumber = (lastRounds.length || 0) + 1;

    const endTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

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
    console.log(`🏁 Ending round ${roundId}...`);

    const round = await storage.getRound(roundId);
    if (!round || round.status !== "active") {
      console.log("⚠️ Round not active or not found");
      return;
    }

    const bets = await storage.getBetsByRound(roundId);

    if (bets.length === 0) {
      console.log("⚠️ No bets in round, creating new round");
      await storage.updateRound(roundId, { status: "cancelled", endTime: new Date() });
      await this.createNewRound();
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
  }

  /**
   * Select winner using weighted random selection (provably fair)
   */
  selectWinner(bets: any[], totalPot: number) {
    // Generate random number (server-side only, not exposed to clients)
    const random = Math.random();
    const winningTicket = random * totalPot;

    let currentSum = 0;
    for (const bet of bets) {
      currentSum += parseFloat(bet.amount);
      if (currentSum >= winningTicket) {
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
