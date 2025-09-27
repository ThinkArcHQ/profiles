import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { db } from '@/lib/db/connection';
import { appointments, profiles } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// PUT /api/appointments/[id]/status - Update appointment status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await withAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const appointmentId = parseInt(params.id);
    if (isNaN(appointmentId)) {
      return NextResponse.json({ error: 'Invalid appointment ID' }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !['accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ 
        error: 'Status must be either "accepted" or "rejected"' 
      }, { status: 400 });
    }

    // Check if appointment exists and the user owns the profile
    const [appointment] = await db
      .select({
        id: appointments.id,
        profileId: appointments.profileId,
        status: appointments.status,
        profileWorkosUserId: profiles.workosUserId,
      })
      .from(appointments)
      .innerJoin(profiles, eq(appointments.profileId, profiles.id))
      .where(eq(appointments.id, appointmentId));

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    if (appointment.profileWorkosUserId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to update this appointment' }, { status: 403 });
    }

    // Update appointment status
    const [updatedAppointment] = await db
      .update(appointments)
      .set({ status })
      .where(eq(appointments.id, appointmentId))
      .returning();

    return NextResponse.json(updatedAppointment);
  } catch (error) {
    console.error('Error updating appointment status:', error);
    return NextResponse.json({ error: 'Failed to update appointment status' }, { status: 500 });
  }
}