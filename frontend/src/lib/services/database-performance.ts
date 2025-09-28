import { db, DatabaseMonitor } from '@/lib/db/connection';
import { profiles, appointments } from '@/lib/db/schema';
import { eq, and, or, sql, desc, asc } from 'drizzle-orm';

/**
 * Database Performance Optimization Service
 * 
 * This service provides optimized query patterns and performance monitoring
 * for the most common database operations in the application.
 */
export class DatabasePerformanceService {
  
  /**
   * Optimized profile search with proper indexing utilization
   */
  static async searchProfilesOptimized(params: {
    query?: string;
    skills?: string[];
    availableFor?: string[];
    limit: number;
    offset: number;
  }) {
    const { query, skills, availableFor, limit, offset } = params;
    const endTimer = DatabaseMonitor.startQuery();

    try {
      // Build optimized where conditions that utilize our indexes
      const whereConditions = [
        eq(profiles.isActive, true),
        eq(profiles.isPublic, true)
      ];

      // Text search optimization - use the indexed columns efficiently
      if (query) {
        // Use the name index for exact matches first, then bio search
        whereConditions.push(
          or(
            // Exact name match (uses idx_profiles_name_lower)
            sql`LOWER(${profiles.name}) = LOWER(${query})`,
            // Partial name match (uses idx_profiles_name_search)
            sql`${profiles.name} ILIKE ${`%${query}%`}`,
            // Bio search using full-text search (uses idx_profiles_bio_search)
            sql`to_tsvector('english', COALESCE(${profiles.bio}, '')) @@ plainto_tsquery('english', ${query})`
          )!
        );
      }

      // Skills filtering - optimized for GIN index
      if (skills && skills.length > 0) {
        // Use array overlap operator for better performance with GIN index
        whereConditions.push(
          sql`${profiles.skills} && ${skills}::text[]`
        );
      }

      // Availability filtering - optimized for GIN index
      if (availableFor && availableFor.length > 0) {
        whereConditions.push(
          sql`${profiles.availableFor} && ${availableFor}::text[]`
        );
      }

      // Execute optimized query using composite index
      const searchResults = await db
        .select({
          id: profiles.id,
          slug: profiles.slug,
          name: profiles.name,
          bio: profiles.bio,
          skills: profiles.skills,
          availableFor: profiles.availableFor,
          linkedinUrl: profiles.linkedinUrl,
          otherLinks: profiles.otherLinks,
          createdAt: profiles.createdAt,
        })
        .from(profiles)
        .where(and(...whereConditions))
        .orderBy(
          // Optimized ordering that uses our indexes
          query 
            ? sql`CASE WHEN LOWER(${profiles.name}) = LOWER(${query}) THEN 0 ELSE 1 END`
            : sql`1`,
          desc(profiles.createdAt)
        )
        .limit(limit)
        .offset(offset);

      // Get count using the same optimized conditions
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(profiles)
        .where(and(...whereConditions));

      const duration = endTimer();
      if (duration > 500) {
        DatabaseMonitor.recordSlowQuery('searchProfilesOptimized', duration);
      }

      return {
        profiles: searchResults,
        totalCount: countResult[0]?.count || 0
      };
    } catch (error) {
      endTimer();
      throw error;
    }
  }

  /**
   * Optimized profile lookup by slug
   */
  static async getProfileBySlugOptimized(slug: string) {
    const endTimer = DatabaseMonitor.startQuery();

    try {
      // This query uses the idx_profiles_slug index for optimal performance
      const result = await db
        .select()
        .from(profiles)
        .where(
          and(
            eq(profiles.slug, slug),
            eq(profiles.isActive, true)
          )
        )
        .limit(1);

      const duration = endTimer();
      if (duration > 100) { // Profile lookups should be very fast
        DatabaseMonitor.recordSlowQuery('getProfileBySlugOptimized', duration);
      }

      return result[0] || null;
    } catch (error) {
      endTimer();
      throw error;
    }
  }

