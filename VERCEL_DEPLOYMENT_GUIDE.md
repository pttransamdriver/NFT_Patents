# 🚀 Vercel Deployment Guide for Patent NFT Marketplace

This guide covers deploying both the **frontend** (React/Vite) and **backend** (Node.js/Express) to Vercel with secure environment variables.

## 📋 Prerequisites

1. Vercel account (sign up at https://vercel.com)
2. GitHub account (for connecting your repository)
3. Your repository pushed to GitHub
4. Vercel CLI installed: `npm i -g vercel`

## 🎯 Deployment Strategy

We'll deploy **TWO separate Vercel projects**:
1. **Frontend Project** - Main React/Vite app (root directory)
2. **Backend Project** - Node.js API server (backend directory)

---

## Part 1: Deploy Backend API

### Step 1: Navigate to Backend Directory
```bash
cd backend
```

### Step 2: Login to Vercel (if not already logged in)
```bash
vercel login
```

### Step 3: Deploy Backend
```bash
vercel --prod
```

**Follow the prompts:**
- Link to existing project? **No**
- Project name? **patent-nft-backend** (or your choice)
- Directory? **.** (current directory - the backend folder)
- Modify settings? **No**

### Step 4: Set Backend Environment Variables

Once deployed, go to your Vercel dashboard and add these environment variables:

**Required Environment Variables for Backend:**
```
SERPAPI_KEY=your_serpapi_key_here
NODE_ENV=production
CORS_ORIGIN=https://your-frontend.vercel.app
```

**How to add them:**
1. Go to Vercel Dashboard → Your Backend Project
2. Click "Settings" → "Environment Variables"
3. Add each variable:
   - Name: `SERPAPI_KEY`
   - Value: `YOUR_ACTUAL_API_KEY`
   - Environment: Production, Preview, Development (check all)
4. Click "Save"

### Step 5: Get Backend URL

After deployment completes, you'll get a URL like:
```
https://patent-nft-backend.vercel.app
```

**Save this URL** - you'll need it for the frontend!

---

## Part 2: Deploy Frontend

### Step 1: Navigate Back to Root Directory
```bash
cd ..
```

### Step 2: Update Frontend Environment Variables

You need to create a `.env.production` file with your production settings:

```bash
# Network Configuration (Sepolia for production testing)
VITE_NETWORK_NAME=sepolia
VITE_CHAIN_ID=11155111
VITE_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# Contract Addresses (from Sepolia deployment)
VITE_PSP_TOKEN_ADDRESS=0xFCeA9eD73BE8d97f020D45D1C4C1c7dB2eed91e6
VITE_SEARCH_PAYMENT_ADDRESS=0x0dfE571b4D424b8dbfA90f0Ac54541B638287665
VITE_PATENT_NFT_ADDRESS=0xe4C3B9E04c1adf8224DD02006efAaa69c58d6E10
VITE_MARKETPLACE_ADDRESS=0xb4F23f71F84DA3e2daAeecDa030974B5CE7227F1

# Backend API URL (YOUR DEPLOYED BACKEND URL)
VITE_API_BASE_URL=https://patent-nft-backend.vercel.app

# USPTO API Key (if using client-side calls)
VITE_USPTO_API_KEY=your_uspto_key_here

# IPFS Configuration
VITE_IPFS_GATEWAY=https://ipfs.io/ipfs/

# App Configuration
VITE_APP_NAME=PatentNFT
VITE_ENVIRONMENT=production
VITE_DEBUG=false
```

### Step 3: Deploy Frontend
```bash
vercel --prod
```

**Follow the prompts:**
- Link to existing project? **No**
- Project name? **patent-nft-marketplace** (or your choice)
- Directory? **.** (root directory)
- Modify settings? **No**

### Step 4: Set Frontend Environment Variables in Vercel Dashboard

Go to Vercel Dashboard → Your Frontend Project → Settings → Environment Variables

Add all variables from `.env.production` above. **Important:**
- Only add variables starting with `VITE_`
- Never add private keys or secrets to frontend
- Add to: Production, Preview, Development (check all)

### Step 5: Update Backend CORS

Go back to your backend project settings and update `CORS_ORIGIN`:
```
CORS_ORIGIN=https://your-frontend.vercel.app
```

Replace with your actual frontend URL.

### Step 6: Redeploy Both Projects

After updating environment variables:

**Backend:**
```bash
cd backend
vercel --prod
```

**Frontend:**
```bash
cd ..
vercel --prod
```

---

## 🔒 Security Best Practices

### ✅ Safe to Include (Frontend - VITE_ variables)
- Contract addresses (public on blockchain)
- Network RPC URLs (public endpoints)
- Chain IDs (public information)
- IPFS gateways (public)
- Backend API URL (public endpoint)

### ❌ NEVER Include in Frontend
- Private keys
- SEPOLIA_PRIVATE_KEY
- API secrets (SERPAPI_KEY)
- ETHERSCAN_API_KEY
- Database credentials

### 🔐 Backend-Only Secrets
Keep these in backend environment variables only:
- `SERPAPI_KEY` - Patent search API key
- Any database credentials (if you add a database)
- Private API keys

---

## 🧪 Testing Your Deployment

### Test Backend Health
```bash
curl https://your-backend.vercel.app/api/health
```

Should return:
```json
{
  "status": "OK",
  "timestamp": "2025-10-21T...",
  "patentsApi": "configured",
  "blockchain": "decentralized",
  "storage": "IPFS + blockchain"
}
```

### Test Frontend
1. Visit your frontend URL
2. Connect MetaMask (set to Sepolia)
3. Try searching for a patent
4. Try minting an NFT
5. Check transactions on Blockscout

---

## 📝 Post-Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] Backend environment variables set
- [ ] Backend health check returns OK
- [ ] Frontend deployed and accessible
- [ ] Frontend environment variables set
- [ ] Frontend connects to backend successfully
- [ ] MetaMask connects to Sepolia
- [ ] Contract interactions work
- [ ] Patent search works
- [ ] NFT minting works
- [ ] Marketplace listing works

---

## 🔄 Updating Your Deployment

### For Code Changes

**Using Git (Recommended):**
1. Push changes to your GitHub repository
2. Vercel will automatically deploy (if connected to GitHub)

**Using CLI:**
```bash
vercel --prod
```

### For Environment Variable Changes

1. Update in Vercel Dashboard → Project → Settings → Environment Variables
2. Redeploy the project (Vercel Dashboard → Deployments → ⋯ → Redeploy)

---

## 🐛 Troubleshooting

### Backend Issues

**"Cannot connect to backend"**
- Check CORS_ORIGIN is set correctly
- Verify backend URL in frontend .env
- Check backend logs in Vercel Dashboard

**"Patents API not configured"**
- Verify SERPAPI_KEY is set in backend environment variables
- Redeploy backend after adding variables

### Frontend Issues

**"Wrong network"**
- Ensure VITE_CHAIN_ID matches MetaMask network
- For Sepolia: VITE_CHAIN_ID=11155111

**"Contract not found"**
- Verify contract addresses are correct
- Ensure addresses match your Sepolia deployment
- Redeploy frontend after updating addresses

---

## 📚 Additional Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Vercel Environment Variables**: https://vercel.com/docs/projects/environment-variables
- **Vite Environment Variables**: https://vitejs.dev/guide/env-and-mode.html
- **Sepolia Blockscout**: https://eth-sepolia.blockscout.com/

---

## 🎉 Success!

Once everything is deployed:
- **Frontend**: https://your-frontend.vercel.app
- **Backend**: https://your-backend.vercel.app
- **Contracts**: Live on Sepolia testnet

Your Patent NFT Marketplace is now live and accessible worldwide! 🚀
