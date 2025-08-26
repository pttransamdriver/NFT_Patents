import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { marketplaceService } from '../../services/marketplaceService';
import toast from 'react-hot-toast';

interface ListNFTModalProps {
  isOpen: boolean;
  onClose: () => void;
  nft: {
    id: string;
    tokenId: string;
    title: string;
    patentNumber?: string;
    category?: string;
    inventor?: string;
    imageUrl?: string;
  };
  onSuccess?: () => void;
}

const ListNFTModal: React.FC<ListNFTModalProps> = ({
  isOpen,
  onClose,
  nft,
  onSuccess
}) => {
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!price || parseFloat(price) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setIsSubmitting(true);
    toast.loading('Listing NFT for sale...', { id: 'list-nft' });

    try {
      const result = await marketplaceService.listNFT(nft.tokenId, price);
      
      if (result.success) {
        toast.success('NFT listed for sale successfully!', { id: 'list-nft' });
        setPrice('');
        onClose();
        if (onSuccess) onSuccess();
      } else {
        toast.error(result.error || 'Failed to list NFT', { id: 'list-nft' });
      }
    } catch (error: any) {
      console.error('Listing error:', error);
      toast.error(error.message || 'Failed to list NFT', { id: 'list-nft' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setPrice('');
      onClose();
    }
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
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <Tag className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    List NFT for Sale
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Set your asking price
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* NFT Preview */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  {nft.imageUrl ? (
                    <img 
                      src={nft.imageUrl} 
                      alt={nft.title}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <Tag className="w-8 h-8 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {nft.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {nft.patentNumber || `Token ID: ${nft.tokenId}`}
                  </p>
                  {nft.category && (
                    <span className="inline-block mt-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                      {nft.category}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Price Input */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Listing Price
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.1"
                    step="0.001"
                    min="0.001"
                    disabled={isSubmitting}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">ETH</span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  You'll receive {price ? `${(parseFloat(price) * 0.975).toFixed(4)} ETH` : '0 ETH'} after 2.5% platform fee
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-blue-800 dark:text-blue-200 font-medium mb-1">
                      Listing Details
                    </p>
                    <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                      <li>• Your NFT will appear on the marketplace immediately</li>
                      <li>• You can cancel the listing anytime</li>
                      <li>• 2.5% platform fee applies to successful sales</li>
                      <li>• Payments are processed instantly via smart contract</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !price || parseFloat(price) <= 0}
                  className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Listing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>List for Sale</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ListNFTModal;