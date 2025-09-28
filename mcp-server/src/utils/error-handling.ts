/**
 * Error handling utilities for MCP Server
 */

/**
 * Custom error class for MCP-specific errors
 */
export class MCPError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number = 400) {
    super(message);
    this.name = "MCPError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Error codes used throughout the MCP server
 */
export const ErrorCodes = {
  UNKNOWN_TOOL: "UNKNOWN_TOOL",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  PROFILE_NOT_FOUND: "PROFILE_NOT_FOUND",
  PROFILE_FETCH_ERROR: "PROFILE_FETCH_ERROR",
  SEARCH_ERROR: "SEARCH_ERROR",
  MEETING_REQUEST_ERROR: "MEETING_REQUEST_ERROR",
  REQUEST_TYPE_NOT_ACCEPTED: "REQUEST_TYPE_NOT_ACCEPTED",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  INTERNAL_ERROR: "INTERNAL_ERROR"
} as const;

/**
 * Handle errors and format them for MCP responses
 */
export function handleError(error: unknown) {
  console.error("MCP Server Error:", error);

  if (error instanceof MCPError) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: true,
            code: error.code,
            message: error.message
          }, null, 2)
        }
      ],
      isError: true
    };
  }

  // Handle unknown errors
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          error: true,
          code: ErrorCodes.INTERNAL_ERROR,
          message: "An internal error occurred"
        }, null, 2)
      }
    ],
    isError: true
  };
}

/**
 * Log error with context
 */
export function logError(error: unknown, context: string, additionalData?: Record<string, any>) {
  const timestamp = new Date().toISOString();
  const errorData = {
    timestamp,
    context,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error,
    ...additionalData
  };

  console.error("MCP Server Error Log:", JSON.stringify(errorData, null, 2));
}

/**
 * Create standardized error responses
 */
export function createErrorResponse(code: string, message: string, details?: Record<string, any>) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          error: true,
          code,
          message,
          ...(details && { details })
        }, null, 2)
      }
    ],
    isError: true
  };
}

/**
 * Wrap async functions with error handling
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: string
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error, context, { args });
      throw error;
    }
  };
}