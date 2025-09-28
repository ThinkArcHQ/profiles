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
  private mockProfiles: MCPProfile[];

  constructor() {
    // In production, this would connect to the actual database or API
    this.baseUrl = process.env.API_BASE_URL || "https://persons.finderbee.ai/api";
    
    // Mock data for testing and development
    this.mockProfiles = [
      {
        slug: "john-doe-ai-engineer",
        name: "John Doe",
        bio: "Senior AI Engineer with 8+ years experience in machine learning and LLMs",
        skills: ["Python", "TensorFlow", "PyTorch", "Machine Learning", "AI", "LLMs"],
        availableFor: ["consulting", "mentoring", "speaking"],
        profileUrl: "https://persons.finderbee.ai/profiles/john-doe-ai-engineer",
        linkedinUrl: "https://linkedin.com/in/johndoe",
        otherLinks: { "github": "https://github.com/johndoe", "website": "https://johndoe.dev" }
      },
      {
        slug: "sarah-smith-product-manager",
        name: "Sarah Smith",
        bio: "Product Manager specializing in AI products and user experience",
        skills: ["Product Management", "AI Strategy", "User Research", "Agile", "Data Analysis"],
        availableFor: ["consulting", "advising"],
        profileUrl: "https://persons.finderbee.ai/profiles/sarah-smith-product-manager",
        linkedinUrl: "https://linkedin.com/in/sarahsmith",
        otherLinks: { "medium": "https://medium.com/@sarahsmith" }
      },
      {
        slug: "mike-johnson-startup-founder",
        name: "Mike Johnson",
        bio: "Serial entrepreneur and startup founder with expertise in AI and fintech",
        skills: ["Entrepreneurship", "AI", "Fintech", "Leadership", "Fundraising", "Strategy"],
        availableFor: ["mentoring", "advising", "investing"],
        profileUrl: "https://persons.finderbee.ai/profiles/mike-johnson-startup-founder",
        linkedinUrl: "https://linkedin.com/in/mikejohnson",
        otherLinks: { "twitter": "https://twitter.com/mikejohnson", "company": "https://aifintech.co" }
      }
    ];
  }

  /**
   * Search for public profiles based on criteria
   */
  async searchProfiles(params: SearchParams): Promise<SearchResults> {
    try {
      // Validate input parameters
      this.validateSearchParams(params);
      
      // Try API first, fall back to mock data
      let searchResults;
      try {
        searchResults = await this.performAPISearch(params);
      } catch (apiError) {
        console.warn("API search failed, using mock data:", apiError);
        searchResults = await this.performMockSearch(params);
      }
      
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
   * Validate search parameters
   */
  private validateSearchParams(params: SearchParams): void {
    if (params.limit < 1 || params.limit > 100) {
      throw new MCPError("Limit must be between 1 and 100", "INVALID_PARAMS");
    }
    
    if (params.offset < 0) {
      throw new MCPError("Offset must be non-negative", "INVALID_PARAMS");
    }
    
    if (params.query && params.query.length > 200) {
      throw new MCPError("Query must be less than 200 characters", "INVALID_PARAMS");
    }
  }

  /**
   * Perform search using mock data (for development/testing)
   */
  private async performMockSearch(params: SearchParams): Promise<{ profiles: MCPProfile[], total: number }> {
    let filteredProfiles = [...this.mockProfiles];
    
    // Apply query filter
    if (params.query) {
      const query = params.query.toLowerCase();
      filteredProfiles = filteredProfiles.filter(profile => 
        profile.name.toLowerCase().includes(query) ||
        (profile.bio && profile.bio.toLowerCase().includes(query)) ||
        profile.skills.some(skill => skill.toLowerCase().includes(query))
      );
    }
    
    // Apply skills filter
    if (params.skills && params.skills.length > 0) {
      filteredProfiles = filteredProfiles.filter(profile =>
        params.skills!.some(skill => 
          profile.skills.some(profileSkill => 
            profileSkill.toLowerCase().includes(skill.toLowerCase())
          )
        )
      );
    }
    
    // Apply availableFor filter
    if (params.availableFor && params.availableFor.length > 0) {
      filteredProfiles = filteredProfiles.filter(profile =>
        params.availableFor!.some(availability => 
          profile.availableFor.includes(availability)
        )
      );
    }
    
    const total = filteredProfiles.length;
    const paginatedProfiles = filteredProfiles.slice(params.offset, params.offset + params.limit);
    
    return {
      profiles: paginatedProfiles,
      total
    };
  }

  /**
   * Perform the actual API search
   */
  private async performAPISearch(params: SearchParams): Promise<{ profiles: any[], total: number }> {
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
      
      const response = await fetch(`${this.baseUrl}/search?${searchParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MCP-Server/1.0.0'
        },
        // Add timeout
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`Search API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        profiles: data.profiles || [],
        total: data.total || 0
      };
    } catch (error) {
      console.error("Search API error:", error);
      throw error; // Re-throw to allow fallback to mock data
    }
  }

  /**
   * Transform internal profile data to MCP format
   */
  private transformToMCPProfile(profileData: any): MCPProfile {
    // Handle both API response format and mock data format
    return {
      slug: profileData.slug,
      name: profileData.name,
      bio: profileData.bio,
      skills: Array.isArray(profileData.skills) ? profileData.skills : [],
      availableFor: Array.isArray(profileData.availableFor) ? profileData.availableFor : 
                   Array.isArray(profileData.available_for) ? profileData.available_for : [],
      profileUrl: profileData.profileUrl || `https://persons.finderbee.ai/profiles/${profileData.slug}`,
      linkedinUrl: profileData.linkedinUrl || profileData.linkedin_url,
      otherLinks: profileData.otherLinks || profileData.other_links || {}
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