"use client";

import * as React from "react";
import {
  add,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  parseISO,
  startOfToday,
  startOfWeek,
  startOfWeek as startOfWeekFn,
  endOfWeek as endOfWeekFn,
  startOfMonth,
  endOfMonth as endOfMonthFn,
} from "date-fns";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusCircleIcon,
  SearchIcon,
  X,
  Calendar,
  User,
  Mail,
  Clock,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMediaQuery } from "@/hooks/use-media-query";
import { EventCreationDialog } from "@/components/event-creation-dialog";

interface Event {
  id: number;
  name: string;
  time: string;
  datetime: string;
}

interface CalendarData {
  day: Date;
  events: Event[];
}

interface FullScreenCalendarProps {
  data: CalendarData[];
  timezone?: string;
}

interface MeetingDetails {
  id: number;
  requesterName: string;
  requesterEmail: string;
  message: string;
  preferredTime?: string;
  proposedTime?: string;
  requestType: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  counterMessage?: string;
  responseMessage?: string;
  profileName?: string;
}

const colStartClasses = [
  "",
  "col-start-2",
  "col-start-3",
  "col-start-4",
  "col-start-5",
  "col-start-6",
  "col-start-7",
];

export function FullScreenCalendar({
  data,
  timezone = "America/New_York",
}: FullScreenCalendarProps) {
  console.log('FullScreenCalendar received data:', data);
  console.log('Data length:', data?.length);

  const today = startOfToday();
  const [selectedDay, setSelectedDay] = React.useState(today);
  const [currentMonth, setCurrentMonth] = React.useState(
    format(today, "MMM-yyyy")
  );
  const [isEventDialogOpen, setIsEventDialogOpen] = React.useState(false);
  const [viewFilter, setViewFilter] = React.useState("today");
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [selectedMeetingId, setSelectedMeetingId] = React.useState<number | null>(null);
  const [meetingDetails, setMeetingDetails] = React.useState<MeetingDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = React.useState(false);
  const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date());

  // Update current time every second
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const days = eachDayOfInterval({
    start: startOfWeek(firstDayCurrentMonth),
    end: endOfWeek(endOfMonth(firstDayCurrentMonth)),
  });

  const isMobile = useMediaQuery("(max-width: 1024px)");

  // Filter events based on selected view
  const getFilteredEvents = React.useMemo(() => {
    console.log('getFilteredEvents running with viewFilter:', viewFilter);
    console.log('Data in getFilteredEvents:', data);

    if (!data) {
      console.log('No data - returning empty array');
      return [];
    }

    const now = new Date();
    console.log('Current date/time:', now);

    let filtered;
    switch (viewFilter) {
      case "today":
        filtered = data.filter((item) => {
          const isSame = isSameDay(item.day, now);
          console.log('Checking if', item.day, 'is same as today:', isSame);
          return isSame;
        });
        console.log('Today filtered events:', filtered);
        return filtered;
      case "week":
        const weekStart = startOfWeekFn(now);
        const weekEnd = endOfWeekFn(now);
        filtered = data.filter(
          (item) => item.day >= weekStart && item.day <= weekEnd
        );
        console.log('Week filtered events:', filtered);
        return filtered;
      case "month":
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonthFn(now);
        filtered = data.filter(
          (item) => item.day >= monthStart && item.day <= monthEnd
        );
        console.log('Month filtered events:', filtered);
        return filtered;
      default:
        console.log('Default - returning all data');
        return data;
    }
  }, [data, viewFilter]);

  // Get current week days for week view
  const currentWeekDays = React.useMemo(() => {
    const now = new Date();
    return eachDayOfInterval({
      start: startOfWeekFn(now),
      end: endOfWeekFn(now),
    });
  }, []);

  // Get display title and subtitle based on view
  const getViewTitle = () => {
    const now = new Date();
    switch (viewFilter) {
      case "today":
        return {
          title: format(now, "EEEE, MMMM d, yyyy"),
          subtitle: format(now, "h:mm a"),
        };
      case "week":
        const weekStart = startOfWeekFn(now);
        const weekEnd = endOfWeekFn(now);
        return {
          title: `Week of ${format(weekStart, "MMMM d")}`,
          subtitle: `${format(weekStart, "MMM d")} - ${format(
            weekEnd,
            "MMM d, yyyy"
          )}`,
        };
      case "month":
        return {
          title: format(firstDayCurrentMonth, "MMMM, yyyy"),
          subtitle: `${format(firstDayCurrentMonth, "MMM d, yyyy")} - ${format(
            endOfMonth(firstDayCurrentMonth),
            "MMM d, yyyy"
          )}`,
        };
      default:
        return {
          title: format(firstDayCurrentMonth, "MMMM, yyyy"),
          subtitle: `${format(firstDayCurrentMonth, "MMM d, yyyy")} - ${format(
            endOfMonth(firstDayCurrentMonth),
            "MMM d, yyyy"
          )}`,
        };
    }
  };

  const viewInfo = getViewTitle();

  function previousMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 });
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"));
  }

  function nextMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 });
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"));
  }

  function goToToday() {
    setCurrentMonth(format(today, "MMM-yyyy"));
  }

  const handleCreateEvent = async (eventData: {
    title: string;
    description: string;
    date: string;
    time: string;
    duration: number;
    type: string;
  }) => {
    // For now, just log the event data
    // In a real implementation, you would save this to your database
    console.log("Creating event:", eventData);

    // You can add API call here to save the event
    // await fetch('/api/events', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(eventData)
    // })

    // Show success message or refresh calendar data
    alert("Event created successfully!");
  };

  const handleEventClick = async (eventId: number) => {
    setSelectedMeetingId(eventId);
    setLoadingDetails(true);

    try {
      // Fetch full meeting details from both received and sent endpoints
      const [receivedRes, sentRes] = await Promise.all([
        fetch('/api/appointments/received'),
        fetch('/api/appointments/sent')
      ]);

      if (receivedRes.ok || sentRes.ok) {
        const received = receivedRes.ok ? await receivedRes.json() : [];
        const sent = sentRes.ok ? await sentRes.json() : [];
        const allMeetings = [...received, ...sent];

        const meeting = allMeetings.find((m: any) => m.id === eventId);
        if (meeting) {
          setMeetingDetails(meeting);
        }
      }
    } catch (error) {
      console.error('Error fetching meeting details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeMeetingDetails = () => {
    setSelectedMeetingId(null);
    setMeetingDetails(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'accepted': return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
      case 'counter_proposed': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="flex h-full w-full">
      {/* Main Calendar Area */}
      <div className={cn(
        "flex flex-col flex-1 transition-all duration-300",
        selectedMeetingId ? "mr-96" : ""
      )}>
      {/* Calendar Header */}
      <div className="flex flex-col space-y-4 p-4 md:flex-row md:items-center md:justify-between md:space-y-0 lg:flex-none border-b bg-background">
        <div className="flex flex-auto">
          <div className="flex items-center gap-4">
            {/* Real-time Clock Display */}
            <div className="hidden w-24 flex-col items-center justify-center rounded-lg border bg-muted p-2 md:flex">
              <div className="text-xs uppercase text-muted-foreground">
                {format(currentTime, "MMM d")}
              </div>
              <div className="text-lg font-bold text-foreground">
                {format(currentTime, "h:mm")}
              </div>
              <div className="text-xs text-muted-foreground">
                {format(currentTime, "a")}
              </div>
            </div>
            <div className="hidden w-20 flex-col items-center justify-center rounded-lg border bg-muted p-0.5 md:flex">
              <h1 className="p-1 text-xs uppercase text-muted-foreground">
                {format(today, "MMM")}
              </h1>
              <div className="flex w-full items-center justify-center rounded-lg border bg-background p-0.5 text-lg font-bold">
                <span>{format(today, "d")}</span>
              </div>
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-foreground">
                {viewInfo.title}
              </h2>
              <p className="text-sm text-muted-foreground">
                {viewInfo.subtitle}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
          {/* View Filter Dropdown */}
          <Select value={viewFilter} onValueChange={setViewFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="hidden h-6 lg:block" />

          <div className="inline-flex w-full -space-x-px rounded-lg shadow-sm shadow-black/5 md:w-auto rtl:space-x-reverse">
            <Button
              onClick={previousMonth}
              className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
              variant="outline"
              size="icon"
              aria-label="Navigate to previous month"
            >
              <ChevronLeftIcon size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
            <Button
              onClick={goToToday}
              className="w-full rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 md:w-auto"
              variant="outline"
            >
              Today
            </Button>
            <Button
              onClick={nextMonth}
              className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
              variant="outline"
              size="icon"
              aria-label="Navigate to next month"
            >
              <ChevronRightIcon size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
          </div>

          <Separator orientation="vertical" className="hidden h-6 md:block" />
          <Separator
            orientation="horizontal"
            className="block w-full md:hidden"
          />

          <Button
            className="w-full gap-2 md:w-auto bg-orange-600 hover:bg-orange-700"
            onClick={() => setIsEventDialogOpen(true)}
          >
            <PlusCircleIcon size={16} strokeWidth={2} aria-hidden="true" />
            <span>New Event</span>
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {viewFilter === "today" ? (
          // Today View - Show current day with time slots
          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="relative">
                {/* Time slots grid */}
                <div className="grid grid-cols-[80px_1fr] gap-0">
                  {/* Generate 24 hour time slots */}
                  {Array.from({ length: 24 }, (_, hour) => {
                    const timeSlot = `${hour.toString().padStart(2, "0")}:00`;
                    const displayTime = format(
                      new Date().setHours(hour, 0, 0, 0),
                      "h a"
                    );

                    // Find events for this hour
                    const hourEvents = getFilteredEvents.flatMap((eventData) =>
                      eventData.events.filter((event) => {
                        const eventHour = new Date(event.datetime).getHours();
                        return eventHour === hour;
                      })
                    );

                    return (
                      <React.Fragment key={hour}>
                        {/* Time label */}
                        <div className="flex items-start justify-end pr-4 py-4 text-sm text-muted-foreground border-r border-gray-200">
                          {hour === 0
                            ? "12 AM"
                            : hour === 12
                            ? "12 PM"
                            : hour > 12
                            ? `${hour - 12} PM`
                            : `${hour} AM`}
                        </div>

                        {/* Time slot content */}
                        <div className="relative border-b border-gray-100 min-h-[60px] py-2 px-4">
                          {/* Current time indicator */}
                          {isToday(new Date()) &&
                            new Date().getHours() === hour && (
                              <div
                                className="absolute left-0 right-0 h-px bg-orange-500 z-[100] shadow-xl pointer-events-none border-t-2 border-orange-500"
                                style={{
                                  top: `${
                                    (new Date().getMinutes() / 60) * 56 + 8
                                  }px`,
                                  marginLeft: "-88px",
                                  width: "calc(100% + 88px)",
                                }}
                              >
                                {/* Orange dot at the start */}
                                <div className="absolute -left-2 -top-0.5 w-3 h-3 bg-orange-500 rounded-full border-2 border-white shadow-lg"></div>
                                {/* Current time label */}
                                <div className="absolute -left-20 -top-4 text-xs font-bold text-orange-600 bg-white px-2 py-1 rounded shadow-lg border whitespace-nowrap">
                                  {format(currentTime, "h:mm a")}
                                </div>
                              </div>
                            )}

                          {/* Events for this hour */}
                          {hourEvents.map((event) => (
                            <div
                              key={event.id}
                              onClick={() => handleEventClick(event.id)}
                              className="mb-1 p-2 bg-orange-100 border-l-4 border-orange-500 rounded-r text-sm cursor-pointer hover:bg-orange-200 hover:shadow-md transition-all"
                            >
                              <div className="font-medium text-orange-900">
                                {event.name}
                              </div>
                              <div className="text-xs text-orange-700">
                                {event.time}
                              </div>
                            </div>
                          ))}
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : viewFilter === "week" ? (
          // Week View - Vertical timeline for each day
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Week header */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-px border-b bg-muted text-center text-xs font-medium leading-6 text-muted-foreground flex-shrink-0">
              <div className="bg-background py-2"></div>
              {currentWeekDays.map((day) => (
                <div key={day.toString()} className="bg-background py-2">
                  <div className={cn(
                    "font-semibold",
                    isToday(day) && "text-orange-600"
                  )}>
                    {format(day, "EEE")}
                  </div>
                  <div className={cn(
                    "text-lg",
                    isToday(day) && "text-orange-600 font-bold"
                  )}>
                    {format(day, "d")}
                  </div>
                </div>
              ))}
            </div>

            {/* Timeline grid */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-px bg-muted">
                {/* Generate time slots (business hours: 8 AM - 8 PM) */}
                {Array.from({ length: 13 }, (_, index) => {
                  const hour = index + 8; // Start at 8 AM

                  return (
                    <React.Fragment key={hour}>
                      {/* Time label */}
                      <div className="bg-background flex items-start justify-end pr-2 py-1 text-xs text-muted-foreground border-r">
                        {hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                      </div>

                      {/* Day columns */}
                      {currentWeekDays.map((day) => {
                        // Find events for this hour on this day
                        const dayEvents = getFilteredEvents
                          .filter((event) => isSameDay(event.day, day))
                          .flatMap((eventData) =>
                            eventData.events.filter((event) => {
                              if (event.time === 'Time TBD') return hour === 8; // Show TBD at first slot
                              const eventHour = new Date(event.datetime).getHours();
                              return eventHour === hour;
                            })
                          );

                        return (
                          <div
                            key={`${day.toString()}-${hour}`}
                            className={cn(
                              "bg-background relative border-b border-gray-100 min-h-[40px] p-1",
                              isToday(day) && "bg-orange-50/30"
                            )}
                          >
                            {/* Current time indicator */}
                            {isToday(day) && new Date().getHours() === hour && (
                              <div
                                className="absolute left-0 right-0 h-0.5 bg-orange-500 z-10"
                                style={{
                                  top: `${(new Date().getMinutes() / 60) * 40}px`,
                                }}
                              >
                                <div className="absolute -left-1 -top-1 w-2 h-2 bg-orange-500 rounded-full"></div>
                              </div>
                            )}

                            {/* Events */}
                            {dayEvents.map((event) => (
                              <div
                                key={event.id}
                                onClick={() => handleEventClick(event.id)}
                                className="mb-0.5 p-1 bg-orange-100 border-l-2 border-orange-500 rounded-r text-xs cursor-pointer hover:bg-orange-200 hover:shadow-sm transition-all"
                              >
                                <div className="font-medium text-orange-900 truncate">
                                  {event.name}
                                </div>
                                <div className="text-[10px] text-orange-700">
                                  {event.time}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          // Month View - Show full month grid (default)
          <div className="flex flex-1 flex-col h-full">
            <div className="grid grid-cols-7 gap-px border-b bg-muted text-center text-xs font-medium leading-6 text-muted-foreground flex-shrink-0">
              <div className="bg-background py-2">S</div>
              <div className="bg-background py-2">M</div>
              <div className="bg-background py-2">T</div>
              <div className="bg-background py-2">W</div>
              <div className="bg-background py-2">T</div>
              <div className="bg-background py-2">F</div>
              <div className="bg-background py-2">S</div>
            </div>
            <div className="flex flex-1 bg-muted">
              <div
                className="grid flex-1 grid-cols-7 gap-px h-full"
                style={{ gridTemplateRows: "repeat(6, 1fr)" }}
              >
                {days.map((day, dayIdx) => (
                  <div
                    key={day.toString()}
                    className={cn(
                      dayIdx === 0 && colStartClasses[getDay(day)],
                      "group relative bg-background px-3 py-2 focus-within:z-10 flex flex-col min-h-0"
                    )}
                  >
                    <time
                      dateTime={format(day, "yyyy-MM-dd")}
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-sm flex-shrink-0",
                        isEqual(day, selectedDay) &&
                          "bg-primary text-primary-foreground",
                        !isEqual(day, selectedDay) &&
                          isToday(day) &&
                          "text-primary",
                        !isEqual(day, selectedDay) &&
                          !isToday(day) &&
                          isSameMonth(day, firstDayCurrentMonth) &&
                          "text-foreground",
                        !isEqual(day, selectedDay) &&
                          !isToday(day) &&
                          !isSameMonth(day, firstDayCurrentMonth) &&
                          "text-muted-foreground"
                      )}
                    >
                      {format(day, "d")}
                    </time>
                    <div className="flex-1 mt-2 overflow-hidden">
                      {getFilteredEvents
                        ?.filter((event) => isSameDay(event.day, day))
                        .map((eventData) =>
                          eventData.events.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              onClick={() => handleEventClick(event.id)}
                              className="text-xs p-1 mb-1 bg-orange-100 border-l-2 border-orange-500 rounded-r text-orange-900 truncate cursor-pointer hover:bg-orange-200 hover:shadow-sm transition-all"
                            >
                              {event.name}
                            </div>
                          ))
                        )}
                      {getFilteredEvents?.some((event) =>
                        isSameDay(event.day, day)
                      ) &&
                        getFilteredEvents.filter((event) =>
                          isSameDay(event.day, day)
                        )[0]?.events.length === 0 && (
                          <div className="mx-auto mt-1 h-1 w-1 rounded-full bg-primary"></div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Event Creation Dialog */}
      <EventCreationDialog
        isOpen={isEventDialogOpen}
        onClose={() => setIsEventDialogOpen(false)}
        onSubmit={handleCreateEvent}
      />
      </div>

      {/* Meeting Details Side Panel */}
      {selectedMeetingId && (
        <div className="fixed right-0 top-0 bottom-0 w-96 bg-white border-l shadow-2xl z-50 overflow-y-auto">
          <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
            <h2 className="text-lg font-semibold">Meeting Details</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeMeetingDetails}
              className="hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {loadingDetails ? (
            <div className="p-8 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          ) : meetingDetails ? (
            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <span className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium border",
                  getStatusColor(meetingDetails.status)
                )}>
                  {meetingDetails.status.replace('_', ' ').charAt(0).toUpperCase() +
                   meetingDetails.status.replace('_', ' ').slice(1)}
                </span>
                <span className="text-xs text-gray-500">
                  {meetingDetails.requestType}
                </span>
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <User className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500">Contact</div>
                    <div className="font-medium">
                      {meetingDetails.requesterName || meetingDetails.profileName}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500">Email</div>
                    <div className="text-sm break-all">
                      {meetingDetails.requesterEmail || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Meeting Times */}
              {meetingDetails.preferredTime && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-blue-600 mb-1">Preferred Time</div>
                      <div className="text-sm text-gray-900">{formatDate(meetingDetails.preferredTime)}</div>
                    </div>
                  </div>
                </div>
              )}

              {meetingDetails.proposedTime && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-start gap-3">
                    <ArrowRight className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-purple-600 mb-1">Counter Proposal</div>
                      <div className="text-sm text-gray-900">{formatDate(meetingDetails.proposedTime)}</div>
                    </div>
                  </div>
                </div>
              )}

              {!meetingDetails.preferredTime && !meetingDetails.proposedTime && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-gray-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-600 mb-1">Meeting Time</div>
                      <div className="text-sm text-gray-900">Time To Be Determined</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Message */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                  <MessageSquare className="h-4 w-4" />
                  <span>Message</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{meetingDetails.message}</p>
                </div>
              </div>

              {/* Counter Message */}
              {meetingDetails.counterMessage && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-purple-700">
                    <ArrowRight className="h-4 w-4" />
                    <span>Counter Proposal Message</span>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{meetingDetails.counterMessage}</p>
                  </div>
                </div>
              )}

              {/* Response Message */}
              {meetingDetails.responseMessage && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                    <MessageSquare className="h-4 w-4" />
                    <span>Response</span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{meetingDetails.responseMessage}</p>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="pt-4 border-t space-y-2 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  <span>Created: {formatDate(meetingDetails.createdAt)}</span>
                </div>
                {meetingDetails.updatedAt && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>Updated: {formatDate(meetingDetails.updatedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p>Meeting details not found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
