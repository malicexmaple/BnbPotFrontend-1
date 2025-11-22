/**
 * Blockchain Event Listener Service
 * Listens to on-chain events and syncs them to the database
 * 
 * ARCHITECTURE:
 * - Blockchain is the source of truth for:
 *   • Bet placement and amounts
 *   • Winner selection
 *   • Round lifecycle and timing
 * - Database is a read-optimized cache for UI performance
 * - This service ensures database mirrors blockchain state
 * 
 * @author BNBPOT Development Team
 */

import { ethers } from "ethers";
import type { IStorage } from "./storage";

const JACKPOT_CAROUSEL_ABI = [
  "event BetPlaced(uint256 indexed roundId, address indexed bettor, uint256 amount, uint256 playerTotal, uint256 cumulativePool, uint256 timestamp)",
  "event RoundStarted(uint256 indexed roundId, uint256 startTimestamp, uint256 deadlineTimestamp)",
  "event RoundSettling(uint256 indexed roundId, uint256 vrfRequestId)",
  "event WinnerSelected(uint256 indexed roundId, address indexed winner, uint256 winningAmount, uint256 randomness, uint256 timestamp)",
  "event PayoutCompleted(uint256 indexed roundId, address indexed winner, uint256 amount)",
  "event HouseFeeCollected(uint256 indexed roundId, uint256 amount)",
  
  // Read functions
  "function getCurrentRound() view returns (uint256 id, uint256 startTimestamp, uint256 deadlineTimestamp, uint256 totalPot, address winner, uint8 status, uint256 playerCount)",
  "function getPlayerBet(uint256 roundId, address player) view returns (uint256)",
  "function getPlayers(uint256 roundId) view returns (address[])",
];

export class BlockchainEventListener {
  private provider: ethers.JsonRpcProvider | null = null;
  private contract: ethers.Contract | null = null;
  private storage: IStorage;
  private isListening = false;
  
  constructor(storage: IStorage) {
    this.storage = storage;
  }
  
  /**
   * Initialize connection to blockchain
   * @param rpcUrl RPC endpoint URL
   * @param contractAddress Deployed contract address
   */
  async initialize(rpcUrl: string, contractAddress: string) {
    if (!rpcUrl || !contractAddress) {
      console.log("⚠️ Blockchain config missing - running in database-only mode");
      console.log("   To enable blockchain integration:");
      console.log("   1. Deploy contract using: cd contracts && npx hardhat run scripts/deploy.ts");
      console.log("   2. Set VITE_CONTRACT_ADDRESS in .env");
      console.log("   3. Set VITE_BSC_RPC_URL in .env");
      return;
    }
    
    try {
      console.log("🔗 Connecting to blockchain...");
      console.log("   RPC:", rpcUrl);
      console.log("   Contract:", contractAddress);
      
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.contract = new ethers.Contract(contractAddress, JACKPOT_CAROUSEL_ABI, this.provider);
      
      // Test connection
      const network = await this.provider.getNetwork();
      console.log("✅ Connected to blockchain");
      console.log("   Network:", network.name);
      console.log("   Chain ID:", network.chainId.toString());
      
      // Sync current state
      await this.syncCurrentRound();
      
      // Start listening
      this.startListening();
    } catch (error) {
      console.error("❌ Failed to connect to blockchain:", error);
      console.log("   Continuing in database-only mode");
    }
  }
  
  /**
   * Sync current round state from blockchain to database
   */
  private async syncCurrentRound() {
    if (!this.contract) return;
    
    try {
      const roundData = await this.contract.getCurrentRound();
      const onChainRoundId = Number(roundData.id);
      
      console.log("📊 Current on-chain round:", {
        roundId: onChainRoundId,
        totalPot: ethers.formatEther(roundData.totalPot),
        status: roundData.status,
        playerCount: Number(roundData.playerCount)
      });
      
      // Sync round to database
      const currentDbRound = await this.storage.getCurrentRound();
      
      if (!currentDbRound || currentDbRound.roundNumber < onChainRoundId) {
        // Create missing round in database
        await this.storage.createRound({
          roundNumber: onChainRoundId,
          totalPot: ethers.formatEther(roundData.totalPot),
          status: this.mapStatus(roundData.status),
          endTime: null,
          countdownStart: null,
          winnerAddress: roundData.winner !== ethers.ZeroAddress ? roundData.winner : null,
          winnerId: null,
          txHash: null,
        });
        console.log("✅ Round synced to database");
      }
    } catch (error) {
      console.error("Failed to sync current round:", error);
    }
  }
  
