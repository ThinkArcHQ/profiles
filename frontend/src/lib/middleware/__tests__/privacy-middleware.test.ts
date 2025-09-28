/**
 * Privacy Middleware Unit Tests
 * 
 * Tests for privacy middleware functions and utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { PrivacyMiddleware, PrivacyUtils, RequestContext } from '../privacy-middleware';
import { Profile, ProfileSearchFilters } from '@/lib/types/profile';

// Mock profile data
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

// Mock request context
const createMockContext = (overrides: Partial<RequestContext> = {}): RequestContext => ({
  userId: undefined,
  isAuthenticated: false,
  userAgent: 'test-agent',
  ip: '127.0.0.1',
  ...overrides,
});

// Mock NextRequest
const createMockRequest = (url: string = 'https://example.com', headers: Record<string, string> = {}): NextRequest => {
  const request = new NextRequest(url);
  
  // Mock headers.get method to return our test headers
  const originalGet = request.headers.get.bind(request.headers);
  vi.spyOn(request.headers, 'get').mockImplementation((name: string) => {
    const headerKey = Object.keys(headers).find(key => key.toLowerCase() === name.toLowerCase());
    if (headerKey) {
      return headers[headerKey];
    }
    return originalGet(name);
  });

  // Mock headers.has method for MCP detection
  vi.spyOn(request.headers, 'has').mockImplementation((name: string) => {
    const headerKey = Object.keys(headers).find(key => key.toLowerCase() === name.toLowerCase());
    return !!headerKey;
  });

  return request;
};

describe('PrivacyMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateProfileAccess', () => {
    it('should allow access to public profiles', () => {
      const profile = createMockProfile({ isPublic: true, isActive: true });
      const context = createMockContext({ userId: 'other-user' });

      const result = PrivacyMiddleware.validateProfileAccess(profile, context);

      expect(result.allowed).toBe(true);
      expect(result.response).toBeUndefined();
    });

    it('should deny access to private profiles for non-owners', () => {
      const profile = createMockProfile({ isPublic: false, workosUserId: 'user-123' });
      const context = createMockContext({ userId: 'other-user' });

      const result = PrivacyMiddleware.validateProfileAccess(profile, context);

      expect(result.allowed).toBe(false);
      expect(result.response).toBeDefined();
    });

    it('should allow owner access to their private profile', () => {
      const profile = createMockProfile({ isPublic: false, workosUserId: 'user-123' });
      const context = createMockContext({ userId: 'user-123', isAuthenticated: true });

      const result = PrivacyMiddleware.validateProfileAccess(profile, context);

      expect(result.allowed).toBe(true);
      expect(result.response).toBeUndefined();
    });

    it('should return 404 for non-existent profiles', () => {
      const context = createMockContext({ userId: 'user-123' });

      const result = PrivacyMiddleware.validateProfileAccess(null, context);

      expect(result.allowed).toBe(false);
      expect(result.response).toBeDefined();
    });

    it('should require authentication when specified', () => {
      const profile = createMockProfile();
      const context = createMockContext({ isAuthenticated: false });

      const result = PrivacyMiddleware.validateProfileAccess(profile, context, {
        requireAuth: true
      });

      expect(result.allowed).toBe(false);
      expect(result.response).toBeDefined();
    });

    it('should enforce owner-only access when specified', () => {
      const profile = createMockProfile({ workosUserId: 'user-123' });
      const context = createMockContext({ userId: 'other-user', isAuthenticated: true });

      const result = PrivacyMiddleware.validateProfileAccess(profile, context, {
        allowOwnerOnly: true
      });

      expect(result.allowed).toBe(false);
      expect(result.response).toBeDefined();
    });
  });

  describe('validateSearchRequest', () => {
    it('should validate valid search parameters', () => {
      const filters: ProfileSearchFilters = {
        query: 'developer',
        limit: 10,
        offset: 0
      };
      const context = createMockContext();

      const result = PrivacyMiddleware.validateSearchRequest(filters, context);

      expect(result.valid).toBe(true);
      expect(result.response).toBeUndefined();
    });

    it('should reject invalid search parameters', () => {
      const filters: ProfileSearchFilters = {
        limit: 200, // Too high
        offset: -1  // Negative
      };
      const context = createMockContext();

      const result = PrivacyMiddleware.validateSearchRequest(filters, context);

      expect(result.valid).toBe(false);
      expect(result.response).toBeDefined();
    });

    it('should apply MCP-specific validation', () => {
      const filters: ProfileSearchFilters = {
        limit: 75 // Too high for MCP
      };
      const context = createMockContext();

      const result = PrivacyMiddleware.validateSearchRequest(filters, context, true);

      expect(result.valid).toBe(false);
      expect(result.response).toBeDefined();
    });
  });

  describe('sanitizeProfileResponse', () => {
    it('should sanitize profile data for non-owners', () => {
      const profile = createMockProfile({ workosUserId: 'user-123' });
      const context = createMockContext({ userId: 'other-user' });

      const result = PrivacyMiddleware.sanitizeProfileResponse(profile, context, 'api');

      expect(result).toHaveProperty('slug');
      expect(result).toHaveProperty('name');
      expect(result).not.toHaveProperty('email');
      expect(result).not.toHaveProperty('workosUserId');
    });

    it('should return full data for profile owners', () => {
      const profile = createMockProfile({ workosUserId: 'user-123' });
      const context = createMockContext({ userId: 'user-123' });

      const result = PrivacyMiddleware.sanitizeProfileResponse(profile, context, 'api');

      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('workosUserId');
    });

    it('should throw error for unauthorized access', () => {
      const profile = createMockProfile({ isPublic: false, workosUserId: 'user-123' });
      const context = createMockContext({ userId: 'other-user' });

      expect(() => {
        PrivacyMiddleware.sanitizeProfileResponse(profile, context, 'api');
      }).toThrow('Access denied');
    });
  });

  describe('sanitizeProfilesResponse', () => {
    it('should filter and sanitize multiple profiles', () => {
      const profiles = [
        createMockProfile({ id: 1, isPublic: true, isActive: true }),
        createMockProfile({ id: 2, isPublic: false, workosUserId: 'user-123' }),
        createMockProfile({ id: 3, isPublic: true, isActive: false }),
      ];
      const context = createMockContext({ userId: 'other-user' });

      const result = PrivacyMiddleware.sanitizeProfilesResponse(profiles, context, 'search');

      expect(result).toHaveLength(1); // Only public active profile
      expect(result[0]).toHaveProperty('slug');
      expect(result[0]).not.toHaveProperty('email');
    });
  });

  describe('validatePrivacyUpdate', () => {
    it('should allow owner to update privacy settings', () => {
      const profile = createMockProfile({ workosUserId: 'user-123' });
      const updates = { isPublic: false };
      const context = createMockContext({ userId: 'user-123', isAuthenticated: true });

      const result = PrivacyMiddleware.validatePrivacyUpdate(profile, updates, context);

      expect(result.valid).toBe(true);
      expect(result.response).toBeUndefined();
    });

    it('should deny non-owner privacy updates', () => {
      const profile = createMockProfile({ workosUserId: 'user-123' });
      const updates = { isPublic: false };
      const context = createMockContext({ userId: 'other-user' });

      const result = PrivacyMiddleware.validatePrivacyUpdate(profile, updates, context);

      expect(result.valid).toBe(false);
      expect(result.response).toBeDefined();
    });
  });

  describe('createRequestContext', () => {
    it('should create request context from NextRequest', () => {
      const request = createMockRequest('https://example.com', {
        'user-agent': 'test-browser',
        'x-forwarded-for': '192.168.1.1'
      });

      const context = PrivacyMiddleware.createRequestContext(request, 'user-123');

      expect(context.userId).toBe('user-123');
      expect(context.isAuthenticated).toBe(true);
      expect(context.userAgent).toBe('test-browser');
      expect(context.ip).toBe('192.168.1.1');
    });

    it('should handle missing headers gracefully', () => {
      const request = createMockRequest('https://example.com');

      const context = PrivacyMiddleware.createRequestContext(request);

      expect(context.userId).toBeUndefined();
      expect(context.isAuthenticated).toBe(false);
      expect(context.ip).toBe('unknown');
    });
  });

  describe('checkRateLimit', () => {
    it('should allow requests within rate limit', () => {
      const context = createMockContext({ ip: '127.0.0.1' });

      const result = PrivacyMiddleware.checkRateLimit(context, 'search');

      expect(result.allowed).toBe(true);
      expect(result.response).toBeUndefined();
    });
  });
});

describe('PrivacyUtils', () => {
  describe('isMCPRequest', () => {
    it('should detect MCP requests by user agent', () => {
      const request = createMockRequest('https://example.com', {
        'user-agent': 'mcp-client/1.0'
      });

      const result = PrivacyUtils.isMCPRequest(request);

      expect(result).toBe(true);
    });

    it('should detect MCP requests by header', () => {
      const request = createMockRequest('https://example.com', {
        'x-mcp-client': 'true'
      });

      const result = PrivacyUtils.isMCPRequest(request);

      expect(result).toBe(true);
    });

    it('should return false for regular requests', () => {
      const request = createMockRequest('https://example.com', {
        'user-agent': 'Mozilla/5.0'
      });

      const result = PrivacyUtils.isMCPRequest(request);

      expect(result).toBe(false);
    });
  });

  describe('extractSearchFilters', () => {
    it('should extract search parameters from URL', () => {
      const request = createMockRequest(
        'https://example.com/search?q=developer&skills=javascript,typescript&limit=20&offset=10'
      );

      const filters = PrivacyUtils.extractSearchFilters(request);

      expect(filters.query).toBe('developer');
      expect(filters.skills).toEqual(['javascript', 'typescript']);
      expect(filters.limit).toBe(20);
      expect(filters.offset).toBe(10);
    });

    it('should handle missing parameters gracefully', () => {
      const request = createMockRequest('https://example.com/search');

      const filters = PrivacyUtils.extractSearchFilters(request);

      expect(filters.query).toBeUndefined();
      expect(filters.skills).toBeUndefined();
      expect(filters.limit).toBeUndefined();
      expect(filters.offset).toBeUndefined();
    });

    it('should cap limit at maximum value', () => {
      const request = createMockRequest('https://example.com/search?limit=200');

      const filters = PrivacyUtils.extractSearchFilters(request);

      expect(filters.limit).toBe(100); // Capped at 100
    });

    it('should handle invalid numeric parameters', () => {
      const request = createMockRequest('https://example.com/search?limit=invalid&offset=-5');

      const filters = PrivacyUtils.extractSearchFilters(request);

      expect(filters.limit).toBeUndefined();
      expect(filters.offset).toBeUndefined();
    });
  });

  describe('createPaginationResponse', () => {
    it('should create proper pagination response', () => {
      const profiles = [{ id: 1 }, { id: 2 }];
      const response = PrivacyUtils.createPaginationResponse(profiles, 25, 10, 10);

      expect(response.profiles).toEqual(profiles);
      expect(response.pagination.total).toBe(25);
      expect(response.pagination.limit).toBe(10);
      expect(response.pagination.offset).toBe(10);
      expect(response.pagination.hasMore).toBe(true);
      expect(response.pagination.page).toBe(2);
      expect(response.pagination.totalPages).toBe(3);
    });

    it('should handle last page correctly', () => {
      const profiles = [{ id: 1 }];
      const response = PrivacyUtils.createPaginationResponse(profiles, 21, 10, 20);

      expect(response.pagination.hasMore).toBe(false);
      expect(response.pagination.page).toBe(3);
      expect(response.pagination.totalPages).toBe(3);
    });
  });

  describe('validateSlugFormat', () => {
    it('should validate correct slug format', () => {
      const result = PrivacyUtils.validateSlugFormat('john-doe-123');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty or null slugs', () => {
      const result1 = PrivacyUtils.validateSlugFormat('');
      const result2 = PrivacyUtils.validateSlugFormat(null as any);

      expect(result1.valid).toBe(false);
      expect(result1.error).toBe('Slug is required');
      expect(result2.valid).toBe(false);
      expect(result2.error).toBe('Slug is required');
    });

    it('should reject slugs that are too short or too long', () => {
      const shortResult = PrivacyUtils.validateSlugFormat('ab');
      const longResult = PrivacyUtils.validateSlugFormat('a'.repeat(51));

      expect(shortResult.valid).toBe(false);
      expect(shortResult.error).toBe('Slug must be between 3 and 50 characters');
      expect(longResult.valid).toBe(false);
      expect(longResult.error).toBe('Slug must be between 3 and 50 characters');
    });

    it('should reject invalid characters', () => {
      const result1 = PrivacyUtils.validateSlugFormat('john_doe');
      const result2 = PrivacyUtils.validateSlugFormat('john.doe');
      const result3 = PrivacyUtils.validateSlugFormat('John-Doe');

      expect(result1.valid).toBe(false);
      expect(result1.error).toBe('Slug can only contain lowercase letters, numbers, and hyphens');
      expect(result2.valid).toBe(false);
      expect(result3.valid).toBe(false);
    });

    it('should reject slugs starting or ending with hyphens', () => {
      const result1 = PrivacyUtils.validateSlugFormat('-john-doe');
      const result2 = PrivacyUtils.validateSlugFormat('john-doe-');

      expect(result1.valid).toBe(false);
      expect(result1.error).toBe('Slug cannot start or end with a hyphen');
      expect(result2.valid).toBe(false);
      expect(result2.error).toBe('Slug cannot start or end with a hyphen');
    });

    it('should reject consecutive hyphens', () => {
      const result = PrivacyUtils.validateSlugFormat('john--doe');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Slug cannot contain consecutive hyphens');
    });
  });
});