# BNBPot Smart Contract

## Overview
This is a provably fair jackpot contract for the BNBPot platform on Binance Smart Chain.

## Features
- **Weighted Random Selection**: Players with higher bets have proportionally higher chances to win
- **Provably Fair**: Winner selection is deterministic based on blockchain data
- **Automatic Rounds**: New rounds start immediately after the previous one ends
- **House Fee**: Configurable house fee (default 2.5%)
- **Minimum/Maximum Bets**: Configurable bet limits to ensure fair play

## Game Mechanics

### How It Works
1. **Betting**: Players send BNB to place bets during an active round
2. **Win Chance**: Each BNB bet represents "tickets" - more BNB = higher win probability
3. **Round End**: After 5 minutes, anyone can call `endRound()` to trigger winner selection
4. **Winner Selection**: A random number determines the winner based on weighted probability
5. **Payout**: Winner receives the pot minus the house fee (default 97.5% of pot)

### Example
```
Round Pot: 10 BNB
- Player A bets: 3 BNB → 30% win chance
- Player B bets: 2 BNB → 20% win chance  
- Player C bets: 5 BNB → 50% win chance

Winner selected randomly weighted by bet amounts
Winner receives: 9.75 BNB (10 BNB - 2.5% fee)
```

## Deployment Instructions

### Prerequisites
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

### 1. Create Hardhat Config
Create `hardhat.config.js`:
```javascript
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      accounts: [process.env.PRIVATE_KEY]
    },
    bscMainnet: {
      url: "https://bsc-dataseed1.binance.org",
      chainId: 56,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
```

### 2. Compile Contract
```bash
npx hardhat compile
```

### 3. Deploy to BSC Testnet
Create `scripts/deploy.js`:
```javascript
async function main() {
  const BNBPotJackpot = await ethers.getContractFactory("BNBPotJackpot");
  const jackpot = await BNBPotJackpot.deploy();
  await jackpot.deployed();
  
  console.log("BNBPotJackpot deployed to:", jackpot.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

Deploy:
```bash
npx hardhat run scripts/deploy.js --network bscTestnet
```

### 4. Verify on BSCScan
```bash
npx hardhat verify --network bscTestnet DEPLOYED_CONTRACT_ADDRESS
```

## Contract Functions

### User Functions
- `placeBet()` - Place a bet in the current round (payable)
- `endRound()` - End current round and select winner (callable by anyone after round ends)
- `getCurrentRound()` - Get current round information
- `getRoundBets(uint256 roundNumber)` - Get all bets for a round
- `getPlayerWinChance(address player)` - Get player's win percentage in current round

### Admin Functions (Owner Only)
- `setMinBet(uint256 _minBet)` - Update minimum bet
- `setMaxBet(uint256 _maxBet)` - Update maximum bet
- `setRoundDuration(uint256 _duration)` - Update round duration
- `setHouseFee(uint256 _feeBps)` - Update house fee (basis points)
- `withdrawFees()` - Withdraw collected house fees
- `transferOwnership(address newOwner)` - Transfer contract ownership

## Events
```solidity
event RoundStarted(uint256 indexed roundNumber, uint256 startTime);
event BetPlaced(address indexed player, uint256 indexed roundNumber, uint256 amount, uint256 totalPlayerBets, uint256 roundTotal);
event RoundEnded(uint256 indexed roundNumber, uint256 endTime);
event WinnerSelected(address indexed winner, uint256 indexed roundNumber, uint256 prize, uint256 totalBets, uint256 winnerBetAmount);
event HouseFeeCollected(uint256 indexed roundNumber, uint256 fee);
```

## Security Considerations

### Current Implementation
- Uses `block.prevrandao` for randomness (better than `block.difficulty`)
- Pseudo-random but deterministic and verifiable on-chain
- Suitable for smaller stakes

### Production Recommendations
For high-value jackpots, integrate **Chainlink VRF** for provably fair randomness:
1. Makes winner selection truly unpredictable
2. Provides cryptographic proof of fairness
3. Industry standard for blockchain gaming

## Configuration

Default values (can be changed by owner):
- Min Bet: 0.001 BNB
- Max Bet: 10 BNB
- Round Duration: 5 minutes
- House Fee: 2.5% (250 basis points)

## Testing

Create tests in `test/BNBPotJackpot.test.js`:
```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BNBPotJackpot", function () {
  it("Should allow players to place bets", async function () {
    const [owner, player1] = await ethers.getSigners();
    const BNBPotJackpot = await ethers.getContractFactory("BNBPotJackpot");
    const jackpot = await BNBPotJackpot.deploy();
    
    await jackpot.connect(player1).placeBet({ value: ethers.utils.parseEther("0.1") });
    
    const round = await jackpot.getCurrentRound();
    expect(round.totalBets).to.equal(1);
  });
});
```

Run tests:
```bash
npx hardhat test
```

## After Deployment

1. **Save Contract Address**: Add to your environment variables as `VITE_CONTRACT_ADDRESS`
2. **Save ABI**: Copy from `artifacts/contracts/BNBPotJackpot.sol/BNBPotJackpot.json`
3. **Configure Backend**: Set up event listeners for contract events
4. **Test**: Place test bets on testnet before mainnet deployment

## Gas Optimization Tips
- Batch bet placement if possible
- Call `endRound()` promptly to avoid long bet arrays
- Consider gas costs when setting round duration

## License
MIT
