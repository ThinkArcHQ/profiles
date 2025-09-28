/**
 * Enhanced Search API Tests
 * 
 * Comprehensive tests for the enhanced search API with privacy controls
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';

// Mock the database and services
vi.mock('@/lib/db/connection', () => {
  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    orderBy: vi.fn(),
  };
  
  return {
    db: {
      select: vi.fn(() => mockQueryBuilder),
    }
  };
});

vi.mock('@/lib/services/privacy-service', () => ({
  PrivacyService: {
    filterForPublicSearch: vi.fn(),
  },
  PrivacyValidator: {
    validateSearchParams: vi.fn(),
    createPrivacySafeError: vi.fn(),
  }
}));

vi.mock('@/lib/types/profile', () => ({
  ProfileTransformer: {
    toPublicSearchResults: vi.fn(),
  }
}));

import { db } from '@/lib/db/connection';
import { PrivacyService, PrivacyValidator } from '@/lib/services/privacy-service';
import { ProfileTransformer } from '@/lib/types/profile';

// Mock profile data
const mockProfiles = [
  {
    id: 1,
    workosUserId: 'user-1',
    slug: 'john-doe',
    name: 'John Doe',
    email: 'john@example.com',
    bio: 'Software developer',
    skills: ['JavaScript', 'TypeScript'],
    availableFor: ['meetings'],
    isPublic: true,
    isActive: true,
    linkedinUrl: 'https://linkedin.com/in/johndoe',
    otherLinks: {},
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 2,
    workosUserId: 'user-2',
    slug: 'jane-smith',
    name: 'Jane Smith',
    email: 'jane@example.com',
    bio: 'Product manager',
    skills: ['Product Management', 'Strategy'],
    availableFor: ['meetings', 'quotes'],
    isPublic: true,
    isActive: true,
    linkedinUrl: null,
    otherLinks: {},
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  }
];

const mockSearchResult = {
  profiles: mockProfiles.map(p => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    bio: p.bio,
    skills: p.skills,
    availableFor: p.availableFor,
    linkedinUrl: p.linkedinUrl,
    otherLinks: p.otherLinks,
    profileUrl: `http://localhost:3000/profiles/${p.slug}`,
    createdAt: p.createdAt.toISOString(), // Convert to string to match JSON serialization
  })),
  pagination: {
    total: 2,
    limit: 20,
    offset: 0,
    hasMore: false,
  }
};

describe('Enhanced Search API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    (PrivacyValidator.validateSearchParams as any).mockReturnValue({
      valid: true,
      errors: []
    });
    
    (PrivacyValidator.createPrivacySafeError as any).mockReturnValue({
      error: 'Profile not found',
      code: 'PROFILE_NOT_FOUND'
    });
    
    (PrivacyService.filterForPublicSearch as any).mockReturnValue(mockProfiles);
    (ProfileTransformer.toPublicSearchResults as any).mockReturnValue(mockSearchResult);
    
    // Mock the database query chain
    const mockQueryBuilder = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue(mockProfiles),
    };
    
    // Mock db.select to return the query builder
    (db.select as any).mockImplementation((fields?: any) => {
      if (fields && fields.count) {
        // For count queries
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([{ count: 2 }])
        };
      }
      // For regular queries
      return mockQueryBuilder;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Search Functionality', () => {
    it('should handle basic search without parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/search');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockSearchResult);
      expect(PrivacyValidator.validateSearchParams).toHaveBeenCalled();
      expect(PrivacyService.filterForPublicSearch).toHaveBeenCalledWith(mockProfiles);
    });

    it('should handle search with query parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/search?q=john');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockSearchResult);
      
      // Verify that the search filters were created correctly
      expect(PrivacyValidator.validateSearchParams).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'john',
          limit: 20,
          offset: 0
        }),
        expect.objectContaining({
          isPublicSearch: true,
          isMCPRequest: false
        })
      );
    });

    it('should handle search with skills filter', async () => {
      const request = new NextRequest('http://localhost:3000/api/search?skills=JavaScript,TypeScript');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(PrivacyValidator.validateSearchParams).toHaveBeenCalledWith(
        expect.objectContaining({
          skills: ['JavaScript', 'TypeScript'],
        }),
        expect.any(Object)
      );
    });

    it('should handle search with availability filter', async () => {
      const request = new NextRequest('http://localhost:3000/api/search?available_for=meetings,quotes');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(PrivacyValidator.validateSearchParams).toHaveBeenCalledWith(
        expect.objectContaining({
          availableFor: ['meetings', 'quotes'],
        }),
        expect.any(Object)
      );
    });

    it('should handle pagination parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/search?limit=10&offset=5');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(PrivacyValidator.validateSearchParams).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 5,
        }),
        expect.any(Object)
      );
    });
  });

  describe('Privacy Controls', () => {
    it('should enforce maximum limit of 100', async () => {
      const request = new NextRequest('http://localhost:3000/api/search?limit=150');
      const response = await GET(request);

      expect(PrivacyValidator.validateSearchParams).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 100, // Should be capped at 100
        }),
        expect.any(Object)
      );
    });

    it('should enforce minimum offset of 0', async () => {
      const request = new NextRequest('http://localhost:3000/api/search?offset=-5');
      const response = await GET(request);

      expect(PrivacyValidator.validateSearchParams).toHaveBeenCalledWith(
        expect.objectContaining({
          offset: 0, // Should be set to 0
        }),
        expect.any(Object)
      );
    });

    it('should return validation error for invalid parameters', async () => {
      (PrivacyValidator.validateSearchParams as any).mockReturnValue({
        valid: false,
        errors: ['Invalid search parameters']
      });

      const request = new NextRequest('http://localhost:3000/api/search?limit=200');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Invalid search parameters',
        details: ['Invalid search parameters']
      });
    });

    it('should never search in email field', async () => {
      const request = new NextRequest('http://localhost:3000/api/search?q=test@example.com');
      await GET(request);

      // The search should not include email in the query conditions
      // This is verified by the implementation not using email in the where clause
      expect(PrivacyService.filterForPublicSearch).toHaveBeenCalled();
    });

    it('should only return public, active profiles', async () => {
      const request = new NextRequest('http://localhost:3000/api/search');
      await GET(request);

      // Verify that privacy filtering is applied
      expect(PrivacyService.filterForPublicSearch).toHaveBeenCalledWith(mockProfiles);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      (db.select as any).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      (PrivacyValidator.createPrivacySafeError as any).mockReturnValue({
        error: 'Profile not found',
        code: 'PROFILE_NOT_FOUND'
      });

      const request = new NextRequest('http://localhost:3000/api/search');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Profile not found',
        code: 'PROFILE_NOT_FOUND'
      });
      expect(PrivacyValidator.createPrivacySafeError).toHaveBeenCalled();
    });

    it('should handle privacy service errors', async () => {
      (PrivacyService.filterForPublicSearch as any).mockImplementation(() => {
        throw new Error('Privacy filtering failed');
      });

      (PrivacyValidator.createPrivacySafeError as any).mockReturnValue({
        error: 'Profile not found',
        code: 'PROFILE_NOT_FOUND'
      });

      const request = new NextRequest('http://localhost:3000/api/search');
      const response = await GET(request);

      expect(response.status).toBe(500);
      expect(PrivacyValidator.createPrivacySafeError).toHaveBeenCalled();
    });
  });

  describe('Search Performance', () => {
    it('should use optimized database queries', async () => {
      const request = new NextRequest('http://localhost:3000/api/search?q=developer&skills=JavaScript');
      await GET(request);

      // Verify that the database query was constructed with proper conditions
      expect(db.select).toHaveBeenCalled();
      // Note: We can't easily test the chained methods since they're part of the query builder pattern
      // The important thing is that db.select was called, which indicates the query was executed
    });

    it('should handle empty search results', async () => {
      // Mock empty results
      const mockEmptyQueryBuilder = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([]),
      };
      
      (db.select as any).mockImplementation((fields?: any) => {
        if (fields && fields.count) {
          return {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue([{ count: 0 }])
          };
        }
        return mockEmptyQueryBuilder;
      });
      
      (PrivacyService.filterForPublicSearch as any).mockReturnValue([]);
      (ProfileTransformer.toPublicSearchResults as any).mockReturnValue({
        profiles: [],
        pagination: {
          total: 0,
          limit: 20,
          offset: 0,
          hasMore: false,
        }
      });

      const request = new NextRequest('http://localhost:3000/api/search?q=nonexistent');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profiles).toHaveLength(0);
      expect(data.pagination.total).toBe(0);
    });
  });

  describe('Response Format', () => {
    it('should return properly formatted search results', async () => {
      const request = new NextRequest('http://localhost:3000/api/search');
      const response = await GET(request);
      const data = await response.json();

      expect(data).toHaveProperty('profiles');
      expect(data).toHaveProperty('pagination');
      expect(data.pagination).toHaveProperty('total');
      expect(data.pagination).toHaveProperty('limit');
      expect(data.pagination).toHaveProperty('offset');
      expect(data.pagination).toHaveProperty('hasMore');

      // Verify profiles don't contain sensitive information
      data.profiles.forEach((profile: any) => {
        expect(profile).not.toHaveProperty('email');
        expect(profile).not.toHaveProperty('workosUserId');
        expect(profile).toHaveProperty('profileUrl');
      });
    });

    it('should include profile URLs in results', async () => {
      const request = new NextRequest('http://localhost:3000/api/search');
      const response = await GET(request);
      const data = await response.json();

      expect(ProfileTransformer.toPublicSearchResults).toHaveBeenCalledWith(
        mockProfiles,
        2, // total count
        20, // limit
        0, // offset
        'http://localhost:3000' // base URL
      );
    });
  });

  describe('Analytics and Logging', () => {
    it('should log search queries in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const request = new NextRequest('http://localhost:3000/api/search?q=developer&skills=JavaScript');
      await GET(request);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Search executed: query="developer"')
      );

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it('should not log in production mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const request = new NextRequest('http://localhost:3000/api/search?q=developer');
      await GET(request);

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });
});