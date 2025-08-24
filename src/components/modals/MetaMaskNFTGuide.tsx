import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, ExternalLink, Info } from 'lucide-react';
import toast from 'react-hot-toast';

interface MetaMaskNFTGuideProps {
  isOpen: boolean;
  onClose: () => void;
  contractAddress: string;
  tokenId: string;
  patentNumber: string;
}

const MetaMaskNFTGuide: React.FC<MetaMaskNFTGuideProps> = ({
  isOpen,
  onClose,
  contractAddress,
  tokenId,
  patentNumber
}) => {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                  <img src="data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 2L2 7L12 12L22 7L12 2Z' fill='%23f59e0b'/%3E%3Cpath d='M2 17L12 22L22 17' fill='%23f59e0b'/%3E%3Cpath d='M2 12L12 17L22 12' fill='%23f59e0b'/%3E%3C/svg%3E" alt="MetaMask" className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Add NFT to MetaMask
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manual import for local network
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Info Banner */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Local Network Limitation
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    MetaMask doesn't automatically detect NFTs on local networks. You'll need to manually import your NFT using the steps below.
                  </p>
                </div>
              </div>
            </div>

            {/* NFT Details */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Your NFT Details:
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Patent:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{patentNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Token ID:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-mono text-gray-900 dark:text-white">{tokenId}</span>
                    <button
                      onClick={() => copyToClipboard(tokenId, 'Token ID')}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    >
                      <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Contract:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-mono text-gray-900 dark:text-white truncate max-w-32">
                      {contractAddress}
                    </span>
                    <button
                      onClick={() => copyToClipboard(contractAddress, 'Contract address')}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    >
                      <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                How to Import Your NFT:
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white font-medium mb-1">
                      Open MetaMask and go to the NFTs tab
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Click on the "NFTs" tab in your MetaMask wallet
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white font-medium mb-1">
                      Click "Import NFT"
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Look for the "Import NFT" or "+" button
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white font-medium mb-1">
                      Enter the contract address and token ID
                    </p>
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <p>• Address: <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">{contractAddress}</code></p>
                      <p>• Token ID: <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">{tokenId}</code></p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    ✓
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white font-medium mb-1">
                      Your NFT should now appear in MetaMask!
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      It may take a moment to load the NFT details
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => copyToClipboard(`${contractAddress}\n${tokenId}`, 'NFT info')}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <Copy className="w-4 h-4" />
                <span>Copy All Info</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MetaMaskNFTGuide;