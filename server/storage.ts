import { 
  type User, type InsertUser, 
  type ChatMessage, type InsertChatMessage,
  type Round, type InsertRound,
  type Bet, type InsertBet,
  type UserStats, type InsertUserStats,
  type DailyStats, type InsertDailyStats,
  type AirdropPool, type InsertAirdropPool,
  type AirdropDistribution, type InsertAirdropDistribution,
  type AirdropRecipient, type InsertAirdropRecipient,
  type AirdropTip, type InsertAirdropTip,
  type Market, type InsertMarket,
  type MarketBet, type InsertMarketBet,
  type SportsVisibility, type InsertSportsVisibility,
  type LeaguesVisibility, type InsertLeaguesVisibility,
  type CustomMedia, type InsertCustomMedia,
  type VisibilitySetting, type InsertVisibilitySetting,
  type CustomLeague, type InsertCustomLeague,
  users, chatMessages, rounds, bets, userStats, dailyStats,
  airdropPool, airdropDistributions, airdropRecipients, airdropTips,
  markets, marketBets, sportsVisibility, leaguesVisibility, customMedia,
  visibilitySettings, customLeagues
} from "@shared/schema";
import { randomUUID, randomBytes } from "crypto";
import { db } from "./db";
import { eq, desc, and, or, sql } from "drizzle-orm";

