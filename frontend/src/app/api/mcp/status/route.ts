/**
 * MCP Server Status Endpoint
 * 
 * Provides detailed status information about the MCP server infrastructure,
 * including configuration, capabilities, and operational metrics.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withMCPMiddleware } from '@/lib/middleware/mcp-middleware';
import { getMCPServerInfo } from '@/lib/config/mcp-server';
import { performMCPHealthCheck, getMCPRuntimeStats } from '@/lib/startup/mcp-server-init';
import { MCPMonitoring } from '@/lib/middleware/mcp-monitoring';

/**
 * Server status response interface
 */
interface ServerStatusResponse {
  server: {
    name: string;
    version: string;
    description: string;
    domain: string;
    status: 'online' | 'degraded' | 'offline';
    uptime: number;
  };
  endpoints: {
    health: string;
    api: string;
  };
  tools: {
    available: string[];
    count: number;
  };
  capabilities: {
    search: boolean;
    profiles: boolean;
    meetings: boolean;
    rateLimiting: boolean;
    cors: boolean;
    monitoring: boolean;
  };
  limits: {
    maxRequestSize: number;
    maxResponseSize: number;
    requestTimeout: number;
    maxConcurrentRequests: number;
  };
  transport: {
    type: string;
    port?: number;
    host?: string;
  };
  runtime: {
    environment: string;
    nodeVersion: string;
    platform: string;
    processId: number;
    memoryUsage: {
      rss: number;
      heapUsed: number;
      heapTotal: number;
      external: number;
    };
  };
  timestamp: string;
}

/**
 * Detailed status response (for internal monitoring)
 */
interface DetailedStatusResponse extends ServerStatusResponse {
  health: {
    overall: boolean;
    components: Record<string, 'healthy' | 'unhealthy' | 'degraded'>;
    details: Record<string, any>;
  };
  metrics: {
    requests_24h: number;
    error_rate_24h: number;
    avg_response_time_1h: number;
    active_endpoints: string[];
    performance: {
      p50_response_time: number;
      p95_response_time: number;
      p99_response_time: number;
      throughput: number;
    };
  };
}

/**
 * GET /api/mcp/status - Basic server status
 */
export const GET = withMCPMiddleware(
  {
    endpoint: 'server_status',
    rateLimiter: 'search', // Use search rate limiter (more generous)
    allowedMethods: ['GET'],
  },
  async (request: NextRequest, context) => {
    try {
      const serverInfo = getMCPServerInfo();
      const runtimeStats = getMCPRuntimeStats();
      const healthCheck = await performMCPHealthCheck();
      
      // Determine server status based on health
      let serverStatus: 'online' | 'degraded' | 'offline' = 'online';
      if (!healthCheck.healthy) {
        const unhealthyCount = Object.values(healthCheck.components)
          .filter(status => status === 'unhealthy').length;
        const degradedCount = Object.values(healthCheck.components)
          .filter(status => status === 'degraded').length;
        
        if (unhealthyCount > 0) {
          serverStatus = 'offline';
        } else if (degradedCount > 0) {
          serverStatus = 'degraded';
        }
      }

      const statusResponse: ServerStatusResponse = {
        server: {
          name: serverInfo.name,
          version: serverInfo.version,
          description: serverInfo.description,
          domain: serverInfo.domain,
          status: serverStatus,
          uptime: runtimeStats.uptime,
        },
        endpoints: serverInfo.endpoints,
        tools: {
          available: serverInfo.tools,
          count: serverInfo.tools.length,
        },
        capabilities: {
          ...serverInfo.capabilities,
          monitoring: true,
        },
        limits: serverInfo.limits,
        transport: {
          type: serverInfo.transport,
          port: process.env.PORT ? parseInt(process.env.PORT) : undefined,
          host: process.env.HOST || undefined,
        },
        runtime: {
          environment: runtimeStats.environment,
          nodeVersion: runtimeStats.nodeVersion,
          platform: runtimeStats.platform,
          processId: runtimeStats.processId,
          memoryUsage: {
            rss: Math.round(runtimeStats.memoryUsage.rss / 1024 / 1024), // MB
            heapUsed: Math.round(runtimeStats.memoryUsage.heapUsed / 1024 / 1024), // MB
            heapTotal: Math.round(runtimeStats.memoryUsage.heapTotal / 1024 / 1024), // MB
            external: Math.round(runtimeStats.memoryUsage.external / 1024 / 1024), // MB
          },
        },
        timestamp: new Date().toISOString(),
      };

      return NextResponse.json(statusResponse, {
        status: serverStatus === 'offline' ? 503 : 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Server-Status': serverStatus,
        },
      });
    } catch (error) {
      console.error('Server status check failed:', error);
      
      const errorResponse: Partial<ServerStatusResponse> = {
        server: {
          name: 'persons-finderbee-mcp',
          version: '1.0.0',
          description: 'MCP server for Persons FinderBee',
          domain: process.env.MCP_DOMAIN || 'https://person.finderbee.ai',
          status: 'offline',
          uptime: process.uptime(),
        },
        timestamp: new Date().toISOString(),
      };

      return NextResponse.json(errorResponse, { status: 503 });
    }
  }
);

