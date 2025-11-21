/**
 * Contract Keeper Service
 * 
 * This service monitors the smart contract and automatically calls endRound()
 * when the timer expires. This prevents funds from being locked forever.
 * 
 * IMPORTANT: Without this keeper, rounds will never end and funds remain locked!
 */

import { ethers } from 'ethers';

const JACKPOT_ABI = [
  "function getCurrentRound() external view returns (uint256 id, uint256 startTime, uint256 endTime, uint256 totalPot, uint256 playerCount, bool isActive, bool isCompleted)",
  "function endRound() external",
  "function getTimeRemaining() external view returns (uint256)",
  "event RoundStarted(uint256 indexed roundId, uint256 startTime)",
  "event RoundEnded(uint256 indexed roundId, address indexed winner, uint256 prize)",
];

interface KeeperConfig {
  contractAddress: string;
  rpcUrl: string;
  privateKey: string;
  checkInterval?: number; // How often to check (default: 10 seconds)
}

export class ContractKeeper {
  private contract: ethers.Contract | null = null;
  private provider: ethers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;
  private isRunning = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private config: KeeperConfig;

  constructor(config: KeeperConfig) {
    this.config = {
      ...config,
      checkInterval: config.checkInterval || 10000, // Default 10 seconds
    };
  }

  /**
   * Initialize the keeper and start monitoring
   */
  async start() {
    if (this.isRunning) {
      console.log("⚠️ Keeper already running");
      return;
    }

    // Validate configuration
    if (!this.config.contractAddress) {
      console.log("⚠️ No contract address configured, keeper disabled");
      return;
    }

    if (!this.config.privateKey) {
      console.log("⚠️ No keeper private key configured, keeper disabled");
      return;
    }

    try {
      // Initialize provider and wallet
      this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
      this.wallet = new ethers.Wallet(this.config.privateKey, this.provider);
      this.contract = new ethers.Contract(
        this.config.contractAddress,
        JACKPOT_ABI,
        this.wallet
      );

      // Verify connection
      const network = await this.provider.getNetwork();
      console.log("✅ Keeper connected to network:", network.name, "Chain ID:", network.chainId);
      console.log("✅ Keeper wallet:", await this.wallet.getAddress());
      console.log("✅ Monitoring contract:", this.config.contractAddress);

      // Start monitoring
      this.isRunning = true;
      this.checkInterval = setInterval(() => this.checkAndEndRound(), this.config.checkInterval);
      
      // Also check immediately
      await this.checkAndEndRound();

      console.log("✅ Contract keeper started");
    } catch (error) {
      console.error("❌ Failed to start keeper:", error);
      this.stop();
    }
  }

  /**
   * Stop the keeper
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    console.log("🛑 Contract keeper stopped");
  }

  /**
   * Check if round should be ended and execute if needed
   */
  private async checkAndEndRound() {
    if (!this.contract) return;

    try {
      // Get current round info
      const roundInfo = await this.contract.getCurrentRound();
      const timeRemaining = await this.contract.getTimeRemaining();

      // Check if round needs to be ended
      const shouldEnd = roundInfo.isActive && 
                       roundInfo.playerCount > 0n && 
                       timeRemaining === 0n;

      if (shouldEnd) {
        console.log("⏰ Round timer expired, ending round...");
        console.log("   Round ID:", roundInfo.id.toString());
        console.log("   Players:", roundInfo.playerCount.toString());
        console.log("   Total Pot:", ethers.formatEther(roundInfo.totalPot), "BNB");

        try {
          // Call endRound with explicit gas limit
          const tx = await this.contract.endRound({
            gasLimit: 500000, // Explicit gas limit for safety
          });

          console.log("📝 Transaction sent:", tx.hash);
          const receipt = await tx.wait();
          console.log("✅ Round ended successfully in block:", receipt.blockNumber);
          
          // Parse events to find winner
          const endEvent = receipt.logs
            .map((log: any) => {
              try {
                return this.contract!.interface.parseLog(log);
              } catch {
                return null;
              }
            })
            .find((event: any) => event && event.name === 'RoundEnded');

          if (endEvent) {
            console.log("🏆 Winner:", endEvent.args.winner);
            console.log("💰 Prize:", ethers.formatEther(endEvent.args.prize), "BNB");
          }
        } catch (endError: any) {
          // Log but don't crash - will try again next interval
          console.error("❌ Failed to end round:", endError.message);
          
          if (endError.message.includes("insufficient funds")) {
            console.error("⚠️ Keeper wallet needs more BNB for gas!");
          }
        }
      }
    } catch (error: any) {
      // Log but don't crash - continue monitoring
      console.error("⚠️ Error checking round status:", error.message);
    }
  }

  /**
   * Get keeper status info
   */
  async getStatus() {
    if (!this.contract || !this.wallet || !this.provider) {
      return { running: false };
    }

    try {
      const balance = await this.provider.getBalance(await this.wallet.getAddress());
      const roundInfo = await this.contract.getCurrentRound();
      const timeRemaining = await this.contract.getTimeRemaining();

      return {
        running: this.isRunning,
        keeperAddress: await this.wallet.getAddress(),
        keeperBalance: ethers.formatEther(balance),
        currentRoundId: roundInfo.id.toString(),
        roundActive: roundInfo.isActive,
        timeRemaining: timeRemaining.toString(),
        checkInterval: this.config.checkInterval,
      };
    } catch (error) {
      return {
        running: this.isRunning,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Singleton instance
let keeperInstance: ContractKeeper | null = null;

/**
 * Initialize and start the contract keeper
 */
export function startContractKeeper() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const rpcUrl = process.env.BSC_TESTNET_RPC || 'https://data-seed-prebsc-1-s1.bnbchain.org:8545';
  const privateKey = process.env.KEEPER_PRIVATE_KEY;

  if (!contractAddress) {
    console.log("⚠️ No contract address configured, skipping keeper");
    return null;
  }

  if (!privateKey) {
    console.log("⚠️ No keeper private key configured, skipping keeper");
    return null;
  }

  if (keeperInstance) {
    console.log("⚠️ Keeper already initialized");
    return keeperInstance;
  }

  keeperInstance = new ContractKeeper({
    contractAddress,
    rpcUrl,
    privateKey,
    checkInterval: 10000, // Check every 10 seconds
  });

  keeperInstance.start();
  return keeperInstance;
}

/**
 * Stop the contract keeper
 */
export function stopContractKeeper() {
  if (keeperInstance) {
    keeperInstance.stop();
    keeperInstance = null;
  }
}

/**
 * Get keeper instance (if initialized)
 */
export function getKeeperInstance() {
  return keeperInstance;
}
