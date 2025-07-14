# Patent NFT Marketplace

A decentralized marketplace for tokenizing and trading patents as NFTs with AI-powered search functionality and multi-token payment support.

## 🎯 Features

- **Patent NFT Minting**: Convert real patents into tradeable NFTs (one NFT per patent)
- **AI-Powered Search**: Gemini-based patent search with user API key support
- **Multi-Token Payments**: Accept ETH, USDC, and PSP tokens for AI searches
- **USPTO Integration**: Real patent verification through official USPTO API
- **Decentralized Trading**: Buy and sell patent NFTs on the marketplace
- **User Profiles**: Track owned patents and trading history

## 🏗️ Tech Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS, Framer Motion
- **Blockchain**: Ethereum, Solidity ^0.8.28, Hardhat
- **Web3 Integration**: ethers.js v6, MetaMask
- **AI Integration**: Google Gemini API
- **Smart Contracts**:
  - `PatentNFT.sol` - ERC721 for patent tokenization
  - `PSPToken.sol` - ERC20 payment token (1 PSP = $0.01)
  - `SearchPayment.sol` - Multi-token payment processing

## 🚀 Quick Start

### Prerequisites

- Node.js (v18+)
- npm or yarn
- MetaMask wallet
- Git

### Installation

1. **Clone and setup**
```bash
git clone https://github.com/yourusername/patent-nft-marketplace.git
cd NFT_Patents
npm install
```

2. **Environment setup**
```bash
cp .env.example .env
# Add your API keys to .env:
# VITE_GEMINI_API_KEY=your_gemini_key
# VITE_USPTO_API_KEY=your_uspto_key (when available)
```

3. **Start development**
```bash
# Terminal 1: Start local blockchain
npm run node

# Terminal 2: Deploy contracts
npm run deploy

# Terminal 3: Start frontend
npm run dev
```

## 🧪 Testing

```bash
# Compile contracts
npm run compile

# Run smart contract tests
npm run test

# Lint code
npm run lint
```

## 🚀 Deployment

### Testnet (Sepolia)
```bash
# Deploy PSP token
npm run deploy-psp-testnet

# Deploy search payment contract
npm run deploy-search-payment-testnet

# Setup PSP authorization
npm run setup-psp-auth-testnet
```

### Production
```bash
# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy-pages
```

## 💰 Payment System

The platform supports three payment methods for AI searches:

- **ETH**: Direct Ethereum payments
- **USDC**: Stablecoin payments
- **PSP Tokens**: Native platform tokens (500 PSP = $5 per search)

Users can purchase PSP tokens with ETH or use their existing token balances.

## 🤖 AI Integration

- **Default**: Gemini API for patent searches
- **User Choice**: Support for user-provided API keys (Claude, ChatGPT, Gemini)
- **Cost**: ~500 PSP tokens ($5) per comprehensive search

## 📚 Documentation

- [Setup Guide](./SETUP_GUIDE.md) - Complete setup instructions
- [API Integration](./API_INTEGRATION_GUIDE.md) - USPTO and AI API setup
- [Smart Contract Guide](./SMART_CONTRACT_GUIDE.md) - Contract deployment and testing

## 🔒 Security

- Comprehensive smart contract testing
- Multi-signature wallet support
- Pausable contracts for emergency stops
- Reentrancy protection on payment functions

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details