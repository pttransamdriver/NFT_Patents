// Centralized Contract ABIs
// This file contains all smart contract ABIs used throughout the application

// PatentNFT Contract ABI (minimal interface for core functionality)
export const PATENT_NFT_ABI = [
  "function mintPatentNFT(address to, string memory patentNumber) external payable returns (uint256)",
  "function getMintingPrice() external view returns (uint256)",
  "function setMintingPrice(uint256 newPrice) external",
  "function patentExists(string memory patentNumber) external view returns (bool)",
  "function withdraw() external",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
  "function tokenURI(uint256 tokenId) external view returns (string memory)",
  "function approve(address to, uint256 tokenId) external",
  "function getApproved(uint256 tokenId) external view returns (address)",
  "function setApprovalForAll(address operator, bool approved) external",
  "function isApprovedForAll(address owner, address operator) external view returns (bool)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "event PatentMinted(uint256 tokenId, address owner, string patentNumber)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)"
];

// NFT Marketplace Contract ABI
export const MARKETPLACE_ABI = [
  "function listings(uint256 listingId) view returns (uint256 listingId, address nftContract, uint256 tokenId, address seller, uint256 price, bool active)",
  "function getAllActiveListings() view returns (tuple(uint256 listingId, address nftContract, uint256 tokenId, address seller, uint256 price, bool active)[])",
  "function tokenToListing(address nftContract, uint256 tokenId) view returns (uint256)",
  "function listNFT(address nftContract, uint256 tokenId, uint256 price) external",
  "function buyNFT(uint256 listingId) payable external",
  "function cancelListing(uint256 listingId) external",
  "event NFTListed(uint256 indexed listingId, address indexed nftContract, uint256 indexed tokenId, address seller, uint256 price)",
  "event NFTSold(uint256 indexed listingId, address indexed nftContract, uint256 indexed tokenId, address seller, address buyer, uint256 price)"
];

// PSP Token Contract ABI (minimal interface)
export const PSP_TOKEN_ABI = [
  // Read functions
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function getTokenPrice() view returns (uint256)',
  'function calculateTokensForETH(uint256 ethAmount) view returns (uint256)',
  'function calculateETHForTokens(uint256 tokenAmount) view returns (uint256)',
  
  // Write functions
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function purchaseTokens() payable returns (bool)',
  'function redeemTokens(uint256 tokenAmount) returns (bool)',
  
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
  'event TokensPurchased(address indexed buyer, uint256 amount, uint256 ethPaid)'
];

// SearchPayment Contract ABI (unified and comprehensive)
export const SEARCH_PAYMENT_ABI = [
  // Credit management
  'function getUserCredits(address user) view returns (uint256)',
  'function useCredit(address user) returns (bool)',
  
  // Legacy functions
  'function payForSearch() returns (bool)',
  'function getSearchPrice() view returns (uint256)',
  'function getPSPTokenAddress() view returns (address)',

  // Multi-token payment functions
  'function payWithETH() payable returns (bool)',
  'function payWithUSDC() returns (bool)',
  'function payWithPSP() returns (bool)',
  
  // Pricing functions
  'function getSearchPrice(uint8 token) view returns (uint256)',
  'function getAllSearchPrices() view returns (uint256 ethPrice, uint256 usdcPrice, uint256 pspPrice)',
  
  // Utility functions
  'function getTokenAddresses() view returns (address pspAddress, address usdcAddress)',
  'function getUserStats(address user) view returns (uint256 ethPaid, uint256 usdcPaid, uint256 pspPaid, uint256 searchesPurchased)',
  'function getUserTokenStats(address user, uint8 token) view returns (uint256 totalPaid)',
  
  // Events
  'event PaymentReceived(address indexed user, uint8 indexed token, uint256 amount, uint256 creditsAdded)',
  'event CreditUsed(address indexed user, uint256 creditsRemaining)'
];

// USDC Contract ABI (minimal ERC20 interface)
export const USDC_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)'
];