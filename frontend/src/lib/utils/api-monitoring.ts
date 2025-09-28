/**
 * API Monitoring and Logging Utilities
 * 
 * Provides comprehensive logging, monitoring, and analytics for API endpoints
 * including request/response tracking, error monitoring, and performance metrics.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Request log entry interface
 */
export interface RequestLogEntry {
  requestId: string;
  timestamp: string;
  method: string;
  url: string;
  endpoint: string;
  userAgent?: string;
  ip?: string;
  userId?: string;
  requestSize?: number;
  responseStatus?: number;
  responseSize?: number;
  duration?: number;
  error?: string;
  errorCode?: string;
  metadata?: Record<string, any>;
}

/**
 * Error log entry interface
 */
export interface ErrorLogEntry {
  errorId: string;
  timestamp: string;
  endpoint: string;
  method: string;
  errorType: 'validation' | 'authentication' | 'authorization' | 'database' | 'external' | 'internal';
  errorCode: string;
  errorMessage: string;
  stackTrace?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  requestData?: any;
  context?: Record<string, any>;
}

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  endpoint: string;
  method: string;
  averageResponseTime: number;
  requestCount: number;
  errorCount: number;
  errorRate: number;
  slowRequestCount: number; // Requests > 1000ms
  timestamp: string;
}

/**
 * API monitoring configuration
 */
export interface MonitoringConfig {
  enableRequestLogging: boolean;
  enableErrorLogging: boolean;
  enablePerformanceTracking: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  slowRequestThreshold: number; // milliseconds
  maxLogEntries: number;
  sensitiveFields: string[]; // Fields to redact from logs
}

/**
 * Default monitoring configuration
 */
const DEFAULT_CONFIG: MonitoringConfig = {
  enableRequestLogging: process.env.NODE_ENV === 'development',
  enableErrorLogging: true,
  enablePerformanceTracking: true,
  logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  slowRequestThreshold: 1000,
  maxLogEntries: 1000,
  sensitiveFields: ['password', 'token', 'email', 'phone', 'ssn', 'credit_card'],
};

/**
 * In-memory storage for logs (in production, this should be replaced with a proper logging service)
 */
class LogStorage {
  private requestLogs: RequestLogEntry[] = [];
  private errorLogs: ErrorLogEntry[] = [];
  private performanceMetrics: Map<string, PerformanceMetrics> = new Map();

  addRequestLog(entry: RequestLogEntry): void {
    this.requestLogs.push(entry);
    
    // Keep only the last N entries to prevent memory issues
    if (this.requestLogs.length > DEFAULT_CONFIG.maxLogEntries) {
      this.requestLogs = this.requestLogs.slice(-DEFAULT_CONFIG.maxLogEntries);
    }
  }

  addErrorLog(entry: ErrorLogEntry): void {
    this.errorLogs.push(entry);
    
    // Keep only the last N entries to prevent memory issues
    if (this.errorLogs.length > DEFAULT_CONFIG.maxLogEntries) {
      this.errorLogs = this.errorLogs.slice(-DEFAULT_CONFIG.maxLogEntries);
    }
  }

  updatePerformanceMetrics(endpoint: string, method: string, duration: number, isError: boolean): void {
    const key = `${method}:${endpoint}`;
    const existing = this.performanceMetrics.get(key);

    if (existing) {
      const newRequestCount = existing.requestCount + 1;
      const newErrorCount = existing.errorCount + (isError ? 1 : 0);
      const newAverageResponseTime = 
        (existing.averageResponseTime * existing.requestCount + duration) / newRequestCount;
      
      this.performanceMetrics.set(key, {
        ...existing,
        averageResponseTime: newAverageResponseTime,
        requestCount: newRequestCount,
        errorCount: newErrorCount,
        errorRate: (newErrorCount / newRequestCount) * 100,
        slowRequestCount: existing.slowRequestCount + (duration > DEFAULT_CONFIG.slowRequestThreshold ? 1 : 0),
        timestamp: new Date().toISOString(),
      });
    } else {
      this.performanceMetrics.set(key, {
        endpoint,
        method,
        averageResponseTime: duration,
        requestCount: 1,
        errorCount: isError ? 1 : 0,
        errorRate: isError ? 100 : 0,
        slowRequestCount: duration > DEFAULT_CONFIG.slowRequestThreshold ? 1 : 0,
        timestamp: new Date().toISOString(),
      });
    }
  }

  getRequestLogs(limit?: number): RequestLogEntry[] {
    return limit ? this.requestLogs.slice(-limit) : this.requestLogs;
  }

