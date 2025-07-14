# 🚀 Complete Setup Guide

This guide covers everything you need to get the Patent NFT Marketplace running locally and deployed.

## 🎯 Prerequisites

### Required Software
- **Node.js** v18+ ([Download](https://nodejs.org/))
- **Git** ([Download](https://git-scm.com/))
- **MetaMask** browser extension ([Install](https://metamask.io/))

### Required Accounts & API Keys
- **Google Cloud Account** for Gemini API
- **GitHub Account** for deployment
- **USPTO API Key** (optional, for production)

## 🏗️ Local Development Setup

### Step 1: Clone and Install
```bash
git clone https://github.com/yourusername/patent-nft-marketplace.git
cd NFT_Patents
npm install
```

### Step 2: Environment Configuration
```bash
cp .env.example .env
```

Edit `.env` file:
```env
# AI API Keys
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# USPTO API (optional for development)
VITE_USPTO_API_KEY=your_uspto_key_when_available

# Contract Addresses (auto-populated after deployment)
VITE_PSP_TOKEN_ADDRESS=
VITE_SEARCH_PAYMENT_ADDRESS=
VITE_PATENT_NFT_ADDRESS=

# Network Configuration
VITE_NETWORK_NAME=localhost
VITE_CHAIN_ID=31337
```

### Step 3: Get Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file as `VITE_GEMINI_API_KEY`

### Step 4: Start Development Environment
```bash
# Terminal 1: Start local blockchain
npm run node

# Terminal 2: Deploy contracts (in new terminal)
npm run compile
npm run deploy-psp
npm run deploy-search-payment
npm run setup-psp-auth

# Terminal 3: Start frontend (in new terminal)
npm run dev
```

### Step 5: Configure MetaMask
1. Open MetaMask
2. Add Local Network:
   - Network Name: `Localhost 8545`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`
3. Import test account using private key from Hardhat output

## 🧪 Testing Setup

### Run Smart Contract Tests
```bash
npm run test
```

### Test AI Search
1. Go to `http://localhost:5173/search`
2. Click "AI Assistant" mode
3. Try query: "renewable energy patents 2023"
4. Should return AI-powered results

### Test Payment System
1. Go to Patent Search page
2. Click "AI Assistant" 
3. Try to make a payment with PSP tokens
4. Should process payment and grant search credits

## 🌐 Testnet Deployment (Sepolia)

### Step 1: Get Sepolia ETH
1. Go to [Sepolia Faucet](https://sepoliafaucet.com/)
2. Request test ETH for your MetaMask address

### Step 2: Configure Hardhat for Sepolia
Create `hardhat.config.cjs`:
```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
```

Add to `.env`:
```env
INFURA_PROJECT_ID=your_infura_project_id
PRIVATE_KEY=your_wallet_private_key
```

### Step 3: Deploy to Sepolia
```bash
npm run deploy-psp-testnet
npm run deploy-search-payment-testnet
npm run setup-psp-auth-testnet
```

### Step 4: Update Frontend Config
Update contract addresses in `.env` with deployed addresses.

## 🚀 Production Deployment

### GitHub Pages Deployment
```bash
# Build and deploy
npm run build
npm run deploy-pages
```

Your site will be available at: `https://yourusername.github.io/NFT_patents/`

### Mainnet Deployment (When Ready)
1. Get mainnet ETH
2. Update hardhat config with mainnet settings
3. Deploy contracts with production parameters
4. Update frontend with mainnet contract addresses

## 🔧 Troubleshooting

### Common Issues

**"Cannot connect to localhost:8545"**
- Make sure `npm run node` is running
- Check MetaMask network settings

**"Transaction failed"**
- Ensure you have enough ETH for gas
- Check contract addresses are correct

**"AI search not working"**
- Verify Gemini API key is valid
- Check browser console for errors

**"PSP token balance not showing"**
- Ensure contracts are deployed
- Check MetaMask is connected to correct network

### Getting Help
- Check browser console for errors
- Review Hardhat console output
- Ensure all environment variables are set
- Verify MetaMask is connected to correct network

## 📚 Next Steps

After setup is complete:
1. Read [API Integration Guide](./API_INTEGRATION_GUIDE.md)
2. Review [Smart Contract Guide](./SMART_CONTRACT_GUIDE.md)
3. Test all functionality thoroughly
4. Deploy to testnet for further testing
