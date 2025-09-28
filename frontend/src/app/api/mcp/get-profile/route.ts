import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ProfileTransformer } from '@/lib/types/profile';
import { PrivacyService } from '@/lib/services/privacy-service';
import { AnalyticsService } from '@/lib/services/analytics-service';
import { MCPErrorHandler, MCPErrorCodes } from '@/lib/utils/mcp-errors';
import { withMCPMiddleware, MCPMiddleware } from '@/lib/middleware/mcp-middleware';

/**
 * MCP Tool: get_profile
 * 
 * Get detailed information about a person by their profile slug
 * This endpoint is designed for AI agent consumption via MCP
 */
export const POST = withMCPMiddleware(
  {
    endpoint: 'get_profile',
    rateLimiter: 'getProfile',
    allowedMethods: ['POST'],
  },
  async (request: NextRequest, context) => {
  try {
    const body = await request.json();
    const { profileSlug } = body;

    // Validate required fields
    if (!profileSlug) {
      const errorResponse = MCPErrorHandler.createProfileError(
        'Missing required field: profileSlug',
        MCPErrorCodes.VALIDATION_ERROR
      );
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate slug format
    const validation = MCPErrorHandler.validateCommonParams({ profileSlug });
    if (!validation.isValid) {
      const errorResponse = MCPErrorHandler.createProfileError(
        `Validation failed: ${validation.errors.join(', ')}`,
        MCPErrorCodes.INVALID_SLUG_FORMAT,
        { errors: validation.errors }
      );
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const sanitizedSlug = String(profileSlug).toLowerCase().trim();

    // Find profile by slug
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.slug, sanitizedSlug));

    if (!profile) {
      const errorResponse = MCPErrorHandler.createProfileError(
        'Profile not found',
        MCPErrorCodes.PROFILE_NOT_FOUND
      );
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Check if profile can be viewed (privacy check)
    if (!PrivacyService.canViewProfile(profile)) {
      // Return privacy-safe error
      const errorResponse = MCPErrorHandler.createPrivacySafeError(
        'Profile is private',
        'profile'
      );
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Track AI agent profile view
    await AnalyticsService.trackProfileView(profile.id, 'ai_agent', request);

    // Transform to MCP profile format (excludes sensitive information)
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const mcpProfile = ProfileTransformer.toMCPProfile(profile, baseUrl);

    // Log successful MCP profile access (without sensitive data)
    if (process.env.NODE_ENV === 'development') {
      console.log(`MCP Profile accessed: slug=${sanitizedSlug}, name=${profile.name}`);
    }

    // Return MCP-compatible response
    return MCPMiddleware.createSuccessResponse({
      found: true,
      profile: mcpProfile,
    }, 200, context.clientInfo);

  } catch (error) {
    MCPErrorHandler.logError('get_profile', error as Error, { 
      profileSlug: body.profileSlug 
    });
    
    const errorResponse = MCPErrorHandler.createProfileError(
      'Internal server error',
      MCPErrorCodes.INTERNAL_ERROR
    );
    return MCPMiddleware.createSuccessResponse(errorResponse, 500, context.clientInfo);
  }
});

// GET method for testing purposes (not part of MCP spec)
export const GET = withMCPMiddleware(
  {
    endpoint: 'get_profile_get',
    rateLimiter: 'getProfile',
    allowedMethods: ['GET'],
  },
  async (request: NextRequest, context) => {
    const { searchParams } = new URL(request.url);
    const profileSlug = searchParams.get('profileSlug') || searchParams.get('slug');
    
    if (!profileSlug) {
      const errorResponse = MCPErrorHandler.createMethodNotAllowedError(['GET', 'POST'], {
        method: 'GET',
        parameters: ['profileSlug or slug'],
        example: '/api/mcp/get-profile?profileSlug=john-doe',
      });
      return MCPMiddleware.createSuccessResponse(errorResponse, 400, context.clientInfo);
    }

    // Create a new request with the body for consistency
    const postRequest = new NextRequest(request.url, {
      method: 'POST',
      headers: { ...request.headers, 'content-type': 'application/json' },
      body: JSON.stringify({ profileSlug }),
    });

    return POST(postRequest);
  }
);