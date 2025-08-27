# 🏛️ Patent NFT Marketplace

A decentralized marketplace for tokenizing and trading patents as NFTs, featuring real-time patent data integration, multi-token payment systems, and smart contract-based ownership verification. Standars and AI assisted searh capabilities replace standard and Patent Lawer searches. How this App is designed to work; there are patents that are searchable globaly on the Google Patents API. This web3 application searches those patents and mints from them. The patents are minted into an NFT by taking the PDF of the patent and putting it on IPFS as the image of the NFT. The Patent ID is used to help make the NFT and the NFT will share the name of the patent title. These are minted here and placed in your wallet. Then users can take those patents they own and sell them on the apps marketplace. 

## 📋 Table of Contents

- [🏗️ Architecture Overview](#️-architecture-overview)
- [🚀 Quick Start](#-quick-start)
- [💾 Smart Contracts](#-smart-contracts)
- [🌐 Backend API](#-backend-api)
- [⚛️ Frontend Application](#️-frontend-application)
- [🔧 Configuration](#-configuration)
- [🧪 Testing](#-testing)
- [📡 API Integration](#-api-integration)
- [🔒 Security Features](#-security-features)
- [📚 Developer Guide](#-developer-guide)

## 🏗️ Architecture Overview

The Patent NFT Marketplace consists of four main components and two external dependencies:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │  Smart Contracts│
│   (React/Vite)  │◄──►│   (Express.js)  │    │   (Solidity)    │
│                 │    │                 │    │                 │
│ - User Interface│    │ - CORS Proxy    │    │ - PatentNFT     │
│ - Web3 Integration│  │ - Patent Search │    │ - PSPToken      │
│ - NFT Interactions│  │ - Data Transform│    │ - SearchPayment │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web3 Wallet   │    │ Google Patents  │    │   Blockchain    │
│   (MetaMask)    │    │     API         │    │  (Local/Sepolia)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Features

- 🌍 **Global Patent Search**: Access to worldwide patents (US, EP, CN, JP, KR)
- 💎 **NFT Minting**: Convert real patents into tradeable NFTs with PDF-to-image conversion
- 📄 **IPFS Storage**: Patent documents and images stored on decentralized IPFS network
- 🏪 **Live Marketplace**: Real-time listing of all users' patent NFTs for sale
- 📄 **Pagination**: Browse thousands of listings with 20 patents per page
- 💰 **Multi-Token Payments**: Support for ETH, USDC, and PSP tokens
- 🔒 **Smart Contract Security**: ReentrancyGuard, Pausable, access controls
- 🔄 **CORS-Free Integration**: Backend proxy eliminates browser limitations
- 📱 **Responsive UI**: Modern React interface with Tailwind CSS
- 🎯 **Modal-Based Listing**: Seamless NFT listing with price validation and fee calculation
- 🛒 **Buy Now Functionality**: Instant NFT purchasing with smart contract integration
- 💰 **Make Offer System**: Price negotiation capabilities (UI ready, smart contract implementation pending)
- 📱 **MetaMask Import Guide**: Step-by-step NFT import for local networks
- 🔧 **Advanced Debugging**: Built-in tools for minting diagnostics
- 🔍 **Patent Uniqueness**: Blockchain-enforced uniqueness prevents duplicate minting
- 🏗️ **Modular Deployment**: Production-ready smart contract deployment with proper naming conventions

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MetaMask browser extension
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd NFT_Patents
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend && npm install && cd ..
   ```

3. **Configure environment variables**
   ```bash
   # Copy and edit environment files
   cp .env.example .env
   cp backend/.env.example backend/.env
   ```

4. **Start the development environment**
   ```bash
   # Terminal 1: Start local blockchain
   npx hardhat node
   
   # Terminal 2: Deploy contracts individually (recommended)
   npm run deploy:psp localhost
   npm run deploy:search localhost  
   npm run deploy:nft localhost
   npm run deploy:marketplace localhost
   
   # Alternative: Deploy all at once (legacy method)
   npm run deploy:legacy
   
   # Terminal 3: Start backend API  
   cd backend && npm start
   
   # Terminal 4: Start frontend
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - Health Check: http://localhost:3001/api/health

## 💾 Smart Contracts

### PatentNFT Contract (`contracts/PatentNFT.sol`)

**Purpose**: Manages the minting and ownership of patent NFTs.

```solidity
// Key functions:
mintPatentNFT(recipient, patentNumber) → tokenId
verifyPatent(tokenId) → sets verification status
getPatent(tokenId) → patent metadata
```

**Features**:
- ERC721 compliant with URI storage
- Patent existence tracking
- Owner-only verification system
- Minting fee collection
- Event emission for indexing

**Usage Example**:
```typescript
// Frontend integration
const contract = getPatentNFTContract(signer);
const tx = await contract.mintPatentNFT(userAddress, "US1234567", { 
  value: ethers.parseEther("0.1") 
});
```

### PSPToken Contract (`contracts/PSPToken.sol`)

**Purpose**: ERC20 token for patent search payments (1 PSP = $0.01 USD).

```solidity
// Key functions:
purchaseTokens() payable → mints PSP tokens
spendTokensFor(user, amount) → authorized spending
redeemTokens(amount) → converts PSP back to ETH
```

**Features**:
- Dynamic pricing mechanism
- Authorized spender system
- Max supply cap (10M tokens)
- Burn functionality for deflation
- Emergency pause capability

**Token Economics**:
- Initial Supply: 1M PSP
- Max Supply: 10M PSP  
- Search Cost: 500 PSP ($5.00)
- Mintable by owner for liquidity

### SearchPayment Contract (`contracts/SearchPayment.sol`)

**Purpose**: Handles multi-token payments for AI patent searches.

```solidity
// Supported payment methods:
payWithETH() payable → 1 search credit
payWithUSDC() → requires prior approval
payWithPSP() → requires prior approval
```

**Features**:
- Multi-token payment support
- User statistics tracking
- Automatic credit allocation
- Rate limiting protection
- Payment history logging

## 🌐 Backend API

### Architecture (`backend/server.js`)

The backend serves as a CORS proxy and data transformation layer between the frontend and external APIs.

#### Core Endpoints

**Patent Search**:
```javascript
GET /api/uspto/search?criteria=solar&rows=10
// Returns: Google Patents data transformed to internal format
```

**Patent Details**:
```javascript
GET /api/uspto/patent/US1234567
// Returns: Specific patent information
```

**Health Check**:
```javascript
GET /api/health
// Returns: API status, database connection, patent API status
```

#### Google Patents Integration

**File**: `backend/server.js` (lines 248-303)

```javascript
// Enhanced mock data generator with realistic patent information
function generateEnhancedMockPatents(criteria, start, rows) {
  // Generates patents with:
  // - Relevant titles based on search criteria
  // - Real company assignees (Google, Apple, Tesla, etc.)
  // - Proper patent number formats (US, EP, CN, JP, KR)
  // - Classification codes (CPC, IPC)
  // - Citation counts and legal status
}
```

**Features**:
- SerpApi integration for real Google Patents data
- Enhanced mock data fallback system
- Global patent support (multiple countries)
- Intelligent categorization
- Rate limiting and error handling

#### CORS Proxy Solution

**Problem Solved**: Browser CORS restrictions prevented direct API calls to patent databases.

**Solution**: Backend proxy that:
1. Receives requests from frontend
2. Makes server-side API calls (no CORS restrictions)
3. Transforms data to consistent format
4. Returns processed data to frontend

```javascript
// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
```

## ⚛️ Frontend Application

### Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── layout/          # Header, Footer
│   ├── marketplace/     # NFT-specific components
│   ├── modals/          # MyNFTsModal, MetaMaskNFTGuide
│   └── debug/           # MintDebugger, NetworkDebugger
├── contexts/            # React Context providers
│   ├── Web3Context.tsx  # Blockchain connection
│   ├── WalletContext.tsx # Wallet state management
│   └── ThemeContext.tsx # UI theme provider
├── pages/               # Route components
│   ├── PatentSearchPage.tsx
│   ├── MintNFTPage.tsx
│   └── MarketplacePage.tsx
├── services/            # API integration layer
│   ├── usptoApi.ts      # Patent data service
│   ├── paymentService.ts # Payment processing
│   └── mintingService.ts # NFT minting
└── utils/               # Utility functions
    ├── contracts.ts     # Smart contract interfaces
    ├── metamask.ts      # Wallet utilities
    └── web3Utils.ts     # Centralized Web3 logic
```

### Key Services

#### USPTO API Service (`src/services/usptoApi.ts`)

**Purpose**: Interfaces with backend API for patent data retrieval.

```typescript
class USPTOApiService {
  // Search patents with backend proxy
  async searchPatents(params: USPTOSearchParams): Promise<Patent[]>
  
  // Get specific patent by number
  async getPatentByNumber(patentNumber: string): Promise<Patent | null>
  
  // Transform patent data for NFT creation
  async convertPatentToNFT(patent: Patent): Promise<Partial<NFT>>
}
```

**Data Transformation**:
```typescript
// Handles both Google Patents and legacy USPTO formats
private transformUSPTOData(usptoData: any[]): Patent[] {
  return usptoData.map(patent => {
    // Google Patents format (via SerpApi)
    if (patent.patent_id || patent.title) {
      return {
        patentNumber: patent.patent_id || 'N/A',
        title: patent.title || 'Untitled Patent',
        inventors: [patent.inventor || 'Unknown'],
        assignee: patent.assignee || 'Unassigned',
        // ... additional field mappings
      };
    }
    // Legacy format handling...
  });
}
```

#### Payment Service (`src/services/paymentService.ts`)

**Purpose**: Manages multi-token payment processing.

```typescript
class PaymentService {
  // Pay with ETH including gas estimation
  async payWithETH(userAddress: string): Promise<PaymentResult>
  
  // Pay with USDC (requires approval)
  async payWithUSDC(userAddress: string): Promise<PaymentResult>
  
  // Pay with PSP tokens (requires approval)
  async payWithPSP(userAddress: string): Promise<PaymentResult>
  
  // Get user's search credit balance
  async getUserSearchCredits(userAddress: string): Promise<number>
}
```

#### Web3 Utils (`src/utils/web3Utils.ts`)

**Purpose**: Centralized Web3 utility functions to eliminate code duplication.

**Problem Solved**: The same MetaMask provider selection logic was duplicated across 6+ files.

```typescript
class Web3Utils {
  // Handles multiple wallet providers
  getMetaMaskProvider(): any {
    if (window.ethereum.providers) {
      return window.ethereum.providers.find(p => p.isMetaMask) || window.ethereum;
    }
    return window.ethereum;
  }
  
  // Centralized error handling
  handleTransactionError(error: any): string
  
  // Standardized connection checking
  async isConnected(): Promise<{ connected: boolean; account?: string }>
  
  // Centralized signer creation
  async createSigner(): Promise<ethers.Signer | null>
}
```

## 🏪 Marketplace & IPFS Integration

### Live Marketplace Functionality

The marketplace now displays real NFT listings from all users instead of mock data:

**Key Features:**
- **Real-time Listings**: Fetches active NFT listings from the NFTMarketplace smart contract
- **Pagination**: Displays 20 patents per page with full navigation controls  
- **Patent Metadata**: Shows actual patent titles, inventors, and images
- **Search & Filter**: Search by patent number, title, or inventor name
- **Price Sorting**: Sort by price, date, or popularity

**MarketplaceService** (`src/services/marketplaceService.ts`):
```typescript
class MarketplaceService {
  // Fetch paginated marketplace listings
  async getMarketplaceListings(page: number, limit: number): Promise<PaginatedListings>
  
  // List an NFT for sale
  async listNFT(tokenId: string, priceInEth: string): Promise<ListingResult>
  
  // Purchase an NFT from marketplace
  async buyNFT(listingId: string, priceInEth: string): Promise<PurchaseResult>
  
  // Cancel an active listing
  async cancelListing(listingId: string): Promise<CancelResult>
  
  // Get user's owned NFTs
  async getUserNFTs(userAddress: string): Promise<UserNFT[]>
}
```

### PDF Processing & IPFS Storage

**PatentPdfService** (`src/services/patentPdfService.ts`):
```typescript
class PatentPdfService {
  // Fetch patent PDF from USPTO/Google Patents
  async fetchPatentPdf(patentNumber: string): Promise<Blob | null>
  
  // Convert PDF to image for NFT display
  async convertPdfToImage(pdfBlob: Blob): Promise<Blob>
  
  // Store files on IPFS with Pinata fallback
  async storeOnIPFS(file: Blob, filename?: string): Promise<string>
  
  // Complete patent processing pipeline
  async processPatentForNFT(patentNumber: string): Promise<{
    pdfHash: string;
    imageHash: string; 
    imageUrl: string;
  }>
}
```

**Processing Pipeline:**
1. **Patent PDF Retrieval**: Automatically fetches PDFs from patent offices
2. **Image Conversion**: First page of PDF converted to PNG using pdf.js
3. **IPFS Storage**: Both PDF and image stored on decentralized IPFS network
4. **Metadata Creation**: NFT metadata includes IPFS links for images and documents
5. **Contract Integration**: TokenURI points to backend metadata service

**Supported Patent Sources:**
- USPTO (US Patents)
- Google Patents (Global coverage)
- Placeholder generation for unavailable documents

### Metadata Service

**Backend Metadata API** (`backend/metadata.js`):
- Stores IPFS hashes and metadata for each patent NFT
- Serves JSON metadata compatible with OpenSea and other NFT platforms
- Configurable metadata URIs for different deployment environments

**Endpoints:**
```javascript
GET  /metadata/:patentNumber     // Serve NFT metadata JSON
POST /metadata/:patentNumber/ipfs // Store IPFS hashes
GET  /debug/metadata             // View all stored metadata
```

## 🔧 Configuration

### Environment Variables

#### Frontend (`.env`)
```bash
# Contract Addresses (Updated after deployment)
VITE_PATENT_NFT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_PSP_TOKEN_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
VITE_SEARCH_PAYMENT_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

# Network Configuration
VITE_CHAIN_ID=31337
VITE_NETWORK_NAME=localhost
VITE_RPC_URL=http://127.0.0.1:8545

# API Configuration
VITE_API_BASE_URL=http://localhost:3001
VITE_SERPAPI_KEY=your_serpapi_key_here  # Optional for real patent data
```

#### Backend (`backend/.env`)
```bash
# Server Configuration
PORT=3001
CORS_ORIGIN=http://localhost:5173

# Google Patents API (via SerpApi)
SERPAPI_KEY=demo  # Use 'demo' for mock data, real key for production

# Database (Optional - PostgreSQL for user data)
DATABASE_URL=postgresql://localhost:5432/patent_nft
```

### Network Configuration (`hardhat.config.ts`)

```typescript
const config: HardhatUserConfig = {
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.SEPOLIA_PRIVATE_KEY]
    }
  }
};
```

## 🧪 Testing

### Smart Contract Tests

```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:contracts     # PatentNFT, PSPToken, SearchPayment
npm run test:integration   # Cross-contract interactions
npm run test:security      # Security-focused tests

# Generate gas reports
npm run test:gas
```

### Test Coverage

**PatentNFT Tests** (`test/PatentNFT.test.cjs`):
- Minting functionality and access control
- Patent verification system
- Fee collection and withdrawal
- Event emission verification

**PSPToken Tests** (`test/PSPToken.test.cjs`):
- Token purchasing and redemption
- Authorized spending mechanism
- Supply cap enforcement
- Emergency pause functionality

**Integration Tests** (`test/Integration.test.cjs`):
- End-to-end payment flows
- Cross-contract token transfers
- Multi-step transaction scenarios

## 📡 API Integration

### Google Patents Integration

**Current Implementation**: SerpApi proxy for Google Patents

**Why Google Patents?**:
- ✅ Global coverage (100+ countries)
- ✅ Reliable uptime and data quality
- ✅ Consistent API responses
- ✅ No complex authentication requirements

**Alternative APIs Considered**:
- ❌ USPTO API: Limited to US patents, frequent downtime
- ❌ EPO API: European patents only
- ❌ WIPO API: Complex authentication, rate limiting

### Data Flow

1. **User searches** for "solar energy" in frontend
2. **Frontend** sends request to backend `/api/uspto/search?criteria=solar`
3. **Backend** calls Google Patents API via SerpApi
4. **Backend** transforms response to standardized format
5. **Frontend** receives processed patent data
6. **User** selects patent and initiates minting
7. **Smart contract** creates NFT with patent metadata

### Mock Data Fallback

**Important Note**: Mock data has been completely removed from the backend. The system now exclusively uses real Google Patents API data via SerpApi. When `SERPAPI_KEY` is set to "demo" or missing, the API returns an error requiring a valid key rather than falling back to mock data.

```javascript
// Backend validation enforces real API usage:
if (!serpApiKey || serpApiKey === 'demo' || serpApiKey === 'your_serpapi_key_here') {
  return res.status(400).json({ 
    error: 'SerpApi key required for real patent data access' 
  });
}
```

## 🔒 Security Features

### Smart Contract Security

**ReentrancyGuard**: Prevents recursive calls during fund transfers
```solidity
function withdrawETH() external onlyOwner nonReentrant {
  // Safe withdrawal implementation
}
```

**Access Control**: Owner-only functions with proper modifiers
```solidity
modifier onlyOwner() {
  require(msg.sender == owner(), "Not authorized");
  _;
}
```

**Pausable Contracts**: Emergency stop functionality
```solidity
function pause() external onlyOwner {
  _pause();
}
```

### Frontend Security

**Input Validation**: All user inputs are sanitized
```typescript
function validatePatentNumber(patentNumber: string): boolean {
  return /^[A-Z]{2}\d{6,8}$/.test(patentNumber);
}
```

**Secure Contract Interactions**: Proper error handling and gas estimation
```typescript
const gasEstimate = await contract.mintPatentNFT.estimateGas(
  userAddress, patentNumber, { value: mintingPrice }
);
```

## 📚 Developer Guide

### Adding New Patent Sources

1. **Create API Integration**:
   ```javascript
   // In backend/server.js
   async function fetchFromNewAPI(criteria) {
     const response = await axios.get(`${NEW_API_URL}/search`, {
       params: { q: criteria }
     });
     return transformDataFormat(response.data);
   }
   ```

2. **Update Frontend Service**:
   ```typescript
   // In src/services/usptoApi.ts
   private transformUSPTOData(data: any[]): Patent[] {
     // Add new API format handling
   }
   ```

### Extending Payment Methods

1. **Update Smart Contract**:
   ```solidity
   // Add new payment token enum
   enum PaymentToken { ETH, USDC, PSP, NEW_TOKEN }
   
   function payWithNewToken() external nonReentrant whenNotPaused {
     // Implementation
   }
   ```

2. **Frontend Integration**:
   ```typescript
   // In src/services/paymentService.ts
   async payWithNewToken(userAddress: string): Promise<PaymentResult> {
     // Payment logic
   }
   ```

### Debugging Tips

**Common Issues**:

1. **CORS Errors**: Ensure backend is running and CORS_ORIGIN is correct
2. **Transaction Failures**: Check gas estimation and user balance
3. **API Timeouts**: Verify backend can reach external APIs
4. **MetaMask Issues**: Clear browser cache, reconnect wallet

**Useful Commands**:
```bash
# Check contract deployment
npx hardhat run scripts/verifyLocalSetup.cjs

# Monitor backend logs
cd backend && npm start | grep -E "(error|Error|ERROR)"

# Test API endpoints
curl http://localhost:3001/api/health
curl "http://localhost:3001/api/uspto/search?criteria=test"
```

### Performance Optimization

**Frontend**:
- Use React.memo for expensive components
- Implement virtual scrolling for large patent lists
- Cache patent search results

**Backend**:
- Implement Redis caching for frequently searched patents
- Add database indexes for user queries
- Use connection pooling for external APIs

**Smart Contracts**:
- Batch operations where possible
- Use events for off-chain indexing
- Optimize gas usage with assembly when needed

---

## 🚀 Deployment Guide

### Environment Setup for Production

#### 1. Configure Environment Variables

**For Sepolia Testnet:**
```bash
# Edit .env file with your actual deployment values:
SEPOLIA_PRIVATE_KEY=0x[your_deployment_wallet_private_key]
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/[your_api_key]  
ETHERSCAN_API_KEY=[your_etherscan_api_key]
```

**Security Best Practices:**
- ✅ Use a **dedicated deployment wallet** with minimal funds
- ✅ Never commit private keys to git (already in .gitignore)
- ✅ Get free RPC from [Alchemy](https://www.alchemy.com/) or [Infura](https://infura.io/)
- ✅ Get free Etherscan API key from [Etherscan](https://etherscan.io/apis)

#### 2. Fund Your Deployment Wallet

**Sepolia Testnet:**
- Get free ETH from [Sepolia Faucet](https://sepoliafaucet.com/)
- Need ~0.1 ETH for all contract deployments

**Mainnet:**
- Ensure sufficient ETH for gas fees (~0.05-0.1 ETH)
- Use gas estimation tools for accurate costs

### Recommended: Sequential Individual Deployment

**Why individual deployment is better:**
- ✅ Clear dependency management  
- ✅ Better error handling and debugging
- ✅ Stop and fix if one contract fails
- ✅ Standard production practice

```bash
# Deploy contracts in dependency order:

1. PSP Token (no dependencies)
   npm run deploy:psp sepolia
   
2. SearchPayment (requires PSP Token address)
   npm run deploy:search sepolia
   
3. PatentNFT (requires PSP Token address)
   npm run deploy:nft sepolia
   
4. NFTMarketplace (requires PatentNFT address)
   npm run deploy:marketplace sepolia

# Verify all contracts
npm run verify sepolia
```

### Contract Dependencies

**Critical: Deploy in this exact order**
```
1. PSP Token ←─── (no dependencies)
2. SearchPayment ←─── PSP Token
3. PatentNFT ←─── PSP Token  
4. NFTMarketplace ←─── PatentNFT
```

### Alternative: Legacy All-at-Once Deployment

```bash
# Deploy all contracts in one transaction (not recommended for production)
npm run deploy:legacy:sepolia
```

### Post-Deployment Checklist

```bash
1. ✅ Verify contracts on Etherscan
   npm run verify sepolia

2. ✅ Update frontend environment variables
   # Contract addresses automatically saved to .env

3. ✅ Test all functionality on testnet
   # Mint NFT → List for sale → Buy NFT

4. ✅ Fund contracts if needed
   # Add initial PSP tokens for user rewards

5. ✅ Monitor deployment  
   # Check transaction confirmations
   # Verify contract interactions work
```

### Troubleshooting

**"Private key not configured"**
- Check `.env` file has correct `SEPOLIA_PRIVATE_KEY`
- Ensure no placeholder values remain (`your_sepolia_private_key_here`)
- Private key must start with `0x`

**"Insufficient funds"**
- Check deployment wallet has enough ETH for gas
- Use gas estimation tools for mainnet deployments

**Contract verification fails**
- Verify Etherscan API key is correct
- Wait a few minutes after deployment before verifying
- Check contract source code matches deployed bytecode

## 🚀 Sepolia Testnet Ready

The project is fully configured for Sepolia testnet deployment with production-ready features:

### Pre-deployment Checklist

1. **Get Sepolia ETH**: Fund your wallet from [Sepolia Faucet](https://sepoliafaucet.com/)
2. **Configure Environment**: Copy `.env.sepolia` to `.env` and update:
   ```bash
   SEPOLIA_PRIVATE_KEY=your_private_key_here
   VITE_API_BASE_URL=https://your-production-backend.com
   VITE_PINATA_API_KEY=your_pinata_api_key
   VITE_PINATA_SECRET_KEY=your_pinata_secret_key
   ```

### Deployment Commands

```bash
# Deploy all contracts to Sepolia (modular approach)
npm run deploy:sepolia

# Or deploy individual contracts:
npx hardhat run scripts/deploy/001_deploy_psp_token.js --network sepolia
npx hardhat run scripts/deploy/002_deploy_search_payment.js --network sepolia  
npx hardhat run scripts/deploy/003_deploy_patent_nft.js --network sepolia
npx hardhat run scripts/deploy/004_deploy_marketplace.js --network sepolia

# Verify contracts on Etherscan (commands provided after deployment)
npx hardhat verify --network sepolia <contract_address> <constructor_args>
```

### Production Features Ready

- ✅ **PDF to Image Processing**: Converts patent PDFs to NFT images
- ✅ **IPFS Integration**: Stores patent documents and images on IPFS
- ✅ **Live Marketplace**: Real-time listings with pagination
- ✅ **Patent Uniqueness**: Blockchain-enforced duplicate prevention
- ✅ **Fee Collection**: 2.5% platform fees + minting fees
- ✅ **Multi-token Support**: ETH, USDC, and PSP token payments
- ✅ **Configurable Metadata**: Production-ready tokenURI endpoints

### Post-deployment Tasks

1. **Update Contract Addresses**: Add deployed addresses to frontend `.env`
2. **Configure Backend**: Update metadata URI in smart contract
3. **Test Integration**: Verify minting, listing, and purchasing flows
4. **Monitor Performance**: Set up logging and analytics

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenZeppelin for secure smart contract templates
- Hardhat team for excellent development framework
- Google Patents for comprehensive patent data
- SerpApi for reliable API access
- Vite and React teams for modern frontend tools

---

**Built with** ❤️ **for the future of intellectual property trading**