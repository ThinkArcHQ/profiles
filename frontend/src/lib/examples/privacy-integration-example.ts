/**
 * Privacy Integration Examples
 * 
 * This file demonstrates how to integrate the privacy control system
 * into API routes and other parts of the application.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrivacyMiddleware, PrivacyUtils } from '@/lib/middleware/privacy-middleware';
import { PrivacyService } from '@/lib/services/privacy-service';
import { Profile } from '@/lib/types/profile';

/**
 * Example: Profile API Route with Privacy Protection
 * 
 * This shows how to implement a profile endpoint that respects privacy settings
 */
export async function exampleProfileRoute(
  request: NextRequest,
  { params }: { params: { slug: string } }
): Promise<NextResponse> {
  return PrivacyMiddleware.withPrivacyProtection(
    async (request, context, params) => {
      try {
        // Extract slug from params
        const { slug } = params;

        // Validate slug format
        const slugValidation = PrivacyUtils.validateSlugFormat(slug);
        if (!slugValidation.valid) {
          return NextResponse.json(
            { error: slugValidation.error, code: 'INVALID_SLUG' },
            { status: 400 }
          );
        }

        // Fetch profile from database (mock implementation)
        const profile = await fetchProfileBySlug(slug);

        // Validate profile access
        const accessValidation = PrivacyMiddleware.validateProfileAccess(
          profile,
          context,
          { logAccess: true }
        );

        if (!accessValidation.allowed) {
          return accessValidation.response!;
        }

        // Sanitize profile data based on viewer permissions
        const sanitizedProfile = PrivacyMiddleware.sanitizeProfileResponse(
          profile!,
          context,
          'api'
        );

        return NextResponse.json({
          profile: sanitizedProfile,
          success: true
        });

      } catch (error) {
        console.error('Profile route error:', error);
        return NextResponse.json(
          { error: 'Internal server error', code: 'INTERNAL_ERROR' },
          { status: 500 }
        );
      }
    },
    { context: 'api', logAccess: true }
  )(request, params);
}

/**
 * Example: Search API Route with Privacy Filtering
 * 
 * This shows how to implement a search endpoint that filters results based on privacy
 */
export async function exampleSearchRoute(request: NextRequest): Promise<NextResponse> {
  return PrivacyMiddleware.withPrivacyProtection(
    async (request, context) => {
      try {
        // Extract search filters from request
        const filters = PrivacyUtils.extractSearchFilters(request);

        // Check if this is an MCP request
        const isMCPRequest = PrivacyUtils.isMCPRequest(request);

        // Validate search request
        const searchValidation = PrivacyMiddleware.validateSearchRequest(
          filters,
          context,
          isMCPRequest
        );

        if (!searchValidation.valid) {
          return searchValidation.response!;
        }

        // Perform search (mock implementation)
        const searchResults = await searchProfiles(filters);

        // Apply privacy filtering based on context
        const filteredProfiles = isMCPRequest
          ? PrivacyService.filterForMCPRequest(searchResults.profiles)
          : PrivacyService.filterForPublicSearch(searchResults.profiles);

        // Sanitize profile data
        const sanitizedProfiles = PrivacyMiddleware.sanitizeProfilesResponse(
          filteredProfiles,
          context,
          isMCPRequest ? 'mcp' : 'search'
        );

        // Create paginated response
        const response = PrivacyUtils.createPaginationResponse(
          sanitizedProfiles,
          searchResults.total,
          filters.limit || 10,
          filters.offset || 0
        );

        return NextResponse.json(response);

      } catch (error) {
        console.error('Search route error:', error);
        return NextResponse.json(
          { error: 'Internal server error', code: 'INTERNAL_ERROR' },
          { status: 500 }
        );
      }
    },
    { context: 'search' }
  )(request);
}

/**
 * Example: Privacy Settings Update Route
 * 
 * This shows how to implement an endpoint for updating privacy settings
 */
