# API Error Handling and Validation System

This document describes the comprehensive error handling, validation, and monitoring system implemented for all API endpoints.

## Overview

The system provides:
- **Standardized Error Responses**: Consistent error format across all endpoints
- **Comprehensive Validation**: Request body, parameters, and query validation
- **Request Monitoring**: Performance tracking, error logging, and analytics
- **Security Features**: Rate limiting, input sanitization, and privacy protection
- **Developer Experience**: Easy-to-use wrappers and utilities

## Components

### 1. Error Handling (`api-errors.ts`)

#### Features
- Standardized error response format
- HTTP status code mapping
- Database error handling
- Privacy-safe error responses
- Comprehensive validation utilities

#### Usage
```typescript
import { APIErrorHandler, APIErrorCodes } from '@/lib/utils/api-errors';

// Create standardized errors
const error = APIErrorHandler.createError(
  'Resource not found',
  APIErrorCodes.RESOURCE_NOT_FOUND
);

// Create validation errors
const validationError = APIErrorHandler.createValidationError(
  'Invalid input data',
  [{ field: 'email', message: 'Invalid email format' }]
);

// Handle database errors
const dbError = APIErrorHandler.createDatabaseError('create user', dbException);
```

#### Error Codes
- **Authentication**: `UNAUTHORIZED`, `FORBIDDEN`, `TOKEN_EXPIRED`
- **Validation**: `VALIDATION_ERROR`, `INVALID_INPUT`, `MISSING_REQUIRED_FIELD`
- **Resources**: `RESOURCE_NOT_FOUND`, `RESOURCE_ALREADY_EXISTS`
- **System**: `DATABASE_ERROR`, `INTERNAL_ERROR`, `RATE_LIMIT_EXCEEDED`

### 2. Request Validation (`validation-middleware.ts`)

#### Features
- Body validation with schema definitions
- URL parameter validation
- Query parameter validation
- Type conversion and sanitization
- Comprehensive field validation

#### Usage
```typescript
import { RequestValidator, withValidation } from '@/lib/middleware/validation-middleware';

const schema = {
  body: {
    required: ['name', 'email'],
    fields: {
      name: { type: 'string', minLength: 2, maxLength: 255 },
      email: { type: 'email', required: true },
      age: { type: 'number', min: 0, max: 120 },
      skills: { type: 'array', maxItems: 10 },
    },
  },
  params: {
    id: true, // Validates as integer ID
    slug: true, // Validates slug format
  },
  query: {
    pagination: true, // Validates limit/offset
    search: true, // Validates search parameters
  },
};

export const POST = withValidation(schema, async (request, validatedData) => {
  // validatedData contains sanitized and validated data
  const { body, params, query } = validatedData;
  // ... handler logic
});
```

#### Validation Types
- **string**: Length validation, trimming
- **email**: Format validation
- **url**: URL format validation
- **date**: Date parsing and past/future validation
- **number**: Range validation
- **boolean**: Boolean conversion
- **array**: Array validation with item limits
- **enum**: Allowed values validation
- **slug**: Slug format validation

### 3. API Monitoring (`api-monitoring.ts`)

#### Features
- Request/response logging
- Performance metrics tracking
- Error categorization and logging
- Health monitoring
- Sensitive data redaction

#### Usage
```typescript
import { APIMonitor } from '@/lib/utils/api-monitoring';

// Configure monitoring
APIMonitor.configure({
  enableRequestLogging: true,
  enableErrorLogging: true,
  logLevel: 'info',
  slowRequestThreshold: 1000,
});

// Manual error logging
const errorId = APIMonitor.logError(
  '/api/users',
  'POST',
  error,
  'validation',
  'VALIDATION_ERROR',
  { userId: 'user123', requestData: sanitizedData }
);

// Get metrics
const metrics = APIMonitor.getPerformanceMetrics();
const health = APIMonitor.getHealthSummary();
```

#### Metrics Tracked
- Request count and response times
- Error rates by endpoint
- Slow request identification
- Client information (IP, User-Agent)
- Performance trends

### 4. API Wrapper (`api-wrapper.ts`)

#### Features
- Combines all middleware components
- Authentication handling
- Rate limiting
- Method validation
- Standard headers
- Comprehensive error handling

