# 📚 TEACH ME: Patent NFT Marketplace - Complete Architecture & Execution Guide

This document explains how the Patent NFT Marketplace is structured, why it's built this way, and **exactly which files are called during each user interaction**. Perfect for becoming a subject matter expert.

---

## 📖 How to Use This Guide

**For Quiz Preparation:**
1. Start with "Project Goals & Vision" to understand WHY
2. Study "Architecture Overview" to understand WHAT
3. **Focus on "Complete File Execution Flows"** to understand HOW (most important for quiz)
4. Review "Quiz Preparation" section at the end

**For Development:**
- Reference the "Project Structure" section to find files
- Use "File Execution Flows" to trace bugs and understand data flow
- Check "Deployment" section for environment setup

---

## 🎯 Project Goals & Vision

**Main Goal**: Create a decentralized marketplace where real patents can be converted into NFTs and traded, with proper verification and fee collection.

**Key Requirements**:
- Convert real patents from patent offices into tradeable NFTs
- **PDF-First Approach**: Extract and compress only the front page of each patent's PDF
- **Use PDF as NFT Image**: Store single-page PDF on IPFS (maintains authentic document format)
- Ensure each patent can only be minted once (global uniqueness)
- Collect fees (0.05 ETH minting + 2.5% marketplace)
- Support multiple payment methods (ETH, USDC, Patent Pennies/PSP tokens)
- Scale to handle thousands of patents and users

---

## 🏗️ Architecture Overview

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Pages     │  │  Services   │  │      Components     │  │
│  │             │  │             │  │                     │  │
│  │ Search      │  │ Patent API  │  │ NFT Cards           │  │
│  │ Mint        │  │ Minting     │  │ Modals              │  │
│  │ Marketplace │  │ Marketplace │  │ Header/Footer       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Express.js)                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │ CORS Proxy      │  │ IPFS Uploads    │  │ PDF Process │  │
│  │ Google Patents  │  │ Pinata/IPFS     │  │ Placeholder │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 BLOCKCHAIN (Ethereum/Sepolia)               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ PatentNFT   │  │ PSPToken    │  │ NFTMarketplace      │  │
│  │ Mint NFTs   │  │ AI Search $ │  │ List & Buy NFTs     │  │
│  │ Uniqueness  │  │ ERC20       │  │ 2.5% Platform Fee   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Why This Structure?

1. **Frontend (React)**: Handles user interaction and Web3 wallet integration
2. **Backend (Express)**: Solves CORS issues, handles PDF processing, proxies IPFS uploads
3. **Blockchain (Smart Contracts)**: Provides immutable storage and trustless transactions

**Key Design Principle: Service Layer Pattern**
- Pages call Services (not APIs directly)
- Services handle all business logic
- Utils provide helper functions

---

## 🔄 COMPLETE FILE EXECUTION FLOWS

This is the **most important section for understanding how the project works**. Each flow shows exactly which files are called when users interact with the app.

### 📖 Legend
- **📄** Page components (user interface)
- **⚙️** Service files (business logic)
- **🌐** Backend API routes
- **⛓️** Smart contract functions
- **🔌** External APIs (Google Patents, IPFS/Pinata)

---

### 🔍 FLOW 1: Searching for Patents

**User Action:** User types "artificial intelligence" and clicks "Search"

```
📄 src/pages/PatentSearchPage.tsx:33 (handleSearch)
   ↓ User clicks search button
   ↓
⚙️ src/services/patentApi.ts:34 (searchPatents)
   ↓ patentApi.searchPatents({ query: "artificial intelligence", rows: 20 })
   ↓
🌐 backend/routes/patents.js:62 (GET /api/patents/search)
   ↓ Receives: /api/patents/search?criteria=artificial+intelligence
   ↓
🔌 Google Patents via SerpAPI
   ↓ backend/routes/patents.js:80 calls SerpAPI
   ↓
🌐 backend/routes/patents.js:92
   ↓ Returns patent results to frontend
   ↓
⚙️ src/services/patentApi.ts:53-66
   ↓ Processes response, transforms data, checks blockchain
   ↓
⛓️ contracts/PatentNFT.sol:97 (patentExists)
   ↓ Check if each patent is already minted
   ↓
📄 src/pages/PatentSearchPage.tsx:45
   ↓ Updates UI, shows "Found 20 patents!", displays cards
```

