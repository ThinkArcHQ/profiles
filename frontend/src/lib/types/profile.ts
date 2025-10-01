/**
 * Enhanced Profile Types and Utilities
 * 
 * This module provides comprehensive type definitions and utilities for profile management,
 * including privacy-aware transformations and public profile types.
 */

import { Profile as DBProfile, NewProfile as DBNewProfile } from '@/lib/db/schema';

// Re-export database types for consistency
export type Profile = DBProfile;
export type NewProfile = DBNewProfile;

/**
 * Public Profile type that excludes sensitive information
 * This is used for search results, MCP endpoints, and public profile views
 */
export interface PublicProfile {
  id: number; // Keep ID for UI components that need it
  slug: string;
  name: string;
  bio?: string | null;
  headline?: string | null;
  location?: string | null;
  skills: string[];
  availableFor: string[];
  linkedinUrl?: string | null;
  otherLinks: Record<string, string>;
  experience?: any[];
  education?: any[];
  projects?: any[];
  profileUrl: string;
  createdAt: Date; // Keep for display purposes
  // Note: email, workosUserId, and other sensitive fields are intentionally excluded
}

/**
 * Profile creation input type with all required and optional fields
 */
export interface CreateProfileInput {
  name: string;
  email: string;
  bio?: string;
  skills?: string[];
  availableFor?: string[];
  isPublic?: boolean;
  linkedinUrl?: string;
  otherLinks?: Record<string, string>;
}

/**
 * Raw profile creation input from forms (more flexible)
 */
export interface RawCreateProfileInput {
  name?: string;
  display_name?: string;
  email?: string;
  bio?: string;
  headline?: string;
  skills?: string[] | string;
  availableFor?: string[];
  available_for?: string[];
  isPublic?: boolean;
  profile_visibility?: 'public' | 'private' | 'members_only' | 'connections_only';
  linkedinUrl?: string;
  linkedin_url?: string;
  otherLinks?: Record<string, string>;
  other_links?: Record<string, string>;
  location?: string;
  profession?: string;
}

/**
 * Profile update input type - all fields are optional except those that shouldn't change
 */
export interface UpdateProfileInput {
  name?: string;
  bio?: string;
  skills?: string[];
  availableFor?: string[];
  isPublic?: boolean;
  linkedinUrl?: string;
  otherLinks?: Record<string, string>;
  // Note: email, slug, and workosUserId updates require special handling
}

/**
 * Privacy settings for profile visibility and access control
 */
export interface PrivacySettings {
  isPublic: boolean;
  showInSearch: boolean;
  allowMeetingRequests: boolean;
}

/**
 * Profile search result type with pagination info
 */
