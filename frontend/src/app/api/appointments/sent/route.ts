import { NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { db } from '@/lib/db/connection';
import { appointments, profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/appointments/sent - Get sent appointment requests
export async function GET() {
  try {
    const { user } = await withAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all appointments sent by the current user
    const sentAppointments = await db
      .select({
        id: appointments.id,
        profileId: appointments.profileId,
        requesterName: appointments.requesterName,
        requesterEmail: appointments.requesterEmail,
        message: appointments.message,
        preferredTime: appointments.preferredTime,
        proposedTime: appointments.proposedTime,
        requestType: appointments.requestType,
        status: appointments.status,
        createdAt: appointments.createdAt,
        profileName: profiles.name,
        profileEmail: profiles.email,
      })
      .from(appointments)
      .innerJoin(profiles, eq(appointments.profileId, profiles.id))
      .where(eq(appointments.requesterWorkosId, user.id))
      .orderBy(appointments.createdAt);

    return NextResponse.json(sentAppointments);
  } catch (error) {
    console.error('Error fetching sent appointments:', error);
    return NextResponse.json({ error: 'Failed to fetch sent appointments' }, { status: 500 });
  }
}