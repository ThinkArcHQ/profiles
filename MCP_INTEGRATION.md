# Model Context Protocol (MCP) Integration

This document describes how AI agents can integrate with the Profiles platform using the Model Context Protocol.

## MCP Endpoints

### Get All Profiles
```
GET /mcp/profiles
```

Returns a simplified list of all profiles suitable for AI agent consumption:

```json
{
  "profiles": [
    {
      "id": "uuid",
      "name": "John Doe",
      "skills": ["Python", "AI", "Machine Learning"],
      "bio": "Description of expertise and services",
      "available_for": ["appointments", "quotes", "meetings"]
    }
  ]
}
```

### Request Connection
```
POST /appointments
```

AI agents can request connections on behalf of users:

```json
{
  "profile_id": "profile-uuid",
  "requester_name": "Agent User",
  "requester_email": "user@example.com",
  "message": "Connection request message",
  "request_type": "appointments|quotes|meetings",
  "preferred_time": "Optional timing preference"
}
```

## Integration Examples

### Finding Experts
AI agents can search for relevant profiles by calling `/mcp/profiles` and filtering by skills or bio content.

### Scheduling Meetings
1. Agent discovers relevant profiles via `/mcp/profiles`
2. Agent presents options to user
3. Agent submits connection request via `/appointments` endpoint

### Quote Requests
1. Agent identifies profiles with "quotes" in their `available_for` array
2. Agent collects project requirements from user
3. Agent submits quote request with detailed project information

## Response Handling

All successful requests return JSON responses. Connection requests return a `request_id` for tracking purposes.

## Rate Limiting

Currently no rate limiting is implemented, but production deployments should implement appropriate rate limiting for API endpoints.