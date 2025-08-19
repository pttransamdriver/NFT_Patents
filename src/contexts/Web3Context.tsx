import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers, BrowserProvider, JsonRpcSigner } from 'ethers';
import { isMetaMaskInstalled, isEthereumWalletAvailable, getWalletName, promptMetaMaskInstall } from '../utils/metamask';
import toast from 'react-hot-toast';

interface Web3ContextType {
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  account: string | null;
  chainId: number | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isConnected: boolean;
  isConnecting: boolean;
  switchToLocalNetwork: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType>({
  provider: null,
  signer: null,
  account: null,
  chainId: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  isConnected: false,
  isConnecting: false,
  switchToLocalNetwork: async () => {},
});

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const connectWallet = async () => {
    console.log('Connect wallet clicked');
    
    // Prevent multiple simultaneous connection attempts
    if (isConnecting) {
      console.log('Already connecting, returning');
      toast.error('Connection already in progress...');
      return;
    }

    // Check if already connected
    if (isConnected) {
      console.log('Already connected, returning');
      toast.success('Wallet already connected!');
      return;
    }

    // Check if MetaMask is available and select it specifically
    if (!window.ethereum) {
      console.log('No ethereum object found');
      toast.error('No Ethereum wallet detected. Please install MetaMask.');
      return;
    }
    
    // If multiple wallets are installed, try to use MetaMask specifically
    let ethereum = window.ethereum;
    if (window.ethereum.providers) {
      ethereum = window.ethereum.providers.find((provider: any) => provider.isMetaMask) || window.ethereum;
      console.log('Using specific MetaMask provider');
    }

    console.log('Starting connection process');
    setIsConnecting(true);
    
    try {
      console.log('Requesting accounts...');
      
      // Request account access using the selected provider
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      console.log('Accounts received:', accounts);
      
      if (!accounts || accounts.length === 0) {
        console.log('No accounts found');
        toast.error('No accounts found. Please check your wallet.');
        return;
      }

      console.log('Initializing provider...');
      // Initialize provider and signer using the selected ethereum provider
      const browserProvider = new BrowserProvider(ethereum);
      const web3Signer = await browserProvider.getSigner();
      const network = await browserProvider.getNetwork();
      
      console.log('Network:', network);
      
      // Update state
      setProvider(browserProvider);
      setSigner(web3Signer);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));
      setIsConnected(true);
      
      console.log('Connection successful');
      toast.success('Wallet connected successfully!');
      
    } catch (error: any) {
      console.error('Error connecting to wallet:', error);
      
      // Handle specific error types
      if (error.code === 4001) {
        toast.error('Connection rejected by user');
      } else if (error.code === -32002) {
        toast.error('Connection request already pending. Please check MetaMask.');
      } else if (error.message?.includes('User denied')) {
        toast.error('Connection denied. Please approve the request in your wallet.');
      } else {
        toast.error(`Failed to connect wallet: ${error.message}`);
      }
    } finally {
      console.log('Setting isConnecting to false');
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    // Clear all wallet state
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    setIsConnected(false);
    setIsConnecting(false);
    
    toast.success('Wallet disconnected successfully!');
  };

  const switchToLocalNetwork = async () => {
    if (!window.ethereum) {
      toast.error('No Ethereum wallet detected');
      return;
    }

    try {
      // Try to switch to local network (chainId 31337)
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x7A69' }], // 31337 in hex
      });
      toast.success('Switched to local network!');
    } catch (error: any) {
      console.error('Error switching network:', error);
      
      // If network doesn't exist, add it
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x7A69', // 31337 in hex
                chainName: 'Hardhat Local',
                rpcUrls: ['http://127.0.0.1:8545'],
                nativeCurrency: {
                  name: 'Ether',
                  symbol: 'ETH',
                  decimals: 18,
                },
              },
            ],
          });
          toast.success('Added and switched to local network!');
        } catch (addError) {
          console.error('Error adding network:', addError);
          toast.error('Failed to add local network');
        }
      } else {
        toast.error('Failed to switch network');
      }
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const initializeWeb3 = async () => {
      if (!window.ethereum || !mounted) return;
      
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0 && mounted) {
          const browserProvider = new BrowserProvider(window.ethereum);
          const web3Signer = await browserProvider.getSigner();
          const network = await browserProvider.getNetwork();
          
          if (mounted) {
            setProvider(browserProvider);
            setSigner(web3Signer);
            setAccount(accounts[0]);
            setChainId(Number(network.chainId));
            setIsConnected(true);
          }
        }
      } catch (error) {
        console.error("Error initializing Web3:", error);
      }
    };

    initializeWeb3();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
      } else {
        setAccount(null);
        setIsConnected(false);
        setProvider(null);
        setSigner(null);
        setChainId(null);
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  return (
    <Web3Context.Provider value={{ provider, signer, account, chainId, connectWallet, disconnectWallet, isConnected, isConnecting, switchToLocalNetwork }}>
      {children}
    </Web3Context.Provider>
  );
};

export default Web3Context;