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
  type Market, type InsertMarket, type MarketStatus,
  type MarketBet, type InsertMarketBet,
  type SportsVisibility, type InsertSportsVisibility,
  type LeaguesVisibility, type InsertLeaguesVisibility,
  type CustomMedia, type InsertCustomMedia,
  type VisibilitySetting, type InsertVisibilitySetting,
  type CustomLeague, type InsertCustomLeague,
  type Wallet, type InsertWallet,
  type Transaction, type InsertTransaction,
  type CustomTeam, type InsertCustomTeam,
  type CustomPlayer, type InsertCustomPlayer,
  users, chatMessages, rounds, bets, userStats, dailyStats,
  airdropPool, airdropDistributions, airdropRecipients, airdropTips,
  markets, marketBets, sportsVisibility, leaguesVisibility, customMedia,
  visibilitySettings, customLeagues,
  wallets, transactions, customTeams, customPlayers
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
  updateMarket(id: string, data: Partial<InsertMarket>): Promise<Market | undefined>;
  deleteMarket(id: string): Promise<{ deleted: boolean; reason?: string }>;
  updateMarketStatus(id: string, status: string): Promise<Market | undefined>;
  settleMarket(id: string, winningOutcome: string): Promise<Market | undefined>;
  refundMarket(id: string): Promise<{ market: Market; refundedBets: number } | undefined>;
  
  // Market bet methods
  getMarketBetsByMarketId(marketId: string): Promise<MarketBet[]>;
  getMarketBetsByUserAddress(userAddress: string, limit?: number, offset?: number): Promise<Array<MarketBet & { market: Market }>>;
  getRecentMarketBets(limit: number): Promise<Array<MarketBet & { market: Market; username: string | null }>>;
  getMarketLeaderboard(limit: number, sport?: string): Promise<Array<{ userAddress: string; username: string | null; totalBets: number; wins: number; totalWagered: string; totalWon: string; netProfit: string }>>;
  createMarketBet(bet: InsertMarketBet): Promise<MarketBet>;
  placeMarketBetTransaction(
    marketId: string,
    bet: Omit<InsertMarketBet, 'marketId' | 'oddsAtBet'>
  ): Promise<{ bet: MarketBet; market: Market }>;
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

  // Wallets
  getWalletByUserId(userId: string): Promise<Wallet | undefined>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWalletBalance(walletId: string, newBalance: string): Promise<Wallet | undefined>;
  adjustWalletBalance(walletId: string, delta: string, requireSufficient: boolean): Promise<Wallet | undefined>;

  // Transactions
  createTransaction(tx: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: string, limit?: number): Promise<Transaction[]>;

  // Custom teams / players
  getCustomTeams(sport?: string, league?: string): Promise<CustomTeam[]>;
  createCustomTeam(team: InsertCustomTeam): Promise<CustomTeam>;
  getCustomPlayers(sport?: string): Promise<CustomPlayer[]>;
  createCustomPlayer(player: InsertCustomPlayer): Promise<CustomPlayer>;
}

/**
 * Safely await a Drizzle query that returns an array. Neon's HTTP serverless
 * driver intermittently returns a null body, which causes Drizzle's internal
 * `.map()` to throw "Cannot read properties of null (reading 'map')".
 *
 * We absorb ONLY that specific transient signature and return []. Any other
 * error (real DB outage, syntax error, constraint violation) is rethrown so
 * monitoring/alerts still fire and we don't silently mask outages.
 */
function isNeonNullBodyError(err: unknown): boolean {
  if (!(err instanceof TypeError)) return false;
  const msg = err.message || '';
  return msg.includes("reading 'map'") || msg.includes('reading "map"');
}

async function safeRows<T>(q: Promise<T[]>, label: string): Promise<T[]> {
  try {
    const r = await q;
    return Array.isArray(r) ? r : [];
  } catch (err) {
    if (isNeonNullBodyError(err)) {
      console.warn(`[storage] ${label}: Neon null-body, returning []`);
      return [];
    }
    console.error(`[storage] ${label} failed:`, err);
    throw err;
  }
}

