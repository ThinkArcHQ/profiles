/**
 * Security Middleware for MCP Endpoints
 * 
 * Implements security measures for MCP server endpoints including
 * request validation, security headers, and abuse prevention.
 */

import { NextRequest } from 'next/server';

/**
 * Security configuration for MCP endpoints
 */
export const MCPSecurityConfig = {
  // Maximum request body size (1MB)
  maxBodySize: 1024 * 1024,
  
  // Maximum URL length
  maxUrlLength: 2048,
  
  // Allowed origins for CORS (empty means allow all)
  allowedOrigins: [] as string[],
  
  // Required headers for MCP requests
  requiredHeaders: ['content-type'],
  
  // Blocked user agents (basic bot protection)
  blockedUserAgents: [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
  ],
  
  // Suspicious patterns in requests
  suspiciousPatterns: [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
  ],
} as const;

/**
 * Security validation result
 */
export interface SecurityValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

/**
 * MCP Security validator
 */
export class MCPSecurityValidator {
  /**
   * Validate incoming MCP request for security issues
   */
  static async validateRequest(request: NextRequest): Promise<SecurityValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Check request method
    if (!['GET', 'POST'].includes(request.method)) {
      errors.push(`Method ${request.method} not allowed`);
      riskLevel = 'high';
    }

    // Check URL length
    if (request.url.length > MCPSecurityConfig.maxUrlLength) {
      errors.push('Request URL too long');
      riskLevel = 'medium';
    }

    // Check Content-Type for POST requests
    if (request.method === 'POST') {
      const contentType = request.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        errors.push('Invalid or missing Content-Type header');
        riskLevel = 'medium';
      }
    }

    // Check User-Agent
    const userAgent = request.headers.get('user-agent') || '';
    for (const pattern of MCPSecurityConfig.blockedUserAgents) {
      if (pattern.test(userAgent)) {
        warnings.push('Suspicious user agent detected');
        riskLevel = Math.max(riskLevel === 'low' ? 'medium' : riskLevel, 'medium') as 'medium' | 'high';
        break;
      }
    }

    // Check for suspicious patterns in URL
    for (const pattern of MCPSecurityConfig.suspiciousPatterns) {
      if (pattern.test(request.url)) {
        warnings.push('Suspicious pattern detected in URL');
        riskLevel = 'high';
        break;
      }
    }

    // Validate request headers
    for (const requiredHeader of MCPSecurityConfig.requiredHeaders) {
      if (request.method === 'POST' && !request.headers.get(requiredHeader)) {
        errors.push(`Missing required header: ${requiredHeader}`);
        riskLevel = 'medium';
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      riskLevel,
    };
  }

  /**
   * Validate request body for security issues
   */
  static async validateRequestBody(body: any): Promise<SecurityValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    if (!body || typeof body !== 'object') {
      return { isValid: true, errors, warnings, riskLevel };
    }

    // Check for suspicious patterns in string values
    const checkValue = (value: any, path: string = '') => {
      if (typeof value === 'string') {
        for (const pattern of MCPSecurityConfig.suspiciousPatterns) {
          if (pattern.test(value)) {
            warnings.push(`Suspicious pattern detected in ${path || 'request body'}`);
            riskLevel = Math.max(riskLevel === 'low' ? 'medium' : riskLevel, 'medium') as 'medium' | 'high';
            break;
          }
        }
        
        // Check for excessively long strings
        if (value.length > 10000) {
          warnings.push(`Unusually long string in ${path || 'request body'}`);
          riskLevel = Math.max(riskLevel === 'low' ? 'medium' : riskLevel, 'medium') as 'medium' | 'high';
        }
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          checkValue(item, `${path}[${index}]`);
        });
      } else if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([key, val]) => {
          checkValue(val, path ? `${path}.${key}` : key);
        });
      }
    };

    checkValue(body);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      riskLevel,
    };
  }

  /**
   * Create security headers for MCP responses
   */
  static createSecurityHeaders(): Record<string, string> {
    return {
      // Prevent MIME type sniffing
      'X-Content-Type-Options': 'nosniff',
      
      // Prevent clickjacking
      'X-Frame-Options': 'DENY',
      
      // XSS protection
      'X-XSS-Protection': '1; mode=block',
      
      // Referrer policy
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      
      // Content Security Policy for API responses
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none';",
      
      // Indicate this is an API endpoint
      'X-API-Type': 'MCP',
      
      // Cache control for API responses
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };
  }

  /**
   * Create CORS headers for MCP endpoints
   */
  static createCORSHeaders(origin?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400', // 24 hours
    };

    // Handle CORS origin
    if (MCPSecurityConfig.allowedOrigins.length === 0) {
      // Allow all origins for MCP (AI agents from various sources)
      headers['Access-Control-Allow-Origin'] = '*';
    } else if (origin && MCPSecurityConfig.allowedOrigins.includes(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Access-Control-Allow-Credentials'] = 'true';
    }

    return headers;
  }

  /**
   * Log security events for monitoring
   */
  static logSecurityEvent(
    event: 'blocked' | 'warning' | 'suspicious',
    details: {
      ip?: string;
      userAgent?: string;
      url?: string;
      reason?: string;
      riskLevel?: string;
    }
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      source: 'mcp-security',
    };

    if (event === 'blocked') {
      console.warn('MCP Security: Request blocked', logEntry);
    } else if (event === 'warning') {
      console.warn('MCP Security: Warning', logEntry);
    } else {
      console.info('MCP Security: Suspicious activity', logEntry);
    }

    // In production, this should be sent to a proper logging service
    // like CloudWatch, Datadog, or similar
  }
}

/**
 * Extract client information for security logging
 */
export function extractClientInfo(request: NextRequest): {
  ip: string;
  userAgent: string;
  origin?: string;
} {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  const ip = forwarded?.split(',')[0]?.trim() || 
             realIp || 
             cfConnectingIp || 
             'unknown';
  
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const origin = request.headers.get('origin') || undefined;

  return { ip, userAgent, origin };
}

/**
 * Create security error response
 */
export function createSecurityError(
  reason: string,
  code: string = 'SECURITY_VIOLATION'
) {
  return {
    error: 'Request blocked for security reasons',
    code,
    details: {
      reason,
      timestamp: new Date().toISOString(),
    },
  };
}