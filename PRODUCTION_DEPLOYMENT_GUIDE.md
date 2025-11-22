# BNBPOT.COM - Production Deployment Guide

## Overview

This guide covers deploying the BNBPOT crypto jackpot gaming platform with production-ready wallet authentication to a secure hosting environment.

---

## Prerequisites

### Required Infrastructure

- **Node.js**: v18+ 
- **PostgreSQL**: v14+ (Neon, Supabase, AWS RDS, or self-hosted)
- **HTTPS**: TLS certificate (required for secure cookies)
- **Domain**: Custom domain or platform-provided subdomain

### Development to Production Checklist

- [ ] PostgreSQL database provisioned
- [ ] Environment variables configured
- [ ] TLS/HTTPS enabled
- [ ] Session secret generated
- [ ] Application tested in staging environment
- [ ] Monitoring and logging configured

---

## Environment Variables

### Required Variables

```bash
# Database (Required)
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# Session Security (Required)
SESSION_SECRET=your-cryptographically-secure-random-string-min-32-chars

# Environment (Required)
NODE_ENV=production

# Server Port (Default: 5000)
PORT=5000
```

### Optional Variables (Future Blockchain Integration)

```bash
# Blockchain Configuration (Currently Demo Mode)
# These are referenced by game service but not required for current demo operation
# CONTRACT_ADDRESS=0x... (smart contract address when blockchain integration is enabled)
# RPC_URL=https://... (blockchain RPC endpoint)
# PRIVATE_KEY=... (server wallet private key for blockchain operations)

# Note: Current implementation runs in demo mode without blockchain integration
# See BLOCKCHAIN_INTEGRATION_ROADMAP.md for details
```

### HTTPS/TLS Requirements

**Critical for Production**: The application requires HTTPS for security features:

- **Secure Cookies**: Session cookies use `secure` flag (HTTPS-only) when `NODE_ENV=production`
- **Wallet Signatures**: Web3 wallets require HTTPS for signing operations
- **CORS**: Cross-origin requests require HTTPS in production

**Deployment Options**:
- **Platform TLS**: Replit, Vercel, Netlify provide automatic HTTPS
- **Reverse Proxy**: Nginx/Caddy with Let's Encrypt certificates
- **Load Balancer**: AWS ALB, Cloudflare with TLS termination

### Generating a Secure Session Secret

Use one of these methods to generate a cryptographically secure session secret:

```bash
# Method 1: OpenSSL
openssl rand -base64 32

# Method 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Method 3: Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Important**: Store the session secret securely and never commit it to version control.

---

## Security Configuration

### Session Management

The application uses PostgreSQL-backed sessions with the following security features:

- **httpOnly cookies**: Prevents XSS attacks from accessing session cookies
- **sameSite: strict**: Prevents CSRF attacks
- **secure flag**: Cookies only transmitted over HTTPS in production
- **24-hour expiration**: Sessions automatically expire after 24 hours
- **Automatic pruning**: Expired sessions cleaned every 15 minutes

### Authentication Flow

1. **Wallet Connection**: User connects MetaMask/Trust Wallet
2. **Nonce Request**: Client requests unique 32-byte challenge from `/api/auth/nonce`
3. **Signature**: User signs challenge message with wallet
4. **Verification**: Server validates signature and creates authenticated session
5. **Session Storage**: Wallet address stored server-side, never trusted from client
6. **Logout**: When user disconnects wallet, client calls `/api/auth/logout` to destroy server session

**Important**: The frontend automatically calls `/api/auth/logout` when the user disconnects their wallet. This ensures server-side sessions are terminated immediately, preventing background tabs from making authenticated requests after the user believes they've disconnected.

### Protected Endpoints

The following endpoints require authentication:

- `POST /api/users/signup` - User registration (requires wallet verification)
- `POST /api/bets` - Place bets (requires wallet verification + terms agreement)

### Rate Limiting (Recommended)

For production deployments, implement rate limiting on authentication endpoints:

```javascript
// Example using express-rate-limit
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: 'Too many authentication attempts, please try again later.'
});

