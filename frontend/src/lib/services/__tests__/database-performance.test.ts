import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DatabasePerformanceService, QueryOptimizer } from '../database-performance';
import { DatabaseMonitor } from '@/lib/db/connection';

// Mock the database connection
vi.mock('@/lib/db/connection', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    execute: vi.fn(),
  },
  DatabaseMonitor: {
    startQuery: vi.fn(() => vi.fn(() => 100)), // Mock timer that returns 100ms
    recordSlowQuery: vi.fn(),
    getPerformanceStats: vi.fn(() => ({
      averageQueryTime: 150,
      slowestQuery: 500,
      fastestQuery: 50,
      totalQueries: 10,
      slowQueries: []
    })),
    resetStats: vi.fn(),
  }
}));

// Mock the schema
vi.mock('@/lib/db/schema', () => ({
  profiles: {
    id: 'id',
    slug: 'slug',
    name: 'name',
    bio: 'bio',
    skills: 'skills',
    availableFor: 'availableFor',
    isPublic: 'isPublic',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  appointments: {
    id: 'id',
    profileId: 'profileId',
    status: 'status',
    createdAt: 'createdAt',
  }
}));

describe('DatabasePerformanceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchProfilesOptimized', () => {
    it('should execute optimized search query with proper parameters', async () => {
      const mockProfiles = [
        {
          id: 1,
          slug: 'john-doe',
          name: 'John Doe',
          bio: 'Software developer',
          skills: ['JavaScript', 'React'],
          availableFor: ['meetings'],
          createdAt: new Date(),
        }
      ];

      const mockDb = await import('@/lib/db/connection');
      (mockDb.db.select as any).mockResolvedValueOnce(mockProfiles);
      (mockDb.db.select as any).mockResolvedValueOnce([{ count: 1 }]);

      const result = await DatabasePerformanceService.searchProfilesOptimized({
        query: 'John',
        skills: ['JavaScript'],
        availableFor: ['meetings'],
        limit: 10,
        offset: 0
      });

      expect(result).toEqual({
        profiles: mockProfiles,
        totalCount: 1
      });

      // Verify that performance monitoring was called
      expect(DatabaseMonitor.startQuery).toHaveBeenCalled();
    });

    it('should record slow queries when they exceed threshold', async () => {
      const mockDb = await import('@/lib/db/connection');
      
      // Mock a slow query (return 1500ms)
      (DatabaseMonitor.startQuery as any).mockReturnValueOnce(() => 1500);
      (mockDb.db.select as any).mockResolvedValueOnce([]);
      (mockDb.db.select as any).mockResolvedValueOnce([{ count: 0 }]);

      await DatabasePerformanceService.searchProfilesOptimized({
        query: 'test',
        limit: 10,
        offset: 0
      });

      expect(DatabaseMonitor.recordSlowQuery).toHaveBeenCalledWith(
        'searchProfilesOptimized',
        1500
      );
    });
  });

  describe('getProfileBySlugOptimized', () => {
    it('should retrieve profile by slug efficiently', async () => {
      const mockProfile = {
        id: 1,
        slug: 'john-doe',
        name: 'John Doe',
        isActive: true,
      };

      const mockDb = await import('@/lib/db/connection');
      (mockDb.db.select as any).mockResolvedValueOnce([mockProfile]);

      const result = await DatabasePerformanceService.getProfileBySlugOptimized('john-doe');

      expect(result).toEqual(mockProfile);
      expect(DatabaseMonitor.startQuery).toHaveBeenCalled();
    });

    it('should return null for non-existent profile', async () => {
      const mockDb = await import('@/lib/db/connection');
      (mockDb.db.select as any).mockResolvedValueOnce([]);

      const result = await DatabasePerformanceService.getProfileBySlugOptimized('non-existent');

      expect(result).toBeNull();
    });

    it('should record slow query warning for profile lookups over 100ms', async () => {
      const mockDb = await import('@/lib/db/connection');
      
      // Mock a slow profile lookup (150ms)
      (DatabaseMonitor.startQuery as any).mockReturnValueOnce(() => 150);
      (mockDb.db.select as any).mockResolvedValueOnce([{ id: 1 }]);

      await DatabasePerformanceService.getProfileBySlugOptimized('test-slug');

      expect(DatabaseMonitor.recordSlowQuery).toHaveBeenCalledWith(
        'getProfileBySlugOptimized',
        150
      );
    });
  });

  describe('performHealthCheck', () => {
    it('should return health status with performance stats', async () => {
      const mockDb = await import('@/lib/db/connection');
      (mockDb.db.select as any).mockResolvedValueOnce([{ count: 100 }]);
      (mockDb.db.select as any).mockResolvedValueOnce([{ count: 50 }]);
      (mockDb.db.execute as any).mockResolvedValueOnce({ rows: [] });

      const result = await DatabasePerformanceService.performHealthCheck();

      expect(result.status).toBe('healthy');
      expect(result.profileCount).toBe(100);
      expect(result.appointmentCount).toBe(50);
      expect(result.performanceStats).toBeDefined();
    });

    it('should return unhealthy status on database error', async () => {
      const mockDb = await import('@/lib/db/connection');
      (mockDb.db.select as any).mockRejectedValueOnce(new Error('Database connection failed'));

      const result = await DatabasePerformanceService.performHealthCheck();

      expect(result.status).toBe('unhealthy');
      expect(result.error).toBe('Database connection failed');
    });
  });
});

