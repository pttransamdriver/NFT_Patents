# 🚀 Sepolia Testnet Deployment Checklist

**Date**: Ready for deployment
**Network**: Sepolia Testnet (Chain ID: 11155111)
**Purpose**: Final deployment for blockchain engineering position

---

## ✅ Pre-Deployment Checklist

Before you start, verify:

- [ ] **Sepolia ETH**: You have ~0.1 Sepolia ETH in your deployment wallet
  - Check balance: https://sepolia.etherscan.io/
  - Get free ETH: https://sepoliafaucet.com/ or https://www.infura.io/faucet/sepolia

- [ ] **Environment Variables**: All keys are set in `.env`
  - ✅ SEPOLIA_PRIVATE_KEY (configured)
  - ✅ SEPOLIA_RPC_URL (configured)
  - ✅ ETHERSCAN_API_KEY (configured)
  - ✅ VITE_PINATA_API_KEY (configured)
  - ✅ VITE_PINATA_SECRET_KEY (configured)

- [ ] **Local Testing**: Everything works on localhost
  - Minting works
  - Marketplace listing works
  - Buying works

---

## 🎯 Step-by-Step Deployment

### **Step 1: Deploy PSP Token**

```bash
npm run deploy:psp sepolia
```

**Expected Output:**
```
✅ PSPToken deployed to: 0x...
📃 Transaction hash: 0x...
💾 PSPToken deployment saved
📝 Updated VITE_PSP_TOKEN_ADDRESS in .env
```

**What to verify:**
- [ ] No errors in terminal
- [ ] Contract address starts with `0x`
- [ ] `.env` updated with new address
- [ ] Wait for ~30 seconds for network confirmation

**If it fails:**
- Check you have enough Sepolia ETH
- Verify RPC URL is working: https://ethereum-sepolia-rpc.publicnode.com
- Make sure private key starts with `0x`

---

### **Step 2: Deploy Search Payment Contract**

**IMPORTANT**: Only proceed after Step 1 is confirmed!

```bash
npm run deploy:search sepolia
```

**Expected Output:**
```
✅ SearchPayment deployed to: 0x...
📃 Transaction hash: 0x...
💾 SearchPayment deployment saved
📝 Updated VITE_SEARCH_PAYMENT_ADDRESS in .env
```

**What to verify:**
- [ ] Contract deployed successfully
- [ ] `.env` updated with new address
- [ ] Wait for confirmation

---

### **Step 3: Deploy Patent NFT Contract**

**IMPORTANT**: Only proceed after Step 2 is confirmed!

```bash
npm run deploy:nft sepolia
```

**Expected Output:**
```
✅ PatentNFT deployed to: 0x...
📃 Transaction hash: 0x...
💾 PatentNFT deployment saved
📝 Updated VITE_PATENT_NFT_ADDRESS in .env
```

**What to verify:**
- [ ] Contract deployed successfully
- [ ] `.env` updated with new address
- [ ] Wait for confirmation

---

### **Step 4: Deploy NFT Marketplace Contract**

**IMPORTANT**: Only proceed after Step 3 is confirmed!

```bash
npm run deploy:marketplace sepolia
```

**Expected Output:**
```
✅ NFTMarketplace deployed to: 0x...
📃 Transaction hash: 0x...
💾 NFTMarketplace deployment saved
📝 Updated VITE_MARKETPLACE_ADDRESS in .env
```

**What to verify:**
- [ ] Contract deployed successfully
- [ ] `.env` updated with new address
- [ ] All 4 contracts now deployed

---

### **Step 5: Verify Contracts on Etherscan**

This makes your contracts readable on Sepolia Etherscan (good for transparency).

```bash
npm run verify:sepolia
```

**Expected Output:**
```
✅ PSPToken verified
✅ SearchPayment verified
✅ PatentNFT verified
✅ NFTMarketplace verified
```

**What this does:**
- Makes contract source code visible on Etherscan
- Shows you wrote secure, auditable code
- Allows others to interact with verified contracts

**If verification fails:**
- It's okay! Contracts still work
- Can verify manually later on Etherscan
- Non-critical for functionality

---

## 🔧 Step 6: Update Frontend Configuration

Edit your `.env` file and change these settings:

```bash
# Change from localhost to Sepolia
VITE_CHAIN_ID=11155111
VITE_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# Contract addresses should already be updated by deployment scripts
# Verify they all start with 0x and are different from localhost addresses
```

**Before (localhost):**
```
VITE_CHAIN_ID=31337
VITE_RPC_URL=http://127.0.0.1:8545
```

