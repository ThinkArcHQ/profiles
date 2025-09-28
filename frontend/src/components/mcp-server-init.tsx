/**
 * MCP Server Initialization Component
 * 
 * This component handles the initialization of the MCP server infrastructure
 * when the application starts up. It runs on the server side only.
 */

import { initializeMCPServer } from '@/lib/startup/mcp-server-init';

/**
 * Initialize MCP server infrastructure on app startup
 * This runs once when the server starts
 */
let mcpInitialized = false;
let initializationPromise: Promise<void> | null = null;

async function ensureMCPInitialized(): Promise<void> {
  if (mcpInitialized) {
    return;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      const result = await initializeMCPServer();
      
      if (result.success) {
        mcpInitialized = true;
        console.log('✅ MCP Server Infrastructure initialized successfully');
      } else {
        console.error('❌ MCP Server Infrastructure initialization failed:', result.errors);
        // Don't set mcpInitialized to true, so it can retry later
      }
    } catch (error) {
      console.error('💥 MCP Server initialization crashed:', error);
      // Don't set mcpInitialized to true, so it can retry later
    } finally {
      initializationPromise = null;
    }
  })();

  return initializationPromise;
}

/**
 * MCP Server Initialization Component
 * 
 * This component ensures MCP server is initialized when the app starts.
 * It's designed to be included in the root layout.
 */
export async function MCPServerInit() {
  // Only run on server side
  if (typeof window !== 'undefined') {
    return null;
  }

  try {
    await ensureMCPInitialized();
  } catch (error) {
    // Log error but don't crash the app
    console.error('MCP initialization error in component:', error);
  }

  // This component doesn't render anything
  return null;
}

/**
 * Get MCP initialization status (for debugging)
 */
export function getMCPInitStatus(): {
  initialized: boolean;
  initializing: boolean;
} {
  return {
    initialized: mcpInitialized,
    initializing: initializationPromise !== null,
  };
}