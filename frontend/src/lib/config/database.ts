/**
 * Database Configuration and Connection Pool Settings
 * 
 * This file contains optimized database configuration for production performance.
 */

export interface DatabaseConfig {
  // Connection pool settings
  maxConnections: number;
  minConnections: number;
  idleTimeoutMs: number;
  connectionTimeoutMs: number;
  queryTimeoutMs: number;
  
  // Performance settings
  enableQueryLogging: boolean;
  slowQueryThresholdMs: number;
  enablePerformanceMonitoring: boolean;
  
  // Cache settings
  enableQueryCache: boolean;
  cacheMaxSize: number;
  cacheTtlMs: number;
}

/**
 * Get database configuration based on environment
 */
export function getDatabaseConfig(): DatabaseConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    // Connection pool settings optimized for Neon serverless
    maxConnections: isProduction ? 20 : 10,
    minConnections: isProduction ? 2 : 1,
    idleTimeoutMs: 30000, // 30 seconds
    connectionTimeoutMs: 10000, // 10 seconds
    queryTimeoutMs: isProduction ? 30000 : 60000, // 30s prod, 60s dev
    
    // Performance monitoring
    enableQueryLogging: isDevelopment,
    slowQueryThresholdMs: isProduction ? 1000 : 500, // 1s prod, 500ms dev
    enablePerformanceMonitoring: true,
    
    // Query caching (can be implemented later)
    enableQueryCache: false, // Disabled for now
    cacheMaxSize: 1000,
    cacheTtlMs: 300000, // 5 minutes
  };
}

/**
 * Database optimization recommendations based on usage patterns
 */
export const DatabaseOptimizations = {
  // Index recommendations
  indexes: {
    profiles: [
      'idx_profiles_slug', // Primary lookup
      'idx_profiles_public_active_created', // Search filtering
      'idx_profiles_skills', // Skills filtering (GIN)
      'idx_profiles_available_for', // Availability filtering (GIN)
      'idx_profiles_bio_search', // Full-text search (GIN)
      'idx_profiles_name_lower', // Case-insensitive name search
    ],
    appointments: [
      'idx_appointments_profile_status', // Profile appointment queries
      'idx_appointments_requester', // Requester queries
      'idx_appointments_created_at', // Time-based queries
    ],
    profile_analytics: [
      'idx_profile_analytics_profile_event', // Analytics queries
      'idx_profile_analytics_created_at', // Time-based analytics
    ]
  },

  // Query patterns to optimize
  queryPatterns: {
    // Most common queries that should be fast
    criticalQueries: [
      'Profile lookup by slug',
      'Public profile search',
      'Profile appointments by status',
      'Search with skills filter',
    ],
    
    // Queries that can be slower but should be monitored
    acceptableSlowQueries: [
      'Full-text search across all profiles',
      'Complex analytics queries',
      'Batch profile updates',
    ]
  },

  // Performance thresholds
  performanceThresholds: {
    profileLookupMs: 50, // Profile by slug should be very fast
    searchQueryMs: 500, // Search queries should be under 500ms
    insertQueryMs: 200, // Inserts should be fast
    updateQueryMs: 200, // Updates should be fast
    analyticsQueryMs: 2000, // Analytics can be slower
  }
};

/**
 * Connection pool health monitoring
 */
export class ConnectionPoolMonitor {
  private static connectionCount = 0;
  private static activeQueries = 0;
  private static connectionErrors = 0;

  static incrementConnection() {
    this.connectionCount++;
  }

  static decrementConnection() {
    this.connectionCount = Math.max(0, this.connectionCount - 1);
  }

  static incrementActiveQuery() {
    this.activeQueries++;
  }

  static decrementActiveQuery() {
    this.activeQueries = Math.max(0, this.activeQueries - 1);
  }

  static recordConnectionError() {
    this.connectionErrors++;
  }

  static getStats() {
    return {
      activeConnections: this.connectionCount,
      activeQueries: this.activeQueries,
      connectionErrors: this.connectionErrors,
      timestamp: new Date().toISOString()
    };
  }

  static reset() {
    this.connectionCount = 0;
    this.activeQueries = 0;
    this.connectionErrors = 0;
  }
}

/**
 * Query cache implementation (for future use)
 */
export class QueryCache {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private static maxSize = 1000;

  static set(key: string, data: any, ttlMs: number = 300000) {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  static get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  static clear() {
    this.cache.clear();
  }

  static getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // TODO: Implement hit rate tracking
    };
  }
}