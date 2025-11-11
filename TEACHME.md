# 📚 TEACH ME: Patent NFT Marketplace Architecture

This document explains how the Patent NFT Marketplace is structured, why it's built this way, and how all the pieces work together to achieve the project's goals.

## 🎯 Project Goals & Vision

**Main Goal**: Create a decentralized marketplace where real patents can be converted into NFTs and traded, with proper verification and fee collection.

**Key Requirements**:
- Convert real patents from patent offices into tradeable NFTs
- **PDF-First Approach**: Extract and compress only the front page of each patent's PDF into a single-page PDF document
- **Use PDF as NFT Image**: Store the single-page PDF on IPFS and use it directly as the NFT's visual representation (instead of converting to traditional image formats like PNG/JPG)
- **Innovative Visual Identity**: Each NFT displays as an actual PDF document, maintaining the authentic patent document format while keeping IPFS storage costs minimal
- Ensure each patent can only be minted once (global uniqueness) using the Patent ID from the patent office
- Collect fees (0.05 ETH minting + 2.5% marketplace)
- Support multiple payment methods (ETH, USDC, Patent Pennies Tokens PSP)
- Scale to handle thousands of patents and users

---

## 🏗️ Architecture Overview: Why This Structure?

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Pages     │  │  Services   │  │      Components     │  │
│  │             │  │             │  │                     │  │
│  │ Search      │  │ Google API  │  │ NFT Cards           │  │
│  │ Mint        │  │ Minting     │  │ Modals              │  │
│  │ Marketplace │  │ Payment     │  │ Debug Tools         │  │
│  │             │  │ Marketplace │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Express.js)                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │ CORS Proxy      │  │ Metadata Store  │  │ IPFS Utils  │  │
│  │                 │  │                 │  │             │  │
│  │ Google       │  │  | Rich NFT Metadata │  │ PDF Processing │
│  │ Patents API     │  │ Patent Info + IPFS │  │ Image Storage  │
│  │                 │  │                 │  │             │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 BLOCKCHAIN (Ethereum/Sepolia)               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ PatentNFT   │  │ PSPToken    │  │ NFTMarketplace      │  │
│  │             │  │             │  │                     │  │
│  │ Mint NFTs   │  │ AI Search   │  │ List & Buy NFTs     │  │
│  │ Track       │  │ Payments    │  │ Fee Collection      │  │
│  │ Uniqueness  │  │ Patent      │  │ 2.5% Platform Fee   │  │
│  │             │  │ Pennies     │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Why This Three-Layer Architecture?

1. **Frontend (React)**: Handles user interaction and Web3 wallet integration
2. **Backend (Express)**: Solves CORS issues and handles complex data processing
3. **Blockchain (Smart Contracts)**: Provides immutable storage and trustless transactions

---

## 🖥️ Frontend Architecture Deep Dive

### Complete Project Structure for New Developers

