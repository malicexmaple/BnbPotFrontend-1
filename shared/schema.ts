import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, numeric, boolean, jsonb, json, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  walletAddress: text("wallet_address").unique(),
  email: text("email"),
  role: text("role").notNull().default('user'),
  agreedToTerms: boolean("agreed_to_terms").notNull().default(false),
  agreedAt: timestamp("agreed_at"),
  avatarUrl: text("avatar_url"),
  clientSeed: text("client_seed"),
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

// Extended Round type with bets and calculated properties (as returned by API)
export type RoundWithBets = Round & {
  bets: Bet[];
  totalBets: number;
  timeRemaining: number | null;
  isCountdownActive: boolean;
};

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

export const airdropPool = pgTable("airdrop_pool", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  balance: numeric("balance", { precision: 20, scale: 8 }).notNull().default('0'),
  lastDistributionDate: text("last_distribution_date"),
  totalDistributed: numeric("total_distributed", { precision: 20, scale: 8 }).notNull().default('0'),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAirdropPoolSchema = createInsertSchema(airdropPool).omit({
  id: true,
  updatedAt: true,
});

export type InsertAirdropPool = z.infer<typeof insertAirdropPoolSchema>;
export type AirdropPool = typeof airdropPool.$inferSelect;

export const airdropDistributions = pgTable("airdrop_distributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull(),
  totalAmount: numeric("total_amount", { precision: 20, scale: 8 }).notNull(),
  recipientCount: integer("recipient_count").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertAirdropDistributionSchema = createInsertSchema(airdropDistributions).omit({
  id: true,
  timestamp: true,
});

export type InsertAirdropDistribution = z.infer<typeof insertAirdropDistributionSchema>;
export type AirdropDistribution = typeof airdropDistributions.$inferSelect;

export const airdropRecipients = pgTable("airdrop_recipients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  distributionId: varchar("distribution_id").notNull().references(() => airdropDistributions.id),
  userAddress: text("user_address").notNull(),
  userId: varchar("user_id").references(() => users.id),
  amount: numeric("amount", { precision: 20, scale: 8 }).notNull(),
  betVolume24h: numeric("bet_volume_24h", { precision: 20, scale: 8 }).notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertAirdropRecipientSchema = createInsertSchema(airdropRecipients).omit({
  id: true,
  timestamp: true,
});

export type InsertAirdropRecipient = z.infer<typeof insertAirdropRecipientSchema>;
export type AirdropRecipient = typeof airdropRecipients.$inferSelect;

export const airdropTips = pgTable("airdrop_tips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userAddress: text("user_address").notNull(),
  userId: varchar("user_id").references(() => users.id),
  amount: numeric("amount", { precision: 20, scale: 8 }).notNull(),
  txHash: text("tx_hash"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertAirdropTipSchema = createInsertSchema(airdropTips).omit({
  id: true,
  timestamp: true,
}).extend({
  amount: z.string()
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, "Tip amount must be a positive number")
    .refine((val) => {
      const num = parseFloat(val);
      return num >= 0.001;
    }, "Minimum tip is 0.001 BNB")
    .refine((val) => {
      const parts = val.split('.');
      return parts.length === 1 || (parts[1] && parts[1].length <= 8);
    }, "Amount can have at most 8 decimal places"),
  userAddress: z.string()
    .min(1, "User address is required")
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address format"),
});

export type InsertAirdropTip = z.infer<typeof insertAirdropTipSchema>;
export type AirdropTip = typeof airdropTips.$inferSelect;

export const cachedImages = pgTable("cached_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  originalUrl: text("original_url").notNull().unique(),
  localPath: text("local_path").notNull(),
  contentType: text("content_type"),
  fileSize: integer("file_size"),
  category: text("category").notNull().default('general'),
  sportId: text("sport_id"),
  leagueId: text("league_id"),
  teamId: text("team_id"),
  cachedAt: timestamp("cached_at").notNull().defaultNow(),
  lastAccessed: timestamp("last_accessed").notNull().defaultNow(),
  accessCount: integer("access_count").notNull().default(0),
});

export const insertCachedImageSchema = createInsertSchema(cachedImages).omit({
  id: true,
  cachedAt: true,
  lastAccessed: true,
  accessCount: true,
});

export type InsertCachedImage = z.infer<typeof insertCachedImageSchema>;
export type CachedImage = typeof cachedImages.$inferSelect;

export const markets = pgTable("markets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sport: text("sport").notNull(),
  league: text("league").notNull(),
  leagueId: text("league_id"),
  marketType: text("market_type").notNull().default('match_winner'),
  teamA: text("team_a").notNull(),
  teamB: text("team_b").notNull(),
  teamALogo: text("team_a_logo"),
  teamBLogo: text("team_b_logo"),
  description: text("description").notNull(),
  status: text("status").notNull().default('active'),
  isLive: boolean("is_live").notNull().default(false),
  gameTime: timestamp("game_time").notNull(),
  poolATotal: numeric("pool_a_total", { precision: 20, scale: 8 }).notNull().default('0'),
  poolBTotal: numeric("pool_b_total", { precision: 20, scale: 8 }).notNull().default('0'),
  bonusPool: numeric("bonus_pool", { precision: 20, scale: 8 }).notNull().default('0'),
  winningOutcome: text("winning_outcome"),
  platformFee: numeric("platform_fee", { precision: 5, scale: 2 }).notNull().default('2.00'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  settledAt: timestamp("settled_at"),
});

export const marketStatusValues = ['active', 'locked', 'settled', 'refunded'] as const;
export const marketStatusSchema = z.enum(marketStatusValues);
export type MarketStatus = z.infer<typeof marketStatusSchema>;

export const insertMarketSchema = createInsertSchema(markets).omit({
  id: true,
  createdAt: true,
  settledAt: true,
}).extend({
  status: marketStatusSchema.optional(),
});

export type InsertMarket = z.infer<typeof insertMarketSchema>;
export type Market = typeof markets.$inferSelect;

export const marketBets = pgTable("market_bets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  marketId: varchar("market_id").notNull().references(() => markets.id),
  userId: varchar("user_id").references(() => users.id),
  userAddress: text("user_address").notNull(),
  outcome: text("outcome").notNull(),
  amount: numeric("amount", { precision: 20, scale: 8 }).notNull(),
  oddsAtBet: numeric("odds_at_bet", { precision: 10, scale: 2 }).notNull(),
  actualPayout: numeric("actual_payout", { precision: 20, scale: 8 }),
  status: text("status").notNull().default('active'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  settledAt: timestamp("settled_at"),
});

export const marketBetStatusValues = ['active', 'won', 'lost', 'refunded'] as const;
export const marketBetStatusSchema = z.enum(marketBetStatusValues);
export type MarketBetStatus = z.infer<typeof marketBetStatusSchema>;

export const insertMarketBetSchema = createInsertSchema(marketBets).omit({
  id: true,
  createdAt: true,
  settledAt: true,
  actualPayout: true,
}).extend({
  status: marketBetStatusSchema.optional(),
});

export type InsertMarketBet = z.infer<typeof insertMarketBetSchema>;
export type MarketBet = typeof marketBets.$inferSelect;

export type MarketBetWithMarket = MarketBet & {
  market: Pick<Market, 'id' | 'sport' | 'league' | 'teamA' | 'teamB' | 'description' | 'gameTime' | 'status' | 'winningOutcome'>;
};

export type MarketLeaderboardEntry = {
  userAddress: string;
  username: string | null;
  totalBets: number;
  wins: number;
  totalWagered: string;
  totalWon: string;
  netProfit: string;
};

export const teamBadgeCache = pgTable("team_badge_cache", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamName: text("team_name").notNull().unique(),
  badgeUrl: text("badge_url"),
  teamId: text("team_id"),
  fetchedAt: timestamp("fetched_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const insertTeamBadgeCacheSchema = createInsertSchema(teamBadgeCache).omit({
  id: true,
  fetchedAt: true,
});

export type InsertTeamBadgeCache = z.infer<typeof insertTeamBadgeCacheSchema>;
export type TeamBadgeCache = typeof teamBadgeCache.$inferSelect;

// Sports and Leagues Visibility Control
export const sportsVisibility = pgTable("sports_visibility", {
  sportId: text("sport_id").primaryKey(),
  isHidden: boolean("is_hidden").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSportsVisibilitySchema = createInsertSchema(sportsVisibility);
export type InsertSportsVisibility = z.infer<typeof insertSportsVisibilitySchema>;
export type SportsVisibility = typeof sportsVisibility.$inferSelect;

export const leaguesVisibility = pgTable("leagues_visibility", {
  leagueId: text("league_id").primaryKey(),
  sportId: text("sport_id").notNull(),
  isHidden: boolean("is_hidden").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLeaguesVisibilitySchema = createInsertSchema(leaguesVisibility);
export type InsertLeaguesVisibility = z.infer<typeof insertLeaguesVisibilitySchema>;
export type LeaguesVisibility = typeof leaguesVisibility.$inferSelect;

// Unified Visibility Settings (matching reference project structure)
// This is the new approach with isVisible + manualOverride for auto-hide feature
export const visibilitySettings = pgTable("visibility_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // 'sport' or 'league'
  sportId: text("sport_id"), // Sport ID from sportsData
  leagueId: text("league_id"), // League ID from sportsData
  isVisible: boolean("is_visible").notNull().default(true),
  manualOverride: boolean("manual_override").notNull().default(false), // True if admin manually set visibility
  updatedBy: varchar("updated_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertVisibilitySettingSchema = createInsertSchema(visibilitySettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertVisibilitySetting = z.infer<typeof insertVisibilitySettingSchema>;
export type VisibilitySetting = typeof visibilitySettings.$inferSelect;

// Custom Media Overrides for Teams and Players
export const customMedia = pgTable("custom_media", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: text("entity_type").notNull(), // 'team', 'player', 'league'
  entityId: text("entity_id").notNull(), // Team ID, player ID, or league ID
  entityName: text("entity_name").notNull(), // Display name
  logoUrl: text("logo_url"), // Custom logo/badge URL
  photoUrl: text("photo_url"), // Photo URL (for players)
  thumbnailUrl: text("thumbnail_url"), // Thumbnail version
  sportId: text("sport_id"), // Associated sport
  leagueId: text("league_id"), // Associated league
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCustomMediaSchema = createInsertSchema(customMedia).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCustomMedia = z.infer<typeof insertCustomMediaSchema>;
export type CustomMedia = typeof customMedia.$inferSelect;

// Custom Leagues (admin-created leagues that appear alongside static leagues)
export const customLeagues = pgTable("custom_leagues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sportId: text("sport_id").notNull(),
  name: text("name").notNull(),
  displayName: text("display_name").notNull(),
  badgeUrl: text("badge_url"),
  folderPath: text("folder_path"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCustomLeagueSchema = createInsertSchema(customLeagues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  sportId: z.string()
    .min(1, "Sport ID is required")
    .max(100, "Sport ID too long"),
  name: z.string()
    .min(1, "League name is required")
    .max(100, "League name too long")
    .trim(),
  displayName: z.string()
    .min(1, "Display name is required")
    .max(200, "Display name too long")
    .trim(),
  badgeUrl: z.string().url().nullable().optional(),
  folderPath: z.string().max(500).nullable().optional(),
});

export type InsertCustomLeague = z.infer<typeof insertCustomLeagueSchema>;
export type CustomLeague = typeof customLeagues.$inferSelect;

// ============================================================================
// WALLETS — Managed BNB wallets per user
// ============================================================================
export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  bnbAddress: text("bnb_address").notNull().unique(),
  balance: numeric("balance", { precision: 20, scale: 8 }).notNull().default('0'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const insertWalletSchema = createInsertSchema(wallets).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;

// Generic transactions (deposits/withdrawals/bet_placed/bet_settled)
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id").notNull().references(() => wallets.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  amount: numeric("amount", { precision: 20, scale: 8 }).notNull(),
  status: text("status").notNull().default('pending'),
  txHash: text("tx_hash"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true, createdAt: true,
});
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Custom Teams (admin-uploaded teams)
export const customTeams = pgTable("custom_teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  sport: text("sport").notNull(),
  league: text("league").notNull(),
  logoFilename: text("logo_filename").notNull(),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const insertCustomTeamSchema = createInsertSchema(customTeams).omit({
  id: true, createdAt: true,
});
export type InsertCustomTeam = z.infer<typeof insertCustomTeamSchema>;
export type CustomTeam = typeof customTeams.$inferSelect;

// Custom Players (admin-uploaded players for individual sports)
export const customPlayers = pgTable("custom_players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  sport: text("sport").notNull(),
  country: text("country"),
  photoFilename: text("photo_filename").notNull(),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const insertCustomPlayerSchema = createInsertSchema(customPlayers).omit({
  id: true, createdAt: true,
});
export type InsertCustomPlayer = z.infer<typeof insertCustomPlayerSchema>;
export type CustomPlayer = typeof customPlayers.$inferSelect;

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(users, { fields: [wallets.userId], references: [users.id] }),
  transactions: many(transactions),
}));
export const transactionsRelations = relations(transactions, ({ one }) => ({
  wallet: one(wallets, { fields: [transactions.walletId], references: [wallets.id] }),
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
}));

// Express session store table (managed externally; declared so drizzle doesn't drop it)
export const userSessions = pgTable("user_sessions", {
  sid: varchar("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire").notNull(),
}, (t) => [index("IDX_user_sessions_expire").on(t.expire)]);