async function safeRowsRetry<T>(
  build: () => Promise<T[]>,
  label: string,
  attempts = 3
): Promise<T[]> {
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await build();
      return Array.isArray(r) ? r : [];
    } catch (err) {
      if (!isNeonNullBodyError(err)) {
        console.error(`[storage] ${label} failed:`, err);
        throw err;
      }
      console.warn(`[storage] ${label}: Neon null-body (attempt ${i + 1}/${attempts})`);
      await new Promise((r) => setTimeout(r, 25 * (i + 1)));
    }
  }
  console.warn(`[storage] ${label}: Neon null-body exhausted, returning []`);
  return [];
}

/**
 * Like safeRowsRetry but for WRITE operations: throws if all retries are
 * exhausted, instead of silently swallowing the failure. Use for INSERT/UPDATE/DELETE
 * .returning() calls (or whole transactions) where a missing result indicates
 * real corruption.
 *
 * Generic over the return type so it can wrap either array-returning queries
 * (e.g. `.returning()`) or transactions that resolve to a single object.
 * When wrapping a transaction, retrying on a null-body error is safe because
 * the transaction is rolled back on the underlying connection failure before
 * the next attempt runs.
 */
async function writeRetry<T>(
  build: () => Promise<T>,
  label: string,
  attempts = 3
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await build();
    } catch (err) {
      lastErr = err;
      if (!isNeonNullBodyError(err)) {
        console.error(`[storage] ${label} failed:`, err);
        throw err;
      }
      console.warn(`[storage] ${label}: Neon null-body on write (attempt ${i + 1}/${attempts})`);
      await new Promise((r) => setTimeout(r, 25 * (i + 1)));
    }
  }
  throw new Error(
    `[storage] ${label}: write failed after ${attempts} attempts (Neon null-body)` +
    (lastErr instanceof Error ? `: ${lastErr.message}` : '')
  );
}

async function safeFirst<T>(q: Promise<T[]>, label: string): Promise<T | undefined> {
  const rows = await safeRows(q, label);
  return rows[0];
}

async function safeFirstRetry<T>(
  build: () => Promise<T[]>,
  label: string
): Promise<T | undefined> {
  const rows = await safeRowsRetry(build, label);
  return rows[0];
}

