import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWallet } from "@/hooks/useWallet";
import { useSignupTracking } from "@/hooks/useSignupTracking";
import { useChat } from "@/hooks/useChat";
import { useJackpotContract } from "@/hooks/useJackpotContract";
import { queryClient } from '@/lib/queryClient';
import { web3Service } from '@/lib/web3Service';

interface UserProfile {
  id: number;
  username: string;
  email?: string;
  walletAddress: string;
  avatarUrl?: string;
  agreedToTermsAt?: string;
}

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
  bnbBalance: string | null;
  refreshBalance: () => Promise<void>;
  contract: {
    isContractAvailable: boolean;
    placeBet?: (amount: string) => Promise<{ success: boolean; txHash?: string; error?: string }>;
    getPot?: () => Promise<string>;
    getPlayerCount?: () => Promise<number>;
    getRoundId?: () => Promise<number>;
  };
}

const GameStateContext = createContext<GameStateContextType | null>(null);

export function GameStateProvider({ children }: { children: ReactNode }) {
  const { address, isConnecting, error, connect, disconnect } = useWallet();
  const { shouldShowSignup, username: localUsername, agreedToTerms, markSignupComplete } = useSignupTracking(address);
  
  // Fetch user profile from database - this is the source of truth for username
  const { data: userProfile } = useQuery<UserProfile | null>({
    queryKey: ['/api/users/me', address],
    queryFn: async () => {
      if (!address) return null;
      const res = await fetch(`/api/users/me?walletAddress=${encodeURIComponent(address)}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch user profile');
      return res.json();
    },
    enabled: !!address,
    staleTime: 30000, // Cache for 30 seconds
  });
  
  // Use database username if available, fall back to localStorage username
  const username = userProfile?.username || localUsername;
  
  const { messages, isConnected, isAuthenticated, onlineUsers, sendMessage } = useChat({ 
    username: username || undefined, 
    walletAddress: address || undefined 
  });
  
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || undefined;
  const contract = useJackpotContract(address || undefined, contractAddress);
  
  const wsRef = useRef<WebSocket | null>(null);
  const [bnbBalance, setBnbBalance] = useState<string | null>(null);
  
  const refreshBalance = useCallback(async () => {
    if (!address) {
      setBnbBalance(null);
      return;
    }
    try {
      const balance = await web3Service.getBalance(address);
      setBnbBalance(balance);
    } catch (err) {
      console.error('Failed to fetch BNB balance:', err);
    }
  }, [address]);
  
  useEffect(() => {
    refreshBalance();
    if (address) {
      const interval = setInterval(refreshBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [address, refreshBalance]);
  
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
      bnbBalance,
      refreshBalance,
      contract,
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
