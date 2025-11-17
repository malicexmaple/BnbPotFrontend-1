import { useState, useEffect } from 'react';

/**
 * Custom hook to track wallet signup completion status
 * Uses localStorage to persist which wallets have completed signup
 * 
 * @param walletAddress - The connected wallet address
 * @returns Object containing signup status and completion handler
 */
export function useSignupTracking(walletAddress: string | null) {
  const [hasCompletedSignup, setHasCompletedSignup] = useState(false);

  useEffect(() => {
    if (!walletAddress) {
      setHasCompletedSignup(false);
      return;
    }

    try {
      const completedSignups = JSON.parse(
        localStorage.getItem('completedSignups') || '[]'
      );
      
      if (Array.isArray(completedSignups)) {
        const hasCompleted = completedSignups.includes(walletAddress);
        console.log('🔍 Wallet Signup Check:', {
          wallet: walletAddress,
          hasCompletedSignup: hasCompleted,
          totalRegisteredWallets: completedSignups.length,
          allRegisteredWallets: completedSignups
        });
        setHasCompletedSignup(hasCompleted);
      } else {
        // Reset if data is malformed
        localStorage.setItem('completedSignups', '[]');
        setHasCompletedSignup(false);
      }
    } catch (error) {
      console.error('Error reading signup data:', error);
      localStorage.setItem('completedSignups', '[]');
      setHasCompletedSignup(false);
    }
  }, [walletAddress]);

  /**
   * Marks the current wallet as having completed signup
   */
  const markSignupComplete = () => {
    if (!walletAddress) return;

    try {
      const completedSignups = JSON.parse(
        localStorage.getItem('completedSignups') || '[]'
      );
      
      if (!completedSignups.includes(walletAddress)) {
        completedSignups.push(walletAddress);
        localStorage.setItem('completedSignups', JSON.stringify(completedSignups));
        console.log('✅ Wallet Signup Completed:', {
          newWallet: walletAddress,
          totalRegisteredWallets: completedSignups.length
        });
      }
      
      setHasCompletedSignup(true);
    } catch (error) {
      console.error('Error saving signup data:', error);
    }
  };

  return {
    hasCompletedSignup,
    markSignupComplete,
    shouldShowSignup: !hasCompletedSignup && !!walletAddress
  };
}
