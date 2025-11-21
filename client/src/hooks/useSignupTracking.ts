import { useState, useEffect } from 'react';

interface UserData {
  wallet: string;
  username: string;
  agreedToTerms: boolean;
  agreedAt: string; // ISO timestamp
}

/**
 * Custom hook to track wallet signup completion status and user data
 * Uses localStorage to persist which wallets have completed signup and their usernames
 * 
 * @param walletAddress - The connected wallet address
 * @returns Object containing signup status, username, and completion handler
 */
export function useSignupTracking(walletAddress: string | null) {
  const [hasCompletedSignup, setHasCompletedSignup] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) {
      setHasCompletedSignup(false);
      setUsername(null);
      return;
    }

    try {
      // Get user data from localStorage
      const userData = JSON.parse(
        localStorage.getItem('userData') || '[]'
      ) as UserData[];
      
      if (Array.isArray(userData)) {
        const user = userData.find(u => u.wallet === walletAddress);
        const hasCompleted = !!user;
        
        console.log('🔍 Wallet Signup Check:', {
          wallet: walletAddress,
          hasCompletedSignup: hasCompleted,
          username: user?.username,
          totalRegisteredWallets: userData.length
        });
        
        setHasCompletedSignup(hasCompleted);
        setUsername(user?.username || null);
      } else {
        // Reset if data is malformed
        localStorage.setItem('userData', '[]');
        setHasCompletedSignup(false);
        setUsername(null);
      }
    } catch (error) {
      console.error('Error reading signup data:', error);
      localStorage.setItem('userData', '[]');
      setHasCompletedSignup(false);
      setUsername(null);
    }
  }, [walletAddress]);

  /**
   * Marks the current wallet as having completed signup with username and terms agreement
   */
  const markSignupComplete = (name: string) => {
    if (!walletAddress) return;

    try {
      const userData = JSON.parse(
        localStorage.getItem('userData') || '[]'
      ) as UserData[];
      
      // Check if user already exists
      const existingIndex = userData.findIndex(u => u.wallet === walletAddress);
      
      const newUser: UserData = {
        wallet: walletAddress,
        username: name,
        agreedToTerms: true,
        agreedAt: new Date().toISOString()
      };
      
      if (existingIndex >= 0) {
        // Update existing user
        userData[existingIndex] = newUser;
      } else {
        // Add new user
        userData.push(newUser);
      }
      
      localStorage.setItem('userData', JSON.stringify(userData));
      console.log('✅ Wallet Signup Completed:', {
        wallet: walletAddress,
        username: name,
        agreedToTerms: true,
        totalRegisteredWallets: userData.length
      });
      
      setHasCompletedSignup(true);
      setUsername(name);
    } catch (error) {
      console.error('Error saving signup data:', error);
    }
  };

  return {
    hasCompletedSignup,
    username,
    markSignupComplete,
    shouldShowSignup: !hasCompletedSignup && !!walletAddress
  };
}
