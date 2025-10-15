# Azure OpenAI Endpoint Fix

## Issue
The Azure OpenAI SDK was constructing incorrect URLs:
- Expected: `admin-mes8t10w-eastus2.cognitiveservices.azure.com`
- Got: `admin-mes8t10w-eastus2.openai.azure.com` ❌

This caused "API version not supported" errors.

## Root Cause
The `@ai-sdk/azure` package automatically constructs URLs using the `openai.azure.com` domain, but your Azure deployment uses the `cognitiveservices.azure.com` domain.

## Solution
Use the `@ai-sdk/openai` package with a custom fetch function to:
1. Use the correct cognitive services endpoint
2. Add the `api-version` query parameter to all requests
3. Include the `api-key` header

### Implementation (`frontend/src/lib/ai-config.ts`)

```typescript
function createAzureOpenAI() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT || '';
  const apiKey = process.env.AZURE_OPENAI_API_KEY || '';
  const apiVersion = '2024-08-01-preview';
  
  const baseEndpoint = endpoint.replace(/\/(openai\/v1\/)?$/, '');
  
  return createOpenAI({
    apiKey,
    baseURL: `${baseEndpoint}/openai/deployments`,
    headers: {
      'api-key': apiKey,
    },
    fetch: (url, init) => {
      // Add api-version query parameter
      const urlObj = new URL(urlString);
      urlObj.searchParams.set('api-version', apiVersion);
      return fetch(urlObj.toString(), init);
    },
  });
}
```

## How It Works

1. **Correct Endpoint**: Uses your actual endpoint `https://admin-mes8t10w-eastus2.cognitiveservices.azure.com`
2. **API Version**: Adds `?api-version=2024-08-01-preview` to all requests
3. **Authentication**: Includes `api-key` header for Azure authentication
4. **Deployment Path**: Constructs proper path `/openai/deployments/{deployment-name}`

## Request Flow

```
User Request
    ↓
getAIModel() → createAzureOpenAI()
    ↓
Custom fetch intercepts URL
    ↓
Adds ?api-version=2024-08-01-preview
    ↓
Final URL: https://admin-mes8t10w-eastus2.cognitiveservices.azure.com/openai/deployments/gpt-5/chat/completions?api-version=2024-08-01-preview
    ↓
Azure OpenAI API ✅
```

## Environment Variables Used

```env
AZURE_OPENAI_ENDPOINT=https://admin-mes8t10w-eastus2.cognitiveservices.azure.com/openai/v1/
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-5
AZURE_OPENAI_API_VERSION=2024-08-01-preview
```

## Testing

After this fix:
1. Restart the Next.js dev server
2. Visit `/build`
3. Enter a prompt
4. The AI should now successfully stream responses

## Benefits

✅ Uses correct Azure cognitive services endpoint
✅ Properly adds API version to requests  
✅ Works with Azure's authentication
✅ Compatible with OpenAI SDK features
✅ Easy to update API version in one place

## Fallback

If Azure is not configured, the system automatically falls back to OpenAI:
```typescript
if (process.env.OPENAI_API_KEY) {
  return openai("gpt-4o");
}
```
