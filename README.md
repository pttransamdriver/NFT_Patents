# 🏛️ Patent NFT Marketplace

A **proof-of-concept Web3 application** that demonstrates how patents can be tokenized, traded, and discovered through decentralized technology.

This project integrates the **Google Patents database** with blockchain smart contracts to allow users to:

1. **Search Patents** – Query global patents through the Google Patents API.
2. **Mint NFTs** – Turn a patent into a non-fungible token by storing its **title**, **patent ID**, and the **first page of its PDF** on IPFS.
3. **Trade Patents** – List, buy, and sell tokenized patents on a decentralized marketplace using ETH, USDC, or PSP tokens.
4. **AI-Assisted Search** – Use AI search tools to **augment professional searches**, providing inventors with early insights before committing to expensive legal research.

⚠️ **Disclaimer:** These NFTs are **representations of publicly available patents** and **do not grant legal ownership** of the underlying intellectual property. This marketplace is a **technical proof-of-concept** showcasing how patents *could* be managed on-chain in the future.

👉 For a detailed architectural and code-level walkthrough, see [TEACHME.md](./TEACHME.md).

---

## 📋 Table of Contents

* [🏗️ Architecture Overview](#-architecture-overview)
* [🚀 Quick Start](#-quick-start)
* [💾 Smart Contracts](#-smart-contracts)
* [🌐 Backend API](#-backend-api)
* [⚛️ Frontend Application](#-frontend-application)
* [🏪 Marketplace & IPFS Integration](#-marketplace--ipfs-integration)
* [🔧 Configuration](#-configuration)
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
* 📄 **Patent Metadata**: NFT includes title, patent ID, inventors, and first-page PDF snapshot
* 🏪 **Marketplace**: Trade patent NFTs with live listings and offers
* 💰 **Multi-Token Payments**: ETH, USDC, PSP tokens supported
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

* ERC721-compliant NFT contract
* Metadata includes title, patent ID, inventors, IPFS image
* Tracks uniqueness (no duplicate minting)
* Owner-only verification system

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

* **Patent Search**: `/api/uspto/search?criteria=<query>` → returns Google Patents results
* **Patent Details**: `/api/uspto/patent/:id` → returns patent data
* **Health Check**: `/api/health` → backend + API status

**CORS Proxy**: Handles frontend → Google Patents API requests server-side.

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
* **Offers**: Make and receive offers on NFTs
* **Patent Metadata**: Title, patent ID, inventors, PDF front page
* **IPFS Storage**: PDF front pages stored on decentralized IPFS
* **Flows Supported**: Mint → List → Buy/Offer → Secondary Trade

---

## User Flows:
1. **Search Patents**: Use the search bar to find patents by keywords, inventors, or patent IDs.
2. **Mint Patent NFT**: Select a patent from the search results and mint it as
an NFT. This will also store the first page of the patent PDF on IPFS.
3. **List NFT for Sale**: After minting, list your Patent NFT on the marketplace with a set price.
4. **Buy NFT**: Browse the marketplace, select a patent you're interested in, and purchase it with ETH/USDC/PSP.
5. **Make Offers**: If you find a patent NFT you like but it's not listed for sale, you can make an offer to the owner.
6. **View Owned NFTs**: Check your wallet to see all the Patent NFTs you own. 
7. **View Marketplace**: Browse the marketplace to see all the Patent NFTs for sale. 

---

## 🔧 Configuration

* **Frontend**: `.env` stores contract addresses, API endpoints, SerpApi key
* **Backend**: `.env` stores server port, SerpApi key, optional DB config
* **Hardhat**: Configurable for localhost + Sepolia testnet

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

* **Current Source**: Google Patents (via SerpApi)
* **Alternative APIs**: USPTO possible, but redundant
* **Data Flow**: Frontend → Backend → SerpApi → Google Patents → NFT minting

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

### Debugging

* Common issues: CORS errors, insufficient funds, API timeouts
* Use Hardhat scripts + backend logs for troubleshooting

---

## 🚀 Deployment Guide

* Supports **Sepolia Testnet** out of the box
* Deploy contracts individually for best results
* Update frontend `.env` with deployed contract addresses
* Verify contracts with Hardhat + Etherscan

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
* Google Patents + SerpApi for data
* React + Vite + Tailwind ecosystem

---

**Built with ❤️ to explore the future of intellectual property trading through Web3**
