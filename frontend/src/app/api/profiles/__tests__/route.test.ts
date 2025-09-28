/**
 * Tests for Profile Creation API
 * 
 * This test suite verifies the POST /api/profiles endpoint functionality,
 * including validation, slug generation, privacy settings, and error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';

// Mock dependencies
vi.mock('@workos-inc/authkit-nextjs', () => ({
  withAuth: vi.fn(),
}));

vi.mock('@/lib/db/connection', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

vi.mock('@/lib/services/slug-service.server', () => ({
  SlugServiceImpl: vi.fn().mockImplementation(() => ({
    generateSlug: vi.fn(),
  })),
}));

import { withAuth } from '@workos-inc/authkit-nextjs';
import { db } from '@/lib/db/connection';
import { SlugServiceImpl } from '@/lib/services/slug-service.server';

const mockWithAuth = withAuth as any;
const mockDb = db as any;
const mockSlugService = SlugServiceImpl as any;

describe('POST /api/profiles', () => {
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
    };

    mockSlugService.mockImplementation(() => mockSlugServiceInstance);
    
    mockWithAuth.mockResolvedValue({ user: mockUser });
    
    // Mock database responses
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]), // No existing profile
        }),
      }),
    });

    // Mock database insert to capture and return the inserted data
    let capturedProfileData: any = null;
    
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockImplementation((data) => {
        capturedProfileData = data;
        return {
          returning: vi.fn().mockResolvedValue([{
            id: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data, // Return the actual inserted data
          }]),
        };
      }),
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should create a profile successfully with valid data', async () => {
    const requestBody = {
      name: 'John Doe',
      email: 'test@example.com',
      bio: 'Software Engineer',
      skills: ['JavaScript', 'TypeScript'],
      availableFor: ['meetings'],
      isPublic: true,
    };

    const request = new NextRequest('http://localhost:3000/api/profiles', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toMatchObject({
      slug: 'john-doe',
      name: 'John Doe',
      bio: 'Software Engineer',
      skills: ['JavaScript', 'TypeScript'],
      availableFor: ['meetings'],
      profileUrl: expect.stringContaining('/profiles/john-doe'),
    });
    expect(data.email).toBeUndefined(); // Email should not be in public profile
  });

  it('should handle form data format (display_name, headline, etc.)', async () => {
    const requestBody = {
      display_name: 'John Doe',
      email: 'test@example.com',
      headline: 'Software Engineer',
      skills: 'JavaScript, TypeScript, React',
      available_for: ['meetings', 'quotes'],
      profile_visibility: 'public',
    };

    const request = new NextRequest('http://localhost:3000/api/profiles', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.name).toBe('John Doe');
    expect(data.bio).toBe('Software Engineer');
    expect(data.skills).toEqual(['JavaScript', 'TypeScript', 'React']);
    expect(data.availableFor).toEqual(['meetings', 'quotes']);
  });

  it('should return 401 when user is not authenticated', async () => {
    mockWithAuth.mockResolvedValue({ user: null });

    const request = new NextRequest('http://localhost:3000/api/profiles', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 409 when profile already exists', async () => {
    // Mock existing profile
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 1 }]), // Existing profile
        }),
      }),
    });

    const requestBody = {
      name: 'John Doe',
      email: 'test@example.com',
    };

    const request = new NextRequest('http://localhost:3000/api/profiles', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe('Profile already exists');
    expect(data.code).toBe('PROFILE_EXISTS');
  });

  it('should return 400 for validation errors', async () => {
    const requestBody = {
      name: '', // Invalid: empty name
      email: 'invalid-email', // Invalid: bad email format
      skills: ['a'.repeat(101)], // Invalid: skill too long
      availableFor: ['invalid-option'], // Invalid: bad availability option
    };

    const request = new NextRequest('http://localhost:3000/api/profiles', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
    expect(data.code).toBe('VALIDATION_ERROR');
    expect(data.details).toBeInstanceOf(Array);
    expect(data.details.length).toBeGreaterThan(0);
  });

  it('should handle slug generation errors', async () => {
    mockSlugServiceInstance.generateSlug.mockRejectedValue(new Error('Invalid name'));

    const requestBody = {
      name: '!!!', // Name that might cause slug generation to fail
      email: 'test@example.com',
    };

    const request = new NextRequest('http://localhost:3000/api/profiles', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Failed to generate profile URL');
    expect(data.code).toBe('SLUG_GENERATION_ERROR');
  });

  it('should handle database constraint violations', async () => {
    // Mock database error for unique constraint violation
    const dbError = new Error('Unique constraint violation');
    (dbError as any).code = '23505';
    (dbError as any).constraint = 'profiles_slug_unique';

    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockRejectedValue(dbError),
      }),
    });

    const requestBody = {
      name: 'John Doe',
      email: 'test@example.com',
    };

    const request = new NextRequest('http://localhost:3000/api/profiles', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe('Profile URL already exists');
    expect(data.code).toBe('SLUG_UNAVAILABLE');
  });

  it('should set default values correctly', async () => {
    const requestBody = {
      name: 'John Doe',
      email: 'test@example.com',
      // No other fields provided
    };

    const request = new NextRequest('http://localhost:3000/api/profiles', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.skills).toEqual([]);
    expect(data.availableFor).toEqual(['meetings']); // Default value
    expect(data.otherLinks).toEqual({});
  });

  it('should handle privacy settings correctly', async () => {
    const requestBody = {
      name: 'John Doe',
      email: 'test@example.com',
      profile_visibility: 'private',
    };

    const request = new NextRequest('http://localhost:3000/api/profiles', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    // Verify the profile was created with correct privacy setting
    const insertCall = mockDb.insert().values.mock.calls[0][0];
    expect(insertCall.isPublic).toBe(false);
  });

  it('should validate and handle LinkedIn URL correctly', async () => {
    const requestBody = {
      name: 'John Doe',
      email: 'test@example.com',
      linkedinUrl: 'https://linkedin.com/in/johndoe',
    };

    const request = new NextRequest('http://localhost:3000/api/profiles', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.linkedinUrl).toBe('https://linkedin.com/in/johndoe');
  });

  it('should validate and handle other links correctly', async () => {
    const requestBody = {
      name: 'John Doe',
      email: 'test@example.com',
      otherLinks: {
        'GitHub': 'https://github.com/johndoe',
        'Website': 'https://johndoe.com',
      },
    };

    const request = new NextRequest('http://localhost:3000/api/profiles', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.otherLinks).toEqual({
      'GitHub': 'https://github.com/johndoe',
      'Website': 'https://johndoe.com',
    });
  });
});