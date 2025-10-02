'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@workos-inc/authkit-nextjs/components';
import { FullScreenCalendar } from '@/components/ui/fullscreen-calendar';

interface AppointmentRequest {
  id: number;
  profileId: string;
  requesterName: string;
  requesterEmail: string;
  message: string;
  preferredTime?: string;
  proposedTime?: string;
  requestType: string;
  status: string;
  createdAt: string;
  profileName?: string;
  profileEmail?: string;
}

interface CalendarData {
  day: Date;
  events: {
    id: number;
    name: string;
    time: string;
    datetime: string;
  }[];
}

export default function CalendarPage() {
  const { user, loading: authLoading } = useAuth();
  const [receivedAppointments, setReceivedAppointments] = useState<AppointmentRequest[]>([]);
  const [sentAppointments, setSentAppointments] = useState<AppointmentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      fetchAppointments();
    }
  }, [user, authLoading]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);

      console.log('=== Fetching Appointments ===');

      // Fetch received appointments
      const receivedResponse = await fetch('/api/appointments/received');
      console.log('Received response status:', receivedResponse.status);
      if (receivedResponse.ok) {
        const receivedData = await receivedResponse.json();
        console.log('Received appointments data:', receivedData);
        setReceivedAppointments(receivedData);
      } else {
        console.error('Failed to fetch received appointments:', await receivedResponse.text());
      }

      // Fetch sent appointments
      const sentResponse = await fetch('/api/appointments/sent');
      console.log('Sent response status:', sentResponse.status);
      if (sentResponse.ok) {
        const sentData = await sentResponse.json();
        console.log('Sent appointments data:', sentData);
        setSentAppointments(sentData);
      } else {
        console.error('Failed to fetch sent appointments:', await sentResponse.text());
      }

      console.log('=== Finished Fetching ===');
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Convert appointments to calendar events
  const convertToCalendarData = (): CalendarData[] => {
    const allAppointments = [...receivedAppointments, ...sentAppointments];
    const eventsByDate: { [key: string]: any[] } = {};

    console.log('=== Calendar Data Conversion Debug ===');
    console.log('Total appointments:', allAppointments.length);
    console.log('Received appointments:', receivedAppointments);
    console.log('Sent appointments:', sentAppointments);

    allAppointments.forEach((appointment) => {
      console.log('Processing appointment:', appointment);
      console.log('  preferredTime:', appointment.preferredTime);
      console.log('  proposedTime:', appointment.proposedTime);

      // Use proposedTime if available (for counter-proposed meetings), otherwise use preferredTime
      const meetingTime = appointment.proposedTime || appointment.preferredTime;

      // Determine the date to use
      let date: Date;
      let displayTime: string;
      let dateOnlyKey: string;

      if (meetingTime) {
        // Has a specific time
        date = new Date(meetingTime);
        displayTime = date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        dateOnlyKey = `${year}-${month}-${day}`;
      } else {
        // No time set - show on today's date as "Time TBD"
        console.log(`Appointment ${appointment.id} has no time - showing as TBD on today`);
        date = new Date();
        displayTime = 'Time TBD';
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        dateOnlyKey = `${year}-${month}-${day}`;
      }

      console.log(`Adding appointment ${appointment.id} to calendar on ${date.toDateString()} (status: ${appointment.status})`);

      if (!eventsByDate[dateOnlyKey]) {
        eventsByDate[dateOnlyKey] = {
          dateObj: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          events: []
        };
      }

      // Determine the meeting name based on whether it's received or sent
      const isReceivedMeeting = receivedAppointments.some(r => r.id === appointment.id);
      const meetingName = isReceivedMeeting
        ? `${appointment.requesterName}`
        : `${appointment.profileName || 'Contact'}`;

      // Add status indicator to the name
      let statusIndicator = '';
      if (appointment.status === 'pending') statusIndicator = '🕐 ';
      else if (appointment.status === 'accepted') statusIndicator = '✓ ';
      else if (appointment.status === 'rejected') statusIndicator = '✗ ';
      else if (appointment.status === 'counter_proposed') statusIndicator = '↔ ';

      eventsByDate[dateOnlyKey].events.push({
        id: parseInt(appointment.id),
        name: `${statusIndicator}${meetingName}${!meetingTime ? ' (TBD)' : ''}`,
        time: displayTime,
        datetime: meetingTime || new Date().toISOString(),
      });
    });

    console.log('Events by date:', eventsByDate);

    // Convert to CalendarData format
    const calendarData = Object.entries(eventsByDate).map(([, data]) => ({
      day: data.dateObj,
      events: data.events,
    }));

    console.log('Final calendar data:', calendarData);
    console.log('=== End Calendar Debug ===');

    return calendarData;
  };

  const calendarData = React.useMemo(() => {
    return convertToCalendarData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receivedAppointments, sentAppointments]);

  if (authLoading || loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#f5f5f0]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-background overflow-hidden">
      <FullScreenCalendar data={calendarData} timezone={Intl.DateTimeFormat().resolvedOptions().timeZone} />
    </div>
  );
}