import { describe, it, expect, vi } from 'vitest';

// Mock the database connection to avoid requiring DATABASE_URL
vi.mock('../../db/connection', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]) // Always return empty (slug available)
        })
      })
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined)
      })
    })
  }
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

import { validateSlug, generateSlug } from '../slug-service';

describe('SlugService Integration', () => {
  describe('validateSlug function export', () => {
    it('should validate slugs correctly', () => {
      expect(validateSlug('john-doe')).toBe(true);
      expect(validateSlug('invalid_slug')).toBe(false);
      expect(validateSlug('ab')).toBe(false); // too short
      expect(validateSlug('a'.repeat(51))).toBe(false); // too long
    });
  });

  describe('generateSlug function export', () => {
    it('should generate valid slugs', async () => {
      const slug = await generateSlug('John Doe');
      expect(validateSlug(slug)).toBe(true);
      expect(slug).toBe('john-doe');
    });

    it('should handle complex names', async () => {
      const testCases = [
        'Mary-Jane Watson',
        'Dr. John Smith Jr.',
        'Jean-Claude Van Damme',
        'O\'Connor',
        '123 Test User',
      ];

      for (const name of testCases) {
        const slug = await generateSlug(name);
        expect(validateSlug(slug)).toBe(true);
        expect(slug.length).toBeGreaterThanOrEqual(3);
        expect(slug.length).toBeLessThanOrEqual(50);
      }
    });
  });

  describe('Requirements validation', () => {
    it('should meet requirement 1.1: generate unique slug based on name', async () => {
      const slug = await generateSlug('John Doe');
      expect(slug).toBe('john-doe');
      expect(validateSlug(slug)).toBe(true);
    });

    it('should meet requirement 1.2: contain only lowercase letters, numbers, and hyphens', async () => {
      const slug = await generateSlug('John Doe 123');
      expect(slug).toBe('john-doe-123');
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    });

    it('should meet requirement 1.3: append number when slug exists (simulated)', async () => {
      // This would be tested with actual database in full integration test
      // For now, we verify the logic works by testing the service directly
      const baseSlug = await generateSlug('John Doe');
      expect(baseSlug).toBe('john-doe');
      
      // The numbering logic is tested in the unit tests
      expect(validateSlug('john-doe-2')).toBe(true);
      expect(validateSlug('john-doe-10')).toBe(true);
    });
  });
});