import { storage } from "./storage";

class AirdropService {
  private distributionInterval: NodeJS.Timeout | null = null;
  private lastDistributionCheck: string | null = null;

  async initialize() {
    console.log("🎁 Initializing Airdrop Service...");
    
    const pool = await storage.getAirdropPool();
    if (!pool) {
      console.log("   ⚠️ Airdrop pool not found in database");
      console.log("   Please ensure airdrop_pool table is initialized");
    } else {
      console.log(`   Current pool balance: ${pool.balance} BNB`);
    }
    
    this.startDistributionScheduler();
    
    console.log("✅ Airdrop Service initialized");
  }

  startDistributionScheduler() {
    this.distributionInterval = setInterval(async () => {
      const now = new Date();
      const todayUTC = now.toISOString().split('T')[0];
      
      if (this.lastDistributionCheck !== todayUTC) {
        const pool = await storage.getAirdropPool();
        if (pool && pool.lastDistributionDate !== todayUTC) {
          await this.distributeAirdrop();
        }
        this.lastDistributionCheck = todayUTC;
      }
    }, 60 * 60 * 1000);
    
    console.log("⏰ Airdrop distribution scheduler started (checks hourly for daily distribution)");
  }

  async distributeAirdrop() {
    console.log("🎁 Starting daily airdrop distribution...");
    
    try {
      await storage.distributeAirdropTransaction();
      console.log("✅ Airdrop distribution completed");
    } catch (error) {
      if (error instanceof Error && error.message.includes("No funds")) {
        console.log("   No funds to distribute");
      } else if (error instanceof Error && error.message.includes("No eligible")) {
        console.log("   No eligible users (no bets in last 24 hours)");
      } else {
        console.error("❌ Failed to distribute airdrop:", error);
      }
    }
  }

  async addToPool(amount: string, source: string = "system") {
    const pool = await storage.getAirdropPool();
    if (!pool) {
      console.error("❌ Airdrop pool not found");
      return;
    }

    const newBalance = (parseFloat(pool.balance) + parseFloat(amount)).toString();
    await storage.updateAirdropPool({ balance: newBalance });
    
    console.log(`💰 Added ${amount} BNB to airdrop pool from ${source}`);
  }

  async addTip(userAddress: string, amount: string, txHash?: string) {
    await storage.createAirdropTip({
      userAddress,
      userId: null,
      amount,
      txHash: txHash || null,
    });

    await this.addToPool(amount, `tip from ${userAddress}`);
  }

  shutdown() {
    if (this.distributionInterval) {
      clearInterval(this.distributionInterval);
      console.log("🛑 Airdrop distribution scheduler stopped");
    }
  }
}

export const airdropService = new AirdropService();
