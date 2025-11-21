import { ethers } from "ethers";

// Smart Contract ABI - simplified version focusing on key events
const CONTRACT_ABI = [
  "event RoundStarted(uint256 indexed roundNumber, uint256 startTime)",
  "event BetPlaced(address indexed player, uint256 indexed roundNumber, uint256 amount, uint256 totalPlayerBets, uint256 roundTotal)",
  "event RoundEnded(uint256 indexed roundNumber, uint256 endTime)",
  "event WinnerSelected(address indexed winner, uint256 indexed roundNumber, uint256 prize, uint256 totalBets, uint256 winnerBetAmount)"
];

export class Web3Service {
  private provider: ethers.JsonRpcProvider | null = null;
  private contract: ethers.Contract | null = null;
  
  private contractAddress: string;
  private rpcUrl: string;
  
  constructor() {
    this.contractAddress = process.env.VITE_CONTRACT_ADDRESS || "";
    this.rpcUrl = process.env.VITE_BSC_RPC_URL || "https://bsc-dataseed1.binance.org";
  }
  
  /**
   * Get read-only contract instance
   */
  getReadOnlyContract(): ethers.Contract | null {
    if (!this.contractAddress) {
      return null;
    }
    
    if (!this.provider) {
      this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
    }
    
    if (!this.contract) {
      this.contract = new ethers.Contract(this.contractAddress, CONTRACT_ABI, this.provider);
    }
    
    return this.contract;
  }
  
  /**
   * Listen for contract events
   */
  subscribeToEvents(callbacks: {
    onBetPlaced?: (player: string, roundNumber: number, amount: string, roundTotal: string) => void;
    onRoundEnded?: (roundNumber: number, endTime: number) => void;
    onWinnerSelected?: (winner: string, roundNumber: number, prize: string) => void;
    onRoundStarted?: (roundNumber: number, startTime: number) => void;
  }) {
    const contract = this.getReadOnlyContract();
    
    if (!contract) {
      console.log("⚠️ No contract configured for event subscription");
      return () => {}; // Return empty cleanup function
    }
    
    if (callbacks.onBetPlaced) {
      contract.on("BetPlaced", (player, roundNumber, amount, totalPlayerBets, roundTotal) => {
        callbacks.onBetPlaced!(
          player,
          Number(roundNumber),
          ethers.formatEther(amount),
          ethers.formatEther(roundTotal)
        );
      });
    }
    
    if (callbacks.onRoundEnded) {
      contract.on("RoundEnded", (roundNumber, endTime) => {
        callbacks.onRoundEnded!(Number(roundNumber), Number(endTime));
      });
    }
    
    if (callbacks.onWinnerSelected) {
      contract.on("WinnerSelected", (winner, roundNumber, prize, totalBets, winnerBetAmount) => {
        callbacks.onWinnerSelected!(
          winner,
          Number(roundNumber),
          ethers.formatEther(prize)
        );
      });
    }
    
    if (callbacks.onRoundStarted) {
      contract.on("RoundStarted", (roundNumber, startTime) => {
        callbacks.onRoundStarted!(Number(roundNumber), Number(startTime));
      });
    }
    
    // Return cleanup function
    return () => {
      contract.removeAllListeners();
    };
  }
}

export const web3Service = new Web3Service();
