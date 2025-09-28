/**
 * Privacy Middleware for API Routes
 * 
 * Provides middleware functions for enforcing privacy controls
 * in API endpoints and protecting sensitive data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrivacyService, PrivacyValidator } from '@/lib/services/privacy-service';
import { Profile, ProfileSearchFilters } from '@/lib/types/profile';

export interface PrivacyMiddlewareOptions {
  requireAuth?: boolean;
  allowOwnerOnly?: boolean;
  logAccess?: boolean;
  context?: 'api' | 'mcp' | 'search';
}

export interface RequestContext {
  userId?: string;
  isAuthenticated: boolean;
  userAgent?: string;
  ip?: string;
}

/**
 * Privacy middleware for profile access validation
 */
export class PrivacyMiddleware {
  /**
   * Validate profile access and return appropriate response
   */
  static validateProfileAccess(
    profile: Profile | null,
    context: RequestContext,
    options: PrivacyMiddlewareOptions = {}
  ): { allowed: boolean; response?: NextResponse } {
    const { requireAuth = false, allowOwnerOnly = false, context: apiContext = 'api' } = options;

    // Check if profile exists
    if (!profile) {
      return {
        allowed: false,
        response: NextResponse.json(
          PrivacyValidator.createPrivacySafeError('Profile not found', apiContext),
          { status: 404 }
        )
      };
    }

    // Check authentication requirement
    if (requireAuth && !context.isAuthenticated) {
      return {
        allowed: false,
        response: NextResponse.json(
          { error: 'Authentication required', code: 'UNAUTHORIZED' },
          { status: 401 }
        )
      };
    }

    // Check owner-only access
    if (allowOwnerOnly && context.userId !== profile.workosUserId) {
      return {
        allowed: false,
        response: NextResponse.json(
          PrivacyValidator.createPrivacySafeError('Access denied', apiContext),
          { status: 404 }
        )
      };
    }

    // Validate general profile access
    const accessValidation = PrivacyValidator.validateProfileAccess(
      profile,
      context.userId,
      'view'
    );

    if (!accessValidation.allowed) {
      return {
        allowed: false,
        response: NextResponse.json(
          PrivacyValidator.createPrivacySafeError(
            accessValidation.reason || 'Access denied',
            apiContext
          ),
          { status: 404 }
        )
      };
    }

    // Log access if required
    if (options.logAccess && PrivacyService.shouldLogAccess(profile, context.userId)) {
      this.logProfileAccess(profile, context, 'view');
    }

    return { allowed: true };
  }

  /**
   * Validate search request parameters
   */
  static validateSearchRequest(
    filters: ProfileSearchFilters,
    context: RequestContext,
    isMCPRequest: boolean = false
  ): { valid: boolean; response?: NextResponse } {
    const searchContext = {
      viewerId: context.userId,
      isPublicSearch: true,
      isMCPRequest
    };

    const validation = PrivacyValidator.validateSearchParams(filters, searchContext);

    if (!validation.valid) {
      return {
        valid: false,
        response: NextResponse.json(
          {
            error: 'Invalid search parameters',
            code: 'VALIDATION_ERROR',
            details: validation.errors
          },
          { status: 400 }
        )
      };
    }

    return { valid: true };
  }

  /**
   * Apply privacy filters to profile data before sending response
   */
  static sanitizeProfileResponse(
    profile: Profile,
    context: RequestContext,
    apiContext: 'api' | 'mcp' | 'search' = 'api'
  ): any {
    try {
      return PrivacyService.sanitizeProfileData(profile, context.userId, apiContext);
    } catch (error) {
      throw new Error('Access denied');
    }
  }

  /**
   * Apply privacy filters to multiple profiles
   */
  static sanitizeProfilesResponse(
    profiles: Profile[],
    context: RequestContext,
    apiContext: 'api' | 'mcp' | 'search' = 'api'
  ): any[] {
    const filteredProfiles = PrivacyService.filterProfilesForViewer(profiles, {
      viewerId: context.userId
    });

    return filteredProfiles.map(profile => 
      this.sanitizeProfileResponse(profile, context, apiContext)
    );
  }

  /**
   * Validate privacy settings update
   */
  static validatePrivacyUpdate(
    profile: Profile,
    updates: Partial<Pick<Profile, 'isPublic' | 'isActive'>>,
    context: RequestContext
  ): { valid: boolean; response?: NextResponse } {
    const validation = PrivacyService.validatePrivacyUpdate(
      profile,
      updates,
      context.userId
    );

    if (!validation.isValid) {
      return {
        valid: false,
        response: NextResponse.json(
          {
            error: 'Invalid privacy update',
            code: 'VALIDATION_ERROR',
            details: validation.errors
          },
          { status: 400 }
        )
      };
    }

    return { valid: true };
  }

  /**
   * Create request context from Next.js request
   */
  static createRequestContext(
    request: NextRequest,
    userId?: string
  ): RequestContext {
    return {
      userId,
      isAuthenticated: !!userId,
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.headers.get('x-forwarded-for') || 
          request.headers.get('x-real-ip') || 
          'unknown'
    };
  }

