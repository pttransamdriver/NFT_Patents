import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FileText, User, Building, Calendar, TrendingUp, Heart, 
  Share2, ShoppingCart, Tag, Clock, ExternalLink, Download,
  Eye, Activity, DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { mockNFTs } from '../data/mockData';
import { useWeb3 } from '../contexts/Web3Context';
import toast from 'react-hot-toast';

const NFTDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isConnected, connectWallet, account } = useWeb3();
  const [isLiked, setIsLiked] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');

  const nft = mockNFTs.find(n => n.id === id);

  if (!nft) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">NFT Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The NFT you're looking for doesn't exist.</p>
          <Link to="/marketplace" className="text-blue-600 hover:text-blue-700">
            Browse Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = account === nft.owner;
  const priceHistory = [
    { date: '2024-01-15', price: 10.2 },
    { date: '2024-01-10', price: 8.7 },
    { date: '2024-01-05', price: 12.5 },
    { date: '2023-12-20', price: 11.3 },
    { date: '2023-12-15', price: 9.8 },
  ];

  const handleBuyNow = async () => {
    if (!isConnected) {
      await connectWallet();
      return;
    }
    toast.success('Purchase initiated! Please confirm in your wallet.');
  };

  const handleMakeOffer = async () => {
    if (!isConnected) {
      await connectWallet();
      return;
    }
    if (!offerAmount || parseFloat(offerAmount) <= 0) {
      toast.error('Please enter a valid offer amount');
      return;
    }
    toast.success(`Offer of ${offerAmount} ETH submitted!`);
    setShowOfferModal(false);
    setOfferAmount('');
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast.success(isLiked ? 'Removed from favorites' : 'Added to favorites');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left Column - NFT Display */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
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
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <button
                      onClick={handleLike}
                      className={`p-2 rounded-lg transition-colors duration-200 ${
                        isLiked 
                          ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={handleShare}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200">
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Eye className="w-4 h-4" />
                    <span>{nft.views.toLocaleString()} views</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column - NFT Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6"
          >
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {nft.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {nft.description}
              </p>
            </div>

            {/* Price and Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Price</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {nft.price} ETH
                  </p>
                  <div className="flex items-center text-sm mt-1">
                    <TrendingUp className={`w-4 h-4 mr-1 ${nft.priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                    <span className={nft.priceChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      {nft.priceChange >= 0 ? '+' : ''}{nft.priceChange}%
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">24h</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Engagement</p>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Eye className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-gray-900 dark:text-white">{nft.views.toLocaleString()} views</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Heart className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-gray-900 dark:text-white">{nft.likes} likes</span>
                    </div>
                  </div>
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
                  <button
                    onClick={() => setShowOfferModal(true)}
                    className="w-full py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center"
                  >
                    <Tag className="w-5 h-5 mr-2" />
                    Make Offer
                  </button>
                </div>
              )}

              {isOwner && (
                <div className="space-y-3">
                  <Link
                    to={`/create-listing/${nft.id}`}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center"
                  >
                    <Tag className="w-5 h-5 mr-2" />
                    {nft.isListed ? 'Update Listing' : 'List for Sale'}
                  </Link>
                </div>
              )}
            </div>

            {/* Patent Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Patent Information
              </h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <FileText className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Patent Number</p>
                    <p className="font-medium text-gray-900 dark:text-white">{nft.patentNumber}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <User className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Inventor(s)</p>
                    <p className="font-medium text-gray-900 dark:text-white">{nft.inventor}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Building className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Assignee</p>
                    <p className="font-medium text-gray-900 dark:text-white">{nft.assignee}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Filing Date</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {format(new Date(nft.filingDate), 'MMMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on USPTO
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Additional Tabs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
        >
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              <button className="py-4 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-medium">
                Price History
              </button>
              <button className="py-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium">
                Transaction History
              </button>
              <button className="py-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium">
                More Details
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Price History Chart */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Price History
              </h4>
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
            </div>
          </div>
        </motion.div>

        {/* Make Offer Modal */}
        {showOfferModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Make an Offer
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Offer Amount (ETH)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Current price: {nft.price} ETH
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowOfferModal(false)}
                  className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMakeOffer}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  Submit Offer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NFTDetailPage;