  /**
   * Start listening to blockchain events
   */
  private startListening() {
    if (!this.contract || this.isListening) return;
    
    console.log("👂 Starting blockchain event listeners...");
    console.log("   Listening for: BetPlaced, RoundStarted, WinnerSelected");
    
    // Listen to BetPlaced events
    this.contract.on("BetPlaced", async (
      roundId: bigint,
      bettor: string,
      amount: bigint,
      playerTotal: bigint,
      cumulativePool: bigint,
      timestamp: bigint
    ) => {
      console.log("🎲 BetPlaced event:", {
        roundId: roundId.toString(),
        bettor,
        amount: ethers.formatEther(amount),
        cumulativePool: ethers.formatEther(cumulativePool)
      });
      
      try {
        const onChainRoundId = Number(roundId);
        
        // Get or create user by wallet address
        let user = await this.storage.getUserByWalletAddress(bettor);
        if (!user) {
          const shortAddr = bettor.slice(0, 8);
          user = await this.storage.createOrUpdateUserByWallet(
            bettor,
            `Player_${shortAddr}`,
            undefined
          );
          console.log("   Created user:", user.username);
        }
        
        // Get or create round by on-chain round ID (not getCurrentRound!)
        let dbRound = await this.storage.getRoundByNumber(onChainRoundId);
        if (!dbRound) {
          console.log(`   Creating round #${onChainRoundId} from BetPlaced event`);
          dbRound = await this.storage.createRound({
            roundNumber: onChainRoundId,
            totalPot: "0",
            status: "waiting", // Will be updated by RoundStarted event
            endTime: null,
            countdownStart: null,
            winnerAddress: null,
            winnerId: null,
            txHash: null,
          });
        }
        
        // Create bet in database linked to correct round
        await this.storage.createBet({
          roundId: dbRound.id,
          userAddress: bettor,
          userId: user.id,
          amount: ethers.formatEther(amount),
          txHash: "0x", // TX hash not available in event
        });
        
        // Update round total pot
        await this.storage.updateRound(dbRound.id, {
          totalPot: ethers.formatEther(cumulativePool)
        });
        
        console.log("✅ Bet synced to database");
      } catch (error) {
        console.error("Failed to process BetPlaced event:", error);
      }
    });
    
    // Listen to RoundStarted events
    this.contract.on("RoundStarted", async (
      roundId: bigint,
      startTimestamp: bigint,
      deadlineTimestamp: bigint
    ) => {
      console.log("🎮 RoundStarted event:", {
        roundId: roundId.toString(),
        deadline: new Date(Number(deadlineTimestamp) * 1000).toISOString()
      });
      
      try {
        const onChainRoundId = Number(roundId);
        
        // Get or create round by on-chain round ID (consistent with other handlers)
        let dbRound = await this.storage.getRoundByNumber(onChainRoundId);
        
        if (dbRound) {
          // Update existing round to active
          await this.storage.updateRound(dbRound.id, {
            status: "active",
            countdownStart: new Date(Number(startTimestamp) * 1000),
            endTime: null, // End time set when round completes
          });
          console.log("✅ Round activated in database");
        } else {
          // Create new round
          dbRound = await this.storage.createRound({
            roundNumber: onChainRoundId,
            status: "active",
            totalPot: "0",
            countdownStart: new Date(Number(startTimestamp) * 1000),
            endTime: null,
            winnerAddress: null,
            winnerId: null,
            txHash: null,
          });
          console.log("✅ New round created in database");
        }
      } catch (error) {
        console.error("Failed to process RoundStarted event:", error);
      }
    });
    
    // Listen to WinnerSelected events
    this.contract.on("WinnerSelected", async (
      roundId: bigint,
      winner: string,
      winningAmount: bigint,
      randomness: bigint,
      timestamp: bigint
    ) => {
      console.log("🏆 WinnerSelected event:", {
        roundId: roundId.toString(),
        winner,
        prize: ethers.formatEther(winningAmount)
      });
      
      try {
        const onChainRoundId = Number(roundId);
        
        // Get or create winner user
        let user = await this.storage.getUserByWalletAddress(winner);
        if (!user) {
          console.log("   Winner not in database, creating user...");
          const shortAddr = winner.slice(0, 8);
          user = await this.storage.createOrUpdateUserByWallet(
            winner,
            `Player_${shortAddr}`,
            undefined
          );
        }
        
        // Get round by on-chain round ID (not getCurrentRound!)
        const dbRound = await this.storage.getRoundByNumber(onChainRoundId);
        if (!dbRound) {
          console.error(`   Round #${onChainRoundId} not found in database!`);
          return;
        }
        
        // Update round with winner
        await this.storage.updateRound(dbRound.id, {
          status: "completed",
          winnerAddress: winner,
          winnerId: user.id,
          endTime: new Date(Number(timestamp) * 1000),
        });
        
        console.log("✅ Winner synced to database");
      } catch (error) {
        console.error("Failed to process WinnerSelected event:", error);
      }
    });
    
    this.isListening = true;
    console.log("✅ Blockchain event listeners active");
    console.log("   Database will auto-sync with blockchain events");
  }
  
  /**
   * Stop listening to events
   */
  stopListening() {
    if (this.contract && this.isListening) {
      this.contract.removeAllListeners();
      this.isListening = false;
      console.log("🔇 Blockchain event listeners stopped");
    }
  }
  
  /**
   * Map blockchain status to database status
   * @param blockchainStatus Contract status enum value
   * @returns Database status string
   */
  private mapStatus(blockchainStatus: number): "waiting" | "active" | "completed" {
    // 0 = Inactive, 1 = Active, 2 = Settling, 3 = Settled
    if (blockchainStatus === 0) return "waiting";
    if (blockchainStatus === 1) return "active";
    // Both Settling and Settled map to completed in database
    return "completed";
  }
}

// Singleton instance
let eventListenerInstance: BlockchainEventListener | null = null;

export function getEventListener(storage: IStorage): BlockchainEventListener {
  if (!eventListenerInstance) {
    eventListenerInstance = new BlockchainEventListener(storage);
  }
  return eventListenerInstance;
}
