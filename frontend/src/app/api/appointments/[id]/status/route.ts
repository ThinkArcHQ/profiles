import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { db } from '@/lib/db/connection';
import { appointments, profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NotificationService } from '@/lib/services/notification-service';

// PUT /api/appointments/[id]/status - Update appointment status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await withAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const appointmentId = parseInt(id);
    if (isNaN(appointmentId)) {
      return NextResponse.json({ error: 'Invalid appointment ID' }, { status: 400 });
    }

    const body = await request.json();
    const { status, proposedTime, counterMessage, responseMessage } = body;

    if (!status || !['accepted', 'rejected', 'counter_proposed'].includes(status)) {
      return NextResponse.json({ 
        error: 'Status must be "accepted", "rejected", or "counter_proposed"' 
      }, { status: 400 });
    }

    // Validate counter-proposal fields
    if (status === 'counter_proposed') {
      if (!proposedTime || !counterMessage) {
        return NextResponse.json({ 
          error: 'Proposed time and counter message are required for counter-proposals' 
        }, { status: 400 });
      }
    }

    // Check if appointment exists and the user owns the profile
    const [appointment] = await db
      .select({
        id: appointments.id,
        profileId: appointments.profileId,
        status: appointments.status,
        requesterName: appointments.requesterName,
        requesterEmail: appointments.requesterEmail,
        profileWorkosUserId: profiles.workosUserId,
        profileName: profiles.name,
        profileEmail: profiles.email,
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

    // Prepare update data
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'counter_proposed') {
      updateData.proposedTime = new Date(proposedTime);
      updateData.counterMessage = counterMessage;
    }

    if (responseMessage) {
      updateData.responseMessage = responseMessage;
    }

    // Update appointment status
    const [updatedAppointment] = await db
      .update(appointments)
      .set(updateData)
      .where(eq(appointments.id, appointmentId))
      .returning();

    // Send notification to requester
    const notificationType = status === 'counter_proposed' ? 'counter_proposal' : 'status_update';
    await NotificationService.sendNotification({
      type: notificationType,
      recipientEmail: appointment.requesterEmail,
      recipientName: appointment.requesterName,
      senderName: appointment.profileName,
      appointmentId: appointmentId,
      status: status,
      proposedTime: status === 'counter_proposed' ? new Date(proposedTime) : undefined,
      counterMessage: status === 'counter_proposed' ? counterMessage : undefined,
    });

    return NextResponse.json(updatedAppointment);
  } catch (error) {
    console.error('Error updating appointment status:', error);
    return NextResponse.json({ error: 'Failed to update appointment status' }, { status: 500 });
  }
}