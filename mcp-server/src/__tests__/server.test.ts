/**
 * Basic tests for the MCP Server
 */

import { describe, it, expect } from "vitest";
import { PersonsFinderBeeServer } from "../index.js";
import { validateSearchInput, validateMeetingInput, validateProfileInput } from "../utils/validation.js";
import { MCPError } from "../utils/error-handling.js";

describe("PersonsFinderBeeServer", () => {
  it("should create server instance", () => {
    const server = new PersonsFinderBeeServer();
    expect(server).toBeDefined();
  });
});

describe("Validation", () => {
  describe("validateSearchInput", () => {
    it("should validate valid search input", () => {
      const input = {
        query: "software engineer",
        skills: ["JavaScript", "React"],
        availableFor: ["meetings"],
        limit: 10,
        offset: 0
      };

      const result = validateSearchInput(input);
      expect(result).toEqual(input);
    });

    it("should apply defaults for missing optional fields", () => {
      const input = {};
      const result = validateSearchInput(input);
      
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });

    it("should throw error for invalid limit", () => {
      const input = { limit: 100 };
      
      expect(() => validateSearchInput(input)).toThrow(MCPError);
    });
  });

  describe("validateMeetingInput", () => {
    it("should validate valid meeting input", () => {
      const input = {
        profileSlug: "john-doe",
        requesterName: "AI Assistant",
        requesterEmail: "ai@example.com",
        message: "Meeting request for collaboration",
        meetingType: "consulting"
      };

      const result = validateMeetingInput(input);
      expect(result.profileSlug).toBe(input.profileSlug);
      expect(result.requesterName).toBe(input.requesterName);
      expect(result.requesterEmail).toBe(input.requesterEmail);
      expect(result.message).toBe(input.message);
      expect(result.meetingType).toBe(input.meetingType);
    });

    it("should throw error for invalid email", () => {
      const input = {
        profileSlug: "john-doe",
        requesterName: "AI Assistant",
        requesterEmail: "invalid-email",
        message: "Meeting request for collaboration",
        meetingType: "consulting"
      };

      expect(() => validateMeetingInput(input)).toThrow(MCPError);
    });

    it("should throw error for invalid slug format", () => {
      const input = {
        profileSlug: "John Doe!",
        requesterName: "AI Assistant",
        requesterEmail: "ai@example.com",
        message: "Meeting request",
        requestType: "meeting"
      };

      expect(() => validateMeetingInput(input)).toThrow(MCPError);
    });
  });

  describe("validateProfileInput", () => {
    it("should validate valid profile input", () => {
      const input = { profileSlug: "john-doe" };
      const result = validateProfileInput(input);
      
      expect(result).toEqual(input);
    });

    it("should throw error for invalid slug", () => {
      const input = { profileSlug: "John Doe!" };
      
      expect(() => validateProfileInput(input)).toThrow(MCPError);
    });
  });
});