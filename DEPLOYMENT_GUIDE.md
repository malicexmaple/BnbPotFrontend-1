# Smart Contract Deployment Guide

## ⚠️ CRITICAL: Keeper Requirement

This smart contract **REQUIRES** a backend keeper service to function properly!

**Without the keeper:**
- Rounds will NEVER end automatically
- Player funds will remain LOCKED forever
- Winner selection will NEVER happen

**The keeper service automatically calls `endRound()` when the timer expires.**

## Prerequisites

Before deploying the smart contract, you need:

1. ✅ **MetaMask wallet** with BNB Chain Testnet configured
2. ✅ **Deployer wallet with testnet BNB** (~0.1 tBNB for deployment + testing)
   - Get from: https://www.bnbchain.org/en/testnet-faucet
3. ✅ **Keeper wallet with testnet BNB** (~0.05 tBNB for gas fees)
   - Can be same or different wallet
   - Needs enough BNB to call endRound() multiple times
4. ✅ **Private keys** from both wallets (see below)

## Getting Your Private Key

⚠️ **SECURITY WARNING**: Never share or commit your private key!

### From MetaMask:
1. Open MetaMask
2. Click the 3 dots menu (top right)
3. Click "Account Details"
4. Click "Show Private Key"
5. Enter your password
6. Copy the private key (starts with `0x`)

## Deployment Steps

### 1. Set Up Environment Variables

Create or update `.env` file in the project root:

```bash
# Database (should already exist)
DATABASE_URL=your_database_url_here

# BNB Chain Testnet RPC (default provided)
BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.bnbchain.org:8545

# Deployer wallet private key (KEEP SECRET!)
DEPLOYER_PRIVATE_KEY=0xYourDeployerPrivateKeyHere

# Keeper wallet private key (KEEP SECRET!)
# This wallet will automatically end rounds when timers expire
KEEPER_PRIVATE_KEY=0xYourKeeperPrivateKeyHere

# Contract address (will be filled after deployment)
CONTRACT_ADDRESS=
```

### 2. Install Dependencies (if not already installed)

```bash
npm install
```

### 3. Compile the Smart Contract

```bash
npx hardhat compile
```

You should see:
```
Compiled 1 Solidity file successfully (evm target: paris).
```

### 4. Deploy to BNB Chain Testnet

```bash
npx hardhat run scripts/deploy.ts --network bscTestnet
```

Expected output:
```
🚀 Deploying JackpotGame contract to BNB Chain Testnet...

📝 Deploying contract...

✅ JackpotGame deployed successfully!
📍 Contract Address: 0x1234567890abcdef...
🔗 View on BSCScan: https://testnet.bscscan.com/address/0x1234...

📊 Initial Round Info:
   Round ID: 1
   Start Time: 2025-11-21T...
   Is Active: true

💡 Next Steps:
1. Copy the contract address above
2. Add it to your .env file as CONTRACT_ADDRESS
3. Restart the server to start the keeper
4. Test placing bets with testnet BNB!

📄 Deployment info saved to deployment.json
```

### 5. Save Contract Address

Copy the contract address from the output and add it to your `.env` file:

```bash
CONTRACT_ADDRESS=0xYourContractAddressHere
```

### 6. Restart the Server (Start Keeper)

The keeper service will automatically start when you restart:

```bash
# Ctrl+C to stop current server, then
npm run dev
```

You should see:
```
✅ Keeper connected to network: BNB Smart Chain Testnet Chain ID: 97
✅ Keeper wallet: 0xYour...Keeper...Address
✅ Monitoring contract: 0xYour...Contract...Address
✅ Contract keeper started
```

### 7. Verify Contract on BSCScan (Optional but Recommended)

```bash
npx hardhat verify --network bscTestnet 0xYourContractAddress
```

This makes your contract source code visible on BSCScan Testnet.

## Testing the Deployment

### 1. Check Contract on BSCScan

Visit: `https://testnet.bscscan.com/address/YOUR_CONTRACT_ADDRESS`

You should see:
- Contract creation transaction
- Contract balance: 0 tBNB
- Contract code (if verified)

### 2. Read Contract Data

On BSCScan, go to "Contract" → "Read Contract":
- Click `getCurrentRound()` to see active round info
- Click `currentRoundId()` to see the current round number
- Click `MIN_BET()` to see minimum bet requirement (0.001 BNB)
- Click `keeper()` to see the keeper address

### 3. Test Keeper is Working

1. Place a bet using the frontend
2. Wait 90 seconds
3. Check server logs - you should see:
   ```
   ⏰ Round timer expired, ending round...
   📝 Transaction sent: 0x...
   ✅ Round ended successfully
   🏆 Winner: 0x...
   💰 Prize: X.XXX BNB
   ```

### 4. Test in Frontend

Once deployed and keeper running:
1. Connect your wallet
2. Place bets using testnet BNB
3. See real blockchain transactions
4. Wait 90 seconds for automatic round finalization
5. Win real testnet prizes!

## Contract Features