**Files Touched:**
1. `src/pages/PatentSearchPage.tsx` - User input
2. `src/services/patentApi.ts` - API service
3. `backend/routes/patents.js` - Patent search endpoint
4. SerpAPI (external) - Google Patents data
5. `src/utils/contracts.ts` - Blockchain check
6. `contracts/PatentNFT.sol` - Smart contract

---

### 🎨 FLOW 2: Minting a Patent NFT

**User Action:** User clicks "Mint NFT" button on a patent card

```
📄 src/pages/PatentSearchPage.tsx:122 (handleMintNFT)
   ↓ Checks wallet is connected
   ↓
⚙️ src/services/mintingService.ts:48 (mintPatentNFT)
   ↓
   Step 1: Validate patent data (lines 51-71)
   - Title is not "Untitled"
   - Inventor is not "Unknown"
   ↓
⚙️ src/utils/web3Utils.ts
   ↓ Step 2: Verify MetaMask connection (line 74)
   ↓ Step 3: Check/switch network (line 83)
   ↓
⚙️ src/services/patentPdfService.ts (processPatentForNFT)
   ↓ Step 4: Process patent PDF
   ↓
🌐 backend/routes/pdf.js:8 (POST /api/pdf/process-patent)
   ↓ Generates placeholder PDF, returns IPFS URL
   ↓
⚙️ src/services/mintingService.ts:100-143
   ↓
   Step 5: Create NFT metadata JSON
   {
     name: patent.title,
     description: patent.abstract,
     image: imageUrl (IPFS),
     attributes: [
       { trait_type: "Patent Number", value: "US1234567" },
       { trait_type: "Inventor", value: "John Doe" },
       { trait_type: "Filing Date", value: "2020-01-15" },
       ...
     ]
   }
   ↓
🌐 backend/routes/ipfs.js:67 (POST /api/pinata/upload-json)
   ↓ Step 6: Upload metadata to IPFS via Pinata
   ↓
🔌 Pinata IPFS
   ↓ Returns ipfsHash: "QmX1234..."
   ↓
⚙️ src/utils/contracts.ts (getPatentNFTContract)
   ↓ Step 7: Get contract instance with signer
   ↓
⛓️ contracts/PatentNFT.sol:52 (mintPatentNFT)
   ↓
   Smart contract execution:
   - Line 53: Verify payment >= 0.05 ETH
   - Line 57: Verify patent not already minted
   - Line 59: Increment token ID
   - Line 60: Mint NFT to user
   - Line 63: Set IPFS URI: "ipfs://QmX1234..."
   - Line 66: Record patent → tokenId mapping
   - Line 68: Emit PatentMinted event
   ↓
📄 src/pages/PatentSearchPage.tsx:138-147
   ↓ Step 8: Show success, update UI, disable mint button
```

**Files Touched:**
1. `src/pages/PatentSearchPage.tsx` - Mint button
2. `src/services/mintingService.ts` - Minting orchestration
3. `src/utils/web3Utils.ts` - Wallet/network verification
4. `src/services/patentPdfService.ts` - PDF processing
5. `backend/routes/pdf.js` - PDF generation
6. `backend/routes/ipfs.js` - IPFS upload proxy
7. Pinata API (external) - Storage
8. `src/utils/contracts.ts` - Contract instance
9. `contracts/PatentNFT.sol` - NFT minting on blockchain
10. Back to page - UI update

---

### 🛒 FLOW 3: Viewing Marketplace Listings

**User Action:** User navigates to /marketplace page

