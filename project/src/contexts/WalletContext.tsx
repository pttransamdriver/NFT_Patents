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
      // Simulate wallet connection
      const mockAddress = '0x742d35Cc6634C0532925a3b8D1750d15DbfED4C6';
      setAddress(mockAddress);
      setIsConnected(true);
      setBalance('12.5');
      toast.success('Wallet connected successfully!');
    } catch (error) {
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