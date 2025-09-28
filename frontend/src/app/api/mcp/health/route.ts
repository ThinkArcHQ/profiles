/**
 * MCP Health Check Endpoint
 * 
 * Provides health status and metrics for the MCP server infrastructure.
 * This endpoint is used for monitoring and alerting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { MCPMonitoring } from '@/lib/middleware/mcp-monitoring';
import { withMCPMiddleware } from '@/lib/middleware/mcp-middleware';
import { db } from '@/lib/db/connection';

/**
 * Health check response interface
 */
interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: 'healthy' | 'unhealthy';
    mcp_endpoints: 'healthy' | 'degraded' | 'unhealthy';
  };
  metrics: {
    total_requests_24h: number;
    error_rate_24h: number;
    average_response_time_1h: number;
    active_endpoints: string[];
  };
  performance: {
    p50_response_time: number;
    p95_response_time: number;
    p99_response_time: number;
    throughput: number;
  };
}

/**
 * Detailed health check (for internal monitoring)
 */
interface DetailedHealthResponse extends HealthCheckResponse {
  detailed_metrics: {
    endpoints: Array<{
      name: string;
      requests_1h: number;
      error_rate_1h: number;
      avg_response_time_1h: number;
    }>;
    top_errors: Array<{
      code: string;
      count: number;
      percentage: number;
    }>;
  };
}

/**
 * Check database connectivity
 */
async function checkDatabaseHealth(): Promise<'healthy' | 'unhealthy'> {
  try {
    // Simple query to check database connectivity
    await db.execute('SELECT 1');
    return 'healthy';
  } catch (error) {
    console.error('Database health check failed:', error);
    return 'unhealthy';
  }
}

/**
 * GET /api/mcp/health - Basic health check
 */
export const GET = withMCPMiddleware(
  {
    endpoint: 'health',
    rateLimiter: 'search', // Use search rate limiter (more generous)
    allowedMethods: ['GET'],
  },
  async (request: NextRequest, context) => {
    try {
      const startTime = process.hrtime.bigint();
      
      // Check database health
      const databaseStatus = await checkDatabaseHealth();
      
      // Get MCP system health
      const mcpHealth = MCPMonitoring.getHealthMetrics();
      
      // Get daily analytics
      const dailyAnalytics = MCPMonitoring.getDailyAnalytics();
      const totalRequests24h = dailyAnalytics.reduce((sum, analytics) => sum + analytics.totalRequests, 0);
      const totalFailed24h = dailyAnalytics.reduce((sum, analytics) => sum + analytics.failedRequests, 0);
      const errorRate24h = totalRequests24h > 0 ? (totalFailed24h / totalRequests24h) * 100 : 0;
      
      // Get hourly performance
      const hourlyPerformance = MCPMonitoring.getHourlyPerformance();
      const avgP50 = hourlyPerformance.length > 0 
        ? hourlyPerformance.reduce((sum, perf) => sum + perf.p50ResponseTime, 0) / hourlyPerformance.length 
        : 0;
      const avgP95 = hourlyPerformance.length > 0 
        ? hourlyPerformance.reduce((sum, perf) => sum + perf.p95ResponseTime, 0) / hourlyPerformance.length 
        : 0;
      const avgP99 = hourlyPerformance.length > 0 
        ? hourlyPerformance.reduce((sum, perf) => sum + perf.p99ResponseTime, 0) / hourlyPerformance.length 
        : 0;
      const avgThroughput = hourlyPerformance.length > 0 
        ? hourlyPerformance.reduce((sum, perf) => sum + perf.throughput, 0) / hourlyPerformance.length 
        : 0;

      // Determine overall status
      let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (databaseStatus === 'unhealthy' || mcpHealth.status === 'unhealthy') {
        overallStatus = 'unhealthy';
      } else if (mcpHealth.status === 'degraded' || errorRate24h > 10) {
        overallStatus = 'degraded';
      }

      // Calculate uptime (simplified - in production, track actual start time)
      const uptime = process.uptime();

      const healthResponse: HealthCheckResponse = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime,
        services: {
          database: databaseStatus,
          mcp_endpoints: mcpHealth.status,
        },
        metrics: {
          total_requests_24h: totalRequests24h,
          error_rate_24h: Math.round(errorRate24h * 100) / 100,
          average_response_time_1h: Math.round(mcpHealth.metrics.averageResponseTime),
          active_endpoints: mcpHealth.metrics.activeEndpoints,
        },
        performance: {
          p50_response_time: Math.round(avgP50),
          p95_response_time: Math.round(avgP95),
          p99_response_time: Math.round(avgP99),
          throughput: Math.round(avgThroughput * 100) / 100,
        },
      };

      const endTime = process.hrtime.bigint();
      const responseTimeMs = Number(endTime - startTime) / 1000000;

      // Add response time header
      const response = NextResponse.json(healthResponse, {
        status: overallStatus === 'unhealthy' ? 503 : 200,
        headers: {
          'X-Response-Time': `${responseTimeMs.toFixed(2)}ms`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });

      return response;
    } catch (error) {
      console.error('Health check failed:', error);
      
      const errorResponse: HealthCheckResponse = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        services: {
          database: 'unhealthy',
          mcp_endpoints: 'unhealthy',
        },
        metrics: {
          total_requests_24h: 0,
          error_rate_24h: 100,
          average_response_time_1h: 0,
          active_endpoints: [],
        },
        performance: {
          p50_response_time: 0,
          p95_response_time: 0,
          p99_response_time: 0,
          throughput: 0,
        },
      };

      return NextResponse.json(errorResponse, { status: 503 });
    }
  }
);

