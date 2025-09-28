/**
 * Request Validation Middleware
 * 
 * Provides comprehensive validation for API request data including
 * body validation, parameter validation, and query parameter validation.
 */

import { NextRequest } from 'next/server';
import { APIValidator, ValidationError, APIErrorHandler } from '@/lib/utils/api-errors';

/**
 * Validation schema interface
 */
export interface ValidationSchema {
  body?: BodyValidationSchema;
  params?: ParamValidationSchema;
  query?: QueryValidationSchema;
}

/**
 * Body validation schema
 */
export interface BodyValidationSchema {
  required?: string[];
  optional?: string[];
  fields?: Record<string, FieldValidation>;
}

/**
 * Parameter validation schema
 */
export interface ParamValidationSchema {
  id?: boolean; // Validate as integer ID
  slug?: boolean; // Validate as slug format
  custom?: Record<string, FieldValidation>;
}

/**
 * Query parameter validation schema
 */
export interface QueryValidationSchema {
  pagination?: boolean; // Validate limit/offset
  search?: boolean; // Validate search parameters
  custom?: Record<string, FieldValidation>;
}

/**
 * Field validation configuration
 */
export interface FieldValidation {
  type: 'string' | 'number' | 'boolean' | 'array' | 'email' | 'url' | 'date' | 'enum' | 'slug';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  allowedValues?: string[];
  allowPast?: boolean; // For date validation
  maxItems?: number; // For array validation
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  data?: {
    body?: any;
    params?: any;
    query?: any;
  };
}

/**
 * Request Validator class
 */
