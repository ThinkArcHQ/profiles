/**
 * MCP Error Handling Tests
 * 
 * Tests for the MCP error handling utilities
 */

import { describe, it, expect } from 'vitest';
import { MCPErrorHandler, MCPErrorCodes } from '../mcp-errors';

describe('MCPErrorHandler', () => {
  describe('createSearchError', () => {
    it('should create a properly formatted search error', () => {
      const error = MCPErrorHandler.createSearchError(
        'Test error message',
        MCPErrorCodes.SEARCH_ERROR
      );

      expect(error).toEqual({
        error: 'Test error message',
        code: 'SEARCH_ERROR',
        profiles: [],
        pagination: {
          total: 0,
          limit: 0,
          offset: 0,
          hasMore: false,
        },
      });
    });

    it('should include details when provided', () => {
      const error = MCPErrorHandler.createSearchError(
        'Validation failed',
        MCPErrorCodes.VALIDATION_ERROR,
        { field: 'limit', value: 100 }
      );

      expect(error.details).toEqual({ field: 'limit', value: 100 });
    });
  });

  describe('createMeetingError', () => {
    it('should create a properly formatted meeting error', () => {
      const error = MCPErrorHandler.createMeetingError(
        'Invalid email format',
        MCPErrorCodes.INVALID_EMAIL
      );

      expect(error).toEqual({
        success: false,
        error: 'Invalid email format',
        code: 'INVALID_EMAIL',
      });
    });
  });

  describe('createProfileError', () => {
    it('should create a properly formatted profile error', () => {
      const error = MCPErrorHandler.createProfileError(
        'Profile not found',
        MCPErrorCodes.PROFILE_NOT_FOUND
      );

      expect(error).toEqual({
        found: false,
        error: 'Profile not found',
        code: 'PROFILE_NOT_FOUND',
        profile: null,
      });
    });
  });

  describe('createPrivacySafeError', () => {
    it('should convert privacy violations to "not found" errors', () => {
      const error = MCPErrorHandler.createPrivacySafeError(
        'Profile is private',
        'profile'
      );

      expect(error.error).toBe('Profile not found');
      expect(error.code).toBe('PROFILE_NOT_FOUND');
    });

    it('should preserve non-privacy errors', () => {
      const error = MCPErrorHandler.createPrivacySafeError(
        'Invalid slug format',
        'profile'
      );

      expect(error.error).toBe('Invalid slug format');
      expect(error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('validateCommonParams', () => {
    it('should validate profile slug format', () => {
      const result = MCPErrorHandler.validateCommonParams({
        profileSlug: 'Invalid Slug!',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Invalid slug format. Slug must contain only lowercase letters, numbers, and hyphens'
      );
    });

    it('should validate email format', () => {
      const result = MCPErrorHandler.validateCommonParams({
        requesterEmail: 'invalid-email',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('should validate requester name length', () => {
      const result = MCPErrorHandler.validateCommonParams({
        requesterName: 'A',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Requester name must be at least 2 characters long');
    });

    it('should validate message length', () => {
      const result = MCPErrorHandler.validateCommonParams({
        message: 'Short',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Message must be at least 10 characters long');
    });

    it('should validate request type', () => {
      const result = MCPErrorHandler.validateCommonParams({
        requestType: 'invalid-type',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Invalid request type. Valid options are: meeting, quote, appointment'
      );
    });

    it('should pass validation for valid parameters', () => {
      const result = MCPErrorHandler.validateCommonParams({
        profileSlug: 'john-doe',
        requesterName: 'AI Agent',
        requesterEmail: 'agent@ai.com',
        message: 'This is a valid message that is long enough',
        requestType: 'meeting',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateSearchParams', () => {
    it('should validate limit bounds', () => {
      const result = MCPErrorHandler.validateSearchParams({
        limit: 100,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Maximum limit is 50 for MCP requests');
    });

    it('should validate offset bounds', () => {
      const result = MCPErrorHandler.validateSearchParams({
        offset: -1,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Offset must be a non-negative number');
    });

    it('should validate skills array', () => {
      const result = MCPErrorHandler.validateSearchParams({
        skills: ['valid-skill', ''],
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Each skill must be a non-empty string');
    });

    it('should validate availableFor options', () => {
      const result = MCPErrorHandler.validateSearchParams({
        availableFor: ['invalid-option'],
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Invalid availability option: invalid-option. Valid options are: meetings, quotes, appointments'
      );
    });

    it('should pass validation for valid search parameters', () => {
      const result = MCPErrorHandler.validateSearchParams({
        query: 'software engineer',
        skills: ['JavaScript', 'TypeScript'],
        availableFor: ['meetings', 'quotes'],
        limit: 20,
        offset: 0,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validatePreferredTime', () => {
    it('should reject invalid date formats', () => {
      const result = MCPErrorHandler.validatePreferredTime('invalid-date');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid preferred time format');
    });

    it('should reject past dates', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      const result = MCPErrorHandler.validatePreferredTime(pastDate.toISOString());

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Preferred time cannot be in the past');
    });

    it('should accept valid future dates', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      const result = MCPErrorHandler.validatePreferredTime(futureDate.toISOString());

      expect(result.isValid).toBe(true);
      expect(result.parsedTime).toBeInstanceOf(Date);
    });
  });

  describe('createMethodNotAllowedError', () => {
    it('should create method not allowed error', () => {
      const error = MCPErrorHandler.createMethodNotAllowedError(['POST'], {
        method: 'POST',
        requiredFields: ['profileSlug'],
      });

      expect(error.error).toBe('This endpoint only accepts POST requests');
      expect(error.code).toBe('METHOD_NOT_ALLOWED');
      expect(error.details?.allowedMethods).toEqual(['POST']);
    });
  });
});