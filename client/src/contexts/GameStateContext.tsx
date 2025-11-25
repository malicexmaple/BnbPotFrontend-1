import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useWallet } from "@/hooks/useWallet";
import { useSignupTracking } from "@/hooks/useSignupTracking";
import { useChat } from "@/hooks/useChat";
import { useJackpotContract } from "@/hooks/useJackpotContract";
import { queryClient } from '@/lib/queryClient';

interface GameStateContextType {
  address: string | null;
  isConnecting: boolean;
  walletError: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  shouldShowSignup: boolean;
  username: string | null;
  agreedToTerms: boolean;
  markSignupComplete: (name: string) => void;
  messages: any[];
  isConnected: boolean;
  isAuthenticated: boolean;
  onlineUsers: number;
  sendMessage: (message: string) => boolean;
  contract: {
    isContractAvailable: boolean;
    placeBet?: (amount: string) => Promise<{ success: boolean; txHash?: string; error?: string }>;
    getPot?: () => Promise<string>;
    getPlayerCount?: () => Promise<number>;
    getRoundId?: () => Promise<number>;
  };
  isChatCollapsed: boolean;
  setIsChatCollapsed: (collapsed: boolean) => void;
  isLeaderboardCollapsed: boolean;
  setIsLeaderboardCollapsed: (collapsed: boolean) => void;
  showChatRules: boolean;
  setShowChatRules: (show: boolean) => void;
}

const GameStateContext = createContext<GameStateContextType | null>(null);

export function GameStateProvider({ children }: { children: ReactNode }) {
  const { address, isConnecting, error, connect, disconnect } = useWallet();
  const { shouldShowSignup, username, agreedToTerms, markSignupComplete } = useSignupTracking(address);
  const { messages, isConnected, isAuthenticated, onlineUsers, sendMessage } = useChat({ 
    username: username || undefined, 
    walletAddress: address || undefined 
  });
  
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || undefined;
  const contract = useJackpotContract(address || undefined, contractAddress);
  
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [isLeaderboardCollapsed, setIsLeaderboardCollapsed] = useState(false);
  const [showChatRules, setShowChatRules] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to game WebSocket');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'bet_placed') {
          console.log('Bet placed event received - updating round data');
          queryClient.invalidateQueries({ queryKey: ['/api/rounds/current'] });
        }
      } catch (error) {
        console.error('Failed to parse game WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('Game WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('Disconnected from game WebSocket');
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <GameStateContext.Provider value={{
      address,
      isConnecting,
      walletError: error,
      connect,
      disconnect,
      shouldShowSignup,
      username,
      agreedToTerms,
      markSignupComplete,
      messages,
      isConnected,
      isAuthenticated,
      onlineUsers,
      sendMessage,
      contract,
      isChatCollapsed,
      setIsChatCollapsed,
      isLeaderboardCollapsed,
      setIsLeaderboardCollapsed,
      showChatRules,
      setShowChatRules,
    }}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
}
