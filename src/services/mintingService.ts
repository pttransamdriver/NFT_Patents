import { ethers, ContractTransactionResponse, JsonRpcProvider } from 'ethers';
import { getPatentNFTContract } from '../utils/contracts';
import { patentPdfService } from './patentPdfService';
import { web3Utils } from '../utils/web3Utils';
import { BaseSingleton } from '../utils/baseSingleton';
import type { Patent } from '../types';

export interface MintingParams {
  patentNumber: string;
  price: number;
  userAddress: string;
  patentData?: Patent;
}

export interface MintingResult {
  success: boolean;
  tokenId?: string;
  txHash?: string;
  error?: string;
}

export class MintingService extends BaseSingleton {

  async mintPatentNFT(params: MintingParams): Promise<MintingResult> {
    try {
      // Check if MetaMask is connected
      const { connected, error: connectionError } = await web3Utils.isConnected();
      if (!connected) {
        return {
          success: false,
          error: connectionError || 'Please connect MetaMask to mint NFTs.'
        };
      }

      // Ensure we're on the correct network
      const networkResult = await web3Utils.switchToCorrectNetwork();
      if (!networkResult.success) {
        return {
          success: false,
          error: `Please switch to the correct network: ${networkResult.error || 'Network switch required'}`
        };
      }

      // Process patent PDF and upload metadata to IPFS
      let metadataIpfsHash = '';
      let imageUrl = '';

      try {
        const pdfData = await patentPdfService.processPatentForNFT(params.patentNumber);
        imageUrl = pdfData.imageUrl;

        // Create proper NFT metadata format
        const nftMetadata = {
          name: params.patentData?.title || `Patent NFT - ${params.patentNumber}`,
          description: params.patentData?.abstract || `NFT representing patent ${params.patentNumber}`,
          image: imageUrl,
          external_url: `https://patents.google.com/patent/${params.patentNumber}`,
          attributes: [
            {
              trait_type: "Patent Number",
              value: params.patentNumber
            },
            {
              trait_type: "Title",
              value: params.patentData?.title || "Unknown"
            },
            {
              trait_type: "Inventor",
              value: params.patentData?.inventor || "Unknown"
            },
            {
              trait_type: "Assignee",
              value: params.patentData?.assignee || "Unknown"
            },
            {
              trait_type: "Filing Date",
              value: params.patentData?.filingDate || new Date().toISOString()
            },
            {
              trait_type: "Country",
              value: params.patentData?.country || "Unknown"
            },
            {
              trait_type: "Status",
              value: params.patentData?.status || "Active"
            },
            {
              trait_type: "Storage",
              value: "IPFS"
            },
            {
              trait_type: "Minted",
              value: new Date().toISOString()
            }
          ]
        };

        // Upload metadata JSON to IPFS
        console.log('📤 Uploading metadata to IPFS...');
        metadataIpfsHash = await patentPdfService.storeMetadataOnIPFS(nftMetadata, `${params.patentNumber}-metadata.json`);
        console.log('✅ Metadata uploaded to IPFS:', metadataIpfsHash);

        // Store IPFS hash in backend for redirection
        try {
          await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/metadata/${params.patentNumber}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...nftMetadata,
              ipfsHash: metadataIpfsHash  // Store IPFS hash for backend to redirect
            })
          });
        } catch (backendError) {
          console.warn('Failed to store metadata in backend (non-critical):', backendError);
        }

      } catch (pdfError) {
        console.error('PDF processing failed, using fallback:', pdfError);

        // Continue with minting even if PDF processing fails
        imageUrl = `https://via.placeholder.com/400x600.png?text=Patent+${params.patentNumber}`;

        // Still create metadata even if PDF processing failed
        const fallbackMetadata = {
          name: params.patentData?.title || `Patent NFT - ${params.patentNumber}`,
          description: params.patentData?.abstract || `NFT representing patent ${params.patentNumber}`,
          image: imageUrl,
          external_url: `https://patents.google.com/patent/${params.patentNumber}`,
          attributes: [
            {
              trait_type: "Patent Number",
              value: params.patentNumber
            },
            {
              trait_type: "Title",
              value: params.patentData?.title || "Unknown"
            },
            {
              trait_type: "Inventor",
              value: params.patentData?.inventor || "Unknown"
            },
            {
              trait_type: "Assignee",
              value: params.patentData?.assignee || "Unknown"
            },
            {
              trait_type: "Filing Date",
              value: params.patentData?.filingDate || new Date().toISOString()
            },
            {
              trait_type: "Country",
              value: params.patentData?.country || "Unknown"
            },
            {
              trait_type: "Status",
              value: params.patentData?.status || "Active"
            },
            {
              trait_type: "Storage",
              value: "Placeholder"
            },
            {
              trait_type: "Minted",
              value: new Date().toISOString()
            }
          ]
        };

        try {
          console.log('📤 Uploading fallback metadata to IPFS...');
          metadataIpfsHash = await patentPdfService.storeMetadataOnIPFS(fallbackMetadata, `${params.patentNumber}-metadata.json`);
          console.log('✅ Fallback metadata uploaded to IPFS:', metadataIpfsHash);

          // Store IPFS hash in backend for redirection
          try {
            await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/metadata/${params.patentNumber}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...fallbackMetadata,
                ipfsHash: metadataIpfsHash
              })
            });
          } catch (backendError) {
            console.warn('Failed to store fallback metadata in backend (non-critical):', backendError);
          }
        } catch (metadataError) {
          console.error('Failed to upload metadata to IPFS:', metadataError);
          throw new Error('Failed to create NFT metadata. Please try again.');
        }
      }

      // Get signer using web3Utils
      const signer = await web3Utils.createSigner();
      if (!signer) {
        return {
          success: false,
          error: 'Unable to get signer from MetaMask'
        };
      }
      
      // Get contract instance
      const contract = getPatentNFTContract(signer);
      
      // Debug: Log signer network
      const signerNetwork = await signer.provider.getNetwork();
      console.log('Signer network:', signerNetwork);
      
      // Get current minting price from contract
      console.log('About to call getMintingPrice...');
      const mintingPrice = await contract.getMintingPrice();
      console.log('Got minting price from contract:', mintingPrice.toString());
      
      // Call mint function on contract (payable)
      const tx = await contract.mintPatentNFT(
        params.userAddress,
        params.patentNumber,
        { value: mintingPrice }
      );
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      // Extract token ID from events
      const tokenId = this.extractTokenIdFromReceipt(receipt);
      
      // Automatically add NFT to MetaMask
      if (tokenId) {
        await this.addNFTToMetaMask(tokenId.toString(), params.patentNumber);
      }
      
      return {
        success: true,
        tokenId: tokenId?.toString(),
        txHash: receipt.hash
      };
      
    } catch (error: any) {
      const errorMessage = web3Utils.handleTransactionError(error);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async checkMintingEligibility(patentNumber: string): Promise<boolean> {
    try {
      const provider = await web3Utils.createProvider();
      if (!provider) return false;
      const contract = getPatentNFTContract(provider);
      
      // Check if patent is already minted
      const exists = await contract.patentExists(patentNumber);
      return !exists;
      
    } catch (error) {
      return false;
    }
  }

  async getMintingPrice(): Promise<number> {
    try {
      // Try MetaMask provider first
      let provider = await web3Utils.createProvider();
      
      // If MetaMask provider fails, try direct JSON-RPC provider
      if (!provider) {
        console.log('MetaMask provider not available, using direct RPC...');
        provider = new JsonRpcProvider(import.meta.env.VITE_RPC_URL);
      }
      
      if (!provider) {
        console.error('No provider available');
        return 0.05; // Default price from contract
      }
      
      // Debug: Check network
      const network = await provider.getNetwork();
      console.log('Provider network:', network);
      
      const contract = getPatentNFTContract(provider);
      
      // Debug: Check contract address
      const contractAddress = import.meta.env.VITE_PATENT_NFT_ADDRESS;
      console.log('Contract address:', contractAddress);
      
      // Debug: Check if contract exists
      const code = await provider.getCode(contractAddress);
      console.log('Contract code exists:', code !== '0x');
      
      const priceInWei = await contract.getMintingPrice();
      console.log('Got minting price:', priceInWei.toString());
      return parseFloat(ethers.formatEther(priceInWei));
      
    } catch (error: any) {
      console.error('getMintingPrice error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        data: error.data
      });
      return 0.05; // Default fallback price matching contract
    }
  }

  async addNFTToMetaMask(tokenId: string, patentNumber: string): Promise<void> {
    try {
      if (!window.ethereum) {
        return;
      }

      // Get contract address from environment
      const contractAddress = import.meta.env.VITE_PATENT_NFT_ADDRESS;
      
      if (!contractAddress) {
        return;
      }

      
      // For local networks, MetaMask's wallet_watchAsset might not work for ERC721
      // Let's try and handle the error gracefully
      try {
        await window.ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC721',
            options: {
              address: contractAddress,
              tokenId: tokenId,
              name: `Patent NFT #${tokenId}`,
              description: `Patent ${patentNumber} - Tokenized Patent NFT`,
              image: `https://via.placeholder.com/300x300.png?text=Patent+${tokenId}`, // Placeholder image URL
            },
          },
        });
      } catch (watchError: any) {
        // MetaMask might not support ERC721 on local networks
        
        // Instead, copy contract info to clipboard as fallback
        const contractInfo = `Contract: ${contractAddress}\nToken ID: ${tokenId}\nType: ERC721`;
        navigator.clipboard.writeText(contractInfo);
        
        throw new Error(`NFT info copied to clipboard. MetaMask may not support NFT import on local networks. Contract: ${contractAddress}, Token ID: ${tokenId}`);
      }
    } catch (error: any) {
      throw error; // Let the UI handle the error message
    }
  }

  async addAllUserNFTsToMetaMask(userAddress: string): Promise<void> {
    try {
      if (!window.ethereum) return;

      const provider = await web3Utils.createProvider();
      if (!provider) return;
      const contract = getPatentNFTContract(provider);

      // Get user's NFT balance
      const balance = await contract.balanceOf(userAddress);

      // Add each NFT to MetaMask
      for (let i = 0; i < Number(balance); i++) {
        try {
          const tokenId = await contract.tokenOfOwnerByIndex(userAddress, BigInt(i));
          
          // Get token URI to extract patent number (if available)
          let patentNumber = 'Unknown';
          try {
            const tokenURI = await contract.tokenURI(tokenId);
            // Extract patent number from URI if possible
            const match = tokenURI.match(/([A-Z]{2}\d+[A-Z]\d*)/);
            if (match) patentNumber = match[1];
          } catch (error) {
          }

          await this.addNFTToMetaMask(tokenId.toString(), patentNumber);
          
          // Add small delay to avoid overwhelming MetaMask
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
        }
      }
    } catch (error) {
    }
  }

  private extractTokenIdFromReceipt(receipt: any): bigint | null {
    try {
      // Look for Transfer event which should contain the token ID
      const transferEvent = receipt.logs.find((log: any) => 
        log.topics[0] === ethers.id('Transfer(address,address,uint256)')
      );
      
      if (transferEvent && transferEvent.topics[3]) {
        return BigInt(transferEvent.topics[3]);
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }
}

export const mintingService = MintingService.getInstance() as MintingService;