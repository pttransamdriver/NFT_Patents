# 🔗 MetaMask Crypto Payment Setup Guide

This guide will help you set up cryptocurrency payments using MetaMask for your AI search feature.

## 🎯 **Payment Options Now Available**

### **Option 1: MetaMask Payment (NEW!)**
- Users pay with ETH directly from MetaMask
- Instant payment confirmation
- No processing fees (except gas)
- Perfect for NFT/crypto users

### **Option 2: Credit Card Payment**
- Traditional Stripe payment
- Good for non-crypto users
- 2.9% + $0.30 processing fee

## 🚀 **Quick Setup (15 minutes)**

### Step 1: Set Up Your Wallet Address
1. **Get your wallet address** where you want to receive payments
2. **Add to environment variables**:
   ```env
   VITE_PAYMENT_RECIPIENT_ADDRESS=0xYourWalletAddressHere
   ```

### Step 2: Deploy Payment Contract (Optional but Recommended)
1. **Compile the contract**:
   ```bash
   npx hardhat compile
   ```

2. **Deploy to testnet first**:
   ```bash
   npx hardhat run scripts/deployPayment.js --network sepolia
   ```

3. **Add contract address to .env**:
   ```env
   VITE_PAYMENT_CONTRACT_ADDRESS=0xYourContractAddressHere
   ```

### Step 3: Test the Integration
1. **Start your backend**:
   ```bash
   cd backend && npm run dev
   ```

2. **Start your frontend**:
   ```bash
   npm run dev
   ```

3. **Test MetaMask payment**:
   - Go to Patent Search page
   - Click "AI Assistant"
   - Select "Integrated AI Search" tab
   - Choose "MetaMask" payment method
   - Complete test transaction

## 💰 **Payment Flow**

### **Direct Transfer Method (Simple)**
1. User clicks "Pay with MetaMask"
2. MetaMask opens with transaction details
3. User confirms transaction
4. ETH is sent directly to your wallet
5. Backend adds 3 search credits to user account

### **Smart Contract Method (Advanced)**
1. User interacts with deployed contract
2. Contract handles payment logic
3. Automatic refunds for overpayment
4. Event logs for better tracking
5. Owner can withdraw funds anytime

## 🔧 **Configuration Options**

### **Environment Variables**
```env
# Required: Your wallet address for receiving payments
VITE_PAYMENT_RECIPIENT_ADDRESS=0xYourWalletAddressHere

# Optional: Smart contract address (if using contract method)
VITE_PAYMENT_CONTRACT_ADDRESS=0xYourContractAddressHere

# Backend URL
VITE_BACKEND_URL=http://localhost:3001
```

### **Price Configuration**
The system automatically fetches current ETH price from CoinGecko API:
- **USD Amount**: $15.00 (configurable)
- **ETH Amount**: Calculated dynamically
- **Fallback Price**: 1 ETH = $2000 (if API fails)

## 🛡️ **Security Features**

### **Transaction Verification**
- Frontend verifies transaction success
- Backend logs all transactions
- Blockchain provides immutable record

### **Error Handling**
- User rejection: Graceful error message
- Insufficient funds: Clear error explanation
- Network issues: Automatic retry suggestions

### **Gas Optimization**
- Standard ETH transfer: 21,000 gas
- Smart contract: ~50,000 gas
- Gas price estimation included

## 📊 **Business Benefits**

### **Cost Comparison**
| Payment Method | Your Cost | User Experience |
|---------------|-----------|-----------------|
| **MetaMask** | 0% fees | Instant, crypto-native |
| **Stripe** | 2.9% + $0.30 | Familiar, card-based |

### **Revenue Impact**
- **MetaMask**: Keep 100% of payment (minus gas)
- **Stripe**: Keep ~95% of payment
- **Higher margins** with crypto payments

## 🎨 **User Experience**

### **Payment Method Selection**
Users see both options clearly:
- **MetaMask button**: Shows ETH amount and current USD value
- **Card button**: Shows $15.00 USD
- **Real-time ETH price** updates

### **Transaction Feedback**
- **Processing**: "Confirming Transaction..."
- **Success**: Shows transaction hash
- **Error**: Clear error message with solution

## 🔍 **Testing Checklist**

### **Testnet Testing**
- [ ] Deploy contract to Sepolia testnet
- [ ] Test MetaMask payment flow
- [ ] Verify credits are added correctly
- [ ] Test error scenarios (rejection, insufficient funds)
- [ ] Check transaction verification

### **Mainnet Preparation**
- [ ] Deploy to mainnet
- [ ] Update contract address in .env
- [ ] Test with small amounts first
- [ ] Monitor gas prices
- [ ] Set up transaction monitoring

## 🚨 **Important Notes**

### **Gas Fees**
- Users pay gas fees (typically $5-20 on Ethereum)
- Consider Layer 2 solutions (Polygon, Arbitrum) for lower fees
- Gas fees are separate from your $15 payment

### **Price Volatility**
- ETH amount updates in real-time
- Users see current USD equivalent
- Consider price buffers for volatility

### **Network Support**
Currently supports:
- **Ethereum Mainnet**
- **Sepolia Testnet**
- Easy to add other networks

## 🔧 **Advanced Features**

### **Multi-Network Support**
Add support for other networks:
```javascript
// In cryptoPaymentService.ts
const SUPPORTED_NETWORKS = {
  1: 'Ethereum Mainnet',
  137: 'Polygon',
  42161: 'Arbitrum One'
};
```

### **Token Payments**
Extend to accept ERC-20 tokens:
- USDC for stable pricing
- Your own project token
- Popular DeFi tokens

### **Subscription Model**
Use smart contracts for:
- Monthly subscriptions
- Bulk payment discounts
- Loyalty rewards

## 📈 **Analytics & Monitoring**

### **Track These Metrics**
- **Payment method preference** (MetaMask vs Stripe)
- **Transaction success rate**
- **Average gas costs**
- **User conversion by payment method**

### **Monitoring Tools**
- **Etherscan**: Transaction monitoring
- **Backend logs**: Payment processing
- **Frontend analytics**: User behavior

## 🎉 **Launch Checklist**

- [ ] Wallet address configured
- [ ] Contract deployed (if using)
- [ ] Backend endpoints tested
- [ ] Frontend payment flow tested
- [ ] Error handling verified
- [ ] Gas estimation working
- [ ] Price updates functioning
- [ ] Transaction verification active
- [ ] User documentation updated
- [ ] Support team trained

## 💡 **Pro Tips**

1. **Start with direct transfers** (simpler implementation)
2. **Add contract later** for advanced features
3. **Test thoroughly on testnet** before mainnet
4. **Monitor gas prices** and inform users
5. **Consider Layer 2** for lower fees
6. **Provide clear error messages** for better UX

Your crypto payment system is now ready to provide a seamless Web3 experience for your NFT marketplace users! 🚀

The integration gives users the choice between traditional payments and crypto, maximizing your potential user base while reducing payment processing costs.
