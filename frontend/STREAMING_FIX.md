# Streaming API Fix

## Issue
The `/api/generate` endpoint was throwing an error:
```
TypeError: result.toDataStreamResponse is not a function
```

## Root Cause
The code was using `toDataStreamResponse()` which doesn't exist in the Vercel AI SDK v5. The correct method for streaming text responses is `toTextStreamResponse()`.

## Solution

### 1. Fixed API Route (`frontend/src/app/api/generate/route.ts`)

**Before:**
```typescript
const result = streamText({
  model,
  messages,
  // ...config
});

return result.toDataStreamResponse(); // ❌ This method doesn't exist
```

**After:**
```typescript
const result = await streamText({
  model,
  messages,
  // ...config
});

return result.toTextStreamResponse(); // ✅ Correct method for text streaming
```

### 2. Updated Client Stream Handling (`frontend/src/app/build/client.tsx`)

**Before:**
The client was trying to parse Vercel AI SDK's data stream format with `0:` prefixes and JSON parsing:
```typescript
const lines = chunk.split('\n');
for (const line of lines) {
  if (line.startsWith('0:')) {
    const textData = line.substring(2);
    const parsed = JSON.parse(textData);
    // ...
  }
}
```

**After:**
Simplified to handle plain text streaming:
```typescript
// Decode the chunk as plain text
const chunk = decoder.decode(value, { stream: true });
accumulatedContent += chunk;

// Update UI and parse code blocks
setMessages(/* ... */);
const codeBlocks = parseCodeBlocks(accumulatedContent);
```

## How It Works Now

1. **API Route**: Uses `streamText()` from Vercel AI SDK to stream AI responses
2. **Response Format**: Returns a plain text stream via `toTextStreamResponse()`
3. **Client Handling**: Reads the stream as plain text chunks and accumulates them
4. **Real-time Updates**: 
   - Updates message content as chunks arrive
   - Parses code blocks from accumulated content
   - Updates file state for preview

## Benefits

- ✅ Simpler streaming implementation
- ✅ No complex data format parsing needed
- ✅ Works with Vercel AI SDK v5
- ✅ Real-time code block parsing
- ✅ Smooth UI updates during generation

## Testing

To test the fix:
1. Visit `/build`
2. Enter a prompt like "Create a profile page with a hero section"
3. Watch the AI response stream in real-time
4. Verify code blocks are parsed and displayed in the preview panel

## Related Files

- `frontend/src/app/api/generate/route.ts` - API endpoint
- `frontend/src/app/build/client.tsx` - Client-side streaming handler
- `frontend/src/lib/utils/code-parser.ts` - Code block parsing logic
