/**
 * Type definitions for the Persons FinderBee MCP Server
 */

/**
 * Public profile data structure (excludes sensitive information like email)
 */
export interface MCPProfile {
  slug: string;
  name: string;
  bio?: string;
  skills: string[];
  availableFor: string[];
  profileUrl: string;
  linkedinUrl?: string;
  otherLinks: Record<string, string>;
  // Note: email is never included in MCP responses
}

/**
 * Search parameters for profile search
 */
export interface SearchParams {
  query?: string;
  skills?: string[];
  availableFor?: string[];
  limit: number;
  offset: number;
}

/**
 * Search results structure
 */
export interface SearchResults {
  profiles: MCPProfile[];
  total: number;
}

/**
 * Meeting request parameters
 */
export interface MeetingRequestParams {
  profileSlug: string;
  requesterName: string;
  requesterEmail: string;
  message: string;
  preferredTime?: string;
  requestType: "meeting" | "quote";
}

/**
 * Meeting request result
 */
export interface MeetingRequestResult {
  requestId: string;
  profileName: string;
}

/**
 * Profile lookup parameters
 */
export interface ProfileParams {
  profileSlug: string;
}

/**
 * Configuration for the MCP server
 */
export interface ServerConfig {
  baseUrl: string;
  apiUrl: string;
  maxRequestsPerMinute: number;
  enableLogging: boolean;
}