  getErrorLogs(limit?: number): ErrorLogEntry[] {
    return limit ? this.errorLogs.slice(-limit) : this.errorLogs;
  }

  getPerformanceMetrics(): PerformanceMetrics[] {
    return Array.from(this.performanceMetrics.values());
  }

  getMetricsForEndpoint(endpoint: string, method?: string): PerformanceMetrics[] {
    return Array.from(this.performanceMetrics.values()).filter(
      metric => metric.endpoint === endpoint && (!method || metric.method === method)
    );
  }
}

// Global log storage instance
const logStorage = new LogStorage();

/**
 * API Monitor class
 */
export class APIMonitor {
  private static config: MonitoringConfig = DEFAULT_CONFIG;

  /**
   * Configure monitoring settings
   */
  static configure(config: Partial<MonitoringConfig>): void {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate a unique request ID
   */
  static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a unique error ID
   */
  static generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract client information from request
   */
  static extractClientInfo(request: NextRequest): {
    ip?: string;
    userAgent?: string;
    userId?: string;
  } {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Extract user ID from auth headers if available
    const authHeader = request.headers.get('authorization');
    let userId: string | undefined;
    
    // This would need to be implemented based on your auth system
    // For now, we'll leave it undefined
    
    return { ip, userAgent, userId };
  }

  /**
   * Calculate request/response size
   */
  static calculateSize(data: any): number {
    if (!data) return 0;
    
    try {
      if (typeof data === 'string') {
        return new Blob([data]).size;
      }
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return 0;
    }
  }

  /**
   * Redact sensitive information from data
   */
  static redactSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const redacted = { ...data };
    
    for (const field of this.config.sensitiveFields) {
      if (redacted[field]) {
        redacted[field] = '[REDACTED]';
      }
    }

    return redacted;
  }

  /**
   * Start request monitoring
   */
  static startRequest(
    request: NextRequest,
    endpoint: string
  ): {
    requestId: string;
    startTime: number;
    clientInfo: { ip?: string; userAgent?: string; userId?: string };
  } {
    const requestId = this.generateRequestId();
    const startTime = Date.now();
    const clientInfo = this.extractClientInfo(request);

    if (this.config.enableRequestLogging && this.config.logLevel === 'debug') {
      console.log(`[${requestId}] Starting ${request.method} ${endpoint}`, {
        timestamp: new Date().toISOString(),
        ...clientInfo,
      });
    }

    return { requestId, startTime, clientInfo };
  }

  /**
   * End request monitoring
   */
  static endRequest(
    requestId: string,
    startTime: number,
    request: NextRequest,
    response: NextResponse,
    endpoint: string,
    clientInfo: { ip?: string; userAgent?: string; userId?: string },
    error?: { code: string; message: string }
  ): void {
    const endTime = Date.now();
    const duration = endTime - startTime;
    const isError = response.status >= 400;
    const isSlow = duration > this.config.slowRequestThreshold;

    // Create request log entry
    if (this.config.enableRequestLogging) {
      const logEntry: RequestLogEntry = {
        requestId,
        timestamp: new Date().toISOString(),
        method: request.method,
        url: request.url,
        endpoint,
        userAgent: clientInfo.userAgent,
        ip: clientInfo.ip,
        userId: clientInfo.userId,
        requestSize: this.calculateSize(request.body),
        responseStatus: response.status,
        responseSize: this.calculateSize(response.body),
        duration,
        error: error?.message,
        errorCode: error?.code,
      };

      logStorage.addRequestLog(logEntry);

      // Console logging based on level
      if (isError && this.config.logLevel !== 'error') {
        console.error(`[${requestId}] ${request.method} ${endpoint} - ${response.status} (${duration}ms)`, {
          error: error?.message,
          errorCode: error?.code,
        });
      } else if (isSlow && ['debug', 'info', 'warn'].includes(this.config.logLevel)) {
        console.warn(`[${requestId}] SLOW ${request.method} ${endpoint} - ${response.status} (${duration}ms)`);
      } else if (this.config.logLevel === 'debug') {
        console.log(`[${requestId}] ${request.method} ${endpoint} - ${response.status} (${duration}ms)`);
      }
    }

    // Update performance metrics
    if (this.config.enablePerformanceTracking) {
      logStorage.updatePerformanceMetrics(endpoint, request.method, duration, isError);
    }
  }

