import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { db } from '@/lib/db/connection';
import { appointments, profiles, type NewAppointment } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// POST /api/appointments - Create appointment request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      profile_id, 
      requester_name, 
      requester_email, 
      message, 
      preferred_time, 
      request_type 
    } = body;

    // Validate required fields
    if (!profile_id || !requester_name || !requester_email || !message || !request_type) {
      return NextResponse.json({ 
        error: 'Profile ID, requester name, email, message, and request type are required' 
      }, { status: 400 });
    }

    // Check if profile exists
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, parseInt(profile_id)));

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check if user is authenticated (optional - they can make requests without being logged in)
    let requesterWorkosId = null;
    try {
      const { user } = await withAuth();
      if (user) {
        requesterWorkosId = user.id;
      }
    } catch {
      // User not authenticated, that's okay
    }

    const newAppointment: NewAppointment = {
      profileId: parseInt(profile_id),
      requesterWorkosId,
      requesterName: requester_name,
      requesterEmail: requester_email,
      message,
      preferredTime: preferred_time ? new Date(preferred_time) : null,
      requestType: request_type,
      status: 'pending',
    };

    const [createdAppointment] = await db
      .insert(appointments)
      .values(newAppointment)
      .returning();

    return NextResponse.json(createdAppointment, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({ error: 'Failed to create appointment request' }, { status: 500 });
  }
}