```
📄 src/App.tsx:27
   ↓ Route: /marketplace → <MarketplacePage />
   ↓
📄 src/pages/MarketplacePage.tsx:47 (useEffect)
   ↓ Component mounts → loadListings()
   ↓
⚙️ src/services/marketplaceService.ts:75 (getMarketplaceListings)
   ↓ Step 1: Create provider connection
   ↓
⚙️ src/utils/web3Utils.ts (createProvider)
   ↓ Connects to Ethereum network
   ↓
⛓️ contracts/NFTMarketplace.sol (getAllActiveListings)
   ↓ Step 2: Call smart contract
   ↓
   Returns array of listings:
   [
     { listingId: 1, tokenId: 3, price: 1000000000000000000, seller: "0x...", active: true },
     ...
   ]
   ↓
   Step 3: For each listing, fetch NFT metadata
   ↓
⛓️ contracts/PatentNFT.sol (tokenURI)
   ↓ Get metadata URI: "ipfs://QmX1234..."
   ↓
🔌 IPFS Gateway
   ↓ Fetch metadata from https://ipfs.io/ipfs/QmX1234...
   ↓
   Returns:
   {
     name: "Method and System for AI Processing",
     description: "Patent abstract...",
     image: "ipfs://QmY5678...",
     attributes: [
       { trait_type: "Patent Number", value: "US1234567" },
       { trait_type: "Inventor", value: "Jane Smith" },
       ...
     ]
   }
   ↓
⚙️ src/services/marketplaceService.ts:145-176
   ↓ Step 4: Extract patent data from metadata
   ↓ Step 5: Format listing with patent info
   ↓ Step 6: Apply pagination
   ↓
📄 src/pages/MarketplacePage.tsx:75-81
   ↓ Step 7: Update UI, render NFT cards
```

**Files Touched:**
1. `src/App.tsx` - Route
2. `src/pages/MarketplacePage.tsx` - Page
3. `src/services/marketplaceService.ts` - Marketplace logic
4. `src/utils/web3Utils.ts` - Provider
5. `contracts/NFTMarketplace.sol` - Get listings
6. `contracts/PatentNFT.sol` - Get token URIs
7. IPFS Gateway (external) - Fetch metadata
8. Back to service - Process data
9. Back to page - Display

---

### 💰 FLOW 4: Buying an NFT

**User Action:** User clicks "Buy Now" on a marketplace listing

```
📄 src/pages/MarketplacePage.tsx:116 (handleBuyNFT)
   ↓ Checks wallet connected, shows confirmation
   ↓
⚙️ src/services/marketplaceService.ts:230 (buyNFT)
   ↓ Step 1: Verify wallet connection
   ↓ Step 2: Get signer (authenticated user)
   ↓ Step 3: Get marketplace contract with signer
   ↓
⛓️ contracts/NFTMarketplace.sol (buyNFT)
   ↓
   Smart contract execution:
   - Line 123: Verify listing exists and active
   - Line 124: Verify payment matches price
   - Line 125: Verify buyer ≠ seller
   - Line 128: Mark listing inactive
   - Line 131: Calculate fees (2.5% platform)
   - Line 132: Transfer NFT to buyer
   - Line 135: Pay seller (97.5%)
   - Line 136: Pay platform (2.5%)
   - Line 139: Emit NFTSold event
   ↓
📄 src/pages/MarketplacePage.tsx:135-145
   ↓ Show success toast, reload listings, remove purchased NFT
```

**Files Touched:**
1. `src/pages/MarketplacePage.tsx` - Buy button
2. `src/services/marketplaceService.ts` - Purchase logic
3. `src/utils/web3Utils.ts` - Wallet verification
4. `contracts/NFTMarketplace.sol` - Execute purchase
5. `contracts/PatentNFT.sol` - Transfer ownership
6. Back to page - UI update

---

### 📝 FLOW 5: Listing an NFT for Sale

**User Action:** User clicks "List for Sale" on their owned NFT

```
📄 src/components/modals/ListNFTModal.tsx:35 (handleList)
   ↓ User enters price, clicks "List NFT"
   ↓
⚙️ src/services/marketplaceService.ts:195 (listNFT)
   ↓ Step 1: Validate inputs
   ↓ Step 2: Get signer
   ↓ Step 3: Get contract instances
   ↓
⛓️ contracts/PatentNFT.sol (approve)
   ↓
   Step 4: Approve marketplace to transfer NFT
   const approveTx = await patentNFTContract.approve(marketplaceAddress, tokenId)
   ↓
⛓️ contracts/NFTMarketplace.sol (listNFT)
   ↓
   Step 5: Create marketplace listing
   Smart contract execution:
   - Line 92: Verify price > 0
   - Line 93: Verify caller owns NFT
   - Line 94: Verify marketplace approved
   - Line 97: Increment listing ID
   - Line 98: Create new listing struct
   - Line 106: Emit NFTListed event
   ↓
📄 src/components/modals/ListNFTModal.tsx:42-48
   ↓ Show success, close modal, refresh listings
```

