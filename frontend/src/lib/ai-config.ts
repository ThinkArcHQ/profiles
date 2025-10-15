import { createOpenAI } from "@ai-sdk/openai";

/**
 * OpenAI configuration (fallback)
 */
export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Azure OpenAI configuration using OpenAI-compatible endpoint
 * Azure OpenAI supports the OpenAI API format
 */
function createAzureOpenAI() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT || "";
  const apiKey = process.env.AZURE_OPENAI_API_KEY || "";
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-06-01";

  // Azure endpoint format: https://{resource}.cognitiveservices.azure.com/openai/deployments/{deployment-id}
  // Remove trailing slash and any existing path
  const baseEndpoint = endpoint.replace(/\/+$/, "").split("/openai")[0];

  return createOpenAI({
    apiKey,
    // For Azure, we need to include the deployment name in the baseURL
    // The SDK will append the endpoint path (e.g., /chat/completions)
    baseURL: `${baseEndpoint}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
    headers: {
      "api-key": apiKey,
    },
    fetch: (url: RequestInfo | URL, init?: RequestInit) => {
      // Add api-version query parameter to all requests
      const urlString =
        typeof url === "string"
          ? url
          : url instanceof URL
          ? url.toString()
          : url.url;
      const urlObj = new URL(urlString);
      urlObj.searchParams.set("api-version", apiVersion);
      return fetch(urlObj.toString(), init);
    },
  });
}

/**
 * Get the configured AI model
 * Defaults to Azure OpenAI, falls back to OpenAI if Azure is not configured
 */
export function getAIModel() {
  const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

  if (deploymentName && process.env.AZURE_OPENAI_API_KEY) {
    const azure = createAzureOpenAI();
    // Use 'gpt-4' as a placeholder model name since the deployment is in the baseURL
    // The actual deployment name is already included in the baseURL
    return azure.chat("gpt-5");
  }

  // Fallback to OpenAI
  if (process.env.OPENAI_API_KEY) {
    return openai("gpt-4o");
  }

  throw new Error(
    "No AI provider configured. Please set AZURE_OPENAI_API_KEY or OPENAI_API_KEY"
  );
}

/**
 * Default generation settings
 */
export const DEFAULT_GENERATION_CONFIG = {
  temperature: 0.7,
  maxTokens: 4000,
  topP: 0.9,
};
