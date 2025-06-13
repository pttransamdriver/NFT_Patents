import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Calendar, TrendingUp, Grid, List, Filter, Copy, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import NFTCard from '../components/marketplace/NFTCard';
import { mockNFTs, mockUsers } from '../data/mockData';
import { useWallet } from '../contexts/WalletContext';
import toast from 'react-hot-toast';

const UserProfilePage: React.FC = () => {
  const { address } = useParams<{ address: string }>();
  const { address: currentUserAddress } = useWallet();
  const [activeTab, setActiveTab] = useState<'owned' | 'listed' | 'activity'>('owned');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const user = mockUsers.find(u => u.address === address);
  const isOwnProfile = currentUserAddress === address;

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">User Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400">The user profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const ownedNFTs = mockNFTs.filter(nft => user.ownedNFTs.includes(nft.id));
  const listedNFTs = mockNFTs.filter(nft => user.listedNFTs.includes(nft.id));

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(user.address);
    toast.success('Address copied to clipboard!');
  };

  const stats = [
    { label: 'NFTs Owned', value: user.ownedNFTs.length },
    { label: 'NFTs Listed', value: user.listedNFTs.length },
    { label: 'Total Volume', value: `${user.totalVolume} ETH` },
    { label: 'Member Since', value: format(new Date(user.joinDate), 'MMM yyyy') },
  ];

  const activityData = [
    { type: 'mint', nft: 'Advanced Solar Cell Technology', date: '2024-01-15', price: '12.5 ETH' },
    { type: 'sale', nft: 'AI-Powered Medical Diagnostic', date: '2024-01-10', price: '8.3 ETH' },
    { type: 'list', nft: 'Quantum Computing Error Correction', date: '2024-01-05', price: '25.2 ETH' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-12 h-12 text-white" />
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user.username || 'Anonymous User'}
                </h1>
                {isOwnProfile && (
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                    Your Profile
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2 mb-4">
                <code className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {formatAddress(user.address)}
                </code>
                <button
                  onClick={copyAddress}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200">
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4 mr-2" />
                <span>Joined {format(new Date(user.joinDate), 'MMMM yyyy')}</span>
              </div>
            </div>

            {/* Edit Profile Button (if own profile) */}
            {isOwnProfile && (
              <button className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                Edit Profile
              </button>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {stats.map((stat, index) => (
            <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Tabs and Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
        >
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-6">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('owned')}
                  className={`py-4 text-sm font-medium border-b-2 transition-colors duration-200 ${
                    activeTab === 'owned'
                      ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Owned ({ownedNFTs.length})
                </button>
                <button
                  onClick={() => setActiveTab('listed')}
                  className={`py-4 text-sm font-medium border-b-2 transition-colors duration-200 ${
                    activeTab === 'listed'
                      ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Listed ({listedNFTs.length})
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`py-4 text-sm font-medium border-b-2 transition-colors duration-200 ${
                    activeTab === 'activity'
                      ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Activity
                </button>
              </nav>

              {/* View Mode Toggle (for NFT tabs) */}
              {(activeTab === 'owned' || activeTab === 'listed') && (
                <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 transition-colors duration-200 ${
                      viewMode === 'grid'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 transition-colors duration-200 ${
                      viewMode === 'list'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Owned NFTs */}
            {activeTab === 'owned' && (
              <div>
                {ownedNFTs.length > 0 ? (
                  <div className={
                    viewMode === 'grid' 
                      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                      : 'space-y-4'
                  }>
                    {ownedNFTs.map((nft, index) => (
                      <motion.div
                        key={nft.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                      >
                        <NFTCard nft={nft} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No NFTs owned yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {isOwnProfile ? "You haven't" : "This user hasn't"} acquired any patent NFTs yet.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Listed NFTs */}
            {activeTab === 'listed' && (
              <div>
                {listedNFTs.length > 0 ? (
                  <div className={
                    viewMode === 'grid' 
                      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                      : 'space-y-4'
                  }>
                    {listedNFTs.map((nft, index) => (
                      <motion.div
                        key={nft.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                      >
                        <NFTCard nft={nft} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No NFTs listed for sale
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {isOwnProfile ? "You haven't" : "This user hasn't"} listed any NFTs for sale.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Activity */}
            {activeTab === 'activity' && (
              <div className="space-y-4">
                {activityData.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        activity.type === 'mint' 
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                          : activity.type === 'sale'
                          ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {activity.type === 'mint' && '🎨'}
                        {activity.type === 'sale' && '💰'}
                        {activity.type === 'list' && '🏷️'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {activity.type === 'mint' && 'Minted'}
                          {activity.type === 'sale' && 'Sold'}
                          {activity.type === 'list' && 'Listed'}
                          {' '}{activity.nft}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {format(new Date(activity.date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {activity.price}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UserProfilePage;