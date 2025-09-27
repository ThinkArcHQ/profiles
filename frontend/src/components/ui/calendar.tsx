"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface CalendarProps {
  className?: string;
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  events?: Array<{
    id: string;
    date: string;
    type: string;
    title: string;
    time: string;
  }>;
}

function Calendar({ className, selected, onSelect, events = [] }: CalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  
  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const endDate = new Date(lastDay);
  endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
  
  const days = [];
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    days.push(new Date(date));
  }
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateStr);
  };
  
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };
  
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === month;
  };
  
  const isSelected = (date: Date) => {
    return selected && date.toDateString() === selected.toDateString();
  };
  
  return (
    <div className={cn("p-3", className)}>
      {/* Header */}
      <div className="flex justify-center pt-1 relative items-center mb-4">
        <button
          onClick={prevMonth}
          className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-sm font-medium">
          {monthNames[month]} {year}
        </div>
        <button
          onClick={nextMonth}
          className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      
      {/* Week days */}
      <div className="grid grid-cols-7 gap-0 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-muted-foreground rounded-md w-12 font-normal text-[0.8rem] py-2">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-0">
        {days.map((date, index) => {
          const dayEvents = getEventsForDate(date);
          return (
            <button
              key={index}
              onClick={() => onSelect?.(date)}
              className={cn(
                "h-12 w-12 p-1 text-sm relative hover:bg-orange-100 focus:bg-orange-100 rounded-md flex flex-col items-center justify-center",
                {
                  "text-muted-foreground opacity-50": !isCurrentMonth(date),
                  "bg-orange-500 text-white hover:bg-orange-600": isSelected(date),
                  "bg-orange-100 text-orange-900 font-semibold": isToday(date) && !isSelected(date),
                  "bg-orange-50 text-orange-800": dayEvents.length > 0 && !isSelected(date) && !isToday(date)
                }
              )}
            >
              <span className="text-center mb-1">
                {date.getDate()}
              </span>
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5 justify-center">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        event.type === 'meeting' ? 'bg-blue-500' : 'bg-green-500',
                        isSelected(date) && 'bg-white'
                      )}
                      title={`${event.time} - ${event.title}`}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <div 
                      className={cn(
                        "w-1.5 h-1.5 rounded-full bg-orange-500",
                        isSelected(date) && 'bg-white'
                      )}
                      title={`+${dayEvents.length - 3} more events`} 
                    />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

Calendar.displayName = "Calendar"

export { Calendar }