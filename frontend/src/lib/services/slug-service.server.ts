/**
 * Server-side slug service with database operations
 * This file should only be imported in API routes or server components
 */

import { db } from '../db/connection';
import { profiles } from '../db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { validateSlug, createBaseSlug } from './slug-service';

export interface SlugService {
  generateSlug(name: string): Promise<string>;
  isSlugAvailable(slug: string, excludeUserId?: string): Promise<boolean>;
  updateSlug(userId: string, newSlug: string): Promise<void>;
}

/**
 * Server-side service for generating and managing user profile slugs
 */
export class SlugServiceImpl implements SlugService {
  /**
   * Generate a unique slug from a user's name
   * @param name - The user's full name
   * @returns Promise<string> - A unique slug
   */
  async generateSlug(name: string): Promise<string> {
    // Create base slug from name
    const baseSlug = createBaseSlug(name);
    
    // Validate the base slug format
    if (!validateSlug(baseSlug)) {
      throw new Error(`Invalid slug format generated from name: ${name}`);
    }
    
    // Check if base slug is available
    if (await this.isSlugAvailable(baseSlug)) {
      return baseSlug;
    }
    
    // If not available, find a unique variant
    return await this.findUniqueSlug(baseSlug);
  }

  /**
   * Check if a slug is available in the database
   * @param slug - The slug to check
   * @param excludeUserId - Optional user ID to exclude from check (for updates)
   * @returns Promise<boolean> - True if available, false if taken
   */
  async isSlugAvailable(slug: string, excludeUserId?: string): Promise<boolean> {
    try {
      let query = db.select({ id: profiles.id }).from(profiles).where(eq(profiles.slug, slug));
      
      // If excluding a specific user (for updates), add that condition
      if (excludeUserId) {
        query = db.select({ id: profiles.id })
          .from(profiles)
          .where(and(
            eq(profiles.slug, slug),
            ne(profiles.workosUserId, excludeUserId)
          ));
      }
      
      const result = await query.limit(1);
      return result.length === 0;
    } catch (error) {
      console.error('Error checking slug availability:', error);
      throw new Error('Failed to check slug availability');
    }
  }

  /**
   * Update a user's slug
   * @param userId - The WorkOS user ID
   * @param newSlug - The new slug to set
   */
  async updateSlug(userId: string, newSlug: string): Promise<void> {
    // Validate the new slug
    if (!validateSlug(newSlug)) {
      throw new Error('Invalid slug format');
    }
    
    // Check if the slug is available (excluding current user)
    if (!(await this.isSlugAvailable(newSlug, userId))) {
      throw new Error('Slug is already taken');
    }
    
    try {
      await db
        .update(profiles)
        .set({ 
          slug: newSlug,
          updatedAt: new Date()
        })
        .where(eq(profiles.workosUserId, userId));
    } catch (error) {
      console.error('Error updating slug:', error);
      throw new Error('Failed to update slug');
    }
  }

  /**
   * Find a unique slug by appending numbers
   * @param baseSlug - The base slug to make unique
   * @returns Promise<string> - A unique slug
   */
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
}

// Export singleton instance
export const slugService = new SlugServiceImpl();

// Export utility functions for direct use
export const generateSlug = (name: string) => slugService.generateSlug(name);
export const isSlugAvailable = (slug: string, excludeUserId?: string) => 
  slugService.isSlugAvailable(slug, excludeUserId);
export const updateSlug = (userId: string, newSlug: string) => 
  slugService.updateSlug(userId, newSlug);