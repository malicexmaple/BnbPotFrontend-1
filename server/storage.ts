import { 
  type User, type InsertUser, 
  type ChatMessage, type InsertChatMessage,
  type Round, type InsertRound,
  type Bet, type InsertBet,
  type UserStats, type InsertUserStats,
  type DailyStats, type InsertDailyStats,
  users, chatMessages, rounds, bets, userStats, dailyStats
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc, and, or, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createOrUpdateUserByWallet(walletAddress: string, username: string, email?: string): Promise<User>;
  
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
    const result = await db.select().from(users).where(eq(users.walletAddress, walletAddress)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async createOrUpdateUserByWallet(walletAddress: string, username: string, email?: string): Promise<User> {
    const existingUser = await this.getUserByWalletAddress(walletAddress);
    
    if (existingUser) {
      // Update existing user
      const result = await db.update(users)
        .set({ 
          username,
          email: email || existingUser.email,
          agreedToTerms: true,
          agreedAt: new Date()
        })
        .where(eq(users.walletAddress, walletAddress))
        .returning();
      return result[0];
    } else {
      // Create new user
      const result = await db.insert(users).values({
        walletAddress,
        username,
        email,
        password: 'N/A', // Required field, but not used for wallet-based auth
        agreedToTerms: true,
        agreedAt: new Date()
      }).returning();
      return result[0];
    }
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
    return await db.select().from(bets).where(eq(bets.roundId, roundId));
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
}

export const storage = new DbStorage();
