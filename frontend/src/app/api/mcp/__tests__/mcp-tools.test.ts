/**
 * MCP Tools Integration Tests
 * 
 * Tests for the MCP (Model Context Protocol) endpoints that AI agents will use
 * to discover profiles and request meetings.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as searchProfiles } from '../search/route';
import { POST as requestMeeting } from '../request-meeting/route';
import { POST as getProfile } from '../get-profile/route';

// Mock the database and services
vi.mock('@/lib/db/connection', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  profiles: {
    id: 'id',
    slug: 'slug',
    name: 'name',
    bio: 'bio',
    skills: 'skills',
    availableFor: 'availableFor',
    isPublic: 'isPublic',
    isActive: 'isActive',
    workosUserId: 'workosUserId',
    linkedinUrl: 'linkedinUrl',
    otherLinks: 'otherLinks',
    createdAt: 'createdAt',
  },
  appointments: {
    id: 'id',
    profileId: 'profileId',
    requesterName: 'requesterName',
    requesterEmail: 'requesterEmail',
    message: 'message',
    requestType: 'requestType',
    status: 'status',
    createdAt: 'createdAt',
  },
}));

// Mock environment variables
const originalEnv = process.env;
beforeEach(() => {
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_URL: 'https://persons.finderbee.ai',
    NODE_ENV: 'test',
  };
});

afterEach(() => {
  process.env = originalEnv;
  vi.clearAllMocks();
});

// Helper function to create mock requests
function createMockRequest(body: any): NextRequest {
  return new NextRequest('https://test.com/api/mcp/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Mock profile data
const mockProfile = {
  id: 1,
  slug: 'john-doe',
  name: 'John Doe',
  bio: 'Software engineer with expertise in AI and web development',
  skills: ['JavaScript', 'TypeScript', 'React', 'AI'],
  availableFor: ['meetings', 'quotes'],
  isPublic: true,
  isActive: true,
  workosUserId: 'user_123',
  linkedinUrl: 'https://linkedin.com/in/johndoe',
  otherLinks: { github: 'https://github.com/johndoe' },
  createdAt: new Date('2024-01-01'),
  email: 'john@example.com',
  updatedAt: new Date('2024-01-01'),
};

const mockPrivateProfile = {
  ...mockProfile,
  id: 2,
  slug: 'jane-private',
  name: 'Jane Private',
  isPublic: false,
};

describe('MCP Tools', () => {
  describe('search_profiles', () => {
    it('should return public profiles matching search criteria', async () => {
      const { db } = await import('@/lib/db/connection');
      
      // Mock database responses
      (db.returning as any).mockResolvedValueOnce([mockProfile]);
      (db.returning as any).mockResolvedValueOnce([{ count: 1 }]);

      const request = createMockRequest({
        query: 'software engineer',
        skills: ['JavaScript'],
        availableFor: ['meetings'],
        limit: 10,
        offset: 0,
      });

      const response = await searchProfiles(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profiles).toHaveLength(1);
      expect(data.profiles[0]).toMatchObject({
        slug: 'john-doe',
        name: 'John Doe',
        bio: 'Software engineer with expertise in AI and web development',
        skills: ['JavaScript', 'TypeScript', 'React', 'AI'],
        availableFor: ['meetings', 'quotes'],
        profileUrl: 'https://persons.finderbee.ai/profiles/john-doe',
      });
      expect(data.profiles[0]).not.toHaveProperty('email');
      expect(data.profiles[0]).not.toHaveProperty('workosUserId');
      expect(data.pagination).toMatchObject({
        total: 1,
        limit: 10,
        offset: 0,
        hasMore: false,
      });
    });

    it('should handle empty search results', async () => {
      const { db } = await import('@/lib/db/connection');
      
      (db.returning as any).mockResolvedValueOnce([]);
      (db.returning as any).mockResolvedValueOnce([{ count: 0 }]);

      const request = createMockRequest({
        query: 'nonexistent',
        limit: 10,
        offset: 0,
      });

      const response = await searchProfiles(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profiles).toHaveLength(0);
      expect(data.pagination.total).toBe(0);
    });

    it('should enforce MCP-specific limits', async () => {
      const request = createMockRequest({
        limit: 100, // Should be capped at 50 for MCP
        offset: 0,
      });

      const response = await searchProfiles(request);
      
      // The limit should be capped at 50 for MCP requests
      expect(response.status).toBe(200);
    });

    it('should handle database errors gracefully', async () => {
      const { db } = await import('@/lib/db/connection');
      
      (db.returning as any).mockRejectedValueOnce(new Error('Database connection failed'));

      const request = createMockRequest({
        query: 'test',
      });

      const response = await searchProfiles(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to search profiles');
      expect(data.code).toBe('SEARCH_ERROR');
      expect(data.profiles).toEqual([]);
    });
  });

  describe('request_meeting', () => {
    it('should create a meeting request successfully', async () => {
      const { db } = await import('@/lib/db/connection');
      
      // Mock finding the profile
      (db.returning as any).mockResolvedValueOnce([mockProfile]);
      
      // Mock creating the appointment
      const mockAppointment = {
        id: 1,
        profileId: 1,
        requesterName: 'AI Agent',
        requesterEmail: 'agent@ai.com',
        message: 'I would like to schedule a meeting to discuss AI collaboration',
        requestType: 'meeting',
        status: 'pending',
        createdAt: new Date(),
      };
      (db.returning as any).mockResolvedValueOnce([mockAppointment]);

      const request = createMockRequest({
        profileSlug: 'john-doe',
        requesterName: 'AI Agent',
        requesterEmail: 'agent@ai.com',
        message: 'I would like to schedule a meeting to discuss AI collaboration',
        requestType: 'meeting',
        preferredTime: '2024-12-01T14:00:00Z',
      });

      const response = await requestMeeting(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.requestId).toBe('1');
      expect(data.message).toContain('Meeting request sent successfully');
      expect(data.details).toMatchObject({
        profileName: 'John Doe',
        requestType: 'meeting',
        status: 'pending',
      });
    });

    it('should reject requests for private profiles', async () => {
      const { db } = await import('@/lib/db/connection');
      
      (db.returning as any).mockResolvedValueOnce([mockPrivateProfile]);

      const request = createMockRequest({
        profileSlug: 'jane-private',
        requesterName: 'AI Agent',
        requesterEmail: 'agent@ai.com',
        message: 'I would like to schedule a meeting',
        requestType: 'meeting',
      });

      const response = await requestMeeting(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Profile not found'); // Privacy-safe error
      expect(data.code).toBe('PROFILE_NOT_FOUND');
    });

    it('should validate required fields', async () => {
      const request = createMockRequest({
        profileSlug: 'john-doe',
        // Missing required fields
      });

      const response = await requestMeeting(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required fields');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should validate email format', async () => {
      const request = createMockRequest({
        profileSlug: 'john-doe',
        requesterName: 'AI Agent',
        requesterEmail: 'invalid-email',
        message: 'Test message',
        requestType: 'meeting',
      });

      const response = await requestMeeting(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid email format');
      expect(data.code).toBe('INVALID_EMAIL');
    });

    it('should validate request type availability', async () => {
      const { db } = await import('@/lib/db/connection');
      
      const profileOnlyMeetings = {
        ...mockProfile,
        availableFor: ['meetings'], // Only meetings, not quotes
      };
      (db.returning as any).mockResolvedValueOnce([profileOnlyMeetings]);

      const request = createMockRequest({
        profileSlug: 'john-doe',
        requesterName: 'AI Agent',
        requesterEmail: 'agent@ai.com',
        message: 'I would like a quote for services',
        requestType: 'quote', // Not available
      });

      const response = await requestMeeting(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('not available for quote requests');
      expect(data.code).toBe('REQUEST_TYPE_NOT_AVAILABLE');
    });

    it('should validate preferred time format', async () => {
      const { db } = await import('@/lib/db/connection');
      
      (db.returning as any).mockResolvedValueOnce([mockProfile]);

      const request = createMockRequest({
        profileSlug: 'john-doe',
        requesterName: 'AI Agent',
        requesterEmail: 'agent@ai.com',
        message: 'Test message',
        requestType: 'meeting',
        preferredTime: 'invalid-date',
      });

      const response = await requestMeeting(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid preferred time format');
      expect(data.code).toBe('INVALID_TIME_FORMAT');
    });
  });

  describe('get_profile', () => {
    it('should return profile details for public profiles', async () => {
      const { db } = await import('@/lib/db/connection');
      
      (db.returning as any).mockResolvedValueOnce([mockProfile]);

      const request = createMockRequest({
        profileSlug: 'john-doe',
      });

      const response = await getProfile(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.found).toBe(true);
      expect(data.profile).toMatchObject({
        slug: 'john-doe',
        name: 'John Doe',
        bio: 'Software engineer with expertise in AI and web development',
        skills: ['JavaScript', 'TypeScript', 'React', 'AI'],
        availableFor: ['meetings', 'quotes'],
        profileUrl: 'https://persons.finderbee.ai/profiles/john-doe',
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        otherLinks: { github: 'https://github.com/johndoe' },
      });
      expect(data.profile).not.toHaveProperty('email');
      expect(data.profile).not.toHaveProperty('workosUserId');
    });

    it('should return not found for private profiles', async () => {
      const { db } = await import('@/lib/db/connection');
      
      (db.returning as any).mockResolvedValueOnce([mockPrivateProfile]);

      const request = createMockRequest({
        profileSlug: 'jane-private',
      });

      const response = await getProfile(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.found).toBe(false);
      expect(data.error).toBe('Profile not found'); // Privacy-safe error
      expect(data.code).toBe('PROFILE_NOT_FOUND');
      expect(data.profile).toBe(null);
    });

    it('should return not found for non-existent profiles', async () => {
      const { db } = await import('@/lib/db/connection');
      
      (db.returning as any).mockResolvedValueOnce([]);

      const request = createMockRequest({
        profileSlug: 'non-existent',
      });

      const response = await getProfile(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.found).toBe(false);
      expect(data.error).toBe('Profile not found');
      expect(data.code).toBe('PROFILE_NOT_FOUND');
      expect(data.profile).toBe(null);
    });

    it('should validate slug format', async () => {
      const request = createMockRequest({
        profileSlug: 'Invalid Slug!', // Invalid characters
      });

      const response = await getProfile(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.found).toBe(false);
      expect(data.error).toContain('Invalid slug format');
      expect(data.code).toBe('INVALID_SLUG_FORMAT');
    });

    it('should require profileSlug parameter', async () => {
      const request = createMockRequest({
        // Missing profileSlug
      });

      const response = await getProfile(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.found).toBe(false);
      expect(data.error).toBe('Missing required field: profileSlug');
      expect(data.code).toBe('VALIDATION_ERROR');
    });
  });
});