/**
 * Search Service for MCP Server
 * 
 * Handles profile search operations with privacy filtering
 * and performance optimization.
 */

import { SearchParams, SearchResults, MCPProfile } from "../types/index.js";
import { MCPError } from "../utils/error-handling.js";

export class SearchService {
  private baseUrl: string;

  constructor() {
    // In production, this would connect to the actual database or API
    this.baseUrl = process.env.API_BASE_URL || "https://persons.finderbee.ai/api";
  }

  /**
   * Search for public profiles based on criteria
   */
  async searchProfiles(params: SearchParams): Promise<SearchResults> {
    try {
      // TODO: Replace with actual database query or API call
      // This is a template implementation
      
      // In production, this would:
      // 1. Query the database with proper indexes
      // 2. Filter for public profiles only (isPublic = true)
      // 3. Apply search criteria (query, skills, availableFor)
      // 4. Handle pagination with limit/offset
      // 5. Transform results to MCPProfile format
      
      const searchResults = await this.performSearch(params);
      
      return {
        profiles: searchResults.profiles.map(profile => this.transformToMCPProfile(profile)),
        total: searchResults.total
      };
    } catch (error) {
      console.error("Search error:", error);
      throw new MCPError("Failed to search profiles", "SEARCH_ERROR");
    }
  }

  /**
   * Perform the actual search (template implementation)
   */
  private async performSearch(params: SearchParams): Promise<{ profiles: any[], total: number }> {
    // Template implementation - in production this would be a database query
    // or API call with proper filtering and pagination
    
    try {
      const searchParams = new URLSearchParams();
      
      if (params.query) {
        searchParams.append("q", params.query);
      }
      
      if (params.skills && params.skills.length > 0) {
        searchParams.append("skills", params.skills.join(","));
      }
      
      if (params.availableFor && params.availableFor.length > 0) {
        searchParams.append("available_for", params.availableFor.join(","));
      }
      
      searchParams.append("limit", params.limit.toString());
      searchParams.append("offset", params.offset.toString());
      
      const response = await fetch(`${this.baseUrl}/search?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Search API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        profiles: data.profiles || [],
        total: data.total || 0
      };
    } catch (error) {
      console.error("Search API error:", error);
      // Return empty results on error rather than failing
      return { profiles: [], total: 0 };
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
   * Build search query for database (template for future implementation)
   */
  private buildSearchQuery(params: SearchParams): string {
    // Template for future database query building
    // This would construct proper SQL queries with:
    // - Full-text search on name and bio
    // - Array filtering for skills
    // - Enum filtering for availableFor
    // - Privacy filtering (isPublic = true)
    // - Proper pagination
    
    const conditions = ["is_public = true", "is_active = true"];
    
    if (params.query) {
      conditions.push(`(name ILIKE '%${params.query}%' OR bio ILIKE '%${params.query}%')`);
    }
    
    if (params.skills && params.skills.length > 0) {
      conditions.push(`skills && ARRAY[${params.skills.map(s => `'${s}'`).join(",")}]`);
    }
    
    if (params.availableFor && params.availableFor.length > 0) {
      conditions.push(`available_for && ARRAY[${params.availableFor.map(a => `'${a}'`).join(",")}]`);
    }
    
    return `
      SELECT slug, name, bio, skills, available_for, linkedin_url, other_links
      FROM profiles 
      WHERE ${conditions.join(" AND ")}
      ORDER BY created_at DESC
      LIMIT ${params.limit} OFFSET ${params.offset}
    `;
  }
}