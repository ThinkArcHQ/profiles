/**
 * MCP Server Configuration
 * 
 * Configuration settings for the MCP server infrastructure including
 * domain settings, security policies, and operational parameters.
 */

/**
 * MCP Server Domain Configuration
 */
export const MCPDomainConfig = {
  // Main website domain
  mainDomain: process.env.NEXT_PUBLIC_URL || 'https://persons.finderbee.ai',
  
  // MCP server domain (for AI agent connections)
  mcpDomain: process.env.MCP_DOMAIN || 'https://person.finderbee.ai',
  
  // API base path for MCP endpoints
  apiBasePath: '/api/mcp',
  
  // Health check endpoint
  healthEndpoint: '/api/mcp/health',
} as const;

/**
 * MCP Server Operational Configuration
 */
export const MCPServerConfig = {
  // Server identification
  name: 'persons-finderbee-mcp',
  version: '1.0.0',
  description: 'MCP server for Persons FinderBee - Universal AI-accessible directory',
  
  // Transport configuration
  transport: {
    type: 'http' as const,
    port: process.env.MCP_PORT ? parseInt(process.env.MCP_PORT) : 3000,
    host: process.env.MCP_HOST || '0.0.0.0',
  },
  
  // Request limits
  limits: {
    maxRequestSize: 1024 * 1024, // 1MB
    maxResponseSize: 5 * 1024 * 1024, // 5MB
    requestTimeout: 30000, // 30 seconds
    maxConcurrentRequests: 100,
  },
  
  // Logging configuration
  logging: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    enableRequestLogging: true,
    enableErrorLogging: true,
    enablePerformanceLogging: true,
    logRetentionDays: 30,
  },
  
  // Monitoring configuration
  monitoring: {
    enableHealthChecks: true,
    healthCheckInterval: 60000, // 1 minute
    metricsRetentionHours: 72, // 3 days
    alertThresholds: {
      errorRate: 10, // 10% error rate
      responseTime: 5000, // 5 seconds
      memoryUsage: 80, // 80% memory usage
    },
  },
  
  // Security configuration
  security: {
    enableCORS: true,
    corsOrigins: process.env.NODE_ENV === 'production' 
      ? ['https://persons.finderbee.ai', 'https://person.finderbee.ai']
      : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    enableRateLimiting: true,
    enableSecurityHeaders: true,
    enableRequestValidation: true,
    trustProxy: true, // For deployment behind reverse proxy
  },
} as const;

/**
 * MCP Tool Definitions
 */
export const MCPToolDefinitions = {
  search_profiles: {
    name: 'search_profiles',
    description: 'Search for people profiles by skills, availability, or keywords',
    endpoint: '/api/mcp/search',
    methods: ['POST', 'GET'],
    rateLimitTier: 'search',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query for names or bio content',
          maxLength: 200,
        },
        skills: {
          type: 'array',
          items: { type: 'string', maxLength: 100 },
          maxItems: 10,
          description: 'Array of skills to filter by',
        },
        availableFor: {
          type: 'array',
          items: { type: 'string', enum: ['meetings', 'quotes', 'appointments'] },
          description: 'Types of requests the person accepts',
        },
        limit: {
          type: 'number',
          minimum: 1,
          maximum: 50,
          default: 10,
          description: 'Maximum number of results to return',
        },
        offset: {
          type: 'number',
          minimum: 0,
          default: 0,
          description: 'Number of results to skip for pagination',
        },
      },
    },
  },
  
  get_profile: {
    name: 'get_profile',
    description: 'Get detailed information about a person by their profile slug',
    endpoint: '/api/mcp/get-profile',
    methods: ['POST', 'GET'],
    rateLimitTier: 'getProfile',
    inputSchema: {
      type: 'object',
      properties: {
        profileSlug: {
          type: 'string',
          pattern: '^[a-z0-9-]+$',
          minLength: 3,
          maxLength: 50,
          description: 'Unique slug identifier for the profile',
        },
      },
      required: ['profileSlug'],
    },
  },
  
  request_meeting: {
    name: 'request_meeting',
    description: 'Request a meeting with a person by their profile slug',
    endpoint: '/api/mcp/request-meeting',
    methods: ['POST'],
    rateLimitTier: 'requestMeeting',
    inputSchema: {
      type: 'object',
      properties: {
        profileSlug: {
          type: 'string',
          pattern: '^[a-z0-9-]+$',
          minLength: 3,
          maxLength: 50,
          description: 'Unique slug identifier for the profile',
        },
        requesterName: {
          type: 'string',
          minLength: 2,
          maxLength: 255,
          description: 'Name of the person requesting the meeting',
        },
        requesterEmail: {
          type: 'string',
          format: 'email',
          maxLength: 255,
          description: 'Email address of the requester',
        },
        message: {
          type: 'string',
          minLength: 10,
          maxLength: 2000,
          description: 'Message explaining the meeting request',
        },
        preferredTime: {
          type: 'string',
          format: 'date-time',
          description: 'Preferred meeting time in ISO 8601 format',
        },
        requestType: {
          type: 'string',
          enum: ['meeting', 'quote', 'appointment'],
          description: 'Type of request being made',
        },
      },
      required: ['profileSlug', 'requesterName', 'requesterEmail', 'message', 'requestType'],
    },
  },
} as const;

