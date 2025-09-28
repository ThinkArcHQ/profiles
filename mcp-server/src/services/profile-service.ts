/**
 * Profile Service for MCP Server
 * 
 * Handles profile-related operations including fetching profile data
 * and ensuring privacy controls are respected.
 */

import { MCPProfile } from "../types/index.js";
import { MCPError } from "../utils/error-handling.js";

export class ProfileService {
  private baseUrl: string;

  constructor() {
    // In production, this would connect to the actual database or API
    // For template purposes, we'll use the main website API
    this.baseUrl = process.env.API_BASE_URL || "https://persons.finderbee.ai/api";
  }

  /**
   * Get a profile by slug, ensuring it's public
   */
  async getProfileBySlug(slug: string): Promise<MCPProfile | null> {
    try {
      // TODO: Replace with actual database query or API call
      // This is a template implementation
      
      // In production, this would:
      // 1. Query the database for the profile by slug
      // 2. Check if the profile is public (isPublic = true)
      // 3. Transform the profile data to exclude sensitive information
      // 4. Return the MCPProfile format
      
      const response = await this.fetchProfileFromAPI(slug);
      
      if (!response || !response.isPublic) {
        return null;
      }

      return this.transformToMCPProfile(response);
    } catch (error) {
      console.error(`Error fetching profile ${slug}:`, error);
      throw new MCPError(`Failed to fetch profile: ${slug}`, "PROFILE_FETCH_ERROR");
    }
  }

  /**
   * Fetch profile from the main website API (template implementation)
   */
  private async fetchProfileFromAPI(slug: string): Promise<any> {
    // Template implementation - in production this would be a real API call
    // or direct database query
    
    try {
      const response = await fetch(`${this.baseUrl}/profiles/slug/${slug}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`API request failed: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("API fetch error:", error);
      return null;
    }
  }

  /**
   * Transform internal profile data to MCP format
   */
  private transformToMCPProfile(profileData: any): MCPProfile {
    return {
      slug: profileData.slug,
      name: profileData.name,
      bio: profileData.bio,
      skills: profileData.skills || [],
      availableFor: profileData.availableFor || [],
      profileUrl: `https://persons.finderbee.ai/profiles/${profileData.slug}`,
      linkedinUrl: profileData.linkedinUrl,
      otherLinks: profileData.otherLinks || {}
      // Note: email is intentionally excluded for privacy
    };
  }

  /**
   * Validate that a profile exists and is public
   */
  async validateProfileAccess(slug: string): Promise<boolean> {
    const profile = await this.getProfileBySlug(slug);
    return profile !== null;
  }
}