export class DbStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return safeFirst(db.select().from(users).where(eq(users.id, id)).limit(1), 'getUser');
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return safeFirst(db.select().from(users).where(eq(users.username, username)).limit(1), 'getUserByUsername');
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    const normalizedAddress = walletAddress.toLowerCase();
    return safeFirst(
      db.select().from(users).where(eq(users.walletAddress, normalizedAddress)).limit(1),
      'getUserByWalletAddress'
    );
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
    return safeRows(
      db.select().from(chatMessages).orderBy(desc(chatMessages.timestamp)).limit(limit),
      'getChatMessages'
    );
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const result = await db.insert(chatMessages).values(insertMessage).returning();
    return result[0];
  }

  // Round methods
  async getCurrentRound(): Promise<Round | undefined> {
    return safeFirst(
      db.select().from(rounds)
        .where(or(eq(rounds.status, 'active'), eq(rounds.status, 'waiting')))
        .orderBy(desc(rounds.roundNumber))
        .limit(1),
      'getCurrentRound'
    );
  }

  async getRound(id: string): Promise<Round | undefined> {
    return safeFirst(db.select().from(rounds).where(eq(rounds.id, id)).limit(1), 'getRound');
  }

  async getRoundByNumber(roundNumber: number): Promise<Round | undefined> {
    return safeFirst(
      db.select().from(rounds).where(eq(rounds.roundNumber, roundNumber)).limit(1),
      'getRoundByNumber'
    );
  }

  async getLatestRoundNumber(): Promise<number> {
    const row = await safeFirst(
      db.select().from(rounds).orderBy(desc(rounds.roundNumber)).limit(1),
      'getLatestRoundNumber'
    );
    return row?.roundNumber || 0;
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
    return safeRows(
      db.select().from(bets).where(eq(bets.roundId, roundId)),
      `getBetsByRound(${roundId})`
    );
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
    return safeFirst(
      db.select().from(userStats).where(eq(userStats.userAddress, userAddress)).limit(1),
      'getUserStats'
    );
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
    return safeRows(
      db.select().from(userStats).orderBy(desc(userStats.totalWon)).limit(limit),
      'getTopWinners'
    );
  }

  // Daily stats methods
  async getDailyStats(date: string): Promise<DailyStats | undefined> {
    return safeFirst(
      db.select().from(dailyStats).where(eq(dailyStats.date, date)).limit(1),
      'getDailyStats'
    );
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
    return safeFirst(db.select().from(airdropPool).limit(1), 'getAirdropPool');
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
    return safeRows(
      db.select().from(airdropDistributions)
        .orderBy(desc(airdropDistributions.timestamp))
        .limit(limit),
      'getAirdropDistributions'
    );
  }

  async getAirdropRecipientsByDistribution(distributionId: string): Promise<AirdropRecipient[]> {
    return safeRows(
      db.select().from(airdropRecipients)
        .where(eq(airdropRecipients.distributionId, distributionId))
        .orderBy(desc(airdropRecipients.amount)),
      'getAirdropRecipientsByDistribution'
    );
  }

  async getUserAirdropEarnings(userAddress: string): Promise<AirdropRecipient[]> {
    return safeRows(
      db.select().from(airdropRecipients)
        .where(eq(airdropRecipients.userAddress, userAddress))
        .orderBy(desc(airdropRecipients.timestamp)),
      'getUserAirdropEarnings'
    );
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
    const rows = await safeRows(
      db.select().from(users).where(eq(users.role, 'admin')).limit(1),
      'hasAnyAdmin'
    );
    return rows.length > 0;
  }

  // Market methods
  async getAllMarkets(): Promise<Market[]> {
    return safeRows(
      db.select().from(markets).orderBy(desc(markets.createdAt)),
      'getAllMarkets'
    );
  }

  async getAllActiveMarkets(): Promise<Market[]> {
    return safeRows(
      db.select().from(markets)
        .where(eq(markets.status, 'active'))
        .orderBy(desc(markets.gameTime)),
      'getAllActiveMarkets'
    );
  }

  async getMarketById(id: string): Promise<Market | undefined> {
    return safeFirstRetry(
      () => db.select().from(markets).where(eq(markets.id, id)).limit(1),
      'getMarketById'
    );
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

  async updateMarket(id: string, data: Partial<InsertMarket>): Promise<Market | undefined> {
    return await db.transaction(async (tx) => {
      const lockedRes = await tx.execute<{ id: string; status: MarketStatus }>(
        sql`SELECT id, status FROM markets WHERE id = ${id} FOR UPDATE`
      );
      const row = lockedRes.rows[0];
      if (!row) return undefined;
      if (row.status !== 'active') {
        throw new Error(`Cannot edit a market with status '${row.status}'. Only active markets can be edited.`);
      }
      const betCountRes = await tx.execute<{ c: number }>(
        sql`SELECT COUNT(*)::int AS c FROM market_bets WHERE market_id = ${id}`
      );
      const c = betCountRes.rows[0]?.c ?? 0;
      if (c > 0) {
        throw new Error('Cannot edit a market that already has bets');
      }
      const [updated] = await tx.update(markets).set(data).where(eq(markets.id, id)).returning();
      return updated as Market | undefined;
    });
  }

  async deleteMarket(id: string): Promise<{ deleted: boolean; reason?: string }> {
    return await db.transaction(async (tx) => {
      const lockedRes = await tx.execute<{ id: string }>(
        sql`SELECT id FROM markets WHERE id = ${id} FOR UPDATE`
      );
      if (!lockedRes.rows[0]) return { deleted: false, reason: 'Market not found' };

      const betCountRes = await tx.execute<{ c: number }>(
        sql`SELECT COUNT(*)::int AS c FROM market_bets WHERE market_id = ${id}`
      );
      const c = betCountRes.rows[0]?.c ?? 0;
      if (c > 0) {
        return { deleted: false, reason: 'Cannot delete a market that has bets. Refund it instead.' };
      }
      await tx.delete(markets).where(eq(markets.id, id));
      return { deleted: true };
    });
  }

  async settleMarket(id: string, winningOutcome: string): Promise<Market | undefined> {
    return await db.transaction(async (tx) => {
      const lockedRes = await tx.execute<{ id: string; status: MarketStatus }>(
        sql`SELECT id, status FROM markets WHERE id = ${id} FOR UPDATE`
      );
      const row = lockedRes.rows[0];
      if (!row) return undefined;
      if (row.status === 'settled' || row.status === 'refunded') {
        throw new Error(`Market is already ${row.status} and cannot be settled`);
      }
      const [updated] = await tx.update(markets)
        .set({ status: 'settled', winningOutcome, settledAt: new Date() })
        .where(eq(markets.id, id))
        .returning();
      return updated as Market | undefined;
    });
  }

  async refundMarket(id: string): Promise<{ market: Market; refundedBets: number } | undefined> {
    return await db.transaction(async (tx) => {
      const lockedRes = await tx.execute<{ id: string; status: MarketStatus }>(
        sql`SELECT id, status FROM markets WHERE id = ${id} FOR UPDATE`
      );
      const row = lockedRes.rows[0];
      if (!row) return undefined;
      if (row.status !== 'active' && row.status !== 'locked') {
        throw new Error(
          row.status === 'refunded'
            ? 'Market has already been refunded'
            : row.status === 'settled'
              ? 'Cannot refund a market that has already been settled'
              : `Cannot refund a market with status '${row.status}'. Only active or locked markets can be refunded.`
        );
      }

      const updateBetsRes = await tx.execute(
        sql`UPDATE market_bets
            SET status = 'refunded', actual_payout = amount, settled_at = NOW()
            WHERE market_id = ${id}
              AND status NOT IN ('won', 'lost', 'refunded')`
      );
      const refundedBets = updateBetsRes.rowCount ?? 0;

      const [updated] = await tx.update(markets)
        .set({ status: 'refunded', settledAt: new Date() })
        .where(eq(markets.id, id))
        .returning();
      if (!updated) return undefined;
      return { market: updated as Market, refundedBets };
    });
  }

  // Market bet methods
  async getMarketBetsByMarketId(marketId: string): Promise<MarketBet[]> {
    return safeRows(
      db.select().from(marketBets).where(eq(marketBets.marketId, marketId)),
      'getMarketBetsByMarketId'
    );
  }

  async createMarketBet(bet: InsertMarketBet): Promise<MarketBet> {
    const result = await db.insert(marketBets).values(bet).returning();
    return result[0];
  }

  /**
   * Atomically: insert a market bet and bump the chosen outcome's pool.
   * Re-validates that the market is still 'active' inside the transaction
   * so a market locked between the route check and the write is rejected.
   */
  async placeMarketBetTransaction(
    marketId: string,
    bet: Omit<InsertMarketBet, 'marketId' | 'oddsAtBet'>
  ): Promise<{ bet: MarketBet; market: Market }> {
    // The Neon serverless WebSocket driver supports real transactions, so the
    // SELECT ... FOR UPDATE + INSERT + UPDATE block stays atomic. We still wrap
    // the whole transaction in writeRetry so that an intermittent null-body
    // response from the driver causes the rolled-back transaction to be
    // retried, instead of returning a 500 to the user and corrupting pools.
    return await writeRetry(() => db.transaction(async (tx) => {
      // SELECT ... FOR UPDATE so concurrent lock/settle/place-bet can't slip in
      // between our read and our write of poolATotal/poolBTotal.
      const lockedRows = await tx.execute<{
        id: string;
        status: MarketStatus;
        game_time: Date;
        pool_a_total: string;
        pool_b_total: string;
        bonus_pool: string;
      }>(
        sql`SELECT id, status, game_time, pool_a_total, pool_b_total, bonus_pool
            FROM markets WHERE id = ${marketId} FOR UPDATE`
      );
      const market = lockedRows.rows[0];
      if (!market) throw new Error('Market not found');
      if (market.status !== 'active') throw new Error('Market is no longer accepting bets');
      if (new Date(market.game_time).getTime() <= Date.now()) {
        throw new Error('Market is closed (game has started)');
      }

      const poolA = parseFloat(market.pool_a_total);
      const poolB = parseFloat(market.pool_b_total);
      const bonus = parseFloat(market.bonus_pool || '0');
      const pool = bet.outcome === 'A' ? poolA : poolB;
      // Include bonus pool to match frontend odds display.
      const total = poolA + poolB + bonus;
      const oddsAtBet = pool > 0 ? (total / pool).toFixed(2) : '2.00';

      const [insertedBet] = await tx.insert(marketBets).values({
        ...bet,
        marketId,
        oddsAtBet,
      }).returning();

      const [updatedMarket] = await tx.update(markets)
        .set({
          poolATotal: bet.outcome === 'A'
            ? sql`CAST(${markets.poolATotal} AS NUMERIC) + ${bet.amount}::numeric`
            : markets.poolATotal,
          poolBTotal: bet.outcome === 'B'
            ? sql`CAST(${markets.poolBTotal} AS NUMERIC) + ${bet.amount}::numeric`
            : markets.poolBTotal,
        })
        .where(eq(markets.id, marketId))
        .returning();

      return { bet: insertedBet, market: updatedMarket };
    }), 'placeMarketBetTransaction');
  }

  async getMarketBetsByUserAddress(userAddress: string, limit: number = 100, offset: number = 0): Promise<Array<MarketBet & { market: Market }>> {
    try {
      const rows = await db
        .select()
        .from(marketBets)
        .innerJoin(markets, eq(marketBets.marketId, markets.id))
        .where(eq(marketBets.userAddress, userAddress))
        .orderBy(desc(marketBets.createdAt))
        .limit(limit)
        .offset(offset);
      return rows.map((r: any) => ({ ...r.market_bets, market: r.markets }));
    } catch (e) {
      console.error('getMarketBetsByUserAddress failed', e);
      return [];
    }
  }

  async getRecentMarketBets(limit: number): Promise<Array<MarketBet & { market: Market; username: string | null }>> {
    try {
      const rows = await db
        .select()
        .from(marketBets)
        .innerJoin(markets, eq(marketBets.marketId, markets.id))
        .leftJoin(users, eq(marketBets.userId, users.id))
        .orderBy(desc(marketBets.createdAt))
        .limit(limit);
      return rows.map((r: any) => ({
        ...r.market_bets,
        market: r.markets,
        username: r.users?.username ?? null,
      }));
    } catch (e) {
      console.error('getRecentMarketBets failed', e);
      return [];
    }
  }

  async getMarketLeaderboard(limit: number, sport?: string): Promise<Array<{ userAddress: string; username: string | null; totalBets: number; wins: number; totalWagered: string; totalWon: string; netProfit: string }>> {
    try {
      const sportFilter = sport && sport !== 'all' ? sql`WHERE m.sport = ${sport}` : sql``;
      const rows: any = await db.execute(sql`
        SELECT
          mb.user_address AS user_address,
          MAX(u.username) AS username,
          COUNT(*)::int AS total_bets,
          SUM(CASE WHEN mb.status = 'won' THEN 1 ELSE 0 END)::int AS wins,
          COALESCE(SUM(mb.amount::numeric), 0)::text AS total_wagered,
          COALESCE(SUM(CASE WHEN mb.status = 'won' THEN mb.actual_payout::numeric ELSE 0 END), 0)::text AS total_won
        FROM market_bets mb
        INNER JOIN markets m ON m.id = mb.market_id
        LEFT JOIN users u ON u.id = mb.user_id
        ${sportFilter}
        GROUP BY mb.user_address
        ORDER BY total_won::numeric DESC, total_wagered::numeric DESC
        LIMIT ${limit}
      `);
      const list = (rows.rows ?? rows) as any[];
      return list.map((r) => {
        const wagered = parseFloat(r.total_wagered || '0');
        const won = parseFloat(r.total_won || '0');
        return {
          userAddress: r.user_address,
          username: r.username ?? null,
          totalBets: Number(r.total_bets) || 0,
          wins: Number(r.wins) || 0,
          totalWagered: wagered.toFixed(8),
          totalWon: won.toFixed(8),
          netProfit: (won - wagered).toFixed(8),
        };
      });
    } catch (e) {
      console.error('getMarketLeaderboard failed', e);
      return [];
    }
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
    return safeRows(db.select().from(sportsVisibility), 'getSportsVisibility');
  }

  async getLeaguesVisibility(): Promise<LeaguesVisibility[]> {
    return safeRows(db.select().from(leaguesVisibility), 'getLeaguesVisibility');
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
    return safeRows(db.select().from(visibilitySettings), 'getVisibilitySettings');
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
    const q = entityType
      ? db.select().from(customMedia).where(eq(customMedia.entityType, entityType))
      : db.select().from(customMedia);
    return safeRows(q, 'getCustomMedia');
  }

  async getCustomMediaByEntity(entityType: string, entityId: string): Promise<CustomMedia | undefined> {
    return safeFirst(
      db.select().from(customMedia)
        .where(and(
          eq(customMedia.entityType, entityType),
          eq(customMedia.entityId, entityId)
        ))
        .limit(1),
      'getCustomMediaByEntity'
    );
  }

  async getCustomMediaByName(entityType: string, entityName: string): Promise<CustomMedia | undefined> {
    return safeFirst(
      db.select().from(customMedia)
        .where(and(
          eq(customMedia.entityType, entityType),
          sql`LOWER(${customMedia.entityName}) = LOWER(${entityName})`
        ))
        .limit(1),
      'getCustomMediaByName'
    );
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
    const q = sportId
      ? db.select().from(customLeagues)
          .where(eq(customLeagues.sportId, sportId))
          .orderBy(customLeagues.displayName)
      : db.select().from(customLeagues).orderBy(customLeagues.displayName);
    return safeRows(q, 'getCustomLeagues');
  }

  async getCustomLeagueById(id: string): Promise<CustomLeague | undefined> {
    return safeFirst(
      db.select().from(customLeagues)
        .where(eq(customLeagues.id, id))
        .limit(1),
      'getCustomLeagueById'
    );
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

  // ============= Wallets =============
  async getWalletByUserId(userId: string): Promise<Wallet | undefined> {
    return safeFirst(db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1), 'getWalletByUserId');
  }
  async createWallet(walletData: InsertWallet): Promise<Wallet> {
    const rows = await safeRows(db.insert(wallets).values(walletData).returning(), 'createWallet');
    return rows[0];
  }
  async updateWalletBalance(walletId: string, newBalance: string): Promise<Wallet | undefined> {
    const rows = await safeRows(
      db.update(wallets).set({ balance: newBalance, updatedAt: new Date() }).where(eq(wallets.id, walletId)).returning(),
      'updateWalletBalance'
    );
    return rows[0];
  }
  async adjustWalletBalance(walletId: string, delta: string, requireSufficient: boolean): Promise<Wallet | undefined> {
    const whereClause = requireSufficient
      ? sql`${wallets.id} = ${walletId} AND CAST(${wallets.balance} AS NUMERIC) + ${delta}::numeric >= 0`
      : sql`${wallets.id} = ${walletId}`;
    const rows = await safeRows(
      db.update(wallets)
        .set({
          balance: sql`CAST(CAST(${wallets.balance} AS NUMERIC) + ${delta}::numeric AS TEXT)`,
          updatedAt: new Date(),
        })
        .where(whereClause)
        .returning(),
      'adjustWalletBalance'
    );
    return rows[0];
  }

  // ============= Transactions =============
  async createTransaction(txData: InsertTransaction): Promise<Transaction> {
    const rows = await safeRows(db.insert(transactions).values(txData).returning(), 'createTransaction');
    return rows[0];
  }
  async getUserTransactions(userId: string, limit: number = 50): Promise<Transaction[]> {
    return safeRows(
      db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt)).limit(limit),
      'getUserTransactions'
    );
  }

  // ============= Custom Teams =============
  async getCustomTeams(sport?: string, league?: string): Promise<CustomTeam[]> {
    const conds = [];
    if (sport) conds.push(eq(customTeams.sport, sport));
    if (league) conds.push(eq(customTeams.league, league));
    const q = conds.length
      ? db.select().from(customTeams).where(and(...conds)).orderBy(desc(customTeams.createdAt))
      : db.select().from(customTeams).orderBy(desc(customTeams.createdAt));
    return safeRows(q, 'getCustomTeams');
  }
  async createCustomTeam(team: InsertCustomTeam): Promise<CustomTeam> {
    const rows = await safeRows(db.insert(customTeams).values(team).returning(), 'createCustomTeam');
    return rows[0];
  }

  // ============= Custom Players =============
  async getCustomPlayers(sport?: string): Promise<CustomPlayer[]> {
    const q = sport
      ? db.select().from(customPlayers).where(eq(customPlayers.sport, sport)).orderBy(desc(customPlayers.createdAt))
      : db.select().from(customPlayers).orderBy(desc(customPlayers.createdAt));
    return safeRows(q, 'getCustomPlayers');
  }
  async createCustomPlayer(player: InsertCustomPlayer): Promise<CustomPlayer> {
    const rows = await safeRows(db.insert(customPlayers).values(player).returning(), 'createCustomPlayer');
    return rows[0];
  }
}

export const storage = new DbStorage();
