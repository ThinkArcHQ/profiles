/**
 * MCP Server Initialization
 * 
 * Handles startup tasks for the MCP server infrastructure including
 * monitoring setup, cleanup tasks, and health checks.
 */

import { validateMCPConfig, getMCPServerInfo } from '@/lib/config/mcp-server';
import { startPeriodicCleanup } from '@/lib/middleware/mcp-monitoring';

/**
 * Initialize MCP server infrastructure
 */
export async function initializeMCPServer(): Promise<{
  success: boolean;
  errors: string[];
  warnings: string[];
  serverInfo: any;
}> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  console.log('🚀 Initializing MCP Server Infrastructure...');
  
  try {
    // 1. Validate configuration
    console.log('📋 Validating MCP configuration...');
    const configValidation = validateMCPConfig();
    
    if (!configValidation.isValid) {
      errors.push(...configValidation.errors);
      console.error('❌ MCP Configuration validation failed:', configValidation.errors);
    } else {
      console.log('✅ MCP Configuration validated successfully');
    }
    
    if (configValidation.warnings.length > 0) {
      warnings.push(...configValidation.warnings);
      console.warn('⚠️  MCP Configuration warnings:', configValidation.warnings);
    }
    
    // 2. Start periodic cleanup tasks
    console.log('🧹 Starting periodic cleanup tasks...');
    try {
      startPeriodicCleanup();
      console.log('✅ Periodic cleanup tasks started');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Failed to start cleanup tasks: ${errorMessage}`);
      console.error('❌ Failed to start cleanup tasks:', error);
    }
    
    // 3. Initialize monitoring
    console.log('📊 Initializing monitoring system...');
    try {
      // The monitoring system is initialized automatically when first used
      // This is just a placeholder for any future initialization needs
      console.log('✅ Monitoring system initialized');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      warnings.push(`Monitoring initialization warning: ${errorMessage}`);
      console.warn('⚠️  Monitoring initialization warning:', error);
    }
    
    // 4. Test database connectivity (basic health check)
    console.log('🗄️  Testing database connectivity...');
    try {
      // Import here to avoid circular dependencies
      const { db } = await import('@/lib/db/connection');
      await db.execute('SELECT 1');
      console.log('✅ Database connectivity verified');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Database connectivity failed: ${errorMessage}`);
      console.error('❌ Database connectivity failed:', error);
    }
    
    // 5. Get server info
    const serverInfo = getMCPServerInfo();
    
    // 6. Log startup summary
    const success = errors.length === 0;
    
    if (success) {
      console.log('🎉 MCP Server Infrastructure initialized successfully!');
      console.log('📡 Server Info:', {
        name: serverInfo.name,
        version: serverInfo.version,
        domain: serverInfo.domain,
        tools: serverInfo.tools,
        transport: serverInfo.transport,
      });
    } else {
      console.error('💥 MCP Server Infrastructure initialization failed');
      console.error('❌ Errors:', errors);
    }
    
    if (warnings.length > 0) {
      console.warn('⚠️  Warnings:', warnings);
    }
    
    return {
      success,
      errors,
      warnings,
      serverInfo,
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Initialization failed: ${errorMessage}`);
    console.error('💥 MCP Server initialization crashed:', error);
    
    return {
      success: false,
      errors,
      warnings,
      serverInfo: null,
    };
  }
}

/**
 * Graceful shutdown handler for MCP server
 */
export async function shutdownMCPServer(): Promise<void> {
  console.log('🛑 Shutting down MCP Server Infrastructure...');
  
  try {
    // 1. Stop accepting new requests (handled by Next.js)
    console.log('🚫 Stopping new request acceptance...');
    
    // 2. Wait for existing requests to complete (basic timeout)
    console.log('⏳ Waiting for existing requests to complete...');
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second grace period
    
    // 3. Clean up monitoring data
    console.log('🧹 Cleaning up monitoring data...');
    const { MCPMonitoring } = await import('@/lib/middleware/mcp-monitoring');
    MCPMonitoring.cleanup();
    
    // 4. Log shutdown completion
    console.log('✅ MCP Server Infrastructure shutdown complete');
    
  } catch (error) {
    console.error('❌ Error during MCP server shutdown:', error);
  }
}

/**
 * Health check for MCP server components
 */
export async function performMCPHealthCheck(): Promise<{
  healthy: boolean;
  components: Record<string, 'healthy' | 'unhealthy' | 'degraded'>;
  details: Record<string, any>;
}> {
  const components: Record<string, 'healthy' | 'unhealthy' | 'degraded'> = {};
  const details: Record<string, any> = {};
  
  try {
    // 1. Check database
    try {
      const { db } = await import('@/lib/db/connection');
      await db.execute('SELECT 1');
      components.database = 'healthy';
      details.database = 'Connection successful';
    } catch (error) {
      components.database = 'unhealthy';
      details.database = error instanceof Error ? error.message : 'Unknown error';
    }
    
    // 2. Check monitoring system
    try {
      const { MCPMonitoring } = await import('@/lib/middleware/mcp-monitoring');
      const healthMetrics = MCPMonitoring.getHealthMetrics();
      components.monitoring = healthMetrics.status === 'healthy' ? 'healthy' : 
                             healthMetrics.status === 'degraded' ? 'degraded' : 'unhealthy';
      details.monitoring = healthMetrics;
    } catch (error) {
      components.monitoring = 'unhealthy';
      details.monitoring = error instanceof Error ? error.message : 'Unknown error';
    }
    
    // 3. Check configuration
    try {
      const configValidation = validateMCPConfig();
      components.configuration = configValidation.isValid ? 'healthy' : 'unhealthy';
      details.configuration = {
        valid: configValidation.isValid,
        errors: configValidation.errors,
        warnings: configValidation.warnings,
      };
    } catch (error) {
      components.configuration = 'unhealthy';
      details.configuration = error instanceof Error ? error.message : 'Unknown error';
    }
    
    // 4. Overall health determination
    const unhealthyComponents = Object.values(components).filter(status => status === 'unhealthy').length;
    const degradedComponents = Object.values(components).filter(status => status === 'degraded').length;
    
    const healthy = unhealthyComponents === 0 && degradedComponents === 0;
    
    return {
      healthy,
      components,
      details,
    };
    
  } catch (error) {
    return {
      healthy: false,
      components: { system: 'unhealthy' },
      details: { 
        system: error instanceof Error ? error.message : 'Unknown error' 
      },
    };
  }
}

/**
 * Get MCP server runtime statistics
 */
export function getMCPRuntimeStats(): {
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  processId: number;
  nodeVersion: string;
  platform: string;
  environment: string;
} {
  return {
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    processId: process.pid,
    nodeVersion: process.version,
    platform: process.platform,
    environment: process.env.NODE_ENV || 'development',
  };
}