```
NFT_Patents/                                    # 🏛️ Root directory
├── 📁 Frontend (React/TypeScript/Vite)
│   ├── src/
│   │   ├── 📁 components/                      # Reusable UI components
│   │   │   ├── 📄 AISearchModal.tsx            # AI-powered patent search modal
│   │   │   ├── layout/                         # Layout components used on every page
│   │   │   │   ├── 📄 Header.tsx               # Navigation bar, wallet connection
│   │   │   │   └── 📄 Footer.tsx               # Site footer with links
│   │   │   ├── marketplace/                    # NFT marketplace UI components  
│   │   │   │   └── 📄 NFTCard.tsx              # Individual NFT card display
│   │   │   └── modals/                         # Modal popup components
│   │   │       ├── 📄 ListNFTModal.tsx         # List NFT for sale modal
│   │   │       ├── 📄 MetaMaskNFTGuide.tsx     # Guide for viewing NFTs in MetaMask
│   │   │       └── 📄 MyNFTsModal.tsx          # View owned NFTs modal
│   │   │
│   │   ├── 📁 contexts/                        # React Context providers (global state)
│   │   │   ├── 📄 ThemeContext.tsx             # Light/dark mode state
│   │   │   ├── 📄 WalletContext.tsx            # MetaMask wallet connection state
│   │   │   └── 📄 Web3Context.tsx              # Ethereum blockchain connection state
│   │   │
│   │   ├── 📁 pages/                           # Full page components (routes)
│   │   │   ├── 📄 HomePage.tsx                 # Landing page with project overview
│   │   │   ├── 📄 PatentSearchPage.tsx         # Main search interface with AI search
│   │   │   ├── 📄 MintNFTPage.tsx              # Convert patent to NFT workflow
│   │   │   ├── 📄 MarketplacePage.tsx          # Browse and buy NFTs
│   │   │   ├── 📄 NFTDetailPage.tsx            # Individual NFT detail view
│   │   │   ├── 📄 CreateListingPage.tsx        # Create marketplace listing
│   │   │   └── 📄 UserProfilePage.tsx          # User profile and owned NFTs
│   │   │
│   │   ├── 📁 services/                        # Business logic layer (API calls, blockchain interactions)
│   │   │   ├── 📄 aiSearchService.ts           # AI-powered patent search functionality
│   │   │   ├── 📄 marketplaceService.ts        # NFT marketplace interactions
│   │   │   ├── 📄 mintingService.ts            # NFT minting with rich metadata
│   │   │   ├── 📄 patentApi.ts                 # Google Patents API integration
│   │   │   ├── 📄 patentPdfService.ts          # PDF processing and IPFS storage
│   │   │   ├── 📄 paymentService.ts            # Payment processing (ETH, USDC, PSP)
│   │   │   └── 📄 pspTokenService.ts           # PSP token management
│   │   │
│   │   ├── 📁 utils/                           # Helper functions and utilities
│   │   │   ├── 📄 baseSingleton.ts             # Singleton pattern base class
│   │   │   ├── 📄 contractABIs.ts              # Smart contract ABIs and interfaces
│   │   │   ├── 📄 contracts.ts                 # Smart contract interaction utilities
│   │   │   ├── 📄 ipfsDebug.ts                 # IPFS debugging utilities
│   │   │   ├── 📄 metamask.ts                  # MetaMask wallet utilities
│   │   │   ├── 📄 security.ts                  # Security validation functions
│   │   │   └── 📄 web3Utils.ts                 # Web3 blockchain utilities
│   │   │
│   │   ├── 📁 types/                           # TypeScript type definitions
│   │   │   └── 📄 index.ts                     # All interface definitions (NFT, Patent, User, etc.)
│   │   │
│   │   ├── 📄 App.tsx                          # Main app component with routing
│   │   ├── 📄 main.tsx                         # App entry point
│   │   └── 📄 vite-env.d.ts                    # Vite environment type definitions
│   │
│   ├── 📄 index.html                           # HTML entry point
│   ├── 📄 package.json                         # Frontend dependencies and scripts
│   ├── 📄 vite.config.ts                       # Vite build configuration
│   ├── 📄 tailwind.config.js                   # Tailwind CSS configuration
│   ├── 📄 tsconfig.json                        # TypeScript configuration
│   └── 📄 eslint.config.js                     # ESLint code quality rules
│
├── 📁 Backend (Node.js/Express)
│   ├── 📄 server.js                            # Express server with API routes
│   ├── 📄 metadata.js                          # NFT metadata storage and management
│   ├── 📄 patents-db.json                      # Local patent data cache
│   ├── 📄 package.json                         # Backend dependencies
│   └── 📄 README.md                            # Backend-specific documentation
│
├── 📁 Smart Contracts (Solidity)
│   ├── 📄 PatentNFT.sol                        # ERC721 NFT contract with payable minting
│   ├── 📄 PSPToken.sol                         # ERC20 utility token for payments
│   ├── 📄 SearchPayment.sol                    # Multi-token payment processing
│   └── 📄 NFTMarketplace.sol                   # Secondary market for trading NFTs
│
├── 📁 Testing & Quality Assurance
│   ├── test/                                   # Smart contract tests
│   │   ├── 📄 PatentNFT.test.js               # NFT contract unit tests
│   │   ├── 📄 PSPToken.test.js                # PSP token contract tests
│   │   ├── 📄 SearchPayment.test.js           # Payment contract tests
│   │   ├── 📄 NFTMarketplace.test.js          # Marketplace contract tests
│   │   └── 📄 Integration.test.js             # End-to-end workflow tests
│   ├── 📄 SECURITY.md                          # Security considerations and audits
│   ├── 📄 slither.config.json                 # Slither security analyzer config
│   └── 📄 .solhint.json                       # Solidity linting rules
│
├── 📁 Deployment & DevOps
│   ├── scripts/
│   │   ├── deploy/                            # Modular deployment scripts
│   │   │   ├── 📄 001_deploy_psp_token.js     # Deploy PSP token contract
│   │   │   ├── 📄 002_deploy_search_payment.js # Deploy search payment contract  
│   │   │   ├── 📄 003_deploy_patent_nft.js    # Deploy NFT contract
│   │   │   └── 📄 004_deploy_marketplace.js   # Deploy marketplace contract
│   │   ├── emergency/                         # Emergency management scripts
│   │   │   ├── 📄 pauseAll.js                 # Emergency pause all contracts
│   │   │   └── 📄 unpauseAll.js              # Resume all contracts
│   │   ├── utils/                             # Deployment utilities
│   │   │   ├── 📄 constants.js                # Deployment constants
│   │   │   └── 📄 deployment-utils.js         # Shared deployment functions
│   │   ├── 📄 deploy-all.js                   # Legacy: Deploy all contracts at once
│   │   ├── 📄 deploy-modular.js              # Modern: Modular deployment orchestrator
│   │   └── 📄 verify-deployment.js           # Verify deployed contracts
│   │
│   ├── deployments/                           # Deployment artifacts and addresses
│   │   └── localhost/                         # Local deployment addresses
│   │       ├── 📄 PSPToken.json               # PSP token deployment info
│   │       ├── 📄 SearchPayment.json          # Search payment deployment info
│   │       ├── 📄 PatentNFT.json              # NFT contract deployment info
│   │       └── 📄 NFTMarketplace.json         # Marketplace deployment info
│   │
│   ├── 📄 hardhat.config.js                   # Hardhat blockchain development config
│   └── ignition/                              # Alternative deployment system
│       └── modules/
│           └── 📄 PatentNFT.ts                # Hardhat Ignition deployment module
│
├── 📁 Build & Development
│   ├── artifacts/                             # Compiled contract artifacts
│   │   └── contracts/                         # Generated contract ABIs and bytecode
│   ├── cache/                                 # Build cache files
│   ├── docs/                                  # Built frontend for GitHub Pages
│   └── node_modules/                          # Project dependencies (auto-generated)
│
└── 📁 Documentation & Configuration
    ├── 📄 README.md                           # Main project documentation
    ├── 📄 TEACHME.md                          # Architecture deep dive (this file!)
    ├── 📄 package.json                        # Root package.json with scripts
    ├── 📄 .env.example                        # Environment variables template
    └── 📄 .gitignore                          # Git ignore rules
```

### 🎯 Key Directory Purposes for New Developers

**🎨 Frontend (`src/`)**
- **Components**: Reusable UI pieces that can be used across multiple pages
- **Pages**: Full page views that correspond to different routes in the application  
- **Services**: Business logic layer that handles all API calls and blockchain interactions
- **Contexts**: Global state management using React Context API
- **Utils**: Helper functions and utilities used throughout the application

**🔧 Backend (`backend/`)**
- **server.js**: Express API server entry point with route registration and middleware
- **routes/patents.js**: Patent verification and search endpoints
- **routes/ipfs.js**: Secure IPFS upload endpoints (Pinata proxy)
- **routes/pdf.js**: PDF processing and placeholder generation
- **routes/health.js**: Health check and service status endpoints

**⛓️ Smart Contracts (`contracts/`)**
- **PatentNFT.sol**: Core NFT contract with payable minting and metadata management
- **PSPToken.sol**: Utility token for AI search payments
- **SearchPayment.sol**: Handles multi-token payment processing
- **NFTMarketplace.sol**: Secondary market for buying/selling NFTs