// Generate a cryptographically secure client seed (32 bytes = 64 hex characters)
function generateClientSeed(): string {
  return randomBytes(32).toString('hex');
}

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createOrUpdateUserByWallet(walletAddress: string, username: string, email?: string): Promise<User>;
  updateUserProfile(walletAddress: string, data: { avatarUrl?: string; clientSeed?: string; username?: string; email?: string }): Promise<User | undefined>;
  setUserRole(walletAddress: string, role: string): Promise<User | undefined>;
  hasAnyAdmin(): Promise<boolean>;
  
  // Chat methods
  getChatMessages(limit?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Round methods
  getCurrentRound(): Promise<Round | undefined>;
  getRound(id: string): Promise<Round | undefined>;
  getRoundByNumber(roundNumber: number): Promise<Round | undefined>;
  getLatestRoundNumber(): Promise<number>;
  createRound(round: InsertRound): Promise<Round>;
  updateRound(id: string, data: Partial<Round>): Promise<Round | undefined>;
  activateRoundIfWaiting(id: string, data: Partial<Round>): Promise<Round | undefined>;
  incrementRoundPot(id: string, amount: string): Promise<Round | undefined>;
  
  // Bet methods
  getBetsByRound(roundId: string): Promise<Bet[]>;
  createBet(bet: InsertBet): Promise<Bet>;
  placeBetTransaction(roundId: string, bet: InsertBet): Promise<{ bet: Bet; round: Round; roundActivated: boolean; allBets: Bet[] }>;
  
  // User stats methods
  getUserStats(userAddress: string): Promise<UserStats | undefined>;
  updateUserStats(userAddress: string, data: Partial<UserStats>): Promise<UserStats | undefined>;
  createUserStats(stats: InsertUserStats): Promise<UserStats>;
  getTopWinners(limit: number): Promise<UserStats[]>;
  
  // Daily stats methods
  getDailyStats(date: string): Promise<DailyStats | undefined>;
  updateDailyStats(date: string, data: Partial<DailyStats>): Promise<DailyStats | undefined>;
  createDailyStats(stats: InsertDailyStats): Promise<DailyStats>;
  
  // Airdrop methods
  getAirdropPool(): Promise<AirdropPool | undefined>;
  updateAirdropPool(data: Partial<AirdropPool>): Promise<AirdropPool | undefined>;
  createAirdropDistribution(distribution: InsertAirdropDistribution): Promise<AirdropDistribution>;
  createAirdropRecipients(recipients: InsertAirdropRecipient[]): Promise<AirdropRecipient[]>;
  createAirdropTip(tip: InsertAirdropTip): Promise<AirdropTip>;
  getAirdropDistributions(limit?: number): Promise<AirdropDistribution[]>;
  getAirdropRecipientsByDistribution(distributionId: string): Promise<AirdropRecipient[]>;
  getUserAirdropEarnings(userAddress: string): Promise<AirdropRecipient[]>;
  get24hBetVolume(userAddress: string, cutoffTime: Date): Promise<string>;
  getAllUsers24hBets(cutoffTime: Date): Promise<Array<{userAddress: string; betVolume: string}>>;
  distributeAirdropTransaction(): Promise<void>;
  
  // Market methods (admin)
  getAllMarkets(): Promise<Market[]>;
  getAllActiveMarkets(): Promise<Market[]>;
  getMarketById(id: string): Promise<Market | undefined>;
  createMarket(market: InsertMarket): Promise<Market>;
  updateMarketStatus(id: string, status: string): Promise<Market | undefined>;
  settleMarket(id: string, winningOutcome: string): Promise<Market | undefined>;
  
  // Market bet methods
  getMarketBetsByMarketId(marketId: string): Promise<MarketBet[]>;
  createMarketBet(bet: InsertMarketBet): Promise<MarketBet>;
  updateMarketBetStatus(id: string, status: string, actualPayout?: string): Promise<MarketBet | undefined>;
  
  // Sports/Leagues visibility methods (legacy)
  getSportsVisibility(): Promise<SportsVisibility[]>;
  getLeaguesVisibility(): Promise<LeaguesVisibility[]>;
  setSportVisibility(sportId: string, isHidden: boolean): Promise<SportsVisibility>;
  setLeagueVisibility(leagueId: string, sportId: string, isHidden: boolean): Promise<LeaguesVisibility>;
  
  // Unified visibility settings methods (new)
  getVisibilitySettings(): Promise<VisibilitySetting[]>;
  toggleSportVisibility(sportId: string, isVisible: boolean, userId?: string, manualOverride?: boolean): Promise<VisibilitySetting>;
  toggleLeagueVisibility(leagueId: string, sportId: string, isVisible: boolean, userId?: string, manualOverride?: boolean): Promise<VisibilitySetting>;
  resetSportToAuto(sportId: string): Promise<void>;
  resetLeagueToAuto(leagueId: string): Promise<void>;
  
  // Custom media methods
  getCustomMedia(entityType?: string): Promise<CustomMedia[]>;
  getCustomMediaByEntity(entityType: string, entityId: string): Promise<CustomMedia | undefined>;
  getCustomMediaByName(entityType: string, entityName: string): Promise<CustomMedia | undefined>;
  upsertCustomMedia(media: InsertCustomMedia): Promise<CustomMedia>;
  deleteCustomMedia(id: string): Promise<void>;
  
  // Custom leagues methods
  getCustomLeagues(sportId?: string): Promise<CustomLeague[]>;
  getCustomLeagueById(id: string): Promise<CustomLeague | undefined>;
  createCustomLeague(league: InsertCustomLeague): Promise<CustomLeague>;
  updateCustomLeague(id: string, data: Partial<InsertCustomLeague>): Promise<CustomLeague | undefined>;
  deleteCustomLeague(id: string): Promise<void>;
}

