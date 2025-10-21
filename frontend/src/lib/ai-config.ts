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

  console.log("🔧 Azure OpenAI Config:", {
    endpoint: endpoint.substring(0, 50) + "...",
    deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
    apiVersion,
    hasApiKey: !!apiKey,
  });

  // Azure endpoint format: https://{resource}.cognitiveservices.azure.com/openai/deployments/{deployment-id}
  // Remove trailing slash and any existing path
  const baseEndpoint = endpoint.replace(/\/+$/, "").split("/openai")[0];

  const baseURL = `${baseEndpoint}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`;
  
  console.log("🌐 Base URL:", baseURL);

  return createOpenAI({
    apiKey,
    // For Azure, we need to include the deployment name in the baseURL
    // The SDK will append the endpoint path (e.g., /chat/completions)
    baseURL,
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
      
      console.log("📡 Making request to:", urlObj.toString().substring(0, 100) + "...");
      
      return fetch(urlObj.toString(), init).then((response) => {
        console.log("📥 Response status:", response.status, response.statusText);
        if (!response.ok) {
          response.clone().text().then((text) => {
            console.error("❌ Error response body:", text.substring(0, 500));
          });
        }
        return response;
      });
    },
  });
}

/**
 * Get the configured AI model
 * Uses Azure OpenAI with GPT-5
 */
export function getAIModel() {
  const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

  if (!deploymentName || !process.env.AZURE_OPENAI_API_KEY) {
    throw new Error(
      "Azure OpenAI not configured. Please set AZURE_OPENAI_API_KEY and AZURE_OPENAI_DEPLOYMENT_NAME"
    );
  }

  const azure = createAzureOpenAI();
  // Use gpt-5 model
  return azure.chat("gpt-5");
}

/**
 * Default generation settings
 */
export const DEFAULT_GENERATION_CONFIG = {
  maxTokens: 4000,
};
