/**
 * Slug Service Concurrent Usage Tests
 * 
 * This test suite verifies that slug generation and uniqueness work correctly
 * under concurrent usage scenarios, ensuring no duplicate slugs are created.
 * 
 * Requirements tested:
 * - 1.3: Test slug generation and uniqueness under concurrent usage
 * - 1.1: Generate unique slug based on name
 * - 1.2: Contain only lowercase letters, numbers, and hyphens
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the database connection
vi.mock('../../db/connection', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('../../db/schema', () => ({
  profiles: {
    id: 'id',
    slug: 'slug',
    workosUserId: 'workosUserId',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
  ne: vi.fn(),
}));

import { db } from '../../db/connection';
import { SlugServiceImpl } from '../slug-service';

const mockDb = db as any;

describe('Slug Service Concurrent Usage Tests', () => {
  let slugService: SlugServiceImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    slugService = new SlugServiceImpl();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Concurrent Slug Generation (Requirement 1.3)', () => {
    it('should handle concurrent slug generation for the same name', async () => {
      const baseName = 'John Doe';
      const expectedBaseSlug = 'john-doe';

      // Simulate concurrent requests by tracking call order
      let callCount = 0;
      const callResults: string[] = [];

      // Mock database queries to simulate race conditions
      mockDb.select.mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockImplementation(async () => {
              callCount++;
              
              // First few calls find existing slugs, later calls find available ones
              if (callCount <= 3) {
                return [{ slug: `john-doe${callCount > 1 ? `-${callCount - 1}` : ''}` }];
              } else {
                return []; // Slug is available
              }
            }),
          }),
        }),
      }));

      // Run multiple concurrent slug generation requests
      const concurrentPromises = Array.from({ length: 5 }, async (_, index) => {
        const slug = await slugService.generateSlug(baseName);
        callResults.push(slug);
        return slug;
      });

      const results = await Promise.all(concurrentPromises);

      // Verify all results are unique
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBe(results.length);

      // Verify all results follow the expected pattern
      results.forEach((slug, index) => {
        expect(slug).toMatch(/^john-doe(-\d+)?$/);
        expect(slug.length).toBeGreaterThanOrEqual(8); // 'john-doe' is 8 chars
        expect(slug.length).toBeLessThanOrEqual(50);
      });

      // Verify at least some results have numeric suffixes
      const hasNumberedSlugs = results.some(slug => slug.includes('-') && /\d+$/.test(slug));
      expect(hasNumberedSlugs).toBe(true);
    });

    it('should handle concurrent slug availability checks', async () => {
      const testSlug = 'popular-name';
      let checkCount = 0;

      // Mock availability checks to simulate race conditions
      mockDb.select.mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockImplementation(async () => {
              checkCount++;
              
              // First few checks return existing slug (not available)
              // Later checks return empty (available)
              if (checkCount <= 2) {
                return [{ slug: testSlug }];
              } else {
                return [];
              }
            }),
          }),
        }),
      }));

      // Run concurrent availability checks
      const concurrentChecks = Array.from({ length: 5 }, () => 
        slugService.isSlugAvailable(testSlug)
      );

      const results = await Promise.all(concurrentChecks);

      // Some should return false (not available), some should return true (available)
      const hasUnavailable = results.some(result => result === false);
      const hasAvailable = results.some(result => result === true);

      expect(hasUnavailable).toBe(true);
      expect(hasAvailable).toBe(true);
    });

    it('should generate unique slugs under high concurrency', async () => {
      const names = [
        'John Smith',
        'John Smith', // Duplicate name
        'John Smith', // Another duplicate
        'Jane Doe',
        'Jane Doe', // Duplicate name
        'Bob Johnson',
        'Alice Brown',
        'Charlie Wilson',
        'David Miller',
        'Eva Davis',
      ];

      let queryCount = 0;
      const existingSlugs = new Set<string>();

      // Mock database to track generated slugs and prevent duplicates
      mockDb.select.mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockImplementation(async (limit: number) => {
              queryCount++;
              
              // Extract the slug being checked from the mock call context
              // This is a simplified simulation - in real tests, you'd inspect the where clause
              const potentialSlug = `test-slug-${queryCount}`;
              
              if (existingSlugs.has(potentialSlug)) {
                return [{ slug: potentialSlug }]; // Slug exists
              } else {
                existingSlugs.add(potentialSlug);
                return []; // Slug is available
              }
            }),
          }),
        }),
      }));

      // Generate slugs concurrently
      const concurrentPromises = names.map(async (name, index) => {
        // Add small random delay to increase chance of race conditions
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
        return slugService.generateSlug(name);
      });

      const results = await Promise.all(concurrentPromises);

      // Verify all results are unique
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBe(results.length);

      // Verify all results are valid slugs
      results.forEach(slug => {
        expect(slug).toMatch(/^[a-z0-9-]+$/);
        expect(slug.length).toBeGreaterThanOrEqual(3);
        expect(slug.length).toBeLessThanOrEqual(50);
        expect(slug).not.toStartWith('-');
        expect(slug).not.toEndWith('-');
        expect(slug).not.toContain('--');
      });

      // Group results by base name to verify numbering
      const johnSmiths = results.filter(slug => slug.startsWith('john-smith'));
      const janeDoes = results.filter(slug => slug.startsWith('jane-doe'));

      // Should have multiple John Smith variants
      expect(johnSmiths.length).toBe(3);
      expect(janeDoes.length).toBe(2);

      // Verify they have different suffixes
      expect(new Set(johnSmiths).size).toBe(3);
      expect(new Set(janeDoes).size).toBe(2);
    });

    it('should handle database errors during concurrent operations', async () => {
      const testName = 'Test User';
      let errorCount = 0;

      // Mock database to occasionally throw errors
      mockDb.select.mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockImplementation(async () => {
              errorCount++;
              
              // Throw error on some calls to simulate database issues
              if (errorCount % 3 === 0) {
                throw new Error('Database connection timeout');
              }
              
              return []; // Slug available
            }),
          }),
        }),
      }));

      // Run concurrent operations, some should fail
      const concurrentPromises = Array.from({ length: 6 }, async (_, index) => {
        try {
          return await slugService.generateSlug(testName);
        } catch (error) {
          return `error-${index}`;
        }
      });

      const results = await Promise.all(concurrentPromises);

      // Some should succeed, some should fail
      const successes = results.filter(result => result.startsWith('test-user'));
      const errors = results.filter(result => result.startsWith('error-'));

      expect(successes.length).toBeGreaterThan(0);
      expect(errors.length).toBeGreaterThan(0);
      expect(successes.length + errors.length).toBe(6);
    });

    it('should maintain slug format consistency under concurrent load', async () => {
      const testCases = [
        'John O\'Connor',
        'Mary-Jane Watson',
        'Dr. Smith Jr.',
        'Jean-Claude Van Damme',
        'José María García',
        '李小明', // Chinese characters
        'محمد علي', // Arabic characters
        'Владимир Путин', // Cyrillic characters
      ];

      // Mock database to always return available
      mockDb.select.mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]), // Always available
          }),
        }),
      }));

      // Generate slugs concurrently for various name formats
      const concurrentPromises = testCases.map(name => 
        slugService.generateSlug(name)
      );

      const results = await Promise.all(concurrentPromises);

      // Verify all results follow slug format rules
      results.forEach((slug, index) => {
        const originalName = testCases[index];
        
        // Should only contain lowercase letters, numbers, and hyphens
        expect(slug).toMatch(/^[a-z0-9-]+$/);
        
        // Should not start or end with hyphens
        expect(slug).not.toStartWith('-');
        expect(slug).not.toEndWith('-');
        
        // Should not contain consecutive hyphens
        expect(slug).not.toContain('--');
        
        // Should be within length limits
        expect(slug.length).toBeGreaterThanOrEqual(3);
        expect(slug.length).toBeLessThanOrEqual(50);
        
        console.log(`"${originalName}" -> "${slug}"`);
      });

      // Verify all results are unique
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBe(results.length);
    });
  });

  describe('Slug Update Concurrency', () => {
    it('should handle concurrent slug updates safely', async () => {
      const userId = 'user_123';
      const newSlug = 'updated-slug';
      let updateCount = 0;

      // Mock slug availability check
      mockDb.select.mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]), // Slug is available
          }),
        }),
      }));

      // Mock slug update
      mockDb.update.mockImplementation(() => ({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(async () => {
            updateCount++;
            
            // Simulate occasional database conflicts
            if (updateCount === 2) {
              const error = new Error('Unique constraint violation');
              (error as any).code = '23505';
              throw error;
            }
            
            return [{ slug: newSlug }];
          }),
        }),
      }));

      // Run concurrent slug updates
      const concurrentUpdates = Array.from({ length: 3 }, async (_, index) => {
        try {
          await slugService.updateSlug(userId, newSlug);
          return `success-${index}`;
        } catch (error) {
          return `error-${index}`;
        }
      });

      const results = await Promise.all(concurrentUpdates);

      // Some should succeed, one should fail due to constraint violation
      const successes = results.filter(result => result.startsWith('success'));
      const errors = results.filter(result => result.startsWith('error'));

      expect(successes.length).toBe(2);
      expect(errors.length).toBe(1);
    });
  });

  describe('Performance Under Load', () => {
    it('should maintain reasonable performance under concurrent load', async () => {
      const startTime = Date.now();
      const concurrentRequests = 50;
      const baseName = 'Load Test User';

      // Mock database with realistic delays
      mockDb.select.mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockImplementation(async () => {
              // Simulate database query time
              await new Promise(resolve => setTimeout(resolve, Math.random() * 5));
              return []; // Slug available
            }),
          }),
        }),
      }));

      // Generate many slugs concurrently
      const concurrentPromises = Array.from({ length: concurrentRequests }, (_, index) =>
        slugService.generateSlug(`${baseName} ${index}`)
      );

      const results = await Promise.all(concurrentPromises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify all requests completed
      expect(results).toHaveLength(concurrentRequests);

      // Verify all results are unique
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBe(concurrentRequests);

      // Verify reasonable performance (should complete within 5 seconds)
      expect(totalTime).toBeLessThan(5000);

      // Log performance metrics
      console.log(`Generated ${concurrentRequests} unique slugs in ${totalTime}ms`);
      console.log(`Average time per slug: ${(totalTime / concurrentRequests).toFixed(2)}ms`);
    });
  });
});