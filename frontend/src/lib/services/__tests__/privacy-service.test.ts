/**
 * Privacy Service Unit Tests
 * 
 * Comprehensive tests for privacy filtering, access control, and validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PrivacyService, PrivacyValidator } from '../privacy-service';
import { Profile, ProfileSearchFilters } from '@/lib/types/profile';

// Mock profile data for testing
const createMockProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: 1,
  workosUserId: 'user-123',
  slug: 'john-doe',
  name: 'John Doe',
  email: 'john@example.com',
  bio: 'Software developer',
  skills: ['JavaScript', 'TypeScript'],
  availableFor: ['meetings'],
  isPublic: true,
  isActive: true,
  linkedinUrl: 'https://linkedin.com/in/johndoe',
  otherLinks: { twitter: 'https://twitter.com/johndoe' },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

describe('PrivacyService', () => {
  describe('canViewProfile', () => {
    it('should allow owner to view their own profile', () => {
      const profile = createMockProfile({ workosUserId: 'user-123', isPublic: false });
      const result = PrivacyService.canViewProfile(profile, 'user-123');
      expect(result).toBe(true);
    });

    it('should allow anyone to view public active profiles', () => {
      const profile = createMockProfile({ isPublic: true, isActive: true });
      const result = PrivacyService.canViewProfile(profile, 'other-user');
      expect(result).toBe(true);
    });

    it('should deny access to private profiles for non-owners', () => {
      const profile = createMockProfile({ isPublic: false, workosUserId: 'user-123' });
      const result = PrivacyService.canViewProfile(profile, 'other-user');
      expect(result).toBe(false);
    });

    it('should deny access to inactive profiles for non-owners', () => {
      const profile = createMockProfile({ isActive: false, workosUserId: 'user-123' });
      const result = PrivacyService.canViewProfile(profile, 'other-user');
      expect(result).toBe(false);
    });

    it('should allow anonymous users to view public active profiles', () => {
      const profile = createMockProfile({ isPublic: true, isActive: true });
      const result = PrivacyService.canViewProfile(profile, undefined);
      expect(result).toBe(true);
    });

    it('should deny anonymous users access to private profiles', () => {
      const profile = createMockProfile({ isPublic: false });
      const result = PrivacyService.canViewProfile(profile, undefined);
      expect(result).toBe(false);
    });
  });

  describe('canContactProfile', () => {
    it('should allow contacting public active profiles', () => {
      const profile = createMockProfile({ isPublic: true, isActive: true, workosUserId: 'user-123' });
      const result = PrivacyService.canContactProfile(profile, 'other-user');
      expect(result).toBe(true);
    });

    it('should deny contacting private profiles', () => {
      const profile = createMockProfile({ isPublic: false, workosUserId: 'user-123' });
      const result = PrivacyService.canContactProfile(profile, 'other-user');
      expect(result).toBe(false);
    });

    it('should deny contacting inactive profiles', () => {
      const profile = createMockProfile({ isActive: false, workosUserId: 'user-123' });
      const result = PrivacyService.canContactProfile(profile, 'other-user');
      expect(result).toBe(false);
    });

    it('should deny users from contacting themselves', () => {
      const profile = createMockProfile({ workosUserId: 'user-123' });
      const result = PrivacyService.canContactProfile(profile, 'user-123');
      expect(result).toBe(false);
    });

    it('should allow anonymous users to contact public active profiles', () => {
      const profile = createMockProfile({ isPublic: true, isActive: true });
      const result = PrivacyService.canContactProfile(profile, undefined);
      expect(result).toBe(true);
    });
  });

  describe('filterProfilesForViewer', () => {
    const profiles = [
      createMockProfile({ id: 1, workosUserId: 'user-1', isPublic: true, isActive: true }),
      createMockProfile({ id: 2, workosUserId: 'user-2', isPublic: false, isActive: true }),
      createMockProfile({ id: 3, workosUserId: 'user-3', isPublic: true, isActive: false }),
      createMockProfile({ id: 4, workosUserId: 'user-4', isPublic: true, isActive: true }),
    ];

    it('should return only public active profiles for anonymous users', () => {
      const result = PrivacyService.filterProfilesForViewer(profiles, { viewerId: undefined });
      expect(result).toHaveLength(2);
      expect(result.map(p => p.id)).toEqual([1, 4]);
    });

    it('should include own profile even if private', () => {
      const result = PrivacyService.filterProfilesForViewer(profiles, { viewerId: 'user-2' });
      expect(result).toHaveLength(3);
      expect(result.map(p => p.id)).toEqual([1, 2, 4]);
    });

    it('should respect includePrivate option', () => {
      const result = PrivacyService.filterProfilesForViewer(profiles, { 
        viewerId: 'user-1', 
        includePrivate: true, 
        respectOwnership: false 
      });
      expect(result).toHaveLength(4);
    });
  });

  describe('filterForPublicSearch', () => {
    it('should only return public active profiles', () => {
      const profiles = [
        createMockProfile({ id: 1, isPublic: true, isActive: true }),
        createMockProfile({ id: 2, isPublic: false, isActive: true }),
        createMockProfile({ id: 3, isPublic: true, isActive: false }),
        createMockProfile({ id: 4, isPublic: true, isActive: true }),
      ];

      const result = PrivacyService.filterForPublicSearch(profiles);
      expect(result).toHaveLength(2);
      expect(result.map(p => p.id)).toEqual([1, 4]);
    });
  });

  describe('filterForMCPRequest', () => {
    it('should only return public active profiles for MCP requests', () => {
      const profiles = [
        createMockProfile({ id: 1, isPublic: true, isActive: true }),
        createMockProfile({ id: 2, isPublic: false, isActive: true }),
        createMockProfile({ id: 3, isPublic: true, isActive: false }),
      ];

      const result = PrivacyService.filterForMCPRequest(profiles);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });
  });

  describe('getFilteredProfile', () => {
    it('should return null for profiles that cannot be viewed', () => {
      const profile = createMockProfile({ isPublic: false, workosUserId: 'user-123' });
      const result = PrivacyService.getFilteredProfile(profile, 'other-user');
      expect(result).toBeNull();
    });

    it('should return public profile for viewable profiles', () => {
      const profile = createMockProfile({ isPublic: true, isActive: true });
      const result = PrivacyService.getFilteredProfile(profile, 'other-user');
      expect(result).not.toBeNull();
      expect(result?.slug).toBe('john-doe');
      expect(result?.name).toBe('John Doe');
      expect('email' in result!).toBe(false); // Email should not be in public profile
    });

    it('should return null for null profile input', () => {
      const result = PrivacyService.getFilteredProfile(null, 'user-123');
      expect(result).toBeNull();
    });
  });

  describe('validateSearchRequest', () => {
    it('should validate normal search requests', () => {
      const filters: ProfileSearchFilters = { limit: 10, offset: 0 };
      const context = { isPublicSearch: true, isMCPRequest: false };
      
      const result = PrivacyService.validateSearchRequest(filters, context);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject requests with excessive limits', () => {
      const filters: ProfileSearchFilters = { limit: 150 };
      const context = { isPublicSearch: true, isMCPRequest: false };
      
      const result = PrivacyService.validateSearchRequest(filters, context);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Maximum limit is 100 profiles per request');
    });

    it('should reject negative offsets', () => {
      const filters: ProfileSearchFilters = { offset: -1 };
      const context = { isPublicSearch: true, isMCPRequest: false };
      
      const result = PrivacyService.validateSearchRequest(filters, context);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Offset must be non-negative');
    });

    it('should apply stricter limits for MCP requests', () => {
      const filters: ProfileSearchFilters = { limit: 75 };
      const context = { isPublicSearch: false, isMCPRequest: true };
      
      const result = PrivacyService.validateSearchRequest(filters, context);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('MCP requests are limited to 50 profiles per request');
    });
  });

  describe('shouldLogAccess', () => {
    it('should log access to private profiles', () => {
      const profile = createMockProfile({ isPublic: false });
      const result = PrivacyService.shouldLogAccess(profile, 'user-123');
      expect(result).toBe(true);
    });

    it('should log contact attempts', () => {
      const profile = createMockProfile({ isPublic: true });
      const result = PrivacyService.shouldLogAccess(profile, 'user-123', 'contact');
      expect(result).toBe(true);
    });

    it('should log when users view their own profiles', () => {
      const profile = createMockProfile({ workosUserId: 'user-123' });
      const result = PrivacyService.shouldLogAccess(profile, 'user-123', 'view');
      expect(result).toBe(true);
    });

    it('should not log regular public profile views', () => {
      const profile = createMockProfile({ isPublic: true, workosUserId: 'user-123' });
      const result = PrivacyService.shouldLogAccess(profile, 'other-user', 'view');
      expect(result).toBe(false);
    });
  });

  describe('getPrivacyViolationReason', () => {
    it('should return null for valid access', () => {
      const profile = createMockProfile({ isPublic: true, isActive: true });
      const result = PrivacyService.getPrivacyViolationReason(profile, 'other-user', 'view');
      expect(result).toBeNull();
    });

    it('should return reason for private profile access', () => {
      const profile = createMockProfile({ isPublic: false });
      const result = PrivacyService.getPrivacyViolationReason(profile, 'other-user', 'view');
      expect(result).toBe('Profile is private');
    });

    it('should return reason for inactive profile access', () => {
      const profile = createMockProfile({ isActive: false });
      const result = PrivacyService.getPrivacyViolationReason(profile, 'other-user', 'view');
      expect(result).toBe('Profile is inactive');
    });

    it('should return null for owner access', () => {
      const profile = createMockProfile({ isPublic: false, workosUserId: 'user-123' });
      const result = PrivacyService.getPrivacyViolationReason(profile, 'user-123', 'edit');
      expect(result).toBeNull();
    });

    it('should prevent self-contact', () => {
      const profile = createMockProfile({ workosUserId: 'user-123', isPublic: true, isActive: true });
      const result = PrivacyService.getPrivacyViolationReason(profile, 'user-123', 'contact');
      expect(result).toBe('Cannot contact yourself');
    });

    it('should prevent non-owner edits', () => {
      const profile = createMockProfile({ workosUserId: 'user-123' });
      const result = PrivacyService.getPrivacyViolationReason(profile, 'other-user', 'edit');
      expect(result).toBe('Only profile owner can edit');
    });
  });

  describe('shouldIncludeEmail', () => {
    const profile = createMockProfile({ workosUserId: 'user-123' });

    it('should never include email in MCP responses', () => {
      const result = PrivacyService.shouldIncludeEmail(profile, 'user-123', 'mcp');
      expect(result).toBe(false);
    });

    it('should never include email in search results', () => {
      const result = PrivacyService.shouldIncludeEmail(profile, 'user-123', 'search');
      expect(result).toBe(false);
    });

    it('should include email only for profile owner', () => {
      const ownerResult = PrivacyService.shouldIncludeEmail(profile, 'user-123', 'api');
      const otherResult = PrivacyService.shouldIncludeEmail(profile, 'other-user', 'api');
      
      expect(ownerResult).toBe(true);
      expect(otherResult).toBe(false);
    });
  });

  describe('sanitizeProfileData', () => {
    const profile = createMockProfile({ workosUserId: 'user-123' });

    it('should throw error for unauthorized access', () => {
      const privateProfile = createMockProfile({ isPublic: false, workosUserId: 'user-123' });
      
      expect(() => {
        PrivacyService.sanitizeProfileData(privateProfile, 'other-user');
      }).toThrow('Access denied');
    });

    it('should return MCP format for MCP context', () => {
      const result = PrivacyService.sanitizeProfileData(profile, 'other-user', 'mcp');
      
      expect(result).toHaveProperty('slug');
      expect(result).toHaveProperty('name');
      expect(result).not.toHaveProperty('email');
      expect(result).not.toHaveProperty('id');
      expect(result).not.toHaveProperty('workosUserId');
    });

    it('should return public profile for search context', () => {
      const result = PrivacyService.sanitizeProfileData(profile, 'other-user', 'search');
      
      expect(result).toHaveProperty('slug');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('profileUrl');
      expect(result).not.toHaveProperty('email');
    });

    it('should return full profile for owner', () => {
      const result = PrivacyService.sanitizeProfileData(profile, 'user-123', 'api');
      
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('workosUserId');
      expect(result).toEqual(profile);
    });
  });

  describe('validatePrivacyUpdate', () => {
    const profile = createMockProfile({ workosUserId: 'user-123' });

    it('should allow owner to update privacy settings', () => {
      const result = PrivacyService.validatePrivacyUpdate(
        profile, 
        { isPublic: false }, 
        'user-123'
      );
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should deny non-owner privacy updates', () => {
      const result = PrivacyService.validatePrivacyUpdate(
        profile, 
        { isPublic: false }, 
        'other-user'
      );
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Only profile owner can update privacy settings');
    });

    it('should validate boolean values', () => {
      const result = PrivacyService.validatePrivacyUpdate(
        profile, 
        { isPublic: 'invalid' as any }, 
        'user-123'
      );
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('isPublic must be a boolean value');
    });
  });
});

describe('PrivacyValidator', () => {
  describe('validateProfileAccess', () => {
    it('should validate successful profile access', () => {
      const profile = createMockProfile({ isPublic: true, isActive: true });
      const result = PrivacyValidator.validateProfileAccess(profile, 'user-123', 'view');
      
      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should validate failed profile access', () => {
      const profile = createMockProfile({ isPublic: false, workosUserId: 'user-123' });
      const result = PrivacyValidator.validateProfileAccess(profile, 'other-user', 'view');
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Profile is private');
    });

    it('should handle null profile', () => {
      const result = PrivacyValidator.validateProfileAccess(null, 'user-123', 'view');
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Profile not found');
    });
  });

  describe('validateSearchParams', () => {
    it('should validate valid search parameters', () => {
      const filters: ProfileSearchFilters = { limit: 10, query: 'test' };
      const context = { isPublicSearch: true, isMCPRequest: false };
      
      const result = PrivacyValidator.validateSearchParams(filters, context);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate invalid search parameters', () => {
      const filters: ProfileSearchFilters = { limit: 200 };
      const context = { isPublicSearch: true, isMCPRequest: false };
      
      const result = PrivacyValidator.validateSearchParams(filters, context);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('createPrivacySafeError', () => {
    it('should convert privacy errors to generic not found', () => {
      const result = PrivacyValidator.createPrivacySafeError('Profile is private', 'api');
      
      expect(result.error).toBe('Profile not found');
      expect(result.code).toBe('PROFILE_NOT_FOUND');
    });

    it('should convert access denied to generic not found', () => {
      const result = PrivacyValidator.createPrivacySafeError('Access denied', 'api');
      
      expect(result.error).toBe('Profile not found');
      expect(result.code).toBe('PROFILE_NOT_FOUND');
    });

    it('should preserve non-privacy errors', () => {
      const result = PrivacyValidator.createPrivacySafeError('Invalid input', 'api');
      
      expect(result.error).toBe('Invalid input');
      expect(result.code).toBe('VALIDATION_ERROR');
    });
  });
});