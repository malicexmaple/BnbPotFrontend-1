# Blockchain Deployment Guide

This guide walks you through deploying the BNBPOT smart contract to BSC (Binance Smart Chain) testnet and mainnet.

## Prerequisites

### 1. Install Dependencies

The contract compilation dependencies are already installed via the main package.json:
- `hardhat` - Ethereum development environment
- `@nomicfoundation/hardhat-toolbox` - Complete Hardhat plugin bundle
- `@chainlink/contracts` - Chainlink VRF for randomness
- `ethers` - Ethereum library

### 2. Get Testnet BNB

For BSC Testnet deployment, you'll need test BNB:

1. **Create a wallet** (if you don't have one):
   - Install MetaMask browser extension
   - Create a new wallet and save your seed phrase securely
   
2. **Add BSC Testnet to MetaMask**:
   - Network Name: BSC Testnet
   - RPC URL: `https://data-seed-prebsc-1-s1.binance.org:8545`
   - Chain ID: `97`
   - Currency Symbol: `tBNB`
   - Block Explorer: `https://testnet.bscscan.com`

3. **Get test BNB from faucet**:
   - Visit: https://testnet.bnbchain.org/faucet-smart
   - Enter your wallet address
   - Receive 0.5 tBNB (refresh every 24 hours)

### 3. Set Up Chainlink VRF Subscription

Chainlink VRF provides verifiable randomness for fair winner selection.

**For BSC Testnet:**

1. Visit https://vrf.chain.link
2. Connect your MetaMask wallet (BSC Testnet)
3. Click "Create Subscription"
4. Note your Subscription ID
5. Fund subscription with testnet LINK:
   - Get testnet LINK from: https://faucets.chain.link/bsc-testnet
   - Add at least 5 LINK to subscription

**For BSC Mainnet:**

1. Same process as testnet but use mainnet LINK
2. Requires real LINK tokens (purchase on exchange)
3. Recommend starting with 20 LINK

## Environment Setup

Create a `.env` file in the project root:

```bash
# Deployment wallet private key (NEVER commit this to git!)
DEPLOYER_PRIVATE_KEY=your_private_key_here

# Chainlink VRF Subscription ID
VRF_SUBSCRIPTION_ID=your_subscription_id_here

# RPC URLs (optional - uses public RPC if not set)
BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545
BSC_MAINNET_RPC=https://bsc-dataseed1.binance.org

# BSCScan API key for contract verification (optional)
BSCSCAN_API_KEY=your_bscscan_api_key_here

# Server-side environment variables (REQUIRED for blockchain mode)
CONTRACT_ADDRESS=will_be_set_after_deployment
VITE_BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545

# Frontend environment variables (for wallet interaction)
VITE_CONTRACT_ADDRESS=will_be_set_after_deployment
```

**⚠️ Important Environment Variable Notes:**
- `CONTRACT_ADDRESS` - Server-side variable used by event listener to sync blockchain events to database
- `VITE_CONTRACT_ADDRESS` - Frontend variable used by browser wallet to interact with contract
- `VITE_BSC_RPC_URL` - RPC endpoint for blockchain reads (both server and frontend)
- Both must be set to the same contract address after deployment

**⚠️ Security Warning:**
- NEVER share your private key
- NEVER commit `.env` to git (already in `.gitignore`)
- Use a dedicated wallet for deployment (not your main wallet)
- Export private key from MetaMask: Settings → Advanced → Export Private Key

## Deployment Steps

### Step 1: Compile Contract

```bash
cd contracts
npx hardhat compile
```

You should see:
```
Compiled 1 Solidity file successfully
```

### Step 2: Test Locally (Recommended)

Test on local Hardhat network before deploying to testnet:

```bash
npx hardhat run scripts/test-local.ts --network hardhat
```

This will:
- Deploy a mock VRF coordinator
- Deploy the JackpotCarousel contract
- Simulate 3 players placing bets
- Fast-forward time and settle the round
- Verify winner selection works

### Step 3: Deploy to BSC Testnet

```bash
npx hardhat run scripts/deploy.ts --network bscTestnet
```

Expected output:
```
====================================
BNBPOT Contract Deployment
====================================
Deploying contracts with account: 0x...
Account balance: 0.5 BNB
Network: bsc-testnet Chain ID: 97

Using BSC Testnet VRF configuration
VRF Coordinator: 0x6A2AAd07396B36Fe02a22b33cf443582f682c82f
Key Hash: 0xd4bb89654db74673a187bd804519e65e3f71a52bc55f11da7601a13dcf505314
Subscription ID: 1234

Deploying JackpotCarousel...
✅ JackpotCarousel deployed to: 0x... [CONTRACT_ADDRESS]

====================================
⚠️ IMPORTANT: Post-Deployment Steps
====================================
1. Add this contract as a consumer to your VRF subscription:
   https://vrf.chain.link

2. Set environment variables:
   VITE_CONTRACT_ADDRESS=0x... [copy this address]

3. Verify contract on BSCScan:
   npx hardhat verify --network bscTestnet ...

4. Test the deployment
====================================
```

### Step 4: Add Contract as VRF Consumer

**Critical Step - Contract won't work without this!**

1. Go to https://vrf.chain.link
2. Select your subscription
3. Click "Add Consumer"
4. Paste your deployed contract address
5. Confirm transaction

### Step 5: Update Environment Variables

Add the deployed contract address to your `.env`:

```bash
VITE_CONTRACT_ADDRESS=0x... [your deployed address]
```

### Step 6: Verify Contract on BSCScan

Makes your code publicly auditable:

```bash
npx hardhat verify --network bscTestnet [CONTRACT_ADDRESS] \
  "0x6A2AAd07396B36Fe02a22b33cf443582f682c82f" \
  "[YOUR_SUBSCRIPTION_ID]" \
  "0xd4bb89654db74673a187bd804519e65e3f71a52bc55f11da7601a13dcf505314"
```

After verification, your contract source code will be visible on:
https://testnet.bscscan.com/address/[CONTRACT_ADDRESS]#code

### Step 7: Test Deployment

1. **Start the application**:
   ```bash
   npm run dev
   ```

2. **Connect wallet** (MetaMask on BSC Testnet)

3. **Place a test bet**:
   - Click "Place Bet"
   - Enter amount (minimum 0.001 tBNB)
   - Confirm transaction in MetaMask
   - Wait for confirmation

4. **Watch the round**:
   - Timer starts at 90 seconds
   - Add more bets if desired
   - After timer expires, anyone can call `settleRound()`
   - VRF will provide randomness
   - Winner receives payout automatically

## Mainnet Deployment

**⚠️ IMPORTANT: Only deploy to mainnet after extensive testnet testing!**

### Pre-Mainnet Checklist

- [ ] Successfully tested on testnet for at least 2 weeks
- [ ] Multiple rounds completed without errors
- [ ] VRF randomness working correctly
- [ ] All edge cases tested (single bet, max players, etc.)
- [ ] Security audit completed (recommended: 2 independent audits)
- [ ] Legal compliance reviewed
- [ ] Emergency procedures documented
- [ ] Monitoring and alerts configured

### Mainnet Deployment Command

```bash
npx hardhat run scripts/deploy.ts --network bscMainnet
```

**Mainnet VRF Configuration:**
- VRF Coordinator: `0xc587d9053cd1118f25F645F9E08BB98c9712A4EE`
- Key Hash: `0x17cd473250a9a479dc7f234c64332ed4bc8af9e8ded7556aa6e66d83da49f470`
- Requires real LINK tokens (not free)

## Smart Contract Addresses

### BSC Testnet
- VRF Coordinator: `0x6A2AAd07396B36Fe02a22b33cf443582f682c82f`
- LINK Token: `0x84b9B910527Ad5C03A9Ca831909E21e236EA7b06`

### BSC Mainnet
- VRF Coordinator: `0xc587d9053cd1118f25F645F9E08BB98c9712A4EE`
- LINK Token: `0x404460C6A5EdE2D891e8297795264fDe62ADBB75`

## Troubleshooting

### "VRF_SUBSCRIPTION_ID not set"
- Create VRF subscription at https://vrf.chain.link
- Add subscription ID to `.env` file

### "Insufficient funds for transaction"
- Get more testnet BNB from faucet
- Check gas price in `hardhat.config.ts`

### "VRF request not fulfilled"
- Ensure contract is added as VRF consumer
- Check subscription has enough LINK
- Wait a few blocks (VRF takes 3 confirmations)

### "Transaction reverted"
- Check contract is not paused
- Verify bet amount is between MIN_BET and MAX_BET
- Ensure round timer hasn't expired

## Gas Costs (Estimates)

**BSC Testnet/Mainnet:**
- Deploy contract: ~2-3M gas (~$5-10 USD on mainnet)
- Place bet: ~100-150k gas (~$0.50-1 USD)
- Settle round: ~200-300k gas (~$1-2 USD)
- VRF callback: ~150-200k gas (paid by LINK)

## Security Best Practices

1. **Never share private keys** - Use hardware wallet for mainnet
2. **Use multi-sig for admin functions** - Gnosis Safe recommended
3. **Monitor contract activity** - Set up alerts for large bets
4. **Test emergency procedures** - Practice pause/refund flows
5. **Keep VRF subscription funded** - Auto-top-up recommended
6. **Regular security audits** - After any contract changes

## Support Resources

- Chainlink VRF Docs: https://docs.chain.link/vrf/v2/subscription/supported-networks
- Hardhat Docs: https://hardhat.org/docs
- BSC Docs: https://docs.bnbchain.org
- BSCScan: https://bscscan.com (mainnet) / https://testnet.bscscan.com (testnet)

## Next Steps

After successful deployment:
1. Update frontend to use contract address
2. Test all user flows (bet, settle, withdraw fees)
3. Monitor for any issues
4. Prepare for mainnet deployment (if on testnet)
5. Set up monitoring and alerts
6. Document emergency procedures

---

*Last Updated: November 22, 2025*
*Contract Version: 1.0.0*
*Blockchain: BSC (Binance Smart Chain)*
