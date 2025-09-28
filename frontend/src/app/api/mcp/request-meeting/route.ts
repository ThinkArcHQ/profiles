import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { appointments, profiles, type NewAppointment } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { PrivacyService } from '@/lib/services/privacy-service';
import { MCPErrorHandler, MCPErrorCodes } from '@/lib/utils/mcp-errors';
import { withMCPMiddleware, MCPMiddleware } from '@/lib/middleware/mcp-middleware';

/**
 * MCP Tool: request_meeting
 * 
 * Request a meeting with a person by their profile slug
 * This endpoint is designed for AI agent consumption via MCP
 */
export const POST = withMCPMiddleware(
  {
    endpoint: 'request_meeting',
    rateLimiter: 'requestMeeting',
    allowedMethods: ['POST'],
  },
  async (request: NextRequest, context) => {
  try {
    const body = await request.json();
    const { 
      profileSlug, 
      requesterName, 
      requesterEmail, 
      message, 
      preferredTime, 
      requestType = 'meeting' 
    } = body;

    // Validate required fields
    if (!profileSlug || !requesterName || !requesterEmail || !message || !requestType) {
      const errorResponse = MCPErrorHandler.createMeetingError(
        'Missing required fields: profileSlug, requesterName, requesterEmail, message, and requestType are required',
        MCPErrorCodes.VALIDATION_ERROR
      );
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate all parameters
    const validation = MCPErrorHandler.validateCommonParams({
      profileSlug,
      requesterName,
      requesterEmail,
      message,
      requestType,
    });

    if (!validation.isValid) {
      const errorResponse = MCPErrorHandler.createMeetingError(
        `Validation failed: ${validation.errors.join(', ')}`,
        MCPErrorCodes.VALIDATION_ERROR,
        { errors: validation.errors }
      );
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Find profile by slug
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.slug, profileSlug.toLowerCase().trim()));

    if (!profile) {
      const errorResponse = MCPErrorHandler.createMeetingError(
        'Profile not found',
        MCPErrorCodes.PROFILE_NOT_FOUND
      );
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Check if profile can be contacted (privacy check)
    if (!PrivacyService.canContactProfile(profile)) {
      // Return privacy-safe error
      const errorResponse = MCPErrorHandler.createPrivacySafeError(
        'Profile is private',
        'meeting'
      );
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Check if the profile accepts this type of request
    if (!profile.availableFor.includes(requestType)) {
      const availableTypes = profile.availableFor.join(', ');
      const errorResponse = MCPErrorHandler.createMeetingError(
        `This person is not available for ${requestType} requests. Available for: ${availableTypes}`,
        MCPErrorCodes.REQUEST_TYPE_NOT_AVAILABLE
      );
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Parse preferred time if provided
    let parsedPreferredTime: Date | null = null;
    if (preferredTime) {
      const timeValidation = MCPErrorHandler.validatePreferredTime(preferredTime);
      if (!timeValidation.isValid) {
        const errorResponse = MCPErrorHandler.createMeetingError(
          timeValidation.error!,
          preferredTime && new Date(preferredTime) < new Date() 
            ? MCPErrorCodes.INVALID_TIME_PAST 
            : MCPErrorCodes.INVALID_TIME_FORMAT
        );
        return NextResponse.json(errorResponse, { status: 400 });
      }
      parsedPreferredTime = timeValidation.parsedTime!;
    }

    // Create the appointment request
    const newAppointment: NewAppointment = {
      profileId: profile.id,
      requesterWorkosId: null, // MCP requests are from external AI agents
      requesterName: requesterName.trim(),
      requesterEmail: requesterEmail.toLowerCase().trim(),
      message: message.trim(),
      preferredTime: parsedPreferredTime,
      requestType: requestType as 'meeting' | 'quote' | 'appointment',
      status: 'pending',
    };

    let createdAppointment;
    try {
      [createdAppointment] = await db
        .insert(appointments)
        .values(newAppointment)
        .returning();
    } catch (error: any) {
      console.error('Database error creating appointment:', error);
      const errorResponse = MCPErrorHandler.createMeetingError(
        'Failed to create meeting request',
        MCPErrorCodes.DATABASE_ERROR
      );
      return NextResponse.json(errorResponse, { status: 500 });
    }

    // Log successful MCP meeting request (without sensitive data)
    if (process.env.NODE_ENV === 'development') {
      console.log(`MCP Meeting request created: ID=${createdAppointment.id}, type=${requestType}, profile=${profileSlug}`);
    }

    // Return MCP-compatible success response
    return MCPMiddleware.createSuccessResponse({
      success: true,
      requestId: createdAppointment.id.toString(),
      message: `Meeting request sent successfully to ${profile.name}. They will receive your request and respond via email.`,
      details: {
        profileName: profile.name,
        requestType: requestType,
        status: 'pending',
        createdAt: createdAppointment.createdAt,
      },
    }, 201, context.clientInfo);

  } catch (error) {
    MCPErrorHandler.logError('request_meeting', error as Error, { 
      profileSlug: body.profileSlug, 
      requestType: body.requestType 
    });
    
    const errorResponse = MCPErrorHandler.createMeetingError(
      'Internal server error',
      MCPErrorCodes.INTERNAL_ERROR
    );
    return MCPMiddleware.createSuccessResponse(errorResponse, 500, context.clientInfo);
  }
});

// GET method for testing purposes (not part of MCP spec)
export const GET = withMCPMiddleware(
  {
    endpoint: 'request_meeting_get',
    rateLimiter: 'requestMeeting',
    allowedMethods: ['GET'],
  },
  async (request: NextRequest, context) => {
    const errorResponse = MCPErrorHandler.createMethodNotAllowedError(['POST'], {
      method: 'POST',
      requiredFields: ['profileSlug', 'requesterName', 'requesterEmail', 'message', 'requestType'],
      optionalFields: ['preferredTime'],
      requestTypes: ['meeting', 'quote', 'appointment'],
    });
    return MCPMiddleware.createSuccessResponse(errorResponse, 405, context.clientInfo);
  }
);