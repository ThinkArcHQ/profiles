# Azure OpenAI Configuration Fix

## Issue
The AI was not working due to an incorrect Azure OpenAI API version:
```
API version not supported
api-version=2024-10-21-preview
```

## Root Cause
The Azure OpenAI deployment `gpt-5` requires API version `2024-12-01-preview`, but the code was using `2024-10-21-preview`.

## Solution

### 1. Updated AI Config (`frontend/src/lib/ai-config.ts`)

**Before:**
```typescript
apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-10-21-preview',
```

**After:**
```typescript
apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview',
```

### 2. Updated Environment Variable (`frontend/.env.local`)

**Before:**
```
AZURE_OPENAI_API_VERSION=2024-10-21-preview
```

**After:**
```
AZURE_OPENAI_API_VERSION=2024-12-01-preview
```

## Azure OpenAI Deployment Details

- **Deployment Name**: `gpt-5`
- **Endpoint**: `https://admin-mes8t10w-eastus2.cognitiveservices.azure.com/`
- **API Version**: `2024-12-01-preview`
- **Deployment Type**: Global Standard
- **Status**: Successfully provisioned

## Python Example (for reference)
```python
from openai import AzureOpenAI

client = AzureOpenAI(
    api_version="2024-12-01-preview",
    azure_endpoint="https://admin-mes8t10w-eastus2.cognitiveservices.azure.com/",
    api_key=subscription_key
)
```

## Testing

After this fix, the AI should work correctly:

1. Visit `/build`
2. Enter a prompt like "Create a modern profile page"
3. The AI should stream the response and generate code

## Next Steps

If you still see errors, check:
1. The API key is valid and not expired
2. The deployment `gpt-5` is active in Azure
3. The endpoint URL is correct
4. You have sufficient quota/credits

## Related Files

- `frontend/src/lib/ai-config.ts` - AI configuration
- `frontend/.env.local` - Environment variables
- `frontend/src/app/api/generate/route.ts` - API endpoint using the config