  /**
   * Optimized public profiles listing with pagination
   */
  static async getPublicProfilesOptimized(limit: number, offset: number) {
    const endTimer = DatabaseMonitor.startQuery();

    try {
      // Uses idx_profiles_public_active_created for optimal performance
      const publicProfiles = await db
        .select({
          id: profiles.id,
          slug: profiles.slug,
          name: profiles.name,
          bio: profiles.bio,
          skills: profiles.skills,
          availableFor: profiles.availableFor,
          linkedinUrl: profiles.linkedinUrl,
          otherLinks: profiles.otherLinks,
          createdAt: profiles.createdAt,
        })
        .from(profiles)
        .where(
          and(
            eq(profiles.isPublic, true),
            eq(profiles.isActive, true)
          )
        )
        .orderBy(desc(profiles.createdAt))
        .limit(limit)
        .offset(offset);

      // Get total count for pagination
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(profiles)
        .where(
          and(
            eq(profiles.isPublic, true),
            eq(profiles.isActive, true)
          )
        );

      const duration = endTimer();
      if (duration > 300) {
        DatabaseMonitor.recordSlowQuery('getPublicProfilesOptimized', duration);
      }

      return {
        profiles: publicProfiles,
        totalCount: countResult[0]?.count || 0
      };
    } catch (error) {
      endTimer();
      throw error;
    }
  }

  /**
   * Optimized appointment queries for a profile
   */
  static async getProfileAppointmentsOptimized(profileId: number, status?: string) {
    const endTimer = DatabaseMonitor.startQuery();

    try {
      const whereConditions = [eq(appointments.profileId, profileId)];
      
      if (status) {
        whereConditions.push(eq(appointments.status, status));
      }

      // Uses idx_appointments_profile_status for optimal performance
      const result = await db
        .select()
        .from(appointments)
        .where(and(...whereConditions))
        .orderBy(desc(appointments.createdAt));

      const duration = endTimer();
      if (duration > 200) {
        DatabaseMonitor.recordSlowQuery('getProfileAppointmentsOptimized', duration);
      }

      return result;
    } catch (error) {
      endTimer();
      throw error;
    }
  }

  /**
   * Batch profile updates with optimized queries
   */
  static async batchUpdateProfilesOptimized(updates: Array<{ id: number; data: any }>) {
    const endTimer = DatabaseMonitor.startQuery();

    try {
      const results = [];
      
      // Use transaction for batch updates
      for (const update of updates) {
        const result = await db
          .update(profiles)
          .set({
            ...update.data,
            updatedAt: new Date()
          })
          .where(eq(profiles.id, update.id))
          .returning();
        
        results.push(result[0]);
      }

      const duration = endTimer();
      if (duration > 1000) {
        DatabaseMonitor.recordSlowQuery('batchUpdateProfilesOptimized', duration);
      }

      return results;
    } catch (error) {
      endTimer();
      throw error;
    }
  }

