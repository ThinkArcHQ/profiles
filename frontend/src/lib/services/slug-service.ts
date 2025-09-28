/**
 * Client-side slug validation utilities
 * Database operations are handled by API routes
 */

/**
 * Validate slug format according to requirements
 * @param slug - The slug to validate
 * @returns boolean - True if valid, false otherwise
 */
export function validateSlug(slug: string): boolean {
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

/**
 * Create a base slug from a name (client-side utility)
 * @param name - The user's name
 * @returns string - Base slug
 */
export function createBaseSlug(name: string): string {
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