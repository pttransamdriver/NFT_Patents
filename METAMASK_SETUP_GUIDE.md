# MetaMask Setup Guide for NFT Patents Project

## Quick Setup Steps

### 1. Start the Development Environment
```bash
cd /home/bentutorin/Documents/vscode/NFT_Patents
npm run dev
```

### 2. Configure MetaMask

1. **Add Local Network to MetaMask:**
   - Open MetaMask
   - Click on the network dropdown (usually shows "Ethereum Mainnet")
   - Click "Add Network" or "Custom RPC"
   - Enter these details:
     - **Network Name:** Hardhat Local
     - **New RPC URL:** http://127.0.0.1:8545
     - **Chain ID:** 31337
     - **Currency Symbol:** ETH
   - Click "Save"

2. **Import Test Account:**
   - In MetaMask, click on the account icon
   - Select "Import Account"
   - Choose "Private Key"
   - Use this test private key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - This gives you access to the first Hardhat test account with 10,000 ETH

### 3. Test the Integration

1. **Open the Application:**
   - Go to http://localhost:5173 (or whatever port Vite shows)
   - You should see the NFT Patents application

2. **Use the Debug Tools:**
   - Look for a settings icon (⚙️) in the bottom-left corner - this is the MetaMask Debugger
   - Look for a test tube icon (🧪) in the bottom-right corner - this is the Payment Test tool

3. **Test Connection:**
   - Click the MetaMask Debugger (⚙️)
   - Check that all values show correctly:
     - MetaMask Installed: Yes
     - Wallet Connected: Yes
     - Account: Should show your imported account
     - Network ID: 31337
     - Contract addresses should all be populated

4. **Test Payments:**
   - Click the Payment Test tool (🧪)
   - Try "Test Connection" first
   - Then try "Test PSP Purchase" - this should trigger MetaMask popup
   - Finally try "Test ETH Payment"

### 4. Test the Full Flow

1. **Go to Patent Search:**
   - Navigate to the "Patent Search" page
   - Switch to "AI Assistant" mode
   - Enter a test query like "Find renewable energy patents"
   - Click "Ask AI"

2. **Purchase PSP Tokens:**
   - In the payment modal, if you don't have PSP tokens, click "Buy PSP Tokens"
   - This should trigger a MetaMask popup for purchasing tokens with ETH

3. **Make a Payment:**
   - Once you have PSP tokens, try the "Pay with PSP" button
   - This should trigger another MetaMask popup for the actual payment

## Troubleshooting

### MetaMask Not Popping Up?

1. **Check MetaMask Connection:**
   - Ensure MetaMask is unlocked
   - Make sure you're on the Hardhat Local network (31337)
   - Check that the account has ETH balance

2. **Check Browser Console:**
   - Open Developer Tools (F12)
   - Look for any error messages in the Console tab
   - Common issues:
     - "User rejected transaction" - You clicked "Reject" in MetaMask
     - "Insufficient funds" - Not enough ETH for gas fees
     - "Network mismatch" - Wrong network selected in MetaMask

3. **Reset MetaMask:**
   - If transactions get stuck, go to MetaMask Settings > Advanced > Reset Account
   - This clears transaction history and can fix stuck transactions

### Contract Issues?

1. **Redeploy Contracts:**
   ```bash
   npm run deploy
   npm run deploy-psp
   npm run deploy-search-payment
   npm run setup-psp-auth
   ```

2. **Check Contract Addresses:**
   - Verify the addresses in your `.env` file match the deployed contracts
   - Use the MetaMask Debugger to see current addresses

### Still Having Issues?

1. **Check the Debug Tools:**
   - Use both the MetaMask Debugger and Payment Test tools
   - Look at the test results for specific error messages

2. **Check Network:**
   - Ensure the Hardhat node is running: `ps aux | grep hardhat`
   - Test RPC connection: `curl -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://127.0.0.1:8545`

## Expected Behavior

When everything is working correctly:

1. **PSP Token Purchase:**
   - Click "Buy PSP Tokens" → MetaMask popup appears
   - Confirm transaction → Tokens appear in your balance

2. **Payment for Search:**
   - Click "Pay with PSP" → MetaMask popup appears
   - Confirm transaction → Search credits added

3. **ETH Payment:**
   - Click "Pay with ETH" → MetaMask popup appears
   - Confirm transaction → Search credits added

The key is that MetaMask should pop up for EVERY transaction that requires user approval.