  /**
   * Database health check and performance analysis
   */
  static async performHealthCheck() {
    const endTimer = DatabaseMonitor.startQuery();

    try {
      // Check basic connectivity and get table stats
      const profileCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(profiles);

      const appointmentCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(appointments);

      // Check index usage (PostgreSQL specific)
      const indexStats = await db.execute(sql`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes 
        WHERE schemaname = 'public'
        ORDER BY idx_tup_read DESC
        LIMIT 10
      `);

      const duration = endTimer();

      return {
        status: 'healthy',
        profileCount: profileCount[0]?.count || 0,
        appointmentCount: appointmentCount[0]?.count || 0,
        indexStats: indexStats.rows,
        performanceStats: DatabaseMonitor.getPerformanceStats(),
        healthCheckDuration: duration
      };
    } catch (error) {
      endTimer();
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        performanceStats: DatabaseMonitor.getPerformanceStats()
      };
    }
  }

  /**
   * Analyze and suggest query optimizations
   */
  static async analyzeQueryPerformance() {
    try {
      // Get slow query log from PostgreSQL
      const slowQueries = await db.execute(sql`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows
        FROM pg_stat_statements 
        WHERE mean_time > 100
        ORDER BY mean_time DESC
        LIMIT 20
      `);

      // Get table sizes
      const tableSizes = await db.execute(sql`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `);

      return {
        slowQueries: slowQueries.rows,
        tableSizes: tableSizes.rows,
        recommendations: this.generateOptimizationRecommendations(slowQueries.rows)
      };
    } catch (error) {
      console.warn('Query performance analysis not available:', error);
      return {
        slowQueries: [],
        tableSizes: [],
        recommendations: []
      };
    }
  }

  private static generateOptimizationRecommendations(slowQueries: any[]): string[] {
    const recommendations: string[] = [];

    if (slowQueries.length > 0) {
      recommendations.push('Consider adding indexes for frequently queried columns');
      recommendations.push('Review and optimize queries with high mean_time');
      recommendations.push('Consider query result caching for repeated queries');
    }

    recommendations.push('Regularly run ANALYZE on tables to update statistics');
    recommendations.push('Monitor connection pool usage and adjust if needed');
    recommendations.push('Consider read replicas for read-heavy workloads');

    return recommendations;
  }
}

/**
 * Query optimization utilities
 */
export class QueryOptimizer {
  
  /**
   * Build optimized WHERE conditions for profile searches
   */
  static buildProfileSearchConditions(params: {
    isPublic?: boolean;
    isActive?: boolean;
    query?: string;
    skills?: string[];
    availableFor?: string[];
  }) {
    const conditions = [];

    // Always filter by active status first (most selective)
    if (params.isActive !== undefined) {
      conditions.push(eq(profiles.isActive, params.isActive));
    }

    // Then by public status (second most selective)
    if (params.isPublic !== undefined) {
      conditions.push(eq(profiles.isPublic, params.isPublic));
    }

    // Text search conditions (use indexes efficiently)
    if (params.query) {
      conditions.push(
        or(
          sql`LOWER(${profiles.name}) LIKE LOWER(${`%${params.query}%`})`,
          sql`to_tsvector('english', COALESCE(${profiles.bio}, '')) @@ plainto_tsquery('english', ${params.query})`
        )!
      );
    }

    // Array conditions (use GIN indexes)
    if (params.skills && params.skills.length > 0) {
      conditions.push(sql`${profiles.skills} && ${params.skills}::text[]`);
    }

    if (params.availableFor && params.availableFor.length > 0) {
      conditions.push(sql`${profiles.availableFor} && ${params.availableFor}::text[]`);
    }

    return conditions;
  }

  /**
   * Build optimized ORDER BY clauses
   */
  static buildOptimizedOrderBy(params: {
    sortBy?: 'name' | 'created' | 'updated' | 'relevance';
    sortOrder?: 'asc' | 'desc';
    searchQuery?: string;
  }) {
    const { sortBy = 'created', sortOrder = 'desc', searchQuery } = params;

    switch (sortBy) {
      case 'name':
        return sortOrder === 'asc' ? asc(profiles.name) : desc(profiles.name);
      
      case 'updated':
        return sortOrder === 'asc' ? asc(profiles.updatedAt) : desc(profiles.updatedAt);
      
      case 'relevance':
        if (searchQuery) {
          return [
            sql`CASE WHEN LOWER(${profiles.name}) = LOWER(${searchQuery}) THEN 0 ELSE 1 END`,
            desc(profiles.createdAt)
          ];
        }
        return desc(profiles.createdAt);
      
      case 'created':
      default:
        return sortOrder === 'asc' ? asc(profiles.createdAt) : desc(profiles.createdAt);
    }
  }
}