export async function examplePrivacyUpdateRoute(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return PrivacyMiddleware.withPrivacyProtection(
    async (request, context, params) => {
      try {
        const { id } = params;

        // Parse request body
        const updates = await request.json();

        // Fetch profile from database
        const profile = await fetchProfileById(id);

        // Validate profile access (owner only)
        const accessValidation = PrivacyMiddleware.validateProfileAccess(
          profile,
          context,
          { requireAuth: true, allowOwnerOnly: true }
        );

        if (!accessValidation.allowed) {
          return accessValidation.response!;
        }

        // Validate privacy update
        const updateValidation = PrivacyMiddleware.validatePrivacyUpdate(
          profile!,
          updates,
          context
        );

        if (!updateValidation.valid) {
          return updateValidation.response!;
        }

        // Update profile in database (mock implementation)
        const updatedProfile = await updateProfilePrivacy(id, updates);

        // Return sanitized updated profile
        const sanitizedProfile = PrivacyMiddleware.sanitizeProfileResponse(
          updatedProfile,
          context,
          'api'
        );

        return NextResponse.json({
          profile: sanitizedProfile,
          success: true,
          message: 'Privacy settings updated successfully'
        });

      } catch (error) {
        console.error('Privacy update route error:', error);
        return NextResponse.json(
          { error: 'Internal server error', code: 'INTERNAL_ERROR' },
          { status: 500 }
        );
      }
    },
    { requireAuth: true, allowOwnerOnly: true }
  )(request, params);
}

/**
 * Example: MCP Endpoint for AI Agents
 * 
 * This shows how to implement an MCP-compatible endpoint
 */
export async function exampleMCPRoute(request: NextRequest): Promise<NextResponse> {
  return PrivacyMiddleware.withPrivacyProtection(
    async (request, context) => {
      try {
        // Verify this is an MCP request
        if (!PrivacyUtils.isMCPRequest(request)) {
          return NextResponse.json(
            { error: 'MCP client required', code: 'INVALID_CLIENT' },
            { status: 400 }
          );
        }

        // Extract search filters
        const filters = PrivacyUtils.extractSearchFilters(request);

        // Validate MCP search request
        const searchValidation = PrivacyMiddleware.validateSearchRequest(
          filters,
          context,
          true // isMCPRequest
        );

        if (!searchValidation.valid) {
          return searchValidation.response!;
        }

        // Perform search with MCP-specific filtering
        const searchResults = await searchProfiles(filters);
        const mcpProfiles = PrivacyService.filterForMCPRequest(searchResults.profiles);

        // Transform to MCP format
        const mcpResponse = mcpProfiles.map(profile => 
          PrivacyService.sanitizeProfileData(profile, context.userId, 'mcp')
        );

        // Return MCP-compatible response
        return NextResponse.json({
          profiles: mcpResponse,
          total: mcpResponse.length,
          query: filters.query,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('MCP route error:', error);
        return NextResponse.json(
          { error: 'Internal server error', code: 'INTERNAL_ERROR' },
          { status: 500 }
        );
      }
    },
    { context: 'mcp' }
  )(request);
}

// Mock database functions (these would be replaced with real database calls)

async function fetchProfileBySlug(slug: string): Promise<Profile | null> {
  // Mock implementation - replace with actual database query
  console.log(`Fetching profile by slug: ${slug}`);
  return null;
}

async function fetchProfileById(id: string): Promise<Profile | null> {
  // Mock implementation - replace with actual database query
  console.log(`Fetching profile by ID: ${id}`);
  return null;
}

async function searchProfiles(filters: any): Promise<{ profiles: Profile[]; total: number }> {
  // Mock implementation - replace with actual database query
  console.log(`Searching profiles with filters:`, filters);
  return { profiles: [], total: 0 };
}

async function updateProfilePrivacy(id: string, updates: any): Promise<Profile> {
  // Mock implementation - replace with actual database update
  console.log(`Updating profile ${id} privacy:`, updates);
  throw new Error('Mock implementation');
}

/**
 * Example: Client-side Privacy Utilities
 * 
 * These functions can be used in React components to handle privacy-related UI
 */
export class ClientPrivacyUtils {
  /**
   * Check if current user can view a profile
   */
  static canViewProfile(profile: any, currentUserId?: string): boolean {
    if (!profile) return false;
    
    // Owner can always view
    if (currentUserId && profile.workosUserId === currentUserId) {
      return true;
    }
    
    // Others can only view public active profiles
    return profile.isPublic && profile.isActive;
  }

  /**
   * Check if current user can contact a profile owner
   */
  static canContactProfile(profile: any, currentUserId?: string): boolean {
    if (!profile) return false;
    
    // Can't contact yourself
    if (currentUserId && profile.workosUserId === currentUserId) {
      return false;
    }
    
    // Can only contact public active profiles
    return profile.isPublic && profile.isActive;
  }

  /**
   * Get privacy status display text
   */
  static getPrivacyStatusText(profile: any): string {
    if (!profile.isActive) {
      return 'Inactive';
    }
    
    return profile.isPublic ? 'Public' : 'Private';
  }

  /**
   * Get privacy status color for UI
   */
  static getPrivacyStatusColor(profile: any): 'green' | 'yellow' | 'red' {
    if (!profile.isActive) {
      return 'red';
    }
    
    return profile.isPublic ? 'green' : 'yellow';
  }
}