  /**
   * Log API errors
   */
  static logError(
    endpoint: string,
    method: string,
    error: Error | string,
    errorType: ErrorLogEntry['errorType'],
    errorCode: string,
    context?: {
      userId?: string;
      ip?: string;
      userAgent?: string;
      requestData?: any;
      metadata?: Record<string, any>;
    }
  ): string {
    const errorId = this.generateErrorId();
    const errorMessage = error instanceof Error ? error.message : error;
    const stackTrace = error instanceof Error ? error.stack : undefined;

    if (this.config.enableErrorLogging) {
      const logEntry: ErrorLogEntry = {
        errorId,
        timestamp: new Date().toISOString(),
        endpoint,
        method,
        errorType,
        errorCode,
        errorMessage,
        stackTrace,
        userId: context?.userId,
        ip: context?.ip,
        userAgent: context?.userAgent,
        requestData: context?.requestData ? this.redactSensitiveData(context.requestData) : undefined,
        context: context?.metadata,
      };

      logStorage.addErrorLog(logEntry);

      // Console error logging
      console.error(`[${errorId}] API Error in ${method} ${endpoint}:`, {
        errorType,
        errorCode,
        errorMessage,
        stackTrace: this.config.logLevel === 'debug' ? stackTrace : undefined,
        context: context?.metadata,
      });
    }

    return errorId;
  }

  /**
   * Get request logs
   */
  static getRequestLogs(limit?: number): RequestLogEntry[] {
    return logStorage.getRequestLogs(limit);
  }

  /**
   * Get error logs
   */
  static getErrorLogs(limit?: number): ErrorLogEntry[] {
    return logStorage.getErrorLogs(limit);
  }

  /**
   * Get performance metrics
   */
  static getPerformanceMetrics(): PerformanceMetrics[] {
    return logStorage.getPerformanceMetrics();
  }

  /**
   * Get metrics for specific endpoint
   */
  static getEndpointMetrics(endpoint: string, method?: string): PerformanceMetrics[] {
    return logStorage.getMetricsForEndpoint(endpoint, method);
  }

  /**
   * Get system health summary
   */
  static getHealthSummary(): {
    totalRequests: number;
    totalErrors: number;
    overallErrorRate: number;
    averageResponseTime: number;
    slowRequestCount: number;
    topErrorEndpoints: Array<{ endpoint: string; method: string; errorCount: number }>;
    topSlowEndpoints: Array<{ endpoint: string; method: string; averageResponseTime: number }>;
  } {
    const metrics = this.getPerformanceMetrics();
    
    const totalRequests = metrics.reduce((sum, m) => sum + m.requestCount, 0);
    const totalErrors = metrics.reduce((sum, m) => sum + m.errorCount, 0);
    const totalResponseTime = metrics.reduce((sum, m) => sum + (m.averageResponseTime * m.requestCount), 0);
    const totalSlowRequests = metrics.reduce((sum, m) => sum + m.slowRequestCount, 0);

    const overallErrorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
    const averageResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;

    const topErrorEndpoints = metrics
      .filter(m => m.errorCount > 0)
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, 5)
      .map(m => ({
        endpoint: m.endpoint,
        method: m.method,
        errorCount: m.errorCount,
      }));

    const topSlowEndpoints = metrics
      .sort((a, b) => b.averageResponseTime - a.averageResponseTime)
      .slice(0, 5)
      .map(m => ({
        endpoint: m.endpoint,
        method: m.method,
        averageResponseTime: m.averageResponseTime,
      }));

    return {
      totalRequests,
      totalErrors,
      overallErrorRate,
      averageResponseTime,
      slowRequestCount: totalSlowRequests,
      topErrorEndpoints,
      topSlowEndpoints,
    };
  }

  /**
   * Clear all logs and metrics (useful for testing)
   */
  static clearLogs(): void {
    logStorage['requestLogs'] = [];
    logStorage['errorLogs'] = [];
    logStorage['performanceMetrics'].clear();
  }
}

/**
 * Monitoring middleware wrapper
 */
export function withMonitoring(
  endpoint: string,
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const { requestId, startTime, clientInfo } = APIMonitor.startRequest(request, endpoint);
    
    try {
      const response = await handler(request, ...args);
      
      APIMonitor.endRequest(
        requestId,
        startTime,
        request,
        response,
        endpoint,
        clientInfo
      );
      
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorResponse = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );

      APIMonitor.logError(
        endpoint,
        request.method,
        error as Error,
        'internal',
        'INTERNAL_ERROR',
        {
          ...clientInfo,
          metadata: { requestId },
        }
      );

      APIMonitor.endRequest(
        requestId,
        startTime,
        request,
        errorResponse,
        endpoint,
        clientInfo,
        { code: 'INTERNAL_ERROR', message: errorMessage }
      );

      return errorResponse;
    }
  };
}