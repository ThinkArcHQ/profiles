/**
 * MCP Error Handling Utilities
 * 
 * Standardized error handling and response formatting for MCP endpoints
 * to ensure consistent error responses for AI agents.
 */

export interface MCPError {
  error: string;
  code: string;
  details?: Record<string, any>;
}

export interface MCPSearchError extends MCPError {
  profiles: [];
  pagination: {
    total: 0;
    limit: 0;
    offset: 0;
    hasMore: false;
  };
}

export interface MCPMeetingError extends MCPError {
  success: false;
}

export interface MCPProfileError extends MCPError {
  found: false;
  profile: null;
}

/**
 * Standard MCP error codes for consistent error handling
 */
export const MCPErrorCodes = {
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_SLUG_FORMAT: 'INVALID_SLUG_FORMAT',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_NAME: 'INVALID_NAME',
  INVALID_MESSAGE: 'INVALID_MESSAGE',
  INVALID_REQUEST_TYPE: 'INVALID_REQUEST_TYPE',
  INVALID_TIME_FORMAT: 'INVALID_TIME_FORMAT',
  INVALID_TIME_PAST: 'INVALID_TIME_PAST',
  
  // Resource errors
  PROFILE_NOT_FOUND: 'PROFILE_NOT_FOUND',
  REQUEST_TYPE_NOT_AVAILABLE: 'REQUEST_TYPE_NOT_AVAILABLE',
  
  // System errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  SEARCH_ERROR: 'SEARCH_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  
  // Method errors
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
} as const;

export type MCPErrorCode = typeof MCPErrorCodes[keyof typeof MCPErrorCodes];

/**
 * MCP Error Handler class for creating standardized error responses
 */
export class MCPErrorHandler {
  /**
   * Create a standardized search error response
   */
  static createSearchError(
    error: string, 
    code: MCPErrorCode = MCPErrorCodes.SEARCH_ERROR,
    details?: Record<string, any>
  ): MCPSearchError {
    return {
      error,
      code,
      details,
      profiles: [],
      pagination: {
        total: 0,
        limit: 0,
        offset: 0,
        hasMore: false,
      },
    };
  }

  /**
   * Create a standardized meeting request error response
   */
  static createMeetingError(
    error: string,
    code: MCPErrorCode = MCPErrorCodes.VALIDATION_ERROR,
    details?: Record<string, any>
  ): MCPMeetingError {
    return {
      success: false,
      error,
      code,
      details,
    };
  }

  /**
   * Create a standardized profile retrieval error response
   */
  static createProfileError(
    error: string,
    code: MCPErrorCode = MCPErrorCodes.PROFILE_NOT_FOUND,
    details?: Record<string, any>
  ): MCPProfileError {
    return {
      found: false,
      error,
      code,
      details,
      profile: null,
    };
  }

  /**
   * Create privacy-safe error responses that don't leak information
   */
  static createPrivacySafeError(
    originalError: string,
    errorType: 'search' | 'meeting' | 'profile' = 'profile'
  ): MCPSearchError | MCPMeetingError | MCPProfileError {
    // For privacy, return generic "not found" instead of "access denied"
    // to avoid leaking information about profile existence
    const safeError = originalError.includes('private') || 
                     originalError.includes('access') || 
                     originalError.includes('Access denied')
      ? 'Profile not found'
      : originalError;

    const safeCode = originalError.includes('private') || 
                    originalError.includes('access') || 
                    originalError.includes('Access denied')
      ? MCPErrorCodes.PROFILE_NOT_FOUND
      : MCPErrorCodes.VALIDATION_ERROR;

    switch (errorType) {
      case 'search':
        return this.createSearchError(safeError, safeCode);
      case 'meeting':
        return this.createMeetingError(safeError, safeCode);
      case 'profile':
        return this.createProfileError(safeError, safeCode);
      default:
        return this.createProfileError(safeError, safeCode);
    }
  }

