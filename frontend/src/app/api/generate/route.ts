import { NextRequest } from "next/server";
import { streamText, convertToModelMessages } from "ai";
import { getCodeGenerationAgent } from "@/lib/agent/code-generation-agent";
import { codeGenerationTools } from "@/lib/tools/code-generation-tools";

/**
 * POST /api/generate
 * Generates profile page code using an AI agent with tool calling
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body - expecting messages array from useChat
    const body = await request.json();

    console.log("Received request body:", JSON.stringify(body, null, 2));

    // Get messages from request (AI SDK 5.0 format)
    const uiMessages = body.messages || [];

    console.log("Processing request with", uiMessages.length, "messages");
    console.log("Last message:", uiMessages[uiMessages.length - 1]);

    // Convert UIMessages to ModelMessages
    const messages = convertToModelMessages(uiMessages);

    console.log("Converted to", messages.length, "model messages");

    // Get the code generation agent
    const agent = getCodeGenerationAgent();

    console.log(
      "Agent configured with system prompt length:",
      agent.system.length
    );
    console.log("Available tools:", Object.keys(codeGenerationTools));
    console.log("Model info:", {
      modelId: agent.model.modelId,
      provider: agent.model.provider,
    });

    console.log("Starting streamText...");

    // Use streamText with the agent for proper streaming
    const result = streamText({
      model: agent.model,
      system: agent.system,
      messages,
      tools: codeGenerationTools,
      toolChoice: "auto", // Let AI decide when to use tools or send text
      experimental_telemetry: {
        isEnabled: true,
        functionId: "code-generation",
      },
      // Set reasoning_effort to low for faster responses (GPT-5 optimization)
      providerOptions: {
        openai: {
          reasoning_effort: "low",
        },
      },
      onStepFinish: ({ toolCalls, toolResults, text, finishReason }) => {
        console.log("=== STEP FINISHED ===");
        console.log("Finish reason:", finishReason);
        console.log("Text generated:", text?.substring(0, 200));
        if (toolCalls && toolCalls.length > 0) {
          console.log(`Tool calls (${toolCalls.length}):`, toolCalls.map(tc => ({
            toolName: tc.toolName,
            argsLength: JSON.stringify(tc.args).length,
            contentLength: (tc.args as unknown).content?.length || 0,
          })));
        }
        if (toolResults && toolResults.length > 0) {
          console.log("Tool results:", JSON.stringify(toolResults, null, 2));
        }
      },
      onFinish: ({ text, toolCalls, finishReason, usage }) => {
        console.log("=== GENERATION FINISHED ===");
        console.log("Finish reason:", finishReason);
        console.log("Total text length:", text?.length);
        console.log("Total tool calls:", toolCalls?.length);
        console.log("Token usage:", usage);
      },
    });

    console.log("StreamText result created, returning response...");

    // Try to consume the stream to see if there are any errors
    const response = result.toUIMessageStreamResponse();
    
    console.log("Response created, headers:", {
      contentType: response.headers.get("content-type"),
      status: response.status,
    });

    // Return the streaming response as UIMessageStream (AI SDK 5.0 compatible)
    // This format includes tool calls and results that the frontend can process
    return response;
  } catch (error) {
    console.error("Error in /api/generate:", error);

    // Return error as JSON
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