/**
 * POST /api/mcp/status - Detailed server status (for internal monitoring)
 */
export const POST = withMCPMiddleware(
  {
    endpoint: 'server_status_detailed',
    rateLimiter: 'getProfile', // More restrictive for detailed info
    allowedMethods: ['POST'],
  },
  async (request: NextRequest, context) => {
    try {
      const body = await request.json();
      const { include_detailed = false, include_metrics = false } = body;

      if (!include_detailed && !include_metrics) {
        // Return basic status
        return GET(request);
      }

      // Get basic status first
      const basicStatusResponse = await GET(request);
      const basicStatus = await basicStatusResponse.json() as ServerStatusResponse;

      const detailedResponse: DetailedStatusResponse = {
        ...basicStatus,
        health: {
          overall: false,
          components: {},
          details: {},
        },
        metrics: {
          requests_24h: 0,
          error_rate_24h: 0,
          avg_response_time_1h: 0,
          active_endpoints: [],
          performance: {
            p50_response_time: 0,
            p95_response_time: 0,
            p99_response_time: 0,
            throughput: 0,
          },
        },
      };

      // Add health details if requested
      if (include_detailed) {
        const healthCheck = await performMCPHealthCheck();
        detailedResponse.health = {
          overall: healthCheck.healthy,
          components: healthCheck.components,
          details: healthCheck.details,
        };
      }

      // Add metrics if requested
      if (include_metrics) {
        try {
          const dailyAnalytics = MCPMonitoring.getDailyAnalytics();
          const hourlyPerformance = MCPMonitoring.getHourlyPerformance();
          const healthMetrics = MCPMonitoring.getHealthMetrics();

          const totalRequests24h = dailyAnalytics.reduce((sum, analytics) => sum + analytics.totalRequests, 0);
          const totalFailed24h = dailyAnalytics.reduce((sum, analytics) => sum + analytics.failedRequests, 0);
          const errorRate24h = totalRequests24h > 0 ? (totalFailed24h / totalRequests24h) * 100 : 0;

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

          detailedResponse.metrics = {
            requests_24h: totalRequests24h,
            error_rate_24h: Math.round(errorRate24h * 100) / 100,
            avg_response_time_1h: Math.round(healthMetrics.metrics.averageResponseTime),
            active_endpoints: healthMetrics.metrics.activeEndpoints,
            performance: {
              p50_response_time: Math.round(avgP50),
              p95_response_time: Math.round(avgP95),
              p99_response_time: Math.round(avgP99),
              throughput: Math.round(avgThroughput * 100) / 100,
            },
          };
        } catch (error) {
          console.warn('Failed to get detailed metrics:', error);
          // Keep default metrics values
        }
      }

      return NextResponse.json(detailedResponse, {
        status: basicStatus.server.status === 'offline' ? 503 : 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Server-Status': basicStatus.server.status,
        },
      });
    } catch (error) {
      console.error('Detailed server status check failed:', error);
      
      // Fall back to basic status
      return GET(request);
    }
  }
);

// OPTIONS handler is automatically handled by withMCPMiddleware