import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, Download, DollarSign, Eye, Calendar, FileText, Sparkles, ExternalLink, HelpCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWeb3 } from '../../contexts/Web3Context';
import { getPatentNFTContract } from '../../utils/contracts';
import { mintingService } from '../../services/mintingService';
import { marketplaceService } from '../../services/marketplaceService';
import MetaMaskNFTGuide from './MetaMaskNFTGuide';
import ListNFTModal from './ListNFTModal';

interface UserNFT {
  tokenId: string;
  tokenURI: string;
  patentNumber: string;
  title: string;
  inventor: string;
  filingDate: string;
  isVerified: boolean;
  isListed?: boolean;
}

interface MyNFTsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSellNFT?: (nft: UserNFT, price: string) => void;
  refreshTrigger?: number; // Add refresh trigger prop
}

const MyNFTsModal: React.FC<MyNFTsModalProps> = ({ isOpen, onClose, onSellNFT, refreshTrigger }) => {
  const [nfts, setNfts] = useState<UserNFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingToMetaMask, setIsAddingToMetaMask] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<UserNFT | null>(null);
  const [sellPrice, setSellPrice] = useState('');
  const [showSellForm, setShowSellForm] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [showMetaMaskGuide, setShowMetaMaskGuide] = useState(false);
  const [selectedNFTForGuide, setSelectedNFTForGuide] = useState<UserNFT | null>(null);
  const { isConnected, account, provider } = useWeb3();

  const loadUserNFTs = async () => {
    if (!isConnected || !account || !provider) return;

    setIsLoading(true);
    try {
      const contract = getPatentNFTContract(provider);
      const balance = await contract.balanceOf(account);
      console.log(`User has ${balance} NFTs`);

      const userNFTs: UserNFT[] = [];

      for (let i = 0; i < Number(balance); i++) {
        try {
          const tokenId = await contract.tokenOfOwnerByIndex(account, BigInt(i));
          
          // Get token URI first
          let tokenURI = '';
          try {
            tokenURI = await contract.tokenURI(tokenId);
          } catch (error) {
            console.log(`Could not get tokenURI for token ${tokenId}`);
          }

          // Get patent details from metadata
          let patentData;
          try {
            if (tokenURI) {
              const response = await fetch(tokenURI);
              const metadata = await response.json();

              // Extract patent data from metadata attributes
              const getAttribute = (traitType: string) =>
                metadata.attributes?.find((attr: any) => attr.trait_type === traitType)?.value;

              patentData = {
                title: metadata.name || `Patent NFT #${tokenId}`,
                inventor: getAttribute('Inventor') || 'Unknown',
                filingDate: BigInt(Math.floor(Date.now() / 1000)),
                patentNumber: getAttribute('Patent Number') || `PATENT-${tokenId}`,
                isVerified: true
              };
            } else {
              throw new Error('No tokenURI available');
            }
          } catch (error) {
            console.log(`Could not get metadata for token ${tokenId}, using defaults`);
            patentData = {
              title: `Patent NFT #${tokenId}`,
              inventor: 'Unknown',
              filingDate: BigInt(Date.now() / 1000),
              patentNumber: `PATENT-${tokenId}`,
              isVerified: false
            };
          }

          // Check if this NFT is listed on the marketplace
          const isListed = await marketplaceService.isNFTListed(tokenId.toString());

          userNFTs.push({
            tokenId: tokenId.toString(),
            tokenURI,
            patentNumber: patentData.patentNumber || `PATENT-${tokenId}`,
            title: patentData.title || `Patent NFT #${tokenId}`,
            inventor: patentData.inventor || 'Unknown',
            filingDate: new Date(Number(patentData.filingDate) * 1000).toLocaleDateString(),
            isVerified: patentData.isVerified || false,
            isListed: isListed
          });
        } catch (error) {
          console.error(`Error loading NFT at index ${i}:`, error);
        }
      }

      setNfts(userNFTs);
    } catch (error) {
      console.error('Error loading NFTs:', error);
      toast.error('Failed to load NFTs');
    } finally {
      setIsLoading(false);
    }
  };

  const addNFTToMetaMask = async (nft: UserNFT) => {
    setSelectedNFTForGuide(nft);
    setShowMetaMaskGuide(true);
  };

  const cancelAllListings = async () => {
    if (!account) return;

    // Get only the listed NFTs
    const listedNFTs = nfts.filter(nft => nft.isListed);

    if (listedNFTs.length === 0) {
      toast.error('No active listings to cancel');
      return;
    }

    setIsAddingToMetaMask(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const nft of listedNFTs) {
        try {
          // Get the listing ID for this NFT
          const result = await marketplaceService.getMarketplaceListings(1, 1000);
          const listing = result.listings.find(
            l => l.tokenId === nft.tokenId && l.active
          );

          if (listing) {
            const cancelResult = await marketplaceService.cancelListing(listing.listingId);
            if (cancelResult.success) {
              successCount++;
            } else {
              failCount++;
            }
          }
        } catch (error) {
          console.error(`Failed to cancel listing for NFT ${nft.tokenId}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully cancelled ${successCount} listing${successCount > 1 ? 's' : ''}!`);
        // Refresh NFT list
        await loadUserNFTs();
      }

      if (failCount > 0) {
        toast.error(`Failed to cancel ${failCount} listing${failCount > 1 ? 's' : ''}`);
      }
    } catch (error) {
      console.error('Error cancelling listings:', error);
      toast.error('Failed to cancel listings');
    } finally {
      setIsAddingToMetaMask(false);
    }
  };

  const handleSellNFT = (nft: UserNFT) => {
    setSelectedNFT(nft);
    setShowListModal(true);
  };

  const confirmSell = async () => {
    if (selectedNFT && sellPrice && onSellNFT) {
      await onSellNFT(selectedNFT, sellPrice);
      setShowSellForm(false);
      setSelectedNFT(null);
      setSellPrice('');
      toast.success('NFT listed for sale!');
      // Refresh NFT list to update listing status
      loadUserNFTs();
    }
  };

  const copyContractInfo = (tokenId: string) => {
    const contractAddress = import.meta.env.VITE_PATENT_NFT_ADDRESS;
    const info = `Contract: ${contractAddress}\nToken ID: ${tokenId}`;
    navigator.clipboard.writeText(info);
    toast.success('Contract info copied to clipboard!');
  };

  useEffect(() => {
    if (isOpen && isConnected && account) {
      loadUserNFTs();
    }
  }, [isOpen, isConnected, account, refreshTrigger]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  My Patent NFTs
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Manage your tokenized patents
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Actions Bar */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {nfts.length} NFT{nfts.length !== 1 ? 's' : ''} found
                  </div>
                  <button
                    onClick={loadUserNFTs}
                    disabled={isLoading}
                    className="flex items-center space-x-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>
                {nfts.filter(nft => nft.isListed).length > 0 && (
                  <button
                    onClick={cancelAllListings}
                    disabled={isAddingToMetaMask}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-sm rounded-lg font-medium transition-colors flex items-center space-x-2"
                  >
                    {isAddingToMetaMask ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Cancelling Listings...</span>
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4" />
                        <span>Cancel All Listings ({nfts.filter(nft => nft.isListed).length})</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your NFTs...</p>
                </div>
              )}

              {/* NFTs Grid */}
              {!isLoading && nfts.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {nfts.map((nft, index) => (
                    <motion.div
                      key={nft.tokenId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300"
                    >
                      {/* NFT Preview */}
                      <div className="h-32 bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                        <div className="text-center text-white">
                          <Award className="w-10 h-10 mx-auto mb-1 opacity-80" />
                          <p className="text-xs font-medium">Patent NFT #{nft.tokenId}</p>
                        </div>
                      </div>

                      <div className="p-4">
                        {/* Header */}
                        <div className="mb-3">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 truncate">
                            {nft.title}
                          </h3>
                          <div className="flex items-center space-x-1 mb-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              #{nft.tokenId}
                            </span>
                            {nft.isVerified && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                <Sparkles className="w-3 h-3 mr-1" />
                                Verified
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-1 mb-4">
                          <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                            <FileText className="w-3 h-3 mr-1" />
                            <span className="truncate">{nft.patentNumber}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                            <Eye className="w-3 h-3 mr-1" />
                            <span className="truncate">{nft.inventor}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                            <Calendar className="w-3 h-3 mr-1" />
                            <span>{nft.filingDate}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={nft.isListed ? undefined : () => handleSellNFT(nft)}
                            disabled={nft.isListed}
                            className={`px-3 py-1.5 text-xs rounded font-medium transition-colors flex items-center justify-center space-x-1 ${
                              nft.isListed 
                                ? 'bg-gray-400 dark:bg-gray-600 text-gray-200 cursor-not-allowed' 
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                          >
                            <DollarSign className="w-3 h-3" />
                            <span>{nft.isListed ? 'Already Listed' : 'List for Sale'}</span>
                          </button>
                          <div className="grid grid-cols-2 gap-1">
                            <button
                              onClick={() => addNFTToMetaMask(nft)}
                              className="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded font-medium transition-colors"
                              title="Show MetaMask import guide"
                            >
                              <HelpCircle className="w-3 h-3 mx-auto" />
                            </button>
                            <button
                              onClick={() => copyContractInfo(nft.tokenId)}
                              className="px-2 py-1.5 bg-gray-500 hover:bg-gray-600 text-white text-xs rounded font-medium transition-colors"
                              title="Copy contract info"
                            >
                              <ExternalLink className="w-3 h-3 mx-auto" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!isLoading && nfts.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Patent NFTs Found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    You haven't minted any Patent NFTs yet
                  </p>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Go Search & Mint Patents
                  </button>
                </div>
              )}
            </div>

            {/* Sell Form Modal */}
            <AnimatePresence>
              {showSellForm && selectedNFT && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6"
                  >
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                      List NFT for Sale
                    </h3>
                    
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        NFT: {selectedNFT.title} (#{selectedNFT.tokenId})
                      </p>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Price (ETH)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={sellPrice}
                        onChange={(e) => setSellPrice(e.target.value)}
                        placeholder="0.1"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          setShowSellForm(false);
                          setSelectedNFT(null);
                          setSellPrice('');
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmSell}
                        disabled={!sellPrice || parseFloat(sellPrice) <= 0}
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                      >
                        List for Sale
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
      
      {/* MetaMask NFT Guide */}
      {selectedNFTForGuide && (
        <MetaMaskNFTGuide
          isOpen={showMetaMaskGuide}
          onClose={() => {
            setShowMetaMaskGuide(false);
            setSelectedNFTForGuide(null);
          }}
          contractAddress={import.meta.env.VITE_PATENT_NFT_ADDRESS || ''}
          tokenId={selectedNFTForGuide.tokenId}
          patentNumber={selectedNFTForGuide.patentNumber}
        />
      )}

      {/* List NFT Modal */}
      {selectedNFT && (
        <ListNFTModal
          isOpen={showListModal}
          onClose={() => {
            setShowListModal(false);
            setSelectedNFT(null);
          }}
          nft={{
            id: selectedNFT.tokenId,
            tokenId: selectedNFT.tokenId,
            title: selectedNFT.title,
            patentNumber: selectedNFT.patentNumber,
            category: 'Technology',
            inventor: selectedNFT.inventor,
            imageUrl: undefined
          }}
          onSuccess={() => {
            setShowListModal(false);
            setSelectedNFT(null);
            loadUserNFTs(); // Refresh the NFTs list
          }}
        />
      )}
    </AnimatePresence>
  );
};

export default MyNFTsModal;