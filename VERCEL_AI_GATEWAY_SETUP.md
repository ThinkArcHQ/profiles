# Vercel AI Gateway Setup Guide

## Quick Setup Steps

### 1. Create Vercel AI Gateway Account
1. Go to [vercel.com/ai-gateway](https://vercel.com/ai-gateway)
2. Sign in with your Vercel account
3. Create a new AI Gateway project

### 2. Configure Azure OpenAI Provider
1. In your AI Gateway dashboard, click "Add Provider"
2. Select "Azure OpenAI" from the provider list
3. Enter your Azure OpenAI configuration:
   - **Endpoint**: `https://your-resource-name.openai.azure.com`
   - **API Key**: Your Azure OpenAI API key
   - **Deployment Name**: `gpt-4o` (or your preferred model)

### 3. Get Your AI Gateway API Key
1. In the AI Gateway dashboard, go to "API Keys"
2. Click "Create New Key"
3. Copy the generated API key

### 4. Update Environment Variables
Add to your `frontend/.env.local`:

```bash
AI_GATEWAY_API_KEY="your-actual-vercel-ai-gateway-api-key"
```

### 5. Test the Implementation
1. Start the development server: `npm run dev`
2. Visit the home page
3. Try the AI chat interface
4. Test with prompts like:
   - "Help me find an expert in React"
   - "I want to book an appointment"
   - "How does ProfileBase work?"

## Benefits of This Setup

✅ **Unified API**: Single interface for multiple AI providers  
✅ **No Vendor Lock-in**: Easy to switch between providers  
✅ **Built-in Rate Limiting**: Automatic handling  
✅ **Cost Management**: Unified billing and usage tracking  
✅ **Enhanced Security**: Centralized API key management  
✅ **Better Performance**: Optimized routing and caching  

## Troubleshooting

### Error: "Vercel AI Gateway API key not configured"
- Check that `AI_GATEWAY_API_KEY` is set in your environment variables
- Ensure the API key is valid and not expired

### Chat not responding
- Verify your Azure OpenAI provider is configured correctly in AI Gateway
- Check that your Azure OpenAI deployment is active
- Ensure the model name matches your deployment

### Rate limiting issues
- AI Gateway handles rate limiting automatically
- Check your usage in the AI Gateway dashboard
- Consider upgrading your plan if needed

## Model Configuration

The current implementation uses:
- **Provider**: Azure OpenAI via Vercel AI Gateway
- **Model**: `gpt-4o` (configured as `azure-openai/gpt-4o`)
- **Max Tokens**: 1000
- **Temperature**: 0.7

To change the model, update the `model` parameter in `frontend/src/app/api/chat/route.ts`:

```typescript
const result = await streamText({
  model: gateway('azure-openai/your-model-name'),
  // ... other options
});
```

## Next Steps

1. **Monitor Usage**: Check AI Gateway dashboard for usage analytics
2. **Optimize Prompts**: Refine system prompts based on user interactions
3. **Add More Providers**: Consider adding other AI providers for different use cases
4. **Implement Caching**: Add response caching for common queries
5. **Add Analytics**: Track chat usage and user satisfaction