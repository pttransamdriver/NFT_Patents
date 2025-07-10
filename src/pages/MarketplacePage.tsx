import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Grid, List, TrendingUp, Clock, DollarSign } from 'lucide-react';
import NFTCard from '../components/marketplace/NFTCard';
import { mockNFTs } from '../data/mockData';
import type { SearchFilters } from '../types';

const MarketplacePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: 'popularity',
    sortOrder: 'desc'
  });

  const categories = ['All', 'Clean Energy', 'Healthcare', 'Transportation', 'Computing', 'Materials', 'Energy Storage'];
  const statusOptions = ['All', 'active', 'expired', 'pending'];

  const filteredNFTs = useMemo(() => {
    let filtered = mockNFTs.filter(nft => {
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
  }, [searchQuery, filters]);

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

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            {filteredNFTs.length} patent{filteredNFTs.length !== 1 ? 's' : ''} found
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
      </div>
    </div>
  );
};

export default MarketplacePage;