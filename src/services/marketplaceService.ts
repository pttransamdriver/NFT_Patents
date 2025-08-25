import { ethers, BrowserProvider } from 'ethers';
import { getPatentNFTContract } from '../utils/contracts';

// NFTMarketplace ABI (key functions)
const MARKETPLACE_ABI = [
  "function listings(uint256 listingId) view returns (uint256 listingId, address nftContract, uint256 tokenId, address seller, uint256 price, bool active)",
  "function getAllActiveListings() view returns (tuple(uint256 listingId, address nftContract, uint256 tokenId, address seller, uint256 price, bool active)[])",
  "function tokenToListing(address nftContract, uint256 tokenId) view returns (uint256)",
  "function listNFT(address nftContract, uint256 tokenId, uint256 price) external",
  "function buyNFT(uint256 listingId) payable external",
  "function cancelListing(uint256 listingId) external",
  "event NFTListed(uint256 indexed listingId, address indexed nftContract, uint256 indexed tokenId, address seller, uint256 price)",
  "event NFTSold(uint256 indexed listingId, address indexed nftContract, uint256 indexed tokenId, address seller, address buyer, uint256 price)"
];

export interface MarketplaceListing {
  listingId: string;
  nftContract: string;
  tokenId: string;
  seller: string;
  price: string;
  priceInEth: string;
  active: boolean;
  // Patent-specific data
  patentNumber?: string;
  title?: string;
  inventor?: string;
  imageUrl?: string;
  metadataUri?: string;
}

