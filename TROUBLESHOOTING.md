# Troubleshooting Guide

## Chat Functionality Issues

### Error: "handleSubmit is not a function"

This error occurs when the `useChat` hook from `@ai-sdk/react` fails to initialize properly. Here are the common causes and solutions:

#### 1. Missing AI Gateway API Key

**Symptoms:**
- Chat input shows "AI Chat Unavailable" warning
- Console error about configuration

**Solution:**
```bash
# Add to frontend/.env.local
AI_GATEWAY_API_KEY="your-actual-vercel-ai-gateway-api-key"
```

#### 2. Vercel AI Gateway Not Set Up

**Symptoms:**
- API returns 503 error
- Error message about AI Gateway configuration

**Solution:**
1. Go to [vercel.com/ai-gateway](https://vercel.com/ai-gateway)
2. Create an account and set up a gateway
3. Configure Azure OpenAI provider
4. Get your API key and add it to environment variables

#### 3. Network/API Issues

**Symptoms:**
- Chat loads but fails to send messages
- Network errors in browser console

**Solution:**
1. Check if `/api/chat` endpoint is accessible
2. Verify your internet connection
3. Check browser network tab for failed requests

#### 4. Development vs Production

**Symptoms:**
- Works in development but not in production
- Environment variables not loading

**Solution:**
1. Ensure environment variables are set in production
2. For Vercel deployment, add `AI_GATEWAY_API_KEY` in project settings
3. Restart your application after adding environment variables

### Testing the Chat API

You can test the chat API directly:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

Expected response: Streaming text response from AI

### Debug Mode

The ChatInput component includes debug logging. Check your browser console for:

```
Chat hook state: {
  hasHandleSubmit: true/false,
  hasInput: true/false,
  hasHandleInputChange: true/false,
  messagesLength: 0,
  isLoading: false
}
```

If `hasHandleSubmit` is `false`, the hook failed to initialize.

### Common Environment Variable Issues

1. **Wrong file location**: Make sure `.env.local` is in the `frontend/` directory
2. **Typo in variable name**: Must be exactly `AI_GATEWAY_API_KEY`
3. **Missing quotes**: Use quotes around the API key value
4. **Cached environment**: Restart your development server after changes

### Fallback Behavior

The ChatInput component includes several fallback mechanisms:

1. **Loading State**: Shows "Initializing AI chat..." when hook is loading
2. **Error Handling**: Displays user-friendly error messages
3. **Graceful Degradation**: Disables input when chat is unavailable
4. **Configuration Warnings**: Shows setup instructions when not configured

### Getting Help

If you're still experiencing issues:

1. Check the browser console for detailed error messages
2. Verify your Vercel AI Gateway setup
3. Test the API endpoint directly
4. Ensure all environment variables are correctly set
5. Try restarting your development server

### Quick Fix Checklist

- [ ] `AI_GATEWAY_API_KEY` is set in `frontend/.env.local`
- [ ] Vercel AI Gateway account is set up
- [ ] Azure OpenAI provider is configured in AI Gateway
- [ ] Development server has been restarted
- [ ] Browser console shows no network errors
- [ ] `/api/chat` endpoint returns valid responses