**After (Sepolia):**
```
VITE_CHAIN_ID=11155111
VITE_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
```

---

## 🧪 Step 7: Test on Sepolia

### **7.1: Start Frontend**

```bash
npm run dev
```

### **7.2: Configure MetaMask**

- [ ] Switch MetaMask to **Sepolia Test Network**
- [ ] Verify you have Sepolia ETH (~0.5 ETH for testing)
- [ ] Refresh the page

### **7.3: Test Complete Flow**

**Test 1: Search Patents**
- [ ] Go to Search Patents page
- [ ] Search for "blockchain" or any keyword
- [ ] Verify results appear

**Test 2: Mint NFT**
- [ ] Click "Mint NFT" on a search result
- [ ] Confirm MetaMask transaction
- [ ] Wait for success toast
- [ ] Check: https://sepolia.etherscan.io/ for your transaction

**Test 3: View Your NFTs**
- [ ] Go to Marketplace page
- [ ] Click "My NFTs" button
- [ ] Verify your minted NFT appears with correct patent info

**Test 4: List NFT for Sale**
- [ ] Click "List for Sale" on your NFT
- [ ] Enter price (e.g., 0.1 ETH)
- [ ] Approve transaction (MetaMask popup 1)
- [ ] List transaction (MetaMask popup 2)
- [ ] Wait for success

**Test 5: View on Marketplace**
- [ ] Check marketplace page
- [ ] Verify your NFT appears with:
  - Correct patent title (not "Untitled Patent")
  - Correct price
  - Your address as seller

**Test 6: Buy NFT (Optional)**
- [ ] Switch to different MetaMask account
- [ ] Click "Buy Now" on a listed NFT
- [ ] Confirm transaction
- [ ] Verify NFT transfers to new owner

---

## 📋 Deployed Contract Addresses

After deployment, record your addresses here:

```
PSP Token:        0x________________________________
Search Payment:   0x________________________________
Patent NFT:       0x________________________________
NFT Marketplace:  0x________________________________

Deployment Date:  ________________
Deployer Address: ________________
Network:          Sepolia Testnet (11155111)
```

**View on Etherscan:**
- https://sepolia.etherscan.io/address/[YOUR_CONTRACT_ADDRESS]

---

## 🎉 Success Criteria

Your deployment is successful when:

- ✅ All 4 contracts deployed without errors
- ✅ Contracts verified on Etherscan (optional but nice)
- ✅ Can mint an NFT on Sepolia
- ✅ NFT appears in "My NFTs" with correct metadata
- ✅ Can list NFT on marketplace
- ✅ NFT appears in marketplace with patent title
- ✅ Can buy NFT with different account (optional)

---

## 🐛 Troubleshooting

### **"Insufficient funds for gas"**
- Get more Sepolia ETH from faucet
- Each deployment costs ~0.01 ETH + gas

### **"Network error" or "Could not connect"**
- Check RPC URL is correct: `https://ethereum-sepolia-rpc.publicnode.com`
- Try alternative RPC: `https://rpc.sepolia.org`
- Check internet connection

### **"Nonce too high"**
- Reset MetaMask account: Settings → Advanced → Clear activity data
- Or wait a few minutes and retry

### **"Contract not deployed at address"**
- This happens during verification if contract is too new
- Wait 1-2 minutes after deployment
- Try verification again

### **Deployment script hangs**
- Press Ctrl+C to cancel
- Check Sepolia network status: https://sepolia.etherscan.io/
- Retry deployment

---

## 📊 Gas Cost Estimates

Based on current Sepolia gas prices:

| Contract | Estimated Gas | Estimated Cost |
|----------|---------------|----------------|
| PSP Token | ~2,500,000 | ~0.005 ETH |
| Search Payment | ~3,500,000 | ~0.008 ETH |
| Patent NFT | ~4,500,000 | ~0.01 ETH |
| Marketplace | ~5,500,000 | ~0.012 ETH |
| **Total** | **~16,000,000** | **~0.035 ETH** |

**Recommended**: Have 0.1 ETH in wallet (for deployment + testing)

---

## 🔒 Security Reminders

- ⚠️ **Never share your SEPOLIA_PRIVATE_KEY**
- ⚠️ **Never commit .env to git** (already in .gitignore)
- ⚠️ **Use a separate wallet** for deployment vs. personal funds
- ✅ **Backup your private key** securely
- ✅ **Verify contract addresses** before interacting

---

## 🎓 For Your Interview

**What to highlight:**
1. "Deployed complete dApp to Sepolia testnet"
2. "Smart contracts verified on Etherscan for transparency"
3. "Implemented modular deployment system for safe, sequential deployment"
4. "Includes IPFS integration with Pinata for decentralized storage"
5. "Built graceful degradation - AI search works with or without API keys"

