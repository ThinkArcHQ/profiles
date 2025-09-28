/**
 * Profile Service for MCP Server
 * 
 * Handles profile retrieval operations with privacy filtering.
 */

import { ProfileParams, MCPProfile } from "../types/index.js";
import { MCPError } from "../utils/error-handling.js";

export class ProfileService {
  private baseUrl: string;
  private mockProfiles: Map<string, any>;

  constructor() {
    // In production, this would connect to the actual database or API
    this.baseUrl = process.env.API_BASE_URL || "https://persons.finderbee.ai/api";
    
    // Mock data for testing and development
    this.mockProfiles = new Map([
      ["john-doe-ai-engineer", {
        slug: "john-doe-ai-engineer",
        name: "John Doe",
        bio: "Senior AI Engineer with 8+ years experience in machine learning and LLMs. Passionate about building scalable AI systems and helping teams adopt AI technologies effectively.",
        skills: ["Python", "TensorFlow", "PyTorch", "Machine Learning", "AI", "LLMs", "MLOps", "Docker", "Kubernetes"],
        availableFor: ["consulting", "mentoring", "speaking"],
        profileUrl: "https://persons.finderbee.ai/profiles/john-doe-ai-engineer",
        linkedinUrl: "https://linkedin.com/in/johndoe",
        otherLinks: { 
          github: "https://github.com/johndoe", 
          website: "https://johndoe.dev",
          twitter: "https://twitter.com/johndoe_ai"
        }
      }],
      ["sarah-smith-product-manager", {
        slug: "sarah-smith-product-manager",
        name: "Sarah Smith",
        bio: "Product Manager specializing in AI products and user experience. Led product teams at multiple startups and helped launch several successful AI-powered products.",
        skills: ["Product Management", "AI Strategy", "User Research", "Agile", "Data Analysis", "Product Analytics", "A/B Testing"],
        availableFor: ["consulting", "advising"],
        profileUrl: "https://persons.finderbee.ai/profiles/sarah-smith-product-manager",
        linkedinUrl: "https://linkedin.com/in/sarahsmith",
        otherLinks: { 
          medium: "https://medium.com/@sarahsmith",
          website: "https://sarahsmith.pm"
        }
      }],
      ["mike-johnson-startup-founder", {
        slug: "mike-johnson-startup-founder",
        name: "Mike Johnson",
        bio: "Serial entrepreneur and startup founder with expertise in AI and fintech. Founded 3 companies, 2 successful exits. Currently angel investor and startup advisor.",
        skills: ["Entrepreneurship", "AI", "Fintech", "Leadership", "Fundraising", "Strategy", "Business Development", "Angel Investing"],
        availableFor: ["mentoring", "advising", "investing"],
        profileUrl: "https://persons.finderbee.ai/profiles/mike-johnson-startup-founder",
        linkedinUrl: "https://linkedin.com/in/mikejohnson",
        otherLinks: { 
          twitter: "https://twitter.com/mikejohnson", 
          company: "https://aifintech.co",
          angellist: "https://angel.co/mikejohnson"
        }
      }]
    ]);
  }

  /**
   * Get a profile by slug
   */
  async getProfileBySlug(params: ProfileParams): Promise<MCPProfile> {
    try {
      this.validateProfileParams(params);
      
      // Try API first, fall back to mock data
      let profile;
      try {
        profile = await this.fetchProfileFromAPI(params.profileSlug);
      } catch (apiError) {
        console.warn("API fetch failed, using mock data:", apiError);
        profile = await this.fetchMockProfile(params.profileSlug);
      }
      
      if (!profile) {
        throw new MCPError("Profile not found", "PROFILE_NOT_FOUND");
      }
      
      return this.transformToMCPProfile(profile);
    } catch (error) {
      console.error("Profile retrieval error:", error);
      if (error instanceof MCPError) {
        throw error;
      }
      throw new MCPError("Failed to retrieve profile", "PROFILE_ERROR");
    }
  }

  /**
   * Validate profile parameters
   */
  private validateProfileParams(params: ProfileParams): void {
    if (!params.profileSlug || params.profileSlug.trim().length === 0) {
      throw new MCPError("Profile slug is required", "INVALID_PARAMS");
    }
    
    if (params.profileSlug.length > 100) {
      throw new MCPError("Profile slug must be less than 100 characters", "INVALID_PARAMS");
    }
    
    // Basic slug format validation
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(params.profileSlug)) {
      throw new MCPError("Profile slug must contain only lowercase letters, numbers, and hyphens", "INVALID_PARAMS");
    }
  }

  /**
   * Fetch profile from API
   */
  private async fetchProfileFromAPI(profileSlug: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/profiles/${profileSlug}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MCP-Server/1.0.0'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Profile API request failed: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }

  /**
   * Fetch mock profile (for testing/development)
   */
  private async fetchMockProfile(profileSlug: string): Promise<MCPProfile | null> {
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return this.mockProfiles.get(profileSlug) || null;
  }

  /**
   * Transform profile data to MCP format
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
   * Check if profile exists (utility method)
   */
  async profileExists(profileSlug: string): Promise<boolean> {
    try {
      await this.getProfileBySlug({ profileSlug });
      return true;
    } catch (error) {
      if (error instanceof MCPError && error.code === "PROFILE_NOT_FOUND") {
        return false;
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Get all available profiles (for testing/debugging)
   */
  async getAllProfiles(): Promise<MCPProfile[]> {
    try {
      // Try API first
      const response = await fetch(`${this.baseUrl}/profiles`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MCP-Server/1.0.0'
        },
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        const data = await response.json();
        return (data.profiles || []).map((profile: any) => this.transformToMCPProfile(profile));
      }
    } catch (error) {
      console.warn("Failed to fetch all profiles from API:", error);
    }
    
    // Fallback to mock data
    return Array.from(this.mockProfiles.values());
  }
}