#### Usage
```typescript
import { APIWrapper, createPOSTEndpoint } from '@/lib/middleware/api-wrapper';

// Simple wrapper
export const GET = APIWrapper.simple('/api/users', async (request, context) => {
  // context contains: requestId, user, validatedData, clientInfo
  return NextResponse.json({ users: [] });
});

// Authenticated endpoint
export const POST = APIWrapper.authenticated(
  '/api/users',
  async (request, context) => {
    const { user } = context; // Guaranteed to exist
    // ... handler logic
  },
  {
    validation: {
      body: {
        required: ['name', 'email'],
        fields: {
          name: { type: 'string', required: true },
          email: { type: 'email', required: true },
        },
      },
    },
  }
);

// Rate limited endpoint
export const POST = APIWrapper.rateLimited(
  '/api/sensitive',
  { requests: 10, windowMs: 60000 }, // 10 requests per minute
  async (request, context) => {
    // ... handler logic
  }
);

// Convenience functions
export const GET = createGETEndpoint('/api/data', handler);
export const POST = createPOSTEndpoint('/api/data', handler, {
  requireAuth: true,
  validation: schema,
  rateLimit: { requests: 5, windowMs: 60000 },
});
```

## Implementation Examples

### Basic API Route
```typescript
// /api/users/route.ts
import { createGETEndpoint, createPOSTEndpoint } from '@/lib/middleware/api-wrapper';

const getUsersHandler = async (request, context) => {
  // Get users logic
  return NextResponse.json(users);
};

const createUserHandler = async (request, context) => {
  const { validatedData, user } = context;
  // Create user logic
  return NextResponse.json(newUser, { status: 201 });
};

export const GET = createGETEndpoint('/api/users', getUsersHandler);

export const POST = createPOSTEndpoint(
  '/api/users',
  createUserHandler,
  {
    requireAuth: true,
    validation: {
      body: {
        required: ['name', 'email'],
        fields: {
          name: { type: 'string', minLength: 2, maxLength: 255 },
          email: { type: 'email', required: true },
          bio: { type: 'string', maxLength: 2000 },
        },
      },
    },
    rateLimit: { requests: 5, windowMs: 60000 },
  }
);
```

### Error Handling in Routes
```typescript
const handler = async (request, context) => {
  try {
    // Business logic
    const result = await someOperation();
    return NextResponse.json(result);
  } catch (error) {
    // Errors are automatically handled by the wrapper
    // But you can also handle specific cases
    if (error.code === 'DUPLICATE_KEY') {
      return APIErrorHandler.createConflictError(
        'Resource already exists',
        APIErrorCodes.RESOURCE_ALREADY_EXISTS
      );
    }
    
    // Let the wrapper handle unexpected errors
    throw error;
  }
};
```

### Health Check Endpoint
```typescript
// /api/health/route.ts
import { createGETEndpoint } from '@/lib/middleware/api-wrapper';
import { APIMonitor } from '@/lib/utils/api-monitoring';

const healthHandler = async (request, context) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    requestId: context.requestId,
  };

  // Include metrics if requested
  const { searchParams } = new URL(request.url);
  if (searchParams.get('metrics') === 'true') {
    health.metrics = APIMonitor.getHealthSummary();
  }

  return NextResponse.json(health);
};

export const GET = createGETEndpoint('/api/health', healthHandler);
```

## Error Response Format

