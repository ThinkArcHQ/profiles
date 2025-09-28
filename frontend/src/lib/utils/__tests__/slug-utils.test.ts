import { describe, it, expect, vi } from 'vitest';

// Mock the database connection
vi.mock('../../db/connection', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([])
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

import { canMakeValidSlug, previewSlug, SLUG_CONSTRAINTS } from '../slug-utils';

describe('Slug Utils', () => {
  describe('SLUG_CONSTRAINTS', () => {
    it('should have correct constraint values', () => {
      expect(SLUG_CONSTRAINTS.MIN_LENGTH).toBe(3);
      expect(SLUG_CONSTRAINTS.MAX_LENGTH).toBe(50);
      expect(SLUG_CONSTRAINTS.PATTERN).toEqual(/^[a-z0-9-]{3,50}$/);
      expect(SLUG_CONSTRAINTS.INVALID_PATTERNS).toHaveLength(3);
    });
  });

  describe('canMakeValidSlug', () => {
    it('should return true for valid names', () => {
      expect(canMakeValidSlug('John Doe')).toBe(true);
      expect(canMakeValidSlug('Mary-Jane')).toBe(true);
      expect(canMakeValidSlug('User123')).toBe(true);
      expect(canMakeValidSlug('A')).toBe(true); // Will be padded
    });

    it('should return false for invalid names', () => {
      expect(canMakeValidSlug('')).toBe(false);
      expect(canMakeValidSlug('   ')).toBe(false);
      expect(canMakeValidSlug('!@#$%')).toBe(false);
      expect(canMakeValidSlug(null as any)).toBe(false);
      expect(canMakeValidSlug(undefined as any)).toBe(false);
    });
  });

  describe('previewSlug', () => {
    it('should preview slugs correctly', () => {
      expect(previewSlug('John Doe')).toBe('john-doe');
      expect(previewSlug('Mary-Jane Watson')).toBe('mary-jane-watson');
      expect(previewSlug('Dr. Smith Jr.')).toBe('dr-smith-jr');
      expect(previewSlug('User   123')).toBe('user-123');
    });

    it('should handle edge cases', () => {
      expect(previewSlug('A')).toBe('a00'); // Padded to minimum length
      expect(previewSlug('AB')).toBe('ab0'); // Padded to minimum length
      expect(previewSlug('')).toBe(''); // Invalid input
      expect(previewSlug('!@#$%')).toBe(''); // No valid characters
    });

    it('should truncate long names', () => {
      const longName = 'A'.repeat(100);
      const preview = previewSlug(longName);
      expect(preview.length).toBeLessThanOrEqual(50);
    });
  });
});