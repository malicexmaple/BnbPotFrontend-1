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
  const [agreedToTerms, setAgreedToTerms] = useState(false);

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
          agreedToTerms: user?.agreedToTerms || false,
          totalRegisteredWallets: userData.length
        });
        
        setHasCompletedSignup(hasCompleted);
        setUsername(user?.username || null);
        setAgreedToTerms(user?.agreedToTerms || false);
      } else {
        // Reset if data is malformed
        localStorage.setItem('userData', '[]');
        setHasCompletedSignup(false);
        setUsername(null);
        setAgreedToTerms(false);
      }
    } catch (error) {
      console.error('Error reading signup data:', error);
      localStorage.setItem('userData', '[]');
      setHasCompletedSignup(false);
      setUsername(null);
      setAgreedToTerms(false);
    }
  }, [walletAddress]);

  // Listen for username updates from profile modal
  useEffect(() => {
    if (!walletAddress) return;

    const handleUsernameUpdate = (event: CustomEvent) => {
      const newUsername = event.detail?.username;
      if (newUsername) {
        // Update state
        setUsername(newUsername);
        
        // Also update localStorage
        try {
          const userData = JSON.parse(
            localStorage.getItem('userData') || '[]'
          ) as UserData[];
          
          const existingIndex = userData.findIndex(u => u.wallet === walletAddress);
          if (existingIndex >= 0) {
            userData[existingIndex].username = newUsername;
            localStorage.setItem('userData', JSON.stringify(userData));
            console.log('✅ Username updated in localStorage:', newUsername);
          }
        } catch (error) {
          console.error('Error updating username in localStorage:', error);
        }
      }
    };

    window.addEventListener('usernameUpdated', handleUsernameUpdate as EventListener);
    return () => {
      window.removeEventListener('usernameUpdated', handleUsernameUpdate as EventListener);
    };
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
      setAgreedToTerms(true);
    } catch (error) {
      console.error('Error saving signup data:', error);
    }
  };

  return {
    hasCompletedSignup,
    username,
    agreedToTerms,
    markSignupComplete,
    shouldShowSignup: !hasCompletedSignup && !!walletAddress
  };
}
