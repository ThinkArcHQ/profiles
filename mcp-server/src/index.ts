#!/usr/bin/env node

/**
 * ProfileBase MCP Server
 *
 * This MCP server enables AI agents to discover and connect with people
 * through the ProfileBase platform. It provides tools for searching
 * profiles, requesting meetings, and getting detailed profile information.
 *
 * Domain: profilebase.ai
 * Main Website: profilebase.ai
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { ProfileService } from "./services/profile-service.js";
import { MeetingService } from "./services/meeting-service.js";
import { SearchService } from "./services/search-service.js";
import { validateSearchInput, validateMeetingInput, validateProfileInput } from "./utils/validation.js";
import { MCPError, handleError } from "./utils/error-handling.js";

/**
 * Main MCP Server class for ProfileBase
 */
class ProfileBaseServer {
  private server: Server;
  private profileService: ProfileService;
  private meetingService: MeetingService;
  private searchService: SearchService;

  constructor() {
    this.server = new Server(
      {
        name: "profilebase",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize services
    this.profileService = new ProfileService();
    this.meetingService = new MeetingService();
    this.searchService = new SearchService();

    this.setupToolHandlers();
  }

  /**
   * Set up MCP tool handlers
   */
  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "search_profiles",
          description: "Search for people profiles by skills, availability, or keywords. Only returns public profiles.",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query to match against names and bios"
              },
              skills: {
                type: "array",
                items: { type: "string" },
                description: "Array of skills to filter by"
              },
              availableFor: {
                type: "array",
                items: { type: "string", enum: ["meetings", "quotes"] },
                description: "Filter by availability type (meetings, quotes)"
              },
              limit: {
                type: "number",
                default: 10,
                minimum: 1,
                maximum: 50,
                description: "Maximum number of results to return"
              },
              offset: {
                type: "number",
                default: 0,
                minimum: 0,
                description: "Number of results to skip for pagination"
              }
            }
          }
        },
        {
          name: "request_meeting",
          description: "Request a meeting with a person by their profile slug",
          inputSchema: {
            type: "object",
            properties: {
              profileSlug: {
                type: "string",
                description: "The unique slug identifier for the person's profile"
              },
              requesterName: {
                type: "string",
                description: "Name of the person or AI agent requesting the meeting"
              },
              requesterEmail: {
                type: "string",
                format: "email",
                description: "Email address for meeting coordination"
              },
              message: {
                type: "string",
                description: "Message explaining the purpose of the meeting request"
              },
              meetingType: {
                type: "string",
                enum: ["consulting", "mentoring", "speaking", "advising", "investing"],
                description: "Type of meeting being requested"
              },
              preferredTimes: {
                type: "array",
                items: { type: "string" },
                description: "Array of preferred meeting times (ISO 8601 format or natural language)"
              },
              company: {
                type: "string",
                description: "Company or organization of the requester (optional)"
              },
              linkedinUrl: {
                type: "string",
                description: "LinkedIn profile URL of the requester (optional)"
              }
            },
            required: [
              "profileSlug",
              "requesterName", 
              "requesterEmail",
              "message",
              "meetingType"
            ]
          }
        },
        {
          name: "get_profile",
          description: "Get detailed information about a person by their profile slug. Only returns public profiles.",
          inputSchema: {
            type: "object",
            properties: {
              profileSlug: {
                type: "string",
                description: "The unique slug identifier for the person's profile"
              }
            },
            required: ["profileSlug"]
          }
        }
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "search_profiles":
            return await this.handleSearchProfiles(args);
          case "request_meeting":
            return await this.handleRequestMeeting(args);
          case "get_profile":
            return await this.handleGetProfile(args);
          default:
            throw new MCPError(`Unknown tool: ${name}`, "UNKNOWN_TOOL");
        }
      } catch (error) {
        return handleError(error);
      }
    });
  }

  /**
   * Handle search_profiles tool call
   */
  private async handleSearchProfiles(args: any) {
    const validatedArgs = validateSearchInput(args);
    
    const results = await this.searchService.searchProfiles(validatedArgs);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            profiles: results.profiles,
            pagination: {
              total: results.total,
              limit: validatedArgs.limit,
              offset: validatedArgs.offset,
              hasMore: results.total > (validatedArgs.offset + validatedArgs.limit)
            }
          }, null, 2)
        }
      ]
    };
  }

  /**
   * Handle request_meeting tool call
   */
  private async handleRequestMeeting(args: any) {
    const validatedArgs = validateMeetingInput(args);
    
    const result = await this.meetingService.submitMeetingRequest(validatedArgs);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: result.success,
            requestId: result.requestId,
            message: result.message,
            estimatedResponseTime: result.estimatedResponseTime
          }, null, 2)
        }
      ]
    };
  }

  /**
   * Handle get_profile tool call
   */
  private async handleGetProfile(args: any) {
    const validatedArgs = validateProfileInput(args);
    
    const profile = await this.profileService.getProfileBySlug({ profileSlug: validatedArgs.profileSlug });
    
    if (!profile) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              found: false,
              message: `Profile not found or not public: ${validatedArgs.profileSlug}`
            }, null, 2)
          }
        ]
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            found: true,
            profile: profile
          }, null, 2)
        }
      ]
    };
  }

  /**
   * Start the MCP server
   */
  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("ProfileBase MCP Server running on profilebase.ai");
  }
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new ProfileBaseServer();
  server.run().catch((error) => {
    console.error("Failed to start MCP server:", error);
    process.exit(1);
  });
}

export { ProfileBaseServer };