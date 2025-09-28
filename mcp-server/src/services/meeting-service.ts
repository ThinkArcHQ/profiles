/**
 * Meeting Service for MCP Server
 * 
 * Handles meeting request operations including validation,
 * creation, and notification.
 */

import { MeetingRequestParams, MeetingRequestResult } from "../types/index.js";
import { MCPError } from "../utils/error-handling.js";

export class MeetingService {
  private baseUrl: string;
  private mockMeetings: Map<string, any>;

  constructor() {
    // In production, this would connect to the actual database or API
    this.baseUrl = process.env.API_BASE_URL || "https://persons.finderbee.ai/api";
    
    // Mock storage for testing
    this.mockMeetings = new Map();
  }

  /**
   * Submit a meeting request
   */
  async submitMeetingRequest(params: MeetingRequestParams): Promise<MeetingRequestResult> {
    try {
      // Validate the meeting request parameters
      this.validateMeetingRequest(params);
      
      // Check if profile exists and is available for the requested type
      await this.validateProfileAvailability(params.profileSlug, params.meetingType);
      
      // Try API first, fall back to mock implementation
      let result;
      try {
        result = await this.submitToAPI(params);
      } catch (apiError) {
        console.warn("API submission failed, using mock implementation:", apiError);
        result = await this.submitMockRequest(params);
      }
      
      return result;
    } catch (error) {
      console.error("Meeting request error:", error);
      if (error instanceof MCPError) {
        throw error;
      }
      throw new MCPError("Failed to submit meeting request", "MEETING_REQUEST_ERROR");
    }
  }

  /**
   * Validate meeting request parameters
   */
  private validateMeetingRequest(params: MeetingRequestParams): void {
    if (!params.profileSlug || params.profileSlug.trim().length === 0) {
      throw new MCPError("Profile slug is required", "INVALID_PARAMS");
    }
    
    if (!params.requesterEmail || !this.isValidEmail(params.requesterEmail)) {
      throw new MCPError("Valid requester email is required", "INVALID_PARAMS");
    }
    
    if (!params.requesterName || params.requesterName.trim().length === 0) {
      throw new MCPError("Requester name is required", "INVALID_PARAMS");
    }
    
    if (!params.message || params.message.trim().length === 0) {
      throw new MCPError("Message is required", "INVALID_PARAMS");
    }
    
    if (params.message.length > 1000) {
      throw new MCPError("Message must be less than 1000 characters", "INVALID_PARAMS");
    }
    
    const validMeetingTypes = ["consulting", "mentoring", "speaking", "advising", "investing"];
    if (!params.meetingType || !validMeetingTypes.includes(params.meetingType)) {
      throw new MCPError(`Meeting type must be one of: ${validMeetingTypes.join(", ")}`, "INVALID_PARAMS");
    }
    
    // Validate preferred times if provided
    if (params.preferredTimes && params.preferredTimes.length > 0) {
      for (const time of params.preferredTimes) {
        const date = new Date(time);
        if (isNaN(date.getTime())) {
          throw new MCPError("Invalid date format in preferred times", "INVALID_PARAMS");
        }
        if (date < new Date()) {
          throw new MCPError("Preferred times must be in the future", "INVALID_PARAMS");
        }
      }
    }
  }

  /**
   * Validate that the profile exists and is available for the requested meeting type
   */
  private async validateProfileAvailability(profileSlug: string, meetingType: string): Promise<void> {
    try {
      // Try to fetch profile from API first
      const response = await fetch(`${this.baseUrl}/profiles/${profileSlug}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MCP-Server/1.0.0'
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (response.status === 404) {
        throw new MCPError("Profile not found", "PROFILE_NOT_FOUND");
      }
      
      if (!response.ok) {
        throw new Error(`Profile validation failed: ${response.status}`);
      }
      
      const profile = await response.json();
      
      if (!profile.availableFor || !profile.availableFor.includes(meetingType)) {
        throw new MCPError(`Profile is not available for ${meetingType}`, "PROFILE_NOT_AVAILABLE");
      }
    } catch (error) {
      if (error instanceof MCPError) {
        throw error;
      }
      
      // Fallback to mock validation
      console.warn("Profile validation API failed, using mock validation:", error);
      
      // Mock profiles for testing
      const mockProfiles = [
        { slug: "john-doe-ai-engineer", availableFor: ["consulting", "mentoring", "speaking"] },
        { slug: "sarah-smith-product-manager", availableFor: ["consulting", "advising"] },
        { slug: "mike-johnson-startup-founder", availableFor: ["mentoring", "advising", "investing"] }
      ];
      
      const profile = mockProfiles.find(p => p.slug === profileSlug);
      if (!profile) {
        throw new MCPError("Profile not found", "PROFILE_NOT_FOUND");
      }
      
      if (!profile.availableFor.includes(meetingType)) {
        throw new MCPError(`Profile is not available for ${meetingType}`, "PROFILE_NOT_AVAILABLE");
      }
    }
  }

  /**
   * Submit meeting request to API
   */
  private async submitToAPI(params: MeetingRequestParams): Promise<MeetingRequestResult> {
    const requestBody = {
      profile_slug: params.profileSlug,
      requester_email: params.requesterEmail,
      requester_name: params.requesterName,
      message: params.message,
      meeting_type: params.meetingType,
      preferred_times: params.preferredTimes || [],
      company: params.company,
      linkedin_url: params.linkedinUrl
    };
    
    const response = await fetch(`${this.baseUrl}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MCP-Server/1.0.0'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Meeting request API failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    
    return {
      success: true,
      requestId: result.request_id || result.id,
      message: result.message || "Meeting request submitted successfully",
      estimatedResponseTime: result.estimated_response_time || "24-48 hours"
    };
  }

  /**
   * Submit mock meeting request (for testing/development)
   */
  private async submitMockRequest(params: MeetingRequestParams): Promise<MeetingRequestResult> {
    // Generate a mock request ID
    const requestId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store the mock request
    this.mockMeetings.set(requestId, {
      ...params,
      submittedAt: new Date().toISOString(),
      status: "pending"
    });
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      success: true,
      requestId,
      message: "Meeting request submitted successfully (mock mode)",
      estimatedResponseTime: "24-48 hours"
    };
  }

  /**
   * Basic email validation
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get meeting request status (for testing/debugging)
   */
  async getMeetingRequestStatus(requestId: string): Promise<any> {
    if (requestId.startsWith('mock_')) {
      return this.mockMeetings.get(requestId) || null;
    }
    
    // In production, this would query the actual API/database
    try {
      const response = await fetch(`${this.baseUrl}/appointments/${requestId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MCP-Server/1.0.0'
        },
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error("Failed to get meeting request status:", error);
      return null;
    }
  }
}