export class DbStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    const normalizedAddress = walletAddress.toLowerCase();
    const result = await db.select().from(users).where(eq(users.walletAddress, normalizedAddress)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async createOrUpdateUserByWallet(walletAddress: string, username: string, email?: string): Promise<User> {
    const normalizedAddress = walletAddress.toLowerCase();
    const existingUser = await this.getUserByWalletAddress(normalizedAddress);
    
    if (existingUser) {
      // Update existing user
      const result = await db.update(users)
        .set({ 
          username,
          email: email || existingUser.email,
          agreedToTerms: true,
          agreedAt: new Date()
        })
        .where(eq(users.walletAddress, normalizedAddress))
        .returning();
      return result[0];
    } else {
      // Create new user with normalized (lowercase) wallet address and unique client seed
      const result = await db.insert(users).values({
        walletAddress: normalizedAddress,
        username,
        email,
        password: 'N/A', // Required field, but not used for wallet-based auth
        agreedToTerms: true,
        agreedAt: new Date(),
        clientSeed: generateClientSeed()
      }).returning();
      return result[0];
    }
  }

  async updateUserProfile(walletAddress: string, data: { avatarUrl?: string; clientSeed?: string; username?: string; email?: string }): Promise<User | undefined> {
    const normalizedAddress = walletAddress.toLowerCase();
    const result = await db.update(users)
      .set(data)
      .where(eq(users.walletAddress, normalizedAddress))
      .returning();
    return result[0];
  }

  // Chat methods
  async getChatMessages(limit: number = 50): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages).orderBy(desc(chatMessages.timestamp)).limit(limit);
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const result = await db.insert(chatMessages).values(insertMessage).returning();
    return result[0];
  }

  // Round methods
  async getCurrentRound(): Promise<Round | undefined> {
    const result = await db.select().from(rounds)
      .where(or(eq(rounds.status, 'active'), eq(rounds.status, 'waiting')))
      .orderBy(desc(rounds.roundNumber))
      .limit(1);
    return result[0];
  }

  async getRound(id: string): Promise<Round | undefined> {
    const result = await db.select().from(rounds).where(eq(rounds.id, id)).limit(1);
    return result[0];
  }

  async getRoundByNumber(roundNumber: number): Promise<Round | undefined> {
    const result = await db.select().from(rounds).where(eq(rounds.roundNumber, roundNumber)).limit(1);
    return result[0];
  }

  async getLatestRoundNumber(): Promise<number> {
    const result = await db.select().from(rounds).orderBy(desc(rounds.roundNumber)).limit(1);
    return result[0]?.roundNumber || 0;
  }

  async createRound(insertRound: InsertRound): Promise<Round> {
    const result = await db.insert(rounds).values(insertRound).returning();
    return result[0];
  }

  async updateRound(id: string, data: Partial<Round>): Promise<Round | undefined> {
    const result = await db.update(rounds).set(data).where(eq(rounds.id, id)).returning();
    return result[0];
  }

  async activateRoundIfWaiting(id: string, data: Partial<Round>): Promise<Round | undefined> {
    // Atomic update: only succeeds if round status is currently 'waiting'
    // This prevents race conditions when multiple first bets arrive simultaneously
    const result = await db.update(rounds)
      .set(data)
      .where(and(eq(rounds.id, id), eq(rounds.status, 'waiting')))
      .returning();
    return result[0];
  }

  async incrementRoundPot(id: string, amount: string): Promise<Round | undefined> {
    // Atomic pot increment using SQL arithmetic to avoid read-modify-write race
    // This does: UPDATE rounds SET total_pot = CAST(total_pot AS NUMERIC) + amount WHERE id = ?
    const result = await db.update(rounds)
      .set({ 
        totalPot: sql`CAST(${rounds.totalPot} AS NUMERIC) + ${amount}::numeric`
      })
      .where(eq(rounds.id, id))
      .returning();
    return result[0];
  }

  // Bet methods
  async getBetsByRound(roundId: string): Promise<Bet[]> {
    try {
      const result = await db.select().from(bets).where(eq(bets.roundId, roundId));
      return result || [];
    } catch (error) {
      console.error(`Error fetching bets for round ${roundId}:`, error);
      return [];
    }
  }

  async createBet(insertBet: InsertBet): Promise<Bet> {
    const result = await db.insert(bets).values(insertBet).returning();
    return result[0];
  }

  async placeBetTransaction(roundId: string, betData: InsertBet): Promise<{ bet: Bet; round: Round; roundActivated: boolean; allBets: Bet[] }> {
    // Execute entire bet placement in a single atomic transaction
    // This prevents race conditions and ensures data consistency
    return await db.transaction(async (tx) => {
      // 1. Insert the bet
      const [bet] = await tx.insert(bets).values({
        ...betData,
        roundId,
      }).returning();

      // 2. Atomically increment pot using SQL arithmetic (safe from injection via parameterization)
      const [updatedRound] = await tx.update(rounds)
        .set({ 
          totalPot: sql`CAST(${rounds.totalPot} AS NUMERIC) + ${betData.amount}::numeric`
        })
        .where(eq(rounds.id, roundId))
        .returning();

      // 3. Get all bets for this round (includes the bet we just placed)
      const allBets = await tx.select().from(bets).where(eq(bets.roundId, roundId));
      const isFirstBet = allBets.length === 1;

      let roundActivated = false;

      // 4. If first bet, try to activate round (atomic conditional update)
      if (isFirstBet) {
        const now = new Date();
        const endTime = new Date(now.getTime() + 90 * 1000);

        const [activatedRound] = await tx.update(rounds)
          .set({
            status: "active",
            countdownStart: now,
            endTime,
          })
          .where(and(eq(rounds.id, roundId), eq(rounds.status, 'waiting')))
          .returning();

        if (activatedRound) {
          roundActivated = true;
          return { bet, round: activatedRound, roundActivated, allBets };
        }
      }

      return { bet, round: updatedRound, roundActivated, allBets };
    });
  }

  // User stats methods
  async getUserStats(userAddress: string): Promise<UserStats | undefined> {
    const result = await db.select().from(userStats).where(eq(userStats.userAddress, userAddress)).limit(1);
    return result[0];
  }

  async updateUserStats(userAddress: string, data: Partial<UserStats>): Promise<UserStats | undefined> {
    const result = await db.update(userStats).set(data).where(eq(userStats.userAddress, userAddress)).returning();
    return result[0];
  }

  async createUserStats(insertStats: InsertUserStats): Promise<UserStats> {
    const result = await db.insert(userStats).values(insertStats).returning();
    return result[0];
  }

  async getTopWinners(limit: number): Promise<UserStats[]> {
    return await db.select().from(userStats).orderBy(desc(userStats.totalWon)).limit(limit);
  }

  // Daily stats methods
  async getDailyStats(date: string): Promise<DailyStats | undefined> {
    const result = await db.select().from(dailyStats).where(eq(dailyStats.date, date)).limit(1);
    return result[0];
  }

  async updateDailyStats(date: string, data: Partial<DailyStats>): Promise<DailyStats | undefined> {
    const result = await db.update(dailyStats).set(data).where(eq(dailyStats.date, date)).returning();
    return result[0];
  }

  async createDailyStats(insertStats: InsertDailyStats): Promise<DailyStats> {
    const result = await db.insert(dailyStats).values(insertStats).returning();
    return result[0];
  }

  // Airdrop methods
  async getAirdropPool(): Promise<AirdropPool | undefined> {
    const result = await db.select().from(airdropPool).limit(1);
    return result[0];
  }

  async updateAirdropPool(data: Partial<AirdropPool>): Promise<AirdropPool | undefined> {
    const pool = await this.getAirdropPool();
    if (!pool) return undefined;
    
    const result = await db.update(airdropPool)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(airdropPool.id, pool.id))
      .returning();
    return result[0];
  }

  async distributeAirdropTransaction(): Promise<void> {
    return await db.transaction(async (tx) => {
      const today = new Date().toISOString().split('T')[0];
      
      const result = await tx.execute<AirdropPool>(sql`
        SELECT * FROM ${airdropPool} LIMIT 1 FOR UPDATE
      `);
      const pool = result.rows[0];
      if (!pool) throw new Error("Airdrop pool not found");
      
      if (pool.lastDistributionDate === today) {
        throw new Error("Distribution already completed today");
      }
      
      const poolBalance = parseFloat(pool.balance);
      if (poolBalance <= 0) {
        throw new Error("No funds to distribute");
      }
      
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const eligibleUsers = await tx
        .select({
          userAddress: bets.userAddress,
          betVolume: sql<string>`CAST(SUM(CAST(${bets.amount} AS NUMERIC)) AS TEXT)`
        })
        .from(bets)
        .where(sql`${bets.timestamp} >= ${cutoffTime}`)
        .groupBy(bets.userAddress);
      
      if (eligibleUsers.length === 0) {
        throw new Error("No eligible users");
      }
      
      const totalVolume = eligibleUsers.reduce((sum, u) => sum + parseFloat(u.betVolume), 0);
      if (totalVolume <= 0) {
        throw new Error("Total volume is zero");
      }
      
      const recipients = eligibleUsers.map(user => {
        const userVolume = parseFloat(user.betVolume);
        const userShare = (poolBalance * userVolume) / totalVolume;
        return {
          userAddress: user.userAddress,
          userId: null,
          amount: userShare.toString(),
          betVolume24h: user.betVolume,
        };
      });
      
      const [distribution] = await tx.insert(airdropDistributions).values({
        date: today,
        totalAmount: poolBalance.toString(),
        recipientCount: recipients.length,
      }).returning();
      
      const recipientRecords = recipients.map(r => ({
        ...r,
        distributionId: distribution.id,
      }));
      await tx.insert(airdropRecipients).values(recipientRecords);
      
      await tx.update(airdropPool)
        .set({
          balance: sql`CAST(CAST(${airdropPool.balance} AS NUMERIC) - ${poolBalance} AS TEXT)`,
          lastDistributionDate: today,
          totalDistributed: sql`CAST(CAST(${airdropPool.totalDistributed} AS NUMERIC) + ${poolBalance} AS TEXT)`,
          updatedAt: new Date()
        })
        .where(eq(airdropPool.id, pool.id));
      
      console.log(`   Distributed ${poolBalance} BNB to ${recipients.length} users`);
    });
  }

  async createAirdropDistribution(distribution: InsertAirdropDistribution): Promise<AirdropDistribution> {
    const result = await db.insert(airdropDistributions).values(distribution).returning();
    return result[0];
  }

  async createAirdropRecipients(recipients: InsertAirdropRecipient[]): Promise<AirdropRecipient[]> {
    if (recipients.length === 0) return [];
    const result = await db.insert(airdropRecipients).values(recipients).returning();
    return result;
  }

  async createAirdropTip(tip: InsertAirdropTip): Promise<AirdropTip> {
    const result = await db.insert(airdropTips).values(tip).returning();
    return result[0];
  }

  async getAirdropDistributions(limit: number = 10): Promise<AirdropDistribution[]> {
    return await db.select().from(airdropDistributions)
      .orderBy(desc(airdropDistributions.timestamp))
      .limit(limit);
  }

  async getAirdropRecipientsByDistribution(distributionId: string): Promise<AirdropRecipient[]> {
    return await db.select().from(airdropRecipients)
      .where(eq(airdropRecipients.distributionId, distributionId))
      .orderBy(desc(airdropRecipients.amount));
  }

  async getUserAirdropEarnings(userAddress: string): Promise<AirdropRecipient[]> {
    return await db.select().from(airdropRecipients)
      .where(eq(airdropRecipients.userAddress, userAddress))
      .orderBy(desc(airdropRecipients.timestamp));
  }

  async get24hBetVolume(userAddress: string, cutoffTime: Date): Promise<string> {
    const result = await db
      .select({ total: sql<string>`COALESCE(SUM(CAST(${bets.amount} AS NUMERIC)), 0)` })
      .from(bets)
      .where(and(
        eq(bets.userAddress, userAddress),
        sql`${bets.timestamp} >= ${cutoffTime}`
      ));
    return result[0]?.total || '0';
  }

  async getAllUsers24hBets(cutoffTime: Date): Promise<Array<{userAddress: string; betVolume: string}>> {
    const result = await db
      .select({
        userAddress: bets.userAddress,
        betVolume: sql<string>`CAST(SUM(CAST(${bets.amount} AS NUMERIC)) AS TEXT)`
      })
      .from(bets)
      .where(sql`${bets.timestamp} >= ${cutoffTime}`)
      .groupBy(bets.userAddress);
    return result;
  }

  // Admin methods
  async setUserRole(walletAddress: string, role: string): Promise<User | undefined> {
    const normalizedAddress = walletAddress.toLowerCase();
    const result = await db.update(users)
      .set({ role })
      .where(eq(users.walletAddress, normalizedAddress))
      .returning();
    return result[0];
  }

  async hasAnyAdmin(): Promise<boolean> {
    const result = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
    return result.length > 0;
  }

  // Market methods
  async getAllMarkets(): Promise<Market[]> {
    return await db.select().from(markets).orderBy(desc(markets.createdAt));
  }

  async getAllActiveMarkets(): Promise<Market[]> {
    return await db.select().from(markets)
      .where(eq(markets.status, 'active'))
      .orderBy(desc(markets.gameTime));
  }

  async getMarketById(id: string): Promise<Market | undefined> {
    const result = await db.select().from(markets).where(eq(markets.id, id)).limit(1);
    return result[0];
  }

  async createMarket(market: InsertMarket): Promise<Market> {
    const result = await db.insert(markets).values(market).returning();
    return result[0];
  }

  async updateMarketStatus(id: string, status: string): Promise<Market | undefined> {
    const result = await db.update(markets)
      .set({ status })
      .where(eq(markets.id, id))
      .returning();
    return result[0];
  }

  async settleMarket(id: string, winningOutcome: string): Promise<Market | undefined> {
    const result = await db.update(markets)
      .set({ 
        status: 'settled',
        winningOutcome,
        settledAt: new Date()
      })
      .where(eq(markets.id, id))
      .returning();
    return result[0];
  }

  // Market bet methods
  async getMarketBetsByMarketId(marketId: string): Promise<MarketBet[]> {
    return await db.select().from(marketBets).where(eq(marketBets.marketId, marketId));
  }

  async createMarketBet(bet: InsertMarketBet): Promise<MarketBet> {
    const result = await db.insert(marketBets).values(bet).returning();
    return result[0];
  }

  async updateMarketBetStatus(id: string, status: string, actualPayout?: string): Promise<MarketBet | undefined> {
    const updateData: Partial<MarketBet> = { status, settledAt: new Date() };
    if (actualPayout !== undefined) {
      updateData.actualPayout = actualPayout;
    }
    const result = await db.update(marketBets)
      .set(updateData)
      .where(eq(marketBets.id, id))
      .returning();
    return result[0];
  }

  // Sports/Leagues visibility methods
  async getSportsVisibility(): Promise<SportsVisibility[]> {
    return await db.select().from(sportsVisibility);
  }

  async getLeaguesVisibility(): Promise<LeaguesVisibility[]> {
    return await db.select().from(leaguesVisibility);
  }

  async setSportVisibility(sportId: string, isHidden: boolean): Promise<SportsVisibility> {
    const result = await db.insert(sportsVisibility)
      .values({ sportId, isHidden, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: sportsVisibility.sportId,
        set: { isHidden, updatedAt: new Date() }
      })
      .returning();
    return result[0];
  }

  async setLeagueVisibility(leagueId: string, sportId: string, isHidden: boolean): Promise<LeaguesVisibility> {
    const result = await db.insert(leaguesVisibility)
      .values({ leagueId, sportId, isHidden, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: leaguesVisibility.leagueId,
        set: { isHidden, sportId, updatedAt: new Date() }
      })
      .returning();
    return result[0];
  }

  // Unified visibility settings methods (new)
  async getVisibilitySettings(): Promise<VisibilitySetting[]> {
    return await db.select().from(visibilitySettings);
  }

  async toggleSportVisibility(sportId: string, isVisible: boolean, userId?: string, manualOverride: boolean = true): Promise<VisibilitySetting> {
    // Check if a setting exists for this sport
    const existing = await db.select().from(visibilitySettings)
      .where(and(
        eq(visibilitySettings.type, 'sport'),
        eq(visibilitySettings.sportId, sportId)
      ))
      .limit(1);
    
    if (existing.length > 0) {
      // Update existing setting
      const result = await db.update(visibilitySettings)
        .set({ 
          isVisible,
          manualOverride,
          updatedBy: userId || null,
          updatedAt: new Date()
        })
        .where(eq(visibilitySettings.id, existing[0].id))
        .returning();
      return result[0];
    } else {
      // Create new setting
      const result = await db.insert(visibilitySettings)
        .values({
          type: 'sport',
          sportId,
          isVisible,
          manualOverride,
          updatedBy: userId || null,
        })
        .returning();
      return result[0];
    }
  }

  async toggleLeagueVisibility(leagueId: string, sportId: string, isVisible: boolean, userId?: string, manualOverride: boolean = true): Promise<VisibilitySetting> {
    // Check if a setting exists for this league
    const existing = await db.select().from(visibilitySettings)
      .where(and(
        eq(visibilitySettings.type, 'league'),
        eq(visibilitySettings.leagueId, leagueId)
      ))
      .limit(1);
    
    if (existing.length > 0) {
      // Update existing setting
      const result = await db.update(visibilitySettings)
        .set({ 
          isVisible,
          manualOverride,
          updatedBy: userId || null,
          updatedAt: new Date()
        })
        .where(eq(visibilitySettings.id, existing[0].id))
        .returning();
      return result[0];
    } else {
      // Create new setting
      const result = await db.insert(visibilitySettings)
        .values({
          type: 'league',
          leagueId,
          sportId,
          isVisible,
          manualOverride,
          updatedBy: userId || null,
        })
        .returning();
      return result[0];
    }
  }

  async resetSportToAuto(sportId: string): Promise<void> {
    // Delete the setting to reset to automatic behavior
    await db.delete(visibilitySettings)
      .where(and(
        eq(visibilitySettings.type, 'sport'),
        eq(visibilitySettings.sportId, sportId)
      ));
  }

  async resetLeagueToAuto(leagueId: string): Promise<void> {
    // Delete the setting to reset to automatic behavior
    await db.delete(visibilitySettings)
      .where(and(
        eq(visibilitySettings.type, 'league'),
        eq(visibilitySettings.leagueId, leagueId)
      ));
  }

  // Custom media methods
  async getCustomMedia(entityType?: string): Promise<CustomMedia[]> {
    if (entityType) {
      return await db.select().from(customMedia).where(eq(customMedia.entityType, entityType));
    }
    return await db.select().from(customMedia);
  }

  async getCustomMediaByEntity(entityType: string, entityId: string): Promise<CustomMedia | undefined> {
    const result = await db.select().from(customMedia)
      .where(and(
        eq(customMedia.entityType, entityType),
        eq(customMedia.entityId, entityId)
      ))
      .limit(1);
    return result[0];
  }

  async getCustomMediaByName(entityType: string, entityName: string): Promise<CustomMedia | undefined> {
    const result = await db.select().from(customMedia)
      .where(and(
        eq(customMedia.entityType, entityType),
        sql`LOWER(${customMedia.entityName}) = LOWER(${entityName})`
      ))
      .limit(1);
    return result[0];
  }

  async upsertCustomMedia(media: InsertCustomMedia): Promise<CustomMedia> {
    const existing = await this.getCustomMediaByEntity(media.entityType, media.entityId);
    
    if (existing) {
      const result = await db.update(customMedia)
        .set({ 
          ...media,
          updatedAt: new Date()
        })
        .where(eq(customMedia.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(customMedia)
        .values({ ...media, updatedAt: new Date() })
        .returning();
      return result[0];
    }
  }

  async deleteCustomMedia(id: string): Promise<void> {
    await db.delete(customMedia).where(eq(customMedia.id, id));
  }

  // Custom leagues methods
  async getCustomLeagues(sportId?: string): Promise<CustomLeague[]> {
    if (sportId) {
      return await db.select().from(customLeagues)
        .where(eq(customLeagues.sportId, sportId))
        .orderBy(customLeagues.displayName);
    }
    return await db.select().from(customLeagues).orderBy(customLeagues.displayName);
  }

  async getCustomLeagueById(id: string): Promise<CustomLeague | undefined> {
    const result = await db.select().from(customLeagues)
      .where(eq(customLeagues.id, id))
      .limit(1);
    return result[0];
  }

  async createCustomLeague(league: InsertCustomLeague): Promise<CustomLeague> {
    const result = await db.insert(customLeagues)
      .values({ ...league, updatedAt: new Date() })
      .returning();
    return result[0];
  }

  async updateCustomLeague(id: string, data: Partial<InsertCustomLeague>): Promise<CustomLeague | undefined> {
    const result = await db.update(customLeagues)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(customLeagues.id, id))
      .returning();
    return result[0];
  }

  async deleteCustomLeague(id: string): Promise<void> {
    await db.delete(customLeagues).where(eq(customLeagues.id, id));
  }
}

export const storage = new DbStorage();
