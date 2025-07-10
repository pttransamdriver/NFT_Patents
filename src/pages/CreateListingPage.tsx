import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tag, Calendar, DollarSign, Clock, ArrowLeft, CheckCircle } from 'lucide-react';
import { mockNFTs } from '../data/mockData';
import { useWeb3 } from '../contexts/Web3Context';
import toast from 'react-hot-toast';

const CreateListingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isConnected, account } = useWeb3();
  
  const [listingType, setListingType] = useState<'fixed' | 'auction'>('fixed');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('7');
  const [startingBid, setStartingBid] = useState('');
  const [reservePrice, setReservePrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nft = mockNFTs.find(n => n.id === id);

  if (!nft) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">NFT Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400">The NFT you're trying to list doesn't exist.</p>
        </div>
      </div>
    );
  }

  if (account !== nft.owner) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">You can only list NFTs that you own.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    if (listingType === 'fixed' && (!price || parseFloat(price) <= 0)) {
      toast.error('Please enter a valid price');
      return;
    }

    if (listingType === 'auction' && (!startingBid || parseFloat(startingBid) <= 0)) {
      toast.error('Please enter a valid starting bid');
      return;
    }

    setIsSubmitting(true);

    // Simulate listing process
    setTimeout(() => {
      toast.success(`NFT ${listingType === 'fixed' ? 'listed for sale' : 'auction created'} successfully!`);
      setIsSubmitting(false);
      navigate(`/nft/${id}`);
    }, 2000);
  };

  const durationOptions = [
    { value: '1', label: '1 day' },
    { value: '3', label: '3 days' },
    { value: '7', label: '7 days' },
    { value: '14', label: '14 days' },
    { value: '30', label: '30 days' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {nft.isListed ? 'Update Listing' : 'Create Listing'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Set your price and terms for selling your patent NFT
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* NFT Preview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              NFT Preview
            </h2>
            
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-6 mb-4">
              <div className="text-center">
                <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-lg shadow-md flex items-center justify-center mx-auto mb-4">
                  <Tag className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {nft.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Patent #{nft.patentNumber}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Category:</span>
                <span className="font-medium text-gray-900 dark:text-white">{nft.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Inventor:</span>
                <span className="font-medium text-gray-900 dark:text-white">{nft.inventor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Current Value:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{nft.price} ETH</span>
              </div>
            </div>
          </motion.div>

          {/* Listing Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Listing Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Listing Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setListingType('fixed')}
                    className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                      listingType === 'fixed'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <DollarSign className="w-6 h-6 mx-auto mb-2" />
                    <div className="text-sm font-medium">Fixed Price</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Sell at a set price</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setListingType('auction')}
                    className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                      listingType === 'auction'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <Clock className="w-6 h-6 mx-auto mb-2" />
                    <div className="text-sm font-medium">Timed Auction</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Sell to highest bidder</div>
                  </button>
                </div>
              </div>

              {/* Fixed Price Fields */}
              {listingType === 'fixed' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price (ETH)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Set the price you want to receive for this NFT
                  </p>
                </div>
              )}

              {/* Auction Fields */}
              {listingType === 'auction' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Starting Bid (ETH)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={startingBid}
                      onChange={(e) => setStartingBid(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Reserve Price (ETH) - Optional
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={reservePrice}
                      onChange={(e) => setReservePrice(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Minimum price you'll accept. If not met, the auction won't complete.
                    </p>
                  </div>
                </div>
              )}

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {durationOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  How long your {listingType === 'fixed' ? 'listing' : 'auction'} will be active
                </p>
              </div>

              {/* Fees Information */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Fees</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Platform fee:</span>
                    <span className="text-gray-900 dark:text-white">2.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Creator royalty:</span>
                    <span className="text-gray-900 dark:text-white">5%</span>
                  </div>
                  <div className="pt-1 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between font-medium">
                      <span className="text-gray-900 dark:text-white">You will receive:</span>
                      <span className="text-gray-900 dark:text-white">
                        {listingType === 'fixed' && price 
                          ? `${(parseFloat(price) * 0.925).toFixed(3)} ETH`
                          : listingType === 'auction' && startingBid
                          ? `${(parseFloat(startingBid) * 0.925).toFixed(3)} ETH (minimum)`
                          : '-- ETH'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !isConnected}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {listingType === 'fixed' ? 'Creating Listing...' : 'Starting Auction...'}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {listingType === 'fixed' ? 'List for Sale' : 'Start Auction'}
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                By listing this NFT, you agree to our terms of service and marketplace fees
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CreateListingPage;