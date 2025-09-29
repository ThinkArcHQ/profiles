/**
 * Configuration for the ProfileBase MCP Server
 */

import { ServerConfig } from "../types/index.js";

/**
 * Default server configuration
 */
export const defaultConfig: ServerConfig = {
  baseUrl: "https://profilebase.ai",
  apiUrl: process.env.API_BASE_URL || "https://profilebase.ai/api",
  maxRequestsPerMinute: 60,
  enableLogging: process.env.NODE_ENV !== "production"
};

/**
 * Environment-specific configuration
 */
export function getConfig(): ServerConfig {
  return {
    baseUrl: process.env.MCP_BASE_URL || defaultConfig.baseUrl,
    apiUrl: process.env.API_BASE_URL || defaultConfig.apiUrl,
    maxRequestsPerMinute: parseInt(process.env.MAX_REQUESTS_PER_MINUTE || "60"),
    enableLogging: process.env.ENABLE_LOGGING === "true" || defaultConfig.enableLogging
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config: ServerConfig): void {
  if (!config.baseUrl || !isValidUrl(config.baseUrl)) {
    throw new Error("Invalid base URL in configuration");
  }

  if (!config.apiUrl || !isValidUrl(config.apiUrl)) {
    throw new Error("Invalid API URL in configuration");
  }

  if (config.maxRequestsPerMinute < 1 || config.maxRequestsPerMinute > 1000) {
    throw new Error("Max requests per minute must be between 1 and 1000");
  }
}

/**
 * Simple URL validation
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}