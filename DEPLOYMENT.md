# 🚀 Deployment Guide

This document outlines the deployment process for the Patent NFT Marketplace smart contracts.

## 📁 Project Structure

```
scripts/
├── deploy/                     # Individual contract deployments
│   ├── 001_deploy_psp_token.js        # PSP Token contract
│   ├── 002_deploy_search_payment.js   # Search Payment contract
│   ├── 003_deploy_patent_nft.js       # Patent NFT contract
│   └── 004_deploy_marketplace.js      # NFT Marketplace contract
├── utils/                      # Shared utilities
│   ├── deployment-utils.js            # Core deployment functions
│   └── constants.js                   # Configuration constants
├── tasks/                      # Hardhat tasks
│   └── verify.js                      # Contract verification
├── emergency/                  # Emergency operations
│   ├── pauseAll.js
│   └── unpauseAll.js
├── deploy-modular.js          # Deploy all contracts orchestrator
└── verify-deployment.js       # Standalone verification script
```

## 🎯 Deployment Commands

### Quick Deployment (Recommended)

```bash
# Deploy all contracts to localhost (auto-skips if already deployed)
npm run deploy

# Force redeploy all contracts
npm run deploy:force

# Deploy to Sepolia testnet
npm run deploy:sepolia
```

### Individual Contract Deployment

```bash
# Deploy individual contracts
npm run deploy:psp          # PSP Token
npm run deploy:search       # Search Payment
npm run deploy:nft          # Patent NFT
npm run deploy:marketplace  # NFT Marketplace
```

### Verification

```bash
# Verify all deployments
npm run verify

# Verify on Sepolia
npm run verify:sepolia
```

## 🏗️ Deployment Process

### 1. Prerequisites

Ensure the following are configured:

**For Localhost:**
- Hardhat node running: `npm run node`
- Default deployer account funded

**For Sepolia:**
- `SEPOLIA_RPC_URL` set in `.env`
- `SEPOLIA_PRIVATE_KEY` set in `.env`
- Deployer account funded with Sepolia ETH

**For Production:**
- `MAINNET_RPC_URL` set in `.env`
- `MAINNET_PRIVATE_KEY` set in `.env`
- `ETHERSCAN_API_KEY` set for verification

### 2. Deployment Order

Contracts are deployed in dependency order:

1. **PSP Token** - Independent ERC20 token
2. **Search Payment** - Depends on PSP Token
3. **Patent NFT** - Independent ERC721 contract
4. **NFT Marketplace** - Depends on Patent NFT

### 3. Smart Skip Logic

The deployment system intelligently skips contracts that are:
- Already deployed at the expected address
- Have verified bytecode on-chain
- Pass deployment verification checks

Use `--force` flag to override this behavior.

### 4. Contract Addresses

After deployment, contract addresses are automatically:
- Saved to individual JSON files in `deployments/<network>/`
- Updated in the `.env` file with `VITE_<CONTRACT>_ADDRESS` format
- Frontend automatically picks up changes via Vite hot reload

## 📊 Contract Configuration

### PSP Token
- **Initial Price**: 0.000004 ETH (~$0.01)
- **Total Supply**: 1,000,000 PSP
- **Max Supply**: 10,000,000 PSP

### Search Payment
- **ETH Price**: 0.002 ETH (~$5.00)
- **USDC Price**: 5.0 USDC
- **PSP Price**: 500 PSP tokens

### Patent NFT
- **Minting Price**: 0.1 ETH
- **Symbol**: PNFT
- **Standard**: ERC721

### NFT Marketplace
- **Platform Fee**: 2.5% (250 basis points)
- **Fee Recipient**: Deployer address

## 🔍 Verification

### Automatic Verification
All deployments include automatic verification:
- Contract bytecode validation
- Interface compatibility checks
- Constructor argument verification
- Balance and transaction count reporting

### Manual Verification
```bash
# Check specific network deployments
node scripts/verify-deployment.js localhost
node scripts/verify-deployment.js sepolia

# Use Hardhat task
npx hardhat verify-contracts --network localhost
```

## 🚨 Emergency Procedures

### Pause All Contracts
```bash
node scripts/emergency/pauseAll.js <network>
```

### Unpause All Contracts
```bash
node scripts/emergency/unpauseAll.js <network>
```

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Network connection verified
- [ ] Deployer account funded
- [ ] Contract compilation successful
- [ ] Tests passing

### During Deployment
- [ ] Monitor gas prices (for mainnet)
- [ ] Verify transaction confirmations
- [ ] Check contract addresses in console output
- [ ] Ensure .env file updated correctly

### Post-Deployment
- [ ] Run verification script
- [ ] Test frontend integration
- [ ] Update documentation
- [ ] Notify team of new addresses
- [ ] Back up deployment artifacts

## 🔒 Security Best Practices

1. **Environment Variables**: Never commit private keys to version control
2. **Multi-sig**: Use multi-signature wallets for mainnet deployments
3. **Verification**: Always verify contracts on block explorers
4. **Testing**: Deploy to testnet first, test thoroughly
5. **Access Control**: Set proper ownership and admin roles
6. **Upgrades**: Plan for contract upgrade patterns if needed

## 🌐 Network Information

### Localhost (Development)
- **Chain ID**: 31337
- **RPC URL**: http://127.0.0.1:8545
- **Explorer**: N/A
- **Gas Price**: Auto

### Sepolia (Testnet)
- **Chain ID**: 11155111
- **RPC URL**: https://ethereum-sepolia-rpc.publicnode.com
- **Explorer**: https://sepolia.etherscan.io
- **Faucet**: https://sepoliafaucet.com

### Mainnet (Production)
- **Chain ID**: 1
- **RPC URL**: Configure via MAINNET_RPC_URL
- **Explorer**: https://etherscan.io
- **Gas Price**: Monitor via ETH Gas Station

## 📞 Support

For deployment issues:
1. Check deployment logs in console
2. Verify network connectivity
3. Ensure sufficient account balance
4. Review error messages carefully
5. Consult this documentation
6. Contact development team if needed