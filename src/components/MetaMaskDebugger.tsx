import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, XCircle, Wallet, Settings } from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';
import { checkMetaMaskConnection } from '../services/paymentService';

interface DebugInfo {
  metamaskInstalled: boolean;
  walletConnected: boolean;
  currentAccount: string | null;
  networkId: number | null;
  contractAddresses: {
    psp: string;
    searchPayment: string;
    usdc: string;
    patentNFT: string;
  };
  balances: {
    eth: string;
    psp: string;
  };
}

const MetaMaskDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { account, chainId, isConnected, connectWallet } = useWeb3();

  useEffect(() => {
    loadDebugInfo();
  }, [account, chainId]);

  const loadDebugInfo = async () => {
    try {
      const info: DebugInfo = {
        metamaskInstalled: !!window.ethereum,
        walletConnected: isConnected,
        currentAccount: account,
        networkId: chainId,
        contractAddresses: {
          psp: import.meta.env.VITE_PSP_TOKEN_ADDRESS || 'Not configured',
          searchPayment: import.meta.env.VITE_SEARCH_PAYMENT_ADDRESS || 'Not configured',
          usdc: import.meta.env.VITE_USDC_TOKEN_ADDRESS || 'Not configured',
          patentNFT: import.meta.env.VITE_PATENT_NFT_ADDRESS || 'Not configured'
        },
        balances: {
          eth: '0',
          psp: '0'
        }
      };

      // Get balances if connected
      if (account && window.ethereum) {
        try {
          const { ethers, BrowserProvider } = await import('ethers');
          const provider = new BrowserProvider(window.ethereum);
          
          // Get ETH balance
          const ethBalance = await provider.getBalance(account);
          info.balances.eth = ethers.formatEther(ethBalance);

          // Get PSP balance if contract address is available
          if (info.contractAddresses.psp !== 'Not configured') {
            const pspContract = new ethers.Contract(
              info.contractAddresses.psp,
              ['function balanceOf(address owner) view returns (uint256)'],
              provider
            );
            const pspBalance = await pspContract.balanceOf(account);
            info.balances.psp = ethers.formatEther(pspBalance);
          }
        } catch (error) {
          console.error('Failed to load balances:', error);
        }
      }

      setDebugInfo(info);
    } catch (error) {
      console.error('Failed to load debug info:', error);
    }
  };

  const testMetaMaskConnection = async () => {
    try {
      const result = await checkMetaMaskConnection();
      alert(`Connection test result: ${result.connected ? 'Connected' : 'Not connected'}\nAccount: ${result.account || 'None'}\nError: ${result.error || 'None'}`);
    } catch (error) {
      alert(`Connection test failed: ${error}`);
    }
  };

  const requestConnection = async () => {
    try {
      await connectWallet();
      await loadDebugInfo();
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  if (!debugInfo) return null;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 left-4 z-50 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors duration-200"
        title="MetaMask Debugger"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Debug Panel */}
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: -300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -300 }}
          className="fixed bottom-20 left-4 z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 max-h-96 overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <Wallet className="w-5 h-5" />
              <span>MetaMask Debug</span>
            </h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>

          <div className="space-y-3 text-sm">
            {/* MetaMask Installation */}
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">MetaMask Installed:</span>
              <div className="flex items-center space-x-1">
                {debugInfo.metamaskInstalled ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className={debugInfo.metamaskInstalled ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.metamaskInstalled ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            {/* Wallet Connection */}
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Wallet Connected:</span>
              <div className="flex items-center space-x-1">
                {debugInfo.walletConnected ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className={debugInfo.walletConnected ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.walletConnected ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            {/* Current Account */}
            <div>
              <span className="text-gray-700 dark:text-gray-300">Account:</span>
              <div className="text-xs font-mono bg-gray-100 dark:bg-gray-700 p-1 rounded mt-1 break-all">
                {debugInfo.currentAccount || 'Not connected'}
              </div>
            </div>

            {/* Network */}
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Network ID:</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {debugInfo.networkId || 'Unknown'}
              </span>
            </div>

            {/* Balances */}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Balances:</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">ETH:</span>
                  <span className="font-mono text-sm">{parseFloat(debugInfo.balances.eth).toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">PSP:</span>
                  <span className="font-mono text-sm">{parseFloat(debugInfo.balances.psp).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Contract Addresses */}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Contract Addresses:</h4>
              <div className="space-y-2">
                {Object.entries(debugInfo.contractAddresses).map(([key, address]) => (
                  <div key={key}>
                    <span className="text-gray-600 dark:text-gray-400 capitalize">{key}:</span>
                    <div className="text-xs font-mono bg-gray-100 dark:bg-gray-700 p-1 rounded mt-1 break-all">
                      {address}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-3 space-y-2">
              <button
                onClick={testMetaMaskConnection}
                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
              >
                Test Connection
              </button>
              
              {!debugInfo.walletConnected && (
                <button
                  onClick={requestConnection}
                  className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                >
                  Connect Wallet
                </button>
              )}
              
              <button
                onClick={loadDebugInfo}
                className="w-full px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
              >
                Refresh Info
              </button>
            </div>

            {/* Warnings */}
            {(!debugInfo.metamaskInstalled || !debugInfo.walletConnected) && (
              <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                <div className="flex items-start space-x-2 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    {!debugInfo.metamaskInstalled && (
                      <p>MetaMask not detected. Please install MetaMask extension.</p>
                    )}
                    {debugInfo.metamaskInstalled && !debugInfo.walletConnected && (
                      <p>MetaMask detected but not connected. Click "Connect Wallet" to connect.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </>
  );
};

export default MetaMaskDebugger;