**🧪 Testing (`test/`)**
- **Unit Tests**: Individual contract function testing
- **Integration Tests**: Full workflow testing across multiple contracts

**🚀 Deployment (`scripts/`)**
- **Modular Deployment**: Each contract deployed independently with proper dependency management
- **Emergency Scripts**: Safety mechanisms for production environments
- **Verification**: Contract verification on block explorers

### 🧭 New Developer Navigation Guide

**👶 Start Here (First-time setup):**
1. **📄 README.md** - Project overview and setup instructions
2. **📄 package.json** - Available npm scripts and dependencies
3. **📄 .env.example** - Environment variables you need to configure

**🎨 Understanding the Frontend:**
1. **📄 src/App.tsx** - Main app structure and routing
2. **📄 src/pages/HomePage.tsx** - Start with the landing page to understand the flow
3. **📄 src/services/** - Business logic layer (start here to understand how things work)
4. **📄 src/components/** - UI components (after understanding the logic)

**⛓️ Understanding Smart Contracts:**
1. **📄 contracts/PatentNFT.sol** - Core NFT functionality (start here)
2. **📄 test/PatentNFT.test.js** - Read tests to understand expected behavior
3. **📄 contracts/NFTMarketplace.sol** - Marketplace functionality
4. **📄 scripts/deploy/** - Deployment process

**🔧 Understanding the Backend:**
1. **📄 backend/server.js** - All API endpoints and functionality
2. **📄 backend/metadata.js** - How NFT metadata is managed

**📚 Key Files Every Developer Should Understand:**

**Critical Frontend Files:**
- **📄 src/services/mintingService.ts** - How NFTs are created with rich metadata
- **📄 src/services/marketplaceService.ts** - How marketplace interactions work
- **📄 src/contexts/Web3Context.tsx** - Blockchain connection management
- **📄 src/utils/contracts.ts** - Smart contract interaction utilities

**Critical Backend Files:**
- **📄 backend/server.js** - API routes for patent search, metadata, PDF processing
- **📄 backend/metadata.js** - NFT metadata storage with patent information

**Critical Smart Contract Files:**
- **📄 contracts/PatentNFT.sol** - NFT minting with uniqueness enforcement
- **📄 contracts/NFTMarketplace.sol** - Trading functionality

**🛠️ Development Workflow Understanding:**

**For Frontend Development:**
```
src/pages/ → defines user interfaces
    ↓
src/services/ → handles business logic & API calls  
    ↓
src/utils/ → provides blockchain interaction utilities
    ↓
backend/server.js → serves data and handles CORS
    ↓
contracts/*.sol → executes on blockchain
```

**For Smart Contract Development:**
```
contracts/*.sol → write contract logic
    ↓
test/*.test.js → write comprehensive tests
    ↓
scripts/deploy/ → deploy to blockchain
    ↓
src/utils/contractABIs.ts → update frontend interfaces
```

**📖 Learning Path for New Developers:**

**Week 1: Understanding the Stack**
- Read README.md and TEACHME.md completely
- Set up local environment and run the project
- Understand the three-layer architecture (Frontend → Backend → Blockchain)

**Week 2: Frontend Deep Dive**
- Study the service layer pattern in `src/services/`
- Understand React Context usage in `src/contexts/`
- Follow one complete user flow (e.g., search → mint → list → buy)

**Week 3: Smart Contracts**  
- Read and understand `PatentNFT.sol` 
- Run and understand the test suite
- Deploy contracts locally and understand the deployment process

**Week 4: Integration & Advanced Features**
- Understand the metadata flow from search to NFT display
- Study the IPFS integration for PDF storage
- Explore the payment system with multiple tokens

### Why This Structure?

**Separation of Concerns**: Each folder has a specific responsibility
- **Components**: Pure UI, no business logic
- **Services**: All API calls and complex logic
- **Pages**: Combine components and services
- **Utils**: Shared helper functions

### Key Design Patterns

#### 1. **Service Layer Pattern**

**Problem**: Pages were getting cluttered with API calls and business logic.

**Solution**: Extract all business logic into service classes.

```typescript
// Before: Logic mixed in component
const MintNFTPage = () => {
  const [patent, setPatent] = useState(null);
  
  const mintNFT = async () => {
    // 50 lines of contract interaction code here...
    const contract = new ethers.Contract(address, abi, signer);
    const tx = await contract.mintPatentNFT(...)
    // ... more complex logic
  }
}

// After: Clean separation
const MintNFTPage = () => {
  const [patent, setPatent] = useState(null);
  
  const mintNFT = async () => {
    const result = await mintingService.mintPatentNFT({
      patentNumber: patent.patentNumber,
      price: 0.1,
      userAddress: account,
      patentData: patent // Pass full patent data for rich metadata
    });
  }
}
```

#### 2. **Modal-Based User Experience Pattern**

**Problem**: Page redirects were disrupting user flow.

**Solution**: Replace redirect-based actions with modal popups for seamless UX.

```typescript
// Before: Redirect to listing page
const handleListForSale = () => {
  navigate('/create-listing', { state: { nft } });
  // User sees blank screen, loses context
};

// After: Modal-based listing
const handleListForSale = () => {
  setShowListModal(true); // Opens modal overlay
  // User stays on same page, maintains context
};

// ListNFTModal.tsx - Reusable across all NFT components
<ListNFTModal 
  isOpen={showListModal}
  onClose={() => setShowListModal(false)}
  nft={nft}
  onSuccess={handleListingSuccess}
/>
```

#### 3. **Context Pattern for Global State**

**Why**: Wallet connection and Web3 state needed across many components.

```typescript
// Web3Context.tsx - Provides blockchain connection to entire app
export const Web3Provider = ({ children }) => {
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // Any component can now access: const { signer, account } = useWeb3();
}
```

#### 4. **Custom Hook Pattern**

**Why**: Reuse complex stateful logic across components.

```typescript
// Custom hook for patent data fetching
const usePatentSearch = () => {
  const [patents, setPatents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const searchPatents = async (criteria) => {
    setLoading(true);
    const results = await usptoApiService.searchPatents(criteria);
    setPatents(results);
    setLoading(false);
  };
  
  return { patents, loading, searchPatents };
};
```

---

## 🔧 Backend Architecture Deep Dive

### Why Do We Need a Backend?

**Problem 1: CORS (Cross-Origin Resource Sharing)**
```
Browser → Direct call to Google Patents API ❌ BLOCKED by CORS policy
Browser → Our backend → Google Patents API ✅ WORKS (no CORS on server)
```

**Problem 2: Complex Data Processing**
- **PDF extraction and compression**: Extract first page from multi-page patent PDFs and compress into single-page PDF documents using Node.js libraries
- **IPFS integration**: Upload single-page PDFs directly to IPFS (no image conversion needed)
- **NFT metadata**: Serve reliable metadata endpoints pointing to PDF documents as NFT images
- **Patent document processing**: Validate and transform real patent data while maintaining document integrity

### Backend Structure

```javascript
// server.js - Main entry point (Deployed on Vercel)
├── CORS Proxy Routes
│   ├── /api/patents/search   # Primary: Google Patents via SerpAPI
│   ├── /api/uspto/search     # Legacy: Compatibility endpoint
│   ├── /api/patents/verify/:patentNumber # Verify and get full patent details
│   └── /api/uspto/patent/:id # Get specific patent details
├── Metadata Routes
│   ├── /api/metadata/:patent    # Serve NFT metadata JSON
│   └── POST /api/metadata/:patent # Store metadata with patent data
├── PDF Processing Routes
│   ├── /api/pdf/process-patent  # Extract and compress patent PDFs
│   └── /api/pdf/generate-placeholder # Generate placeholder PDFs
└── Utility Routes
    ├── /api/health         # Health check with SerpAPI validation
    └── /debug/metadata     # Debug metadata store
```

### Key Backend Services

#### 1. **CORS Proxy Service**

**What it does**: Acts as a middleman between frontend and patent APIs.

```javascript
// Real API implementation with validation:
app.get('/api/patents/search', async (req, res) => {
  const serpApiKey = process.env.SERPAPI_KEY;

  // Enforce real API usage - no mock data fallback
  if (!serpApiKey) {
    return res.status(500).json({
      error: 'Patents API not configured'
    });
  }

  // Call Google Patents via SerpAPI
  const response = await axios.get('https://serpapi.com/search', {
    params: {
      api_key: serpApiKey,
      engine: 'google_patents',
      q: req.query.criteria,
      num: Math.max(10, Math.min(req.query.rows || 20, 100)),
      start: parseInt(req.query.start || 0)
    },
    timeout: 30000
  });

  // Return Google Patents data
  res.json(response.data);
});

// Legacy compatibility endpoint
app.get('/api/uspto/search', async (req, res) => {
  // Same implementation as /api/patents/search
  // Maintained for backward compatibility
});
```

#### 2. **Metadata Service**

**Why needed**: Smart contracts need a URL for NFT metadata, but that URL must be reliable and permanent.

```javascript
// metadata.js - Stores Rich NFT metadata with full patent information
class MetadataStore {
  storeMetadata(patentNumber, metadata) {
    // Stores: patent title, inventor, assignee, filing date, 
    //         abstract, image URL, IPFS hashes, status, etc.
    // Full patent data captured from search results
  }
  
  getMetadata(patentNumber) {
    // Returns rich JSON with actual patent information:
    // - name: Real patent title (not "Untitled Patent #1")
    // - description: Patent abstract/description
    // - attributes: Patent number, inventor, assignee, filing date, etc.
  }
}

// When smart contract calls tokenURI():
// Returns: "http://localhost:3001/api/metadata/US1234567"
// Which serves rich NFT metadata with actual patent information
```

---

## ⛓️ Smart Contract Architecture

### Why Multiple Contracts?

**Single Responsibility Principle**: Each contract has one main job.

```solidity
PatentNFT.sol        // Handles NFT minting and patent uniqueness
├── Mints patent NFTs with payable function (0.05 ETH)
├── Tracks patent existence (prevents duplicates) 
├── Collects minting fees with withdrawal functions
├── Manages rich metadata URIs pointing to backend API
└── Both public payable and admin-only minting functions

PSPToken.sol         // Patent Search Pennies - Layer 2 token
├── ERC20 token for AI search payments
├── Dynamic pricing (1 PSP = $0.01)
├── Token economics and supply management
└── Authorized spender system

NFTMarketplace.sol   // Secondary market for trading
├── List NFTs for sale
├── Buy/sell functionality (Buy Now - fully implemented)
├── Make Offer system (UI ready, contract implementation pending)
├── Platform fee collection (2.5%)
└── Listing management with cancellation
```

### Why This Separation?

1. **Security**: Smaller contracts = easier to audit
2. **Upgradability**: Can upgrade marketplace without touching NFT contract
3. **Gas Efficiency**: Users only interact with contracts they need
4. **Modularity**: Can add new features without changing core contracts

### Contract Interaction Flow

```
User wants to mint patent NFT (Enhanced Flow):
1. Frontend → PatentNFT.patentExists(patentNumber) [Check if already minted]
2. Frontend → PatentNFT.getMintingPrice() [Get current price - 0.05 ETH]  
3. Backend → Store rich metadata with full patent data (title, inventor, etc.)
4. Frontend → PatentNFT.mintPatentNFT(user, patentNumber) [Mint with ETH payment]
5. Contract → Sets patentExists[patentNumber] = true [Prevent future duplicates]
6. Contract → Sets tokenURI to backend metadata endpoint
7. Contract → Emits PatentMinted event [Frontend can listen for confirmation]
8. Result → NFT now contains real patent title and information

User wants to list NFT for sale (Modal-based):
1. User clicks "List for Sale" → Opens ListNFTModal
2. User sets price and confirms → Modal validates input
3. Frontend → PatentNFT.approve(marketplace, tokenId) [Allow marketplace to transfer]
4. Frontend → NFTMarketplace.listNFT(nftContract, tokenId, price)
5. Contract → Creates listing with unique ID
6. Contract → Emits NFTListed event
7. Modal shows success message and closes

User wants to buy NFT (Buy Now):
1. User clicks "Buy Now" on marketplace listing
2. Frontend → NFTMarketplace.buyNFT(listingId) [Send ETH payment]
3. Contract → Transfers NFT to buyer
4. Contract → Pays seller (97.5%) and platform (2.5%)
5. Contract → Emits NFTSold event
6. Frontend shows success toast and refreshes data

User wants to make an offer (UI ready, contract pending):
1. User clicks "Make Offer" → Opens offer modal
2. User enters offer amount → Currently shows success toast
3. Future: Store offer on-chain for seller to accept/reject
```

---

## 🔄 Frontend-Backend Integration

### How They Work Together

#### 1. **Patent Search Flow**

```typescript
// Frontend (PatentSearchPage.tsx)
const searchPatents = async (criteria) => {
  const response = await fetch(`${API_BASE_URL}/api/patents/search?criteria=${criteria}`);
  const patents = await response.json();
  setSearchResults(patents);
};

// Backend (server.js) - Deployed on Vercel
app.get('/api/patents/search', async (req, res) => {
  const { criteria, start = 0, rows = 20 } = req.query;

  const serpApiKey = process.env.SERPAPI_KEY;
  if (!serpApiKey) {
    return res.status(500).json({ error: 'Patents API not configured' });
  }

  // Call Google Patents via SerpAPI (bypasses CORS)
  const response = await axios.get('https://serpapi.com/search', {
    params: {
      engine: 'google_patents',
      q: criteria,
      start: parseInt(start),
      num: Math.max(10, Math.min(parseInt(rows), 100)),
      api_key: serpApiKey
    },
    timeout: 30000
  });

  // Return Google Patents data
  res.json(response.data);
});
```

#### 2. **NFT Minting with IPFS Flow (Streamlined)**

```typescript
// Frontend (MintingService.ts)
async mintPatentNFT(params) {
  // 1. Process patent PDF and upload to IPFS
  const pdfData = await patentPdfService.processPatentForNFT(params.patentNumber);

  // 2. Create rich metadata with full patent data
  const nftMetadata = {
    name: params.patentData?.title || `Patent NFT - ${params.patentNumber}`,
    description: params.patentData?.abstract || `NFT representing patent ${params.patentNumber}`,
    image: pdfData.imageUrl, // IPFS URL
    external_url: `https://patents.google.com/patent/${params.patentNumber}`,
    attributes: [
      { trait_type: "Patent Number", value: params.patentNumber },
      { trait_type: "Title", value: params.patentData?.title || "Unknown" },
      { trait_type: "Inventor", value: params.patentData?.inventor || "Unknown" },
      { trait_type: "Assignee", value: params.patentData?.assignee || "Unknown" },
      { trait_type: "Filing Date", value: params.patentData?.filingDate || new Date().toISOString() },
      { trait_type: "Country", value: params.patentData?.country || "Unknown" },
      { trait_type: "Status", value: params.patentData?.status || "Active" },
      { trait_type: "Storage", value: "IPFS" },
      { trait_type: "Minted", value: new Date().toISOString() }
    ]
  };

  // 3. Upload metadata to IPFS via backend proxy
  const metadataResponse = await fetch(`${API_BASE_URL}/api/pinata/upload-json`, {
    method: 'POST',
    body: JSON.stringify({
      json: nftMetadata,
      filename: `patent-${params.patentNumber}-metadata.json`
    })
  });
  const { ipfsHash: metadataHash } = await metadataResponse.json();

  // 4. Mint NFT on blockchain with IPFS metadata URI
  const contract = getPatentNFTContract(signer);
  const tx = await contract.mintPatentNFT(
    userAddress,
    params.patentNumber,
    `ipfs://${metadataHash}`, // Store IPFS URI on-chain
    { value: price }
  );

  return { success: true, txHash: tx.hash, metadataHash };
}

// Backend proxy for secure IPFS uploads (Pinata JWT never exposed)
app.post('/api/pinata/upload-json', async (req, res) => {
  const { json, filename } = req.body;
  const pinataJWT = process.env.PINATA_JWT;

  if (!pinataJWT) {
    return res.status(500).json({ error: 'Pinata not configured on server' });
  }

  // Upload to Pinata (backend keeps JWT safe)
  const response = await axios.post(
    'https://api.pinata.cloud/pinning/pinJSONToIPFS',
    { pinataContent: json, pinataMetadata: { name: filename } },
    { headers: { 'Authorization': `Bearer ${pinataJWT}` } }
  );

  res.json({ success: true, ipfsHash: response.data.IpfsHash });
});

// Marketplace retrieves metadata directly from IPFS
app.get('/api/marketplace/listings', async (req, res) => {
  // Get listings from blockchain
  const listings = await marketplaceContract.getListings();

  // For each listing, fetch metadata from IPFS
  for (const listing of listings) {
    const metadataUri = await patentNFTContract.tokenURI(listing.tokenId);

    // Convert IPFS URI to HTTP gateway URL
    const ipfsHash = metadataUri.replace('ipfs://', '');
    const metadataUrl = `https://ipfs.io/ipfs/${ipfsHash}`;

    // Fetch metadata from IPFS
    const metadata = await fetch(metadataUrl).then(r => r.json());

    // Extract patent data from attributes
    listing.title = metadata.name;
    listing.inventor = metadata.attributes?.find(a => a.trait_type === 'Inventor')?.value;
    listing.imageUrl = metadata.image;
  }

  res.json(listings);
});
```

#### 3. **Marketplace Data Flow**

```typescript
// Frontend (MarketplaceService.ts)
async getMarketplaceListings(page = 1, limit = 20) {
  // 1. Get marketplace contract
  const marketplaceContract = this.getMarketplaceContract(provider);
  
  // 2. Get total number of listings from blockchain
  const totalListings = await marketplaceContract._listingIds();
  
  // 3. Fetch listings for current page
  for (let i = startIndex; i <= endIndex; i++) {
    const listing = await marketplaceContract.listings(i);
    if (listing.active) {
      // 4. Get rich patent metadata from backend
      const metadataResponse = await fetch(`${API_BASE_URL}/api/metadata/${patentNumber}`);
      const metadata = await metadataResponse.json();
      
      // 5. Extract patent information from metadata attributes
      const getAttribute = (traitType) => 
        metadata.attributes?.find(attr => attr.trait_type === traitType)?.value;
      
      // 6. Combine blockchain data + rich metadata
      listings.push({
        listingId: listing.listingId,
        price: listing.price,
        seller: listing.seller,
        title: metadata.name, // Real patent title
        patentNumber: getAttribute('Patent Number'),
        inventor: getAttribute('Inventor'),
        assignee: getAttribute('Assignee'),
        imageUrl: metadata.image
      });
    }
  }
  
  return { listings, totalPages, currentPage };
}
```

---

## 🎯 Design Decisions & Trade-offs

### 1. **Why React Instead of Plain HTML?**

**Decision**: Use React with TypeScript
**Reasoning**:
- **State Management**: Complex wallet connections and NFT data need reactive state
- **Component Reusability**: NFTCard component used in multiple places
- **Type Safety**: TypeScript prevents bugs with smart contract interactions
- **Ecosystem**: Rich ecosystem of Web3 libraries (ethers.js, wagmi, etc.)

### 2. **Why Express Backend Instead of Serverless?**

**Decision**: Use Express.js server
**Reasoning**:
- **CORS Proxy**: Need persistent server to proxy API requests
- **IPFS Processing**: Heavy PDF→image conversion needs server resources
- **Metadata Storage**: Need persistent storage for NFT metadata
- **WebSocket Support**: Future real-time features (live bidding, notifications)

### 3. **Why Multiple Smart Contracts Instead of One?**

**Decision**: Separate PatentNFT, PSPToken, and NFTMarketplace
**Reasoning**:
- **Gas Optimization**: Users only deploy/interact with contracts they need
- **Security**: Smaller contracts are easier to audit and less attack surface
- **Upgradeability**: Can upgrade marketplace without touching core NFT logic
- **Modularity**: Can add new payment methods or marketplace features

### 4. **Why IPFS Instead of Traditional Storage?**

**Decision**: Store patent PDFs and images on IPFS
**Reasoning**:
- **Decentralization**: No single point of failure for NFT images
- **Immutability**: Content-addressed storage ensures images can't be changed
- **NFT Standards**: Industry standard for NFT metadata storage
- **Cost**: Much cheaper than storing files on blockchain directly

### 5. **Why Patent Pennies (PSP) Token?**

**Decision**: Create custom ERC20 token for AI search payments
**Reasoning**:
- **User Experience**: Clearer pricing (500 PSP = $5 vs 0.002 ETH = ~$5)
- **Fee Collection**: Platform earns from token purchases
- **Future Features**: Can add staking, governance, discounts for token holders
- **Layer 2 Economics**: Creates internal economy around patent search

---

## 🔧 Configuration & Environment

### Why Environment Variables?

**Problem**: Hard-coded addresses break when deploying to different networks.

```typescript
// Bad: Hard-coded addresses
const contract = new ethers.Contract(
  "0x1234...", // This only works on localhost!
  abi,
  signer
);

// Good: Environment-based configuration
const contract = new ethers.Contract(
  import.meta.env.VITE_PATENT_NFT_ADDRESS, // Different per environment
  abi,
  signer
);
```

### Environment Structure

```bash
# .env (Development - localhost)
VITE_PATENT_NFT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_CHAIN_ID=31337
VITE_RPC_URL=http://127.0.0.1:8545
VITE_API_BASE_URL=http://localhost:3001
SERPAPI_KEY=your_serpapi_key_here

# .env (Production - Sepolia testnet with Vercel)
VITE_PATENT_NFT_ADDRESS=0xDeployedSepoliaAddress...
VITE_CHAIN_ID=11155111
VITE_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
VITE_API_BASE_URL=https://nft-patents-backend.vercel.app

# backend/.env (Backend - Required for Vercel)
SERPAPI_KEY=your_serpapi_key_here
CORS_ORIGIN=https://nft-patents.vercel.app
PORT=3001
NODE_ENV=production
```

---

## 🚀 Deployment Strategy

### Why Hardhat for Development?

**Hardhat vs Truffle vs Foundry**:
- **Hardhat**: Best TypeScript support, great for full-stack dApps
- **Local Blockchain**: `npx hardhat node` gives instant feedback
- **Console Logs**: `console.log()` works inside smart contracts for debugging

### Environment Setup for Deployment

#### 1. Configure Environment Variables

**For Sepolia Testnet Deployment:**
```bash
# Edit .env file and replace with actual values:
SEPOLIA_PRIVATE_KEY=0x[your_deployment_wallet_private_key]
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/[your_api_key]
ETHERSCAN_API_KEY=[your_etherscan_api_key]
```

**Security Best Practices:**
- Use a **dedicated deployment wallet** with minimal funds
- Never commit private keys to git (already in .gitignore)
- Get free RPC from [Alchemy](https://www.alchemy.com/) or [Infura](https://infura.io/)
- Get free Etherscan API key from [Etherscan](https://etherscan.io/apis)

#### 2. Fund Your Deployment Wallet

**Sepolia Testnet:**
- Get free ETH from [Sepolia Faucet](https://sepoliafaucet.com/)
- Need ~0.1 ETH for all contract deployments

**Mainnet:**
- Ensure sufficient ETH for gas fees (~0.05-0.1 ETH)
- Use gas estimation tools for accurate costs

### Deployment Pipeline

#### Smart Contract Deployment (Blockchain)

**Recommended: Sequential Individual Deployment**

**Why individual deployment is better:**
- Clear dependency management
- Better error handling and debugging
- Stop and fix if one contract fails
- Standard production practice

```bash
1. Development (localhost)
   ├── npx hardhat node          # Local blockchain
   ├── npm run deploy:psp localhost      # PSP Token
   ├── npm run deploy:search localhost   # Search Payment
   ├── npm run deploy:nft localhost      # Patent NFT
   ├── npm run deploy:marketplace localhost # Marketplace
   └── npm run dev               # Frontend connects

2. Testing (Sepolia)
   ├── Get Sepolia ETH from faucet
   ├── Update .env with real Sepolia config
   ├── npm run deploy:psp sepolia        # Deploy in order
   ├── npm run deploy:search sepolia     # (depends on PSP)
   ├── npm run deploy:nft sepolia        # (depends on PSP)
   ├── npm run deploy:marketplace sepolia # (depends on NFT)
   └── npm run verify sepolia            # Verify all contracts

3. Production (Mainnet)
   ├── Audit smart contracts
   ├── Deploy with individual scripts for safer deployment
   └── Monitor with analytics and error tracking
```

#### Vercel Deployment (Frontend & Backend)

**Backend Deployment to Vercel (Streamlined - No Database Needed!):**

```bash
1. Backend Setup
   ├── Navigate to backend directory
   ├── Install dependencies:
   │   cd backend
   │   npm install
   │
   ├── Ensure vercel.json is configured:
   │   {
   │     "version": 2,
   │     "builds": [{ "src": "server.js", "use": "@vercel/node" }],
   │     "routes": [{ "src": "/(.*)", "dest": "server.js" }]
   │   }
   │
   └── Configure environment variables in Vercel dashboard:
       ├── SERPAPI_KEY (REQUIRED - for patent search)
       ├── PINATA_JWT (REQUIRED - for IPFS uploads)
       ├── CORS_ORIGIN (set to your frontend URL)
       ├── NODE_ENV=production
       │
       └── Why no database?
           ├── All metadata stored on IPFS (decentralized)
           ├── No backend state to manage
           ├── Fully serverless architecture
           └── Cost-effective and scalable

2. Deploy Backend
   ├── vercel --prod (or push to GitHub for auto-deploy)
   ├── Deployment URL: https://nft-patents-backend.vercel.app
   └── Verify backend is working:
       curl https://nft-patents-backend.vercel.app/api/health
       (Should show: "status": "ok", all services enabled)
```

**Why IPFS-First Architecture:**

Traditional approach (with database):
- ❌ Backend database required for metadata storage
- ❌ Cold starts cause data loss
- ❌ Scaling requires database management
- ❌ Additional costs for storage

IPFS-First approach:
- ✅ All metadata stored on decentralized IPFS
- ✅ No backend state to manage
- ✅ Fully serverless and scalable
- ✅ Lower operational costs
- ✅ Metadata persists forever on IPFS

**Frontend Deployment to Vercel:**

```bash
1. Frontend Setup
   ├── Update .env with Vercel backend URL:
   │   VITE_API_BASE_URL=https://nft-patents-backend.vercel.app
   ├── Configure contract addresses from blockchain deployment
   └── Ensure vercel.json is configured for React/Vite

2. Deploy Frontend
   ├── vercel --prod (or push to GitHub for auto-deploy)
   ├── Configure all VITE_* environment variables in Vercel dashboard
   └── Access at: https://nft-patents.vercel.app
```

**Environment Variables Checklist for Vercel:**

**Backend Project:**
- `SERPAPI_KEY` - Required for patent search
- `PINATA_JWT` - Required for IPFS uploads
- `CORS_ORIGIN` - Frontend URL for CORS
- `NODE_ENV` - Set to "production"

**Frontend Project:**
- `VITE_CHAIN_ID` - 11155111 (Sepolia)
- `VITE_RPC_URL` - Ethereum RPC endpoint
- `VITE_PATENT_NFT_ADDRESS` - Deployed contract address
- `VITE_MARKETPLACE_ADDRESS` - Deployed contract address
- `VITE_PSP_TOKEN_ADDRESS` - Deployed contract address
- `VITE_SEARCH_PAYMENT_ADDRESS` - Deployed contract address
- `VITE_API_BASE_URL` - Backend URL
- `VITE_IPFS_GATEWAY` - IPFS gateway URL

#### Alternative: Legacy All-at-Once Deployment

```bash
# Deploy all contracts in one transaction
npm run deploy:legacy          # localhost
npm run deploy:legacy:sepolia  # sepolia testnet
```

### Contract Dependencies & Deployment Order

**Critical: Deploy in this exact order:**

```bash
1. PSP Token (no dependencies)
   └── Creates ERC20 token for AI search payments

2. SearchPayment (requires PSP Token address)
   └── Handles payment processing with PSP tokens

3. PatentNFT (requires PSP Token address)
   └── Mints unique patent NFTs, collects fees

4. NFTMarketplace (requires PatentNFT address)  
   └── Secondary market for trading patent NFTs
```

### Deployment Script Structure

```bash
scripts/deploy/
├── 001_deploy_psp_token.js       # PSP Token (independent)
├── 002_deploy_search_payment.js  # Search Payment (needs PSP)
├── 003_deploy_patent_nft.js      # Patent NFT (needs PSP)
├── 004_deploy_marketplace.js     # Marketplace (needs NFT)
└── ../utils/deployment-utils.js   # Shared utilities

# Each script includes:
├── Environment variable loading (dotenv)
├── Network-specific wallet creation
├── Contract deployment with constructor args
├── Address saving to deployments/ folder
├── .env file updates with new addresses
└── Deployment verification
```

### Post-Deployment Checklist

```bash
1. ✅ Verify contracts on Etherscan
   npm run verify sepolia

2. ✅ Update frontend environment variables
   # Addresses auto-saved to .env during deployment

3. ✅ Test all functionality on testnet
   # Mint NFT, list for sale, buy NFT

4. ✅ Fund contracts if needed
   # Add initial PSP tokens for rewards

5. ✅ Monitor deployment
   # Check transaction confirmations
   # Verify contract interactions work
```

### Troubleshooting Common Issues

**"Private key not configured"**
- Check `.env` file has correct `SEPOLIA_PRIVATE_KEY`
- Ensure no placeholder values remain
- Private key must start with `0x`

**"Insufficient funds"**
- Check deployment wallet has enough ETH
- Use gas estimation: `npx hardhat run scripts/estimate-gas.js`

**"Contract verification fails"**
- Verify Etherscan API key is correct
- Wait a few minutes after deployment
- Check contract source code matches deployed bytecode

---

## 🧪 Testing Philosophy

### Why These Testing Approaches?

```javascript
// Unit Tests (contracts)
test/PatentNFT.test.cjs - Tests individual contract functions
├── Can user mint NFT?
├── Is patent uniqueness enforced?  
├── Do fees get collected properly?
└── Access controls working?

// Integration Tests
test/Integration.test.cjs - Tests contract interactions
├── Mint NFT → List on marketplace → Buy NFT
├── PSP token purchase → Pay for search
└── End-to-end user flows

// Frontend Testing (manual for now)
├── MetaMask connection flows
├── User interface responsiveness
└── Error handling and edge cases
```

---

## 📊 Performance Considerations

### Gas Optimization Strategies

```solidity
// Instead of storing strings on chain (expensive)
mapping(string => bool) public patentExists; // ❌ Expensive

// Store hash of string (much cheaper)
mapping(bytes32 => bool) public patentExistsHash; // ✅ Cheaper
function patentExists(string memory patent) public view returns (bool) {
  return patentExistsHash[keccak256(abi.encodePacked(patent))];
}
```

### Frontend Performance

```typescript
// Pagination reduces initial load time
const PATENTS_PER_PAGE = 20; // Instead of loading 1000+ patents at once

// Lazy loading for images
<img loading="lazy" src={nft.imageUrl} />

// React.memo for expensive components  
const NFTCard = React.memo(({ nft }) => {
  // Only re-renders if nft prop changes
});
```

---

## 🔮 Future Scalability

### Database Integration (Next Steps)

**Current**: In-memory metadata storage
**Future**: PostgreSQL with indexed searches

```sql
-- Optimized for patent search
CREATE TABLE patent_nfts (
  patent_number VARCHAR(50) PRIMARY KEY,
  title TEXT,
  inventor VARCHAR(255),
  ipfs_image_hash VARCHAR(100),
  ipfs_pdf_hash VARCHAR(100),
  created_at TIMESTAMP
);

CREATE INDEX idx_patent_title ON patent_nfts(title);
CREATE INDEX idx_patent_inventor ON patent_nfts(inventor);
```

### Microservices Architecture (Future)

```
Current: Monolithic Backend
├── Express.js handles everything
└── Single point of failure

Future: Microservices
├── Patent API Service (patent data)
├── IPFS Service (file storage)  
├── Metadata Service (NFT metadata)
├── Analytics Service (usage tracking)
└── Notification Service (WebSocket)
```

---

## 🤝 Contributing Guidelines

### Code Organization Principles

1. **Each file has single responsibility**
2. **Services handle business logic, components handle UI**  
3. **All external API calls go through service layer**
4. **Error handling at service level, not component level**
5. **TypeScript interfaces for all data structures**

### Adding New Features

```typescript
// 1. Add to types/index.ts
export interface NewFeature {
  id: string;
  name: string;
}

// 2. Create service
class NewFeatureService {
  async getNewFeature(): Promise<NewFeature> {
    // Business logic here
  }
}

// 3. Create modal component (preferred UX pattern)
const NewFeatureModal = ({ isOpen, onClose, onSuccess }) => {
  const [data, setData] = useState<NewFeature>();
  
  const handleSubmit = async () => {
    const result = await newFeatureService.processNewFeature(data);
    if (result.success) {
      toast.success('Feature completed!');
      onClose();
      if (onSuccess) onSuccess();
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="modal-backdrop">
          <motion.div className="modal-content">
            {/* Feature UI */}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// 4. Integrate with existing pages
