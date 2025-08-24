import { ethers, BrowserProvider, JsonRpcSigner, Contract } from 'ethers';
import toast from 'react-hot-toast';

// Import contract ABIs - using dynamic imports to avoid Vite issues
let PatentNFTAbi: any = null;
let contractAddresses: any = null;

// Load contract artifacts dynamically
const loadContractArtifacts = async () => {
  if (!PatentNFTAbi) {
    try {
      PatentNFTAbi = await import('../../artifacts/contracts/PatentNFT.sol/PatentNFT.json');
    } catch (error) {
      console.error('Failed to load PatentNFT ABI:', error);
      // Fallback ABI for basic functionality
      PatentNFTAbi = { abi: [] };
    }
  }

  // Contract addresses now come from environment variables
};

// Contract addresses from environment variables
const getContractAddresses = () => {
  return {
    PatentNFT: import.meta.env.VITE_PATENT_NFT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3'
  };
};

export interface PatentNFTContract extends Contract {
  mintPatentNFT(to: string, patentNumber: string, overrides?: any): Promise<ethers.ContractTransaction>;
  getMintingPrice(): Promise<bigint>;
  patentExists(patentNumber: string): Promise<boolean>;
  totalSupply(): Promise<bigint>;
  balanceOf(owner: string): Promise<bigint>;
  tokenOfOwnerByIndex(owner: string, index: bigint): Promise<bigint>;
  tokenURI(tokenId: bigint): Promise<string>;
  getPatent(tokenId: bigint): Promise<{
    title: string;
    inventor: string;
    filingDate: bigint;
    patentNumber: string;
    isVerified: boolean;
  }>;
}

export const getPatentNFTContract = (
  providerOrSigner: BrowserProvider | JsonRpcSigner
): PatentNFTContract => {
  const addresses = getContractAddresses();

  // Use a minimal ABI for the functions we need
  const minimalAbi = [
    "function mintPatentNFT(address to, string memory patentNumber) external payable returns (uint256)",
    "function getMintingPrice() external view returns (uint256)",
    "function patentExists(string memory patentNumber) external view returns (bool)",
    "function totalSupply() external view returns (uint256)",
    "function balanceOf(address owner) external view returns (uint256)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
    "function tokenURI(uint256 tokenId) external view returns (string memory)",
    "function getPatent(uint256 tokenId) external view returns (string memory title, string memory inventor, uint256 filingDate, string memory patentNumber, bool isVerified)",
    "event PatentMinted(uint256 tokenId, address owner, string patentNumber)",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
  ];

  return new Contract(
    addresses.PatentNFT,
    minimalAbi,
    providerOrSigner
  ) as PatentNFTContract;
};

export const mintPatentNFT = async (
  signer: JsonRpcSigner,
  patentData: {
    patentNumber: string;
    title: string;
    inventor: string;
  }
): Promise<{ success: boolean; tokenId?: string; transactionHash?: string; error?: string }> => {
  try {
    const contract = getPatentNFTContract(signer);
    const userAddress = await signer.getAddress();

    // Check if patent already exists
    const exists = await contract.patentExists(patentData.patentNumber);
    if (exists) {
      return { success: false, error: 'Patent NFT already exists for this patent number' };
    }

    // Get minting price
    const mintingPrice = await contract.getMintingPrice();
    
    // Add some extra gas for safety
    const gasEstimate = await contract.mintPatentNFT.estimateGas(
      userAddress,
      patentData.patentNumber,
      { value: mintingPrice }
    );

    // Call the mint function (contract only takes recipient and patentNumber)
    const tx = await contract.mintPatentNFT(
      userAddress,
      patentData.patentNumber,
      { 
        value: mintingPrice,
        gasLimit: gasEstimate + BigInt(50000) // Add 50k gas buffer
      }
    );

    toast.loading('Transaction submitted! Waiting for confirmation...', { id: 'minting' });

    // Wait for transaction to be mined
    const receipt = await tx.wait();

    if (receipt.status === 1) {
      // Find the PatentMinted event to get the token ID
      const mintEvent = receipt.logs.find(log => {
        try {
          const parsedLog = contract.interface.parseLog(log);
          return parsedLog?.name === 'PatentMinted';
        } catch {
          return false;
        }
      });

      let tokenId = 'Unknown';
      if (mintEvent) {
        const parsedLog = contract.interface.parseLog(mintEvent);
        tokenId = parsedLog?.args[0]?.toString() || 'Unknown';
      }

      toast.success('Patent NFT minted successfully!', { id: 'minting' });
      return { 
        success: true, 
        tokenId,
        transactionHash: receipt.hash 
      };
    } else {
      toast.error('Transaction failed', { id: 'minting' });
      return { success: false, error: 'Transaction failed' };
    }

  } catch (error: any) {
    console.error('Error minting NFT:', error);
    toast.error('Failed to mint NFT', { id: 'minting' });
    
    let errorMessage = 'Unknown error occurred';
    if (error.reason) {
      errorMessage = error.reason;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return { success: false, error: errorMessage };
  }
};

export const getMintingPrice = async (provider: BrowserProvider): Promise<string> => {
  try {
    const contract = getPatentNFTContract(provider);
    const price = await contract.getMintingPrice();
    return ethers.formatEther(price);
  } catch (error) {
    console.error('Error getting minting price:', error);
    return '0.05'; // fallback price
  }
};

export const checkPatentExists = async (provider: BrowserProvider, patentNumber: string): Promise<boolean> => {
  try {
    const contract = getPatentNFTContract(provider);
    return await contract.patentExists(patentNumber);
  } catch (error) {
    console.error('Error checking patent existence:', error);
    return false;
  }
};

export const getUserNFTs = async (signer: JsonRpcSigner, userAddress: string): Promise<any[]> => {
  try {
    const contract = getPatentNFTContract(signer);
    const balance = await contract.balanceOf(userAddress);
    const nfts = [];

    for (let i = 0; i < balance; i++) {
      try {
        const tokenId = await contract.tokenOfOwnerByIndex(userAddress, BigInt(i));
        const tokenURI = await contract.tokenURI(tokenId);
        
        nfts.push({
          tokenId: tokenId.toString(),
          tokenURI,
        });
      } catch (error) {
        console.error(`Error fetching NFT at index ${i}:`, error);
      }
    }

    return nfts;
  } catch (error) {
    console.error('Error getting user NFTs:', error);
    return [];
  }
};

export { getContractAddresses as CONTRACT_ADDRESSES };