**Links to share:**
- GitHub repo: [your-repo-url]
- Live demo: http://127.0.0.1:5173 (after `npm run dev`)
- Sepolia contracts: https://sepolia.etherscan.io/address/[your-contract]

---

## ✅ Post-Deployment Checklist

After successful deployment:

- [ ] Save contract addresses somewhere safe
- [ ] Update GitHub README with Sepolia addresses
- [ ] Take screenshots of working dApp
- [ ] Test all features end-to-end
- [ ] Document any issues encountered
- [ ] Celebrate! 🎉

---

## 📞 Need Help?

If you run into issues:

1. **Check the error message** - most are self-explanatory
2. **Look at the console** (F12) for detailed errors
3. **Verify on Etherscan** - see if transaction went through
4. **Check network status** - Sepolia might be congested

**Common fixes:**
- Wait and retry (network congestion)
- Get more Sepolia ETH (insufficient funds)
- Reset MetaMask nonce (nonce issues)
- Switch RPC provider (connectivity issues)

---

---

## 🌐 Step 8: Deploy Frontend to Vercel

Now that your contracts are on Sepolia and tested, let's make your app publicly accessible!

### **8.1: Push to GitHub**

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create commit
git commit -m "Ready for production deployment"

# Create GitHub repo at https://github.com/new
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/NFT_Patents.git
git branch -M main
git push -u origin main
```

**Verify**: `.env` is in `.gitignore` ✅ (it already is!)

---

### **8.2: Connect to Vercel**

- [ ] Go to **https://vercel.com**
- [ ] **Sign up/Login** with GitHub
- [ ] Click **"Add New Project"**
- [ ] **Import** your `NFT_Patents` repository
- [ ] Click **"Import"**

---

### **8.3: Configure Build Settings**

Vercel auto-detects Vite. Verify:

**Framework Preset**: `Vite`
**Build Command**: `npm run build`
**Output Directory**: `dist`
**Install Command**: `npm install`
**Node.js Version**: `18.x`

---

### **8.4: Add Environment Variables**

Click **"Environment Variables"** and add these:

```bash
# Sepolia Network
VITE_CHAIN_ID=11155111
VITE_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# Your Sepolia Contract Addresses (from Steps 1-4 above)
VITE_PSP_TOKEN_ADDRESS=0x...your_psp_address
VITE_SEARCH_PAYMENT_ADDRESS=0x...your_search_payment_address
VITE_PATENT_NFT_ADDRESS=0x...your_patent_nft_address
VITE_MARKETPLACE_ADDRESS=0x...your_marketplace_address

# Pinata IPFS
VITE_PINATA_API_KEY=5f25f31e9296023aa38b
VITE_PINATA_SECRET_KEY=394c4b448b14b83d1c261b3a029335185e5cd216cf8c430264b8864a780e3765

# Backend API (see Step 8.6 for backend deployment)
VITE_API_BASE_URL=https://your-backend.railway.app
```

**Important**: Copy your Sepolia addresses from the deployment above!

---

### **8.5: Deploy Frontend**

- [ ] Click **"Deploy"**
- [ ] Wait ~2-3 minutes for build
- [ ] Get your URL: `https://nft-patents-xyz.vercel.app`
- [ ] Click the URL to test

---

### **8.6: Deploy Backend to Railway**

Your backend needs to be deployed too:

1. **Sign up at Railway**: https://railway.app

2. **New Project** → "Deploy from GitHub"

3. **Select** `NFT_Patents` repository

4. **Settings** → Change:
   - **Root Directory**: `backend`
   - **Start Command**: `npm start`

5. **Variables** → Add:
   ```
   PORT=3001
   SERPAPI_KEY=f2255d1d67e2df3c50bb4f99172e99c1f35ad0ccecbb19cd58dc8a68f43cda05
   CORS_ORIGIN=https://your-vercel-app.vercel.app
   ```

6. **Deploy** → Wait for deployment

7. **Copy your Railway URL**: `https://your-backend.up.railway.app`

8. **Update Vercel environment variable**:
   - Go to Vercel → Settings → Environment Variables
   - Update `VITE_API_BASE_URL` to your Railway URL
   - Redeploy (Vercel → Deployments → Click "..." → Redeploy)

---

### **8.7: Test Your Live App**

Visit your Vercel URL:

