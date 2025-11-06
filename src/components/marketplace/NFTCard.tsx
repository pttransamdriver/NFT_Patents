import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, FileText, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import type { NFT } from '../../types';
import NFTDetailModal from '../modals/NFTDetailModal';

interface NFTCardProps {
  nft: NFT;
  className?: string;
  onUpdate?: () => void;
}

const NFTCard: React.FC<NFTCardProps> = ({ nft, className = '', onUpdate }) => {
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleClick = () => {
    setShowDetailModal(true);
  };

  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        onClick={handleClick}
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden cursor-pointer ${className}`}
      >
        {/* Patent Category Badge */}
        <div className="relative p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600">
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {nft.category}
            </span>
          </div>
          
          <div className="flex items-center justify-center w-16 h-16 bg-white dark:bg-gray-800 rounded-lg shadow-md mb-4">
            <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
            {nft.title}
          </h3>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Patent #{nft.patentNumber}
          </p>
        </div>

        <div className="p-6">
          {/* Patent Info */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <User className="w-4 h-4 mr-2" />
              <span className="truncate">{nft.inventor}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4 mr-2" />
              <span>{format(new Date(nft.filingDate), 'MMM dd, yyyy')}</span>
            </div>
          </div>

          {/* Price and Status */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Current Price</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {nft.price} ETH
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>+{nft.priceChange}%</span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              nft.status === 'active' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : nft.status === 'expired'
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            }`}>
              {nft.status}
            </span>
            
            {nft.isListed && (
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                For Sale
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* NFT Detail Modal */}
      <NFTDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        nft={nft}
        onSuccess={() => {
          setShowDetailModal(false);
          if (onUpdate) onUpdate();
        }}
      />
    </>
  );
};

export default NFTCard;