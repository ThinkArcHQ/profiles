/**
 * Meeting Service for MCP Server
 * 
 * Handles meeting request operations including validation,
 * creation, and notification.
 */

import { MeetingRequestParams, MeetingRequestResult } from "../types/index.js";
import { MCPError } from "../utils/error-handling.js";
import { ProfileService } from "./profile-service.js";

export class MeetingService {
  private baseUrl: string;
  private profileService: ProfileService;

  constructor() {
    // In production, this would connect to the actual database or API
    this.baseUrl = process.env.API_BASE_URL || "https://persons.finderbee.ai/api";
    this.profileService = new ProfileService();
  }

  /**
   * Create a meeting request
   */
  async createMeetingRequest(params: MeetingRequestParams): Promise<MeetingRequestResult> {
    try {
      // Validate that the target profile exists and is public
      const profile = await this.profileService.getProfileBySlug(params.profileSlug);
      
      if (!profile) {
        throw new MCPError(
          `Profile not found or not public: ${params.profileSlug}`,
          "PROFILE_NOT_FOUND"
        );
      }

      // Validate that the profile accepts the requested type
      if (!profile.availableFor.includes(params.requestType)) {
        throw new MCPError(
          `Profile ${params.profileSlug} does not accept ${params.requestType} requests`,
          "REQUEST_TYPE_NOT_ACCEPTED"
        );
      }

      // TODO: Replace with actual database insertion or API call
      // This is a template implementation
      
      const requestResult = await this.submitMeetingRequest(params, profile.name);
      
      return {
        requestId: requestResult.id,
        profileName: profile.name
      };
    } catch (error) {
      if (error instanceof MCPError) {
        throw error;
      }
      console.error("Meeting request error:", error);
      throw new MCPError("Failed to create meeting request", "MEETING_REQUEST_ERROR");
    }
  }

  /**
   * Submit meeting request to the main system (template implementation)
   */
  private async submitMeetingRequest(params: MeetingRequestParams, profileName: string): Promise<{ id: string }> {
    // Template implementation - in production this would be a database insert
    // or API call to create the meeting request
    
    try {
      const requestData = {
        profileSlug: params.profileSlug,
        requesterName: params.requesterName,
        requesterEmail: params.requesterEmail,
        message: params.message,
        preferredTime: params.preferredTime,
        requestType: params.requestType,
        source: "mcp-server"
      };

      const response = await fetch(`${this.baseUrl}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`Meeting request API failed: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        id: result.id || this.generateRequestId()
      };
    } catch (error) {
      console.error("Meeting request API error:", error);
      
      // For template purposes, generate a mock request ID
      return {
        id: this.generateRequestId()
      };
    }
  }

  /**
   * Generate a unique request ID (template implementation)
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate meeting request parameters
   */
  validateMeetingRequest(params: MeetingRequestParams): void {
    if (!params.profileSlug || params.profileSlug.trim().length === 0) {
      throw new MCPError("Profile slug is required", "VALIDATION_ERROR");
    }

    if (!params.requesterName || params.requesterName.trim().length === 0) {
      throw new MCPError("Requester name is required", "VALIDATION_ERROR");
    }

    if (!params.requesterEmail || !this.isValidEmail(params.requesterEmail)) {
      throw new MCPError("Valid requester email is required", "VALIDATION_ERROR");
    }

    if (!params.message || params.message.trim().length === 0) {
      throw new MCPError("Message is required", "VALIDATION_ERROR");
    }

    if (!params.requestType || !["meeting", "quote"].includes(params.requestType)) {
      throw new MCPError("Request type must be 'meeting' or 'quote'", "VALIDATION_ERROR");
    }

    // Validate message length
    if (params.message.length > 1000) {
      throw new MCPError("Message must be 1000 characters or less", "VALIDATION_ERROR");
    }

    // Validate name length
    if (params.requesterName.length > 100) {
      throw new MCPError("Requester name must be 100 characters or less", "VALIDATION_ERROR");
    }
  }

  /**
   * Simple email validation
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Parse preferred time (template implementation)
   */
  private parsePreferredTime(timeString?: string): Date | null {
    if (!timeString) {
      return null;
    }

    try {
      // Try to parse as ISO 8601 first
      const isoDate = new Date(timeString);
      if (!isNaN(isoDate.getTime())) {
        return isoDate;
      }

      // TODO: Add natural language time parsing
      // For now, just return null for non-ISO formats
      return null;
    } catch (error) {
      console.warn("Failed to parse preferred time:", timeString);
      return null;
    }
  }
}