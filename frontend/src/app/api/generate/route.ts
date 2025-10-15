import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { getAIModel, DEFAULT_GENERATION_CONFIG } from '@/lib/ai-config';
import { getProfileGeneratorSystemMessage, buildProfileGenerationPrompt } from '@/lib/prompts/profile-generator';

/**
 * Request body interface for code generation
 */
interface GenerateRequest {
  prompt: string;
  files?: {
    images?: Array<{
      name: string;
      mimeType: string;
      base64Data: string;
    }>;
    documents?: Array<{
      name: string;
      text: string;
    }>;
  };
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

/**
 * Validates the request body for code generation
 */
function validateRequest(body: unknown): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body is required' };
  }

  const req = body as Partial<GenerateRequest>;

  if (!req.prompt || typeof req.prompt !== 'string' || req.prompt.trim().length === 0) {
    return { valid: false, error: 'Prompt is required and must be a non-empty string' };
  }

  if (req.prompt.length > 10000) {
    return { valid: false, error: 'Prompt must be less than 10,000 characters' };
  }

  // Validate files if provided
  if (req.files) {
    if (req.files.images) {
      if (!Array.isArray(req.files.images)) {
        return { valid: false, error: 'Images must be an array' };
      }
      if (req.files.images.length > 5) {
        return { valid: false, error: 'Maximum 5 images allowed' };
      }
      for (const img of req.files.images) {
        if (!img.name || !img.mimeType || !img.base64Data) {
          return { valid: false, error: 'Each image must have name, mimeType, and base64Data' };
        }
      }
    }

    if (req.files.documents) {
      if (!Array.isArray(req.files.documents)) {
        return { valid: false, error: 'Documents must be an array' };
      }
      if (req.files.documents.length > 5) {
        return { valid: false, error: 'Maximum 5 documents allowed' };
      }
      for (const doc of req.files.documents) {
        if (!doc.name || !doc.text) {
          return { valid: false, error: 'Each document must have name and text' };
        }
      }
    }
  }

  return { valid: true };
}

/**
 * Builds the user message content with files
 */
function buildUserMessage(prompt: string, files?: GenerateRequest['files']) {
  const parts: Array<{ type: string; text?: string; image?: string; mimeType?: string }> = [];

  // Add text prompt
  parts.push({
    type: 'text',
    text: prompt,
  });

  // Add images if provided
  if (files?.images) {
    for (const image of files.images) {
      parts.push({
        type: 'image',
        image: image.base64Data,
        mimeType: image.mimeType,
      });
    }
  }

  // Add document text if provided
  if (files?.documents) {
    for (const doc of files.documents) {
      parts.push({
        type: 'text',
        text: `\n\n--- Content from ${doc.name} ---\n${doc.text}\n--- End of ${doc.name} ---\n`,
      });
    }
  }

  return parts;
}

/**
 * POST /api/generate
 * Generates profile page code based on user prompt and optional files
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate request
    const validation = validateRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { prompt, files, conversationHistory } = body as GenerateRequest;

    // Get AI model
    const model = getAIModel();

    // Build messages array
    const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string | unknown }> = [];

    // Determine if this is an iterative refinement (has conversation history)
    const isIterativeRefinement = conversationHistory && conversationHistory.length > 0;

    // Add system prompt (always first)
    messages.push(getProfileGeneratorSystemMessage(isIterativeRefinement));

    // Add conversation history if provided
    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
      })));
    }

    // Build enhanced user prompt with platform context
    const enhancedPrompt = buildProfileGenerationPrompt(prompt, isIterativeRefinement);

    // Add current user message with files
    messages.push({
      role: 'user' as const,
      content: buildUserMessage(enhancedPrompt, files),
    });

    // Stream the AI response
    const result = await streamText({
      model,
      messages,
      temperature: DEFAULT_GENERATION_CONFIG.temperature,
      maxTokens: DEFAULT_GENERATION_CONFIG.maxTokens,
      topP: DEFAULT_GENERATION_CONFIG.topP,
      onError: (error) => {
        console.error('AI streaming error:', error);
      },
    });

    // Return streaming response using toTextStreamResponse
    return result.toTextStreamResponse();

  } catch (error) {
    console.error('Error in /api/generate:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Handle AI provider errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'AI provider not configured. Please check your API keys.' },
          { status: 500 }
        );
      }
      
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
