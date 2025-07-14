# 🔌 API Integration Guide

This guide covers integrating with external APIs: Google Gemini for AI search and USPTO for patent verification.

## 🤖 AI Integration (Google Gemini)

### Why Gemini?
- **Cost-effective**: ~$0.001 per search query
- **Google Patents Integration**: Leverages Google's patent database
- **High Quality**: Excellent for patent analysis and search

### Setup Gemini API

#### Step 1: Get API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIza...`)

#### Step 2: Configure Environment
Add to your `.env` file:
```env
VITE_GEMINI_API_KEY=AIzaSyC-your-actual-api-key-here
```

#### Step 3: Test Integration
```bash
npm run dev
# Go to /search page
# Click "AI Assistant" mode
# Try: "Find renewable energy patents from 2020-2023"
```

### User API Key Support

The platform allows users to input their own API keys for:
- **Claude** (Anthropic)
- **ChatGPT** (OpenAI) 
- **Gemini** (Google)

#### Implementation
Users can:
1. Click "Use your own AI API Key" tab
2. Select AI provider
3. Enter their API key (stored locally, never sent to server)
4. Get unlimited searches with their own quota

#### Privacy Features
- API keys stored in browser localStorage only
- Never transmitted to your servers
- Clear privacy messaging in UI
- Option to clear stored keys

## 🏛️ USPTO API Integration

### Official USPTO API Access

#### Step 1: Apply for API Access
1. Go to [USPTO Developer Portal](https://developer.uspto.gov/)
2. Create developer account
3. Apply for API key (requires verification)
4. Wait for approval (can take 2-4 weeks)

#### Step 2: Configure USPTO Integration
Add to `.env`:
```env
VITE_USPTO_API_KEY=your_uspto_api_key_here
VITE_USPTO_BASE_URL=https://developer.uspto.gov/api/v1
```

#### Step 3: Available Endpoints
- **Patent Search**: `/patents/search`
- **Patent Details**: `/patents/{patent_number}`
- **Patent Status**: `/patents/{patent_number}/status`
- **Inventor Search**: `/inventors/search`

### Development Mode (Without USPTO Key)

For development, the app uses:
- Mock patent data from `src/data/mockData.ts`
- Simulated USPTO responses
- Test patent numbers for validation

#### Mock Data Features
- 20+ realistic patent entries
- Various categories (Computing, Medical, Energy, etc.)
- Proper patent number formats
- Complete patent information

## 🔧 Service Implementation

### Gemini Service (`geminiService.ts`)

Key functions:
```typescript
// AI-powered patent search
searchPatents(query: string, options?: SearchOptions)

// Patent analysis
analyzePatent(patentData: Patent)

// Search suggestions
generateSearchSuggestions(domain: string)
```

### USPTO Service (`usptoApi.ts`)

Key functions:
```typescript
// Search patents by query
searchPatents(params: SearchParams)

// Get specific patent
getPatentByNumber(patentNumber: string)

// Validate patent number format
validatePatentNumber(number: string)
```

## 💰 Payment Integration

### Multi-Token Support

The platform accepts:
- **ETH**: Direct Ethereum payments
- **USDC**: Stablecoin payments  
- **PSP**: Native platform tokens

#### Payment Flow
1. User initiates AI search
2. System checks token balances
3. User selects payment method
4. Smart contract processes payment
5. Search credits granted
6. AI search executed

### PSP Token Economics
- **1 PSP = $0.01 USD**
- **500 PSP per AI search = $5.00**
- **Users can purchase PSP with ETH**
- **Bulk discounts available**

## 🔒 Security Considerations

### API Key Security
- Never log API keys
- Store user keys in localStorage only
- Use environment variables for default keys
- Implement rate limiting

### USPTO Integration Security
- Validate all patent numbers
- Sanitize search queries
- Implement request throttling
- Cache responses appropriately

### Payment Security
- Use reentrancy guards
- Validate token transfers
- Implement pause functionality
- Multi-signature for admin functions

## 🧪 Testing APIs

### Test Gemini Integration
```bash
# In browser console on /search page
window.testGeminiAPI = async () => {
  const result = await geminiService.searchPatents("quantum computing");
  console.log(result);
}
```

### Test USPTO Integration
```bash
# Test patent lookup
window.testUSPTO = async () => {
  const patent = await usptoApi.getPatentByNumber("US10123456B2");
  console.log(patent);
}
```

## 📊 Rate Limits & Costs

### Gemini API
- **Free Tier**: 60 requests per minute
- **Paid Tier**: Higher limits available
- **Cost**: ~$0.001 per search

### USPTO API
- **Rate Limit**: 1000 requests per hour
- **Cost**: Free for approved developers
- **Throttling**: Built into service

## 🔄 Error Handling

### Common Error Scenarios
- Invalid API keys
- Rate limit exceeded
- Network timeouts
- Invalid patent numbers
- Insufficient payment tokens

### Error Recovery
- Graceful fallbacks to mock data
- User-friendly error messages
- Retry mechanisms with backoff
- Alternative payment methods

## 📈 Monitoring & Analytics

### Track API Usage
- Search query patterns
- API response times
- Error rates
- User payment preferences

### Performance Optimization
- Cache frequent searches
- Batch API requests
- Optimize token transfers
- Minimize blockchain calls

## 🚀 Production Checklist

Before going live:
- [ ] USPTO API key approved and configured
- [ ] Gemini API billing account set up
- [ ] Rate limiting implemented
- [ ] Error handling tested
- [ ] Payment flows verified
- [ ] Security audit completed
- [ ] Monitoring systems active
