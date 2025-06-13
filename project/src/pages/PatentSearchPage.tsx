import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Bot, Filter, FileText, Calendar, User, Building, Zap, Sparkles } from 'lucide-react';
import { mockPatents } from '../data/mockData';
import type { Patent } from '../types';

const PatentSearchPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [isAiMode, setIsAiMode] = useState(false);
  const [searchResults, setSearchResults] = useState<Patent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const aiSuggestions = [
    "Find patents about renewable energy from 2020-2023",
    "Show me AI patents in healthcare",
    "Search for battery technology innovations",
    "Find quantum computing patents"
  ];

  const handleSearch = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setSearchResults(mockPatents);
      setIsLoading(false);
    }, 1000);
  };

  const handleAiSearch = async (query: string) => {
    setAiQuery(query);
    setIsAiMode(true);
    setIsLoading(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const aiResults = mockPatents.filter(patent => 
        patent.title.toLowerCase().includes('water') || 
        patent.title.toLowerCase().includes('wireless')
      );
      setSearchResults(aiResults);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            AI-Powered Patent Search
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Search through millions of USPTO patents using natural language queries or advanced filters
          </p>
        </motion.div>

        {/* Search Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8"
        >
          {/* Mode Toggle */}
          <div className="flex justify-center mb-6">
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
              <button
                onClick={() => setIsAiMode(false)}
                className={`px-6 py-3 flex items-center space-x-2 transition-colors duration-200 ${
                  !isAiMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <Search className="w-5 h-5" />
                <span>Standard Search</span>
              </button>
              <button
                onClick={() => setIsAiMode(true)}
                className={`px-6 py-3 flex items-center space-x-2 transition-colors duration-200 ${
                  isAiMode
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <Bot className="w-5 h-5" />
                <span>AI Assistant</span>
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* AI Search Mode */}
          {isAiMode ? (
            <div>
              <div className="relative mb-6">
                <Bot className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-500 w-6 h-6" />
                <input
                  type="text"
                  placeholder="Ask me anything about patents... (e.g., 'Find renewable energy patents from 2022')"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  className="w-full pl-14 pr-24 py-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-lg"
                  onKeyPress={(e) => e.key === 'Enter' && handleAiSearch(aiQuery)}
                />
                <button
                  onClick={() => handleAiSearch(aiQuery)}
                  disabled={!aiQuery.trim() || isLoading}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg font-medium transition-all duration-200"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Analyzing...</span>
                    </div>
                  ) : (
                    <span>Ask AI</span>
                  )}
                </button>
              </div>

              {/* AI Suggestions */}
              <div className="mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Try these example queries:</p>
                <div className="flex flex-wrap gap-2">
                  {aiSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleAiSearch(suggestion)}
                      className="px-3 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg text-sm hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors duration-200"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Standard Search Mode */
            <div>
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                <input
                  type="text"
                  placeholder="Search by patent number, title, inventor, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-24 py-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-lg"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Searching...</span>
                    </div>
                  ) : (
                    <span>Search</span>
                  )}
                </button>
              </div>

              {/* Advanced Filters Toggle */}
              <div className="text-center">
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center space-x-2 mx-auto px-4 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
                >
                  <Filter className="w-4 h-4" />
                  <span>Advanced Filters</span>
                </button>
              </div>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Patent Status
                      </label>
                      <select className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        <option>All Status</option>
                        <option>Active</option>
                        <option>Expired</option>
                        <option>Pending</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Date Range
                      </label>
                      <select className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        <option>All Time</option>
                        <option>Last Year</option>
                        <option>Last 5 Years</option>
                        <option>Last 10 Years</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Category
                      </label>
                      <select className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        <option>All Categories</option>
                        <option>Technology</option>
                        <option>Healthcare</option>
                        <option>Energy</option>
                        <option>Transportation</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Search Results
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {searchResults.length} patent{searchResults.length !== 1 ? 's' : ''} found
              </p>
            </div>

            <div className="space-y-6">
              {searchResults.map((patent, index) => (
                <motion.div
                  key={patent.patentNumber}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {patent.title}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          patent.status === 'active' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : patent.status === 'expired'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {patent.status}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {patent.abstract}
                      </p>
                    </div>
                    {patent.isAvailableForMinting && (
                      <div className="ml-4">
                        <span className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                          <Zap className="w-4 h-4 mr-1" />
                          Available for Minting
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <FileText className="w-4 h-4 mr-2" />
                      <span>Patent #{patent.patentNumber}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <User className="w-4 h-4 mr-2" />
                      <span>{patent.inventors.join(', ')}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Building className="w-4 h-4 mr-2" />
                      <span>{patent.assignee}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Filed: {new Date(patent.filingDate).toLocaleDateString()}</span>
                    </div>
                    
                    {patent.isAvailableForMinting && (
                      <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200">
                        Mint NFT
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {searchResults.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              {isAiMode ? (
                <Bot className="w-12 h-12 text-purple-500" />
              ) : (
                <Search className="w-12 h-12 text-gray-400" />
              )}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {isAiMode ? 'Ask the AI Assistant' : 'Start Your Patent Search'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {isAiMode 
                ? 'Use natural language to find patents or try one of the example queries above'
                : 'Enter keywords, patent numbers, or inventor names to search the USPTO database'
              }
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PatentSearchPage;