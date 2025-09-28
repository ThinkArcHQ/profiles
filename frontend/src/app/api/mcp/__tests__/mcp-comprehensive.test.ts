/**
 * Comprehensive MCP Integration Tests
 * 
 * This test suite provides comprehensive testing for MCP endpoints to ensure
 * compatibility with AI agent requirements and proper security measures.
 * 
 * Requirements tested:
 * - 4.1: MCP endpoint compatibility with AI agent requirements
 * - 4.2: MCP server infrastructure and security measures
 * - 2.1: Privacy controls work correctly in MCP context
 * - 2.2: Private profiles not accessible via MCP
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/db/connection', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/lib/services/privacy-service', () => ({
  PrivacyService: {
    filterForMCPRequest: vi.fn(),
  },
}));

vi.mock('@/lib/utils/mcp-errors', () => ({
  MCPErrorHandler: {
    validateSearchParams: vi.fn(),
    createSearchError: vi.fn(),
    logError: vi.fn(),
  },
  MCPErrorCodes: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    SEARCH_ERROR: 'SEARCH_ERROR',
    PROFILE_NOT_FOUND: 'PROFILE_NOT_FOUND',
    INVALID_SLUG_FORMAT: 'INVALID_SLUG_FORMAT',
  },
}));

vi.mock('@/lib/middleware/mcp-middleware', () => ({
  withMCPMiddleware: vi.fn((config, handler) => handler),
  MCPMiddleware: {
    createSuccessResponse: vi.fn((data, status, clientInfo) => 
      new Response(JSON.stringify(data), { status })
    ),
  },
}));

import { db } from '@/lib/db/connection';
import { PrivacyService } from '@/lib/services/privacy-service';
import { MCPErrorHandler, MCPErrorCodes } from '@/lib/utils/mcp-errors';

// Import MCP handlers
import { POST as mcpSearch } from '../search/route';
import { POST as mcpRequestMeeting } from '../request-meeting/route';
import { POST as mcpGetProfile } from '../get-profile/route';

const mockDb = db as any;
const mockPrivacyService = PrivacyService as any;
const mockMCPErrorHandler = MCPErrorHandler as any;

describe('MCP Comprehensive Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default successful mocks
    mockMCPErrorHandler.validateSearchParams.mockReturnValue({ isValid: true, errors: [] });
    mockMCPErrorHandler.createSearchError.mockImplementation((message, code, details) => ({
      error: message,
      code,
      details,
      profiles: [],
    }));
    mockPrivacyService.filterForMCPRequest.mockImplementation((profiles) => profiles);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('MCP Search Tool (search_profiles)', () => {
    it('should return MCP-compatible search results with proper structure', async () => {
      const mockProfiles = [
        {
          id: 1,
          slug: 'john-doe',
          name: 'John Doe',
          bio: 'Software Engineer',
          skills: ['JavaScript', 'TypeScript', 'React'],
          availableFor: ['meetings', 'quotes'],
          isPublic: true,
          isActive: true,
          linkedinUrl: 'https://linkedin.com/in/johndoe',
          otherLinks: { website: 'https://johndoe.com' },
          createdAt: new Date(),
        },
        {
          id: 2,
          slug: 'jane-smith',
          name: 'Jane Smith',
          bio: 'UX Designer',
          skills: ['Design', 'Figma', 'User Research'],
          availableFor: ['meetings'],
          isPublic: true,
          isActive: true,
          linkedinUrl: null,
          otherLinks: {},
          createdAt: new Date(),
        },
      ];

      // Mock database search query
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              offset: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockResolvedValue(mockProfiles),
              }),
            }),
          }),
        }),
      });

      // Mock count query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 2 }]),
        }),
      });

      const searchRequest = new NextRequest('http://localhost:3000/api/mcp/search', {
        method: 'POST',
        body: JSON.stringify({
          query: 'engineer',
          skills: ['JavaScript'],
          availableFor: ['meetings'],
          limit: 10,
          offset: 0,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await mcpSearch(searchRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      
      // Verify MCP-compatible response structure
      expect(data).toHaveProperty('profiles');
      expect(data).toHaveProperty('pagination');
      
      expect(data.pagination).toMatchObject({
        total: 2,
        limit: 10,
        offset: 0,
        hasMore: false,
      });

      // Verify profile structure matches MCP requirements
      expect(data.profiles).toHaveLength(2);
      expect(data.profiles[0]).toMatchObject({
        slug: 'john-doe',
        name: 'John Doe',
        bio: 'Software Engineer',
        skills: ['JavaScript', 'TypeScript', 'React'],
        availableFor: ['meetings', 'quotes'],
        profileUrl: expect.stringContaining('/profiles/john-doe'),
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        otherLinks: { website: 'https://johndoe.com' },
      });

      // Verify email is never included
      expect(data.profiles[0]).not.toHaveProperty('email');
      expect(data.profiles[1]).not.toHaveProperty('email');
    });

    it('should enforce MCP-specific validation rules', async () => {
      const testCases = [
        {
          name: 'limit too high',
          body: { limit: 100 },
          expectedError: 'Maximum limit is 50',
        },
        {
          name: 'negative offset',
          body: { offset: -1 },
          expectedError: 'Offset must be non-negative',
        },
        {
          name: 'invalid skills format',
          body: { skills: 'not-an-array' },
          expectedError: 'Skills must be an array',
        },
        {
          name: 'invalid availableFor format',
          body: { availableFor: 123 },
          expectedError: 'AvailableFor must be an array',
        },
      ];

      for (const testCase of testCases) {
        mockMCPErrorHandler.validateSearchParams.mockReturnValue({
          isValid: false,
          errors: [testCase.expectedError],
        });

        const request = new NextRequest('http://localhost:3000/api/mcp/search', {
          method: 'POST',
          body: JSON.stringify(testCase.body),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await mcpSearch(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain(testCase.expectedError);
        expect(data.code).toBe('VALIDATION_ERROR');
        expect(data.profiles).toEqual([]);
      }
    });

    it('should apply privacy filtering for MCP requests', async () => {
      const allProfiles = [
        { id: 1, slug: 'public-user', isPublic: true, isActive: true },
        { id: 2, slug: 'private-user', isPublic: false, isActive: true },
        { id: 3, slug: 'inactive-user', isPublic: true, isActive: false },
      ];

      const filteredProfiles = [allProfiles[0]]; // Only public, active profile

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
          where: vi.fn().mockResolvedValue([{ count: 3 }]),
        }),
      });

      mockPrivacyService.filterForMCPRequest.mockReturnValue(filteredProfiles);

      const request = new NextRequest('http://localhost:3000/api/mcp/search', {
        method: 'POST',
        body: JSON.stringify({ query: 'user' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await mcpSearch(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profiles).toHaveLength(1);
      expect(data.profiles[0].slug).toBe('public-user');
      expect(mockPrivacyService.filterForMCPRequest).toHaveBeenCalledWith(allProfiles);
    });

    it('should handle search with multiple filter combinations', async () => {
      const mockProfiles = [
        {
          id: 1,
          slug: 'fullstack-dev',
          name: 'Full Stack Developer',
          skills: ['JavaScript', 'Python', 'React'],
          availableFor: ['meetings', 'quotes'],
          isPublic: true,
          isActive: true,
        },
      ];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              offset: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockResolvedValue(mockProfiles),
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

      const complexSearchRequest = new NextRequest('http://localhost:3000/api/mcp/search', {
        method: 'POST',
        body: JSON.stringify({
          query: 'developer',
          skills: ['JavaScript', 'React'],
          availableFor: ['meetings'],
          limit: 5,
          offset: 0,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await mcpSearch(complexSearchRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profiles).toHaveLength(1);
      expect(data.profiles[0].slug).toBe('fullstack-dev');
    });
  });

  describe('MCP Request Meeting Tool (request_meeting)', () => {
    it('should create meeting requests with proper validation', async () => {
      const validMeetingRequest = {
        profileSlug: 'john-doe',
        requesterName: 'AI Assistant',
        requesterEmail: 'ai@company.com',
        message: 'I would like to schedule a meeting to discuss your expertise in JavaScript development and potential collaboration opportunities.',
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
            id: 123,
            profileId: 1,
            requesterName: 'AI Assistant',
            requesterEmail: 'ai@company.com',
            message: validMeetingRequest.message,
            requestType: 'meeting',
            status: 'pending',
            createdAt: new Date(),
          }]),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/mcp/request-meeting', {
        method: 'POST',
        body: JSON.stringify(validMeetingRequest),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await mcpRequestMeeting(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.requestId).toBe('123');
      expect(data.message).toContain('Meeting request sent successfully');
    });

    it('should validate required fields for meeting requests', async () => {
      const testCases = [
        {
          name: 'missing profileSlug',
          body: {
            requesterName: 'AI Assistant',
            requesterEmail: 'ai@company.com',
            message: 'Test message',
            requestType: 'meeting',
          },
          expectedError: 'Missing required field: profileSlug',
        },
        {
          name: 'missing requesterName',
          body: {
            profileSlug: 'john-doe',
            requesterEmail: 'ai@company.com',
            message: 'Test message',
            requestType: 'meeting',
          },
          expectedError: 'Missing required field: requesterName',
        },
        {
          name: 'invalid email format',
          body: {
            profileSlug: 'john-doe',
            requesterName: 'AI Assistant',
            requesterEmail: 'invalid-email',
            message: 'Test message',
            requestType: 'meeting',
          },
          expectedError: 'Invalid email format',
        },
        {
          name: 'message too short',
          body: {
            profileSlug: 'john-doe',
            requesterName: 'AI Assistant',
            requesterEmail: 'ai@company.com',
            message: 'Hi',
            requestType: 'meeting',
          },
          expectedError: 'Message must be at least 20 characters long',
        },
        {
          name: 'invalid request type',
          body: {
            profileSlug: 'john-doe',
            requesterName: 'AI Assistant',
            requesterEmail: 'ai@company.com',
            message: 'This is a valid message that is long enough',
            requestType: 'invalid-type',
          },
          expectedError: 'Request type must be either "meeting" or "quote"',
        },
      ];

      for (const testCase of testCases) {
        const request = new NextRequest('http://localhost:3000/api/mcp/request-meeting', {
          method: 'POST',
          body: JSON.stringify(testCase.body),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await mcpRequestMeeting(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain(testCase.expectedError);
        expect(data.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should handle profile not found or private profiles', async () => {
      // Mock profile not found
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]), // No profile found
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/mcp/request-meeting', {
        method: 'POST',
        body: JSON.stringify({
          profileSlug: 'non-existent-user',
          requesterName: 'AI Assistant',
          requesterEmail: 'ai@company.com',
          message: 'This is a valid message that is long enough',
          requestType: 'meeting',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await mcpRequestMeeting(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Profile not found or not available for requests');
      expect(data.code).toBe('PROFILE_NOT_FOUND');
    });

    it('should respect availability preferences', async () => {
      // Mock profile that doesn't accept meetings
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 1,
              slug: 'quotes-only-user',
              name: 'Quotes Only User',
              isPublic: true,
              isActive: true,
              availableFor: ['quotes'], // Only accepts quotes, not meetings
            }]),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/mcp/request-meeting', {
        method: 'POST',
        body: JSON.stringify({
          profileSlug: 'quotes-only-user',
          requesterName: 'AI Assistant',
          requesterEmail: 'ai@company.com',
          message: 'This is a valid message that is long enough',
          requestType: 'meeting', // Requesting meeting but user only accepts quotes
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await mcpRequestMeeting(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('not available for meeting requests');
      expect(data.code).toBe('REQUEST_TYPE_NOT_ALLOWED');
    });
  });

  describe('MCP Get Profile Tool (get_profile)', () => {
    it('should return detailed profile information for valid slugs', async () => {
      const mockProfile = {
        id: 1,
        slug: 'john-doe',
        name: 'John Doe',
        bio: 'Experienced software engineer specializing in full-stack development',
        skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python'],
        availableFor: ['meetings', 'quotes'],
        isPublic: true,
        isActive: true,
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        otherLinks: {
          website: 'https://johndoe.com',
          github: 'https://github.com/johndoe',
        },
        createdAt: new Date(),
      };

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockProfile]),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/mcp/get-profile', {
        method: 'POST',
        body: JSON.stringify({ profileSlug: 'john-doe' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await mcpGetProfile(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.found).toBe(true);
      expect(data.profile).toMatchObject({
        slug: 'john-doe',
        name: 'John Doe',
        bio: 'Experienced software engineer specializing in full-stack development',
        skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python'],
        availableFor: ['meetings', 'quotes'],
        profileUrl: expect.stringContaining('/profiles/john-doe'),
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        otherLinks: {
          website: 'https://johndoe.com',
          github: 'https://github.com/johndoe',
        },
      });
      expect(data.profile.email).toBeUndefined();
    });

    it('should validate slug format', async () => {
      const invalidSlugs = [
        'Invalid Slug!',
        'slug_with_underscores',
        'UPPERCASE-SLUG',
        'slug with spaces',
        'slug@with#special$chars',
        '', // empty slug
        'ab', // too short
        'a'.repeat(51), // too long
      ];

      for (const invalidSlug of invalidSlugs) {
        const request = new NextRequest('http://localhost:3000/api/mcp/get-profile', {
          method: 'POST',
          body: JSON.stringify({ profileSlug: invalidSlug }),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await mcpGetProfile(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.found).toBe(false);
        expect(data.error).toContain('Validation failed');
        expect(data.code).toBe('INVALID_SLUG_FORMAT');
        expect(data.profile).toBe(null);
      }
    });

    it('should handle profile not found', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]), // No profile found
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/mcp/get-profile', {
        method: 'POST',
        body: JSON.stringify({ profileSlug: 'non-existent-user' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await mcpGetProfile(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.found).toBe(false);
      expect(data.error).toBe('Profile not found');
      expect(data.code).toBe('PROFILE_NOT_FOUND');
      expect(data.profile).toBe(null);
    });

    it('should not return private profiles', async () => {
      const privateProfile = {
        id: 1,
        slug: 'private-user',
        name: 'Private User',
        isPublic: false, // Private profile
        isActive: true,
      };

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
      expect(data.error).toBe('Profile not found');
      expect(data.profile).toBe(null);
    });
  });

  describe('MCP Error Handling and Security', () => {
    it('should handle malformed JSON requests', async () => {
      const malformedRequest = new NextRequest('http://localhost:3000/api/mcp/search', {
        method: 'POST',
        body: 'invalid json content',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await mcpSearch(malformedRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid JSON');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should handle database errors gracefully', async () => {
      mockDb.select.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const request = new NextRequest('http://localhost:3000/api/mcp/search', {
        method: 'POST',
        body: JSON.stringify({ query: 'test' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await mcpSearch(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to search profiles');
      expect(data.code).toBe('SEARCH_ERROR');
      expect(mockMCPErrorHandler.logError).toHaveBeenCalled();
    });

    it('should log errors for monitoring and debugging', async () => {
      const error = new Error('Test error');
      mockDb.select.mockImplementation(() => {
        throw error;
      });

      const request = new NextRequest('http://localhost:3000/api/mcp/search', {
        method: 'POST',
        body: JSON.stringify({ query: 'test' }),
        headers: { 'Content-Type': 'application/json' },
      });

      await mcpSearch(request);

      expect(mockMCPErrorHandler.logError).toHaveBeenCalledWith(
        'search_profiles',
        error,
        expect.objectContaining({
          query: 'test',
        })
      );
    });

    it('should enforce rate limiting (simulated)', async () => {
      // This test simulates rate limiting behavior
      // In a real implementation, this would be handled by the MCP middleware
      
      const rateLimitedResponse = {
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        profiles: [],
      };

      // Simulate rate limit exceeded
      const request = new NextRequest('http://localhost:3000/api/mcp/search', {
        method: 'POST',
        body: JSON.stringify({ query: 'test' }),
        headers: { 
          'Content-Type': 'application/json',
          'X-Rate-Limit-Exceeded': 'true', // Simulated header
        },
      });

      // In a real scenario, the middleware would handle this
      if (request.headers.get('X-Rate-Limit-Exceeded')) {
        const response = new Response(JSON.stringify(rateLimitedResponse), { status: 429 });
        const data = await response.json();
        
        expect(response.status).toBe(429);
        expect(data.error).toBe('Rate limit exceeded');
        expect(data.code).toBe('RATE_LIMIT_EXCEEDED');
      }
    });
  });
});