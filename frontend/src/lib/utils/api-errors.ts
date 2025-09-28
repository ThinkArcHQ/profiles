/**
 * Centralized API Error Handling Utilities
 * 
 * Provides standardized error handling, validation, and response formatting
 * for all API endpoints in the application.
 */

import { NextResponse } from 'next/server';

/**
 * Standard API error interface
 */
export interface APIError {
  error: string;
  code: string;
  details?: Record<string, any>;
  timestamp?: string;
}

/**
 * Validation error interface
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Standard API error codes
 */
export const APIErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // Validation Errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_URL: 'INVALID_URL',
  INVALID_DATE: 'INVALID_DATE',
  INVALID_ID: 'INVALID_ID',
  
  // Resource Errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  PROFILE_NOT_FOUND: 'PROFILE_NOT_FOUND',
  APPOINTMENT_NOT_FOUND: 'APPOINTMENT_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  PROFILE_ALREADY_EXISTS: 'PROFILE_ALREADY_EXISTS',
  
  // Business Logic Errors
  SLUG_UNAVAILABLE: 'SLUG_UNAVAILABLE',
  INVALID_SLUG_FORMAT: 'INVALID_SLUG_FORMAT',
  PRIVACY_VIOLATION: 'PRIVACY_VIOLATION',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
  REQUEST_TYPE_NOT_AVAILABLE: 'REQUEST_TYPE_NOT_AVAILABLE',
  
  // System Errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Method Errors
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  UNSUPPORTED_MEDIA_TYPE: 'UNSUPPORTED_MEDIA_TYPE',
  
  // External Service Errors
  NOTIFICATION_ERROR: 'NOTIFICATION_ERROR',
  EMAIL_SEND_ERROR: 'EMAIL_SEND_ERROR',
} as const;

export type APIErrorCode = typeof APIErrorCodes[keyof typeof APIErrorCodes];

/**
 * HTTP status code mappings for error codes
 */
export const ErrorStatusMappings: Record<APIErrorCode, number> = {
  // 400 Bad Request
  [APIErrorCodes.VALIDATION_ERROR]: 400,
  [APIErrorCodes.INVALID_INPUT]: 400,
  [APIErrorCodes.MISSING_REQUIRED_FIELD]: 400,
  [APIErrorCodes.INVALID_FORMAT]: 400,
  [APIErrorCodes.INVALID_EMAIL]: 400,
  [APIErrorCodes.INVALID_URL]: 400,
  [APIErrorCodes.INVALID_DATE]: 400,
  [APIErrorCodes.INVALID_ID]: 400,
  [APIErrorCodes.INVALID_SLUG_FORMAT]: 400,
  [APIErrorCodes.REQUEST_TYPE_NOT_AVAILABLE]: 400,
  
  // 401 Unauthorized
  [APIErrorCodes.UNAUTHORIZED]: 401,
  [APIErrorCodes.TOKEN_EXPIRED]: 401,
  [APIErrorCodes.INVALID_CREDENTIALS]: 401,
  
  // 403 Forbidden
  [APIErrorCodes.FORBIDDEN]: 403,
  [APIErrorCodes.PRIVACY_VIOLATION]: 403,
  [APIErrorCodes.OPERATION_NOT_ALLOWED]: 403,
  
  // 404 Not Found
  [APIErrorCodes.RESOURCE_NOT_FOUND]: 404,
  [APIErrorCodes.PROFILE_NOT_FOUND]: 404,
  [APIErrorCodes.APPOINTMENT_NOT_FOUND]: 404,
  
  // 405 Method Not Allowed
  [APIErrorCodes.METHOD_NOT_ALLOWED]: 405,
  
  // 409 Conflict
  [APIErrorCodes.RESOURCE_ALREADY_EXISTS]: 409,
  [APIErrorCodes.PROFILE_ALREADY_EXISTS]: 409,
  [APIErrorCodes.SLUG_UNAVAILABLE]: 409,
  
  // 415 Unsupported Media Type
  [APIErrorCodes.UNSUPPORTED_MEDIA_TYPE]: 415,
  
  // 429 Too Many Requests
  [APIErrorCodes.RATE_LIMIT_EXCEEDED]: 429,
  
  // 500 Internal Server Error
  [APIErrorCodes.DATABASE_ERROR]: 500,
  [APIErrorCodes.INTERNAL_ERROR]: 500,
  [APIErrorCodes.NOTIFICATION_ERROR]: 500,
  [APIErrorCodes.EMAIL_SEND_ERROR]: 500,
  
  // 503 Service Unavailable
  [APIErrorCodes.SERVICE_UNAVAILABLE]: 503,
};

/**
 * API Error Handler class
 */
