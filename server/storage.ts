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
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Chat methods
  getChatMessages(limit?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Round methods
  getCurrentRound(): Promise<Round | undefined>;
  getRound(id: string): Promise<Round | undefined>;
  createRound(round: InsertRound): Promise<Round>;
  updateRound(id: string, data: Partial<Round>): Promise<Round | undefined>;
  
  // Bet methods
  getBetsByRound(roundId: string): Promise<Bet[]>;
  createBet(bet: InsertBet): Promise<Bet>;
  
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
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
    const result = await db.select().from(rounds).where(eq(rounds.status, 'active')).limit(1);
    return result[0];
  }

  async getRound(id: string): Promise<Round | undefined> {
    const result = await db.select().from(rounds).where(eq(rounds.id, id)).limit(1);
    return result[0];
  }

  async createRound(insertRound: InsertRound): Promise<Round> {
    const result = await db.insert(rounds).values(insertRound).returning();
    return result[0];
  }

  async updateRound(id: string, data: Partial<Round>): Promise<Round | undefined> {
    const result = await db.update(rounds).set(data).where(eq(rounds.id, id)).returning();
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
