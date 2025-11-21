import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider, Contract, parseEther, formatEther } from 'ethers';

// Contract ABI - updated for new contract structure
const JACKPOT_ABI = [
  "function placeBet() external payable",
  "function getCurrentRound() external view returns (uint256 id, uint256 startTime, uint256 endTime, uint256 totalPot, uint256 playerCount, bool isActive, bool isCompleted)",
  "function getPlayerBetAmount(address player) external view returns (uint256)",
  "function getTimeRemaining() external view returns (uint256)",
  "function getCurrentPlayers() external view returns (address[])",
  "function getPlayerInfo(address player) external view returns (uint256 amount, uint256 lastBetTime)",
  "event BetPlaced(uint256 indexed roundId, address indexed player, uint256 amount, uint256 newTotal, uint256 totalPot)",
  "event RoundEnded(uint256 indexed roundId, address indexed winner, uint256 prize)",
  "event RoundStarted(uint256 indexed roundId, uint256 startTime)"
];

interface RoundInfo {
  id: bigint;
  startTime: bigint;
  endTime: bigint;
  totalPot: bigint;
  playerCount: bigint;
  isActive: boolean;
  isCompleted: boolean;
}

interface ContractState {
  isLoading: boolean;
  error: string | null;
  currentRound: RoundInfo | null;
  playerBetAmount: string;
  timeRemaining: number;
  isContractAvailable: boolean;
}

/**
 * Hook to interact with the JackpotGame smart contract
 * @param walletAddress - Connected wallet address
 * @param contractAddress - Deployed contract address (from .env)
 */
export function useJackpotContract(walletAddress?: string, contractAddress?: string) {
  const [state, setState] = useState<ContractState>({
    isLoading: true,
    error: null,
    currentRound: null,
    playerBetAmount: "0",
    timeRemaining: 0,
    isContractAvailable: false,
  });

  const [contract, setContract] = useState<Contract | null>(null);

  // Initialize contract
  useEffect(() => {
    // If no contract address, we're in database mode
    if (!contractAddress) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        isContractAvailable: false 
      }));
      return;
    }

    if (!window.ethereum) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: "No Web3 provider found",
        isContractAvailable: false 
      }));
      return;
    }

    const initContract = async () => {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const contractInstance = new Contract(contractAddress, JACKPOT_ABI, provider);
        setContract(contractInstance);
        setState(prev => ({ ...prev, isContractAvailable: true }));
      } catch (err: any) {
        console.error("Failed to initialize contract:", err);
        setState(prev => ({
          ...prev,
          error: err.message,
          isLoading: false,
          isContractAvailable: false,
        }));
      }
    };

    initContract();
  }, [contractAddress]);

  // Fetch current round data
  const fetchRoundData = useCallback(async () => {
    if (!contract) return;

    try {
      const roundData = await contract.getCurrentRound();
      const timeLeft = await contract.getTimeRemaining();
      
      let playerBet = "0";
      if (walletAddress) {
        const betAmount = await contract.getPlayerBetAmount(walletAddress);
        playerBet = formatEther(betAmount);
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
        currentRound: {
          id: roundData.id,
          startTime: roundData.startTime,
          endTime: roundData.endTime,
          totalPot: roundData.totalPot,
          playerCount: roundData.playerCount,
          isActive: roundData.isActive,
          isCompleted: roundData.isCompleted,
        },
        playerBetAmount: playerBet,
        timeRemaining: Number(timeLeft),
        isContractAvailable: true,
      }));
    } catch (err: any) {
      console.error("Failed to fetch round data:", err);
      setState(prev => ({
        ...prev,
        error: err.message,
        isLoading: false,
      }));
    }
  }, [contract, walletAddress]);

  // Auto-refresh round data every 5 seconds
  useEffect(() => {
    if (!contract) return;

    fetchRoundData();
    const interval = setInterval(fetchRoundData, 5000);

    return () => clearInterval(interval);
  }, [contract, fetchRoundData]);

  // Listen to contract events
  useEffect(() => {
    if (!contract) return;

    const handleBetPlaced = (roundId: bigint, player: string, amount: bigint, newTotal: bigint, totalPot: bigint) => {
      console.log("🎲 Bet placed on-chain:", { 
        roundId, 
        player, 
        amount: formatEther(amount),
        playerTotal: formatEther(newTotal),
        totalPot: formatEther(totalPot) 
      });
      fetchRoundData(); // Refresh data when bet is placed
    };

    const handleRoundEnded = (roundId: bigint, winner: string, prize: bigint) => {
      console.log("🏆 Round ended on-chain:", { 
        roundId, 
        winner, 
        prize: formatEther(prize) 
      });
      fetchRoundData(); // Refresh data when round ends
    };

    const handleRoundStarted = (roundId: bigint, startTime: bigint) => {
      console.log("🎮 New round started on-chain:", { roundId, startTime });
      fetchRoundData();
    };

    contract.on("BetPlaced", handleBetPlaced);
    contract.on("RoundEnded", handleRoundEnded);
    contract.on("RoundStarted", handleRoundStarted);

    return () => {
      contract.off("BetPlaced", handleBetPlaced);
      contract.off("RoundEnded", handleRoundEnded);
      contract.off("RoundStarted", handleRoundStarted);
    };
  }, [contract, fetchRoundData]);

  /**
   * Place a bet on the current round
   * @param amount - Bet amount in BNB (as string)
   */
  const placeBet = useCallback(async (amount: string): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    if (!contract || !window.ethereum) {
      return { success: false, error: "Contract not available - using database mode" };
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      console.log("📝 Sending blockchain transaction...");
      const tx = await contractWithSigner.placeBet({
        value: parseEther(amount),
        gasLimit: 200000, // Explicit gas limit for safety
      });

      console.log("⏳ Transaction sent:", tx.hash);
      console.log("⏳ Waiting for confirmation...");
      
      const receipt = await tx.wait();
      console.log("✅ Transaction confirmed in block:", receipt.blockNumber);

      await fetchRoundData();
      return { success: true, txHash: tx.hash };
    } catch (err: any) {
      console.error("Failed to place bet on-chain:", err);
      let errorMessage = "Failed to place bet on blockchain";
      
      if (err.code === 4001 || err.code === "ACTION_REJECTED") {
        errorMessage = "Transaction rejected by user";
      } else if (err.message && err.message.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for bet + gas fees";
      } else if (err.message && err.message.includes("Bet too small")) {
        errorMessage = "Bet amount too small (min 0.001 BNB)";
      } else if (err.message && err.message.includes("Round not active")) {
        errorMessage = "Round is not active";
      } else if (err.message && err.message.includes("Timer expired")) {
        errorMessage = "Round timer has expired - waiting for new round";
      } else if (err.message && err.message.includes("Max players reached")) {
        errorMessage = "Maximum players reached for this round";
      } else if (err.message) {
        errorMessage = err.message;
      }

      return { success: false, error: errorMessage };
    }
  }, [contract, fetchRoundData]);

  return {
    ...state,
    // Only expose placeBet if contract is available
    placeBet: state.isContractAvailable ? placeBet : undefined,
    refresh: fetchRoundData,
  };
}
