// DegenArena Database Schema
// Reference: javascript_log_in_with_replit blueprint for users table
// Reference: javascript_database blueprint for database setup

import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  decimal,
  text,
  boolean,
  integer,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// AUTH TABLES (Required for Replit Auth)
// ============================================================================

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - Required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  walletAddress: varchar("wallet_address").unique(), // Ethereum wallet address for Web3 login
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  displayName: varchar("display_name"), // User's custom display name
  lastNameChange: timestamp("last_name_change"), // Last time display name was changed (7 day cooldown)
  profileImageUrl: varchar("profile_image_url"), // User's profile picture URL
  role: varchar("role").notNull().default("user"), // 'user' or 'admin' - for access control
  totalWagered: decimal("total_wagered", { precision: 18, scale: 8 }).notNull().default("0"),
  totalWon: decimal("total_won", { precision: 18, scale: 8 }).notNull().default("0"),
  rankPoints: integer("rank_points").notNull().default(0), // Points for ranking
  rank: varchar("rank").notNull().default("Bronze"), // Bronze, Silver, Gold, Platinum, Diamond
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// ============================================================================
// DEGENARENA CORE TABLES
// ============================================================================

// Wallets - Managed BNB wallets for each user
export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  bnbAddress: varchar("bnb_address").notNull().unique(), // Mock BNB address for MVP
  balance: decimal("balance", { precision: 18, scale: 8 }).notNull().default("0"), // BNB balance
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWalletSchema = createInsertSchema(wallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;

// Transactions - Deposits, Withdrawals, Bets, Settlements
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id").notNull().references(() => wallets.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // 'deposit', 'withdrawal', 'bet_placed', 'bet_settled'
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  status: varchar("status").notNull().default("pending"), // 'pending', 'completed', 'failed'
  txHash: varchar("tx_hash"), // Mock blockchain transaction hash
  metadata: jsonb("metadata"), // Additional data (bet details, market info, etc)
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Markets - Sports betting markets
export const markets = pgTable("markets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sport: varchar("sport").notNull(), // 'NBA', 'NFL', 'Soccer', 'MLB'
  league: varchar("league").notNull(), // 'NBA', 'NFL', 'Premier League', etc
  marketType: varchar("market_type").notNull(), // 'match_winner', 'first_to_score', 'halftime_leader', etc
  teamA: varchar("team_a").notNull(),
  teamB: varchar("team_b").notNull(),
  teamALogo: text("team_a_logo"), // URL to team A logo
  teamBLogo: text("team_b_logo"), // URL to team B logo
  description: text("description").notNull(),
  status: varchar("status").notNull().default("active"), // 'active', 'locked', 'settled', 'voided'
  isLive: boolean("is_live").default(false),
  gameTime: timestamp("game_time").notNull(),
  poolATotal: decimal("pool_a_total", { precision: 18, scale: 8 }).notNull().default("0"), // Total BNB in outcome A pool
  poolBTotal: decimal("pool_b_total", { precision: 18, scale: 8 }).notNull().default("0"), // Total BNB in outcome B pool
  bonusPool: decimal("bonus_pool", { precision: 18, scale: 8 }).notNull().default("0"), // Platform bonus injection
  winningOutcome: varchar("winning_outcome"), // 'A', 'B', or null
  platformFee: decimal("platform_fee", { precision: 5, scale: 2 }).notNull().default("2.00"), // 2% fee
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  settledAt: timestamp("settled_at"),
});

export const insertMarketSchema = createInsertSchema(markets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  settledAt: true,
});

export type InsertMarket = z.infer<typeof insertMarketSchema>;
export type Market = typeof markets.$inferSelect;

// Bets - User bets on markets
export const bets = pgTable("bets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  marketId: varchar("market_id").notNull().references(() => markets.id),
  walletId: varchar("wallet_id").notNull().references(() => wallets.id),
  outcome: varchar("outcome").notNull(), // 'A' or 'B'
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  oddsAtBet: decimal("odds_at_bet", { precision: 10, scale: 2 }).notNull(), // Odds when bet was placed (for display only)
  sharePercentage: decimal("share_percentage", { precision: 10, scale: 8 }), // User's % share of winning pool (calculated at settlement)
  potentialPayout: decimal("potential_payout", { precision: 18, scale: 8 }), // Calculated at settlement
  actualPayout: decimal("actual_payout", { precision: 18, scale: 8 }), // Final payout after settlement
  status: varchar("status").notNull().default("active"), // 'active', 'won', 'lost', 'voided'
  createdAt: timestamp("created_at").defaultNow(),
  settledAt: timestamp("settled_at"),
});

