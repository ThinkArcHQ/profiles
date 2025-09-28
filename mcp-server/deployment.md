# Deployment Guide for Persons FinderBee MCP Server

## Overview

This document outlines the deployment strategy for the Persons FinderBee MCP Server to the `person.finderbee.ai` domain.

## Architecture

The MCP server will be deployed as a standalone Node.js application that:
- Runs on `person.finderbee.ai` domain
- Communicates with AI agents via stdio/HTTP transport
- Connects to the main application database or API
- Handles rate limiting and security

## Deployment Options

### Option 1: Direct Database Access (Recommended)

Deploy the MCP server with direct database access for optimal performance:

```typescript
// Update services to use direct database queries
import { drizzle } from 'drizzle-orm/neon-http';
import { profiles, appointments } from './schema';

const db = drizzle(process.env.DATABASE_URL);

// Example: Direct database query in ProfileService
async getProfileBySlug(slug: string): Promise<MCPProfile | null> {
  const result = await db
    .select({
      slug: profiles.slug,
      name: profiles.name,
      bio: profiles.bio,
      skills: profiles.skills,
      availableFor: profiles.availableFor,
      isPublic: profiles.isPublic,
      linkedinUrl: profiles.linkedinUrl,
      otherLinks: profiles.otherLinks
    })
    .from(profiles)
    .where(and(
      eq(profiles.slug, slug),
      eq(profiles.isPublic, true),
      eq(profiles.isActive, true)
    ))
    .limit(1);

  return result[0] ? this.transformToMCPProfile(result[0]) : null;
}
```

### Option 2: API Gateway Pattern

Deploy the MCP server to communicate with the main application via API:

```typescript
// Services make HTTP requests to persons.finderbee.ai/api
const response = await fetch(`${this.baseUrl}/profiles/slug/${slug}`);
```

## Environment Configuration

### Production Environment Variables

```bash
# Database (Option 1)
DATABASE_URL=postgresql://user:pass@db.person.finderbee.ai:5432/persons_finderbee

# API Gateway (Option 2)
API_BASE_URL=https://persons.finderbee.ai/api

# Server Configuration
MCP_BASE_URL=https://person.finderbee.ai
MAX_REQUESTS_PER_MINUTE=100
ENABLE_LOGGING=true
NODE_ENV=production

# Security
MCP_API_KEY=secure-api-key-for-authentication
```

## Infrastructure Requirements

### Server Specifications
- **CPU**: 2+ cores
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 20GB SSD
- **Network**: High-speed connection for AI agent communication

### Dependencies
- Node.js 18+
- PostgreSQL client libraries (if using direct database access)
- SSL certificates for HTTPS
- Process manager (PM2 or similar)

## Deployment Steps

### 1. Server Setup

```bash
# Clone and build
git clone <repository>
cd mcp-server
npm install
npm run build

# Set up environment
cp .env.example .env
# Edit .env with production values

# Install PM2 for process management
npm install -g pm2
```

### 2. Process Management

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'persons-finderbee-mcp',
    script: 'dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### 3. Reverse Proxy Configuration

Nginx configuration for `person.finderbee.ai`:

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name person.finderbee.ai;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. SSL Certificate

```bash
# Using Let's Encrypt
certbot --nginx -d person.finderbee.ai
```

### 5. Monitoring and Logging

Set up monitoring with:
- Application logs via Winston or similar
- System monitoring with Prometheus/Grafana
- Error tracking with Sentry
- Uptime monitoring

## Security Considerations

### Rate Limiting
- Implement per-IP rate limiting
- Add API key authentication for production
- Monitor for abuse patterns

### Data Protection
- Ensure no sensitive data (emails) in logs
- Implement proper error handling to prevent information leakage
- Regular security audits

### Network Security
- Firewall configuration
- DDoS protection
- Regular security updates

## Monitoring and Maintenance

### Health Checks
```typescript
// Add health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  });
});
```

### Logging Strategy
- Structured JSON logging
- Log rotation
- Error alerting
- Performance metrics

### Backup Strategy
- Database backups (if using direct access)
- Configuration backups
- Deployment rollback procedures

## Testing in Production

### Load Testing
```bash
# Test with multiple concurrent AI agents
npm install -g artillery
artillery quick --count 10 --num 100 https://person.finderbee.ai/health
```

### Integration Testing
- Test all MCP tools with real AI agents
- Verify privacy controls work correctly
- Test error handling and rate limiting

## Rollback Procedures

1. Keep previous version available
2. Database migration rollback scripts
3. Quick deployment switching
4. Monitoring for issues post-deployment

## Future Enhancements

- WebSocket support for real-time communication
- Advanced caching strategies
- Multi-region deployment
- Enhanced security features
- Performance optimizations