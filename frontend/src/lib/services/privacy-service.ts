/**
 * Privacy Control Service
 * 
 * This service provides comprehensive privacy filtering and access control
 * for profile visibility, search operations, and API access.
 */

import { Profile, PublicProfile, ProfileSearchFilters } from '@/lib/types/profile';
import { ProfileTransformer, ProfileVisibility } from '@/lib/types/profile';

export interface PrivacyFilterOptions {
  viewerId?: string;
  includePrivate?: boolean;
  respectOwnership?: boolean;
}

export interface ProfileAccessContext {
  viewerId?: string;
  profileOwnerId: string;
  isPublic: boolean;
  isActive: boolean;
}

export interface SearchPrivacyContext {
  viewerId?: string;
  isPublicSearch: boolean;
  isMCPRequest: boolean;
}

/**
 * Privacy Service for profile access control and filtering
 */
export class PrivacyService {
  /**
   * Filter profiles based on privacy settings and viewer permissions
   */
  static filterProfilesForViewer(
    profiles: Profile[], 
    options: PrivacyFilterOptions = {}
  ): Profile[] {
    const { viewerId, includePrivate = false, respectOwnership = true } = options;

    return profiles.filter(profile => {
      // If including private profiles is explicitly allowed, skip privacy checks
      if (includePrivate && !respectOwnership) {
        return true;
      }

      // Check if viewer can see this profile
      return this.canViewProfile(profile, viewerId);
    });
  }

  /**
   * Check if a viewer can view a specific profile
   */
  static canViewProfile(profile: Profile, viewerId?: string): boolean {
    return ProfileTransformer.canViewProfile(profile, viewerId);
  }

  /**
   * Check if a viewer can contact a profile owner
   */
  static canContactProfile(profile: Profile, viewerId?: string): boolean {
    return ProfileTransformer.canContactProfile(profile, viewerId);
  }

  /**
   * Filter profiles for public search results
   */
  static filterForPublicSearch(profiles: Profile[]): Profile[] {
    return profiles.filter(profile => 
      profile.isPublic && 
      profile.isActive
    );
  }

  /**
   * Filter profiles for MCP (AI agent) requests
   */
  static filterForMCPRequest(profiles: Profile[]): Profile[] {
    // MCP requests should only see public, active profiles
    return this.filterForPublicSearch(profiles);
  }

  /**
   * Transform profiles to public format with privacy filtering
   */
  static toPublicProfiles(
    profiles: Profile[], 
    viewerId?: string,
    baseUrl?: string
  ): PublicProfile[] {
    return this.filterProfilesForViewer(profiles, { viewerId })
      .map(profile => ProfileTransformer.toPublicProfile(profile, baseUrl));
  }

  /**
   * Get a single profile with privacy filtering
   */
  static getFilteredProfile(
    profile: Profile | null, 
    viewerId?: string,
    baseUrl?: string
  ): PublicProfile | null {
    if (!profile) {
      return null;
    }

    if (!this.canViewProfile(profile, viewerId)) {
      return null;
    }

    return ProfileTransformer.toPublicProfile(profile, baseUrl);
  }

