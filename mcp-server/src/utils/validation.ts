/**
 * Validation utilities for MCP Server inputs
 */

import { z } from "zod";
import { SearchParams, MeetingRequestParams, ProfileParams } from "../types/index.js";
import { MCPError } from "./error-handling.js";

/**
 * Schema for search input validation
 */
const searchInputSchema = z.object({
  query: z.string().optional(),
  skills: z.array(z.string()).optional(),
  availableFor: z.array(z.enum(["meetings", "quotes"])).optional(),
  limit: z.number().min(1).max(50).default(10),
  offset: z.number().min(0).default(0)
});

/**
 * Schema for meeting request input validation
 */
const meetingInputSchema = z.object({
  profileSlug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  requesterName: z.string().min(1).max(100),
  requesterEmail: z.string().email(),
  message: z.string().min(1).max(1000),
  preferredTime: z.string().optional(),
  requestType: z.enum(["meeting", "quote"])
});

/**
 * Schema for profile input validation
 */
const profileInputSchema = z.object({
  profileSlug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens")
});

/**
 * Validate search input parameters
 */
export function validateSearchInput(input: any): SearchParams {
  try {
    const validated = searchInputSchema.parse(input);
    
    // Additional validation
    if (validated.query && validated.query.length > 200) {
      throw new MCPError("Search query must be 200 characters or less", "VALIDATION_ERROR");
    }
    
    if (validated.skills && validated.skills.length > 20) {
      throw new MCPError("Maximum 20 skills can be specified", "VALIDATION_ERROR");
    }
    
    if (validated.availableFor && validated.availableFor.length > 2) {
      throw new MCPError("Maximum 2 availability types can be specified", "VALIDATION_ERROR");
    }
    
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new MCPError(`Validation error: ${firstError.message}`, "VALIDATION_ERROR");
    }
    throw error;
  }
}

/**
 * Validate meeting request input parameters
 */
export function validateMeetingInput(input: any): MeetingRequestParams {
  try {
    const validated = meetingInputSchema.parse(input);
    
    // Additional validation
    if (validated.preferredTime) {
      // Try to parse the time to ensure it's valid
      const parsedTime = new Date(validated.preferredTime);
      if (isNaN(parsedTime.getTime())) {
        // If ISO parsing fails, allow natural language but warn
        console.warn("Preferred time is not in ISO format, will be processed as natural language");
      }
    }
    
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new MCPError(`Validation error: ${firstError.message}`, "VALIDATION_ERROR");
    }
    throw error;
  }
}

/**
 * Validate profile input parameters
 */
export function validateProfileInput(input: any): ProfileParams {
  try {
    return profileInputSchema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new MCPError(`Validation error: ${firstError.message}`, "VALIDATION_ERROR");
    }
    throw error;
  }
}

/**
 * Sanitize string input to prevent injection attacks
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .trim();
}

/**
 * Validate slug format
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length >= 1 && slug.length <= 100;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}