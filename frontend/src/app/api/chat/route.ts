import { streamText, convertToModelMessages } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, model, webSearch } = await req.json();

    console.log('Received request body:', { 
      messagesCount: messages?.length, 
      model, 
      webSearch,
      firstMessage: messages?.[0]
    });

    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid messages:', messages);
      return new Response('Messages array is required', { status: 400 });
    }

    // Check if Azure OpenAI is configured
    if (!process.env.AZURE_OPENAI_API_KEY || !process.env.AZURE_OPENAI_ENDPOINT) {
      return new Response('Azure OpenAI not configured', { status: 503 });
    }

    // Configure Azure OpenAI using the working pattern from your other code
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT || '';
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-5';
    
    console.log('Azure OpenAI Config:', {
      endpoint,
      deploymentName,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION,
      hasApiKey: !!process.env.AZURE_OPENAI_API_KEY,
      requestedModel: model,
      webSearch
    });

    const openAIProvider = createOpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY || '',
      baseURL: endpoint,
    });

    // Use the deployment name directly as the model
    const azureModel = openAIProvider(deploymentName);

    // Add system message for ProfileBase context with emphasis on concise responses
    const systemMessage = {
      role: 'system' as const,
      content: `You are an AI assistant for ProfileBase, a universal platform that enables AI agents to discover and connect with people worldwide.

RESPONSE STYLE: Keep responses SHORT and CONCISE. Use 1-3 sentences maximum. Be direct and actionable.

ProfileBase allows:
- Anyone to create a discoverable profile with personal information, interests, bio, and skills
- AI agents to find and request meetings with any person
- People to optionally offer quotes/services if they choose
- Complete privacy control - users decide what AI agents can access

Your role is to help users:
1. Find experts and professionals based on skills, interests, or needs
2. Book appointments or request meetings with people
3. Navigate the platform and understand its features
4. Get help with profile creation and management

Be helpful, friendly, and focus on connecting people through AI-powered discovery. Always give brief, actionable responses.

${webSearch ? 'You have web search capabilities enabled for this conversation.' : ''}`
    };

    // Convert UI messages to model messages and combine with system message
    const modelMessages = convertToModelMessages(messages);
    const allMessages = [systemMessage, ...modelMessages];

    const result = await streamText({
      model: azureModel,
      messages: allMessages,
      maxTokens: 300, // Reduced for shorter responses
      temperature: 0.7,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}