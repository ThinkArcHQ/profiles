/**
 * Comprehensive Error Handling Tests
 * 
 * Tests the new error handling, validation, and monitoring system
 * across all API endpoints.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { APIErrorHandler, APIErrorCodes } from '@/lib/utils/api-errors';
import { RequestValidator } from '@/lib/middleware/validation-middleware';
import { APIMonitor } from '@/lib/utils/api-monitoring';
import { APIWrapper } from '@/lib/middleware/api-wrapper';

// Mock the database connection
vi.mock('@/lib/db/connection', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock WorkOS auth
vi.mock('@workos-inc/authkit-nextjs', () => ({
  withAuth: vi.fn(),
}));

describe('API Error Handling System', () => {
  beforeEach(() => {
    // Clear monitoring data before each test
    APIMonitor.clearLogs();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('APIErrorHandler', () => {
    it('should create standardized error responses', async () => {
      const error = APIErrorHandler.createError(
        'Test error message',
        APIErrorCodes.VALIDATION_ERROR,
        { field: 'test' }
      );

      expect(error.status).toBe(400);
      
      // Parse the response body
      const errorData = await error.json();
      expect(errorData).toMatchObject({
        error: 'Test error message',
        code: 'VALIDATION_ERROR',
        details: { field: 'test' },
        timestamp: expect.any(String),
      });
    });

    it('should create validation error responses', async () => {
      const validationErrors = [
        { field: 'name', message: 'Name is required' },
        { field: 'email', message: 'Invalid email format' },
      ];

      const error = APIErrorHandler.createValidationError(
        'Validation failed',
        validationErrors
      );

      expect(error.status).toBe(400);
      
      const errorData = await error.json();
      expect(errorData.code).toBe('VALIDATION_ERROR');
      expect(errorData.details.validationErrors).toEqual(validationErrors);
    });

    it('should create database error responses with proper error code mapping', async () => {
      const mockDbError = {
        code: '23505', // Unique constraint violation
        constraint: 'profiles_slug_unique',
      };

      const error = APIErrorHandler.createDatabaseError('create profile', mockDbError);
      
      expect(error.status).toBe(409);
      
      const errorData = await error.json();
      expect(errorData.code).toBe('SLUG_UNAVAILABLE');
      expect(errorData.error).toBe('Profile URL already exists');
    });

    it('should create privacy-safe error responses', async () => {
      const error = APIErrorHandler.createPrivacySafeError(
        'Profile is private and access denied',
        'profile'
      );

      expect(error.status).toBe(404);
      
      const errorData = await error.json();
      expect(errorData.error).toBe('profile not found');
      expect(errorData.code).toBe('RESOURCE_NOT_FOUND');
    });
  });

  describe('Request Validation', () => {
    it('should validate required fields', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify({ name: 'John' }), // Missing required email
      });

      const schema = {
        body: {
          required: ['name', 'email'],
          fields: {
            name: { type: 'string' as const, required: true },
            email: { type: 'email' as const, required: true },
          },
        },
      };

      const result = await RequestValidator.validateRequest(mockRequest, schema);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      const emailError = result.errors.find(e => e.field === 'email');
      expect(emailError).toBeDefined();
      expect(emailError?.message).toBe('email is required');
    });

    it('should validate email format', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify({ 
          name: 'John',
          email: 'invalid-email'
        }),
      });

      const schema = {
        body: {
          required: ['name', 'email'],
          fields: {
            name: { type: 'string' as const, required: true },
            email: { type: 'email' as const, required: true },
          },
        },
      };

      const result = await RequestValidator.validateRequest(mockRequest, schema);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('email');
      expect(result.errors[0].message).toBe('Invalid email format');
    });

    it('should validate string length constraints', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify({ 
          name: 'A', // Too short
          bio: 'A'.repeat(2001), // Too long
        }),
      });

      const schema = {
        body: {
          fields: {
            name: { type: 'string' as const, minLength: 2, maxLength: 255 },
            bio: { type: 'string' as const, maxLength: 2000 },
          },
        },
      };

      const result = await RequestValidator.validateRequest(mockRequest, schema);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      
      const nameError = result.errors.find(e => e.field === 'name');
      const bioError = result.errors.find(e => e.field === 'bio');
      
      expect(nameError?.message).toBe('name must be at least 2 characters long');
      expect(bioError?.message).toBe('bio must be less than 2000 characters');
    });

    it('should validate query parameters', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/test?limit=invalid&offset=-1');

      const schema = {
        query: {
          pagination: true,
        },
      };

      const result = await RequestValidator.validateRequest(mockRequest, schema);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      
      const limitError = result.errors.find(e => e.field === 'limit');
      const offsetError = result.errors.find(e => e.field === 'offset');
      
      expect(limitError?.message).toBe('Limit must be a positive number');
      expect(offsetError?.message).toBe('Offset must be a non-negative number');
    });

    it('should validate URL parameters', () => {
      const params = { id: 'invalid', slug: 'Invalid-Slug!' };
      
      const schema = {
        id: true,
        slug: true,
      };

      const result = RequestValidator.validateParams(params, schema);

      expect(result.errors).toHaveLength(2);
      
      const idError = result.errors.find(e => e.field === 'id');
      const slugError = result.errors.find(e => e.field === 'slug');
      
      expect(idError?.message).toBe('Invalid id');
      expect(slugError?.message).toBe('Slug must contain only lowercase letters, numbers, and hyphens');
    });
  });

  describe('API Monitoring', () => {
    it('should track request metrics', () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/test');
      
      const { requestId, startTime, clientInfo } = APIMonitor.startRequest(mockRequest, '/api/test');
      
      expect(requestId).toMatch(/^req_\d+_[a-z0-9]+$/);
      expect(startTime).toBeGreaterThan(0);
      expect(clientInfo).toHaveProperty('ip');
      expect(clientInfo).toHaveProperty('userAgent');
    });

    it('should log errors with proper categorization', () => {
      const errorId = APIMonitor.logError(
        '/api/test',
        'POST',
        new Error('Test error'),
        'validation',
        'VALIDATION_ERROR',
        {
          userId: 'user123',
          ip: '127.0.0.1',
          requestData: { test: 'data' },
        }
      );

      expect(errorId).toMatch(/^err_\d+_[a-z0-9]+$/);
      
      const errorLogs = APIMonitor.getErrorLogs();
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0]).toMatchObject({
        errorId,
        endpoint: '/api/test',
        method: 'POST',
        errorType: 'validation',
        errorCode: 'VALIDATION_ERROR',
        errorMessage: 'Test error',
        userId: 'user123',
        ip: '127.0.0.1',
      });
    });

    it('should generate health summary', () => {
      // Simulate some requests and errors
      APIMonitor.logError('/api/test1', 'GET', 'Error 1', 'database', 'DATABASE_ERROR');
      APIMonitor.logError('/api/test2', 'POST', 'Error 2', 'validation', 'VALIDATION_ERROR');
      
      const health = APIMonitor.getHealthSummary();
      
      expect(health).toHaveProperty('totalRequests');
      expect(health).toHaveProperty('totalErrors');
      expect(health).toHaveProperty('overallErrorRate');
      expect(health).toHaveProperty('averageResponseTime');
      expect(health).toHaveProperty('topErrorEndpoints');
      expect(health).toHaveProperty('topSlowEndpoints');
    });

    it('should redact sensitive information from logs', () => {
      const sensitiveData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret123',
        token: 'abc123',
      };

      const redacted = APIMonitor.redactSensitiveData(sensitiveData);
      
      expect(redacted.name).toBe('John Doe');
      expect(redacted.email).toBe('[REDACTED]');
      expect(redacted.password).toBe('[REDACTED]');
      expect(redacted.token).toBe('[REDACTED]');
    });
  });

  describe('API Wrapper Integration', () => {
    it('should handle method validation', async () => {
      const handler = vi.fn().mockResolvedValue(new Response('OK'));
      
      const wrappedHandler = APIWrapper.create(
        {
          endpoint: '/api/test',
          allowedMethods: ['GET'],
        },
        handler
      );

      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST', // Not allowed
      });

      const response = await wrappedHandler(mockRequest);
      
      expect(response.status).toBe(405);
      expect(handler).not.toHaveBeenCalled();
      
      const errorData = await response.json();
      expect(errorData.code).toBe('METHOD_NOT_ALLOWED');
    });

    it('should handle authentication requirement', async () => {
      const handler = vi.fn().mockResolvedValue(new Response('OK'));
      
      const wrappedHandler = APIWrapper.create(
        {
          endpoint: '/api/test',
          requireAuth: true,
        },
        handler
      );

      // Mock withAuth to throw an error (not authenticated)
      const { withAuth } = await import('@workos-inc/authkit-nextjs');
      vi.mocked(withAuth).mockRejectedValue(new Error('Not authenticated'));

      const mockRequest = new NextRequest('http://localhost:3000/api/test');
      const response = await wrappedHandler(mockRequest);
      
      expect(response.status).toBe(401);
      expect(handler).not.toHaveBeenCalled();
      
      const errorData = await response.json();
      expect(errorData.code).toBe('UNAUTHORIZED');
    });

    it('should handle validation errors', async () => {
      const handler = vi.fn().mockResolvedValue(new Response('OK'));
      
      const wrappedHandler = APIWrapper.create(
        {
          endpoint: '/api/test',
          validation: {
            body: {
              required: ['name'],
              fields: {
                name: { type: 'string', required: true },
              },
            },
          },
        },
        handler
      );

      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify({}), // Missing required name
      });

      const response = await wrappedHandler(mockRequest);
      
      expect(response.status).toBe(400);
      expect(handler).not.toHaveBeenCalled();
      
      const errorData = await response.json();
      expect(errorData.code).toBe('VALIDATION_ERROR');
    });

    it('should add standard headers to successful responses', async () => {
      const handler = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' },
        })
      );
      
      const wrappedHandler = APIWrapper.create(
        {
          endpoint: '/api/test',
        },
        handler
      );

      const mockRequest = new NextRequest('http://localhost:3000/api/test');
      const response = await wrappedHandler(mockRequest);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('X-Request-ID')).toMatch(/^req_\d+_[a-z0-9]+$/);
      expect(response.headers.get('X-API-Version')).toBe('1.0');
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Error Code Mappings', () => {
    it('should map error codes to correct HTTP status codes', () => {
      const testCases = [
        { code: APIErrorCodes.VALIDATION_ERROR, expectedStatus: 400 },
        { code: APIErrorCodes.UNAUTHORIZED, expectedStatus: 401 },
        { code: APIErrorCodes.FORBIDDEN, expectedStatus: 403 },
        { code: APIErrorCodes.RESOURCE_NOT_FOUND, expectedStatus: 404 },
        { code: APIErrorCodes.METHOD_NOT_ALLOWED, expectedStatus: 405 },
        { code: APIErrorCodes.RESOURCE_ALREADY_EXISTS, expectedStatus: 409 },
        { code: APIErrorCodes.RATE_LIMIT_EXCEEDED, expectedStatus: 429 },
        { code: APIErrorCodes.INTERNAL_ERROR, expectedStatus: 500 },
        { code: APIErrorCodes.SERVICE_UNAVAILABLE, expectedStatus: 503 },
      ];

      testCases.forEach(({ code, expectedStatus }) => {
        const error = APIErrorHandler.createError('Test error', code);
        expect(error.status).toBe(expectedStatus);
      });
    });
  });
});