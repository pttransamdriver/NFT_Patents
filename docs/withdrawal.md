# How to Withdraw Your 0.5 Sepolia ETH

Your contracts have built-in withdrawal functions! Here's how to use them:

## **Option 1: Withdraw from SearchPayment Contract (Recommended)**

The SearchPayment contract collects ETH from search payments and has an owner-only withdrawal function.

### Steps:
1. **Go to Etherscan Sepolia**: https://sepolia.etherscan.io/
2. **Search for SearchPayment contract**: `0xb06fFBe8539C542ea7e0a309356f2e89E810e640`
3. **Click "Contract" tab → "Write as Proxy"**
4. **Connect your wallet** (must be the owner/deployer)
5. **Find `withdrawETH()` function**
6. **Click "Write"** and confirm the transaction
7. **Done!** The 0.5 ETH will be sent to your wallet

### What it does:
- Withdraws ALL ETH from the SearchPayment contract
- Only the contract owner can call this
- Sends funds directly to your wallet
- Emits a `TokensWithdrawn` event

---

## **Option 2: Withdraw from NFTMarketplace Contract**

If you have pending withdrawals from marketplace sales:

### Steps:
1. **Go to Etherscan Sepolia**: https://sepolia.etherscan.io/
2. **Search for NFTMarketplace contract**: `0xa00FCc88e91C3BFBf3b53b7C2Fab3e59D27C34e2`
3. **Click "Contract" tab → "Write as Proxy"**
4. **Connect your wallet**
5. **Find `withdrawFunds()` function**
6. **Click "Write"** and confirm
7. **Done!** Your pending balance will be withdrawn

### What it does:
- Withdraws your pending balance from NFT sales
- Anyone can call this (not owner-only)
- Sends funds to your wallet
- Emits a `FundsWithdrawn` event

---

## **Option 3: Emergency Withdrawal (Owner Only)**

If something goes wrong, the owner can force withdraw all contract funds:

### Steps:
1. **NFTMarketplace**: Call `emergencyWithdraw()` function
2. **SearchPayment**: Call `withdrawETH()` function

---

## **Automatic Withdrawals?**

Currently, withdrawals are **manual** (you must call the function). To make them automatic:

1. **Set up a bot** (e.g., Gelato, Chainlink Automation)
2. **Configure it to call `withdrawETH()` periodically**
3. **Pay gas fees** for automated calls

Would you like me to help set up automated withdrawals?

---

## **Contract Addresses (Sepolia)**
- SearchPayment: `0xb06fFBe8539C542ea7e0a309356f2e89E810e640`
- NFTMarketplace: `0xa00FCc88e91C3BFBf3b53b7C2Fab3e59D27C34e2`