export const insertBetSchema = createInsertSchema(bets).omit({
  id: true,
  createdAt: true,
  settledAt: true,
  sharePercentage: true,
  potentialPayout: true,
  actualPayout: true,
  status: true,
});

export type InsertBet = z.infer<typeof insertBetSchema>;
export type Bet = typeof bets.$inferSelect;

// TheSportsDB team badge cache - persistent storage to avoid rate limits
export const teamBadgeCache = pgTable("team_badge_cache", {
  id: serial("id").primaryKey(),
  teamName: varchar("team_name").notNull().unique(),
  badgeUrl: varchar("badge_url"),
  teamId: varchar("team_id"),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export type TeamBadgeCache = typeof teamBadgeCache.$inferSelect;
export type InsertTeamBadgeCache = typeof teamBadgeCache.$inferInsert;

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ one, many }) => ({
  wallet: one(wallets, {
    fields: [users.id],
    references: [wallets.userId],
  }),
  bets: many(bets),
  transactions: many(transactions),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
  bets: many(bets),
  transactions: many(transactions),
}));

export const marketsRelations = relations(markets, ({ many }) => ({
  bets: many(bets),
}));

export const betsRelations = relations(bets, ({ one }) => ({
  user: one(users, {
    fields: [bets.userId],
    references: [users.id],
  }),
  market: one(markets, {
    fields: [bets.marketId],
    references: [markets.id],
  }),
  wallet: one(wallets, {
    fields: [bets.walletId],
    references: [wallets.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  wallet: one(wallets, {
    fields: [transactions.walletId],
    references: [wallets.id],
  }),
}));

// Chat Messages - Global chatroom for the platform
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// CUSTOM SPORTS DATA TABLES
// ============================================================================

// Custom Teams - User-uploaded teams with logos
export const customTeams = pgTable("custom_teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  sport: varchar("sport").notNull(), // 'Basketball', 'Football', 'Baseball', 'Soccer', etc
  league: varchar("league").notNull(), // League name this team belongs to
  logoFilename: varchar("logo_filename").notNull(), // Filename in server/public/ (e.g., 'custom-team-logo-123.png')
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCustomTeamSchema = createInsertSchema(customTeams).omit({
  id: true,
  createdAt: true,
});

export type InsertCustomTeam = z.infer<typeof insertCustomTeamSchema>;
export type CustomTeam = typeof customTeams.$inferSelect;

// Custom Players - User-uploaded players with photos (for individual sports)
export const customPlayers = pgTable("custom_players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  sport: varchar("sport").notNull(), // 'Tennis', 'Golf', 'Boxing', 'MMA', etc
  country: varchar("country"), // Optional country code
  photoFilename: varchar("photo_filename").notNull(), // Filename in server/public/ (e.g., 'custom-player-123.png')
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCustomPlayerSchema = createInsertSchema(customPlayers).omit({
  id: true,
  createdAt: true,
});

export type InsertCustomPlayer = z.infer<typeof insertCustomPlayerSchema>;
export type CustomPlayer = typeof customPlayers.$inferSelect;

// Custom Leagues - User-uploaded leagues
export const customLeagues = pgTable("custom_leagues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  sport: varchar("sport").notNull(), // 'Basketball', 'Football', 'Baseball', 'Soccer', etc
  badgeFilename: varchar("badge_filename"), // Optional league logo/badge
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCustomLeagueSchema = createInsertSchema(customLeagues).omit({
  id: true,
  createdAt: true,
});

export type InsertCustomLeague = z.infer<typeof insertCustomLeagueSchema>;
export type CustomLeague = typeof customLeagues.$inferSelect;

// Visibility Settings - Controls which sports and leagues are visible on the platform
export const visibilitySettings = pgTable("visibility_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull(), // 'sport' or 'league'
  sportId: varchar("sport_id"), // ID from sportsData in sports-leagues.ts (e.g., 'basketball', 'soccer')
  leagueId: varchar("league_id"), // ID from league in sports-leagues.ts (e.g., '4328')
  isVisible: boolean("is_visible").notNull().default(true),
  manualOverride: boolean("manual_override").notNull().default(false), // True if admin manually set visibility (overrides auto-hide)
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertVisibilitySettingSchema = createInsertSchema(visibilitySettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertVisibilitySetting = z.infer<typeof insertVisibilitySettingSchema>;
export type VisibilitySetting = typeof visibilitySettings.$inferSelect;