app.post('/api/auth/nonce', authLimiter, ...);
app.post('/api/auth/verify', authLimiter, ...);
```

---

## Database Setup

### Schema Migration

The application uses Drizzle ORM for database management. On first deployment:

1. Ensure `DATABASE_URL` is set
2. Run database migration:

```bash
npm run db:push
```

3. Verify tables created:
   - `users` - User accounts with wallet addresses
   - `rounds` - Game rounds
   - `bets` - User bets
   - `user_stats` - Player statistics
   - `daily_stats` - Daily winner tracking
   - `chat_messages` - Chat history
   - `user_sessions` - Session storage (auto-created by connect-pg-simple)

### Database Backups

**Critical**: Configure automated database backups:

- **Neon**: Automatic daily backups with point-in-time recovery
- **AWS RDS**: Enable automated backups with retention period
- **Self-hosted**: Set up pg_dump cron jobs

```bash
# Example backup script
pg_dump $DATABASE_URL > backups/bnbpot-$(date +%Y%m%d-%H%M%S).sql
```

---

## Deployment Steps

### 1. Install Dependencies

```bash
npm install --production
```

### 2. Build Application

```bash
npm run build
```

This compiles:
- Frontend: Vite production bundle → `dist/public/`
- Backend: Server code → `dist/`

### 3. Set Environment Variables

Configure all required environment variables on your hosting platform:

- **Replit**: Use Secrets tab
- **Vercel/Netlify**: Use environment variable dashboard
- **Docker**: Use `.env` file or container orchestration secrets
- **Heroku**: Use `heroku config:set`

### 4. Run Database Migrations

```bash
npm run db:push
```

### 5. Start Production Server

```bash
npm start
```

Or for process management:

```bash
# Using PM2
pm2 start dist/index.js --name bnbpot

