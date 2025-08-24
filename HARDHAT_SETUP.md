# 🔗 MetaMask + Hardhat Setup Guide

## Step 1: Add Hardhat Network to MetaMask

1. **Open MetaMask** in your browser
2. **Click the network dropdown** (top of MetaMask)
3. **Click "Add Network" or "Add Network Manually"**
4. **Enter the following details:**
   - **Network Name**: `Hardhat Local`
   - **New RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`
   - **Block Explorer URL**: (leave empty)

5. **Click "Save"** and **switch to the Hardhat Local network**

## Step 2: Import Hardhat Account to MetaMask

1. **Get the private key** for the first Hardhat account:
   ```
   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   ```

2. **In MetaMask**:
   - Click the **account icon** (top right)
   - Select **"Import Account"**
   - Paste the private key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - Click **"Import"**

3. **Your account should now show ~10,000 ETH** (Hardhat test balance)

## Step 3: Start Hardhat Node (if not running)

```bash
# In terminal 1 - Start Hardhat node
npx hardhat node

# In terminal 2 - Deploy contracts (if needed)
npx hardhat run scripts/deploy-all.js --network localhost
```

## Step 4: Verify Contract Addresses

Your contracts are deployed at:
- **PatentNFT**: `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`
- **PSPToken**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`

## 🚨 Troubleshooting

### Problem: "Insufficient funds" error
- **Solution**: Make sure you imported the Hardhat account with 10,000 ETH
- **Check**: Your MetaMask should show the account with a large ETH balance

### Problem: "Network not connected"
- **Solution**: Switch to the "Hardhat Local" network in MetaMask
- **Check**: Network dropdown should show "Hardhat Local"

### Problem: "Contract not found"
- **Solution**: Redeploy contracts with `npx hardhat run scripts/deploy-all.js --network localhost`

### Problem: "Transaction failed"
- **Solution**: Reset MetaMask account (Settings > Advanced > Reset Account)
- **Why**: Hardhat resets nonce on restart, but MetaMask remembers old nonce

## ✅ Test Connection

Once setup is complete:
1. Go to the Patent Search page
2. Search for patents
3. Click "Mint NFT" on any patent
4. MetaMask should popup asking for transaction approval
5. Confirm the transaction - it should succeed!