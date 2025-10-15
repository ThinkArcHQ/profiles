# Code Generation API

## Overview

The `/api/generate` endpoint generates profile page code using AI based on user prompts and optional file uploads (images, PDFs). It streams responses in real-time using the Vercel AI SDK.

## Endpoint

```
POST /api/generate
```

## Request Body

```typescript
{
  prompt: string;                    // Required: User's description of desired profile page
  files?: {                          // Optional: Reference files for context
    images?: Array<{
      name: string;                  // File name
      mimeType: string;              // MIME type (e.g., 'image/png')
      base64Data: string;            // Base64-encoded image data
    }>;
    documents?: Array<{
      name: string;                  // File name
      text: string;                  // Extracted text content
    }>;
  };
  conversationHistory?: Array<{     // Optional: Previous messages for context
    role: 'user' | 'assistant';
    content: string;
  }>;
}
```

## Validation Rules

- **Prompt**: Required, non-empty string, max 10,000 characters
- **Images**: Max 5 images, each must have `name`, `mimeType`, and `base64Data`
- **Documents**: Max 5 documents, each must have `name` and `text`

## Response

The endpoint returns a streaming response using the Vercel AI SDK's data stream format. The AI generates code in real-time, which can be consumed on the client using the `useChat` or `useCompletion` hooks.

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded. Please try again later."
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Example Usage

### Basic Request
```typescript
const response = await fetch('/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Create a modern profile page for a software engineer with a hero section, skills, and contact form'
  })
});
```

### With Images
```typescript
const response = await fetch('/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Create a profile page using this design mockup',
    files: {
      images: [{
        name: 'mockup.png',
        mimeType: 'image/png',
        base64Data: 'data:image/png;base64,iVBORw0KG...'
      }]
    }
  })
});
```

### With Conversation History
```typescript
const response = await fetch('/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Make the colors more vibrant',
    conversationHistory: [
      { role: 'user', content: 'Create a profile page' },
      { role: 'assistant', content: 'Here is your profile page code...' }
    ]
  })
});
```

## System Prompt

The API uses a comprehensive system prompt that instructs the AI to:

1. **Generate frontend code only** - No backend, database, or API code
2. **Focus on profile pages** - Personal information, skills, experience, contact info
3. **Use modern technologies** - React/Next.js, TypeScript, Tailwind CSS
4. **Follow best practices** - Accessibility, responsive design, clean code
5. **Structure output properly** - File paths with code blocks

See `frontend/src/lib/prompts/profile-generator.ts` for the complete system prompt.

## AI Configuration

The endpoint uses Azure OpenAI by default, with fallback to OpenAI if Azure is not configured. Configuration is managed in `frontend/src/lib/ai-config.ts`.

### Environment Variables

```bash
# Azure OpenAI (primary)
AZURE_OPENAI_API_KEY=xxx
AZURE_OPENAI_ENDPOINT=xxx
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_API_VERSION=2024-10-21-preview

# OpenAI (fallback)
OPENAI_API_KEY=xxx
```

## Testing

Run tests with:
```bash
npm run test:run -- src/app/api/generate/__tests__/route.test.ts
```

## Related Files

- `frontend/src/app/api/generate/route.ts` - API route implementation
- `frontend/src/lib/ai-config.ts` - AI provider configuration
- `frontend/src/lib/prompts/profile-generator.ts` - System prompt
- `frontend/src/app/api/generate/__tests__/route.test.ts` - Unit tests
