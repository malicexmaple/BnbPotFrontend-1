import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider, Contract, parseEther, formatEther } from 'ethers';
import { JACKPOT_CAROUSEL_ABI, RoundStatus, CONTRACT_CONSTANTS } from '@/lib/contractABI';

interface RoundInfo {
  id: bigint;
  startTimestamp: bigint;
  deadlineTimestamp: bigint;
  totalPot: bigint;
  winner: string;
  status: RoundStatus;
  playerCount: bigint;
}

interface ContractState {
  isLoading: boolean;
  error: string | null;
  currentRound: RoundInfo | null;
  playerBetAmount: string;
  timeRemaining: number;
  isContractAvailable: boolean;
  playerChance: number;
}

interface PendingTransaction {
  hash: string;
  amount: string;
  timestamp: number;
}

/**
 * Hook to interact with the JackpotCarousel smart contract
 * Implements the technical specification for blockchain integration
 * 
 * @param walletAddress - Connected wallet address
 * @param contractAddress - Deployed contract address (from VITE_CONTRACT_ADDRESS)
 */
export function useJackpotContract(walletAddress?: string, contractAddress?: string) {
  const [state, setState] = useState<ContractState>({
    isLoading: true,
    error: null,
    currentRound: null,
    playerBetAmount: "0",
    timeRemaining: 0,
    isContractAvailable: false,
    playerChance: 0,
  });

  const [contract, setContract] = useState<Contract | null>(null);
  const [pendingTx, setPendingTx] = useState<PendingTransaction | null>(null);

  // Initialize contract
  useEffect(() => {
    // If no contract address, we're in database mode
    if (!contractAddress) {
      console.log("📊 Running in DATABASE MODE (no contract address configured)");
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
        error: "No Web3 provider found. Please install MetaMask.",
        isContractAvailable: false 
      }));
      return;
    }

    const initContract = async () => {
      try {
        console.log("🔗 Connecting to contract:", contractAddress);
        const provider = new BrowserProvider(window.ethereum as any);
        const contractInstance = new Contract(contractAddress, JACKPOT_CAROUSEL_ABI, provider);
        setContract(contractInstance);
        setState(prev => ({ ...prev, isContractAvailable: true }));
        console.log("✅ Contract initialized successfully");
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
      
      let playerBet = "0";
      let playerWinChance = 0;
      
      if (walletAddress && roundData.id) {
        const betAmount = await contract.getPlayerBet(roundData.id, walletAddress);
        playerBet = formatEther(betAmount);
        
        // Get win chance (in basis points: 10000 = 100%)
        const chance = await contract.getPlayerChance(roundData.id, walletAddress);
        playerWinChance = Number(chance) / 100; // Convert to percentage
      }

      // Calculate time remaining
      let timeLeft = 0;
      if (roundData.status === RoundStatus.Active && Number(roundData.deadlineTimestamp) > 0) {
        const now = Math.floor(Date.now() / 1000);
        const deadline = Number(roundData.deadlineTimestamp);
        timeLeft = deadline > now ? deadline - now : 0;
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
        currentRound: {
          id: roundData.id,
          startTimestamp: roundData.startTimestamp,
          deadlineTimestamp: roundData.deadlineTimestamp,
          totalPot: roundData.totalPot,
          winner: roundData.winner,
          status: roundData.status,
          playerCount: roundData.playerCount,
        },
        playerBetAmount: playerBet,
        playerChance: playerWinChance,
        timeRemaining: timeLeft,
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

  // Auto-refresh round data
  useEffect(() => {
    if (!contract) return;

    fetchRoundData();
    const interval = setInterval(fetchRoundData, 3000); // Refresh every 3 seconds

    return () => clearInterval(interval);
  }, [contract, fetchRoundData]);

  // Listen to contract events
  useEffect(() => {
    if (!contract) return;

    const handleBetPlaced = (
      roundId: bigint, 
      bettor: string, 
      amount: bigint, 
      playerTotal: bigint,
      cumulativePool: bigint,
      timestamp: bigint
    ) => {
      console.log("🎲 BetPlaced event:", { 
        roundId: roundId.toString(), 
        bettor, 
        amount: formatEther(amount),
        playerTotal: formatEther(playerTotal),
        cumulativePool: formatEther(cumulativePool),
        timestamp: new Date(Number(timestamp) * 1000).toISOString()
      });
      
      // Clear pending transaction if it matches
      if (pendingTx && bettor.toLowerCase() === walletAddress?.toLowerCase()) {
        console.log("✅ Pending transaction confirmed on-chain");
        setPendingTx(null);
      }
      
      fetchRoundData();
    };

    const handleRoundStarted = (roundId: bigint, startTimestamp: bigint, deadlineTimestamp: bigint) => {
      console.log("🎮 RoundStarted event:", { 
        roundId: roundId.toString(),
        startTime: new Date(Number(startTimestamp) * 1000).toISOString(),
        deadline: new Date(Number(deadlineTimestamp) * 1000).toISOString()
      });
      fetchRoundData();
    };

    const handleRoundSettling = (roundId: bigint, vrfRequestId: bigint) => {
      console.log("⏳ RoundSettling event - VRF requested:", { 
        roundId: roundId.toString(),
        vrfRequestId: vrfRequestId.toString()
      });
      fetchRoundData();
    };

    const handleWinnerSelected = (
      roundId: bigint,
      winner: string,
      winningAmount: bigint,
      randomness: bigint,
      timestamp: bigint
    ) => {
      console.log("🏆 WinnerSelected event:", { 
        roundId: roundId.toString(),
        winner,
        prize: formatEther(winningAmount),
        randomness: randomness.toString(),
        timestamp: new Date(Number(timestamp) * 1000).toISOString()
      });
      fetchRoundData();
    };

    const handlePayoutCompleted = (roundId: bigint, winner: string, amount: bigint) => {
      console.log("💰 PayoutCompleted event:", {
        roundId: roundId.toString(),
        winner,
        amount: formatEther(amount)
      });
      fetchRoundData();
    };

    contract.on("BetPlaced", handleBetPlaced);
    contract.on("RoundStarted", handleRoundStarted);
    contract.on("RoundSettling", handleRoundSettling);
    contract.on("WinnerSelected", handleWinnerSelected);
    contract.on("PayoutCompleted", handlePayoutCompleted);

    return () => {
      contract.off("BetPlaced", handleBetPlaced);
      contract.off("RoundStarted", handleRoundStarted);
      contract.off("RoundSettling", handleRoundSettling);
      contract.off("WinnerSelected", handleWinnerSelected);
      contract.off("PayoutCompleted", handlePayoutCompleted);
    };
  }, [contract, fetchRoundData, walletAddress, pendingTx]);

  /**
   * Estimate gas cost for placing a bet
   * @param amount - Bet amount in BNB (as string)
   */
  const estimateGas = useCallback(async (amount: string): Promise<{ gasLimit: bigint; gasCost: string; total: string; error?: string }> => {
    if (!contract || !window.ethereum) {
      return { 
        gasLimit: 0n, 
        gasCost: "0", 
        total: amount,
        error: "Contract not available" 
      };
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      // Estimate gas
      const gasLimit = await (contractWithSigner as any).estimateGas.placeBet({
        value: parseEther(amount)
      });

      // Get gas price
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || BigInt(0);
      
      const gasCost = gasLimit * gasPrice;
      const total = parseEther(amount) + gasCost;

      return {
        gasLimit,
        gasCost: formatEther(gasCost),
        total: formatEther(total)
      };
    } catch (err: any) {
      console.error("Failed to estimate gas:", err);
      return {
        gasLimit: BigInt(200000),
        gasCost: "0.001", // Rough estimate
        total: (parseFloat(amount) + 0.001).toString(),
        error: err.message
      };
    }
  }, [contract]);

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

      // Validate amount
      const amountNum = parseFloat(amount);
      if (amountNum < parseFloat(CONTRACT_CONSTANTS.MIN_BET)) {
        return { success: false, error: `Minimum bet is ${CONTRACT_CONSTANTS.MIN_BET} BNB` };
      }
      if (amountNum > parseFloat(CONTRACT_CONSTANTS.MAX_BET)) {
        return { success: false, error: `Maximum bet is ${CONTRACT_CONSTANTS.MAX_BET} BNB` };
      }

      console.log("📝 Sending blockchain transaction...");
      console.log("   Amount:", amount, "BNB");
      console.log("   Contract:", await contract.getAddress());
      
      const tx = await (contractWithSigner as any).placeBet({
        value: parseEther(amount),
        gasLimit: BigInt(250000), // Explicit gas limit for safety
      });

      console.log("⏳ Transaction sent:", tx.hash);
      
      // Set pending transaction
      setPendingTx({
        hash: tx.hash,
        amount,
        timestamp: Date.now()
      });

      console.log("⏳ Waiting for confirmation...");
      const receipt = await tx.wait();
      console.log("✅ Transaction confirmed in block:", receipt?.blockNumber);

      await fetchRoundData();
      setPendingTx(null);
      
      return { success: true, txHash: tx.hash };
    } catch (err: any) {
      console.error("Failed to place bet on-chain:", err);
      setPendingTx(null);
      
      let errorMessage = "Failed to place bet on blockchain";
      
      if (err.code === 4001 || err.code === "ACTION_REJECTED") {
        errorMessage = "Transaction rejected by user";
      } else if (err.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for bet + gas fees";
      } else if (err.message?.includes("Bet below minimum")) {
        errorMessage = `Bet too small (minimum ${CONTRACT_CONSTANTS.MIN_BET} BNB)`;
      } else if (err.message?.includes("Bet above maximum")) {
        errorMessage = `Bet too large (maximum ${CONTRACT_CONSTANTS.MAX_BET} BNB)`;
      } else if (err.message?.includes("Round not accepting bets")) {
        errorMessage = "Round is not accepting bets";
      } else if (err.message?.includes("Timer expired")) {
        errorMessage = "Round timer has expired";
      } else if (err.message?.includes("Max players reached")) {
        errorMessage = "Maximum players reached for this round";
      } else if (err.message?.includes("Contract paused")) {
        errorMessage = "Contract is currently paused";
      } else if (err.message) {
        errorMessage = err.message;
      }

      return { success: false, error: errorMessage };
    }
  }, [contract, fetchRoundData]);

  /**
   * Call settleRound() to end the current round
   */
  const settleRound = useCallback(async (): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    if (!contract || !window.ethereum) {
      return { success: false, error: "Contract not available" };
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      console.log("🔔 Calling settleRound()...");
      const tx = await (contractWithSigner as any).settleRound({
        gasLimit: BigInt(500000), // Higher gas for VRF request
      });

      console.log("⏳ Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("✅ Settlement transaction confirmed in block:", receipt?.blockNumber);

      await fetchRoundData();
      return { success: true, txHash: tx.hash };
    } catch (err: any) {
      console.error("Failed to settle round:", err);
      
      let errorMessage = "Failed to settle round";
      if (err.message?.includes("Round not active")) {
        errorMessage = "Round is not active";
      } else if (err.message?.includes("Timer not expired")) {
        errorMessage = "Round timer has not expired yet";
      } else if (err.message) {
        errorMessage = err.message;
      }

      return { success: false, error: errorMessage };
    }
  }, [contract, fetchRoundData]);

  return {
    ...state,
    // Only expose functions if contract is available
    placeBet: state.isContractAvailable ? placeBet : undefined,
    settleRound: state.isContractAvailable ? settleRound : undefined,
    estimateGas: state.isContractAvailable ? estimateGas : undefined,
    refresh: fetchRoundData,
    pendingTx,
    contractConstants: CONTRACT_CONSTANTS,
  };
}
