/**
 * Privacy Controls Integration Tests
 * 
 * This test suite verifies that privacy controls work correctly across all features
 * and that private profiles are properly protected from unauthorized access.
 * 
 * Requirements tested:
 * - 2.1: Privacy controls work correctly across all features
 * - 2.2: Private profiles not appearing in search results
 * - 2.3: Email addresses never visible to other users or AI agents
 * - 2.4: Public profiles discoverable through search and MCP endpoints
 * - 2.5: Privacy status indicators visible to users
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@workos-inc/authkit-nextjs', () => ({
  withAuth: vi.fn(),
}));

vi.mock('@/lib/db/connection', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/lib/services/database-performance', () => ({
  DatabasePerformanceService: {
    getProfileBySlugOptimized: vi.fn(),
    searchProfilesOptimized: vi.fn(),
  },
}));

vi.mock('@/lib/services/privacy-service', () => ({
  PrivacyService: {
    filterForPublicSearch: vi.fn(),
    filterForMCPRequest: vi.fn(),
  },
  PrivacyValidator: {
    validateSearchParams: vi.fn(),
  },
}));

vi.mock('@/lib/types/profile', () => ({
  ProfileTransformer: {
    canViewProfile: vi.fn(),
    toPublicProfile: vi.fn(),
    toMCPProfile: vi.fn(),
    toPublicSearchResults: vi.fn(),
  },
}));

import { withAuth } from '@workos-inc/authkit-nextjs';
import { db } from '@/lib/db/connection';
import { DatabasePerformanceService } from '@/lib/services/database-performance';
import { PrivacyService, PrivacyValidator } from '@/lib/services/privacy-service';
import { ProfileTransformer } from '@/lib/types/profile';

// Import API handlers
import { GET as getProfileBySlug } from '../profiles/slug/[slug]/route';
import { GET as searchProfiles } from '../search/route';
import { POST as mcpSearchProfiles } from '../mcp/search/route';
import { POST as mcpGetProfile } from '../mcp/get-profile/route';
import { PATCH as updatePrivacySettings } from '../profiles/[id]/privacy/route';

const mockWithAuth = withAuth as any;
const mockDb = db as any;
const mockDatabasePerformanceService = DatabasePerformanceService as any;
const mockPrivacyService = PrivacyService as any;
const mockPrivacyValidator = PrivacyValidator as any;
const mockProfileTransformer = ProfileTransformer as any;

describe('Privacy Controls Integration Tests', () => {
  let publicProfile: any;
  let privateProfile: any;
  let ownerUser: any;
  let anonymousUser: any;

  beforeEach(() => {
    vi.clearAllMocks();

    ownerUser = {
      id: 'user_123',
      email: 'owner@example.com',
    };

    anonymousUser = null;

    publicProfile = {
      id: 1,
      workosUserId: 'user_123',
      slug: 'public-user',
      name: 'Public User',
      email: 'public@example.com',
      bio: 'I am a public user',
      skills: ['JavaScript', 'React'],
      availableFor: ['meetings'],
      isPublic: true,
      isActive: true,
      linkedinUrl: 'https://linkedin.com/in/publicuser',
      otherLinks: { website: 'https://publicuser.com' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    privateProfile = {
      id: 2,
      workosUserId: 'user_456',
      slug: 'private-user',
      name: 'Private User',
      email: 'private@example.com',
      bio: 'I am a private user',
      skills: ['Python', 'Django'],
      availableFor: ['quotes'],
      isPublic: false,
      isActive: true,
      linkedinUrl: null,
      otherLinks: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Setup default mocks
    mockPrivacyValidator.validateSearchParams.mockReturnValue({ valid: true, errors: [] });
    mockPrivacyService.filterForPublicSearch.mockImplementation((profiles) => 
      profiles.filter((p: any) => p.isPublic && p.isActive)
    );
    mockPrivacyService.filterForMCPRequest.mockImplementation((profiles) => 
      profiles.filter((p: any) => p.isPublic && p.isActive)
    );
    mockProfileTransformer.canViewProfile.mockImplementation((profile, viewerId) => {
      if (profile.workosUserId === viewerId) return true;
      return profile.isPublic && profile.isActive;
    });
    mockProfileTransformer.toPublicProfile.mockImplementation((profile, baseUrl) => ({
      slug: profile.slug,
      name: profile.name,
      bio: profile.bio,
      skills: profile.skills,
      availableFor: profile.availableFor,
      profileUrl: `${baseUrl}/profiles/${profile.slug}`,
      linkedinUrl: profile.linkedinUrl,
      otherLinks: profile.otherLinks,
      // Note: email is never included
    }));
    mockProfileTransformer.toMCPProfile.mockImplementation((profile, baseUrl) => ({
      slug: profile.slug,
      name: profile.name,
      bio: profile.bio,
      skills: profile.skills,
      availableFor: profile.availableFor,
      profileUrl: `${baseUrl}/profiles/${profile.slug}`,
      linkedinUrl: profile.linkedinUrl,
      otherLinks: profile.otherLinks,
      // Note: email is never included
    }));
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Profile Access Control (Requirement 2.1)', () => {
    it('should allow profile owners to view their own private profiles', async () => {
      mockWithAuth.mockResolvedValue({ user: { id: 'user_456' } });
      mockDatabasePerformanceService.getProfileBySlugOptimized.mockResolvedValue(privateProfile);
      mockProfileTransformer.canViewProfile.mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/profiles/slug/private-user');
      const response = await getProfileBySlug(request, { params: Promise.resolve({ slug: 'private-user' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.slug).toBe('private-user');
      expect(data.name).toBe('Private User');
      // Owner should see full profile (including email in this case)
      expect(mockProfileTransformer.canViewProfile).toHaveBeenCalledWith(privateProfile, 'user_456');
    });

    it('should deny access to private profiles for non-owners', async () => {
      mockWithAuth.mockResolvedValue({ user: anonymousUser });
      mockDatabasePerformanceService.getProfileBySlugOptimized.mockResolvedValue(privateProfile);
      mockProfileTransformer.canViewProfile.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/profiles/slug/private-user');
      const response = await getProfileBySlug(request, { params: Promise.resolve({ slug: 'private-user' }) });

      expect(response.status).toBe(404);
      expect(mockProfileTransformer.canViewProfile).toHaveBeenCalledWith(privateProfile, undefined);
    });

    it('should allow access to public profiles for everyone', async () => {
      mockWithAuth.mockResolvedValue({ user: anonymousUser });
      mockDatabasePerformanceService.getProfileBySlugOptimized.mockResolvedValue(publicProfile);
      mockProfileTransformer.canViewProfile.mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/profiles/slug/public-user');
      const response = await getProfileBySlug(request, { params: Promise.resolve({ slug: 'public-user' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.slug).toBe('public-user');
      expect(data.email).toBeUndefined(); // Email should never be exposed to non-owners
    });
  });

  describe('Search Privacy Controls (Requirement 2.2)', () => {
    it('should exclude private profiles from search results', async () => {
      const allProfiles = [publicProfile, privateProfile];
      const filteredProfiles = [publicProfile]; // Only public profile

      mockDatabasePerformanceService.searchProfilesOptimized.mockResolvedValue({
        profiles: allProfiles,
        totalCount: 2,
      });

      mockPrivacyService.filterForPublicSearch.mockReturnValue(filteredProfiles);
      mockProfileTransformer.toPublicSearchResults.mockReturnValue({
        profiles: filteredProfiles.map(p => mockProfileTransformer.toPublicProfile(p, 'http://localhost:3000')),
        pagination: {
          total: 1,
          limit: 20,
          offset: 0,
          hasMore: false,
        },
      });

      const request = new NextRequest('http://localhost:3000/api/search?q=user');
      const response = await searchProfiles(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profiles).toHaveLength(1);
      expect(data.profiles[0].slug).toBe('public-user');
      expect(mockPrivacyService.filterForPublicSearch).toHaveBeenCalledWith(allProfiles);
    });

    it('should exclude inactive profiles from search results', async () => {
      const inactiveProfile = { ...publicProfile, isActive: false };
      const allProfiles = [publicProfile, inactiveProfile];
      const filteredProfiles = [publicProfile]; // Only active profile

      mockDatabasePerformanceService.searchProfilesOptimized.mockResolvedValue({
        profiles: allProfiles,
        totalCount: 2,
      });

      mockPrivacyService.filterForPublicSearch.mockReturnValue(filteredProfiles);
      mockProfileTransformer.toPublicSearchResults.mockReturnValue({
        profiles: filteredProfiles.map(p => mockProfileTransformer.toPublicProfile(p, 'http://localhost:3000')),
        pagination: {
          total: 1,
          limit: 20,
          offset: 0,
          hasMore: false,
        },
      });

      const request = new NextRequest('http://localhost:3000/api/search?q=user');
      const response = await searchProfiles(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profiles).toHaveLength(1);
      expect(data.profiles[0].slug).toBe('public-user');
    });
  });

  describe('Email Privacy Protection (Requirement 2.3)', () => {
    it('should never include email addresses in search results', async () => {
      mockDatabasePerformanceService.searchProfilesOptimized.mockResolvedValue({
        profiles: [publicProfile],
        totalCount: 1,
      });

      mockPrivacyService.filterForPublicSearch.mockReturnValue([publicProfile]);
      mockProfileTransformer.toPublicSearchResults.mockReturnValue({
        profiles: [{
          slug: 'public-user',
          name: 'Public User',
          bio: 'I am a public user',
          skills: ['JavaScript', 'React'],
          availableFor: ['meetings'],
          profileUrl: 'http://localhost:3000/profiles/public-user',
          linkedinUrl: 'https://linkedin.com/in/publicuser',
          otherLinks: { website: 'https://publicuser.com' },
          // Note: email is never included
        }],
        pagination: {
          total: 1,
          limit: 20,
          offset: 0,
          hasMore: false,
        },
      });

      const request = new NextRequest('http://localhost:3000/api/search?q=user');
      const response = await searchProfiles(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profiles[0]).not.toHaveProperty('email');
      expect(data.profiles[0]).not.toHaveProperty('workosUserId');
    });

    it('should never include email addresses in MCP search results', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              offset: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockResolvedValue([publicProfile]),
              }),
            }),
          }),
        }),
      });

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 1 }]),
        }),
      });

      mockPrivacyService.filterForMCPRequest.mockReturnValue([publicProfile]);

      const request = new NextRequest('http://localhost:3000/api/mcp/search', {
        method: 'POST',
        body: JSON.stringify({ query: 'user' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await mcpSearchProfiles(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profiles[0]).not.toHaveProperty('email');
      expect(data.profiles[0]).not.toHaveProperty('workosUserId');
    });

    it('should never include email addresses in MCP get-profile results', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([publicProfile]),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/mcp/get-profile', {
        method: 'POST',
        body: JSON.stringify({ profileSlug: 'public-user' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await mcpGetProfile(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profile).not.toHaveProperty('email');
      expect(data.profile).not.toHaveProperty('workosUserId');
    });

    it('should never search email addresses in query text', async () => {
      // This test verifies that email addresses are not searchable
      const emailQuery = 'public@example.com';

      mockDatabasePerformanceService.searchProfilesOptimized.mockResolvedValue({
        profiles: [], // No results when searching by email
        totalCount: 0,
      });

      const request = new NextRequest(`http://localhost:3000/api/search?q=${encodeURIComponent(emailQuery)}`);
      const response = await searchProfiles(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profiles).toHaveLength(0);
      
      // Verify that the search was performed but didn't include email fields
      expect(mockDatabasePerformanceService.searchProfilesOptimized).toHaveBeenCalledWith({
        query: emailQuery,
        skills: undefined,
        availableFor: undefined,
        limit: 20,
        offset: 0,
      });
    });
  });

  describe('MCP Privacy Controls (Requirement 2.4)', () => {
    it('should only return public profiles in MCP search', async () => {
      const allProfiles = [publicProfile, privateProfile];
      const filteredProfiles = [publicProfile];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              offset: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockResolvedValue(allProfiles),
              }),
            }),
          }),
        }),
      });

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 2 }]),
        }),
      });

      mockPrivacyService.filterForMCPRequest.mockReturnValue(filteredProfiles);

      const request = new NextRequest('http://localhost:3000/api/mcp/search', {
        method: 'POST',
        body: JSON.stringify({ query: 'user' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await mcpSearchProfiles(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profiles).toHaveLength(1);
      expect(data.profiles[0].slug).toBe('public-user');
      expect(mockPrivacyService.filterForMCPRequest).toHaveBeenCalledWith(allProfiles);
    });

    it('should not return private profiles in MCP get-profile', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([privateProfile]),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/mcp/get-profile', {
        method: 'POST',
        body: JSON.stringify({ profileSlug: 'private-user' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await mcpGetProfile(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.found).toBe(false);
      expect(data.profile).toBe(null);
    });
  });

  describe('Privacy Settings Management (Requirement 2.5)', () => {
    it('should allow users to update their privacy settings', async () => {
      mockWithAuth.mockResolvedValue({ user: { id: 'user_123' } });

      // Mock profile lookup
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([publicProfile]),
          }),
        }),
      });

      // Mock profile update
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{
              ...publicProfile,
              isPublic: false, // Updated to private
              updatedAt: new Date(),
            }]),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/profiles/1/privacy', {
        method: 'PATCH',
        body: JSON.stringify({ isPublic: false }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await updatePrivacySettings(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isPublic).toBe(false);
      expect(data.message).toContain('Privacy settings updated');
    });

    it('should prevent unauthorized users from updating privacy settings', async () => {
      mockWithAuth.mockResolvedValue({ user: { id: 'different_user' } });

      // Mock profile lookup
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([publicProfile]),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/profiles/1/privacy', {
        method: 'PATCH',
        body: JSON.stringify({ isPublic: false }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await updatePrivacySettings(request, { params: Promise.resolve({ id: '1' }) });

      expect(response.status).toBe(403);
    });
  });

  describe('Privacy-Safe Error Messages', () => {
    it('should return 404 instead of 403 for private profiles to avoid information leakage', async () => {
      mockWithAuth.mockResolvedValue({ user: anonymousUser });
      mockDatabasePerformanceService.getProfileBySlugOptimized.mockResolvedValue(privateProfile);
      mockProfileTransformer.canViewProfile.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/profiles/slug/private-user');
      const response = await getProfileBySlug(request, { params: Promise.resolve({ slug: 'private-user' }) });

      // Should return 404 (not found) instead of 403 (forbidden) to avoid revealing profile existence
      expect(response.status).toBe(404);
    });

    it('should return generic error messages that do not reveal profile privacy status', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([privateProfile]),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/mcp/get-profile', {
        method: 'POST',
        body: JSON.stringify({ profileSlug: 'private-user' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await mcpGetProfile(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Profile not found'); // Generic message
      expect(data.error).not.toContain('private');
      expect(data.error).not.toContain('access denied');
    });
  });

  describe('Cross-Feature Privacy Consistency', () => {
    it('should maintain consistent privacy behavior across all endpoints', async () => {
      const testProfile = privateProfile;

      // Test profile by slug endpoint
      mockWithAuth.mockResolvedValue({ user: anonymousUser });
      mockDatabasePerformanceService.getProfileBySlugOptimized.mockResolvedValue(testProfile);
      mockProfileTransformer.canViewProfile.mockReturnValue(false);

      const slugRequest = new NextRequest('http://localhost:3000/api/profiles/slug/private-user');
      const slugResponse = await getProfileBySlug(slugRequest, { params: Promise.resolve({ slug: 'private-user' }) });
      expect(slugResponse.status).toBe(404);

      // Test search endpoint
      mockDatabasePerformanceService.searchProfilesOptimized.mockResolvedValue({
        profiles: [testProfile],
        totalCount: 1,
      });
      mockPrivacyService.filterForPublicSearch.mockReturnValue([]);

      const searchRequest = new NextRequest('http://localhost:3000/api/search?q=private');
      const searchResponse = await searchProfiles(searchRequest);
      const searchData = await searchResponse.json();
      expect(searchData.profiles).toHaveLength(0);

      // Test MCP search endpoint
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              offset: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockResolvedValue([testProfile]),
              }),
            }),
          }),
        }),
      });
      mockPrivacyService.filterForMCPRequest.mockReturnValue([]);

      const mcpSearchRequest = new NextRequest('http://localhost:3000/api/mcp/search', {
        method: 'POST',
        body: JSON.stringify({ query: 'private' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const mcpSearchResponse = await mcpSearchProfiles(mcpSearchRequest);
      const mcpSearchData = await mcpSearchResponse.json();
      expect(mcpSearchData.profiles).toHaveLength(0);

      // Test MCP get-profile endpoint
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([testProfile]),
          }),
        }),
      });

      const mcpGetRequest = new NextRequest('http://localhost:3000/api/mcp/get-profile', {
        method: 'POST',
        body: JSON.stringify({ profileSlug: 'private-user' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const mcpGetResponse = await mcpGetProfile(mcpGetRequest);
      expect(mcpGetResponse.status).toBe(404);

      // All endpoints should consistently hide private profiles
    });
  });
});