export interface PaginatedListings {
  listings: MarketplaceListing[];
  totalListings: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export class MarketplaceService {
  private static instance: MarketplaceService;

  private constructor() {}

  public static getInstance(): MarketplaceService {
    if (!MarketplaceService.instance) {
      MarketplaceService.instance = new MarketplaceService();
    }
    return MarketplaceService.instance;
  }

  /**
   * Get marketplace contract instance
   */
  private getMarketplaceContract(signerOrProvider: any) {
    const marketplaceAddress = import.meta.env.VITE_MARKETPLACE_ADDRESS;
    if (!marketplaceAddress) {
      throw new Error('Marketplace contract address not found');
    }
    return new ethers.Contract(marketplaceAddress, MARKETPLACE_ABI, signerOrProvider);
  }

  /**
   * Fetch all active marketplace listings with pagination
   */
  async getMarketplaceListings(page: number = 1, limit: number = 20): Promise<PaginatedListings> {
    try {
      console.log('MarketplaceService: Getting listings for page', page, 'limit', limit);
      
      // Get provider
      const provider = new BrowserProvider(window.ethereum);
      const marketplaceContract = this.getMarketplaceContract(provider);
      const patentNFTContract = getPatentNFTContract(provider);

      console.log('MarketplaceService: Contracts initialized');
      console.log('Marketplace address:', await marketplaceContract.getAddress());
      console.log('PatentNFT address:', await patentNFTContract.getAddress());

      // Get all active listings using the contract's built-in function
      console.log('MarketplaceService: Calling getAllActiveListings()...');
      const allActiveListings = await marketplaceContract.getAllActiveListings();
      console.log('MarketplaceService: Found', allActiveListings.length, 'active listings');

      if (allActiveListings.length === 0) {
        console.log('MarketplaceService: No active listings found, returning empty result');
        return {
          listings: [],
          totalListings: 0,
          currentPage: page,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false
        };
      }

      // Calculate pagination
      const totalCount = allActiveListings.length;
      const totalPages = Math.ceil(totalCount / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = Math.min(startIndex + limit, totalCount);

      const listings: MarketplaceListing[] = [];

      // Process the paginated listings
      for (let i = startIndex; i < endIndex; i++) {
        try {
          const listing = allActiveListings[i];
          console.log(`Processing active listing ${i}:`, {
            listingId: listing.listingId?.toString(),
            nftContract: listing.nftContract,
            tokenId: listing.tokenId?.toString(),
            seller: listing.seller,
            price: listing.price?.toString(),
            active: listing.active
          });

          // Get patent-specific data
          let patentData = null;
          try {
            patentData = await patentNFTContract.getPatent(listing.tokenId);
          } catch (error) {
            console.warn(`Could not fetch patent data for token ${listing.tokenId}`);
          }

          // Get metadata URI and extract patent number
          let metadataUri = '';
          let imageUrl = '';
          try {
            metadataUri = await patentNFTContract.tokenURI(listing.tokenId);
            // Fetch metadata to get image
            const metadataResponse = await fetch(metadataUri);
            if (metadataResponse.ok) {
              const metadata = await metadataResponse.json();
              imageUrl = metadata.image || '';
            }
          } catch (error) {
            console.warn(`Could not fetch metadata for token ${listing.tokenId}`);
          }

          const marketplaceListing: MarketplaceListing = {
            listingId: listing.listingId.toString(),
            nftContract: listing.nftContract,
            tokenId: listing.tokenId.toString(),
            seller: listing.seller,
            price: listing.price.toString(),
            priceInEth: ethers.formatEther(listing.price),
            active: listing.active,
            patentNumber: patentData?.patentNumber || `Unknown-${listing.tokenId}`,
            title: patentData?.title || `Patent NFT #${listing.tokenId}`,
            inventor: patentData?.inventor || 'Unknown',
            imageUrl: imageUrl || `https://via.placeholder.com/300x400.png?text=Patent+${listing.tokenId}`,
            metadataUri: metadataUri
          };

          listings.push(marketplaceListing);
        } catch (error) {
          console.error(`Error processing listing ${i}:`, error);
        }
      }

      console.log(`MarketplaceService: Successfully processed ${listings.length} listings for page ${page}`);

      return {
        listings,
        totalListings: totalCount,
        currentPage: page,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1
      };

    } catch (error) {
      console.error('Error fetching marketplace listings:', error);
      return {
        listings: [],
        totalListings: 0,
        currentPage: page,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false
      };
    }
  }

  /**
   * List an NFT on the marketplace
   */
  async listNFT(tokenId: string, priceInEth: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      if (!window.ethereum) {
        return { success: false, error: 'MetaMask not found' };
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const marketplaceContract = this.getMarketplaceContract(signer);
      const patentNFTContract = getPatentNFTContract(signer);

      const patentNFTAddress = import.meta.env.VITE_PATENT_NFT_ADDRESS;
      const priceInWei = ethers.parseEther(priceInEth);

      // First approve the marketplace to transfer the NFT
      const approveTx = await patentNFTContract.approve(
        await marketplaceContract.getAddress(),
        tokenId
      );
      await approveTx.wait();

      // List the NFT
      const listTx = await marketplaceContract.listNFT(
        patentNFTAddress,
        tokenId,
        priceInWei
      );
      const receipt = await listTx.wait();

      return {
        success: true,
        txHash: receipt.hash
      };

    } catch (error: any) {
      console.error('Error listing NFT:', error);
      return {
        success: false,
        error: error.message || 'Failed to list NFT'
      };
    }
  }

  /**
   * Buy an NFT from the marketplace
   */
  async buyNFT(listingId: string, priceInEth: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      if (!window.ethereum) {
        return { success: false, error: 'MetaMask not found' };
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const marketplaceContract = this.getMarketplaceContract(signer);

      const priceInWei = ethers.parseEther(priceInEth);

      const buyTx = await marketplaceContract.buyNFT(listingId, {
        value: priceInWei
      });
      const receipt = await buyTx.wait();

      return {
        success: true,
        txHash: receipt.hash
      };

    } catch (error: any) {
      console.error('Error buying NFT:', error);
      return {
        success: false,
        error: error.message || 'Failed to buy NFT'
      };
    }
  }

  /**
   * Cancel an NFT listing
   */
  async cancelListing(listingId: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      if (!window.ethereum) {
        return { success: false, error: 'MetaMask not found' };
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const marketplaceContract = this.getMarketplaceContract(signer);

      const cancelTx = await marketplaceContract.cancelListing(listingId);
      const receipt = await cancelTx.wait();

      return {
        success: true,
        txHash: receipt.hash
      };

    } catch (error: any) {
      console.error('Error canceling listing:', error);
      return {
        success: false,
        error: error.message || 'Failed to cancel listing'
      };
    }
  }

  /**
   * Cancel all duplicate listings for a specific patent, keeping only the most recent one
   */
  async cancelDuplicateListings(patentNumber: string): Promise<{ success: boolean; canceledCount: number; error?: string }> {
    try {
      console.log(`Looking for duplicate listings of patent: ${patentNumber}`);
      const allListings = await this.getMarketplaceListings(1, 1000); // Get all listings
      
      // Find all active listings for this specific patent number
      const duplicateListings = allListings.listings.filter(listing => 
        listing.patentNumber && listing.patentNumber === patentNumber
      );
      
      console.log(`Found ${duplicateListings.length} listings for patent ${patentNumber}`);
      
      if (duplicateListings.length <= 1) {
        return { success: true, canceledCount: 0 };
      }
      
      // Sort by listing ID (newer listings have higher IDs) and keep the most recent
      duplicateListings.sort((a, b) => parseInt(b.listingId) - parseInt(a.listingId));
      const listingsToCancel = duplicateListings.slice(1); // Remove the first (most recent) one
      
      console.log(`Canceling ${listingsToCancel.length} duplicate listings for patent ${patentNumber}:`);
      listingsToCancel.forEach(listing => {
        console.log(`  - Listing ID ${listing.listingId} at ${listing.priceInEth} ETH`);
      });
      
      let canceledCount = 0;
      for (const listing of listingsToCancel) {
        try {
          console.log(`Canceling listing ${listing.listingId}...`);
          const result = await this.cancelListing(listing.listingId);
          if (result.success) {
            canceledCount++;
            console.log(`✅ Canceled listing ${listing.listingId}`);
          } else {
            console.log(`❌ Failed to cancel listing ${listing.listingId}: ${result.error}`);
          }
        } catch (error) {
          console.error(`Error canceling listing ${listing.listingId}:`, error);
        }
      }
      
      console.log(`Successfully canceled ${canceledCount}/${listingsToCancel.length} duplicate listings`);
      return { success: true, canceledCount };
      
    } catch (error: any) {
      console.error('Error canceling duplicate listings:', error);
      return {
        success: false,
        canceledCount: 0,
        error: error.message || 'Failed to cancel duplicates'
      };
    }
  }

  /**
   * Get all duplicate patent numbers in the marketplace
   */
  async getDuplicatePatents(): Promise<string[]> {
    try {
      const allListings = await this.getMarketplaceListings(1, 1000);
      const patentCounts = new Map<string, number>();
      
      // Count occurrences of each patent number
      allListings.listings.forEach(listing => {
        if (listing.patentNumber) {
          const count = patentCounts.get(listing.patentNumber) || 0;
          patentCounts.set(listing.patentNumber, count + 1);
        }
      });
      
      // Return patents that appear more than once
      return Array.from(patentCounts.entries())
        .filter(([, count]) => count > 1)
        .map(([patent]) => patent);
        
    } catch (error) {
      console.error('Error getting duplicate patents:', error);
      return [];
    }
  }
}

// Export singleton instance
export const marketplaceService = MarketplaceService.getInstance();