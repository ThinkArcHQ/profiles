# MCP Server Infrastructure

This directory contains the Model Context Protocol (MCP) server infrastructure for the Persons FinderBee platform. The MCP server enables AI agents to discover and connect with people through standardized endpoints.

## Overview

The MCP server provides three main tools for AI agents:

1. **search_profiles** - Search for people by skills, availability, or keywords
2. **get_profile** - Get detailed information about a person by their slug
3. **request_meeting** - Request a meeting with a person

## Architecture

```
┌─────────────────┐
│   AI Agents     │
│   (MCP Client)  │
└─────────┬───────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MCP Middleware Layer                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Rate Limiting   │  │ Security        │  │ Monitoring      │ │
│  │ - Per endpoint  │  │ - Request val.  │  │ - Metrics       │ │
│  │ - Client-based  │  │ - CORS          │  │ - Health checks │ │
│  │ - Configurable  │  │ - Headers       │  │ - Analytics     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MCP API Endpoints                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ /api/mcp/search │  │/api/mcp/get-    │  │/api/mcp/request-│ │
│  │                 │  │profile          │  │meeting          │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Business Logic & Database                    │
└─────────────────────────────────────────────────────────────────┘
```

## Endpoints

### Core MCP Tools

#### POST /api/mcp/search
Search for people profiles by various criteria.

**Request Body:**
```json
{
  "query": "software engineer",
  "skills": ["JavaScript", "React"],
  "availableFor": ["meetings"],
  "limit": 10,
  "offset": 0
}
```

**Response:**
```json
{
  "profiles": [
    {
      "slug": "john-doe",
      "name": "John Doe",
      "bio": "Software engineer with 5 years experience",
      "skills": ["JavaScript", "React", "Node.js"],
      "availableFor": ["meetings", "quotes"],
      "profileUrl": "https://persons.finderbee.ai/profiles/john-doe",
      "linkedinUrl": "https://linkedin.com/in/johndoe",
      "otherLinks": {}
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 10,
    "offset": 0,
    "hasMore": false
  }
}
```

#### POST /api/mcp/get-profile
Get detailed information about a specific person.

**Request Body:**
```json
{
  "profileSlug": "john-doe"
}
```

**Response:**
```json
{
  "found": true,
  "profile": {
    "slug": "john-doe",
    "name": "John Doe",
    "bio": "Software engineer with 5 years experience",
    "skills": ["JavaScript", "React", "Node.js"],
    "availableFor": ["meetings", "quotes"],
    "profileUrl": "https://persons.finderbee.ai/profiles/john-doe",
    "linkedinUrl": "https://linkedin.com/in/johndoe",
    "otherLinks": {}
  }
}
```

#### POST /api/mcp/request-meeting
Request a meeting with a person.

**Request Body:**
```json
{
  "profileSlug": "john-doe",
  "requesterName": "AI Assistant",
  "requesterEmail": "ai@example.com",
  "message": "I would like to discuss a potential collaboration opportunity.",
  "preferredTime": "2024-01-15T14:30:00Z",
  "requestType": "meeting"
}
```

**Response:**
```json
{
  "success": true,
  "requestId": "123",
  "message": "Meeting request sent successfully to John Doe. They will receive your request and respond via email.",
  "details": {
    "profileName": "John Doe",
    "requestType": "meeting",
    "status": "pending",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

### Infrastructure Endpoints

#### GET /api/mcp/health
Basic health check for monitoring.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00Z",
  "version": "1.0.0",
  "uptime": 3600,
  "services": {
    "database": "healthy",
    "mcp_endpoints": "healthy"
  },
  "metrics": {
    "total_requests_24h": 1500,
    "error_rate_24h": 2.5,
    "average_response_time_1h": 150,
    "active_endpoints": ["search_profiles", "get_profile", "request_meeting"]
  }
}
```

#### GET /api/mcp/status
Server status and capabilities.

**Response:**
```json
{
  "server": {
    "name": "persons-finderbee-mcp",
    "version": "1.0.0",
    "description": "MCP server for Persons FinderBee",
    "domain": "https://person.finderbee.ai",
    "status": "online",
    "uptime": 3600
  },
  "tools": {
    "available": ["search_profiles", "get_profile", "request_meeting"],
    "count": 3
  },
  "capabilities": {
    "search": true,
    "profiles": true,
    "meetings": true,
    "rateLimiting": true,
    "cors": true,
    "monitoring": true
  }
}
```

## Security Features

