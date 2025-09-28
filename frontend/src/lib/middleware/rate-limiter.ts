/**
 * Rate Limiting Middleware for MCP Endpoints
 * 
 * Implements rate limiting to prevent abuse of MCP endpoints while allowing
 * legitimate AI agent usage.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

/**
 * In-memory rate limiter for MCP endpoints
 * In production, this should be replaced with Redis or similar distributed cache
 */
class MCPRateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Check if request should be rate limited
   */
  async checkLimit(identifier: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    totalHits: number;
  }> {
    const now = Date.now();
    const key = this.getKey(identifier);
    
    let entry = this.store.get(key);
    
    // Create new entry if doesn't exist or window has expired
    if (!entry || now >= entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
      };
    }
    
    // Increment counter
    entry.count++;
    this.store.set(key, entry);
    
    const allowed = entry.count <= this.config.maxRequests;
    const remaining = Math.max(0, this.config.maxRequests - entry.count);
    
    return {
      allowed,
      remaining,
      resetTime: entry.resetTime,
      totalHits: entry.count,
    };
  }

  /**
   * Record a request (for tracking purposes)
   */
  async recordRequest(identifier: string, success: boolean): Promise<void> {
    // Skip recording based on config
    if (success && this.config.skipSuccessfulRequests) return;
    if (!success && this.config.skipFailedRequests) return;
    
    // Request is already recorded in checkLimit, this is for additional tracking
    const key = this.getKey(identifier);
    const entry = this.store.get(key);
    if (entry) {
      // Could add additional metadata here for monitoring
    }
  }

  /**
   * Get rate limit info without incrementing counter
   */
  async getInfo(identifier: string): Promise<{
    remaining: number;
    resetTime: number;
    totalHits: number;
  }> {
    const key = this.getKey(identifier);
    const entry = this.store.get(key);
    const now = Date.now();
    
    if (!entry || now >= entry.resetTime) {
      return {
        remaining: this.config.maxRequests,
        resetTime: now + this.config.windowMs,
        totalHits: 0,
      };
    }
    
    return {
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime: entry.resetTime,
      totalHits: entry.count,
    };
  }

  private getKey(identifier: string): string {
    return `mcp:${identifier}`;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * Rate limit configurations for different MCP endpoints
 */
export const MCPRateLimitConfigs = {
  // Search endpoint - more generous limits for discovery
  search: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
    skipSuccessfulRequests: false,
    skipFailedRequests: true,
  },
  
  // Profile retrieval - moderate limits
  getProfile: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
    skipSuccessfulRequests: false,
    skipFailedRequests: true,
  },
  
  // Meeting requests - stricter limits to prevent spam
  requestMeeting: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 requests per minute
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },
} as const;

/**
 * Rate limiter instances for each endpoint
 */
export const MCPRateLimiters = {
  search: new MCPRateLimiter(MCPRateLimitConfigs.search),
  getProfile: new MCPRateLimiter(MCPRateLimitConfigs.getProfile),
  requestMeeting: new MCPRateLimiter(MCPRateLimitConfigs.requestMeeting),
} as const;

/**
 * Extract client identifier from request for rate limiting
 */
export function getClientIdentifier(request: Request): string {
  // Try to get client IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  // Use the first available IP
  const clientIp = forwarded?.split(',')[0]?.trim() || 
                   realIp || 
                   cfConnectingIp || 
                   'unknown';
  
  // For additional security, could also consider User-Agent or other headers
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // Create a composite identifier
  return `${clientIp}:${userAgent.substring(0, 50)}`;
}

/**
 * Rate limiting response headers
 */
export function createRateLimitHeaders(result: {
  remaining: number;
  resetTime: number;
  totalHits: number;
}): Record<string, string> {
  return {
    'X-RateLimit-Limit': MCPRateLimitConfigs.search.maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
    'X-RateLimit-Used': result.totalHits.toString(),
  };
}

/**
 * Rate limit error response
 */
export function createRateLimitError(resetTime: number) {
  const resetInSeconds = Math.ceil((resetTime - Date.now()) / 1000);
  
  return {
    error: 'Rate limit exceeded',
    code: 'RATE_LIMIT_EXCEEDED',
    details: {
      message: 'Too many requests. Please try again later.',
      retryAfter: resetInSeconds,
      resetTime: new Date(resetTime).toISOString(),
    },
  };
}