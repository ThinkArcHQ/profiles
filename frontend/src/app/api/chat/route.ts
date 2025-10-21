import { streamText, stepCountIs, convertToModelMessages } from 'ai';
import { getCodeGenerationAgent } from '@/lib/agent/code-generation-agent';
import { codeGenerationTools } from '@/lib/tools/code-generation-tools';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const uiMessages = body.messages || [];

    console.log('[/api/chat] Received request body:', {
      messagesCount: uiMessages?.length,
      firstMessage: uiMessages?.[0]
    });

    // Convert UIMessages to ModelMessages
    const messages = convertToModelMessages(uiMessages);

    console.log('[/api/chat] Converted to', messages.length, 'model messages');

    // Get the code generation agent
    const agent = getCodeGenerationAgent();

    console.log('[/api/chat] Using code generation agent with tools');
    console.log('[/api/chat] Available tools:', Object.keys(codeGenerationTools));

    // Use streamText with the agent and tools for proper code generation
    const result = streamText({
      model: agent.model,
      system: agent.system,
      messages,
      tools: codeGenerationTools,
      toolChoice: 'auto',
      stopWhen: stepCountIs(15),
      maxOutputTokens: 4096,
      onStepFinish: ({ toolCalls, toolResults, text }) => {
        console.log('[/api/chat] === STEP FINISHED ===');
        console.log('[/api/chat] Text generated:', text?.substring(0, 100));
        if (toolCalls && toolCalls.length > 0) {
          console.log('[/api/chat] Tool calls:', toolCalls.map(tc => tc.toolName));
        }
        if (toolResults && toolResults.length > 0) {
          console.log('[/api/chat] Tool results:', toolResults.map(tr => tr.toolName));
        }
      },
    });

    // Return as UIMessageStream to include tool calls and results
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('[/api/chat] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
