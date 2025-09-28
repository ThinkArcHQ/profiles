import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { profiles } from '@/lib/db/schema';
import { eq, and, ilike, or, sql } from 'drizzle-orm';
import { ProfileTransformer } from '@/lib/types/profile';
import { PrivacyService, PrivacyValidator } from '@/lib/services/privacy-service';
import { ProfileSearchFilters } from '@/lib/types/profile';
import { createGETEndpoint } from '@/lib/middleware/api-wrapper';
import { APIErrorHandler } from '@/lib/utils/api-errors';
import { DatabasePerformanceService } from '@/lib/services/database-performance';

// GET /api/search - Enhanced search with privacy controls
const searchHandler = async (request: NextRequest, context: any) => {
  try {
    const { validatedData } = context;
    const { query } = validatedData || {};

    // Extract search parameters from validated query data or URL params
    const { searchParams } = new URL(request.url);
    const searchQuery = query?.query || searchParams.get('q') || '';
    const skills = query?.skills || (searchParams.get('skills') ? searchParams.get('skills')!.split(',').map(s => s.trim()).filter(Boolean) : []);
    const availableFor = query?.availableFor || (searchParams.get('available_for') ? searchParams.get('available_for')!.split(',').map(a => a.trim()).filter(Boolean) : []);
    const limit = query?.limit || Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = query?.offset || Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    // Create search filters object
    const filters: ProfileSearchFilters = {
      query: searchQuery.trim() || undefined,
      skills: skills.length > 0 ? skills : undefined,
      availableFor: availableFor.length > 0 ? availableFor : undefined,
      limit,
      offset
    };

    // Validate search parameters with privacy context
    const searchContext = {
      isPublicSearch: true,
      isMCPRequest: false,
      viewerId: undefined // Anonymous search
    };

    const validation = PrivacyValidator.validateSearchParams(filters, searchContext);
    if (!validation.valid) {
      return APIErrorHandler.createValidationError(
        'Invalid search parameters',
        validation.errors.map(error => ({
          field: 'search',
          message: error,
        }))
      );
    }

    // Build privacy-compliant where conditions
    // CRITICAL: Only include public, active profiles and NEVER search email
    const whereConditions = [
      eq(profiles.isActive, true),
      eq(profiles.isPublic, true)
    ];

    // Text search in name and bio ONLY (never email for privacy)
    if (filters.query) {
      whereConditions.push(
        or(
          ilike(profiles.name, `%${filters.query}%`),
          ilike(profiles.bio, `%${filters.query}%`)
        )!
      );
    }

    // Filter by skills using optimized array operations
    if (filters.skills && filters.skills.length > 0) {
      // Use PostgreSQL array overlap operator for better performance
      const skillConditions = filters.skills.map(skill => 
        sql`${profiles.skills} && ARRAY[${skill}]::text[]`
      );
      whereConditions.push(or(...skillConditions)!);
    }

    // Filter by availability using optimized array operations
    if (filters.availableFor && filters.availableFor.length > 0) {
      const availabilityConditions = filters.availableFor.map(availability => 
        sql`${profiles.availableFor} && ARRAY[${availability}]::text[]`
      );
      whereConditions.push(or(...availabilityConditions)!);
    }

    // Use optimized search service for better performance
    const { profiles: searchResults, totalCount } = await DatabasePerformanceService.searchProfilesOptimized({
      query: filters.query,
      skills: filters.skills,
      availableFor: filters.availableFor,
      limit,
      offset
    });

    // Apply additional privacy filtering (defensive programming)
    const privacyFilteredResults = PrivacyService.filterForPublicSearch(searchResults);

    // Transform to public profiles using the ProfileTransformer
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const result = ProfileTransformer.toPublicSearchResults(
      privacyFilteredResults,
      totalCount,
      limit,
      offset,
      baseUrl
    );

    return NextResponse.json(result);
  } catch (error) {
    return APIErrorHandler.createDatabaseError('search profiles', error);
  }
};

export const GET = createGETEndpoint(
  '/api/search',
  searchHandler,
  {
    validation: {
      query: {
        pagination: true,
        search: true,
      },
    },
  }
);