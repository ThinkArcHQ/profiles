'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@workos-inc/authkit-nextjs/components';
import { FullScreenCalendar } from '@/components/ui/fullscreen-calendar';

interface AppointmentRequest {
  id: string;
  profile_id: string;
  requester_name: string;
  requester_email: string;
  message: string;
  preferred_time?: string;
  request_type: string;
  status: string;
  created_at: string;
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
      
      // Fetch received appointments
      const receivedResponse = await fetch('/api/appointments/received');
      if (receivedResponse.ok) {
        const receivedData = await receivedResponse.json();
        setReceivedAppointments(receivedData);
      }

      // Fetch sent appointments
      const sentResponse = await fetch('/api/appointments/sent');
      if (sentResponse.ok) {
        const sentData = await sentResponse.json();
        setSentAppointments(sentData);
      }
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

    allAppointments.forEach((appointment) => {
      if (appointment.preferred_time && appointment.status === 'accepted') {
        const date = new Date(appointment.preferred_time);
        const dateKey = date.toDateString();
        
        if (!eventsByDate[dateKey]) {
          eventsByDate[dateKey] = [];
        }

        eventsByDate[dateKey].push({
          id: parseInt(appointment.id),
          name: appointment.requester_name || appointment.profileName || 'Meeting',
          time: date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          }),
          datetime: appointment.preferred_time,
        });
      }
    });

    // Convert to CalendarData format
    return Object.entries(eventsByDate).map(([dateString, events]) => ({
      day: new Date(dateString),
      events: events,
    }));
  };

  const calendarData = convertToCalendarData();

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <FullScreenCalendar data={calendarData} />
    </div>
  );
}