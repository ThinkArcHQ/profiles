# AI Chat Implementation with Vercel AI Gateway

## Overview

Added an AI-powered chat interface to the ProfileBase dashboard home page that allows users to:

1. **Find Experts** - Search for people based on skills, interests, or expertise
2. **Book Appointments** - Schedule meetings with other users
3. **Get Help** - General assistance with ProfileBase features

## Implementation Details

### Components Added/Modified

1. **ChatInput Component** (`frontend/src/components/home/ChatInput.tsx`)
   - Simple, clean chat interface using Vercel AI SDK
   - Minimal design with just input box and send button
   - Real-time message display with user/AI distinction
   - Error handling for API issues
   - Responsive design matching ProfileBase theme

2. **MainFeed Component** (`frontend/src/components/home/MainFeed.tsx`)
   - Added ChatInput at the top of the main feed
   - Integrated with existing dashboard design system
   - Positioned prominently in the dashboard for authenticated users

3. **Chat API** (`frontend/src/app/api/chat/route.ts`)
   - **Updated to use Azure OpenAI directly**
   - Enhanced system prompt for ProfileBase-specific functionality
   - Handles appointment booking, profile discovery, and general help
   - Includes MCP (Model Context Protocol) awareness
   - Requires authentication for security
   - Error handling for missing Azure OpenAI credentials

### Features

- **Simple Input**: Clean input box with send button
- **Real-time Chat**: Streaming responses from Azure OpenAI GPT-4o
- **Error Handling**: Graceful handling of API errors and configuration issues
- **Responsive Design**: Works on desktop and mobile devices
- **Dashboard Integration**: Seamlessly integrated into the dashboard feed

### Configuration Required

To enable the AI chat functionality, set the Azure OpenAI credentials in your environment:

```bash
AZURE_OPENAI_API_KEY="your-azure-openai-api-key"
AZURE_OPENAI_ENDPOINT="https://your-resource-name.openai.azure.com"
AZURE_OPENAI_DEPLOYMENT_NAME="gpt-4o"
AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

#### Setting up Azure OpenAI

1. **Create Azure OpenAI Resource**:
   - Go to [Azure Portal](https://portal.azure.com)
   - Create a new Azure OpenAI resource
   - Deploy a GPT-4o model

2. **Get Credentials**:
   - Copy the API key from your Azure OpenAI resource
   - Copy the endpoint URL
   - Note your deployment name

3. **Configure Environment Variables**:
   - Add the credentials to your `frontend/.env.local` file
   - Restart your development server

### Usage Examples

Users can interact with the AI assistant by:

1. **Finding People**: "Help me find an expert in React development"
2. **Booking Appointments**: "I want to book an appointment with a data scientist"
3. **Getting Help**: "How do I create a profile on ProfileBase?"
4. **General Questions**: "What is ProfileBase and how does it work?"

### Technical Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **AI SDK**: Vercel AI SDK (@ai-sdk/react, ai)
- **AI Provider**: Azure OpenAI GPT-4o (direct integration)
- **Styling**: Tailwind CSS with custom ProfileBase theme
- **UI Components**: Radix UI primitives

### Benefits of Vercel AI Gateway

1. **Unified Interface**: Single API for multiple AI providers
2. **No Vendor Lock-in**: Easy to switch between providers
3. **Built-in Rate Limiting**: Automatic handling of rate limits
4. **Cost Management**: Unified billing and usage tracking
5. **Enhanced Security**: Centralized API key management

### Location

The chat interface is now located in the **dashboard home page** (`/home`) at the top of the main feed, not on the landing page. This ensures that:

- Only authenticated users can access the AI chat
- It's integrated into the main user workflow
- It doesn't clutter the public landing page
- It's positioned where users actively browse profiles

### Future Enhancements

1. **Posts Creation**: Add functionality to help users create posts (when posts feature is implemented)
2. **MCP Integration**: Direct integration with MCP endpoints for real-time profile search
3. **Voice Input**: Add speech-to-text capabilities
4. **Conversation Memory**: Persist chat history across sessions
5. **Advanced Actions**: Direct booking integration, profile suggestions
6. **Multi-Model Support**: Leverage different models for different tasks via AI Gateway

## Files Modified

- `frontend/src/components/home/ChatInput.tsx` - **New simple chat input component**
- `frontend/src/components/home/MainFeed.tsx` - **Added ChatInput to top of feed**
- `frontend/src/app/api/chat/route.ts` - **Updated to use Vercel AI Gateway with Azure OpenAI**
- `frontend/.env.local` - **Updated environment variables for AI Gateway**
- `frontend/src/app/page.tsx` - **Removed chat interface from landing page**

## Dependencies Used

All required dependencies were already present in the project:
- `ai` - Vercel AI SDK core with AI Gateway support
- `@ai-sdk/react` - React hooks for AI interactions
- Existing UI components (Button, Textarea)

## Environment Variables

```bash
# Azure OpenAI (direct integration)
AZURE_OPENAI_API_KEY="your-azure-openai-api-key"
AZURE_OPENAI_ENDPOINT="https://your-resource-name.openai.azure.com"
AZURE_OPENAI_DEPLOYMENT_NAME="gpt-4o"
AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

## Testing the Implementation

1. **Set up Vercel AI Gateway**:
   - Create account at [vercel.com/ai-gateway](https://vercel.com/ai-gateway)
   - Configure Azure OpenAI provider
   - Get your API key

2. **Update Environment Variables**:
   ```bash
   AZURE_OPENAI_API_KEY="your-actual-api-key"
   AZURE_OPENAI_ENDPOINT="https://your-resource-name.openai.azure.com"
   AZURE_OPENAI_DEPLOYMENT_NAME="gpt-4o"
   ```

3. **Test the Chat Interface**:
   - Sign in to the dashboard
   - Visit `/home`
   - Use the chat input at the top of the feed
   - Test various prompts related to ProfileBase functionality

## Error Handling

The implementation includes comprehensive error handling:

- **Configuration Errors**: Clear messages when API key is missing
- **Network Errors**: Graceful handling of connection issues
- **Rate Limiting**: Automatic handling via AI Gateway
- **User Feedback**: Visual error messages with dismiss functionality