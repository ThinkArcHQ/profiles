import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { profiles } from '@/lib/db/schema';
import { eq, and, ilike, or, sql } from 'drizzle-orm';
import { ProfileTransformer } from '@/lib/types/profile';
import { PrivacyService } from '@/lib/services/privacy-service';
import { MCPErrorHandler, MCPErrorCodes } from '@/lib/utils/mcp-errors';
import { withMCPMiddleware, MCPMiddleware } from '@/lib/middleware/mcp-middleware';

/**
 * MCP Tool: search_profiles
 * 
 * Search for people profiles by skills, availability, or keywords
 * This endpoint is designed for AI agent consumption via MCP
 */
export const POST = withMCPMiddleware(
  {
    endpoint: 'search_profiles',
    rateLimiter: 'search',
    allowedMethods: ['POST'],
  },
  async (request: NextRequest, context) => {
  try {
    const body = await request.json();
    const { 
      query = '', 
      skills = [], 
      availableFor = [], 
      limit = 10, 
      offset = 0 
    } = body;

    // Validate search parameters
    const searchParams = {
      query: String(query).trim(),
      skills: Array.isArray(skills) ? skills.map(s => String(s).trim()).filter(Boolean) : [],
      availableFor: Array.isArray(availableFor) ? availableFor.map(a => String(a).trim()).filter(Boolean) : [],
      limit: parseInt(String(limit)),
      offset: parseInt(String(offset)),
    };

    const validation = MCPErrorHandler.validateSearchParams(searchParams);
    if (!validation.isValid) {
      const errorResponse = MCPErrorHandler.createSearchError(
        `Validation failed: ${validation.errors.join(', ')}`,
        MCPErrorCodes.VALIDATION_ERROR,
        { errors: validation.errors }
      );
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Sanitize and apply limits
    const sanitizedLimit = Math.min(Math.max(searchParams.limit || 10, 1), 50); // Cap at 50 for MCP
    const sanitizedOffset = Math.max(searchParams.offset || 0, 0);
    const sanitizedQuery = searchParams.query;
    const sanitizedSkills = searchParams.skills;
    const sanitizedAvailableFor = searchParams.availableFor;

    // Build privacy-compliant where conditions
    // CRITICAL: Only include public, active profiles for MCP requests
    const whereConditions = [
      eq(profiles.isActive, true),
      eq(profiles.isPublic, true)
    ];

    // Text search in name and bio ONLY (never email for privacy)
    if (sanitizedQuery) {
      whereConditions.push(
        or(
          ilike(profiles.name, `%${sanitizedQuery}%`),
          ilike(profiles.bio, `%${sanitizedQuery}%`)
        )!
      );
    }

    // Filter by skills using PostgreSQL array operations
    if (sanitizedSkills.length > 0) {
      const skillConditions = sanitizedSkills.map(skill => 
        sql`${profiles.skills} && ARRAY[${skill}]::text[]`
      );
      whereConditions.push(or(...skillConditions)!);
    }

    // Filter by availability using PostgreSQL array operations
    if (sanitizedAvailableFor.length > 0) {
      const availabilityConditions = sanitizedAvailableFor.map(availability => 
        sql`${profiles.availableFor} && ARRAY[${availability}]::text[]`
      );
      whereConditions.push(or(...availabilityConditions)!);
    }

    // Execute the search query
    const searchResults = await db
      .select()
      .from(profiles)
      .where(and(...whereConditions))
      .limit(sanitizedLimit)
      .offset(sanitizedOffset)
      .orderBy(
        // Order by relevance: exact name matches first, then by creation date
        sanitizedQuery 
          ? sql`CASE WHEN LOWER(${profiles.name}) = LOWER(${sanitizedQuery}) THEN 0 ELSE 1 END, ${profiles.createdAt} DESC`
          : sql`${profiles.createdAt} DESC`
      );

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(profiles)
      .where(and(...whereConditions));
    
    const totalCount = countResult[0]?.count || 0;

    // Apply additional privacy filtering (defensive programming)
    const privacyFilteredResults = PrivacyService.filterForMCPRequest(searchResults);

    // Transform to MCP profile format
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const mcpProfiles = privacyFilteredResults.map(profile => 
      ProfileTransformer.toMCPProfile(profile, baseUrl)
    );

    // Return MCP-compatible response
    const response = {
      profiles: mcpProfiles,
      pagination: {
        total: totalCount,
        limit: sanitizedLimit,
        offset: sanitizedOffset,
        hasMore: totalCount > sanitizedOffset + sanitizedLimit,
      },
    };

    // Log MCP search for analytics (without exposing sensitive data)
    if (process.env.NODE_ENV === 'development') {
      console.log(`MCP Search executed: query="${sanitizedQuery}", skills=[${sanitizedSkills.join(', ')}], results=${response.profiles.length}`);
    }

    return MCPMiddleware.createSuccessResponse(response, 200, context.clientInfo);
  } catch (error) {
    MCPErrorHandler.logError('search_profiles', error as Error, { 
      query: body.query, 
      skills: body.skills, 
      availableFor: body.availableFor 
    });
    
    const errorResponse = MCPErrorHandler.createSearchError(
      'Failed to search profiles',
      MCPErrorCodes.SEARCH_ERROR
    );
    return MCPMiddleware.createSuccessResponse(errorResponse, 500, context.clientInfo);
  }
});

// GET method for testing purposes (not part of MCP spec)
export const GET = withMCPMiddleware(
  {
    endpoint: 'search_profiles_get',
    rateLimiter: 'search',
    allowedMethods: ['GET'],
  },
  async (request: NextRequest, context) => {
    const { searchParams } = new URL(request.url);
    
    // Convert GET params to POST body format for consistency
    const body = {
      query: searchParams.get('query') || searchParams.get('q') || '',
      skills: searchParams.get('skills')?.split(',').map(s => s.trim()).filter(Boolean) || [],
      availableFor: searchParams.get('availableFor')?.split(',').map(a => a.trim()).filter(Boolean) || [],
      limit: parseInt(searchParams.get('limit') || '10'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    // Create a new request with the body for the POST handler
    const postRequest = new NextRequest(request.url, {
      method: 'POST',
      headers: { ...request.headers, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

    // Call the POST handler directly (bypass middleware since we're already in it)
    return POST(postRequest);
  }
);