  /**
   * Validate search request based on privacy context
   */
  static validateSearchRequest(
    filters: ProfileSearchFilters,
    context: SearchPrivacyContext
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate pagination limits
    if (filters.limit && filters.limit > 100) {
      errors.push('Maximum limit is 100 profiles per request');
    }

    if (filters.offset && filters.offset < 0) {
      errors.push('Offset must be non-negative');
    }

    // For MCP requests, apply stricter validation
    if (context.isMCPRequest) {
      if (filters.limit && filters.limit > 50) {
        errors.push('MCP requests are limited to 50 profiles per request');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if a profile access should be logged for audit purposes
   */
  static shouldLogAccess(
    profile: Profile,
    viewerId?: string,
    accessType: 'view' | 'contact' | 'search' = 'view'
  ): boolean {
    // Always log access to private profiles
    if (!profile.isPublic) {
      return true;
    }

    // Log contact attempts
    if (accessType === 'contact') {
      return true;
    }

    // Log when someone views their own profile (for analytics)
    if (viewerId && profile.workosUserId === viewerId) {
      return true;
    }

    // Don't log regular public profile views to reduce noise
    return false;
  }

  /**
   * Get privacy violation reason for debugging/logging
   */
  static getPrivacyViolationReason(
    profile: Profile,
    viewerId?: string,
    requestedAction: 'view' | 'contact' | 'edit' = 'view'
  ): string | null {
    // Check specific action permissions first
    switch (requestedAction) {
      case 'view':
        // Owner can always view their own profile
        if (viewerId && profile.workosUserId === viewerId) {
          return null;
        }
        // Check if profile is inactive
        if (!profile.isActive) {
          return 'Profile is inactive';
        }
        // Check if profile is private
        if (!profile.isPublic) {
          return 'Profile is private';
        }
        // Public active profiles can be viewed
        return null;
      
      case 'contact':
        // Can't contact yourself
        if (viewerId && profile.workosUserId === viewerId) {
          return 'Cannot contact yourself';
        }
        // Check if profile is inactive
        if (!profile.isActive) {
          return 'Profile is inactive';
        }
        // Check if profile is private
        if (!profile.isPublic) {
          return 'Profile is private';
        }
        // Can contact public active profiles
        return null;
      
      case 'edit':
        // Only owner can edit
        if (!viewerId || profile.workosUserId !== viewerId) {
          return 'Only profile owner can edit';
        }
        return null;
      
      default:
        return 'Unknown action';
    }
  }

  /**
   * Apply privacy filters to search query parameters
   */
  static applySearchPrivacyFilters(
    baseQuery: any,
    context: SearchPrivacyContext
  ): unknown {
    // Always filter for public and active profiles in public searches
    if (context.isPublicSearch || context.isMCPRequest) {
      return {
        ...baseQuery,
        isPublic: true,
        isActive: true
      };
    }

    // For authenticated user searches, still default to public unless explicitly requested
    return {
      ...baseQuery,
      isPublic: true,
      isActive: true
    };
  }

  /**
   * Check if email should be included in response
   */
  static shouldIncludeEmail(
    profile: Profile,
    viewerId?: string,
    context: 'api' | 'mcp' | 'search' | 'profile' = 'api'
  ): boolean {
    // Never include email in MCP responses
    if (context === 'mcp') {
      return false;
    }

    // Never include email in search results
    if (context === 'search') {
      return false;
    }

    // Only include email for profile owner
    return viewerId === profile.workosUserId;
  }

  /**
   * Sanitize profile data based on privacy settings and viewer permissions
   */
  static sanitizeProfileData(
    profile: Profile,
    viewerId?: string,
    context: 'api' | 'mcp' | 'search' | 'profile' = 'api'
  ): Partial<Profile> | PublicProfile {
    // Check if viewer can see the profile at all
    if (!this.canViewProfile(profile, viewerId)) {
      throw new Error('Access denied');
    }

    // For MCP context, return MCP format
    if (context === 'mcp') {
      return ProfileTransformer.toMCPProfile(profile);
    }

    // For search context, return public profile format
    if (context === 'search') {
      return ProfileTransformer.toPublicProfile(profile);
    }

    // For API/profile context, return appropriate data based on ownership
    if (viewerId === profile.workosUserId) {
      // Owner sees everything
      return profile;
    } else {
      // Others see public profile format
      return ProfileTransformer.toPublicProfile(profile);
    }
  }

  /**
   * Validate privacy settings update
   */
  static validatePrivacyUpdate(
    currentProfile: Profile,
    newSettings: Partial<Pick<Profile, 'isPublic' | 'isActive'>>,
    viewerId?: string
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Only owner can update privacy settings
    if (!viewerId || currentProfile.workosUserId !== viewerId) {
      errors.push('Only profile owner can update privacy settings');
    }

    // Validate boolean values
    if (newSettings.isPublic !== undefined && typeof newSettings.isPublic !== 'boolean') {
      errors.push('isPublic must be a boolean value');
    }

    if (newSettings.isActive !== undefined && typeof newSettings.isActive !== 'boolean') {
      errors.push('isActive must be a boolean value');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Privacy validation utilities for API endpoints
 */
export class PrivacyValidator {
  /**
   * Validate profile access for API endpoints
   */
  static validateProfileAccess(
    profile: Profile | null,
    viewerId?: string,
    action: 'view' | 'edit' | 'contact' = 'view'
  ): { allowed: boolean; reason?: string } {
    if (!profile) {
      return { allowed: false, reason: 'Profile not found' };
    }

    const reason = PrivacyService.getPrivacyViolationReason(profile, viewerId, action);
    
    return {
      allowed: reason === null,
      reason: reason || undefined
    };
  }

  /**
   * Validate search parameters for privacy compliance
   */
  static validateSearchParams(
    filters: ProfileSearchFilters,
    context: SearchPrivacyContext
  ): { valid: boolean; errors: string[] } {
    const result = PrivacyService.validateSearchRequest(filters, context);
    return {
      valid: result.isValid,
      errors: result.errors
    };
  }

  /**
   * Create privacy-safe error response
   */
  static createPrivacySafeError(
    originalError: string,
    context: 'api' | 'mcp' = 'api'
  ): { error: string; code: string } {
    // For privacy, return generic "not found" instead of "access denied"
    // to avoid leaking information about profile existence
    if (originalError.includes('private') || 
        originalError.includes('access') || 
        originalError.includes('Access denied')) {
      return {
        error: 'Profile not found',
        code: 'PROFILE_NOT_FOUND'
      };
    }

    return {
      error: originalError,
      code: 'VALIDATION_ERROR'
    };
  }
}