export class RequestValidator {
  /**
   * Validate a complete request against a schema
   */
  static async validateRequest(
    request: NextRequest,
    schema: ValidationSchema,
    params?: Record<string, string>
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const validatedData: any = {};

    // Validate request body
    if (schema.body) {
      const bodyResult = await this.validateBody(request, schema.body);
      errors.push(...bodyResult.errors);
      if (bodyResult.data) {
        validatedData.body = bodyResult.data;
      }
    }

    // Validate URL parameters
    if (schema.params && params) {
      const paramResult = this.validateParams(params, schema.params);
      errors.push(...paramResult.errors);
      if (paramResult.data) {
        validatedData.params = paramResult.data;
      }
    }

    // Validate query parameters
    if (schema.query) {
      const queryResult = this.validateQuery(request, schema.query);
      errors.push(...queryResult.errors);
      if (queryResult.data) {
        validatedData.query = queryResult.data;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: validatedData,
    };
  }

  /**
   * Validate request body
   */
  static async validateBody(
    request: NextRequest,
    schema: BodyValidationSchema
  ): Promise<{ errors: ValidationError[]; data?: any }> {
    const errors: ValidationError[] = [];
    let body: any;

    // Parse JSON body
    try {
      body = await request.json();
    } catch (error) {
      errors.push({
        field: 'body',
        message: 'Invalid JSON in request body',
      });
      return { errors };
    }

    if (!body || typeof body !== 'object') {
      errors.push({
        field: 'body',
        message: 'Request body must be a valid JSON object',
      });
      return { errors };
    }

    // Validate required fields
    if (schema.required) {
      const requiredErrors = APIValidator.validateRequiredFields(body, schema.required);
      errors.push(...requiredErrors);
    }

    // Validate individual fields
    if (schema.fields) {
      for (const [fieldName, fieldSchema] of Object.entries(schema.fields)) {
        const fieldValue = body[fieldName];
        const fieldErrors = this.validateField(fieldName, fieldValue, fieldSchema);
        errors.push(...fieldErrors);
      }
    }

    return {
      errors,
      data: errors.length === 0 ? body : undefined,
    };
  }

  /**
   * Validate URL parameters
   */
  static validateParams(
    params: Record<string, string>,
    schema: ParamValidationSchema
  ): { errors: ValidationError[]; data?: any } {
    const errors: ValidationError[] = [];
    const validatedParams: any = {};

    // Validate ID parameter
    if (schema.id && params.id) {
      const idError = APIValidator.validateId(params.id);
      if (idError) {
        errors.push(idError);
      } else {
        validatedParams.id = parseInt(params.id);
      }
    }

    // Validate slug parameter
    if (schema.slug && params.slug) {
      const slugError = APIValidator.validateSlug(params.slug);
      if (slugError) {
        errors.push(slugError);
      } else {
        validatedParams.slug = params.slug.toLowerCase().trim();
      }
    }

    // Validate custom parameters
    if (schema.custom) {
      for (const [paramName, paramSchema] of Object.entries(schema.custom)) {
        const paramValue = params[paramName];
        const paramErrors = this.validateField(paramName, paramValue, paramSchema);
        errors.push(...paramErrors);
        
        if (paramErrors.length === 0 && paramValue !== undefined) {
          validatedParams[paramName] = this.convertFieldValue(paramValue, paramSchema.type);
        }
      }
    }

    return {
      errors,
      data: errors.length === 0 ? validatedParams : undefined,
    };
  }

  /**
   * Validate query parameters
   */
  static validateQuery(
    request: NextRequest,
    schema: QueryValidationSchema
  ): { errors: ValidationError[]; data?: any } {
    const errors: ValidationError[] = [];
    const validatedQuery: any = {};
    const { searchParams } = new URL(request.url);

    // Validate pagination parameters
    if (schema.pagination) {
      const limit = searchParams.get('limit');
      const offset = searchParams.get('offset');

      if (limit) {
        const limitNum = parseInt(limit);
        if (isNaN(limitNum) || limitNum < 1) {
          errors.push({
            field: 'limit',
            message: 'Limit must be a positive number',
            value: limit,
          });
        } else if (limitNum > 100) {
          errors.push({
            field: 'limit',
            message: 'Maximum limit is 100',
            value: limit,
          });
        } else {
          validatedQuery.limit = limitNum;
        }
      }

      if (offset) {
        const offsetNum = parseInt(offset);
        if (isNaN(offsetNum) || offsetNum < 0) {
          errors.push({
            field: 'offset',
            message: 'Offset must be a non-negative number',
            value: offset,
          });
        } else {
          validatedQuery.offset = offsetNum;
        }
      }
    }

    // Validate search parameters
    if (schema.search) {
      const query = searchParams.get('q') || searchParams.get('query');
      const skills = searchParams.get('skills');
      const availableFor = searchParams.get('available_for') || searchParams.get('availableFor');

      if (query && query.length > 200) {
        errors.push({
          field: 'query',
          message: 'Search query must be less than 200 characters',
          value: query,
        });
      } else if (query) {
        validatedQuery.query = query.trim();
      }

      if (skills) {
        const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
        if (skillsArray.length > 10) {
          errors.push({
            field: 'skills',
            message: 'Maximum 10 skills allowed in search',
            value: skills,
          });
        } else {
          validatedQuery.skills = skillsArray;
        }
      }

      if (availableFor) {
        const availableForArray = availableFor.split(',').map(a => a.trim()).filter(Boolean);
        const validOptions = ['meetings', 'quotes', 'appointments'];
        const invalidOptions = availableForArray.filter(option => !validOptions.includes(option));
        
        if (invalidOptions.length > 0) {
          errors.push({
            field: 'availableFor',
            message: `Invalid availability options: ${invalidOptions.join(', ')}. Valid options: ${validOptions.join(', ')}`,
            value: availableFor,
          });
        } else {
          validatedQuery.availableFor = availableForArray;
        }
      }
    }

    // Validate custom query parameters
    if (schema.custom) {
      for (const [queryName, querySchema] of Object.entries(schema.custom)) {
        const queryValue = searchParams.get(queryName);
        if (queryValue !== null) {
          const queryErrors = this.validateField(queryName, queryValue, querySchema);
          errors.push(...queryErrors);
          
          if (queryErrors.length === 0) {
            validatedQuery[queryName] = this.convertFieldValue(queryValue, querySchema.type);
          }
        }
      }
    }

    return {
      errors,
      data: errors.length === 0 ? validatedQuery : undefined,
    };
  }

  /**
   * Validate individual field
   */
  static validateField(
    fieldName: string,
    value: any,
    schema: FieldValidation
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check if field is required
    if (schema.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field: fieldName,
        message: `${fieldName} is required`,
        value,
      });
      return errors;
    }

