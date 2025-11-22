// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title JackpotGame
 * @notice A testnet-only winner-takes-all jackpot betting game
 * 
 * ⚠️ TESTNET ONLY - NOT PRODUCTION READY ⚠️
 * 
 * KNOWN LIMITATIONS:
 * 1. Randomness uses blockhash/prevrandao - manipulable by validators
 * 2. Requires external keeper to call endRound() when time expires
 * 3. No Chainlink VRF or secure randomness oracle
 * 
 * This contract is ONLY suitable for:
 * - Educational purposes
 * - Testnet demonstrations
 * - Local development
 * 
 * DO NOT deploy to mainnet without:
 * - Implementing Chainlink VRF for randomness
 * - Adding automated keeper (Chainlink Automation)
 * - Full security audit
 * - Reentrancy protections in all payable paths
 * 
 * @dev Players place bets, backend/keeper calls endRound() after timer, winner selected
 */
contract JackpotGame {
    
    // Events
    event RoundStarted(uint256 indexed roundId, uint256 startTime);
    event BetPlaced(uint256 indexed roundId, address indexed player, uint256 amount, uint256 newTotal, uint256 totalPot);
    event RoundEnded(uint256 indexed roundId, address indexed winner, uint256 prize);
    
    // Structs
    struct PlayerBet {
        uint256 totalAmount;
        uint256 lastBetTime;
    }
    
    struct Round {
        uint256 id;
        uint256 startTime;
        uint256 endTime;
        uint256 totalPot;
        address winner;
        bool isActive;
        bool isCompleted;
        address[] players; // For iteration during winner selection
        mapping(address => PlayerBet) playerBets; // Efficient storage, no unbounded array
    }
    
    // State variables
    uint256 public currentRoundId;
    uint256 public constant ROUND_DURATION = 90; // 90 seconds
    uint256 public constant MIN_BET = 0.001 ether; // 0.001 BNB minimum bet
    uint256 public constant HOUSE_FEE_PERCENT = 5; // 5% house fee
    uint256 public constant MAX_PLAYERS_PER_ROUND = 100; // Prevent gas DoS
    
    mapping(uint256 => Round) private rounds;
    address public owner;
    address public keeper; // Authorized to call endRound (backend server)
    uint256 public houseFeeCollected;
    
    // Reentrancy guard
    uint256 private locked = 1;
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier onlyKeeper() {
        require(msg.sender == keeper || msg.sender == owner, "Only keeper or owner");
        _;
    }
    
    modifier roundActive() {
        Round storage round = rounds[currentRoundId];
        require(round.isActive, "Round not active");
        
        // Allow betting if no bets yet OR timer hasn't expired
        if (round.endTime > 0) {
            require(block.timestamp < round.endTime, "Round timer expired");
        }
        _;
    }
    
    modifier noReentrant() {
        require(locked == 1, "No reentrancy");
        locked = 2;
        _;
        locked = 1;
    }
    
    constructor() {
        owner = msg.sender;
        keeper = msg.sender; // Owner is initial keeper
        _startNewRound();
    }
    
    /**
     * @notice Set the keeper address (backend server that finalizes rounds)
     * @param _keeper Address authorized to call endRound()
     */
    function setKeeper(address _keeper) external onlyOwner {
        require(_keeper != address(0), "Invalid keeper");
        keeper = _keeper;
    }
    
    /**
     * @notice Place a bet in the current round
     * @dev Bet must be >= MIN_BET and round must be active
     */
    function placeBet() external payable roundActive {
        require(msg.value >= MIN_BET, "Bet too small");
        
        Round storage round = rounds[currentRoundId];
        
        // Check if new player would exceed limit
        if (round.playerBets[msg.sender].totalAmount == 0) {
            require(round.players.length < MAX_PLAYERS_PER_ROUND, "Max players reached");
            round.players.push(msg.sender);
        }
        
        // Update player's total bet (efficient storage)
        round.playerBets[msg.sender].totalAmount += msg.value;
        round.playerBets[msg.sender].lastBetTime = block.timestamp;
        round.totalPot += msg.value;
        
        // If this is the first bet, set the end time
        if (round.endTime == 0) {
            round.endTime = block.timestamp + ROUND_DURATION;
        }
        
        emit BetPlaced(
            currentRoundId, 
            msg.sender, 
            msg.value,
            round.playerBets[msg.sender].totalAmount,
            round.totalPot
        );
    }
    
    /**
     * @notice End the current round and select a winner
     * @dev Should be called by keeper/backend when timer expires
     * IMPORTANT: Keeper MUST call this within reasonable time or funds remain locked!
     */
    function endRound() external onlyKeeper noReentrant {
        Round storage round = rounds[currentRoundId];
        require(round.isActive, "Round not active");
        require(round.endTime > 0, "Round not started");
        require(block.timestamp >= round.endTime, "Timer not expired");
        
        // Mark as inactive BEFORE any external calls (reentrancy protection)
        round.isActive = false;
        round.isCompleted = true;
        
        // Only process payout if there are players and funds
        if (round.players.length > 0 && round.totalPot > 0) {
            // Select winner using weighted random selection
            address winner = _selectWinner(round);
            round.winner = winner;
            
            // Calculate house fee and prize
            uint256 houseFee = (round.totalPot * HOUSE_FEE_PERCENT) / 100;
            uint256 prize = round.totalPot - houseFee;
            
            // Update house fee collected
            houseFeeCollected += houseFee;
            
            // Send prize to winner (after state changes - CEI pattern)
            (bool success, ) = payable(winner).call{value: prize}("");
            require(success, "Prize transfer failed");
            
            emit RoundEnded(currentRoundId, winner, prize);
        }
        // else: No players, just start new round (edge case but safe to handle)
        
        // Start new round
        _startNewRound();
    }
    
    /**
     * @notice Get current round information
     * @return Round information
     */
    function getCurrentRound() external view returns (
        uint256 id,
        uint256 startTime,
        uint256 endTime,
        uint256 totalPot,
        uint256 playerCount,
        bool isActive,
        bool isCompleted
    ) {
        Round storage round = rounds[currentRoundId];
        return (
            round.id,
            round.startTime,
            round.endTime,
            round.totalPot,
            round.players.length,
            round.isActive,
            round.isCompleted
        );
    }
    
    /**
     * @notice Get player's total bet amount in current round
     * @param player Player address
     * @return Total bet amount
     */
    function getPlayerBetAmount(address player) external view returns (uint256) {
        return rounds[currentRoundId].playerBets[player].totalAmount;
    }
    
    /**
     * @notice Get all players in current round (for UI display)
     * @return Array of player addresses
     */
    function getCurrentPlayers() external view returns (address[] memory) {
        return rounds[currentRoundId].players;
    }
    
    /**
     * @notice Get player bet info in current round
     * @param player Player address
     * @return amount Total bet amount
     * @return lastBetTime Timestamp of last bet
     */
    function getPlayerInfo(address player) external view returns (uint256 amount, uint256 lastBetTime) {
        Round storage round = rounds[currentRoundId];
        PlayerBet storage bet = round.playerBets[player];
        return (bet.totalAmount, bet.lastBetTime);
    }
    
    /**
     * @notice Withdraw collected house fees (owner only)
     */
    function withdrawHouseFees() external onlyOwner noReentrant {
        uint256 amount = houseFeeCollected;
        require(amount > 0, "No fees to withdraw");
        
        houseFeeCollected = 0;
        
        (bool success, ) = payable(owner).call{value: amount}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @notice Get time remaining in current round
     * @return Seconds remaining (0 if round hasn't started or has ended)
     */
    function getTimeRemaining() external view returns (uint256) {
        Round storage round = rounds[currentRoundId];
        
        if (!round.isActive || round.endTime == 0) {
            return 0;
        }
        
        if (block.timestamp >= round.endTime) {
            return 0;
        }
        
        return round.endTime - block.timestamp;
    }
    
    /**
     * @notice Internal function to start a new round
     * @dev Clears old round data to prevent leakage into new round
     * Note: Old rounds remain in storage for historical queries (intentional)
     */
    function _startNewRound() private {
        // Save the ID of the round being completed
        uint256 completedRoundId = currentRoundId;
        
        // Increment to new round FIRST
        currentRoundId++;
        
        // Clean up the COMPLETED round (not the new one)
        if (completedRoundId > 0) {
            Round storage completedRound = rounds[completedRoundId];
            // Delete each player's bet data
            for (uint256 i = 0; i < completedRound.players.length; i++) {
                delete completedRound.playerBets[completedRound.players[i]];
            }
            // Clear the players array (important to prevent unbounded growth)
            delete completedRound.players;
        }
        
        // Initialize new round (storage slot is fresh, arrays/mappings are empty)
        Round storage newRound = rounds[currentRoundId];
        newRound.id = currentRoundId;
        newRound.startTime = block.timestamp;
        newRound.endTime = 0; // Set when first bet is placed
        newRound.totalPot = 0;
        newRound.isActive = true;
        newRound.isCompleted = false;
        // players array is automatically empty for new mapping entry
        
        emit RoundStarted(currentRoundId, block.timestamp);
    }
    
    /**
     * @notice Internal function to select winner using weighted random selection
     * @dev ⚠️ INSECURE RANDOMNESS - TESTNET ONLY ⚠️
     * 
     * Uses block.timestamp and block.prevrandao which can be manipulated by validators.
     * 
     * For production:
     * - Use Chainlink VRF for verifiable randomness
     * - Or implement commit-reveal scheme
     * - Or use off-chain oracle with signature verification
     * 
     * @param round The round to select winner from
     * @return Winner address
     */
    function _selectWinner(Round storage round) private view returns (address) {
        require(round.players.length > 0, "No players");
        
        // ⚠️ INSECURE - validator can manipulate this value
        uint256 randomSeed = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            round.totalPot,
            round.players.length,
            blockhash(block.number - 1)
        )));
        
        uint256 winningNumber = randomSeed % round.totalPot;
        
        // Weighted random selection based on bet amounts
        uint256 cumulativeWeight = 0;
        for (uint256 i = 0; i < round.players.length; i++) {
            address player = round.players[i];
            uint256 playerBet = round.playerBets[player].totalAmount;
            cumulativeWeight += playerBet;
            
            if (winningNumber < cumulativeWeight) {
                return player;
            }
        }
        
        // Fallback (should never reach here due to modulo operation)
        return round.players[round.players.length - 1];
    }
    
    /**
     * @notice Emergency function to rescue stuck funds (owner only)
     * @dev Only callable if a round has been inactive for > 1 hour
     * Prevents permanent fund lock if keeper fails
     */
    function emergencyEndRound() external onlyOwner noReentrant {
        Round storage round = rounds[currentRoundId];
        require(round.isActive, "Round not active");
        require(round.endTime > 0, "Round not started");
        require(block.timestamp >= round.endTime + 1 hours, "Use normal endRound");
        
        // Mark as inactive BEFORE transfers
        round.isActive = false;
        round.isCompleted = true;
        
        // Only process payout if there are players and funds
        if (round.players.length > 0 && round.totalPot > 0) {
            // Select winner and pay out
            address winner = _selectWinner(round);
            round.winner = winner;
            
            uint256 houseFee = (round.totalPot * HOUSE_FEE_PERCENT) / 100;
            uint256 prize = round.totalPot - houseFee;
            houseFeeCollected += houseFee;
            
            (bool success, ) = payable(winner).call{value: prize}("");
            require(success, "Emergency prize transfer failed");
            
            emit RoundEnded(currentRoundId, winner, prize);
        } else if (round.totalPot > 0) {
            // Edge case: pot exists but no players (shouldn't happen, but handle it)
            // Send pot to house fee to prevent funds being locked
            houseFeeCollected += round.totalPot;
        }
        // else: No players and no pot, just start new round safely
        
        _startNewRound();
    }
}
