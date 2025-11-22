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
}).extend({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be 30 characters or less")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens")
    .trim(),
  email: z.string()
    .email("Invalid email address")
    .max(255, "Email must be 255 characters or less")
    .optional()
    .or(z.literal('')),
  walletAddress: z.string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address format")
    .optional(),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be 128 characters or less"),
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
}).extend({
  username: z.string()
    .min(1, "Username is required")
    .max(50, "Username must be 50 characters or less")
    .trim(),
  message: z.string()
    .min(1, "Message cannot be empty")
    .max(500, "Message must be 500 characters or less")
    .trim(),
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
}).extend({
  // SECURITY: Validate bet amount is numeric and within acceptable range
  // Using z.string() to match database numeric type, but validate numeric properties
  amount: z.string()
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, "Bet amount must be a positive number")
    .refine((val) => {
      const num = parseFloat(val);
      return num >= 0.001;
    }, "Minimum bet is 0.001 BNB")
    .refine((val) => {
      const num = parseFloat(val);
      return num <= 100;
    }, "Maximum bet is 100 BNB")
    .refine((val) => {
      // Ensure amount has at most 8 decimal places (matches database precision)
      const parts = val.split('.');
      return parts.length === 1 || (parts[1] && parts[1].length <= 8);
    }, "Amount can have at most 8 decimal places"),
  userAddress: z.string()
    .min(1, "User address is required")
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address format"),
  txHash: z.string()
    .min(1, "Transaction hash is required")
    .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash format"),
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