**Files Touched:**
1. `src/components/modals/ListNFTModal.tsx` - Listing modal
2. `src/services/marketplaceService.ts` - Listing logic
3. `src/utils/web3Utils.ts` - Wallet verification
4. `contracts/PatentNFT.sol` - Approve transfer
5. `contracts/NFTMarketplace.sol` - Create listing
6. Back to modal - Success feedback

---

### 🤖 FLOW 6: AI-Powered Patent Search

**User Action:** User enters "Find patents about renewable energy from 2020-2023"

```
📄 src/pages/PatentSearchPage.tsx:64 (handleAiSearch)
   ↓ Opens AISearchModal for payment/API key
   ↓
📄 src/components/AISearchModal.tsx
   ↓ User selects payment option
   ↓
⚙️ src/services/aiSearchService.ts:30 (convertNaturalLanguageToSearch)
   ↓
🔌 OpenAI ChatGPT API
   ↓
   POST to: https://api.openai.com/v1/chat/completions
   {
     model: "gpt-3.5-turbo",
     messages: [
       { role: "system", content: "Convert natural language to patent search terms..." },
       { role: "user", content: "Find patents about renewable energy from 2020-2023" }
     ]
   }
   ↓
   AI Response:
   {
     searchTerms: "renewable energy solar wind (filing date: 2020-2023)",
     explanation: "Searching for renewable energy patents...",
     confidence: 85
   }
   ↓
⚙️ src/services/patentApi.ts:34 (searchPatents)
   ↓ Search with AI-generated terms
   ↓
🌐 backend/routes/patents.js:62 (GET /api/patents/search)
   ↓
🔌 Google Patents via SerpAPI
   ↓ Returns relevant results
   ↓
📄 src/pages/PatentSearchPage.tsx:91-103
   ↓ Display results with AI explanation badge and confidence score
```

**Files Touched:**
1. `src/pages/PatentSearchPage.tsx` - AI search trigger
2. `src/components/AISearchModal.tsx` - Payment modal
3. `src/services/aiSearchService.ts` - AI processing
4. OpenAI API (external) - Natural language processing
5. `src/services/patentApi.ts` - Patent search
6. `backend/routes/patents.js` - Patent API proxy
7. SerpAPI (external) - Patent data
8. Back to page - Display results

---

### 🔐 FLOW 7: Connecting MetaMask Wallet

**User Action:** User clicks "Connect Wallet" button in header

```
📄 src/components/layout/Header.tsx:45 (connectWallet)
   ↓
⚙️ src/contexts/Web3Context.tsx:40 (connectWallet)
   ↓ Step 1: Check if MetaMask installed
   ↓
⚙️ src/utils/metamask.ts:10 (isMetaMaskInstalled)
   ↓ typeof window.ethereum !== 'undefined'
   ↓
⚙️ src/utils/metamask.ts:25 (connectMetaMask)
   ↓
   Step 2: Request account access
   const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
   ↓
   MetaMask popup → User approves
   ↓
⚙️ src/contexts/Web3Context.tsx:45-55
   ↓ Step 3: Get provider and signer
   ↓ Step 4: Check network (switch if wrong)
   ↓
⚙️ src/utils/web3Utils.ts (switchToCorrectNetwork)
   ↓ Request network switch if needed
   ↓
⚙️ src/contexts/Web3Context.tsx:65-69
   ↓ Step 5: Update global state
   ↓ setAccount(address), setSigner(signer), setIsConnected(true)
   ↓
📄 src/components/layout/Header.tsx:52-57
   ↓ Show address "0x1234...5678", enable features, show success toast
```

**Files Touched:**
1. `src/components/layout/Header.tsx` - Connect button
2. `src/contexts/Web3Context.tsx` - Wallet context
3. `src/utils/metamask.ts` - MetaMask utilities
4. MetaMask Extension (external) - User authorization
5. `src/utils/web3Utils.ts` - Network verification
6. Back to context - State update
7. Back to header - UI update

---

### 📱 FLOW 8: Viewing User Profile & Owned NFTs

**User Action:** User navigates to /profile/:address

```
📄 src/App.tsx:30
   ↓ Route: /profile/:address → <UserProfilePage />
   ↓
📄 src/pages/UserProfilePage.tsx:35 (useEffect → loadUserNFTs)
   ↓
⚙️ src/utils/contracts.ts (getPatentNFTContract)
   ↓ Step 1: Get NFT contract instance
   ↓
⛓️ contracts/PatentNFT.sol (balanceOf)
   ↓ Step 2: Get number of NFTs owned
   ↓
   For each NFT (loop):
   ↓
⛓️ contracts/PatentNFT.sol (tokenOfOwnerByIndex)
   ↓ Step 3: Get token ID at index
   ↓
⛓️ contracts/PatentNFT.sol (tokenURI)
   ↓ Step 4: Get metadata URI: "ipfs://QmX1234..."
   ↓
🔌 IPFS Gateway
   ↓ Step 5: Fetch metadata from IPFS
   ↓
📄 src/pages/UserProfilePage.tsx:68-82
   ↓ Step 6: Build NFT object with title, inventor, image
   ↓
⚙️ src/services/marketplaceService.ts:48 (isNFTListed)
   ↓ Step 7: Check if listed for sale
   ↓
📄 src/pages/UserProfilePage.tsx:88-94
   ↓ Step 8: Update UI, render NFT cards with "List for Sale" button
```

**Files Touched:**
1. `src/App.tsx` - Route
2. `src/pages/UserProfilePage.tsx` - Profile page
3. `src/utils/contracts.ts` - Contract utilities
4. `contracts/PatentNFT.sol` - Query owned NFTs
5. IPFS Gateway (external) - Fetch metadata
6. `src/services/marketplaceService.ts` - Check listing status
7. Back to page - Display

---

### 🏥 FLOW 9: Health Check & System Status

**User Action:** Backend service starts or monitoring calls /api/health

```
🌐 backend/server.js:92
   ↓ Server starts on port 3001
   ↓
🌐 backend/routes/health.js:9 (GET /api/health)
   ↓
   Returns:
   {
     status: 'ok',
     timestamp: '2024-01-15T10:30:00.000Z',
     uptime: 3600,
     environment: 'production'
   }
   ↓
🌐 backend/routes/health.js:19 (GET /api/status)
   ↓ Detailed status check
   ↓
   Checks each service:
   - SERPAPI_KEY configured? → patents.enabled
   - PINATA_JWT configured? → ipfs.enabled
   - PDF service → pdf.enabled
   ↓
   Returns:
   {
     status: 'operational', // or 'degraded'
     services: { patents, ipfs, pdf },
     deployment: { platform: 'Vercel', region: 'us-east-1' },
     warnings: []
   }
```

**Files Touched:**
1. `backend/server.js` - Server initialization
2. `backend/routes/health.js` - Health endpoints

---

## 📊 Project Structure Reference

### Frontend (`src/`)

**Pages** (Full page components - routes)
- `HomePage.tsx` - Landing page
- `PatentSearchPage.tsx` - Patent search with AI
- `MintNFTPage.tsx` - NFT minting workflow
- `MarketplacePage.tsx` - Browse/buy NFTs
- `NFTDetailPage.tsx` - Individual NFT details
- `UserProfilePage.tsx` - User profile & owned NFTs
- `CreateListingPage.tsx` - Create marketplace listing

**Services** (Business logic - API calls & blockchain)
- `patentApi.ts` - Google Patents API integration
- `mintingService.ts` - NFT minting orchestration
- `marketplaceService.ts` - Marketplace interactions
- `patentPdfService.ts` - PDF processing & IPFS
- `aiSearchService.ts` - AI-powered search
- `paymentService.ts` - Payment processing
- `pspTokenService.ts` - PSP token management

**Utils** (Helper functions)
- `contracts.ts` - Smart contract utilities
- `web3Utils.ts` - Web3/blockchain utilities
- `metamask.ts` - MetaMask wallet utilities
- `contractABIs.ts` - Contract ABIs & interfaces
- `security.ts` - Security validation

**Contexts** (Global state)
- `Web3Context.tsx` - Wallet connection state
- `ThemeContext.tsx` - UI theme state
- `WalletContext.tsx` - Wallet state

**Components** (Reusable UI)
- `layout/Header.tsx` - Navigation & wallet
- `layout/Footer.tsx` - Site footer
- `marketplace/NFTCard.tsx` - NFT card display
- `modals/ListNFTModal.tsx` - List NFT for sale
- `modals/MyNFTsModal.tsx` - View owned NFTs
- `modals/NFTDetailModal.tsx` - NFT details popup
- `AISearchModal.tsx` - AI search payment modal

### Backend (`backend/`)

**Main Files**
- `server.js` - Express server entry point
- `routes/patents.js` - Patent search/verify endpoints
- `routes/ipfs.js` - IPFS upload proxy (Pinata)
- `routes/pdf.js` - PDF processing endpoints
- `routes/health.js` - Health check endpoints

### Smart Contracts (`contracts/`)

- `PatentNFT.sol` - ERC721 NFT with payable minting
- `NFTMarketplace.sol` - Secondary market (buy/sell)
- `PSPToken.sol` - ERC20 utility token
- `SearchPayment.sol` - Multi-token payment processing

### Testing (`test/`)

- `PatentNFT.test.js` - NFT contract unit tests
- `NFTMarketplace.test.js` - Marketplace tests
- `PSPToken.test.js` - PSP token tests
- `Integration.test.js` - End-to-end workflows

### Deployment (`scripts/`)

- `deploy/001_deploy_psp_token.js` - Deploy PSP token
- `deploy/002_deploy_search_payment.js` - Deploy search payment
- `deploy/003_deploy_patent_nft.js` - Deploy NFT contract
- `deploy/004_deploy_marketplace.js` - Deploy marketplace
- `verify-deployment.js` - Verify deployed contracts

---

## 🎯 Key Design Patterns

### 1. Service Layer Pattern

**Problem:** Pages cluttered with API calls and business logic

**Solution:** Extract all business logic into service classes

```typescript
// ❌ Before: Logic mixed in component
const MintNFTPage = () => {
  const mintNFT = async () => {
    const contract = new ethers.Contract(address, abi, signer);
    const tx = await contract.mintPatentNFT(...)
    // 50 lines of contract interaction code...
  }
}

// ✅ After: Clean separation
const MintNFTPage = () => {
  const mintNFT = async () => {
    const result = await mintingService.mintPatentNFT({
      patentNumber: patent.patentNumber,
      price: 0.1,
      userAddress: account,
      patentData: patent
    });
  }
}
```

### 2. Modal-Based UX Pattern

**Problem:** Page redirects disrupt user flow

**Solution:** Modal popups for seamless interactions

```typescript
// ❌ Before: Redirect to listing page
const handleListForSale = () => {
  navigate('/create-listing', { state: { nft } });
  // User loses context
};

// ✅ After: Modal-based listing
const handleListForSale = () => {
  setShowListModal(true); // Opens modal overlay
  // User stays on same page
};
```

### 3. Context Pattern for Global State

**Why:** Wallet connection needed across many components

```typescript
// Web3Context.tsx - Provides blockchain connection to entire app
export const Web3Provider = ({ children }) => {
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // Any component can access: const { signer, account } = useWeb3();
}
```

---

## 🔧 Backend Architecture

### Why We Need a Backend

**Problem 1: CORS**
```
Browser → Google Patents API ❌ BLOCKED
Browser → Our Backend → Google Patents API ✅ WORKS
```

**Problem 2: Security**
- Keep Pinata JWT secret (never expose to frontend)
- Rate limiting for expensive operations
- API key protection

**Problem 3: Processing**
- PDF extraction and compression
- IPFS uploads (large files)
- Patent data transformation

### Redis/Upstash Database Integration

**What is Redis?**
Redis is an in-memory database used for fast caching and temporary data storage. Upstash provides Redis as a managed service on Vercel.

**What We Use It For:**
1. **Search Result Caching** - Cache patent search results to reduce API calls to SerpAPI
2. **Session Management** - Store user session data temporarily
3. **Rate Limiting** - Track API calls per user to prevent abuse
4. **Temporary Data** - Store in-progress minting data, payment states
5. **Performance** - Reduce database queries and external API calls

**Environment Variables (Vercel):**
```
KV_URL                      # Redis connection URL (primary)
KV_REST_API_TOKEN          # Authentication token for REST API
KV_REST_API_READ_ONLY_TOKEN # Read-only token for queries
REDIS_URL                   # Alternative Redis connection URL
KV_REST_API_URL            # REST API endpoint for HTTP requests
```

**Example Use Cases:**
```javascript
// Cache patent search results for 1 hour
await redis.setex(`patents:${searchQuery}`, 3600, JSON.stringify(results));

// Track user search count for rate limiting
await redis.incr(`user:${userId}:searches`);

// Store temporary minting state
await redis.setex(`mint:${tokenId}`, 300, JSON.stringify(mintData));
```

**Benefits:**
- ⚡ **Fast:** In-memory storage (microseconds vs milliseconds)
- 💰 **Cost-effective:** Reduces expensive external API calls
- 🔒 **Secure:** Temporary data doesn't persist permanently
- 📊 **Scalable:** Handles thousands of concurrent users

### Backend API Routes

```javascript
// Patent verification & search
GET  /api/patents/search           # Search Google Patents
POST /api/patents/verify/:number   # Verify patent exists
GET  /api/patents/:id              # Get patent details

// IPFS uploads (Pinata proxy - keeps JWT safe)
POST /api/pinata/upload-file       # Upload file to IPFS
POST /api/pinata/upload-json       # Upload JSON to IPFS

// PDF processing
POST /api/pdf/process-patent       # Extract/compress patent PDFs
POST /api/pdf/generate-placeholder # Generate placeholder PDFs

// Health & monitoring
GET  /api/health                   # Health check
GET  /api/status                   # Detailed service status
```

---

## ⛓️ Smart Contract Architecture

### Why Multiple Contracts?

**Single Responsibility Principle:** Each contract has one main job

```solidity
PatentNFT.sol
├── Mints NFTs (0.05 ETH fee)
├── Tracks patent uniqueness
├── Manages metadata URIs
└── Fee withdrawal

PSPToken.sol
├── ERC20 token for AI search
├── Dynamic pricing (1 PSP = $0.01)
└── Authorized spender system

NFTMarketplace.sol
├── List NFTs for sale
├── Buy/sell functionality
├── Platform fee (2.5%)
└── Listing management
```

### Benefits of Separation

1. **Security:** Smaller = easier to audit
2. **Upgradability:** Can upgrade marketplace without touching NFT contract
3. **Gas Efficiency:** Users only interact with contracts they need
4. **Modularity:** Add features without changing core contracts

---

## 🚀 Deployment Strategy

### Contract Deployment Order

**Critical:** Deploy in this exact order (dependencies)

```bash
1. PSP Token (no dependencies)
   └── npm run deploy:psp localhost

2. SearchPayment (requires PSP Token address)
   └── npm run deploy:search localhost

3. PatentNFT (requires PSP Token address)
   └── npm run deploy:nft localhost

4. NFTMarketplace (requires PatentNFT address)
   └── npm run deploy:marketplace localhost
```

### Environment Variables

**Frontend (.env):**
```bash
VITE_CHAIN_ID=31337                # Localhost:31337, Sepolia:11155111
VITE_RPC_URL=http://127.0.0.1:8545
VITE_PATENT_NFT_ADDRESS=0x5FbDB...
VITE_MARKETPLACE_ADDRESS=0x...
VITE_PSP_TOKEN_ADDRESS=0x...
VITE_API_BASE_URL=http://localhost:3001
```

**Backend (backend/.env):**
```bash
SERPAPI_KEY=your_serpapi_key_here  # REQUIRED for patent search
PINATA_JWT=your_pinata_jwt_here    # REQUIRED for IPFS uploads
CORS_ORIGIN=http://localhost:5173
PORT=3001
NODE_ENV=development
```

### Deployment Commands

```bash
# Local development
npx hardhat node                     # Start local blockchain
npm run deploy:psp localhost         # Deploy PSP token
npm run deploy:search localhost      # Deploy search payment
npm run deploy:nft localhost         # Deploy NFT contract
npm run deploy:marketplace localhost # Deploy marketplace
npm run dev                          # Start frontend

# Testnet (Sepolia)
npm run deploy:psp sepolia
npm run deploy:search sepolia
npm run deploy:nft sepolia
npm run deploy:marketplace sepolia
npm run verify sepolia               # Verify on Etherscan
```

