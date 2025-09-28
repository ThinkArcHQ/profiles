# Persons FinderBee MCP Server

A Model Context Protocol (MCP) server that enables AI agents to discover and connect with people through the Persons FinderBee platform.

## Overview

This MCP server provides AI agents with tools to:
- Search for people by skills, availability, and keywords
- Request meetings with individuals
- Get detailed profile information

The server respects privacy controls and only exposes public profiles to AI agents.

## Domain Configuration

- **MCP Server**: `persons.finderbee.ai`
- **Main Website**: `persons.finderbee.ai`

## Available Tools

### 1. search_profiles

Search for people profiles by various criteria.

**Parameters:**
- `query` (optional): Search query to match against names and bios
- `skills` (optional): Array of skills to filter by
- `availableFor` (optional): Filter by availability type ("meetings", "quotes")
- `limit` (optional): Maximum results to return (1-50, default: 10)
- `offset` (optional): Number of results to skip (default: 0)

**Example:**
```json
{
  "query": "software engineer",
  "skills": ["JavaScript", "React"],
  "availableFor": ["meetings"],
  "limit": 5
}
```

### 2. request_meeting

Request a meeting with a person by their profile slug.

**Parameters:**
- `profileSlug` (required): The unique slug identifier for the person
- `requesterName` (required): Name of the requester
- `requesterEmail` (required): Email for meeting coordination
- `message` (required): Purpose of the meeting request
- `preferredTime` (optional): Preferred meeting time (ISO 8601 or natural language)
- `requestType` (required): "meeting" or "quote"

**Example:**
```json
{
  "profileSlug": "john-doe",
  "requesterName": "AI Assistant",
  "requesterEmail": "ai@example.com",
  "message": "I'd like to discuss your expertise in React development",
  "requestType": "meeting"
}
```

### 3. get_profile

Get detailed information about a person by their profile slug.

**Parameters:**
- `profileSlug` (required): The unique slug identifier for the person

**Example:**
```json
{
  "profileSlug": "john-doe"
}
```

## Installation

```bash
# Install dependencies
npm install

# Build the server
npm run build

# Run in development mode
npm run dev

# Run in production
npm start
```

## Configuration

Set environment variables:

```bash
# API base URL for the main website
API_BASE_URL=https://persons.finderbee.ai/api

# MCP server base URL
MCP_BASE_URL=https://person.finderbee.ai

# Rate limiting
MAX_REQUESTS_PER_MINUTE=60

# Logging
ENABLE_LOGGING=true
```

## Development

### Project Structure

```
src/
├── index.ts              # Main server entry point
├── types/                # TypeScript type definitions
├── services/             # Business logic services
│   ├── profile-service.ts
│   ├── search-service.ts
│   └── meeting-service.ts
├── utils/                # Utility functions
│   ├── validation.ts
│   └── error-handling.ts
└── config/               # Configuration
    └── server-config.ts
```

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

## Usage with AI Agents

AI agents can connect to this MCP server using the official MCP SDK:

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

const client = new Client({
  name: "my-ai-agent",
  version: "1.0.0"
});

// Connect to the server
await client.connect(transport);

// Search for profiles
const searchResult = await client.request({
  method: "tools/call",
  params: {
    name: "search_profiles",
    arguments: {
      query: "software engineer",
      skills: ["JavaScript"],
      limit: 10
    }
  }
});
```

## Privacy and Security

- Only public profiles are returned in search results
- Email addresses are never exposed to AI agents
- Rate limiting prevents abuse
- All requests are validated and sanitized
- Profile access is logged for audit purposes

## Error Handling

The server returns structured error responses:

```json
{
  "error": true,
  "code": "PROFILE_NOT_FOUND",
  "message": "Profile not found or not public: john-doe"
}
```

Common error codes:
- `VALIDATION_ERROR`: Invalid input parameters
- `PROFILE_NOT_FOUND`: Profile doesn't exist or isn't public
- `REQUEST_TYPE_NOT_ACCEPTED`: Profile doesn't accept the requested type
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error

## Contributing

This is a template implementation. To complete the MCP server:

1. Replace template API calls with actual database queries
2. Implement proper authentication and rate limiting
3. Add comprehensive logging and monitoring
4. Set up deployment infrastructure
5. Add integration tests

## License

MIT License - see LICENSE file for details.