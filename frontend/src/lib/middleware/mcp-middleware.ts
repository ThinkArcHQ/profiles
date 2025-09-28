/**
 * MCP Middleware Wrapper
 * 
 * Combines rate limiting, security, and monitoring for MCP endpoints.
 * This middleware should be applied to all MCP API routes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { MCPRateLimiters, getClientIdentifier, createRateLimitHeaders, createRateLimitError } from './rate-limiter';
import { MCPSecurityValidator, extractClientInfo, createSecurityError } from './mcp-security';
import { MCPMonitoring, calculateSize } from './mcp-monitoring';

/**
 * MCP endpoint configuration
 */
export interface MCPEndpointConfig {
  endpoint: string;
  rateLimiter: keyof typeof MCPRateLimiters;
  requireAuth?: boolean;
  allowedMethods?: string[];
}

/**
 * MCP middleware result
 */
export interface MCPMiddlewareResult {
  allowed: boolean;
  response?: NextResponse;
  clientInfo: {
    ip: string;
    userAgent: string;
    origin?: string;
  };
  monitoring: {
    startTime: number;
    requestId: string;
  };
}

/**
 * MCP Middleware class
 */
export class MCPMiddleware {
  /**
   * Apply MCP middleware to a request
   */
  static async apply(
    request: NextRequest,
    config: MCPEndpointConfig
  ): Promise<MCPMiddlewareResult> {
    const clientInfo = extractClientInfo(request);
    const monitoring = MCPMonitoring.startRequest(config.endpoint, request.method);

    // 1. Security validation
    const securityResult = await MCPSecurityValidator.validateRequest(request);
    
    if (!securityResult.isValid) {
      MCPSecurityValidator.logSecurityEvent('blocked', {
        ...clientInfo,
        url: request.url,
        reason: securityResult.errors.join(', '),
        riskLevel: securityResult.riskLevel,
      });

      const errorResponse = createSecurityError(
        securityResult.errors.join(', '),
        'SECURITY_VALIDATION_FAILED'
      );

      const response = NextResponse.json(errorResponse, { 
        status: 400,
        headers: {
          ...MCPSecurityValidator.createSecurityHeaders(),
          ...MCPSecurityValidator.createCORSHeaders(clientInfo.origin),
        },
      });

      // Record failed request
      MCPMonitoring.endRequest(
        monitoring,
        config.endpoint,
        request.method,
        400,
        clientInfo.ip,
        clientInfo.userAgent,
        0,
        calculateSize(errorResponse),
        'SECURITY_VALIDATION_FAILED',
        securityResult.errors.join(', ')
      );

      return {
        allowed: false,
        response,
        clientInfo,
        monitoring,
      };
    }

    // Log security warnings
    if (securityResult.warnings.length > 0) {
      MCPSecurityValidator.logSecurityEvent('warning', {
        ...clientInfo,
        url: request.url,
        reason: securityResult.warnings.join(', '),
        riskLevel: securityResult.riskLevel,
      });
    }

    // 2. Method validation
    const allowedMethods = config.allowedMethods || ['GET', 'POST'];
    if (!allowedMethods.includes(request.method)) {
      const errorResponse = createSecurityError(
        `Method ${request.method} not allowed`,
        'METHOD_NOT_ALLOWED'
      );

      const response = NextResponse.json(errorResponse, { 
        status: 405,
        headers: {
          'Allow': allowedMethods.join(', '),
          ...MCPSecurityValidator.createSecurityHeaders(),
          ...MCPSecurityValidator.createCORSHeaders(clientInfo.origin),
        },
      });

      MCPMonitoring.endRequest(
        monitoring,
        config.endpoint,
        request.method,
        405,
        clientInfo.ip,
        clientInfo.userAgent,
        0,
        calculateSize(errorResponse),
        'METHOD_NOT_ALLOWED',
        `Method ${request.method} not allowed`
      );

      return {
        allowed: false,
        response,
        clientInfo,
        monitoring,
      };
    }

    // 3. Rate limiting
    const rateLimiter = MCPRateLimiters[config.rateLimiter];
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await rateLimiter.checkLimit(clientId);

    if (!rateLimitResult.allowed) {
      const errorResponse = createRateLimitError(rateLimitResult.resetTime);
      
      const response = NextResponse.json(errorResponse, { 
        status: 429,
        headers: {
          ...createRateLimitHeaders(rateLimitResult),
          ...MCPSecurityValidator.createSecurityHeaders(),
          ...MCPSecurityValidator.createCORSHeaders(clientInfo.origin),
          'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
        },
      });

      MCPMonitoring.endRequest(
        monitoring,
        config.endpoint,
        request.method,
        429,
        clientInfo.ip,
        clientInfo.userAgent,
        0,
        calculateSize(errorResponse),
        'RATE_LIMIT_EXCEEDED',
        'Rate limit exceeded'
      );

      return {
        allowed: false,
        response,
        clientInfo,
        monitoring,
      };
    }

    // 4. Request body validation (for POST requests)
    if (request.method === 'POST') {
      try {
        const body = await request.json();
        const bodyValidation = await MCPSecurityValidator.validateRequestBody(body);
        
        if (!bodyValidation.isValid) {
          const errorResponse = createSecurityError(
            bodyValidation.errors.join(', '),
            'REQUEST_BODY_VALIDATION_FAILED'
          );

          const response = NextResponse.json(errorResponse, { 
            status: 400,
            headers: {
              ...MCPSecurityValidator.createSecurityHeaders(),
              ...MCPSecurityValidator.createCORSHeaders(clientInfo.origin),
            },
          });

          MCPMonitoring.endRequest(
            monitoring,
            config.endpoint,
            request.method,
            400,
            clientInfo.ip,
            clientInfo.userAgent,
            calculateSize(body),
            calculateSize(errorResponse),
            'REQUEST_BODY_VALIDATION_FAILED',
            bodyValidation.errors.join(', ')
          );

          return {
            allowed: false,
            response,
            clientInfo,
            monitoring,
          };
        }

        // Log body validation warnings
        if (bodyValidation.warnings.length > 0) {
          MCPSecurityValidator.logSecurityEvent('suspicious', {
            ...clientInfo,
            url: request.url,
            reason: bodyValidation.warnings.join(', '),
            riskLevel: bodyValidation.riskLevel,
          });
        }
      } catch (error) {
        const errorResponse = createSecurityError(
          'Invalid JSON in request body',
          'INVALID_JSON'
        );

        const response = NextResponse.json(errorResponse, { 
          status: 400,
          headers: {
            ...MCPSecurityValidator.createSecurityHeaders(),
            ...MCPSecurityValidator.createCORSHeaders(clientInfo.origin),
          },
        });

        MCPMonitoring.endRequest(
          monitoring,
          config.endpoint,
          request.method,
          400,
          clientInfo.ip,
          clientInfo.userAgent,
          0,
          calculateSize(errorResponse),
          'INVALID_JSON',
          'Invalid JSON in request body'
        );

        return {
          allowed: false,
          response,
          clientInfo,
          monitoring,
        };
      }
    }

    // All checks passed
    return {
      allowed: true,
      clientInfo,
      monitoring,
    };
  }