    // Skip validation if field is optional and empty
    if (!schema.required && (value === undefined || value === null || value === '')) {
      return errors;
    }

    // Type-specific validation
    switch (schema.type) {
      case 'string':
        const stringError = APIValidator.validateStringLength(
          value,
          fieldName,
          schema.minLength,
          schema.maxLength
        );
        if (stringError) errors.push(stringError);
        break;

      case 'email':
        const emailError = APIValidator.validateEmail(value);
        if (emailError) errors.push(emailError);
        break;

      case 'url':
        const urlError = APIValidator.validateURL(value, fieldName);
        if (urlError) errors.push(urlError);
        break;

      case 'date':
        const dateError = APIValidator.validateDate(value, fieldName, schema.allowPast);
        if (dateError) errors.push(dateError);
        break;

      case 'slug':
        const slugError = APIValidator.validateSlug(value);
        if (slugError) errors.push(slugError);
        break;

      case 'enum':
        if (schema.allowedValues) {
          const enumError = APIValidator.validateEnum(value, fieldName, schema.allowedValues);
          if (enumError) errors.push(enumError);
        }
        break;

      case 'array':
        const arrayError = APIValidator.validateArray(value, fieldName, schema.maxItems);
        if (arrayError) errors.push(arrayError);
        break;

      case 'number':
        if (typeof value !== 'number' && isNaN(Number(value))) {
          errors.push({
            field: fieldName,
            message: `${fieldName} must be a number`,
            value,
          });
        } else {
          const numValue = Number(value);
          if (schema.min !== undefined && numValue < schema.min) {
            errors.push({
              field: fieldName,
              message: `${fieldName} must be at least ${schema.min}`,
              value,
            });
          }
          if (schema.max !== undefined && numValue > schema.max) {
            errors.push({
              field: fieldName,
              message: `${fieldName} must be at most ${schema.max}`,
              value,
            });
          }
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
          errors.push({
            field: fieldName,
            message: `${fieldName} must be a boolean`,
            value,
          });
        }
        break;
    }

    return errors;
  }

  /**
   * Convert field value to appropriate type
   */
  static convertFieldValue(value: any, type: FieldValidation['type']): any {
    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value === true || value === 'true';
      case 'array':
        return Array.isArray(value) ? value : [value];
      case 'string':
      case 'email':
      case 'url':
      case 'slug':
      case 'enum':
        return String(value).trim();
      case 'date':
        return new Date(value);
      default:
        return value;
    }
  }
}

/**
 * Validation middleware wrapper function
 */
export function withValidation(
  schema: ValidationSchema,
  handler: (
    request: NextRequest,
    validatedData: any,
    params?: Record<string, string>
  ) => Promise<Response>
) {
  return async (
    request: NextRequest,
    context?: { params: Record<string, string> }
  ): Promise<Response> => {
    try {
      // Validate the request
      const validationResult = await RequestValidator.validateRequest(
        request,
        schema,
        context?.params
      );

      if (!validationResult.isValid) {
        return APIErrorHandler.createValidationError(
          'Request validation failed',
          validationResult.errors
        );
      }

      // Call the handler with validated data
      return await handler(request, validationResult.data, context?.params);
    } catch (error) {
      return APIErrorHandler.handleUnexpectedError(error, 'validate request');
    }
  };
}