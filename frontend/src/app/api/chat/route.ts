import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText, convertToCoreMessages } from 'ai';
import { createPOSTEndpoint } from '@/lib/middleware/api-wrapper';
import { APIErrorHandler } from '@/lib/utils/api-errors';

const chatHandler = async (request: NextRequest, context: any) => {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return APIErrorHandler.createValidationError('Messages array is required');
    }

    // System prompt for the AI assistant
    const systemPrompt = `You are an AI assistant for a professional profile discovery platform. Your role is to help users:

1. **Find Experts**: Search for professionals based on skills, expertise, or industry
2. **Book Meetings**: Help schedule meetings with professionals
3. **Get Quotes**: Assist in requesting quotes for services

Key capabilities:
- Search through professional profiles using skills, keywords, or availability
- Help users craft meeting requests with proper context
- Guide users through the quote request process
- Provide information about professionals' expertise and availability

When users ask to find someone or book a meeting, guide them through the process step by step. Be helpful, professional, and concise.

Available actions you can help with:
- Searching for professionals by skills or keywords
- Helping draft meeting requests
- Explaining the quote request process
- Providing guidance on profile discovery

Always be helpful and guide users toward their goals of connecting with the right professionals.`;

    const result = await streamText({
      model: openai('gpt-4-turbo'),
      system: systemPrompt,
      messages: convertToCoreMessages(messages),
      maxTokens: 1000,
      temperature: 0.7,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return APIErrorHandler.createInternalServerError('Failed to process chat request');
  }
};

export const POST = createPOSTEndpoint('/api/chat', chatHandler, {
  rateLimit: { requests: 20, windowMs: 60000 }, // 20 requests per minute
});