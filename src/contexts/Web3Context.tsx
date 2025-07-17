import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers, BrowserProvider, JsonRpcSigner } from 'ethers';
import { isMetaMaskInstalled, promptMetaMaskInstall } from '../utils/metamask';

interface Web3ContextType {
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  account: string | null;
  chainId: number | null;
  connectWallet: () => Promise<void>;
  isConnected: boolean;
}

const Web3Context = createContext<Web3ContextType>({
  provider: null,
  signer: null,
  account: null,
  chainId: null,
  connectWallet: async () => {},
  isConnected: false,
});

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const connectWallet = async () => {
    if (isMetaMaskInstalled()) {
      try {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const browserProvider = new BrowserProvider(window.ethereum);
        const web3Signer = await browserProvider.getSigner();
        const network = await browserProvider.getNetwork();
        
        setProvider(browserProvider);
        setSigner(web3Signer);
        setAccount(accounts[0]);
        setChainId(Number(network.chainId));
        setIsConnected(true);
      } catch (error) {
        console.error("Error connecting to wallet:", error);
      }
    } else {
      promptMetaMaskInstall();
      alert("Please install MetaMask or another Ethereum wallet extension");
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
    <Web3Context.Provider value={{ provider, signer, account, chainId, connectWallet, isConnected }}>
      {children}
    </Web3Context.Provider>
  );
};

export default Web3Context;