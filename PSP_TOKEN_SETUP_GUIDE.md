# 🪙 PSP Token Payment System Setup Guide

This guide walks you through setting up the complete PSP (Patent Search Pennies) token payment system for AI patent searches using blockchain technology.

## 🎯 **Overview**

The PSP token payment system is a blockchain-native solution that replaces traditional payment processors:

- **PSP Token** - ERC20 token where 1 PSP = $0.01 USD
- **Search Cost** - 500 PSP tokens per AI search ($5.00 USD)
- **Payment Method** - MetaMask with PSP token transfers
- **No Fees** - Direct blockchain payments without processing fees
- **Instant** - Immediate payment confirmation and credit allocation

## 🏗️ **Architecture**

### Smart Contracts
1. **PSPToken.sol** - ERC20 token contract with purchase/redeem functionality
2. **SearchPayment.sol** - Handles PSP token payments for searches
3. **PatentNFT.sol** - Existing NFT contract (unchanged)

### Frontend Services
1. **pspTokenService.ts** - PSP token interactions
2. **paymentService.ts** - Backend communication for credits
3. **AISearchModal.tsx** - Updated UI for PSP payments

### Backend API
1. **PSP payment verification** - Confirms blockchain transactions
2. **Credit management** - Tracks user search credits
3. **Token balance tracking** - Monitors PSP token usage

## 🚀 **Quick Setup (30 minutes)**

### Step 1: Deploy PSP Token Contract

1. **Compile contracts**:
   ```bash
   npx hardhat compile
   ```

2. **Deploy PSP Token to testnet**:
   ```bash
   npx hardhat run scripts/deployPSP.js --network sepolia
   ```

3. **Deploy SearchPayment contract**:
   ```bash
   npx hardhat run scripts/deploySearchPayment.js --network sepolia
   ```

### Step 2: Configure Environment Variables

**Frontend (.env):**
```env
# AI Services
VITE_OPENAI_API_KEY=sk-your-openai-key-for-paid-searches
VITE_USPTO_API_KEY=your-uspto-api-key

# PSP Token System
VITE_PSP_TOKEN_ADDRESS=0xYourPSPTokenContractAddress
VITE_SEARCH_PAYMENT_ADDRESS=0xYourSearchPaymentContractAddress

# Backend
VITE_BACKEND_URL=http://localhost:3001
```

**Backend (backend/.env):**
```env
# Remove Stripe variables - no longer needed
# PSP Token System
PSP_TOKEN_ADDRESS=0xYourPSPTokenContractAddress
SEARCH_PAYMENT_ADDRESS=0xYourSearchPaymentContractAddress

# AI Services
OPENAI_API_KEY=sk-your-openai-key-for-paid-searches
```

### Step 3: Start the System

1. **Start backend**:
   ```bash
   cd backend && npm start
   ```

2. **Start frontend**:
   ```bash
   npm run dev
   ```

3. **Test PSP payments**:
   - Connect MetaMask to testnet
   - Purchase PSP tokens with ETH
   - Use PSP tokens to pay for searches

## 💰 **PSP Token Economics**

### Token Details
- **Name**: Patent Search Pennies
- **Symbol**: PSP
- **Decimals**: 18
- **Initial Supply**: 1,000,000 PSP
- **Max Supply**: 10,000,000 PSP

### Pricing Structure
- **1 PSP = $0.01 USD**
- **1 AI Search = 500 PSP = $5.00 USD**
- **Token Purchase**: Users buy PSP with ETH
- **Dynamic Pricing**: ETH/PSP rate adjusts with market

### Revenue Model
- **AI Cost**: ~$0.015 per search (OpenAI API)
- **Your Profit**: ~$4.985 per search (99.7% margin)
- **No Processing Fees**: Direct blockchain payments
- **Token Appreciation**: PSP value may increase with demand

## 🔧 **Smart Contract Functions**

### PSP Token Contract
```solidity
// Purchase PSP tokens with ETH
function purchaseTokens() external payable

// Redeem PSP tokens for ETH
function redeemTokens(uint256 tokenAmount) external

// Check token balance
function balanceOf(address owner) view returns (uint256)

// Get current token price in wei
function getTokenPrice() view returns (uint256)
```

