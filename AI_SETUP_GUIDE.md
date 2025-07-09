# 🤖 AI-Powered Search Setup Guide

This guide will help you implement real AI-powered patent search in your NFT marketplace.

## 🎯 **AI Service Options**

### **Option 1: OpenAI GPT (Recommended)**
- **Best for**: Most accurate and powerful AI search
- **Cost**: ~$0.002 per search query
- **Setup time**: 5 minutes

### **Option 2: Google Gemini**
- **Best for**: Cost-effective with good performance
- **Cost**: ~$0.001 per search query
- **Setup time**: 5 minutes

### **Option 3: Hugging Face**
- **Best for**: Free tier available
- **Cost**: Free tier: 1000 requests/month
- **Setup time**: 10 minutes

## 🚀 **Quick Setup (OpenAI - Recommended)**

### Step 1: Get OpenAI API Key
1. Go to [OpenAI API](https://platform.openai.com/api-keys)
2. Create account and add payment method
3. Create new API key
4. Copy the key (starts with `sk-`)

### Step 2: Configure Environment
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your OpenAI API key to `.env`:
   ```env
   VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

### Step 3: Test AI Search
1. Start your development server:
   ```bash
   npm run dev
   ```

2. Go to the Patent Search page
3. Click "AI Assistant" mode
4. Try queries like:
   - "Find renewable energy patents from 2020-2023"
   - "Show me AI patents in healthcare"
   - "Search for battery technology innovations"

## 🔧 **Alternative Setup Options**

### Google Gemini Setup
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key
3. Add to `.env`:
   ```env
   VITE_GEMINI_API_KEY=your-gemini-api-key
   ```
4. Update `PatentSearchPage.tsx` to use `geminiService` instead of `aiSearchService`

### Hugging Face Setup
1. Go to [Hugging Face](https://huggingface.co/settings/tokens)
2. Create access token
3. Add to `.env`:
   ```env
   VITE_HUGGINGFACE_API_KEY=your-hf-token
   ```
4. Update `PatentSearchPage.tsx` to use `huggingFaceService`

## 🎨 **AI Features Included**

### 1. **Natural Language Processing**
- Converts queries like "renewable energy patents" to optimized USPTO search terms
- Understands context and intent

### 2. **Smart Search Term Generation**
- Automatically adds relevant synonyms and OR operators
- Optimizes for USPTO database structure

### 3. **Confidence Scoring**
- Shows how confident the AI is in its search strategy
- Helps users understand search quality

### 4. **Search Explanation**
- Explains the AI's search strategy
- Educational for users learning patent search

### 5. **Fallback Protection**
- If AI fails, falls back to rule-based search
- Ensures search always works

## 💡 **Example AI Queries**

Try these natural language queries:

**Technology Patents:**
- "Find AI patents in healthcare from the last 3 years"
- "Show me machine learning patents for medical diagnosis"
- "Search for blockchain patents in finance"

**Energy Patents:**
- "Find renewable energy patents with high efficiency"
- "Show me solar panel innovations from 2020-2024"
- "Search for battery technology breakthroughs"

**Medical Patents:**
- "Find drug delivery patents for cancer treatment"
- "Show me medical device patents for surgery"
- "Search for pharmaceutical patents from major companies"

## 🔒 **Security Best Practices**

1. **Never commit API keys** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate API keys** regularly
4. **Monitor API usage** to prevent unexpected charges
5. **Set usage limits** in your AI provider dashboard

## 📊 **Cost Estimation**

### OpenAI GPT-3.5-turbo
- **Input**: ~$0.0015 per 1K tokens
- **Output**: ~$0.002 per 1K tokens
- **Average search**: ~$0.002-0.005 per query

### Google Gemini Pro
- **Input**: ~$0.00025 per 1K tokens
- **Output**: ~$0.0005 per 1K tokens
- **Average search**: ~$0.001-0.002 per query

### Hugging Face
- **Free tier**: 1000 requests/month
- **Pro**: $9/month for 10K requests
- **Enterprise**: Custom pricing

## 🚀 **Next Steps**

1. **Choose your AI provider** (OpenAI recommended)
2. **Get API key** and add to `.env`
3. **Test the AI search** functionality
4. **Customize prompts** in the service files for better results
5. **Monitor usage** and costs
6. **Consider adding more AI features** like:
   - Auto-categorization
   - Patent similarity detection
   - Smart recommendations

## 🛠 **Troubleshooting**

### Common Issues:

**"AI service not available"**
- Check your API key is correct
- Verify you have credits/quota remaining
- Check network connectivity

**"Search returns no results"**
- AI might be generating invalid search terms
- Check USPTO API is working
- Try fallback search mode

**"High API costs"**
- Set usage limits in provider dashboard
- Implement caching for repeated queries
- Consider switching to cheaper provider

## 📚 **Advanced Customization**

You can customize the AI behavior by editing the prompt in each service file:

```typescript
// In aiSearchService.ts
private buildSearchPrompt(query: string): string {
  return `
Convert this natural language patent search query into USPTO search terms:
"${query}"

Focus on:
- Technical terminology
- Patent classification codes
- Inventor names and companies
- Date ranges and status

Provide optimized search terms with OR operators.
`;
}
```

This allows you to fine-tune the AI for your specific use case!
