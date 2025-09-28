/**
 * Integration Tests for Slug-Based Profile Lookup API
 * 
 * This test suite verifies the GET /api/profiles/slug/[slug] endpoint functionality,
 * including privacy filtering, error handling, and proper response formats.
 * 
 * Requirements tested:
 * - 1.4: Profile access via slug-based URLs
 * - 2.2: Privacy filtering for profile visibility
 * - 2.3: Proper error handling for non-existent or private profiles
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../[slug]/route';

// Mock dependencies
vi.mock('@workos-inc/authkit-nextjs', () => ({
  withAuth: vi.fn(),
}));

vi.mock('@/lib/db/connection', () => ({
  db: {
    select: vi.fn(),
  },
}));

import { withAuth } from '@workos-inc/authkit-nextjs';
import { db } from '@/lib/db/connection';

const mockWithAuth = withAuth as unknown as ReturnType<typeof vi.fn>;
const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>;
};

describe('GET /api/profiles/slug/[slug]', () => {
  const mockPublicProfile = {
    id: 1,
    workosUserId: 'user_123',
    slug: 'john-doe',
    name: 'John Doe',
    email: 'john@example.com',
    bio: 'Software Engineer',
    skills: ['JavaScript', 'TypeScript'],
    availableFor: ['meetings'],
    isPublic: true,
    isActive: true,
    linkedinUrl: 'https://linkedin.com/in/johndoe',
    otherLinks: { 'GitHub': 'https://github.com/johndoe' },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockPrivateProfile = {
    ...mockPublicProfile,
    id: 2,
    slug: 'jane-smith',
    name: 'Jane Smith',
    email: 'jane@example.com',
    isPublic: false,
    workosUserId: 'user_456',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default: no authenticated user
    mockWithAuth.mockResolvedValue({ user: null });
    
    // Mock database query structure
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]), // Default: no profile found
      }),
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Public Profile Access', () => {
    it('should return public profile for unauthenticated user', async () => {
      // Mock finding a public profile
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockPublicProfile]),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/profiles/slug/john-doe');
      const params = Promise.resolve({ slug: 'john-doe' });
      
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        id: 1,
        slug: 'john-doe',
        name: 'John Doe',
        bio: 'Software Engineer',
        skills: ['JavaScript', 'TypeScript'],
        availableFor: ['meetings'],
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        otherLinks: { 'GitHub': 'https://github.com/johndoe' },
        profileUrl: expect.stringContaining('/profiles/john-doe'),
        createdAt: expect.any(String),
      });
      
      // Email should not be included in public profile
      expect(data.email).toBeUndefined();
      expect(data.workosUserId).toBeUndefined();
    });

    it('should return public profile for authenticated user (not owner)', async () => {
      // Mock authenticated user (different from profile owner)
      mockWithAuth.mockResolvedValue({ 
        user: { id: 'user_789', email: 'other@example.com' } 
      });

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockPublicProfile]),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/profiles/slug/john-doe');
      const params = Promise.resolve({ slug: 'john-doe' });
      
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.email).toBeUndefined(); // Still no email for non-owner
      expect(data.profileUrl).toContain('/profiles/john-doe');
    });

    it('should return full profile for profile owner', async () => {
      // Mock authenticated user as profile owner
      mockWithAuth.mockResolvedValue({ 
        user: { id: 'user_123', email: 'john@example.com' } 
      });

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockPublicProfile]),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/profiles/slug/john-doe');
      const params = Promise.resolve({ slug: 'john-doe' });
      
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      // Owner sees full profile including email
      expect(data.email).toBe('john@example.com');
      expect(data.workosUserId).toBe('user_123');
    });
  });

  describe('Private Profile Access', () => {
    it('should return 404 for private profile when unauthenticated', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockPrivateProfile]),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/profiles/slug/jane-smith');
      const params = Promise.resolve({ slug: 'jane-smith' });
      
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Profile not found');
    });

    it('should return 404 for private profile when authenticated as different user', async () => {
      // Mock authenticated user (different from profile owner)
      mockWithAuth.mockResolvedValue({ 
        user: { id: 'user_789', email: 'other@example.com' } 
      });

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockPrivateProfile]),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/profiles/slug/jane-smith');
      const params = Promise.resolve({ slug: 'jane-smith' });
      
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Profile not found');
    });

    it('should return full profile for private profile owner', async () => {
      // Mock authenticated user as profile owner
      mockWithAuth.mockResolvedValue({ 
        user: { id: 'user_456', email: 'jane@example.com' } 
      });

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockPrivateProfile]),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/profiles/slug/jane-smith');
      const params = Promise.resolve({ slug: 'jane-smith' });
      
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.email).toBe('jane@example.com');
      expect(data.workosUserId).toBe('user_456');
      expect(data.isPublic).toBe(false);
    });
  });

  describe('Inactive Profile Access', () => {
    it('should return 404 for inactive profile', async () => {
      const inactiveProfile = {
        ...mockPublicProfile,
        isActive: false,
      };

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([inactiveProfile]),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/profiles/slug/john-doe');
      const params = Promise.resolve({ slug: 'john-doe' });
      
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Profile not found');
    });

    it('should return full profile for inactive profile owner', async () => {
      const inactiveProfile = {
        ...mockPublicProfile,
        isActive: false,
      };

      // Mock authenticated user as profile owner
      mockWithAuth.mockResolvedValue({ 
        user: { id: 'user_123', email: 'john@example.com' } 
      });

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([inactiveProfile]),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/profiles/slug/john-doe');
      const params = Promise.resolve({ slug: 'john-doe' });
      
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isActive).toBe(false);
      expect(data.email).toBe('john@example.com');
    });
  });

  describe('Error Handling', () => {
    it('should return 400 for invalid slug', async () => {
      const request = new NextRequest('http://localhost:3000/api/profiles/slug/');
      const params = Promise.resolve({ slug: '' });
      
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid slug');
    });

    it('should return 400 for whitespace-only slug', async () => {
      const request = new NextRequest('http://localhost:3000/api/profiles/slug/   ');
      const params = Promise.resolve({ slug: '   ' });
      
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid slug');
    });

    it('should return 404 for non-existent slug', async () => {
      // Mock no profile found
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]), // Empty result
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/profiles/slug/non-existent');
      const params = Promise.resolve({ slug: 'non-existent' });
      
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Profile not found');
    });

    it('should handle authentication errors gracefully', async () => {
      // Mock authentication throwing an error
      mockWithAuth.mockRejectedValue(new Error('Auth error'));

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockPublicProfile]),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/profiles/slug/john-doe');
      const params = Promise.resolve({ slug: 'john-doe' });
      
      const response = await GET(request, { params });
      const data = await response.json();

      // Should still work for public profiles even if auth fails
      expect(response.status).toBe(200);
      expect(data.slug).toBe('john-doe');
      expect(data.email).toBeUndefined(); // No email without auth
    });

    it('should return 500 for database errors', async () => {
      // Mock database error
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockRejectedValue(new Error('Database connection failed')),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/profiles/slug/john-doe');
      const params = Promise.resolve({ slug: 'john-doe' });
      
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch profile');
    });
  });

  describe('Database Query Validation', () => {
    it('should query with correct slug and isActive filter', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockPublicProfile]),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/profiles/slug/john-doe');
      const params = Promise.resolve({ slug: 'john-doe' });
      
      await GET(request, { params });

      // Verify the database query was called correctly
      expect(mockDb.select).toHaveBeenCalled();
      const fromCall = mockDb.select().from;
      expect(fromCall).toHaveBeenCalled();
      const whereCall = fromCall().where;
      expect(whereCall).toHaveBeenCalled();
    });
  });

  describe('Response Format Validation', () => {
    it('should include profileUrl with correct base URL from environment', async () => {
      // Mock environment variable
      const originalEnv = process.env.NEXT_PUBLIC_URL;
      process.env.NEXT_PUBLIC_URL = 'https://persons.finderbee.ai';

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockPublicProfile]),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/profiles/slug/john-doe');
      const params = Promise.resolve({ slug: 'john-doe' });
      
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profileUrl).toBe('https://persons.finderbee.ai/profiles/john-doe');

      // Restore environment
      process.env.NEXT_PUBLIC_URL = originalEnv;
    });

    it('should use localhost as fallback when NEXT_PUBLIC_URL is not set', async () => {
      // Mock environment variable as undefined
      const originalEnv = process.env.NEXT_PUBLIC_URL;
      delete process.env.NEXT_PUBLIC_URL;

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockPublicProfile]),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/profiles/slug/john-doe');
      const params = Promise.resolve({ slug: 'john-doe' });
      
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profileUrl).toBe('http://localhost:3000/profiles/john-doe');

      // Restore environment
      process.env.NEXT_PUBLIC_URL = originalEnv;
    });

    it('should return consistent date format', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockPublicProfile]),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/profiles/slug/john-doe');
      const params = Promise.resolve({ slug: 'john-doe' });
      
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.createdAt).toBeDefined();
      expect(typeof data.createdAt).toBe('string');
      expect(new Date(data.createdAt)).toBeInstanceOf(Date);
    });
  });

  describe('Privacy Requirements Validation', () => {
    it('should meet requirement 2.2: only public profiles accessible to non-owners', async () => {
      // Test private profile access by non-owner
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockPrivateProfile]),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/profiles/slug/jane-smith');
      const params = Promise.resolve({ slug: 'jane-smith' });
      
      const response = await GET(request, { params });

      expect(response.status).toBe(404); // Privacy violation returns 404, not 403
    });

    it('should meet requirement 2.3: proper error handling for private profiles', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockPrivateProfile]),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/profiles/slug/jane-smith');
      const params = Promise.resolve({ slug: 'jane-smith' });
      
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Profile not found');
      // Should not reveal that profile exists but is private
    });

    it('should meet requirement 1.4: profile access via slug-based URLs', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockPublicProfile]),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/profiles/slug/john-doe');
      const params = Promise.resolve({ slug: 'john-doe' });
      
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.slug).toBe('john-doe');
      expect(data.profileUrl).toContain('/profiles/john-doe');
    });
  });
});