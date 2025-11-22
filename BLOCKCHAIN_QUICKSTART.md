# BNBPOT Blockchain Integration - Quick Start

This guide helps you deploy and test the blockchain version of BNBPOT in under 30 minutes.

## Current Status

✅ **Smart Contract**: Complete with Chainlink VRF
✅ **Frontend Integration**: Contract hooks and UI ready
✅ **Event Listener**: Backend syncs blockchain to database
✅ **Deployment Scripts**: BSC Testnet ready
⏸️ **Not Deployed**: Requires your action to deploy

## What You Have

- **Full-featured smart contract** (`contracts/JackpotCarousel.sol`)
- **Provably-fair randomness** using Chainlink VRF
- **Complete frontend integration** with wallet signing
- **Event indexing** for UI performance
- **Security features**: reentrancy protection, pausable, multi-sig ready

## Quick Start (Testnet - Free)

### Prerequisites (5 minutes)

1. **Install MetaMask**: https://metamask.io
2. **Get Test BNB**: https://testnet.bnbchain.org/faucet-smart
3. **Get Test LINK**: https://faucets.chain.link/bsc-testnet

### Deploy Contract (10 minutes)

```bash
# 1. Set up environment
cp .env.example .env

# 2. Edit .env and add:
DEPLOYER_PRIVATE_KEY=your_wallet_private_key_here
VRF_SUBSCRIPTION_ID=your_chainlink_subscription_id

# 3. Compile contract
cd contracts
npx hardhat compile

# 4. Deploy to testnet
npx hardhat run scripts/deploy.ts --network bscTestnet
```

### Configure Frontend (5 minutes)

After deployment, update `.env`:

```bash
VITE_CONTRACT_ADDRESS=0x... # from deployment output
VITE_BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
```

### Test It (10 minutes)

```bash
# 1. Start the application
npm run dev

# 2. Connect wallet (MetaMask on BSC Testnet)
# 3. Place a bet (minimum 0.001 tBNB)
# 4. Wait 90 seconds
# 5. Call settleRound()
# 6. VRF provides randomness
# 7. Winner gets paid!
```

## How It Works

### 1. Smart Contract (On-Chain)

The `JackpotCarousel` contract handles:
- **Bet escrow**: Holds all funds securely
- **Round lifecycle**: 90-second timer
- **VRF randomness**: Chainlink provides verifiable random numbers
- **Winner selection**: Weighted random based on bet amounts
- **Automatic payouts**: Winner receives 95% of pot

### 2. Frontend (Your Browser)

The React app:
- **Connects wallet**: MetaMask integration
- **Signs transactions**: Your wallet signs all bets
- **Shows pending**: Ghost cards while tx confirms
- **Displays winner**: Carousel animation when VRF resolves

### 3. Backend (Indexer)

The Node.js server:
- **Listens to events**: `BetPlaced`, `WinnerSelected`, etc.
- **Syncs to database**: For fast UI queries
- **Does NOT determine winners**: Blockchain is source of truth

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      USER'S BROWSER                          │
│  ┌───────────────┐          ┌─────────────────┐            │
│  │  React App    │◄────────►│   MetaMask      │            │
│  │  (Frontend)   │          │   (Wallet)      │            │
│  └───────┬───────┘          └────────┬────────┘            │
│          │ Query UI Data             │ Sign Transactions   │
└──────────┼──────────────────────────┼──────────────────────┘
           │                           │
           │                           ▼
           │              ┌────────────────────────────┐
           │              │   BSC Blockchain           │
           │              │   ┌──────────────────────┐ │
           │              │   │ JackpotCarousel.sol  │ │
           │              │   │ - placeBet()         │ │
           │              │   │ - settleRound()      │ │
           │              │   │ - VRF Integration    │ │
           │              │   └──────────────────────┘ │
           │              │                             │
           │              │  Events:                    │
           │              │  ✓ BetPlaced               │
           │              │  ✓ WinnerSelected          │
           │              └──────────┬──────────────────┘
           │                         │
           ▼                         │ Events
    ┌──────────────┐                │
    │  Backend     │◄───────────────┘
    │  (Indexer)   │
    │              │
    │  ┌────────┐  │
    │  │  DB    │  │
    │  └────────┘  │
    └──────────────┘
