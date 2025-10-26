import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, TrendingUp, Clock, DollarSign, Wallet, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import NFTCard from '../components/marketplace/NFTCard';
import MyNFTsModal from '../components/modals/MyNFTsModal';
import ListNFTModal from '../components/modals/ListNFTModal';
import { useWeb3 } from '../contexts/Web3Context';
import { getUserNFTs, getPatentNFTContract } from '../utils/contracts';
import { ethers } from 'ethers';
import { marketplaceService, type MarketplaceListing, type PaginatedListings } from '../services/marketplaceService';
import type { SearchFilters } from '../types';

const MarketplacePage: React.FC = () => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: 'popularity',
    sortOrder: 'desc'
  });
  const [realNFTs, setRealNFTs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [marketplaceListings, setMarketplaceListings] = useState<MarketplaceListing[]>([]);
  const [marketplaceLoading, setMarketplaceLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalListings, setTotalListings] = useState(0);
  const [showListingModal, setShowListingModal] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const [listingPrice, setListingPrice] = useState('');
  const [showMyNFTsModal, setShowMyNFTsModal] = useState(false);
  const [nftRefreshTrigger, setNftRefreshTrigger] = useState(0);
  const { signer, account, isConnected, connectWallet } = useWeb3();

  // Check if we should open My NFTs modal from navigation state
  useEffect(() => {
    const state = location.state as any;
    if (state?.openMyNFTs) {
      setNftRefreshTrigger(prev => prev + 1);
      setShowMyNFTsModal(true);
      // Clear the state so it doesn't reopen on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Temporary cleanup function for development
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).cleanupDuplicates = async (patentNumber: string) => {
        console.log(`Starting cleanup for patent: ${patentNumber}`);
        const result = await marketplaceService.cancelDuplicateListings(patentNumber);
        console.log(`Cleanup result:`, result);
        
        if (result.success && result.canceledCount > 0) {
          alert(`Successfully canceled ${result.canceledCount} duplicate listings for ${patentNumber}`);
          // Refresh marketplace
          window.location.reload();
        } else if (result.canceledCount === 0) {
          alert(`No duplicates found for ${patentNumber}`);
        } else {
          alert(`Failed to cleanup duplicates: ${result.error}`);
        }
      };
      
      (window as any).findDuplicates = async () => {
        console.log('Finding duplicate patents...');
        const duplicates = await marketplaceService.getDuplicatePatents();
        console.log('Duplicate patents found:', duplicates);
        return duplicates;
      };
    }
  }, []);

  const categories = ['All', 'Clean Energy', 'Healthcare', 'Transportation', 'Computing', 'Materials', 'Energy Storage'];
  const statusOptions = ['All', 'active', 'expired', 'pending'];

  // Function to refresh a specific NFT's listing status
  const refreshNFTListingStatus = async (nftId: string) => {
    try {
      const isListed = await marketplaceService.isNFTListed(nftId);
      setRealNFTs(prevNFTs => 
        prevNFTs.map(nft => 
          nft.id === nftId ? { ...nft, isListed: isListed } : nft
        )
      );
    } catch (error) {
      console.error('Error refreshing NFT listing status:', error);
    }
  };

  // Fetch user's minted NFTs from multiple sources
  useEffect(() => {
    const fetchUserNFTs = async () => {
      if (!signer || !account) return;
      
      setLoading(true);
      try {
        const formattedNFTs = [];
        
        // First, try to get NFTs from our PatentNFT contract
        try {
          const contract = getPatentNFTContract(signer);
          const balance = await contract.balanceOf(account);
          console.log(`Found ${balance} NFTs in PatentNFT contract`);
          
          // Get actual patent data for each NFT
          for (let i = 0; i < Number(balance); i++) {
            try {
              const tokenId = await contract.tokenOfOwnerByIndex(account, BigInt(i));
              
              // Get patent details from tokenURI since getPatent() doesn't exist
              let patentData;
              try {
                const tokenURI = await contract.tokenURI(tokenId);

                // Parse tokenURI to get metadata (this points to backend API)
                const response = await fetch(tokenURI);
                const metadata = await response.json();

                // Extract patent data from attributes
                const getAttribute = (traitType: string) =>
                  metadata.attributes?.find((attr: any) => attr.trait_type === traitType)?.value;

                patentData = {
                  title: getAttribute('Title') || metadata.name || `Patent NFT #${tokenId}`,
                  inventor: getAttribute('Inventor') || 'Unknown',
                  filingDate: BigInt(Math.floor(Date.now() / 1000)),
                  patentNumber: getAttribute('Patent Number') || `PATENT-${tokenId}`,
                  isVerified: true
                };
              } catch (error) {
                console.warn(`Could not get patent metadata for token ${tokenId}`, error);
                patentData = {
                  title: `Patent NFT #${tokenId}`,
                  inventor: 'Unknown',
                  filingDate: BigInt(Math.floor(Date.now() / 1000)),
                  patentNumber: `PATENT-${tokenId}`,
                  isVerified: false
                };
              }
              
              // Check if this NFT is already listed on the marketplace
              const isListed = await marketplaceService.isNFTListed(tokenId.toString());
              
              formattedNFTs.push({
                id: tokenId.toString(),
                tokenId: tokenId.toString(), // Add explicit tokenId property
                contractAddress: import.meta.env.VITE_PATENT_NFT_ADDRESS,
                title: patentData.title || `Patent NFT #${tokenId}`,
                description: patentData.title ? `${patentData.title} - Ready to list for sale!` : 'Minted from your deployed contract',
                patentNumber: patentData.patentNumber || `Contract-${tokenId}`,
                inventor: patentData.inventor || 'You',
                assignee: 'Self',
                category: 'Technology',
                status: 'active' as const,
                price: 0.1, // Default price for listing
                priceChange: 0,
                isListed: isListed, // Check actual marketplace status
                owner: account,
                mintDate: new Date(Number(patentData.filingDate) * 1000).toISOString(),
                filingDate: new Date(Number(patentData.filingDate) * 1000).toISOString(),
                views: 0,
                likes: 0,
                transactionHistory: []
              });
            } catch (error) {
              console.error(`Error loading NFT at index ${i}:`, error);
            }
          }
        } catch (contractError) {
          console.warn('Could not access PatentNFT contract:', contractError);
        }
        
        // Try to detect NFTs using Transfer events (more reliable method)
        try {
          console.log('Attempting to detect NFTs via Transfer events...');
          const provider = await signer.provider;
          
          // Standard ERC721 Transfer event signature
          const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
          
          // Look for Transfer events TO this account
          const toAddress = account.toLowerCase().slice(2).padStart(64, '0'); // Remove 0x first, then pad
          const logs = await provider.getLogs({
            fromBlock: 0,
            toBlock: 'latest',
            topics: [
              transferTopic, // Transfer event
              null, // from (any address)
              '0x' + toAddress // to this account
            ]
          });
          
          console.log(`Found ${logs.length} Transfer events to account`);
          
          // Group by contract address and get unique tokens
          const contractTokens = new Map();
          
          for (const log of logs) {
            try {
              const contractAddress = log.address.toLowerCase();
              const tokenId = BigInt(log.topics[3]).toString();
              
              // Skip if this is our PatentNFT contract (already processed above)
              if (contractAddress.toLowerCase() === import.meta.env.VITE_PATENT_NFT_ADDRESS?.toLowerCase()) {
                continue;
              }
              
              if (!contractTokens.has(contractAddress)) {
                contractTokens.set(contractAddress, new Set());
              }
              contractTokens.get(contractAddress).add(tokenId);
            } catch (error) {
              console.warn('Error parsing log:', error);
            }
          }
          
          // For each contract, verify current ownership and get metadata
          for (const [contractAddress, tokenIds] of Array.from(contractTokens.entries())) {
            try {
              // Create a generic ERC721 contract instance
              const genericNFTContract = new ethers.Contract(contractAddress, [
                'function ownerOf(uint256 tokenId) view returns (address)',
                'function tokenURI(uint256 tokenId) view returns (string)',
                'function name() view returns (string)',
                'function symbol() view returns (string)'
              ], signer);
              
              let contractName = 'Unknown NFT';
              try {
                contractName = await genericNFTContract.name();
              } catch {}
              
              for (const tokenId of tokenIds) {
                try {
                  // Verify current ownership
                  const owner = await genericNFTContract.ownerOf(tokenId);
                  if (owner.toLowerCase() !== account.toLowerCase()) {
                    continue; // User no longer owns this NFT
                  }
                  
                  // Get token URI for metadata
                  let tokenURI = '';
                  let metadata = null;
                  try {
                    tokenURI = await genericNFTContract.tokenURI(tokenId);
                    if (tokenURI.startsWith('http')) {
                      const response = await fetch(tokenURI);
                      if (response.ok) {
                        metadata = await response.json();
                      }
                    }
                  } catch {}
                  
                  // For external NFTs, we can't easily check marketplace status with different contract addresses
                  // So we'll default to false but this could be enhanced later
                  const isListed = false; // TODO: Implement cross-contract listing check
                  
                  formattedNFTs.push({
                    id: `${contractAddress}-${tokenId}`,
                    tokenId: tokenId, // Add explicit tokenId property for external NFTs
                    contractAddress,
                    title: metadata?.name || `${contractName} #${tokenId}`,
                    description: metadata?.description || `NFT from external contract`,
                    patentNumber: `External-${tokenId}`,
                    inventor: 'External',
                    assignee: 'External',
                    category: 'External NFT',
                    status: 'active' as const,
                    price: 0.1,
                    priceChange: 0,
                    isListed: isListed,
                    owner: account,
                    mintDate: new Date().toISOString(),
                    filingDate: new Date().toISOString(),
                    views: 0,
                    likes: 0,
                    transactionHistory: [],
                    imageUrl: metadata?.image,
                    tokenURI,
                    isExternal: true
                  });
                } catch (error) {
                  console.warn(`Error checking token ${tokenId} in contract ${contractAddress}:`, error);
                }
              }
            } catch (error) {
              console.warn(`Error accessing contract ${contractAddress}:`, error);
            }
          }
        } catch (eventError) {
          console.warn('Could not detect NFTs via events:', eventError);
        }
        
        console.log(`Total NFTs found: ${formattedNFTs.length}`);
        setRealNFTs(formattedNFTs);
      } catch (error) {
        console.error('Error fetching user NFTs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserNFTs();
  }, [signer, account]);

  // Fetch marketplace listings
  useEffect(() => {
    const fetchMarketplaceListings = async () => {
      setMarketplaceLoading(true);
      try {
        console.log('Fetching marketplace listings for page:', currentPage);
        const result = await marketplaceService.getMarketplaceListings(currentPage, 20);
        console.log('Marketplace listings result:', result);
        setMarketplaceListings(result.listings);
        setTotalPages(result.totalPages);
        setTotalListings(result.totalListings);
      } catch (error) {
        console.error('Error fetching marketplace listings:', error);
        setMarketplaceListings([]);
      } finally {
        setMarketplaceLoading(false);
      }
    };

    fetchMarketplaceListings();
  }, [currentPage]);

  // Handle NFT listing
  const handleListNFT = (nft: any) => {
    setSelectedNFT(nft);
    setShowListingModal(true);
  };

  const handleConfirmListing = async () => {
    if (!listingPrice || parseFloat(listingPrice) <= 0) {
      alert('Please enter a valid price');
      return;
    }
    
    if (!selectedNFT) return;
    
    try {
      console.log('Listing NFT with ID:', selectedNFT.id, 'for price:', listingPrice);
      
      // Use the marketplace service to actually list the NFT
      const result = await marketplaceService.listNFT(selectedNFT.id, listingPrice);
      
      if (result.success) {
        alert(`NFT "${selectedNFT.title}" successfully listed for ${listingPrice} ETH!\nTransaction hash: ${result.txHash}`);
        
        // Refresh the NFT listing status from blockchain
        await refreshNFTListingStatus(selectedNFT.id);
        
        // Add a small delay before refreshing to allow blockchain to process
        setTimeout(async () => {
          try {
            console.log('Refreshing marketplace listings after successful listing...');
            const updatedListings = await marketplaceService.getMarketplaceListings(1, 20); // Start from page 1 to see new listings
            setMarketplaceListings(updatedListings.listings);
            setTotalPages(updatedListings.totalPages);
            setTotalListings(updatedListings.totalListings);
            setCurrentPage(1); // Reset to page 1 to show the new listing
            console.log(`Found ${updatedListings.totalListings} total listings after refresh`);
          } catch (refreshError) {
            console.error('Error refreshing marketplace after listing:', refreshError);
          }
        }, 2000); // 2 second delay
      } else {
        alert(`Failed to list NFT: ${result.error}`);
        console.error('Listing failed:', result.error);
      }
    } catch (error) {
      console.error('Error listing NFT:', error);
      alert('Error listing NFT. Please check console for details.');
    }
    
    setShowListingModal(false);
    setSelectedNFT(null);
    setListingPrice('');
  };

  const handleSellNFTFromModal = async (nft: any, price: string) => {
    try {
      console.log('Listing NFT from modal with token ID:', nft.tokenId, 'for price:', price);
      
      // Use the marketplace service to actually list the NFT
      const result = await marketplaceService.listNFT(nft.tokenId, price);
      
      if (result.success) {
        alert(`NFT #${nft.tokenId} successfully listed for ${price} ETH!\nTransaction hash: ${result.txHash}`);
        
        // Refresh user NFTs to reflect changes
        setNftRefreshTrigger(prev => prev + 1);
        
        // Also refresh the NFT listing status in the marketplace page
        await refreshNFTListingStatus(nft.tokenId);
        
        // Add a small delay before refreshing marketplace to allow blockchain to process
        setTimeout(async () => {
          try {
            console.log('Refreshing marketplace listings after successful listing from modal...');
            const updatedListings = await marketplaceService.getMarketplaceListings(1, 20); // Start from page 1 to see new listings
            setMarketplaceListings(updatedListings.listings);
            setTotalPages(updatedListings.totalPages);
            setTotalListings(updatedListings.totalListings);
            setCurrentPage(1); // Reset to page 1 to show the new listing
            console.log(`Found ${updatedListings.totalListings} total listings after refresh`);
          } catch (refreshError) {
            console.error('Error refreshing marketplace after listing from modal:', refreshError);
          }
        }, 2000); // 2 second delay
      } else {
        alert(`Failed to list NFT: ${result.error}`);
        console.error('Listing failed:', result.error);
      }
    } catch (error) {
      console.error('Error listing NFT from modal:', error);
      alert('Error listing NFT. Please check console for details.');
    }
  };

  // Convert MarketplaceListing to NFT format for NFTCard component
  const convertListingToNFT = (listing: MarketplaceListing) => {
    return {
      id: listing.listingId,
      patentNumber: listing.patentNumber || `Unknown-${listing.tokenId}`,
      title: listing.title || `Patent NFT #${listing.tokenId}`,
      description: `Patent NFT available for purchase at ${listing.priceInEth} ETH`,
      inventor: listing.inventor || 'Unknown',
      assignee: 'Unknown',
      filingDate: new Date().toISOString(),
      category: 'Technology', // Default category
      status: 'active' as const,
      price: parseFloat(listing.priceInEth),
      priceChange: 0,
      owner: listing.seller,
      creator: listing.seller,
      mintDate: new Date().toISOString(),
      isListed: true,
      views: 0,
      likes: 0,
      imageUrl: listing.imageUrl,
      ipfsHash: '',
      transactionHistory: []
    };
  };

  const filteredNFTs = useMemo(() => {
    // Use marketplace listings instead of user's personal NFTs
    let filtered = marketplaceListings.filter(listing => {
      const matchesSearch = searchQuery === '' || 
        (listing.title && listing.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (listing.inventor && listing.inventor.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (listing.patentNumber && listing.patentNumber.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Since we don't have category/status on marketplace listings yet, skip those filters for now
      // const matchesCategory = !filters.category || filters.category === 'All' || listing.category === filters.category;
      // const matchesStatus = !filters.status || filters.status === 'All' || listing.status === filters.status;
      
      return matchesSearch;
    });

    // Sort results
    if (filters.sortBy === 'price') {
      filtered.sort((a, b) => {
        const priceA = parseFloat(a.priceInEth);
        const priceB = parseFloat(b.priceInEth);
        return filters.sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
      });
    } else if (filters.sortBy === 'date') {
      // Since we don't have mintDate on MarketplaceListing, sort by listing ID as proxy for recency
      filtered.sort((a, b) => {
        const idA = parseInt(a.listingId);
        const idB = parseInt(b.listingId);
        return filters.sortOrder === 'asc' ? idA - idB : idB - idA;
      });
    } else {
      // Sort by token ID as proxy for popularity (newer tokens = higher IDs)
      filtered.sort((a, b) => {
        const tokenA = parseInt(a.tokenId);
        const tokenB = parseInt(b.tokenId);
        return filters.sortOrder === 'asc' ? tokenA - tokenB : tokenB - tokenA;
      });
    }

    return filtered;
  }, [searchQuery, filters, marketplaceListings]);

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
            Discover and trade patent NFTs from leading innovators worldwide
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

            {/* My NFTs Button */}
            {isConnected && (
              <button
                onClick={() => {
                  setNftRefreshTrigger(prev => prev + 1); // Trigger refresh
                  setShowMyNFTsModal(true);
                }}
                className="flex items-center px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg"
              >
                <Wallet className="w-5 h-5 mr-2" />
                My NFTs
              </button>
            )}
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
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                🎉 Your Patent NFTs ({realNFTs.length})
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Ready to earn! List your NFTs and earn 95% of each sale (5% platform fee)
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {realNFTs.slice(0, 3).map((nft) => (
                <div key={nft.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate pr-2" title={nft.title}>
                      {nft.title}
                    </h3>
                    <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs whitespace-nowrap">
                      Owned
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Patent #{nft.patentNumber}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                    Inventor: {nft.inventor}
                  </p>
                  <div className="flex gap-2">
                    <button 
                      onClick={nft.isListed ? undefined : () => handleListNFT(nft)}
                      disabled={nft.isListed}
                      className={`flex-1 px-3 py-2 text-sm rounded transition-colors ${
                        nft.isListed 
                          ? 'bg-gray-400 dark:bg-gray-600 text-gray-200 cursor-not-allowed' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {nft.isListed ? '🔒 Already Listed' : '🏷️ List for Sale'}
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
              <button
                onClick={() => {
                  setNftRefreshTrigger(prev => prev + 1);
                  setShowMyNFTsModal(true);
                }}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-200"
              >
                📋 List Your NFT Here
              </button>
            )}
          </motion.div>
        )}

        {/* Marketplace Listings Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                🏪 Marketplace Listings
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Browse and purchase patent NFTs from other users
              </p>
            </div>
            <button
              onClick={async () => {
                setMarketplaceLoading(true);
                try {
                  console.log('Manual refresh of marketplace listings...');
                  const result = await marketplaceService.getMarketplaceListings(1, 20);
                  setMarketplaceListings(result.listings);
                  setTotalPages(result.totalPages);
                  setTotalListings(result.totalListings);
                  setCurrentPage(1);
                  console.log(`Manual refresh found ${result.totalListings} total listings`);
                } catch (error) {
                  console.error('Manual refresh error:', error);
                } finally {
                  setMarketplaceLoading(false);
                }
              }}
              disabled={marketplaceLoading}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${marketplaceLoading ? 'animate-spin' : ''}`} />
              {marketplaceLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </motion.div>

        {/* Results Count and Debug Info */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-gray-600 dark:text-gray-400">
              {filteredNFTs.length} patent{filteredNFTs.length !== 1 ? 's' : ''} found • Page {currentPage} of {totalPages} • Total: {totalListings}
              {realNFTs.length > 0 && (
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs">
                  {realNFTs.length} yours
                </span>
              )}
            </p>
          </div>
          
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
          {marketplaceLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading marketplace listings...</p>
            </div>
          ) : filteredNFTs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredNFTs.map((listing, index) => (
                <motion.div
                  key={listing.listingId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <NFTCard
                    nft={convertListingToNFT(listing)}
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-12">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing page {currentPage} of {totalPages} ({totalListings} total patents)
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </button>
              
              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const pageNum = i + 1;
                  const shouldShow = pageNum === 1 || pageNum === totalPages || 
                    (pageNum >= currentPage - 2 && pageNum <= currentPage + 2);
                  
                  if (!shouldShow && pageNum !== 2 && pageNum !== totalPages - 1) {
                    return pageNum === 3 || pageNum === totalPages - 2 ? (
                      <span key={pageNum} className="px-2 text-gray-400">...</span>
                    ) : null;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg ${
                        currentPage === pageNum
                          ? 'text-blue-600 bg-blue-50 border border-blue-300 dark:bg-blue-900 dark:text-blue-300'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* Listing Modal */}
        {selectedNFT && (
          <ListNFTModal
            isOpen={showListingModal}
            onClose={() => {
              setShowListingModal(false);
              setSelectedNFT(null);
              setListingPrice('');
            }}
            nft={{
              id: selectedNFT.id,
              tokenId: selectedNFT.tokenId || selectedNFT.id,
              title: selectedNFT.title,
              patentNumber: selectedNFT.patentNumber,
              category: selectedNFT.category,
              inventor: selectedNFT.inventor,
              imageUrl: selectedNFT.imageUrl
            }}
            onSuccess={() => {
              setShowListingModal(false);
              setSelectedNFT(null);
              setListingPrice('');
              // The modal handles success notifications
            }}
          />
        )}


        {/* My NFTs Modal */}
        <MyNFTsModal
          isOpen={showMyNFTsModal}
          onClose={() => setShowMyNFTsModal(false)}
          onSellNFT={handleSellNFTFromModal}
          refreshTrigger={nftRefreshTrigger}
        />
      </div>
    </div>
  );
};

export default MarketplacePage;