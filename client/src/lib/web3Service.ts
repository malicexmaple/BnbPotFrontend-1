import { ethers } from "ethers";

// Smart Contract ABI - simplified version focusing on key functions
const CONTRACT_ABI = [
  // Read functions
  "function getCurrentRound() external view returns (tuple(uint256 roundNumber, uint256 startTime, uint256 endTime, uint256 totalPot, address winner, bool completed, uint256 totalBets))",
  "function getPlayerBetsInRound(uint256 roundNumber, address player) external view returns (uint256)",
  "function getPlayerWinChance(address player) external view returns (uint256)",
  "function getRoundBets(uint256 roundNumber) external view returns (tuple(address player, uint256 amount, uint256 timestamp)[])",
  "function currentRoundNumber() external view returns (uint256)",
  "function minBet() external view returns (uint256)",
  "function maxBet() external view returns (uint256)",
  "function roundDuration() external view returns (uint256)",
  
  // Write functions
  "function placeBet() external payable",
  "function endRound() external",
  
  // Events
  "event RoundStarted(uint256 indexed roundNumber, uint256 startTime)",
  "event BetPlaced(address indexed player, uint256 indexed roundNumber, uint256 amount, uint256 totalPlayerBets, uint256 roundTotal)",
  "event RoundEnded(uint256 indexed roundNumber, uint256 endTime)",
  "event WinnerSelected(address indexed winner, uint256 indexed roundNumber, uint256 prize, uint256 totalBets, uint256 winnerBetAmount)"
];

export class Web3Service {
  private provider: ethers.BrowserProvider | null = null;
  private contract: ethers.Contract | null = null;
  private signer: ethers.Signer | null = null;
  
  private contractAddress: string;
  private rpcUrl: string;
  
  constructor() {
    this.contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || "";
    this.rpcUrl = import.meta.env.VITE_BSC_RPC_URL || "https://bsc-dataseed1.binance.org";
  }
  
  /**
   * Initialize provider and connect to wallet
   */
  async connectWallet(): Promise<string> {
    if (!window.ethereum) {
      throw new Error("No Web3 wallet detected. Please install MetaMask or similar.");
    }
    
    this.provider = new ethers.BrowserProvider(window.ethereum);
    
    // Request account access
    const accounts = await this.provider.send("eth_requestAccounts", []);
    
    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found");
    }
    
    this.signer = await this.provider.getSigner();
    
    // Initialize contract with signer for write operations
    if (this.contractAddress) {
      this.contract = new ethers.Contract(this.contractAddress, CONTRACT_ABI, this.signer);
    }
    
    return accounts[0];
  }
  
  /**
   * Get read-only contract instance (no wallet needed)
   */
  getReadOnlyContract(): ethers.Contract {
    if (!this.contractAddress) {
      throw new Error("Contract address not configured");
    }
    
    const provider = new ethers.JsonRpcProvider(this.rpcUrl);
    return new ethers.Contract(this.contractAddress, CONTRACT_ABI, provider);
  }
  
  /**
   * Get current round information from contract
   */
  async getCurrentRound() {
    const contract = this.contract || this.getReadOnlyContract();
    const round = await contract.getCurrentRound();
    
    return {
      roundNumber: Number(round.roundNumber),
      startTime: Number(round.startTime),
      endTime: Number(round.endTime),
      totalPot: ethers.formatEther(round.totalPot),
      winner: round.winner,
      completed: round.completed,
      totalBets: Number(round.totalBets)
    };
  }
  
  /**
   * Place a bet in the current round
   */
  async placeBet(amountInBNB: string): Promise<ethers.TransactionResponse> {
    if (!this.contract || !this.signer) {
      throw new Error("Wallet not connected");
    }
    
    const amountWei = ethers.parseEther(amountInBNB);
    
    // Get min/max bet limits
    const minBet = await this.contract.minBet();
    const maxBet = await this.contract.maxBet();
    
    if (amountWei < minBet) {
      throw new Error(`Bet amount below minimum (${ethers.formatEther(minBet)} BNB)`);
    }
    
    if (amountWei > maxBet) {
      throw new Error(`Bet amount above maximum (${ethers.formatEther(maxBet)} BNB)`);
    }
    
    const tx = await this.contract.placeBet({ value: amountWei });
    return tx;
  }
  
  /**
   * Get player's total bets in a specific round
   */
  async getPlayerBetsInRound(roundNumber: number, playerAddress: string): Promise<string> {
    const contract = this.contract || this.getReadOnlyContract();
    const amount = await contract.getPlayerBetsInRound(roundNumber, playerAddress);
    return ethers.formatEther(amount);
  }
  
  /**
   * Get player's win chance percentage (in basis points, divide by 100 for percentage)
   */
  async getPlayerWinChance(playerAddress: string): Promise<number> {
    const contract = this.contract || this.getReadOnlyContract();
    const chanceBps = await contract.getPlayerWinChance(playerAddress);
    return Number(chanceBps) / 100; // Convert basis points to percentage
  }
  
  /**
   * Get all bets for a specific round
   */
  async getRoundBets(roundNumber: number) {
    const contract = this.contract || this.getReadOnlyContract();
    const bets = await contract.getRoundBets(roundNumber);
    
    return bets.map((bet: any) => ({
      player: bet.player,
      amount: ethers.formatEther(bet.amount),
      timestamp: Number(bet.timestamp)
    }));
  }
  
  /**
   * End the current round (can be called by anyone after time expires)
   */
  async endRound(): Promise<ethers.TransactionResponse> {
    if (!this.contract || !this.signer) {
      throw new Error("Wallet not connected");
    }
    
    const tx = await this.contract.endRound();
    return tx;
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
    const contract = this.contract || this.getReadOnlyContract();
    
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
  
  /**
   * Get the connected wallet address
   */
  async getConnectedAddress(): Promise<string | null> {
    if (!this.signer) return null;
    return await this.signer.getAddress();
  }
  
  /**
   * Get BNB balance of an address
   */
  async getBalance(address: string): Promise<string> {
    const provider = this.provider || new ethers.JsonRpcProvider(this.rpcUrl);
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  }
  
  /**
   * Switch to BSC network
   */
  async switchToBSC(): Promise<void> {
    if (!window.ethereum) {
      throw new Error("No Web3 wallet detected");
    }
    
    const chainId = import.meta.env.VITE_CHAIN_ID || "56";
    const chainIdHex = `0x${parseInt(chainId).toString(16)}`;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
    } catch (error: any) {
      // Chain not added, add it
      if (error.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: chainIdHex,
            chainName: chainId === "56" ? 'Binance Smart Chain' : 'BSC Testnet',
            nativeCurrency: {
              name: 'BNB',
              symbol: 'BNB',
              decimals: 18
            },
            rpcUrls: [this.rpcUrl],
            blockExplorerUrls: [chainId === "56" ? 'https://bscscan.com' : 'https://testnet.bscscan.com']
          }]
        });
      } else {
        throw error;
      }
    }
  }
}

// Singleton instance
export const web3Service = new Web3Service();