```

## Cost Breakdown

### Testnet (FREE for Testing)
- ✅ Contract deployment: FREE (test BNB from faucet)
- ✅ VRF randomness: FREE (test LINK from faucet)
- ✅ Place bets: FREE (test BNB)
- ✅ Settle rounds: FREE

### Mainnet (Real Money)
- Contract deployment: ~$5-10 USD (one-time)
- VRF per round: ~$0.50-1 USD (paid in LINK)
- User gas fees: ~$0.10-0.50 per bet

## Security Features

✅ **Chainlink VRF**: Verifiable randomness (impossible to manipulate)
✅ **Reentrancy Protection**: Secure against attacks
✅ **Pausable**: Emergency stop button
✅ **Multi-sig Ready**: Admin functions need multiple signatures
✅ **Integer Math Only**: No rounding errors
✅ **Checks-Effects-Interactions**: Secure payment pattern
✅ **Emergency Refund**: 72-hour timeout protection

## Contract Functions

### User Functions
- `placeBet()`: Place a bet in the current round
- `settleRound()`: End round and trigger VRF (anyone can call)

### Admin Functions (Owner Only)
- `pause()` / `unpause()`: Emergency control
- `withdrawFees()`: Collect house fees (5%)
- `setFeeRecipient()`: Change fee address
- `emergencyRefund()`: Refund stuck rounds (72hr+ timeout)

### View Functions
- `getCurrentRound()`: Get round info
- `getPlayerBet()`: Check player's bet amount
- `getPlayerChance()`: Get win probability
- `getPlayers()`: List all players in round

## Testing Checklist

Before mainnet, test these scenarios on testnet:

- [ ] Single player bet → auto-wins
- [ ] Multiple players → VRF selects winner
- [ ] Max players (100) → contract handles
- [ ] Bet below minimum → rejects
- [ ] Bet above maximum → rejects
- [ ] Round expires → can settle
- [ ] VRF fails → emergency refund works
- [ ] Pause/unpause → blocks/allows bets
- [ ] Fee withdrawal → owner receives

## Troubleshooting

### "Contract not available"
**Problem**: Frontend can't find contract
**Solution**: Check `VITE_CONTRACT_ADDRESS` in `.env`

### "Insufficient funds"
**Problem**: Not enough tBNB for gas
**Solution**: Get more from faucet: https://testnet.bnbchain.org/faucet-smart

### "VRF request failed"
**Problem**: Contract not added to VRF subscription
**Solution**: Go to https://vrf.chain.link and add contract as consumer

### "Transaction reverted"
**Problem**: Contract call failed
**Solution**: Check logs for specific error (minimum bet, max players, etc.)

## Next Steps

1. **Test on Testnet** (this week)
   - Deploy contract
   - Place test bets
   - Verify VRF works
   - Test all edge cases

2. **Security Audit** (before mainnet)
   - Hire professional auditor
   - Fix any issues found
   - Re-audit after fixes

3. **Mainnet Deployment** (after audit)
   - Deploy to BSC mainnet
   - Set up multi-sig wallet
   - Monitor closely
   - Start with low limits

## Resources

- **Smart Contract**: `contracts/JackpotCarousel.sol`
- **Deployment Guide**: `BLOCKCHAIN_DEPLOYMENT_GUIDE.md`
- **Frontend Hook**: `client/src/hooks/useJackpotContract.ts`
- **Event Listener**: `server/blockchainEventListener.ts`

- **Chainlink VRF**: https://vrf.chain.link
- **BSC Testnet Faucet**: https://testnet.bnbchain.org/faucet-smart
- **BSCScan Testnet**: https://testnet.bscscan.com
- **Hardhat Docs**: https://hardhat.org

## Support

Questions? Check:
1. `BLOCKCHAIN_DEPLOYMENT_GUIDE.md` - Detailed deployment steps
2. `contracts/scripts/test-local.ts` - Local testing example
3. Smart contract comments - Inline documentation

---

**Ready to deploy?** Follow the "Deploy Contract" steps above!

**Need help?** Read `BLOCKCHAIN_DEPLOYMENT_GUIDE.md` for detailed instructions.

**Want to test locally first?** Run `npx hardhat run scripts/test-local.ts --network hardhat`
