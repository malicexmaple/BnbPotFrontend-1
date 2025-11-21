import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  walletAddress: text("wallet_address").unique(),
  email: text("email"),
  agreedToTerms: boolean("agreed_to_terms").notNull().default(false),
  agreedAt: timestamp("agreed_at"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull(),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export const rounds = pgTable("rounds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roundNumber: integer("round_number").notNull().unique(),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  countdownStart: timestamp("countdown_start"),
  totalPot: numeric("total_pot", { precision: 20, scale: 8 }).notNull().default('0'),
  winnerAddress: text("winner_address"),
  winnerId: varchar("winner_id").references(() => users.id),
  status: text("status").notNull().default('waiting'),
  txHash: text("tx_hash"),
});

export const insertRoundSchema = createInsertSchema(rounds).omit({
  id: true,
  startTime: true,
});

export type InsertRound = z.infer<typeof insertRoundSchema>;
export type Round = typeof rounds.$inferSelect;

export const bets = pgTable("bets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roundId: varchar("round_id").notNull().references(() => rounds.id),
  userAddress: text("user_address").notNull(),
  userId: varchar("user_id").references(() => users.id),
  amount: numeric("amount", { precision: 20, scale: 8 }).notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  txHash: text("tx_hash").notNull(),
});

export const insertBetSchema = createInsertSchema(bets).omit({
  id: true,
  timestamp: true,
});

export type InsertBet = z.infer<typeof insertBetSchema>;
export type Bet = typeof bets.$inferSelect;

export const userStats = pgTable("user_stats", {
  userAddress: text("user_address").primaryKey(),
  username: text("username").notNull(),
  level: integer("level").notNull().default(1),
  totalWins: integer("total_wins").notNull().default(0),
  totalWagered: numeric("total_wagered", { precision: 20, scale: 8 }).notNull().default('0'),
  totalWon: numeric("total_won", { precision: 20, scale: 8 }).notNull().default('0'),
  gamesPlayed: integer("games_played").notNull().default(0),
  biggestWin: numeric("biggest_win", { precision: 20, scale: 8 }).notNull().default('0'),
});

export const insertUserStatsSchema = createInsertSchema(userStats);

export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type UserStats = typeof userStats.$inferSelect;

export const dailyStats = pgTable("daily_stats", {
  date: text("date").primaryKey(),
  biggestWinRoundId: varchar("biggest_win_round_id").references(() => rounds.id),
  luckiestWinRoundId: varchar("luckiest_win_round_id").references(() => rounds.id),
  latestWinRoundId: varchar("latest_win_round_id").references(() => rounds.id),
});

export const insertDailyStatsSchema = createInsertSchema(dailyStats);

export type InsertDailyStats = z.infer<typeof insertDailyStatsSchema>;
export type DailyStats = typeof dailyStats.$inferSelect;
