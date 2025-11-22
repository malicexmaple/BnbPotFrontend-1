-- Database Indexes Migration for BNBPOT
-- Apply these indexes to improve query performance
-- Run this script against the production database before deployment

-- CRITICAL: Check if indexes already exist before creating
-- PostgreSQL will error if index already exists

-- 1. Rounds table - Frequently queried by status for active/waiting rounds
CREATE INDEX IF NOT EXISTS idx_rounds_status ON rounds(status);

-- 2. Rounds table - Queried by round number for historical lookups
CREATE INDEX IF NOT EXISTS idx_rounds_round_number ON rounds(round_number);

-- 3. Bets table - Frequently joined with rounds to fetch round bets
CREATE INDEX IF NOT EXISTS idx_bets_round_id ON bets(round_id);

-- 4. Chat messages table - Frequently ordered by timestamp for recent messages
CREATE INDEX IF NOT EXISTS idx_chat_timestamp_desc ON chat_messages(timestamp DESC);

-- 5. User stats table - Frequently sorted by total won for leaderboards
CREATE INDEX IF NOT EXISTS idx_user_stats_total_won_desc ON user_stats(total_won DESC);

-- Note: The following indexes are automatically created:
-- - users.wallet_address (UNIQUE constraint creates index)
-- - users.username (UNIQUE constraint creates index)
-- - rounds.round_number (UNIQUE constraint creates index)
-- - All PRIMARY KEY columns

-- Verify indexes were created
SELECT schemaname, tablename, indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public'
AND (
  indexname LIKE 'idx_%'
  OR indexname LIKE '%_pkey'
  OR indexname LIKE '%_key'
)
ORDER BY tablename, indexname;
