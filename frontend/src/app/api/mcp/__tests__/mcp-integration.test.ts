/**
 * MCP Integration Tests - Simple validation
 * 
 * Basic tests to verify MCP endpoints are properly implemented
 */

import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as searchProfiles } from '../search/route';
import { POST as requestMeeting } from '../request-meeting/route';
import { POST as getProfile } from '../get-profile/route';

// Helper function to create mock requests
function createMockRequest(body: any): NextRequest {
  return new NextRequest('https://test.com/api/mcp/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('MCP Integration Tests', () => {
  it('search endpoint should handle validation errors', async () => {
    const request = createMockRequest({
      limit: 100, // Should be rejected as too high
    });

    const response = await searchProfiles(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Maximum limit is 50');
    expect(data.code).toBe('VALIDATION_ERROR');
    expect(data.profiles).toEqual([]);
  });

  it('request-meeting endpoint should validate required fields', async () => {
    const request = createMockRequest({
      // Missing required fields
    });

    const response = await requestMeeting(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Missing required fields');
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('get-profile endpoint should validate slug format', async () => {
    const request = createMockRequest({
      profileSlug: 'Invalid Slug!', // Invalid characters
    });

    const response = await getProfile(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.found).toBe(false);
    expect(data.error).toContain('Validation failed');
    expect(data.code).toBe('INVALID_SLUG_FORMAT');
    expect(data.profile).toBe(null);
  });

  it('get-profile endpoint should require profileSlug', async () => {
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

  it('request-meeting endpoint should validate email format', async () => {
    const request = createMockRequest({
      profileSlug: 'john-doe',
      requesterName: 'AI Agent',
      requesterEmail: 'invalid-email',
      message: 'This is a test message that is long enough',
      requestType: 'meeting',
    });

    const response = await requestMeeting(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid email format');
    expect(data.code).toBe('VALIDATION_ERROR');
  });
});