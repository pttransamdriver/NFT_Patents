# Sepolia Testnet Deployment Guide

This guide will help you deploy your NFT_Patents project to the Sepolia testnet.

## Prerequisites

1. **MetaMask Wallet** with Sepolia ETH
2. **Infura Account** (or other RPC provider)
3. **Etherscan API Key** (for contract verification)
4. **Test ETH** from Sepolia faucet

## Step 1: Get Sepolia Test ETH

Visit these faucets to get test ETH:
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
- [Chainlink Sepolia Faucet](https://faucets.chain.link/sepolia)

You'll need at least 0.1 ETH for deployment and testing.

## Step 2: Set Up Infura

1. Go to [Infura.io](https://infura.io/) and create an account
2. Create a new project
3. Copy your Project ID
4. Your Sepolia RPC URL will be: `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`

## Step 3: Get Etherscan API Key

1. Go to [Etherscan.io](https://etherscan.io/)
2. Create an account and verify your email
3. Go to API Keys section
4. Create a new API key

## Step 4: Configure Environment Variables

Create a `.env.sepolia` file or update your `.env` file with:

```bash
# Network Configuration for Sepolia
VITE_NETWORK_NAME=sepolia
VITE_CHAIN_ID=11155111
VITE_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# Deployment Configuration
PRIVATE_KEY=your_wallet_private_key_here
INFURA_PROJECT_ID=your_infura_project_id
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
ETHERSCAN_API_KEY=your_etherscan_api_key

# Contract Addresses (will be populated after deployment)
VITE_PSP_TOKEN_ADDRESS=
VITE_SEARCH_PAYMENT_ADDRESS=
VITE_PATENT_NFT_ADDRESS=

# API Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_USPTO_API_KEY=your_uspto_api_key_here

# Backend API URL (update for production)
VITE_API_BASE_URL=https://your-backend-domain.com

# Development Settings
VITE_DEBUG=false
VITE_LOG_LEVEL=info
VITE_ENVIRONMENT=testnet
```

## Step 5: Deploy Contracts to Sepolia

```bash
# Compile contracts
npm run compile

# Deploy PSP Token
npx hardhat run scripts/deployPSP.js --network sepolia

# Deploy Search Payment Contract
npx hardhat run scripts/deploySearchPayment.js --network sepolia

# Set up PSP authorization
npx hardhat run scripts/setupPSPAuthorization.js --network sepolia

# Verify contracts on Etherscan
npx hardhat verify --network sepolia CONTRACT_ADDRESS
```

## Step 6: Update Frontend Configuration

After deployment, update your `.env` file with the deployed contract addresses:

```bash
VITE_PSP_TOKEN_ADDRESS=0x... # From deployment output
VITE_SEARCH_PAYMENT_ADDRESS=0x... # From deployment output
VITE_PATENT_NFT_ADDRESS=0x... # From deployment output
```

## Step 7: Configure MetaMask for Sepolia

1. Open MetaMask
2. Click network dropdown
3. Select "Sepolia test network" (or add it manually):
   - Network Name: `Sepolia`
   - RPC URL: `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`
   - Chain ID: `11155111`
   - Currency Symbol: `ETH`
   - Block Explorer: `https://sepolia.etherscan.io`

## Step 8: Test the Application

1. Start your frontend: `npm run dev`
2. Connect MetaMask to Sepolia network
3. Test wallet connection
4. Test contract interactions:
   - Purchase PSP tokens
   - Pay for searches
   - Mint NFTs

## Step 9: Deploy Backend (Optional)

If you're using the backend API:

1. Deploy to your hosting platform (Heroku, Railway, etc.)
2. Update environment variables on the hosting platform
3. Update `VITE_API_BASE_URL` in your frontend `.env`

## Troubleshooting

### Common Issues:

1. **"Insufficient funds"**: Make sure you have enough Sepolia ETH
2. **"Network mismatch"**: Ensure MetaMask is on Sepolia network
3. **"Contract not found"**: Verify contract addresses are correct
4. **"Transaction failed"**: Check gas limits and contract state

### Useful Commands:

```bash
# Check account balance
npx hardhat run scripts/checkBalance.js --network sepolia

# Check contract deployment
npx hardhat run scripts/verifyDeployment.js --network sepolia

# Test contract functions
npx hardhat console --network sepolia
```

## Security Notes

- Never commit private keys to version control
- Use environment variables for sensitive data
- Test thoroughly on testnet before mainnet
- Consider using a hardware wallet for mainnet deployment
- Implement proper access controls and rate limiting

## Next Steps

After successful Sepolia deployment:
1. Thoroughly test all functionality
2. Perform security audit
3. Optimize gas usage
4. Prepare for mainnet deployment
5. Set up monitoring and analytics
