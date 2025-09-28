import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { DatabasePerformanceService } from '@/lib/services/database-performance';
import { DatabaseMonitor } from '@/lib/db/connection';

/**
 * GET /api/admin/performance - Database performance monitoring endpoint
 * 
 * This endpoint provides database performance metrics and health information.
 * Only accessible to authenticated users (can be restricted to admin users in production).
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate the request (in production, add admin role check)
    const { user } = await withAuth();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'stats';

    switch (action) {
      case 'stats':
        // Get current performance statistics
        const stats = DatabaseMonitor.getPerformanceStats();
        return NextResponse.json({
          performance: stats,
          timestamp: new Date().toISOString()
        });

      case 'health':
        // Perform comprehensive health check
        const healthCheck = await DatabasePerformanceService.performHealthCheck();
        return NextResponse.json(healthCheck);

      case 'analysis':
        // Analyze query performance and provide recommendations
        const analysis = await DatabasePerformanceService.analyzeQueryPerformance();
        return NextResponse.json(analysis);

      case 'reset':
        // Reset performance statistics
        DatabaseMonitor.resetStats();
        return NextResponse.json({ 
          message: 'Performance statistics reset successfully',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Performance monitoring error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve performance data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/performance - Trigger performance optimization tasks
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await withAuth();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'analyze_slow_queries':
        const analysis = await DatabasePerformanceService.analyzeQueryPerformance();
        return NextResponse.json({
          message: 'Query analysis completed',
          analysis,
          timestamp: new Date().toISOString()
        });

      case 'health_check':
        const health = await DatabasePerformanceService.performHealthCheck();
        return NextResponse.json({
          message: 'Health check completed',
          health,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Performance optimization error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to execute performance task',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}