describe('QueryOptimizer', () => {
  describe('buildProfileSearchConditions', () => {
    it('should build optimized search conditions', () => {
      const conditions = QueryOptimizer.buildProfileSearchConditions({
        isPublic: true,
        isActive: true,
        query: 'developer',
        skills: ['JavaScript', 'React'],
        availableFor: ['meetings']
      });

      expect(conditions).toHaveLength(5); // All conditions should be present
    });

    it('should handle empty parameters', () => {
      const conditions = QueryOptimizer.buildProfileSearchConditions({});

      expect(conditions).toHaveLength(0);
    });
  });

  describe('buildOptimizedOrderBy', () => {
    it('should build relevance-based ordering for search queries', () => {
      const orderBy = QueryOptimizer.buildOptimizedOrderBy({
        sortBy: 'relevance',
        searchQuery: 'John Doe'
      });

      expect(Array.isArray(orderBy)).toBe(true);
      expect(orderBy).toHaveLength(2); // Should have relevance and fallback ordering
    });

    it('should build simple ordering for non-search queries', () => {
      const orderBy = QueryOptimizer.buildOptimizedOrderBy({
        sortBy: 'name',
        sortOrder: 'asc'
      });

      expect(orderBy).toBeDefined();
    });
  });
});

describe('DatabaseMonitor', () => {
  beforeEach(() => {
    DatabaseMonitor.resetStats();
  });

  it('should track query performance', () => {
    const endTimer = DatabaseMonitor.startQuery();
    
    // Simulate query execution time
    setTimeout(() => {
      const duration = endTimer();
      expect(duration).toBeGreaterThan(0);
    }, 10);
  });

  it('should provide performance statistics', () => {
    const stats = DatabaseMonitor.getPerformanceStats();
    
    expect(stats).toHaveProperty('averageQueryTime');
    expect(stats).toHaveProperty('slowestQuery');
    expect(stats).toHaveProperty('fastestQuery');
    expect(stats).toHaveProperty('totalQueries');
    expect(stats).toHaveProperty('slowQueries');
  });

  it('should reset statistics', () => {
    DatabaseMonitor.recordSlowQuery('test query', 1000);
    DatabaseMonitor.resetStats();
    
    const stats = DatabaseMonitor.getPerformanceStats();
    expect(stats.totalQueries).toBe(0);
    expect(stats.slowQueries).toHaveLength(0);
  });
});