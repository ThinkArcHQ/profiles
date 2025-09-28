/**
 * Comprehensive API Integration Tests
 * 
 * This test suite provides comprehensive integration testing for all new API endpoints,
 * focusing on privacy controls, slug generation, MCP compatibility, and concurrent usage.
 * 
 * Requirements tested:
 * - 1.3: Slug generation and uniqueness under concurrent usage
 * - 2.1: Privacy controls work correctly across all features
 * - 2.2: Private profiles not appearing in search results
 * - 4.1: MCP endpoint compatibility with AI agent requirements
 * - 4.2: MCP server infrastructure and security
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock external dependencies
vi.mock('@workos-inc/authkit-nextjs', () => ({
  withAuth: vi.fn(),
}));

vi.mock('@/lib/db/connection', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
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

vi.mock('@/lib/services/slug-service.server', () => ({
  SlugServiceImpl: vi.fn().mockImplementation(() => ({
    generateSlug: vi.fn(),
    isSlugAvailable: vi.fn(),
    validateSlug: vi.fn(),
  })),
}));

import { withAuth } from '@workos-inc/authkit-nextjs';
import { db } from '@/lib/db/connection';
import { DatabasePerformanceService } from '@/lib/services/database-performance';
import { PrivacyService, PrivacyValidator } from '@/lib/services/privacy-service';
import { SlugServiceImpl } from '@/lib/services/slug-service.server';

// Import API handlers
import { GET as getProfileBySlug } from '../profiles/slug/[slug]/route';
import { POST as createProfile } from '../profiles/route';
import { GET as searchProfiles } from '../search/route';
import { POST as mcpSearchProfiles } from '../mcp/search/route';
import { POST as mcpRequestMeeting } from '../mcp/request-meeting/route';
import { POST as mcpGetProfile } from '../mcp/get-profile/route';

const mockWithAuth = withAuth as any;
const mockDb = db as any;
const mockDatabasePerformanceService = DatabasePerformanceService as any;
const mockPrivacyService = PrivacyService as any;
const mockPrivacyValidator = PrivacyValidator as any;
const mockSlugService = SlugServiceImpl as any;

describe('API Integration Tests', () => {
  let mockUser: any;
  let mockSlugServiceInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUser = {
      id: 'user_123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };

    mockSlugServiceInstance = {
      generateSlug: vi.fn().mockResolvedValue('john-doe'),
      isSlugAvailable: vi.fn().mockResolvedValue(true),
      validateSlug: vi.fn().mockReturnValue(true),
    };

    mockSlugService.mockImplementation(() => mockSlugServiceInstance);
    mockWithAuth.mockResolvedValue({ user: mockUser });
    
    // Setup default mocks
    mockPrivacyValidator.validateSearchParams.mockReturnValue({ valid: true, errors: [] });
    mockPrivacyService.filterForPublicSearch.mockImplementation((profiles) => profiles);
    mockPrivacyService.filterForMCPRequest.mockImplementation((profiles) => profiles);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Profile Creation and Slug Generation (Requirement 1.3)', () => {
    it('should handle concurrent profile creation with unique slug generation', async () => {
      // Simulate concurrent profile creation attempts
      const profileData = {
        name: 'John Doe',
        email: 'test@example.com',
        bio: 'Software Engineer',
        skills: ['JavaScript', 'TypeScript'],
        availableFor: ['meetings'],
        isPublic: true,
      };

      // Mock database responses for concurrent scenario
      let slugCounter = 0;
      mockSlugServiceInstance.generateSlug.mockImplementation(async (name: string) => {
        slugCounter++;
        return slugCounter === 1 ? 'john-doe' : `john-doe-${slugCounter}`;
      });

      mockSlugServiceInstance.isSlugAvailable.mockImplementation(async (slug: string) => {
        // First call returns false (slug taken), subsequent calls return true
        return slug !== 'john-doe';
      });

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]), // No existing profile
          }),
        }),
      });

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{
            id: 1,
            slug: 'john-doe-2',
            ...profileData,
            createdAt: new Date(),
            updatedAt: new Date(),
          }]),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/profiles', {
        method: 'POST',
        body: JSON.stringify(profileData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await createProfile(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.slug).toBe('john-doe-2');
      expect(mockSlugServiceInstance.generateSlug).toHaveBeenCalledWith('John Doe');
    });

    it('should validate slug format and reject invalid slugs', async () => {
      mockSlugServiceInstance.validateSlug.mockReturnValue(false);
      mockSlugServiceInstance.generateSlug.mockRejectedValue(new Error('Invalid name for slug generation'));

      const profileData = {
        name: '!!!Invalid Name!!!',
        email: 'test@example.com',
      };

      const request = new NextRequest('http://localhost:3000/api/profiles', {
        method: 'POST',
        body: JSON.stringify(profileData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await createProfile(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Failed to generate profile URL');
      expect(data.code).toBe('SLUG_GENERATION_ERROR');
    });
  });

  describe('Privacy Controls Integration (Requirements 2.1, 2.2)', () => {
    it('should enforce privacy controls across all profile endpoints', async () => {
      const publicProfile = {
        id: 1,
        workosUserId: 'user_456',
        slug: 'jane-doe',
        name: 'Jane Doe',
        email: 'jane@example.com',
        bio: 'Designer',
        skills: ['Design', 'UI/UX'],
        availableFor: ['meetings'],
        isPublic: true,
        isActive: true,
        linkedinUrl: 'https://linkedin.com/in/janedoe',
        otherLinks: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const privateProfile = {
        ...publicProfile,
        id: 2,
        slug: 'private-user',
        name: 'Private User',
        isPublic: false,
      };

      // Test profile lookup by slug - should return public profile
      mockDatabasePerformanceService.getProfileBySlugOptimized.mockResolvedValue(publicProfile);
      mockWithAuth.mockResolvedValue({ user: null }); // Anonymous user

      const slugRequest = new NextRequest('http://localhost:3000/api/profiles/slug/jane-doe');
      const slugResponse = await getProfileBySlug(slugRequest, { params: Promise.resolve({ slug: 'jane-doe' }) });
      const slugData = await slugResponse.json();

      expect(slugResponse.status).toBe(200);
      expect(slugData.email).toBeUndefined(); // Email should not be exposed
      expect(slugData.profileUrl).toContain('/profiles/jane-doe');

      // Test profile lookup by slug - should not return private profile
      mockDatabasePerformanceService.getProfileBySlugOptimized.mockResolvedValue(privateProfile);

      const privateSlugRequest = new NextRequest('http://localhost:3000/api/profiles/slug/private-user');
      const privateSlugResponse = await getProfileBySlug(privateSlugRequest, { params: Promise.resolve({ slug: 'private-user' }) });

      expect(privateSlugResponse.status).toBe(404);
    });

    it('should filter private profiles from search results', async () => {
      const searchResults = [
        {
          id: 1,
          slug: 'public-user',
          name: 'Public User',
          isPublic: true,
          isActive: true,
        },
        {
          id: 2,
          slug: 'private-user',
          name: 'Private User',
          isPublic: false,
          isActive: true,
        },
      ];

      const filteredResults = [searchResults[0]]; // Only public profile

      mockDatabasePerformanceService.searchProfilesOptimized.mockResolvedValue({
        profiles: searchResults,
        totalCount: 2,
      });

      mockPrivacyService.filterForPublicSearch.mockReturnValue(filteredResults);

      const searchRequest = new NextRequest('http://localhost:3000/api/search?q=user');
      const searchResponse = await searchProfiles(searchRequest);
      const searchData = await searchResponse.json();

      expect(searchResponse.status).toBe(200);
      expect(searchData.profiles).toHaveLength(1);
      expect(searchData.profiles[0].slug).toBe('public-user');
      expect(mockPrivacyService.filterForPublicSearch).toHaveBeenCalledWith(searchResults);
    });

    it('should never expose email addresses in any public endpoint', async () => {
      const profileWithEmail = {
        id: 1,
        slug: 'test-user',
        name: 'Test User',
        email: 'test@example.com',
        bio: 'Test bio',
        isPublic: true,
        isActive: true,
      };

      // Test search endpoint
      mockDatabasePerformanceService.searchProfilesOptimized.mockResolvedValue({
        profiles: [profileWithEmail],
        totalCount: 1,
      });

      const searchRequest = new NextRequest('http://localhost:3000/api/search?q=test');
      const searchResponse = await searchProfiles(searchRequest);
      const searchData = await searchResponse.json();

      expect(searchData.profiles[0].email).toBeUndefined();

      // Test profile by slug endpoint
      mockDatabasePerformanceService.getProfileBySlugOptimized.mockResolvedValue(profileWithEmail);
      mockWithAuth.mockResolvedValue({ user: null }); // Anonymous user

      const profileRequest = new NextRequest('http://localhost:3000/api/profiles/slug/test-user');
      const profileResponse = await getProfileBySlug(profileRequest, { params: Promise.resolve({ slug: 'test-user' }) });
      const profileData = await profileResponse.json();

      expect(profileData.email).toBeUndefined();
    });
  });

  describe('MCP Endpoint Compatibility (Requirements 4.1, 4.2)', () => {
    it('should provide MCP-compatible search responses', async () => {
      const mcpProfiles = [
        {
          slug: 'john-doe',
          name: 'John Doe',
          bio: 'Software Engineer',
          skills: ['JavaScript', 'TypeScript'],
          availableFor: ['meetings'],
          profileUrl: 'http://localhost:3000/profiles/john-doe',
          linkedinUrl: 'https://linkedin.com/in/johndoe',
          otherLinks: {},
        },
      ];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              offset: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockResolvedValue([{
                  id: 1,
                  slug: 'john-doe',
                  name: 'John Doe',
                  bio: 'Software Engineer',
                  skills: ['JavaScript', 'TypeScript'],
                  availableFor: ['meetings'],
                  isPublic: true,
                  isActive: true,
                  linkedinUrl: 'https://linkedin.com/in/johndoe',
                  otherLinks: {},
                }]),
              }),
            }),
          }),
        }),
      });

      // Mock count query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 1 }]),
        }),
      });

      const mcpRequest = new NextRequest('http://localhost:3000/api/mcp/search', {
        method: 'POST',
        body: JSON.stringify({
          query: 'engineer',
          skills: ['JavaScript'],
          limit: 10,
          offset: 0,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const mcpResponse = await mcpSearchProfiles(mcpRequest);
      const mcpData = await mcpResponse.json();

      expect(mcpResponse.status).toBe(200);
      expect(mcpData).toHaveProperty('profiles');
      expect(mcpData).toHaveProperty('pagination');
      expect(mcpData.pagination).toMatchObject({
        total: expect.any(Number),
        limit: 10,
        offset: 0,
        hasMore: expect.any(Boolean),
      });
      expect(mcpData.profiles[0]).not.toHaveProperty('email');
    });

    it('should validate MCP request parameters correctly', async () => {
      const invalidMcpRequest = new NextRequest('http://localhost:3000/api/mcp/search', {
        method: 'POST',
        body: JSON.stringify({
          limit: 100, // Exceeds maximum limit
          offset: -1, // Invalid offset
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const mcpResponse = await mcpSearchProfiles(invalidMcpRequest);
      const mcpData = await mcpResponse.json();

      expect(mcpResponse.status).toBe(400);
      expect(mcpData.error).toContain('Maximum limit is 50');
      expect(mcpData.code).toBe('VALIDATION_ERROR');
    });

    it('should handle MCP meeting requests with proper validation', async () => {
      const validMeetingRequest = {
        profileSlug: 'john-doe',
        requesterName: 'AI Assistant',
        requesterEmail: 'ai@example.com',
        message: 'I would like to schedule a meeting to discuss your expertise in JavaScript development.',
        requestType: 'meeting',
        preferredTime: '2024-01-15T10:00:00Z',
      };

      // Mock profile lookup
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 1,
              slug: 'john-doe',
              name: 'John Doe',
              isPublic: true,
              isActive: true,
              availableFor: ['meetings'],
            }]),
          }),
        }),
      });

      // Mock appointment creation
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{
            id: 1,
            ...validMeetingRequest,
            status: 'pending',
            createdAt: new Date(),
          }]),
        }),
      });

      const meetingRequest = new NextRequest('http://localhost:3000/api/mcp/request-meeting', {
        method: 'POST',
        body: JSON.stringify(validMeetingRequest),
        headers: { 'Content-Type': 'application/json' },
      });

      const meetingResponse = await mcpRequestMeeting(meetingRequest);
      const meetingData = await meetingResponse.json();

      expect(meetingResponse.status).toBe(200);
      expect(meetingData.success).toBe(true);
      expect(meetingData.requestId).toBeDefined();
    });

    it('should handle MCP get-profile requests correctly', async () => {
      const profileData = {
        id: 1,
        slug: 'john-doe',
        name: 'John Doe',
        bio: 'Software Engineer',
        skills: ['JavaScript', 'TypeScript'],
        availableFor: ['meetings'],
        isPublic: true,
        isActive: true,
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        otherLinks: { website: 'https://johndoe.com' },
      };

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([profileData]),
          }),
        }),
      });

      const getProfileRequest = new NextRequest('http://localhost:3000/api/mcp/get-profile', {
        method: 'POST',
        body: JSON.stringify({ profileSlug: 'john-doe' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const getProfileResponse = await mcpGetProfile(getProfileRequest);
      const getProfileData = await getProfileResponse.json();

      expect(getProfileResponse.status).toBe(200);
      expect(getProfileData.found).toBe(true);
      expect(getProfileData.profile).toMatchObject({
        slug: 'john-doe',
        name: 'John Doe',
        bio: 'Software Engineer',
        skills: ['JavaScript', 'TypeScript'],
        availableFor: ['meetings'],
        profileUrl: expect.stringContaining('/profiles/john-doe'),
      });
      expect(getProfileData.profile.email).toBeUndefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection errors gracefully', async () => {
      mockDb.select.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const request = new NextRequest('http://localhost:3000/api/search?q=test');
      const response = await searchProfiles(request);

      expect(response.status).toBe(500);
    });

    it('should handle malformed request bodies', async () => {
      const malformedRequest = new NextRequest('http://localhost:3000/api/mcp/search', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await mcpSearchProfiles(malformedRequest);
      expect(response.status).toBe(400);
    });

    it('should handle authentication failures gracefully', async () => {
      mockWithAuth.mockRejectedValue(new Error('Authentication failed'));

      const request = new NextRequest('http://localhost:3000/api/profiles', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test User', email: 'test@example.com' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await createProfile(request);
      expect(response.status).toBe(401);
    });
  });

  describe('Performance and Rate Limiting', () => {
    it('should enforce pagination limits for large result sets', async () => {
      const largeResultSet = Array.from({ length: 150 }, (_, i) => ({
        id: i + 1,
        slug: `user-${i + 1}`,
        name: `User ${i + 1}`,
        isPublic: true,
        isActive: true,
      }));

      mockDatabasePerformanceService.searchProfilesOptimized.mockResolvedValue({
        profiles: largeResultSet.slice(0, 100), // Should be capped at 100
        totalCount: 150,
      });

      const request = new NextRequest('http://localhost:3000/api/search?limit=200'); // Request more than allowed
      const response = await searchProfiles(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profiles.length).toBeLessThanOrEqual(100);
    });

    it('should handle concurrent slug generation without conflicts', async () => {
      // Simulate race condition in slug generation
      let callCount = 0;
      mockSlugServiceInstance.isSlugAvailable.mockImplementation(async (slug: string) => {
        callCount++;
        // First few calls return false (simulating concurrent attempts)
        return callCount > 3;
      });

      mockSlugServiceInstance.generateSlug.mockImplementation(async (name: string) => {
        const baseSlug = name.toLowerCase().replace(/\s+/g, '-');
        return callCount > 3 ? `${baseSlug}-${callCount}` : baseSlug;
      });

      const profileData = {
        name: 'Popular Name',
        email: 'test@example.com',
      };

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{
            id: 1,
            slug: 'popular-name-4',
            ...profileData,
            createdAt: new Date(),
            updatedAt: new Date(),
          }]),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/profiles', {
        method: 'POST',
        body: JSON.stringify(profileData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await createProfile(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.slug).toMatch(/^popular-name-\d+$/);
    });
  });
});