# Using systemd
sudo systemctl start bnbpot
```

---

## Post-Deployment Verification

### Health Checks

1. **Server Status**: Verify server is running and responding
   ```bash
   # Check if server is accepting connections
   curl https://yourdomain.com/api/rounds/current
   
   # Should return current game round data (HTTP 200)
   # or 404 if no active round exists
   ```

2. **Database Connection**: Check logs for successful database connection
   ```
   ✅ Game Service initialized
   Active round found: #XXX
   ```
   
   Or verify database directly:
   ```bash
   # Check PostgreSQL connection
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM rounds;"
   ```

3. **Session Store**: Verify `user_sessions` table was auto-created
   ```sql
   SELECT COUNT(*) FROM user_sessions;
   ```
   
   This table is automatically created by `connect-pg-simple` on first session.

### Authentication Testing

1. **Connect Wallet**: Use MetaMask on testnet
2. **Sign Challenge**: Complete 3-step auth flow
3. **Verify Session**: Check browser cookies for `connect.sid`
4. **Place Test Bet**: Confirm authenticated requests work
5. **Disconnect**: Verify logout destroys session

### Security Audit Checklist

- [ ] HTTPS enabled (verify padlock icon)
- [ ] Session cookies have `secure` flag
- [ ] Protected endpoints reject unauthenticated requests
- [ ] Nonce invalidated after single use
- [ ] Signature verification working correctly
- [ ] Session expires after 24 hours
- [ ] Logout destroys server-side session

---

## Monitoring & Logging

### Application Logs

Monitor for authentication events:

```
🔐 Wallet Authenticated: { address: '0x...', username: 'player1' }
🎲 First bet placed! Round #123 activated
⚠️ No contract address configured
```

### Error Monitoring

Track common issues:

- **401 Unauthorized**: Authentication failures
- **403 Forbidden**: Terms agreement missing
- **Failed signature verification**: Potential attack attempts
- **Session store errors**: Database connectivity issues

### Recommended Tools

- **Application Performance Monitoring**: New Relic, DataDog, Sentry
- **Log Aggregation**: LogDNA, Papertrail, CloudWatch
- **Uptime Monitoring**: Pingdom, UptimeRobot

---

## Scaling Considerations

### Horizontal Scaling

The application is designed for horizontal scaling:

- **Stateless Application**: All session state in PostgreSQL
- **Shared Session Store**: Multiple instances share session database
- **WebSocket Clustering**: Requires Redis adapter for multi-instance WebSocket sync

### Load Balancing

Configure sticky sessions for WebSocket connections:

```nginx
# Nginx example
upstream bnbpot {
    ip_hash;  # Sticky sessions for WebSocket
    server app1.example.com:5000;
    server app2.example.com:5000;
}
```

### Database Connection Pooling

For high traffic, configure connection pooling:

```javascript
// Adjust in shared/db.ts
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!, {
  poolQueryViaFetch: true,
  fetchConnectionCache: true
});
```

---

## Security Best Practices

### Operational Security

1. **Rotate Session Secret**: Change `SESSION_SECRET` periodically
2. **Monitor Failed Auth**: Alert on repeated authentication failures
3. **Database Access Control**: Restrict database access to application servers only
4. **HTTPS Everywhere**: Never deploy without TLS
5. **Regular Updates**: Keep dependencies updated for security patches

### Incident Response

If session secret is compromised:

1. Immediately rotate `SESSION_SECRET`
2. All existing sessions will be invalidated
3. Users must re-authenticate
4. Review access logs for suspicious activity

---

## Future Enhancements

### Recommended Improvements

1. **Rate Limiting**: Add to auth endpoints (see Security Configuration section)
2. **WebSocket Authentication**: Verify wallet ownership for chat messages
3. **Multi-Factor Authentication**: Add email/SMS verification
4. **Session Activity Logging**: Track login locations and devices
5. **Blockchain Integration**: Connect to real smart contracts for on-chain betting

### Optional Features

- **Email Notifications**: Notify users of significant wins
- **IP Geolocation**: Block restricted jurisdictions
- **KYC Integration**: Add identity verification for high-value players
- **Analytics**: Track user behavior and game metrics

---

## Troubleshooting

### Common Issues

**Problem**: "Authentication required" on protected endpoints
- **Solution**: Verify wallet is connected and signature was verified
- **Check**: Browser cookies enabled, `connect.sid` cookie present

**Problem**: Session expires too quickly
- **Solution**: Increase `cookie.maxAge` in `server/index.ts`
- **Default**: 24 hours (`24 * 60 * 60 * 1000`)

**Problem**: "Invalid signature" errors
- **Solution**: Ensure message contains server-issued nonce
- **Check**: `/api/auth/nonce` called before signing

**Problem**: Database connection errors
- **Solution**: Verify `DATABASE_URL` is correct
- **Check**: Database accepts connections, SSL certificate valid

**Problem**: Users can't place bets after signup
- **Solution**: Ensure terms agreement is set
- **Check**: `agreedToTerms` field in users table

**Problem**: Session remains active after user disconnects wallet
- **Solution**: Verify frontend calls `/api/auth/logout` on disconnect
- **Check**: Look for logout API call in browser network tab when disconnecting
- **Implementation**: The `useWallet.disconnect()` function should POST to `/api/auth/logout`
- **Security Note**: Without proper logout, background tabs could continue making authenticated requests after the user believes they've disconnected

**Problem**: Multiple active sessions for same wallet
- **Solution**: This is expected behavior - each browser/device has separate session
- **To invalidate all sessions**: Rotate `SESSION_SECRET` (forces all users to re-authenticate)
- **Alternative**: Implement single-session-per-wallet logic in `server/routes.ts` `/api/auth/verify`

---

## Support & Maintenance

### Backup Strategy

1. **Database**: Automated daily backups with 30-day retention
2. **Environment Variables**: Document all variables in secure location
3. **Session Secret**: Store securely in password manager
4. **Deployment Config**: Version control deployment scripts

### Update Process

1. Test updates in staging environment
2. Review dependency changes for security issues
3. Run database migrations before deploying code
4. Deploy during low-traffic periods
5. Monitor logs for errors after deployment
6. Keep rollback plan ready

---

## Contact & Resources

- **Documentation**: See `BLOCKCHAIN_INTEGRATION_ROADMAP.md` for blockchain features
- **Database Schema**: See `shared/schema.ts` for data models
- **API Reference**: See `server/routes.ts` for endpoint documentation

---

*Last Updated: November 22, 2025*  
*Version: 1.0 - Production-Ready Authentication*
