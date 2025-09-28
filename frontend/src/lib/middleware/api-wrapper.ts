/**
 * Comprehensive API Wrapper
 * 
 * Combines error handling, validation, monitoring, and security for all API endpoints.
 * This wrapper should be used for all new API routes to ensure consistent behavior.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { APIErrorHandler, APIErrorCodes } from '@/lib/utils/api-errors';
import { RequestValidator, ValidationSchema } from '@/lib/middleware/validation-middleware';
import { APIMonitor } from '@/lib/utils/api-monitoring';

/**
 * API endpoint configuration
 */
export interface APIEndpointConfig {
  endpoint: string;
  requireAuth?: boolean;
  allowedMethods?: string[];
  validation?: ValidationSchema;
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
  monitoring?: {
    enableLogging?: boolean;
    enableMetrics?: boolean;
    slowThreshold?: number;
  };
}

/**
 * API handler context
 */
export interface APIHandlerContext {
  requestId: string;
  user?: any;
  validatedData?: any;
  clientInfo: {
    ip?: string;
    userAgent?: string;
    userId?: string;
  };
}

/**
 * API handler function type
 */
export type APIHandler = (
  request: NextRequest,
  context: APIHandlerContext,
  params?: Record<string, string>
) => Promise<NextResponse>;

/**
 * Rate limiting storage (in-memory for simplicity, should use Redis in production)
 */
class RateLimitStorage {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();

