import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { profiles } from '@/lib/db/schema';
import { eq, and, ilike, or, sql } from 'drizzle-orm';
import { ProfileTransformer } from '@/lib/types/profile';
import { PrivacyService } from '@/lib/services/privacy-service';

/**
 * MCP Tool: search_profiles
 *
 * Search for people profiles by skills, availability, or keywords
 * Simple HTTP API for the standalone MCP server to call
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      query = '',
      skills = [],
      availableFor = [],
      limit = 10,
      offset = 0
    } = body;

    // Sanitize and apply limits
    const sanitizedLimit = Math.min(Math.max(parseInt(String(limit)) || 10, 1), 50);
    const sanitizedOffset = Math.max(parseInt(String(offset)) || 0, 0);
    const sanitizedQuery = String(query || '').trim();
    const sanitizedSkills = Array.isArray(skills) ? skills.map(s => String(s).trim()).filter(Boolean) : [];
    const sanitizedAvailableFor = Array.isArray(availableFor) ? availableFor.map(a => String(a).trim()).filter(Boolean) : [];

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

    // Log MCP search for analytics
    if (process.env.NODE_ENV === 'development') {
      console.log(`MCP Search: query="${sanitizedQuery}", results=${response.profiles.length}`);
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('MCP search error:', error);
    return NextResponse.json({
      error: 'Failed to search profiles',
      profiles: [],
      pagination: { total: 0, limit: 0, offset: 0, hasMore: false }
    }, { status: 500 });
  }
}

// GET method for testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const body = {
    query: searchParams.get('query') || searchParams.get('q') || '',
    skills: searchParams.get('skills')?.split(',').map(s => s.trim()).filter(Boolean) || [],
    availableFor: searchParams.get('availableFor')?.split(',').map(a => a.trim()).filter(Boolean) || [],
    limit: parseInt(searchParams.get('limit') || '10'),
    offset: parseInt(searchParams.get('offset') || '0'),
  };

  const postRequest = new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return POST(postRequest);
}