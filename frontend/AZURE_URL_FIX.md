# Azure OpenAI URL Construction Fix

## Issue
The API was returning "Resource not found" (404) error:
```
URL: https://admin-mes8t10w-eastus2.cognitiveservices.azure.com/openai/deployments/responses
Error: Resource not found
```

## Root Cause
The OpenAI SDK was appending `/responses` to the baseURL instead of using the correct deployment name. This happened because:
1. The baseURL was set to `/openai/deployments` (without the deployment name)
2. The SDK then tried to append its own path, resulting in `/deployments/responses`

## Solution
Include the deployment name directly in the baseURL so the SDK appends the correct endpoint paths.

### Updated Configuration

**Before:**
```typescript
baseURL: `${baseEndpoint}/openai/deployments`
// SDK would create: /openai/deployments/responses ❌
```

**After:**
```typescript
baseURL: `${baseEndpoint}/openai/deployments/${deploymentName}`
// SDK creates: /openai/deployments/gpt-5/chat/completions ✅
```

## How It Works Now

### URL Construction Flow:
```
1. Base endpoint: https://admin-mes8t10w-eastus2.cognitiveservices.azure.com
2. Add deployment path: /openai/deployments/gpt-5
3. SDK appends: /chat/completions
4. Custom fetch adds: ?api-version=2024-06-01
5. Final URL: https://admin-mes8t10w-eastus2.cognitiveservices.azure.com/openai/deployments/gpt-5/chat/completions?api-version=2024-06-01
```

### Model Call:
```typescript
const azure = createAzureOpenAI();
// Use a placeholder model name since deployment is in baseURL
return azure.chat("gpt-4");
```

## Complete Configuration

```typescript
function createAzureOpenAI() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT || "";
  const apiKey = process.env.AZURE_OPENAI_API_KEY || "";
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-06-01";
  const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "";

  const baseEndpoint = endpoint.replace(/\/+$/, "").split("/openai")[0];

  return createOpenAI({
    apiKey,
    baseURL: `${baseEndpoint}/openai/deployments/${deploymentName}`,
    headers: {
      "api-key": apiKey,
    },
    fetch: (url, init) => {
      const urlObj = new URL(url.toString());
      urlObj.searchParams.set("api-version", apiVersion);
      return fetch(urlObj.toString(), init);
    },
  });
}

export function getAIModel() {
  const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

  if (deploymentName && process.env.AZURE_OPENAI_API_KEY) {
    const azure = createAzureOpenAI();
    return azure.chat("gpt-4"); // Placeholder, actual deployment in baseURL
  }

  if (process.env.OPENAI_API_KEY) {
    return openai("gpt-4o");
  }

  throw new Error("No AI provider configured");
}
```

## Environment Variables

Required in `frontend/.env.local`:
```env
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_ENDPOINT=https://admin-mes8t10w-eastus2.cognitiveservices.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-5
AZURE_OPENAI_API_VERSION=2024-06-01
```

## Testing

After this fix:
1. The server should automatically reload
2. Visit `http://localhost:3000/build`
3. Enter a prompt
4. The AI should now successfully stream responses

## Expected Request

The API will now make requests to:
```
POST https://admin-mes8t10w-eastus2.cognitiveservices.azure.com/openai/deployments/gpt-5/chat/completions?api-version=2024-06-01

Headers:
- api-key: {your-key}
- Content-Type: application/json

Body:
{
  "messages": [...],
  "stream": true,
  "temperature": 0.7,
  "max_tokens": 4000,
  "top_p": 0.9
}
```

## Why This Works

1. **Correct URL Structure**: Matches Azure's expected format
2. **Deployment in BaseURL**: SDK appends only the endpoint path
3. **API Version**: Added via custom fetch as query parameter
4. **Headers**: Includes Azure-specific `api-key` header

## Related Files

- `frontend/src/lib/ai-config.ts` - Fixed configuration
- `frontend/.env.local` - Environment variables
- `frontend/src/app/api/generate/route.ts` - Uses the model

## References

- [Azure OpenAI REST API](https://learn.microsoft.com/en-us/azure/ai-services/openai/reference)
- [Vercel AI SDK OpenAI Provider](https://sdk.vercel.ai/providers/ai-sdk-providers/openai)