/**
 * Environment-specific configuration
 */
export const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  const baseConfig = {
    development: {
      enableDebugLogging: true,
      enableDetailedErrors: true,
      enableCORS: true,
      corsOrigins: ['*'],
      rateLimitMultiplier: 2, // More generous rate limits in dev
    },
    
    production: {
      enableDebugLogging: false,
      enableDetailedErrors: false,
      enableCORS: true,
      corsOrigins: [
        'https://persons.finderbee.ai',
        'https://person.finderbee.ai',
      ],
      rateLimitMultiplier: 1,
    },
    
    test: {
      enableDebugLogging: false,
      enableDetailedErrors: true,
      enableCORS: false,
      corsOrigins: [],
      rateLimitMultiplier: 10, // Very generous for testing
    },
  };
  
  return baseConfig[env as keyof typeof baseConfig] || baseConfig.development;
};

/**
 * Validate MCP server configuration
 */
export function validateMCPConfig(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check required environment variables
  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL environment variable is required');
  }
  
  if (!process.env.NEXT_PUBLIC_URL) {
    warnings.push('NEXT_PUBLIC_URL not set, using default localhost');
  }
  
  // Validate domain configuration
  try {
    new URL(MCPDomainConfig.mainDomain);
  } catch {
    errors.push('Invalid main domain URL');
  }
  
  try {
    new URL(MCPDomainConfig.mcpDomain);
  } catch {
    errors.push('Invalid MCP domain URL');
  }
  
  // Check port configuration
  if (MCPServerConfig.transport.port < 1 || MCPServerConfig.transport.port > 65535) {
    errors.push('Invalid port number');
  }
  
  // Validate rate limit configuration
  if (MCPServerConfig.limits.maxRequestSize < 1024) {
    warnings.push('Very small max request size may cause issues');
  }
  
  if (MCPServerConfig.limits.requestTimeout < 1000) {
    warnings.push('Very short request timeout may cause issues');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get MCP server info for health checks and discovery
 */
export function getMCPServerInfo() {
  return {
    name: MCPServerConfig.name,
    version: MCPServerConfig.version,
    description: MCPServerConfig.description,
    domain: MCPDomainConfig.mcpDomain,
    endpoints: {
      health: `${MCPDomainConfig.mcpDomain}${MCPDomainConfig.healthEndpoint}`,
      api: `${MCPDomainConfig.mcpDomain}${MCPDomainConfig.apiBasePath}`,
    },
    tools: Object.keys(MCPToolDefinitions),
    capabilities: {
      search: true,
      profiles: true,
      meetings: true,
      rateLimiting: MCPServerConfig.security.enableRateLimiting,
      cors: MCPServerConfig.security.enableCORS,
    },
    limits: MCPServerConfig.limits,
    transport: MCPServerConfig.transport.type,
  };
}