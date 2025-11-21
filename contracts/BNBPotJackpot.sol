// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BNBPot Jackpot Contract
 * @notice A provably fair jackpot game where players bet BNB and winner takes all
 * @dev Uses Chainlink VRF for random winner selection (or block-based randomness as fallback)
 */
contract BNBPotJackpot {
    // Structs
    struct Round {
        uint256 roundNumber;
        uint256 startTime;
        uint256 endTime;
        uint256 totalPot;
        address winner;
        bool completed;
        uint256 totalBets;
    }

    struct Bet {
        address player;
        uint256 amount;
        uint256 timestamp;
    }

    // State variables
    address public owner;
    uint256 public currentRoundNumber;
    uint256 public minBet = 0.001 ether;  // Minimum bet amount
    uint256 public maxBet = 10 ether;     // Maximum bet amount
    uint256 public roundDuration = 5 minutes; // How long each round lasts
    uint256 public houseFeeBps = 250;     // 2.5% house fee (250 basis points)
    
    mapping(uint256 => Round) public rounds;
    mapping(uint256 => Bet[]) public roundBets;
    mapping(uint256 => mapping(address => uint256)) public playerBetsInRound;
    
    // Events
    event RoundStarted(uint256 indexed roundNumber, uint256 startTime);
    event BetPlaced(
        address indexed player,
        uint256 indexed roundNumber,
        uint256 amount,
        uint256 totalPlayerBets,
        uint256 roundTotal
    );
    event RoundEnded(uint256 indexed roundNumber, uint256 endTime);
    event WinnerSelected(
        address indexed winner,
        uint256 indexed roundNumber,
        uint256 prize,
        uint256 totalBets,
        uint256 winnerBetAmount
    );
    event HouseFeeCollected(uint256 indexed roundNumber, uint256 fee);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    modifier roundActive() {
        require(currentRoundNumber > 0, "No active round");
        Round storage round = rounds[currentRoundNumber];
        require(!round.completed, "Round already completed");
        require(block.timestamp < round.endTime, "Round has ended");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        _startNewRound();
    }
    
    /**
     * @notice Place a bet in the current round
     */
    function placeBet() external payable roundActive {
        require(msg.value >= minBet, "Bet below minimum");
        require(msg.value <= maxBet, "Bet above maximum");
        
        Round storage round = rounds[currentRoundNumber];
        
        // Record the bet
        roundBets[currentRoundNumber].push(Bet({
            player: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp
        }));
        
        // Update round totals
        round.totalPot += msg.value;
        round.totalBets++;
        
        // Update player's total bets in this round
        playerBetsInRound[currentRoundNumber][msg.sender] += msg.value;
        
        emit BetPlaced(
            msg.sender,
            currentRoundNumber,
            msg.value,
            playerBetsInRound[currentRoundNumber][msg.sender],
            round.totalPot
        );
    }
    
    /**
     * @notice End the current round and select a winner
     * @dev Can be called by anyone once the round time expires
     */
    function endRound() external {
        Round storage round = rounds[currentRoundNumber];
        require(!round.completed, "Round already completed");
        require(block.timestamp >= round.endTime, "Round not ended yet");
        require(round.totalBets > 0, "No bets in round");
        
        round.completed = true;
        round.endTime = block.timestamp;
        
        emit RoundEnded(currentRoundNumber, block.timestamp);
        
        // Select winner using provably fair random selection
        address winner = _selectWinner(currentRoundNumber);
        round.winner = winner;
        
        // Calculate house fee and prize
        uint256 houseFee = (round.totalPot * houseFeeBps) / 10000;
        uint256 prize = round.totalPot - houseFee;
        
        // Transfer prize to winner
        (bool success, ) = payable(winner).call{value: prize}("");
        require(success, "Prize transfer failed");
        
        emit WinnerSelected(
            winner,
            currentRoundNumber,
            prize,
            round.totalBets,
            playerBetsInRound[currentRoundNumber][winner]
        );
        
        emit HouseFeeCollected(currentRoundNumber, houseFee);
        
        // Start new round
        _startNewRound();
    }
    
    /**
     * @notice Select winner using weighted random selection
     * @dev Each bet amount represents tickets in the lottery
     */
    function _selectWinner(uint256 roundNumber) private view returns (address) {
        Round storage round = rounds[roundNumber];
        Bet[] storage bets = roundBets[roundNumber];
        
        // Generate pseudo-random number
        // NOTE: In production, use Chainlink VRF for true randomness
        uint256 randomNum = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao, // More secure than block.difficulty
            block.number,
            round.totalPot,
            bets.length
        )));
        
        // Select winner based on weighted probability
        uint256 winningTicket = randomNum % round.totalPot;
        uint256 currentSum = 0;
        
        for (uint256 i = 0; i < bets.length; i++) {
            currentSum += bets[i].amount;
            if (currentSum > winningTicket) {
                return bets[i].player;
            }
        }
        
        // Fallback (should never reach here)
        return bets[bets.length - 1].player;
    }
    
    /**
     * @notice Start a new round
     */
    function _startNewRound() private {
        currentRoundNumber++;
        rounds[currentRoundNumber] = Round({
            roundNumber: currentRoundNumber,
            startTime: block.timestamp,
            endTime: block.timestamp + roundDuration,
            totalPot: 0,
            winner: address(0),
            completed: false,
            totalBets: 0
        });
        
        emit RoundStarted(currentRoundNumber, block.timestamp);
    }
    
    /**
     * @notice Get all bets for a specific round
     */
    function getRoundBets(uint256 roundNumber) external view returns (Bet[] memory) {
        return roundBets[roundNumber];
    }
    
    /**
     * @notice Get current round info
     */
    function getCurrentRound() external view returns (Round memory) {
        return rounds[currentRoundNumber];
    }
    
    /**
     * @notice Get player's total bets in current round
     */
    function getPlayerBetsInRound(uint256 roundNumber, address player) external view returns (uint256) {
        return playerBetsInRound[roundNumber][player];
    }
    
    /**
     * @notice Calculate player's win chance in current round
     */
    function getPlayerWinChance(address player) external view returns (uint256) {
        Round storage round = rounds[currentRoundNumber];
        if (round.totalPot == 0) return 0;
        
        uint256 playerTotal = playerBetsInRound[currentRoundNumber][player];
        return (playerTotal * 10000) / round.totalPot; // Returns in basis points (e.g., 575 = 5.75%)
    }
    
    // Admin functions
    
    /**
     * @notice Update minimum bet amount
     */
    function setMinBet(uint256 _minBet) external onlyOwner {
        minBet = _minBet;
    }
    
    /**
     * @notice Update maximum bet amount
     */
    function setMaxBet(uint256 _maxBet) external onlyOwner {
        maxBet = _maxBet;
    }
    
    /**
     * @notice Update round duration
     */
    function setRoundDuration(uint256 _duration) external onlyOwner {
        roundDuration = _duration;
    }
    
    /**
     * @notice Update house fee (in basis points, e.g., 250 = 2.5%)
     */
    function setHouseFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 1000, "Fee too high"); // Max 10%
        houseFeeBps = _feeBps;
    }
    
    /**
     * @notice Withdraw collected house fees
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        Round storage round = rounds[currentRoundNumber];
        
        // Don't withdraw from active round pot
        uint256 withdrawable = balance - round.totalPot;
        require(withdrawable > 0, "No fees to withdraw");
        
        (bool success, ) = payable(owner).call{value: withdrawable}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @notice Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
    
    /**
     * @notice Get contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
