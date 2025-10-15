# Azure OpenAI API Version Fix

## Issue
The Azure OpenAI API was rejecting requests with:
```
API version not supported: 2024-12-01-preview
```

## Root Cause
The API version `2024-12-01-preview` is not yet available or supported by the Azure OpenAI service in the East US 2 region.

## Solution
Changed to use a stable, widely-supported API version: `2024-08-01-preview`

### Updated Configuration (`frontend/src/lib/ai-config.ts`)

```typescript
export const azure = createAzure({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  resourceName: "admin-mes8t10w-eastus2",
  apiVersion: "2024-08-01-preview", // Stable version
});
```

## Why This Works

1. **Stable API Version**: `2024-08-01-preview` is a well-established version that's widely supported
2. **Direct Resource Name**: Using the exact resource name from your Azure deployment
3. **Simplified Configuration**: Removed complex endpoint parsing that was causing issues

## Supported Azure OpenAI API Versions

Common stable versions:
- `2024-08-01-preview` ✅ (recommended)
- `2024-06-01` ✅
- `2024-05-01-preview` ✅
- `2024-02-01` ✅

## Testing

After this change:
1. Restart the Next.js dev server
2. Visit `/build`
3. Enter a prompt
4. The AI should now respond successfully

## Your Azure Setup

- **Resource**: `admin-mes8t10w-eastus2`
- **Region**: East US 2
- **Deployment**: `gpt-5`
- **API Version**: `2024-08-01-preview` (now using stable version)

## If Issues Persist

If you still see errors, try these API versions in order:
1. `2024-06-01` (most stable)
2. `2024-05-01-preview`
3. `2024-02-01`

Update in `frontend/src/lib/ai-config.ts`:
```typescript
apiVersion: "2024-06-01", // Try this if 2024-08-01-preview doesn't work
```
