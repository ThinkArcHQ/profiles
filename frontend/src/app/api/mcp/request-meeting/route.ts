import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { appointments, profiles, type NewAppointment } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { PrivacyService } from '@/lib/services/privacy-service';

/**
 * MCP Tool: request_meeting
 *
 * Request a meeting with a person by their profile slug
 * Simple HTTP API for the standalone MCP server to call
 */
export async function POST(request: NextRequest) {
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
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: profileSlug, requesterName, requesterEmail, message, requestType'
      }, { status: 400 });
    }

    // Find profile by slug
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.slug, profileSlug.toLowerCase().trim()));

    if (!profile) {
      return NextResponse.json({
        success: false,
        error: 'Profile not found'
      }, { status: 404 });
    }

    // Check if profile can be contacted (privacy check)
    if (!PrivacyService.canContactProfile(profile)) {
      return NextResponse.json({
        success: false,
        error: 'Profile is not available for contact'
      }, { status: 404 });
    }

    // Check if the profile accepts this type of request
    // Handle both singular and plural forms (meeting/meetings, quote/quotes)
    const normalizedRequestType = requestType.endsWith('s') ? requestType : `${requestType}s`;
    const isAvailable = profile.availableFor.some(type =>
      type === requestType || type === normalizedRequestType
    );

    if (!isAvailable) {
      return NextResponse.json({
        success: false,
        error: `Profile is not available for ${requestType}. Available for: ${profile.availableFor.join(', ')}`
      }, { status: 400 });
    }

    // Parse preferred time if provided
    let parsedPreferredTime: Date | null = null;
    if (preferredTime) {
      parsedPreferredTime = new Date(preferredTime);
      if (isNaN(parsedPreferredTime.getTime())) {
        return NextResponse.json({
          success: false,
          error: 'Invalid preferredTime format'
        }, { status: 400 });
      }
      if (parsedPreferredTime < new Date()) {
        return NextResponse.json({
          success: false,
          error: 'Preferred time must be in the future'
        }, { status: 400 });
      }
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

    const [createdAppointment] = await db
      .insert(appointments)
      .values(newAppointment)
      .returning();

    if (process.env.NODE_ENV === 'development') {
      console.log(`MCP Meeting request created: ID=${createdAppointment.id}, profile=${profileSlug}`);
    }

    return NextResponse.json({
      success: true,
      requestId: createdAppointment.id.toString(),
      message: `Meeting request sent successfully to ${profile.name}`,
      details: {
        profileName: profile.name,
        requestType,
        status: 'pending',
        createdAt: createdAppointment.createdAt,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('MCP request-meeting error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
