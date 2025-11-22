# Database Indexing Strategy for BNBPOT

## Current Database Schema

### Tables
- **users**: User accounts and wallet information
- **chat_messages**: Chat history
- **rounds**: Game rounds
- **bets**: Bets placed in rounds
- **user_stats**: Player statistics
- **daily_stats**: Daily winner tracking

## Recommended Indexes for Performance

### High Priority (Frequent Queries)

1. **rounds table**
   - `CREATE INDEX idx_rounds_status ON rounds(status)` 
   - Used by: `getCurrentRound()` to find active/waiting rounds
   - Impact: Speeds up round lookups

2. **bets table**
   - `CREATE INDEX idx_bets_round_id ON bets(round_id)`
   - Used by: `getBetsByRound()` to fetch bets for a round
   - Impact: Fast bet retrieval for round display

3. **chat_messages table**
   - `CREATE INDEX idx_chat_timestamp_desc ON chat_messages(timestamp DESC)`
   - Used by: `getChatMessages(limit)` to fetch recent messages
   - Impact: Fast chat history loading

4. **users table**
   - `CREATE INDEX idx_users_wallet_address ON users(wallet_address)`
   - Used by: `getUserByWalletAddress()` for authentication
   - Impact: Fast user lookups during auth

### Medium Priority (Common Queries)

5. **user_stats table**
   - `CREATE INDEX idx_user_stats_total_won_desc ON user_stats(total_won DESC)`
   - Used by: `getTopWinners()` leaderboard query
   - Impact: Speeds up leaderboard generation

6. **rounds table**
   - `CREATE INDEX idx_rounds_round_number ON rounds(round_number)`
   - Used by: Round lookups by number
   - Impact: Faster historical round queries

### Implementation Notes

- Indexes are automatically created for PRIMARY KEY and UNIQUE columns
- users.wallet_address already has UNIQUE constraint (automatic index)
- users.username already has UNIQUE constraint (automatic index)
- Foreign key columns (round_id, user_id) benefit from indexes

### Query Patterns to Monitor

Monitor these queries for performance:
- `SELECT * FROM rounds WHERE status = 'active' OR status = 'waiting'`
- `SELECT * FROM bets WHERE round_id = ?`
- `SELECT * FROM chat_messages ORDER BY timestamp DESC LIMIT 50`
- `SELECT * FROM user_stats ORDER BY total_won DESC LIMIT 3`

### Future Optimizations

As the application scales:
1. Add composite indexes for multi-column queries
2. Consider partitioning for large tables (bets, chat_messages)
3. Implement query result caching for leaderboards
4. Add database connection pooling (already using Neon serverless)
5. Monitor slow query log and optimize based on actual usage patterns

---
*Last Updated: November 22, 2025*  
*Priority: Implement high-priority indexes for production deployment*
