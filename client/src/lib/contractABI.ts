/**
 * JackpotCarousel Contract ABI
 * This will be automatically generated after contract compilation
 * For now, this is a typed interface matching the contract
 */

export const JACKPOT_CAROUSEL_ABI = [
  // Read Functions
  "function getCurrentRound() view returns (uint256 id, uint256 startTimestamp, uint256 deadlineTimestamp, uint256 totalPot, address winner, uint8 status, uint256 playerCount)",
  "function getRound(uint256 roundId) view returns (uint256 id, uint256 startTimestamp, uint256 deadlineTimestamp, uint256 totalPot, address winner, uint8 status, uint256 playerCount)",
  "function getPlayerBet(uint256 roundId, address player) view returns (uint256)",
  "function getPlayers(uint256 roundId) view returns (address[])",
  "function getPlayerChance(uint256 roundId, address player) view returns (uint256)",
  "function currentRoundId() view returns (uint256)",
  "function houseFeeCollected() view returns (uint256)",
  "function paused() view returns (bool)",
  "function owner() view returns (address)",
  "function feeRecipient() view returns (address)",
  
  // Write Functions
  "function placeBet() payable",
  "function settleRound()",
  
  // Admin Functions
  "function withdrawFees()",
  "function pause()",
  "function unpause()",
  "function setFeeRecipient(address)",
  "function transferOwnership(address)",
  "function emergencyRefund(uint256 roundId)",
  
  // Events
  "event BetPlaced(uint256 indexed roundId, address indexed bettor, uint256 amount, uint256 playerTotal, uint256 cumulativePool, uint256 timestamp)",
  "event RoundStarted(uint256 indexed roundId, uint256 startTimestamp, uint256 deadlineTimestamp)",
  "event RoundSettling(uint256 indexed roundId, uint256 vrfRequestId)",
  "event WinnerSelected(uint256 indexed roundId, address indexed winner, uint256 winningAmount, uint256 randomness, uint256 timestamp)",
  "event PayoutCompleted(uint256 indexed roundId, address indexed winner, uint256 amount)",
  "event HouseFeeCollected(uint256 indexed roundId, uint256 amount)",
  "event AdminAction(string action, address indexed by, uint256 timestamp)",
  "event EmergencyWithdraw(uint256 indexed roundId, address indexed recipient, uint256 amount)"
] as const;

// Round status enum matching contract
export enum RoundStatus {
  Inactive = 0,
  Active = 1,
  Settling = 2,
  Settled = 3
}

// Contract constants
export const CONTRACT_CONSTANTS = {
  ROUND_DURATION: 90, // seconds
  MIN_BET: "0.001", // BNB
  MAX_BET: "100", // BNB
  MAX_PLAYERS_PER_ROUND: 100,
  HOUSE_FEE_BPS: 500, // 5% = 500 basis points
} as const;
