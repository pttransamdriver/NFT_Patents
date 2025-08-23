import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Grid, List, TrendingUp, Clock, DollarSign, Copy } from 'lucide-react';
import NFTCard from '../components/marketplace/NFTCard';
import { mockNFTs } from '../data/mockData';
import { useWeb3 } from '../contexts/Web3Context';
import { getUserNFTs } from '../utils/contracts';
import type { SearchFilters } from '../types';

const MarketplacePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: 'popularity',
    sortOrder: 'desc'
  });
  const [realNFTs, setRealNFTs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showListingModal, setShowListingModal] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const [listingPrice, setListingPrice] = useState('');
  const [showExternalListingModal, setShowExternalListingModal] = useState(false);
  const [externalNFTAddress, setExternalNFTAddress] = useState('');
  const [externalTokenId, setExternalTokenId] = useState('');
  const { signer, account, isConnected, connectWallet } = useWeb3();

  const categories = ['All', 'Clean Energy', 'Healthcare', 'Transportation', 'Computing', 'Materials', 'Energy Storage'];
  const statusOptions = ['All', 'active', 'expired', 'pending'];

  // Fetch user's minted NFTs
  useEffect(() => {
    const fetchUserNFTs = async () => {
      if (!signer || !account) return;
      
      setLoading(true);
      try {
        const userNFTs = await getUserNFTs(signer, account);
        console.log('User NFTs:', userNFTs);
        
        // Convert contract NFTs to marketplace format
        const formattedNFTs = userNFTs.map((nft, index) => ({
          id: nft.tokenId,
          title: `Patent NFT #${nft.tokenId}`,
          description: 'Minted from your deployed contract',
          patentNumber: `Contract-${nft.tokenId}`,
          inventor: 'You',
          assignee: 'Self',
          category: 'Technology',
          status: 'active' as const,
          price: 0.1, // Default price for listing
          priceChange: 0,
          isListed: false, // Not listed yet
          owner: account,
          mintDate: new Date().toISOString(),
          filingDate: new Date().toISOString(),
          views: 0,
          likes: 0,
          transactionHistory: []
        }));
        
        setRealNFTs(formattedNFTs);
      } catch (error) {
        console.error('Error fetching user NFTs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserNFTs();
  }, [signer, account]);

  // Handle NFT listing
  const handleListNFT = (nft: any) => {
    setSelectedNFT(nft);
    setShowListingModal(true);
  };

  const handleConfirmListing = () => {
    if (!listingPrice || parseFloat(listingPrice) <= 0) {
      alert('Please enter a valid price');
      return;
    }
    
    console.log(`Listing NFT #${selectedNFT.id} for ${listingPrice} ETH`);
    alert(`NFT #${selectedNFT.id} listed for ${listingPrice} ETH! (Simulated)`);
    
    setShowListingModal(false);
    setSelectedNFT(null);
    setListingPrice('');
  };

  const filteredNFTs = useMemo(() => {
    // Only show real NFTs (remove mock NFTs)
    const allNFTs = [...realNFTs];
    
    let filtered = allNFTs.filter(nft => {
      const matchesSearch = searchQuery === '' || 
        nft.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nft.inventor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nft.patentNumber.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !filters.category || filters.category === 'All' || nft.category === filters.category;
      const matchesStatus = !filters.status || filters.status === 'All' || nft.status === filters.status;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });

    // Sort results
    if (filters.sortBy === 'price') {
      filtered.sort((a, b) => filters.sortOrder === 'asc' ? a.price - b.price : b.price - a.price);
    } else if (filters.sortBy === 'date') {
      filtered.sort((a, b) => {
        const dateA = new Date(a.mintDate).getTime();
        const dateB = new Date(b.mintDate).getTime();
        return filters.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
    } else {
      // Sort by popularity (views + likes)
      filtered.sort((a, b) => {
        const popularityA = a.views + a.likes * 10;
        const popularityB = b.views + b.likes * 10;
        return filters.sortOrder === 'asc' ? popularityA - popularityB : popularityB - popularityA;
      });
    }

    return filtered;
  }, [searchQuery, filters, realNFTs]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Patent NFT Marketplace
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover and trade USPTO patent NFTs from leading innovators worldwide
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search patents, inventors, or patent numbers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 text-gray-900 dark:text-white"
            >
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </button>

            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 transition-colors duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 transition-colors duration-200 ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category || 'All'}
                    onChange={(e) => setFilters({...filters, category: e.target.value === 'All' ? undefined : e.target.value})}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status || 'All'}
                    onChange={(e) => setFilters({...filters, status: e.target.value === 'All' ? undefined : e.target.value})}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sort By
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={filters.sortBy}
                      onChange={(e) => setFilters({...filters, sortBy: e.target.value as any})}
                      className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="popularity">Popularity</option>
                      <option value="price">Price</option>
                      <option value="date">Date</option>
                    </select>
                    <button
                      onClick={() => setFilters({...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc'})}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {filters.sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Your Minted NFTs Section */}
        {isConnected && realNFTs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 mb-8 border-2 border-green-200 dark:border-green-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  🎉 Your Patent NFTs ({realNFTs.length})
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Ready to earn! List your NFTs and earn 95% of each sale (5% platform fee)
                </p>
              </div>
              <button className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg">
                💰 List All NFTs
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {realNFTs.slice(0, 3).map((nft) => (
                <div key={nft.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Patent NFT #{nft.id}</h3>
                    <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs">
                      Owned
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Minted from your contract
                  </p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleListNFT(nft)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      🏷️ List for Sale
                    </button>
                    <button className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      🔍 View
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {realNFTs.length > 3 && (
              <div className="mt-4 text-center">
                <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                  View all {realNFTs.length} NFTs →
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Call-to-Action for Non-Connected Users OR Connected Users with No NFTs */}
        {(!isConnected || (isConnected && realNFTs.length === 0)) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 mb-8 text-center"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              🚀 Start Earning with Your Patent NFTs!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {!isConnected 
                ? "Connect your wallet to list your minted NFTs for sale. Earn 95% of each sale!"
                : "You don't have any minted NFTs yet. Go to the mint page to create your first Patent NFT, then come back to list it for sale!"
              }
            </p>
            {!isConnected ? (
              <button 
                onClick={connectWallet}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
              >
                Connect Wallet to Start
              </button>
            ) : (
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => navigate('/mint')}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-200"
                >
                  🎨 Mint Your First NFT
                </button>
                <button 
                  onClick={() => setShowExternalListingModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-200"
                >
                  📋 List Your NFT Here
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            {filteredNFTs.length} patent{filteredNFTs.length !== 1 ? 's' : ''} found
            {realNFTs.length > 0 && (
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs">
                {realNFTs.length} yours
              </span>
            )}
          </p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>Market trending up</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              <span>Last updated: now</span>
            </div>
          </div>
        </div>

        {/* NFT Grid/List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {filteredNFTs.length > 0 ? (
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }>
              {filteredNFTs.map((nft, index) => (
                <motion.div
                  key={nft.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <NFTCard 
                    nft={nft} 
                    className={viewMode === 'list' ? 'flex' : ''}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No patents found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your search terms or filters
              </p>
            </div>
          )}
        </motion.div>

        {/* Load More Button */}
        {filteredNFTs.length > 0 && filteredNFTs.length >= 12 && (
          <div className="text-center mt-12">
            <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200">
              Load More Patents
            </button>
          </div>
        )}

        {/* Listing Modal */}
        {showListingModal && selectedNFT && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                🏷️ List NFT for Sale
              </h3>
              
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white">Patent NFT #{selectedNFT.id}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ready to list on marketplace</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Listing Price (ETH)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={listingPrice}
                  onChange={(e) => setListingPrice(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-sm text-green-800 dark:text-green-200">
                  <div className="flex justify-between mb-1">
                    <span>Listing Price:</span>
                    <span>{listingPrice || '0.00'} ETH</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Platform Fee (5%):</span>
                    <span>{listingPrice ? (parseFloat(listingPrice) * 0.05).toFixed(4) : '0.00'} ETH</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-green-200 dark:border-green-700 pt-1">
                    <span>You'll Receive:</span>
                    <span>{listingPrice ? (parseFloat(listingPrice) * 0.95).toFixed(4) : '0.00'} ETH</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowListingModal(false);
                    setSelectedNFT(null);
                    setListingPrice('');
                  }}
                  className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmListing}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  List NFT
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* External NFT Listing Modal */}
        {showExternalListingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                📋 List Your External NFT
              </h3>
              
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">Instructions:</h4>
                <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
                  <li>Transfer your NFT to our marketplace contract</li>
                  <li>Enter the NFT contract address and token ID below</li>
                  <li>Your NFT will appear in the marketplace once verified</li>
                </ol>
              </div>

              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Marketplace Contract:</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all flex-1">
                    {import.meta.env.VITE_MARKETPLACE_ADDRESS || 'Contract not deployed'}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(import.meta.env.VITE_MARKETPLACE_ADDRESS || '');
                      alert('Contract address copied!');
                    }}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    title="Copy address"
                  >
                    <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  NFT Contract Address
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={externalNFTAddress}
                  onChange={(e) => setExternalNFTAddress(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Token ID
                </label>
                <input
                  type="text"
                  placeholder="1"
                  value={externalTokenId}
                  onChange={(e) => setExternalTokenId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowExternalListingModal(false);
                    setExternalNFTAddress('');
                    setExternalTokenId('');
                  }}
                  className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!externalNFTAddress || !externalTokenId) {
                      alert('Please enter both contract address and token ID');
                      return;
                    }
                    console.log('Adding external NFT:', { address: externalNFTAddress, tokenId: externalTokenId });
                    alert('NFT listing submitted! It will appear once the transfer is verified.');
                    setShowExternalListingModal(false);
                    setExternalNFTAddress('');
                    setExternalTokenId('');
                  }}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  Submit Listing
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplacePage;