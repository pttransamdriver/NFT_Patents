# 🏛️ Patent NFT Marketplace

A **proof-of-concept Web3 application** that demonstrates how patents can be tokenized, traded, and discovered through decentralized technology.

This project integrates the **Google Patents database** with blockchain smart contracts to allow users to:

1. **Search Patents** – Query global patents through the Google Patents API.
2. **Mint NFTs** – Turn a patent into a non-fungible token by storing its **title**, **patent ID**, and the **first page of its PDF** on IPFS.
3. **Trade Patents** – List, buy, and sell tokenized patents on a decentralized marketplace using ETH, USDC, or PSP tokens.
4. **AI-Assisted Search** – Use AI search tools to **augment professional searches**, providing inventors with early insights before committing to expensive legal research.

⚠️ **Disclaimer:** These NFTs are **representations of publicly available patents** and **do not grant legal ownership** of the underlying intellectual property. This marketplace is a **technical proof-of-concept** showcasing how patents *could* be managed on-chain in the future.

## 🎓 Proof-of-Concept Status

This project is a **demonstration/portfolio project** built to showcase Web3 development skills. It includes:

✅ **Fully Functional**:
- Smart contract deployment (Hardhat local & Sepolia testnet)
- NFT minting with patent metadata
- IPFS integration (Pinata)
- Marketplace listing and buying
- Multi-token payment support (ETH, USDC, PSP)
- Rich metadata display from Google Patents API

🚧 **Proof-of-Concept / Optional Features**:
- **AI Search**: Basic keyword processing with optional AI enhancement. Can be upgraded to real AI (OpenAI/Gemini) by adding API keys - see [AI Search Configuration](#-optional-ai-powered-search)
- **Make Offer System**: Basic UI framework in place, smart contract implementation planned for future release
- **Price History**: Framework in place, blockchain event tracking not yet implemented

This architecture demonstrates **graceful degradation** - the app works great with basic features and can be enhanced with optional paid services (AI APIs) based on user preference.

👉 For a detailed architectural and code-level walkthrough, see [TEACHME.md](./TEACHME.md).

---

## 📋 Table of Contents

* [🎓 Proof-of-Concept Status](#-proof-of-concept-status)
* [🏗️ Architecture Overview](#-architecture-overview)
* [🚀 Quick Start](#-quick-start)
* [💾 Smart Contracts](#-smart-contracts)
* [🌐 Backend API](#-backend-api)
* [⚛️ Frontend Application](#-frontend-application)
* [🏪 Marketplace & IPFS Integration](#-marketplace--ipfs-integration)
* [🔧 Configuration](#-configuration)
  * [🤖 Optional: AI-Powered Search](#-optional-ai-powered-search)
* [🧪 Testing](#-testing)
* [📡 API Integration](#-api-integration)
* [🔒 Security Features](#-security-features)
* [📚 Developer Guide](#-developer-guide)
* [🚀 Deployment Guide](#-deployment-guide)
* [🤝 Contributing](#-contributing)
* [📄 License](#-license)
* [🙏 Acknowledgments](#-acknowledgments)

---

## 🏗️ Architecture Overview

The Patent NFT Marketplace consists of three main components and two external dependencies:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │  Smart Contracts│
│   (React/Vite)  │◄──►│   (Express.js)  │    │   (Solidity)    │
│                 │    │                 │    │                 │
│ - User Interface│    │ - CORS Proxy    │    │ - PatentNFT     │
│ - Web3 Wallets  │    │ - Patent Search │    │ - PSPToken      │
│ - NFT Minting   │    │ - Data Transform│    │ - SearchPayment │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web3 Wallet   │    │ Google Patents  │    │   Blockchain    │
│   (MetaMask)    │    │     API         │    │  (Local/Sepolia)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Features

* 🌍 **Global Patent Search**: Query worldwide patents through Google Patents
* 💎 **NFT Minting**: Convert the first page of patent PDFs into NFT assets (stored on IPFS)
* 📄 **Rich Patent Metadata**: NFTs include actual patent titles, numbers, inventors, assignees, filing dates, and descriptions from search results
* 🏪 **Enhanced Marketplace**: Trade patent NFTs with proper patent information displayed (no more "Untitled Patent #1")
* 💰 **Multi-Token Payments**: ETH, USDC, PSP tokens supported with secure payable minting (0.05 ETH)
* 🔒 **Smart Contract Security**: ReentrancyGuard, Pausable, access controls
* 📱 **Responsive UI**: Modern React + Tailwind design
* 🔍 **Patent Uniqueness**: Prevents duplicate minting on-chain
* 🤖 **AI Search**: Early-stage AI search to augment professional searches

---

## 🚀 Quick Start

### Prerequisites

* Node.js 18+ and npm
* MetaMask browser extension
* Git

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd NFT_Patents

# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Copy environment configs
cp .env.example .env
cp backend/.env.example backend/.env
```

### Running Locally

```bash
# Terminal 1: Start local blockchain
npx hardhat node

# Terminal 2: Deploy contracts (recommended - individual deployment)
npm run deploy:psp
npm run deploy:search
npm run deploy:nft
npm run deploy:marketplace

# Alternative: Deploy all at once (modern method)
npm run deploy

# Alternative: Deploy all at once (legacy method)
npm run deploy:legacy

# Terminal 3: Start backend API
cd backend && npm start

# Terminal 4: Start frontend
npm run dev
```

Access locally:

* Frontend: [http://localhost:5173](http://localhost:5173)
* Backend: [http://localhost:3001](http://localhost:3001)
* Health Check: [http://localhost:3001/api/health](http://localhost:3001/api/health)

---

## 💾 Smart Contracts

### NFT Marketplace Contract
- Keep track of NFTs minted to prevent duplicates by using Patent ID in the JSON file
- List, buy, and sell NFTs
- 2.5% platform fee on sales
- Supports ETH, USDC, PSP payments
- Display user NFTs and marketplace listingss

### PatentNFT Contract

* ERC721-compliant NFT contract with payable minting (0.05 ETH)
* Rich metadata includes actual patent titles, numbers, inventors, assignees, filing dates, and status
* Tracks uniqueness (no duplicate minting via patent number normalization)
* Metadata stored via backend API endpoints with full patent information
* Both public payable minting and admin-only minting functions
* Built-in withdrawal and price management functions

### PSPToken Contract

* ERC20 utility token for search payments
* 1 PSP = \$0.01 equivalent
* Burnable, capped supply, owner mintable
* Supports redeeming and authorized spending

### SearchPayment Contract

* Supports multi-token payments (ETH, USDC, PSP)
* Allocates search credits for AI queries
* Tracks user stats and payment history
* Rate-limiting protection

---

## 🌐 Backend API

The backend is deployed on **Vercel** at: `https://nft-patents-backend.vercel.app`

### API Endpoints

* **Patent Search**: `/api/patents/search?criteria=<query>` → returns Google Patents results via SerpAPI
* **Patent Search (Legacy)**: `/api/uspto/search?criteria=<query>` → compatibility endpoint, same functionality
* **Patent Verification**: `/api/patents/verify/:patentNumber` → verify and get full patent details
* **Patent Details**: `/api/uspto/patent/:id` → get specific patent information
* **NFT Metadata**: `/api/metadata/:patentNumber` → stores and serves rich NFT metadata with patent information
* **PDF Processing**: `/api/pdf/process-patent` → handles patent PDF processing for IPFS
* **Health Check**: `/api/health` → backend + SerpAPI status

**CORS Proxy**: Handles frontend → Google Patents API requests server-side.
**Enhanced Metadata**: Stores full patent information (title, inventor, assignee, etc.) for proper marketplace display.
**Production URL**: Backend is deployed and accessible at `https://nft-patents-backend.vercel.app`

---

## ⚛️ Frontend Application

* Built with React + Vite + Tailwind
* Components for search, marketplace, wallet integration
* Context providers for Web3 and wallet state
* Services for API, payments, minting
* Uses a **service-layer pattern** to keep code modular and scalable

**Pages:**

* Home Page: Expresses the vision and key features
* PatentSearchPage: General Patent Search and AI assisted Patent search like a patent lawyer
* MintNFTPage: Takes any patent you searched for and mints it into an NFT. One patent = one NFT with no duplicates verified on the blockchain.
* MarketplacePage: Buy or sell NFTs that others or yourself have minted. 

---

## 🏪 Marketplace & IPFS Integration

* **Listings**: Real-time NFT sales, pagination (20 per page)
* **Buy Now**: Purchase directly with ETH/USDC/PSP
* **Rich Patent Metadata**: Real patent titles, numbers, inventors, assignees, filing dates, and descriptions
* **IPFS Storage**: PDF front pages stored on decentralized IPFS
* **Enhanced Display**: Marketplace shows actual patent information instead of generic "Untitled Patent" labels
* **Flows Supported**: Search → Mint with Rich Data → List → Buy → Secondary Trade

---

## User Flows:
1. **Search Patents**: Use the search bar to find patents by keywords, inventors, or patent IDs.
2. **Mint Patent NFT**: Select a patent from the search results and mint it as an NFT (0.05 ETH). The system captures the full patent information (title, inventor, assignee, filing date, etc.) and stores the first page PDF on IPFS.
3. **Enhanced Metadata**: NFTs now include rich metadata with actual patent titles and information instead of generic placeholders.
4. **List NFT for Sale**: After minting, list your Patent NFT on the marketplace with a set price - now displaying proper patent titles.
5. **Buy NFT**: Browse the marketplace and see real patent information - titles, inventors, patent numbers, etc.
6. **View Owned NFTs**: Check your wallet to see all the Patent NFTs you own with full patent details.
7. **View Marketplace**: Browse the marketplace to see all Patent NFTs with their actual patent titles and information. 

---

## 🔧 Configuration

* **Frontend**: `.env` stores contract addresses, API endpoints, SerpAPI key
* **Backend**: `backend/.env` stores server port, SerpAPI key, CORS origin for Vercel
* **Hardhat**: Configurable for localhost + Sepolia testnet
* **Deployment**: Vercel configuration files for frontend and backend deployment

### 🤖 Optional: AI-Powered Search

The project includes advanced AI search capabilities with automatic fallback:

**Current Behavior (Default)**:
- Uses enhanced rule-based keyword expansion
- Free, fast, no external dependencies
- Works well for patent searches

**To Enable Real AI Search**:

1. **Option A: Google Gemini (Free)**
   - Get free API key: https://makersuite.google.com/app/apikey
   - Add to `.env`:
     ```bash
     VITE_GEMINI_API_KEY=your_key_here
     ```

2. **Option B: OpenAI GPT-3.5 (Paid)**
   - Get API key: https://platform.openai.com/api-keys
   - Costs ~$0.002 per search
   - Add to `.env`:
     ```bash
     VITE_OPENAI_API_KEY=sk-proj-your_key_here
     ```

3. **Restart frontend**: `npm run dev`

The system automatically detects API keys and switches from rule-based to AI-powered search. This demonstrates **graceful degradation** - users can choose between free basic search or enhanced AI search based on their needs.

---

## 🧪 Testing

* Unit tests for smart contracts (minting, payments, security)
* Integration tests across contracts
* Security tests for reentrancy and access controls

Run tests:

```bash
npm run test
npm run test:contracts
npm run test:integration
```

---

## 📡 API Integration

* **Current Source**: Google Patents (via SerpAPI)
* **API Provider**: SerpAPI - provides structured Google Patents data
* **Data Flow**: Frontend → Backend (Vercel) → SerpAPI → Google Patents → NFT minting
* **Rate Limiting**: Backend enforces rate limits (10 searches/minute) to protect API usage
* **Environment Variables**:
  - `SERPAPI_KEY` - Required for patent search functionality
  - `CORS_ORIGIN` - Required for Vercel backend CORS configuration

---

## 🔒 Security Features

* **ReentrancyGuard** for ETH withdrawals
* **Access Control** for owner-only methods
* **Pausable Contracts** for emergency halts
* **Input Validation** for patent IDs and transactions

---

## 📚 Developer Guide

### Project Structure

```
NFT_Patents/
├── contracts/        # Smart contracts
├── backend/          # Backend API
├── src/              # Frontend
├── test/             # Hardhat tests
├── scripts/          # Deployment scripts
└── .env.example      # Environment variables
```

### Adding New Patent Sources

* Extend backend to call new APIs
* Update frontend service to handle new data formats

### Extending Payment Methods

* Add new token support in SearchPayment contract
* Extend PaymentService in frontend

### Debugging & Troubleshooting

#### Common Issues & Solutions

**NFT Minting Errors:**
* **"could not decode result data"** - The app will automatically switch MetaMask to the correct network (Hardhat Local, Chain ID: 31337)
* **Network switching** - If prompted, allow MetaMask to add/switch to the Hardhat network
* **Contract connection issues** - Check browser console for detailed network and contract logs

**General Issues:**
* CORS errors - Ensure backend is running on port 3001
* Insufficient funds - Use Hardhat test accounts with pre-funded ETH
* API timeouts - Check SerpApi key configuration and network connectivity
* Use Hardhat scripts + backend logs for detailed troubleshooting

---

## 🚀 Deployment Guide

### Smart Contract Deployment

* Supports **Sepolia Testnet** and **Mainnet**
* Deploy contracts individually for best results using modular scripts
* Update frontend `.env` with deployed contract addresses
* Verify contracts with Hardhat + Etherscan

### Vercel Deployment (Frontend & Backend)

**Backend Deployment (Critical: Set up Vercel KV first!):**

1. **Install backend dependencies:**
   ```bash
   cd backend
   npm install  # Installs @vercel/kv and other dependencies
   ```

2. **Set up Vercel KV Storage (REQUIRED for production):**
   - Go to https://vercel.com/dashboard
   - Select your backend project (or create it first)
   - Navigate to: **Storage** → **Create Database** → **KV**
   - Create a new KV database (name it: `patent-nft-metadata`)
   - Vercel automatically adds these environment variables to your project:
     - `KV_REST_API_URL`
     - `KV_REST_API_TOKEN`
     - `KV_REST_API_READ_ONLY_TOKEN`

3. **Configure additional environment variables in Vercel:**
   - `SERPAPI_KEY` - Your SerpAPI key for patent search
   - `CORS_ORIGIN` - Your frontend URL (e.g., `https://nft-patents.vercel.app`)
   - `NODE_ENV=production`

4. **Deploy backend:**
   ```bash
   vercel --prod
   ```

5. **Verify KV is working:**
   ```bash
   curl https://nft-patents-backend.vercel.app/api/health
   ```
   Should return:
   ```json
   {
     "status": "OK",
     "storage": "Vercel KV (persistent)",
     "kvEnabled": true
   }
   ```

**Frontend Deployment:**
1. Push to GitHub repository
2. Import project in Vercel dashboard
3. Configure environment variables in Vercel:
   - All `VITE_*` variables from `.env`
   - Contract addresses from deployment
   - `VITE_API_BASE_URL=https://nft-patents-backend.vercel.app`
4. Deploy automatically on push to main branch

**Deployment URLs:**
- Frontend: `https://nft-patents.vercel.app`
- Backend: `https://nft-patents-backend.vercel.app`

**⚠️ Important Notes:**
- **Vercel KV is FREE** for the starter tier (256 MB storage, 30,000 commands/month)
- Without KV, metadata is stored in-memory and **lost on server restarts**
- This causes "My NFTs" modal and marketplace to show generic names instead of real patent titles
- After enabling KV, **re-mint any existing NFTs** to store their metadata persistently

---

## 🚧 Future Features

### Make Offer System
A comprehensive offer system is planned for future development:

* **Smart Contract Integration**: Extend NFTMarketplace.sol with offer functionality
* **Offer Storage**: Store offers on-chain with escrow functionality
* **Offer Management**: UI for viewing, accepting, declining, and tracking offers
* **Offer Notifications**: Alert system for new offers and status updates
* **Bid History**: Track all offers made on each NFT
* **Auto-expiring Offers**: Time-limited offers with automatic expiration
* **Counter-offers**: Allow sellers to propose alternative prices

This would enable more flexible price discovery and negotiation between buyers and sellers, similar to traditional auction platforms but with blockchain transparency and security.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your branch
5. Open a Pull Request

---

## 📄 License

MIT License. See [LICENSE](LICENSE).

---

## 🙏 Acknowledgments

* OpenZeppelin for contract libraries
* Hardhat team for development framework
* Google Patents + SerpAPI for patent data
* Vercel for deployment and hosting
* React + Vite + Tailwind ecosystem

---

**Built with ❤️ to explore the future of intellectual property trading through Web3**