  checkLimit(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const existing = this.requests.get(key);

    if (!existing || now > existing.resetTime) {
      // First request or window expired
      this.requests.set(key, { count: 1, resetTime: now + windowMs });
      return { allowed: true, remaining: limit - 1, resetTime: now + windowMs };
    }

    if (existing.count >= limit) {
      // Rate limit exceeded
      return { allowed: false, remaining: 0, resetTime: existing.resetTime };
    }

    // Increment count
    existing.count++;
    this.requests.set(key, existing);
    return { allowed: true, remaining: limit - existing.count, resetTime: existing.resetTime };
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.requests.entries()) {
      if (now > value.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

const rateLimitStorage = new RateLimitStorage();

// Cleanup expired rate limit entries every 5 minutes
setInterval(() => rateLimitStorage.cleanup(), 5 * 60 * 1000);

/**
 * API Wrapper class
 */
export class APIWrapper {
  /**
   * Create a comprehensive API endpoint wrapper
   */
  static create(config: APIEndpointConfig, handler: APIHandler) {
    return async (
      request: NextRequest,
      context?: { params: Record<string, string> }
    ): Promise<NextResponse> => {
      const { requestId, startTime, clientInfo } = APIMonitor.startRequest(request, config.endpoint);
      
      try {
        // 1. Method validation
        const allowedMethods = config.allowedMethods || ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
        if (!allowedMethods.includes(request.method)) {
          const error = APIErrorHandler.createMethodNotAllowedError(allowedMethods);
          APIMonitor.endRequest(requestId, startTime, request, error, config.endpoint, clientInfo, {
            code: APIErrorCodes.METHOD_NOT_ALLOWED,
            message: 'Method not allowed'
          });
          return error;
        }

        // 2. Rate limiting
        if (config.rateLimit) {
          const clientKey = clientInfo.ip || 'unknown';
          const rateLimitResult = rateLimitStorage.checkLimit(
            `${config.endpoint}:${clientKey}`,
            config.rateLimit.requests,
            config.rateLimit.windowMs
          );

          if (!rateLimitResult.allowed) {
            const error = APIErrorHandler.createError(
              'Rate limit exceeded',
              APIErrorCodes.RATE_LIMIT_EXCEEDED,
              {
                limit: config.rateLimit.requests,
                windowMs: config.rateLimit.windowMs,
                resetTime: rateLimitResult.resetTime,
              }
            );

            // Add rate limit headers
            error.headers.set('X-RateLimit-Limit', config.rateLimit.requests.toString());
            error.headers.set('X-RateLimit-Remaining', '0');
            error.headers.set('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000).toString());
            error.headers.set('Retry-After', Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString());

            APIMonitor.endRequest(requestId, startTime, request, error, config.endpoint, clientInfo, {
              code: APIErrorCodes.RATE_LIMIT_EXCEEDED,
              message: 'Rate limit exceeded'
            });
            return error;
          }
        }

        // 3. Authentication
        let user: any = undefined;
        if (config.requireAuth) {
          try {
            const authResult = await withAuth();
            user = authResult.user;
            
            if (!user) {
              const error = APIErrorHandler.createUnauthorizedError();
              APIMonitor.endRequest(requestId, startTime, request, error, config.endpoint, clientInfo, {
                code: APIErrorCodes.UNAUTHORIZED,
                message: 'Unauthorized'
              });
              return error;
            }

            clientInfo.userId = user.id;
          } catch (authError) {
            const error = APIErrorHandler.createUnauthorizedError('Authentication failed');
            APIMonitor.logError(
              config.endpoint,
              request.method,
              authError as Error,
              'authentication',
              APIErrorCodes.UNAUTHORIZED,
              { ...clientInfo, metadata: { requestId } }
            );
            APIMonitor.endRequest(requestId, startTime, request, error, config.endpoint, clientInfo, {
              code: APIErrorCodes.UNAUTHORIZED,
              message: 'Authentication failed'
            });
            return error;
          }
        }

        // 4. Request validation
        let validatedData: any = undefined;
        if (config.validation) {
          const validationResult = await RequestValidator.validateRequest(
            request,
            config.validation,
            context?.params
          );

          if (!validationResult.isValid) {
            const error = APIErrorHandler.createValidationError(
              'Request validation failed',
              validationResult.errors
            );
            APIMonitor.endRequest(requestId, startTime, request, error, config.endpoint, clientInfo, {
              code: APIErrorCodes.VALIDATION_ERROR,
              message: 'Validation failed'
            });
            return error;
          }

          validatedData = validationResult.data;
        }

        // 5. Call the actual handler
        const handlerContext: APIHandlerContext = {
          requestId,
          user,
          validatedData,
          clientInfo,
        };

        const response = await handler(request, handlerContext, context?.params);

        // 6. Add standard headers
        response.headers.set('X-Request-ID', requestId);
        response.headers.set('X-API-Version', '1.0');
        
        // Add rate limit headers if rate limiting is enabled
        if (config.rateLimit) {
          const clientKey = clientInfo.ip || 'unknown';
          const rateLimitResult = rateLimitStorage.checkLimit(
            `${config.endpoint}:${clientKey}`,
            config.rateLimit.requests,
            config.rateLimit.windowMs
          );
          
          response.headers.set('X-RateLimit-Limit', config.rateLimit.requests.toString());
          response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
          response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000).toString());
        }

        // 7. End monitoring
        APIMonitor.endRequest(requestId, startTime, request, response, config.endpoint, clientInfo);

        return response;

      } catch (error) {
        // Handle unexpected errors
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        APIMonitor.logError(
          config.endpoint,
          request.method,
          error as Error,
          'internal',
          APIErrorCodes.INTERNAL_ERROR,
          { ...clientInfo, metadata: { requestId } }
        );

        const errorResponse = APIErrorHandler.handleUnexpectedError(error, `handle ${config.endpoint}`);
        errorResponse.headers.set('X-Request-ID', requestId);

        APIMonitor.endRequest(requestId, startTime, request, errorResponse, config.endpoint, clientInfo, {
          code: APIErrorCodes.INTERNAL_ERROR,
          message: errorMessage
        });

        return errorResponse;
      }
    };
  }

  /**
   * Create a simple wrapper for endpoints that don't need complex configuration
   */
  static simple(
    endpoint: string,
    handler: APIHandler,
    options?: {
      requireAuth?: boolean;
      allowedMethods?: string[];
    }
  ) {
    return this.create(
      {
        endpoint,
        requireAuth: options?.requireAuth,
        allowedMethods: options?.allowedMethods,
      },
      handler
    );
  }

  /**
   * Create a wrapper for authenticated endpoints
   */
  static authenticated(
    endpoint: string,
    handler: APIHandler,
    options?: {
      allowedMethods?: string[];
      validation?: ValidationSchema;
    }
  ) {
    return this.create(
      {
        endpoint,
        requireAuth: true,
        allowedMethods: options?.allowedMethods,
        validation: options?.validation,
      },
      handler
    );
  }

  /**
   * Create a wrapper for public endpoints with validation
   */
  static validated(
    endpoint: string,
    validation: ValidationSchema,
    handler: APIHandler,
    options?: {
      allowedMethods?: string[];
      rateLimit?: { requests: number; windowMs: number };
    }
  ) {
    return this.create(
      {
        endpoint,
        validation,
        allowedMethods: options?.allowedMethods,
        rateLimit: options?.rateLimit,
      },
      handler
    );
  }

  /**
   * Create a wrapper for rate-limited endpoints
   */
  static rateLimited(
    endpoint: string,
    rateLimit: { requests: number; windowMs: number },
    handler: APIHandler,
    options?: {
      requireAuth?: boolean;
      allowedMethods?: string[];
      validation?: ValidationSchema;
    }
  ) {
    return this.create(
      {
        endpoint,
        rateLimit,
        requireAuth: options?.requireAuth,
        allowedMethods: options?.allowedMethods,
        validation: options?.validation,
      },
      handler
    );
  }
}

/**
 * Convenience functions for common patterns
 */

/**
 * Create a GET endpoint wrapper
 */
export function createGETEndpoint(
  endpoint: string,
  handler: APIHandler,
  options?: {
    requireAuth?: boolean;
    validation?: ValidationSchema;
  }
) {
  return APIWrapper.create(
    {
      endpoint,
      allowedMethods: ['GET'],
      requireAuth: options?.requireAuth,
      validation: options?.validation,
    },
    handler
  );
}

/**
 * Create a POST endpoint wrapper
 */
export function createPOSTEndpoint(
  endpoint: string,
  handler: APIHandler,
  options?: {
    requireAuth?: boolean;
    validation?: ValidationSchema;
    rateLimit?: { requests: number; windowMs: number };
  }
) {
  return APIWrapper.create(
    {
      endpoint,
      allowedMethods: ['POST'],
      requireAuth: options?.requireAuth,
      validation: options?.validation,
      rateLimit: options?.rateLimit,
    },
    handler
  );
}

/**
 * Create a PUT endpoint wrapper
 */
export function createPUTEndpoint(
  endpoint: string,
  handler: APIHandler,
  options?: {
    requireAuth?: boolean;
    validation?: ValidationSchema;
  }
) {
  return APIWrapper.create(
    {
      endpoint,
      allowedMethods: ['PUT'],
      requireAuth: options?.requireAuth,
      validation: options?.validation,
    },
    handler
  );
}

/**
 * Create a PATCH endpoint wrapper
 */
export function createPATCHEndpoint(
  endpoint: string,
  handler: APIHandler,
  options?: {
    requireAuth?: boolean;
    validation?: ValidationSchema;
  }
) {
  return APIWrapper.create(
    {
      endpoint,
      allowedMethods: ['PATCH'],
      requireAuth: options?.requireAuth,
      validation: options?.validation,
    },
    handler
  );
}

/**
 * Create a DELETE endpoint wrapper
 */
export function createDELETEEndpoint(
  endpoint: string,
  handler: APIHandler,
  options?: {
    requireAuth?: boolean;
    validation?: ValidationSchema;
  }
) {
  return APIWrapper.create(
    {
      endpoint,
      allowedMethods: ['DELETE'],
      requireAuth: options?.requireAuth,
      validation: options?.validation,
    },
    handler
  );
}