  /**
   * Create a successful response with proper headers
   */
  static createSuccessResponse(
    data: any,
    status: number = 200,
    clientInfo: { origin?: string },
    rateLimitInfo?: { remaining: number; resetTime: number; totalHits: number }
  ): NextResponse {
    const headers: Record<string, string> = {
      ...MCPSecurityValidator.createSecurityHeaders(),
      ...MCPSecurityValidator.createCORSHeaders(clientInfo.origin),
    };

    // Add rate limit headers if provided
    if (rateLimitInfo) {
      Object.assign(headers, createRateLimitHeaders(rateLimitInfo));
    }

    return NextResponse.json(data, { status, headers });
  }

  /**
   * Finalize request monitoring
   */
  static finalizeRequest(
    monitoring: { startTime: number; requestId: string },
    endpoint: string,
    method: string,
    response: NextResponse,
    clientInfo: { ip: string; userAgent: string },
    requestSize: number = 0,
    errorCode?: string,
    errorMessage?: string
  ): void {
    const responseSize = calculateSize(response);
    
    MCPMonitoring.endRequest(
      monitoring,
      endpoint,
      method,
      response.status,
      clientInfo.ip,
      clientInfo.userAgent,
      requestSize,
      responseSize,
      errorCode,
      errorMessage
    );
  }

  /**
   * Handle OPTIONS requests (CORS preflight)
   */
  static handleOptions(clientInfo: { origin?: string }): NextResponse {
    return new NextResponse(null, {
      status: 200,
      headers: {
        ...MCPSecurityValidator.createCORSHeaders(clientInfo.origin),
        ...MCPSecurityValidator.createSecurityHeaders(),
      },
    });
  }
}

/**
 * Convenience function to wrap MCP endpoint handlers
 */
export function withMCPMiddleware(
  config: MCPEndpointConfig,
  handler: (
    request: NextRequest,
    context: {
      clientInfo: { ip: string; userAgent: string; origin?: string };
      monitoring: { startTime: number; requestId: string };
    }
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Handle OPTIONS requests
    if (request.method === 'OPTIONS') {
      const clientInfo = extractClientInfo(request);
      return MCPMiddleware.handleOptions(clientInfo);
    }

    // Apply middleware
    const middlewareResult = await MCPMiddleware.apply(request, config);
    
    if (!middlewareResult.allowed) {
      return middlewareResult.response!;
    }

    try {
      // Call the actual handler
      const response = await handler(request, {
        clientInfo: middlewareResult.clientInfo,
        monitoring: middlewareResult.monitoring,
      });

      // Finalize monitoring
      MCPMiddleware.finalizeRequest(
        middlewareResult.monitoring,
        config.endpoint,
        request.method,
        response,
        middlewareResult.clientInfo,
        calculateSize(await request.clone().text())
      );

      return response;
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorResponse = createSecurityError(
        'Internal server error',
        'INTERNAL_SERVER_ERROR'
      );

      const response = MCPMiddleware.createSuccessResponse(
        errorResponse,
        500,
        middlewareResult.clientInfo
      );

      MCPMiddleware.finalizeRequest(
        middlewareResult.monitoring,
        config.endpoint,
        request.method,
        response,
        middlewareResult.clientInfo,
        calculateSize(await request.clone().text()),
        'INTERNAL_SERVER_ERROR',
        errorMessage
      );

      // Log the error
      console.error(`MCP Endpoint Error (${config.endpoint}):`, error);

      return response;
    }
  };
}