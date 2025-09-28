import { drizzle } from 'drizzle-orm/neon-http';
import { neon, Pool } from '@neondatabase/serverless';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

// Connection pool configuration for better performance
const connectionConfig = {
  connectionString: process.env.DATABASE_URL,
  // Connection pool settings for concurrent requests
  max: 20, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 10000, // Timeout for new connections
};

// Create connection pool for better concurrent request handling
const pool = new Pool(connectionConfig);

// Create Neon client with connection pooling
const sql = neon(process.env.DATABASE_URL, {
  // Enable connection pooling
  pooled: true,
  // Connection timeout
  connectionTimeoutMillis: 10000,
  // Query timeout
  queryTimeoutMillis: 30000,
});

// Create Drizzle instance with enhanced configuration
export const db = drizzle(sql, { 
  schema,
  logger: process.env.NODE_ENV === 'development' ? {
    logQuery: (query: string, params: unknown[]) => {
      // Log slow queries in development
      const start = Date.now();
      return () => {
        const duration = Date.now() - start;
        if (duration > 1000) { // Log queries taking more than 1 second
          console.warn(`Slow query detected (${duration}ms):`, query);
        }
      };
    }
  } : undefined
});

// Connection pool instance for direct access if needed
export const connectionPool = pool;

// Database performance monitoring utilities
export class DatabaseMonitor {
  private static queryTimes: number[] = [];
  private static slowQueries: Array<{ query: string; duration: number; timestamp: Date }> = [];

  static startQuery(): () => number {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.queryTimes.push(duration);
      
      // Keep only last 100 query times for memory efficiency
      if (this.queryTimes.length > 100) {
        this.queryTimes = this.queryTimes.slice(-100);
      }
      
      return duration;
    };
  }

  static recordSlowQuery(query: string, duration: number) {
    this.slowQueries.push({
      query: query.substring(0, 200), // Truncate long queries
      duration,
      timestamp: new Date()
    });
    
    // Keep only last 50 slow queries
    if (this.slowQueries.length > 50) {
      this.slowQueries = this.slowQueries.slice(-50);
    }
  }

  static getPerformanceStats() {
    if (this.queryTimes.length === 0) {
      return {
        averageQueryTime: 0,
        slowestQuery: 0,
        fastestQuery: 0,
        totalQueries: 0,
        slowQueries: this.slowQueries
      };
    }

    const sorted = [...this.queryTimes].sort((a, b) => a - b);
    return {
      averageQueryTime: this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length,
      slowestQuery: sorted[sorted.length - 1],
      fastestQuery: sorted[0],
      medianQueryTime: sorted[Math.floor(sorted.length / 2)],
      p95QueryTime: sorted[Math.floor(sorted.length * 0.95)],
      totalQueries: this.queryTimes.length,
      slowQueries: this.slowQueries
    };
  }

  static resetStats() {
    this.queryTimes = [];
    this.slowQueries = [];
  }
}

// Enhanced database wrapper with performance monitoring
export const performanceDb = {
  ...db,
  
  // Wrapper for select queries with monitoring
  async selectWithMonitoring<T>(query: any): Promise<T> {
    const endTimer = DatabaseMonitor.startQuery();
    try {
      const result = await query;
      const duration = endTimer();
      
      if (duration > 1000) { // Log queries over 1 second
        DatabaseMonitor.recordSlowQuery('SELECT query', duration);
        console.warn(`Slow SELECT query: ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      endTimer();
      throw error;
    }
  },

  // Wrapper for insert queries with monitoring
  async insertWithMonitoring<T>(query: any): Promise<T> {
    const endTimer = DatabaseMonitor.startQuery();
    try {
      const result = await query;
      const duration = endTimer();
      
      if (duration > 500) { // Log inserts over 500ms
        DatabaseMonitor.recordSlowQuery('INSERT query', duration);
        console.warn(`Slow INSERT query: ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      endTimer();
      throw error;
    }
  },

  // Wrapper for update queries with monitoring
  async updateWithMonitoring<T>(query: any): Promise<T> {
    const endTimer = DatabaseMonitor.startQuery();
    try {
      const result = await query;
      const duration = endTimer();
      
      if (duration > 500) { // Log updates over 500ms
        DatabaseMonitor.recordSlowQuery('UPDATE query', duration);
        console.warn(`Slow UPDATE query: ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      endTimer();
      throw error;
    }
  }
};