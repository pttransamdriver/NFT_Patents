# 💳 AI Search Payment System Setup Guide

This guide will help you set up the dual payment system for AI-powered patent search.

## 🎯 **Payment Options for Users**

### **Option 1: User's Own API Key**
- Users provide their own OpenAI API key
- They pay OpenAI directly (~$0.002 per search)
- No revenue for you, but no costs either
- Good for power users

### **Option 2: Pay-Per-Search ($15 for 3 searches)**
- Users pay $15 for 3 AI searches through Stripe
- You handle the AI costs and keep the profit
- Estimated profit: ~$14.98 per package ($4.99 per search)
- Good for casual users who want multiple searches

## 🚀 **Quick Setup (15 minutes)**

### Step 1: Set Up Stripe Account
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Create account or sign in
3. Get your API keys:
   - **Publishable Key**: `pk_test_...` (for frontend)
   - **Secret Key**: `sk_test_...` (for backend)
4. Set up webhook endpoint (for production)

### Step 2: Configure Environment Variables

**Frontend (.env):**
```env
# AI Services
VITE_OPENAI_API_KEY=sk-your-openai-key-for-paid-searches
VITE_USPTO_API_KEY=your-uspto-api-key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Backend
VITE_BACKEND_URL=http://localhost:3001
```

**Backend (backend/.env):**
```env
# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Server
PORT=3001
NODE_ENV=development
```

### Step 3: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 4: Start Backend Server
```bash
cd backend
npm run dev
```

### Step 5: Test the System
1. Start frontend: `npm run dev`
2. Go to Patent Search page
3. Click "AI Assistant" mode
4. Try a search query
5. Choose payment option in modal

## 💰 **Revenue Model**

### **Cost Analysis:**
- **OpenAI API cost**: ~$0.015 per 3 searches (3 × $0.005)
- **Stripe fee**: 2.9% + $0.30 = ~$0.74 per $15 transaction
- **Your profit**: ~$14.24 per package ($4.75 per search)

### **Break-even Analysis:**
- **1 package/day**: $5,200/year profit (365 packages × $14.24)
- **10 packages/day**: $52,000/year profit
- **100 packages/day**: $520,000/year profit

## 🔧 **Advanced Configuration**

### Custom Pricing
Update the pricing in `AISearchModal.tsx`:
```typescript
const SEARCH_PRICE = 1500; // $15.00 in cents
```

### Bulk Pricing
Add package deals in the modal:
- 5 searches for $60 ($12 each)
- 10 searches for $100 ($10 each)
- 25 searches for $200 ($8 each)

### Subscription Model
Consider adding monthly subscriptions:
- Basic: $29/month (5 searches)
- Pro: $99/month (20 searches)
- Enterprise: $299/month (unlimited)

## 🛡️ **Security Best Practices**

### API Key Protection
1. **Never store user API keys** in database
2. **Use session storage** for temporary storage
3. **Clear keys** after search completion
4. **Validate keys** before use

### Payment Security
1. **Use Stripe webhooks** for payment confirmation
2. **Validate payments** server-side
3. **Store minimal data** about transactions
4. **Use HTTPS** in production

### Rate Limiting
```javascript
// Add to backend
const rateLimit = require('express-rate-limit');

const searchLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 searches per windowMs
  message: 'Too many search requests, please try again later.'
});

app.use('/api/search', searchLimit);
```

## 📊 **Analytics & Monitoring**

### Track Key Metrics
1. **Search volume** (paid vs free)
2. **Revenue per user**
3. **API costs**
4. **Conversion rates** (modal views → payments)
5. **User retention**

### Recommended Tools
- **Stripe Dashboard**: Payment analytics
- **Google Analytics**: User behavior
- **Mixpanel**: Event tracking
- **Sentry**: Error monitoring

## 🚀 **Production Deployment**

### Backend Deployment (Railway/Heroku)
1. Deploy backend to cloud service
2. Set environment variables
3. Configure Stripe webhooks
4. Set up SSL certificate

### Frontend Updates
```env
# Production environment
VITE_BACKEND_URL=https://your-backend.railway.app
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
```

### Stripe Webhook Setup
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-backend.com/api/webhooks/stripe`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy webhook secret to environment variables

## 🎨 **UI/UX Improvements**

### Enhanced Modal Features
- **Search preview**: Show estimated results count
- **Price comparison**: Show cost vs OpenAI direct
- **User testimonials**: Social proof
- **Money-back guarantee**: Reduce friction

### Gamification
- **Search credits**: Visual credit counter
- **Achievement badges**: Power user rewards
- **Referral program**: Earn free searches
- **Loyalty discounts**: Bulk purchase incentives

## 🔍 **Testing Checklist**

### Payment Flow Testing
- [ ] Modal opens correctly
- [ ] User API key option works
- [ ] Payment option redirects to Stripe
- [ ] Payment success adds credits
- [ ] Payment failure shows error
- [ ] Credits are deducted correctly
- [ ] Search executes after payment

### Error Handling
- [ ] Invalid API keys show error
- [ ] Network failures are handled
- [ ] Payment failures are graceful
- [ ] Backend downtime is handled

## 📈 **Growth Strategies**

### Marketing Ideas
1. **Free trial**: 1 free AI search per user
2. **Content marketing**: Patent search tutorials
3. **API partnerships**: Integrate with legal tools
4. **Affiliate program**: Revenue sharing with referrers

### Feature Expansion
1. **Patent analysis**: AI-powered patent insights
2. **Prior art search**: Comprehensive patent research
3. **Patent monitoring**: Alert system for new patents
4. **Bulk search**: Enterprise features

## 💡 **Troubleshooting**

### Common Issues

**"Payment modal doesn't open"**
- Check if Web3 wallet is connected
- Verify backend is running
- Check browser console for errors

**"API key search fails"**
- Validate OpenAI API key format
- Check API key has sufficient credits
- Verify network connectivity

**"Payment processing stuck"**
- Check Stripe dashboard for payment status
- Verify webhook is receiving events
- Check backend logs for errors

### Support Resources
- [Stripe Documentation](https://stripe.com/docs)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [USPTO API Guide](https://developer.uspto.gov)

## 🎉 **Launch Checklist**

- [ ] Stripe account verified
- [ ] API keys configured
- [ ] Backend deployed
- [ ] Webhooks configured
- [ ] Payment flow tested
- [ ] Error handling verified
- [ ] Analytics set up
- [ ] Legal terms updated
- [ ] Customer support ready
- [ ] Marketing materials prepared

Your AI search payment system is now ready to generate revenue! 🚀
