/**
 * Utility functions for slug operations
 * Re-exports from the slug service for easier imports
 */

export { 
  generateSlug, 
  validateSlug, 
  isSlugAvailable, 
  updateSlug,
  slugService 
} from '../services/slug-service';

/**
 * Common slug validation patterns and constants
 */
export const SLUG_CONSTRAINTS = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 50,
  PATTERN: /^[a-z0-9-]{3,50}$/,
  INVALID_PATTERNS: [
    /^-/, // starts with hyphen
    /-$/, // ends with hyphen
    /--/, // consecutive hyphens
  ]
} as const;

/**
 * Check if a string would make a valid slug base (before uniqueness check)
 * @param input - The input string to check
 * @returns boolean - True if it could be converted to a valid slug
 */
export function canMakeValidSlug(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }
  
  // Check if there are any valid characters after processing
  const processed = input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  return processed.length > 0;
}

/**
 * Preview what a slug would look like without checking availability
 * @param name - The name to convert to slug format
 * @returns string - The slug preview (may not be unique)
 */
export function previewSlug(name: string): string {
  if (!canMakeValidSlug(name)) {
    return '';
  }
  
  const processed = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  return processed
    .padEnd(3, '0')
    .substring(0, 50);
}