export interface ProfileSearchResult {
  profiles: PublicProfile[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Profile search filters
 */
export interface ProfileSearchFilters {
  query?: string;
  skills?: string[];
  availableFor?: string[];
  limit?: number;
  offset?: number;
}

/**
 * MCP-compatible profile format for AI agent integration
 */
export interface MCPProfile {
  slug: string;
  name: string;
  bio: string;
  skills: string[];
  availableFor: string[];
  profileUrl: string;
  linkedinUrl?: string;
  otherLinks: Record<string, string>;
  // Note: email is never included in MCP responses
}

/**
 * Profile visibility context for access control
 */
export interface ProfileVisibilityContext {
  viewerId?: string; // WorkOS user ID of the viewer
  isOwner: boolean;
  isPublic: boolean;
}

/**
 * Available request types for profiles
 */
export type RequestType = 'meeting' | 'quote' | 'appointment';

/**
 * Profile availability options
 */
export const AVAILABILITY_OPTIONS = [
  'meetings',
  'quotes', 
  'appointments'
] as const;

export type AvailabilityOption = typeof AVAILABILITY_OPTIONS[number];

/**
 * Privacy-aware profile transformation utilities
 */
export class ProfileTransformer {
  /**
   * Transform a full profile to a public profile, excluding sensitive information
   */
  static toPublicProfile(profile: Profile, baseUrl?: string): PublicProfile {
    const profileUrl = baseUrl 
      ? `${baseUrl}/${profile.slug}`
    : `/${profile.slug}`;

    return {
      id: profile.id,
      slug: profile.slug,
      name: profile.name,
      bio: profile.bio,
      headline: profile.headline,
      location: profile.location,
      skills: profile.skills || [],
      availableFor: profile.availableFor || [],
      linkedinUrl: profile.linkedinUrl,
      otherLinks: (profile.otherLinks as Record<string, string>) || {},
      experience: (profile.experience as any[]) || [],
      education: (profile.education as any[]) || [],
      projects: (profile.projects as any[]) || [],
      profileUrl,
      createdAt: profile.createdAt,
    };
  }

  /**
   * Transform a profile to MCP format for AI agent consumption
   */
  static toMCPProfile(profile: Profile, baseUrl?: string): MCPProfile {
    const profileUrl = baseUrl 
      ? `${baseUrl}/${profile.slug}`
    : `/${profile.slug}`;

    return {
      slug: profile.slug,
      name: profile.name,
      bio: profile.bio || '',
      skills: profile.skills || [],
      availableFor: profile.availableFor || [],
      profileUrl,
      linkedinUrl: profile.linkedinUrl || undefined,
      otherLinks: (profile.otherLinks as Record<string, string>) || {},
    };
  }

  /**
   * Check if a profile should be visible to a viewer based on privacy settings
   */
  static canViewProfile(profile: Profile, viewerId?: string): boolean {
    // Owner can always view their own profile
    if (viewerId && profile.workosUserId === viewerId) {
      return true;
    }

    // Public profiles are visible to everyone
    if (profile.isPublic && profile.isActive) {
      return true;
    }

    // Private profiles are only visible to the owner
    return false;
  }

  /**
   * Check if a viewer can contact a profile owner
   */
  static canContactProfile(profile: Profile, viewerId?: string): boolean {
    // Can't contact yourself
    if (viewerId && profile.workosUserId === viewerId) {
      return false;
    }

    // Can only contact public, active profiles
    return profile.isPublic && profile.isActive;
  }

  /**
   * Filter profiles based on privacy settings for search results
   */
  static filterPublicProfiles(profiles: Profile[]): Profile[] {
    return profiles.filter(profile => profile.isPublic && profile.isActive);
  }

  /**
   * Transform profiles to public format for search results
   */
  static toPublicSearchResults(
    profiles: Profile[], 
    total: number, 
    limit: number, 
    offset: number,
    baseUrl?: string
  ): ProfileSearchResult {
    const publicProfiles = this.filterPublicProfiles(profiles)
      .map(profile => this.toPublicProfile(profile, baseUrl));

    return {
      profiles: publicProfiles,
      pagination: {
        total,
        limit,
        offset,
        hasMore: total > offset + limit,
      },
    };
  }

  /**
   * Get privacy settings from a profile
   */
  static getPrivacySettings(profile: Profile): PrivacySettings {
    return {
      isPublic: profile.isPublic,
      showInSearch: profile.isPublic && profile.isActive,
      allowMeetingRequests: profile.isPublic && profile.isActive,
    };
  }

  /**
   * Validate profile data for creation/updates
   */
  static validateProfileData(data: CreateProfileInput | UpdateProfileInput): string[] {
    const errors: string[] = [];

    // Name validation
    if ('name' in data && data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        errors.push('Name is required');
      } else if (data.name.trim().length < 2) {
        errors.push('Name must be at least 2 characters long');
      } else if (data.name.length > 255) {
        errors.push('Name must be less than 255 characters');
      }
    }

    // Email validation (only for create)
    if ('email' in data && data.email !== undefined) {
      if (!data.email || data.email.trim().length === 0) {
        errors.push('Email is required');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('Invalid email format');
      } else if (data.email.length > 255) {
        errors.push('Email must be less than 255 characters');
      }
    }

    // Bio validation
    if (data.bio !== undefined && data.bio !== null) {
      if (data.bio.length > 2000) {
        errors.push('Bio must be less than 2000 characters');
      }
    }

    // Skills validation
    if (data.skills !== undefined) {
      if (!Array.isArray(data.skills)) {
        errors.push('Skills must be an array');
      } else {
        if (data.skills.length > 20) {
          errors.push('Maximum 20 skills allowed');
        }
        for (const skill of data.skills) {
          if (typeof skill !== 'string') {
            errors.push('Each skill must be a string');
          } else if (skill.trim().length === 0) {
            errors.push('Skills cannot be empty');
          } else if (skill.length > 100) {
            errors.push('Each skill must be less than 100 characters');
          }
        }
      }
    }

    // Available for validation
    if (data.availableFor !== undefined) {
      if (!Array.isArray(data.availableFor)) {
        errors.push('Available for must be an array');
      } else {
        const validOptions = ['meetings', 'quotes', 'appointments'];
        if (data.availableFor.length === 0) {
          errors.push('At least one availability option must be selected');
        }
        for (const option of data.availableFor) {
          if (!validOptions.includes(option)) {
            errors.push(`Invalid availability option: ${option}. Valid options are: ${validOptions.join(', ')}`);
          }
        }
      }
    }

    // LinkedIn URL validation
    if (data.linkedinUrl !== undefined && data.linkedinUrl !== null && data.linkedinUrl.trim().length > 0) {
      if (data.linkedinUrl.length > 500) {
        errors.push('LinkedIn URL must be less than 500 characters');
      }
      // Basic URL validation
      try {
        const url = new URL(data.linkedinUrl);
        if (!['http:', 'https:'].includes(url.protocol)) {
          errors.push('LinkedIn URL must use http or https protocol');
        }
      } catch {
        errors.push('Invalid LinkedIn URL format');
      }
    }

    // Other links validation
    if (data.otherLinks !== undefined && data.otherLinks !== null) {
      if (typeof data.otherLinks !== 'object') {
        errors.push('Other links must be an object');
      } else {
        const linkCount = Object.keys(data.otherLinks).length;
        if (linkCount > 10) {
          errors.push('Maximum 10 other links allowed');
        }
        
        for (const [key, value] of Object.entries(data.otherLinks)) {
          if (typeof key !== 'string' || typeof value !== 'string') {
            errors.push('Other links must have string keys and values');
          } else if (key.length > 100) {
            errors.push('Link labels must be less than 100 characters');
          } else if (value.length > 500) {
            errors.push('Link URLs must be less than 500 characters');
          } else if (value.trim().length > 0) {
            // Validate URL format if not empty
            try {
              const url = new URL(value);
              if (!['http:', 'https:'].includes(url.protocol)) {
                errors.push(`Link "${key}" must use http or https protocol`);
              }
            } catch {
              errors.push(`Invalid URL format for link "${key}"`);
            }
          }
        }
      }
    }

    return errors;
  }
}

/**
 * Profile visibility utility class for access control
 */
export class ProfileVisibility {
  /**
   * Check if a viewer can view a profile
   */
  static canView(viewerId: string | undefined, profileOwnerId: string, isPublic: boolean, isActive: boolean): boolean {
    return ProfileTransformer.canViewProfile({ 
      workosUserId: profileOwnerId, 
      isPublic, 
      isActive 
    } as Profile, viewerId);
  }

  /**
   * Check if a viewer can contact a profile owner
   */
  static canContact(requesterId: string | undefined, profileOwnerId: string, isPublic: boolean, isActive: boolean): boolean {
    return ProfileTransformer.canContactProfile({ 
      workosUserId: profileOwnerId, 
      isPublic, 
      isActive 
    } as Profile, requesterId);
  }

  /**
   * Filter profile data based on viewer permissions
   */
  static filterPublicData(profile: Profile, viewerId?: string): PublicProfile | null {
    if (!this.canView(viewerId, profile.workosUserId, profile.isPublic, profile.isActive)) {
      return null;
    }

    return ProfileTransformer.toPublicProfile(profile);
  }
}