  /**
   * Log profile access for audit purposes
   */
  private static logProfileAccess(
    profile: Profile,
    context: RequestContext,
    action: 'view' | 'contact' | 'edit'
  ): void {
    // In a real application, this would log to a proper logging service
    console.log('Profile Access Log:', {
      profileId: profile.id,
      profileSlug: profile.slug,
      viewerId: context.userId,
      action,
      timestamp: new Date().toISOString(),
      ip: context.ip,
      userAgent: context.userAgent
    });
  }

  /**
   * Rate limiting for privacy-sensitive operations
   */
  static checkRateLimit(
    context: RequestContext,
    operation: 'search' | 'contact' | 'view',
    windowMs: number = 60000, // 1 minute
    maxRequests: number = 100
  ): { allowed: boolean; response?: NextResponse } {
    // This is a simplified rate limiting implementation
    // In production, you'd use Redis or a proper rate limiting service
    
    const key = `${context.ip || 'unknown'}-${operation}`;
    const now = Date.now();
    
    // For demo purposes, we'll just return allowed
    // Real implementation would track requests per IP/user
    return { allowed: true };
  }

  /**
   * Middleware wrapper for API routes
   */
  static withPrivacyProtection(
    handler: (
      request: NextRequest,
      context: RequestContext,
      params?: any
    ) => Promise<NextResponse>,
    options: PrivacyMiddlewareOptions = {}
  ) {
    return async (request: NextRequest, params?: any): Promise<NextResponse> => {
      try {
        // Extract user ID from request (this would typically come from auth middleware)
        const userId = request.headers.get('x-user-id') || undefined;
        const requestContext = this.createRequestContext(request, userId);

        // Check rate limiting
        const rateLimitCheck = this.checkRateLimit(
          requestContext,
          options.context === 'search' ? 'search' : 'view'
        );

        if (!rateLimitCheck.allowed) {
          return rateLimitCheck.response!;
        }

        // Call the actual handler
        return await handler(request, requestContext, params);
      } catch (error) {
        console.error('Privacy middleware error:', error);
        
        return NextResponse.json(
          {
            error: 'Internal server error',
            code: 'INTERNAL_ERROR'
          },
          { status: 500 }
        );
      }
    };
  }
}

/**
 * Utility functions for common privacy operations
 */
export class PrivacyUtils {
  /**
   * Check if request is from MCP client
   */
  static isMCPRequest(request: NextRequest): boolean {
    const userAgent = request.headers.get('user-agent') || '';
    const contentType = request.headers.get('content-type') || '';
    
    // Check for MCP-specific headers or user agents
    return userAgent.includes('mcp') || 
           userAgent.includes('model-context-protocol') ||
           request.headers.has('x-mcp-client');
  }

  /**
   * Extract search filters from request with validation
   */
  static extractSearchFilters(request: NextRequest): ProfileSearchFilters {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const filters: ProfileSearchFilters = {};

    // Extract query parameter
    const query = searchParams.get('q') || searchParams.get('query');
    if (query) {
      filters.query = query.trim();
    }

    // Extract skills parameter
    const skills = searchParams.get('skills');
    if (skills) {
      filters.skills = skills.split(',').map(s => s.trim()).filter(Boolean);
    }

    // Extract availableFor parameter
    const availableFor = searchParams.get('available_for') || searchParams.get('availableFor');
    if (availableFor) {
      filters.availableFor = availableFor.split(',').map(s => s.trim()).filter(Boolean);
    }

    // Extract pagination parameters
    const limit = searchParams.get('limit');
    if (limit) {
      const parsedLimit = parseInt(limit, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        filters.limit = Math.min(parsedLimit, 100); // Cap at 100
      }
    }

    const offset = searchParams.get('offset');
    if (offset) {
      const parsedOffset = parseInt(offset, 10);
      if (!isNaN(parsedOffset) && parsedOffset >= 0) {
        filters.offset = parsedOffset;
      }
    }

    return filters;
  }

  /**
   * Create privacy-safe pagination response
   */
  static createPaginationResponse(
    profiles: any[],
    total: number,
    limit: number = 10,
    offset: number = 0
  ) {
    return {
      profiles,
      pagination: {
        total,
        limit,
        offset,
        hasMore: total > offset + limit,
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Validate profile slug format
   */
  static validateSlugFormat(slug: string): { valid: boolean; error?: string } {
    if (!slug || typeof slug !== 'string') {
      return { valid: false, error: 'Slug is required' };
    }

    if (slug.length < 3 || slug.length > 50) {
      return { valid: false, error: 'Slug must be between 3 and 50 characters' };
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return { valid: false, error: 'Slug can only contain lowercase letters, numbers, and hyphens' };
    }

    if (slug.startsWith('-') || slug.endsWith('-')) {
      return { valid: false, error: 'Slug cannot start or end with a hyphen' };
    }

    if (slug.includes('--')) {
      return { valid: false, error: 'Slug cannot contain consecutive hyphens' };
    }

    return { valid: true };
  }
}