All API errors follow this standardized format:

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "details": {
    "validationErrors": [
      {
        "field": "email",
        "message": "Invalid email format",
        "value": "invalid-email"
      }
    ]
  }
}
```

## HTTP Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors, invalid input)
- **401**: Unauthorized (authentication required)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found (resource doesn't exist)
- **405**: Method Not Allowed
- **409**: Conflict (resource already exists)
- **429**: Too Many Requests (rate limit exceeded)
- **500**: Internal Server Error
- **503**: Service Unavailable

## Security Features

### Rate Limiting
- Configurable per endpoint
- IP-based limiting
- Automatic retry headers
- Memory-based storage (Redis recommended for production)

### Input Sanitization
- Automatic data type conversion
- String trimming and length validation
- Array size limits
- Sensitive data redaction in logs

### Privacy Protection
- Email addresses never exposed in public APIs
- Private profiles return 404 instead of 403
- Sensitive fields automatically redacted from logs
- Privacy-safe error messages

## Monitoring and Analytics

### Request Logging
```typescript
// Automatic logging includes:
{
  requestId: "req_1234567890_abc123",
  timestamp: "2024-01-15T10:30:00.000Z",
  method: "POST",
  url: "/api/users",
  endpoint: "/api/users",
  userAgent: "Mozilla/5.0...",
  ip: "192.168.1.1",
  userId: "user_123",
  requestSize: 256,
  responseStatus: 201,
  responseSize: 512,
  duration: 150,
  error: null,
  errorCode: null
}
```

### Error Logging
```typescript
// Automatic error logging includes:
{
  errorId: "err_1234567890_def456",
  timestamp: "2024-01-15T10:30:00.000Z",
  endpoint: "/api/users",
  method: "POST",
  errorType: "validation",
  errorCode: "VALIDATION_ERROR",
  errorMessage: "Invalid email format",
  stackTrace: "Error: Invalid email...",
  userId: "user_123",
  ip: "192.168.1.1",
  userAgent: "Mozilla/5.0...",
  requestData: { /* sanitized request data */ },
  context: { /* additional context */ }
}
```

### Performance Metrics
```typescript
// Available metrics:
{
  endpoint: "/api/users",
  method: "POST",
  averageResponseTime: 245,
  requestCount: 1250,
  errorCount: 15,
  errorRate: 1.2,
  slowRequestCount: 8,
  timestamp: "2024-01-15T10:30:00.000Z"
}
```

## Testing

The system includes comprehensive tests covering:
- Error response formatting
- Validation logic
- Monitoring functionality
- API wrapper integration
- Edge cases and error conditions

Run tests with:
```bash
npm test -- --run src/app/api/__tests__/error-handling.test.ts
```

## Best Practices

### 1. Always Use Wrappers
```typescript
// ✅ Good
export const POST = createPOSTEndpoint('/api/users', handler, options);

// ❌ Avoid
export async function POST(request) {
  // Manual error handling, validation, etc.
}
```

### 2. Define Validation Schemas
```typescript
// ✅ Good - Comprehensive validation
const schema = {
  body: {
    required: ['name', 'email'],
    fields: {
      name: { type: 'string', minLength: 2, maxLength: 255 },
      email: { type: 'email', required: true },
    },
  },
};

// ❌ Avoid - No validation
const handler = async (request) => {
  const body = await request.json(); // No validation
};
```

### 3. Use Appropriate Error Codes
```typescript
// ✅ Good - Specific error codes
if (user.role !== 'admin') {
  return APIErrorHandler.createForbiddenError('Admin access required');
}

// ❌ Avoid - Generic errors
return NextResponse.json({ error: 'Error' }, { status: 500 });
```

### 4. Handle Privacy Correctly
```typescript
// ✅ Good - Privacy-safe errors
if (!profile.isPublic && profile.userId !== currentUserId) {
  return APIErrorHandler.createNotFoundError('Profile');
}

// ❌ Avoid - Information leakage
return APIErrorHandler.createForbiddenError('Profile is private');
```

## Migration Guide

To migrate existing API routes to use the new error handling system:

1. **Replace manual error handling**:
   ```typescript
   // Before
   export async function GET(request) {
     try {
       // logic
     } catch (error) {
       return NextResponse.json({ error: 'Failed' }, { status: 500 });
     }
   }

   // After
   const handler = async (request, context) => {
     // logic - errors handled automatically
   };
   export const GET = createGETEndpoint('/api/endpoint', handler);
   ```

2. **Add validation schemas**:
   ```typescript
   // Add validation for all inputs
   export const POST = createPOSTEndpoint('/api/endpoint', handler, {
     validation: {
       body: { /* validation schema */ },
     },
   });
   ```

3. **Update error responses**:
   ```typescript
   // Use standardized error responses
   return APIErrorHandler.createValidationError('Invalid input', errors);
   ```

4. **Add authentication where needed**:
   ```typescript
   export const POST = createPOSTEndpoint('/api/endpoint', handler, {
     requireAuth: true,
   });
   ```

This system ensures consistent, secure, and maintainable API endpoints across the entire application.