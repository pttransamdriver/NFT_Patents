# 📜 Smart Contract Guide

Complete guide to the smart contracts powering the Patent NFT Marketplace.

## 🏗️ Contract Architecture

### Contract Overview
1. **PatentNFT.sol** - ERC721 for patent tokenization
2. **PSPToken.sol** - ERC20 payment token (Patent Search Pennies)
3. **SearchPayment.sol** - Multi-token payment processing

### Contract Relationships
```
PatentNFT (ERC721)
    ↓ (independent)
PSPToken (ERC20) ←→ SearchPayment
    ↓ (authorized spender)
User Wallets (ETH/USDC/PSP)
```

## 📜 PatentNFT.sol

### Purpose
Tokenizes real patents as unique NFTs with verification system.

### Key Features
- **One NFT per patent** (enforced by patent number uniqueness)
- **USPTO verification** system
- **Metadata storage** with IPFS URIs
- **Owner-only verification** for quality control

### Core Functions

#### Minting
```solidity
function mintPatent(
    address recipient,
    string memory tokenURI,
    string memory title,
    string memory inventor,
    string memory patentNumber
) public returns (uint256)
```

#### Verification
```solidity
function verifyPatent(uint256 tokenId) public onlyOwner
```

#### Data Retrieval
```solidity
function getPatent(uint256 tokenId) public view returns (
    string memory title,
    string memory inventor,
    uint256 filingDate,
    string memory patentNumber,
    bool isVerified
)
```

### Security Features
- Input validation for all parameters
- Patent number format validation
- Owner-only verification system
- Existence checks before operations

## 🪙 PSPToken.sol

### Purpose
ERC20 token for AI search payments with ETH purchase/redemption.

### Token Economics
- **Symbol**: PSP (Patent Search Pennies)
- **Decimals**: 18
- **1 PSP = $0.01 USD**
- **Initial Supply**: 1,000,000 PSP
- **Max Supply**: 10,000,000 PSP

### Core Functions

#### Purchase Tokens
```solidity
function purchaseTokens() external payable whenNotPaused
```
Users send ETH, receive PSP tokens at current rate.

#### Redeem Tokens
```solidity
function redeemTokens(uint256 tokenAmount) external whenNotPaused
```
Users burn PSP tokens, receive ETH back.

#### Authorized Spending
```solidity
function spendTokensFor(address user, uint256 amount) external
```
Allows SearchPayment contract to spend user tokens.

### Admin Functions
- `setAuthorizedSpender()` - Authorize contracts to spend tokens
- `updateTokenPrice()` - Adjust PSP/ETH exchange rate
- `mint()` - Create new tokens (respects max supply)
- `pause()/unpause()` - Emergency controls

## 💳 SearchPayment.sol

### Purpose
Handles multi-token payments for AI searches.

### Supported Tokens
- **ETH**: Direct Ethereum payments
- **USDC**: Stablecoin payments
- **PSP**: Native platform tokens

### Core Functions

#### Pay for Search
```solidity
function payForSearch() external nonReentrant whenNotPaused
```
Processes PSP token payment for AI search credits.

#### Multi-Token Support (Future)
```solidity
function payWithToken(address token, uint256 amount) external
```
Accept payments in ETH, USDC, or PSP.

### Payment Tracking
- User payment history
- Total searches purchased
- Token usage analytics

## 🧪 Testing Strategy

### Test Categories
1. **Unit Tests** - Individual function testing
2. **Integration Tests** - Contract interaction testing
3. **Security Tests** - Attack vector testing
4. **Gas Optimization Tests** - Cost analysis

### Key Test Scenarios

#### PatentNFT Tests
- Successful patent minting
- Duplicate patent prevention
- Verification system
- Access control
- Input validation

#### PSPToken Tests
- Token purchase/redemption
- Authorized spending
- Supply limits
- Pause functionality
- Price updates

#### SearchPayment Tests
- Payment processing
- Multi-token support
- Reentrancy protection
- User statistics tracking

### Running Tests
```bash
# Compile contracts
npm run compile

# Run all tests
npm run test

# Run specific test file
npx hardhat test test/PatentNFT.test.js

# Run with gas reporting
REPORT_GAS=true npm run test
```

## 🚀 Deployment Guide

### Local Deployment
```bash
# Start local node
npm run node

# Deploy contracts
npm run deploy-psp
npm run deploy-search-payment
npm run setup-psp-auth
```

### Testnet Deployment (Sepolia)
```bash
# Deploy PSP token
npm run deploy-psp-testnet

# Deploy search payment
npm run deploy-search-payment-testnet

# Setup authorization
npm run setup-psp-auth-testnet
```

### Deployment Scripts

#### deployPSP.js
- Deploys PSPToken contract
- Sets initial token price
- Mints initial supply to deployer

#### deploySearchPayment.js
- Deploys SearchPayment contract
- Links to PSPToken contract
- Sets search price (500 PSP)

#### setupPSPAuthorization.js
- Authorizes SearchPayment to spend PSP tokens
- Configures payment system integration

## 🔒 Security Considerations

### Access Control
- **Ownable**: Admin functions restricted to owner
- **Pausable**: Emergency stop functionality
- **ReentrancyGuard**: Prevents reentrancy attacks

### Input Validation
- Non-zero address checks
- String length validation
- Numeric range validation
- Patent number format validation

### Economic Security
- Supply limits on PSP token
- Price update controls
- Withdrawal restrictions
- Balance checks before operations

## 📊 Gas Optimization

### Optimization Techniques
- Batch operations where possible
- Efficient storage patterns
- Minimal external calls
- Event emission for off-chain indexing

### Gas Costs (Estimated)
- **Mint Patent NFT**: ~150,000 gas
- **Purchase PSP Tokens**: ~80,000 gas
- **Pay for Search**: ~60,000 gas
- **Verify Patent**: ~45,000 gas

## 🔄 Upgrade Strategy

### Current Approach
Contracts are not upgradeable for security and trust.

### Future Considerations
- Proxy pattern for upgradeable contracts
- Multi-signature governance
- Timelock for admin functions
- Community voting on changes

## 📈 Monitoring & Analytics

### On-Chain Events
- `PatentMinted` - New NFT created
- `PatentVerified` - Patent verified by admin
- `TokensPurchased` - PSP tokens bought
- `PaymentReceived` - Search payment processed

### Off-Chain Tracking
- Patent verification queue
- Token price history
- User payment patterns
- Search usage analytics

## 🚨 Emergency Procedures

### Pause Contracts
```bash
# Pause PSP token
npx hardhat run scripts/pausePSP.js --network sepolia

# Pause search payments
npx hardhat run scripts/pausePayments.js --network sepolia
```

### Recovery Actions
- Withdraw contract funds
- Update contract addresses
- Migrate to new contracts
- Refund user payments

## ✅ Pre-Launch Checklist

Before mainnet deployment:
- [ ] Complete test suite passing
- [ ] Security audit completed
- [ ] Gas optimization verified
- [ ] Admin procedures documented
- [ ] Emergency plans tested
- [ ] Multi-signature setup
- [ ] Monitoring systems active
- [ ] User documentation complete
