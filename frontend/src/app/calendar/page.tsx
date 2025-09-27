'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Toggle } from '@/components/ui/toggle';
import { CalendarDays, List, Clock, CheckCircle } from 'lucide-react';

// Mock calendar events - in real app, this would come from an API
const mockEvents = [
  {
    id: '1',
    title: 'Meeting with John Doe',
    description: 'Discuss project requirements',
    date: '2025-09-27',
    time: '10:00 AM',
    type: 'meeting',
    status: 'confirmed'
  },
  {
    id: '2',
    title: 'Quote Review - Web Development',
    description: 'Review proposal for e-commerce website',
    date: '2025-09-27',
    time: '2:00 PM',
    type: 'quote',
    status: 'pending'
  },
  {
    id: '3',
    title: 'Consultation Call',
    description: 'Initial consultation for mobile app project',
    date: '2025-09-28',
    time: '11:30 AM',
    type: 'meeting',
    status: 'confirmed'
  },
  {
    id: '4',
    title: 'Design Review Meeting',
    description: 'Review latest UI/UX designs',
    date: '2025-09-30',
    time: '3:00 PM',
    type: 'meeting',
    status: 'pending'
  },
  {
    id: '5',
    title: 'Client Presentation',
    description: 'Present final project deliverables',
    date: '2025-10-02',
    time: '9:00 AM',
    type: 'meeting',
    status: 'confirmed'
  }
];

type ViewMode = 'calendar' | 'list';

export default function CalendarPage() {
  const [events] = useState(mockEvents);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');

  // Get events for selected date
  const getEventsForDate = (date: Date | undefined) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateStr);
  };

  // Get today's events
  const getTodayEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    return events.filter(event => event.date === today);
  };

  // Get upcoming events (next 7 days)
  const getUpcomingEvents = () => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= today && eventDate <= nextWeek;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };



  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'quote':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const selectedDateEvents = getEventsForDate(selectedDate);
  const todayEvents = getTodayEvents();
  const upcomingEvents = getUpcomingEvents();

  return (
    <div className="space-y-6">
      {/* Header with View Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-orange-900">Calendar</h1>
          <p className="text-orange-700 mt-2">
            Manage your meetings and appointments
          </p>
        </div>
        <div className="flex items-center gap-2 p-1 bg-orange-50 rounded-lg border border-orange-200">
          <Toggle
            pressed={viewMode === 'calendar'}
            onPressedChange={() => setViewMode('calendar')}
            className="data-[state=on]:bg-orange-500 data-[state=on]:text-white"
          >
            <CalendarDays className="w-4 h-4 mr-2" />
            Calendar
          </Toggle>
          <Toggle
            pressed={viewMode === 'list'}
            onPressedChange={() => setViewMode('list')}
            className="data-[state=on]:bg-orange-500 data-[state=on]:text-white"
          >
            <List className="w-4 h-4 mr-2" />
            List
          </Toggle>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Side - Calendar */}
            <div>
              <div className="calendar-container max-w-fit mx-auto">
                <Calendar
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border border-orange-200"
                  events={events}
                />
              </div>
            </div>

            {/* Right Side - Events */}
            <div className="space-y-6">
              {selectedDate && selectedDateEvents.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-orange-900 flex items-center gap-2 mb-4">
                    <CalendarDays className="w-5 h-5" />
                    Events for {selectedDate.toLocaleDateString()}
                  </h3>
                  <div className="space-y-4">
                    {selectedDateEvents.map((event) => (
                      <div key={event.id} className="p-4 border border-orange-200 rounded-lg hover:shadow-md transition-shadow bg-white">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-orange-900">{event.title}</h4>
                          <div className="flex gap-2">
                            <Badge variant="outline" className={getEventTypeColor(event.type)}>
                              {event.type}
                            </Badge>
                            <Badge variant="outline" className={getStatusColor(event.status)}>
                              {event.status}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-orange-700 text-sm mb-2">{event.description}</p>
                        <div className="flex items-center gap-4 text-sm text-orange-600">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {event.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewMode === 'list' && (
                <div className="space-y-6">
                  {/* Today's Events */}
                  <div>
                    <h3 className="text-xl font-semibold text-orange-900 flex items-center gap-2 mb-4">
                      <Clock className="w-5 h-5" />
                      Today&apos;s Events
                    </h3>
                    <div className="text-sm text-orange-600 mb-4">
                      {new Date().toLocaleDateString()} - Events scheduled for today
                    </div>
                    {todayEvents.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle className="w-12 h-12 mx-auto text-green-300 mb-3" />
                        <p className="text-orange-600">No events today!</p>
                        <p className="text-sm text-orange-500">Enjoy your free time</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {todayEvents.map((event) => (
                          <div key={event.id} className="p-4 border border-orange-200 rounded-lg hover:shadow-md transition-shadow bg-white">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-orange-900">{event.title}</h4>
                              <div className="flex gap-2">
                                <Badge variant="outline" className={getEventTypeColor(event.type)}>
                                  {event.type}
                                </Badge>
                                <Badge variant="outline" className={getStatusColor(event.status)}>
                                  {event.status}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-orange-700 text-sm mb-2">{event.description}</p>
                            <div className="flex items-center gap-4 text-sm text-orange-600">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {event.time}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Upcoming Events */}
                  <div>
                    <h3 className="text-xl font-semibold text-orange-900 flex items-center gap-2 mb-4">
                      <CalendarDays className="w-5 h-5" />
                      Upcoming Events
                    </h3>
                    <div className="text-sm text-orange-600 mb-4">
                      Next 7 days - Plan ahead
                    </div>
                    <div className="space-y-4">
                      {upcomingEvents.map((event) => (
                        <div key={event.id} className="p-4 border border-orange-200 rounded-lg hover:shadow-md transition-shadow bg-white">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-orange-900">{event.title}</h4>
                            <div className="flex gap-2">
                              <Badge variant="outline" className={getEventTypeColor(event.type)}>
                                {event.type}
                              </Badge>
                              <Badge variant="outline" className={getStatusColor(event.status)}>
                                {event.status}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-orange-700 text-sm mb-2">{event.description}</p>
                          <div className="flex items-center gap-4 text-sm text-orange-600">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="w-4 h-4" />
                              {new Date(event.date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {event.time}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>


    </div>
  );
}