export class APIErrorHandler {
  /**
   * Create a standardized API error response
   */
  static createError(
    message: string,
    code: APIErrorCode,
    details?: Record<string, any>,
    statusOverride?: number
  ): NextResponse {
    const status = statusOverride || ErrorStatusMappings[code] || 500;
    
    const errorResponse: APIError = {
      error: message,
      code,
      timestamp: new Date().toISOString(),
      ...(details && { details }),
    };

    return NextResponse.json(errorResponse, { status });
  }

  /**
   * Create a validation error response
   */
  static createValidationError(
    message: string,
    validationErrors: ValidationError[]
  ): NextResponse {
    return this.createError(
      message,
      APIErrorCodes.VALIDATION_ERROR,
      { validationErrors }
    );
  }

  /**
   * Create an unauthorized error response
   */
  static createUnauthorizedError(message: string = 'Unauthorized'): NextResponse {
    return this.createError(message, APIErrorCodes.UNAUTHORIZED);
  }

  /**
   * Create a forbidden error response
   */
  static createForbiddenError(message: string = 'Forbidden'): NextResponse {
    return this.createError(message, APIErrorCodes.FORBIDDEN);
  }

  /**
   * Create a not found error response
   */
  static createNotFoundError(
    resource: string = 'Resource',
    resourceId?: string | number
  ): NextResponse {
    const message = resourceId 
      ? `${resource} with ID ${resourceId} not found`
      : `${resource} not found`;
    
    return this.createError(message, APIErrorCodes.RESOURCE_NOT_FOUND);
  }

  /**
   * Create a conflict error response
   */
  static createConflictError(
    message: string,
    code: APIErrorCode = APIErrorCodes.RESOURCE_ALREADY_EXISTS
  ): NextResponse {
    return this.createError(message, code);
  }

  /**
   * Create a method not allowed error response
   */
  static createMethodNotAllowedError(
    allowedMethods: string[]
  ): NextResponse {
    return NextResponse.json(
      {
        error: `Method not allowed. Allowed methods: ${allowedMethods.join(', ')}`,
        code: APIErrorCodes.METHOD_NOT_ALLOWED,
        timestamp: new Date().toISOString(),
        details: { allowedMethods },
      },
      { 
        status: 405,
        headers: { 'Allow': allowedMethods.join(', ') }
      }
    );
  }

  /**
   * Create an internal server error response
   */
  static createInternalError(
    message: string = 'Internal server error',
    originalError?: Error
  ): NextResponse {
    // Log the original error for debugging
    if (originalError) {
      console.error('Internal server error:', originalError);
    }

    return this.createError(message, APIErrorCodes.INTERNAL_ERROR);
  }

  /**
   * Create a database error response
   */
  static createDatabaseError(
    operation: string,
    originalError?: any
  ): NextResponse {
    // Log the database error
    console.error(`Database error during ${operation}:`, originalError);

    // Handle specific database error codes
    if (originalError?.code === '23505') { // Unique constraint violation
      if (originalError.constraint?.includes('slug')) {
        return this.createError(
          'Profile URL already exists',
          APIErrorCodes.SLUG_UNAVAILABLE
        );
      }
      if (originalError.constraint?.includes('workos_user_id')) {
        return this.createError(
          'Profile already exists for this user',
          APIErrorCodes.PROFILE_ALREADY_EXISTS
        );
      }
      return this.createError(
        'Resource already exists',
        APIErrorCodes.RESOURCE_ALREADY_EXISTS
      );
    }

    if (originalError?.code === '23503') { // Foreign key violation
      return this.createError(
        'Referenced resource not found',
        APIErrorCodes.RESOURCE_NOT_FOUND
      );
    }

    if (originalError?.code === '23502') { // Not null violation
      return this.createError(
        'Required field is missing',
        APIErrorCodes.MISSING_REQUIRED_FIELD
      );
    }

    return this.createError(
      `Failed to ${operation}`,
      APIErrorCodes.DATABASE_ERROR
    );
  }

  /**
   * Handle and format unexpected errors
   */
  static handleUnexpectedError(
    error: unknown,
    operation: string = 'process request'
  ): NextResponse {
    console.error(`Unexpected error during ${operation}:`, error);

    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('JSON')) {
        return this.createError(
          'Invalid JSON in request body',
          APIErrorCodes.INVALID_INPUT
        );
      }