  /**
   * Validate common MCP request parameters
   */
  static validateCommonParams(params: {
    profileSlug?: string;
    requesterName?: string;
    requesterEmail?: string;
    message?: string;
    requestType?: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate profile slug
    if (params.profileSlug !== undefined) {
      if (!params.profileSlug || params.profileSlug.trim().length === 0) {
        errors.push('Profile slug is required');
      } else {
        const slugRegex = /^[a-z0-9-]+$/;
        if (!slugRegex.test(params.profileSlug.toLowerCase().trim())) {
          errors.push('Invalid slug format. Slug must contain only lowercase letters, numbers, and hyphens');
        }
      }
    }

    // Validate requester name
    if (params.requesterName !== undefined) {
      if (!params.requesterName || params.requesterName.trim().length < 2) {
        errors.push('Requester name must be at least 2 characters long');
      } else if (params.requesterName.length > 255) {
        errors.push('Requester name must be less than 255 characters');
      }
    }

    // Validate requester email
    if (params.requesterEmail !== undefined) {
      if (!params.requesterEmail || params.requesterEmail.trim().length === 0) {
        errors.push('Requester email is required');
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(params.requesterEmail)) {
          errors.push('Invalid email format');
        } else if (params.requesterEmail.length > 255) {
          errors.push('Email must be less than 255 characters');
        }
      }
    }

    // Validate message
    if (params.message !== undefined) {
      if (!params.message || params.message.trim().length < 10) {
        errors.push('Message must be at least 10 characters long');
      } else if (params.message.length > 2000) {
        errors.push('Message must be less than 2000 characters');
      }
    }

    // Validate request type
    if (params.requestType !== undefined) {
      const validRequestTypes = ['meeting', 'quote', 'appointment'];
      if (!validRequestTypes.includes(params.requestType)) {
        errors.push(`Invalid request type. Valid options are: ${validRequestTypes.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate search parameters
   */
  static validateSearchParams(params: {
    query?: string;
    skills?: string[];
    availableFor?: string[];
    limit?: number;
    offset?: number;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate query
    if (params.query !== undefined && params.query.length > 200) {
      errors.push('Search query must be less than 200 characters');
    }

    // Validate skills array
    if (params.skills !== undefined) {
      if (!Array.isArray(params.skills)) {
        errors.push('Skills must be an array');
      } else if (params.skills.length > 10) {
        errors.push('Maximum 10 skills allowed in search');
      } else {
        for (const skill of params.skills) {
          if (typeof skill !== 'string' || skill.trim().length === 0) {
            errors.push('Each skill must be a non-empty string');
          } else if (skill.length > 100) {
            errors.push('Each skill must be less than 100 characters');
          }
        }
      }
    }

    // Validate availableFor array
    if (params.availableFor !== undefined) {
      if (!Array.isArray(params.availableFor)) {
        errors.push('AvailableFor must be an array');
      } else {
        const validOptions = ['meetings', 'quotes', 'appointments'];
        for (const option of params.availableFor) {
          if (!validOptions.includes(option)) {
            errors.push(`Invalid availability option: ${option}. Valid options are: ${validOptions.join(', ')}`);
          }
        }
      }
    }

    // Validate pagination
    if (params.limit !== undefined) {
      const limit = Number(params.limit);
      if (isNaN(limit) || limit < 1) {
        errors.push('Limit must be a positive number');
      } else if (limit > 50) {
        errors.push('Maximum limit is 50 for MCP requests');
      }
    }

    if (params.offset !== undefined) {
      const offset = Number(params.offset);
      if (isNaN(offset) || offset < 0) {
        errors.push('Offset must be a non-negative number');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate preferred time format
   */
  static validatePreferredTime(preferredTime: string): { isValid: boolean; error?: string; parsedTime?: Date } {
    try {
      const parsedTime = new Date(preferredTime);
      
      if (isNaN(parsedTime.getTime())) {
        return {
          isValid: false,
          error: 'Invalid preferred time format. Use ISO 8601 format (e.g., 2024-01-15T14:30:00Z)',
        };
      }
      
      // Check if preferred time is in the past
      if (parsedTime < new Date()) {
        return {
          isValid: false,
          error: 'Preferred time cannot be in the past',
        };
      }

      return {
        isValid: true,
        parsedTime,
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Invalid preferred time format. Use ISO 8601 format (e.g., 2024-01-15T14:30:00Z)',
      };
    }
  }

  /**
   * Log MCP errors for monitoring and debugging
   */
  static logError(
    endpoint: string,
    error: Error | string,
    context?: Record<string, any>
  ): void {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error(`MCP Error in ${endpoint}:`, {
      message: errorMessage,
      stack: errorStack,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Create method not allowed error for GET requests on POST-only endpoints
   */
  static createMethodNotAllowedError(
    allowedMethods: string[] = ['POST'],
    usage?: Record<string, any>
  ): MCPError {
    return {
      error: `This endpoint only accepts ${allowedMethods.join(', ')} requests`,
      code: MCPErrorCodes.METHOD_NOT_ALLOWED,
      details: {
        allowedMethods,
        usage,
      },
    };
  }
}