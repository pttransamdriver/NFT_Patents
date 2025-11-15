# Minting Error: "missing revert data" - Diagnostic Guide

## Error You're Getting
```
missing revert data (action="estimateGas", data=null, reason=null, ...)
```

This means the smart contract is rejecting your transaction, but the error message isn't being returned.

---

## ✅ Verification Checklist

### 1. **Contract Address Verification**
Your contract is deployed at: `0x2ff6C8e359D2C7762C0197E512A48Bf1D96758cB`
- ✅ Confirmed on Sepolia Etherscan
- ✅ Has received multiple transactions (0.05 ETH payments)

### 2. **Vercel Frontend Environment Variables**
Go to: https://vercel.com → Your NFT_Patents Project → Settings → Environment Variables

**MUST have these exact values:**
```
VITE_PATENT_NFT_ADDRESS=0x2ff6C8e359D2C7762C0197E512A48Bf1D96758cB
VITE_CHAIN_ID=11155111
VITE_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
VITE_NETWORK_NAME=sepolia
VITE_API_BASE_URL=https://nft-patents-backend.vercel.app
```

### 3. **Common Causes of "missing revert data"**

| Issue | Check | Fix |
|-------|-------|-----|
| **Wrong Network** | MetaMask showing Sepolia? | Switch to Sepolia in MetaMask |
| **Wrong Contract Address** | Vercel has old address? | Update VITE_PATENT_NFT_ADDRESS |
| **Insufficient ETH** | Do you have >0.06 ETH? | Need 0.05 for mint + gas |
| **Patent Already Minted** | Trying to mint same patent twice? | Search for different patent |
| **IPFS Upload Failed** | Backend can't reach Pinata? | Check backend logs |
| **RPC Connection Issue** | Can't connect to Sepolia? | Try different RPC URL |

---

## 🔍 How to Debug

### Step 1: Check Your Network
```javascript
// Open browser console (F12) and run:
console.log(window.ethereum.chainId)
// Should output: 0xaa36a7 (which is 11155111 in decimal)
```

### Step 2: Check Contract Address
```javascript
// In browser console:
const address = "0x2ff6C8e359D2C7762C0197E512A48Bf1D96758cB";
console.log("Contract address:", address);
// Visit: https://sepolia.etherscan.io/address/0x2ff6C8e359D2C7762C0197E512A48Bf1D96758cB
```

### Step 3: Check Your ETH Balance
```javascript
// In browser console:
const balance = await window.ethereum.request({
  method: 'eth_getBalance',
  params: [window.ethereum.selectedAddress, 'latest']
});
console.log("Balance in wei:", balance);
// Divide by 10^18 to get ETH
```

### Step 4: Check Backend Logs
Visit: `https://nft-patents-backend.vercel.app/api/health`

Should return:
```json
{
  "status": "ok",
  "services": {
    "pinata": { "enabled": true },
    "patents": { "enabled": true }
  }
}
```

---

## 🚀 Quick Fix Steps

1. **Verify Vercel Variables Match Local .env**
   - Compare VITE_PATENT_NFT_ADDRESS in Vercel vs your local .env
   - Redeploy if changed: Vercel → Deployments → Redeploy

2. **Clear Browser Cache**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or open in Incognito/Private mode

3. **Test with Different Patent**
   - Try searching for a different patent
   - Some patents might already be minted

4. **Check MetaMask Network**
   - Click network dropdown
   - Ensure "Sepolia" is selected
   - If not, add it manually

5. **Verify Wallet Has Funds**
   - Need at least 0.06 ETH (0.05 mint + gas)
   - Get testnet ETH from: https://sepoliafaucet.com

---

## 📋 What to Report if Still Broken

If still getting error, provide:
1. Your wallet address
2. Screenshot of MetaMask network (should show "Sepolia")
3. Screenshot of Vercel environment variables
4. The exact patent you're trying to mint
5. Browser console error (F12 → Console tab)

