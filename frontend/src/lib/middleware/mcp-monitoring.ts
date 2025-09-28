/**
 * Monitoring and Analytics for MCP Endpoints
 * 
 * Tracks usage, performance, and errors for MCP endpoints to provide
 * insights into AI agent interactions and system health.
 */

/**
 * MCP request metrics
 */
export interface MCPRequestMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  clientIp: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * MCP usage analytics
 */
export interface MCPUsageAnalytics {
  endpoint: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  uniqueClients: number;
  requestsPerHour: number;
  topErrors: Array<{ code: string; count: number }>;
  timestamp: Date;
}

/**
 * MCP endpoint performance data
 */
export interface MCPPerformanceData {
  endpoint: string;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  throughput: number; // requests per second
  timestamp: Date;
}

/**
 * In-memory metrics store (in production, use Redis or similar)
 */
class MCPMetricsStore {
  private metrics: MCPRequestMetrics[] = [];
  private readonly maxMetrics = 10000; // Keep last 10k metrics in memory

  /**
   * Record a request metric
   */
  recordMetric(metric: MCPRequestMetrics): void {
    this.metrics.push(metric);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get metrics for a specific time period
   */
  getMetrics(
    startTime: Date,
    endTime: Date,
    endpoint?: string
  ): MCPRequestMetrics[] {
    return this.metrics.filter(metric => {
      const timeMatch = metric.timestamp >= startTime && metric.timestamp <= endTime;
      const endpointMatch = !endpoint || metric.endpoint === endpoint;
      return timeMatch && endpointMatch;
    });
  }

  /**
   * Get usage analytics for a time period
   */
  getUsageAnalytics(
    startTime: Date,
    endTime: Date,
    endpoint?: string
  ): MCPUsageAnalytics[] {
    const metrics = this.getMetrics(startTime, endTime, endpoint);
    const endpointGroups = new Map<string, MCPRequestMetrics[]>();

    // Group metrics by endpoint
    metrics.forEach(metric => {
      const key = metric.endpoint;
      if (!endpointGroups.has(key)) {
        endpointGroups.set(key, []);
      }
      endpointGroups.get(key)!.push(metric);
    });

    // Calculate analytics for each endpoint
    return Array.from(endpointGroups.entries()).map(([endpointName, endpointMetrics]) => {
      const totalRequests = endpointMetrics.length;
      const successfulRequests = endpointMetrics.filter(m => m.success).length;
      const failedRequests = totalRequests - successfulRequests;
      const averageResponseTime = endpointMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
      const uniqueClients = new Set(endpointMetrics.map(m => m.clientIp)).size;
      
      const timeSpanHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      const requestsPerHour = totalRequests / Math.max(timeSpanHours, 1);

      // Count error types
      const errorCounts = new Map<string, number>();
      endpointMetrics.forEach(metric => {
        if (!metric.success && metric.errorCode) {
          errorCounts.set(metric.errorCode, (errorCounts.get(metric.errorCode) || 0) + 1);
        }
      });

      const topErrors = Array.from(errorCounts.entries())
        .map(([code, count]) => ({ code, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        endpoint: endpointName,
        totalRequests,
        successfulRequests,
        failedRequests,
        averageResponseTime,
        uniqueClients,
        requestsPerHour,
        topErrors,
        timestamp: new Date(),
      };
    });
  }

  /**
   * Get performance data for endpoints
   */
  getPerformanceData(
    startTime: Date,
    endTime: Date,
    endpoint?: string
  ): MCPPerformanceData[] {
    const metrics = this.getMetrics(startTime, endTime, endpoint);
    const endpointGroups = new Map<string, MCPRequestMetrics[]>();

    // Group metrics by endpoint
    metrics.forEach(metric => {
      const key = metric.endpoint;
      if (!endpointGroups.has(key)) {
        endpointGroups.set(key, []);
      }
      endpointGroups.get(key)!.push(metric);
    });

    return Array.from(endpointGroups.entries()).map(([endpointName, endpointMetrics]) => {
      const responseTimes = endpointMetrics.map(m => m.responseTime).sort((a, b) => a - b);
      const totalRequests = endpointMetrics.length;
      const failedRequests = endpointMetrics.filter(m => !m.success).length;
      
      const p50Index = Math.floor(responseTimes.length * 0.5);
      const p95Index = Math.floor(responseTimes.length * 0.95);
      const p99Index = Math.floor(responseTimes.length * 0.99);

      const timeSpanSeconds = (endTime.getTime() - startTime.getTime()) / 1000;
      const throughput = totalRequests / Math.max(timeSpanSeconds, 1);

      return {
        endpoint: endpointName,
        p50ResponseTime: responseTimes[p50Index] || 0,
        p95ResponseTime: responseTimes[p95Index] || 0,
        p99ResponseTime: responseTimes[p99Index] || 0,
        errorRate: totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0,
        throughput,
        timestamp: new Date(),
      };
    });
  }

  /**
   * Clear old metrics (for memory management)
   */
  clearOldMetrics(olderThan: Date): void {
    this.metrics = this.metrics.filter(metric => metric.timestamp > olderThan);
  }
}

/**
 * Global metrics store instance
 */
export const mcpMetricsStore = new MCPMetricsStore();

/**
 * MCP Monitoring class
 */
export class MCPMonitoring {
  /**
   * Start monitoring a request
   */
  static startRequest(endpoint: string, method: string): {
    startTime: number;
    requestId: string;
  } {
    const startTime = Date.now();
    const requestId = `${endpoint}-${method}-${startTime}-${Math.random().toString(36).substr(2, 9)}`;
    
    return { startTime, requestId };
  }

  /**
   * End monitoring a request and record metrics
   */
  static endRequest(
    monitoring: { startTime: number; requestId: string },
    endpoint: string,
    method: string,
    statusCode: number,
    clientIp: string,
    userAgent: string,
    requestSize: number = 0,
    responseSize: number = 0,
    errorCode?: string,
    errorMessage?: string
  ): void {
    const endTime = Date.now();
    const responseTime = endTime - monitoring.startTime;
    const success = statusCode >= 200 && statusCode < 400;

    const metric: MCPRequestMetrics = {
      endpoint,
      method,
      statusCode,
      responseTime,
      requestSize,
      responseSize,
      clientIp,
      userAgent: userAgent.substring(0, 200), // Truncate long user agents
      timestamp: new Date(),
      success,
      errorCode,
      errorMessage: errorMessage?.substring(0, 500), // Truncate long error messages
    };

    mcpMetricsStore.recordMetric(metric);

    // Log significant events
    if (!success) {
      console.warn(`MCP Request failed: ${endpoint} ${method} - ${statusCode} - ${errorCode || 'Unknown error'}`);
    } else if (responseTime > 5000) {
      console.warn(`MCP Slow request: ${endpoint} ${method} - ${responseTime}ms`);
    }

    // Log to external monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.logToExternalService(metric);
    }
  }

  /**
   * Get current system health metrics
   */
  static getHealthMetrics(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: {
      totalRequests: number;
      errorRate: number;
      averageResponseTime: number;
      activeEndpoints: string[];
    };
    timestamp: Date;
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentMetrics = mcpMetricsStore.getMetrics(oneHourAgo, now);
    const totalRequests = recentMetrics.length;
    const failedRequests = recentMetrics.filter(m => !m.success).length;
    const errorRate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;
    const averageResponseTime = totalRequests > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests 
      : 0;
    
    const activeEndpoints = Array.from(new Set(recentMetrics.map(m => m.endpoint)));

    // Determine health status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (errorRate > 50 || averageResponseTime > 10000) {
      status = 'unhealthy';
    } else if (errorRate > 10 || averageResponseTime > 5000) {
      status = 'degraded';
    }

    return {
      status,
      metrics: {
        totalRequests,
        errorRate,
        averageResponseTime,
        activeEndpoints,
      },
      timestamp: now,
    };
  }

  /**
   * Get usage analytics for the last 24 hours
   */
  static getDailyAnalytics(): MCPUsageAnalytics[] {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    return mcpMetricsStore.getUsageAnalytics(oneDayAgo, now);
  }

  /**
   * Get performance data for the last hour
   */
  static getHourlyPerformance(): MCPPerformanceData[] {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    return mcpMetricsStore.getPerformanceData(oneHourAgo, now);
  }

  /**
   * Clean up old metrics (should be called periodically)
   */
  static cleanup(): void {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    mcpMetricsStore.clearOldMetrics(threeDaysAgo);
  }

  /**
   * Log metrics to external monitoring service
   */
  private static logToExternalService(metric: MCPRequestMetrics): void {
    // In production, implement integration with monitoring services like:
    // - CloudWatch (AWS)
    // - Application Insights (Azure)
    // - Stackdriver (Google Cloud)
    // - Datadog
    // - New Relic
    // etc.
    
    // Example structure for external logging:
    /*
    try {
      await externalMonitoringService.log({
        service: 'mcp-server',
        metric: 'request',
        tags: {
          endpoint: metric.endpoint,
          method: metric.method,
          status: metric.statusCode.toString(),
          success: metric.success.toString(),
        },
        fields: {
          response_time: metric.responseTime,
          request_size: metric.requestSize,
          response_size: metric.responseSize,
        },
        timestamp: metric.timestamp,
      });
    } catch (error) {
      console.error('Failed to log to external monitoring service:', error);
    }
    */
  }
}

/**
 * Periodic cleanup task (should be called from a cron job or similar)
 */
export function startPeriodicCleanup(): void {
  // Clean up old metrics every hour
  setInterval(() => {
    MCPMonitoring.cleanup();
  }, 60 * 60 * 1000);
}

/**
 * Helper function to calculate request/response sizes
 */
export function calculateSize(data: any): number {
  if (!data) return 0;
  
  try {
    if (typeof data === 'string') {
      return new Blob([data]).size;
    } else if (typeof data === 'object') {
      return new Blob([JSON.stringify(data)]).size;
    }
    return 0;
  } catch {
    return 0;
  }
}