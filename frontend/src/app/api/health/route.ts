/**
 * API Health Check Endpoint
 * 
 * Provides system health information, API metrics, and monitoring data.
 * This endpoint demonstrates the comprehensive error handling and monitoring system.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createGETEndpoint } from '@/lib/middleware/api-wrapper';
import { APIMonitor } from '@/lib/utils/api-monitoring';
import { db } from '@/lib/db/connection';
import { profiles } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

/**
 * Health check handler
 */
const healthHandler = async (request: NextRequest, context: any) => {
  const { searchParams } = new URL(request.url);
  const includeMetrics = searchParams.get('metrics') === 'true';
  const includeLogs = searchParams.get('logs') === 'true';

  // Basic health information
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    requestId: context.requestId,
  };

  // Database health check
  let databaseHealth = 'unknown';
  try {
    await db.select({ count: sql<number>`count(*)` }).from(profiles).limit(1);
    databaseHealth = 'healthy';
  } catch (error) {
    console.error('Database health check failed:', error);
    databaseHealth = 'unhealthy';
  }

  const response: any = {
    ...health,
    services: {
      database: {
        status: databaseHealth,
        type: 'postgresql',
        provider: 'neon',
      },
      authentication: {
        status: 'healthy',
        provider: 'workos',
      },
    },
  };

  // Include performance metrics if requested
  if (includeMetrics) {
    const healthSummary = APIMonitor.getHealthSummary();
    response.metrics = {
      requests: {
        total: healthSummary.totalRequests,
        errors: healthSummary.totalErrors,
        errorRate: Math.round(healthSummary.overallErrorRate * 100) / 100,
        averageResponseTime: Math.round(healthSummary.averageResponseTime),
        slowRequests: healthSummary.slowRequestCount,
      },
      endpoints: {
        topErrors: healthSummary.topErrorEndpoints,
        topSlow: healthSummary.topSlowEndpoints,
      },
    };
  }

  // Include recent logs if requested (only in development)
  if (includeLogs && process.env.NODE_ENV === 'development') {
    response.logs = {
      recentRequests: APIMonitor.getRequestLogs(10),
      recentErrors: APIMonitor.getErrorLogs(5),
    };
  }

  // Determine overall status
  if (databaseHealth === 'unhealthy') {
    response.status = 'degraded';
  }

  const statusCode = response.status === 'healthy' ? 200 : 503;
  return NextResponse.json(response, { status: statusCode });
};

// Export the wrapped endpoint
export const GET = createGETEndpoint('/api/health', healthHandler);

// Also support POST for testing purposes
export const POST = createGETEndpoint('/api/health', healthHandler);