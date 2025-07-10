import React, { createContext, useContext, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  balance: string;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState('0.0');

  const connectWallet = useCallback(async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
          setBalance('1.5');
          toast.success('Wallet connected successfully!');
        }
      } else {
        toast.error('Please install MetaMask');
      }
    } catch (error: any) {
      console.error('Connection error:', error);
      toast.error('Failed to connect wallet');
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setAddress(null);
    setIsConnected(false);
    setBalance('0.0');
    toast.success('Wallet disconnected');
  }, []);

  return (
    <WalletContext.Provider value={{
      isConnected,
      address,
      balance,
      connectWallet,
      disconnectWallet,
    }}>
      {children}
    </WalletContext.Provider>
  );
};

declare global {
  interface Window {
    ethereum?: any;
  }
}