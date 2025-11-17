import { useState, useCallback, useEffect } from 'react';
import { BrowserProvider } from 'ethers';

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

  const switchToBSC = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BSC_MAINNET.chainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [BSC_MAINNET],
          });
        } catch (addError) {
          throw new Error('Failed to add BNB Smart Chain network');
        }
      } else {
        throw switchError;
      }
    }
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setState(prev => ({
        ...prev,
        error: 'No crypto wallet found. Please install MetaMask or Trust Wallet.',
      }));
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      await switchToBSC();

      if (!window.ethereum) {
        setState({
          address: null,
          isConnecting: false,
          error: 'Wallet provider unavailable. Please refresh and try again.',
        });
        return;
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts && accounts.length > 0) {
        setState({
          address: accounts[0],
          isConnecting: false,
          error: null,
        });
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

  const disconnect = useCallback(() => {
    setState({
      address: null,
      isConnecting: false,
      error: null,
    });
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const validateAndConnect = async (accounts: string[]) => {
      if (accounts.length === 0 || !window.ethereum) return;

      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        if (chainId !== BSC_MAINNET.chainId) {
          try {
            await switchToBSC();
            setState(prev => ({ ...prev, address: accounts[0], error: null }));
          } catch (error) {
            setState(prev => ({
              ...prev,
              address: null,
              error: 'Please switch to BNB Smart Chain to use this app',
            }));
          }
        } else {
          setState(prev => ({ ...prev, address: accounts[0], error: null }));
        }
      } catch (error) {
        console.error('Failed to validate network:', error);
      }
    };

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        validateAndConnect(accounts);
      }
    };

    const handleChainChanged = async (chainId: string) => {
      if (chainId !== BSC_MAINNET.chainId) {
        try {
          await switchToBSC();
        } catch (error) {
          disconnect();
          setState(prev => ({
            ...prev,
            error: 'Network switch failed. Please manually switch to BNB Smart Chain and reconnect.',
          }));
        }
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    window.ethereum
      .request({ method: 'eth_accounts' })
      .then(validateAndConnect)
      .catch(console.error);

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [disconnect, switchToBSC]);

  return {
    address: state.address,
    isConnecting: state.isConnecting,
    error: state.error,
    connect,
    disconnect,
  };
}