### Game Rules
- **Round Duration**: 90 seconds after first bet
- **Minimum Bet**: 0.001 tBNB
- **Maximum Players**: 100 per round (prevents gas DoS)
- **House Fee**: 5% (95% goes to winner)
- **Winner Selection**: Weighted random (more you bet, higher chance to win)
- **Emergency Failsafe**: Owner can manually end rounds after 1 hour if keeper fails

### Key Functions

#### For Players:
- `placeBet()` - Place a bet in current round (payable)
- `getCurrentRound()` - View current round info
- `getPlayerBetAmount(address)` - Check your total bet
- `getTimeRemaining()` - See seconds left in round
- `getCurrentPlayers()` - See all players in round

#### For Keeper (Automated):
- `endRound()` - Finalize round and select winner (callable after time expires)

#### For Owner:
- `withdrawHouseFees()` - Withdraw accumulated house fees
- `setKeeper(address)` - Change keeper address
- `emergencyEndRound()` - Manual round end if keeper fails (1 hour delay)

### Security Features

✅ **Reentrancy Protection**: All payable functions protected
✅ **Checks-Effects-Interactions Pattern**: State changed before external calls
✅ **Gas Optimization**: Mappings instead of unbounded arrays
✅ **Max Players Limit**: Prevents gas DoS attacks
✅ **Emergency Failsafe**: Owner can rescue funds if keeper fails

⚠️ **Testnet-Only Limitations**:
- Randomness uses blockhash (manipulable by validators)
- Not suitable for mainnet without Chainlink VRF
- Clearly documented in contract code

## Keeper Service Details

### What Does the Keeper Do?

The keeper service:
1. Checks the contract every 10 seconds
2. Detects when round timer expires
3. Automatically calls `endRound()`
4. Selects winner and distributes prize
5. Starts next round

### Keeper Wallet Requirements

- Needs ~0.001 BNB per round finalization
- Should maintain balance of ~0.05 BNB minimum
- Can be same wallet as deployer or separate
- Monitor balance regularly to prevent service interruption

### Monitoring Keeper Health

Check keeper status in server logs:
```
✅ Contract keeper started          // Keeper is running
⏰ Round timer expired              // Detected expired round
📝 Transaction sent: 0x...          // Sending endRound transaction
✅ Round ended successfully         // Transaction confirmed
🏆 Winner: 0x...                    // Winner selected
💰 Prize: X.XXX BNB                 // Prize distributed
```

If you see errors:
```
❌ Failed to end round: insufficient funds
  // Solution: Add more tBNB to keeper wallet

⚠️ Keeper wallet needs more BNB for gas!
  // Solution: Send tBNB to keeper address
```

## Troubleshooting

### "insufficient funds for gas"
- **Deployer**: Get more tBNB from faucet (~0.05 tBNB needed)
- **Keeper**: Send more tBNB to keeper wallet

### "nonce has already been used"
- Clear transaction queue in MetaMask
- Try again with higher gas

### "invalid private key"
- Make sure private key is in .env
- Private key MUST start with `0x`
- No spaces or quotes around the key

### Deployment fails
- Check you're on BNB Chain Testnet (Chain ID: 97)
- Verify you have enough tBNB
- Check your internet connection
- Try alternative RPC: `https://data-seed-prebsc-2-s1.bnbchain.org:8545`

### Keeper not working
- Check .env has CONTRACT_ADDRESS set
- Check .env has KEEPER_PRIVATE_KEY set
- Restart server after setting env vars
- Check keeper wallet has tBNB for gas
- Check server logs for keeper errors

### Rounds not ending
1. Check keeper is running (look for startup message in logs)
2. Check keeper wallet balance
3. Wait - keeper checks every 10 seconds
4. If > 1 hour, owner can call `emergencyEndRound()`

## Cost Estimates

### Deployment Costs (One-Time)
- Deploy Contract: ~0.005 - 0.01 tBNB
- Verify Contract: Free

### Operating Costs (Per Round)
- Place Bet: ~0.0001 tBNB per bet (paid by player)
- End Round (Keeper): ~0.0002 - 0.0005 tBNB (paid by keeper)
- Withdraw Fees (Owner): ~0.0001 tBNB

All costs are negligible on testnet!

## Security Notes

🔒 **Important Security Reminders:**
- Never commit `.env` file to git (already in .gitignore)
- Never share your private keys
- Keep backup of private keys securely encrypted
- This is testnet - no real money at risk
- Before mainnet:
  - Implement Chainlink VRF for secure randomness
  - Professional security audit required
  - Consider Chainlink Automation for keeper
  - Insurance/bonding for keeper wallet

## Next Steps After Deployment

1. ✅ Contract deployed to testnet
2. ✅ Keeper running and monitoring
3. ⏭️ Test placing bets with real wallet
4. ⏭️ Test complete round flow
5. ⏭️ Monitor transactions on BSCScan
6. ⏭️ Monitor keeper logs for health

---

**Ready to deploy?** Make sure you have:
- [x] Testnet BNB in deployer wallet
- [x] Testnet BNB in keeper wallet
- [x] Private keys in .env file
- [x] Understanding of keeper requirement

Then run: `npx hardhat compile && npx hardhat run scripts/deploy.ts --network bscTestnet`