/**
 * POST /api/mcp/health - Detailed health check (for internal monitoring)
 */
export const POST = withMCPMiddleware(
  {
    endpoint: 'health-detailed',
    rateLimiter: 'getProfile', // More restrictive for detailed info
    allowedMethods: ['POST'],
  },
  async (request: NextRequest, context) => {
    try {
      const body = await request.json();
      const { include_detailed = false } = body;

      if (!include_detailed) {
        // Return basic health check
        return GET(request);
      }

      const startTime = process.hrtime.bigint();
      
      // Get basic health info
      const basicHealthResponse = await GET(request);
      const basicHealth = await basicHealthResponse.json() as HealthCheckResponse;

      // Get detailed analytics
      const dailyAnalytics = MCPMonitoring.getDailyAnalytics();
      const hourlyPerformance = MCPMonitoring.getHourlyPerformance();

      // Calculate detailed endpoint metrics
      const endpointMetrics = dailyAnalytics.map(analytics => ({
        name: analytics.endpoint,
        requests_1h: Math.round(analytics.requestsPerHour),
        error_rate_1h: Math.round(((analytics.failedRequests / analytics.totalRequests) * 100) * 100) / 100,
        avg_response_time_1h: Math.round(analytics.averageResponseTime),
      }));

      // Get top errors across all endpoints
      const allErrors = new Map<string, number>();
      dailyAnalytics.forEach(analytics => {
        analytics.topErrors.forEach(error => {
          allErrors.set(error.code, (allErrors.get(error.code) || 0) + error.count);
        });
      });

      const totalErrorCount = Array.from(allErrors.values()).reduce((sum, count) => sum + count, 0);
      const topErrors = Array.from(allErrors.entries())
        .map(([code, count]) => ({
          code,
          count,
          percentage: totalErrorCount > 0 ? Math.round((count / totalErrorCount) * 100 * 100) / 100 : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const detailedResponse: DetailedHealthResponse = {
        ...basicHealth,
        detailed_metrics: {
          endpoints: endpointMetrics,
          top_errors: topErrors,
        },
      };

      const endTime = process.hrtime.bigint();
      const responseTimeMs = Number(endTime - startTime) / 1000000;

      return NextResponse.json(detailedResponse, {
        status: basicHealth.status === 'unhealthy' ? 503 : 200,
        headers: {
          'X-Response-Time': `${responseTimeMs.toFixed(2)}ms`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    } catch (error) {
      console.error('Detailed health check failed:', error);
      
      // Fall back to basic health check
      return GET(request);
    }
  }
);

// OPTIONS handler is automatically handled by withMCPMiddleware