import { useState, useCallback, useEffect } from 'react';
import { BrowserProvider } from 'ethers';
import { getMetaMaskProvider } from '@/lib/getMetaMask';

const BSC_TESTNET = {
  chainId: '0x61', // 97 in hex
  chainName: 'BNB Smart Chain Testnet',
  nativeCurrency: {
    name: 'tBNB',
    symbol: 'tBNB',
    decimals: 18,
  },
  rpcUrls: ['https://data-seed-prebsc-1-s1.bnbchain.org:8545'],
  blockExplorerUrls: ['https://testnet.bscscan.com'],
};

const BSC_MAINNET = {
  chainId: '0x38',
  chainName: 'BNB Smart Chain',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18,
  },
  rpcUrls: ['https://bsc-dataseed.binance.org/'],
  blockExplorerUrls: ['https://bscscan.com/'],
};

// Use testnet for demo/testing
const ACTIVE_NETWORK = BSC_TESTNET;

interface WalletState {
  address: string | null;
  isConnecting: boolean;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    isConnecting: false,
    error: null,
  });

  const [hasManuallyConnected, setHasManuallyConnected] = useState(false);

  const switchToBSC = useCallback(async () => {
    const provider = getMetaMaskProvider();
    if (!provider) return;

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ACTIVE_NETWORK.chainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [ACTIVE_NETWORK],
          });
        } catch (addError) {
          throw new Error(`Failed to add ${ACTIVE_NETWORK.chainName} network`);
        }
      } else {
        throw switchError;
      }
    }
  }, []);

  const connect = useCallback(async () => {
    const provider = getMetaMaskProvider();
    if (!provider) {
      setState(prev => ({
        ...prev,
        error: 'MetaMask not detected. Please install the MetaMask extension to connect.',
      }));
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      await switchToBSC();

      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      });

      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        
        try {
          // Step 1: Request authentication nonce from server
          const nonceResponse = await fetch('/api/auth/nonce', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress: address })
          });
          
          if (!nonceResponse.ok) {
            throw new Error('Failed to get authentication challenge');
          }
          
          const { message, nonce } = await nonceResponse.json();
          
          // Step 2: Sign the challenge message
          const signature = await provider.request({
            method: 'personal_sign',
            params: [message, address],
          });
          
          if (!signature) {
            throw new Error('Signature rejected');
          }
          
          // Step 3: Verify signature with backend
          const verifyResponse = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              walletAddress: address, 
              signature, 
              message 
            })
          });
          
          if (!verifyResponse.ok) {
            const errorData = await verifyResponse.json();
            throw new Error(errorData.message || 'Signature verification failed');
          }
          
          const authData = await verifyResponse.json();
          
          console.log('🔐 Wallet Authenticated:', {
            address: authData.walletAddress,
            username: authData.username,
            agreedToTerms: authData.agreedToTerms
          });
          
          setHasManuallyConnected(true);
          setState({
            address: authData.walletAddress,
            isConnecting: false,
            error: null,
          });
        } catch (signError: any) {
          let errorMessage = 'Signature rejected';
          if (signError.code === 4001) {
            errorMessage = 'You must sign the message to connect';
          } else if (signError.message) {
            errorMessage = signError.message;
          }
          setState({
            address: null,
            isConnecting: false,
            error: errorMessage,
          });
        }
      } else {
        setState({
          address: null,
          isConnecting: false,
          error: 'No accounts found. Please check your wallet.',
        });
      }
    } catch (error: any) {
      let errorMessage = 'Failed to connect wallet';
      
      if (error.code === 4001) {
        errorMessage = 'Connection request rejected';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setState({
        address: null,
        isConnecting: false,
        error: errorMessage,
      });
    }
  }, [switchToBSC]);

  const disconnect = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    setHasManuallyConnected(false);
    setState({
      address: null,
      isConnecting: false,
      error: null,
    });
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      }
    };

    const handleChainChanged = () => {
      disconnect();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [disconnect]);

  return {
    address: state.address,
    isConnecting: state.isConnecting,
    error: state.error,
    connect,
    disconnect,
  };
}
