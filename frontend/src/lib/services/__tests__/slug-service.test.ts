import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create a testable version of the slug service that doesn't depend on database
class TestableSlugService {
  private mockDatabase: Map<string, { slug: string; workosUserId: string }> = new Map();

  validateSlug(slug: string): boolean {
    // Requirements: 3-50 chars, lowercase letters, numbers, and hyphens only
    const slugRegex = /^[a-z0-9-]{3,50}$/;
    
    // Additional checks
    if (!slugRegex.test(slug)) {
      return false;
    }
    
    // Cannot start or end with hyphen
    if (slug.startsWith('-') || slug.endsWith('-')) {
      return false;
    }
    
    // Cannot have consecutive hyphens
    if (slug.includes('--')) {
      return false;
    }
    
    return true;
  }

  async isSlugAvailable(slug: string, excludeUserId?: string): Promise<boolean> {
    for (const [id, profile] of this.mockDatabase) {
      if (profile.slug === slug && profile.workosUserId !== excludeUserId) {
        return false;
      }
    }
    return true;
  }

  createBaseSlug(name: string): string {
    const processed = name
      .toLowerCase()
      .trim()
      // Replace spaces and multiple whitespace with single hyphen
      .replace(/\s+/g, '-')
      // Remove special characters, keep only alphanumeric and hyphens
      .replace(/[^a-z0-9-]/g, '')
      // Remove consecutive hyphens
      .replace(/-+/g, '-')
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, '');
    
    // If we have no valid characters left, return empty string to trigger error
    if (!processed || processed.length === 0) {
      return '';
    }
    
    return processed
      // Ensure minimum length by padding if necessary
      .padEnd(3, '0')
      // Ensure maximum length
      .substring(0, 50);
  }

  async generateSlug(name: string): Promise<string> {
    // Create base slug from name
    const baseSlug = this.createBaseSlug(name);
    
    // Validate the base slug format
    if (!this.validateSlug(baseSlug)) {
      throw new Error(`Invalid slug format generated from name: ${name}`);
    }
    
    // Check if base slug is available
    if (await this.isSlugAvailable(baseSlug)) {
      return baseSlug;
    }
    
    // If not available, find a unique variant
    return await this.findUniqueSlug(baseSlug);
  }

  private async findUniqueSlug(baseSlug: string): Promise<string> {
    let counter = 2;
    let candidateSlug: string;
    
    // Try appending numbers until we find an available slug
    do {
      candidateSlug = `${baseSlug}-${counter}`;
      
      // Ensure the candidate doesn't exceed length limit
      if (candidateSlug.length > 50) {
        // Truncate base slug to make room for the number
        const maxBaseLength = 50 - `-${counter}`.length;
        candidateSlug = `${baseSlug.substring(0, maxBaseLength)}-${counter}`;
      }
      
      counter++;
      
      // Safety check to prevent infinite loops
      if (counter > 9999) {
        throw new Error('Unable to generate unique slug after 9999 attempts');
      }
    } while (!(await this.isSlugAvailable(candidateSlug)));
    
    return candidateSlug;
  }

  // Test helper methods
  addMockProfile(id: string, slug: string, workosUserId: string) {
    this.mockDatabase.set(id, { slug, workosUserId });
  }

  clearMockDatabase() {
    this.mockDatabase.clear();
  }
}