### Search Payment Contract
```solidity
// Pay for search with PSP tokens
function payForSearch() external

// Get search price in PSP tokens
function getSearchPrice() view returns (uint256)

// Get user payment statistics
function getUserStats(address user) view returns (uint256, uint256)
```

## 🎨 **User Experience Flow**

### First-Time User
1. **Connect Wallet** - User connects MetaMask
2. **Check PSP Balance** - System shows current PSP balance
3. **Purchase PSP Tokens** - User buys PSP with ETH if needed
4. **Pay for Search** - User spends 500 PSP for AI search
5. **Get Results** - AI search executes immediately

### Returning User
1. **Connect Wallet** - Auto-connects if previously used
2. **Check Credits** - Shows existing search credits
3. **Use Credits** - Spend existing credits first
4. **Top Up** - Purchase more PSP tokens when needed

## 🔒 **Security Features**

### Smart Contract Security
- **ReentrancyGuard** - Prevents reentrancy attacks
- **Pausable** - Emergency pause functionality
- **Ownable** - Admin controls for contract management
- **SafeMath** - Overflow protection (built into Solidity 0.8+)

### Frontend Security
- **Input Validation** - All user inputs validated
- **Transaction Verification** - Backend verifies all payments
- **Error Handling** - Graceful handling of failed transactions
- **Rate Limiting** - Prevents spam and abuse

## 📊 **Monitoring & Analytics**

### Key Metrics to Track
1. **PSP Token Metrics**
   - Total supply and circulation
   - Purchase/redemption volume
   - Token price stability

2. **Search Metrics**
   - Searches per day/week/month
   - Revenue per search
   - User retention rates

3. **Technical Metrics**
   - Transaction success rates
   - Gas costs and optimization
   - Contract interaction patterns

### Recommended Tools
- **Etherscan** - Contract and transaction monitoring
- **The Graph** - Blockchain data indexing
- **Mixpanel** - User behavior analytics
- **Sentry** - Error monitoring and alerts

## 🚀 **Production Deployment**

### Mainnet Deployment
1. **Deploy to Ethereum Mainnet**:
   ```bash
   npx hardhat run scripts/deployPSP.js --network mainnet
   npx hardhat run scripts/deploySearchPayment.js --network mainnet
   ```

2. **Update environment variables** with mainnet addresses

3. **Verify contracts** on Etherscan for transparency

### Backend Deployment
1. **Deploy to cloud service** (Railway, Heroku, AWS)
2. **Set production environment variables**
3. **Configure SSL certificates**
4. **Set up monitoring and logging**

## 🔍 **Testing Checklist**

### Smart Contract Testing
- [ ] PSP token purchase with ETH
- [ ] PSP token redemption for ETH
- [ ] Search payment with PSP tokens
- [ ] Contract pause/unpause functionality
- [ ] Owner-only functions access control

### Frontend Testing
- [ ] MetaMask connection
- [ ] PSP token balance display
- [ ] Search payment flow
- [ ] Error handling for insufficient balance
- [ ] Transaction confirmation feedback

### Backend Testing
- [ ] PSP payment verification
- [ ] Search credit allocation
- [ ] User balance tracking
- [ ] API endpoint security
- [ ] Database consistency

## 🆘 **Troubleshooting**

### Common Issues

**"Insufficient PSP token balance"**
- User needs to purchase more PSP tokens
- Check if tokens are on correct network
- Verify contract addresses are correct

**"Transaction failed"**
- Check gas price and limit settings
- Ensure user has enough ETH for gas
- Verify contract is not paused

**"MetaMask not detected"**
- User needs to install MetaMask extension
- Check if MetaMask is unlocked
- Verify correct network is selected

### Support Resources
- **Documentation**: This guide and inline code comments
- **Community**: GitHub issues and discussions
- **Direct Support**: Contact form on your website

## 🎯 **Next Steps**

After completing this setup:

1. **Test thoroughly** on testnet before mainnet deployment
2. **Create user guides** for purchasing and using PSP tokens
3. **Implement analytics** to track system performance
4. **Plan token economics** for long-term sustainability
5. **Consider governance** features for community involvement

The PSP token system provides a modern, blockchain-native payment solution that eliminates traditional payment processor fees while offering users a seamless experience.
