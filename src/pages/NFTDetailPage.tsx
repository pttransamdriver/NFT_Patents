import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';
import {
  FileText, User, Building, Calendar, Heart,
  Share2, ShoppingCart, Tag, ExternalLink,
  Activity, DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { useWeb3 } from '../contexts/Web3Context';
import { marketplaceService, MarketplaceListing } from '../services/marketplaceService';
import ListNFTModal from '../components/modals/ListNFTModal';
import toast from 'react-hot-toast';

const NFTDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isConnected, connectWallet, account } = useWeb3();
  const [isLiked, setIsLiked] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [nft, setNft] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNFTData();
  }, [id]);

  // Convert MarketplaceListing to NFT format (same as MarketplacePage)
  const convertListingToNFT = (listing: MarketplaceListing) => {
    return {
      id: listing.listingId,
      patentNumber: listing.patentNumber || `Unknown-${listing.tokenId}`,
      title: listing.title || `Patent NFT #${listing.tokenId}`,
      description: listing.description || `Patent NFT for ${listing.patentNumber || listing.tokenId}`,
      inventor: listing.inventor || 'Information not available',
      assignee: listing.assignee || 'Information not available',
      filingDate: listing.filingDate || null,
      category: listing.category || 'Patent',
      status: listing.active ? 'active' : 'sold' as const,
      price: parseFloat(listing.priceInEth),
      priceChange: 0,
      owner: listing.seller,
      creator: listing.seller,
      mintDate: listing.mintDate || null,
      isListed: listing.active,
      views: 0,
      likes: 0,
      imageUrl: listing.imageUrl,
      ipfsHash: '',
      transactionHistory: [],
      // Add marketplace-specific properties
      listingId: listing.listingId,
      priceInEth: listing.priceInEth
    };
  };

  const loadNFTData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      // Search through marketplace listings to find the NFT by listingId
      const result = await marketplaceService.getMarketplaceListings(1, 1000);
      const foundListing = result.listings.find(listing => listing.listingId === id);
      if (foundListing) {
        setNft(convertListingToNFT(foundListing) as any);
      } else {
        setNft(null);
      }
    } catch (error) {
      console.error('Failed to load NFT data:', error);
      setNft(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading NFT details...</p>
        </div>
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">NFT Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The NFT you're looking for doesn't exist or is no longer listed.</p>
          <Link to="/marketplace" className="text-blue-600 hover:text-blue-700">
            Browse Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = account === nft.seller;
  // Price history would come from blockchain events - currently not implemented
  const priceHistory: Array<{ date: string; price: number }> = [];

  const handleBuyNow = async () => {
    if (!isConnected) {
      await connectWallet();
      return;
    }
    
    try {
      // Show loading toast
      const loadingToast = toast.loading('Initiating purchase...');
      
      // Check if MetaMask is available
      if (!window.ethereum) {
        toast.dismiss(loadingToast);
        toast.error('MetaMask not found. Please install MetaMask.');
        return;
      }

      // Select the correct provider (same logic as Web3Context)
      let ethereum = window.ethereum;
      if (window.ethereum.providers) {
        ethereum = window.ethereum.providers.find((provider: any) => provider.isMetaMask) || window.ethereum;
      }

      // Get provider and signer
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      
      // Use marketplace service to buy the NFT
      const result = await marketplaceService.buyNFT((nft as any).listingId, (nft as any).priceInEth);
      
      toast.dismiss(loadingToast);
      
      if (result.success) {
        toast.success('Purchase completed successfully!');
        // Refresh NFT data after purchase
        await loadNFTData();
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
              <div className="mb-6">
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
                      {nft.filingDate ? format(new Date(nft.filingDate), 'MMMM dd, yyyy') : 'Not available'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Patent
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
          </div>
        </motion.div>

      </div>

      {/* List NFT Modal */}
      {nft && (
        <ListNFTModal
          isOpen={showListModal}
          onClose={() => setShowListModal(false)}
          nft={{
            id: nft.id,
            tokenId: nft.tokenId || nft.id,
            title: nft.title,
            patentNumber: nft.patentNumber,
            category: nft.category,
            inventor: nft.inventor,
            imageUrl: nft.imageUrl
          }}
          onSuccess={() => {
            loadNFTData(); // Refresh NFT data after successful listing
          }}
        />
      )}
    </div>
  );
};

export default NFTDetailPage;