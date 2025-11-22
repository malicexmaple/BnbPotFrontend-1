/**
 * Shared game state hook for all game pages
 * Handles wallet, chat, and game socket connections
 */
import { useWallet } from "@/hooks/useWallet";
import { useSignupTracking } from "@/hooks/useSignupTracking";
import { useChat } from "@/hooks/useChat";
import { useGameSocket } from "@/hooks/useGameSocket";
import { useJackpotContract } from "@/hooks/useJackpotContract";

export function useGameState() {
  const { address, isConnecting, error, connect, disconnect } = useWallet();
  const { shouldShowSignup, username, agreedToTerms, markSignupComplete } = useSignupTracking(address);
  const { messages, isConnected, isAuthenticated, onlineUsers, sendMessage } = useChat({ 
    username: username || undefined, 
    walletAddress: address || undefined 
  });
  
  // Try to connect to smart contract (if deployed)
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || undefined;
  const contract = useJackpotContract(address, contractAddress);
  
  // Connect to game WebSocket for real-time bet updates (works for all users)
  useGameSocket();

  return {
    // Wallet
    address,
    isConnecting,
    walletError: error,
    connect,
    disconnect,
    
    // User
    shouldShowSignup,
    username,
    agreedToTerms,
    markSignupComplete,
    
    // Chat
    messages,
    isConnected,
    isAuthenticated,
    onlineUsers,
    sendMessage,
    
    // Contract
    contract,
  };
}
