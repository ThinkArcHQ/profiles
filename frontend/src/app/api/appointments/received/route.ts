import { NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { db } from '@/lib/db/connection';
import { appointments, profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/appointments/received - Get received appointment requests
export async function GET() {
  try {
    const { user } = await withAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all appointments for profiles owned by the current user
    const receivedAppointments = await db
      .select({
        id: appointments.id,
        profileId: appointments.profileId,
        requesterName: appointments.requesterName,
        requesterEmail: appointments.requesterEmail,
        message: appointments.message,
        preferredTime: appointments.preferredTime,
        requestType: appointments.requestType,
        status: appointments.status,
        createdAt: appointments.createdAt,
        profileName: profiles.name,
      })
      .from(appointments)
      .innerJoin(profiles, eq(appointments.profileId, profiles.id))
      .where(eq(profiles.workosUserId, user.id))
      .orderBy(appointments.createdAt);

    return NextResponse.json(receivedAppointments);
  } catch (error) {
    console.error('Error fetching received appointments:', error);
    return NextResponse.json({ error: 'Failed to fetch received appointments' }, { status: 500 });
  }
}