### Rate Limiting
- **Search**: 30 requests/minute per client
- **Get Profile**: 60 requests/minute per client  
- **Request Meeting**: 5 requests/minute per client

### Request Validation
- JSON schema validation for all inputs
- Suspicious pattern detection
- Request size limits (1MB max)
- URL length validation

### Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy: default-src 'none'`

### Privacy Protection
- Email addresses never exposed in responses
- Private profiles completely hidden from search
- Privacy-safe error messages (no information leakage)

## Monitoring & Analytics

### Metrics Collected
- Request count and response times
- Error rates and types
- Client IP and User-Agent tracking
- Endpoint usage patterns
- Performance percentiles (P50, P95, P99)

### Health Monitoring
- Database connectivity checks
- Endpoint availability monitoring
- Memory and CPU usage tracking
- Error rate alerting thresholds

### Logging
- Structured JSON logging
- Request/response logging (sanitized)
- Error tracking with context
- Security event logging

## Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://...

# Domains
NEXT_PUBLIC_URL=https://persons.finderbee.ai
MCP_DOMAIN=https://person.finderbee.ai

# Server
MCP_PORT=3000
MCP_HOST=0.0.0.0

# Security
NODE_ENV=production
```

### Rate Limit Configuration
Rate limits can be adjusted in `/lib/middleware/rate-limiter.ts`:

```typescript
export const MCPRateLimitConfigs = {
  search: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
  },
  getProfile: {
    windowMs: 60 * 1000,
    maxRequests: 60,
  },
  requestMeeting: {
    windowMs: 60 * 1000,
    maxRequests: 5,
  },
};
```

## Error Handling

### Standard Error Format
```json
{
  "error": "Error description",
  "code": "ERROR_CODE",
  "details": {
    "additional": "context"
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR` - Invalid request parameters
- `PROFILE_NOT_FOUND` - Profile doesn't exist or is private
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `SECURITY_VIOLATION` - Request blocked for security
- `INTERNAL_ERROR` - Server error

## Testing

### Manual Testing
```bash
# Search profiles
curl -X POST https://person.finderbee.ai/api/mcp/search \
  -H "Content-Type: application/json" \
  -d '{"query": "engineer", "limit": 5}'

# Get profile
curl -X POST https://person.finderbee.ai/api/mcp/get-profile \
  -H "Content-Type: application/json" \
  -d '{"profileSlug": "john-doe"}'

# Health check
curl https://person.finderbee.ai/api/mcp/health
```

### Integration Tests
Tests are located in `__tests__/` directories:
- `/api/mcp/__tests__/mcp-integration.test.ts`
- `/api/mcp/__tests__/mcp-tools.test.ts`

## Deployment

### Domain Configuration
- **Main Website**: `persons.finderbee.ai`
- **MCP Server**: `person.finderbee.ai`

### Infrastructure Requirements
- Node.js 18+ runtime
- PostgreSQL database (Neon)
- Reverse proxy (Nginx/CloudFlare)
- SSL/TLS certificates

### Monitoring Setup
1. Configure health check endpoints in load balancer
2. Set up alerting for error rates > 10%
3. Monitor response times > 5 seconds
4. Track memory usage > 80%

## AI Agent Integration

### MCP Client Setup
AI agents can connect to the MCP server using standard MCP client libraries:

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const client = new Client({
  name: "my-ai-agent",
  version: "1.0.0"
});

// Connect to MCP server
await client.connect({
  type: "http",
  baseUrl: "https://person.finderbee.ai"
});

// Use tools
const searchResult = await client.callTool("search_profiles", {
  query: "software engineer",
  skills: ["JavaScript"]
});
```

### Best Practices for AI Agents
1. **Respect Rate Limits**: Implement exponential backoff
2. **Handle Errors Gracefully**: Check error codes and retry appropriately
3. **Use Specific Queries**: More specific searches return better results
4. **Cache Results**: Cache profile data to reduce API calls
5. **Validate Inputs**: Ensure request data meets schema requirements

## Support

For technical support or questions about the MCP server infrastructure:

1. Check the health endpoint: `/api/mcp/health`
2. Review error logs for specific error codes
3. Verify rate limits aren't being exceeded
4. Ensure request format matches the schema

## Changelog

### v1.0.0 (2024-01-15)
- Initial MCP server infrastructure
- Core tools: search_profiles, get_profile, request_meeting
- Rate limiting and security middleware
- Monitoring and health checks
- Privacy-compliant profile filtering