- [ ] Site loads correctly
- [ ] Connect MetaMask (switch to Sepolia)
- [ ] Search patents works
- [ ] Mint NFT works (costs Sepolia ETH)
- [ ] "My NFTs" shows your NFTs
- [ ] Can list NFT on marketplace
- [ ] Marketplace shows listings correctly

---

### **8.8: Set Up Auto-Deployment (Optional)**

Now every time you push to GitHub, Vercel auto-deploys:

```bash
# Make a change
git add .
git commit -m "Update feature"
git push origin main

# Vercel automatically rebuilds and deploys in ~2 minutes
```

---

### **8.9: Add Custom Domain (Optional)**

1. **Buy domain** (Namecheap, GoDaddy, etc.)
2. **Vercel** → Your Project → Settings → Domains
3. **Add domain**: `yourpatentapp.com`
4. **Update DNS** as instructed
5. **SSL auto-configured** ✅

---

## 🎉 Deployment Complete!

You now have:

- ✅ **Smart Contracts**: Deployed and verified on Sepolia
- ✅ **Frontend**: Live on Vercel with HTTPS
- ✅ **Backend**: Running on Railway
- ✅ **IPFS**: Connected via Pinata
- ✅ **Auto-Deploy**: Push to GitHub = instant updates

**Your URLs:**
- 🌐 **Live App**: `https://your-app.vercel.app`
- 📜 **Contracts**: `https://sepolia.etherscan.io/address/0x...`
- 🐙 **Source**: `https://github.com/yourusername/NFT_Patents`

---

## 📊 What to Share

**For Your Resume/Portfolio:**
```
Patent NFT Marketplace - Full-Stack Web3 dApp
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Live Demo: https://your-app.vercel.app
📜 Smart Contracts: https://sepolia.etherscan.io/address/0x...
🐙 Source Code: https://github.com/yourusername/NFT_Patents

Tech Stack:
• Frontend: React, TypeScript, Vite, TailwindCSS
• Smart Contracts: Solidity, Hardhat, OpenZeppelin
• Blockchain: Ethereum Sepolia Testnet
• Storage: IPFS (Pinata), Decentralized metadata
• Backend: Node.js, Express.js
• APIs: Google Patents, SerpAPI
• Deployment: Vercel (Frontend), Railway (Backend)

Features:
✓ Search global patents via Google Patents API
✓ Mint patents as NFTs with IPFS storage
✓ Decentralized marketplace (buy/sell/list)
✓ Multi-token payments (ETH, USDC, PSP)
✓ Smart contract security (ReentrancyGuard, Ownable)
✓ Rich metadata display from real patent data
```

---

## 🎓 For Your Interview

**Demo Flow** (5 minutes):

1. **Show live site**: "This is deployed on Vercel with Sepolia testnet"
2. **Search patents**: "Real-time search via Google Patents API"
3. **Mint NFT**: "Minting stores first page on IPFS, metadata on-chain"
4. **Show "My NFTs"**: "Wallet integration detects owned NFTs"
5. **List on marketplace**: "Two transactions - approve then list"
6. **Show marketplace**: "Real patent titles, not generic NFT names"
7. **Show Etherscan**: "All contracts verified for transparency"

**Key Talking Points**:
- ✅ "Full-stack Web3 development from contracts to frontend"
- ✅ "Deployed to production on Sepolia testnet"
- ✅ "CI/CD pipeline - GitHub push auto-deploys via Vercel"
- ✅ "IPFS integration for decentralized storage"
- ✅ "Smart contract security best practices"
- ✅ "Real API integration with Google Patents"
- ✅ "Professional documentation and deployment guides"

---

## 🆘 Troubleshooting

### **Frontend shows "Wrong Network"**
- Switch MetaMask to Sepolia
- Check `VITE_CHAIN_ID=11155111` in Vercel

### **"Failed to fetch" errors**
- Backend not deployed or wrong URL
- Check `VITE_API_BASE_URL` in Vercel env vars
- Add CORS in backend for your Vercel domain

### **Transactions failing**
- Verify contract addresses in Vercel match Sepolia
- Check you have Sepolia ETH
- Ensure you're on Sepolia network

### **Vercel build fails**
- Check build logs in Vercel dashboard
- Test locally: `npm run build`
- Verify all deps in `package.json`

---

**Good luck with your deployment!** 🚀

You've built an impressive full-stack Web3 application that showcases:
- ✓ Smart contract development and deployment
- ✓ Frontend Web3 integration with React
- ✓ IPFS decentralized storage
- ✓ Production deployment pipeline
- ✓ NFT marketplace functionality
- ✓ Professional documentation

This is a **production-grade portfolio project** that demonstrates real blockchain engineering skills. Perfect for your interview! 🎉