---

## 🎯 QUIZ PREPARATION: Key Concepts to Master

### 1. Three-Layer Architecture
- **Frontend (React):** User interface, client-side logic
- **Backend (Express):** API proxy, CORS handling, IPFS uploads
- **Blockchain (Solidity):** Immutable NFT storage, marketplace

### 2. Service Layer Pattern
- Pages call Services (not APIs directly)
- Services handle business logic and error handling
- Services interact with backend APIs and smart contracts

### 3. Data Flow Patterns

**Search Flow:**
```
User Input → Page → Service → Backend → External API → Backend → Service → Page → UI
```

**Minting Flow:**
```
User Click → Page → Service → PDF → IPFS Upload → Smart Contract → Blockchain → UI
```

**Marketplace Flow:**
```
Page Load → Service → Smart Contract Read → IPFS Fetch → Service → Page → Display
```

### 4. Critical Dependencies
- **MetaMask:** Required for all blockchain interactions
- **IPFS/Pinata:** Required for storing NFT images/metadata
- **SerpAPI:** Required for patent search data
- **Ethereum Network:** Required for NFT minting/trading

### 5. State Management
- **Web3Context:** Global wallet connection state
- **ThemeContext:** Global UI theme state
- **Component State:** Local UI state (loading, errors, data)

### 6. Error Handling Layers
1. **Frontend validation:** Empty inputs, invalid formats
2. **Service layer errors:** API failures, network issues
3. **Backend errors:** API rate limits, missing keys
4. **Smart contract reverts:** Insufficient payment, already minted

### 7. Key File Relationships

```
Pages → render UI, handle user input
Services → business logic, external calls
Utils → helper functions, contract interactions
Backend Routes → API endpoints, proxies
Smart Contracts → blockchain logic
```

---

## 📝 Common Quiz Questions & Answers

**Q: When a user searches for a patent, which files are called?**
A: PatentSearchPage → patentApi service → backend/routes/patents.js → SerpAPI → back through chain → display results

**Q: What happens between clicking "Mint NFT" and the NFT appearing on blockchain?**
A: 9 steps involving 10 files: Page → mintingService → web3Utils verification → patentPdfService → backend PDF → IPFS upload → contract interaction → blockchain → UI update

**Q: How does the marketplace fetch NFT metadata?**
A: Contract call getAllActiveListings → for each listing, get tokenURI from NFT contract → fetch from IPFS using that URI → extract patent data from metadata attributes

**Q: Which backend routes handle IPFS uploads?**
A: backend/routes/ipfs.js - POST /api/pinata/upload-file and POST /api/pinata/upload-json (proxies to Pinata, keeps JWT secret)

**Q: What smart contract functions are called during an NFT purchase?**
A: NFTMarketplace.buyNFT() → verifies payment → transfers NFT → calculates fees (2.5%) → pays seller (97.5%) → emits NFTSold event

**Q: Why do we have a backend instead of calling APIs directly?**
A: 3 reasons: (1) Bypass CORS restrictions (2) Keep API keys secret (3) Process PDFs and handle IPFS uploads

**Q: What's the service layer pattern?**
A: Pages call Services, Services handle business logic. Never call APIs or contracts directly from pages. Enables clean separation and reusable logic.

---

## ✅ Project Achievements

✅ **Global Patent Access:** Backend proxy + Google Patents via SerpAPI
✅ **NFT Uniqueness:** Smart contract enforcement with `patentExists` mapping
✅ **PDF-First Approach:** Single-page PDF on IPFS (authentic document format)
✅ **Scalable Marketplace:** Pagination + real contract data
✅ **Revenue Generation:** Multi-layer fees (0.05 ETH minting + 2.5% marketplace)
✅ **Multi-token Support:** Flexible payment (ETH, USDC, PSP tokens)
✅ **Seamless UX:** Modal-based interactions
✅ **Production Ready:** Modular deployment system
✅ **Real API Data:** Google Patents via SerpAPI (no mock data)
✅ **Rich Metadata:** Actual patent titles, inventors, dates (not "Untitled Patent #1")
✅ **Payable Minting:** Secure payment with proper access controls
