/**
 * Blockchain Event Listener Service
 * Listens to on-chain events and syncs them to the database
 * 
 * This service ensures the database reflects the blockchain state
 * The blockchain is the source of truth for:
 * - Bet placement
 * - Winner selection
 * - Round lifecycle
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
   */
  async initialize(rpcUrl: string, contractAddress: string) {
    if (!rpcUrl || !contractAddress) {
      console.log("⚠️ Blockchain config missing - running in database-only mode");
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
      console.log("✅ Connected to network:", network.name, "Chain ID:", network.chainId.toString());
      
      // Sync current state
      await this.syncCurrentRound();
      
      // Start listening
      this.startListening();
    } catch (error) {
      console.error("❌ Failed to connect to blockchain:", error);
      throw error;
    }
  }
  
  /**
   * Sync current round state from blockchain to database
   */
  private async syncCurrentRound() {
    if (!this.contract) return;
    
    try {
      const roundData = await this.contract.getCurrentRound();
      
      console.log("📊 Current round from blockchain:", {
        roundId: roundData.id.toString(),
        totalPot: ethers.formatEther(roundData.totalPot),
        status: roundData.status,
        playerCount: Number(roundData.playerCount)
      });
      
      // TODO: Sync to database when storage methods are implemented
      console.log("✅ Round state retrieved from blockchain");
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
    
    // Listen to BetPlaced events
    this.contract.on("BetPlaced", async (
      roundId: bigint,
      bettor: string,
      amount: bigint,
      playerTotal: bigint,
      cumulativePool: bigint,
      timestamp: bigint
    ) => {
      console.log("🎲 BetPlaced event detected:", {
        roundId: roundId.toString(),
        bettor,
        amount: ethers.formatEther(amount)
      });
      
      try {
        // TODO: Sync bet to database
        // For now, just log the event
        console.log("✅ Bet event detected - would sync to database");
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
      console.log("🎮 RoundStarted event detected:", {
        roundId: roundId.toString(),
        deadline: new Date(Number(deadlineTimestamp) * 1000).toISOString()
      });
      
      try {
        // TODO: Sync round start to database
        console.log("✅ Round started event detected - would sync to database");
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
      console.log("🏆 WinnerSelected event detected:", {
        roundId: roundId.toString(),
        winner,
        prize: ethers.formatEther(winningAmount)
      });
      
      try {
        // TODO: Sync winner to database
        console.log("✅ Winner selected event detected - would sync to database");
      } catch (error) {
        console.error("Failed to process WinnerSelected event:", error);
      }
    });
    
    this.isListening = true;
    console.log("✅ Blockchain event listeners active");
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
   */
  private mapStatus(blockchainStatus: number): "waiting" | "active" | "completed" {
    // 0 = Inactive, 1 = Active, 2 = Settling, 3 = Settled
    if (blockchainStatus === 0) return "waiting";
    if (blockchainStatus === 1) return "active";
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
