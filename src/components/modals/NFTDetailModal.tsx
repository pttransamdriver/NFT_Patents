import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, FileText, User, Building, Calendar, Heart,
  Share2, ShoppingCart, Tag, ExternalLink,
  Activity, DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { useWeb3 } from '../../contexts/Web3Context';
import { marketplaceService } from '../../services/marketplaceService';
import ListNFTModal from './ListNFTModal';
import toast from 'react-hot-toast';
import type { NFT } from '../../types';

interface NFTDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  nft: NFT;
  onSuccess?: () => void;
}

const NFTDetailModal: React.FC<NFTDetailModalProps> = ({
  isOpen,
  onClose,
  nft,
  onSuccess
}) => {
  const { isConnected, connectWallet, account } = useWeb3();
  const [isLiked, setIsLiked] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'price' | 'transactions' | 'details'>('price');

  const isOwner = account === nft.owner;
  // Price history would come from blockchain events - currently not implemented
  const priceHistory: Array<{ date: string; price: number }> = [];

  const handleBuyNow = async () => {
    if (!isConnected) {
      await connectWallet();
      return;
    }

    try {
      const loadingToast = toast.loading('Initiating purchase...');

      // Use marketplace service to buy the NFT
      const result = await marketplaceService.buyNFT((nft as any).listingId, (nft as any).priceInEth || nft.price.toString());

      toast.dismiss(loadingToast);

      if (result.success) {
        toast.success('Purchase completed successfully!');
        onClose();
        if (onSuccess) onSuccess();
      } else {
        throw new Error(result.error || 'Purchase failed');
      }

    } catch (error: any) {
      console.error('Purchase failed:', error);

      if (error.code === 4001) {
        toast.error('Transaction rejected by user');
      } else if (error.code === -32002) {
        toast.error('Transaction request already pending. Please check MetaMask.');
      } else {
        toast.error(`Purchase failed: ${error.message}`);
      }
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast.success(isLiked ? 'Removed from favorites' : 'Added to favorites');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/nft/${nft.id}`);
    toast.success('Link copied to clipboard!');
  };

  const handleClose = () => {
    if (showListModal) return; // Prevent closing if list modal is open
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header with Close Button */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">NFT Details</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Left Column - NFT Visual */}
                <div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    {/* NFT Visual */}
                    <div className="aspect-square bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 p-8 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-32 h-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg flex items-center justify-center mb-6">
                          <FileText className="w-16 h-16 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          Patent NFT
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          #{nft.patentNumber}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          <button
                            onClick={handleLike}
                            className={`p-2 rounded-lg transition-colors duration-200 ${
                              isLiked
                                ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                            title={isLiked ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={handleShare}
                            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                            title="Share NFT"
                          >
                            <Share2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - NFT Details */}
                <div className="space-y-6">
                  {/* Title and Category */}
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                        {nft.category}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        nft.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : nft.status === 'expired'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {nft.status}
                      </span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3" title={nft.title}>
                      {nft.title}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                      {nft.description || `Patent NFT for ${nft.patentNumber}`}
                    </p>
                  </div>

                  {/* Price and Stats */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Price</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {nft.price} ETH
                      </p>
                      <div className="flex items-center text-sm mt-2">
                        <Tag className="w-4 h-4 mr-1 text-blue-500" />
                        <span className="text-gray-600 dark:text-gray-400">
                          Listed on marketplace
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {!isOwner && nft.isListed && (
                      <div className="space-y-3">
                        <button
                          onClick={handleBuyNow}
                          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center"
                        >
                          <ShoppingCart className="w-5 h-5 mr-2" />
                          Buy Now for {nft.price} ETH
                        </button>
                      </div>
                    )}

                    {isOwner && (
                      <div className="space-y-3">
                        <button
                          onClick={() => setShowListModal(true)}
                          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center"
                        >
                          <Tag className="w-5 h-5 mr-2" />
                          {nft.isListed ? 'Update Listing' : 'List for Sale'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Patent Information */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Patent Information
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <FileText className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Patent Number</p>
                          <p className="font-medium text-gray-900 dark:text-white break-words">{nft.patentNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <User className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Inventor(s)</p>
                          <p className="font-medium text-gray-900 dark:text-white break-words">{nft.inventor}</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <Building className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Assignee</p>
                          <p className="font-medium text-gray-900 dark:text-white break-words">{nft.assignee}</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Filing Date</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {nft.filingDate ? format(new Date(nft.filingDate), 'MMMM dd, yyyy') : 'Not available'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Original Patent
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <nav className="flex space-x-8 px-6">
                    <button
                      onClick={() => setActiveTab('price')}
                      className={`py-4 font-medium transition-colors ${
                        activeTab === 'price'
                          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      Price History
                    </button>
                    <button
                      onClick={() => setActiveTab('transactions')}
                      className={`py-4 font-medium transition-colors ${
                        activeTab === 'transactions'
                          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      Transaction History
                    </button>
                    <button
                      onClick={() => setActiveTab('details')}
                      className={`py-4 font-medium transition-colors ${
                        activeTab === 'details'
                          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      More Details
                    </button>
                  </nav>
                </div>

                <div className="p-6">
                  {activeTab === 'price' && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Price History
                      </h4>
                      {priceHistory.length > 0 ? (
                        <div className="space-y-3">
                          {priceHistory.map((entry, index) => (
                            <div key={index} className="flex items-center justify-between py-2 px-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className="flex items-center">
                                <Activity className="w-4 h-4 text-gray-400 mr-3" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {format(new Date(entry.date), 'MMM dd, yyyy')}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-1" />
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {entry.price} ETH
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Activity className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-500 dark:text-gray-400">
                            No price history available yet
                          </p>
                          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                            Price history will be recorded as this NFT is traded
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'transactions' && (
                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">
                        No transaction history available yet
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        Transaction history will appear here
                      </p>
                    </div>
                  )}

                  {activeTab === 'details' && (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Additional details coming soon
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* List NFT Modal (nested) */}
      {nft && (
        <ListNFTModal
          isOpen={showListModal}
          onClose={() => setShowListModal(false)}
          nft={{
            id: nft.id,
            tokenId: (nft as any).tokenId || nft.id,
            title: nft.title,
            patentNumber: nft.patentNumber,
            category: nft.category,
            inventor: nft.inventor,
            imageUrl: nft.imageUrl
          }}
          onSuccess={() => {
            setShowListModal(false);
            if (onSuccess) onSuccess();
          }}
        />
      )}
    </AnimatePresence>
  );
};

export default NFTDetailModal;