const SomePage = () => {
  const [showNewFeatureModal, setShowNewFeatureModal] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowNewFeatureModal(true)}>
        New Feature
      </button>
      <NewFeatureModal
        isOpen={showNewFeatureModal}
        onClose={() => setShowNewFeatureModal(false)}
        onSuccess={handleFeatureSuccess}
      />
    </div>
  );
};
```

---

## 🎓 Learning Resources

### Understanding This Codebase

1. **Start with**: `src/pages/` - See the main user flows
2. **Then explore**: `src/services/` - Understand the business logic  
3. **Finally dive into**: `contracts/` - See the blockchain layer

### Web3 Development Concepts

- **ethers.js**: JavaScript library for Ethereum interaction
- **MetaMask**: Browser wallet for signing transactions
- **IPFS**: Decentralized file storage network
- **ERC721**: NFT standard on Ethereum
- **ERC20**: Fungible token standard (for PSP tokens)

### React/Frontend Concepts

- **Context API**: Global state management
- **Custom Hooks**: Reusable stateful logic
- **Service Layer**: Separation of business logic from UI

---

This architecture enables the Patent NFT Marketplace to achieve its goals through:

✅ **Global Patent Access**: Backend proxy + Google Patents API integration (real data only)  
✅ **NFT Uniqueness**: Smart contract enforcement with `patentExists` mapping  
✅ **Visual Differentiation**: Single-page PDF extraction and compression via IPFS (no image conversion - maintains authentic document format)  
✅ **Scalable Marketplace**: Pagination + real contract data  
✅ **Revenue Generation**: Multi-layer fee collection (minting + marketplace)  
✅ **Multi-token Support**: Flexible payment system with PSP tokens  
✅ **Seamless UX**: Modal-based interactions replace disruptive page redirects  
✅ **Production Ready**: Modular deployment system with proper smart contract architecture  
✅ **Buy Now Functionality**: Complete NFT purchasing workflow with smart contract integration  
✅ **Real API Data**: No mock data - exclusive use of Google Patents via SerpApi  
✅ **Rich Metadata System**: NFTs display actual patent titles, inventors, and information instead of generic placeholders  
✅ **Enhanced User Experience**: Marketplace shows "Method and System for..." instead of "Untitled Patent #1"  
✅ **Payable Minting**: Secure 0.05 ETH minting with proper access controls and withdrawal functions  

The modular, service-oriented architecture allows each component to excel at its specific responsibility while maintaining clean integration points between frontend, backend, and blockchain layers. The enhanced metadata system ensures users see professional, accurate patent information throughout the entire application experience.