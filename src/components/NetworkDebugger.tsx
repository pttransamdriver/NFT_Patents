import React from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

const NetworkDebugger: React.FC = () => {
  const { chainId, isConnected, switchToLocalNetwork } = useWeb3();
  
  const isLocalNetwork = chainId === 31337;
  const networkName = getNetworkName(chainId);

  if (!isConnected) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-20 right-4 z-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm"
    >
      <div className="flex items-center space-x-3 mb-2">
        {isLocalNetwork ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
        )}
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
            Network Status
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {networkName} (Chain ID: {chainId})
          </p>
        </div>
      </div>

      {!isLocalNetwork && (
        <div className="mt-3">
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
            Please switch to local network to use purchase features.
          </p>
          <button
            onClick={switchToLocalNetwork}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors duration-200 w-full justify-center"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Switch to Local Network</span>
          </button>
        </div>
      )}

      {isLocalNetwork && (
        <p className="text-xs text-green-700 dark:text-green-300 mt-2">
          ✓ Ready for local development and purchases!
        </p>
      )}
    </motion.div>
  );
};

function getNetworkName(chainId: number | null): string {
  switch (chainId) {
    case 1:
      return 'Ethereum Mainnet';
    case 5:
      return 'Goerli Testnet';
    case 11155111:
      return 'Sepolia Testnet';
    case 31337:
      return 'Hardhat Local';
    case null:
      return 'Unknown';
    default:
      return `Network ${chainId}`;
  }
}

export default NetworkDebugger;