describe('SlugService', () => {
  let slugService: TestableSlugService;

  beforeEach(() => {
    slugService = new TestableSlugService();
    slugService.clearMockDatabase();
  });

  describe('validateSlug', () => {
    it('should validate correct slug formats', () => {
      expect(slugService.validateSlug('john-doe')).toBe(true);
      expect(slugService.validateSlug('jane-smith-123')).toBe(true);
      expect(slugService.validateSlug('user123')).toBe(true);
      expect(slugService.validateSlug('a-b-c')).toBe(true);
      expect(slugService.validateSlug('test')).toBe(true);
    });

    it('should reject slugs that are too short', () => {
      expect(slugService.validateSlug('ab')).toBe(false);
      expect(slugService.validateSlug('a')).toBe(false);
      expect(slugService.validateSlug('')).toBe(false);
    });

    it('should reject slugs that are too long', () => {
      const longSlug = 'a'.repeat(51);
      expect(slugService.validateSlug(longSlug)).toBe(false);
    });

    it('should reject slugs with invalid characters', () => {
      expect(slugService.validateSlug('john_doe')).toBe(false); // underscore
      expect(slugService.validateSlug('john.doe')).toBe(false); // period
      expect(slugService.validateSlug('john doe')).toBe(false); // space
      expect(slugService.validateSlug('john@doe')).toBe(false); // special char
      expect(slugService.validateSlug('JOHN-DOE')).toBe(false); // uppercase
    });

    it('should reject slugs starting or ending with hyphens', () => {
      expect(slugService.validateSlug('-john-doe')).toBe(false);
      expect(slugService.validateSlug('john-doe-')).toBe(false);
      expect(slugService.validateSlug('-john-doe-')).toBe(false);
    });

    it('should reject slugs with consecutive hyphens', () => {
      expect(slugService.validateSlug('john--doe')).toBe(false);
      expect(slugService.validateSlug('john---doe')).toBe(false);
    });
  });

  describe('createBaseSlug', () => {
    it('should create slug from simple names', () => {
      const slug = slugService.createBaseSlug('John Doe');
      expect(slug).toBe('john-doe');
    });

    it('should handle names with special characters', () => {
      const slug = slugService.createBaseSlug('John O\'Connor');
      expect(slug).toBe('john-oconnor');
    });

    it('should handle names with multiple spaces', () => {
      const slug = slugService.createBaseSlug('John   Middle   Doe');
      expect(slug).toBe('john-middle-doe');
    });

    it('should handle names with numbers', () => {
      const slug = slugService.createBaseSlug('John Doe 123');
      expect(slug).toBe('john-doe-123');
    });

    it('should handle very short names by padding', () => {
      const slug = slugService.createBaseSlug('Jo');
      expect(slug).toBe('jo0');
    });

    it('should truncate very long names', () => {
      const longName = 'John ' + 'Very '.repeat(20) + 'Long Name';
      const slug = slugService.createBaseSlug(longName);
      expect(slug.length).toBeLessThanOrEqual(50);
    });

    it('should handle names with leading/trailing spaces', () => {
      const slug = slugService.createBaseSlug('  John Doe  ');
      expect(slug).toBe('john-doe');
    });

    it('should handle unicode characters by removing them', () => {
      const slug = slugService.createBaseSlug('José María');
      expect(slug).toBe('jos-mara');
    });
  });

  describe('isSlugAvailable', () => {
    it('should return true when slug is available', async () => {
      const result = await slugService.isSlugAvailable('john-doe');
      expect(result).toBe(true);
    });

    it('should return false when slug is taken', async () => {
      slugService.addMockProfile('1', 'john-doe', 'user123');
      
      const result = await slugService.isSlugAvailable('john-doe');
      expect(result).toBe(false);
    });

    it('should exclude specific user when checking availability', async () => {
      slugService.addMockProfile('1', 'john-doe', 'user123');
      
      // Should return true when excluding the user who owns the slug
      const result = await slugService.isSlugAvailable('john-doe', 'user123');
      expect(result).toBe(true);
      
      // Should return false when not excluding the user
      const result2 = await slugService.isSlugAvailable('john-doe', 'user456');
      expect(result2).toBe(false);
    });
  });

  describe('generateSlug', () => {
    it('should return base slug when available', async () => {
      const slug = await slugService.generateSlug('John Doe');
      expect(slug).toBe('john-doe');
    });

    it('should append number when base slug is taken', async () => {
      slugService.addMockProfile('1', 'john-doe', 'user123');
      
      const slug = await slugService.generateSlug('John Doe');
      expect(slug).toBe('john-doe-2');
    });

    it('should try multiple numbers until finding available slug', async () => {
      slugService.addMockProfile('1', 'john-doe', 'user123');
      slugService.addMockProfile('2', 'john-doe-2', 'user456');
      slugService.addMockProfile('3', 'john-doe-3', 'user789');
      
      const slug = await slugService.generateSlug('John Doe');
      expect(slug).toBe('john-doe-4');
    });

    it('should handle very long base slugs when appending numbers', async () => {
      const longName = 'John ' + 'Very'.repeat(15) + ' Name';
      const baseSlug = slugService.createBaseSlug(longName);
      slugService.addMockProfile('1', baseSlug, 'user123');
      
      const slug = await slugService.generateSlug(longName);
      expect(slug.length).toBeLessThanOrEqual(50);
      expect(slug).toMatch(/-\d+$/); // Should end with a number
    });

    it('should throw error for invalid names that produce invalid slugs', async () => {
      await expect(slugService.generateSlug('!@#$%')).rejects.toThrow('Invalid slug format generated from name');
    });

    it('should handle empty string names', async () => {
      await expect(slugService.generateSlug('')).rejects.toThrow('Invalid slug format generated from name');
    });

    it('should handle names with only special characters', async () => {
      await expect(slugService.generateSlug('!@#$%^&*()')).rejects.toThrow('Invalid slug format generated from name');
    });

    it('should handle names with only spaces', async () => {
      await expect(slugService.generateSlug('   ')).rejects.toThrow('Invalid slug format generated from name');
    });
  });

  describe('edge cases and comprehensive validation', () => {
    it('should handle complex names correctly', async () => {
      const testCases = [
        { input: 'John Doe', expected: 'john-doe' },
        { input: 'Mary-Jane Watson', expected: 'mary-jane-watson' },
        { input: 'Dr. John Smith Jr.', expected: 'dr-john-smith-jr' },
        { input: 'Jean-Claude Van Damme', expected: 'jean-claude-van-damme' },
        { input: 'O\'Connor', expected: 'oconnor' },
        { input: 'José María García', expected: 'jos-mara-garca' },
        { input: '123 Test User', expected: '123-test-user' },
        { input: 'User   With   Spaces', expected: 'user-with-spaces' },
      ];

      for (const testCase of testCases) {
        const slug = await slugService.generateSlug(testCase.input);
        expect(slug).toBe(testCase.expected);
      }
    });

    it('should handle edge cases in slug generation', async () => {
      // Test minimum length padding
      const shortSlug = await slugService.generateSlug('AB');
      expect(shortSlug).toBe('ab0');
      expect(slugService.validateSlug(shortSlug)).toBe(true);

      // Test maximum length truncation
      const longName = 'A'.repeat(100);
      const longSlug = await slugService.generateSlug(longName);
      expect(longSlug.length).toBeLessThanOrEqual(50);
      expect(slugService.validateSlug(longSlug)).toBe(true);
    });

    it('should handle numbering with length constraints', async () => {
      // Create a base slug that's close to the 50 character limit
      const longBase = 'a'.repeat(47); // 47 chars, leaves room for "-2" (3 chars)
      slugService.addMockProfile('1', longBase, 'user1');
      
      const result = await slugService.generateSlug('A'.repeat(47));
      expect(result).toBe(longBase + '-2');
      expect(result.length).toBeLessThanOrEqual(50);
    });

    it('should handle numbering when base slug is at max length', async () => {
      // Create a base slug that's exactly 50 characters
      const maxBase = 'a'.repeat(50);
      slugService.addMockProfile('1', maxBase, 'user1');
      
      const result = await slugService.generateSlug('A'.repeat(50));
      // Should truncate base and add number
      expect(result.length).toBeLessThanOrEqual(50);
      expect(result).toMatch(/-\d+$/);
    });
  });
});