      if (error.message.includes('timeout')) {
        return this.createError(
          'Request timeout',
          APIErrorCodes.SERVICE_UNAVAILABLE
        );
      }
    }

    return this.createInternalError('An unexpected error occurred', error as Error);
  }

  /**
   * Log API errors for monitoring
   */
  static logError(
    endpoint: string,
    method: string,
    error: Error | string,
    context?: Record<string, any>
  ): void {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error(`API Error in ${method} ${endpoint}:`, {
      message: errorMessage,
      stack: errorStack,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Create privacy-safe error responses
   */
  static createPrivacySafeError(
    originalError: string,
    resourceType: string = 'resource'
  ): NextResponse {
    // For privacy, return generic "not found" instead of "access denied"
    // to avoid leaking information about resource existence
    const isPrivacyRelated = originalError.toLowerCase().includes('private') ||
                            originalError.toLowerCase().includes('access') ||
                            originalError.toLowerCase().includes('forbidden');

    if (isPrivacyRelated) {
      return this.createNotFoundError(resourceType);
    }

    return this.createError(originalError, APIErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * Input validation utilities
 */
export class APIValidator {
  /**
   * Validate required fields
   */
  static validateRequiredFields(
    data: Record<string, any>,
    requiredFields: string[]
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        errors.push({
          field,
          message: `${field} is required`,
          value: data[field],
        });
      }
    }

    return errors;
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): ValidationError | null {
    if (!email || typeof email !== 'string') {
      return {
        field: 'email',
        message: 'Email is required',
        value: email,
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        field: 'email',
        message: 'Invalid email format',
        value: email,
      };
    }

    if (email.length > 255) {
      return {
        field: 'email',
        message: 'Email must be less than 255 characters',
        value: email,
      };
    }

    return null;
  }

  /**
   * Validate URL format
   */
  static validateURL(url: string, fieldName: string = 'url'): ValidationError | null {
    if (!url) return null; // Optional field

    try {
      new URL(url);
      return null;
    } catch {
      return {
        field: fieldName,
        message: 'Invalid URL format',
        value: url,
      };
    }
  }

  /**
   * Validate string length
   */
  static validateStringLength(
    value: string,
    fieldName: string,
    minLength: number = 0,
    maxLength: number = 255
  ): ValidationError | null {
    if (!value || typeof value !== 'string') {
      if (minLength > 0) {
        return {
          field: fieldName,
          message: `${fieldName} is required`,
          value,
        };
      }
      return null;
    }

    if (value.length < minLength) {
      return {
        field: fieldName,
        message: `${fieldName} must be at least ${minLength} characters long`,
        value,
      };
    }

    if (value.length > maxLength) {
      return {
        field: fieldName,
        message: `${fieldName} must be less than ${maxLength} characters`,
        value,
      };
    }

    return null;
  }

  /**
   * Validate array
   */
  static validateArray(
    value: any,
    fieldName: string,
    maxItems: number = 100
  ): ValidationError | null {
    if (!value) return null; // Optional field

    if (!Array.isArray(value)) {
      return {
        field: fieldName,
        message: `${fieldName} must be an array`,
        value,
      };
    }

    if (value.length > maxItems) {
      return {
        field: fieldName,
        message: `${fieldName} cannot have more than ${maxItems} items`,
        value,
      };
    }

    return null;
  }

  /**
   * Validate integer ID
   */
  static validateId(id: string, fieldName: string = 'id'): ValidationError | null {
    const numericId = parseInt(id);
    
    if (isNaN(numericId) || numericId <= 0) {
      return {
        field: fieldName,
        message: `Invalid ${fieldName}`,
        value: id,
      };
    }

    return null;
  }

  /**
   * Validate slug format
   */
  static validateSlug(slug: string): ValidationError | null {
    if (!slug || typeof slug !== 'string') {
      return {
        field: 'slug',
        message: 'Slug is required',
        value: slug,
      };
    }

    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return {
        field: 'slug',
        message: 'Slug must contain only lowercase letters, numbers, and hyphens',
        value: slug,
      };
    }

    if (slug.length < 3 || slug.length > 50) {
      return {
        field: 'slug',
        message: 'Slug must be between 3 and 50 characters long',
        value: slug,
      };
    }

    return null;
  }

  /**
   * Validate date format
   */
  static validateDate(
    dateString: string,
    fieldName: string,
    allowPast: boolean = false
  ): ValidationError | null {
    if (!dateString) return null; // Optional field

    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return {
          field: fieldName,
          message: `Invalid ${fieldName} format`,
          value: dateString,
        };
      }

      if (!allowPast && date < new Date()) {
        return {
          field: fieldName,
          message: `${fieldName} cannot be in the past`,
          value: dateString,
        };
      }

      return null;
    } catch {
      return {
        field: fieldName,
        message: `Invalid ${fieldName} format`,
        value: dateString,
      };
    }
  }

  /**
   * Validate enum values
   */
  static validateEnum(
    value: string,
    fieldName: string,
    allowedValues: string[]
  ): ValidationError | null {
    if (!value) return null; // Optional field

    if (!allowedValues.includes(value)) {
      return {
        field: fieldName,
        message: `Invalid ${fieldName}. Allowed values: ${allowedValues.join(', ')}`,
        value,
      };
    }

    return null;
  }
}